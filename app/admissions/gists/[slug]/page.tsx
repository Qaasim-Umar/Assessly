import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import GistMarkdown from "@/components/GistMarkdown";
import ReactionBar from "../../_components/ReactionBar";
import Sidebar from "../../_components/Sidebar";
import { supabase } from "@/lib/supabase";
import { stripMarkdown } from "@/lib/stripMarkdown";
import { Calendar, Building2 } from "lucide-react";
import ShareBar from "@/components/ShareBar";
import ArticleByline from "@/components/ArticleByline";
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
  paragraphs: string[];
  reactions: { fire: number; shock: number; check: number; think: number };
  related: { slug: string; title: string; tag: string }[];
  created_at: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase
    .from("admissions_gists")
    .select("title, paragraphs, created_at")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  if (!data) return { title: "Not Found" };
  const first = stripMarkdown((data.paragraphs as string[])[0] ?? "").slice(0, 160);
  const url = `https://www.assessly.ng/admissions/gists/${slug}`;
  return {
    title: data.title,
    authors: [{ name: "UQB" }],
    description: first,
    alternates: { canonical: url },
    openGraph: { title: data.title, description: first, type: "article", url, siteName: "Assessly", publishedTime: data.created_at, authors: ["UQB"] },
    twitter: { card: "summary_large_image", title: data.title, description: first },
  };
}

export default async function GistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: gist } = await supabase
    .from("admissions_gists")
    .select("id,slug,tag,tag_color,title,desc,date_label,school,paragraphs,reactions,related,created_at")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!gist) notFound();

  const g = gist as DbGist;

  return (
    <>

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
            style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
          >
            {g.title}
          </h1>

          <ArticleByline publishedAt={g.created_at} dark />

          <div className="flex items-center gap-4 text-sm text-white/35 flex-wrap mt-3 mb-5">
            <span className="flex items-center gap-1"><Calendar size={13} /> {g.date_label}</span>
            <span className="flex items-center gap-1"><Building2 size={13} /> {g.school}</span>
          </div>

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
              <div className="mt-8 border-t border-gray-200 pt-6">
                <ReactionBar initial={g.reactions} targetId={g.id} />
              </div>
            </div>

            {g.related && g.related.length > 0 && (
              <div className="mt-8">
                <h2
                  className="text-[22px] text-[#0d1a0f] tracking-[-0.5px] mb-4"
                  style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
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
            <Link href="/admissions" className="mt-8 inline-flex items-center gap-2 text-base font-bold text-green-600 hover:underline">
              ← Back to Admissions Hub
            </Link>
          </article>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6">
            <Sidebar />
          </aside>
        </div>
      </div>
    </>
  );
}
