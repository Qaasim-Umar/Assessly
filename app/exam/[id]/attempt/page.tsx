"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Question {
    id: number;
    text: string;
    options: string[];
    correctAnswer: number; // index (unused in exam, just for structure)
}

const generateQuestions = (count: number): Question[] => {
    const pool: Question[] = [
        {
            id: 1,
            text: "Which of the following is the correct formula for calculating the area of a circle?",
            options: ["A = 2πr", "A = πr²", "A = πd", "A = 2πr²"],
            correctAnswer: 1,
        },
        {
            id: 2,
            text: "The value of sin(90°) is:",
            options: ["0", "½", "√2/2", "1"],
            correctAnswer: 3,
        },
        {
            id: 3,
            text: "If 2x + 5 = 13, what is the value of x?",
            options: ["3", "4", "5", "6"],
            correctAnswer: 1,
        },
        {
            id: 4,
            text: "Which of the following numbers is a prime number?",
            options: ["15", "21", "37", "49"],
            correctAnswer: 2,
        },
        {
            id: 5,
            text: "The sum of angles in a triangle is equal to:",
            options: ["90°", "180°", "270°", "360°"],
            correctAnswer: 1,
        },
        {
            id: 6,
            text: "What is the square root of 144?",
            options: ["11", "12", "13", "14"],
            correctAnswer: 1,
        },
        {
            id: 7,
            text: "The logarithm of 1000 to base 10 is:",
            options: ["1", "2", "3", "4"],
            correctAnswer: 2,
        },
        {
            id: 8,
            text: "Which of the following is the expanded form of (a + b)²?",
            options: ["a² + b²", "a² – 2ab + b²", "a² + 2ab + b²", "2a + 2b"],
            correctAnswer: 2,
        },
        {
            id: 9,
            text: "A car travels 150 km in 2.5 hours. What is its average speed?",
            options: ["50 km/h", "55 km/h", "60 km/h", "65 km/h"],
            correctAnswer: 2,
        },
        {
            id: 10,
            text: "What is 15% of 200?",
            options: ["25", "30", "35", "40"],
            correctAnswer: 1,
        },
    ];

    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
        const base = pool[i % pool.length];
        questions.push({ ...base, id: i + 1 });
    }
    return questions;
};

const TOTAL_QUESTIONS = 40;
const DURATION_SECONDS = 7200; // 2 hours

const examTitles: Record<string, string> = {
    "1": "Third Term Mathematics Examination",
    "2": "English Language Mid-Term Test",
    "3": "Biology Theory & Objectives",
    "4": "Chemistry Periodic Assessment",
};

type QuestionStatus = "not-viewed" | "not-answered" | "answered" | "review";

// ─── Helper ────────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
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

// ─── Submit Modal ──────────────────────────────────────────────────────────────

