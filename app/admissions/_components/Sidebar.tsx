import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ComingUpItem from "./ComingUpItem";
import { Calendar, Flame } from "lucide-react";

interface GistRow {
  id: string;
  slug: string;
  title: string;
  desc: string;
  views: string;
  is_new_this_week: boolean;
}

interface ScholarshipRow {
  id: string;
  slug: string;
  title: string;
  description: string;
}

interface DeadlineRow {
  id: string;
  title: string;
  desc: string;
  deadline_date: string;
}

function SidebarCard({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-base font-extrabold text-[#0d1a0f] flex items-center gap-2">
          {icon && <span className="text-[#4a5e4e]">{icon}</span>}
          {title}
        </h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

/**
 * Persistent right-hand sidebar shared across the Admissions Hub feed and
 * the /admissions/category/[slug] archive pages, so only the left content
 * column changes when navigating between categories.
 */
export default async function AdmissionsSidebar() {
  const [{ data: gistsRaw }, { data: scholarshipsRaw }, { data: deadlinesRaw }] =
    await Promise.all([
      supabase
        .from("admissions_gists")
        .select("id,slug,title,desc,views,is_new_this_week")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("admissions_scholarships")
        .select("id,slug,title,description")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("admissions_deadlines")
        .select("id,title,desc,deadline_date")
        .eq("published", true)
        .order("deadline_date", { ascending: true })
        .limit(4),
    ]);

  const gists = (gistsRaw ?? []) as GistRow[];
  const scholarships = (scholarshipsRaw ?? []) as ScholarshipRow[];
  const deadlines = (deadlinesRaw ?? []) as DeadlineRow[];

  const newThisWeek = gists.find((g) => g.is_new_this_week) ?? null;
  const latestScholarship = scholarships[0] ?? null;
  const trendingGists = gists.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      {newThisWeek ? (
        <div className="bg-[#0d1a0f] rounded-2xl p-6">
          <div className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-widest uppercase text-[#bbf7d0] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
            New This Week
          </div>
          <h3
            className="text-[24px] text-white leading-tight tracking-[-0.5px] mb-2"
            style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
          >
            {newThisWeek.title}
          </h3>
          <p className="text-base text-white/45 leading-relaxed mb-5">
            {newThisWeek.desc}
          </p>
          <Link
            href={`/admissions/gists/${newThisWeek.slug}`}
            className="block text-center text-base font-bold text-[#0d1a0f] bg-white rounded-lg py-3 hover:opacity-90 transition-opacity"
          >
            Read more →
          </Link>
        </div>
      ) : latestScholarship ? (
        <div className="bg-[#0d1a0f] rounded-2xl p-6">
          <div className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-widest uppercase text-[#bbf7d0] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
            New This Week
          </div>
          <h3
            className="text-[24px] text-white leading-tight tracking-[-0.5px] mb-2"
            style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
          >
            {latestScholarship.title}
          </h3>
          <p className="text-base text-white/45 leading-relaxed mb-5">
            {latestScholarship.description}
          </p>
          <Link
            href={`/admissions/scholarships/${latestScholarship.slug}`}
            className="block text-center text-base font-bold text-[#0d1a0f] bg-white rounded-lg py-3 hover:opacity-90 transition-opacity"
          >
            View scholarship →
          </Link>
        </div>
      ) : null}

      {deadlines.length > 0 && (
        <SidebarCard icon={<Calendar size={16} />} title="Coming Up">
          {deadlines.map((d, i, arr) => (
            <div
              key={d.id}
              className={i < arr.length - 1 ? "border-b border-gray-200" : ""}
            >
              <ComingUpItem title={d.title} deadlineDate={d.deadline_date} />
            </div>
          ))}
        </SidebarCard>
      )}

      <div className="bg-green-600 rounded-2xl p-6">
        <div className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-widest uppercase text-green-100 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
          Free Practice
        </div>
        <h3 className="text-[22px] text-white font-extrabold leading-tight tracking-tight mb-2">
          Prep for JAMB &amp; WAEC, right here
        </h3>
        <p className="text-base text-white/70 leading-relaxed mb-5">
          Practice Mode, Past Questions, JAMB Simulator and more. No sign-up
          needed.
        </p>
        <Link
          href="/general"
          className="block text-center text-base font-bold text-green-700 bg-white rounded-lg py-3 hover:opacity-90 transition-opacity"
        >
          Start practising →
        </Link>
      </div>

      {trendingGists.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-extrabold text-[#0d1a0f] flex items-center gap-2">
              <Flame size={15} className="text-orange-500" /> Trending
            </h3>
          </div>
          <div className="px-5 py-1">
            {trendingGists.map((g, i, arr) => (
              <Link
                key={g.id}
                href={`/admissions/gists/${g.slug}`}
                className={`flex items-center gap-3 py-3 no-underline ${i < arr.length - 1 ? "border-b border-gray-200" : ""}`}
              >
                <span className="text-base font-extrabold text-[#9db5a3] w-5 text-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <strong className="text-base font-bold text-[#0d1a0f] block leading-tight">
                    {g.title}
                  </strong>
                  <span className="text-sm text-[#9db5a3]">
                    {g.views} views
                  </span>
                </div>
                <span className="text-[#9db5a3] flex-shrink-0 text-base">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
