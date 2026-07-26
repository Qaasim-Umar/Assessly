import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import GistMarkdown from "@/components/GistMarkdown";
import ShareBar from "@/components/ShareBar";
import Sidebar from "../../_components/Sidebar";
import { supabase } from "@/lib/supabase";
import { stripMarkdown } from "@/lib/stripMarkdown";
import { GraduationCap } from "lucide-react";
import "../../../landing/landing.css";

export const revalidate = 60;

interface DbNysc {
  id: string;
  slug: string;
  title: string;
  batch_label: string | null;
  content: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase
    .from("admissions_nysc")
    .select("title, content")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  if (!data) return { title: "Not Found" };
  const description = stripMarkdown(data.content).slice(0, 160);
  const url = `https://www.assessly.ng/admissions/nysc/${slug}`;
  return {
    title: data.title,
    description,
    alternates: { canonical: url },
    openGraph: { title: data.title, description, type: "article", url, siteName: "Assessly" },
    twitter: { card: "summary_large_image", title: data.title, description },
  };
}

export default async function NyscPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: nysc } = await supabase
    .from("admissions_nysc")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!nysc) notFound();

  const n = nysc as DbNysc;

  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="bg-[#0d1a0f] pt-14 px-6 pb-12 relative overflow-hidden">
        <div
          className="absolute right-[-80px] top-[-80px] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)" }}
        />
        <div className="max-w-[1100px] mx-auto">
          <nav className="flex items-center gap-2 text-sm text-white/35 mb-6">
            <Link href="/admissions" className="hover:text-white/60 transition-colors">Admissions Hub</Link>
            <span>/</span>
            <span>NYSC</span>
          </nav>

          <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide uppercase mb-4 bg-white/10 px-3 py-1.5 rounded-full text-violet-400">
            <GraduationCap size={13} /> NYSC{n.batch_label ? ` · ${n.batch_label}` : ""}
          </span>

          <h1
            className="text-[clamp(28px,4vw,52px)] text-white leading-[1.1] tracking-[-1px] mb-5 max-w-[780px]"
            style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
          >
            {n.title}
          </h1>

          <div className="mt-4">
            <ShareBar title={n.title} url={`https://www.assessly.ng/admissions/nysc/${n.slug}`} />
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <div className="bg-[#f7faf8] min-h-screen px-6 py-10">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">

          {/* Main Content */}
          <div>
            <article>
              <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10">
                <GistMarkdown content={n.content} />
              </div>
            </article>

            <Link href="/admissions" className="mt-8 inline-flex items-center gap-2 text-base font-bold text-green-600 hover:underline">
              ← Back to Admissions Hub
            </Link>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6">
            <Sidebar />
          </aside>

        </div>
      </div>
    </>
  );
}
