"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Stats {
    total: number;
    byExamType: { exam_type: string; count: number }[];
    bySubject: { subject: string; count: number }[];
}

export default function GeneralDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (sessionStorage.getItem("generalAdmin") !== "1") {
            router.replace("/general/dashboard/login");
            return;
        }
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchStats() {
        setLoading(true);
        try {
            const { data } = await supabase
                .from("questions")
                .select("exam_type, subject")
                .is("exam_id", null)
                .eq("is_active", true);

            const rows = data ?? [];

            // Count by exam_type
            const examTypeMap: Record<string, number> = {};
            const subjectMap: Record<string, number> = {};

            for (const row of rows) {
                const et = row.exam_type ?? "Unknown";
                examTypeMap[et] = (examTypeMap[et] ?? 0) + 1;

                const sub = row.subject ?? "Unknown";
                subjectMap[sub] = (subjectMap[sub] ?? 0) + 1;
            }

            setStats({
                total: rows.length,
                byExamType: Object.entries(examTypeMap)
                    .map(([exam_type, count]) => ({ exam_type, count }))
                    .sort((a, b) => b.count - a.count),
                bySubject: Object.entries(subjectMap)
                    .map(([subject, count]) => ({ subject, count }))
                    .sort((a, b) => b.count - a.count),
            });
        } catch {
            setStats({ total: 0, byExamType: [], bySubject: [] });
        } finally {
            setLoading(false);
        }
    }

    const handleLogout = () => {
        sessionStorage.removeItem("generalAdmin");
        router.push("/general/dashboard/login");
    };

    const examTypeColors: Record<string, string> = {
        JAMB: "bg-green-50 text-green-700 border-green-200",
        WAEC: "bg-blue-50 text-blue-700 border-blue-200",
        NECO: "bg-violet-50 text-violet-700 border-violet-200",
        "Post-UTME": "bg-amber-50 text-amber-700 border-amber-200",
    };

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-green-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-base font-bold text-gray-900">Assessly</span>
                            <span className="ml-2 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded uppercase tracking-wide">General Mode</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/general" target="_blank" className="text-xs text-gray-500 hover:text-green-600 font-medium transition-colors hidden sm:block">
                            Public View ↗
                        </Link>
                        <div className="h-4 w-px bg-gray-200 hidden sm:block" />
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Title + actions */}
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">General Console</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Overview of your question bank and admissions content</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/general/dashboard/admissions"
                            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm px-4 py-2.5 rounded-lg transition-colors shadow-sm border border-gray-200"
                        >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                            </svg>
                            Admissions Hub
                        </Link>
                        <Link
                            href="/general/dashboard/create"
                            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Upload Questions
                        </Link>
                    </div>
                </div>

                {/* Total */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-7 h-7 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                        </svg>
                    </div>
                    <div>
                        <p className={`text-4xl font-extrabold text-gray-900 leading-none ${loading ? "animate-pulse text-gray-200" : ""}`}>
                            {loading ? "—" : stats?.total.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Total questions in the bank</p>
                    </div>
                    <button
                        onClick={fetchStats}
                        disabled={loading}
                        className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40"
                    >
                        <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* By Exam Type */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-700">By Exam Type</h2>
                        </div>
                        <div className="p-5 space-y-3">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="animate-pulse flex items-center gap-3">
                                        <div className="h-4 bg-gray-100 rounded w-20" />
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full" />
                                        <div className="h-4 bg-gray-100 rounded w-10" />
                                    </div>
                                ))
                            ) : stats?.byExamType.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">No questions yet</p>
                            ) : (
                                stats?.byExamType.map(({ exam_type, count }) => {
                                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                                    const colorCls = examTypeColors[exam_type] ?? "bg-gray-50 text-gray-600 border-gray-200";
                                    return (
                                        <div key={exam_type} className="flex items-center gap-3">
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border w-24 text-center flex-shrink-0 ${colorCls}`}>
                                                {exam_type}
                                            </span>
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-gray-700 w-16 text-right flex-shrink-0">
                                                {count.toLocaleString()} <span className="text-gray-400 font-normal">({pct}%)</span>
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* By Subject */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-700">By Subject</h2>
                        </div>
                        <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="animate-pulse flex items-center gap-3">
                                        <div className="h-4 bg-gray-100 rounded w-24" />
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full" />
                                        <div className="h-4 bg-gray-100 rounded w-10" />
                                    </div>
                                ))
                            ) : stats?.bySubject.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">No questions yet</p>
                            ) : (
                                stats?.bySubject.map(({ subject, count }) => {
                                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                                    return (
                                        <div key={subject} className="flex items-center gap-3">
                                            <span className="text-xs text-gray-600 w-32 truncate flex-shrink-0">{subject}</span>
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-400 rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-gray-700 w-16 text-right flex-shrink-0">
                                                {count.toLocaleString()} <span className="text-gray-400 font-normal">({pct}%)</span>
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-gray-400">
                    Assessly General Mode Console · {new Date().getFullYear()}
                </div>
            </main>
        </div>
    );
}
