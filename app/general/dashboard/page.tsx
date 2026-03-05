"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getExams, deleteExam, updateExamStatus } from "@/lib/examService";
import type { DbExam } from "@/lib/examService";

const statusStyle: Record<string, string> = {
    Live: "bg-green-100 text-green-700 border border-green-300",
    Published: "bg-blue-100 text-blue-700 border border-blue-300",
    Draft: "bg-gray-100 text-gray-600 border border-gray-300",
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function GeneralDashboardPage() {
    const router = useRouter();
    const [exams, setExams] = useState<DbExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    // Auth guard
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (sessionStorage.getItem("generalAdmin") !== "1") {
                router.replace("/general/dashboard/login");
                return;
            }
            fetchExams();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchExams() {
        try {
            setLoading(true);
            setError("");
            // Fetch all exams, then filter locally for is_general
            const all = await getExams();
            setExams(all.filter((e) => e.is_general));
        } catch {
            setError("Failed to load exams.");
        } finally {
            setLoading(false);
        }
    }

    const handleLogout = () => {
        sessionStorage.removeItem("generalAdmin");
        router.push("/general/dashboard/login");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this exam? This cannot be undone.")) return;
        setDeletingId(id);
        try {
            await deleteExam(id);
            setExams((prev) => prev.filter((e) => e.id !== id));
        } catch {
            alert("Failed to delete exam.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleStatus = async (exam: DbExam) => {
        const next: "Draft" | "Published" | "Live" =
            exam.status === "Draft" ? "Published" : exam.status === "Published" ? "Live" : "Draft";
        setTogglingId(exam.id);
        try {
            await updateExamStatus(exam.id, next);
            setExams((prev) => prev.map((e) => (e.id === exam.id ? { ...e, status: next } : e)));
        } catch {
            alert("Failed to update status.");
        } finally {
            setTogglingId(null);
        }
    };

    const published = exams.filter((e) => e.status === "Published" || e.status === "Live").length;
    const drafts = exams.filter((e) => e.status === "Draft").length;

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-indigo-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-base font-bold text-gray-900">Assessly</span>
                            <span className="ml-2 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded uppercase tracking-wide">General Mode</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/general" target="_blank" className="text-xs text-gray-500 hover:text-indigo-600 font-medium transition-colors hidden sm:block">
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7">
                {/* Title */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">General Mode Exams</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manage open practice exams — visible to anyone at <code className="text-indigo-600 bg-indigo-50 px-1 rounded">/general</code></p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchExams}
                            disabled={loading}
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
                        >
                            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                        <Link
                            href="/general/dashboard/create"
                            className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Upload New Exam
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: "Total Exams", value: exams.length, color: "bg-indigo-50 text-indigo-600" },
                        { label: "Published / Live", value: published, color: "bg-green-50 text-green-600" },
                        { label: "Drafts", value: drafts, color: "bg-amber-50 text-amber-600" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                                </svg>
                            </div>
                            <div>
                                <p className={`text-2xl font-bold text-gray-900 leading-none ${loading ? "animate-pulse text-gray-300" : ""}`}>
                                    {loading ? "—" : value}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-4 py-2.5 rounded-lg">
                        {error}
                        <button onClick={fetchExams} className="ml-auto underline">Retry</button>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-700">All General Exams</h2>
                        <span className="text-xs text-gray-400">{loading ? "Loading…" : `${exams.length} exams`}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    {["Exam Title", "Subject", "Class", "Questions", "Duration", "Status", "Created", "Actions"].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading
                                    ? Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {Array.from({ length: 8 }).map((_, j) => (
                                                <td key={j} className="px-4 py-4"><div className="h-3 bg-gray-100 rounded w-3/4" /></td>
                                            ))}
                                        </tr>
                                    ))
                                    : exams.map((exam) => (
                                        <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <p className="font-semibold text-gray-900 text-xs max-w-[200px] truncate">{exam.title}</p>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">{exam.subject}</td>
                                            <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">{exam.class_level}</td>
                                            <td className="px-4 py-3.5 text-xs text-gray-600 text-center">{exam.question_count}</td>
                                            <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                                                {exam.duration ? `${exam.duration} min` : <span className="text-gray-400">—</span>}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleStatus(exam)}
                                                    disabled={togglingId === exam.id}
                                                    title="Click to cycle status"
                                                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 disabled:opacity-40 ${statusStyle[exam.status]}`}
                                                >
                                                    {exam.status === "Live" && (
                                                        <span className="relative flex h-1.5 w-1.5">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                                                        </span>
                                                    )}
                                                    {togglingId === exam.id ? "…" : exam.status}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(exam.created_at)}</td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => router.push(`/dashboard/results/${exam.id}`)}
                                                        className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 px-2 py-1 rounded hover:bg-purple-50 transition-colors"
                                                    >
                                                        Results
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(exam.id)}
                                                        disabled={deletingId === exam.id}
                                                        className="text-[11px] font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40"
                                                    >
                                                        {deletingId === exam.id ? "…" : "Delete"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>

                    {!loading && exams.length === 0 && !error && (
                        <div className="py-16 text-center">
                            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <p className="text-sm font-medium text-gray-400">No general exams yet.</p>
                            <Link href="/general/dashboard/create" className="mt-3 inline-block text-sm text-indigo-600 font-semibold hover:underline">Upload your first exam</Link>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center text-xs text-gray-400">
                    Assessly General Mode Console · {new Date().getFullYear()}
                </div>
            </main>
        </div>
    );
}
