begin;

-- School mode is intentionally additive. This migration does not alter, update,
-- backfill, re-permission, or attach triggers to the live Individual/general
-- tables: admin_profiles, exams, questions, submissions, or student_profiles.
create schema if not exists school_private;
revoke all on schema school_private from public, anon;
grant usage on schema school_private to authenticated, service_role;

create or replace function school_private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  slug text not null unique,
  logo_path text,
  school_type text not null default 'primary'
    check (school_type in ('primary', 'secondary', 'combined', 'tertiary', 'academy', 'other')),
  description text,
  email text,
  phone text,
  website text,
  country_code text not null default 'NG' check (char_length(country_code) = 2),
  state text,
  city text,
  address_line1 text,
  timezone text not null default 'Africa/Lagos',
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'pending', 'verified', 'rejected')),
  is_profile_public boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, created_by),
  check (char_length(btrim(name)) between 2 and 160),
  check (short_name is null or char_length(btrim(short_name)) between 2 and 60),
  check (slug = lower(slug))
);

create index if not exists schools_created_by_idx on public.schools (created_by);

create trigger schools_set_updated_at before update on public.schools
for each row execute function school_private.set_updated_at();

create table if not exists public.school_settings (
  school_id uuid primary key references public.schools(id) on delete cascade,
  pupil_login_enabled boolean not null default true,
  default_result_visibility text not null default 'immediate'
    check (default_result_visibility in ('immediate', 'teacher_release', 'hidden')),
  default_locale text not null default 'en-NG',
  branding_primary_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (branding_primary_color is null or branding_primary_color ~ '^#[0-9A-Fa-f]{6}$')
);

create trigger school_settings_set_updated_at before update on public.school_settings
for each row execute function school_private.set_updated_at();

create table if not exists public.school_memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'teacher', 'student')),
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended', 'left')),
  display_name text,
  admission_number text,
  job_title text,
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, user_id),
  unique (id, school_id),
  check (display_name is null or char_length(btrim(display_name)) between 1 and 120),
  check (admission_number is null or char_length(btrim(admission_number)) between 1 and 80)
);

create index if not exists school_memberships_user_status_idx
  on public.school_memberships (user_id, status);
create index if not exists school_memberships_school_role_status_idx
  on public.school_memberships (school_id, role, status);
create index if not exists school_memberships_invited_by_idx
  on public.school_memberships (invited_by) where invited_by is not null;
create unique index if not exists school_memberships_active_admission_number_uidx
  on public.school_memberships (school_id, lower(btrim(admission_number)))
  where admission_number is not null and status = 'active';

create trigger school_memberships_set_updated_at before update on public.school_memberships
for each row execute function school_private.set_updated_at();

create table if not exists public.school_join_codes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  code text not null unique,
  purpose text not null default 'pupil_login' check (purpose in ('pupil_login')),
  is_active boolean not null default true,
  expires_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (code = upper(code)),
  check (char_length(code) between 6 and 12)
);

create index if not exists school_join_codes_school_active_idx
  on public.school_join_codes (school_id, created_at desc)
  where is_active = true and revoked_at is null;
create index if not exists school_join_codes_created_by_idx
  on public.school_join_codes (created_by);

create table if not exists public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_year text not null,
  name text not null,
  starts_on date,
  ends_on date,
  status text not null default 'draft' check (status in ('draft', 'current', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, academic_year, name),
  unique (id, school_id),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create unique index if not exists academic_terms_one_current_per_school_uidx
  on public.academic_terms (school_id) where status = 'current';
create index if not exists academic_terms_school_status_idx
  on public.academic_terms (school_id, status);

create trigger academic_terms_set_updated_at before update on public.academic_terms
for each row execute function school_private.set_updated_at();

create table if not exists public.school_classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_term_id uuid,
  name text not null,
  grade_level text,
  status text not null default 'active' check (status in ('active', 'archived')),
  display_order integer not null default 0,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, school_id),
  foreign key (academic_term_id, school_id)
    references public.academic_terms(id, school_id)
    on delete set null (academic_term_id),
  check (char_length(btrim(name)) between 1 and 80),
  check (grade_level is null or char_length(btrim(grade_level)) between 1 and 80)
);

