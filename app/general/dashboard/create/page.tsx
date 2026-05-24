"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { uploadGeneralQuestionImage } from "@/lib/questionAssets";

// ─── Types ────────────────────────────────────────────────────────────────────
type ImportMode = "json" | "manual";
type ExamTypeEnum = "jamb" | "waec" | "neco" | "bece" | "post_utme";
type DifficultyEnum = "easy" | "medium" | "hard" | "extreme";

interface PoolQuestion {
    id: number;
    text: string;
    topic: string;
    difficulty: DifficultyEnum;
    explanation: string;
    hint: string;
    imageUrl?: string;
    options: { label: string; text: string }[];
    correctAnswer: number;
    hasDiagram?: boolean;
    diagramNote?: string;
}

interface BatchConfig {
    subject: string;
    examType: ExamTypeEnum | "";
    isPastPaper: boolean;
    year: string;
    defaultTopic: string;
    defaultDifficulty: DifficultyEnum;
}

// ─── Raw JSON types ───────────────────────────────────────────────────────────
interface RawOption {
    key: string;
    text: string;
    is_correct: boolean;
}

interface RawQuestion {
    number?: number;
    question: string;
    topic?: string;
    difficulty?: string;
    explanation?: string;
    hint?: string;
    has_diagram?: boolean;
    diagram_note?: string;
    options: RawOption[];
}

