"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getExamById, getExamResults, updateTheoryMarks } from "@/lib/examService";
import type { DbExam, DbSubmission, DbExamWithQuestions } from "@/lib/examService";
import { getAdminProfile } from "@/lib/authService";

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ScoreBar({ percentage }: { percentage: number }) {
    const color = percentage >= 70 ? "bg-green-500" : percentage >= 50 ? "bg-amber-500" : "bg-red-500";
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${percentage}%` }} />
            </div>
            <span className={`text-xs font-bold w-10 text-right ${percentage >= 70 ? "text-green-600" : percentage >= 50 ? "text-amber-600" : "text-red-500"}`}>
                {percentage}%
            </span>
        </div>
    );
}

// ─── Theory Grading Panel ─────────────────────────────────────────────────────
function TheoryGradingPanel({
    submission,
    exam,
    onGraded,
}: {
    submission: DbSubmission;
    exam: DbExamWithQuestions;
    onGraded: (updated: DbSubmission) => void;
}) {
    const theoryQuestions = exam.questions.filter(
        (q) => q.correct_answer === null || q.correct_answer === undefined
    );

    // Initialise marks from existing theory_marks or 0
    const [marks, setMarks] = useState<Record<string, number>>(() => {
        const init: Record<string, number> = {};
        theoryQuestions.forEach((q) => {
            const idx = exam.questions.indexOf(q).toString();
            init[idx] = submission.theory_marks?.[idx] ?? 0;
        });
        return init;
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            const res = await updateTheoryMarks(
                submission.id,
                marks,
                submission.mcq_score ?? submission.score,
                submission.total
            );
            onGraded({
                ...submission,
                theory_marks: marks,
                theory_status: "graded",
                final_score: res.finalScore,
                final_percentage: res.finalPercentage,
                score: res.finalScore,
                percentage: res.finalPercentage,
            });
        } catch {
            setError("Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-amber-50 border-t border-amber-200 px-5 py-4 space-y-4">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Mark Theory Answers</p>
            {theoryQuestions.map((q) => {
                const qIdx = exam.questions.indexOf(q);
                const idxStr = qIdx.toString();
                const studentAnswer = submission.theory_answers?.[idxStr] ?? "";
                return (
                    <div key={q.id} className="bg-white border border-amber-200 rounded-xl p-4 space-y-3">
                        <div>
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">
                                Question {qIdx + 1}
                            </p>
                            <p className="text-sm font-semibold text-gray-800 leading-snug">{q.text}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Student's Answer</p>
                            {studentAnswer ? (
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{studentAnswer}</p>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No answer provided</p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">Marks awarded:</label>
                            <input
                                type="number"
                                min={0}
                                max={99}
                                value={marks[idxStr] ?? 0}
                                onChange={(e) =>
                                    setMarks((prev) => ({ ...prev, [idxStr]: Math.max(0, Number(e.target.value)) }))
                                }
                                className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                            />
                        </div>
                    </div>
                );
            })}

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <div className="flex justify-end pt-1">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition-colors"
                >
                    {saving ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    Update Result
                </button>
            </div>
        </div>
    );
}

// ─── Submission Row ───────────────────────────────────────────────────────────
function SubmissionRow({
    sub,
    idx,
    exam,
    onGraded,
}: {
    sub: DbSubmission;
    idx: number;
    exam: DbExamWithQuestions;
    onGraded: (updated: DbSubmission) => void;
}) {
    const [expanded, setExpanded] = useState(false);

    const isPending = sub.theory_status === "pending_review";
    const isGraded = sub.theory_status === "graded";
    const hasTheory = isPending || isGraded;

    const displayScore = hasTheory ? (sub.final_score ?? sub.score) : sub.score;
    const displayPct = hasTheory ? (sub.final_percentage ?? sub.percentage) : sub.percentage;

    const grade =
        displayPct >= 90 ? { label: "Excellent", cls: "bg-green-100 text-green-700" } :
            displayPct >= 70 ? { label: "Good", cls: "bg-blue-100 text-blue-700" } :
                displayPct >= 50 ? { label: "Pass", cls: "bg-amber-100 text-amber-700" } :
                    { label: "Fail", cls: "bg-red-100 text-red-600" };

    return (
        <>
            {/* Main row */}
            <tr
                className={`hover:bg-gray-50 transition-colors ${hasTheory ? "cursor-pointer" : ""}`}
                onClick={() => hasTheory && setExpanded((v) => !v)}
            >
                <td className="px-4 py-3.5 text-xs text-gray-400 font-bold">{idx + 1}</td>
                <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {sub.student_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-gray-800">{sub.student_name}</span>
                        {isPending && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
                                ⏳ Pending Review
                            </span>
                        )}
                        {isGraded && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">
                                ✓ Graded
                            </span>
                        )}
                    </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(sub.submitted_at)}</td>
                <td className="px-4 py-3.5 text-xs font-bold text-gray-800">
                    {isPending ? (
                        <span className="text-amber-500 font-bold">—</span>
                    ) : (
                        displayScore
                    )}
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-500">{sub.total}</td>
                <td className="px-4 py-3.5 w-48">
                    {isPending ? (
                        <span className="text-xs text-amber-500 font-semibold italic">Awaiting grade</span>
                    ) : (
                        <ScoreBar percentage={displayPct} />
                    )}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                    {isPending ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Pending</span>
                    ) : (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${grade.cls}`}>{grade.label}</span>
                    )}
                </td>
                <td className="px-4 py-3.5">
                    {hasTheory && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                        >
                            {expanded ? "▲ Hide" : "▼ Mark Theory"}
                        </button>
                    )}
                </td>
            </tr>
            {/* Expandable theory grading panel */}
            {expanded && hasTheory && (
                <tr>
                    <td colSpan={8} className="p-0">
                        <TheoryGradingPanel
                            submission={sub}
                            exam={exam}
                            onGraded={(updated) => {
                                onGraded(updated);
                                setExpanded(false);
                            }}
                        />
                    </td>
                </tr>
            )}
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExamResultsPage() {
    const router = useRouter();
    const params = useParams();
    const examId = params.id as string;

    const [exam, setExam] = useState<DbExamWithQuestions | null>(null);
    const [submissions, setSubmissions] = useState<DbSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getAdminProfile().then((profile) => {
            if (!profile) { router.replace("/dashboard/login"); return; }
            Promise.all([getExamById(examId), getExamResults(examId)])
                .then(([examData, subs]) => {
                    if (!examData) { setError("Exam not found."); setLoading(false); return; }
                    setExam(examData);
                    setSubmissions(subs);
                    setLoading(false);
                })
                .catch(() => { setError("Failed to load results."); setLoading(false); });
        });
    }, [examId, router]);

    const handleGraded = (updated: DbSubmission) => {
        setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
                <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-gray-500">{error}</p>
                    <button onClick={() => router.push("/dashboard")} className="mt-3 text-blue-600 text-sm hover:underline">Back to Dashboard</button>
                </div>
            </div>
        );
    }

    // Stats (use final_percentage if available for graded submissions)
    const total = submissions.length;
    const avg = total > 0 ? Math.round(
        submissions.reduce((a, s) => a + (s.theory_status === "graded" ? (s.final_percentage ?? s.percentage) : s.theory_status === "pending_review" ? 0 : s.percentage), 0) / total
    ) : 0;
    const gradedSubs = submissions.filter((s) => s.theory_status !== "pending_review");
    const highest = gradedSubs.length > 0 ? Math.max(...gradedSubs.map((s) => s.final_percentage ?? s.percentage)) : 0;
    const passCount = gradedSubs.filter((s) => (s.final_percentage ?? s.percentage) >= 50).length;
    const pendingCount = submissions.filter((s) => s.theory_status === "pending_review").length;

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Dashboard
                    </Link>
                    <div className="h-4 w-px bg-gray-200" />
                    <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-gray-900 truncate block">{exam?.title ?? "Results"}</span>
                        <span className="text-[10px] text-gray-400">{exam?.subject} · {exam?.class_level}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full uppercase tracking-wide">Results</span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-7 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: "Total Attempts", value: total, color: "text-blue-600" },
                        { label: "Average Score", value: `${avg}%`, color: "text-purple-600" },
                        { label: "Highest Score", value: gradedSubs.length > 0 ? `${highest}%` : "—", color: "text-green-600" },
                        { label: "Pending Review", value: pendingCount, color: "text-amber-600" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-0.5">
                            <p className={`text-2xl font-bold ${color}`}>{value}</p>
                            <p className="text-xs text-gray-500">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Pending notice */}
                {pendingCount > 0 && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="text-sm font-bold text-amber-800">
                                {pendingCount} submission{pendingCount > 1 ? "s" : ""} pending theory review
                            </p>
                            <p className="text-xs text-amber-700 mt-0.5">
                                Click a row marked <strong>Pending Review</strong> to expand the theory answers, enter marks, and click <strong>Update Result</strong>.
                            </p>
                        </div>
                    </div>
                )}

                {/* Submissions Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-700">All Submissions</h2>
                        <span className="text-xs text-gray-400">{total} submission{total !== 1 ? "s" : ""}</span>
                    </div>

                    {total === 0 ? (
                        <div className="py-16 text-center">
                            <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-sm font-medium text-gray-400">No submissions yet.</p>
                            <p className="text-xs text-gray-400 mt-1">Students who complete the exam will appear here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        {["#", "Student", "Submitted", "Score", "Total", "Grade", "", ""].map((h, i) => (
                                            <th key={i} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {submissions.map((sub, idx) => (
                                        <SubmissionRow
                                            key={sub.id}
                                            sub={sub}
                                            idx={idx}
                                            exam={exam!}
                                            onGraded={handleGraded}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
