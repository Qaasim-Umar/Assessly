"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export interface CutoffData {
    id?: string;
    slug: string;
    school: string;
    content: string;
    published: boolean;
}

function slugify(t: string) {
    return t.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

export default function CutoffForm({ initial, mode }: { initial?: CutoffData; mode: "new" | "edit" }) {
    const router = useRouter();
    const [form, setForm] = useState<CutoffData>(initial ?? {
        slug: "", school: "", content: "", published: false,
    });
    const [slugLocked, setSlugLocked] = useState(!!initial?.slug);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    function set<K extends keyof CutoffData>(k: K, v: CutoffData[K]) {
        setForm(p => ({ ...p, [k]: v }));
    }

    function handleSchool(val: string) {
        set("school", val);
        if (!slugLocked) set("slug", slugify(val));
    }

    async function save(published: boolean) {
        if (!form.school.trim()) { setError("School is required."); return; }
        if (!form.slug.trim()) { setError("Slug is required."); return; }
        if (!form.content.trim()) { setError("Content is required."); return; }

        setSaving(true);
        setError("");
        const payload = {
            slug: form.slug.trim(),
            school: form.school.trim(),
            content: form.content.trim(),
            published,
        };

        try {
            if (mode === "edit" && form.id) {
                const { error: e } = await supabase.from("admissions_cutoffs").update(payload).eq("id", form.id);
                if (e) throw e;
            } else {
                const { error: e } = await supabase.from("admissions_cutoffs").insert(payload);
                if (e) throw e;
            }
            router.push("/general/dashboard/admissions");
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg.includes("duplicate") ? "A cutoff entry with this slug already exists." : "Failed to save.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/general/dashboard/admissions" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                            <span className="text-sm font-medium">Admissions Hub</span>
                        </Link>
                        <span className="text-gray-300">/</span>
                        <span className="text-sm font-semibold text-gray-700">{mode === "edit" ? "Edit Cutoff Mark" : "New Cutoff Mark"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => save(false)} disabled={saving} className="text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-40">Save Draft</button>
                        <button onClick={() => save(true)} disabled={saving} className="bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-40">
                            {saving ? "Saving…" : "Publish"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-4 py-2.5 rounded-lg flex items-center gap-2">
                        {error} <button onClick={() => setError("")} className="ml-auto text-red-400">✕</button>
                    </div>
                )}

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <Label>School</Label>
                    <input type="text" value={form.school} onChange={e => handleSchool(e.target.value)} placeholder="e.g. University of Lagos (UNILAG)" className="w-full text-xl font-bold text-gray-900 placeholder:text-gray-300 border-0 outline-none mt-1" />
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <Label>Post</Label>
                    <p className="text-[11px] text-gray-400 mt-0.5 mb-1">Markdown supported: <code className="bg-gray-100 px-1 rounded">**bold**</code>, <code className="bg-gray-100 px-1 rounded">## Heading</code>, <code className="bg-gray-100 px-1 rounded">- list</code>, <code className="bg-gray-100 px-1 rounded">[link](url)</code>.</p>
                    <textarea value={form.content} onChange={e => set("content", e.target.value)} placeholder="Write the cutoff mark details here…" rows={12} className="w-full text-sm text-gray-700 placeholder:text-gray-300 border-0 outline-none resize-y mt-1" />
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <Label>Slug</Label>
                    <div className="flex items-center gap-2 mt-1">
                        <input type="text" value={form.slug} onChange={e => { set("slug", e.target.value); setSlugLocked(true); }} placeholder="unilag-cutoff-2026" className="flex-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 font-mono" />
                        <button onClick={() => setSlugLocked(false)} className="text-[11px] font-semibold text-green-600 hover:text-green-800 whitespace-nowrap">Auto-generate</button>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <Label>Status</Label>
                    <div className="flex gap-2 mt-2">
                        <button onClick={() => set("published", false)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${!form.published ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 text-gray-500"}`}>Draft</button>
                        <button onClick={() => set("published", true)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${form.published ? "bg-green-700 text-white border-green-700" : "border-gray-200 text-gray-500"}`}>Published</button>
                    </div>
                </div>
            </main>
        </div>
    );
}

function Label({ children }: { children: React.ReactNode }) {
    return <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{children}</label>;
}
