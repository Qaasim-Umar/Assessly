"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProcessingStep from "@/app/dashboard/create/_steps/ProcessingStep";
import ReviewStep from "@/app/dashboard/create/_steps/ReviewStep";
import ManualEntryStep from "@/app/dashboard/create/_steps/ManualEntryStep";
import FinalizeStep from "@/app/dashboard/create/_steps/FinalizeStep";
import { defaultForm, generateQuestions } from "@/app/dashboard/create/types";
import type { ExamForm, Question, Difficulty, QuestionType, ExamType } from "@/app/dashboard/create/types";
import { uploadGeneralQuestionImage } from "@/lib/questionAssets";

const MANUAL_STEPS = ["Exam Setup", "Enter Questions", "Finalize"];
const PDF_STEPS = ["Exam Setup", "Upload & Configure", "AI Processing", "Review & Approve", "Finalize"];

type Mode = "pdf" | "manual";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">{label}</label>
            {children}
        </div>
    );
}

const inputCls = "w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";
const selectCls = inputCls;

export default function GeneralCreateExamPage() {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>("manual");
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<ExamForm>({ ...defaultForm, showResults: true });
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [step1Error, setStep1Error] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    // Auth guard
    useEffect(() => {
        if (typeof window !== "undefined" && sessionStorage.getItem("generalAdmin") !== "1") {
            router.replace("/general/dashboard/login");
        }
    }, [router]);

    const set = (key: keyof ExamForm, value: string | number | boolean) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleStep1Next = () => {
        if (!form.title || !form.subject) {
            setStep1Error("Please fill in the Exam Title and Subject before proceeding.");
            return;
        }
        setStep1Error("");
        setQuestions([]);
        setStep(1);
    };

    const handleProcessPDF = () => {
        const qs = generateQuestions(form.subject, form.questionCount, form.questionType, form.difficulty as Difficulty | "Mixed");
        setQuestions(qs);
        setStep(2);
    };

    const handleProcessingComplete = useCallback(() => setStep(3), []);
    const handleApproveAll = () => setQuestions((qs) => qs.map((q) => ({ ...q, approved: true })));
    const handleReviewNext = () => setStep(4);
    const handleManualNext = () => setStep(2);
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f?.type === "application/pdf") setPdfFile(f);
    };

    const isFinalizeStep = (step === 4 && mode === "pdf") || (step === 2 && mode === "manual");
    const steps = mode === "manual" ? MANUAL_STEPS : PDF_STEPS;

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
                    <Link href="/general/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Dashboard
                    </Link>
                    <div className="h-4 w-px bg-gray-200" />
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-indigo-700 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-gray-900">Upload General Exam</span>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {/* Step indicator */}
                <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
                    {steps.map((label, i) => {
                        const done = i < step;
                        const active = i === step;
                        return (
                            <div key={i} className="flex items-center flex-shrink-0">
                                <div className="flex flex-col items-center">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${done ? "bg-indigo-600 border-indigo-600 text-white" : active ? "bg-white border-indigo-600 text-indigo-600" : "bg-white border-gray-300 text-gray-400"}`}>
                                        {done ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> : i + 1}
                                    </div>
                                    <span className={`text-[10px] mt-1 font-semibold whitespace-nowrap ${active ? "text-indigo-700" : done ? "text-indigo-500" : "text-gray-400"}`}>{label}</span>
                                </div>
                                {i < steps.length - 1 && <div className={`h-0.5 w-8 sm:w-14 mb-4 mx-1 flex-shrink-0 ${i < step ? "bg-indigo-500" : "bg-gray-200"}`} />}
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">

                    {/* ── STEP 0: Exam Setup ─────────────────────────────────────────── */}
                    {step === 0 && (
                        <div className="space-y-5 max-w-2xl">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Exam Setup</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Fill in the details. This exam will be public — no login needed.</p>
                            </div>

                            {/* General Mode notice */}
                            <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
                                <svg className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <p className="text-xs text-indigo-800">
                                    <strong>General Mode:</strong> This exam will be open to everyone at <code>/general</code>. Results are always shown instantly. No school code required.
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Field label="Exam Title">
                                        <input className={inputCls} placeholder="e.g. Practice Mathematics Paper 1"
                                            value={form.title} onChange={(e) => set("title", e.target.value)} />
                                    </Field>
                                </div>
                                <Field label="Subject">
                                    <input className={inputCls} placeholder="e.g. Mathematics, Biology"
                                        value={form.subject} onChange={(e) => set("subject", e.target.value)} />
                                </Field>
                                <Field label="Class / Level">
                                    <select className={selectCls} value={form.classLevel} onChange={(e) => set("classLevel", e.target.value)}>
                                        {["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3", "General"].map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                </Field>
                                <Field label="Exam Type">
                                    <select className={selectCls} value={form.type} onChange={(e) => set("type", e.target.value as ExamType)}>
                                        <option value="Practice">Practice</option>
                                        <option value="Test">Test</option>
                                        <option value="Mock">Mock</option>
                                        <option value="WAEC">WAEC</option>
                                        <option value="JAMB / UTME">JAMB / UTME</option>
                                        <option value="NECO">NECO</option>
                                        <option value="BECE">BECE</option>
                                        <option value="Post-UTME">Post-UTME</option>
                                    </select>
                                </Field>
                                <Field label="Duration (minutes)">
                                    <input className={inputCls} type="number" placeholder="e.g. 30"
                                        value={form.duration} onChange={(e) => set("duration", e.target.value)} min={5} max={300} />
                                </Field>
                            </div>

                            {/* Question source */}
                            <Field label="Question Source">
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {[
                                        { val: "manual" as Mode, label: "Manual Entry", desc: "Type your questions directly", icon: "✏️" },
                                        { val: "pdf" as Mode, label: "AI from PDF", desc: "Upload a PDF — AI extracts questions", icon: "🤖" },
                                    ].map(({ val, label, desc, icon }) => (
                                        <button key={val} type="button"
                                            onClick={() => { setMode(val); set("source", val); }}
                                            className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${mode === val ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                                            <span className="text-xl">{icon}</span>
                                            <div>
                                                <p className={`text-sm font-bold ${mode === val ? "text-indigo-700" : "text-gray-700"}`}>{label}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            {step1Error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{step1Error}</p>}
                            <button onClick={handleStep1Next}
                                className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors">
                                Next <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    )}

                    {/* ── MANUAL STEP 1: Enter Questions ─────────────────────────────── */}
                    {step === 1 && mode === "manual" && (
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
                                enableImages
                                uploadImage={uploadGeneralQuestionImage}
                            />
                        </div>
                    )}

                    {/* ── PDF STEP 1: Upload & Configure ─────────────────────────────── */}
                    {step === 1 && mode === "pdf" && (
                        <div className="space-y-5 max-w-2xl">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Upload & Configure</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Upload your PDF question paper and configure AI settings.</p>
                            </div>
                            <div
                                onClick={() => fileRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? "border-indigo-500 bg-indigo-50" : pdfFile ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"}`}>
                                <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setPdfFile(f); }} />
                                {pdfFile ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <p className="text-sm font-semibold text-green-700">{pdfFile.name}</p>
                                        <p className="text-xs text-gray-500">{(pdfFile.size / 1024).toFixed(1)} KB · Click to change</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                        <p className="text-sm font-semibold text-gray-600">Drop PDF here or click to upload</p>
                                        <p className="text-xs text-gray-400">PDF only · Max 20MB</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <Field label="Question Type">
                                    <select className={selectCls} value={form.questionType} onChange={(e) => set("questionType", e.target.value as QuestionType)}>
                                        <option value="MCQ">MCQ (Multiple Choice)</option>
                                        <option value="Theory">Theory</option>
                                        <option value="Mixed">Mixed</option>
                                    </select>
                                </Field>
                                <Field label="Difficulty">
                                    <select className={selectCls} value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
                                        <option value="Simple">Simple</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                        <option value="Mixed">Mixed</option>
                                    </select>
                                </Field>
                                <Field label="Number of Questions">
                                    <input className={inputCls} type="number" min={5} max={80} value={form.questionCount}
                                        onChange={(e) => set("questionCount", Number(e.target.value))} />
                                </Field>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setStep(0)} className="text-sm font-semibold text-gray-600 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50">Back</button>
                                <button onClick={handleProcessPDF}
                                    className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors">
                                    Process PDF with AI
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── PDF STEP 2: AI Processing ───────────────────────────────────── */}
                    {step === 2 && mode === "pdf" && (
                        <ProcessingStep subject={form.subject} questionCount={form.questionCount} onComplete={handleProcessingComplete} />
                    )}

                    {/* ── PDF STEP 3: Review & Approve ───────────────────────────────── */}
                    {step === 3 && mode === "pdf" && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Review & Approve</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Approve the questions you want to include.</p>
                            </div>
                            <ReviewStep questions={questions} onChange={setQuestions} onApproveAll={handleApproveAll} onNext={handleReviewNext} />
                        </div>
                    )}

                    {/* ── FINALIZE ───────────────────────────────────────────────────── */}
                    {isFinalizeStep && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Finalize Exam</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Review, then save as draft or publish to the public.</p>
                            </div>
                            <FinalizeStep
                                questions={questions}
                                form={{ ...form, showResults: true }}
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
