"use client";

import { Suspense, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────
interface PastQuestion {
    id: string;
    text: string;
    topic: string | null;
    difficulty: string | null;
    explanation: string | null;
    image_url: string | null;
    instruction: string | null;
    passage: string | null;
    options: { label: string; text: string }[];
    correct_answer: number;
}

// seconds per question by exam type
const EXAM_PACE: Record<string, number> = {
    jamb: 60,
    waec: 90,
    neco: 90,
    bece: 60,
    post_utme: 60,
};

function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ─── Submit Confirm Modal ─────────────────────────────────────────────────────
function SubmitModal({
    onConfirm, onCancel, answered, total,
}: { onConfirm: () => void; onCancel: () => void; answered: number; total: number }) {
    const unanswered = total - answered;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Submit Exam?</h2>
                <p className="text-sm text-gray-500 text-center mb-5">
                    {unanswered > 0 ? (
                        <><strong className="text-gray-800">{unanswered}</strong> question{unanswered !== 1 ? "s" : ""} unanswered. You can still go back.</>
                    ) : (
                        <>All <strong className="text-gray-800">{total}</strong> questions answered. Ready to submit?</>
                    )}
                </p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        Go Back
                    </button>
                    <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white transition-colors">
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────
export default function TimedExamWrapper() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-gray-500 font-medium">Loading paper…</p>
                </div>
            </div>
        }>
            <TimedExamPage />
        </Suspense>
    );
}

