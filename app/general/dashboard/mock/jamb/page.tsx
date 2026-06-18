"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Step = "select" | "instructions";

export default function JambSetupPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("select");
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [error, setError] = useState("");
    const [picks, setPicks] = useState<[string, string, string]>(["", "", ""]);

    useEffect(() => {
        async function load() {
            try {
                const { data, error: err } = await supabase
                    .from("questions")
                    .select("subject")
                    .eq("exam_type", "jamb")
                    .eq("is_active", true);
                if (err) throw err;
                const unique = Array.from(
                    new Set(
                        (data ?? [])
                            .map((r: Record<string, unknown>) => r.subject as string)
                            .filter(Boolean)
                            .filter((s) => s !== "English Language")
                    )
                ).sort() as string[];
                setSubjects(unique);
            } catch {
                setError("Failed to load subjects. Please refresh and try again.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    function setPick(idx: number, val: string) {
        const next = [...picks] as [string, string, string];
        next[idx] = val;
        setPicks(next);
    }

    function getOptions(idx: number) {
        const others = picks.filter((_, i) => i !== idx);
        return subjects.filter((s) => !others.includes(s));
    }

    const allFilled = picks[0] !== "" && picks[1] !== "" && picks[2] !== "";
    const allUnique = new Set(picks.filter(Boolean)).size === 3;
    const canProceed = allFilled && allUnique;

    if (step === "instructions") {
        return (
            <InstructionsScreen
                picks={picks}
                onBack={() => setStep("select")}
                onEnter={() => {
                    const params = new URLSearchParams({ subjects: picks.join(",") });
                    router.push(`/general/dashboard/mock/jamb/session?${params.toString()}`);
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#f0f2f5]">

            {/* ── Header ── */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Link href="/general" aria-label="Back to mode selection" className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div className="h-4 w-px bg-gray-200" />
                        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-gray-900 tracking-tight">JAMB Simulator</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
                        Mock Exam
                    </span>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        Choose Your Subjects
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 max-w-lg">
                        English Language is compulsory. Select 3 additional subjects to complete your JAMB paper.
                    </p>
                </div>

                <div className="space-y-5">

                    {/* English Language — locked */}
                    <div className="bg-white border-2 border-blue-200 rounded-2xl shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-700">1</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">English Language</p>
                                    <p className="text-xs text-gray-400 mt-0.5">60 questions · Compulsory</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
                                    Locked
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Subject dropdowns */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-5 py-4 rounded-xl">
                            {error}
                        </div>
                    ) : (
                        <>
                            {([0, 1, 2] as const).map((idx) => (
                                <div key={idx} className={`bg-white border-2 rounded-2xl shadow-sm p-5 transition-colors ${picks[idx] ? "border-blue-200" : "border-gray-200"}`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${picks[idx] ? "bg-blue-600" : "bg-gray-100"}`}>
                                            <span className={`text-sm font-bold ${picks[idx] ? "text-white" : "text-gray-500"}`}>{idx + 2}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Subject {idx + 2}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">40 questions</p>
                                        </div>
                                        {picks[idx] && (
                                            <svg className="w-4 h-4 text-blue-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <select
                                        value={picks[idx]}
                                        onChange={(e) => setPick(idx, e.target.value)}
                                        aria-label={`Subject ${idx + 2}`}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer min-h-[44px]"
                                    >
                                        <option value="">— Select a subject —</option>
                                        {getOptions(idx).map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Summary pill */}
                    {canProceed && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 flex items-center gap-3">
                            <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs font-semibold text-blue-700">
                                4 subjects selected · 180 questions · 400 marks · 2 hours
                            </p>
                        </div>
                    )}

                    {/* CTA */}
                    {!loading && !error && (
                        <button
                            onClick={() => setStep("instructions")}
                            disabled={!canProceed}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-sm"
                        >
                            Continue to Instructions
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>

                <p className="mt-10 text-center text-xs text-gray-400">
                    JAMB Simulator · 180 Questions · 400 Marks · 2 Hours
                </p>

            </main>
        </div>
    );
}

// ─── Instructions screen ──────────────────────────────────────────────────────

function InstructionsScreen({
    picks,
    onBack,
    onEnter,
}: {
    picks: [string, string, string];
    onBack: () => void;
    onEnter: () => void;
}) {
    const subjects = [
        { name: "English Language", count: 60, compulsory: true },
        { name: picks[0], count: 40, compulsory: false },
        { name: picks[1], count: 40, compulsory: false },
        { name: picks[2], count: 40, compulsory: false },
    ];

    const rules = [
        "This exam contains 180 questions across 4 subjects to be completed in 2 hours.",
        "Scores are scaled: English Language out of 100, each other subject out of 100. Total is out of 400.",
        "There is no penalty for wrong answers — attempt every question.",
        "You can navigate freely between questions and subjects at any time during the exam.",
        "Flag questions for later review using the flag button on each question.",
        "The exam will submit automatically when the 2-hour timer reaches zero.",
        "Do not close or refresh the tab — your progress is saved locally as backup.",
        "Results and subject breakdown are displayed immediately after submission.",
    ];

    return (
        <div className="min-h-screen bg-[#f0f2f5]">

            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2.5">
                    <button
                        onClick={onBack}
                        aria-label="Back to subject selection"
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="h-4 w-px bg-gray-200" />
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="text-sm font-bold text-gray-900 tracking-tight">Instructions</span>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                        Before You Begin
                    </h1>
                    <p className="mt-1.5 text-sm text-gray-500">
                        Read carefully before entering the exam hall.
                    </p>
                </div>

                {/* Subject breakdown */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-bold text-gray-900">Your Paper</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {subjects.map((s, i) => (
                            <div key={i} className="px-6 py-3.5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">{s.name}</span>
                                    {s.compulsory && (
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                            Compulsory
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm text-gray-500">{s.count} questions</span>
                            </div>
                        ))}
                        <div className="px-6 py-3.5 flex items-center justify-between bg-gray-50">
                            <span className="text-sm font-bold text-gray-900">Total</span>
                            <span className="text-sm font-bold text-gray-900">180 questions · 400 marks · 2 hours</span>
                        </div>
                    </div>
                </div>

                {/* Rules */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-4">Exam Rules</h2>
                    <ul className="space-y-3">
                        {rules.map((rule, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {i + 1}
                                </span>
                                <span className="leading-relaxed">{rule}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Warning banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                        Once you enter the exam hall, the 2-hour timer starts immediately. Make sure you are ready before proceeding.
                    </p>
                </div>

                <button
                    onClick={onEnter}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-4 rounded-xl transition-colors shadow-sm"
                >
                    Enter Exam Hall
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                </button>

            </main>
        </div>
    );
}
