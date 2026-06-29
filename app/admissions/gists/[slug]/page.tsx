import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import GistMarkdown from "@/components/GistMarkdown";
import ReactionBar from "../../_components/ReactionBar";
import { supabase } from "@/lib/supabase";
import { stripMarkdown } from "@/lib/stripMarkdown";
import { Calendar, Eye, Building2 } from "lucide-react";
import ShareBar from "@/components/ShareBar";
import "../../../landing/landing.css";

export const revalidate = 60;

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
  paragraphs: string[];
  reactions: { fire: number; shock: number; check: number; think: number };
  related: { slug: string; title: string; tag: string }[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase
    .from("admissions_gists")
    .select("title, paragraphs")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  if (!data) return { title: "Not Found" };
  const first = stripMarkdown((data.paragraphs as string[])[0] ?? "");
  const url = `https://www.assessly.ng/admissions/gists/${slug}`;
  return {
    title: `${data.title} | Assessly Admissions Hub`,
    description: first,
    alternates: { canonical: url },
    openGraph: { title: data.title, description: first, type: "article", url, siteName: "Assessly" },
    twitter: { card: "summary_large_image", title: data.title, description: first },
  };
}

export default async function GistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [{ data: gist }, { data: upcomingDeadlines }] = await Promise.all([
    supabase
      .from("admissions_gists")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single(),
    supabase
      .from("admissions_deadlines")
      .select("title, deadline_date, badge, urgency")
      .eq("published", true)
      .order("deadline_date", { ascending: true })
      .limit(4),
  ]);

  if (!gist) notFound();

  const g = gist as DbGist;

  const dotColor: Record<string, string> = {
    urgent: "bg-rose-500",
    soon: "bg-amber-500",
    open: "bg-green-500",
  };

  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="bg-[#0d1a0f] pt-14 px-6 pb-12 relative overflow-hidden">
        <div
          className="absolute right-[-80px] top-[-80px] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)" }}
        />
        <div className="max-w-[1100px] mx-auto">
          <nav className="flex items-center gap-2 text-sm text-white/35 mb-6">
            <Link href="/admissions" className="hover:text-white/60 transition-colors">Admissions Hub</Link>
            <span>/</span>
            <span>School Gists</span>
          </nav>

          <span className={`inline-flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide uppercase mb-4 bg-white/10 px-3 py-1.5 rounded-full ${g.tag_color}`}>
            <Building2 size={13} /> {g.tag}
          </span>

          <h1
            className="text-[clamp(28px,4vw,52px)] text-white leading-[1.1] tracking-[-1px] mb-5 max-w-[780px]"
            style={{ fontFamily: "'Lora', Georgia, serif" }}
          >
            {g.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-white/35 flex-wrap mb-5">
            <span className="flex items-center gap-1"><Calendar size={13} /> {g.date_label}</span>
            <span className="flex items-center gap-1"><Eye size={13} /> {g.views} views</span>
            <span className="flex items-center gap-1"><Building2 size={13} /> {g.school}</span>
          </div>

          <ReactionBar initial={g.reactions} dark gistId={g.id} />
          <div className="mt-4">
            <ShareBar title={g.title} url={`https://www.assessly.ng/admissions/gists/${g.slug}`} />
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <div className="bg-[#f7faf8] min-h-screen px-6 py-10">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">

          {/* Article */}
          <article>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10">
              <GistMarkdown content={g.paragraphs.join("\n\n")} />
            </div>

            {g.related && g.related.length > 0 && (
              <div className="mt-8">
                <h2
                  className="text-[22px] text-[#0d1a0f] tracking-[-0.5px] mb-4"
                  style={{ fontFamily: "'Lora', Georgia, serif" }}
                >
                  Related Gists
                </h2>
                <div className="flex flex-col gap-3">
                  {g.related.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/admissions/gists/${r.slug}`}
                      className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between hover:border-green-300 hover:shadow-sm transition-all"
                    >
                      <div>
                        <span className="text-[13px] font-extrabold text-green-600 uppercase tracking-wide block mb-0.5">
                          {r.tag}
                        </span>
                        <span className="text-base font-semibold text-[#0d1a0f]">{r.title}</span>
                      </div>
                      <span className="text-[#9db5a3] flex-shrink-0 ml-4">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6">
            <Link href="/admissions" className="flex items-center gap-2 text-base font-bold text-green-600 hover:underline">
              ← Back to Admissions Hub
            </Link>

            {/* Coming Up */}
            {upcomingDeadlines && upcomingDeadlines.length > 0 && (
              <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                  <h3 className="text-base font-extrabold text-[#0d1a0f] flex items-center gap-2"><Calendar size={15} /> Coming Up</h3>
                </div>
                <div className="px-5 py-4">
                  {upcomingDeadlines.map((d, i, arr) => (
                    <div key={i} className={`flex items-start gap-3 py-3 ${i < arr.length - 1 ? "border-b border-gray-200" : ""}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${dotColor[d.urgency] ?? "bg-gray-400"}`} />
                      <div>
                        <strong className="text-base font-bold text-[#0d1a0f] block">{d.title}</strong>
                        <span className="text-sm text-[#9db5a3]">{d.badge}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scholarships CTA */}
            <div className="bg-[#0d1a0f] rounded-2xl p-6">
              <div className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-widest uppercase text-[#bbf7d0] mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                Don&apos;t miss out
              </div>
              <h3 className="text-[20px] text-white leading-tight tracking-[-0.5px] mb-2" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                Scholarships open right now
              </h3>
              <p className="text-sm text-white/45 leading-relaxed mb-4">
                Shell, MTN, Federal Scholarship Board and more — all updated weekly.
              </p>
              <Link
                href="/admissions"
                className="block text-center text-base font-bold text-[#0d1a0f] bg-white rounded-lg py-3 hover:opacity-90 transition-opacity"
              >
                Browse Scholarships →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
