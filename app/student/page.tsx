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

                {/* Exams List */}
                <div className="flex items-center justify-between mb-2 px-1">
                    <h2 className="text-lg font-bold text-gray-900">Available Exams</h2>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{loading ? "Loading…" : `${exams.length} exam${exams.length !== 1 ? "s" : ""}`}</span>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
                                <div className="flex justify-between">
                                    <div className="h-5 bg-gray-100 rounded-full w-16"></div>
                                    <div className="h-5 bg-gray-100 rounded-full w-16"></div>
                                </div>
                                <div className="h-5 bg-gray-100 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                <div className="flex gap-4 pt-4 mt-2">
                                    <div className="h-8 bg-gray-100 rounded w-12"></div>
                                    <div className="h-8 bg-gray-100 rounded w-12"></div>
                                    <div className="h-8 bg-gray-100 rounded w-16"></div>
                                </div>
                                <div className="pt-4 mt-2 border-t border-gray-50">
                                    <div className="h-4 bg-gray-100 rounded w-24"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : exams.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <p className="text-base font-bold text-gray-700">No exams available yet</p>
                        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Your teacher hasn&apos;t published any exams for your school. Check back later!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {exams.map((exam) => (
                            <div
                                key={exam.id}
                                onClick={() => router.push(`/exam/${exam.id}`)}
                                className="group relative bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden"
                            >
                                {/* Decorative top gradient accent */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="flex justify-between items-start mb-5">
                                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.25 rounded-full uppercase tracking-wider ${statusStyle[exam.status] ?? "bg-gray-100 text-gray-700 border border-gray-200"}`}>
                                        {exam.status === "Live" && (
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                            </span>
                                        )}
                                        {exam.status}
                                    </span>
                                    <span className={`text-[11px] font-bold px-3 py-1.25 rounded-full ${typeStyle[exam.type] ?? "bg-gray-100 text-gray-700"}`}>
                                        {exam.type}
                                    </span>
                                </div>

                                <div className="mb-6 flex-grow">
                                    <h3 className="font-extrabold text-gray-900 text-xl leading-tight mb-2 group-hover:text-blue-700 transition-colors line-clamp-2">
                                        {exam.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                        <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">{exam.subject}</span>
                                        <span className="text-gray-300">•</span>
                                        <span>{exam.class_level}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mb-4 mt-auto text-sm text-gray-500 font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span>{exam.question_count} Qs</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span>{exam.duration ? `${exam.duration}m` : "None"}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        <span className="capitalize">{exam.difficulty}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                                    <div className="flex items-center gap-1 text-blue-600 font-bold group-hover:text-blue-700 transition-colors">
                                        <span className="text-sm">Start Assessment</span>
                                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="text-center text-xs text-gray-400 mt-6">Assessly Student Portal &copy; 2026</div>
            </main>
        </div>
    );
}
