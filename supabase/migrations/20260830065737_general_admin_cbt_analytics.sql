begin;

-- A single, server-computed analytics payload keeps learner activity and
-- cross-school content private. Only the service role can execute it, and it
-- still verifies the requesting user's general-admin profile before reading
-- RLS-protected or auth-owned data.
create or replace function public.get_general_admin_cbt_analytics(
  p_requesting_user_id uuid,
  p_days integer default 30,
  p_timezone text default 'Africa/Lagos'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := p_requesting_user_id;
  v_today date;
  v_today_start timestamptz;
  v_tomorrow_start timestamptz;
  v_period_start timestamptz;
  v_previous_start timestamptz;
  v_result jsonb;
begin
  if v_user_id is null or not exists (
    select 1
    from public.admin_profiles ap
    where ap.id = v_user_id
      and ap.is_general_admin = true
  ) then
    raise exception using
      errcode = '42501',
      message = 'General administrator access is required';
  end if;

  if p_days < 7 or p_days > 90 then
    raise exception using
      errcode = '22023',
      message = 'Analytics range must be between 7 and 90 days';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_timezone_names tz
    where tz.name = p_timezone
  ) then
    raise exception using
      errcode = '22023',
      message = 'Unknown analytics timezone';
  end if;

  v_today := (now() at time zone p_timezone)::date;
  v_today_start := v_today::timestamp at time zone p_timezone;
  v_tomorrow_start := (v_today + 1)::timestamp at time zone p_timezone;
  v_period_start := (v_today - (p_days - 1))::timestamp at time zone p_timezone;
  v_previous_start := (v_today - ((p_days * 2) - 1))::timestamp at time zone p_timezone;

  with
  learner_ids as (
    select sp.id as user_id
    from public.student_profiles sp
    union
    select sm.user_id
    from public.school_memberships sm
    where sm.role = 'student'
  ),
  learners as (
    select au.id, au.created_at, au.last_sign_in_at
    from auth.users au
    join learner_ids li on li.user_id = au.id
  ),
  attempt_events as (
    select
      s.submitted_at as occurred_at,
      s.student_id as user_id,
      true as completed,
      coalesce(s.final_percentage, s.percentage)::numeric as score,
      case when e.is_general then 'Open CBT exams' else 'Creator CBT exams' end as mode
    from public.submissions s
    join public.exams e on e.id = s.exam_id

    union all

    select
      ss.submitted_at,
      ss.user_id,
      true,
      coalesce(ss.final_percentage, ss.percentage)::numeric,
      'School assessments'
    from public.school_submissions ss

    union all

    select
      ms.started_at,
      ms.user_id,
      ms.status = 'completed',
      case
        when cardinality(ms.subjects) > 0
          then ms.total_score::numeric / cardinality(ms.subjects)::numeric
        else null::numeric
      end,
      'JAMB mock'
    from public.mock_exam_sessions ms

    union all

    select
      ps.started_at,
      ps.user_id,
      ps.status = 'completed',
      case
        when ps.total_questions > 0
          then (ps.score::numeric / ps.total_questions::numeric) * 100
        else null::numeric
      end,
      'Practice'
    from public.practice_sessions ps

    union all

    select
      pqs.started_at,
      pqs.user_id,
      pqs.status = 'completed',
      case
        when pqs.total_questions > 0
          then (pqs.score::numeric / pqs.total_questions::numeric) * 100
        else null::numeric
      end,
      'Past questions'
    from public.past_question_sessions pqs

    union all

    select
      svs.started_at,
      svs.user_id,
      svs.ended_at is not null or svs.status = 'completed',
      null::numeric,
      'Survival mode'
    from public.survival_sessions svs
  ),
  question_source_rows as (
    select
      q.id::text as question_id,
      'General question bank'::text as source,
      coalesce(q.subject, 'Unspecified')::text as subject,
      null::timestamptz as occurred_at,
      false as user_created
    from public.questions q
    where q.exam_id is null

    union all

    select
      q.id::text,
      'General public exams',
      coalesce(q.subject, e.subject, 'Unspecified'),
      e.created_at,
      false
    from public.questions q
    join public.exams e on e.id = q.exam_id
    where e.is_general = true

    union all

    select
      q.id::text,
      'Legacy creator exams',
      coalesce(q.subject, e.subject, 'Unspecified'),
      e.created_at,
      true
    from public.questions q
    join public.exams e on e.id = q.exam_id
    where e.is_general = false

    union all

    select
      saq.id::text,
      'School workspace',
      coalesce(sa.subject, 'Unspecified'),
      saq.created_at,
      true
    from public.school_assessment_questions saq
    join public.school_assessments sa on sa.id = saq.assessment_id
  ),
  user_exam_rows as (
    select
      e.id::text as content_id,
      e.title,
      coalesce(e.subject, 'Unspecified')::text as subject,
      e.status,
      e.created_at,
      coalesce(count(q.id), 0)::integer as question_count,
      coalesce(ap.username, e.school_code, 'Creator')::text as creator,
      'Legacy creator exam'::text as source
    from public.exams e
    left join public.questions q on q.exam_id = e.id
    left join public.admin_profiles ap
      on ap.school_code = e.school_code
     and ap.is_general_admin = false
    where e.is_general = false
    group by e.id, e.title, e.subject, e.status, e.created_at, ap.username, e.school_code

    union all

    select
      sa.id::text,
      sa.title,
      coalesce(sa.subject, 'Unspecified'),
      sa.status,
      sa.created_at,
      coalesce(count(saq.id), 0)::integer,
      coalesce(s.name, 'School workspace'),
      'School assessment'
    from public.school_assessments sa
    join public.schools s on s.id = sa.school_id
    left join public.school_assessment_questions saq on saq.assessment_id = sa.id
    group by sa.id, sa.title, sa.subject, sa.status, sa.created_at, s.name
  ),
  days as (
    select generated.day::date
    from generate_series(
      v_today - (p_days - 1),
      v_today,
      interval '1 day'
    ) as generated(day)
  ),
  growth_rows as (
    select
      d.day,
      (
        select count(*)::integer
        from learners l
        where (l.created_at at time zone p_timezone)::date = d.day
      ) as new_users,
      (
        select count(*)::integer
        from attempt_events ae
        where (ae.occurred_at at time zone p_timezone)::date = d.day
      ) as attempts,
      (
        select count(distinct ae.user_id)::integer
        from attempt_events ae
        where ae.user_id is not null
          and (ae.occurred_at at time zone p_timezone)::date = d.day
      ) as active_users
    from days d
  ),
  current_new_users as (
    select count(*)::integer as value
    from learners l
    where l.created_at >= v_period_start
      and l.created_at < v_tomorrow_start
  ),
  previous_new_users as (
    select count(*)::integer as value
    from learners l
    where l.created_at >= v_previous_start
      and l.created_at < v_period_start
  )
  select jsonb_build_object(
    'generatedAt', now(),
    'timezone', p_timezone,
    'periodDays', p_days,
    'metrics', jsonb_build_object(
      'totalLearners', (select count(*)::integer from learners),
      'newUsersToday', (
        select count(*)::integer
        from learners l
        where l.created_at >= v_today_start
          and l.created_at < v_tomorrow_start
      ),
      'returningUsersToday', (
        select count(*)::integer
        from learners l
        where l.created_at < v_today_start
          and l.last_sign_in_at >= v_today_start
          and l.last_sign_in_at < v_tomorrow_start
      ),
      'activeUsersToday', (
        select count(*)::integer
        from (
          select l.id as user_id
          from learners l
          where l.last_sign_in_at >= v_today_start
            and l.last_sign_in_at < v_tomorrow_start
          union
          select ae.user_id
          from attempt_events ae
          join learner_ids li on li.user_id = ae.user_id
          where ae.occurred_at >= v_today_start
            and ae.occurred_at < v_tomorrow_start
        ) active_today
      ),
      'newUsersPeriod', (select value from current_new_users),
      'newUsersGrowthPct', (
        select case
          when pnu.value = 0 then null
          else round(((cnu.value - pnu.value)::numeric / pnu.value::numeric) * 100, 1)
        end
        from current_new_users cnu
        cross join previous_new_users pnu
      ),
      'activeUsersPeriod', (
        select count(*)::integer
        from (
          select l.id as user_id
          from learners l
          where l.last_sign_in_at >= v_period_start
            and l.last_sign_in_at < v_tomorrow_start
          union
          select ae.user_id
          from attempt_events ae
          join learner_ids li on li.user_id = ae.user_id
          where ae.occurred_at >= v_period_start
            and ae.occurred_at < v_tomorrow_start
        ) active_period
      ),
      'userQuestionsTotal', (
        select count(*)::integer
        from question_source_rows qsr
        where qsr.user_created = true
      ),
      'userQuestionsToday', (
        select count(*)::integer
        from question_source_rows qsr
        where qsr.user_created = true
          and qsr.occurred_at >= v_today_start
          and qsr.occurred_at < v_tomorrow_start
      ),
      'generalQuestionsTotal', (
        select count(*)::integer
        from question_source_rows qsr
        where qsr.user_created = false
      ),
      'userExamsTotal', (select count(*)::integer from user_exam_rows),
      'userExamsToday', (
        select count(*)::integer
        from user_exam_rows uer
        where uer.created_at >= v_today_start
          and uer.created_at < v_tomorrow_start
      ),
      'publishedUserExams', (
        select count(*)::integer
        from user_exam_rows uer
        where uer.status in ('Published', 'Live')
      ),
      'activeSchools', (
        select count(*)::integer
        from public.schools s
        where s.status = 'active'
      ),
      'attemptsToday', (
        select count(*)::integer
        from attempt_events ae
        where ae.occurred_at >= v_today_start
          and ae.occurred_at < v_tomorrow_start
      ),
      'attemptsPeriod', (
        select count(*)::integer
        from attempt_events ae
        where ae.occurred_at >= v_period_start
          and ae.occurred_at < v_tomorrow_start
      ),
      'completionRatePeriod', (
        select coalesce(
          round(
            100.0 * count(*) filter (where ae.completed)
            / nullif(count(*), 0),
            1
          ),
          0
        )
        from attempt_events ae
        where ae.occurred_at >= v_period_start
          and ae.occurred_at < v_tomorrow_start
      ),
      'averageScorePeriod', (
        select round(avg(ae.score), 1)
        from attempt_events ae
        where ae.occurred_at >= v_period_start
          and ae.occurred_at < v_tomorrow_start
          and ae.score between 0 and 100
      )
    ),
    'accountMix', jsonb_build_array(
      jsonb_build_object(
        'label', 'Individual learners',
        'value', (
          select count(*)::integer
          from public.student_profiles sp
          where not exists (
            select 1
            from public.school_memberships sm
            where sm.user_id = sp.id
              and sm.role = 'student'
          )
        )
      ),
      jsonb_build_object(
        'label', 'School pupils',
        'value', (
          select count(distinct sm.user_id)::integer
          from public.school_memberships sm
          where sm.role = 'student'
        )
      )
    ),
    'growthTrend', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'date', to_char(gr.day, 'YYYY-MM-DD'),
            'newUsers', gr.new_users,
            'attempts', gr.attempts,
            'activeUsers', gr.active_users
          )
          order by gr.day
        ),
        '[]'::jsonb
      )
      from growth_rows gr
    ),
    'questionSources', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('label', sources.source, 'value', sources.value)
          order by sources.value desc, sources.source
        ),
        '[]'::jsonb
      )
      from (
        select qsr.source, count(*)::integer as value
        from question_source_rows qsr
        group by qsr.source
      ) sources
    ),
    'activityByMode', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('label', modes.mode, 'value', modes.value)
          order by modes.value desc, modes.mode
        ),
        '[]'::jsonb
      )
      from (
        select ae.mode, count(*)::integer as value
        from attempt_events ae
        where ae.occurred_at >= v_period_start
          and ae.occurred_at < v_tomorrow_start
        group by ae.mode
      ) modes
    ),
    'topSubjects', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('label', subjects.subject, 'value', subjects.value)
          order by subjects.value desc, subjects.subject
        ),
        '[]'::jsonb
      )
      from (
        select qsr.subject, count(*)::integer as value
        from question_source_rows qsr
        where qsr.user_created = true
        group by qsr.subject
        order by value desc, qsr.subject
        limit 6
      ) subjects
    ),
    'recentContent', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', recent.content_id,
            'title', recent.title,
            'subject', recent.subject,
            'status', recent.status,
            'createdAt', recent.created_at,
            'questionCount', recent.question_count,
            'creator', recent.creator,
            'source', recent.source
          )
          order by recent.created_at desc
        ),
        '[]'::jsonb
      )
      from (
        select *
        from user_exam_rows uer
        order by uer.created_at desc
        limit 6
      ) recent
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_general_admin_cbt_analytics(uuid, integer, text)
from public, anon, authenticated, service_role;
grant execute on function public.get_general_admin_cbt_analytics(uuid, integer, text)
to service_role;

comment on function public.get_general_admin_cbt_analytics(uuid, integer, text) is
  'Server-only CBT learner, activity, question contribution, and growth analytics for a verified general admin.';

commit;
