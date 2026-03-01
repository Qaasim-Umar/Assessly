"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getExams, deleteExam, updateExamStatus, updateShowResults } from "@/lib/examService";
import type { DbExam } from "@/lib/examService";

const statusStyle: Record<string, string> = {
    Live: "bg-green-100 text-green-700 border border-green-300",
    Published: "bg-blue-100 text-blue-700 border border-blue-300",
    Draft: "bg-gray-100 text-gray-600 border border-gray-300",
};

const difficultyStyle: Record<string, string> = {
    Simple: "bg-emerald-50 text-emerald-700",
    Medium: "bg-amber-50 text-amber-700",
    Hard: "bg-red-50 text-red-700",
    Mixed: "bg-purple-50 text-purple-700",
};

const typeStyle: Record<string, string> = {
    Test: "bg-blue-50 text-blue-700",
    Mock: "bg-indigo-50 text-indigo-700",
    Practice: "bg-teal-50 text-teal-700",
};

function StatCard({
    label,
    value,
    icon,
    color,
    loading,
}: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    loading?: boolean;
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                {icon}
            </div>
            <div>
                <p className={`text-2xl font-bold text-gray-900 leading-none ${loading ? "animate-pulse text-gray-300" : ""}`}>
                    {loading ? "—" : value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
        </div>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function DashboardPage() {
    const router = useRouter();
    const [exams, setExams] = useState<DbExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [togglingResultsId, setTogglingResultsId] = useState<string | null>(null);

    useEffect(() => {
        if (localStorage.getItem("assessly_auth") !== "true") {
            router.replace("/login");
            return;
        }
        fetchExams();
    }, [router]);

    async function fetchExams() {
        try {
            setLoading(true);
            setError("");
            const data = await getExams();
            setExams(data);
        } catch (e: unknown) {
            setError("Failed to load exams. Check your Supabase connection.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("assessly_auth");
        router.push("/login");
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
            exam.status === "Draft"
                ? "Published"
                : exam.status === "Published"
                    ? "Live"
                    : "Draft";
        setTogglingId(exam.id);
        try {
            await updateExamStatus(exam.id, next);
            setExams((prev) =>
                prev.map((e) => (e.id === exam.id ? { ...e, status: next } : e))
            );
        } catch {
            alert("Failed to update status.");
        } finally {
            setTogglingId(null);
        }
    };

    const handleToggleShowResults = async (exam: DbExam) => {
        const next = !exam.show_results;
        setTogglingResultsId(exam.id);
        // Optimistic update
        setExams((prev) => prev.map((e) => (e.id === exam.id ? { ...e, show_results: next } : e)));
        try {
            await updateShowResults(exam.id, next);
        } catch {
            // Revert on failure
            setExams((prev) => prev.map((e) => (e.id === exam.id ? { ...e, show_results: !next } : e)));
            alert("Could not update — run the SQL migration in Supabase first.");
        } finally {
            setTogglingResultsId(null);
        }
    };

    // Stats from live data
    const totalQuestions = exams.reduce((a, e) => a + e.question_count, 0);
    const published = exams.filter((e) => e.status === "Published" || e.status === "Live").length;
    const drafts = exams.filter((e) => e.status === "Draft").length;

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-blue-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-base font-bold text-gray-900">Assessly</span>
                            <span className="ml-2 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase tracking-wide">Creator</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors hidden sm:block">
                            Student View
                        </Link>
                        <div className="h-4 w-px bg-gray-200 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-xs">TC</div>
                            <span className="hidden sm:block text-sm text-gray-700 font-medium">Teacher Console</span>
                        </div>
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
                {/* Page Title + CTA */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Exam Management</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Create, review and publish AI-assisted CBT exams</p>
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
                            href="/dashboard/create"
                            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Create New Exam
                        </Link>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-4 py-2.5 rounded-lg">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                        </svg>
                        {error}
                        <button onClick={fetchExams} className="ml-auto underline font-semibold">Retry</button>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Exams" value={exams.length} loading={loading} color="bg-blue-50 text-blue-600"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>}
                    />
                    <StatCard label="Published / Live" value={published} loading={loading} color="bg-green-50 text-green-600"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <StatCard label="Drafts" value={drafts} loading={loading} color="bg-amber-50 text-amber-600"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>}
                    />
                    <StatCard label="Total Questions" value={totalQuestions} loading={loading} color="bg-purple-50 text-purple-600"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>}
                    />
                </div>

                {/* Exams Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-700">All Exams</h2>
                        <span className="text-xs text-gray-400">{loading ? "Loading…" : `${exams.length} exams`}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    {["Exam Title", "Subject", "Class", "Type", "Difficulty", "Questions", "Duration", "Results Visible", "Status", "Created", "Actions"].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading
                                    ? Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {Array.from({ length: 10 }).map((_, j) => (
                                                <td key={j} className="px-4 py-4">
                                                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                                                </td>
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
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeStyle[exam.type] ?? "bg-gray-50 text-gray-600"}`}>{exam.type}</span>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${difficultyStyle[exam.difficulty] ?? "bg-gray-50 text-gray-600"}`}>{exam.difficulty}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-gray-600 text-center">{exam.question_count}</td>
                                            <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                                                {exam.duration ? `${exam.duration} min` : <span className="text-gray-400">—</span>}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleStatus(exam)}
                                                    disabled={togglingId === exam.id}
                                                    title="Click to cycle status"
                                                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-40 ${statusStyle[exam.status]}`}
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
                                            {/* Results Visible toggle */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleShowResults(exam)}
                                                    disabled={togglingResultsId === exam.id}
                                                    title={exam.show_results ? "Students see results — click to hide" : "Students don't see results — click to show"}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors focus:outline-none disabled:opacity-50 ${exam.show_results
                                                            ? "bg-green-500 border-green-500"
                                                            : "bg-gray-200 border-gray-300"
                                                        }`}
                                                >
                                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${exam.show_results ? "translate-x-4" : "translate-x-1"
                                                        }`} />
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
                                                        onClick={() => router.push(`/dashboard/edit/${exam.id}`)}
                                                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                                    >
                                                        Edit
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
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {!loading && exams.length === 0 && !error && (
                        <div className="py-16 text-center">
                            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <p className="text-sm font-medium text-gray-400">No exams yet.</p>
                            <Link href="/dashboard/create" className="mt-3 inline-block text-sm text-blue-600 font-semibold hover:underline">Create your first exam</Link>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center text-xs text-gray-400">
                    Assessly Creator Console &copy; 2026
                </div>
            </main>
        </div>
    );
}
