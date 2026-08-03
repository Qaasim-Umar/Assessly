import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ReactionBar from "../../_components/ReactionBar";
import InlineMarkdown from "@/components/InlineMarkdown";
import DeadlineListCard from "../../_components/DeadlineListCard";
import AdmissionsSidebar from "../../_components/Sidebar";
import { supabase } from "@/lib/supabase";
import {
  ADMISSIONS_CATEGORIES,
  CATEGORY_SLUGS,
  PAGE_SIZE,
  getCategory,
  type CategorySlug,
} from "@/lib/admissionsCategories";
import {
  Newspaper,
  Trophy,
  Calendar,
  Building2,
} from "lucide-react";
import "../../../landing/landing.css";

export const revalidate = 60;

const ICONS: Record<CategorySlug, React.ReactNode> = {
  gists: <Newspaper size={20} />,
  scholarships: <Trophy size={20} />,
  deadlines: <Calendar size={20} />,
  cutoffs: <Building2 size={20} />,
  nysc: <Newspaper size={20} />,
};

export async function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Not Found" };
  const url = `https://www.assessly.ng/admissions/category/${slug}`;
  return {
    title: category.archiveTitle,
    description: category.archiveDescription,
    alternates: { canonical: url },
    openGraph: {
      title: category.archiveTitle,
      description: category.archiveDescription,
      type: "website",
      url,
      siteName: "Assessly",
    },
    twitter: {
      card: "summary_large_image",
      title: category.archiveTitle,
      description: category.archiveDescription,
    },
  };
}

// ── Row shapes per table (only fields needed for archive cards) ────────────

interface GistRow {
  id: string;
  slug: string;
  tag: string;
  tag_color: string;
  title: string;
  desc: string;
  date_label: string;
  reactions: { fire: number; shock: number; check: number; think: number };
}

interface ScholarshipRow {
  id: string;
  slug: string;
  title: string;
}

interface DeadlineRow {
  id: string;
  title: string;
  desc: string;
  deadline_date: string;
}

interface CutoffRow {
  id: string;
  slug: string;
  school: string;
}

interface NyscRow {
  id: string;
  slug: string;
  title: string;
  batch_label: string | null;
}

const SELECTS: Record<CategorySlug, string> = {
  gists: "id,slug,tag,tag_color,title,desc,date_label,reactions",
  scholarships: "id,slug,title",
  deadlines: "id,title,desc,deadline_date",
  cutoffs: "id,slug,school",
  nysc: "id,slug,title,batch_label",
};

const ORDER: Record<CategorySlug, { column: string; ascending: boolean }> = {
  gists: { column: "created_at", ascending: false },
  scholarships: { column: "created_at", ascending: false },
  deadlines: { column: "deadline_date", ascending: true },
  cutoffs: { column: "created_at", ascending: false },
  nysc: { column: "created_at", ascending: false },
};