create unique index if not exists school_classes_name_term_uidx
  on public.school_classes (
    school_id,
    lower(btrim(name)),
    coalesce(academic_term_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
create index if not exists school_classes_school_status_idx
  on public.school_classes (school_id, status, display_order);
create index if not exists school_classes_academic_term_idx
  on public.school_classes (academic_term_id) where academic_term_id is not null;
create index if not exists school_classes_created_by_idx
  on public.school_classes (created_by);

create trigger school_classes_set_updated_at before update on public.school_classes
for each row execute function school_private.set_updated_at();

create table if not exists public.school_class_enrollments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null,
  school_membership_id uuid not null,
  status text not null default 'active'
    check (status in ('active', 'transferred', 'completed', 'withdrawn')),
  enrolled_at timestamptz not null default now(),
  ended_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, school_id),
  unique (class_id, school_membership_id),
  foreign key (class_id, school_id)
    references public.school_classes(id, school_id) on delete cascade,
  foreign key (school_membership_id, school_id)
    references public.school_memberships(id, school_id) on delete cascade,
  check ((status = 'active' and ended_at is null) or status <> 'active')
);

create unique index if not exists school_class_enrollments_one_active_class_uidx
  on public.school_class_enrollments (school_membership_id) where status = 'active';
create index if not exists school_class_enrollments_class_status_idx
  on public.school_class_enrollments (class_id, status, school_membership_id);
create index if not exists school_class_enrollments_school_status_idx
  on public.school_class_enrollments (school_id, status);
create index if not exists school_class_enrollments_membership_idx
  on public.school_class_enrollments (school_membership_id);
create index if not exists school_class_enrollments_created_by_idx
  on public.school_class_enrollments (created_by);

create trigger school_class_enrollments_set_updated_at before update on public.school_class_enrollments
for each row execute function school_private.set_updated_at();

create table if not exists public.school_assessments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  academic_term_id uuid,
  title text not null,
  subject text,
  class_level text,
  assessment_type text,
  duration_minutes integer,
  difficulty text,
  question_type text,
  status text not null default 'Draft'
    check (status in ('Draft', 'Published', 'Live', 'Closed', 'Archived')),
  question_count integer not null default 0 check (question_count >= 0),
  show_results boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, school_id),
  foreign key (academic_term_id, school_id)
    references public.academic_terms(id, school_id)
    on delete set null (academic_term_id),
  check (char_length(btrim(title)) between 2 and 200),
  check (duration_minutes is null or duration_minutes > 0),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create index if not exists school_assessments_school_status_created_idx
  on public.school_assessments (school_id, status, created_at desc);
create index if not exists school_assessments_creator_idx
  on public.school_assessments (created_by, created_at desc);
create index if not exists school_assessments_academic_term_idx
  on public.school_assessments (academic_term_id) where academic_term_id is not null;

create trigger school_assessments_set_updated_at before update on public.school_assessments
for each row execute function school_private.set_updated_at();

create table if not exists public.school_assessment_questions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  assessment_id uuid not null,
  text text not null,
  image_url text,
  instruction text,
  passage text,
  type text not null,
  topic text,
  difficulty text,
  options jsonb,
  correct_answer integer,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, school_id),
  foreign key (assessment_id, school_id)
    references public.school_assessments(id, school_id) on delete cascade,
  check (char_length(btrim(text)) > 0)
);

create index if not exists school_assessment_questions_assessment_order_idx
  on public.school_assessment_questions (assessment_id, order_index) where is_active = true;
create index if not exists school_assessment_questions_school_idx
  on public.school_assessment_questions (school_id);
create index if not exists school_assessment_questions_created_by_idx
  on public.school_assessment_questions (created_by);

