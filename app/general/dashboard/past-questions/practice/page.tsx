"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────
interface PastQuestion {
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

interface QuestionState {
    selectedOption: number | null;
    isAnswered: boolean;
    showHint: boolean;
}

function defaultQState(): QuestionState {
    return { selectedOption: null, isAnswered: false, showHint: false };
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function PastPracticeWrapper() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <svg className="w-8 h-8 animate-spin text-violet-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-gray-500 font-medium">Loading paper…</p>
                </div>
            </div>
        }>
            <PastPracticePage />
        </Suspense>
    );
}

function PastPracticePage() {
    const searchParams = useSearchParams();

    const subject = searchParams.get("subject") ?? "";
    const year = searchParams.get("year") ?? "";
    const examType = searchParams.get("examType") ?? "";
    const school = searchParams.get("school") ?? "";

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [questions, setQuestions] = useState<PastQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<AnswerRecord[]>([]);
    const [qStates, setQStates] = useState<Record<number, QuestionState>>({});
    const [showNavigator, setShowNavigator] = useState(true);
    const [finished, setFinished] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // ── Fetch questions ───────────────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            if (!subject || !year) { setError("Missing subject or year."); setLoading(false); return; }
            setLoading(true);
            try {
                let q = supabase
                    .from("questions")
                    .select("id, text, topic, difficulty, hint, explanation, image_url, instruction, passage, options, correct_answer")
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
                    hint: row.hint,
                    explanation: row.explanation,
                    image_url: row.image_url,
                    instruction: row.instruction,
                    passage: row.passage,
                    options: row.options ?? [],
                    correct_answer: row.correct_answer ?? 0,
                }));

                if (pool.length === 0) { setError("No questions found for this paper."); }
                setQuestions(pool);
            } catch {
                setError("Failed to load questions.");
            } finally {
                setLoading(false);
            }
        }
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subject, year, examType, school]);

    const qs = qStates[currentIndex] ?? defaultQState();

    const setQField = useCallback(<K extends keyof QuestionState>(key: K, value: QuestionState[K]) => {
        setQStates((prev) => ({ ...prev, [currentIndex]: { ...(prev[currentIndex] ?? defaultQState()), [key]: value } }));
    }, [currentIndex]);

    const navigateTo = useCallback((idx: number) => {
        if (idx >= 0 && idx < questions.length) setCurrentIndex(idx);
    }, [questions.length]);

    const handleSubmit = useCallback(() => {
        const state = qStates[currentIndex] ?? defaultQState();
        const currentQ = questions[currentIndex];
        if (state.selectedOption === null || !currentQ || submitting) return;
        setSubmitting(true);
        const isCorrect = state.selectedOption === currentQ.correct_answer;
        setAnswers((prev) => {
            if (prev.some((a) => a.questionId === currentQ.id)) return prev;
            return [...prev, { questionId: currentQ.id, chosen: state.selectedOption!, correct: currentQ.correct_answer, isCorrect, topic: currentQ.topic }];
        });
        setQStates((prev) => ({ ...prev, [currentIndex]: { ...state, isAnswered: true } }));
        setTimeout(() => setSubmitting(false), 300);
    }, [qStates, currentIndex, questions, submitting]);

    const handleNext = useCallback(() => {
        let next = currentIndex + 1;
        if (next >= questions.length) {
            const allDone = questions.every((_, i) => (qStates[i] ?? defaultQState()).isAnswered);
            if (allDone) { setFinished(true); return; }
            next = questions.findIndex((_, i) => !(qStates[i] ?? defaultQState()).isAnswered);
            if (next === -1) { setFinished(true); return; }
        }
        setCurrentIndex(next);
    }, [currentIndex, questions, qStates]);

    const getQStatus = useCallback((idx: number): "current" | "correct" | "wrong" | "selected" | "unanswered" => {
        if (idx === currentIndex) return "current";
        const state = qStates[idx];
        if (!state?.isAnswered) return state?.selectedOption != null ? "selected" : "unanswered";
        return answers.find((a) => a.questionId === questions[idx]?.id)?.isCorrect ? "correct" : "wrong";
    }, [currentIndex, qStates, answers, questions]);

    const navDotStyle = (status: ReturnType<typeof getQStatus>) => {
        switch (status) {
            case "current":    return "ring-2 ring-violet-600 ring-offset-1 bg-violet-600 text-white border-violet-600";
            case "correct":    return "bg-green-100 text-green-800 border-green-400 hover:bg-green-200";
            case "wrong":      return "bg-red-50 text-red-700 border-red-300 hover:bg-red-100";
            case "selected":   return "bg-amber-100 text-amber-800 border-amber-400 hover:bg-amber-200";
            case "unanswered": return "bg-white text-gray-500 border-gray-300 hover:bg-gray-50";
        }
    };

    const diffColor = (d: string | null) => {
        switch (d) {
            case "easy":    return "text-green-700 bg-green-50";
            case "medium":  return "text-amber-700 bg-amber-50";
            case "hard":    return "text-orange-700 bg-orange-50";
            case "extreme": return "text-red-700 bg-red-50";
            default:        return "text-gray-600 bg-gray-100";
        }
    };

    const stats = useMemo(() => {
        const total = answers.length;
        const correct = answers.filter((a) => a.isCorrect).length;
        const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
        const topicMap = new Map<string, { correct: number; total: number }>();
        for (const a of answers) {
            const t = a.topic ?? "Uncategorised";
            const e = topicMap.get(t) ?? { correct: 0, total: 0 };
            e.total++; if (a.isCorrect) e.correct++;
            topicMap.set(t, e);
        }
        const topicBreakdown = Array.from(topicMap.entries())
            .map(([topic, data]) => ({ topic, ...data }))
            .sort((a, b) => b.total - a.total);
        return { total, correct, pct, topicBreakdown };
    }, [answers]);

    // ── LOADING ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <svg className="w-8 h-8 animate-spin text-violet-600" fill="none" viewBox="0 0 24 24">
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
                <Link href="/general/dashboard/past-questions" className="inline-block text-sm font-semibold text-violet-700 hover:text-violet-800">
                    ← Back to setup
                </Link>
            </div>
        </div>
    );

    // ── SUMMARY ───────────────────────────────────────────────────────────────
    if (finished) {
        const emoji = stats.pct >= 80 ? "🎉" : stats.pct >= 50 ? "👍" : "💪";
        return (
            <div className="min-h-screen bg-[#f0f2f5]">
                <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                            {subject} · {year}
                        </span>
                    </div>
                </header>
                <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

                    {/* Score */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
                        <p className="text-4xl mb-3">{emoji}</p>
                        <h2 className="text-2xl font-extrabold text-gray-900">{stats.correct} / {stats.total}</h2>
                        <p className="text-sm text-gray-500 mt-1">{stats.pct}% correct · {subject} {year}</p>
                        <div className="mt-5 w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${stats.pct >= 80 ? "bg-green-500" : stats.pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${stats.pct}%` }}
                            />
                        </div>
                    </div>

                    {/* Topic breakdown */}
                    {stats.topicBreakdown.length > 1 && (
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
                                                <div className={`h-full rounded-full ${tPct >= 80 ? "bg-green-500" : tPct >= 50 ? "bg-amber-500" : "bg-red-400"}`} style={{ width: `${tPct}%` }} />
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
                                            {q?.explanation && (
                                                <p className="text-xs text-blue-600 mt-1 line-clamp-2">{q.explanation}</p>
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
                            href="/general/dashboard/past-questions"
                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Choose Another Paper
                        </Link>
                        <button
                            onClick={() => { setCurrentIndex(0); setAnswers([]); setQStates({}); setFinished(false); }}
                            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm py-3 rounded-xl transition-colors"
                        >
                            Retry This Paper
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

    // ── QUESTION SCREEN ───────────────────────────────────────────────────────
    if (questions.length === 0) return null;
    const currentQ = questions[currentIndex];
    const answeredCount = answers.length;
    const correctSoFar = answers.filter((a) => a.isCorrect).length;
    const progress = (answeredCount / questions.length) * 100;

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex flex-col">

            {/* ── Header ── */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded bg-violet-700 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none">Past Questions · Practice</p>
                            <h1 className="text-sm font-bold text-gray-900 truncate leading-tight">{subject} · {year}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-600">
                            <span className="text-violet-600">{answeredCount}/{questions.length}</span>
                            {correctSoFar > 0 && <><span className="text-gray-300">·</span><span className="text-green-600">{correctSoFar} ✓</span></>}
                        </div>
                        <button
                            onClick={() => setShowNavigator((v) => !v)}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${showNavigator ? "bg-violet-50 border-violet-300 text-violet-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <span className="hidden sm:inline">{showNavigator ? "Hide" : "Show"}</span>
                        </button>
                        <button
                            onClick={() => setFinished(true)}
                            className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            End
                        </button>
                    </div>
                </div>
                <div className="h-1 bg-gray-100">
                    <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
            </header>

            <div className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 lg:flex lg:gap-5 items-start ${showNavigator ? "pb-24 lg:pb-0" : ""}`}>

                <main className="flex-1 min-w-0 flex flex-col gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">

                        {/* Question header */}
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

                        {/* Options */}
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
                                    wrapperCls = "border-violet-500 bg-violet-50";
                                    circleCls = "bg-violet-600 border-violet-600 text-white";
                                    textCls = "text-violet-800";
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
                                        <span className={`text-sm font-medium leading-snug flex-1 ${textCls}`}>{opt.text}</span>
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

                    {/* Hint */}
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

                    {/* Explanation (shown after answer submitted) */}
                    {qs.isAnswered && currentQ.explanation && (
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

                    {/* Controls */}
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

                    {/* Submit / Next action */}
                    <div className="pt-1">
                        {!qs.isAnswered ? (
                            <button
                                onClick={handleSubmit}
                                disabled={qs.selectedOption === null || submitting}
                                className="w-full flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-sm"
                            >
                                {submitting ? (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                {submitting ? "Checking…" : "Submit Answer"}
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    const allAnswered = questions.every((_, i) => (qStates[i] ?? defaultQState()).isAnswered);
                                    if (allAnswered) { setFinished(true); return; }
                                    handleNext();
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-800 text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-sm"
                            >
                                {questions.every((_, i) => (qStates[i] ?? defaultQState()).isAnswered) ? "View Results" : "Next Unanswered"}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
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
                                    <button
                                        key={idx}
                                        onClick={() => navigateTo(idx)}
                                        className={`w-8 h-8 text-xs font-bold rounded flex items-center justify-center border transition-all cursor-pointer ${navDotStyle(getQStatus(idx))}`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
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

            {/* Mobile Nav */}
            {showNavigator && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 py-2">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            {questions.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => navigateTo(idx)}
                                    className={`flex-shrink-0 w-8 h-8 text-[10px] font-bold rounded flex items-center justify-center border transition-all ${navDotStyle(getQStatus(idx))}`}
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
