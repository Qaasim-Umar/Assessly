-- Add pack_type and pack_files columns to question_bank_packs
-- pack_type: 'single' (one file_url) or 'pack' (array of {name, url} in pack_files)
-- Existing rows default to 'single' so nothing breaks.

alter table question_bank_packs
  add column if not exists pack_type text not null default 'single'
    check (pack_type in ('single', 'pack')),
  add column if not exists pack_files jsonb not null default '[]';
