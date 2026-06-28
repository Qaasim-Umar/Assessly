import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import TabBar from "./_components/TabBar";
import FilterBar from "./_components/FilterBar";
import ReactionBar from "./_components/ReactionBar";
import InlineMarkdown from "@/components/InlineMarkdown";
import LiveTicker from "./_components/LiveTicker";
import SearchBar from "./_components/SearchBar";
import { supabase } from "@/lib/supabase";
import { Newspaper, Trophy, Calendar, Eye, Building2, Flame } from "lucide-react";
import "../landing/landing.css";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Admissions Hub | Assessly — Nigerian University Scholarships & Deadlines",
  description:
    "Find Nigerian university scholarships, admission deadlines, cut-off marks, and school gists. Shell, FGN, MTN scholarships and JAMB CAPS deadlines — all updated weekly.",
  keywords: [
    "Nigerian university scholarships",
    "JAMB CAPS",
    "UNILAG Post-UTME",
    "university admission deadlines Nigeria",
    "Shell Nigeria scholarship",
    "OAU admission list",
    "university cut-off marks",
  ],
  openGraph: {
    title: "Admissions Hub | Assessly",
    description:
      "Scholarships, admission deadlines, cut-off marks, and school gists for Nigerian university applicants — all in one place.",
    type: "website",
    url: "https://www.assessly.ng/admissions",
  },
  twitter: {
    card: "summary_large_image",
    title: "Admissions Hub | Assessly",
    description: "Nigerian university scholarships, JAMB deadlines, and school gists — updated weekly.",
  },
  alternates: { canonical: "https://www.assessly.ng/admissions" },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface DbGist {
  id: string;
  slug: string;
  tag: string;
  tag_color: string;
  title: string;
  desc: string;
  date_label: string;
  school: string;
  views: string;
  reactions: { fire: number; shock: number; check: number; think: number };
  is_trending: boolean;
  is_featured: boolean;
  is_new_this_week: boolean;
}

interface DbScholarship {
  id: string;
  slug: string;
  icon: string;
  icon_bg: string;
  title: string;
  description: string;
  amount_label: string;
  deadline_label: string;
  days_left: string;
  category: string;
  is_open: boolean;
}

