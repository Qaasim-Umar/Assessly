begin;

-- These RPCs are called only by the School pupil login Edge Function. They
-- keep the private attempt table outside the Data API while providing an
-- atomic five-failure limit for each School Code + Pupil ID combination.
create or replace function public.begin_school_pupil_login_attempt(
  p_school_code text,
  p_admission_number text,
  p_identifier_hash text
)
returns table (
  attempt_id bigint,
  school_id uuid,
  pupil_user_id uuid,
  allowed boolean
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_school_code text := upper(btrim(p_school_code));
  v_admission_number text := upper(btrim(p_admission_number));
  v_identifier_hash text := lower(btrim(p_identifier_hash));
  v_school_id uuid;
  v_pupil_user_id uuid;
  v_attempt_id bigint;
  v_recent_failures integer;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;

  if v_school_code !~ '^[A-Z0-9]{6,12}$'
    or char_length(v_admission_number) not between 1 and 80
    or v_identifier_hash !~ '^[0-9a-f]{64}$'
  then
    raise exception 'Invalid login attempt payload' using errcode = '22023';
  end if;

  -- Prevent simultaneous requests for the same pupil identifier from bypassing
  -- the attempt count.
  perform pg_advisory_xact_lock(hashtextextended(v_identifier_hash, 0));

  select sjc.school_id
  into v_school_id
  from public.school_join_codes sjc
  join public.school_settings ss
    on ss.school_id = sjc.school_id
   and ss.pupil_login_enabled = true
  where sjc.code = v_school_code
    and sjc.purpose = 'pupil_login'
    and sjc.is_active = true
    and sjc.revoked_at is null
    and (sjc.expires_at is null or sjc.expires_at > now())
  limit 1;

  select count(*)::integer
  into v_recent_failures
  from school_private.pupil_login_attempts pla
  where pla.identifier_hash = v_identifier_hash
    and pla.school_id is not distinct from v_school_id
    and pla.succeeded = false
    and pla.attempted_at >= now() - interval '15 minutes';

  if v_recent_failures >= 5 then
    return query select null::bigint, v_school_id, null::uuid, false;
    return;
  end if;

  insert into school_private.pupil_login_attempts (
    school_id,
    identifier_hash,
    succeeded
  ) values (
    v_school_id,
    v_identifier_hash,
    false
  )
  returning id into v_attempt_id;

  if v_school_id is not null then
    select sm.user_id
    into v_pupil_user_id
    from public.school_memberships sm
    where sm.school_id = v_school_id
      and sm.role = 'student'
      and sm.status = 'active'
      and lower(btrim(sm.admission_number)) = lower(v_admission_number)
    limit 1;
  end if;

  return query select v_attempt_id, v_school_id, v_pupil_user_id, true;
end;
$$;

create or replace function public.mark_school_pupil_login_success(
  p_attempt_id bigint
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;

  update school_private.pupil_login_attempts
  set succeeded = true
  where id = p_attempt_id;
end;
$$;

revoke all on function public.begin_school_pupil_login_attempt(text, text, text)
  from public, anon, authenticated;
revoke all on function public.mark_school_pupil_login_success(bigint)
  from public, anon, authenticated;

grant execute on function public.begin_school_pupil_login_attempt(text, text, text)
  to service_role;
grant execute on function public.mark_school_pupil_login_success(bigint)
  to service_role;

commit;
