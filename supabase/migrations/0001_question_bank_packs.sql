-- Question Bank download packs (PDF/DOC/PPT/IMG bundles hosted on Cloudflare R2)
create table if not exists question_bank_packs (
  id uuid primary key default gen_random_uuid(),
  exam text not null check (exam in ('jamb','waec','neco','post','bece','nabteb')),
  exam_label text not null,
  section text not null,
  title text not null,
  files text[] not null default '{}',
  years text not null default '',
  file_count text not null default '',
  downloads text not null default '0',
  badge text,
  file_url text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table question_bank_packs enable row level security;

-- Public can read only published packs
create policy "Public can read published packs"
  on question_bank_packs for select
  using (published = true);

-- Authenticated (admin) users can do everything
create policy "Admins can manage packs"
  on question_bank_packs for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
