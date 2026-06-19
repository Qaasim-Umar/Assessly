"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ModeId = "practice" | "mock" | "survival" | "past-questions" | "study";

const ROUTES: Record<ModeId, string> = {
  practice: "/general/dashboard/practice",
  mock: "/general/dashboard/mock/jamb",
  survival: "/general/dashboard/survival",
  study: "/general/dashboard/study",
  "past-questions": "/general/dashboard/past-questions",
};

interface ModeCard {
  id: ModeId;
  name: string;
  description: string;
  tag: string;
  accent: {
    border: string;
    iconBg: string;
    iconText: string;
    tagBg: string;
    tagText: string;
    tagBorder: string;
    bar: string;
  };
  icon: React.ReactNode;
}

const CARDS: ModeCard[] = [
  {
    id: "practice",
    name: "Practice Mode",
    description: "Topic-based questions with hints on request and full explanations after every answer.",
    tag: "Hints",
    accent: {
      border: "hover:border-emerald-400",
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-600",
      tagBg: "bg-emerald-50",
      tagText: "text-emerald-700",
      tagBorder: "border-emerald-200",
      bar: "bg-emerald-500",
    },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    id: "survival",
    name: "Survival Mode",
    description: "Keep answering until your lives run out. One subject, infinite pressure.",
    tag: "Lives",
    accent: {
      border: "hover:border-orange-400",
      iconBg: "bg-orange-50",
      iconText: "text-orange-500",
      tagBg: "bg-orange-50",
      tagText: "text-orange-700",
      tagBorder: "border-orange-200",
      bar: "bg-orange-500",
    },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    id: "past-questions",
    name: "Past Questions",
    description: "Browse real papers from JAMB, WAEC, NECO and BECE — organised by year.",
    tag: "Archive",
    accent: {
      border: "hover:border-violet-400",
      iconBg: "bg-violet-50",
      iconText: "text-violet-600",
      tagBg: "bg-violet-50",
      tagText: "text-violet-700",
      tagBorder: "border-violet-200",
      bar: "bg-violet-500",
    },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    id: "study",
    name: "Study Mode",
    description: "Untimed practice with answers and explanations always visible. Perfect for revision.",
    tag: "Learn",
    accent: {
      border: "hover:border-sky-400",
      iconBg: "bg-sky-50",
      iconText: "text-sky-600",
      tagBg: "bg-sky-50",
      tagText: "text-sky-700",
      tagBorder: "border-sky-200",
      bar: "bg-sky-500",
    },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
          d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
];

// ── Small card ────────────────────────────────────────────────────────────────
function SmallCard({
  card,
  navigating,
  onNavigate,
}: {
  card: ModeCard;
  navigating: ModeId | null;
  onNavigate: (id: ModeId) => void;
}) {
  const isLoading = navigating === card.id;
  const isDisabled = navigating !== null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Start ${card.name}`}
      onClick={() => !isDisabled && onNavigate(card.id)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !isDisabled && onNavigate(card.id)}
      className={[
        "group relative bg-white rounded-2xl border border-gray-200 overflow-hidden select-none",
        "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
        isDisabled
          ? "opacity-60 pointer-events-none"
          : `cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-gray-300 ${card.accent.border}`,
        isLoading ? "shadow-lg" : "shadow-sm",
      ].join(" ")}
    >
      {/* top accent bar */}
      <div className={`h-1 w-full ${card.accent.bar}`} />

      <div className="p-5 flex flex-col gap-3">
        {/* icon */}
        <div className={`w-10 h-10 rounded-xl ${card.accent.iconBg} ${card.accent.iconText} flex items-center justify-center flex-shrink-0`}>
          {card.icon}
        </div>

        {/* name + description */}
        <div>
          <h2 className="text-base font-bold text-gray-900 leading-snug">{card.name}</h2>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{card.description}</p>
        </div>

        {/* tag / loading */}
        {isLoading ? (
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
            </svg>
            <span className="text-xs text-gray-400 font-medium">Opening…</span>
          </div>
        ) : (
          <span className={`self-start text-[11px] font-semibold px-2.5 py-1 rounded-full border ${card.accent.tagBg} ${card.accent.tagText} ${card.accent.tagBorder}`}>
            {card.tag}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GeneralModePage() {
  const router = useRouter();
  const [navigating, setNavigating] = useState<ModeId | null>(null);

  function navigate(id: ModeId) {
    if (navigating) return;
    setNavigating(id);
    router.push(ROUTES[id]);
  }

  const jambLoading = navigating === "mock";

  return (
    <div className="min-h-screen bg-[#f0f2f5]">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-green-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-tight">Assessly</span>
            <span className="hidden sm:block text-gray-300 text-sm" aria-hidden="true">·</span>
            <span className="hidden sm:block text-xs font-semibold text-gray-500">General Mode</span>
          </Link>
          <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
            Student
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Hero text */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            How do you want to practice?
          </h1>
          <p className="mt-2 text-sm text-gray-500 max-w-lg">
            Five ways to prepare. Pick a quick drill, simulate the real UTME, or push your limits until you run out of lives.
          </p>
        </div>

        {/* Grid — JAMB hero spans 2 cols, 4 regular cards fill the rest */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* ── JAMB Simulator hero (col-span-2) ── */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Start JAMB Simulator"
            onClick={() => !navigating && navigate("mock")}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !navigating && navigate("mock")}
            className={[
              "group relative bg-white rounded-2xl border overflow-hidden select-none sm:col-span-2",
              "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
              navigating
                ? "opacity-60 pointer-events-none"
                : "cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-green-300",
              jambLoading ? "border-green-400 shadow-lg" : "border-gray-200 shadow-sm",
            ].join(" ")}
          >
            {/* top accent bar */}
            <div className="h-1 w-full bg-green-600" />

            <div className="p-6">
              {/* badge */}
              <div className="absolute top-5 right-5">
                <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Official Format
                </span>
              </div>

              {/* icon */}
              <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mb-1">JAMB Simulator</h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-md">
                The real thing. English locked at 60 questions, plus three subjects you choose — 180 questions under exam timing.
              </p>

              {/* specs / loading */}
              <div className="mt-5 pt-4 border-t border-dashed border-gray-200">
                {jambLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                    </svg>
                    <span className="text-sm text-gray-400 font-medium">Opening…</span>
                  </div>
                ) : (
                  <div className="flex gap-6">
                    {([["180", "Questions"], ["4", "Subjects"], ["2 hr", "Timer"]] as const).map(([v, k]) => (
                      <div key={k}>
                        <div className="text-lg font-extrabold text-green-700">{v}</div>
                        <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{k}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Practice (top-right) ── */}
          <SmallCard card={CARDS[0]} navigating={navigating} onNavigate={navigate} />

          {/* ── Bottom row: Survival · Past Questions · Study ── */}
          {CARDS.slice(1).map((card) => (
            <SmallCard key={card.id} card={card} navigating={navigating} onNavigate={navigate} />
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-gray-400">
          Assessly General Mode · All modes pull from the same question bank
        </p>
      </main>
    </div>
  );
}
