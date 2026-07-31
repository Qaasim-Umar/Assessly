import type { Metadata } from "next";
import AdmissionsHub, {
  type DbCutoff,
  type DbDeadline,
  type DbGist,
  type DbNysc,
  type DbScholarship,
  type TabId,
} from "./_components/AdmissionsHub";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import "../landing/landing.css";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Admissions Hub",
  description:
    "Current Nigerian university admission updates, scholarships, deadlines, cutoff marks, and NYSC information.",
  alternates: { canonical: "https://www.assessly.ng/admissions" },
};

const TAB_IDS: TabId[] = [
  "all",
  "gists",
  "scholarships",
  "deadlines",
  "cutoffs",
  "nysc",
];

function parseTab(value: string | string[] | undefined): TabId {
  const tab = Array.isArray(value) ? value[0] : value;
  return TAB_IDS.includes(tab as TabId) ? (tab as TabId) : "all";
}

export default async function AdmissionsHubPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = createServerSupabaseClient();
  const params = await searchParams;

  const [gistsResult, scholarshipsResult, deadlinesResult, cutoffsResult, nyscResult] =
    await Promise.all([
      supabase
        .from("admissions_gists")
        .select(
          "id,slug,tag,tag_color,title,date_label,school,views,reactions,is_trending,is_featured,is_new_this_week",
        )
        .eq("published", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("admissions_scholarships")
        .select(
          "id,slug,title,amount_label,deadline_label,category,is_open",
        )
        .eq("published", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("admissions_deadlines")
        .select("id,title,deadline_date")
        .eq("published", true)
        .order("deadline_date", { ascending: true }),
      supabase
        .from("admissions_cutoffs")
        .select("id,slug,school")
        .eq("published", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("admissions_nysc")
        .select("id,slug,title,batch_label")
        .eq("published", true)
        .order("created_at", { ascending: false }),
    ]);

  const firstError = [
    gistsResult.error,
    scholarshipsResult.error,
    deadlinesResult.error,
    cutoffsResult.error,
    nyscResult.error,
  ].find(Boolean);

  if (firstError) {
    throw new Error(`Unable to load admissions content: ${firstError.message}`);
  }

  return (
    <AdmissionsHub
      activeTab={parseTab(params.tab)}
      gists={(gistsResult.data ?? []) as DbGist[]}
      scholarships={(scholarshipsResult.data ?? []) as DbScholarship[]}
      deadlines={(deadlinesResult.data ?? []) as DbDeadline[]}
      cutoffs={(cutoffsResult.data ?? []) as DbCutoff[]}
      nysc={(nyscResult.data ?? []) as DbNysc[]}
    />
  );
}
