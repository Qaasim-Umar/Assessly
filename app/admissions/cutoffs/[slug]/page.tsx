import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import GistMarkdown from "@/components/GistMarkdown";
import ShareBar from "@/components/ShareBar";
import { supabase } from "@/lib/supabase";
import { stripMarkdown } from "@/lib/stripMarkdown";
import { Building2 } from "lucide-react";
import "../../../landing/landing.css";

export const revalidate = 60;

interface DbCutoff {
  id: string;
  slug: string;
  school: string;
  content: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase
    .from("admissions_cutoffs")
    .select("school, content")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  if (!data) return { title: "Not Found" };
  const description = stripMarkdown(data.content).slice(0, 160);
  const url = `https://www.assessly.ng/admissions/cutoffs/${slug}`;
  return {
    title: `${data.school} Cutoff Marks | Assessly Admissions Hub`,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${data.school} Cutoff Marks`, description, type: "article", url, siteName: "Assessly" },
    twitter: { card: "summary_large_image", title: `${data.school} Cutoff Marks`, description },
  };
}

export default async function CutoffPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: cutoff } = await supabase
    .from("admissions_cutoffs")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!cutoff) notFound();

  const c = cutoff as DbCutoff;

  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="bg-[#0d1a0f] pt-14 px-6 pb-12 relative overflow-hidden">
        <div
          className="absolute right-[-80px] top-[-80px] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)" }}
        />
        <div className="max-w-[1100px] mx-auto">
          <nav className="flex items-center gap-2 text-sm text-white/35 mb-6">
            <Link href="/admissions" className="hover:text-white/60 transition-colors">Admissions Hub</Link>
            <span>/</span>
            <span>Cutoff Marks</span>
          </nav>

          <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide uppercase mb-4 bg-white/10 px-3 py-1.5 rounded-full text-blue-400">
            <Building2 size={13} /> Cutoff Marks
          </span>

          <h1
            className="text-[clamp(28px,4vw,52px)] text-white leading-[1.1] tracking-[-1px] mb-5 max-w-[780px]"
            style={{ fontFamily: "'Lora', Georgia, serif" }}
          >
            {c.school}
          </h1>

          <div className="mt-4">
            <ShareBar title={`${c.school} Cutoff Marks`} url={`https://www.assessly.ng/admissions/cutoffs/${c.slug}`} />
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <div className="bg-[#f7faf8] min-h-screen px-6 py-10">
        <div className="max-w-[820px] mx-auto">
          <article>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10">
              <GistMarkdown content={c.content} />
            </div>
          </article>

          <Link href="/admissions" className="mt-8 inline-flex items-center gap-2 text-base font-bold text-green-600 hover:underline">
            ← Back to Admissions Hub
          </Link>
        </div>
      </div>
    </>
  );
}
