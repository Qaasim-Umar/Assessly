insert into public.question_bank_packs (
  slug,
  exam,
  exam_label,
  section,
  title,
  subject,
  years,
  short_description,
  pack_type,
  object_key,
  pack_files,
  published
)
values (
  'waec-chemistry-theory-questions-2021-2023',
  'waec',
  'WAEC · Chemistry Theory',
  'WAEC / SSCE',
  'WAEC Chemistry Theory Questions 2021–2023',
  'Chemistry',
  '2021–2023',
  'Download and practise WAEC Chemistry Theory questions for 2021, 2022, and 2023 in one free revision pack.',
  'pack',
  '',
  jsonb_build_array(
    jsonb_build_object(
      'name', 'WAEC Chemistry Theory 2021',
      'object_key', 'question-banks/Waec/21-23/Waec_2021_chemistry_theory_questions.pdf'
    ),
    jsonb_build_object(
      'name', 'WAEC Chemistry Theory 2022',
      'object_key', 'question-banks/Waec/21-23/Waec_2022_chemistry_theory_questions.pdf'
    ),
    jsonb_build_object(
      'name', 'WAEC Chemistry Theory 2023',
      'object_key', 'question-banks/Waec/21-23/Waec_2023_chemistry_theory_questions.pdf'
    )
  ),
  true
)
on conflict (slug) do update
set
  exam = excluded.exam,
  exam_label = excluded.exam_label,
  section = excluded.section,
  title = excluded.title,
  subject = excluded.subject,
  years = excluded.years,
  short_description = excluded.short_description,
  pack_type = excluded.pack_type,
  object_key = excluded.object_key,
  pack_files = excluded.pack_files,
  published = excluded.published,
  updated_at = now();
