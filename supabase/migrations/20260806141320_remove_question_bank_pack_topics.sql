-- Question-pack SEO pages now use reusable study guidance instead of pack-specific topics.

alter table public.question_bank_packs
  drop column if exists topics;