create trigger school_assessment_questions_set_updated_at before update on public.school_assessment_questions
for each row execute function school_private.set_updated_at();

create table if not exists public.school_assessment_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  assessment_id uuid not null,
  class_id uuid not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'closed', 'cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, school_id),
  unique (assessment_id, class_id),
  foreign key (assessment_id, school_id)
    references public.school_assessments(id, school_id) on delete cascade,
  foreign key (class_id, school_id)
    references public.school_classes(id, school_id) on delete cascade,
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create index if not exists school_assessment_assignments_assessment_status_idx
  on public.school_assessment_assignments (assessment_id, status);
create index if not exists school_assessment_assignments_class_status_time_idx
  on public.school_assessment_assignments (class_id, status, starts_at, ends_at);
create index if not exists school_assessment_assignments_school_status_idx
  on public.school_assessment_assignments (school_id, status);
create index if not exists school_assessment_assignments_created_by_idx
  on public.school_assessment_assignments (created_by);
create unique index if not exists school_assessment_assignments_one_live_per_class_uidx
  on public.school_assessment_assignments (class_id) where status = 'live';

create trigger school_assessment_assignments_set_updated_at before update on public.school_assessment_assignments
for each row execute function school_private.set_updated_at();

create table if not exists public.school_submissions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  assessment_id uuid not null,
  assessment_assignment_id uuid not null,
  school_membership_id uuid not null,
  class_id uuid not null,
  user_id uuid not null references auth.users(id) on delete restrict,
  answers jsonb not null default '{}'::jsonb,
  theory_answers jsonb not null default '{}'::jsonb,
  score integer,
  percentage numeric(5,2),
  theory_status text not null default 'not_required'
    check (theory_status in ('not_required', 'pending', 'graded')),
  theory_marks jsonb,
  final_score numeric,
  final_percentage numeric(5,2),
  student_name_snapshot text,
  admission_number_snapshot text,
  class_name_snapshot text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, school_membership_id),
  foreign key (assessment_id, school_id)
    references public.school_assessments(id, school_id) on delete restrict,
  foreign key (assessment_assignment_id, school_id)
    references public.school_assessment_assignments(id, school_id) on delete restrict,
  foreign key (school_membership_id, school_id)
    references public.school_memberships(id, school_id) on delete restrict,
  foreign key (class_id, school_id)
    references public.school_classes(id, school_id) on delete restrict,
  check (score is null or score >= 0),
  check (percentage is null or percentage between 0 and 100),
  check (final_percentage is null or final_percentage between 0 and 100)
);

create index if not exists school_submissions_school_submitted_idx
  on public.school_submissions (school_id, submitted_at desc);
create index if not exists school_submissions_assessment_idx
  on public.school_submissions (assessment_id, submitted_at desc);
create index if not exists school_submissions_assignment_idx
  on public.school_submissions (assessment_assignment_id);
create index if not exists school_submissions_membership_idx
  on public.school_submissions (school_membership_id);
create index if not exists school_submissions_class_idx
  on public.school_submissions (class_id);
create index if not exists school_submissions_user_idx
  on public.school_submissions (user_id, submitted_at desc);

create trigger school_submissions_set_updated_at before update on public.school_submissions
for each row execute function school_private.set_updated_at();