interface RawEntry {
    subject?: string;
    year?: number;
    exam_type?: string;
    questions: RawQuestion[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const EXAM_TYPE_OPTIONS: { label: string; value: ExamTypeEnum | "" }[] = [
    { label: "None (general pool)", value: "" },
    { label: "JAMB / UTME", value: "jamb" },
    { label: "WAEC", value: "waec" },
    { label: "NECO", value: "neco" },
    { label: "BECE", value: "bece" },
    { label: "Post-UTME", value: "post_utme" },
];

const DIFFICULTY_OPTIONS: { label: string; value: DifficultyEnum }[] = [
    { label: "Easy", value: "easy" },
    { label: "Medium", value: "medium" },
    { label: "Hard", value: "hard" },
    { label: "Extreme", value: "extreme" },
];

// ─── JSON Parser ──────────────────────────────────────────────────────────────
function parseJson(raw: string, config: BatchConfig): {
    questions: PoolQuestion[];
    diagramIndices: number[];
    diagramNotes: Record<number, string>;
    detectedSubject?: string;
    detectedYear?: number;
} {
    const parsed: RawEntry | RawEntry[] = JSON.parse(raw);
    const entry: RawEntry = Array.isArray(parsed) ? parsed[0] : parsed;

    if (!entry?.questions?.length) {
        throw new Error("JSON must contain a 'questions' array with at least one item.");
    }

    const diagramIndices: number[] = [];
    const diagramNotes: Record<number, string> = {};
    const diffMap: Record<string, DifficultyEnum> = { easy: "easy", medium: "medium", hard: "hard", extreme: "extreme" };

    const questions: PoolQuestion[] = entry.questions.map((q, idx) => {
        const correctIndex = q.options.findIndex((o) => o.is_correct === true);
        if (correctIndex === -1) {
            throw new Error(`Question ${q.number ?? idx + 1}: no option has "is_correct": true.`);
        }
        if (q.has_diagram) {
            diagramIndices.push(idx);
            if (q.diagram_note) diagramNotes[idx] = q.diagram_note;
        }
        const diff: DifficultyEnum = q.difficulty
            ? (diffMap[q.difficulty.toLowerCase()] ?? config.defaultDifficulty)
            : config.defaultDifficulty;

        return {
            id: idx + 1,
            text: q.question,
            topic: q.topic ?? config.defaultTopic,
            difficulty: diff,
            explanation: q.explanation ?? "",
            hint: q.hint ?? "",
            options: q.options.map((o) => ({ label: o.key, text: o.text })),
            correctAnswer: correctIndex,
            hasDiagram: q.has_diagram,
            diagramNote: q.diagram_note,
        };
    });

    return { questions, diagramIndices, diagramNotes, detectedSubject: entry.subject, detectedYear: entry.year };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function emptyQuestion(id: number, config: BatchConfig): PoolQuestion {
    return {
        id,
        text: "",
        topic: config.defaultTopic,
        difficulty: config.defaultDifficulty,
        explanation: "",
        hint: "",
        options: [
            { label: "A", text: "" },
            { label: "B", text: "" },
            { label: "C", text: "" },
            { label: "D", text: "" },
        ],
        correctAnswer: 0,
    };
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

const inputCls = "w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white";
const selectCls = inputCls;

// ─── Manual Question Card ─────────────────────────────────────────────────────
function ManualQuestionCard({
    q,
    index,
    onChange,
    onRemove,
}: {
    q: PoolQuestion;
    index: number;
    onChange: (updated: PoolQuestion) => void;
    onRemove: () => void;
}) {
    const set = (key: keyof PoolQuestion, value: unknown) => onChange({ ...q, [key]: value });

    return (
        <div className="border border-gray-200 rounded-xl p-5 space-y-4 bg-white">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">Q{index + 1}</span>
                <button onClick={onRemove} className="text-xs text-red-500 hover:text-red-700 font-semibold">Remove</button>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Question *</label>
                <textarea
                    rows={2}
                    value={q.text}
                    onChange={(e) => set("text", e.target.value)}
                    placeholder="Enter the question text…"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Options * <span className="normal-case font-normal text-gray-400">(click circle = correct answer)</span></label>
                {q.options.map((opt, i) => (
                    <div key={opt.label} className="flex items-center gap-2">
                        <button
                            onClick={() => set("correctAnswer", i)}
                            className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors ${q.correctAnswer === i ? "bg-green-600 border-green-600" : "border-gray-300 hover:border-green-400"}`}
                        >
                            {q.correctAnswer === i && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                        <span className="text-xs font-bold text-gray-500 w-4">{opt.label}</span>
                        <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => {
                                const newOpts = q.options.map((o, j) => j === i ? { ...o, text: e.target.value } : o);
                                set("options", newOpts);
                            }}
                            placeholder={`Option ${opt.label}`}
                            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Topic</label>
                    <input
                        type="text"
                        value={q.topic}
                        onChange={(e) => set("topic", e.target.value)}
                        placeholder="e.g. Cell Biology"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Difficulty</label>
                    <select
                        value={q.difficulty}
                        onChange={(e) => set("difficulty", e.target.value as DifficultyEnum)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        {DIFFICULTY_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Explanation <span className="normal-case font-normal text-gray-400">(shown after answer)</span></label>
                <textarea
                    rows={2}
                    value={q.explanation}
                    onChange={(e) => set("explanation", e.target.value)}
                    placeholder="Why is this the correct answer?"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Hint <span className="normal-case font-normal text-gray-400">(shown on request)</span></label>
                <input
                    type="text"
                    value={q.hint}
                    onChange={(e) => set("hint", e.target.value)}
                    placeholder="A nudge to help the student…"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>
        </div>
    );
}

// ─── Diagram Card ─────────────────────────────────────────────────────────────
function DiagramCard({
    question,
    qIdx,
    note,
    onImageUploaded,
    onImageRemoved,
}: {
    question: PoolQuestion;
    qIdx: number;
    note?: string;
    onImageUploaded: (qIdx: number, url: string) => void;
    onImageRemoved: (qIdx: number) => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploadError("");
        setUploading(true);
        try {
            const url = await uploadGeneralQuestionImage(file);
            onImageUploaded(qIdx, url);
        } catch (err: unknown) {
            setUploadError(err instanceof Error ? err.message : "Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5 flex-shrink-0">
                    Q{qIdx + 1}
                </span>
                <p className="text-sm text-gray-800 leading-snug">{question.text}</p>
            </div>
            {note && (
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    <svg className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-blue-700">{note}</p>
                </div>
            )}
            {question.imageUrl ? (
                <div className="flex items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={question.imageUrl} alt={`Diagram for Q${qIdx + 1}`} className="h-32 rounded-lg border border-gray-200 object-contain bg-gray-50" />
                    <button
                        onClick={() => onImageRemoved(qIdx)}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Remove
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleFile} />
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 text-xs font-semibold text-gray-700 border border-gray-300 hover:border-green-400 hover:bg-green-50 hover:text-green-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {uploading ? (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                        )}
                        {uploading ? "Uploading…" : "Upload Diagram"}
                    </button>
                    <span className="text-[10px] text-gray-400">PNG / JPG / WebP</span>
                </div>
            )}
            {uploadError && <p className="text-xs text-red-600 font-medium">{uploadError}</p>}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function QuestionBankPage() {
    const router = useRouter();

    const [importMode, setImportMode] = useState<ImportMode>("json");
    const [step, setStep] = useState(0);

    const [config, setConfig] = useState<BatchConfig>({
        subject: "",
        examType: "",
        isPastPaper: false,
        year: "",
        defaultTopic: "",
        defaultDifficulty: "medium",
    });
    const [configError, setConfigError] = useState("");

    const [jsonText, setJsonText] = useState("");
    const [parseError, setParseError] = useState("");
    const [jsonQuestions, setJsonQuestions] = useState<PoolQuestion[]>([]);
    const [diagramIndices, setDiagramIndices] = useState<number[]>([]);
    const [diagramNotes, setDiagramNotes] = useState<Record<number, string>>({});
    const hasDiagrams = diagramIndices.length > 0;

    const [manualQuestions, setManualQuestions] = useState<PoolQuestion[]>([]);

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [savedCount, setSavedCount] = useState<number | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && sessionStorage.getItem("generalAdmin") !== "1") {
            router.replace("/general/dashboard/login");
        }
    }, [router]);

    const setConfigField = (key: keyof BatchConfig, value: unknown) =>
        setConfig((c) => ({ ...c, [key]: value }));

    const activeQuestions = importMode === "json" ? jsonQuestions : manualQuestions;

    const handleConfigNext = () => {
        if (!config.subject.trim()) { setConfigError("Subject is required."); return; }
        if (config.isPastPaper && (!config.year || isNaN(Number(config.year)))) {
            setConfigError("A valid year is required for past papers.");
            return;
        }
        setConfigError("");
        setStep(1);
    };

    const handleJsonParse = () => {
        setParseError("");
        if (!jsonText.trim()) { setParseError("Paste your JSON first."); return; }
        try {
            const result = parseJson(jsonText, config);
            setJsonQuestions(result.questions);
            setDiagramIndices(result.diagramIndices);
            setDiagramNotes(result.diagramNotes);
            if (!config.subject && result.detectedSubject) setConfigField("subject", result.detectedSubject);
            if (!config.year && result.detectedYear) setConfigField("year", String(result.detectedYear));
            setStep(result.diagramIndices.length > 0 ? 2 : 3);
        } catch (e: unknown) {
            setParseError(e instanceof Error ? e.message : "Invalid JSON.");
        }
    };

    const handleImageUploaded = (qIdx: number, url: string) =>
        setJsonQuestions((prev) => prev.map((q, i) => i === qIdx ? { ...q, imageUrl: url } : q));

    const handleImageRemoved = (qIdx: number) =>
        setJsonQuestions((prev) => prev.map((q, i) => i === qIdx ? { ...q, imageUrl: undefined } : q));

    const handleSave = async () => {
        const qs = activeQuestions;
        if (qs.length === 0) { setSaveError("No questions to save."); return; }
        const invalid = qs.find((q) => !q.text.trim() || q.options.some((o) => !o.text.trim()));
        if (invalid) { setSaveError(`Question ${qs.indexOf(invalid) + 1} is incomplete — fill in all option texts.`); return; }

        setSaving(true);
        setSaveError("");
        const rows = qs.map((q, idx) => ({
            exam_id: null,
            text: q.text.trim(),
            topic: q.topic.trim() || null,
            difficulty: q.difficulty,
            explanation: q.explanation.trim() || null,
            hint: q.hint.trim() || null,
            image_url: q.imageUrl ?? null,
            options: q.options,
            correct_answer: q.correctAnswer,
            type: "MCQ",
            subject: config.subject.trim(),
            exam_type: config.examType || null,
            year: config.isPastPaper && config.year ? Number(config.year) : null,
            paper_order: config.isPastPaper ? idx + 1 : null,
            is_active: true,
            order_index: idx,
        }));

        try {
            const { error } = await supabase.from("questions").insert(rows);
            if (error) throw error;
            setSavedCount(rows.length);
        } catch (e: unknown) {
            setSaveError(e instanceof Error ? e.message : "Failed to save questions.");
        } finally {
            setSaving(false);
        }
    };

    const STEPS = importMode === "json"
        ? (hasDiagrams ? ["Configure", "Import JSON", "Diagrams", "Review & Save"] : ["Configure", "Import JSON", "Review & Save"])
        : ["Configure", "Enter Questions", "Review & Save"];

    const displayStep = importMode === "json" && !hasDiagrams && step === 3 ? 2 : step;

    if (savedCount !== null) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-6">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{savedCount} questions saved</h2>
                    <p className="text-sm text-gray-500">
                        Added to the <strong>{config.subject}</strong> question bank
                        {config.examType ? ` · ${config.examType.toUpperCase()}` : ""}
                        {config.isPastPaper && config.year ? ` · ${config.year}` : ""}.
                    </p>
                    <div className="flex gap-3 justify-center pt-2">
                        <button
                            onClick={() => { setSavedCount(null); setStep(0); setJsonText(""); setJsonQuestions([]); setManualQuestions([]); setDiagramIndices([]); }}
                            className="text-sm font-semibold text-gray-600 border border-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Add More
                        </button>
                        <Link href="/general/dashboard" className="text-sm font-semibold text-white bg-green-700 hover:bg-green-800 px-5 py-2.5 rounded-lg transition-colors">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
                    <span className="text-sm font-bold text-gray-900">Question Bank</span>
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wide">Upload</span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

                {step === 1 && (
                    <div className="flex items-center gap-1 mb-8 bg-gray-100 rounded-xl p-1 w-fit">
                        {(["json", "manual"] as ImportMode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => { setImportMode(m); setParseError(""); }}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${importMode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                {m === "json" ? "JSON Import" : "Manual Entry"}
                            </button>
                        ))}
                    </div>
                )}

                {/* Step indicator */}
                <div className="flex items-center gap-0 mb-8">
                    {STEPS.map((label, i) => {
                        const done = i < displayStep;
                        const active = i === displayStep;
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
                                    <div className={`h-0.5 w-16 mb-4 mx-1 flex-shrink-0 ${i < displayStep ? "bg-green-500" : "bg-gray-200"}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">

                    {/* ── STEP 0: Configure ─────────────────────────────────────────── */}
                    {step === 0 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Configure Batch</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Set the metadata that applies to all questions in this upload.</p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Field label="Subject" required>
                                        <input className={inputCls} placeholder="e.g. Biology" value={config.subject} onChange={(e) => setConfigField("subject", e.target.value)} />
                                    </Field>
                                </div>
                                <Field label="Exam Board">
                                    <select className={selectCls} value={config.examType} onChange={(e) => setConfigField("examType", e.target.value)}>
                                        {EXAM_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </Field>
                                <Field label="Default Difficulty">
                                    <select className={selectCls} value={config.defaultDifficulty} onChange={(e) => setConfigField("defaultDifficulty", e.target.value as DifficultyEnum)}>
                                        {DIFFICULTY_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                                    </select>
                                </Field>
                                <div className="sm:col-span-2">
                                    <Field label="Default Topic">
                                        <input className={inputCls} placeholder="e.g. Cell Biology (overridable per question)" value={config.defaultTopic} onChange={(e) => setConfigField("defaultTopic", e.target.value)} />
                                    </Field>
                                </div>
                                <div className="sm:col-span-2">
                                    <div
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${config.isPastPaper ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
                                        onClick={() => setConfigField("isPastPaper", !config.isPastPaper)}
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Past Paper</p>
                                            <p className="text-xs text-gray-500 mt-0.5">These questions are from a real past exam paper</p>
                                        </div>
                                        <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${config.isPastPaper ? "bg-green-600" : "bg-gray-300"}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${config.isPastPaper ? "translate-x-4" : "translate-x-0"}`} />
                                        </div>
                                    </div>
                                </div>
                                {config.isPastPaper && (
                                    <div className="sm:col-span-2">
                                        <Field label="Year" required>
                                            <input className={inputCls} type="number" placeholder="e.g. 2022" value={config.year} onChange={(e) => setConfigField("year", e.target.value)} min={1990} max={2030} />
                                        </Field>
                                    </div>
                                )}
                            </div>

                            {configError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-4 py-3 rounded-lg">{configError}</div>}

                            <div className="flex gap-3 pt-1">
                                <button onClick={() => router.back()} className="text-sm font-semibold text-gray-600 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                                <button onClick={handleConfigNext} className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors">
                                    Continue
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 1 JSON: Import ───────────────────────────────────────── */}
                    {step === 1 && importMode === "json" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Import Questions</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Paste your JSON — questions save directly to the pool with <code className="text-green-700 bg-green-50 px-1 rounded">exam_id = null</code>.</p>
                            </div>
                            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-xs text-green-800 space-y-0.5">
                                <div>
                                    <p><strong>Required per question:</strong> <code className="bg-green-100 px-1 rounded">question</code>, <code className="bg-green-100 px-1 rounded">options[]</code> with one <code className="bg-green-100 px-1 rounded">&quot;is_correct&quot;: true</code></p>
                                    <p className="mt-0.5"><strong>Optional:</strong> <code className="bg-green-100 px-1 rounded">topic</code>, <code className="bg-green-100 px-1 rounded">difficulty</code>, <code className="bg-green-100 px-1 rounded">explanation</code>, <code className="bg-green-100 px-1 rounded">hint</code>, <code className="bg-green-100 px-1 rounded">has_diagram</code></p>
                                </div>
                            </div>
                            <textarea
                                rows={18}
                                value={jsonText}
                                onChange={(e) => { setJsonText(e.target.value); setParseError(""); }}
                                placeholder={`[\n  {\n    "subject": "Biology",\n    "year": 2022,\n    "questions": [\n      {\n        "number": 1,\n        "question": "Which of the following...",\n        "topic": "Cell Biology",\n        "difficulty": "easy",\n        "explanation": "The cell membrane...",\n        "hint": "Think about selective permeability",\n        "options": [\n          { "key": "A", "text": "Option A", "is_correct": false },\n          { "key": "B", "text": "Option B", "is_correct": true },\n          { "key": "C", "text": "Option C", "is_correct": false },\n          { "key": "D", "text": "Option D", "is_correct": false }\n        ]\n      }\n    ]\n  }\n]`}
                                className="w-full text-xs font-mono border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 resize-y leading-relaxed"
                                spellCheck={false}
                            />
                            {parseError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-4 py-3 rounded-lg">{parseError}</div>}
                            <div className="flex gap-3 pt-1">
                                <button onClick={() => setStep(0)} className="text-sm font-semibold text-gray-600 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">← Back</button>
                                <button onClick={handleJsonParse} className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors">
                                    Parse & Continue
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 1 MANUAL: Enter Questions ───────────────────────────── */}
                    {step === 1 && importMode === "manual" && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Enter Questions</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">{manualQuestions.length} question{manualQuestions.length !== 1 ? "s" : ""} added</p>
                                </div>
                                <button onClick={() => setStep(0)} className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">← Back</button>
                            </div>
                            <div className="space-y-4">
                                {manualQuestions.map((q, i) => (
                                    <ManualQuestionCard
                                        key={q.id}
                                        q={q}
                                        index={i}
                                        onChange={(updated) => setManualQuestions((prev) => prev.map((x, j) => j === i ? updated : x))}
                                        onRemove={() => setManualQuestions((prev) => prev.filter((_, j) => j !== i))}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => setManualQuestions((prev) => [...prev, emptyQuestion(prev.length + 1, config)])}
                                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 text-sm font-semibold text-gray-500 hover:text-green-700 py-4 rounded-xl transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                Add Question
                            </button>
                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <button onClick={() => setStep(0)} className="text-sm font-semibold text-gray-600 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">← Back</button>
                                <button disabled={manualQuestions.length === 0} onClick={() => setStep(3)} className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-40">
                                    Review {manualQuestions.length > 0 && `(${manualQuestions.length})`}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Diagrams ──────────────────────────────────────────── */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Assign Diagrams</h2>
                                <p className="text-sm text-gray-500 mt-0.5">{diagramIndices.length} question{diagramIndices.length !== 1 ? "s" : ""} reference a diagram.</p>
                            </div>
                            <div className="space-y-3">
                                {diagramIndices.map((qIdx) => (
                                    <DiagramCard key={qIdx} question={jsonQuestions[qIdx]} qIdx={qIdx} note={diagramNotes[qIdx]} onImageUploaded={handleImageUploaded} onImageRemoved={handleImageRemoved} />
                                ))}
                            </div>
                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <button onClick={() => setStep(1)} className="text-sm font-semibold text-gray-600 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Back</button>
                                <button onClick={() => setStep(3)} className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors">
                                    Continue to Review
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Review & Save ─────────────────────────────────────── */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Review & Save</h2>
                                    <p className="text-sm text-gray-500 mt-0.5"><span className="font-semibold text-green-700">{activeQuestions.length} questions</span> will be saved to the question bank.</p>
                                </div>
                                <button onClick={() => setStep(importMode === "json" && hasDiagrams ? 2 : 1)} className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">← Back</button>
                            </div>

                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Batch summary</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                    {[
                                        { label: "Subject", value: config.subject },
                                        { label: "Exam Board", value: config.examType ? config.examType.toUpperCase() : "General" },
                                        { label: "Type", value: config.isPastPaper ? `Past Paper ${config.year}` : "Question Pool" },
                                        { label: "Questions", value: activeQuestions.length },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="bg-white border border-gray-200 rounded-lg py-3 px-2">
                                            <p className="text-[10px] text-gray-400 font-semibold uppercase">{label}</p>
                                            <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                {activeQuestions.map((q, i) => (
                                    <div key={q.id} className="flex items-start gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3">
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">Q{i + 1}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-gray-800 line-clamp-2">{q.text}</p>
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                {q.topic && <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-semibold">{q.topic}</span>}
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${q.difficulty === "easy" ? "text-green-700 bg-green-50" : q.difficulty === "medium" ? "text-amber-700 bg-amber-50" : q.difficulty === "hard" ? "text-orange-700 bg-orange-50" : "text-red-700 bg-red-50"}`}>{q.difficulty}</span>
                                                <span className="text-[10px] text-gray-500 font-semibold">✓ {q.options[q.correctAnswer]?.text}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {saveError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-4 py-3 rounded-lg">{saveError}</div>}

                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <button onClick={() => setStep(importMode === "json" && hasDiagrams ? 2 : 1)} className="text-sm font-semibold text-gray-600 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">← Back</button>
                                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50">
                                    {saving ? (
                                        <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving…</>
                                    ) : (
                                        <>Save to Question Bank <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
