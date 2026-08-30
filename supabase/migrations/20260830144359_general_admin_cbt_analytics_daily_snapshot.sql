begin;

-- Keep expensive CBT analytics calculations off the request path. The Cron
-- job refreshes all supported ranges in one run at 04:00 Africa/Lagos
-- (03:00 UTC), while authenticated general admins only read this snapshot.
create extension if not exists pg_cron;

create schema if not exists analytics_private;

revoke all on schema analytics_private from public, anon, authenticated, service_role;

create table if not exists analytics_private.general_admin_cbt_analytics_cache (
  period_days smallint primary key,
  payload jsonb not null,
  generated_at timestamptz not null,
  next_refresh_at timestamptz not null,
  constraint general_admin_cbt_analytics_cache_period_days_check
    check (period_days in (7, 30, 90))
);

alter table analytics_private.general_admin_cbt_analytics_cache
enable row level security;

revoke all on analytics_private.general_admin_cbt_analytics_cache
from public, anon, authenticated, service_role;

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
begin
  -- Prevent a manual run from overlapping the scheduled refresh.
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

  foreach v_period_days in array array[7, 30, 90]::smallint[]
  loop
    v_payload := public.get_general_admin_cbt_analytics(
      v_requesting_user_id,
      v_period_days,
      'Africa/Lagos'
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

create or replace function public.get_general_admin_cbt_analytics_snapshot(
  p_requesting_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if p_requesting_user_id is null or not exists (
    select 1
    from public.admin_profiles ap
    where ap.id = p_requesting_user_id
      and ap.is_general_admin = true
  ) then
    raise exception using
      errcode = '42501',
      message = 'General administrator access is required';
  end if;

  select jsonb_build_object(
    'generatedAt', max(cache.generated_at),
    'nextRefreshAt', min(cache.next_refresh_at),
    'timezone', 'Africa/Lagos',
    'ranges', jsonb_object_agg(
      cache.period_days::text,
      cache.payload
      order by cache.period_days
    )
  )
  into v_result
  from analytics_private.general_admin_cbt_analytics_cache cache
  where cache.period_days in (7, 30, 90)
  having count(*) = 3;

  if v_result is null then
    raise exception using
      errcode = '55000',
      message = 'The CBT analytics snapshot is not ready yet';
  end if;

  return v_result;
end;
$$;

revoke all on function public.get_general_admin_cbt_analytics_snapshot(uuid)
from public, anon, authenticated, service_role;
grant execute on function public.get_general_admin_cbt_analytics_snapshot(uuid)
to service_role;

comment on table analytics_private.general_admin_cbt_analytics_cache is
  'Private daily CBT analytics snapshots for the 7, 30, and 90 day dashboard ranges.';

comment on function analytics_private.refresh_general_admin_cbt_analytics_cache() is
  'Refreshes every supported CBT analytics range in one daily database job.';

comment on function public.get_general_admin_cbt_analytics_snapshot(uuid) is
  'Returns the saved daily CBT analytics bundle to a verified general admin.';

-- Seed the cache immediately so the dashboard works before the first 04:00 run.
select analytics_private.refresh_general_admin_cbt_analytics_cache();

-- Supabase databases and pg_cron use UTC. Lagos is UTC+1 year-round, so
-- 03:00 UTC is 04:00 Africa/Lagos. Reusing the name replaces the prior job.
select cron.schedule(
  'general-admin-cbt-analytics-daily-snapshot',
  '0 3 * * *',
  $cron$select analytics_private.refresh_general_admin_cbt_analytics_cache();$cron$
);

commit;
