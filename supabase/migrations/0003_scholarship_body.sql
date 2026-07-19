-- Single-MDX scholarship body. Replaces the separate description/eligibility/
-- required_documents/covers content boxes with one Markdown field rendered by
-- GistMarkdown on the detail page. The `description` column is retained as the
-- short SEO summary (meta description, card/search preview). The old array
-- columns are left in place (unused) to avoid a destructive drop.
alter table admissions_scholarships
  add column if not exists body text not null default '';
