-- Establish the reusable question-bank pack schema and migrate existing rows.

create table if not exists public.question_bank_packs (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  exam text not null,
  exam_label text not null,
  section text not null,
  title text not null,
  subject text not null,
  years text not null,
  short_description text not null,
  topics text[] not null default '{}',
  pack_type text not null default 'single',
  object_key text not null default '',
  pack_files jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.question_bank_packs
  add column if not exists slug text,
  add column if not exists subject text,
  add column if not exists years text,
  add column if not exists short_description text,
  add column if not exists topics text[] default '{}',
  add column if not exists object_key text default '';

alter table public.question_bank_packs
  alter column pack_files type jsonb using coalesce(pack_files::jsonb, '[]'::jsonb);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'question_bank_packs'
      and column_name = 'file_url'
  ) then
    execute $sql$
      update public.question_bank_packs
      set object_key = coalesce(nullif(object_key, ''), file_url, '')
    $sql$;
  end if;
end
$$;

update public.question_bank_packs
set
  slug = coalesce(
    nullif(slug, ''),
    trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'))
      || '-' || left(id::text, 8)
  ),
  subject = coalesce(nullif(subject, ''), nullif(exam_label, ''), exam),
  years = coalesce(years, ''),
  short_description = coalesce(nullif(short_description, ''), title),
  topics = coalesce(topics, '{}'),
  object_key = coalesce(object_key, ''),
  pack_files = coalesce(pack_files, '[]'::jsonb);

update public.question_bank_packs
set pack_files = coalesce(
  (
    select jsonb_agg(
      case
        when file_entry ? 'object_key' then file_entry - 'url'
        else (file_entry - 'url') || jsonb_build_object(
          'object_key',
          coalesce(file_entry ->> 'url', '')
        )
      end
    )
    from jsonb_array_elements(pack_files) as file_entry
  ),
  '[]'::jsonb
)
where jsonb_typeof(pack_files) = 'array';

alter table public.question_bank_packs
  alter column slug set not null,
  alter column subject set not null,
  alter column years set not null,
  alter column short_description set not null,
  alter column topics set default '{}',
  alter column topics set not null,
  alter column object_key set default '',
  alter column object_key set not null,
  alter column pack_files set default '[]'::jsonb,
  alter column pack_files set not null;

alter table public.question_bank_packs
  drop column if exists file_url,
  drop column if exists sample_questions,
  drop column if exists page_count,
  drop column if exists question_count,
  drop column if exists overview,
  drop column if exists includes,
  drop column if exists faqs,
  drop column if exists seo_title,
  drop column if exists seo_description;

create unique index if not exists question_bank_packs_slug_key
  on public.question_bank_packs (slug);

alter table public.question_bank_packs enable row level security;

drop policy if exists "Public can read published question bank packs"
  on public.question_bank_packs;
create policy "Public can read published question bank packs"
  on public.question_bank_packs
  for select
  to anon, authenticated
  using (published = true);

drop policy if exists "General admins can read question bank packs"
  on public.question_bank_packs;
create policy "General admins can read question bank packs"
  on public.question_bank_packs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_profiles
      where admin_profiles.id = (select auth.uid())
        and admin_profiles.is_general_admin = true
    )
  );

drop policy if exists "General admins can insert question bank packs"
  on public.question_bank_packs;
create policy "General admins can insert question bank packs"
  on public.question_bank_packs
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.admin_profiles
      where admin_profiles.id = (select auth.uid())
        and admin_profiles.is_general_admin = true
    )
  );

drop policy if exists "General admins can update question bank packs"
  on public.question_bank_packs;
create policy "General admins can update question bank packs"
  on public.question_bank_packs
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.admin_profiles
      where admin_profiles.id = (select auth.uid())
        and admin_profiles.is_general_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.admin_profiles
      where admin_profiles.id = (select auth.uid())
        and admin_profiles.is_general_admin = true
    )
  );

drop policy if exists "General admins can delete question bank packs"
  on public.question_bank_packs;
create policy "General admins can delete question bank packs"
  on public.question_bank_packs
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admin_profiles
      where admin_profiles.id = (select auth.uid())
        and admin_profiles.is_general_admin = true
    )
  );

revoke all on table public.question_bank_packs from anon, authenticated;
grant select on table public.question_bank_packs to anon;
grant select, insert, update, delete on table public.question_bank_packs to authenticated;
