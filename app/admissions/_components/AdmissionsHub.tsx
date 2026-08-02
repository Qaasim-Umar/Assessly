import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import FilterBar from "./FilterBar";
import ReactionBar from "./ReactionBar";
import SearchBar from "./SearchBar";
import { computeDeadlineFromDate } from "@/lib/deadline";
import {
  ArrowRight,
  Newspaper,
  Trophy,
  Calendar,
  Eye,
  Building2,
  Flame,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DbGist {
  id: string;
  slug: string;
  tag: string;
  tag_color: string;
  title: string;
  date_label: string;
  school: string;
  views: string;
  reactions: { fire: number; shock: number; check: number; think: number };
  is_trending: boolean;
  is_featured: boolean;
  is_new_this_week: boolean;
}

export interface DbScholarship {
  id: string;
  slug: string;
  title: string;
  description: string;
}

export interface DbDeadline {
  id: string;
  title: string;
  deadline_date: string;
}

export interface DbCutoff {
  id: string;
  slug: string;
  school: string;
}

export interface DbNysc {
  id: string;
  slug: string;
  title: string;
  batch_label: string | null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GistCard({
  slug,
  tag,
  tagColor,
  title,
  date,
  reactions,
  gistId,
}: {
  slug: string;
  tag: string;
  tagColor: string;
  title: string;
  date: string;
  reactions: { fire: number; shock: number; check: number; think: number };
  gistId: string;
}) {
  return (
    <article
      className="bg-transparent px-0 py-1 sm:bg-white sm:border sm:border-[#e2ede6] sm:rounded-2xl sm:p-5 sm:hover:border-green-200 sm:hover:shadow-[0_4px_20px_rgba(22,163,74,0.08)] transition-[border-color,box-shadow]"
      data-ph-capture-attribute-item-type="gist"
      data-ph-capture-attribute-item-title={title}
      data-ph-capture-attribute-item-tag={tag}
    >
      <a
        href={`/admissions/gists/${slug}`}
        className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
      >
        <h3 className="text-[18px] sm:text-[19px] font-bold text-[#0d1a0f] leading-snug">
          {title}
        </h3>
      </a>
      <div className="flex min-h-11 items-center justify-between gap-2">
        <a
          href={`/admissions/gists/${slug}`}
          className="flex min-w-0 items-center gap-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
        >
          <span className={`max-w-[110px] truncate text-[11px] sm:text-[12px] font-extrabold tracking-wide uppercase ${tagColor}`}>
            {tag}
          </span>
          <span className="text-[#9db5a3]" aria-hidden="true">·</span>
          <span className="shrink-0 whitespace-nowrap text-[12px] sm:text-sm text-[#6f8374]">
            {date}
          </span>
        </a>
        <ReactionBar initial={reactions} compact gistId={gistId} />
      </div>
    </article>
  );
}

function SectionLink({ href, label = "See all" }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-1 text-sm sm:text-base font-bold text-green-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
    >
      {label}
      <ArrowRight size={16} aria-hidden="true" />
    </a>
  );
}

function ScholarshipCard({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={`/admissions/scholarships/${slug}`}
      className="bg-white border border-[#e2ede6] rounded-2xl p-5 sm:p-6 grid grid-cols-[auto_1fr_auto] gap-4 items-start transition-[border-color,box-shadow] hover:border-amber-200 hover:shadow-[0_4px_20px_rgba(217,119,6,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
      data-ph-capture-attribute-item-type="scholarship"
      data-ph-capture-attribute-item-title={title}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-100 text-amber-600">
        <Trophy size={22} aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-[19px] font-bold text-[#0d1a0f] mb-1.5">{title}</h3>
        <p className="text-base leading-relaxed text-[#4a5e4e]">{description}</p>
      </div>
      <div className="hidden sm:flex items-end flex-shrink-0">
        <span className="inline-flex min-h-11 items-center gap-1 text-base font-bold text-amber-700 bg-amber-50 rounded-lg px-4 py-2">
          View details <ArrowRight size={16} aria-hidden="true" />
        </span>
      </div>
    </a>
  );
}

const URGENCY_STYLES = {
  urgent: {
    block: "bg-rose-100 border border-rose-200",
    text: "text-rose-600",
    badge: "bg-rose-100 text-rose-600",
  },
  soon: {
    block: "bg-amber-100 border border-amber-200",
    text: "text-amber-600",
    badge: "bg-amber-100 text-amber-600",
  },
  open: {
    block: "bg-green-100 border border-green-200",
    text: "text-green-600",
    badge: "bg-green-100 text-green-700",
  },
};

function DeadlineCard({
  deadlineDate,
  title,
}: {
  deadlineDate: string;
  title: string;
}) {
  const {
    day_label: day,
    month_label: month,
    urgency,
    badge,
  } = computeDeadlineFromDate(deadlineDate);
  const s = URGENCY_STYLES[urgency] ?? URGENCY_STYLES.open;
  return (
    <div className="bg-white border border-[#e2ede6] rounded-xl px-3 py-2.5 sm:px-4 hover:border-green-200 transition-colors">
      <div className="grid grid-cols-[48px_minmax(0,1fr)_auto] gap-3 items-center">
        <div
          className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${s.block}`}
        >
          <span className={`text-lg font-extrabold leading-none ${s.text}`}>
            {day}
          </span>
          <span
            className={`text-[10px] font-extrabold tracking-wide uppercase ${s.text}`}
          >
            {month}
          </span>
        </div>
        <h3 className="min-w-0 text-sm sm:text-base font-bold leading-snug text-[#0d1a0f]">{title}</h3>
        <span
          className={`text-[11px] sm:text-xs font-extrabold tracking-wide px-2 py-1 rounded-full flex-shrink-0 ${s.badge}`}
        >
          {badge}
        </span>
      </div>
    </div>
  );
}

function SidebarCard({
  icon,
  title,
  action,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-base font-extrabold text-[#0d1a0f] flex items-center gap-2">
          {icon && <span className="text-[#4a5e4e]">{icon}</span>}
          {title}
        </h3>
        {action && (
          <a href={action.href} className="text-sm font-bold text-green-600">
            {action.label}
          </a>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function ComingUpItem({
  title,
  deadlineDate,
}: {
  title: string;
  deadlineDate: string;
}) {
  const { urgency, badge } = computeDeadlineFromDate(deadlineDate);
  const dotColor: Record<string, string> = {
    urgent: "bg-rose-500",
    soon: "bg-amber-500",
    open: "bg-green-500",
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${dotColor[urgency] ?? "bg-gray-400"}`}
      />
      <div>
        <strong className="text-base font-bold text-[#0d1a0f] block">
          {title}
        </strong>
        <span className="text-sm text-[#9db5a3]">{badge}</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export type TabId =
  | "all"
  | "gists"
  | "scholarships"
  | "deadlines"
  | "cutoffs"
  | "nysc";

export default function AdmissionsHub({
  activeTab,
  gists,
  scholarships,
  deadlines,
  cutoffs,
  nysc,
}: {
  activeTab: TabId;
  gists: DbGist[];
  scholarships: DbScholarship[];
  deadlines: DbDeadline[];
  cutoffs: DbCutoff[];
  nysc: DbNysc[];
}) {

  const featuredGist = gists.find((g) => g.is_featured) ?? gists[0] ?? null;
  const regularGists = gists.filter((g) => g.id !== featuredGist?.id);
  const newThisWeek = gists.find((g) => g.is_new_this_week) ?? null;
  const trendingGists = [...gists].slice(0, 5);

  // Filter content based on active tab
  const showGists = activeTab === "all" || activeTab === "gists";
  const showScholarships = activeTab === "all" || activeTab === "scholarships";
  const showDeadlines = activeTab === "all" || activeTab === "deadlines";
  const showCutoffs = activeTab === "all" || activeTab === "cutoffs";
  const showNysc = activeTab === "all" || activeTab === "nysc";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nigerian University Admission Deadlines",
    description:
      "Upcoming admission deadlines for Nigerian universities, updated weekly.",
    url: "https://www.assessly.ng/admissions",
    numberOfItems: deadlines.length,
    itemListElement: deadlines.map((d, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Event",
        name: d.title,
        description: `Admission deadline for ${d.title}.`,
        url: "https://www.assessly.ng/admissions",
        eventStatus: "https://schema.org/EventScheduled",
        organizer: {
          "@type": "Organization",
          name: "Assessly",
          url: "https://www.assessly.ng",
        },
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#0d1a0f] relative overflow-hidden pt-14 px-6">
        <div
          className="absolute right-[-80px] top-[-80px] w-96 h-96 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto] items-end gap-10">
          <div>
            <div className="inline-flex items-center gap-2 text-[13px] font-extrabold tracking-widest uppercase text-[#bbf7d0] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              Admissions Hub
            </div>
            <h1
              className="text-[clamp(40px,5vw,68px)] text-white leading-[1.08] tracking-[-1.5px] mb-3.5"
              style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
            >
              Your path to{" "}
              <em className="not-italic text-green-500">university</em>, sorted.
            </h1>
            <p className="text-lg text-white/45 max-w-[520px] leading-relaxed">
              Scholarships, admission deadlines, school gists, and everything
              else you need, in one place. Updated weekly.
            </p>
          </div>

          <div className="flex flex-row gap-6 pb-10 self-center">
            {[
              {
                num: (
                  gists.length +
                  scholarships.length +
                  cutoffs.length +
                  nysc.length
                ).toString(),
                label: "Published updates",
              },
              { num: deadlines.length.toString(), label: "Deadlines" },
            ]
              .filter((stat) => Number(stat.num) > 0)
              .map((s, i, arr) => (
              <div
                key={s.label}
                className={`text-right ${i < arr.length - 1 ? "pr-6 border-r border-white/10" : ""}`}
              >
                <span className="block text-3xl font-extrabold text-white tracking-tight leading-none">
                  {s.num}
                </span>
                <span className="text-[13px] font-semibold text-white/30 uppercase tracking-wide">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1100px] mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start bg-[#f7faf8] min-h-screen">
        {/* FEED */}
        <div>
          <Suspense
            fallback={
              <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-xl px-4 py-3 mb-5">
                <svg
                  className="w-5 h-5 text-[#9db5a3] flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <div className="flex-1 text-base text-[#9db5a3]">Search...</div>
              </div>
            }
          >
            <SearchBar />
          </Suspense>

          <FilterBar />

          {/* ── SCHOOL GISTS ── */}
          {showGists && (
            <section className="mb-12" aria-label="School Gists">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                    <Newspaper size={20} />
                  </div>
                  <h2
                    className="text-[26px] tracking-[-0.5px] text-[#0d1a0f]"
                    style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
                  >
                    School Gists
                  </h2>
                </div>
                <SectionLink href="/admissions/category/gists" />
              </div>

              {/* Featured gist */}
              {featuredGist ? (
                <article
                  className="bg-[#0d1a0f] rounded-2xl overflow-hidden mb-4 min-h-[220px] sm:min-h-[240px]"
                  data-ph-capture-attribute-item-type="featured_gist"
                  data-ph-capture-attribute-item-title={featuredGist.title}
                  data-ph-capture-attribute-item-school={featuredGist.school}
                >
                  <div className="p-6 sm:p-8 flex min-h-[220px] sm:min-h-[240px] flex-col justify-between">
                    <a
                      href={`/admissions/gists/${featuredGist.slug}`}
                      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1a0f]"
                    >
                      <h3
                        className="text-[26px] text-white leading-tight tracking-[-0.5px]"
                        style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
                      >
                        {featuredGist.title}
                      </h3>
                    </a>
                    <div className="mt-2 flex min-h-11 flex-wrap items-center justify-between gap-x-1 gap-y-1">
                      <a
                        href={`/admissions/gists/${featuredGist.slug}`}
                        className="flex min-w-0 flex-wrap items-center gap-2 rounded-md text-[13px] sm:text-sm text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                      >
                        {featuredGist.is_trending && (
                          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-extrabold tracking-wide uppercase text-green-400">
                            <Flame size={12} aria-hidden="true" /> Trending
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={13} aria-hidden="true" /> {featuredGist.date_label}
                        </span>
                        <span className="hidden sm:flex items-center gap-1">
                          <Eye size={13} aria-hidden="true" /> {featuredGist.views}
                          <span>views</span>
                        </span>
                        <span className="hidden sm:flex items-center gap-1">
                          <Building2 size={13} aria-hidden="true" /> {featuredGist.school}
                        </span>
                      </a>
                      <ReactionBar
                        initial={featuredGist.reactions}
                        dark
                        compact
                        gistId={featuredGist.id}
                      />
                    </div>
                  </div>
                </article>
              ) : (
                <div className="bg-[#0d1a0f]/10 border-2 border-dashed border-[#0d1a0f]/20 rounded-2xl p-8 mb-4 text-center">
                  <p className="text-[#4a5e4e]">
                    No gists published yet. Add some in the admin dashboard.
                  </p>
                </div>
              )}

              {/* Gist grid */}
              {regularGists.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-3.5 bg-white sm:bg-transparent border border-[#e2ede6] sm:border-0 rounded-2xl sm:rounded-none px-4 sm:px-0 divide-y divide-[#e2ede6] sm:divide-y-0 overflow-hidden sm:overflow-visible">
                  {regularGists.slice(0, 4).map((g) => (
                    <GistCard
                      key={g.id}
                      slug={g.slug}
                      tag={g.tag}
                      tagColor={g.tag_color}
                      title={g.title}
                      date={g.date_label}
                      reactions={g.reactions}
                      gistId={g.id}
                    />
                  ))}
                </div>
              )}

              {regularGists.length > 4 && (
                <div className="text-center mt-6">
                  <SectionLink href="/admissions/category/gists" label="View all school gists" />
                </div>
              )}
            </section>
          )}

          {/* ── SCHOLARSHIPS ── */}
          {showScholarships && (
            <section className="mb-12" aria-label="Scholarships">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                    <Trophy size={20} />
                  </div>
                  <h2
                    className="text-[26px] tracking-[-0.5px] text-[#0d1a0f]"
                    style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
                  >
                    Scholarships
                  </h2>
                </div>
                <SectionLink href="/admissions/category/scholarships" />
              </div>

              {scholarships.length > 0 ? (
                <div className="flex flex-col gap-3.5">
                  {scholarships.map((s) => (
                    <ScholarshipCard
                      key={s.id}
                      slug={s.slug}
                      title={s.title}
                      description={s.description}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                  <p className="text-[#9db5a3]">
                    No scholarships published yet.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* ── DEADLINES ── */}
          {showDeadlines && (
            <section
              className="mb-12"
              id="deadlines"
              aria-label="Admission Deadlines"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                    <Calendar size={20} />
                  </div>
                  <h2
                    className="text-[26px] tracking-[-0.5px] text-[#0d1a0f]"
                    style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
                  >
                    Admission Deadlines
                  </h2>
                </div>
                <SectionLink href="/admissions/category/deadlines" />
              </div>

              {deadlines.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {deadlines.map((d) => (
                    <DeadlineCard
                      key={d.id}
                      deadlineDate={d.deadline_date}
                      title={d.title}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                  <p className="text-[#9db5a3]">No deadlines published yet.</p>
                </div>
              )}
            </section>
          )}

          {/* ── CUTOFF MARKS ── */}
          {showCutoffs && (
            <section className="mb-12" id="cutoffs" aria-label="Cutoff Marks">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <Building2 size={20} />
                  </div>
                  <h2
                    className="text-[26px] tracking-[-0.5px] text-[#0d1a0f]"
                    style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
                  >
                    Cutoff Marks
                  </h2>
                </div>
              </div>

              {cutoffs.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-[#e2ede6] bg-white divide-y divide-[#e2ede6]">
                  {cutoffs.map((c) => (
                    <a
                      key={c.id}
                      href={`/admissions/cutoffs/${c.slug}`}
                      className="flex min-h-14 items-center justify-between px-4 py-3.5 sm:px-5 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 transition-colors"
                    >
                      <h3 className="text-[17px] sm:text-[18px] font-bold text-[#0d1a0f] leading-snug">
                        {c.school}
                      </h3>
                      <ArrowRight size={18} className="text-[#6f8374] shrink-0 ml-4" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                  <p className="text-[#9db5a3]">
                    No cutoff marks published yet.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* ── NYSC ── */}
          {showNysc && (
            <section className="mb-12" id="nysc" aria-label="NYSC">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                    <Newspaper size={20} />
                  </div>
                  <h2
                    className="text-[26px] tracking-[-0.5px] text-[#0d1a0f]"
                    style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
                  >
                    NYSC
                  </h2>
                </div>
              </div>

              {nysc.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-[#e2ede6] bg-white divide-y divide-[#e2ede6]">
                  {nysc.map((n) => (
                    <a
                      key={n.id}
                      href={`/admissions/nysc/${n.slug}`}
                      className="flex min-h-16 items-center justify-between gap-4 px-4 py-3.5 sm:px-5 hover:bg-violet-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 transition-colors"
                    >
                      <div>
                        {n.batch_label && (
                          <span className="text-[12px] font-extrabold tracking-wide uppercase mb-1.5 block text-violet-600">
                            {n.batch_label}
                          </span>
                        )}
                        <h3 className="text-[17px] sm:text-[18px] font-bold text-[#0d1a0f] leading-snug">
                          {n.title}
                        </h3>
                      </div>
                      <ArrowRight size={18} className="text-[#6f8374] shrink-0" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                  <p className="text-[#9db5a3]">No NYSC posts published yet.</p>
                </div>
              )}
            </section>
          )}
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
              <h3
                className="text-[24px] text-white leading-tight tracking-[-0.5px] mb-2"
                style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
              >
                {newThisWeek.title}
              </h3>
              <a
                href={`/admissions/gists/${newThisWeek.slug}`}
                className="mt-5 block text-center text-base font-bold text-[#0d1a0f] bg-white rounded-lg py-3 hover:opacity-90 transition-opacity"
              >
                Read more →
              </a>
            </div>
          ) : scholarships[0] ? (
            // Fallback: show the latest scholarship
            (() => {
              const s = scholarships[0];
              return (
                <div className="bg-[#0d1a0f] rounded-2xl p-6">
                  <div className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-widest uppercase text-[#bbf7d0] mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    New This Week
                  </div>
                  <h3
                    className="text-[24px] text-white leading-tight tracking-[-0.5px] mb-2"
                    style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-base text-white/45 leading-relaxed mb-5">
                    {s.description}
                  </p>
                  <a
                    href={`/admissions/scholarships/${s.slug}`}
                    className="block text-center text-base font-bold text-[#0d1a0f] bg-white rounded-lg py-3 hover:opacity-90 transition-opacity"
                  >
                    View scholarship →
                  </a>
                </div>
              );
            })()
          ) : null}

          {/* Coming Up */}
          {deadlines.length > 0 && (
            <SidebarCard
              icon={<Calendar size={16} />}
              title="Coming Up"
              action={{ label: "All deadlines", href: "/admissions/category/deadlines" }}
            >
              {deadlines.slice(0, 4).map((d, i, arr) => (
                <div
                  key={d.id}
                  className={
                    i < arr.length - 1 ? "border-b border-gray-200" : ""
                  }
                >
                  <ComingUpItem
                    title={d.title}
                    deadlineDate={d.deadline_date}
                  />
                </div>
              ))}
            </SidebarCard>
          )}

          {/* Practice CTA */}
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
            <a
              href="/general"
              className="block text-center text-base font-bold text-green-700 bg-white rounded-lg py-3 hover:opacity-90 transition-opacity"
            >
              Start practising →
            </a>
          </div>

          {/* Trending */}
          {trendingGists.length > 0 && (
            <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="text-base font-extrabold text-[#0d1a0f] flex items-center gap-2">
                  <Flame size={15} className="text-orange-500" /> Trending
                </h3>
              </div>
              <div className="px-5 py-1">
                {trendingGists.map((g, i, arr) => (
                  <a
                    key={g.id}
                    href={`/admissions/gists/${g.slug}`}
                    className={`flex items-center gap-3 py-3 no-underline ${i < arr.length - 1 ? "border-b border-gray-200" : ""}`}
                    data-ph-capture-attribute-item-type="trending_gist"
                    data-ph-capture-attribute-item-title={g.title}
                    data-ph-capture-attribute-item-rank={(i + 1).toString()}
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
