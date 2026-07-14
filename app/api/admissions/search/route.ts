import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Escape % and _ so they aren't treated as ILIKE wildcards by user input
  const escaped = q.replace(/[%_]/g, (c) => `\\${c}`);
  const pattern = `%${escaped}%`;

  const [gists, scholarships, deadlines, cutoffs, nysc] = await Promise.all([
    supabase
      .from("admissions_gists")
      .select("id, title, slug")
      .eq("published", true)
      .ilike("title", pattern)
      .limit(5),
    supabase
      .from("admissions_scholarships")
      .select("id, title, slug")
      .eq("published", true)
      .ilike("title", pattern)
      .limit(5),
    supabase
      .from("admissions_deadlines")
      .select("id, title")
      .eq("published", true)
      .ilike("title", pattern)
      .limit(5),
    supabase
      .from("admissions_cutoffs")
      .select("id, school, slug")
      .eq("published", true)
      .ilike("school", pattern)
      .limit(5),
    supabase
      .from("admissions_nysc")
      .select("id, title, slug")
      .eq("published", true)
      .ilike("title", pattern)
      .limit(5),
  ]);

  const results = [
    ...(gists.data ?? []).map((r) => ({ id: r.id, title: r.title, slug: r.slug, type: "gist" as const })),
    ...(scholarships.data ?? []).map((r) => ({ id: r.id, title: r.title, slug: r.slug, type: "scholarship" as const })),
    ...(deadlines.data ?? []).map((r) => ({ id: r.id, title: r.title, slug: null, type: "deadline" as const })),
    ...(cutoffs.data ?? []).map((r) => ({ id: r.id, title: r.school, slug: r.slug, type: "cutoff" as const })),
    ...(nysc.data ?? []).map((r) => ({ id: r.id, title: r.title, slug: r.slug, type: "nysc" as const })),
  ];

  return NextResponse.json({ results });
}
