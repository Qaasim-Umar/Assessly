"use client";

import { useState } from "react";
import type { Question, Difficulty } from "../types";

interface Props {
    questions: Question[];
    onChange: (questions: Question[]) => void;
    onNext: () => void;
    onBack: () => void;
    enableImages?: boolean;
    uploadImage?: (file: File) => Promise<string>;
}

const difficultyColors: Record<Difficulty, string> = {
    Simple: "bg-emerald-100 text-emerald-700",
    Medium: "bg-amber-100 text-amber-700",
    Hard: "bg-red-100 text-red-700",
};

const LETTERS = ["A", "B", "C", "D"] as const;

const blank = {
    text: "",
    type: "MCQ" as "MCQ" | "Theory",
    difficulty: "Medium" as Difficulty,
    optA: "",
    optB: "",
    optC: "",
    optD: "",
    correctAnswer: -1,
    imageUrl: "" as string,
};

// ─── Batch Parser ─────────────────────────────────────────────────────────────
interface ParsedPreview {
    text: string;
    options: string[];
    correctAnswer: number; // -1 = not detected
    valid: boolean;
    error?: string;
}

/**
 * Parses one question block like:
 *   Which of the following…
 *   A. Mitochondrion
 *   B. Ribosome
 *   C. Chloroplast *        ← asterisk marks correct answer
 *   D. Nucleus
 *
 * OR we detect the correct answer if the user marks it with *, (correct), ✓, or [correct].
 * If none are marked, correctAnswer stays -1 and the preview shows a warning.
 */
function parseBlock(block: string): ParsedPreview {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return { text: "", options: [], correctAnswer: -1, valid: false };

    // Option line pattern: starts with A. / A) / A: / A  (case-insensitive)
    const optionPattern = /^([A-Da-d])[.):\s]\s*(.+)/;

    const questionLines: string[] = [];
    const options: string[] = [];
    let correctAnswer = -1;

    for (const line of lines) {
        const m = line.match(optionPattern);
        if (m) {
            let optText = m[2].trim();
            const letterIdx = m[1].toUpperCase().charCodeAt(0) - 65; // A=0, B=1…

            // Detect correct-answer markers: *, (correct), ✓, [correct]
            const isCorrect = /[*✓]/.test(optText) || /\(correct\)/i.test(optText) || /\[correct\]/i.test(optText);
            if (isCorrect) {
                correctAnswer = letterIdx;
                optText = optText.replace(/[*✓]/g, "").replace(/\(correct\)/gi, "").replace(/\[correct\]/gi, "").trim();
            }
            options.push(optText);
        } else {
            questionLines.push(line);
        }
    }

    const text = questionLines.join(" ").trim();

    if (!text) return { text: "", options: [], correctAnswer: -1, valid: false, error: "No question text found." };
    if (options.length < 2) return { text, options, correctAnswer, valid: false, error: "At least 2 options required." };

    return { text, options, correctAnswer, valid: true };
}

function parseBatch(raw: string): ParsedPreview[] {
    // Split on blank lines (or numbered question markers 1. 2. etc.)
    const blocks = raw
        .split(/\n{2,}/)
        .map((b) => b.trim())
        .filter(Boolean);

    // If no blank lines, try to split on lines that start with a standalone number
    if (blocks.length === 1) {
        const lines = raw.split("\n");
        const splitBlocks: string[][] = [];
        let current: string[] = [];
        for (const line of lines) {
            if (/^\d+[.)]\s/.test(line.trim()) && current.length > 0) {
                splitBlocks.push(current);
                current = [line.trim().replace(/^\d+[.)]\s*/, "")];
            } else {
                current.push(line.replace(/^\d+[.)]\s*/, ""));
            }
        }
        if (current.length) splitBlocks.push(current);
        if (splitBlocks.length > 1) {
            return splitBlocks.map((b) => parseBlock(b.join("\n")));
        }
    }

    return blocks.map(parseBlock);
}

