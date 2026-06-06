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
        accentBg: "bg-emerald-50",
        accentBorder: "border-emerald-200",
        accentText: "text-emerald-700",
        accentBadge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        accentBtn: "bg-emerald-600 hover:bg-emerald-700",
        accentGlow: "shadow-emerald-100",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
        ),
    },
    {
        id: "mock",
        name: "Mock Exam",
        tagline: "Simulate real exam conditions",
        description: "Full timed exam experience. Choose your exam board (JAMB, WAEC, NECO) and face the real pressure of exam day.",
        tags: ["Timed", "Exam-style", "Score report"],
        accentBg: "bg-blue-50",
        accentBorder: "border-blue-200",
        accentText: "text-blue-700",
        accentBadge: "bg-blue-100 text-blue-700 border-blue-200",
        accentBtn: "bg-blue-600 hover:bg-blue-700",
        accentGlow: "shadow-blue-100",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        accentBg: "bg-orange-50",
        accentBorder: "border-orange-200",
        accentText: "text-orange-700",
        accentBadge: "bg-orange-100 text-orange-700 border-orange-200",
        accentBtn: "bg-orange-500 hover:bg-orange-600",
        accentGlow: "shadow-orange-100",
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        accentBg: "bg-violet-50",
        accentBorder: "border-violet-200",
        accentText: "text-violet-700",
        accentBadge: "bg-violet-100 text-violet-700 border-violet-200",
        accentBtn: "bg-violet-600 hover:bg-violet-700",
        accentGlow: "shadow-violet-100",
        iconBg: "bg-violet-100",
        iconColor: "text-violet-600",
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        ),
    },
] as const;

type ModeId = (typeof MODES)[number]["id"];

// ─── Page ─────────────────────────────────────────────────────────────────────
// Modes that are ready (have a route)
const READY_MODES: Record<string, string> = {
    practice: "/general/dashboard/practice",
    survival: "/general/dashboard/survival",
};

export default function GeneralModePage() {
    const router = useRouter();
    const [selected, setSelected] = useState<ModeId | null>(null);

    return (
        <div className="min-h-screen bg-[#f0f2f5]">

            {/* ── Header ── */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-green-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-gray-900 tracking-tight">Assessly</span>
                        <span className="hidden sm:block text-gray-300 text-sm">·</span>
                        <span className="hidden sm:block text-xs font-semibold text-gray-500">General Mode</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
                            Student
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

                {/* ── Hero ── */}
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        Choose a Mode
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 max-w-lg">
                        Pick how you want to study today. Each mode is designed for a different kind of practice.
                    </p>
                </div>

                {/* ── Mode Grid ── */}
                <div className="grid sm:grid-cols-2 gap-5">
                    {MODES.map((mode) => {
                        const isSelected = selected === mode.id;
                        return (
                            <div
                                key={mode.id}
                                className={`relative bg-white border-2 rounded-2xl overflow-hidden transition-all duration-200 ${
                                    isSelected
                                        ? `${mode.accentBorder} shadow-lg ${mode.accentGlow}`
                                        : "border-gray-200 hover:border-gray-300 hover:shadow-md shadow-sm"
                                }`}
                            >
                                {/* Top accent bar */}
                                <div className={`h-1 w-full ${mode.accentBtn}`} />

                                <div className="p-6 space-y-4">
                                    {/* Icon + name */}
                                    <div className="flex items-start justify-between">
                                        <div className={`w-12 h-12 rounded-xl ${mode.iconBg} flex items-center justify-center ${mode.iconColor}`}>
                                            {mode.icon}
                                        </div>
                                        {isSelected && (
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${mode.accentBadge}`}>
                                                Selected
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-extrabold text-gray-900">{mode.name}</h2>
                                        <p className={`text-xs font-semibold mt-0.5 ${mode.accentText}`}>{mode.tagline}</p>
                                    </div>

                                    <p className="text-sm text-gray-500 leading-relaxed">{mode.description}</p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {mode.tags.map((tag) => (
                                            <span key={tag} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${mode.accentBadge}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Coming Soon notice (only for modes not yet ready) */}
                                    {isSelected && !READY_MODES[mode.id] && (
                                        <div className={`rounded-xl border ${mode.accentBorder} ${mode.accentBg} px-4 py-3`}>
                                            <div className="flex items-center gap-2">
                                                <svg className={`w-4 h-4 flex-shrink-0 ${mode.accentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className={`text-xs font-semibold ${mode.accentText}`}>
                                                    {mode.name} mode is coming soon — we&apos;re building it now.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* CTA */}
                                    <button
                                        onClick={() => {
                                            if (READY_MODES[mode.id]) {
                                                router.push(READY_MODES[mode.id]);
                                            } else {
                                                setSelected(isSelected ? null : mode.id);
                                            }
                                        }}
                                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${mode.accentBtn}`}
                                    >
                                        {READY_MODES[mode.id] ? "Start" : isSelected ? "Deselect" : "Select Mode"}
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                        </svg>
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
