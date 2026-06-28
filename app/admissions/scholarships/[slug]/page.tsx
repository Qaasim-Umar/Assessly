import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import GistMarkdown from "@/components/GistMarkdown";
import InlineMarkdown from "@/components/InlineMarkdown";
import { supabase } from "@/lib/supabase";
import { stripMarkdown } from "@/lib/stripMarkdown";
import { Check, FileText, Star } from "lucide-react";
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
  const desc = stripMarkdown(data.description ?? "");
  const url = `https://www.assessly.ng/admissions/scholarships/${slug}`;
  return {
    title: `${data.title} | Assessly Admissions Hub`,
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
    requiredDocuments: data.required_documents as string[],
    eligibility: data.eligibility as string[],
    covers: data.covers as string[],
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
              style={{ fontFamily: "'Lora', Georgia, serif" }}
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
            <div className={`rounded-2xl px-6 py-4 flex items-center justify-between gap-4 ${u.banner}`}>
              <div>
                <p className={`text-base font-extrabold ${u.text}`}>{s.deadlineLabel}</p>
                <p className={`text-sm ${u.text} opacity-70`}>{s.daysLeft}</p>
              </div>
              {s.isOpen && (
                <span className={`text-[13px] font-extrabold px-3 py-1.5 rounded-full flex-shrink-0 ${u.badge}`}>
                  {s.daysLeft}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <GistMarkdown content={s.description} />
            </div>

            {/* Eligibility */}
            {s.eligibility.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
                <h2 className="text-[22px] text-[#0d1a0f] tracking-[-0.5px] mb-5" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                  Who Can Apply
                </h2>
                <ul className="flex flex-col gap-3">
                  {s.eligibility.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0 mt-0.5"><Check size={11} strokeWidth={3} /></span>
                      <span className="text-base text-[#1a2e1d] leading-relaxed"><InlineMarkdown content={item} /></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Documents */}
            {s.requiredDocuments.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
                <h2 className="text-[22px] text-[#0d1a0f] tracking-[-0.5px] mb-5" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                  What to Prepare
                </h2>
                <ul className="flex flex-col gap-3">
                  {s.requiredDocuments.map((doc: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-[#9db5a3] flex-shrink-0 mt-1"><FileText size={15} /></span>
                      <span className="text-base text-[#1a2e1d] leading-relaxed"><InlineMarkdown content={doc} /></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What it covers */}
            {s.covers.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
                <h2 className="text-[22px] text-[#0d1a0f] tracking-[-0.5px] mb-5" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                  What&apos;s Covered
                </h2>
                <ul className="flex flex-col gap-3">
                  {s.covers.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-amber-500 flex-shrink-0 mt-1"><Star size={15} fill="currentColor" /></span>
                      <span className="text-base text-[#1a2e1d] leading-relaxed"><InlineMarkdown content={item} /></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6">
            <Link href="/admissions" className="flex items-center gap-2 text-base font-bold text-green-600 hover:underline">
              ← Back to Admissions Hub
            </Link>

            {/* Apply CTA */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-[20px] text-[#0d1a0f] tracking-[-0.5px] mb-1.5" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                {s.isOpen ? "Ready to apply?" : "Applications closed"}
              </h3>
              <p className="text-sm text-[#9db5a3] mb-5">
                {s.isOpen
                  ? `Deadline: ${s.deadlineLabel}. Don't wait.`
                  : "Check back next cycle or browse other open scholarships."}
              </p>
              {s.isOpen ? (
                <a
                  href={s.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-base font-bold text-white bg-amber-500 rounded-xl py-3.5 hover:bg-amber-600 transition-colors"
                >
                  Apply Now →
                </a>
              ) : (
                <button disabled className="block w-full text-center text-base font-bold text-[#9db5a3] bg-[#f7faf8] rounded-xl py-3.5 cursor-not-allowed border border-gray-200">
                  Applications Closed
                </button>
              )}
            </div>

            {/* Quick facts */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-base font-extrabold text-[#0d1a0f] mb-4">Quick Facts</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Amount", value: s.amountLabel || "Full funding" },
                  { label: "Frequency", value: s.frequency === "yearly" ? "Every academic year" : "One-time award" },
                  { label: "Category", value: s.category },
                  { label: "Deadline", value: s.deadlineLabel },
                  { label: "Status", value: s.isOpen ? "Open" : "Closed" },
                ].map((fact) => (
                  <div key={fact.label} className="flex justify-between items-start gap-4 text-sm border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <span className="text-[#9db5a3] font-semibold flex-shrink-0">{fact.label}</span>
                    <span className="text-[#0d1a0f] font-bold text-right">{fact.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Browse more */}
            <div className="bg-[#0d1a0f] rounded-2xl p-6">
              <p className="text-[13px] font-extrabold tracking-widest uppercase text-[#bbf7d0] mb-2">More scholarships</p>
              <p className="text-base text-white/50 mb-4 leading-relaxed">Browse all open scholarships on the hub — updated weekly.</p>
              <Link href="/admissions" className="block text-center text-base font-bold text-[#0d1a0f] bg-white rounded-lg py-3 hover:opacity-90 transition-opacity">
                Browse All →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