create table if not exists public.school_audit_logs (
  id bigint generated always as identity primary key,
  school_id uuid not null references public.schools(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists school_audit_logs_school_created_idx
  on public.school_audit_logs (school_id, created_at desc);
create index if not exists school_audit_logs_actor_idx
  on public.school_audit_logs (actor_user_id) where actor_user_id is not null;

create table if not exists school_private.pupil_login_attempts (
  id bigint generated always as identity primary key,
  school_id uuid references public.schools(id) on delete cascade,
  identifier_hash text not null,
  attempted_at timestamptz not null default now(),
  succeeded boolean not null default false
);

create index if not exists pupil_login_attempts_school_identifier_time_idx
  on school_private.pupil_login_attempts (school_id, identifier_hash, attempted_at desc);
alter table school_private.pupil_login_attempts enable row level security;
revoke all on table school_private.pupil_login_attempts from public, anon, authenticated;

-- Authorization helpers are isolated from the Data API and bind every client
-- decision to auth.uid().
create or replace function school_private.is_school_member(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.school_memberships sm
      where sm.school_id = p_school_id
        and sm.user_id = (select auth.uid())
        and sm.status = 'active'
    );
$$;

create or replace function school_private.has_school_role(p_school_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.school_memberships sm
      where sm.school_id = p_school_id
        and sm.user_id = (select auth.uid())
        and sm.status = 'active'
        and sm.role = any(p_roles)
    );
$$;

create or replace function school_private.is_enrolled_in_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.school_class_enrollments sce
      join public.school_memberships sm
        on sm.id = sce.school_membership_id
       and sm.school_id = sce.school_id
      where sce.class_id = p_class_id
        and sce.status = 'active'
        and sm.user_id = (select auth.uid())
        and sm.role = 'student'
        and sm.status = 'active'
    );
$$;

create or replace function school_private.can_manage_assessment(p_assessment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.school_assessments sa
    where sa.id = p_assessment_id
      and (select school_private.has_school_role(sa.school_id, array['owner', 'admin', 'teacher']))
  );
$$;

create or replace function school_private.student_can_access_assessment(p_assessment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.school_assessments sa
    join public.school_assessment_assignments saa
      on saa.assessment_id = sa.id
     and saa.school_id = sa.school_id
     and saa.status in ('scheduled', 'live')
    join public.school_class_enrollments sce
      on sce.class_id = saa.class_id
     and sce.school_id = saa.school_id
     and sce.status = 'active'
    join public.school_memberships sm
      on sm.id = sce.school_membership_id
     and sm.school_id = sce.school_id
     and sm.role = 'student'
     and sm.status = 'active'
    where sa.id = p_assessment_id
      and sa.status in ('Published', 'Live')
      and sm.user_id = (select auth.uid())
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
  );
$$;

revoke all on function school_private.is_school_member(uuid) from public, anon;
revoke all on function school_private.has_school_role(uuid, text[]) from public, anon;
revoke all on function school_private.is_enrolled_in_class(uuid) from public, anon;
revoke all on function school_private.can_manage_assessment(uuid) from public, anon;
revoke all on function school_private.student_can_access_assessment(uuid) from public, anon;
grant execute on function school_private.is_school_member(uuid) to authenticated, service_role;
grant execute on function school_private.has_school_role(uuid, text[]) to authenticated, service_role;
grant execute on function school_private.is_enrolled_in_class(uuid) to authenticated, service_role;
grant execute on function school_private.can_manage_assessment(uuid) to authenticated, service_role;
grant execute on function school_private.student_can_access_assessment(uuid) to authenticated, service_role;

create or replace function school_private.validate_class_enrollment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.school_memberships sm
    where sm.id = new.school_membership_id
      and sm.school_id = new.school_id
      and sm.role = 'student'
      and (new.status <> 'active' or sm.status = 'active')
  ) then
    raise exception 'Only an active student membership can be enrolled in a class';
  end if;
  return new;
end;
$$;

create trigger school_class_enrollments_validate_student
before insert or update of school_id, school_membership_id, status
on public.school_class_enrollments
for each row execute function school_private.validate_class_enrollment();

create or replace function school_private.validate_submission_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_assignment public.school_assessment_assignments%rowtype;
  v_membership public.school_memberships%rowtype;
  v_class_name text;