function SubmitModal({
    onConfirm,
    onCancel,
    answeredCount,
    total,
}: {
    onConfirm: () => void;
    onCancel: () => void;
    answeredCount: number;
    total: number;
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
                            <strong>{unanswered} question{unanswered > 1 ? "s" : ""}</strong> left unanswered.
                            You cannot return after submitting.
                        </p>
                    </div>
                )}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-lg bg-blue-700 text-white font-bold text-sm hover:bg-blue-800 transition-colors"
                    >
                        Submit Now
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ExamAttemptPage() {
    const router = useRouter();
    const params = useParams();
    const examId = params.id as string;

    const [questions] = useState<Question[]>(() => generateQuestions(TOTAL_QUESTIONS));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [statuses, setStatuses] = useState<Record<number, QuestionStatus>>(() => {
        const init: Record<number, QuestionStatus> = {};
        for (let i = 1; i <= TOTAL_QUESTIONS; i++) init[i] = "not-viewed";
        init[1] = "not-answered";
        return init;
    });
    const [timeLeft, setTimeLeft] = useState(DURATION_SECONDS);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const titleStr = examTitles[examId] ?? "Examination";

    // Timer
    useEffect(() => {
        if (submitted) return;
        const interval = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(interval);
                    setSubmitted(true);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [submitted]);

    const timerIsUrgent = timeLeft <= 300; // last 5 minutes

    const goToQuestion = useCallback((index: number) => {
        setStatuses((prev) => {
            const updated = { ...prev };
            const qId = questions[index].id;
            if (updated[qId] === "not-viewed") updated[qId] = "not-answered";
            return updated;
        });
        setCurrentIndex(index);
    }, [questions]);

    const handleOptionSelect = (optionIndex: number) => {
        const qId = questions[currentIndex].id;
        setAnswers((prev) => ({ ...prev, [qId]: optionIndex }));
        setStatuses((prev) => ({
            ...prev,
            [qId]: "answered",
        }));
    };

    const handleMarkForReview = () => {
        const qId = questions[currentIndex].id;
        setStatuses((prev) => ({ ...prev, [qId]: "review" }));
        if (currentIndex < TOTAL_QUESTIONS - 1) goToQuestion(currentIndex + 1);
    };

    const handleNext = () => {
        if (currentIndex < TOTAL_QUESTIONS - 1) goToQuestion(currentIndex + 1);
    };

    const handlePrev = () => {
        if (currentIndex > 0) goToQuestion(currentIndex - 1);
    };

    const answeredCount = Object.values(statuses).filter((s) => s === "answered").length;
    const currentQuestion = questions[currentIndex];
    const currentAnswer = answers[currentQuestion.id];
    const currentStatus = statuses[currentQuestion.id];

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-lg max-w-sm w-full p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Exam Submitted</h2>
                    <p className="text-sm text-gray-500 mb-1">Your responses have been recorded.</p>
                    <p className="text-xs text-gray-400 mb-6">
                        You answered {answeredCount} of {TOTAL_QUESTIONS} questions.
                    </p>
                    <button
                        onClick={() => router.push("/")}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg text-sm transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
            {/* ── Top Bar ── */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    {/* Logo + Title */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded bg-blue-700 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none">Assessly</p>
                            <h1 className="text-sm font-bold text-gray-900 truncate leading-tight">{titleStr}</h1>
                        </div>
                    </div>

                    {/* Timer */}
                    <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm select-none ${timerIsUrgent
                                ? "bg-red-50 border border-red-300 text-red-700 animate-pulse"
                                : "bg-gray-100 border border-gray-200 text-gray-800"
                            }`}
                    >
                        <svg
                            className={`w-4 h-4 flex-shrink-0 ${timerIsUrgent ? "text-red-500" : "text-gray-500"}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
                            <path strokeLinecap="round" strokeWidth="1.8" d="M12 7v5l3 3" />
                        </svg>
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </header>

            {/* ── Body ── */}
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 flex gap-5 items-start">
                {/* ─ Question Area ─ */}
                <main className="flex-1 min-w-0 flex flex-col gap-4">
                    {/* Question Card */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                        {/* Question header */}
                        <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Question {currentIndex + 1} of {TOTAL_QUESTIONS}
                            </span>
                            {currentStatus === "review" && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                    </svg>
                                    Marked for Review
                                </span>
                            )}
                        </div>

                        {/* Question text */}
                        <div className="px-6 py-5">
                            <p className="text-base font-semibold text-gray-900 leading-relaxed">
                                {currentQuestion.text}
                            </p>
                        </div>

                        {/* Options */}
                        <div className="px-6 pb-6 space-y-3">
                            {currentQuestion.options.map((option, idx) => {
                                const letter = ["A", "B", "C", "D"][idx];
                                const isSelected = currentAnswer === idx;
                                return (
                                    <label
                                        key={idx}
                                        className={`flex items-center gap-3.5 p-3.5 rounded-lg border-2 cursor-pointer transition-all select-none ${isSelected
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`q${currentQuestion.id}`}
                                            checked={isSelected}
                                            onChange={() => handleOptionSelect(idx)}
                                            className="sr-only"
                                        />
                                        <span
                                            className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 ${isSelected
                                                    ? "bg-blue-600 border-blue-600 text-white"
                                                    : "border-gray-300 text-gray-500"
                                                }`}
                                        >
                                            {letter}
                                        </span>
                                        <span
                                            className={`text-sm font-medium leading-snug ${isSelected ? "text-blue-800" : "text-gray-800"
                                                }`}
                                        >
                                            {option}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        {/* Left: Prev */}
                        <button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            Previous
                        </button>

                        {/* Center: Mark for Review */}
                        <button
                            onClick={handleMarkForReview}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-300 bg-amber-50 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            Mark for Review
                        </button>

                        {/* Right: Next */}
                        <button
                            onClick={handleNext}
                            disabled={currentIndex === TOTAL_QUESTIONS - 1}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Submit Exam Button */}
                    <div className="pt-1">
                        <button
                            onClick={() => setShowSubmitModal(true)}
                            className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-sm py-3.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Submit Exam
                        </button>
                    </div>
                </main>

                {/* ─ Question Navigation Panel ─ */}
                <aside className="w-[220px] flex-shrink-0 sticky top-[72px] hidden lg:block">
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Questions</h2>
                            <p className="text-[11px] text-gray-400 mt-0.5">{answeredCount}/{TOTAL_QUESTIONS} answered</p>
                        </div>

                        {/* Grid of question boxes */}
                        <div className="p-3 grid grid-cols-5 gap-1.5">
                            {questions.map((q, idx) => (
                                <button
                                    key={q.id}
                                    onClick={() => goToQuestion(idx)}
                                    className={getStatusColor(statuses[q.id], idx === currentIndex)}
                                    title={`Question ${q.id}`}
                                >
                                    {q.id}
                                </button>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Legend</p>
                            {[
                                { color: "w-3 h-3 rounded-sm bg-green-400 border border-green-500", label: "Answered" },
                                { color: "w-3 h-3 rounded-sm bg-amber-400 border border-amber-500", label: "Review" },
                                { color: "w-3 h-3 rounded-sm bg-red-200 border border-red-300", label: "Not Answered" },
                                { color: "w-3 h-3 rounded-sm bg-white border border-gray-300", label: "Not Viewed" },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-2">
                                    <span className={item.color} />
                                    <span className="text-[11px] text-gray-600">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Mobile Nav Panel (bottom sheet style) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        {questions.map((q, idx) => (
                            <button
                                key={q.id}
                                onClick={() => goToQuestion(idx)}
                                className={`${getStatusColor(statuses[q.id], idx === currentIndex)} flex-shrink-0 text-[10px] w-7 h-7`}
                            >
                                {q.id}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Submit Modal */}
            {showSubmitModal && (
                <SubmitModal
                    answeredCount={answeredCount}
                    total={TOTAL_QUESTIONS}
                    onConfirm={() => {
                        setShowSubmitModal(false);
                        setSubmitted(true);
                    }}
                    onCancel={() => setShowSubmitModal(false)}
                />
            )}
        </div>
    );
}
