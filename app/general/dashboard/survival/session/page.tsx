"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Question {
    id: string;
    text: string;
    topic: string | null;
    difficulty: string | null;
    explanation: string | null;
    image_url: string | null;
    options: { label: string; text: string }[];
    correct_answer: number;
}

// ─── Shuffle ─────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─── Heart icon ───────────────────────────────────────────────────────────────
function HeartIcon({ filled, size = 20 }: { filled: boolean; size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
        >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
    );
}

// ─── Wrappers ─────────────────────────────────────────────────────────────────
export default function SurvivalSessionWrapper() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
                <svg className="w-8 h-8 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        }>
            <SurvivalSessionPage />
        </Suspense>
    );
}

// ─── Session persistence ──────────────────────────────────────────────────────
interface SavedSurvivalSession {
    questions:     Question[];
    currentIndex:  number;
    livesLeft:     number;
    streak:        number;
    bestStreak:    number;
    totalCorrect:  number;
    totalAnswered: number;
    gameState:     "playing" | "game-over" | "completed";
}

function survivalKey(subject: string, examBody: string, difficulty: string, lives: number, topic: string, school: string) {
    return `survival_${examBody}_${school}_${subject}_${topic}_${difficulty}_${lives}`;
}

function saveSurvivalSession(key: string, data: SavedSurvivalSession) {
    try { sessionStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
}

function loadSurvivalSession(key: string): SavedSurvivalSession | null {
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) as SavedSurvivalSession : null;
    } catch { return null; }
}

function clearSurvivalSession(key: string) {
    try { sessionStorage.removeItem(key); } catch { /* */ }
}

