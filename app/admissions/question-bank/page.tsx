"use client";

import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
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
  Star,
  Search,
  Download,
  X,
  Calendar,
  Folder,
  Check,
  FileText,
  Image as ImageIcon,
  Presentation,
  PartyPopper,
} from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────

type ExamKey = "all" | "jamb" | "waec" | "neco" | "post" | "bece" | "nabteb";

const EXAM_TABS: { key: ExamKey; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <List size={16} /> },
  { key: "jamb", label: "JAMB / UTME", icon: <Target size={16} /> },
  { key: "waec", label: "WAEC", icon: <FileEdit size={16} /> },
  { key: "neco", label: "NECO", icon: <BookOpen size={16} /> },
  { key: "post", label: "Post-UTME", icon: <School size={16} /> },
  { key: "bece", label: "BECE", icon: <BookMarked size={16} /> },
  { key: "nabteb", label: "NABTEB", icon: <Wrench size={16} /> },
];

const ACCENT: Record<Exclude<ExamKey, "all">, string> = {
  jamb: "bg-green-600",
  waec: "bg-indigo-500",
  neco: "bg-rose-600",
  post: "bg-blue-600",
  bece: "bg-amber-600",
  nabteb: "bg-violet-600",
};

interface Pack {
  exam: Exclude<ExamKey, "all">;
  examLabel: string;
  title: string;
  files: ("PDF" | "DOC" | "PPT" | "IMG")[];
  years: string;
  fileCount: string;
  downloads: string;
  badge?: "New" | "Popular";
  section: string;
}

const PACKS: Pack[] = [
  {
    exam: "jamb",
    examLabel: "JAMB · All Subjects",
    title: "JAMB Past Questions 2020 – 2024",
    files: ["PDF", "DOC"],
    years: "5 yrs",
    fileCount: "28 files",
    downloads: "4.2k",
    badge: "Popular",
    section: "JAMB / UTME",
  },
  {
    exam: "jamb",
    examLabel: "JAMB · Mathematics",
    title: "JAMB Maths 2000 – 2024 with Solutions",
    files: ["PDF", "PPT"],
    years: "25 yrs",
    fileCount: "12 files",
    downloads: "2.8k",
    section: "JAMB / UTME",
  },
  {
    exam: "jamb",
    examLabel: "JAMB · Biology",
    title: "JAMB Biology 2010 – 2024 + Diagrams",
    files: ["PDF", "IMG"],
    years: "15 yrs",
    fileCount: "18 files",
    downloads: "1.1k",
    badge: "New",
    section: "JAMB / UTME",
  },
  {
    exam: "jamb",
    examLabel: "JAMB · Chemistry",
    title: "JAMB Chemistry 2005 – 2024",
    files: ["PDF"],
    years: "20 yrs",
    fileCount: "9 files",
    downloads: "980",
    section: "JAMB / UTME",
  },

  {
    exam: "waec",
    examLabel: "WAEC · All Subjects",
    title: "WAEC Complete Pack 2015 – 2024",
    files: ["PDF", "DOC", "IMG"],
    years: "10 yrs",
    fileCount: "45 files",
    downloads: "6.1k",
    badge: "Popular",
    section: "WAEC / SSCE",
  },
  {
    exam: "waec",
    examLabel: "WAEC · English",
    title: "WAEC English Language 2010 – 2024",
    files: ["PDF", "DOC"],
    years: "15 yrs",
    fileCount: "16 files",
    downloads: "3.4k",
    section: "WAEC / SSCE",
  },
  {
    exam: "waec",
    examLabel: "WAEC · Starter",
    title: "WAEC 2024 Sample Papers — Free Preview",
    files: ["PDF"],
    years: "2024",
    fileCount: "3 files",
    downloads: "9.8k",
    section: "WAEC / SSCE",
  },
  {
    exam: "waec",
    examLabel: "WAEC · Mathematics",
    title: "WAEC Maths 2010 – 2024 + Marking Schemes",
    files: ["PDF", "DOC"],
    years: "15 yrs",
    fileCount: "20 files",
    downloads: "2.1k",
    section: "WAEC / SSCE",
  },

  {
    exam: "post",
    examLabel: "Post-UTME · UNILAG",
    title: "UNILAG Post-UTME 2015 – 2024",
    files: ["PDF", "DOC"],
    years: "10 yrs",
    fileCount: "22 files",
    downloads: "5.5k",
    badge: "Popular",
    section: "Post-UTME",
  },
  {
    exam: "post",
    examLabel: "Post-UTME · OAU",
    title: "OAU Post-UTME Past Questions 2010 – 2024",
    files: ["PDF"],
    years: "15 yrs",
    fileCount: "19 files",
    downloads: "3.2k",
    section: "Post-UTME",
  },
  {
    exam: "post",
    examLabel: "Post-UTME · UI",
    title: "University of Ibadan Post-UTME 2024/25",
    files: ["PDF", "DOC"],
    years: "2024",
    fileCount: "6 files",
    downloads: "890",
    badge: "New",
    section: "Post-UTME",
  },
  {
    exam: "post",
    examLabel: "Post-UTME · FUTA",
    title: "FUTA Post-UTME Past Questions 2012 – 2024",
    files: ["PDF"],
    years: "12 yrs",
    fileCount: "14 files",
    downloads: "1.7k",
    section: "Post-UTME",
  },
];