function TimedExamPage() {
    const searchParams = useSearchParams();

    const subject = searchParams.get("subject") ?? "";
    const year = searchParams.get("year") ?? "";
    const examType = searchParams.get("examType") ?? "";
    const school = searchParams.get("school") ?? "";

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [questions, setQuestions] = useState<PastQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // selections[i] = chosen option index (or null)
    const [selections, setSelections] = useState<(number | null)[]>([]);

    const [timeLeft, setTimeLeft] = useState(0);
    const [showNavigator, setShowNavigator] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Fetch questions ───────────────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            if (!subject || !year) { setError("Missing subject or year."); setLoading(false); return; }
            setLoading(true);
            try {
                let q = supabase
                    .from("questions")
                    .select("id, text, topic, difficulty, explanation, image_url, instruction, passage, options, correct_answer")
                    .is("exam_id", null)
                    .eq("is_active", true)
                    .eq("subject", subject)
                    .eq("year", parseInt(year, 10))
                    .order("id");

                if (examType) q = q.eq("exam_type", examType);
                if (examType === "post_utme" && school) q = q.eq("university", school);

                const { data, error: err } = await q;
                if (err) throw err;

                const pool: PastQuestion[] = (data ?? []).map((row: any) => ({
                    id: row.id,
                    text: row.text,
                    topic: row.topic,
                    difficulty: row.difficulty,
                    explanation: row.explanation,
                    image_url: row.image_url,
                    instruction: row.instruction,
                    passage: row.passage,
                    options: row.options ?? [],
                    correct_answer: row.correct_answer ?? 0,
                }));

                if (pool.length === 0) { setError("No questions found for this paper."); setLoading(false); return; }

                const pace = EXAM_PACE[examType] ?? 60;
                setQuestions(pool);
                setSelections(new Array(pool.length).fill(null));
                setTimeLeft(pool.length * pace);
            } catch {
                setError("Failed to load questions.");
            } finally {
                setLoading(false);
            }
        }
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subject, year, examType, school]);

    // ── Timer — starts once questions are loaded ──────────────────────────────
    useEffect(() => {
        if (loading || submitted || timeLeft <= 0 || questions.length === 0) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(timerRef.current!);
                    setSubmitted(true);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, questions.length]);

    const handleSubmit = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setShowModal(false);
        setSubmitted(true);
    }, []);

    const navigateTo = useCallback((idx: number) => {
        if (idx >= 0 && idx < questions.length) setCurrentIndex(idx);
    }, [questions.length]);

    const selectOption = useCallback((idx: number) => {
        if (submitted) return;
        setSelections((prev) => {
            const next = [...prev];
            next[currentIndex] = idx;
            return next;
        });
    }, [submitted, currentIndex]);

    // ── Results ───────────────────────────────────────────────────────────────
    const results = useMemo(() => {
        if (!submitted) return null;
        let correct = 0;
        const topicMap = new Map<string, { correct: number; total: number }>();
        questions.forEach((q, i) => {
            const chosen = selections[i];
            const isCorrect = chosen !== null && chosen === q.correct_answer;
            if (isCorrect) correct++;
            const t = q.topic ?? "Uncategorised";
            const e = topicMap.get(t) ?? { correct: 0, total: 0 };
            e.total++; if (isCorrect) e.correct++;
            topicMap.set(t, e);
        });
        const pct = Math.round((correct / questions.length) * 100);
        const topicBreakdown = Array.from(topicMap.entries())
            .map(([topic, data]) => ({ topic, ...data }))
            .sort((a, b) => b.total - a.total);
        return { correct, total: questions.length, pct, topicBreakdown };
    }, [submitted, questions, selections]);

    const diffColor = (d: string | null) => {
        switch (d) {
            case "easy":    return "text-green-700 bg-green-50 border-green-200";
            case "medium":  return "text-amber-700 bg-amber-50 border-amber-200";
            case "hard":    return "text-orange-700 bg-orange-50 border-orange-200";
            case "extreme": return "text-red-700 bg-red-50 border-red-200";
            default:        return "text-gray-600 bg-gray-100 border-gray-200";
        }
    };

    const answeredCount = selections.filter((s) => s !== null).length;
    const isLowTime = timeLeft > 0 && timeLeft <= 300;

    const navDotStyle = (idx: number): string => {
        const base = "w-8 h-8 text-xs font-bold rounded flex items-center justify-center border transition-all cursor-pointer";
        if (idx === currentIndex) return `${base} ring-2 ring-blue-600 ring-offset-1 bg-blue-600 text-white border-blue-600`;
        if (submitted) {
            const chosen = selections[idx];
            if (chosen === null) return `${base} bg-white text-gray-400 border-gray-200`;
            return chosen === questions[idx]?.correct_answer
                ? `${base} bg-green-100 text-green-800 border-green-400 hover:bg-green-200`
                : `${base} bg-red-50 text-red-700 border-red-300 hover:bg-red-100`;
        }
        return selections[idx] !== null
            ? `${base} bg-blue-100 text-blue-800 border-blue-400 hover:bg-blue-200`
            : `${base} bg-white text-gray-500 border-gray-300 hover:bg-gray-50`;
    };

    // ── LOADING ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-500 font-medium">Loading paper…</p>
            </div>
        </div>
    );

    // ── ERROR ─────────────────────────────────────────────────────────────────
    if (error) return (
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 max-w-md w-full text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{error}</h3>
                <Link href="/general/dashboard/past-questions" className="inline-block text-sm font-semibold text-blue-700 hover:text-blue-800">
                    ← Back to setup
                </Link>
            </div>
        </div>
    );

    // ── RESULTS SCREEN ────────────────────────────────────────────────────────
    if (submitted && results) {
        const emoji = results.pct >= 80 ? "🎉" : results.pct >= 50 ? "👍" : "💪";
        const autoSubmitted = timeLeft === 0;
        return (
            <div className="min-h-screen bg-[#f0f2f5]">
                <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{subject} · {year} Results</span>
                    </div>
                </header>

                <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

                    {autoSubmitted && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs font-semibold text-amber-800">Time ran out — exam auto-submitted.</p>
                        </div>
                    )}

                    {/* Score card */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
                        <p className="text-4xl mb-3">{emoji}</p>
                        <h2 className="text-2xl font-extrabold text-gray-900">{results.correct} / {results.total}</h2>
                        <p className="text-sm text-gray-500 mt-1">{results.pct}% correct · {subject} {year}</p>
                        <div className="mt-5 w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${results.pct >= 80 ? "bg-green-500" : results.pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${results.pct}%` }}
                            />
                        </div>
                        <div className="mt-4 flex justify-center gap-6 text-xs text-gray-500">
                            <span><strong className="text-green-600">{results.correct}</strong> correct</span>
                            <span><strong className="text-red-500">{results.total - results.correct}</strong> wrong</span>
                            <span><strong className="text-gray-400">{selections.filter((s) => s === null).length}</strong> unanswered</span>
                        </div>
                    </div>

                    {/* Topic breakdown */}
                    {results.topicBreakdown.length > 1 && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">Topic Breakdown</h3>
                            <div className="space-y-3">
                                {results.topicBreakdown.map((t) => {
                                    const tPct = Math.round((t.correct / t.total) * 100);
                                    return (
                                        <div key={t.topic}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-semibold text-gray-700">{t.topic}</span>
                                                <span className="text-xs text-gray-500">{t.correct}/{t.total} ({tPct}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div className={`h-full rounded-full ${tPct >= 80 ? "bg-green-500" : tPct >= 50 ? "bg-amber-500" : "bg-red-400"}`} style={{ width: `${tPct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Full review with explanations */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Full Review</h3>
                        <div className="space-y-5 max-h-[600px] overflow-y-auto pr-1">
                            {questions.map((q, i) => {
                                const chosen = selections[i];
                                const isCorrect = chosen !== null && chosen === q.correct_answer;
                                const unanswered = chosen === null;
                                return (
                                    <div key={q.id} className={`rounded-xl border p-4 space-y-3 ${unanswered ? "border-gray-200" : isCorrect ? "border-green-200 bg-green-50/40" : "border-red-200 bg-red-50/40"}`}>
                                        <div className="flex items-start gap-2">
                                            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 text-[10px] font-bold ${unanswered ? "bg-gray-100 text-gray-500" : isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                                {i + 1}
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 leading-relaxed flex-1">{q.text}</p>
                                        </div>

                                        <div className="space-y-1.5 pl-8">
                                            {q.options.map((opt, idx) => {
                                                const isCorrectOpt = idx === q.correct_answer;
                                                const isChosen = idx === chosen;
                                                const isWrong = isChosen && !isCorrectOpt;
                                                return (
                                                    <div key={opt.label} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${isCorrectOpt ? "bg-green-100 border border-green-300 font-bold text-green-800" : isWrong ? "bg-red-100 border border-red-300 text-red-700" : "bg-white border border-gray-200 text-gray-500 opacity-60"}`}>
                                                        <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold border ${isCorrectOpt ? "bg-green-600 border-green-600 text-white" : isWrong ? "bg-red-500 border-red-500 text-white" : "border-gray-300 text-gray-400"}`}>
                                                            {opt.label}
                                                        </span>
                                                        <span className="flex-1">{opt.text}</span>
                                                        {isCorrectOpt && (
                                                            <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                        {isWrong && (
                                                            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {q.explanation && (
                                            <div className="pl-8">
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Explanation</span>
                                                    </div>
                                                    <p className="text-xs text-blue-800 leading-relaxed">{q.explanation}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/general/dashboard/past-questions"
                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Choose Another Paper
                        </Link>
                        <Link
                            href={`/general/dashboard/past-questions/timed?examType=${examType}&school=${school}&subject=${encodeURIComponent(subject)}&year=${year}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl transition-colors"
                        >
                            Retry This Paper
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    // ── EXAM SCREEN ───────────────────────────────────────────────────────────
    if (questions.length === 0) return null;
    const currentQ = questions[currentIndex];
    const currentSelection = selections[currentIndex];

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex flex-col">

            {showModal && (
                <SubmitModal
                    onConfirm={handleSubmit}
                    onCancel={() => setShowModal(false)}
                    answered={answeredCount}
                    total={questions.length}
                />
            )}

            {/* ── Header ── */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded bg-blue-700 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none">Past Questions · Timed</p>
                            <h1 className="text-sm font-bold text-gray-900 truncate leading-tight">{subject} · {year}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Timer */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold tabular-nums transition-colors ${isLowTime ? "bg-red-50 border-red-300 text-red-600 animate-pulse" : "bg-gray-100 border-gray-200 text-gray-700"}`}>
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatTime(timeLeft)}
                        </div>

                        <div className="hidden sm:flex items-center px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-600">
                            <span className="text-blue-600">{answeredCount}</span>
                            <span className="mx-1 text-gray-300">/</span>
                            <span>{questions.length}</span>
                        </div>

                        <button
                            onClick={() => setShowNavigator((v) => !v)}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${showNavigator ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <span className="hidden sm:inline">{showNavigator ? "Hide" : "Show"}</span>
                        </button>

                        <button
                            onClick={() => setShowModal(true)}
                            className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Submit
                        </button>
                    </div>
                </div>
                {/* Progress bar: answered / total */}
                <div className="h-1 bg-gray-100">
                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
                </div>
            </header>

            <div className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 lg:flex lg:gap-5 items-start ${showNavigator ? "pb-24 lg:pb-0" : ""}`}>

                <main className="flex-1 min-w-0 flex flex-col gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">

                        <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Question {currentIndex + 1} of {questions.length}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
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

                        <div className="px-6 py-5">
                            {currentQ.image_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={currentQ.image_url} alt="Question diagram"
                                    className="w-full max-h-[360px] object-contain rounded-lg border border-gray-200 bg-white mb-4" />
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

                        {/* Options — no feedback until submitted */}
                        <div className="px-6 pb-6 space-y-3">
                            {currentQ.options.map((opt, idx) => {
                                const isSelected = currentSelection === idx;
                                return (
                                    <button
                                        key={opt.label}
                                        onClick={() => selectOption(idx)}
                                        className={`w-full flex items-center gap-3.5 text-left p-3.5 rounded-lg border-2 transition-all select-none ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                                    >
                                        <span className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 ${isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-500"}`}>
                                            {opt.label}
                                        </span>
                                        <span className={`text-sm font-medium leading-snug flex-1 ${isSelected ? "text-blue-800" : "text-gray-800"}`}>
                                            {opt.text}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Prev / Next */}
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

                        {currentIndex < questions.length - 1 ? (
                            <button
                                onClick={() => navigateTo(currentIndex + 1)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Next
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white transition-colors"
                            >
                                Submit Exam
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                        )}
                    </div>
                </main>

                {/* Desktop Sidebar */}
                {showNavigator && (
                    <aside className="w-[220px] flex-shrink-0 sticky top-[72px] hidden lg:block">
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Questions</h2>
                                <p className="text-[11px] text-gray-400 mt-0.5">{answeredCount}/{questions.length} answered</p>
                            </div>
                            <div className="p-3 grid grid-cols-5 gap-1.5">
                                {questions.map((_, idx) => (
                                    <button key={idx} onClick={() => navigateTo(idx)} className={navDotStyle(idx)}>
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>
                            <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Legend</p>
                                {[
                                    { color: "bg-blue-200 border-blue-400", label: "Answered" },
                                    { color: "bg-white border-gray-300", label: "Unanswered" },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-sm border ${item.color}`} />
                                        <span className="text-[11px] text-gray-600">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="px-4 pb-4">
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
                                >
                                    Submit Exam
                                </button>
                            </div>
                        </div>
                    </aside>
                )}
            </div>

            {/* Mobile bottom navigator */}
            {showNavigator && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 py-2">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            {questions.map((_, idx) => (
                                <button key={idx} onClick={() => navigateTo(idx)} className={`flex-shrink-0 ${navDotStyle(idx)}`}>
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
