"use client";


import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminProfile } from "@/lib/authService";
import Link from "next/link";
import ProcessingStep from "./_steps/ProcessingStep";
import ReviewStep from "./_steps/ReviewStep";
import FinalizeStep from "./_steps/FinalizeStep";
import ManualEntryStep from "./_steps/ManualEntryStep";
import { defaultForm, generateQuestions } from "./types";
import type { ExamForm, Question, Difficulty, QuestionType } from "./types";

// ── Step indicators per source mode ─────────────────────────────────────────
const PDF_STEPS = ["Exam Setup", "Upload & Configure", "AI Processing", "Review & Approve", "Finalize"];
const MANUAL_STEPS = ["Exam Setup", "Enter Questions", "Finalize"];

// pdf steps:   0=setup  1=upload  2=processing  3=review   4=finalize
// manual steps: 0=setup  1=enter-questions  2=finalize
// We track "mode" and "step" separately so the two flows never collide.

type Mode = "pdf" | "manual";

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
    return (
        <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
            {steps.map((label, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <div key={i} className="flex items-center flex-shrink-0">
                        <div className="flex flex-col items-center">
                            <div className={`w - 7 h - 7 rounded - full flex items - center justify - center text - xs font - bold border - 2 transition - all ${done ? "bg-blue-600 border-blue-600 text-white" : active ? "bg-white border-blue-600 text-blue-600" : "bg-white border-gray-300 text-gray-400"} `}>
                                {done ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> : i + 1}
                            </div>
                            <span className={`text - [10px] mt - 1 font - semibold whitespace - nowrap ${active ? "text-blue-700" : done ? "text-blue-500" : "text-gray-400"} `}>{label}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`h - 0.5 w - 8 sm: w - 14 mb - 4 mx - 1 flex - shrink - 0 ${i < current ? "bg-blue-500" : "bg-gray-200"} `} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Input helpers ─────────────────────────────────────────────────────────────
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CreateExamPage() {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>("pdf");
    // pdf flow steps: 0=setup 1=upload 2=processing 3=review 4=finalize
    // manual flow steps: 0=setup 1=enter-questions 2=finalize
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<ExamForm>(defaultForm);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [step1Error, setStep1Error] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getAdminProfile().then((profile) => {
            if (!profile) router.replace("/dashboard/login");
        });
    }, [router]);

    const set = (key: keyof ExamForm, value: string | number | boolean) =>
        setForm((f) => ({ ...f, [key]: value }));

    // ── Step 1 → next ─────────────────────────────────────────────────────────
    const handleStep1Next = () => {
        if (!form.title || !form.subject) {
            setStep1Error("Please fill in the Exam Title and Subject before proceeding.");
            return;
        }
        setStep1Error("");
        // Reset questions whenever moving past setup
        setQuestions([]);
        if (mode === "manual") {
            setStep(1); // → Enter Questions
        } else {
            setStep(1); // → Upload & Configure
        }
    };

    // ── PDF: Step 2 → 3 (process PDF) ────────────────────────────────────────
    const handleProcessPDF = () => {
        const qs = generateQuestions(form.subject, form.questionCount, form.questionType, form.difficulty as Difficulty | "Mixed");
        setQuestions(qs);
        setStep(2); // → AI Processing
    };

    // ── PDF: Step 3 complete → Step 4 (review) ───────────────────────────────
    const handleProcessingComplete = useCallback(() => setStep(3), []);

    // ── PDF: Step 4 approve all ───────────────────────────────────────────────
    const handleApproveAll = () => setQuestions((qs) => qs.map((q) => ({ ...q, approved: true })));

    // ── PDF: Step 4 → Step 5 ─────────────────────────────────────────────────
    const handleReviewNext = () => setStep(4);

    // ── Manual: Step 1 (enter questions) → Step 2 (finalize) ─────────────────
    const handleManualNext = () => setStep(2);

    // ── Drag & Drop ───────────────────────────────────────────────────────────
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f?.type === "application/pdf") setPdfFile(f);
    };

    // ── Derived step index for indicator ─────────────────────────────────────
    const indicatorIndex = step; // step numbers align with indicator indices

    // ── Render ─────────────────────────────────────────────────────────────────
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
                        <span className="text-sm font-bold text-gray-900">Create New Exam</span>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <StepIndicator
                    current={indicatorIndex}
                    steps={mode === "manual" ? MANUAL_STEPS : PDF_STEPS}
                />

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">

                    {/* ── STEP 0: Exam Setup (both flows) ─────────────────────── */}
                    {step === 0 && (
                        <div className="space-y-5 max-w-2xl">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Exam Setup</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Fill in the basic details for your exam.</p>
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
                                    <input className={inputCls} type="number" placeholder="Leave blank for AI suggestion"
                                        value={form.duration} onChange={(e) => set("duration", e.target.value)} min={5} max={300} />
                                </Field>
                            </div>

                            {/* Question Source */}
                            <Field label="Question Source">
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {[
                                        {
                                            val: "pdf" as Mode,
                                            label: "AI from PDF",
                                            desc: "Upload a question paper — AI extracts, classifies, and you approve",
                                            icon: "🤖",
                                        },
                                        {
                                            val: "manual" as Mode,
                                            label: "Manual Entry",
                                            desc: "Type your own questions, set difficulty, and add MCQ options yourself",
                                            icon: "✏️",
                                        },
                                    ].map(({ val, label, desc, icon }) => (
                                        <button key={val} type="button"
                                            onClick={() => { setMode(val); set("source", val); }}
                                            className={`flex items - start gap - 3 p - 4 rounded - xl border - 2 text - left transition - all ${mode === val ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"} `}>
                                            <span className="text-xl">{icon}</span>
                                            <div>
                                                <p className={`text - sm font - bold ${mode === val ? "text-blue-700" : "text-gray-700"} `}>{label}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            {/* Show Results Toggle */}
                            <Field label="Show Results to Students">
                                <button
                                    type="button"
                                    onClick={() => set("showResults", !form.showResults)}
                                    className={`relative inline - flex h - 6 w - 11 items - center rounded - full border - 2 transition - colors focus: outline - none ${form.showResults ? "bg-blue-600 border-blue-600" : "bg-gray-200 border-gray-300"} `}
                                >
                                    <span className={`inline - block h - 4 w - 4 transform rounded - full bg - white shadow transition - transform ${form.showResults ? "translate-x-5" : "translate-x-1"} `} />
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


                    {/* ── MANUAL STEP 1: Enter Questions ──────────────────────── */}
                    {step === 1 && mode === "manual" && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Enter Questions</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Add all the questions for your exam. You can edit or delete them before finalizing.
                                </p>
                            </div>
                            <ManualEntryStep
                                questions={questions}
                                onChange={setQuestions}
                                onNext={handleManualNext}
                                onBack={() => setStep(0)}
                            />
                        </div>
                    )}

                    {/* ── PDF STEP 1: Upload & Configure ─────────────────────── */}
                    {step === 1 && mode === "pdf" && (
                        <div className="space-y-5 max-w-2xl">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Upload & Configure</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Upload your PDF question paper and configure AI settings.</p>
                            </div>

                            {/* Upload Zone */}
                            <div
                                onClick={() => fileRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                className={`border - 2 border - dashed rounded - xl p - 8 text - center cursor - pointer transition - all ${dragOver ? "border-blue-500 bg-blue-50" : pdfFile ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"} `}>
                                <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setPdfFile(f); }} />
                                {pdfFile ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-semibold text-green-700">{pdfFile.name}</p>
                                        <p className="text-xs text-gray-500">{(pdfFile.size / 1024).toFixed(1)} KB · Click to change</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                        </svg>
                                        <p className="text-sm font-semibold text-gray-600">Drop your PDF here or click to upload</p>
                                        <p className="text-xs text-gray-400">PDF files only · Max 20MB</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <Field label="Question Type">
                                    <select className={selectCls} value={form.questionType}
                                        onChange={(e) => set("questionType", e.target.value as QuestionType)}>
                                        <option value="MCQ">MCQ (Multiple Choice)</option>
                                        <option value="Theory">Theory</option>
                                        <option value="Mixed">Mixed</option>
                                    </select>
                                </Field>
                                <Field label="Difficulty Preference">
                                    <select className={selectCls} value={form.difficulty}
                                        onChange={(e) => set("difficulty", e.target.value)}>
                                        <option value="Simple">Simple</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                        <option value="Mixed">Mixed (Auto-balanced)</option>
                                    </select>
                                </Field>
                                <Field label="Number of Questions">
                                    <input className={inputCls} type="number" min={5} max={80} value={form.questionCount}
                                        onChange={(e) => set("questionCount", Number(e.target.value))} />
                                </Field>
                            </div>

                            {/* Mixed ratio sliders */}
                            {form.difficulty === "Mixed" && (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Difficulty Ratio</p>
                                    {(["Simple", "Medium", "Hard"] as const).map((d) => {
                                        const key = `ratio${d} ` as keyof ExamForm;
                                        const colors = { Simple: "accent-emerald-500", Medium: "accent-amber-500", Hard: "accent-red-500" };
                                        return (
                                            <div key={d} className="flex items-center gap-3">
                                                <span className="text-xs text-gray-600 w-14 font-medium">{d}</span>
                                                <input type="range" min={0} max={100} value={form[key] as number}
                                                    onChange={(e) => set(key, Number(e.target.value))}
                                                    className={`flex - 1 h - 2 ${colors[d]} `} />
                                                <span className="text-xs font-bold text-gray-700 w-10 text-right">{form[key]}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setStep(0)} className="text-sm font-semibold text-gray-600 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50">Back</button>
                                <button onClick={handleProcessPDF}
                                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                    </svg>
                                    Process PDF with AI
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── PDF STEP 2: AI Processing ───────────────────────────── */}
                    {step === 2 && mode === "pdf" && (
                        <ProcessingStep
                            subject={form.subject}
                            questionCount={form.questionCount}
                            onComplete={handleProcessingComplete}
                        />
                    )}

                    {/* ── PDF STEP 3: Review & Approve ────────────────────────── */}
                    {step === 3 && mode === "pdf" && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Review & Approve</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Verify AI-detected difficulty levels. Approve the questions you want to include.
                                </p>
                            </div>
                            <ReviewStep
                                questions={questions}
                                onChange={setQuestions}
                                onApproveAll={handleApproveAll}
                                onNext={handleReviewNext}
                            />
                        </div>
                    )}

                    {/* ── FINALIZE: PDF step 4 / Manual step 2 ───────────────── */}
                    {((step === 4 && mode === "pdf") || (step === 2 && mode === "manual")) && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Finalize Exam</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Review the exam configuration, then save as draft or publish to students.
                                </p>
                            </div>
                            <FinalizeStep questions={questions} form={form} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
