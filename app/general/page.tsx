"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Mode definitions ─────────────────────────────────────────────────────────
const MODES = [
    {
        id: "practice",
        name: "Practice",
        tagline: "Learn at your own pace",
        description: "Topic-based questions with hints on request and full explanations after each answer. Great for building understanding.",
        tags: ["Hints", "Explanations", "No timer"],
        accent: {
            bar: "bg-emerald-500",
            border: "border-emerald-400",
            bracket: "border-emerald-400",
            text: "text-emerald-600",
            badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
            btn: "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500",
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
            glow: "shadow-emerald-100",
        },
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
        ),
    },
    {
        id: "mock",
        name: "JAMB Simulation",
        tagline: "Full JAMB exam experience",
        description: "180 questions, 4 subjects, 2 hours — exactly like the real JAMB. English is compulsory. Pick 3 subjects and get a scored result.",
        tags: ["180 questions", "Timed", "Score /400"],
        accent: {
            bar: "bg-blue-500",
            border: "border-blue-400",
            bracket: "border-blue-400",
            text: "text-blue-600",
            badge: "bg-blue-50 text-blue-700 border-blue-200",
            btn: "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500",
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            glow: "shadow-blue-100",
        },
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        id: "survival",
        name: "Survival",
        tagline: "How far can you go?",
        description: "One question at a time. One wrong answer and it's over. Climb the leaderboard and test your limits under pressure.",
        tags: ["Streak-based", "One life", "High stakes"],
        accent: {
            bar: "bg-orange-500",
            border: "border-orange-400",
            bracket: "border-orange-400",
            text: "text-orange-600",
            badge: "bg-orange-50 text-orange-700 border-orange-200",
            btn: "bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-400",
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            glow: "shadow-orange-100",
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
        tagline: "Practice with real exam papers",
        description: "Authentic past questions from JAMB, WAEC, NECO, and BECE organised by year. Review with full explanations.",
        tags: ["Real papers", "By year", "Explanations"],
        accent: {
            bar: "bg-violet-500",
            border: "border-violet-400",
            bracket: "border-violet-400",
            text: "text-violet-600",
            badge: "bg-violet-50 text-violet-700 border-violet-200",
            btn: "bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-500",
            iconBg: "bg-violet-100",
            iconColor: "text-violet-600",
            glow: "shadow-violet-100",
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
        tagline: "Browse, read, and absorb",
        description: "Explore any subject or topic with answers and explanations always visible. Great for revision before a test.",
        tags: ["Pre-revealed answers", "Explanations", "No pressure"],
        accent: {
            bar: "bg-sky-500",
            border: "border-sky-400",
            bracket: "border-sky-400",
            text: "text-sky-600",
            badge: "bg-sky-50 text-sky-700 border-sky-200",
            btn: "bg-sky-600 hover:bg-sky-700 focus-visible:ring-sky-500",
            iconBg: "bg-sky-100",
            iconColor: "text-sky-600",
            glow: "shadow-sky-100",
        },
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                    d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
        ),
    },
] as const;

type ModeId = (typeof MODES)[number]["id"];

const ROUTES: Record<ModeId, string> = {
    practice: "/general/dashboard/practice",
    mock: "/general/dashboard/mock/jamb",
    survival: "/general/dashboard/survival",
    study: "/general/dashboard/study",
    "past-questions": "/general/dashboard/past-questions",
};

