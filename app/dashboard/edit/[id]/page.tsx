"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import FinalizeStep from "../../create/_steps/FinalizeStep";
import ManualEntryStep from "../../create/_steps/ManualEntryStep";
import { defaultForm } from "../../create/types";
import type { ExamForm, Question } from "../../create/types";
import { getExamById } from "@/lib/examService";
import type { DbExamWithQuestions } from "@/lib/examService";

// The edit flow is always manual: Setup → Edit Questions → Finalize
const EDIT_STEPS = ["Exam Setup", "Edit Questions", "Finalize"];

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
    return (
        <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
            {steps.map((label, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <div key={i} className="flex items-center flex-shrink-0">
                        <div className="flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${done ? "bg-blue-600 border-blue-600 text-white" : active ? "bg-white border-blue-600 text-blue-600" : "bg-white border-gray-300 text-gray-400"}`}>
                                {done ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> : i + 1}
                            </div>
                            <span className={`text-[10px] mt-1 font-semibold whitespace-nowrap ${active ? "text-blue-700" : done ? "text-blue-500" : "text-gray-400"}`}>{label}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`h-0.5 w-8 sm:w-14 mb-4 mx-1 flex-shrink-0 ${i < current ? "bg-blue-500" : "bg-gray-200"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">{label}</label>
            {children}
        </div>
    );
}

const inputCls = "w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
const selectCls = inputCls;

// Convert DbQuestion options to Question format
function mapDbToQuestions(exam: DbExamWithQuestions): Question[] {
    return exam.questions.map((q, i) => ({
        id: i + 1,
        text: q.text,
        type: q.type as "MCQ" | "Theory",
        topic: q.topic ?? "General",
        commandWord: q.command_word ?? "Answer",
        aiDifficulty: (q.difficulty ?? "Medium") as "Simple" | "Medium" | "Hard",
        userDifficulty: (q.difficulty ?? "Medium") as "Simple" | "Medium" | "Hard",
        approved: true,
        options: q.options ?? undefined,
        correctAnswer: q.correct_answer ?? undefined,
    }));
}

// Convert DbExam to ExamForm
function mapDbToForm(exam: DbExamWithQuestions): ExamForm {
    return {
        ...defaultForm,
        title: exam.title,
        subject: exam.subject,
        classLevel: exam.class_level,
        type: exam.type as ExamForm["type"],
        duration: exam.duration ? String(exam.duration) : "",
        difficulty: exam.difficulty as ExamForm["difficulty"],
        questionType: exam.question_type as ExamForm["questionType"],
        source: "manual",
        showResults: exam.show_results ?? true,
    };
}

export default function EditExamPage() {
    const router = useRouter();
    const params = useParams();
    const examId = params.id as string;

    const [step, setStep] = useState(0);
    const [form, setForm] = useState<ExamForm>(defaultForm);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [step1Error, setStep1Error] = useState("");

    const [loadingExam, setLoadingExam] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (localStorage.getItem("assessly_auth") !== "true") {
            router.replace("/login");
            return;
        }
        let cancelled = false;
        getExamById(examId)
            .then((data) => {
                if (cancelled) return;
                if (!data) { setNotFound(true); setLoadingExam(false); return; }
                setForm(mapDbToForm(data));
                setQuestions(mapDbToQuestions(data));
                setLoadingExam(false);
            })
            .catch(() => { if (!cancelled) { setNotFound(true); setLoadingExam(false); } });
        return () => { cancelled = true; };
    }, [examId, router]);

    const set = (key: keyof ExamForm, value: string | number | boolean) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleStep1Next = () => {
        if (!form.title || !form.subject) {
            setStep1Error("Please fill in the Exam Title and Subject before proceeding.");
            return;
        }
        setStep1Error("");
        setStep(1);
    };

    if (loadingExam) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
                <div className="text-center">
                    <svg className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-gray-500">Loading exam…</p>
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-gray-500">Exam not found.</p>
                    <button onClick={() => router.push("/dashboard")} className="mt-3 text-blue-600 text-sm hover:underline">Back to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Dashboard
                    </Link>
                    <div className="h-4 w-px bg-gray-200" />
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-blue-700 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-gray-900">Edit Exam</span>
                        <span className="ml-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wide">Editing</span>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <StepIndicator current={step} steps={EDIT_STEPS} />

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">

                    {/* ── STEP 0: Exam Setup ─────────────────────────────────────── */}
                    {step === 0 && (
                        <div className="space-y-5 max-w-2xl">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Exam Setup</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Edit the basic details for your exam.</p>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Field label="Exam Title">
                                        <input className={inputCls} placeholder="e.g. Third Term Mathematics Examination"
                                            value={form.title} onChange={(e) => set("title", e.target.value)} />
                                    </Field>
                                </div>
                                <Field label="Subject">
                                    <input className={inputCls} placeholder="e.g. Mathematics, Biology"
                                        value={form.subject} onChange={(e) => set("subject", e.target.value)} />
                                </Field>
                                <Field label="Class / Level">
                                    <select className={selectCls} value={form.classLevel} onChange={(e) => set("classLevel", e.target.value)}>
                                        {["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"].map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                </Field>
                                <Field label="Exam Type">
                                    <select className={selectCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
                                        <option>Test</option><option>Mock</option><option>Practice</option>
                                    </select>
                                </Field>
                                <Field label="Duration (minutes)">
                                    <input className={inputCls} type="number" placeholder="e.g. 60"
                                        value={form.duration} onChange={(e) => set("duration", e.target.value)} min={5} max={300} />
                                </Field>
                                <Field label="Difficulty">
                                    <select className={selectCls} value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
                                        <option value="Simple">Simple</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                        <option value="Mixed">Mixed</option>
                                    </select>
                                </Field>
                                <Field label="Question Type">
                                    <select className={selectCls} value={form.questionType} onChange={(e) => set("questionType", e.target.value as ExamForm["questionType"])}>
                                        <option value="MCQ">MCQ (Multiple Choice)</option>
                                        <option value="Theory">Theory</option>
                                        <option value="Mixed">Mixed</option>
                                    </select>
                                </Field>
                            </div>

                            <Field label="Show Results to Students">
                                <button
                                    type="button"
                                    onClick={() => set("showResults", !form.showResults)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 transition-colors focus:outline-none ${form.showResults ? "bg-blue-600 border-blue-600" : "bg-gray-200 border-gray-300"}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.showResults ? "translate-x-5" : "translate-x-1"}`} />
                                </button>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    {form.showResults
                                        ? "Students will see their score immediately after submitting."
                                        : "Students will see \"Your result is being processed\" after submitting."}
                                </p>
                            </Field>

                            {step1Error && (
                                <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{step1Error}</p>
                            )}
                            <button onClick={handleStep1Next}
                                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors">
                                Next <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    )}

                    {/* ── STEP 1: Edit Questions ─────────────────────────────────── */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Edit Questions</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Add, remove, or modify questions. All changes will be saved when you finalize.
                                </p>
                            </div>
                            <ManualEntryStep
                                questions={questions}
                                onChange={setQuestions}
                                onNext={() => setStep(2)}
                                onBack={() => setStep(0)}
                            />
                        </div>
                    )}

                    {/* ── STEP 2: Finalize ──────────────────────────────────────── */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Finalize Exam</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Review and save your changes. You can save as draft or publish directly.
                                </p>
                            </div>
                            <FinalizeStep questions={questions} form={form} examId={examId} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