export default async function CategoryArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const order = ORDER[category.slug];
  const { data, count } = await supabase
    .from(category.table)
    .select(SELECTS[category.slug], { count: "exact" })
    .eq("published", true)
    .order(order.column, { ascending: order.ascending })
    .range(from, to);

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const rows = (data ?? []) as unknown[];

  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="bg-[#0d1a0f] pt-14 px-6 pb-10 relative overflow-hidden">
        <div
          className="absolute right-[-80px] top-[-80px] w-96 h-96 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-[1100px] mx-auto">
          <nav className="flex items-center gap-2 text-sm text-white/35 mb-6">
            <Link href="/admissions" className="hover:text-white/60 transition-colors">
              Admissions Hub
            </Link>
            <span>/</span>
            <span>{category.label}</span>
          </nav>

          <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide uppercase mb-4 bg-white/10 px-3 py-1.5 rounded-full text-green-400">
            {ICONS[category.slug]} {category.label}
          </span>

          <h1
            className="text-[clamp(28px,4vw,52px)] text-white leading-[1.1] tracking-[-1px] mb-3 max-w-[780px]"
            style={{ fontFamily: "'Lora', Georgia, serif" }}
          >
            {category.label}
          </h1>
          <p className="text-lg text-white/45 max-w-[600px] leading-relaxed">
            {category.archiveDescription}
          </p>

          <div className="flex flex-wrap gap-2 mt-6">
            {ADMISSIONS_CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/admissions/category/${c.slug}`}
                className={`text-base font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
                  c.slug === category.slug
                    ? "bg-green-600 border-green-600 text-white"
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── LIST ─────────────────────────────────────────────────────── */}
      <div className="bg-[#f7faf8] min-h-screen px-6 py-10">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
        <div>
          {rows.length === 0 && (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-[#9db5a3]">Nothing published here yet.</p>
            </div>
          )}

          <div className="flex flex-col gap-3.5">
            {category.slug === "gists" &&
              (rows as GistRow[]).map((g) => (
                <Link
                  key={g.id}
                  href={`/admissions/gists/${g.slug}`}
                  className="bg-white border border-gray-300 rounded-[18px] p-5 block hover:border-green-200 hover:shadow-[0_4px_20px_rgba(22,163,74,0.08)] hover:-translate-y-0.5 transition-all"
                >
                  <span className={`text-[13px] font-extrabold tracking-wide uppercase mb-2.5 block ${g.tag_color}`}>
                    {g.tag}
                  </span>
                  <h3 className="text-[19px] font-bold text-[#0d1a0f] leading-snug mb-2">
                    {g.title}
                  </h3>
                  <p className="text-base text-[#4a5e4e] leading-relaxed mb-3.5">
                    <InlineMarkdown content={g.desc} />
                  </p>
                  <span className="text-sm text-[#9db5a3]">{g.date_label}</span>
                  <ReactionBar initial={g.reactions} targetId={g.id} />
                </Link>
              ))}

            {category.slug === "scholarships" &&
              (rows as ScholarshipRow[]).map((s) => (
                <Link
                  key={s.id}
                  href={`/admissions/scholarships/${s.slug}`}
                  className="bg-white border border-gray-300 rounded-[18px] p-5 sm:p-6 grid grid-cols-[auto_1fr_auto] gap-4 items-center transition-all hover:border-amber-200 hover:shadow-[0_4px_20px_rgba(217,119,6,0.08)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-100 text-amber-600">
                    <Trophy size={22} aria-hidden="true" />
                  </div>
                  <h3 className="text-[19px] font-bold text-[#0d1a0f] leading-snug">{s.title}</h3>
                  <div className="hidden sm:flex items-end flex-shrink-0">
                    <span className="inline-flex min-h-11 items-center text-base font-bold text-amber-700 bg-amber-50 rounded-lg px-4 py-2">
                      View details →
                    </span>
                  </div>
                </Link>
              ))}

            {category.slug === "deadlines" &&
              (rows as DeadlineRow[]).map((d) => (
                <DeadlineListCard
                  key={d.id}
                  title={d.title}
                  desc={d.desc}
                  deadlineDate={d.deadline_date}
                />
              ))}

            {category.slug === "cutoffs" &&
              (rows as CutoffRow[]).map((c) => (
                <Link
                  key={c.id}
                  href={`/admissions/cutoffs/${c.slug}`}
                  className="bg-white border border-gray-300 rounded-[18px] p-5 flex items-center justify-between hover:border-blue-200 hover:shadow-[0_4px_20px_rgba(37,99,235,0.08)] hover:-translate-y-0.5 transition-all"
                >
                  <h3 className="text-[19px] font-bold text-[#0d1a0f] leading-snug">{c.school}</h3>
                  <span className="text-[#9db5a3] shrink-0 ml-4">→</span>
                </Link>
              ))}

            {category.slug === "nysc" &&
              (rows as NyscRow[]).map((n) => (
                <Link
                  key={n.id}
                  href={`/admissions/nysc/${n.slug}`}
                  className="bg-white border border-gray-300 rounded-[18px] p-5 block hover:border-violet-200 hover:shadow-[0_4px_20px_rgba(139,92,246,0.08)] hover:-translate-y-0.5 transition-all"
                >
                  {n.batch_label && (
                    <span className="text-[13px] font-extrabold tracking-wide uppercase mb-2.5 block text-violet-600">
                      {n.batch_label}
                    </span>
                  )}
                  <h3 className="text-[19px] font-bold text-[#0d1a0f] leading-snug">{n.title}</h3>
                </Link>
              ))}
          </div>

          {/* ── PAGINATION ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              {hasPrev ? (
                <Link
                  href={`/admissions/category/${category.slug}?page=${page - 1}`}
                  className="text-base font-bold text-[#4a5e4e] bg-white border border-gray-300 rounded-lg px-5 py-2.5 hover:border-green-400 hover:text-green-600 transition-all"
                >
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm text-[#9db5a3]">
                Page {page} of {totalPages}
              </span>
              {hasNext ? (
                <Link
                  href={`/admissions/category/${category.slug}?page=${page + 1}`}
                  className="text-base font-bold text-[#4a5e4e] bg-white border border-gray-300 rounded-lg px-5 py-2.5 hover:border-green-400 hover:text-green-600 transition-all"
                >
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </div>
          )}

          <Link href="/admissions" className="mt-8 inline-flex items-center gap-2 text-base font-bold text-green-600 hover:underline">
            ← Back to Admissions Hub
          </Link>
        </div>

        <AdmissionsSidebar />
        </div>
      </div>
    </>
  );
}