interface DbDeadline {
  id: string;
  title: string;
  desc: string;
  day_label: string;
  month_label: string;
  urgency: "urgent" | "soon" | "open";
  badge: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GistCard({
  slug, tag, tagColor, title, desc, date, reactions, gistId,
}: {
  slug: string; tag: string; tagColor: string; title: string;
  desc: string; date: string;
  reactions: { fire: number; shock: number; check: number; think: number };
  gistId: string;
}) {
  return (
    <a
      href={`/admissions/gists/${slug}`}
      className="bg-white border border-gray-300 rounded-[18px] p-5 block cursor-pointer hover:border-green-200 hover:shadow-[0_4px_20px_rgba(22,163,74,0.08)] hover:-translate-y-0.5 transition-all"
      data-ph-capture-attribute-item-type="gist"
      data-ph-capture-attribute-item-title={title}
      data-ph-capture-attribute-item-tag={tag}
    >
      <span className={`text-[13px] font-extrabold tracking-wide uppercase mb-2.5 block ${tagColor}`}>{tag}</span>
      <h3 className="text-[19px] font-bold text-[#0d1a0f] leading-snug mb-2">{title}</h3>
      <p className="text-base text-[#4a5e4e] leading-relaxed mb-3.5"><InlineMarkdown content={desc} /></p>
      <span className="text-sm text-[#9db5a3]">{date}</span>
      <ReactionBar initial={reactions} gistId={gistId} />
    </a>
  );
}

function ScholarshipCard({
  slug, icon, iconBg, title, desc, tags, open, dimmed = false,
}: {
  slug: string; icon: string; iconBg: string; title: string; desc: string;
  tags: { label: string; style: string }[]; open: boolean; dimmed?: boolean;
}) {
  return (
    <a
      href={`/admissions/scholarships/${slug}`}
      className={`bg-white border border-gray-300 rounded-[18px] p-5 sm:p-6 grid grid-cols-[auto_1fr_auto] gap-4 items-start transition-all hover:border-amber-200 hover:shadow-[0_4px_20px_rgba(217,119,6,0.08)] cursor-pointer ${dimmed ? "opacity-60" : ""}`}
      data-ph-capture-attribute-item-type="scholarship"
      data-ph-capture-attribute-item-title={title}
      data-ph-capture-attribute-item-open={open ? "yes" : "no"}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${iconBg}`}>{icon}</div>
      <div>
        <h3 className="text-[19px] font-bold text-[#0d1a0f] mb-1.5">{title}</h3>
        <p className="text-base text-[#4a5e4e] leading-relaxed mb-2.5"><InlineMarkdown content={desc} /></p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <span key={i} className={`text-[13px] font-bold px-2.5 py-1 rounded-full ${t.style}`}>{t.label}</span>
          ))}
        </div>
      </div>
      <div className="hidden sm:flex items-end flex-shrink-0">
        {open ? (
          <span className="text-base font-bold text-white bg-amber-500 rounded-lg px-4 py-2">Apply Now</span>
        ) : (
          <span className="text-base font-bold text-[#9db5a3] bg-[#f7faf8] rounded-lg px-4 py-2">Closed</span>
        )}
      </div>
    </a>
  );
}

const URGENCY_STYLES = {
  urgent: { block: "bg-rose-100 border border-rose-200", text: "text-rose-600", badge: "bg-rose-100 text-rose-600" },
  soon:   { block: "bg-amber-100 border border-amber-200", text: "text-amber-600", badge: "bg-amber-100 text-amber-600" },
  open:   { block: "bg-green-100 border border-green-200", text: "text-green-600", badge: "bg-green-100 text-green-700" },
};

function DeadlineCard({ day, month, urgency, title, desc, badge }: {
  day: string; month: string; urgency: "urgent" | "soon" | "open";
  title: string; desc: string; badge: string;
}) {
  const s = URGENCY_STYLES[urgency] ?? URGENCY_STYLES.open;
  return (
    <div className="bg-white border border-gray-300 rounded-[18px] px-5 py-4 grid grid-cols-[auto_1fr_auto] gap-4 items-center hover:border-green-200 transition-colors cursor-pointer">
      <div className={`w-[60px] h-[60px] rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${s.block}`}>
        <span className={`text-2xl font-extrabold leading-none ${s.text}`}>{day}</span>
        <span className={`text-[12px] font-extrabold tracking-wide uppercase ${s.text}`}>{month}</span>
      </div>
      <div>
        <h3 className="text-base font-bold text-[#0d1a0f] mb-0.5">{title}</h3>
        <p className="text-base text-[#4a5e4e]"><InlineMarkdown content={desc} /></p>
      </div>
      <span className={`text-[13px] font-extrabold tracking-wide px-3 py-1.5 rounded-full flex-shrink-0 ${s.badge}`}>{badge}</span>
    </div>
  );
}

function SidebarCard({ icon, title, action, children }: {
  icon?: React.ReactNode; title: string; action?: { label: string; href: string }; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-base font-extrabold text-[#0d1a0f] flex items-center gap-2">
          {icon && <span className="text-[#4a5e4e]">{icon}</span>}{title}
        </h3>
        {action && <a href={action.href} className="text-sm font-bold text-green-600">{action.label}</a>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdmissionsHubPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const gistsQuery = supabase
    .from("admissions_gists")
    .select("id,slug,tag,tag_color,title,desc,date_label,school,views,reactions,is_trending,is_featured,is_new_this_week")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const scholarshipsQuery = supabase
    .from("admissions_scholarships")
    .select("id,slug,icon,icon_bg,title,description,amount_label,deadline_label,days_left,category,is_open")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const deadlinesQuery = supabase
    .from("admissions_deadlines")
    .select("id,title,desc,day_label,month_label,urgency,badge")
    .eq("published", true)
    .order("deadline_date", { ascending: true });

  if (query) {
    gistsQuery.or(`title.ilike.%${query}%,desc.ilike.%${query}%`);
    scholarshipsQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    deadlinesQuery.or(`title.ilike.%${query}%,desc.ilike.%${query}%`);
  }

  const [{ data: gistsRaw }, { data: scholarshipsRaw }, { data: deadlinesRaw }] = await Promise.all([
    gistsQuery,
    scholarshipsQuery,
    deadlinesQuery,
  ]);

  const gists: DbGist[] = (gistsRaw ?? []) as DbGist[];
  const scholarships: DbScholarship[] = (scholarshipsRaw ?? []) as DbScholarship[];
  const deadlines: DbDeadline[] = (deadlinesRaw ?? []) as DbDeadline[];

  const featuredGist = query ? null : (gists.find(g => g.is_featured) ?? gists[0] ?? null);
  const regularGists = gists.filter(g => g.id !== featuredGist?.id);
  const newThisWeek = gists.find(g => g.is_new_this_week) ?? null;
  const trendingGists = [...gists].slice(0, 5);

  const dotColor: Record<string, string> = { urgent: "bg-rose-500", soon: "bg-amber-500", open: "bg-green-500" };

  function scholarshipTags(s: DbScholarship): { label: string; style: string }[] {
    const tags: { label: string; style: string }[] = [];
    if (s.amount_label) tags.push({ label: s.amount_label, style: "bg-amber-100 text-amber-600" });
    if (s.deadline_label) tags.push({ label: s.deadline_label, style: "bg-rose-100 text-rose-600" });
    tags.push(s.is_open
      ? { label: "Open Now", style: "bg-green-100 text-green-700" }
      : { label: "Closed", style: "bg-gray-100 text-gray-400" });
    if (s.category) tags.push({ label: s.category, style: "bg-blue-100 text-blue-600" });
    return tags;
  }

  return (
    <>
      <style>{`
        @keyframes ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .ticker-anim { animation: ticker 22s -8s linear infinite; }
      `}</style>

      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#0d1a0f] relative overflow-hidden pt-14 px-6">
        <div className="absolute right-[-80px] top-[-80px] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)" }} />

        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto] items-end gap-10">
          <div>
            <div className="inline-flex items-center gap-2 text-[13px] font-extrabold tracking-widest uppercase text-[#bbf7d0] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              Admissions Hub
            </div>
            <h1 className="text-[clamp(40px,5vw,68px)] text-white leading-[1.08] tracking-[-1.5px] mb-3.5" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Your path to <em className="not-italic text-green-500">university</em>, sorted.
            </h1>
            <p className="text-lg text-white/45 max-w-[520px] leading-relaxed">
              Scholarships, admission deadlines, school gists, and everything else you need, in one place. Updated weekly.
            </p>
          </div>

          <div className="flex flex-row gap-6 pb-10 self-center">
            {[
              { num: scholarships.length.toString(), label: "Scholarships" },
              { num: deadlines.length.toString(), label: "Deadlines" },
            ].map((s, i, arr) => (
              <div key={s.label} className={`text-right ${i < arr.length - 1 ? "pr-6 border-r border-white/10" : ""}`}>
                <span className="block text-3xl font-extrabold text-white tracking-tight leading-none">{s.num}</span>
                <span className="text-[13px] font-semibold text-white/30 uppercase tracking-wide">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ticker */}
        <div className="max-w-[1100px] mx-auto mt-8 flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 overflow-hidden">
          <span className="text-[12px] font-extrabold tracking-widest uppercase text-rose-600 bg-rose-100 px-2 py-1 rounded flex-shrink-0">LIVE</span>
          <LiveTicker />
        </div>

        <TabBar counts={{
          all: gists.length + scholarships.length + deadlines.length,
          gists: gists.length,
          scholarships: scholarships.length,
          deadlines: deadlines.length,
        }} />
      </div>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1100px] mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start bg-[#f7faf8] min-h-screen">

        {/* FEED */}
        <div>
          <SearchBar />

          {query && (
            <p className="text-sm text-[#4a5e4e] mb-5">
              Showing results for <span className="font-bold text-[#0d1a0f]">&ldquo;{query}&rdquo;</span>
              {" · "}{gists.length + scholarships.length + deadlines.length} found
            </p>
          )}

          {!query && <FilterBar />}

          {/* ── SCHOOL GISTS ── */}
          <section className="mb-12" aria-label="School Gists">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600"><Newspaper size={20} /></div>
                <h2 className="text-[26px] tracking-[-0.5px] text-[#0d1a0f]" style={{ fontFamily: "'Lora', Georgia, serif" }}>School Gists</h2>
              </div>
              <a href="#" className="text-base font-bold text-green-600 hover:underline">See all →</a>
            </div>

            {/* Featured gist */}
            {featuredGist ? (
              <a
              href={`/admissions/gists/${featuredGist.slug}`}
              className="bg-[#0d1a0f] rounded-2xl overflow-hidden mb-4 min-h-[260px] cursor-pointer hover:-translate-y-0.5 transition-transform block"
              data-ph-capture-attribute-item-type="featured_gist"
              data-ph-capture-attribute-item-title={featuredGist.title}
              data-ph-capture-attribute-item-school={featuredGist.school}
            >
                <div className="p-8 flex flex-col justify-between h-full">
                  <div>
                    {featuredGist.is_trending && (
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide uppercase text-green-500 bg-green-500/15 px-2.5 py-1 rounded-full mb-4">
                        <Flame size={13} /> Trending
                      </span>
                    )}
                    <h3 className="text-[26px] text-white leading-tight tracking-[-0.5px] mb-2.5" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                      {featuredGist.title}
                    </h3>
                    <p className="text-base text-white/50 leading-relaxed mb-5">{featuredGist.desc}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 text-sm text-white/35 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar size={13} /> {featuredGist.date_label}</span>
                      <span className="flex items-center gap-1"><Eye size={13} /> {featuredGist.views} views</span>
                      <span className="flex items-center gap-1"><Building2 size={13} /> {featuredGist.school}</span>
                    </div>
                    <ReactionBar initial={featuredGist.reactions} dark gistId={featuredGist.id} />
                  </div>
                </div>
              </a>
            ) : (
              <div className="bg-[#0d1a0f]/10 border-2 border-dashed border-[#0d1a0f]/20 rounded-2xl p-8 mb-4 text-center">
                <p className="text-[#4a5e4e]">No gists published yet. Add some in the admin dashboard.</p>
              </div>
            )}

            {/* Gist grid */}
            {regularGists.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {regularGists.slice(0, 4).map(g => (
                  <GistCard
                    key={g.id}
                    slug={g.slug}
                    tag={g.tag}
                    tagColor={g.tag_color}
                    title={g.title}
                    desc={g.desc}
                    date={g.date_label}
                    reactions={g.reactions}
                    gistId={g.id}
                  />
                ))}
              </div>
            )}

            {regularGists.length > 4 && (
              <div className="text-center mt-6">
                <button className="text-base font-bold text-[#4a5e4e] bg-white border border-gray-300 rounded-lg px-7 py-3 hover:border-green-400 hover:text-green-600 transition-all">
                  Load more gists
                </button>
              </div>
            )}
          </section>

          {/* ── SCHOLARSHIPS ── */}
          <section className="mb-12" aria-label="Scholarships">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600"><Trophy size={20} /></div>
                <h2 className="text-[26px] tracking-[-0.5px] text-[#0d1a0f]" style={{ fontFamily: "'Lora', Georgia, serif" }}>Scholarships</h2>
              </div>
              <a href="#" className="text-base font-bold text-green-600 hover:underline">See all →</a>
            </div>

            {scholarships.length > 0 ? (
              <div className="flex flex-col gap-3.5">
                {scholarships.map(s => (
                  <ScholarshipCard
                    key={s.id}
                    slug={s.slug}
                    icon={s.icon}
                    iconBg={s.icon_bg}
                    title={s.title}
                    desc={s.description}
                    tags={scholarshipTags(s)}
                    open={s.is_open}
                    dimmed={!s.is_open}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                <p className="text-[#9db5a3]">No scholarships published yet.</p>
              </div>
            )}
          </section>

          {/* ── DEADLINES ── */}
          <section className="mb-12" aria-label="Admission Deadlines">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600"><Calendar size={20} /></div>
                <h2 className="text-[26px] tracking-[-0.5px] text-[#0d1a0f]" style={{ fontFamily: "'Lora', Georgia, serif" }}>Admission Deadlines</h2>
              </div>
              <a href="#" className="text-base font-bold text-green-600 hover:underline">See all →</a>
            </div>

            {deadlines.length > 0 ? (
              <div className="flex flex-col gap-3">
                {deadlines.map(d => (
                  <DeadlineCard
                    key={d.id}
                    day={d.day_label}
                    month={d.month_label}
                    urgency={d.urgency}
                    title={d.title}
                    desc={d.desc}
                    badge={d.badge}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                <p className="text-[#9db5a3]">No deadlines published yet.</p>
              </div>
            )}
          </section>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="flex flex-col gap-6">

          {/* New This Week */}
          {newThisWeek ? (
            <div className="bg-[#0d1a0f] rounded-2xl p-6">
              <div className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-widest uppercase text-[#bbf7d0] mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                New This Week
              </div>
              <h3 className="text-[24px] text-white leading-tight tracking-[-0.5px] mb-2" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                {newThisWeek.title}
              </h3>
              <p className="text-base text-white/45 leading-relaxed mb-5">{newThisWeek.desc}</p>
              <a href={`/admissions/gists/${newThisWeek.slug}`} className="block text-center text-base font-bold text-[#0d1a0f] bg-white rounded-lg py-3 hover:opacity-90 transition-opacity">
                Read more →
              </a>
            </div>
          ) : scholarships.find(s => s.is_open) ? (
            // Fallback: show latest open scholarship
            (() => {
              const s = scholarships.find(sc => sc.is_open)!;
              return (
                <div className="bg-[#0d1a0f] rounded-2xl p-6">
                  <div className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-widest uppercase text-[#bbf7d0] mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    New This Week
                  </div>
                  <h3 className="text-[24px] text-white leading-tight tracking-[-0.5px] mb-2" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                    {s.title}
                  </h3>
                  <p className="text-base text-white/45 leading-relaxed mb-5">
                    {s.amount_label && `${s.amount_label} · `}{s.deadline_label}
                  </p>
                  <a href={`/admissions/scholarships/${s.slug}`} className="block text-center text-base font-bold text-[#0d1a0f] bg-white rounded-lg py-3 hover:opacity-90 transition-opacity">
                    View scholarship →
                  </a>
                </div>
              );
            })()
          ) : null}

          {/* Coming Up */}
          {deadlines.length > 0 && (
            <SidebarCard icon={<Calendar size={16} />} title="Coming Up" action={{ label: "All deadlines", href: "#" }}>
              {deadlines.slice(0, 4).map((d, i, arr) => (
                <div key={d.id} className={`flex items-start gap-3 py-3 ${i < arr.length - 1 ? "border-b border-gray-200" : ""}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${dotColor[d.urgency] ?? "bg-gray-400"}`} />
                  <div>
                    <strong className="text-base font-bold text-[#0d1a0f] block">{d.title}</strong>
                    <span className="text-sm text-[#9db5a3]">{d.badge}</span>
                  </div>
                </div>
              ))}
            </SidebarCard>
          )}

          {/* Trending */}
          {trendingGists.length > 0 && (
            <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="text-base font-extrabold text-[#0d1a0f] flex items-center gap-2"><Flame size={15} className="text-orange-500" /> Trending</h3>
              </div>
              <div className="px-5 py-1">
                {trendingGists.map((g, i, arr) => (
                  <a key={g.id} href={`/admissions/gists/${g.slug}`} className={`flex items-center gap-3 py-3 no-underline ${i < arr.length - 1 ? "border-b border-gray-200" : ""}`}
                    data-ph-capture-attribute-item-type="trending_gist"
                    data-ph-capture-attribute-item-title={g.title}
                    data-ph-capture-attribute-item-rank={(i + 1).toString()}
                  >
                    <span className="text-base font-extrabold text-[#9db5a3] w-5 text-center flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <strong className="text-base font-bold text-[#0d1a0f] block leading-tight">{g.title}</strong>
                      <span className="text-sm text-[#9db5a3]">{g.views} views</span>
                    </div>
                    <span className="text-[#9db5a3] flex-shrink-0 text-base">→</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
