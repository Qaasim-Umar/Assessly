begin;

-- Public directory data imported from the CBO registration-centre dataset.
-- Phone numbers remain text so Nigerian leading zeroes are preserved.
create table public.cbo_centres (
  sn integer primary key check (sn > 0),
  cyber_cafe text not null check (length(btrim(cyber_cafe)) > 0),
  office_address text not null check (length(btrim(office_address)) > 0),
  town text,
  state text not null check (length(btrim(state)) > 0),
  lga text not null check (length(btrim(lga)) > 0),
  phone_number text,
  alternative_phone_number text,
  flagged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cbo_centres is
  'CBO registration centres. The flagged column is internal and is not part of the public API.';

create index cbo_centres_state_lga_idx
  on public.cbo_centres (state, lga);

create index cbo_centres_cyber_cafe_idx
  on public.cbo_centres (cyber_cafe);

alter table public.cbo_centres enable row level security;

-- New Supabase projects require explicit Data API grants. Public clients can
-- read only the directory columns; flagged and audit columns stay private.
revoke all on table public.cbo_centres from public, anon, authenticated;
grant select (
  sn,
  cyber_cafe,
  office_address,
  town,
  state,
  lga,
  phone_number,
  alternative_phone_number
) on table public.cbo_centres to anon, authenticated;

create policy cbo_centres_public_read
on public.cbo_centres
for select
to anon, authenticated
using (true);

create view public.cbo_centres_public
with (security_invoker = true)
as
select
  sn,
  cyber_cafe,
  office_address,
  town,
  state,
  lga,
  phone_number,
  alternative_phone_number
from public.cbo_centres;

create view public.cbo_centre_locations
with (security_invoker = true)
as
select distinct state, lga
from public.cbo_centres;

revoke all on table public.cbo_centres_public from public, anon, authenticated;
revoke all on table public.cbo_centre_locations from public, anon, authenticated;
grant select on table public.cbo_centres_public to anon, authenticated;
grant select on table public.cbo_centre_locations to anon, authenticated;

commit;
