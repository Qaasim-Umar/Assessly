import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import {
  CATEGORY_SLUGS,
  type CategorySlug,
} from "@/lib/admissionsCategories";

const BASE_URL = "https://www.assessly.ng";

const STATIC_LAST_MODIFIED = {
  home: "2026-07-29",
  general: "2026-07-18",
  jambPractice: "2026-07-26",
  waecPractice: "2026-07-26",
  postUtmePractice: "2026-07-26",
  privacy: "2026-07-29",
  terms: "2026-07-26",
  about: "2026-07-26",
  contact: "2026-07-26",
  admissions: "2026-07-29",
  questionBank: "2026-07-18",
  practice: "2026-08-25",
  cboCentres: "2026-09-04",
} as const;

interface TimestampedRow {
  created_at: string;
}

function latestModified(
  rows: TimestampedRow[] | null | undefined,
  fallback: string,
): Date {
  let latest = Date.parse(fallback);

  for (const row of rows ?? []) {
    const timestamp = Date.parse(row.created_at);
    if (!Number.isNaN(timestamp) && timestamp > latest) latest = timestamp;
  }

  return new Date(latest);
}

export const revalidate = 3600; // regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    { data: gists },
    { data: scholarships },
    { data: deadlines },
    { data: cutoffs },
    { data: nysc },
    { data: questionPacks },
  ] = await Promise.all([
    supabase
      .from("admissions_gists")
      .select("slug, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("admissions_scholarships")
      .select("slug, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("admissions_deadlines")
      .select("created_at")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("admissions_cutoffs")
      .select("slug, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("admissions_nysc")
      .select("slug, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("question_bank_packs")
      .select("slug, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false }),
  ]);

  const admissionsLastModified = latestModified(
    [
      ...(gists ?? []),
      ...(scholarships ?? []),
      ...(deadlines ?? []),
      ...(cutoffs ?? []),
      ...(nysc ?? []),
    ],
    STATIC_LAST_MODIFIED.admissions,
  );

  const categoryLastModified: Record<CategorySlug, Date> = {
    gists: latestModified(gists, STATIC_LAST_MODIFIED.admissions),
    scholarships: latestModified(
      scholarships,
      STATIC_LAST_MODIFIED.admissions,
    ),
    deadlines: latestModified(deadlines, STATIC_LAST_MODIFIED.admissions),
    cutoffs: latestModified(cutoffs, STATIC_LAST_MODIFIED.admissions),
    nysc: latestModified(nysc, STATIC_LAST_MODIFIED.admissions),
  };

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,                       lastModified: new Date(STATIC_LAST_MODIFIED.home), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/general`,                lastModified: new Date(STATIC_LAST_MODIFIED.general), changeFrequency: "daily",  priority: 0.9 },
    { url: `${BASE_URL}/jamb-practice`,          lastModified: new Date(STATIC_LAST_MODIFIED.jambPractice), changeFrequency: "daily",  priority: 0.85 },
    { url: `${BASE_URL}/waec-practice`,          lastModified: new Date(STATIC_LAST_MODIFIED.waecPractice), changeFrequency: "daily",  priority: 0.85 },
    { url: `${BASE_URL}/post-utme-practice`,     lastModified: new Date(STATIC_LAST_MODIFIED.postUtmePractice), changeFrequency: "daily",  priority: 0.85 },
    { url: `${BASE_URL}/practice`,               lastModified: new Date(STATIC_LAST_MODIFIED.practice), changeFrequency: "daily", priority: 0.85 },
    { url: `${BASE_URL}/practice/study`,         lastModified: new Date(STATIC_LAST_MODIFIED.practice), changeFrequency: "daily", priority: 0.75 },
    { url: `${BASE_URL}/practice/survival`,      lastModified: new Date(STATIC_LAST_MODIFIED.practice), changeFrequency: "daily", priority: 0.75 },
    { url: `${BASE_URL}/practice/mock/jamb`,     lastModified: new Date(STATIC_LAST_MODIFIED.practice), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/practice/past-questions`, lastModified: new Date(STATIC_LAST_MODIFIED.practice), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/privacy`,                lastModified: new Date(STATIC_LAST_MODIFIED.privacy), changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/terms`,                  lastModified: new Date(STATIC_LAST_MODIFIED.terms), changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/about`,                  lastModified: new Date(STATIC_LAST_MODIFIED.about), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`,                lastModified: new Date(STATIC_LAST_MODIFIED.contact), changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/admissions`,             lastModified: admissionsLastModified, changeFrequency: "daily",  priority: 0.85 },
    { url: `${BASE_URL}/admissions/question-bank`, lastModified: latestModified(questionPacks, STATIC_LAST_MODIFIED.questionBank), changeFrequency: "daily", priority: 0.85 },
    { url: `${BASE_URL}/admissions/cbo-centres`, lastModified: new Date(STATIC_LAST_MODIFIED.cboCentres), changeFrequency: "monthly", priority: 0.8 },
  ];

  const admissionsCategoryRoutes: MetadataRoute.Sitemap = CATEGORY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/admissions/category/${slug}`,
    lastModified: categoryLastModified[slug],
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const gistRoutes: MetadataRoute.Sitemap = (gists ?? []).map((g) => ({
    url: `${BASE_URL}/admissions/gists/${g.slug}`,
    lastModified: new Date(g.created_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const scholarshipRoutes: MetadataRoute.Sitemap = (scholarships ?? []).map((s) => ({
    url: `${BASE_URL}/admissions/scholarships/${s.slug}`,
    lastModified: new Date(s.created_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const cutoffRoutes: MetadataRoute.Sitemap = (cutoffs ?? []).map((c) => ({
    url: `${BASE_URL}/admissions/cutoffs/${c.slug}`,
    lastModified: new Date(c.created_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const nyscRoutes: MetadataRoute.Sitemap = (nysc ?? []).map((n) => ({
    url: `${BASE_URL}/admissions/nysc/${n.slug}`,
    lastModified: new Date(n.created_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const questionPackRoutes: MetadataRoute.Sitemap = (questionPacks ?? []).map((pack) => ({
    url: `${BASE_URL}/admissions/question-bank/${pack.slug}`,
    lastModified: new Date(pack.created_at),
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [
    ...staticRoutes,
    ...admissionsCategoryRoutes,
    ...gistRoutes,
    ...scholarshipRoutes,
    ...cutoffRoutes,
    ...nyscRoutes,
    ...questionPackRoutes,
  ];
}