const FILE_TAG_STYLE: Record<string, string> = {
  PDF: "bg-rose-100 text-rose-600",
  DOC: "bg-blue-100 text-blue-600",
  PPT: "bg-amber-100 text-amber-700",
  IMG: "bg-green-100 text-green-700",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function QuestionBankPage() {
  const [activeExam, setActiveExam] = useState<ExamKey>("all");
  const [query, setQuery] = useState("");
  const [modalPack, setModalPack] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [success, setSuccess] = useState(false);

  const filtered = useMemo(() => {
    return PACKS.filter((p) => {
      const matchesExam = activeExam === "all" || p.exam === activeExam;
      const matchesQuery =
        !query.trim() ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.examLabel.toLowerCase().includes(query.toLowerCase());
      return matchesExam && matchesQuery;
    });
  }, [activeExam, query]);

  const sections = useMemo(() => {
    const map = new Map<string, Pack[]>();
    for (const p of filtered) {
      if (!map.has(p.section)) map.set(p.section, []);
      map.get(p.section)!.push(p);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function openModal(title: string) {
    setModalPack(title);
    setSuccess(false);
    setEmail("");
    setEmailError(false);
  }

  function closeModal() {
    setModalPack(null);
  }

  function submitDownload() {
    if (!email || !email.includes("@")) {
      setEmailError(true);
      return;
    }
    setSuccess(true);
  }

  return (
    <div className="lp-root min-h-screen bg-[#f7faf8]">
      <Navbar />

      {/* Early access banner */}
      <div className="flex items-center justify-center gap-2 bg-green-600 text-white text-center text-[13px] font-semibold px-5 py-2.5">
        <PartyPopper size={15} className="flex-shrink-0" />
        <span>
          <strong className="font-extrabold">
            Free access during early launch
          </strong>{" "}
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
                340+
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/30">
                Packs Available
              </span>
            </div>
            <div>
              <span className="block text-[28px] font-extrabold leading-none tracking-tight text-white">
                12k+
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/30">
                Downloads
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
        {/* Featured pack */}
        <div className="relative mb-6 grid gap-8 overflow-hidden rounded-[32px] bg-[#0d1a0f] p-8 sm:p-9 md:grid-cols-[1fr_auto] md:items-center">
          <Package className="pointer-events-none absolute right-[100px] top-[-30px] h-[140px] w-[140px] opacity-[0.04] text-white" />
          <div>
            <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-amber-500">
              <Star size={12} className="fill-current" /> Most Downloaded
            </div>
            <h2 className="mb-2.5 font-[var(--lp-serif)] text-[clamp(22px,3vw,32px)] leading-[1.15] tracking-tight text-white">
              JAMB Complete Bundle
              <br />
              2010 – 2024
            </h2>
            <p className="mb-4.5 max-w-md text-sm leading-relaxed text-white/50">
              Every JAMB past question paper from 2010 to 2024 across all
              subjects — with official answer keys, marking schemes, and
              subject-by-subject study notes.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-400">
                <FileText size={12} /> PDF Papers
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-bold text-blue-300">
                <FileEdit size={12} /> Answer Keys
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-400">
                <Presentation size={12} /> Study Notes
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-bold text-green-300">
                <ImageIcon size={12} /> Diagrams
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 text-center md:text-right">
            <div className="mb-1 flex items-center justify-center gap-2 font-[var(--lp-serif)] text-[40px] leading-none tracking-tight text-white md:justify-end">
              <PartyPopper size={32} /> Free
            </div>
            <div className="mb-4 text-[13px] text-white/35">
              instant download · no card needed
            </div>
            <button
              onClick={() => openModal("JAMB Complete Bundle 2010–2024")}
              className="w-full whitespace-nowrap rounded-[12px] bg-green-600 px-7 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-green-700"
            >
              Download Pack Free →
            </button>
          </div>
        </div>

        {sections.length === 0 && (
          <div className="rounded-2xl border border-[#e2ede6] bg-white p-10 text-center text-sm text-[#4a5e4e]">
            No packs match your search. Try a different keyword or exam type.
          </div>
        )}

        {sections.map(([section, packs]) => (
          <div key={section}>
            <div className="mb-4 flex items-center gap-2.5 text-[13px] font-extrabold uppercase tracking-wide text-[#9db5a3]">
              {section}
              <span className="h-px flex-1 bg-[#e2ede6]" />
            </div>
            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {packs.map((p) => (
                <div
                  key={p.title}
                  className="relative flex flex-col rounded-[18px] border border-[#e2ede6] bg-white p-5 transition-all hover:border-green-200 hover:shadow-[0_4px_20px_rgba(13,26,15,0.07)]"
                >
                  <span
                    className={`absolute bottom-4 left-0 top-4 w-[3px] rounded-r-[3px] ${ACCENT[p.exam]}`}
                  />
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-wide text-[#9db5a3]">
                      {p.examLabel}
                    </div>
                    {p.badge && (
                      <span
                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                          p.badge === "New"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div className="mb-2.5 flex-1 text-sm font-bold leading-snug text-[#0d1a0f]">
                    {p.title}
                  </div>
                  <div className="mb-2.5 flex flex-wrap gap-1">
                    {p.files.map((f) => (
                      <span
                        key={f}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${FILE_TAG_STYLE[f]}`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="mb-3.5 flex flex-wrap items-center gap-2.5 text-xs text-[#9db5a3]">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {p.years}
                    </span>
                    <span className="flex items-center gap-1">
                      <Folder size={12} /> {p.fileCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download size={12} /> {p.downloads}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-[#e2ede6] pt-3">
                    <span className="flex items-center gap-1 text-[13px] font-extrabold text-green-600">
                      <Check size={14} /> Free
                    </span>
                    <button
                      onClick={() => openModal(p.title)}
                      className="inline-flex items-center gap-1 rounded-lg border-[1.5px] border-green-200 bg-green-50 px-3.5 py-2 text-[13px] font-bold text-green-700 transition-colors hover:bg-green-100"
                    >
                      <Download size={14} /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Download modal */}
      {modalPack && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0d1a0f]/60 p-5 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-[480px] overflow-hidden rounded-[32px] bg-white">
            <div className="flex items-start justify-between gap-4 bg-[#0d1a0f] px-7 py-6">
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-green-300">
                  <PartyPopper size={12} /> Free during early access
                </div>
                <div className="font-[var(--lp-serif)] text-[22px] leading-tight tracking-tight text-white">
                  {modalPack}
                </div>
              </div>
              <button
                onClick={closeModal}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {!success ? (
              <div className="px-7 py-6">
                <div className="mb-5 rounded-[18px] border border-[#e2ede6] bg-[#f7faf8] p-4">
                  <div className="mb-3 text-[11px] font-extrabold uppercase tracking-wide text-[#9db5a3]">
                    What&apos;s included
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5 text-[13px] text-[#4a5e4e]">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                        <FileText size={16} />
                      </div>
                      <span className="flex-1 font-semibold text-[#0d1a0f]">
                        Past Question Papers (PDF)
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[13px] text-[#4a5e4e]">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <FileEdit size={16} />
                      </div>
                      <span className="flex-1 font-semibold text-[#0d1a0f]">
                        Official Answer Keys (DOC)
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[13px] text-[#4a5e4e]">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                        <Presentation size={16} />
                      </div>
                      <span className="flex-1 font-semibold text-[#0d1a0f]">
                        Subject Study Notes (PPT)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="mb-1.5 block text-[13px] font-bold text-[#0d1a0f]">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(false);
                    }}
                    placeholder="you@gmail.com"
                    className={`w-full rounded-[12px] border-[1.5px] bg-[#f7faf8] px-4 py-3 text-[15px] text-[#0d1a0f] outline-none transition-colors focus:ring-4 focus:ring-green-100 ${
                      emailError
                        ? "border-rose-500"
                        : "border-[#e2ede6] focus:border-green-600"
                    }`}
                  />
                  <div className="mt-1.5 text-xs text-[#9db5a3]">
                    We&apos;ll send your download link here, plus updates when
                    we add new packs.
                  </div>
                </div>

                <button
                  onClick={submitDownload}
                  className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-[12px] bg-green-600 py-4 text-base font-extrabold text-white transition-colors hover:bg-green-700"
                >
                  <Download size={17} /> Get Free Download
                </button>
                <div className="mt-2.5 text-center text-xs text-[#9db5a3]">
                  No payment required · Instant access · Unsubscribe anytime
                </div>
              </div>
            ) : (
              <div className="px-7 py-8 text-center">
                <PartyPopper
                  size={48}
                  className="mx-auto mb-4 text-green-600"
                />
                <h3 className="mb-2 font-[var(--lp-serif)] text-[26px] tracking-tight text-[#0d1a0f]">
                  You&apos;re in!
                </h3>
                <p className="mb-5 text-sm leading-relaxed text-[#4a5e4e]">
                  Your download is ready. We&apos;ve also sent the link to your
                  email — check your inbox.
                </p>
                <button className="inline-flex items-center gap-2 rounded-[12px] bg-green-600 px-7 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-green-700">
                  <Download size={16} /> Download Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
