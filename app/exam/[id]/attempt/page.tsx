"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { getExamById, submitExamResult, type DbExamWithQuestions, type DbQuestion } from "@/lib/examService";
import { getProfile } from "@/lib/authService";

// ─── Types ─────────────────────────────────────────────────────────────────────
type QuestionStatus = "not-viewed" | "not-answered" | "answered" | "review";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getStatusColor(status: QuestionStatus, isCurrent: boolean): string {
    const base = "w-8 h-8 text-xs font-bold rounded flex items-center justify-center border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1";
    if (isCurrent) return `${base} ring-2 ring-blue-600 ring-offset-1 bg-blue-600 text-white border-blue-600`;
    switch (status) {
        case "answered": return `${base} bg-green-100 text-green-800 border-green-400 hover:bg-green-200`;
        case "review": return `${base} bg-amber-100 text-amber-800 border-amber-400 hover:bg-amber-200`;
        case "not-answered": return `${base} bg-red-50 text-red-700 border-red-300 hover:bg-red-100`;
        case "not-viewed": return `${base} bg-white text-gray-500 border-gray-300 hover:bg-gray-50`;
    }
}

// ─── Name Entry Modal (General Mode) ────────────────────────────────────
function NameEntryModal({ onSubmit }: { onSubmit: (name: string) => void }) {
    const [name, setName] = useState("");
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900 text-center mb-1">What’s your name?</h2>
                <p className="text-xs text-gray-500 text-center mb-5">This is a practice exam — no account needed. Just enter your name to begin.</p>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSubmit(name.trim()); }}
                    placeholder="e.g. John Doe"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                    autoFocus
                />
                <button
                    onClick={() => name.trim() && onSubmit(name.trim())}
                    disabled={!name.trim()}
                    className="w-full bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold py-3 rounded-lg text-sm transition-colors"
                >
                    Start Exam
                </button>
            </div>
        </div>
    );
}

// ─── Submit Modal ──────────────────────────────────────────────────────────────
function SubmitModal({ onConfirm, onCancel, answeredCount, total }: {
    onConfirm: () => void; onCancel: () => void; answeredCount: number; total: number;
}) {
    const unanswered = total - answeredCount;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Submit Exam?</h2>
                <p className="text-sm text-gray-500 text-center mb-4">
                    You have answered <strong className="text-gray-800">{answeredCount}</strong> of{" "}
                    <strong className="text-gray-800">{total}</strong> questions.
                </p>
                {unanswered > 0 && (
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                        <p className="text-xs text-amber-800 text-center">
                            <strong>{unanswered} question{unanswered > 1 ? "s" : ""}</strong> left unanswered. You cannot return after submitting.
                        </p>
                    </div>
                )}
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg bg-blue-700 text-white font-bold text-sm hover:bg-blue-800 transition-colors">Submit Now</button>
                </div>
            </div>
        </div>
    );
}

