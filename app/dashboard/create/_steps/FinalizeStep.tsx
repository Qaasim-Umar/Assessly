"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createExam, updateExam } from "@/lib/examService";
import { getAdminProfile } from "@/lib/authService";
import type { Question, ExamForm, Difficulty } from "../types";

interface Props {
    questions: Question[];
    form: ExamForm;
    examId?: string; // if present → edit mode
}

function DiffBar({ counts, total }: { counts: Record<Difficulty, number>; total: number }) {
    const pct = (n: number) => Math.round((n / total) * 100);
    return (
        <div className="space-y-2">
            {(["Simple", "Medium", "Hard"] as Difficulty[]).map((d) => {
                const colors = { Simple: "bg-emerald-500", Medium: "bg-amber-500", Hard: "bg-red-500" };
                const p = pct(counts[d]);
                return (
                    <div key={d} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-14 font-medium">{d}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${colors[d]} transition-all`} style={{ width: `${p}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-14 text-right">{counts[d]} ({p}%)</span>
                    </div>
                );
            })}
        </div>
    );
}

export default function FinalizeStep({ questions, form, examId }: Props) {
    const router = useRouter();
    const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
    const [saveError, setSaveError] = useState("");

    const approved = questions.filter((q) => q.approved);
    const counts: Record<Difficulty, number> = { Simple: 0, Medium: 0, Hard: 0 };
    approved.forEach((q) => { counts[q.userDifficulty]++; });

    const suggestedTime = form.duration
        ? Number(form.duration)
        : Math.max(20, Math.round(approved.length * (approved.some((q) => q.type === "Theory") ? 3.5 : 2)));

    const handleSave = async (publish: boolean) => {
        const status = publish ? "Published" : "Draft";
        setSaving(publish ? "publish" : "draft");
        setSaveError("");
        try {
            if (examId) {
                await updateExam(examId, form, approved, status);
            } else {
                const profile = await getAdminProfile();
                await createExam(form, approved, status, profile?.school_code ?? undefined);
            }
            router.push("/dashboard");
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            setSaveError(`Failed to save: ${msg}`);
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="space-y-5">
            {/* AI Suggestions Banner */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-blue-800">
                    <strong>AI Suggestion:</strong> Based on question complexity and type, a duration of <strong>{suggestedTime} minutes</strong> is recommended.
                    Questions will be randomized and MCQ options shuffled automatically.
                </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                {/* Exam Summary */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Summary</h3>
                    </div>
                    <div className="px-4 py-4 space-y-3">
                        {[
                            { label: "Title", value: form.title || "Untitled Exam" },
                            { label: "Subject", value: form.subject || "—" },
                            { label: "Class", value: form.classLevel },
                            { label: "Type", value: form.type },
                            { label: "Duration", value: `${suggestedTime} minutes` },
                            { label: "Total Questions", value: `${approved.length} approved` },
                            { label: "Question Types", value: form.questionType },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">{label}</span>
                                <span className="text-xs font-semibold text-gray-800">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Difficulty distribution */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Difficulty Distribution</h3>
                    </div>
                    <div className="px-4 py-4">
                        <DiffBar counts={counts} total={approved.length || 1} />
                        <p className="text-[10px] text-gray-400 mt-4">
                            {approved.length} approved question{approved.length !== 1 ? "s" : ""} ready for exam generation.
                        </p>
                    </div>
                </div>
            </div>

            {/* Exam Configuration */}
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-4">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Exam Configuration</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                    {[
                        { icon: "🔀", title: "Randomized Order", desc: "Question order will be shuffled for each student" },
                        { icon: "🔁", title: "Shuffled Options", desc: "MCQ answer options will be randomized per attempt" },
                        { icon: "⏱️", title: "Auto-Submit", desc: "Exam auto-submits when the timer expires" },
                        { icon: "🔒", title: "Access Control", desc: "Only assigned classes can access this exam" },
                        { icon: "📋", title: "Single Attempt", desc: "Students cannot retake once submitted" },
                        { icon: "🤖", title: "AI-Assisted", desc: "Difficulty reviewed and approved by creator" },
                    ].map(({ icon, title, desc }) => (
                        <div key={title} className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                            <span className="text-base leading-none mt-0.5">{icon}</span>
                            <div>
                                <p className="text-[11px] font-bold text-gray-700">{title}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Error */}
            {saveError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{saveError}</p>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-end">
                <button
                    onClick={() => handleSave(false)}
                    disabled={!!saving}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                    {saving === "draft"
                        ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving…</>
                        : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>{examId ? "Save Changes" : "Save as Draft"}</>
                    }
                </button>
                <button
                    onClick={() => handleSave(true)}
                    disabled={!!saving || approved.length === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm px-8 py-3 rounded-lg transition-colors shadow-sm"
                >
                    {saving === "publish"
                        ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving…</>
                        : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{examId ? "Update & Publish" : "Publish Exam"}</>
                    }
                </button>
            </div>
        </div>
    );
}
