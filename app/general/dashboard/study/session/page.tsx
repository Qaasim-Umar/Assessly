"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────
interface StudyQuestion {
    id: string;
    text: string;
    topic: string | null;
    difficulty: string | null;
    explanation: string | null;
    image_url: string | null;
    instruction: string | null;
    passage: string | null;
    year: number | null;
    options: { label: string; text: string }[];
    correct_answer: number;
}

// ─── Session persistence ─────────────────────────────────────────────────────
function sessionKey(examType: string, school: string, subject: string, topic: string, year: string) {
    return `study_${examType}_${school}_${subject}_${topic}_${year}`;
}

function savePos(key: string, index: number) {
    try { sessionStorage.setItem(key, String(index)); } catch { /* quota */ }
}

function loadPos(key: string): number {
    try { return parseInt(sessionStorage.getItem(key) ?? "0", 10) || 0; } catch { return 0; }
}

// ─── Page wrapper ────────────────────────────────────────────────────────────
export default function StudySessionWrapper() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <svg className="w-8 h-8 animate-spin text-sky-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-gray-500 font-medium">Loading questions…</p>
                </div>
            </div>
        }>
            <StudySessionPage />
        </Suspense>
    );
}

function StudySessionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const subject = searchParams.get("subject") ?? "";
    const topic = searchParams.get("topic") ?? "";
    const examType = searchParams.get("examType") ?? "";
    const school = searchParams.get("school") ?? "";
    const yearParam = searchParams.get("year") ?? "";
    const sKey = sessionKey(examType, school, subject, topic, yearParam);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [questions, setQuestions] = useState<StudyQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showNavigator, setShowNavigator] = useState(true);

    const didRestoreRef = useRef(false);

    // ── Fetch questions ───────────────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            if (!subject) { setError("No subject selected."); setLoading(false); return; }

            setLoading(true);
            try {
                let q = supabase
                    .from("questions")
                    .select("id, text, topic, difficulty, explanation, image_url, instruction, passage, year, options, correct_answer")
                    .is("exam_id", null)
                    .eq("is_active", true)
                    .eq("subject", subject);

                if (examType) q = q.eq("exam_type", examType);
                if (examType === "post_utme" && school) q = q.eq("university", school);
                if (topic) q = q.eq("topic", topic);
                if (yearParam) q = q.eq("year", parseInt(yearParam, 10));

                // Order by year desc, then id for stable ordering
                q = q.order("year", { ascending: false }).order("id");

                const { data, error: err } = await q;
                if (err) throw err;

                const pool: StudyQuestion[] = (data ?? []).map((row: any) => ({
                    id: row.id,
                    text: row.text,
                    topic: row.topic,
                    difficulty: row.difficulty,
                    explanation: row.explanation,
                    image_url: row.image_url,
                    instruction: row.instruction,
                    passage: row.passage,
                    year: row.year,
                    options: row.options ?? [],
                    correct_answer: row.correct_answer ?? 0,
                }));

                if (pool.length === 0) { setError("No questions found for this selection."); }
                setQuestions(pool);

                if (!didRestoreRef.current) {
                    const saved = loadPos(sKey);
                    if (saved > 0 && saved < pool.length) setCurrentIndex(saved);
                    didRestoreRef.current = true;
                }
            } catch {
                setError("Failed to load questions.");
            } finally {
                setLoading(false);
            }
        }
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subject, topic, examType, school, yearParam]);

    // ── Persist position ──────────────────────────────────────────────────────
    useEffect(() => {
        if (questions.length > 0) savePos(sKey, currentIndex);
    }, [sKey, currentIndex, questions.length]);

    const navigateTo = useCallback((idx: number) => {
        if (idx >= 0 && idx < questions.length) setCurrentIndex(idx);
    }, [questions.length]);

    // ── Difficulty badge ──────────────────────────────────────────────────────
    const diffColor = (d: string | null) => {
        switch (d) {
            case "easy":    return "text-green-700 bg-green-50 border-green-200";
            case "medium":  return "text-amber-700 bg-amber-50 border-amber-200";
            case "hard":    return "text-orange-700 bg-orange-50 border-orange-200";
            case "extreme": return "text-red-700 bg-red-50 border-red-200";
            default:        return "text-gray-600 bg-gray-100 border-gray-200";
        }
    };

    // ─── LOADING ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <svg className="w-8 h-8 animate-spin text-sky-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-gray-500 font-medium">Loading questions…</p>
                </div>
            </div>
        );
    }

    // ─── ERROR ────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-6">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 max-w-md w-full text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{error}</h3>
                    <Link href="/general/dashboard/study" className="inline-block text-sm font-semibold text-sky-700 hover:text-sky-800">
                        ← Back to setup
                    </Link>
                </div>
            </div>
        );
    }

    if (questions.length === 0) return null;

    const currentQ = questions[currentIndex];
    const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex flex-col">

            {/* ── Top Bar ── */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded bg-sky-700 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                    d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none">Assessly · Study</p>
                            <h1 className="text-sm font-bold text-gray-900 truncate leading-tight">
                                {subject}{topic ? ` · ${topic}` : ""}{yearParam ? ` · ${yearParam}` : ""}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-600 select-none">
                            {currentIndex + 1} / {questions.length}
                        </div>
                        <button
                            onClick={() => setShowNavigator((v) => !v)}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                showNavigator
                                    ? "bg-sky-50 border-sky-300 text-sky-700"
                                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <span className="hidden sm:inline">{showNavigator ? "Hide" : "Show"}</span>
                        </button>
                        <Link
                            href="/general/dashboard/study"
                            className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Exit
                        </Link>
                    </div>
                </div>
                {/* Position progress bar */}
                <div className="h-1 bg-gray-100">
                    <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
            </header>

            {/* ── Body ── */}
            <div className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 lg:flex lg:gap-5 items-start ${showNavigator ? "pb-24 lg:pb-0" : ""}`}>

                {/* Question Area */}
                <main className="flex-1 min-w-0 flex flex-col gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">

                        {/* Question header */}
                        <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Question {currentIndex + 1} of {questions.length}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                {currentQ.year && (
                                    <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                                        {currentQ.year}
                                    </span>
                                )}
                                {currentQ.topic && (
                                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                        {currentQ.topic}
                                    </span>
                                )}
                                {currentQ.difficulty && (
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${diffColor(currentQ.difficulty)}`}>
                                        {currentQ.difficulty}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Question body */}
                        <div className="px-6 py-5">
                            {currentQ.image_url && (
                                <div className="mb-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={currentQ.image_url}
                                        alt="Question diagram"
                                        className="w-full max-h-[360px] object-contain rounded-lg border border-gray-200 bg-white"
                                    />
                                </div>
                            )}
                            {currentQ.passage && (
                                <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg px-5 py-4 max-h-72 overflow-y-auto">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Passage</p>
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{currentQ.passage}</p>
                                </div>
                            )}
                            {currentQ.instruction && (
                                <p className="text-xs font-medium text-gray-500 italic mb-2">{currentQ.instruction}</p>
                            )}
                            <p className="text-base font-semibold text-gray-900 leading-relaxed">{currentQ.text}</p>
                        </div>

                        {/* Options — answer always pre-revealed */}
                        <div className="px-6 pb-6 space-y-3">
                            {currentQ.options.map((opt, idx) => {
                                const isCorrect = idx === currentQ.correct_answer;
                                return (
                                    <div
                                        key={opt.label}
                                        className={`w-full flex items-center gap-3.5 p-3.5 rounded-lg border-2 select-none ${
                                            isCorrect
                                                ? "border-green-500 bg-green-50"
                                                : "border-gray-200 bg-white opacity-70"
                                        }`}
                                    >
                                        <span className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 ${
                                            isCorrect
                                                ? "bg-green-600 border-green-600 text-white"
                                                : "border-gray-300 text-gray-500"
                                        }`}>
                                            {opt.label}
                                        </span>
                                        <span className={`text-sm font-medium leading-snug flex-1 ${isCorrect ? "font-bold text-green-800" : "text-gray-600"}`}>
                                            {opt.text}
                                        </span>
                                        {isCorrect && (
                                            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Explanation ── */}
                    {currentQ.explanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
                            <div className="flex items-center gap-2 mb-1.5">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Explanation</span>
                            </div>
                            <p className="text-sm text-blue-800 leading-relaxed">{currentQ.explanation}</p>
                        </div>
                    )}

                    {/* ── Navigation controls ── */}
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={() => navigateTo(currentIndex - 1)}
                            disabled={currentIndex === 0}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            Previous
                        </button>

                        <span className="text-xs text-gray-400 font-medium sm:hidden">
                            {currentIndex + 1} / {questions.length}
                        </span>

                        <button
                            onClick={() => navigateTo(currentIndex + 1)}
                            disabled={currentIndex === questions.length - 1}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Done — shown on last question */}
                    {currentIndex === questions.length - 1 && (
                        <div className="bg-sky-50 border border-sky-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-bold text-sky-800">You&apos;ve reached the end!</p>
                                <p className="text-xs text-sky-600 mt-0.5">Reviewed {questions.length} question{questions.length !== 1 ? "s" : ""}.</p>
                            </div>
                            <Link
                                href="/general/dashboard/study"
                                className="flex-shrink-0 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                New Session
                            </Link>
                        </div>
                    )}
                </main>

                {/* ── Desktop Sidebar ── */}
                {showNavigator && (
                    <aside className="w-[220px] flex-shrink-0 sticky top-[72px] hidden lg:block">
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Questions</h2>
                                <p className="text-[11px] text-gray-400 mt-0.5">{questions.length} total</p>
                            </div>
                            <div className="p-3 grid grid-cols-5 gap-1.5">
                                {questions.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => navigateTo(idx)}
                                        className={`w-8 h-8 text-xs font-bold rounded flex items-center justify-center border transition-all cursor-pointer ${
                                            idx === currentIndex
                                                ? "ring-2 ring-sky-600 ring-offset-1 bg-sky-600 text-white border-sky-600"
                                                : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>
                )}
            </div>

            {/* ── Mobile bottom navigator ── */}
            {showNavigator && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 py-2">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            {questions.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => navigateTo(idx)}
                                    className={`flex-shrink-0 w-8 h-8 text-[10px] font-bold rounded flex items-center justify-center border transition-all ${
                                        idx === currentIndex
                                            ? "ring-2 ring-sky-600 ring-offset-1 bg-sky-600 text-white border-sky-600"
                                            : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
