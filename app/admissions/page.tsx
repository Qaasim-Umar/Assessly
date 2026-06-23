import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import TabBar from "./_components/TabBar";
import FilterBar from "./_components/FilterBar";
import ReactionBar from "./_components/ReactionBar";
import "../landing/landing.css";

// ── Metadata ───────────────────────────────────────────────────────────────────

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
    url: "https://assessly.ng/admissions",
  },
  twitter: {
    card: "summary_large_image",
    title: "Admissions Hub | Assessly",
    description:
      "Nigerian university scholarships, JAMB deadlines, and school gists — updated weekly.",
  },
  alternates: {
    canonical: "https://assessly.ng/admissions",
  },
};

// ── JSON-LD structured data ────────────────────────────────────────────────────

const scholarshipJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Nigerian University Scholarships 2024/25",
  description: "Open scholarships for Nigerian university students",
  numberOfItems: 3,
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      item: {
        "@type": "EducationalOccupationalProgram",
        name: "Shell Nigeria University Scholarship 2024/25",
        description:
          "Open to 100-level students in Engineering, Sciences, and Social Sciences with minimum 3.5 GPA. Covers tuition and stipend.",
        applicationDeadline: "2024-07-31",
        offers: { "@type": "Offer", price: "500000", priceCurrency: "NGN" },
      },
    },
    {
      "@type": "ListItem",
      position: 2,
      item: {
        "@type": "EducationalOccupationalProgram",
        name: "Federal Government Scholarship Board — Bilateral Education",
        description:
          "Full overseas scholarship for undergraduate and postgraduate study. Open to all Nigerian students with minimum 5 O'Level credits.",
        applicationDeadline: "2024-08-15",
      },
    },
    {
      "@type": "ListItem",
      position: 3,
      item: {
        "@type": "EducationalOccupationalProgram",
        name: "MTN Foundation Science & Technology Scholarship",
        description:
          "For 200-level students in Science, Technology, Engineering, and Mathematics. Minimum 3.0 GPA required.",
        applicationDeadline: "2024-09-01",
        offers: { "@type": "Offer", price: "200000", priceCurrency: "NGN" },
      },
    },
  ],
};

// ── Sub-components (server-renderable) ────────────────────────────────────────

function GistCard({
  slug,
  tag,
  tagColor,
  title,
  desc,
  date,
  reactions,
}: {
  slug: string;
  tag: string;
  tagColor: string;
  title: string;
  desc: string;
  date: string;
  reactions: { fire: number; shock: number; check: number; think: number };
}) {
  return (
    <a
      href={`/admissions/gists/${slug}`}
      className="bg-white border border-gray-300 rounded-[18px] p-5 block cursor-pointer hover:border-green-200 hover:shadow-[0_4px_20px_rgba(22,163,74,0.08)] hover:-translate-y-0.5 transition-all"
    >
      <span className={`text-[13px] font-extrabold tracking-wide uppercase mb-2.5 block ${tagColor}`}>{tag}</span>
      <h3 className="text-[19px] font-bold text-[#0d1a0f] leading-snug mb-2">{title}</h3>
      <p className="text-base text-[#4a5e4e] leading-relaxed mb-3.5">{desc}</p>
      <span className="text-sm text-[#9db5a3]">{date}</span>
      <ReactionBar initial={reactions} />
    </a>
  );
}