// ─── Result Screen ─────────────────────────────────────────────────────────────
function ResultScreen({
    score, total, percentage, showResults, onHome, questions, answers,
}: {
    score: number;
    total: number;
    percentage: number;
    showResults: boolean;
    onHome: () => void;
    questions: DbQuestion[];
    answers: Record<number, number>;
}) {
    if (!showResults) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-lg max-w-sm w-full p-8 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Exam Submitted!</h2>
                    <p className="text-sm text-gray-500 mb-6">Your result is being processed. Your teacher will release the scores shortly.</p>
                    <button onClick={onHome} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg text-sm transition-colors">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const grade =
        percentage >= 90 ? { label: "Excellent", color: "text-green-600", bg: "bg-green-50 border-green-200" } :
            percentage >= 70 ? { label: "Good", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" } :
                percentage >= 50 ? { label: "Pass", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" } :
                    { label: "Below Pass", color: "text-red-600", bg: "bg-red-50 border-red-200" };

    const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

    return (
        <div className="min-h-screen bg-[#f0f2f5] py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-5">

                {/* ── Score card ── */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8 text-center">
                    <div className="relative w-28 h-28 mx-auto mb-5">
                        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                            <circle cx="50" cy="50" r="42" fill="none"
                                stroke={percentage >= 70 ? "#16a34a" : percentage >= 50 ? "#d97706" : "#dc2626"}
                                strokeWidth="10"
                                strokeDasharray={`${2 * Math.PI * 42}`}
                                strokeDashoffset={`${2 * Math.PI * 42 * (1 - percentage / 100)}`}
                                strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-extrabold text-gray-900">{percentage}%</span>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-1">Result</h2>
                    <div className={`inline-block text-xs font-bold px-3 py-1 rounded-full border mb-4 ${grade.bg} ${grade.color}`}>
                        {grade.label}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                            <p className="text-2xl font-extrabold text-green-700">{score}</p>
                            <p className="text-xs text-green-600">Correct</p>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                            <p className="text-2xl font-extrabold text-red-600">{total - score}</p>
                            <p className="text-xs text-red-500">Incorrect</p>
                        </div>
                    </div>

                    <p className="text-xs text-gray-400 mb-6">{score} of {total} questions answered correctly</p>

                    <button onClick={onHome} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg text-sm transition-colors">
                        Return to Dashboard
                    </button>
                </div>

                {/* ── Per-question review ── */}
                {questions.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-700 px-1">Answer Review</h3>
                        {questions.map((q, idx) => {
                            const isMCQ = q.options && q.options.length > 0;
                            const chosen = answers[idx]; // undefined if skipped
                            const correct = q.correct_answer;

                            // Determine outcome for MCQ
                            const isCorrect = isMCQ && correct !== null && correct !== undefined && chosen === correct;
                            const isWrong = isMCQ && correct !== null && correct !== undefined && chosen !== correct;
                            const isSkipped = isMCQ && chosen === undefined;

                            return (
                                <div
                                    key={q.id}
                                    className={`bg-white border rounded-xl overflow-hidden shadow-sm ${isCorrect ? "border-green-300" :
                                        isWrong ? "border-red-300" :
                                            "border-gray-200"
                                        }`}
                                >
                                    {/* Header row */}
                                    <div className={`px-4 py-2.5 flex items-center gap-3 ${isCorrect ? "bg-green-50" :
                                        isWrong ? "bg-red-50" :
                                            "bg-gray-50"
                                        }`}>
                                        {/* Status icon */}
                                        {isCorrect && (
                                            <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                                        )}
                                        {isWrong && (
                                            <span className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">✗</span>
                                        )}
                                        {(isSkipped || !isMCQ) && (
                                            <span className="w-6 h-6 rounded-full bg-gray-300 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">—</span>
                                        )}
                                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                            Q{idx + 1}
                                        </span>
                                        <span className={`ml-auto text-[11px] font-bold ${isCorrect ? "text-green-700" :
                                            isWrong ? "text-red-600" :
                                                "text-gray-400"
                                            }`}>
                                            {isCorrect ? "Correct" : isWrong ? "Incorrect" : isSkipped ? "Not answered" : "Theory"}
                                        </span>
                                    </div>

                                    <div className="px-4 py-3 space-y-3">
                                        {/* Question text */}
                                        <p className="text-sm font-semibold text-gray-800 leading-snug">{q.text}</p>

                                        {/* MCQ options */}
                                        {isMCQ && q.options && (
                                            <div className="space-y-1.5 mt-1">
                                                {q.options.map((opt, oi) => {
                                                    const letter = opt.label || OPTION_LETTERS[oi] || String(oi + 1);
                                                    const isChosen = chosen === oi;
                                                    const isCorrectOpt = correct === oi;

                                                    let optCls = "bg-gray-50 border-gray-200 text-gray-700";
                                                    let letterCls = "bg-gray-200 text-gray-600";

                                                    if (isCorrectOpt) {
                                                        optCls = "bg-green-50 border-green-300 text-green-800";
                                                        letterCls = "bg-green-500 text-white";
                                                    }
                                                    if (isChosen && !isCorrectOpt) {
                                                        optCls = "bg-red-50 border-red-300 text-red-700";
                                                        letterCls = "bg-red-500 text-white";
                                                    }

                                                    return (
                                                        <div key={oi} className={`flex items-start gap-2.5 px-3 py-2 rounded-lg border text-sm ${optCls}`}>
                                                            <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 ${letterCls}`}>
                                                                {letter}
                                                            </span>
                                                            <span className="font-medium leading-snug flex-1">{opt.text}</span>
                                                            {isCorrectOpt && (
                                                                <span className="text-green-600 font-bold text-xs mt-0.5 flex-shrink-0">✓ Correct</span>
                                                            )}
                                                            {isChosen && !isCorrectOpt && (
                                                                <span className="text-red-500 font-bold text-xs mt-0.5 flex-shrink-0">Your answer</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Theory: no review since not auto-graded */}
                                        {!isMCQ && (
                                            <p className="text-xs text-gray-400 italic">Theory question — marked by your teacher.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
}


// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ExamAttemptPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const examId = params.id as string;
    const isGeneral = searchParams.get("mode") === "general";

    // ── sessionStorage key for this exam session ──
    const storageKey = `exam_session_${examId}`;

    const [examData, setExamData] = useState<DbExamWithQuestions | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [theoryAnswers, setTheoryAnswers] = useState<Record<number, string>>({});
    const [statuses, setStatuses] = useState<Record<number, QuestionStatus>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState<{ score: number; total: number; percentage: number; hasTheory: boolean } | null>(null);
    const [show30sWarning, setShow30sWarning] = useState(false);
    const warned30s = useRef(false);
    const submittingRef = useRef(false); // guard against double-submission
    const [hasVisitedLast, setHasVisitedLast] = useState(false);
    const [studentName, setStudentName] = useState("Student");
    const [showNameModal, setShowNameModal] = useState(false);

    // ── Persist state to sessionStorage whenever key values change ──
    const persistedRef = useRef(false); // only persist after initial load
    useEffect(() => {
        if (!persistedRef.current) return;
        const session = {
            timeLeft,
            answers,
            theoryAnswers,
            statuses,
            currentIndex,
            hasVisitedLast,
            studentName,
        };
        sessionStorage.setItem(storageKey, JSON.stringify(session));
    }, [storageKey, timeLeft, answers, theoryAnswers, statuses, currentIndex, hasVisitedLast, studentName]);

    // Load student profile (only for non-general mode)
    useEffect(() => {
        if (isGeneral) {
            // Show name modal once exam data is loaded
            return;
        }
        getProfile().then((p) => { if (p) setStudentName(p.full_name); });
    }, [isGeneral]);

    useEffect(() => {
        let cancelled = false;
        getExamById(examId)
            .then((data) => {
                if (cancelled) return;
                if (!data) { setNotFound(true); setLoading(false); return; }
                setExamData(data);

                // ── Try to restore a saved session ──
                const savedRaw = sessionStorage.getItem(storageKey);
                if (savedRaw) {
                    try {
                        const saved = JSON.parse(savedRaw);
                        setTimeLeft(saved.timeLeft ?? (data.duration ?? 60) * 60);
                        setAnswers(saved.answers ?? {});
                        setTheoryAnswers(saved.theoryAnswers ?? {});
                        setStatuses(saved.statuses ?? (() => {
                            const init: Record<number, QuestionStatus> = {};
                            data.questions.forEach((_, i) => { init[i] = "not-viewed"; });
                            if (data.questions.length > 0) init[0] = "not-answered";
                            return init;
                        })());
                        setCurrentIndex(saved.currentIndex ?? 0);
                        setHasVisitedLast(saved.hasVisitedLast ?? false);
                        if (saved.studentName && saved.studentName !== "Student") {
                            setStudentName(saved.studentName);
                        }
                        // General mode: don't re-show name modal if name was already entered
                        if (isGeneral && saved.studentName && saved.studentName !== "Student") {
                            setShowNameModal(false);
                        } else if (isGeneral) {
                            setShowNameModal(true);
                        }
                    } catch {
                        // Corrupted session — start fresh
                        sessionStorage.removeItem(storageKey);
                        setTimeLeft((data.duration ?? 60) * 60);
                        const init: Record<number, QuestionStatus> = {};
                        data.questions.forEach((_, i) => { init[i] = "not-viewed"; });
                        if (data.questions.length > 0) init[0] = "not-answered";
                        setStatuses(init);
                        if (isGeneral) setShowNameModal(true);
                    }
                } else {
                    // No saved session — fresh start
                    setTimeLeft((data.duration ?? 60) * 60);
                    const init: Record<number, QuestionStatus> = {};
                    data.questions.forEach((_, i) => { init[i] = "not-viewed"; });
                    if (data.questions.length > 0) init[0] = "not-answered";
                    setStatuses(init);
                    if (isGeneral) setShowNameModal(true);
                }

                setLoading(false);
                // Allow persistence after state is fully initialized
                persistedRef.current = true;
            })
            .catch(() => { if (!cancelled) { setNotFound(true); setLoading(false); } });
        return () => { cancelled = true; };
    }, [examId, isGeneral, storageKey]);

    // Auto-submit on timer expiry
    const handleSubmit = useCallback(async () => {
        if (!examData || submittingRef.current) return;
        submittingRef.current = true;
        setShowSubmitModal(false);
        // Clear the saved session on submit so it doesn't restore after exam is done
        sessionStorage.removeItem(storageKey);
        const res = await submitExamResult(examId, answers, examData.questions, theoryAnswers, studentName);
        setResult(res);
        setSubmitted(true);
    }, [examId, answers, theoryAnswers, examData, studentName, storageKey]);

    // Auto-submit on timer expiry, fire 30s warning once
    useEffect(() => {
        if (loading || submitted || !examData) return;
        const interval = setInterval(() => {
            setTimeLeft((t) => {
                const next = t - 1;
                if (next === 30 && !warned30s.current) {
                    warned30s.current = true;
                    setShow30sWarning(true);
                }
                if (next <= 0) { clearInterval(interval); handleSubmit(); return 0; }
                return next;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [loading, submitted, examData, handleSubmit]);

    const questions = examData?.questions ?? [];
    const totalQuestions = questions.length;
    const timerIsUrgent = timeLeft <= 300;

    const goToQuestion = useCallback((index: number) => {
        setStatuses((prev) => {
            const updated = { ...prev };
            if (updated[index] === "not-viewed") updated[index] = "not-answered";
            return updated;
        });
        setCurrentIndex(index);
        // Mark last question as visited when student navigates to it
        if (examData && index === examData.questions.length - 1) {
            setHasVisitedLast(true);
        }
    }, [examData]);

    const handleOptionSelect = (optionIndex: number) => {
        setAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
        setStatuses((prev) => ({ ...prev, [currentIndex]: "answered" }));
    };

    const handleTheoryChange = (text: string) => {
        setTheoryAnswers((prev) => ({ ...prev, [currentIndex]: text }));
        setStatuses((prev) => ({ ...prev, [currentIndex]: text.trim() ? "answered" : "not-answered" }));
    };

    const handleMarkForReview = () => {
        setStatuses((prev) => ({ ...prev, [currentIndex]: "review" }));
        if (currentIndex < totalQuestions - 1) goToQuestion(currentIndex + 1);
    };

    const answeredCount = Object.values(statuses).filter((s) => s === "answered").length;

    // ── States ──────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
                <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm h-14 flex items-center px-6">
                    <div className="text-sm font-bold text-gray-400 animate-pulse">Loading exam…</div>
                </header>
                <div className="flex-1 flex items-center justify-center">
                    <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
            </div>
        );
    }

    if (notFound || !examData || questions.length === 0) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-gray-500 text-sm">{notFound ? "Exam not found." : "This exam has no questions yet."}</p>
                    <button onClick={() => router.push("/student")} className="mt-3 text-blue-600 text-sm hover:underline">Go back</button>
                </div>
            </div>
        );
    }

    if (submitted && result) {
        // General exams always show results instantly
        const showScore = isGeneral
            ? true
            : (!result.hasTheory && (examData.show_results ?? true));
        return (
            <ResultScreen
                score={result.score}
                total={result.total}
                percentage={result.percentage}
                showResults={showScore}
                onHome={() => router.push(isGeneral ? "/general" : "/student")}
                questions={examData.questions}
                answers={answers}
            />
        );
    }

    const currentQuestion: DbQuestion = questions[currentIndex];
    const currentAnswer = answers[currentIndex];
    const currentStatus = statuses[currentIndex];
    const options: { label: string; text: string }[] = currentQuestion.options ?? [];
    const questionImageUrl = (currentQuestion as any).image_url as string | null | undefined;

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
            {/* ── Top Bar ── */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded bg-blue-700 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none">Assessly</p>
                            <h1 className="text-sm font-bold text-gray-900 truncate leading-tight">{examData.title}</h1>
                        </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm select-none ${timerIsUrgent ? "bg-red-50 border border-red-300 text-red-700 animate-pulse" : "bg-gray-100 border border-gray-200 text-gray-800"}`}>
                        <svg className={`w-4 h-4 flex-shrink-0 ${timerIsUrgent ? "text-red-500" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" strokeWidth="1.8" /><path strokeLinecap="round" strokeWidth="1.8" d="M12 7v5l3 3" />
                        </svg>
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </header>

            {/* ── Body ── */}
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 flex gap-5 items-start">
                {/* Question Area */}
                <main className="flex-1 min-w-0 flex flex-col gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Question {currentIndex + 1} of {totalQuestions}</span>
                            {currentStatus === "review" && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                                    Marked for Review
                                </span>
                            )}
                        </div>
                        <div className="px-6 py-5">
                            {questionImageUrl && (
                                <div className="mb-4">
                                    <img
                                        src={questionImageUrl}
                                        alt="Question diagram"
                                        className="w-full max-h-[360px] object-contain rounded-lg border border-gray-200 bg-white"
                                    />
                                </div>
                            )}
                            <p className="text-base font-semibold text-gray-900 leading-relaxed">{currentQuestion.text}</p>
                        </div>

                        {/* Options */}
                        <div className="px-6 pb-6 space-y-3">
                            {options.length > 0 ? (
                                options.map((option, idx) => {
                                    const letter = option.label || (["A", "B", "C", "D", "E"][idx] ?? String(idx + 1));
                                    const isSelected = currentAnswer === idx;
                                    return (
                                        <label key={idx} className={`flex items-center gap-3.5 p-3.5 rounded-lg border-2 cursor-pointer transition-all select-none ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                                            <input type="radio" name={`q${currentIndex}`} checked={isSelected} onChange={() => handleOptionSelect(idx)} className="sr-only" />
                                            <span className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 ${isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-500"}`}>{letter}</span>
                                            <span className={`text-sm font-medium leading-snug ${isSelected ? "text-blue-800" : "text-gray-800"}`}>{option.text}</span>
                                        </label>
                                    );
                                })
                            ) : (
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={6}
                                    placeholder="Type your answer here…"
                                    value={theoryAnswers[currentIndex] ?? ""}
                                    onChange={(e) => handleTheoryChange(e.target.value)}
                                />
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <button onClick={() => currentIndex > 0 && goToQuestion(currentIndex - 1)} disabled={currentIndex === 0} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>Previous
                        </button>
                        <button onClick={handleMarkForReview} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-300 bg-amber-50 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>Mark for Review
                        </button>
                        <button onClick={() => currentIndex < totalQuestions - 1 && goToQuestion(currentIndex + 1)} disabled={currentIndex === totalQuestions - 1} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            Next<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    <div className="pt-1">
                        <div className="relative group/submit">
                            <button
                                onClick={() => setShowSubmitModal(true)}
                                disabled={!hasVisitedLast}
                                className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Submit Exam
                            </button>
                            {!hasVisitedLast && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-800 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover/submit:opacity-100 transition-opacity pointer-events-none shadow-lg z-10">
                                    Navigate to the last question first
                                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Question Navigation Panel */}
                <aside className="w-[220px] flex-shrink-0 sticky top-[72px] hidden lg:block">
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Questions</h2>
                            <p className="text-[11px] text-gray-400 mt-0.5">{answeredCount}/{totalQuestions} answered</p>
                        </div>
                        <div className="p-3 grid grid-cols-5 gap-1.5">
                            {questions.map((_, idx) => (
                                <button key={idx} onClick={() => goToQuestion(idx)} className={getStatusColor(statuses[idx] ?? "not-viewed", idx === currentIndex)}>{idx + 1}</button>
                            ))}
                        </div>
                        <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Legend</p>
                            {[{ color: "bg-green-400 border-green-500", label: "Answered" }, { color: "bg-amber-400 border-amber-500", label: "Review" }, { color: "bg-red-200 border-red-300", label: "Not Answered" }, { color: "bg-white border-gray-300", label: "Not Viewed" }].map((item) => (
                                <div key={item.label} className="flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-sm border ${item.color}`} />
                                    <span className="text-[11px] text-gray-600">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Mobile Nav */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {questions.map((_, idx) => (
                            <button key={idx} onClick={() => goToQuestion(idx)} className={`${getStatusColor(statuses[idx] ?? "not-viewed", idx === currentIndex)} flex-shrink-0 text-[10px] w-7 h-7`}>{idx + 1}</button>
                        ))}
                    </div>
                </div>
            </div>

            {showSubmitModal && (
                <SubmitModal answeredCount={answeredCount} total={totalQuestions} onConfirm={handleSubmit} onCancel={() => setShowSubmitModal(false)} />
            )}

            {/* General Mode: Name entry modal */}
            {isGeneral && showNameModal && (
                <NameEntryModal onSubmit={(name) => { setStudentName(name); setShowNameModal(false); }} />
            )}

            {/* 30-second warning toast */}
            {show30sWarning && (
                <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-red-700 text-white rounded-2xl shadow-2xl px-5 py-4 flex items-start gap-3 max-w-sm w-[calc(100vw-2rem)]">
                        <div className="flex-shrink-0 mt-0.5">
                            <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">Only 30 seconds left!</p>
                            <p className="text-xs text-red-200 mt-0.5">The exam will submit automatically when time runs out.</p>
                        </div>
                        <button
                            onClick={() => setShow30sWarning(false)}
                            className="flex-shrink-0 text-red-200 hover:text-white transition-colors ml-1"
                            aria-label="Dismiss"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
