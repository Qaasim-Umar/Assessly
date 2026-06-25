"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export interface DeadlineData {
    id?: string;
    title: string;
    desc: string;
    deadline_date: string;    // ISO date: "2026-06-30"
    day_label: string;        // "30"
    month_label: string;      // "Jun"
    urgency: "urgent" | "soon" | "open";
    badge: string;            // "10 days left"
    published: boolean;
}

function computeFromDate(iso: string): Pick<DeadlineData, "day_label" | "month_label" | "urgency" | "badge"> {
    const date = new Date(iso);
    const diff = Math.ceil((date.getTime() - Date.now()) / 86400000);
    const day_label = date.getDate().toString();
    const month_label = date.toLocaleDateString("en-GB", { month: "short" });
    const urgency: DeadlineData["urgency"] = diff < 0 ? "urgent" : diff < 14 ? "urgent" : diff < 30 ? "soon" : "open";
    const badge = diff < 0 ? "Passed" : diff === 0 ? "Today!" : `${diff} days left`;
    return { day_label, month_label, urgency, badge };
}

export default function DeadlineForm({ initial, mode }: { initial?: DeadlineData; mode: "new" | "edit" }) {
    const router = useRouter();
    const [form, setForm] = useState<DeadlineData>(initial ?? {
        title: "", desc: "", deadline_date: "",
        day_label: "", month_label: "", urgency: "open", badge: "", published: false,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [urgencyOverride, setUrgencyOverride] = useState(false);

    useEffect(() => {
        if (!form.deadline_date || urgencyOverride) return;
        const computed = computeFromDate(form.deadline_date);
        setForm(p => ({ ...p, ...computed }));
    }, [form.deadline_date, urgencyOverride]);

    function set<K extends keyof DeadlineData>(k: K, v: DeadlineData[K]) {
        setForm(p => ({ ...p, [k]: v }));
    }

    async function save(published: boolean) {
        if (!form.title.trim()) { setError("Title is required."); return; }
        if (!form.desc.trim()) { setError("Description is required."); return; }
        if (!form.deadline_date) { setError("Deadline date is required."); return; }

        setSaving(true);
        setError("");
        const payload = {
            title: form.title.trim(),
            desc: form.desc.trim(),
            deadline_date: form.deadline_date,
            day_label: form.day_label,
            month_label: form.month_label,
            urgency: form.urgency,
            badge: form.badge,
            published,
        };

        try {
            if (mode === "edit" && form.id) {
                const { error: e } = await supabase.from("admissions_deadlines").update(payload).eq("id", form.id);
                if (e) throw e;
            } else {
                const { error: e } = await supabase.from("admissions_deadlines").insert(payload);
                if (e) throw e;
            }
            router.push("/general/dashboard/admissions");
        } catch {
            setError("Failed to save.");
        } finally {
            setSaving(false);
        }
    }

    const urgencyColors = {
        urgent: "bg-rose-100 text-rose-600 border-rose-200",
        soon: "bg-amber-100 text-amber-600 border-amber-200",
        open: "bg-green-100 text-green-700 border-green-200",
    };

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
                        <span className="text-sm font-semibold text-gray-700">{mode === "edit" ? "Edit Deadline" : "New Deadline"}</span>
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

                {/* Preview */}
                {(form.day_label || form.title) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Preview</p>
                        <div className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${urgencyColors[form.urgency]}`}>
                            <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 bg-white border ${urgencyColors[form.urgency]}`}>
                                <span className="text-xl font-extrabold leading-none">{form.day_label || "—"}</span>
                                <span className="text-[11px] font-extrabold tracking-wide uppercase">{form.month_label || "—"}</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-sm">{form.title || "Title…"}</p>
                                <p className="text-xs opacity-70 mt-0.5">{form.desc || "Description…"}</p>
                            </div>
                            <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${urgencyColors[form.urgency]}`}>
                                {form.badge || "—"}
                            </span>
                        </div>
                    </div>
                )}

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <Label>Title</Label>
                    <input type="text" value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. JAMB CAPS Acceptance Window Closes" className="w-full text-xl font-bold text-gray-900 placeholder:text-gray-300 border-0 outline-none mt-1" />
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <Label>Description</Label>
                    <p className="text-[11px] text-gray-400 mt-0.5 mb-1">Inline Markdown like <code className="bg-gray-100 px-1 rounded">**bold**</code> and <code className="bg-gray-100 px-1 rounded">[link](url)</code> works here.</p>
                    <textarea value={form.desc} onChange={e => set("desc", e.target.value)} placeholder="Brief explanation of what students need to do before this date…" rows={2} className="w-full text-sm text-gray-700 placeholder:text-gray-300 border-0 outline-none resize-none mt-1" />
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <Label>Deadline Date</Label>
                    <p className="text-[11px] text-gray-400 mb-2">Urgency and badge text are auto-computed from this date</p>
                    <input
                        type="date"
                        value={form.deadline_date}
                        onChange={e => { set("deadline_date", e.target.value); setUrgencyOverride(false); }}
                        className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                    />

                    {form.deadline_date && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Day</p>
                                <p className="text-lg font-bold text-gray-900">{form.day_label}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Month</p>
                                <p className="text-lg font-bold text-gray-900">{form.month_label}</p>
                            </div>
                            <div className={`rounded-lg p-3 text-center border ${urgencyColors[form.urgency]}`}>
                                <p className="text-[10px] uppercase tracking-wider font-bold opacity-60">Urgency</p>
                                <p className="text-sm font-bold capitalize">{form.urgency}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Manual overrides */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <Label>Override (optional)</Label>
                        <button onClick={() => setUrgencyOverride(!urgencyOverride)} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${urgencyOverride ? "bg-amber-100 text-amber-600 border-amber-200" : "text-gray-400 border-gray-200"}`}>
                            {urgencyOverride ? "Overriding" : "Auto"}
                        </button>
                    </div>
                    <p className="text-[11px] text-gray-400 mb-3">Only fill these if you want to override the auto-computed values</p>
                    <div className="space-y-2">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Badge Text</label>
                            <input type="text" value={form.badge} onChange={e => { setUrgencyOverride(true); set("badge", e.target.value); }} placeholder="10 days left" className="w-full mt-1 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Urgency Level</label>
                            <select value={form.urgency} onChange={e => { setUrgencyOverride(true); set("urgency", e.target.value as DeadlineData["urgency"]); }} className="w-full mt-1 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500">
                                <option value="urgent">🔴 Urgent (red)</option>
                                <option value="soon">🟠 Soon (amber)</option>
                                <option value="open">🟢 Open (green)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <Label>Status</Label>
                    <div className="flex gap-2 mt-2">
                        <button onClick={() => set("published", false)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${!form.published ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 text-gray-500"}`}>Draft</button>
                        <button onClick={() => set("published", true)} className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${form.published ? "bg-green-700 text-white border-green-700" : "border-gray-200 text-gray-500"}`}>Published</button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button onClick={() => save(true)} disabled={saving} className="w-full bg-green-700 hover:bg-green-800 text-white font-bold text-sm py-3 rounded-xl transition-colors disabled:opacity-40">
                        {saving ? "Saving…" : mode === "edit" ? "Save & Publish" : "Publish Deadline"}
                    </button>
                    <button onClick={() => save(false)} disabled={saving} className="w-full text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 py-2.5 rounded-xl transition-colors disabled:opacity-40">Save as Draft</button>
                </div>
            </main>
        </div>
    );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <p className={`text-[10px] font-bold text-gray-500 uppercase tracking-wider ${className}`}>{children}</p>;
}
