"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getGeneralAdminSession } from "@/lib/generalAdminAuth";

type Tab = "gists" | "scholarships" | "deadlines";

interface Gist {
    id: string;
    slug: string;
    tag: string;
    title: string;
    published: boolean;
    is_trending: boolean;
    is_featured: boolean;
    is_new_this_week: boolean;
    created_at: string;
}
interface Scholarship {
    id: string;
    slug: string;
    title: string;
    category: string;
    is_open: boolean;
    published: boolean;
    created_at: string;
}
interface Deadline {
    id: string;
    title: string;
    deadline_date: string;
    urgency: string;
    published: boolean;
    created_at: string;
}

function fmt(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysLeft(date: string) {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    if (diff < 0) return "Passed";
    if (diff === 0) return "Today";
    return `${diff}d left`;
}

export default function AdmissionsAdminPage() {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>("gists");
    const [gists, setGists] = useState<Gist[]>([]);
    const [scholarships, setScholarships] = useState<Scholarship[]>([]);
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        getGeneralAdminSession().then((session) => {
            if (!session) {
                router.replace("/general/dashboard/login");
                return;
            }
            fetchAll();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchAll() {
        setLoading(true);
        setError("");
        try {
            const [g, s, d] = await Promise.all([
                supabase.from("admissions_gists").select("id,slug,tag,title,published,is_trending,is_featured,is_new_this_week,created_at").order("created_at", { ascending: false }),
                supabase.from("admissions_scholarships").select("id,slug,title,category,is_open,published,created_at").order("created_at", { ascending: false }),
                supabase.from("admissions_deadlines").select("id,title,deadline_date,urgency,published,created_at").order("deadline_date", { ascending: true }),
            ]);
            setGists(g.data ?? []);
            setScholarships(s.data ?? []);
            setDeadlines(d.data ?? []);
        } catch {
            setError("Failed to load content.");
        } finally {
            setLoading(false);
        }
    }

    async function togglePublished(table: string, id: string, current: boolean, list: "gists" | "scholarships" | "deadlines") {
        await supabase.from(table).update({ published: !current }).eq("id", id);
        if (list === "gists") setGists(p => p.map(x => x.id === id ? { ...x, published: !current } : x));
        if (list === "scholarships") setScholarships(p => p.map(x => x.id === id ? { ...x, published: !current } : x));
        if (list === "deadlines") setDeadlines(p => p.map(x => x.id === id ? { ...x, published: !current } : x));
    }

    async function handleDelete(table: string, id: string, list: "gists" | "scholarships" | "deadlines") {
        if (!confirm("Delete this item? This cannot be undone.")) return;
        setDeletingId(id);
        await supabase.from(table).delete().eq("id", id);
        if (list === "gists") setGists(p => p.filter(x => x.id !== id));
        if (list === "scholarships") setScholarships(p => p.filter(x => x.id !== id));
        if (list === "deadlines") setDeadlines(p => p.filter(x => x.id !== id));
        setDeletingId(null);
    }

    const newHref = tab === "gists"
        ? "/general/dashboard/admissions/gists/new"
        : tab === "scholarships"
            ? "/general/dashboard/admissions/scholarships/new"
            : "/general/dashboard/admissions/deadlines/new";

    const newLabel = tab === "gists" ? "New Gist" : tab === "scholarships" ? "New Scholarship" : "New Deadline";

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/general/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <div className="w-8 h-8 rounded-md bg-green-700 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                                </svg>
                            </div>
                            <span className="text-base font-bold text-gray-900">Assessly</span>
                        </Link>
                        <span className="text-gray-300">/</span>
                        <span className="text-sm font-semibold text-gray-600">Admissions Hub</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/admissions" target="_blank" className="text-xs text-gray-500 hover:text-green-600 font-medium transition-colors hidden sm:block">
                            Public View ↗
                        </Link>
                        <div className="h-4 w-px bg-gray-200 hidden sm:block" />
                        <Link
                            href={newHref}
                            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            {newLabel}
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Admissions Hub Content</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manage gists, scholarships, and deadlines shown at <code className="text-green-600 bg-green-50 px-1 rounded">/admissions</code></p>
                    </div>
                    <button onClick={fetchAll} disabled={loading} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-40">
                        <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: "Gists", value: gists.length, icon: "📰", color: "bg-green-50 text-green-600" },
                        { label: "Scholarships", value: scholarships.length, icon: "🏆", color: "bg-amber-50 text-amber-600" },
                        { label: "Deadlines", value: deadlines.length, icon: "📅", color: "bg-rose-50 text-rose-600" },
                    ].map(({ label, value, icon, color }) => (
                        <div key={label} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg ${color}`}>{icon}</div>
                            <div>
                                <p className={`text-2xl font-bold text-gray-900 leading-none ${loading ? "animate-pulse text-gray-300" : ""}`}>{loading ? "-" : value}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-4 py-2.5 rounded-lg">
                        {error} <button onClick={fetchAll} className="ml-auto underline">Retry</button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 mb-4 bg-white border border-gray-200 rounded-xl p-1 w-fit">
                    {(["gists", "scholarships", "deadlines"] as Tab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-colors ${tab === t ? "bg-green-700 text-white" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            {t === "gists" ? "📰 Gists" : t === "scholarships" ? "🏆 Scholarships" : "📅 Deadlines"}
                        </button>
                    ))}
                </div>

                {/* Tables */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {tab === "gists" && (
                        <>
                            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-gray-700">School Gists</h2>
                                <span className="text-xs text-gray-400">{gists.length} items</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50">
                                            {["Title", "Tag", "Badges", "Status", "Created", "Actions"].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loading ? skeletonRows(6) : gists.map(g => (
                                            <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3.5">
                                                    <p className="font-semibold text-gray-900 text-xs max-w-[240px] truncate">{g.title}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">/admissions/gists/{g.slug}</p>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">{g.tag}</span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        {g.is_featured && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-900 text-white">Featured</span>}
                                                        {g.is_trending && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">🔥 Trending</span>}
                                                        {g.is_new_this_week && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600">New</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <PublishToggle published={g.published} onToggle={() => togglePublished("admissions_gists", g.id, g.published, "gists")} />
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{fmt(g.created_at)}</td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <RowActions
                                                        editHref={`/general/dashboard/admissions/gists/${g.id}/edit`}
                                                        viewHref={`/admissions/gists/${g.slug}`}
                                                        onDelete={() => handleDelete("admissions_gists", g.id, "gists")}
                                                        deleting={deletingId === g.id}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {!loading && gists.length === 0 && <EmptyState label="gists" href="/general/dashboard/admissions/gists/new" cta="Write first gist" />}
                            </div>
                        </>
                    )}

                    {tab === "scholarships" && (
                        <>
                            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-gray-700">Scholarships</h2>
                                <span className="text-xs text-gray-400">{scholarships.length} items</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50">
                                            {["Title", "Category", "Open?", "Status", "Created", "Actions"].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loading ? skeletonRows(6) : scholarships.map(s => (
                                            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3.5">
                                                    <p className="font-semibold text-gray-900 text-xs max-w-[260px] truncate">{s.title}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">/admissions/scholarships/{s.slug}</p>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{s.category || "—"}</span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.is_open ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                        {s.is_open ? "Open" : "Closed"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <PublishToggle published={s.published} onToggle={() => togglePublished("admissions_scholarships", s.id, s.published, "scholarships")} />
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{fmt(s.created_at)}</td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <RowActions
                                                        editHref={`/general/dashboard/admissions/scholarships/${s.id}/edit`}
                                                        viewHref={`/admissions/scholarships/${s.slug}`}
                                                        onDelete={() => handleDelete("admissions_scholarships", s.id, "scholarships")}
                                                        deleting={deletingId === s.id}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {!loading && scholarships.length === 0 && <EmptyState label="scholarships" href="/general/dashboard/admissions/scholarships/new" cta="Add first scholarship" />}
                            </div>
                        </>
                    )}

                    {tab === "deadlines" && (
                        <>
                            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-gray-700">Admission Deadlines</h2>
                                <span className="text-xs text-gray-400">{deadlines.length} items</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50">
                                            {["Title", "Date", "Urgency", "Time Left", "Status", "Actions"].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loading ? skeletonRows(5) : deadlines.map(d => (
                                            <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3.5">
                                                    <p className="font-semibold text-gray-900 text-xs max-w-[240px] truncate">{d.title}</p>
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">{fmt(d.deadline_date)}</td>
                                                <td className="px-4 py-3.5">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        d.urgency === "urgent" ? "bg-rose-100 text-rose-600"
                                                        : d.urgency === "soon" ? "bg-amber-100 text-amber-600"
                                                        : "bg-green-100 text-green-700"
                                                    }`}>{d.urgency}</span>
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{daysLeft(d.deadline_date)}</td>
                                                <td className="px-4 py-3.5">
                                                    <PublishToggle published={d.published} onToggle={() => togglePublished("admissions_deadlines", d.id, d.published, "deadlines")} />
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <RowActions
                                                        editHref={`/general/dashboard/admissions/deadlines/${d.id}/edit`}
                                                        onDelete={() => handleDelete("admissions_deadlines", d.id, "deadlines")}
                                                        deleting={deletingId === d.id}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {!loading && deadlines.length === 0 && <EmptyState label="deadlines" href="/general/dashboard/admissions/deadlines/new" cta="Add first deadline" />}
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-8 text-center text-xs text-gray-400">Assessly Admissions Console · {new Date().getFullYear()}</div>
            </main>
        </div>
    );
}

function PublishToggle({ published, onToggle }: { published: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 ${
                published ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-600 border border-gray-300"
            }`}
        >
            {published && (
                <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </span>
            )}
            {published ? "Live" : "Draft"}
        </button>
    );
}

function RowActions({ editHref, viewHref, onDelete, deleting }: { editHref: string; viewHref?: string; onDelete: () => void; deleting: boolean }) {
    return (
        <div className="flex items-center gap-1.5">
            <Link href={editHref} className="text-[11px] font-semibold text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 transition-colors">Edit</Link>
            {viewHref && (
                <Link href={viewHref} target="_blank" className="text-[11px] font-semibold text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors">View ↗</Link>
            )}
            <button onClick={onDelete} disabled={deleting} className="text-[11px] font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40">
                {deleting ? "…" : "Delete"}
            </button>
        </div>
    );
}

function EmptyState({ label, href, cta }: { label: string; href: string; cta: string }) {
    return (
        <div className="py-14 text-center">
            <p className="text-sm font-medium text-gray-400">No {label} yet.</p>
            <Link href={href} className="mt-2 inline-block text-sm text-green-600 font-semibold hover:underline">{cta} →</Link>
        </div>
    );
}

function skeletonRows(cols: number) {
    return Array.from({ length: 4 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
            {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="px-4 py-4"><div className="h-3 bg-gray-100 rounded w-3/4" /></td>
            ))}
        </tr>
    ));
}