// ─── Corner bracket decorator (features-10 style) ─────────────────────────────
function CardCorners({ color }: { color: string }) {
    return (
        <>
            <span className={`absolute -left-px -top-px block size-2.5 border-l-2 border-t-2 rounded-tl-sm ${color}`} />
            <span className={`absolute -right-px -top-px block size-2.5 border-r-2 border-t-2 rounded-tr-sm ${color}`} />
            <span className={`absolute -bottom-px -left-px block size-2.5 border-b-2 border-l-2 rounded-bl-sm ${color}`} />
            <span className={`absolute -bottom-px -right-px block size-2.5 border-b-2 border-r-2 rounded-br-sm ${color}`} />
        </>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GeneralModePage() {
    const router = useRouter();
    const [navigating, setNavigating] = useState<ModeId | null>(null);

    function navigate(id: ModeId) {
        if (navigating) return;
        setNavigating(id);
        router.push(ROUTES[id]);
    }

    const isOdd = MODES.length % 2 !== 0;

    return (
        <div className="min-h-screen bg-[#f0f2f5]">

            {/* ── Header ── */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-green-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-gray-900 tracking-tight">Assessly</span>
                        <span className="hidden sm:block text-gray-300 text-sm" aria-hidden="true">·</span>
                        <span className="hidden sm:block text-xs font-semibold text-gray-500">General Mode</span>
                    </div>
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
                        Student
                    </span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

                {/* ── Hero ── */}
                <div className="mb-10">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        Choose a Mode
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 max-w-lg">
                        Pick how you want to study today. Each mode is designed for a different kind of practice.
                    </p>
                </div>

                {/* ── Mode Grid ── */}
                <div className="grid sm:grid-cols-2 gap-5">
                    {MODES.map((mode, index) => {
                        const isLastOdd = isOdd && index === MODES.length - 1;
                        const isLoading = navigating === mode.id;
                        const isDisabled = navigating !== null;

                        return (
                            <div
                                key={mode.id}
                                onClick={() => navigate(mode.id)}
                                role="button"
                                tabIndex={0}
                                aria-label={`Start ${mode.name}`}
                                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(mode.id)}
                                className={[
                                    "group relative bg-white rounded-2xl overflow-hidden select-none cursor-pointer",
                                    "border transition-all duration-200",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400",
                                    isDisabled
                                        ? "opacity-60 pointer-events-none"
                                        : `hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:shadow-sm ${mode.accent.glow}`,
                                    isLoading
                                        ? `border-2 ${mode.accent.border} shadow-lg ${mode.accent.glow}`
                                        : "border-gray-200 shadow-sm hover:border-gray-300",
                                    isLastOdd ? "sm:col-span-2 sm:max-w-[calc(50%-10px)] sm:mx-auto sm:w-full" : "",
                                ].filter(Boolean).join(" ")}
                            >
                                {/* Corner decorators — visible on hover or when loading */}
                                <CardCorners color={isLoading
                                    ? mode.accent.bracket
                                    : `${mode.accent.bracket} opacity-0 group-hover:opacity-100 transition-opacity duration-200`
                                } />

                                {/* Top accent bar */}
                                <div className={`h-1 w-full ${mode.accent.bar}`} />

                                <div className="p-6 flex flex-col gap-4">
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-xl ${mode.accent.iconBg} flex items-center justify-center ${mode.accent.iconColor} flex-shrink-0`} aria-hidden="true">
                                        {mode.icon}
                                    </div>

                                    {/* Name + tagline */}
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900 leading-snug">{mode.name}</h2>
                                        <p className={`text-xs font-semibold mt-0.5 ${mode.accent.text}`}>{mode.tagline}</p>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-gray-500 leading-relaxed flex-1">{mode.description}</p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {mode.tags.map((tag) => (
                                            <span key={tag} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${mode.accent.badge}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-dashed border-gray-100" />

                                    {/* CTA */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(mode.id); }}
                                        disabled={isDisabled}
                                        aria-label={`Start ${mode.name}`}
                                        className={[
                                            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl",
                                            "text-sm font-bold text-white",
                                            "transition-colors duration-150",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                                            "disabled:opacity-60 disabled:cursor-not-allowed",
                                            mode.accent.btn,
                                        ].join(" ")}
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Opening…
                                            </>
                                        ) : (
                                            <>
                                                Start
                                                <svg className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Footer note ── */}
                <p className="mt-10 text-center text-xs text-gray-400">
                    Assessly General Mode · All modes pull from the same question bank
                </p>

            </main>
        </div>
    );
}
