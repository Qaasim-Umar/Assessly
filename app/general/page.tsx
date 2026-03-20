"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getGeneralExams, type DbExam } from "@/lib/examService";

function formatDuration(minutes: number | null): string {
    if (!minutes) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}

function getUrgencyColor(duration: number | null): string {
    if (!duration) return "text-green-700";
    if (duration <= 30) return "text-red-600";
    if (duration <= 60) return "text-amber-600";
    return "text-green-700";
}

function SkeletonCard() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="h-5 w-16 bg-gray-200 rounded-full flex-shrink-0" />
            </div>
            <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-100 rounded w-2/5" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
            <div className="border-t border-gray-100 pt-3">
                <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="col-span-2 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
            </div>
            <h2 className="text-base font-bold text-gray-800 mb-1">No public exams available</h2>
            <p className="text-sm text-gray-500 max-w-xs">
                There are no General Mode exams published yet. Check back later.
            </p>
        </div>
    );
}

export default function GeneralModePage() {
    const router = useRouter();
    const [exams, setExams] = useState<DbExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getGeneralExams()
            .then((data) => { setExams(data); setLoading(false); })
            .catch(() => { setError("Failed to load exams. Please refresh."); setLoading(false); });
    }, []);

    const CATEGORY_CARDS: Array<{
        label: string;
        subtitle: string;
        accent: string;
        href: string;
        icon: React.ReactNode;
    }> = [
            {
                label: "WAEC",
                subtitle: "Past questions & practice",
                accent: "from-emerald-600 to-teal-600",
                href: "/general/category/waec",
                icon: (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
            },
            {
                label: "JAMB / UTME",
                subtitle: "UTME drills & speed",
                accent: "from-blue-600 to-indigo-600",
                href: "/general/category/jamb-utme",
                icon: (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                ),
            },
            {
                label: "NECO",
                subtitle: "Objective practice sets",
                accent: "from-fuchsia-600 to-pink-600",
                href: "/general/category/neco",
                icon: (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h3.75M9 15h3.75M9 18h3.75M6 21h12a2 2 0 002-2V7.5L12 3 4 7.5V19a2 2 0 002 2z" />
                    </svg>
                ),
            },
            {
                label: "BECE",
                subtitle: "Junior secondary prep",
                accent: "from-amber-600 to-orange-600",
                href: "/general/category/bece",
                icon: (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292" />
                    </svg>
                ),
            },
            {
                label: "Post-UTME",
                subtitle: "University screening",
                accent: "from-slate-700 to-gray-700",
                href: "/general/category/post-utme",
                icon: (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.1a7.5 7.5 0 0115 0A17.9 17.9 0 0112 21.75c-2.7 0-5.2-.6-7.5-1.65z" />
                    </svg>
                ),
            },
            {
                label: "Mock Tests",
                subtitle: "Full-length mock exams",
                accent: "from-indigo-700 to-violet-700",
                href: "/general/category/mock",
                icon: (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
                    </svg>
                ),
            },
        ];

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-indigo-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-lg font-bold text-gray-900 tracking-tight">Assessly</span>
                            <span className="ml-2 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded uppercase tracking-wide">General</span>
                        </div>
                    </div>
                    <span className="text-xs text-gray-400">Open to everyone · No login required</span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {/* Page header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        {!loading && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                                </span>
                                {exams.length} Available
                            </span>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Practice Exams</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Open to everyone — no account needed. Results are shown instantly after submission.
                    </p>
                </div>

                {/* Notice */}
                <div className="mb-6 flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
                    <svg className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-indigo-800 leading-relaxed">
                        <strong>General Mode:</strong> These are practice or demo exams. You&#39;ll just enter your name before starting — no account or school code required. Your results are shown immediately upon submission.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                        <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-red-700">{error}</p>
                    </div>
                )}

                {/* Category Grid — skeleton while loading, real cards after */}
                <div className="mb-7">
                    <h2 className="text-sm font-bold text-gray-800 mb-3">Choose a category</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {loading
                            ? Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 animate-pulse">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3.5 bg-gray-200 rounded w-2/5" />
                                            <div className="h-3 bg-gray-100 rounded w-3/5" />
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-gray-200 flex-shrink-0" />
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <div className="h-3 bg-gray-100 rounded w-10" />
                                    </div>
                                </div>
                            ))
                            : CATEGORY_CARDS.map((c) => (
                                <button
                                    key={c.label}
                                    onClick={() => router.push(c.href)}
                                    className="group text-left bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 hover:shadow-md hover:border-indigo-300 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-extrabold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
                                                {c.label}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">{c.subtitle}</p>
                                        </div>
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.accent} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                            {c.icon}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-end">
                                        <span className="text-xs font-bold text-gray-500 group-hover:text-indigo-700 transition-colors">
                                            View →
                                        </span>
                                    </div>
                                </button>
                            ))
                        }
                    </div>
                </div>

                <div className="mt-10 text-center text-xs text-gray-400">
                    Assessly General Mode · Open Exams · {new Date().getFullYear()}
                </div>
            </main>
        </div>
    );
}
