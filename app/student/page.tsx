"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StudentEmailMigrationModal from "@/components/StudentEmailMigrationModal";
import {
    getStudentProfile,
    needsStudentEmailMigration,
    studentSignOut,
} from "@/lib/authService";
import { getPublishedExams, type DbExam } from "@/lib/examService";
import {
    getMySchoolAssessments,
    type SchoolPupilAssessment,
} from "@/lib/schoolStudentAssessmentService";

const statusStyle: Record<string, string> = {
    Live: "bg-green-100 text-green-700 border border-green-300",
    Published: "bg-green-100 text-green-700 border border-green-300",
};

const typeStyle: Record<string, string> = {
    Test: "bg-green-50 text-green-700",
    Mock: "bg-green-50 text-green-700",
    Practice: "bg-teal-50 text-teal-700",
};

function formatSchoolAssessmentDate(value: string | null): string {
    if (!value) return "No closing time";
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
}

function formatSchoolScore(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}



export default function StudentPortalPage() {
    const router = useRouter();
    const [exams, setExams] = useState<DbExam[]>([]);
    const [schoolAssessments, setSchoolAssessments] = useState<SchoolPupilAssessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [schoolCode, setSchoolCode] = useState("");
    const [isSchoolPupil, setIsSchoolPupil] = useState(false);
    const [showEmailMigration, setShowEmailMigration] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const [codeInput, setCodeInput] = useState("");
    const [codeError, setCodeError] = useState("");
    const [codeLoading, setCodeLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        getStudentProfile().then(profile => {
            if (!profile) { router.replace("/login"); return; }
            setName(profile.display_name);
            const code = localStorage.getItem("last_school_code") ?? "";
            setSchoolCode(code);
            if (profile.account_type === "school_pupil") {
                setIsSchoolPupil(true);
                getMySchoolAssessments()
                    .then(setSchoolAssessments)
                    .catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "Could not load your School assessments."))
                    .finally(() => setLoading(false));
                return;
            }
            needsStudentEmailMigration()
                .then(setShowEmailMigration)
                .catch(() => setShowEmailMigration(false));
            if (code) {
                getPublishedExams(code).then(data => { setExams(data); setLoading(false); });
            } else {
                setLoading(false);
            }
        });
    }, [router]);

    const reloadSchoolAssessments = async () => {
        setLoading(true);
        setLoadError("");
        try {
            setSchoolAssessments(await getMySchoolAssessments());
        } catch (error: unknown) {
            setLoadError(error instanceof Error ? error.message : "Could not load your School assessments.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        setSigningOut(true);
        await studentSignOut();
        router.replace("/login");
    };

    const handleLoadCode = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = codeInput.trim().toUpperCase();
        if (!code) { setCodeError("Enter a school code."); return; }
        setCodeLoading(true);
        setCodeError("");
        try {
            const { supabase } = await import("@/lib/supabase");
            const { data } = await supabase
                .from("admin_profiles")
                .select("school_code")
                .eq("school_code", code)
                .single();
            if (!data) { setCodeError("Invalid school code. Ask your teacher."); return; }
            localStorage.setItem("last_school_code", code);
            setSchoolCode(code);
            setLoading(true);
            const examsData = await getPublishedExams(code);
            setExams(examsData);
        } catch {
            setCodeError("Something went wrong. Try again.");
        } finally {
            setCodeLoading(false);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            {showEmailMigration && (
                <StudentEmailMigrationModal
                    onClose={() => setShowEmailMigration(false)}
                />
            )}
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-green-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-base font-bold text-gray-900">Assessly</span>
                            <span className="ml-2 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded uppercase tracking-wide">{isSchoolPupil ? "School pupil" : "Student"}</span>
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
                            <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-xs">
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
                    <h1 className="text-xl font-bold text-gray-900">{isSchoolPupil ? "My School CBT" : "My Exams"}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{isSchoolPupil ? "Your School pupil account is signed in." : "Select an exam to view its details and start"}</p>
                </div>

                {/* Hints */}
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                    <strong>Before you start:</strong> {isSchoolPupil ? "Choose an assessment assigned to your class. A submitted assessment cannot be taken again." : "Ensure a stable internet connection and a charged device. Do not refresh or close the tab during an exam - the timer starts immediately and cannot be paused."}
                </p>

                {/* Exams List */}
                <div className="flex items-center justify-between mb-2 px-1">
                    <h2 className="text-lg font-bold text-gray-900">{isSchoolPupil ? "Available School Assessments" : "Available Exams"}</h2>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{loading ? "Loading…" : isSchoolPupil ? `${schoolAssessments.length} assessment${schoolAssessments.length !== 1 ? "s" : ""}` : `${exams.length} exam${exams.length !== 1 ? "s" : ""}`}</span>
                </div>

                {/* School code entry — shown when no code is set */}
                {!isSchoolPupil && !schoolCode && !loading && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center max-w-md mx-auto">
                        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">Enter your school code</h3>
                        <p className="text-sm text-gray-500 mb-6">Your teacher will give you this code. It loads your school&apos;s exams.</p>
                        <form onSubmit={handleLoadCode} className="flex flex-col gap-3">
                            <input
                                type="text"
                                value={codeInput}
                                onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeError(""); }}
                                placeholder="e.g. SCH-4820"
                                className="w-full text-center text-lg font-bold tracking-widest py-3 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-gray-50 uppercase"
                            />
                            {codeError && <p className="text-xs text-red-600 font-medium">{codeError}</p>}
                            <button
                                type="submit"
                                disabled={codeLoading}
                                className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold text-sm py-3 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {codeLoading
                                    ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Loading…</>
                                    : "Load My Exams"
                                }
                            </button>
                        </form>
                    </div>
                )}

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
                ) : isSchoolPupil ? (
                    loadError ? (
                        <div className="bg-white border border-red-200 rounded-2xl py-12 px-6 text-center shadow-sm" role="alert">
                            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 4.5h.008v.008H12V16.5z" /></svg>
                            </div>
                            <p className="text-base font-bold text-gray-800">Could not load assessments</p>
                            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">{loadError}</p>
                            <button type="button" onClick={reloadSchoolAssessments} className="mt-5 min-h-11 rounded-xl bg-green-700 px-5 text-sm font-bold text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">Try again</button>
                        </div>
                    ) : schoolAssessments.length === 0 ? (
                        <div className="bg-white border border-gray-100 rounded-2xl py-16 px-6 text-center shadow-sm">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                            </div>
                            <p className="text-base font-bold text-gray-700">No assessments available</p>
                            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Your teacher has not published an assessment for your class yet. Check back later.</p>
                            <button type="button" onClick={reloadSchoolAssessments} className="mt-5 min-h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500">Refresh</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {schoolAssessments.map((assessment) => {
                                const awaitingGrading = Boolean(assessment.submitted_at && assessment.show_results && assessment.theory_status === "pending");
                                const statusLabel = assessment.result_available ? "Result ready" : awaitingGrading ? "Awaiting grading" : assessment.submitted_at ? "Submitted" : "Available";
                                const statusClass = assessment.result_available
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : awaitingGrading
                                        ? "border-amber-200 bg-amber-50 text-amber-800"
                                        : assessment.submitted_at
                                            ? "border-sky-200 bg-sky-50 text-sky-700"
                                            : "border-green-300 bg-green-100 text-green-700";
                                const actionLabel = assessment.result_available ? "View result" : assessment.submitted_at ? "View submission" : "Start";
                                return (
                                    <button
                                        key={assessment.id}
                                        type="button"
                                        onClick={() => router.push(`/exam/${assessment.id}?mode=school`)}
                                        className="group relative min-h-72 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-6 text-left shadow-sm transition-[box-shadow,border-color] duration-200 hover:border-green-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                    >
                                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-600 to-emerald-400" aria-hidden="true" />
                                        <div className="flex items-start justify-between gap-3">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${statusClass}`}>
                                                {assessment.submitted_at ? (
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                ) : <span className="h-2 w-2 rounded-full bg-green-600" aria-hidden="true" />}
                                                {statusLabel}
                                            </span>
                                            <span className="rounded-full bg-green-50 px-3 py-1 text-[11px] font-bold text-green-700">{assessment.type}</span>
                                        </div>
                                        <h3 className="mt-5 line-clamp-2 text-xl font-extrabold leading-tight text-gray-900 transition-colors group-hover:text-green-700">{assessment.title}</h3>
                                        <p className="mt-2 text-sm font-medium text-gray-500"><span className="rounded bg-gray-100 px-2 py-0.5 text-gray-700">{assessment.subject}</span><span className="mx-2 text-gray-300">•</span>{assessment.class_name}</p>
                                        {assessment.result_available && assessment.result_score !== null && assessment.result_percentage !== null ? (
                                            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Final result</p>
                                                <p className="mt-1 text-2xl font-extrabold tabular-nums text-emerald-950">{Math.round(assessment.result_percentage)}%</p>
                                                <p className="mt-1 text-xs font-semibold text-emerald-800">{formatSchoolScore(assessment.result_score)} of {assessment.result_total ?? assessment.question_count} marks</p>
                                            </div>
                                        ) : (
                                            <dl className="mt-6 grid grid-cols-2 gap-3 text-xs">
                                                <div className="rounded-xl bg-gray-50 p-3"><dt className="font-medium text-gray-500">Questions</dt><dd className="mt-1 font-extrabold tabular-nums text-gray-900">{assessment.question_count}</dd></div>
                                                <div className="rounded-xl bg-gray-50 p-3"><dt className="font-medium text-gray-500">Duration</dt><dd className="mt-1 font-extrabold tabular-nums text-gray-900">{assessment.duration ? `${assessment.duration} min` : "No timer"}</dd></div>
                                            </dl>
                                        )}
                                        <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                                            <span className="text-xs text-gray-500">{assessment.submitted_at ? `Submitted ${formatSchoolAssessmentDate(assessment.submitted_at)}` : assessment.ends_at ? `Closes ${formatSchoolAssessmentDate(assessment.ends_at)}` : "No closing time"}</span>
                                            <span className="shrink-0 text-sm font-bold text-green-700">{actionLabel} <span aria-hidden="true">→</span></span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )
                ) : schoolCode && exams.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <p className="text-base font-bold text-gray-700">No exams available yet</p>
                        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Your teacher hasn&apos;t published an assessment for you yet. Check back later.</p>
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
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-green-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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
                                    <h3 className="font-extrabold text-gray-900 text-xl leading-tight mb-2 group-hover:text-green-700 transition-colors line-clamp-2">
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
                                    <div className="flex items-center gap-1 text-green-600 font-bold group-hover:text-green-700 transition-colors">
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