function SurvivalSessionPage() {
    const router       = useRouter();
    const searchParams = useSearchParams();

    const subject    = searchParams.get("subject")    ?? "";
    const examBody   = searchParams.get("examBody")   ?? "";
    const difficulty = searchParams.get("difficulty") ?? "";
    const livesParam = parseInt(searchParams.get("lives") ?? "3", 10) as 2 | 3 | 4;
    const topic      = searchParams.get("topic")      ?? "";
    const school     = searchParams.get("school")     ?? "";

    const sKey = survivalKey(subject, examBody, difficulty, livesParam, topic, school);

    // ── State ─────────────────────────────────────────────────────────────────
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState("");
    const [questions, setQuestions] = useState<Question[]>([]);

    const [currentIndex,    setCurrentIndex]    = useState(0);
    const [selectedOption,  setSelectedOption]  = useState<number | null>(null);
    const [isAnswered,      setIsAnswered]       = useState(false);
    const [livesLeft,       setLivesLeft]        = useState<number>(livesParam);
    const [streak,          setStreak]           = useState(0);
    const [bestStreak,      setBestStreak]       = useState(0);
    const [totalCorrect,    setTotalCorrect]     = useState(0);
    const [totalAnswered,   setTotalAnswered]    = useState(0);

    // Game states: "playing" | "game-over" | "completed"
    const [gameState, setGameState] = useState<"playing" | "game-over" | "completed">("playing");

    // Shake animation on wrong answer
    const [shaking, setShaking] = useState(false);

    // Prevent double submit
    const submitting = useRef(false);

    // ── Fetch questions (or restore from sessionStorage) ──────────────────────
    useEffect(() => {
        async function load() {
            if (!subject) { setError("No subject selected."); setLoading(false); return; }

            // Restore in-progress session if one exists
            const saved = loadSurvivalSession(sKey);
            if (saved && saved.questions.length > 0 && saved.gameState === "playing") {
                setQuestions(saved.questions);
                setCurrentIndex(saved.currentIndex);
                setLivesLeft(saved.livesLeft);
                setStreak(saved.streak);
                setBestStreak(saved.bestStreak);
                setTotalCorrect(saved.totalCorrect);
                setTotalAnswered(saved.totalAnswered);
                setGameState(saved.gameState);
                setLoading(false);
                return;
            }

            try {
                let query = supabase
                    .from("questions")
                    .select("id, text, topic, difficulty, explanation, image_url, options, correct_answer")
                    .is("exam_id", null)
                    .eq("is_active", true)
                    .eq("subject", subject);

                if (examBody && examBody !== "mixed") query = query.eq("exam_type", examBody);
                if (examBody === "post_utme" && school) query = query.eq("university", school);
                if (topic)      query = query.eq("topic", topic);
                if (difficulty && difficulty !== "mixed") query = query.eq("difficulty", difficulty);

                const { data, error: err } = await query;
                if (err) throw err;

                const pool: Question[] = shuffle(
                    (data ?? []).map((row: any) => ({
                        id:             row.id,
                        text:           row.text,
                        topic:          row.topic,
                        difficulty:     row.difficulty,
                        explanation:    row.explanation,
                        image_url:      row.image_url,
                        options:        row.options ?? [],
                        correct_answer: row.correct_answer ?? 0,
                    }))
                );

                if (pool.length === 0) {
                    setError("No questions found for this selection. Try different settings.");
                } else {
                    setQuestions(pool);
                }
            } catch {
                setError("Failed to load questions. Please try again.");
            } finally {
                setLoading(false);
            }
        }
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Persist game state on every meaningful change ─────────────────────────
    useEffect(() => {
        if (questions.length === 0 || gameState !== "playing") return;
        saveSurvivalSession(sKey, {
            questions, currentIndex, livesLeft,
            streak, bestStreak, totalCorrect, totalAnswered, gameState,
        });
    }, [sKey, questions, currentIndex, livesLeft, streak, bestStreak, totalCorrect, totalAnswered, gameState]);

    // ── Submit answer ─────────────────────────────────────────────────────────
    const handleSubmit = useCallback(() => {
        const q = questions[currentIndex];
        if (selectedOption === null || !q || isAnswered || submitting.current) return;
        submitting.current = true;

        const correct = selectedOption === q.correct_answer;
        setIsAnswered(true);
        setTotalAnswered((p) => p + 1);

        if (correct) {
            const newStreak = streak + 1;
            setStreak(newStreak);
            setBestStreak((p) => Math.max(p, newStreak));
            setTotalCorrect((p) => p + 1);
        } else {
            setStreak(0);
            const newLives = livesLeft - 1;
            setLivesLeft(newLives);
            setShaking(true);
            setTimeout(() => setShaking(false), 600);
            if (newLives === 0) {
                clearSurvivalSession(sKey);
                setTimeout(() => setGameState("game-over"), 1200);
            }
        }

        submitting.current = false;
    }, [questions, currentIndex, selectedOption, isAnswered, streak, livesLeft]);

    // ── Next question ─────────────────────────────────────────────────────────
    const handleNext = useCallback(() => {
        if (gameState === "game-over") return;
        const nextIdx = currentIndex + 1;
        if (nextIdx >= questions.length) {
            setGameState("completed");
            return;
        }
        setCurrentIndex(nextIdx);
        setSelectedOption(null);
        setIsAnswered(false);
    }, [currentIndex, questions.length, gameState]);

    // ── Keyboard shortcut (1-4 to select, Enter to submit/next) ──────────────
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (gameState !== "playing") return;
            const q = questions[currentIndex];
            if (!q) return;
            if (!isAnswered && ["1","2","3","4"].includes(e.key)) {
                const idx = parseInt(e.key, 10) - 1;
                if (idx < q.options.length) setSelectedOption(idx);
            }
            if (e.key === "Enter") {
                if (!isAnswered) handleSubmit();
                else if (livesLeft > 0) handleNext();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [gameState, questions, currentIndex, isAnswered, handleSubmit, handleNext, livesLeft]);

    // ── Difficulty badge color ─────────────────────────────────────────────────
    const diffColor = (d: string | null) => {
        switch (d) {
            case "easy":    return "text-green-700 bg-green-50";
            case "medium":  return "text-amber-700 bg-amber-50";
            case "hard":    return "text-orange-700 bg-orange-50";
            case "extreme": return "text-red-700 bg-red-50";
            default:        return "text-gray-600 bg-gray-100";
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // LOADING
    if (loading) return (
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <svg className="w-8 h-8 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-500 font-medium">Loading questions…</p>
            </div>
        </div>
    );

    // ERROR
    if (error) return (
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 max-w-md w-full text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{error}</h3>
                <Link href="/general/dashboard/survival" className="inline-block text-sm font-semibold text-orange-600 hover:text-orange-700">
                    ← Back to setup
                </Link>
            </div>
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────────
    // GAME OVER
    if (gameState === "game-over") return (
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 max-w-md w-full text-center space-y-6">
                <div className="text-6xl">💔</div>
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">Game Over</h2>
                    <p className="text-sm text-gray-500 mt-1">You ran out of lives</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-2xl font-extrabold text-gray-900">{totalCorrect}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Correct answers</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <p className="text-2xl font-extrabold text-orange-600">{bestStreak}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Best streak</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-2xl font-extrabold text-gray-900">{totalAnswered}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Questions faced</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-2xl font-extrabold text-gray-900">
                            {totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0}%
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Accuracy</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-1">
                    <button
                        onClick={() => router.push(`/general/dashboard/survival/session?${searchParams.toString()}`)}
                        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3 rounded-xl transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Try Again
                    </button>
                    <Link
                        href="/general/dashboard/survival"
                        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Change Settings
                    </Link>
                </div>
            </div>
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────────
    // COMPLETED (ran out of questions — rare but possible)
    if (gameState === "completed") return (
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 max-w-md w-full text-center space-y-6">
                <div className="text-6xl">🏆</div>
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">You Survived!</h2>
                    <p className="text-sm text-gray-500 mt-1">You answered every question in the pool</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-2xl font-extrabold text-green-600">{totalCorrect}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Correct answers</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <p className="text-2xl font-extrabold text-orange-600">{bestStreak}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Best streak</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className={`flex gap-1 justify-center ${livesLeft > 0 ? "text-red-500" : "text-gray-300"}`}>
                            {Array.from({ length: livesParam }).map((_, i) => (
                                <HeartIcon key={i} filled={i < livesLeft} size={18} />
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{livesLeft} {livesLeft === 1 ? "life" : "lives"} remaining</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-2xl font-extrabold text-gray-900">
                            {totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0}%
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Accuracy</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-1">
                    <button
                        onClick={() => router.push(`/general/dashboard/survival/session?${searchParams.toString()}`)}
                        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3 rounded-xl transition-colors"
                    >
                        Play Again
                    </button>
                    <Link
                        href="/general/dashboard/survival"
                        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Change Settings
                    </Link>
                </div>
            </div>
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────────
    // PLAYING
    const currentQ = questions[currentIndex];
    if (!currentQ) return null;

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex flex-col">

            {/* ── Top bar ── */}
            <header className={`bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm transition-all ${shaking ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
                <style>{`
                    @keyframes shake {
                        0%,100%{transform:translateX(0)}
                        15%{transform:translateX(-6px)}
                        30%{transform:translateX(6px)}
                        45%{transform:translateX(-5px)}
                        60%{transform:translateX(5px)}
                        75%{transform:translateX(-3px)}
                        90%{transform:translateX(3px)}
                    }
                `}</style>
                <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    {/* Left: branding + subject */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded bg-orange-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none">Survival</p>
                            <h1 className="text-sm font-bold text-gray-900 truncate leading-tight">{subject}</h1>
                        </div>
                    </div>

                    {/* Centre: streak */}
                    {streak >= 2 && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 border border-orange-200 rounded-full">
                            <span className="text-sm">🔥</span>
                            <span className="text-xs font-bold text-orange-600">{streak} streak</span>
                        </div>
                    )}

                    {/* Right: lives */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {Array.from({ length: livesParam }).map((_, i) => (
                            <span key={i} className={`transition-colors ${i < livesLeft ? "text-red-500" : "text-gray-200"}`}>
                                <HeartIcon filled={i < livesLeft} size={20} />
                            </span>
                        ))}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-gray-100">
                    <div
                        className="h-full bg-orange-500 transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </header>

            {/* ── Question area ── */}
            <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">

                {/* Question counter */}
                <div className="flex items-center justify-between">
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

                {/* Question card */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="px-6 py-5">
                        {currentQ.image_url && (
                            <div className="mb-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={currentQ.image_url}
                                    alt="Question diagram"
                                    className="w-full max-h-72 object-contain rounded-lg border border-gray-200 bg-white"
                                />
                            </div>
                        )}
                        <p className="text-base font-semibold text-gray-900 leading-relaxed">{currentQ.text}</p>
                    </div>

                    {/* Options */}
                    <div className="px-6 pb-6 space-y-3">
                        {currentQ.options.map((opt, idx) => {
                            const isSelected    = selectedOption === idx;
                            const isCorrectOpt  = isAnswered && idx === currentQ.correct_answer;
                            const isWrongChoice = isAnswered && idx === selectedOption && idx !== currentQ.correct_answer;
                            const isInactive    = isAnswered && !isCorrectOpt && !isWrongChoice;

                            let wrapperCls = "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
                            let circleCls  = "border-gray-300 text-gray-500";
                            let textCls    = "text-gray-800";

                            if (!isAnswered && isSelected) {
                                wrapperCls = "border-orange-400 bg-orange-50";
                                circleCls  = "bg-orange-500 border-orange-500 text-white";
                                textCls    = "text-orange-800";
                            } else if (isCorrectOpt) {
                                wrapperCls = "border-green-500 bg-green-50";
                                circleCls  = "bg-green-600 border-green-600 text-white";
                                textCls    = "font-bold text-green-800";
                            } else if (isWrongChoice) {
                                wrapperCls = "border-red-400 bg-red-50";
                                circleCls  = "bg-red-500 border-red-500 text-white";
                                textCls    = "text-red-700";
                            } else if (isInactive) {
                                wrapperCls = "border-gray-200 opacity-50";
                            }

                            return (
                                <button
                                    key={opt.label}
                                    onClick={() => !isAnswered && setSelectedOption(idx)}
                                    disabled={isAnswered}
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

                {/* Explanation (after answering) */}
                {isAnswered && currentQ.explanation && (
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

                {/* Submit / Next */}
                {!isAnswered ? (
                    <button
                        onClick={handleSubmit}
                        disabled={selectedOption === null}
                        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        Submit Answer
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        disabled={livesLeft === 0}
                        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-sm"
                    >
                        {currentIndex + 1 >= questions.length ? "See Results" : "Next Question"}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}

                <p className="text-center text-[11px] text-gray-400">
                    Tip: press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">1–4</kbd> to select · <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Enter</kbd> to submit
                </p>

            </main>
        </div>
    );
}
