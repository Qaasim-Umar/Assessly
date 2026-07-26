// Single source of truth for the Admissions Hub content-type "categories".
// Used by TabBar (client filter on /admissions), FilterBar links, the
// /admissions/category/[slug] archive route, and the sitemap.

export type CategorySlug =
  | "gists"
  | "scholarships"
  | "deadlines"
  | "cutoffs"
  | "nysc";

export interface CategoryDef {
  slug: CategorySlug;
  label: string;
  /** Supabase table backing this category */
  table:
    | "admissions_gists"
    | "admissions_scholarships"
    | "admissions_deadlines"
    | "admissions_cutoffs"
    | "admissions_nysc";
  /** Whether individual items have their own detail page (slug-based route) */
  hasDetailPage: boolean;
  /** Detail route prefix, e.g. /admissions/gists — only relevant if hasDetailPage */
  detailPathPrefix?: string;
  /** SEO title/description for the archive page */
  archiveTitle: string;
  archiveDescription: string;
}

export const ADMISSIONS_CATEGORIES: CategoryDef[] = [
  {
    slug: "gists",
    label: "School Gists",
    table: "admissions_gists",
    hasDetailPage: true,
    detailPathPrefix: "/admissions/gists",
    archiveTitle: "Nigerian School Gists and Admission Updates",
    archiveDescription:
      "Latest school gists, admission updates, and campus news for Nigerian universities and polytechnics.",
  },
  {
    slug: "scholarships",
    label: "Scholarships",
    table: "admissions_scholarships",
    hasDetailPage: true,
    detailPathPrefix: "/admissions/scholarships",
    archiveTitle: "Scholarships for Nigerian Students",
    archiveDescription:
      "Open and upcoming scholarships for Nigerian students — amounts, deadlines, and how to apply.",
  },
  {
    slug: "deadlines",
    label: "Deadlines",
    table: "admissions_deadlines",
    hasDetailPage: false,
    archiveTitle: "Nigerian University Admission Deadlines",
    archiveDescription:
      "All upcoming admission deadlines for Nigerian universities and polytechnics, updated weekly.",
  },
  {
    slug: "cutoffs",
    label: "Cutoff Marks",
    table: "admissions_cutoffs",
    hasDetailPage: true,
    detailPathPrefix: "/admissions/cutoffs",
    archiveTitle: "Nigerian University Cutoff Marks",
    archiveDescription:
      "JAMB and Post-UTME cutoff marks for Nigerian universities and polytechnics.",
  },
  {
    slug: "nysc",
    label: "NYSC",
    table: "admissions_nysc",
    hasDetailPage: true,
    detailPathPrefix: "/admissions/nysc",
    archiveTitle: "NYSC Mobilization and Camp Updates",
    archiveDescription:
      "Latest NYSC mobilization, batch, and orientation camp updates.",
  },
];

export const CATEGORY_SLUGS = ADMISSIONS_CATEGORIES.map((c) => c.slug);

export function getCategory(slug: string): CategoryDef | undefined {
  return ADMISSIONS_CATEGORIES.find((c) => c.slug === slug);
}

export const PAGE_SIZE = 12;