begin
  select sm.*
  into v_membership
  from public.school_memberships sm
  where sm.id = new.school_membership_id
    and sm.school_id = new.school_id
    and sm.user_id = new.user_id
    and sm.role = 'student'
    and sm.status = 'active';

  if v_membership.id is null then
    raise exception 'An active pupil membership is required';
  end if;

  select saa.*
  into v_assignment
  from public.school_assessment_assignments saa
  join public.school_assessments sa
    on sa.id = saa.assessment_id
   and sa.school_id = saa.school_id
  join public.school_class_enrollments sce
    on sce.class_id = saa.class_id
   and sce.school_id = saa.school_id
   and sce.school_membership_id = v_membership.id
   and sce.status = 'active'
  where saa.id = new.assessment_assignment_id
    and saa.assessment_id = new.assessment_id
    and saa.school_id = new.school_id
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
    and (coalesce(saa.ends_at, sa.ends_at) is null or coalesce(saa.ends_at, sa.ends_at) > now());

  if v_assignment.id is null then
    raise exception 'Pupil is not assigned to this live assessment';
  end if;

  select sc.name
  into v_class_name
  from public.school_classes sc
  where sc.id = v_assignment.class_id
    and sc.school_id = v_assignment.school_id;

  new.class_id := v_assignment.class_id;
  new.student_name_snapshot := coalesce(new.student_name_snapshot, v_membership.display_name);
  new.admission_number_snapshot := coalesce(new.admission_number_snapshot, v_membership.admission_number);
  new.class_name_snapshot := coalesce(new.class_name_snapshot, v_class_name);
  return new;
end;
$$;

create trigger school_submissions_validate_assignment
before insert or update of school_id, assessment_id, assessment_assignment_id,
  school_membership_id, user_id
on public.school_submissions
for each row execute function school_private.validate_submission_assignment();

revoke all on function school_private.validate_class_enrollment() from public, anon, authenticated;
revoke all on function school_private.validate_submission_assignment() from public, anon, authenticated;

create or replace function school_private.generate_school_code()
returns text
language sql
volatile
security invoker
set search_path = ''
as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

