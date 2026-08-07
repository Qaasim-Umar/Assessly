"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import "../../landing/landing.css";
import {
  List,
  Target,
  FileEdit,
  BookOpen,
  School,
  BookMarked,
  Wrench,
  Package,
  Search,
  Check,
  FileText,
  PartyPopper,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ExamKey = "all" | "jamb" | "waec" | "neco" | "post" | "bece" | "nabteb";
type PackExam = Exclude<ExamKey, "all"> | "neco-bece" | "waec-bece";

const EXAM_TABS: { key: ExamKey; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <List size={16} /> },
  { key: "jamb", label: "JAMB / UTME", icon: <Target size={16} /> },
  { key: "waec", label: "WAEC", icon: <FileEdit size={16} /> },
  { key: "neco", label: "NECO", icon: <BookOpen size={16} /> },
  { key: "post", label: "Post-UTME", icon: <School size={16} /> },
  { key: "bece", label: "BECE", icon: <BookMarked size={16} /> },
  { key: "nabteb", label: "NABTEB", icon: <Wrench size={16} /> },
];

const ACCENT: Record<PackExam, string> = {
  jamb: "bg-green-600",
  waec: "bg-indigo-500",
  neco: "bg-rose-600",
  post: "bg-blue-600",
  bece: "bg-amber-600",
  "neco-bece": "bg-rose-600",
  "waec-bece": "bg-indigo-500",
  nabteb: "bg-violet-600",
};

interface PackFile {
  name: string;
}

interface Pack {
  id: string;
  slug: string;
  exam: PackExam;
  examLabel: string;
  title: string;
  section: string;
  packType: "single" | "pack";
  packFiles: PackFile[];
}

interface DatabasePack {
  id: string;
  slug: string;
  exam: string;
  exam_label: string;
  title: string;
  section: string;
  pack_type: "single" | "pack";
  pack_files: Array<{ name?: string }> | null;
}

function mapDatabasePack(pack: DatabasePack): Pack {
  return {
    id: pack.id,
    slug: pack.slug,
    exam: pack.exam as PackExam,
    examLabel: pack.exam_label,
    title: pack.title,
    section: pack.section,
    packType: pack.pack_type,
    packFiles: (pack.pack_files ?? []).map((file, index) => ({
      name: file.name?.trim() || `File ${index + 1}`,
    })),
  };
}

// ── Mock Data for Preview ───────────────────────────────────────────────────

