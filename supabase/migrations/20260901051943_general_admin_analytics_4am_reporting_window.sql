begin;

-- The daily snapshot runs at 04:00 Africa/Lagos. "Today" previously meant
-- midnight through the snapshot time, so a 04:00 refresh only counted four
-- hours. Build the headline metrics from the last fully completed 04:00-to-
-- 04:00 reporting window instead.
create or replace function analytics_private.get_general_admin_cbt_completed_day(
  p_timezone text default 'Africa/Lagos'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_local_now timestamp;
  v_window_end_date date;
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_result jsonb;
begin
  if not exists (
    select 1
    from pg_catalog.pg_timezone_names tz
    where tz.name = p_timezone
  ) then
    raise exception using
      errcode = '22023',
      message = 'Unknown analytics timezone';
  end if;

  v_local_now := clock_timestamp() at time zone p_timezone;
  v_window_end_date := case
    when v_local_now::time >= time '04:00' then v_local_now::date
    else v_local_now::date - 1
  end;
  v_window_start := (
    (v_window_end_date - 1) + time '04:00'
  ) at time zone p_timezone;
  v_window_end := (
    v_window_end_date + time '04:00'
  ) at time zone p_timezone;

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
      s.student_id as user_id
    from public.submissions s
    join public.exams e on e.id = s.exam_id

    union all

    select ss.submitted_at, ss.user_id
    from public.school_submissions ss

    union all

    select ms.started_at, ms.user_id
    from public.mock_exam_sessions ms

    union all

    select ps.started_at, ps.user_id
    from public.practice_sessions ps

    union all

    select pqs.started_at, pqs.user_id
    from public.past_question_sessions pqs

    union all

    select svs.started_at, svs.user_id
    from public.survival_sessions svs
  ),
  user_question_events as (
    select e.created_at as occurred_at
    from public.questions q
    join public.exams e on e.id = q.exam_id
    where e.is_general = false

    union all

    select saq.created_at
    from public.school_assessment_questions saq
  ),
  user_exam_events as (
    select e.created_at as occurred_at
    from public.exams e
    where e.is_general = false

    union all

    select sa.created_at
    from public.school_assessments sa
  )
  select jsonb_build_object(
    'windowStart', v_window_start,
    'windowEnd', v_window_end,
    'metrics', jsonb_build_object(
      'newUsersToday', (
        select count(*)::integer
        from learners l
        where l.created_at >= v_window_start
          and l.created_at < v_window_end
      ),
      'returningUsersToday', (
        select count(*)::integer
        from learners l
        where l.created_at < v_window_start
          and l.last_sign_in_at >= v_window_start
          and l.last_sign_in_at < v_window_end
      ),
      'activeUsersToday', (
        select count(*)::integer
        from (
          select l.id as user_id
          from learners l
          where l.last_sign_in_at >= v_window_start
            and l.last_sign_in_at < v_window_end
          union
          select ae.user_id
          from attempt_events ae
          join learner_ids li on li.user_id = ae.user_id
          where ae.occurred_at >= v_window_start
            and ae.occurred_at < v_window_end
        ) active_in_window
      ),
      'userQuestionsToday', (
        select count(*)::integer
        from user_question_events uqe
        where uqe.occurred_at >= v_window_start
          and uqe.occurred_at < v_window_end
      ),
      'userExamsToday', (
        select count(*)::integer
        from user_exam_events uee
        where uee.occurred_at >= v_window_start
          and uee.occurred_at < v_window_end
      ),
      'attemptsToday', (
        select count(*)::integer
        from attempt_events ae
        where ae.occurred_at >= v_window_start
          and ae.occurred_at < v_window_end
      )
    )
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function analytics_private.get_general_admin_cbt_completed_day(text)
from public, anon, authenticated, service_role;

comment on function analytics_private.get_general_admin_cbt_completed_day(text) is
  'Returns headline CBT metrics for the latest fully completed 04:00-to-04:00 reporting window.';

create or replace function analytics_private.refresh_general_admin_cbt_analytics_cache()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requesting_user_id uuid;
  v_period_days smallint;
  v_generated_at timestamptz := clock_timestamp();
  v_lagos_now timestamp := clock_timestamp() at time zone 'Africa/Lagos';
  v_next_refresh_at timestamptz;
  v_payload jsonb;
  v_completed_day jsonb;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('general-admin-cbt-analytics-daily-snapshot')
  );

  select ap.id
  into v_requesting_user_id
  from public.admin_profiles ap
  where ap.is_general_admin = true
  order by ap.id
  limit 1;

  if v_requesting_user_id is null then
    raise warning 'CBT analytics snapshot skipped because no general admin exists';
    return;
  end if;

  v_next_refresh_at := (
    case
      when v_lagos_now::time < time '04:00'
        then v_lagos_now::date
      else v_lagos_now::date + 1
    end + time '04:00'
  ) at time zone 'Africa/Lagos';

  v_completed_day := analytics_private.get_general_admin_cbt_completed_day(
    'Africa/Lagos'
  );

  foreach v_period_days in array array[7, 30, 90]::smallint[]
  loop
    v_payload := public.get_general_admin_cbt_analytics(
      v_requesting_user_id,
      v_period_days,
      'Africa/Lagos'
    );

    v_payload := jsonb_set(
      v_payload,
      '{metrics}',
      coalesce(v_payload -> 'metrics', '{}'::jsonb)
        || (v_completed_day -> 'metrics'),
      true
    ) || jsonb_build_object(
      'dailyWindowStart', v_completed_day -> 'windowStart',
      'dailyWindowEnd', v_completed_day -> 'windowEnd'
    );

    insert into analytics_private.general_admin_cbt_analytics_cache (
      period_days,
      payload,
      generated_at,
      next_refresh_at
    )
    values (
      v_period_days,
      v_payload,
      v_generated_at,
      v_next_refresh_at
    )
    on conflict (period_days)
    do update set
      payload = excluded.payload,
      generated_at = excluded.generated_at,
      next_refresh_at = excluded.next_refresh_at;
  end loop;
end;
$$;

revoke all on function analytics_private.refresh_general_admin_cbt_analytics_cache()
from public, anon, authenticated, service_role;

comment on function analytics_private.refresh_general_admin_cbt_analytics_cache() is
  'Refreshes every supported CBT analytics range and the completed 04:00-to-04:00 daily metrics in one job.';

-- Replace the already-cached midnight-based values immediately. The existing
-- pg_cron job continues to refresh this function at 03:00 UTC / 04:00 Lagos.
select analytics_private.refresh_general_admin_cbt_analytics_cache();

commit;
