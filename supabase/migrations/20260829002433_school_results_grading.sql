-- Secure School result history and theory grading. Pupil-facing result fields
-- are returned only when the assessment owner has enabled result visibility.

begin;

create or replace function public.get_my_school_assessment_overview()
returns table (
  assessment_id uuid,
  title text,
  subject text,
  class_id uuid,
  class_name text,
  assignment_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  assessment_type text,
  duration_minutes integer,
  difficulty text,
  question_type text,
  question_count integer,
  show_results boolean,
  created_at timestamptz,
  can_attempt boolean,
  submitted_at timestamptz,
  theory_status text,
  result_available boolean,
  result_score numeric,
  result_total integer,
  result_percentage numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  return query
  with pupil_assessments as (
    select
      sa.id as assessment_id,
      sa.title,
      sa.subject,
      sc.id as class_id,
      sc.name as class_name,
      saa.id as assignment_id,
      coalesce(saa.starts_at, sa.starts_at) as starts_at,
      coalesce(saa.ends_at, sa.ends_at) as ends_at,
      sa.assessment_type,
      sa.duration_minutes,
      sa.difficulty,
      sa.question_type,
      sa.question_count,
      sa.show_results,
      sa.created_at,
      (
        ss.id is null
        and sc.status = 'active'
        and saa.status in ('scheduled', 'live')
        and sa.status in ('Published', 'Live')
        and (sa.starts_at is null or sa.starts_at <= now())
        and (sa.ends_at is null or sa.ends_at > now())
        and (
          saa.status = 'live'
          or (
            coalesce(saa.starts_at, sa.starts_at) is not null
            and coalesce(saa.starts_at, sa.starts_at) <= now()
          )
        )
        and (
          coalesce(saa.ends_at, sa.ends_at) is null
          or coalesce(saa.ends_at, sa.ends_at) > now()
        )
      ) as can_attempt,
      ss.submitted_at,
      case when sa.show_results = true then ss.theory_status else null end as theory_status,
      (
        ss.id is not null
        and sa.show_results = true
        and ss.theory_status <> 'pending'
      ) as result_available,
      case
        when sa.show_results = true and ss.theory_status <> 'pending'
          then coalesce(ss.final_score, ss.score)
        else null
      end as result_score,
      case
        when sa.show_results = true and ss.theory_status <> 'pending'
          then sa.question_count
        else null
      end as result_total,
      case
        when sa.show_results = true and ss.theory_status <> 'pending'
          then coalesce(ss.final_percentage, ss.percentage)
        else null
      end as result_percentage
    from public.school_memberships sm
    join public.school_class_enrollments sce
      on sce.school_membership_id = sm.id
     and sce.school_id = sm.school_id
     and sce.status = 'active'
    join public.school_classes sc
      on sc.id = sce.class_id
     and sc.school_id = sce.school_id
    join public.school_assessment_assignments saa
      on saa.class_id = sc.id
     and saa.school_id = sc.school_id
    join public.school_assessments sa
      on sa.id = saa.assessment_id
     and sa.school_id = saa.school_id
    left join public.school_submissions ss
      on ss.assessment_id = sa.id
     and ss.assessment_assignment_id = saa.id
     and ss.school_membership_id = sm.id
     and ss.user_id = v_user_id
    where sm.user_id = v_user_id
      and sm.role = 'student'
      and sm.status = 'active'
      and (
        ss.id is not null
        or (
          sc.status = 'active'
          and saa.status in ('scheduled', 'live')
          and sa.status in ('Published', 'Live')
          and (sa.starts_at is null or sa.starts_at <= now())
          and (sa.ends_at is null or sa.ends_at > now())
          and (
            saa.status = 'live'
            or (
              coalesce(saa.starts_at, sa.starts_at) is not null
              and coalesce(saa.starts_at, sa.starts_at) <= now()
            )
          )
          and (
            coalesce(saa.ends_at, sa.ends_at) is null
            or coalesce(saa.ends_at, sa.ends_at) > now()
          )
        )
      )
  )
  select distinct on (pa.assessment_id)
    pa.assessment_id,
    pa.title,
    pa.subject,
    pa.class_id,
    pa.class_name,
    pa.assignment_id,
    pa.starts_at,
    pa.ends_at,
    pa.assessment_type,
    pa.duration_minutes,
    pa.difficulty,
    pa.question_type,
    pa.question_count,
    pa.show_results,
    pa.created_at,
    pa.can_attempt,
    pa.submitted_at,
    pa.theory_status,
    pa.result_available,
    pa.result_score,
    pa.result_total,
    pa.result_percentage
  from pupil_assessments pa
  order by pa.assessment_id, pa.submitted_at desc nulls last, pa.starts_at desc nulls last;
end;
$$;

revoke all on function public.get_my_school_assessment_overview() from public, anon, authenticated;
grant execute on function public.get_my_school_assessment_overview() to authenticated;

create or replace function public.grade_school_theory_submission(
  p_submission_id uuid,
  p_theory_marks jsonb
)
returns table (
  final_score numeric,
  final_percentage numeric,
  theory_score numeric,
  theory_status text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_school_id uuid;
  v_assessment_id uuid;
  v_mcq_score numeric;
  v_total integer;
  v_theory_count integer;
  v_theory_score numeric := 0;
  v_final_score numeric := 0;
  v_final_percentage numeric := 0;
  v_clean_marks jsonb := '{}'::jsonb;
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_submission_id is null then
    raise exception using errcode = '22023', message = 'Submission is required';
  end if;
  if coalesce(jsonb_typeof(p_theory_marks), 'null') <> 'object' then
    raise exception using errcode = '22023', message = 'Theory marks must be a JSON object';
  end if;
  if pg_column_size(p_theory_marks) > 32768 then
    raise exception using errcode = '22023', message = 'Theory marks payload is too large';
  end if;

  select ss.school_id, ss.assessment_id, coalesce(ss.score, 0)
  into v_school_id, v_assessment_id, v_mcq_score
  from public.school_submissions ss
  where ss.id = p_submission_id
  for update;

  if v_school_id is null then
    raise exception using errcode = 'P0002', message = 'Submission was not found';
  end if;
  if not (select school_private.has_school_role(v_school_id, array['owner', 'admin', 'teacher'])) then
    raise exception using errcode = '42501', message = 'You do not have permission to grade this submission';
  end if;

  select
    count(*)::integer,
    count(*) filter (where saq.type = 'Theory')::integer
  into v_total, v_theory_count
  from public.school_assessment_questions saq
  where saq.assessment_id = v_assessment_id
    and saq.school_id = v_school_id
    and saq.is_active = true;

  if v_total < 1 or v_theory_count < 1 then
    raise exception using errcode = '22023', message = 'This submission has no theory questions to grade';
  end if;

  if exists (
    select 1
    from jsonb_each(p_theory_marks) mark
    where mark.key !~ '^[0-9]+$'
       or jsonb_typeof(mark.value) <> 'number'
  ) then
    raise exception using errcode = '22023', message = 'Each theory mark must be a number keyed by question position';
  end if;

  if exists (
    select 1
    from jsonb_each(p_theory_marks) mark
    where (mark.value #>> '{}')::numeric < 0
       or (mark.value #>> '{}')::numeric > 1
  ) then
    raise exception using errcode = '22023', message = 'Each theory question is marked from 0 to 1';
  end if;

  if exists (
    select 1
    from jsonb_each(p_theory_marks) mark
    where not exists (
      select 1
      from public.school_assessment_questions saq
      where saq.assessment_id = v_assessment_id
        and saq.school_id = v_school_id
        and saq.is_active = true
        and saq.type = 'Theory'
        and saq.order_index::text = mark.key
    )
  ) then
    raise exception using errcode = '22023', message = 'Theory marks include an unknown question';
  end if;

  select
    coalesce(
      jsonb_object_agg(
        saq.order_index::text,
        to_jsonb(coalesce((p_theory_marks ->> saq.order_index::text)::numeric, 0))
      ),
      '{}'::jsonb
    ),
    coalesce(sum(coalesce((p_theory_marks ->> saq.order_index::text)::numeric, 0)), 0)
  into v_clean_marks, v_theory_score
  from public.school_assessment_questions saq
  where saq.assessment_id = v_assessment_id
    and saq.school_id = v_school_id
    and saq.is_active = true
    and saq.type = 'Theory';

  v_final_score := v_mcq_score + v_theory_score;
  v_final_percentage := round((v_final_score / v_total::numeric) * 100, 2);

  update public.school_submissions ss
  set
    theory_marks = v_clean_marks,
    theory_status = 'graded',
    final_score = v_final_score,
    final_percentage = v_final_percentage
  where ss.id = p_submission_id;

  return query select
    v_final_score,
    v_final_percentage,
    v_theory_score,
    'graded'::text;
end;
$$;

revoke all on function public.grade_school_theory_submission(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.grade_school_theory_submission(uuid, jsonb) to authenticated;

commit;