const MOCK_PACKS: Pack[] = [
  {
    id: "mock-1",
    slug: "jamb-mathematics-past-questions-2015-2024",
    exam: "jamb",
    examLabel: "JAMB · Mathematics",
    title: "JAMB Mathematics Complete 2015-2024",
    section: "JAMB / UTME",
    packType: "single",
    packFiles: [],
  },
  {
    id: "mock-2",
    slug: "waec-science-past-questions-2024",
    exam: "waec",
    examLabel: "WAEC · Science Bundle",
    title: "WAEC Physics, Chemistry & Bio 2024",
    section: "WAEC / SSCE",
    packType: "pack",
    packFiles: [
      { name: "WAEC Physics 2024" },
      { name: "WAEC Chemistry 2024" },
      { name: "WAEC Biology 2024" },
    ],
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function QuestionBankPage() {
  const [packs, setPacks] = useState<Pack[]>(MOCK_PACKS);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [activeExam, setActiveExam] = useState<ExamKey>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("question_bank_packs")
      .select("id,slug,exam,exam_label,title,section,pack_type,pack_files")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.length) {
          setPacks((data as DatabasePack[]).map(mapDatabasePack));
        }
        setLoadingPacks(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return packs.filter((p) => {
      const matchesExam =
        activeExam === "all" ||
        p.exam === activeExam ||
        (activeExam === "bece" && (p.exam === "neco-bece" || p.exam === "waec-bece"));
      const matchesQuery =
        !query.trim() ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.examLabel.toLowerCase().includes(query.toLowerCase());
      return matchesExam && matchesQuery;
    });
  }, [packs, activeExam, query]);

  const sections = useMemo(() => {
    const map = new Map<string, Pack[]>();
    for (const p of filtered) {
      if (!map.has(p.section)) map.set(p.section, []);
      map.get(p.section)!.push(p);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const totalFiles = useMemo(
    () =>
      packs.reduce(
        (total, pack) => total + (pack.packType === "single" ? 1 : pack.packFiles.length),
        0,
      ),
    [packs],
  );

  return (
    <div className="lp-root min-h-screen bg-[#f7faf8]">
      <Navbar />

      {/* Early access banner */}
      <div className="flex items-center justify-center gap-2 bg-green-600 text-white text-center text-[13px] font-semibold px-5 py-2.5">
        <PartyPopper size={15} className="flex-shrink-0" />
        <span>
          <strong className="font-extrabold">Free access during early launch</strong>{" "}
          — every pack, no payment, while we build out Assessly.
        </span>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden bg-[#0d1a0f] px-6 pt-14 pb-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(22,163,74,0.1)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute bottom-[-40px] left-[40%] h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.08)_0%,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-5xl gap-10 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-green-200">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Question Bank · Free Access
            </div>
            <h1 className="mb-3.5 font-[var(--lp-serif)] text-[clamp(32px,5vw,54px)] leading-[1.08] tracking-tight text-white">
              Every past paper.
              <br />
              <em className="italic text-green-500">Free to download.</em>
            </h1>
            <p className="mb-7 max-w-md text-base leading-relaxed text-white/45">
              Every JAMB, WAEC, and Post-UTME pack — completely free while
              we&apos;re in early access. No card, no catch.
            </p>
            <div className="group flex max-w-[440px] items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.07] px-4 py-3 backdrop-blur-sm transition-colors focus-within:border-green-500/50 focus-within:bg-white/10">
              <Search size={17} className="flex-shrink-0 text-white/35" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subject, year, or exam type..."
                className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-white/35"
              />
            </div>
          </div>
          <div className="flex gap-6 md:flex-col md:gap-5 md:text-right">
            <div>
              <span className="block text-[28px] font-extrabold leading-none tracking-tight text-white">
                {loadingPacks ? "—" : `${packs.length}+`}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/30">
                Packs Available
              </span>
            </div>
            <div>
              <span className="block text-[28px] font-extrabold leading-none tracking-tight text-white">
                {loadingPacks ? "—" : totalFiles.toLocaleString()}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/30">
                PDF Files
              </span>
            </div>
            <div>
              <span className="block text-[28px] font-extrabold leading-none tracking-tight text-white">
                100%
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/30">
                Free Right Now
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exam tabs */}
      <div className="sticky top-[64px] z-30 border-b border-[#e2ede6] bg-white/95 px-6 backdrop-blur">
        <div className="mx-auto flex max-w-5xl gap-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EXAM_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveExam(t.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-5 py-3.5 text-sm font-semibold transition-colors ${
                activeExam === t.key
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-[#4a5e4e] hover:text-[#0d1a0f]"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 pb-20">
        {/* Loading skeleton */}
        {loadingPacks && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-[18px] border border-[#e2ede6] bg-white p-5 h-44" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingPacks && packs.length === 0 && (
          <div className="rounded-2xl border border-[#e2ede6] bg-white p-14 text-center">
            <Package size={40} className="mx-auto mb-4 text-[#9db5a3]" />
            <p className="text-sm font-semibold text-[#4a5e4e]">No packs available yet.</p>
            <p className="mt-1 text-xs text-[#9db5a3]">Check back soon — we&apos;re adding packs regularly.</p>
          </div>
        )}

        {/* No search results */}
        {!loadingPacks && packs.length > 0 && sections.length === 0 && (
          <div className="rounded-2xl border border-[#e2ede6] bg-white p-10 text-center text-sm text-[#4a5e4e]">
            No packs match your search. Try a different keyword or exam type.
          </div>
        )}

        {/* Pack sections */}
        {sections.map(([section, sectionPacks]) => (
          <div key={section}>
            <div className="mb-4 flex items-center gap-2.5 text-[13px] font-extrabold uppercase tracking-wide text-[#9db5a3]">
              {section}
              <span className="h-px flex-1 bg-[#e2ede6]" />
            </div>
            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {sectionPacks.map((p) => (
                <div
                  key={p.id}
                  className="relative flex flex-col rounded-[18px] border border-[#e2ede6] bg-white p-5 transition-all hover:border-green-200 hover:shadow-[0_4px_20px_rgba(13,26,15,0.07)]"
                >
                  <span
                    className={`absolute bottom-4 left-0 top-4 w-[3px] rounded-r-[3px] ${ACCENT[p.exam]}`}
                  />
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-wide text-[#9db5a3]">
                      {p.examLabel}
                    </div>
                  </div>
                  <Link
                    href={`/admissions/question-bank/${p.slug}`}
                    className="mb-2.5 flex-1 rounded-sm text-sm font-bold leading-snug text-[#0d1a0f] outline-none transition-colors hover:text-green-700 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                  >
                    {p.title}
                  </Link>
                  <div className="mb-2.5 flex flex-wrap gap-1">
                    {p.packType === "pack" && (
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-indigo-100 text-indigo-600">
                        {p.packFiles.length} files
                      </span>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-[#e2ede6] pt-3">
                    <span className="flex items-center gap-1 text-[13px] font-extrabold text-green-600">
                      <Check size={14} /> Free
                    </span>

                    <Link
                      href={`/admissions/question-bank/${p.slug}`}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border-[1.5px] border-green-200 bg-green-50 px-3.5 py-2 text-[13px] font-bold text-green-700 outline-none transition-colors hover:bg-green-100 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                    >
                      <FileText aria-hidden="true" size={14} /> View pack
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
