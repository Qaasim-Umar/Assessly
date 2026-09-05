begin;

-- Allow the browser-based general-admin importer to write only the columns it
-- owns. RLS below still decides which authenticated users may write rows.
grant insert (
  sn,
  cyber_cafe,
  office_address,
  town,
  state,
  lga,
  phone_number,
  alternative_phone_number,
  flagged,
  updated_at
) on table public.cbo_centres to authenticated;

grant update (
  sn,
  cyber_cafe,
  office_address,
  town,
  state,
  lga,
  phone_number,
  alternative_phone_number,
  flagged,
  updated_at
) on table public.cbo_centres to authenticated;

create policy cbo_centres_general_admin_insert
on public.cbo_centres
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

create policy cbo_centres_general_admin_update
on public.cbo_centres
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

commit;
