import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const BASE_URL = "https://www.assessly.ng";

export const revalidate = 3600; // regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: gists }, { data: scholarships }] = await Promise.all([
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
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,          lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/general`,   lastModified: new Date(), changeFrequency: "daily",  priority: 0.9 },
    { url: `${BASE_URL}/admissions`,lastModified: new Date(), changeFrequency: "daily",  priority: 0.85 },
    { url: `${BASE_URL}/general/category/waec`,      lastModified: new Date(), changeFrequency: "daily", priority: 0.85 },
    { url: `${BASE_URL}/general/category/jamb-utme`, lastModified: new Date(), changeFrequency: "daily", priority: 0.85 },
    { url: `${BASE_URL}/general/category/neco`,      lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/general/category/bece`,      lastModified: new Date(), changeFrequency: "daily", priority: 0.75 },
    { url: `${BASE_URL}/general/category/post-utme`, lastModified: new Date(), changeFrequency: "daily", priority: 0.75 },
    { url: `${BASE_URL}/general/category/mock`,      lastModified: new Date(), changeFrequency: "daily", priority: 0.75 },
    { url: `${BASE_URL}/login`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

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

  return [...staticRoutes, ...gistRoutes, ...scholarshipRoutes];
}