function ScholarshipCard({
  slug,
  icon,
  iconBg,
  title,
  desc,
  tags,
  open,
  dimmed = false,
}: {
  slug: string;
  icon: string;
  iconBg: string;
  title: string;
  desc: string;
  tags: { label: string; style: string }[];
  open: boolean;
  dimmed?: boolean;
}) {
  return (
    <a
      href={`/admissions/scholarships/${slug}`}
      className={`bg-white border border-gray-300 rounded-[18px] p-5 sm:p-6 grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] gap-4 items-start transition-all hover:border-amber-200 hover:shadow-[0_4px_20px_rgba(217,119,6,0.08)] cursor-pointer ${
        dimmed ? "opacity-60" : ""
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-[19px] font-bold text-[#0d1a0f] mb-1.5">{title}</h3>
        <p className="text-base text-[#4a5e4e] leading-relaxed mb-2.5">{desc}</p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <span key={i} className={`text-[13px] font-bold px-2.5 py-1 rounded-full ${t.style}`}>
              {t.label}
            </span>
          ))}
        </div>
      </div>
      <div className="hidden sm:flex items-end flex-shrink-0">
        {open ? (
          <span className="text-base font-bold text-white bg-amber-500 rounded-lg px-4 py-2">
            Apply Now
          </span>
        ) : (
          <span className="text-base font-bold text-[#9db5a3] bg-[#f7faf8] rounded-lg px-4 py-2">
            Closed
          </span>
        )}
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
  day,
  month,
  urgency,
  title,
  desc,
  badge,
}: {
  day: string;
  month: string;
  urgency: "urgent" | "soon" | "open";
  title: string;
  desc: string;
  badge: string;
}) {
  const s = URGENCY_STYLES[urgency];
  return (
    <div className="bg-white border border-gray-300 rounded-[18px] px-5 py-4 grid grid-cols-[auto_1fr_auto] gap-4 items-center hover:border-green-200 transition-colors cursor-pointer">
      <div className={`w-[60px] h-[60px] rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${s.block}`}>
        <span className={`text-2xl font-extrabold leading-none ${s.text}`}>{day}</span>
        <span className={`text-[12px] font-extrabold tracking-wide uppercase ${s.text}`}>{month}</span>
      </div>
      <div>
        <h3 className="text-base font-bold text-[#0d1a0f] mb-0.5">{title}</h3>
        <p className="text-base text-[#4a5e4e]">{desc}</p>
      </div>
      <span className={`text-[13px] font-extrabold tracking-wide px-3 py-1.5 rounded-full flex-shrink-0 ${s.badge}`}>
        {badge}
      </span>
    </div>
  );
}

function SidebarCard({
  icon,
  title,
  action,
  children,
}: {
  icon?: string;
  title: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-base font-extrabold text-[#0d1a0f]">
          {icon && <span className="mr-2">{icon}</span>}
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdmissionsHubPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(scholarshipJsonLd) }}
      />

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .ticker-anim { animation: ticker 22s -8s linear infinite; }
      `}</style>

      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#0d1a0f] relative overflow-hidden pt-14 px-6">
        <div
          className="absolute right-[-80px] top-[-80px] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)" }}
        />

        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto] items-end gap-10">
          <div>
            <div className="inline-flex items-center gap-2 text-[13px] font-extrabold tracking-widest uppercase text-[#bbf7d0] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              Admissions Hub
            </div>
            <h1
              className="text-[clamp(40px,5vw,68px)] text-white leading-[1.08] tracking-[-1.5px] mb-3.5"
              style={{ fontFamily: "'Lora', Georgia, serif" }}
            >
              Your path to <em className="not-italic text-green-500">university</em>, sorted.
            </h1>
            <p className="text-lg text-white/45 max-w-[520px] leading-relaxed">
              Scholarships, admission deadlines, school gists, and everything else you need, in one place. Updated weekly.
            </p>
          </div>

          <div className="flex flex-row gap-6 pb-10 self-center">
            {[
              { num: "47", label: "Scholarships" },
              { num: "12", label: "Deadlines" },
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
          <span className="text-[12px] font-extrabold tracking-widest uppercase text-rose-600 bg-rose-100 px-2 py-1 rounded flex-shrink-0">
            LIVE
          </span>
          <span className="text-base text-white/60 whitespace-nowrap ticker-anim">
            UNILAG Post-UTME screening begins July 14 &nbsp;·&nbsp; Shell Nigeria Scholarship portal now open
            &nbsp;·&nbsp; OAU releases 2024/25 admission list &nbsp;·&nbsp; JAMB CAPS upgrade window closes June 30
            &nbsp;·&nbsp; UI admission cut-off: 200 for Sciences &nbsp;·&nbsp; Federal Scholarship Board applications open
          </span>
        </div>

        {/* Tabs — client island */}
        <TabBar />
      </div>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1100px] mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start bg-[#f7faf8] min-h-screen">

        {/* FEED */}
        <div>
          {/* Search bar */}
          <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-xl px-4 py-3 mb-5 hover:border-green-400 transition-colors cursor-text">
            <svg className="w-5 h-5 text-[#9db5a3] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search scholarships, schools, deadlines..."
              className="flex-1 text-base text-[#0d1a0f] placeholder:text-[#9db5a3] bg-transparent outline-none"
            />
          </div>

          {/* Filter bar — client island */}
          <FilterBar />

          {/* ── SCHOOL GISTS ── */}
          <section className="mb-12" aria-label="School Gists">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-lg" aria-hidden="true">📰</div>
                <h2 className="text-[26px] tracking-[-0.5px] text-[#0d1a0f]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                  School Gists
                </h2>
              </div>
              <a href="#" className="text-base font-bold text-green-600 hover:underline">See all →</a>
            </div>

            {/* Featured */}
            <a href="/admissions/gists/unilag-post-utme-2024" className="bg-[#0d1a0f] rounded-2xl overflow-hidden mb-4 grid grid-cols-1 md:grid-cols-2 min-h-[260px] cursor-pointer hover:-translate-y-0.5 transition-transform">
              <div className="p-8 flex flex-col justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide uppercase text-green-500 bg-green-500/15 px-2.5 py-1 rounded-full mb-4">
                    🔥 Trending
                  </span>
                  <h3 className="text-[26px] text-white leading-tight tracking-[-0.5px] mb-2.5" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                    UNILAG Post-UTME 2024/25: Everything You Need to Know
                  </h3>
                  <p className="text-base text-white/50 leading-relaxed mb-5">
                    Screening dates, subject combinations, registration portal link, and what past students say about the process.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-3 text-sm text-white/35 flex-wrap">
                    <span>📅 June 18, 2026</span>
                    <span>👁 14.2k views</span>
                    <span>🏫 UNILAG</span>
                  </div>
                  <ReactionBar initial={{ fire: 312, shock: 89, check: 204, think: 47 }} dark />
                </div>
              </div>
              <div
                className="hidden md:flex items-center justify-center text-[80px] opacity-40"
                style={{ background: "linear-gradient(135deg, rgba(22,163,74,0.2) 0%, rgba(22,163,74,0.05) 100%)" }}
                aria-hidden="true"
              >
                🎓
              </div>
            </a>

            {/* Gist grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <GistCard slug="oau-admission-list-2024" tag="OAU" tagColor="text-rose-600" title="OAU releases 2024/25 admission list: how to check your status" desc="Step-by-step guide to checking your name on the JAMB CAPS portal and what to do next." date="June 15, 2026" reactions={{ fire: 98, shock: 34, check: 71, think: 12 }} />
              <GistCard slug="ui-cut-off-marks-2024" tag="UI" tagColor="text-violet-600" title="University of Ibadan cut-off marks for all faculties, 2024/25" desc="Full breakdown of departmental cut-offs. Sciences, Arts, Social Sciences, and Law all listed." date="June 12, 2026" reactions={{ fire: 143, shock: 21, check: 89, think: 8 }} />
              <GistCard slug="futa-post-utme-score" tag="FUTA" tagColor="text-amber-600" title="FUTA Post-UTME: what score do you actually need?" desc="Students share their experiences. Real cut-off data from the last 3 years compared." date="June 10, 2026" reactions={{ fire: 67, shock: 55, check: 30, think: 19 }} />
              <GistCard slug="jamb-caps-how-to-accept" tag="JAMB" tagColor="text-[#4a5e4e]" title="JAMB CAPS: How to accept your admission offer before the deadline" desc="Many students miss this step. Full walkthrough with screenshots of the acceptance process." date="June 8, 2026" reactions={{ fire: 201, shock: 44, check: 158, think: 23 }} />
            </div>
            <div className="text-center mt-6">
              <button className="text-base font-bold text-[#4a5e4e] bg-white border border-gray-300 rounded-lg px-7 py-3 hover:border-green-400 hover:text-green-600 transition-all">
                Load more gists
              </button>
            </div>
          </section>

          {/* ── SCHOLARSHIPS ── */}
          <section className="mb-12" aria-label="Scholarships">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-lg" aria-hidden="true">🏆</div>
                <h2 className="text-[26px] tracking-[-0.5px] text-[#0d1a0f]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                  Scholarships
                </h2>
              </div>
              <a href="#" className="text-base font-bold text-green-600 hover:underline">See all →</a>
            </div>
            <div className="flex flex-col gap-3.5">
              <ScholarshipCard slug="shell-nigeria-2024" icon="🛢️" iconBg="bg-amber-100" title="Shell Nigeria University Scholarship 2024/25" desc="Open to 100-level students in Engineering, Sciences, and Social Sciences with minimum 3.5 GPA. Covers tuition and stipend." tags={[{ label: "₦500,000/yr", style: "bg-amber-100 text-amber-600" }, { label: "Closes Jul 31", style: "bg-rose-100 text-rose-600" }, { label: "Open Now", style: "bg-green-100 text-green-700" }, { label: "STEM", style: "bg-blue-100 text-blue-600" }]} open />
              <ScholarshipCard slug="federal-scholarship-board-bilateral" icon="🇳🇬" iconBg="bg-blue-100" title="Federal Government Scholarship Board, Bilateral Education" desc="Full overseas scholarship for undergraduate and postgraduate study. Open to all Nigerian students with minimum 5 O'Level credits." tags={[{ label: "Full funding", style: "bg-amber-100 text-amber-600" }, { label: "Closes Aug 15", style: "bg-rose-100 text-rose-600" }, { label: "Open Now", style: "bg-green-100 text-green-700" }]} open />
              <ScholarshipCard slug="mtn-foundation-stem" icon="📚" iconBg="bg-violet-100" title="MTN Foundation Science & Technology Scholarship" desc="For 200-level students in Science, Technology, Engineering, and Mathematics. Minimum 3.0 GPA required at point of application." tags={[{ label: "₦200,000/yr", style: "bg-amber-100 text-amber-600" }, { label: "Closes Sept 1", style: "bg-rose-100 text-rose-600" }, { label: "Open Now", style: "bg-green-100 text-green-700" }, { label: "STEM", style: "bg-blue-100 text-blue-600" }]} open />
              <ScholarshipCard slug="zenith-bank-undergraduate" icon="🏦" iconBg="bg-gray-100" title="Zenith Bank Undergraduate Scholarship" desc="Annual scholarship for students in Banking, Finance, and Economics. Applications closed for this cycle." tags={[{ label: "₦150,000/yr", style: "bg-amber-100 text-amber-600" }, { label: "Closed", style: "bg-gray-100 text-gray-400" }, { label: "Business", style: "bg-violet-100 text-violet-600" }]} open={false} dimmed />
            </div>
            <div className="text-center mt-6">
              <button className="text-base font-bold text-[#4a5e4e] bg-white border border-gray-300 rounded-lg px-7 py-3 hover:border-green-400 hover:text-green-600 transition-all">
                Load more scholarships
              </button>
            </div>
          </section>

          {/* ── DEADLINES ── */}
          <section className="mb-12" aria-label="Admission Deadlines">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center text-lg" aria-hidden="true">📅</div>
                <h2 className="text-[26px] tracking-[-0.5px] text-[#0d1a0f]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                  Admission Deadlines
                </h2>
              </div>
              <a href="#" className="text-base font-bold text-green-600 hover:underline">See all →</a>
            </div>
            <div className="flex flex-col gap-3">
              <DeadlineCard day="30" month="Jun" urgency="urgent" title="JAMB CAPS Acceptance Window Closes" desc="Accept your admission offer on the JAMB portal before this date or lose your spot" badge="10 days left" />
              <DeadlineCard day="14" month="Jul" urgency="urgent" title="UNILAG Post-UTME Screening Begins" desc="Register on admissions.unilag.edu.ng, portal closes 3 days before screening" badge="24 days left" />
              <DeadlineCard day="31" month="Jul" urgency="soon" title="Shell Nigeria Scholarship Application Closes" desc="Apply at shellscholarship.ng, you'll need your WAEC result and transcript" badge="41 days left" />
              <DeadlineCard day="15" month="Aug" urgency="open" title="Federal Scholarship Board: BEA Applications" desc="Bilateral Education Agreement scholarship for overseas study" badge="56 days left" />
            </div>
          </section>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="flex flex-col gap-6">

          {/* Quick Apply */}
          <div className="bg-[#0d1a0f] rounded-2xl p-6">
            <div className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-widest uppercase text-[#bbf7d0] mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              New This Week
            </div>
            <h3 className="text-[24px] text-white leading-tight tracking-[-0.5px] mb-2" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Shell Scholarship portal is now open
            </h3>
            <p className="text-base text-white/45 leading-relaxed mb-5">
              ₦500,000/year for Science and Engineering students. Closes July 31, don&apos;t miss it.
            </p>
            <a href="#" className="block text-center text-base font-bold text-[#0d1a0f] bg-white rounded-lg py-3 hover:opacity-90 transition-opacity">
              Apply on Shell&apos;s site →
            </a>
          </div>

          {/* Coming Up */}
          <SidebarCard icon="📅" title="Coming Up" action={{ label: "All deadlines", href: "#" }}>
            {[
              { dot: "bg-rose-500", title: "JAMB CAPS closes", sub: "June 30 · 10 days left" },
              { dot: "bg-rose-500", title: "UNILAG Post-UTME", sub: "July 14 · 24 days left" },
              { dot: "bg-amber-500", title: "Shell Scholarship", sub: "July 31 · 41 days left" },
              { dot: "bg-green-500", title: "Federal Scholarship Board", sub: "Aug 15 · 56 days left" },
            ].map((item, i, arr) => (
              <div key={i} className={`flex items-start gap-3 py-3 ${i < arr.length - 1 ? "border-b border-gray-200" : ""}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${item.dot}`} />
                <div>
                  <strong className="text-base font-bold text-[#0d1a0f] block">{item.title}</strong>
                  <span className="text-sm text-[#9db5a3]">{item.sub}</span>
                </div>
              </div>
            ))}
          </SidebarCard>

          {/* Trending */}
          <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-extrabold text-[#0d1a0f]">🔥 Trending</h3>
            </div>
            <div className="px-5 py-1">
              {[
                { title: "UNILAG Post-UTME guide", views: "14.2k views" },
                { title: "How to check admission on CAPS", views: "9.8k views" },
                { title: "Shell scholarship requirements", views: "7.1k views" },
                { title: "OAU admission list is out", views: "5.4k views" },
                { title: "UI cut-off marks by faculty", views: "4.9k views" },
              ].map((item, i, arr) => (
                <a key={i} href="#" className={`flex items-center gap-3 py-3 no-underline ${i < arr.length - 1 ? "border-b border-gray-200" : ""}`}>
                  <span className="text-base font-extrabold text-[#9db5a3] w-5 text-center flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <strong className="text-base font-bold text-[#0d1a0f] block leading-tight">{item.title}</strong>
                    <span className="text-sm text-[#9db5a3]">{item.views}</span>
                  </div>
                  <span className="text-[#9db5a3] flex-shrink-0 text-base">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
