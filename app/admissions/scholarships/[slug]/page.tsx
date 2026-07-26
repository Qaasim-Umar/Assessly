import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import GistMarkdown from "@/components/GistMarkdown";
import Sidebar from "../../_components/Sidebar";
import { supabase } from "@/lib/supabase";
import { stripMarkdown } from "@/lib/stripMarkdown";
import { Check } from "lucide-react";
import "../../../landing/landing.css";

export const revalidate = 60;

type Urgency = "urgent" | "soon" | "open";

const URGENCY_STYLES: Record<Urgency, { banner: string; text: string; badge: string }> = {
  urgent: { banner: "bg-rose-50 border border-rose-200", text: "text-rose-700", badge: "bg-rose-100 text-rose-700" },
  soon: { banner: "bg-amber-50 border border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  open: { banner: "bg-green-50 border border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-700" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase
    .from("admissions_scholarships")
    .select("title, description")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  if (!data) return { title: "Not Found" };
  const desc = stripMarkdown(data.description ?? "").slice(0, 160);
  const url = `https://www.assessly.ng/admissions/scholarships/${slug}`;
  return {
    title: data.title,
    description: desc,
    alternates: { canonical: url },
    openGraph: { title: data.title, description: desc, type: "website", url, siteName: "Assessly" },
    twitter: { card: "summary_large_image", title: data.title, description: desc },
  };
}

export default async function ScholarshipPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data } = await supabase
    .from("admissions_scholarships")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!data) notFound();

  // Map snake_case DB fields to what the JSX expects
  const s = {
    ...data,
    iconBg: data.icon_bg as string,
    amountLabel: data.amount_label as string,
    deadlineLabel: data.deadline_label as string,
    daysLeft: data.days_left as string,
    urgency: data.urgency as Urgency,
    isOpen: data.is_open as boolean,
    applyUrl: data.apply_url as string,
    body: data.body as string,
  };

  const urgencyKey: Urgency = (["urgent", "soon", "open"].includes(s.urgency) ? s.urgency : "open") as Urgency;
  const u = URGENCY_STYLES[urgencyKey];

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

          <div className="flex items-start gap-5 mb-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${s.iconBg}`}>
              {s.icon}
            </div>
            <h1
              className="text-[clamp(24px,3.5vw,46px)] text-white leading-[1.1] tracking-[-1px]"
              style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
            >
              {s.title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {s.amountLabel && (
              <span className="text-[13px] font-bold px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300">
                {s.amountLabel} {s.frequency === "yearly" ? "· per year" : "· one-time"}
              </span>
            )}
            <span className="text-[13px] font-bold px-3 py-1.5 rounded-full bg-white/10 text-white/70">
              {s.category}
            </span>
            {s.isOpen ? (
              <span className="inline-flex items-center gap-1 text-[13px] font-bold px-3 py-1.5 rounded-full bg-green-500/20 text-green-400">
                <Check size={12} /> Open Now
              </span>
            ) : (
              <span className="text-[13px] font-bold px-3 py-1.5 rounded-full bg-white/10 text-white/40">
                Closed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <div className="bg-[#f7faf8] min-h-screen px-6 py-10">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">

          <div className="flex flex-col gap-6">

            {/* Deadline banner */}
            {s.deadlineLabel && (
              <div className={`rounded-2xl px-6 py-4 flex items-center justify-between gap-4 ${u.banner}`}>
                <div>
                  <p className={`text-base font-extrabold ${u.text}`}>{s.deadlineLabel}</p>
                  <p className={`text-sm ${u.text} opacity-70`}>{s.daysLeft}</p>
                </div>
                {s.isOpen && s.daysLeft && (
                  <span className={`text-[13px] font-extrabold px-3 py-1.5 rounded-full flex-shrink-0 ${u.badge}`}>
                    {s.daysLeft}
                  </span>
                )}
              </div>
            )}

            {/* Body */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <GistMarkdown content={s.body} />
            </div>

            {/* Apply CTA */}
            {s.applyUrl && (
              <a
                href={s.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-base font-bold text-white bg-amber-500 rounded-xl px-6 py-3.5 hover:bg-amber-600 transition-colors self-start"
              >
                Apply Now →
              </a>
            )}

            <Link href="/admissions" className="mt-2 inline-flex items-center gap-2 text-base font-bold text-green-600 hover:underline">
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
