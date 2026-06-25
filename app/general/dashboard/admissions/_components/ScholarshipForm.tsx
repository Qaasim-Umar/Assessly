"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const ICON_BG_OPTIONS = [
    { label: "Amber", value: "bg-amber-100" },
    { label: "Blue", value: "bg-blue-100" },
    { label: "Violet", value: "bg-violet-100" },
    { label: "Green", value: "bg-green-100" },
    { label: "Rose", value: "bg-rose-100" },
    { label: "Gray", value: "bg-gray-100" },
];

const CATEGORIES = ["STEM", "Business", "Law", "Arts & Humanities", "Medical", "Agriculture", "Education", "General"];

export interface ScholarshipData {
    id?: string;
    slug: string;
    title: string;
    description: string;
    icon: string;
    icon_bg: string;
    amount_label: string;
    frequency: string;
    deadline_label: string;
    days_left: string;
    urgency: "urgent" | "soon" | "open";
    category: string;
    is_open: boolean;
    apply_url: string;
    eligibility: string[];
    required_documents: string[];
    covers: string[];
    published: boolean;
}

function slugify(t: string) {
    return t.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

export default function ScholarshipForm({ initial, mode }: { initial?: ScholarshipData; mode: "new" | "edit" }) {
    const router = useRouter();
    const [form, setForm] = useState<ScholarshipData>(initial ?? {
        slug: "", title: "", description: "", icon: "🏆", icon_bg: "bg-amber-100",
        amount_label: "", frequency: "yearly", deadline_label: "", days_left: "",
        urgency: "open", category: "General", is_open: true, apply_url: "",
        eligibility: [""], required_documents: [""], covers: [""], published: false,
    });
    const [slugLocked, setSlugLocked] = useState(!!initial?.slug);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    function set<K extends keyof ScholarshipData>(k: K, v: ScholarshipData[K]) {
        setForm(p => ({ ...p, [k]: v }));
    }

    function handleTitle(val: string) {
        set("title", val);
        if (!slugLocked) set("slug", slugify(val));
    }

    function updateList(key: "eligibility" | "required_documents" | "covers", i: number, val: string) {
        const next = [...form[key]];
        next[i] = val;
        set(key, next);
    }
    function addToList(key: "eligibility" | "required_documents" | "covers") {
        set(key, [...form[key], ""]);
    }
    function removeFromList(key: "eligibility" | "required_documents" | "covers", i: number) {
        set(key, form[key].filter((_, idx) => idx !== i));
    }

    async function save(published: boolean) {
        if (!form.title.trim()) { setError("Title is required."); return; }
        if (!form.slug.trim()) { setError("Slug is required."); return; }
        if (!form.description.trim()) { setError("Description is required."); return; }

        setSaving(true);
        setError("");
        const payload = {
            slug: form.slug.trim(),
            title: form.title.trim(),
            description: form.description.trim(),
            icon: form.icon.trim() || "🏆",
            icon_bg: form.icon_bg,
            amount_label: form.amount_label.trim(),
            frequency: form.frequency,
            deadline_label: form.deadline_label.trim(),
            days_left: form.days_left.trim(),
            urgency: form.urgency,
            category: form.category,
            is_open: form.is_open,
            apply_url: form.apply_url.trim(),
            eligibility: form.eligibility.filter(e => e.trim()),
            required_documents: form.required_documents.filter(d => d.trim()),
            covers: form.covers.filter(c => c.trim()),
            published,
        };

        try {
            if (mode === "edit" && form.id) {
                const { error: e } = await supabase.from("admissions_scholarships").update(payload).eq("id", form.id);
                if (e) throw e;
            } else {
                const { error: e } = await supabase.from("admissions_scholarships").insert(payload);
                if (e) throw e;
            }
            router.push("/general/dashboard/admissions");
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg.includes("duplicate") ? "A scholarship with this slug already exists." : "Failed to save.");
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
                        <span className="text-sm font-semibold text-gray-700">{mode === "edit" ? "Edit Scholarship" : "New Scholarship"}</span>
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

                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Title</Label>
                            <input type="text" value={form.title} onChange={e => handleTitle(e.target.value)} placeholder="Shell Nigeria University Scholarship 2024/25" className="w-full text-xl font-bold text-gray-900 placeholder:text-gray-300 border-0 outline-none mt-1" />
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Description <span className="text-gray-400 font-normal normal-case">(shown on the card &amp; detail page)</span></Label>
                            <p className="text-[11px] text-gray-400 mt-0.5 mb-1 leading-relaxed">
                                Markdown supported: <code className="bg-gray-100 px-1 rounded">**bold**</code>, <code className="bg-gray-100 px-1 rounded">## Heading</code>, <code className="bg-gray-100 px-1 rounded">- list</code>, <code className="bg-gray-100 px-1 rounded">[link](url)</code>.
                            </p>
                            <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Brief description of who qualifies and what it covers…" rows={3} className="w-full text-sm text-gray-700 placeholder:text-gray-300 border-0 outline-none resize-none mt-1" />
                        </div>

                        {/* Lists */}
                        {(["eligibility", "required_documents", "covers"] as const).map(key => (
                            <div key={key} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <Label>{key === "eligibility" ? "Eligibility Criteria" : key === "required_documents" ? "Required Documents" : "What it Covers"}</Label>
                                <p className="text-[11px] text-gray-400 mt-0.5">Inline Markdown like <code className="bg-gray-100 px-1 rounded">**bold**</code> and <code className="bg-gray-100 px-1 rounded">[link](url)</code> works in each item.</p>
                                <div className="mt-2 space-y-2">
                                    {form[key].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="w-5 text-[10px] font-bold text-gray-400 text-center flex-shrink-0">{i + 1}</span>
                                            <input
                                                type="text"
                                                value={item}
                                                onChange={e => updateList(key, i, e.target.value)}
                                                placeholder={key === "eligibility" ? "e.g. Nigerian citizen enrolled in a Nigerian university" : key === "required_documents" ? "e.g. WAEC result slip" : "e.g. Full tuition fees"}
                                                className="flex-1 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                            {form[key].length > 1 && (
                                                <button onClick={() => removeFromList(key, i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => addToList(key)} className="mt-2 text-xs font-semibold text-green-600 hover:text-green-800 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    Add item
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Settings */}
                    <div className="space-y-5">

                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Status</Label>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => set("published", false)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${!form.published ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 text-gray-500"}`}>Draft</button>
                                <button onClick={() => set("published", true)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${form.published ? "bg-green-700 text-white border-green-700" : "border-gray-200 text-gray-500"}`}>Published</button>
                            </div>
                        </div>

                        {/* Icon */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Icon &amp; Colour</Label>
                            <div className="flex items-center gap-3 mt-2">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${form.icon_bg}`}>{form.icon || "🏆"}</div>
                                <div className="flex-1">
                                    <input type="text" value={form.icon} onChange={e => set("icon", e.target.value)} placeholder="🏆" className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 mb-1" />
                                    <select value={form.icon_bg} onChange={e => set("icon_bg", e.target.value)} className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500">
                                        {ICON_BG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label} background</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Amount & Deadline */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Funding Details</Label>
                            <div className="mt-2 space-y-2">
                                <input type="text" value={form.amount_label} onChange={e => set("amount_label", e.target.value)} placeholder="₦500,000/yr" className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                                <select value={form.frequency} onChange={e => set("frequency", e.target.value)} className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500">
                                    <option value="yearly">Yearly</option>
                                    <option value="one-time">One-time</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>

                        {/* Deadline & Urgency */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Deadline &amp; Urgency</Label>
                            <div className="mt-2 space-y-2">
                                <input type="text" value={form.deadline_label} onChange={e => set("deadline_label", e.target.value)} placeholder="Closes July 31, 2026" className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                                <input type="text" value={form.days_left} onChange={e => set("days_left", e.target.value)} placeholder="41 days left" className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                                <select value={form.urgency} onChange={e => set("urgency", e.target.value as ScholarshipData["urgency"])} className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500">
                                    <option value="urgent">🔴 Urgent (&lt;14 days)</option>
                                    <option value="soon">🟠 Soon (14–30 days)</option>
                                    <option value="open">🟢 Open (30+ days)</option>
                                </select>
                            </div>
                        </div>

                        {/* Category & Open */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Category</Label>
                            <select value={form.category} onChange={e => set("category", e.target.value)} className="w-full mt-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <Label className="mt-4">Application Status</Label>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => set("is_open", true)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${form.is_open ? "bg-green-700 text-white border-green-700" : "border-gray-200 text-gray-500"}`}>Open Now</button>
                                <button onClick={() => set("is_open", false)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${!form.is_open ? "bg-gray-500 text-white border-gray-500" : "border-gray-200 text-gray-500"}`}>Closed</button>
                            </div>
                        </div>

                        {/* Apply URL */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Apply URL</Label>
                            <input type="url" value={form.apply_url} onChange={e => set("apply_url", e.target.value)} placeholder="https://..." className="w-full mt-2 text-xs font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                        </div>

                        {/* Slug */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>URL Slug</Label>
                            <p className="text-[11px] text-gray-400 mb-2">/admissions/scholarships/<span className="text-green-600">{form.slug || "…"}</span></p>
                            <input type="text" value={form.slug} onChange={e => { setSlugLocked(true); set("slug", slugify(e.target.value)); }} className="w-full text-xs font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <button onClick={() => save(true)} disabled={saving} className="w-full bg-green-700 hover:bg-green-800 text-white font-bold text-sm py-3 rounded-xl transition-colors disabled:opacity-40">
                                {saving ? "Saving…" : mode === "edit" ? "Save & Publish" : "Publish Scholarship"}
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
