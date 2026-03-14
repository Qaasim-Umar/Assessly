"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile, signOut, getSession } from "@/lib/authService";
import { getPublishedExams, type DbExam } from "@/lib/examService";

const statusStyle: Record<string, string> = {
    Live: "bg-green-100 text-green-700 border border-green-300",
    Published: "bg-blue-100 text-blue-700 border border-blue-300",
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



export default function StudentPortalPage() {
    const router = useRouter();
    const [exams, setExams] = useState<DbExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [schoolCode, setSchoolCode] = useState("");
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        getSession().then((session) => {
            if (!session) {
                router.replace("/login");
                return;
            }
            if (session.user.email?.endsWith("@assessly.admin")) {
                router.replace("/dashboard");
                return;
            }
            getProfile().then((profile) => {
                if (!profile) {
                    signOut().then(() => router.replace("/login"));
                    return;
                }
                setName(profile.full_name);
                setSchoolCode(profile.school_code);
                getPublishedExams(profile.school_code).then((data) => {
                    setExams(data);
                    setLoading(false);
                });
            });
        });
    }, [router]);

    const handleSignOut = async () => {
        setSigningOut(true);
        await signOut();
        router.replace("/login");
    };

    const liveCount = exams.filter(e => e.status === "Live").length;

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
                            <span className="ml-2 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase tracking-wide">Student</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {schoolCode && (
                            <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border bg-amber-50 border-amber-200 text-amber-700 font-mono">
                                {schoolCode}
                            </span>
                        )}
                        <div className="h-4 w-px bg-gray-200 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-xs">
                                {name ? name.slice(0, 2).toUpperCase() : "ST"}
                            </div>
                            <span className="hidden sm:block text-sm text-gray-700 font-medium">{name || "Student"}</span>
                        </div>
                        <button
                            onClick={handleSignOut}
                            disabled={signingOut}
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7 space-y-6">
                {/* Page title */}
                <div>
                    <h1 className="text-xl font-bold text-gray-900">My Exams</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Select an exam to view its details and start</p>
                </div>

                {/* Hints */}
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                    ⚠️ <strong>Before you start:</strong> Ensure a stable internet connection and a charged device. Do not refresh or close the tab during an exam — the timer starts immediately and cannot be paused.
                </p>

                {/* Exams table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-700">Available Exams</h2>
                        <span className="text-xs text-gray-400">{loading ? "Loading…" : `${exams.length} exam${exams.length !== 1 ? "s" : ""}`}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    {["Exam Title", "Subject", "Class", "Type", "Difficulty", "Questions", "Duration", "Status", ""].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading
                                    ? Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {Array.from({ length: 8 }).map((_, j) => (
                                                <td key={j} className="px-4 py-4"><div className="h-3 bg-gray-100 rounded w-3/4" /></td>
                                            ))}
                                        </tr>
                                    ))
                                    : exams.map((exam) => (
                                        <tr key={exam.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/exam/${exam.id}`)}>
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
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle[exam.status] ?? "bg-gray-100 text-gray-600 border border-gray-300"}`}>
                                                    {exam.status === "Live" && (
                                                        <span className="relative flex h-1.5 w-1.5">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                                                        </span>
                                                    )}
                                                    {exam.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/exam/${exam.id}`); }}
                                                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                                >
                                                    Start →
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>

                    {!loading && exams.length === 0 && (
                        <div className="py-16 text-center">
                            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <p className="text-sm font-medium text-gray-400">No exams available yet.</p>
                            <p className="text-xs text-gray-400 mt-1">Your teacher hasn&apos;t published any exams for your school.</p>
                        </div>
                    )}
                </div>

                <div className="text-center text-xs text-gray-400">Assessly Student Portal &copy; 2026</div>
            </main>
        </div>
    );
}
