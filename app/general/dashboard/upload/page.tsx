"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ManualEntryStep from "@/app/dashboard/create/_steps/ManualEntryStep";
import FinalizeStep from "@/app/dashboard/create/_steps/FinalizeStep";
import { defaultForm } from "@/app/dashboard/create/types";
import type { ExamForm, Question, ExamType, QuestionType, Difficulty } from "@/app/dashboard/create/types";

const STEPS = ["Exam Setup", "Enter Questions", "Finalize"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">{label}</label>
            {children}
        </div>
    );
}

const inputCls = "w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white";
const selectCls = inputCls;

export default function GeneralUploadExamPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [step0Error, setStep0Error] = useState("");
    const [questions, setQuestions] = useState<Question[]>([]);

    const [form, setForm] = useState<ExamForm>({
        ...defaultForm,
        title: "",
        subject: "",
        type: "JAMB / UTME",
        questionType: "MCQ",
        difficulty: "Mixed",
        showResults: true,
        source: "manual",
    });

    useEffect(() => {
        if (typeof window !== "undefined" && sessionStorage.getItem("generalAdmin") !== "1") {
            router.replace("/general/dashboard/login");
        }
    }, [router]);

    const set = (key: keyof ExamForm, value: string | number | boolean) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleStep0Next = () => {
        if (!form.title.trim() || !form.subject.trim()) {
            setStep0Error("Please fill in the Exam Title and Subject before continuing.");
            return;
        }
        setStep0Error("");
        setStep(1);
    };

    const handleManualNext = () => setStep(2);

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
                    <Link
                        href="/general/dashboard"
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Dashboard
                    </Link>
                    <div className="h-4 w-px bg-gray-200" />
                    <span className="text-sm font-bold text-gray-900">New Exam</span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {/* Step indicator */}
                <div className="flex items-center gap-0 mb-8">
                    {STEPS.map((label, i) => {
                        const done = i < step;
                        const active = i === step;
                        return (
                            <div key={i} className="flex items-center flex-shrink-0">
                                <div className="flex flex-col items-center">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${done ? "bg-green-600 border-green-600 text-white" : active ? "bg-white border-green-600 text-green-600" : "bg-white border-gray-300 text-gray-400"}`}>
                                        {done ? (
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : i + 1}
                                    </div>
                                    <span className={`text-[10px] mt-1 font-semibold whitespace-nowrap ${active ? "text-green-700" : done ? "text-green-500" : "text-gray-400"}`}>{label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`h-0.5 w-16 mb-4 mx-1 flex-shrink-0 ${i < step ? "bg-green-500" : "bg-gray-200"}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">

                    {/* ── STEP 0: Exam Setup ───────────────────────────────────────────── */}
                    {step === 0 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Exam Setup</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Configure your exam details before entering questions.</p>
                            </div>

                            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                                <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <p className="text-xs text-green-800">
                                    <strong>General Mode:</strong> This exam will be open to everyone at <code className="bg-green-100 px-1 rounded">/general</code>. Results are always shown instantly. No school code required.
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Field label="Exam Title">
                                        <input
                                            className={inputCls}
                                            placeholder="e.g. WAEC Biology 2024"
                                            value={form.title}
                                            onChange={(e) => set("title", e.target.value)}
                                        />
                                    </Field>
                                </div>
                                <Field label="Subject">
                                    <input
                                        className={inputCls}
                                        placeholder="e.g. Biology"
                                        value={form.subject}
                                        onChange={(e) => set("subject", e.target.value)}
                                    />
                                </Field>
                                <Field label="Class / Level">
                                    <select className={selectCls} value={form.classLevel} onChange={(e) => set("classLevel", e.target.value)}>
                                        {["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3", "General"].map((c) => (
                                            <option key={c}>{c}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Exam Type">
                                    <select className={selectCls} value={form.type} onChange={(e) => set("type", e.target.value as ExamType)}>
                                        {["Practice", "Test", "Mock", "WAEC", "JAMB / UTME", "NECO", "BECE", "Post-UTME"].map((t) => (
                                            <option key={t}>{t}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Question Type">
                                    <select className={selectCls} value={form.questionType} onChange={(e) => set("questionType", e.target.value as QuestionType)}>
                                        <option value="MCQ">MCQ (Multiple Choice)</option>
                                        <option value="Theory">Theory</option>
                                        <option value="Mixed">Mixed</option>
                                    </select>
                                </Field>
                                <Field label="Difficulty">
                                    <select className={selectCls} value={form.difficulty} onChange={(e) => set("difficulty", e.target.value as Difficulty | "Mixed")}>
                                        <option value="Simple">Simple</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                        <option value="Mixed">Mixed</option>
                                    </select>
                                </Field>
                                <Field label="Duration (minutes)">
                                    <input
                                        className={inputCls}
                                        type="number"
                                        placeholder="e.g. 60"
                                        value={form.duration}
                                        onChange={(e) => set("duration", e.target.value)}
                                        min={5}
                                        max={300}
                                    />
                                </Field>
                            </div>

                            {step0Error && (
                                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-4 py-3 rounded-lg">
                                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                    </svg>
                                    {step0Error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => router.back()}
                                    className="text-sm font-semibold text-gray-600 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStep0Next}
                                    className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
                                >
                                    Continue
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 1: Enter Questions ──────────────────────────────────────── */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Enter Questions</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Add all the questions for your exam.</p>
                            </div>
                            <ManualEntryStep
                                questions={questions}
                                onChange={setQuestions}
                                onNext={handleManualNext}
                                onBack={() => setStep(0)}
                            />
                        </div>
                    )}

                    {/* ── STEP 2: Finalize ─────────────────────────────────────────────── */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Finalize Exam</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        <span className="font-semibold text-green-700">{questions.length} question{questions.length !== 1 ? "s" : ""}</span> ready — review and publish.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-xs font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    ← Back
                                </button>
                            </div>
                            <FinalizeStep
                                questions={questions}
                                form={{ ...form, showResults: true, questionCount: questions.length }}
                                isGeneral={true}
                                redirectPath="/general/dashboard"
                                themeColor="indigo"
                            />
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
