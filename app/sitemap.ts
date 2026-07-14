import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { CATEGORY_SLUGS } from "@/lib/admissionsCategories";

const BASE_URL = "https://www.assessly.ng";

export const revalidate = 3600; // regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    { data: gists },
    { data: scholarships },
    { data: cutoffs },
    { data: nysc },
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
      .from("admissions_cutoffs")
      .select("slug, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("admissions_nysc")
      .select("slug, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,                       lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/general`,                lastModified: new Date(), changeFrequency: "daily",  priority: 0.9 },
    { url: `${BASE_URL}/admissions`,              lastModified: new Date(), changeFrequency: "daily",  priority: 0.85 },
    { url: `${BASE_URL}/admissions/question-bank`,lastModified: new Date(), changeFrequency: "daily",  priority: 0.85 },
    { url: `${BASE_URL}/login`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  const admissionsCategoryRoutes: MetadataRoute.Sitemap = CATEGORY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/admissions/category/${slug}`,
    lastModified: new Date(),
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

  return [
    ...staticRoutes,
    ...admissionsCategoryRoutes,
    ...gistRoutes,
    ...scholarshipRoutes,
    ...cutoffRoutes,
    ...nyscRoutes,
  ];
}