// ─── Batch Import Panel ───────────────────────────────────────────────────────
function BatchImportPanel({ onImport }: { onImport: (qs: Question[]) => void }) {
    const [raw, setRaw] = useState("");
    const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
    const [previews, setPreviews] = useState<ParsedPreview[] | null>(null);
    const [imported, setImported] = useState(false);

    const handleParse = () => {
        const parsed = parseBatch(raw).filter((p) => p.text.length > 0);
        setPreviews(parsed);
        setImported(false);
    };

    const handleImport = () => {
        if (!previews) return;
        const valid = previews.filter((p) => p.valid);
        const base = Date.now();
        const qs: Question[] = valid.map((p, i) => ({
            id: base + i,
            text: p.text,
            type: "MCQ",
            topic: "Batch Import",
            commandWord: p.text.split(" ")[0],
            aiDifficulty: difficulty,
            userDifficulty: difficulty,
            approved: true,
            options: p.options.map((t, i) => ({ label: LETTERS[i] ?? String(i + 1), text: t })),
            correctAnswer: p.correctAnswer >= 0 ? p.correctAnswer : undefined,
        }));
        onImport(qs);
        setRaw("");
        setPreviews(null);
        setImported(true);
    };

    const validCount = previews?.filter((p) => p.valid).length ?? 0;
    const warnCount = previews?.filter((p) => p.valid && p.correctAnswer < 0).length ?? 0;

    return (
        <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-1.5">
                <p className="text-xs font-bold text-blue-800">📋 Paste MCQ questions in this format:</p>
                <pre className="text-[11px] text-blue-700 leading-relaxed whitespace-pre-wrap">
                    {`Which structure is present in plant cells but absent in animal cells?
A. Mitochondrion
B. Ribosome
C. Chloroplast *
D. Nucleus

The process by which RNA is formed from DNA is known as
A. Translation
B. Replication
C. Transcription *
D. Mutation`}
                </pre>
                <p className="text-[11px] text-blue-600">
                    Tip: Mark the correct answer with <code className="bg-blue-100 px-1 rounded">*</code> after the option text.
                    Separate questions with a blank line.
                </p>
            </div>

            {/* Textarea */}
            <textarea
                rows={12}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-y font-mono"
                placeholder={`Which of the following is correct?\nA. Option one\nB. Option two *\nC. Option three\nD. Option four\n\nNext question goes here...`}
                value={raw}
                onChange={(e) => { setRaw(e.target.value); setPreviews(null); setImported(false); }}
            />

            {/* Difficulty */}
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Difficulty:</span>
                {(["Simple", "Medium", "Hard"] as Difficulty[]).map((d) => {
                    const colors = {
                        Simple: "border-emerald-500 bg-emerald-50 text-emerald-700",
                        Medium: "border-amber-500 bg-amber-50 text-amber-700",
                        Hard: "border-red-500 bg-red-50 text-red-700",
                    };
                    return (
                        <button
                            key={d}
                            type="button"
                            onClick={() => setDifficulty(d)}
                            className={`text-xs font-bold px-4 py-1.5 rounded-lg border-2 transition-all ${difficulty === d ? colors[d] : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                        >
                            {d}
                        </button>
                    );
                })}
            </div>

            {/* Parse button */}
            <button
                onClick={handleParse}
                disabled={!raw.trim()}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Preview Questions
            </button>

            {/* Preview */}
            {previews && previews.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-700">
                            Preview — {validCount} of {previews.length} question{previews.length !== 1 ? "s" : ""} ready
                        </p>
                        {warnCount > 0 && (
                            <p className="text-[11px] text-amber-600 font-semibold">
                                ⚠ {warnCount} question{warnCount > 1 ? "s" : ""} missing a correct answer
                            </p>
                        )}
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {previews.map((p, i) => (
                            <div
                                key={i}
                                className={`border rounded-xl px-4 py-3 text-xs space-y-2 ${p.valid ? "bg-white border-gray-200" : "bg-red-50 border-red-200"}`}
                            >
                                {!p.valid ? (
                                    <p className="text-red-600 font-semibold">{p.error || "Could not parse this block."}</p>
                                ) : (
                                    <>
                                        <p className="font-semibold text-gray-800 leading-snug">
                                            <span className="text-gray-400 mr-2">Q{i + 1}.</span>{p.text}
                                        </p>
                                        <div className="grid grid-cols-2 gap-1">
                                            {p.options.map((opt, oi) => (
                                                <div
                                                    key={oi}
                                                    className={`flex items-start gap-1.5 px-2 py-1 rounded-lg ${p.correctAnswer === oi ? "bg-green-50 border border-green-300" : "bg-gray-50"}`}
                                                >
                                                    <span className={`font-bold w-4 flex-shrink-0 ${p.correctAnswer === oi ? "text-green-700" : "text-gray-400"}`}>
                                                        {LETTERS[oi]}
                                                    </span>
                                                    <span className={p.correctAnswer === oi ? "text-green-800 font-medium" : "text-gray-700"}>{opt}</span>
                                                    {p.correctAnswer === oi && <span className="ml-auto text-green-600 font-bold">✓</span>}
                                                </div>
                                            ))}
                                        </div>
                                        {p.correctAnswer < 0 && (
                                            <p className="text-amber-600 font-semibold text-[11px]">
                                                ⚠ No correct answer marked — add <code className="bg-amber-100 px-1 rounded">*</code> after the correct option
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {validCount > 0 && (
                        <button
                            onClick={handleImport}
                            className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Add {validCount} Question{validCount !== 1 ? "s" : ""} to Exam
                        </button>
                    )}
                </div>
            )}

            {previews && previews.length === 0 && (
                <p className="text-sm text-red-500 font-medium">Could not detect any questions. Make sure each question has A/B/C/D options.</p>
            )}

            {imported && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-semibold text-green-800">Questions added successfully! You can paste more or switch to the editor.</p>
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ManualEntryStep({ questions, onChange, onNext, onBack }: Props) {
    const [tab, setTab] = useState<"single" | "batch">("single");
    const [form, setForm] = useState({ ...blank });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);

    const setF = (key: keyof typeof blank, val: string | number) =>
        setForm((f) => ({ ...f, [key]: val }));

    const validate = () => {
        if (!form.text.trim()) return "Question text is required.";
        if (form.type === "MCQ") {
            if (!form.optA.trim() || !form.optB.trim() || !form.optC.trim() || !form.optD.trim())
                return "All 4 MCQ options are required.";
            if (form.correctAnswer < 0)
                return "Please select the correct answer.";
        }
        return "";
    };

    const handleAdd = () => {
        const err = validate();
        if (err) { setError(err); return; }
        setError("");

        const newQ: Question = {
            id: editingId ?? Date.now(),
            text: form.text.trim(),
            imageUrl: form.imageUrl ? form.imageUrl : undefined,
            type: form.type,
            topic: "Manual",
            commandWord: form.text.trim().split(" ")[0],
            aiDifficulty: form.difficulty,
            userDifficulty: form.difficulty,
            approved: true,
            options:
                form.type === "MCQ"
                    ? [
                        { label: "A", text: form.optA.trim() },
                        { label: "B", text: form.optB.trim() },
                        { label: "C", text: form.optC.trim() },
                        { label: "D", text: form.optD.trim() },
                    ]
                    : undefined,
            correctAnswer: form.type === "MCQ" ? form.correctAnswer : undefined,
        };

        if (editingId !== null) {
            onChange(questions.map((q) => (q.id === editingId ? newQ : q)));
            setEditingId(null);
        } else {
            onChange([...questions, newQ]);
        }
        setForm({ ...blank });
    };

    const startEdit = (q: Question) => {
        setEditingId(q.id);
        setTab("single");
        setForm({
            text: q.text,
            type: q.type,
            difficulty: q.userDifficulty,
            optA: q.options?.[0]?.text ?? "",
            optB: q.options?.[1]?.text ?? "",
            optC: q.options?.[2]?.text ?? "",
            optD: q.options?.[3]?.text ?? "",
            correctAnswer: q.correctAnswer ?? -1,
            imageUrl: q.imageUrl ?? "",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEdit = () => { setEditingId(null); setForm({ ...blank }); setError(""); };
    const deleteQ = (id: number) => onChange(questions.filter((q) => q.id !== id));

    const inputCls = "w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

    return (
        <div className="space-y-6">
            {/* ── Tab switcher ── */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {([
                    { key: "single", label: "✏️ Add One" },
                    { key: "batch", label: "⚡ Batch Import" },
                ] as const).map(({ key, label }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => { setTab(key); setEditingId(null); setForm({ ...blank }); setError(""); }}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === "batch" ? (
                <BatchImportPanel
                    onImport={(qs) => onChange([...questions, ...qs])}
                />
            ) : (
                /* ── Single question form ── */
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-gray-800">
                        {editingId !== null ? "Edit Question" : "Add a Question"}
                    </h3>

                    {/* Question text */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Question Text</label>
                        <textarea
                            rows={3}
                            className={inputCls}
                            placeholder="Type your question here…"
                            value={form.text}
                            onChange={(e) => setF("text", e.target.value)}
                        />
                    </div>

                    {/* Optional diagram/image (General Mode only) */}
                    {(arguments[0] as Props).enableImages && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Question Image (optional)</label>
                            {form.imageUrl ? (
                                <div className="flex items-start gap-3">
                                    <img
                                        src={form.imageUrl}
                                        alt="Question"
                                        className="w-28 h-20 object-cover rounded-lg border border-gray-200 bg-white"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500">
                                            This image will be shown above the question during the exam.
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                type="button"
                                                onClick={() => setF("imageUrl", "")}
                                                className="text-xs font-bold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 bg-red-50 px-3 py-2 rounded-lg transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 flex-wrap">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        disabled={uploading}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            e.target.value = "";
                                            const uploadImage = (arguments[0] as Props).uploadImage;
                                            if (!file) return;
                                            if (!uploadImage) { setError("Image upload is not configured."); return; }
                                            setError("");
                                            setUploading(true);
                                            try {
                                                const url = await uploadImage(file);
                                                setF("imageUrl", url);
                                            } catch (err: unknown) {
                                                setError(err instanceof Error ? err.message : "Failed to upload image.");
                                            } finally {
                                                setUploading(false);
                                            }
                                        }}
                                        className="block text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-700 file:text-white hover:file:bg-blue-800"
                                    />
                                    {uploading && <span className="text-xs text-gray-500 font-semibold">Uploading…</span>}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                        {/* Type */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Question Type</label>
                            <div className="flex gap-2">
                                {(["MCQ", "Theory"] as const).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setF("type", t)}
                                        className={`flex-1 text-xs font-bold py-2 rounded-lg border-2 transition-all ${form.type === t ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Difficulty</label>
                            <div className="flex gap-2">
                                {(["Simple", "Medium", "Hard"] as Difficulty[]).map((d) => {
                                    const colors = {
                                        Simple: "border-emerald-500 bg-emerald-50 text-emerald-700",
                                        Medium: "border-amber-500 bg-amber-50 text-amber-700",
                                        Hard: "border-red-500 bg-red-50 text-red-700",
                                    };
                                    return (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setF("difficulty", d)}
                                            className={`flex-1 text-xs font-bold py-2 rounded-lg border-2 transition-all ${form.difficulty === d ? colors[d] : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                                        >
                                            {d}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* MCQ Options + Correct Answer */}
                    {form.type === "MCQ" && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Answer Options</label>
                            <div className="grid sm:grid-cols-2 gap-2">
                                {LETTERS.map((letter, idx) => {
                                    const key = `opt${letter}` as keyof typeof form;
                                    const isCorrect = form.correctAnswer === idx;
                                    return (
                                        <div key={letter} className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                title={`Mark ${letter} as correct answer`}
                                                onClick={() => setF("correctAnswer", isCorrect ? -1 : idx)}
                                                className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 transition-all ${isCorrect
                                                    ? "bg-green-500 border-green-500 text-white"
                                                    : "border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-600"
                                                    }`}
                                            >
                                                {letter}
                                            </button>
                                            <input
                                                className={`${inputCls} ${isCorrect ? "border-green-400 bg-green-50" : ""}`}
                                                placeholder={`Option ${letter}`}
                                                value={form[key] as string}
                                                onChange={(e) => setF(key, e.target.value)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-[11px] text-gray-400">
                                {form.correctAnswer >= 0
                                    ? <span className="text-green-600 font-semibold">✓ Correct answer: {LETTERS[form.correctAnswer]}</span>
                                    : "Click a letter (A–D) to mark the correct answer."}
                            </p>
                        </div>
                    )}

                    {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}

                    <div className="flex gap-2">
                        {editingId !== null && (
                            <button onClick={cancelEdit} className="text-sm font-semibold text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm px-5 py-2 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            {editingId !== null ? "Save Changes" : "Add Question"}
                        </button>
                    </div>
                </div>
            )}

            {/* Questions list */}
            {questions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Questions Added ({questions.length})
                        </h3>
                        <span className="text-[10px] text-gray-400">All will be included in the exam</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                                <span className="text-xs font-bold text-gray-400 mt-0.5 w-6 flex-shrink-0">Q{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-800 line-clamp-2">{q.text}</p>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${q.type === "MCQ" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>{q.type}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${difficultyColors[q.userDifficulty]}`}>{q.userDifficulty}</span>
                                        {q.imageUrl && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                                                🖼 Image
                                            </span>
                                        )}
                                        {q.type === "MCQ" && q.correctAnswer !== undefined && q.correctAnswer >= 0 && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-700">
                                                ✓ {LETTERS[q.correctAnswer]}
                                            </span>
                                        )}
                                        {q.type === "MCQ" && (q.correctAnswer === undefined || q.correctAnswer < 0) && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">
                                                No answer key
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button onClick={() => startEdit(q)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                        </svg>
                                    </button>
                                    <button onClick={() => deleteQ(q.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {questions.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                    <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                    <p className="text-sm font-medium">No questions yet</p>
                    <p className="text-xs mt-1">Use <strong>Add One</strong> for single questions or <strong>Batch Import</strong> to paste many at once.</p>
                </div>
            )}

            {/* Footer nav */}
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="text-sm font-semibold text-gray-600 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50">
                    ← Back
                </button>
                <button
                    onClick={onNext}
                    disabled={questions.length === 0}
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
                >
                    Proceed to Finalize
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
