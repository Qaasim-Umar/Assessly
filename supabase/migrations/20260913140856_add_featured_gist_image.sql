alter table public.admissions_gists
  add column if not exists featured_image_url text,
  add column if not exists featured_image_key text;

comment on column public.admissions_gists.featured_image_url is
  'Public Cloudflare R2 URL for an image added while this gist was featured.';

comment on column public.admissions_gists.featured_image_key is
  'Cloudflare R2 object key retained for future asset management.';
