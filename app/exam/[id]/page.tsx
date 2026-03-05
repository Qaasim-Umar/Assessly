"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { getExamById, type DbExamWithQuestions } from "@/lib/examService";

const examRules = [
    "The countdown timer begins immediately after you click Start Exam.",
    "The exam will be auto-submitted when the timer reaches zero.",
    "You are not allowed to retake this exam once submitted.",
    "Do not refresh or close the browser tab during the exam.",
    "All questions must be attempted before submission.",
    "Switching browser tabs may flag your session.",
    "Each question has only one correct answer.",
];

function formatDuration(minutes: number | null): string {
    if (!minutes) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h} hour${h > 1 ? "s" : ""}`;
    return `${m} minutes`;
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="flex items-center gap-4 py-3.5 border-b border-gray-100 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
            </div>
        </div>
    );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm h-14" />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
                <div className="mb-6 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-16" />
                    <div className="h-7 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="bg-white rounded-xl border border-gray-200 h-64" />
                    <div className="bg-white rounded-xl border border-gray-200 h-64" />
                </div>
            </main>
        </div>
    );
}

export default function ExamInfoPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const examId = params.id as string;
    const isGeneral = searchParams.get("mode") === "general";
    const backHref = isGeneral ? "/general" : "/";

    const [exam, setExam] = useState<DbExamWithQuestions | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getExamById(examId)
            .then((data) => {
                if (cancelled) return;
                if (!data) setNotFound(true);
                else setExam(data);
                setLoading(false);
            })
            .catch(() => {
                if (!cancelled) { setNotFound(true); setLoading(false); }
            });
        return () => { cancelled = true; };
    }, [examId]);

    if (loading) return <Skeleton />;

    if (notFound || !exam) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 text-sm">Exam not found.</p>
                    <button onClick={() => router.push("/")} className="mt-3 text-blue-600 text-sm hover:underline">
                        Go back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            {/* Top Bar */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
                    <button
                        onClick={() => router.push(backHref)}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <div className="h-4 w-px bg-gray-200" />
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-blue-700 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <span className="text-base font-bold text-gray-900">Assessly</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                {/* Exam Title Block */}
                <div className="mb-6">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full mb-3">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                        </span>
                        LIVE NOW
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{exam.title}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {exam.subject} &middot; {exam.class_level}
                    </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    {/* Left Column — Exam Details */}
                    <div className="space-y-5">
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Details</h2>
                            </div>
                            <div className="px-5">
                                <InfoRow
                                    label="Subject"
                                    value={exam.subject}
                                    icon={
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                        </svg>
                                    }
                                />
                                <InfoRow
                                    label="Class / Level"
                                    value={exam.class_level}
                                    icon={
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                        </svg>
                                    }
                                />
                                <InfoRow
                                    label="Total Questions"
                                    value={`${exam.question_count} Questions`}
                                    icon={
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                        </svg>
                                    }
                                />
                                <InfoRow
                                    label="Duration"
                                    value={formatDuration(exam.duration)}
                                    icon={
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 7v5l3 3" />
                                        </svg>
                                    }
                                />
                                <InfoRow
                                    label="Difficulty"
                                    value={exam.difficulty}
                                    icon={
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                        </svg>
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column — Rules */}
                    <div className="space-y-5">
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-100 bg-amber-50">
                                <h2 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd"
                                            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Exam Rules
                                </h2>
                            </div>
                            <ul className="px-5 py-4 space-y-3">
                                {examRules.map((rule, i) => (
                                    <li key={i} className="flex items-start gap-2.5">
                                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
                                            {i + 1}
                                        </span>
                                        <span className="text-xs text-gray-700 leading-relaxed">{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Start Exam CTA */}
                <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Ready to begin?</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                The timer starts immediately. Make sure you are fully prepared.
                            </p>
                        </div>
                        <button
                            onClick={() => router.push(`/exam/${exam.id}/attempt${isGeneral ? "?mode=general" : ""}`)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-sm px-8 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                            </svg>
                            Start Exam
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
