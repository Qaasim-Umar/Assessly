"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const TAG_COLORS = [
    { label: "Green", value: "text-green-600" },
    { label: "Rose / Red", value: "text-rose-600" },
    { label: "Violet / Purple", value: "text-violet-600" },
    { label: "Amber / Orange", value: "text-amber-600" },
    { label: "Blue", value: "text-blue-600" },
    { label: "Gray", value: "text-[#4a5e4e]" },
];

export interface GistData {
    id?: string;
    slug: string;
    tag: string;
    tag_color: string;
    title: string;
    desc: string;
    date_label: string;
    school: string;
    views: string;
    paragraphs: string[];
    reactions: { fire: number; think: number };
    is_trending: boolean;
    is_featured: boolean;
    is_new_this_week: boolean;
    published: boolean;
}

function slugify(t: string) {
    return t.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

function todayLabel() {
    return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function GistForm({ initial, mode }: { initial?: GistData; mode: "new" | "edit" }) {
    const router = useRouter();
    const [form, setForm] = useState<GistData>(initial ?? {
        slug: "", tag: "", tag_color: "text-green-600", title: "", desc: "",
        date_label: todayLabel(), school: "", views: "0",
        paragraphs: [""],
        reactions: { fire: 0, think: 0 },
        is_trending: false, is_featured: false, is_new_this_week: false, published: false,
    });
    const [slugLocked, setSlugLocked] = useState(!!initial?.slug);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    function set<K extends keyof GistData>(k: K, v: GistData[K]) {
        setForm(p => ({ ...p, [k]: v }));
    }

    function handleTitle(val: string) {
        set("title", val);
        if (!slugLocked) set("slug", slugify(val));
    }

    function setParagraph(i: number, val: string) {
        const next = [...form.paragraphs];
        next[i] = val;
        set("paragraphs", next);
    }
    function addParagraph() { set("paragraphs", [...form.paragraphs, ""]); }
    function removeParagraph(i: number) {
        set("paragraphs", form.paragraphs.filter((_, idx) => idx !== i));
    }

    async function save(published: boolean) {
        if (!form.title.trim()) { setError("Title is required."); return; }
        if (!form.slug.trim()) { setError("Slug is required."); return; }
        if (!form.tag.trim()) { setError("School tag is required."); return; }
        if (!form.desc.trim()) { setError("Short description is required."); return; }
        const body = form.paragraphs.filter(p => p.trim());
        if (body.length === 0) { setError("At least one body paragraph is required."); return; }

        setSaving(true);
        setError("");
        const payload = {
            slug: form.slug.trim(),
            tag: form.tag.trim().toUpperCase(),
            tag_color: form.tag_color,
            title: form.title.trim(),
            desc: form.desc.trim(),
            date_label: form.date_label.trim(),
            school: form.school.trim() || form.tag.trim().toUpperCase(),
            views: form.views.trim() || "0",
            paragraphs: body,
            reactions: form.reactions,
            is_trending: form.is_trending,
            is_featured: form.is_featured,
            is_new_this_week: form.is_new_this_week,
            published,
        };

        try {
            if (mode === "edit" && form.id) {
                const { error: e } = await supabase.from("admissions_gists").update(payload).eq("id", form.id);
                if (e) throw e;
            } else {
                const { error: e } = await supabase.from("admissions_gists").insert(payload);
                if (e) throw e;
            }
            router.push("/general/dashboard/admissions");
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg.includes("duplicate") ? "A gist with this slug already exists." : "Failed to save.");
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
                        <span className="text-sm font-semibold text-gray-700">{mode === "edit" ? "Edit Gist" : "New Gist"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => save(false)} disabled={saving} className="text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-40">Save Draft</button>
                        <button onClick={() => save(true)} disabled={saving} className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-40">
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
                    {/* Left — main content */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Title */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Title</Label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => handleTitle(e.target.value)}
                                placeholder="e.g. UNILAG Post-UTME 2024/25: Everything You Need to Know"
                                className="w-full text-xl font-bold text-gray-900 placeholder:text-gray-300 border-0 outline-none mt-1"
                            />
                        </div>

                        {/* Short description */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Short Description <span className="text-gray-400 font-normal normal-case">(shown on the card)</span></Label>
                            <textarea
                                value={form.desc}
                                onChange={e => set("desc", e.target.value)}
                                placeholder="One or two sentences describing the gist..."
                                rows={2}
                                className="w-full text-sm text-gray-700 placeholder:text-gray-300 border-0 outline-none resize-none mt-1"
                            />
                        </div>

                        {/* Body paragraphs */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <Label>Body Paragraphs</Label>
                                <span className="text-[10px] text-gray-400">{form.paragraphs.filter(p => p.trim()).length} paragraph{form.paragraphs.filter(p => p.trim()).length !== 1 ? "s" : ""}</span>
                            </div>
                            <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
                                Markdown supported: <code className="bg-gray-100 px-1 rounded">**bold**</code>, <code className="bg-gray-100 px-1 rounded">*italic*</code>, <code className="bg-gray-100 px-1 rounded">## Heading</code>, <code className="bg-gray-100 px-1 rounded">- list item</code>, <code className="bg-gray-100 px-1 rounded">[link](url)</code>. Each box renders as its own block.
                            </p>
                            <div className="space-y-3">
                                {form.paragraphs.map((para, i) => (
                                    <div key={i} className="flex gap-2">
                                        <div className="flex-shrink-0 w-6 h-6 mt-2 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">{i + 1}</div>
                                        <textarea
                                            value={para}
                                            onChange={e => setParagraph(i, e.target.value)}
                                            placeholder={`Paragraph ${i + 1}…`}
                                            rows={3}
                                            className="flex-1 text-sm text-gray-700 placeholder:text-gray-300 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                        />
                                        {form.paragraphs.length > 1 && (
                                            <button onClick={() => removeParagraph(i)} className="flex-shrink-0 mt-2 w-6 h-6 rounded-full bg-red-50 text-red-400 hover:bg-red-100 text-xs flex items-center justify-center">✕</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button onClick={addParagraph} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-800 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Add paragraph
                            </button>
                        </div>
                    </div>

                    {/* Right — settings */}
                    <div className="space-y-5">

                        {/* Publish status */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Status</Label>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => set("published", false)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${!form.published ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>Draft</button>
                                <button onClick={() => set("published", true)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${form.published ? "bg-green-700 text-white border-green-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>Published</button>
                            </div>
                        </div>

                        {/* School tag */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>School Tag</Label>
                            <p className="text-[11px] text-gray-400 mb-2">The label shown on the card (e.g. UNILAG, OAU, JAMB)</p>
                            <input
                                type="text"
                                value={form.tag}
                                onChange={e => { set("tag", e.target.value); set("school", e.target.value); }}
                                placeholder="UNILAG"
                                className="w-full text-sm font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 uppercase"
                            />
                            <Label className="mt-3">Tag Colour</Label>
                            <select value={form.tag_color} onChange={e => set("tag_color", e.target.value)} className="w-full mt-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500">
                                {TAG_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                            <div className={`mt-2 text-sm font-bold ${form.tag_color}`}>{form.tag || "Preview"}</div>
                        </div>

                        {/* Badges / Pins */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Pins &amp; Badges</Label>
                            <p className="text-[11px] text-gray-400 mb-3">Manual flags that control how this gist is featured</p>
                            <div className="space-y-2">
                                <Toggle label="Featured Hero" sub="Big dark card at top of gists section" checked={form.is_featured} onChange={v => set("is_featured", v)} />
                                <Toggle label="Trending" sub="Shows the trending badge on this gist" checked={form.is_trending} onChange={v => set("is_trending", v)} />
                                <Toggle label="New This Week" sub="Pinned to the New This Week sidebar card" checked={form.is_new_this_week} onChange={v => set("is_new_this_week", v)} />
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>Metadata</Label>
                            <div className="mt-2 space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Display Date</label>
                                    <input type="text" value={form.date_label} onChange={e => set("date_label", e.target.value)} placeholder="June 18, 2026" className="w-full mt-1 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Views (display)</label>
                                    <input type="text" value={form.views} onChange={e => set("views", e.target.value)} placeholder="14.2k" className="w-full mt-1 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                                </div>
                            </div>
                        </div>

                        {/* Slug */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <Label>URL Slug</Label>
                            <p className="text-[11px] text-gray-400 mb-2">/admissions/gists/<span className="text-green-600">{form.slug || "…"}</span></p>
                            <input
                                type="text"
                                value={form.slug}
                                onChange={e => { setSlugLocked(true); set("slug", slugify(e.target.value)); }}
                                className="w-full text-xs font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Save buttons */}
                        <div className="flex flex-col gap-2">
                            <button onClick={() => save(true)} disabled={saving} className="w-full bg-green-700 hover:bg-green-800 text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-sm disabled:opacity-40">
                                {saving ? "Saving…" : mode === "edit" ? "Save & Publish" : "Publish Gist"}
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

function Toggle({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-start gap-3 cursor-pointer">
            <button
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative flex-shrink-0 w-8 h-4 rounded-full transition-colors mt-0.5 ${checked ? "bg-green-600" : "bg-gray-200"}`}
            >
                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
            </button>
            <div>
                <p className="text-xs font-semibold text-gray-800 leading-none">{label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
            </div>
        </label>
    );
}
