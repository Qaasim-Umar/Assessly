import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import GistMarkdown from "@/components/GistMarkdown";
import Sidebar from "../../_components/Sidebar";
import { supabase } from "@/lib/supabase";
import { stripMarkdown } from "@/lib/stripMarkdown";
import ShareBar from "@/components/ShareBar";
import ArticleByline from "@/components/ArticleByline";
import "../../../landing/landing.css";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase
    .from("admissions_scholarships")
    .select("title, description, created_at")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  if (!data) return { title: "Not Found" };
  const desc = stripMarkdown(data.description ?? "").slice(0, 160);
  const url = `https://www.assessly.ng/admissions/scholarships/${slug}`;
  return {
    title: data.title,
    authors: [{ name: "UQB" }],
    description: desc,
    alternates: { canonical: url },
    openGraph: { title: data.title, description: desc, type: "article", url, siteName: "Assessly", publishedTime: data.created_at, authors: ["UQB"] },
    twitter: { card: "summary_large_image", title: data.title, description: desc },
  };
}

export default async function ScholarshipPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data } = await supabase
    .from("admissions_scholarships")
    .select("slug,title,body,apply_url,created_at")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!data) notFound();

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
            <span>Scholarships</span>
          </nav>

          <h1
            className="text-[clamp(28px,4vw,52px)] text-white leading-[1.1] tracking-[-1px] mb-5 max-w-[780px]"
            style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
          >
            {data.title}
          </h1>

          <ArticleByline publishedAt={data.created_at} dark />

          <div className="mt-4">
            <ShareBar
              title={data.title}
              url={`https://www.assessly.ng/admissions/scholarships/${data.slug}`}
            />
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <div className="bg-[#f7faf8] min-h-screen px-6 py-10">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">

          <article>

            {/* Body */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10">
              <GistMarkdown content={data.body} />
            </div>

            {/* Apply CTA */}
            {data.apply_url && (
              <a
                href={data.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex min-h-11 items-center justify-center text-base font-bold text-white bg-green-600 rounded-xl px-6 py-3.5 hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 transition-colors"
              >
                Apply Now →
              </a>
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
