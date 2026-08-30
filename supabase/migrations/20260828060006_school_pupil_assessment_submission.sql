-- Connect School pupil assessment submissions without exposing answer keys or
-- hidden result columns to the browser. All authorization is derived from
-- auth.uid(), active School membership, and active class enrollment.

begin;

create or replace function school_private.student_can_view_submission(p_submission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.school_submissions ss
      join public.school_assessments sa
        on sa.id = ss.assessment_id
       and sa.school_id = ss.school_id
      where ss.id = p_submission_id
        and ss.user_id = (select auth.uid())
        and sa.show_results = true
    );
$$;

revoke all on function school_private.student_can_view_submission(uuid) from public, anon;
grant execute on function school_private.student_can_view_submission(uuid) to authenticated, service_role;

drop policy if exists school_submissions_select_self_or_staff on public.school_submissions;
create policy school_submissions_select_self_or_staff
on public.school_submissions for select to authenticated
using (
  (select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher']))
  or (select school_private.student_can_view_submission(id))
);

create or replace function public.get_my_school_submission_status()
returns table (
  assessment_id uuid,
  submitted_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select ss.assessment_id, ss.submitted_at
  from public.school_submissions ss
  where ss.user_id = (select auth.uid())
  order by ss.submitted_at desc;
$$;

revoke all on function public.get_my_school_submission_status() from public, anon, authenticated;
grant execute on function public.get_my_school_submission_status() to authenticated;

create or replace function public.submit_my_school_assessment(
  p_assessment_id uuid,
  p_answers jsonb,
  p_theory_answers jsonb default '{}'::jsonb
)
returns table (
  score integer,
  total integer,
  percentage integer,
  has_theory boolean,
  show_results boolean,
  correct_answers jsonb,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_membership_id uuid;
  v_school_id uuid;
  v_assignment_id uuid;
  v_class_id uuid;
  v_show_results boolean;
  v_score integer := 0;
  v_total integer := 0;
  v_percentage integer := 0;
  v_has_theory boolean := false;
  v_clean_answers jsonb := '{}'::jsonb;
  v_clean_theory_answers jsonb := '{}'::jsonb;
  v_correct_answers jsonb;
  v_submitted_at timestamptz;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_assessment_id is null then
    raise exception using errcode = '22023', message = 'Assessment is required';
  end if;
  if coalesce(jsonb_typeof(p_answers), 'null') <> 'object'
    or coalesce(jsonb_typeof(p_theory_answers), 'null') <> 'object' then
    raise exception using errcode = '22023', message = 'Answers must be JSON objects';
  end if;
  if pg_column_size(p_answers) > 131072 or pg_column_size(p_theory_answers) > 524288 then
    raise exception using errcode = '22023', message = 'Answer payload is too large';
  end if;

  select
    sm.id,
    sm.school_id,
    saa.id,
    saa.class_id,
    sa.show_results
  into
    v_membership_id,
    v_school_id,
    v_assignment_id,
    v_class_id,
    v_show_results
  from public.school_memberships sm
  join public.school_class_enrollments sce
    on sce.school_membership_id = sm.id
   and sce.school_id = sm.school_id
   and sce.status = 'active'
  join public.school_assessment_assignments saa
    on saa.class_id = sce.class_id
   and saa.school_id = sce.school_id
   and saa.assessment_id = p_assessment_id
   and saa.status in ('scheduled', 'live')
  join public.school_assessments sa
    on sa.id = saa.assessment_id
   and sa.school_id = saa.school_id
   and sa.status in ('Published', 'Live')
  where sm.user_id = v_user_id
    and sm.role = 'student'
    and sm.status = 'active'
    and (sa.starts_at is null or sa.starts_at <= now())
    and (sa.ends_at is null or sa.ends_at > now())
    and (
      saa.status = 'live'
      or (
        coalesce(saa.starts_at, sa.starts_at) is not null
        and coalesce(saa.starts_at, sa.starts_at) <= now()
      )
    )
    and (coalesce(saa.ends_at, sa.ends_at) is null or coalesce(saa.ends_at, sa.ends_at) > now())
  order by saa.created_at
  limit 1;

  if v_membership_id is null then
    raise exception using errcode = '42501', message = 'This assessment is not available to this pupil';
  end if;

  if exists (
    select 1
    from public.school_submissions ss
    where ss.assessment_id = p_assessment_id
      and ss.school_membership_id = v_membership_id
  ) then
    raise exception using errcode = '23505', message = 'This assessment has already been submitted';
  end if;

  select
    count(*)::integer,
    coalesce(bool_or(saq.type = 'Theory' or saq.correct_answer is null), false),
    coalesce(sum(
      case
        when saq.type <> 'Theory'
          and saq.correct_answer is not null
          and coalesce(p_answers ->> saq.order_index::text, '') ~ '^[0-9]+$'
          and (p_answers ->> saq.order_index::text)::integer = saq.correct_answer
        then 1
        else 0
      end
    ), 0)::integer
  into v_total, v_has_theory, v_score
  from public.school_assessment_questions saq
  where saq.assessment_id = p_assessment_id
    and saq.school_id = v_school_id
    and saq.is_active = true;

  if v_total < 1 then
    raise exception using errcode = '22023', message = 'This assessment has no active questions';
  end if;

  select coalesce(jsonb_object_agg(answer_row.order_index::text, to_jsonb(answer_row.answer_value)), '{}'::jsonb)
  into v_clean_answers
  from (
    select
      saq.order_index,
      (p_answers ->> saq.order_index::text)::integer as answer_value
    from public.school_assessment_questions saq
    where saq.assessment_id = p_assessment_id
      and saq.school_id = v_school_id
      and saq.is_active = true
      and saq.type <> 'Theory'
      and coalesce(p_answers ->> saq.order_index::text, '') ~ '^[0-9]+$'
      and (p_answers ->> saq.order_index::text)::integer between 0 and 99
  ) answer_row;

  select coalesce(jsonb_object_agg(theory_row.order_index::text, theory_row.answer_text), '{}'::jsonb)
  into v_clean_theory_answers
  from (
    select
      saq.order_index,
      left(p_theory_answers ->> saq.order_index::text, 10000) as answer_text
    from public.school_assessment_questions saq
    where saq.assessment_id = p_assessment_id
      and saq.school_id = v_school_id
      and saq.is_active = true
      and saq.type = 'Theory'
      and nullif(btrim(p_theory_answers ->> saq.order_index::text), '') is not null
  ) theory_row;

  v_percentage := round((v_score::numeric / v_total::numeric) * 100)::integer;

  insert into public.school_submissions (
    school_id,
    assessment_id,
    assessment_assignment_id,
    school_membership_id,
    class_id,
    user_id,
    answers,
    theory_answers,
    score,
    percentage,
    theory_status,
    theory_marks,
    final_score,
    final_percentage
  ) values (
    v_school_id,
    p_assessment_id,
    v_assignment_id,
    v_membership_id,
    v_class_id,
    v_user_id,
    v_clean_answers,
    v_clean_theory_answers,
    v_score,
    v_percentage,
    case when v_has_theory then 'pending' else 'not_required' end,
    '{}'::jsonb,
    v_score,
    v_percentage
  )
  returning school_submissions.submitted_at into v_submitted_at;

  if v_show_results and not v_has_theory then
    select coalesce(jsonb_object_agg(saq.order_index::text, to_jsonb(saq.correct_answer)), '{}'::jsonb)
    into v_correct_answers
    from public.school_assessment_questions saq
    where saq.assessment_id = p_assessment_id
      and saq.school_id = v_school_id
      and saq.is_active = true
      and saq.type <> 'Theory'
      and saq.correct_answer is not null;
  end if;

  return query select
    case when v_show_results and not v_has_theory then v_score else 0 end,
    v_total,
    case when v_show_results and not v_has_theory then v_percentage else 0 end,
    v_has_theory,
    v_show_results,
    v_correct_answers,
    v_submitted_at;
end;
$$;

revoke all on function public.submit_my_school_assessment(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.submit_my_school_assessment(uuid, jsonb, jsonb) to authenticated;

commit;
