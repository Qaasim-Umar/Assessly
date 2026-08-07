"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const EXAMS = [
    { value: "jamb", label: "JAMB / UTME" },
    { value: "waec", label: "WAEC" },
    { value: "neco", label: "NECO" },
    { value: "post", label: "Post-UTME" },
    { value: "neco-bece", label: "NECO BECE" },
    { value: "waec-bece", label: "WAEC BECE" },
    { value: "nabteb", label: "NABTEB" },
] as const;

type QuestionBankExamValue = (typeof EXAMS)[number]["value"] | "bece";

export interface PackFile {
    name: string;
    object_key: string;
}

export interface QuestionBankPackData {
    id?: string;
    exam: QuestionBankExamValue;
    exam_label: string;
    section: string;
    title: string;
    slug: string;
    subject: string;
    years: string;
    short_description: string;
    pack_type: "single" | "pack";
    object_key: string;
    pack_files: PackFile[];
    published: boolean;
}

const defaultForm: QuestionBankPackData = {
    exam: "jamb",
    exam_label: "",
    section: "",
    title: "",
    slug: "",
    subject: "",
    years: "",
    short_description: "",
    pack_type: "single",
    object_key: "",
    pack_files: [],
    published: false,
};

function createSlug(value: string) {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export default function QuestionBankForm({
    initial,
    mode,
}: {
    initial?: QuestionBankPackData;
    mode: "new" | "edit";
}) {
    const router = useRouter();
    const [form, setForm] = useState<QuestionBankPackData>(initial ?? defaultForm);
    const [slugEdited, setSlugEdited] = useState(Boolean(initial?.slug));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    function set<K extends keyof QuestionBankPackData>(k: K, v: QuestionBankPackData[K]) {
        setForm((p) => ({ ...p, [k]: v }));
    }

    function updateTitle(title: string) {
        setForm((previous) => ({
            ...previous,
            title,
            slug: slugEdited ? previous.slug : createSlug(title),
        }));
    }

    function updateSlug(slug: string) {
        setSlugEdited(true);
        set("slug", createSlug(slug));
    }

    // ── Pack files helpers ────────────────────────────────────────────────────

    function addPackFile() {
        set("pack_files", [...form.pack_files, { name: "", object_key: "" }]);
    }

    function updatePackFile(i: number, field: keyof PackFile, value: string) {
        const updated = form.pack_files.map((f, idx) => (idx === i ? { ...f, [field]: value } : f));
        set("pack_files", updated);
    }

    function removePackFile(i: number) {
        set("pack_files", form.pack_files.filter((_, idx) => idx !== i));
    }

    function movePackFile(i: number, dir: -1 | 1) {
        const arr = [...form.pack_files];
        const target = i + dir;
        if (target < 0 || target >= arr.length) return;
        [arr[i], arr[target]] = [arr[target], arr[i]];
        set("pack_files", arr);
    }

    // ── Save ─────────────────────────────────────────────────────────────────

    async function save(published: boolean) {
        if (form.exam === "bece") { setError("Choose either NECO BECE or WAEC BECE as the exam type."); return; }
        if (!form.title.trim()) { setError("Title is required."); return; }
        if (!form.slug.trim()) { setError("Slug is required."); return; }
        if (!form.exam_label.trim()) { setError("Exam label is required."); return; }
        if (!form.section.trim()) { setError("Section is required."); return; }
        if (!form.subject.trim()) { setError("Subject is required."); return; }
        if (!form.years.trim()) { setError("Year range is required."); return; }
        if (!form.short_description.trim()) { setError("Short description is required."); return; }

        if (form.pack_type === "single") {
            if (!form.object_key.trim()) { setError("The R2 object key is required."); return; }
        } else {
            if (form.pack_files.length === 0) { setError("Add at least one file to the pack."); return; }
            const bad = form.pack_files.find((f) => !f.name.trim() || !f.object_key.trim());
            if (bad) { setError("Every file entry needs both a label and an R2 object key."); return; }
        }

        setSaving(true);
        setError("");

        const payload = {
            exam: form.exam,
            exam_label: form.exam_label.trim(),
            section: form.section.trim(),
            title: form.title.trim(),
            slug: form.slug.trim().toLowerCase(),
            subject: form.subject.trim(),
            years: form.years.trim(),
            short_description: form.short_description.trim(),
            pack_type: form.pack_type,
            object_key: form.pack_type === "single" ? form.object_key.trim() : "",
            pack_files: form.pack_type === "pack" ? form.pack_files : [],
            published,
        };

        try {
            if (mode === "edit" && form.id) {
                const { error: e } = await supabase.from("question_bank_packs").update(payload).eq("id", form.id);
                if (e) throw e;
            } else {
                const { error: e } = await supabase.from("question_bank_packs").insert(payload);
                if (e) throw e;
            }
            router.push("/general/dashboard/admissions?tab=packs");
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg || "Failed to save.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/general/dashboard/admissions" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                            <span className="text-sm font-medium">Admissions Hub</span>
                        </Link>
                        <span className="text-gray-300">/</span>
                        <span className="text-sm font-semibold text-gray-700">{mode === "edit" ? "Edit Pack" : "New Pack"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => save(false)} disabled={saving} className="text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-40">Save Draft</button>
                        <button onClick={() => save(true)} disabled={saving} className="bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-40">
                            {saving ? "Saving…" : "Publish"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {error && (
                    <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-4 py-2.5 rounded-lg flex items-center gap-2">
                        {error} <button onClick={() => setError("")} className="ml-auto text-red-400">✕</button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Title */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Pack Title</Label>
                            <input type="text" value={form.title} onChange={(e) => updateTitle(e.target.value)} placeholder="JAMB Past Questions 2020 – 2024" className="w-full text-xl font-bold text-gray-900 placeholder:text-gray-300 border-0 outline-none mt-1" />
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                            <div>
                                <Label>SEO Page Slug</Label>
                                <p className="text-[11px] text-gray-400 mt-0.5 mb-1.5 leading-relaxed">
                                    Generated automatically from the pack title. You can edit it when needed.
                                </p>
                                <input type="text" value={form.slug} onChange={(e) => updateSlug(e.target.value)} placeholder="jamb-mathematics-past-questions-2015-2024" className="w-full min-h-11 text-xs font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                                <Label>Short Description</Label>
                                <p className="text-[11px] text-gray-400 mt-0.5 mb-1.5 leading-relaxed">This appears on the page and becomes the SEO description.</p>
                                <textarea value={form.short_description} onChange={(e) => set("short_description", e.target.value)} rows={3} maxLength={220} placeholder="Practise ten years of JAMB Mathematics past questions with answers in one focused revision pack." className="w-full text-sm leading-6 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none resize-y focus:ring-2 focus:ring-green-500" />
                                <p className="mt-1 text-right text-[10px] text-gray-400">{form.short_description.length}/220</p>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Subject</Label>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400">
                                        Separate multiple subjects with commas. Keep “and” or “&” inside a subject name.
                                    </p>
                                    <input type="text" value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Agriculture, Art & Craft" className="w-full min-h-11 mt-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                                </div>
                                <div>
                                    <Label>Year Range</Label>
                                    <input type="text" value={form.years} onChange={(e) => set("years", e.target.value)} placeholder="2015–2024" className="w-full min-h-11 mt-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                                </div>
                            </div>
                        </div>

                        {/* Pack type switcher */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Download Type</Label>
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => set("pack_type", "single")}
                                    className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-lg border transition-colors ${form.pack_type === "single" ? "bg-green-700 text-white border-green-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Single PDF
                                </button>
                                <button
                                    onClick={() => set("pack_type", "pack")}
                                    className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-lg border transition-colors ${form.pack_type === "pack" ? "bg-green-700 text-white border-green-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                    Pack (multiple files)
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                                {form.pack_type === "single"
                                    ? "Students open the SEO page first, then use its secure Download button."
                                    : "Students open the SEO page first, then choose a file to download securely."}
                            </p>
                        </div>

                        {/* Single private file key */}
                        {form.pack_type === "single" && (
                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <Label>Cloudflare R2 Object Key</Label>
                                <p className="text-[11px] text-gray-400 mt-0.5 mb-1.5 leading-relaxed">
                                    Use question-banks/exam/year/file.pdf. For BECE, use neco-bece or waec-bece as the exam folder.
                                </p>
                                <input type="text" value={form.object_key} onChange={(e) => set("object_key", e.target.value)} placeholder="question-banks/neco-bece/2025/agriculture-neco-bece-2025.pdf" className="w-full min-h-11 text-xs font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                        )}

                        {/* Multi-file pack editor */}
                        {form.pack_type === "pack" && (
                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <Label>Files in this Pack</Label>
                                    <button
                                        onClick={addPackFile}
                                        className="flex items-center gap-1.5 text-xs font-bold text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                        Add file
                                    </button>
                                </div>

                                {form.pack_files.length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                                        No files yet. Click <strong className="text-gray-600">Add file</strong> to start building your pack.
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {form.pack_files.map((f, i) => (
                                        <div key={i} className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
                                            {/* Reorder */}
                                            <div className="flex flex-col gap-0.5 pt-1 shrink-0">
                                                <button
                                                    onClick={() => movePackFile(i, -1)}
                                                    disabled={i === 0}
                                                    className="text-gray-400 hover:text-gray-700 disabled:opacity-20 leading-none"
                                                    title="Move up"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => movePackFile(i, 1)}
                                                    disabled={i === form.pack_files.length - 1}
                                                    className="text-gray-400 hover:text-gray-700 disabled:opacity-20 leading-none"
                                                    title="Move down"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                                </button>
                                            </div>

                                            {/* Inputs */}
                                            <div className="flex-1 flex flex-col sm:flex-row gap-2">
                                                <input
                                                    type="text"
                                                    value={f.name}
                                                    onChange={(e) => updatePackFile(i, "name", e.target.value)}
                                                    placeholder={`File label (e.g. JAMB Maths 2022)`}
                                                    className="w-full sm:w-2/5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={f.object_key}
                                                    onChange={(e) => updatePackFile(i, "object_key", e.target.value)}
                                                    placeholder="question-banks/waec/2024/waec-physics-2024.pdf"
                                                    className="w-full sm:w-3/5 text-xs font-mono text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                                                />
                                            </div>

                                            {/* Remove */}
                                            <button
                                                onClick={() => removePackFile(i)}
                                                className="shrink-0 mt-1 text-red-400 hover:text-red-600 transition-colors"
                                                title="Remove"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {form.pack_files.length > 0 && (
                                    <button
                                        onClick={addPackFile}
                                        className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 border border-dashed border-gray-300 hover:border-green-400 hover:text-green-700 py-2 rounded-xl transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                        Add another file
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Exam label */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Exam Label <span className="text-gray-400 font-normal normal-case">(small caption on the card)</span></Label>
                            <input type="text" value={form.exam_label} onChange={(e) => set("exam_label", e.target.value)} placeholder="JAMB · Mathematics" className="w-full mt-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Section Heading <span className="text-gray-400 font-normal normal-case">(groups cards together)</span></Label>
                            <input type="text" value={form.section} onChange={(e) => set("section", e.target.value)} placeholder="JAMB / UTME" className="w-full mt-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                    </div>

                    {/* Settings sidebar */}
                    <div className="space-y-5">
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Status</Label>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => set("published", false)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${!form.published ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 text-gray-500"}`}>Draft</button>
                                <button onClick={() => set("published", true)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${form.published ? "bg-green-700 text-white border-green-700" : "border-gray-200 text-gray-500"}`}>Published</button>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Exam Type</Label>
                            <select value={form.exam} onChange={(e) => set("exam", e.target.value as QuestionBankPackData["exam"])} className="w-full mt-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500">
                                {form.exam === "bece" && <option value="bece" disabled>BECE — choose the exam board</option>}
                                {EXAMS.map((ex) => <option key={ex.value} value={ex.value}>{ex.label}</option>)}
                            </select>
                            <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                                Select the board that issued the BECE paper so its records and R2 files stay distinct.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button onClick={() => save(true)} disabled={saving} className="w-full bg-green-700 hover:bg-green-800 text-white font-bold text-sm py-3 rounded-xl transition-colors disabled:opacity-40">
                                {saving ? "Saving…" : mode === "edit" ? "Save & Publish" : "Publish Pack"}
                            </button>
                            <button onClick={() => save(false)} disabled={saving} className="w-full text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 py-2.5 rounded-xl transition-colors disabled:opacity-40">Save as Draft</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <p className={`text-[10px] font-bold text-gray-500 uppercase tracking-wider ${className}`}>{children}</p>;
}