-- Opt-in bootstrap. Nothing is created for an existing Individual creator until
-- they explicitly open School mode and invoke this function.
create or replace function public.bootstrap_school_mode(p_school_name text)
returns table (
  school_id uuid,
  school_name text,
  school_slug text,
  school_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_username text;
  v_school public.schools%rowtype;
  v_code text;
  v_name text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  -- Prevent two browser requests from creating two School workspaces for the
  -- same Individual creator at the same time.
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select ap.username
  into v_username
  from public.admin_profiles ap
  where ap.id = v_user_id
    and coalesce(ap.is_general_admin, false) = false;

  if v_username is null then
    raise exception 'Administrator profile required';
  end if;

  select s.*
  into v_school
  from public.schools s
  join public.school_memberships sm on sm.school_id = s.id
  where sm.user_id = v_user_id
    and sm.role in ('owner', 'admin')
    and sm.status = 'active'
  order by sm.created_at
  limit 1;

  if v_school.id is null then
    v_name := coalesce(nullif(btrim(p_school_name), ''), initcap(v_username) || '''s School');

    loop
      v_code := school_private.generate_school_code();
      exit when not exists (
        select 1 from public.school_join_codes sjc where sjc.code = v_code
      );
    end loop;

    insert into public.schools (name, short_name, slug, created_by)
    values (
      v_name,
      initcap(v_username),
      trim(both '-' from regexp_replace(lower(v_username), '[^a-z0-9]+', '-', 'g')) || '-' || lower(v_code),
      v_user_id
    )
    returning * into v_school;

    insert into public.school_settings (school_id) values (v_school.id);
    insert into public.school_memberships (
      school_id, user_id, role, status, display_name, joined_at
    ) values (
      v_school.id, v_user_id, 'owner', 'active', initcap(v_username), now()
    );
    insert into public.school_join_codes (school_id, code, created_by)
      values (v_school.id, v_code, v_user_id);
    insert into public.academic_terms (school_id, academic_year, name, status)
      values (
        v_school.id,
        extract(year from current_date)::text || '/' || (extract(year from current_date)::int + 1)::text,
        'First Term',
        'current'
      );
    insert into public.school_audit_logs (
      school_id, actor_user_id, action, entity_type, entity_id
    ) values (
      v_school.id, v_user_id, 'school.created', 'school', v_school.id
    );
  else
    select sjc.code
    into v_code
    from public.school_join_codes sjc
    where sjc.school_id = v_school.id
      and sjc.purpose = 'pupil_login'
      and sjc.is_active = true
      and sjc.revoked_at is null
      and (sjc.expires_at is null or sjc.expires_at > now())
    order by sjc.created_at desc
    limit 1;
  end if;

  return query select v_school.id, v_school.name, v_school.slug, v_code;
end;
$$;

revoke all on function public.bootstrap_school_mode(text) from public, anon, authenticated;
grant execute on function public.bootstrap_school_mode(text) to authenticated;

create or replace function public.get_my_live_school_assessments()
returns table (
  assessment_id uuid,
  title text,
  subject text,
  class_id uuid,
  class_name text,
  assignment_id uuid,
  starts_at timestamptz,
  ends_at timestamptz
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
    raise exception 'Authentication required';
  end if;

  return query
  select
    sa.id,
    sa.title,
    sa.subject,
    sc.id,
    sc.name,
    saa.id,
    coalesce(saa.starts_at, sa.starts_at),
    coalesce(saa.ends_at, sa.ends_at)
  from public.school_memberships sm
  join public.school_class_enrollments sce
    on sce.school_membership_id = sm.id
   and sce.school_id = sm.school_id
   and sce.status = 'active'
  join public.school_classes sc
    on sc.id = sce.class_id
   and sc.school_id = sce.school_id
   and sc.status = 'active'
  join public.school_assessment_assignments saa
    on saa.class_id = sc.id
   and saa.school_id = sc.school_id
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
  order by coalesce(saa.starts_at, sa.starts_at), sa.title;
end;
$$;

revoke all on function public.get_my_live_school_assessments() from public, anon, authenticated;
grant execute on function public.get_my_live_school_assessments() to authenticated;

create or replace function public.get_school_assessment_questions(p_assessment_id uuid)
returns table (
  id uuid,
  assessment_id uuid,
  text text,
  image_url text,
  instruction text,
  passage text,
  type text,
  topic text,
  difficulty text,
  options jsonb,
  correct_answer integer,
  order_index integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  if not (select school_private.student_can_access_assessment(p_assessment_id)) then
    raise exception 'Assessment is not available';
  end if;

  return query
  select
    saq.id,
    saq.assessment_id,
    saq.text,
    saq.image_url,
    saq.instruction,
    saq.passage,
    saq.type,
    saq.topic,
    saq.difficulty,
    saq.options,
    null::integer,
    saq.order_index
  from public.school_assessment_questions saq
  where saq.assessment_id = p_assessment_id
    and saq.is_active = true
  order by saq.order_index;
end;
$$;

revoke all on function public.get_school_assessment_questions(uuid) from public, anon, authenticated;
grant execute on function public.get_school_assessment_questions(uuid) to authenticated;

-- Client access is opt-in and limited to the new School-mode objects. Existing
-- Individual-mode tables keep their current grants and RLS policies unchanged.
revoke all on table public.schools from anon, authenticated;
revoke all on table public.school_settings from anon, authenticated;
revoke all on table public.school_memberships from anon, authenticated;
revoke all on table public.school_join_codes from anon, authenticated;
revoke all on table public.academic_terms from anon, authenticated;
revoke all on table public.school_classes from anon, authenticated;
revoke all on table public.school_class_enrollments from anon, authenticated;
revoke all on table public.school_assessments from anon, authenticated;
revoke all on table public.school_assessment_questions from anon, authenticated;
revoke all on table public.school_assessment_assignments from anon, authenticated;
revoke all on table public.school_submissions from anon, authenticated;
revoke all on table public.school_audit_logs from anon, authenticated;

grant select on table public.schools to authenticated;
grant update (name, short_name, logo_path, school_type, description, email, phone,
  website, country_code, state, city, address_line1, timezone, is_profile_public,
  onboarding_completed_at)
  on table public.schools to authenticated;

grant select on table public.school_settings to authenticated;
grant update (pupil_login_enabled, default_result_visibility, default_locale,
  branding_primary_color)
  on table public.school_settings to authenticated;

grant select on table public.school_memberships to authenticated;
grant select on table public.school_join_codes to authenticated;

grant select, insert, delete on table public.academic_terms to authenticated;
grant update (academic_year, name, starts_on, ends_on, status)
  on table public.academic_terms to authenticated;

grant select, insert, delete on table public.school_classes to authenticated;
grant update (academic_term_id, name, grade_level, status, display_order)
  on table public.school_classes to authenticated;

grant select, insert, delete on table public.school_class_enrollments to authenticated;
grant update (class_id, school_membership_id, status, ended_at)
  on table public.school_class_enrollments to authenticated;

grant select, insert, delete on table public.school_assessments to authenticated;
grant update (academic_term_id, title, subject, class_level, assessment_type,
  duration_minutes, difficulty, question_type, status, question_count,
  show_results, starts_at, ends_at)
  on table public.school_assessments to authenticated;

grant select, insert, update, delete
  on table public.school_assessment_questions to authenticated;

grant select, insert, delete
  on table public.school_assessment_assignments to authenticated;
grant update (assessment_id, class_id, status, starts_at, ends_at)
  on table public.school_assessment_assignments to authenticated;

grant select on table public.school_submissions to authenticated;
grant update (score, percentage, theory_status, theory_marks, final_score,
  final_percentage)
  on table public.school_submissions to authenticated;

grant select on table public.school_audit_logs to authenticated;

alter table public.schools enable row level security;
alter table public.school_settings enable row level security;
alter table public.school_memberships enable row level security;
alter table public.school_join_codes enable row level security;
alter table public.academic_terms enable row level security;
alter table public.school_classes enable row level security;
alter table public.school_class_enrollments enable row level security;
alter table public.school_assessments enable row level security;
alter table public.school_assessment_questions enable row level security;
alter table public.school_assessment_assignments enable row level security;
alter table public.school_submissions enable row level security;
alter table public.school_audit_logs enable row level security;

create policy schools_select_members
on public.schools for select to authenticated
using ((select school_private.is_school_member(id)));

create policy schools_update_admins
on public.schools for update to authenticated
using ((select school_private.has_school_role(id, array['owner', 'admin'])))
with check ((select school_private.has_school_role(id, array['owner', 'admin'])));

create policy school_settings_select_members
on public.school_settings for select to authenticated
using ((select school_private.is_school_member(school_id)));

create policy school_settings_update_admins
on public.school_settings for update to authenticated
using ((select school_private.has_school_role(school_id, array['owner', 'admin'])))
with check ((select school_private.has_school_role(school_id, array['owner', 'admin'])));

create policy school_memberships_select_self_or_staff
on public.school_memberships for select to authenticated
using (
  user_id = (select auth.uid())
  or (select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher']))
);

create policy school_join_codes_select_admins
on public.school_join_codes for select to authenticated
using ((select school_private.has_school_role(school_id, array['owner', 'admin'])));

create policy academic_terms_select_members
on public.academic_terms for select to authenticated
using ((select school_private.is_school_member(school_id)));

create policy academic_terms_insert_admins
on public.academic_terms for insert to authenticated
with check ((select school_private.has_school_role(school_id, array['owner', 'admin'])));

create policy academic_terms_update_admins
on public.academic_terms for update to authenticated
using ((select school_private.has_school_role(school_id, array['owner', 'admin'])))
with check ((select school_private.has_school_role(school_id, array['owner', 'admin'])));

create policy academic_terms_delete_admins
on public.academic_terms for delete to authenticated
using ((select school_private.has_school_role(school_id, array['owner', 'admin'])));

create policy school_classes_select_members
on public.school_classes for select to authenticated
using ((select school_private.is_school_member(school_id)));

create policy school_classes_insert_staff
on public.school_classes for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher']))
);

create policy school_classes_update_staff
on public.school_classes for update to authenticated
using ((select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher'])))
with check ((select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher'])));

create policy school_classes_delete_staff
on public.school_classes for delete to authenticated
using ((select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher'])));

create policy school_class_enrollments_select_self_or_staff
on public.school_class_enrollments for select to authenticated
using (
  exists (
    select 1
    from public.school_memberships sm
    where sm.id = school_membership_id
      and sm.user_id = (select auth.uid())
      and sm.status = 'active'
  )
  or (select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher']))
);

create policy school_class_enrollments_insert_staff
on public.school_class_enrollments for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher']))
);

create policy school_class_enrollments_update_staff
on public.school_class_enrollments for update to authenticated
using ((select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher'])))
with check ((select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher'])));

create policy school_class_enrollments_delete_staff
on public.school_class_enrollments for delete to authenticated
using ((select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher'])));

create policy school_assessments_select_staff_or_assigned_pupils
on public.school_assessments for select to authenticated
using (
  (select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher']))
  or (select school_private.student_can_access_assessment(id))
);

create policy school_assessments_insert_staff
on public.school_assessments for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher']))
);

create policy school_assessments_update_staff
on public.school_assessments for update to authenticated
using ((select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher'])))
with check ((select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher'])));

create policy school_assessments_delete_staff
on public.school_assessments for delete to authenticated
using ((select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher'])));

create policy school_assessment_questions_select_staff
on public.school_assessment_questions for select to authenticated
using ((select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher'])));

create policy school_assessment_questions_insert_staff
on public.school_assessment_questions for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select school_private.can_manage_assessment(assessment_id))
);

create policy school_assessment_questions_update_staff
on public.school_assessment_questions for update to authenticated
using ((select school_private.can_manage_assessment(assessment_id)))
with check ((select school_private.can_manage_assessment(assessment_id)));

create policy school_assessment_questions_delete_staff
on public.school_assessment_questions for delete to authenticated
using ((select school_private.can_manage_assessment(assessment_id)));

create policy school_assessment_assignments_select_staff_or_pupils
on public.school_assessment_assignments for select to authenticated
using (
  (select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher']))
  or (
    status in ('scheduled', 'live')
    and (select school_private.is_enrolled_in_class(class_id))
  )
);

create policy school_assessment_assignments_insert_staff
on public.school_assessment_assignments for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select school_private.can_manage_assessment(assessment_id))
);

create policy school_assessment_assignments_update_staff
on public.school_assessment_assignments for update to authenticated
using ((select school_private.can_manage_assessment(assessment_id)))
with check ((select school_private.can_manage_assessment(assessment_id)));

create policy school_assessment_assignments_delete_staff
on public.school_assessment_assignments for delete to authenticated
using ((select school_private.can_manage_assessment(assessment_id)));

create policy school_submissions_select_self_or_staff
on public.school_submissions for select to authenticated
using (
  user_id = (select auth.uid())
  or (select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher']))
);

create policy school_submissions_grade_staff
on public.school_submissions for update to authenticated
using ((select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher'])))
with check ((select school_private.has_school_role(school_id, array['owner', 'admin', 'teacher'])));

create policy school_audit_logs_select_admins
on public.school_audit_logs for select to authenticated
using ((select school_private.has_school_role(school_id, array['owner', 'admin'])));

-- Pupil Auth users, PIN verification, membership writes, and School submission
-- inserts must be handled by a trusted Edge Function using the service role.
-- No client permission is granted for those operations in this migration.

revoke all on function school_private.set_updated_at() from public, anon, authenticated;
revoke all on function school_private.generate_school_code() from public, anon, authenticated;

commit;
