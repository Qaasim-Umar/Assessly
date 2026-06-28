"use client";

import { Suspense, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────
interface PracticeQuestion {
    id: string;
    text: string;
    topic: string | null;
    difficulty: string | null;
    hint: string | null;
    explanation: string | null;
    image_url: string | null;
    instruction: string | null;
    passage: string | null;
    options: { label: string; text: string }[];
    correct_answer: number;
}

interface AnswerRecord {
    questionId: string;
    chosen: number;
    correct: number;
    isCorrect: boolean;
    topic: string | null;
}

// ─── Shuffle helper ──────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─── Per-question state ──────────────────────────────────────────────────────
interface QuestionState {
    selectedOption: number | null;
    isAnswered: boolean;
    showHint: boolean;
    showExplanation: boolean;
}

function defaultQState(): QuestionState {
    return { selectedOption: null, isAnswered: false, showHint: false, showExplanation: false };
}

// ─── Session persistence ─────────────────────────────────────────────────────
interface SavedSession {
    questions: PracticeQuestion[];
    qStates: Record<number, QuestionState>;
    answers: AnswerRecord[];
    currentIndex: number;
    showNavigator: boolean;
}

function sessionKey(subject: string, topic: string, difficulty: string, count: string, examType: string, school: string) {
    return `practice_${examType}_${school}_${subject}_${topic}_${difficulty}_${count}`;
}

function saveSession(key: string, data: SavedSession) {
    try { sessionStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
}

function loadSession(key: string): SavedSession | null {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as SavedSession;
    } catch { return null; }
}

function clearSession(key: string) {
    try { sessionStorage.removeItem(key); } catch { /* */ }
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function PracticeSessionWrapper() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <svg className="w-8 h-8 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-gray-500 font-medium">Loading questions…</p>
                </div>
            </div>
        }>
            <PracticeSessionPage />
        </Suspense>
    );
}

function PracticeSessionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const subject = searchParams.get("subject") ?? "";
    const topic = searchParams.get("topic") ?? "";
    const difficulty = searchParams.get("difficulty") ?? "";
    const countParam = searchParams.get("count") ?? "20";
    const examType = searchParams.get("examType") ?? "";
    const school = searchParams.get("school") ?? "";
    const sKey = sessionKey(subject, topic, difficulty, countParam, examType, school);

    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<AnswerRecord[]>([]);

    // Per-question state map (keyed by question index)
    const [qStates, setQStates] = useState<Record<number, QuestionState>>({});

    // Question navigator panel — shown by default
    const [showNavigator, setShowNavigator] = useState(true);

    // Session over
    const [finished, setFinished] = useState(false);

    // Button loading states
    const [submitting, setSubmitting] = useState(false);
    const [navigatingNew, setNavigatingNew] = useState(false);
    const [retrying, setRetrying] = useState(false);

    // Track whether we restored from sessionStorage (skip fetch if so)
    const restoredRef = useRef(false);

    // Helpers to read/write per-question state
    const qs = qStates[currentIndex] ?? defaultQState();
    const setQField = useCallback(<K extends keyof QuestionState>(key: K, value: QuestionState[K]) => {
        setQStates((prev) => ({ ...prev, [currentIndex]: { ...(prev[currentIndex] ?? defaultQState()), [key]: value } }));
    }, [currentIndex]);

    // ── Fetch questions (or restore from sessionStorage) ─────────────────────
    useEffect(() => {
        async function load() {
            if (!subject) { setError("No subject selected."); setLoading(false); return; }

            // Try restoring from sessionStorage first
            const saved = loadSession(sKey);
            if (saved && saved.questions.length > 0) {
                setQuestions(saved.questions);
                setQStates(saved.qStates);
                setAnswers(saved.answers);
                setCurrentIndex(saved.currentIndex);
                setShowNavigator(saved.showNavigator);
                restoredRef.current = true;
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                let query = supabase
                    .from("questions")
                    .select("id, text, topic, difficulty, hint, explanation, image_url, instruction, passage, options, correct_answer")
                    .is("exam_id", null)
                    .eq("is_active", true)
                    .eq("subject", subject);

                if (examType) query = query.eq("exam_type", examType);
                if (examType === "post-utme" && school) query = query.eq("university", school);
                if (topic) query = query.eq("topic", topic);
                if (difficulty) query = query.eq("difficulty", difficulty);

                const { data, error: err } = await query;
                if (err) throw err;

                let pool: PracticeQuestion[] = (data ?? []).map((row: any) => ({
                    id: row.id,
                    text: row.text,
                    topic: row.topic,
                    difficulty: row.difficulty,
                    hint: row.hint,
                    explanation: row.explanation,
                    image_url: row.image_url,
                    instruction: row.instruction,
                    passage: row.passage,
                    options: row.options ?? [],
                    correct_answer: row.correct_answer ?? 0,
                }));

                pool = shuffle(pool);

                if (countParam !== "all") {
                    const limit = parseInt(countParam, 10);
                    if (!isNaN(limit) && limit > 0) pool = pool.slice(0, limit);
                }

                if (pool.length === 0) { setError("No questions found for this selection."); }
                setQuestions(pool);
            } catch {
                setError("Failed to load questions.");
            } finally {
                setLoading(false);
            }
        }
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subject, topic, difficulty, countParam, sKey]);

    // ── Persist to sessionStorage on every meaningful change ─────────────────
    useEffect(() => {
        if (questions.length === 0 || finished) return;
        saveSession(sKey, { questions, qStates, answers, currentIndex, showNavigator });
    }, [sKey, questions, qStates, answers, currentIndex, showNavigator, finished]);

    // ── Current question ─────────────────────────────────────────────────────
    const currentQ = questions[currentIndex] ?? null;

    // ── Navigate to a specific question ──────────────────────────────────────
    const navigateTo = useCallback((idx: number) => {
        if (idx >= 0 && idx < questions.length) {
            setCurrentIndex(idx);
        }
    }, [questions.length]);

    // ── Submit answer ────────────────────────────────────────────────────────
    const handleSubmit = useCallback(() => {
        const state = qStates[currentIndex] ?? defaultQState();
        if (state.selectedOption === null || !currentQ || submitting) return;
        setSubmitting(true);
        const isCorrect = state.selectedOption === currentQ.correct_answer;
        setAnswers((prev) => {
            if (prev.some((a) => a.questionId === currentQ.id)) return prev;
            return [
                ...prev,
                {
                    questionId: currentQ.id,
                    chosen: state.selectedOption!,
                    correct: currentQ.correct_answer,
                    isCorrect,
                    topic: currentQ.topic,
                },
            ];
        });
        setQStates((prev) => ({
            ...prev,
            [currentIndex]: { ...state, isAnswered: true, showExplanation: true },
        }));
        setTimeout(() => setSubmitting(false), 300);
    }, [qStates, currentIndex, currentQ, submitting]);

    // ── Next question ────────────────────────────────────────────────────────
    const handleNext = useCallback(() => {
        let nextIdx = currentIndex + 1;
        if (nextIdx >= questions.length) {
            const allAnswered = questions.every((_, i) => (qStates[i] ?? defaultQState()).isAnswered);
            if (allAnswered) { setFinished(true); clearSession(sKey); return; }
            nextIdx = questions.findIndex((_, i) => !(qStates[i] ?? defaultQState()).isAnswered);
            if (nextIdx === -1) { setFinished(true); clearSession(sKey); return; }
        }
        setCurrentIndex(nextIdx);
    }, [currentIndex, questions, qStates, sKey]);

    // ── End session early ────────────────────────────────────────────────────
    const handleEnd = useCallback(() => {
        clearSession(sKey);
        setFinished(true);
    }, [sKey]);

    // ── Question status for navigator ────────────────────────────────────────
    const getQStatus = useCallback((idx: number): "current" | "correct" | "wrong" | "selected" | "unanswered" => {
        if (idx === currentIndex) return "current";
        const state = qStates[idx];
        if (!state || !state.isAnswered) {
            if (state?.selectedOption !== null && state?.selectedOption !== undefined) return "selected";
            return "unanswered";
        }
        const a = answers.find((a) => a.questionId === questions[idx]?.id);
        if (a?.isCorrect) return "correct";
        return "wrong";
    }, [currentIndex, qStates, answers, questions]);

    // ── Summary stats ────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = answers.length;
        const correct = answers.filter((a) => a.isCorrect).length;
        const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

        // Topic breakdown
        const topicMap = new Map<string, { correct: number; total: number }>();
        for (const a of answers) {
            const t = a.topic ?? "Uncategorised";
            const entry = topicMap.get(t) ?? { correct: 0, total: 0 };
            entry.total++;
            if (a.isCorrect) entry.correct++;
            topicMap.set(t, entry);
        }
        const topicBreakdown = Array.from(topicMap.entries())
            .map(([topic, data]) => ({ topic, ...data }))
            .sort((a, b) => b.total - a.total);

        return { total, correct, pct, topicBreakdown };
    }, [answers]);

    // ── Difficulty badge color ───────────────────────────────────────────────
    const diffColor = (d: string | null) => {
        switch (d) {
            case "easy": return "text-green-700 bg-green-50";
            case "medium": return "text-amber-700 bg-amber-50";
            case "hard": return "text-orange-700 bg-orange-50";
            case "extreme": return "text-red-700 bg-red-50";
            default: return "text-gray-600 bg-gray-100";
        }
    };

    // ── Navigator dot style (matches school CBT getStatusColor) ──────────────
    const navDotStyle = (status: ReturnType<typeof getQStatus>) => {
        switch (status) {
            case "current": return "ring-2 ring-emerald-600 ring-offset-1 bg-emerald-600 text-white border-emerald-600";
            case "correct": return "bg-green-100 text-green-800 border-green-400 hover:bg-green-200";
            case "wrong": return "bg-red-50 text-red-700 border-red-300 hover:bg-red-100";
            case "selected": return "bg-amber-100 text-amber-800 border-amber-400 hover:bg-amber-200";
            case "unanswered": return "bg-white text-gray-500 border-gray-300 hover:bg-gray-50";
        }
    };

    // ─── LOADING ─────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <svg className="w-8 h-8 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-gray-500 font-medium">Loading questions…</p>
                </div>
            </div>
        );
    }

    // ─── ERROR ───────────────────────────────────────────────────────────────
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
                    <Link href="/general/dashboard/practice" className="inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                        ← Back to setup
                    </Link>
                </div>
            </div>
        );
    }

    // ─── SUMMARY SCREEN ─────────────────────────────────────────────────────
    if (finished) {
        const resultColor = stats.pct >= 80 ? "#22c55e" : stats.pct >= 50 ? "#f59e0b" : "#ef4444";
        const resultBg = stats.pct >= 80 ? "#f0fdf4" : stats.pct >= 50 ? "#fffbeb" : "#fef2f2";
        return (
            <div className="min-h-screen bg-[#f0f2f5]">
                <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-gray-900">Practice Complete</span>
                    </div>
                </header>

                <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

                    {/* Score card */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-3" style={{ background: resultBg }}>
                            {stats.pct >= 80
                                ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={resultColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                                : stats.pct >= 50
                                ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={resultColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                                : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={resultColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                            }
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-900">
                            {stats.correct} / {stats.total}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">{stats.pct}% correct · {subject}</p>

                        {/* Score bar */}
                        <div className="mt-5 w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${stats.pct >= 80 ? "bg-green-500" : stats.pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${stats.pct}%` }}
                            />
                        </div>
                    </div>

                    {/* Topic breakdown */}
                    {stats.topicBreakdown.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">Topic Breakdown</h3>
                            <div className="space-y-3">
                                {stats.topicBreakdown.map((t) => {
                                    const tPct = Math.round((t.correct / t.total) * 100);
                                    return (
                                        <div key={t.topic}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-semibold text-gray-700">{t.topic}</span>
                                                <span className="text-xs text-gray-500">{t.correct}/{t.total} ({tPct}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${tPct >= 80 ? "bg-green-500" : tPct >= 50 ? "bg-amber-500" : "bg-red-400"}`}
                                                    style={{ width: `${tPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Question review */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Question Review</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                            {answers.map((a, i) => {
                                const q = questions.find((q) => q.id === a.questionId);
                                return (
                                    <div key={a.questionId} className="flex items-start gap-3 border border-gray-100 rounded-lg px-4 py-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${a.isCorrect ? "bg-green-100" : "bg-red-100"}`}>
                                            {a.isCorrect ? (
                                                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-gray-800 line-clamp-2">
                                                <span className="text-gray-400 font-semibold mr-1">Q{i + 1}.</span>
                                                {q?.text}
                                            </p>
                                            {!a.isCorrect && q && (
                                                <p className="text-xs text-green-700 mt-1">
                                                    Correct: {q.options[a.correct]?.label}. {q.options[a.correct]?.text}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/general/dashboard/practice"
                            onClick={() => { clearSession(sKey); setNavigatingNew(true); }}
                            className={`flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors ${navigatingNew ? "opacity-70 pointer-events-none" : ""}`}
                        >
                            {navigatingNew ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Loading…
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    New Session
                                </>
                            )}
                        </Link>
                        <button
                            disabled={retrying}
                            onClick={() => {
                                setRetrying(true);
                                clearSession(sKey);
                                setCurrentIndex(0);
                                setAnswers([]);
                                setQStates({});
                                setShowNavigator(true);
                                setFinished(false);
                                setQuestions(shuffle(questions));
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-xl transition-colors ${retrying ? "opacity-70 cursor-not-allowed" : ""}`}
                        >
                            {retrying ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Restarting…
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Retry Same Set
                                </>
                            )}
                        </button>
                    </div>
                    <Link
                        href="/general"
                        className="w-full flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-semibold text-sm py-3 rounded-xl transition-colors"
                    >
                        ← Choose a Mode
                    </Link>

                </main>
            </div>
        );
    }

    // ─── QUESTION SCREEN ─────────────────────────────────────────────────────
    if (!currentQ) return null;

    const answeredCount = answers.length;
    const correctSoFar = answers.filter((a) => a.isCorrect).length;
    const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex flex-col">

            {/* ── Top Bar (consistent with school CBT) ── */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded bg-emerald-700 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none">Assessly · Practice</p>
                            <h1 className="text-sm font-bold text-gray-900 truncate leading-tight">{subject}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-600 select-none">
                            <span className="text-emerald-600">{answeredCount}/{questions.length}</span>
                            {correctSoFar > 0 && <><span className="text-gray-300">·</span><span className="text-green-600 flex items-center gap-0.5">{correctSoFar}<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span></>}
                        </div>
                        <button
                            onClick={() => setShowNavigator((v) => !v)}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                showNavigator
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <span className="hidden sm:inline">{showNavigator ? "Hide" : "Show"}</span>
                        </button>
                        <button
                            onClick={handleEnd}
                            className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            End
                        </button>
                    </div>
                </div>
                <div className="h-1 bg-gray-100">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
            </header>

            {/* ── Body (flex layout consistent with school CBT) ── */}
            <div className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 lg:flex lg:gap-5 items-start ${showNavigator ? "pb-24 lg:pb-0" : ""}`}>

                {/* Question Area */}
                <main className="flex-1 min-w-0 flex flex-col gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                        {/* Question header bar */}
                        <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Question {currentIndex + 1} of {questions.length}
                            </span>
                            <div className="flex items-center gap-2">
                                {currentQ.topic && (
                                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                        {currentQ.topic}
                                    </span>
                                )}
                                {currentQ.difficulty && (
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${diffColor(currentQ.difficulty)}`}>
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

                        {/* Options (matches school CBT option styling) */}
                        <div className="px-6 pb-6 space-y-3">
                            {currentQ.options.map((opt, idx) => {
                                const isSelected = qs.selectedOption === idx;
                                const isCorrectOpt = qs.isAnswered && idx === currentQ.correct_answer;
                                const isWrongChoice = qs.isAnswered && idx === qs.selectedOption && idx !== currentQ.correct_answer;
                                const isInactive = qs.isAnswered && !isCorrectOpt && !isWrongChoice;

                                let wrapperCls = "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
                                let circleCls = "border-gray-300 text-gray-500";
                                let textCls = "text-gray-800";

                                if (!qs.isAnswered && isSelected) {
                                    wrapperCls = "border-emerald-500 bg-emerald-50";
                                    circleCls = "bg-emerald-600 border-emerald-600 text-white";
                                    textCls = "text-emerald-800";
                                } else if (isCorrectOpt) {
                                    wrapperCls = "border-green-500 bg-green-50";
                                    circleCls = "bg-green-600 border-green-600 text-white";
                                    textCls = "font-bold text-green-800";
                                } else if (isWrongChoice) {
                                    wrapperCls = "border-red-400 bg-red-50";
                                    circleCls = "bg-red-500 border-red-500 text-white";
                                    textCls = "text-red-700";
                                } else if (isInactive) {
                                    wrapperCls = "border-gray-200 opacity-60";
                                }

                                return (
                                    <button
                                        key={opt.label}
                                        onClick={() => !qs.isAnswered && setQField("selectedOption", idx)}
                                        disabled={qs.isAnswered}
                                        className={`w-full flex items-center gap-3.5 text-left p-3.5 rounded-lg border-2 transition-all select-none ${wrapperCls}`}
                                    >
                                        <span className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 ${circleCls}`}>
                                            {opt.label}
                                        </span>
                                        <span className={`text-sm font-medium leading-snug flex-1 ${textCls}`}>
                                            {opt.text}
                                        </span>
                                        {isCorrectOpt && (
                                            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                        {isWrongChoice && (
                                            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Hint (practice-only feature) ── */}
                    {!qs.isAnswered && currentQ.hint && (
                        <div>
                            {qs.showHint ? (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Hint</span>
                                    </div>
                                    <p className="text-sm text-amber-800">{currentQ.hint}</p>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setQField("showHint", true)}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 py-3 rounded-xl hover:bg-amber-100 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    Show Hint
                                </button>
                            )}
                        </div>
                    )}

                    {/* ── Explanation (practice-only feature) ── */}
                    {qs.isAnswered && currentQ.explanation && qs.showExplanation && (
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

                    {/* ── Controls (matches school CBT Previous/Next layout) ── */}
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={() => currentIndex > 0 && navigateTo(currentIndex - 1)}
                            disabled={currentIndex === 0}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            Previous
                        </button>
                        <button
                            onClick={() => {
                                if (!qs.isAnswered) {
                                    handleSubmit();
                                } else {
                                    const allAnswered = questions.every((_, i) => (qStates[i] ?? defaultQState()).isAnswered);
                                    if (allAnswered) { clearSession(sKey); setFinished(true); return; }
                                    handleNext();
                                }
                            }}
                            disabled={!qs.isAnswered && qs.selectedOption === null}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Submit / Next-unanswered action */}
                    <div className="pt-1">
                        {!qs.isAnswered ? (
                            <button
                                onClick={handleSubmit}
                                disabled={qs.selectedOption === null || submitting}
                                className={`w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-sm`}
                            >
                                {submitting ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Checking…
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Submit Answer
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    const allAnswered = questions.every((_, i) => (qStates[i] ?? defaultQState()).isAnswered);
                                    if (allAnswered) { clearSession(sKey); setFinished(true); return; }
                                    handleNext();
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-sm"
                            >
                                {(() => {
                                    const allAnswered = questions.every((_, i) => (qStates[i] ?? defaultQState()).isAnswered);
                                    return allAnswered ? "View Results" : "Next Unanswered";
                                })()}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </div>
                </main>

                {/* ── Desktop Sidebar (matches school CBT structure) ── */}
                {showNavigator && (
                    <aside className="w-[220px] flex-shrink-0 sticky top-[72px] hidden lg:block">
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Questions</h2>
                                <p className="text-[11px] text-gray-400 mt-0.5">{answeredCount}/{questions.length} answered</p>
                            </div>
                            <div className="p-3 grid grid-cols-5 gap-1.5">
                                {questions.map((_, idx) => {
                                    const status = getQStatus(idx);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => navigateTo(idx)}
                                            className={`w-8 h-8 text-xs font-bold rounded flex items-center justify-center border transition-all cursor-pointer ${navDotStyle(status)}`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Legend</p>
                                {[
                                    { color: "bg-green-400 border-green-500", label: "Correct" },
                                    { color: "bg-red-200 border-red-300", label: "Wrong" },
                                    { color: "bg-amber-400 border-amber-500", label: "Selected" },
                                    { color: "bg-white border-gray-300", label: "Unanswered" },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-sm border ${item.color}`} />
                                        <span className="text-[11px] text-gray-600">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                )}
            </div>

            {/* ── Mobile Nav (matches school CBT — horizontal scroll) ── */}
            {showNavigator && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 py-2">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            {questions.map((_, idx) => {
                                const status = getQStatus(idx);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => navigateTo(idx)}
                                        className={`flex-shrink-0 w-8 h-8 text-[10px] font-bold rounded flex items-center justify-center border transition-all ${navDotStyle(status)}`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
