"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────
type Difficulty = "easy" | "medium" | "hard" | "extreme" | "";
type QuestionCount = "10" | "20" | "50" | "all";

interface SubjectInfo {
    subject: string;
    count: number;
    topics: string[];
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function PracticeSetupPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
    const [error, setError] = useState("");

    // Selection state
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("");
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("");
    const [questionCount, setQuestionCount] = useState<QuestionCount>("20");

    // Fetch distinct subjects + topics from the question pool
    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const { data, error: err } = await supabase
                    .from("questions")
                    .select("subject, topic")
                    .is("exam_id", null)
                    .eq("is_active", true);

                if (err) throw err;

                // Group by subject
                const map = new Map<string, Set<string>>();
                const countMap = new Map<string, number>();
                for (const row of data ?? []) {
                    const subj = (row.subject as string) ?? "";
                    if (!subj) continue;
                    if (!map.has(subj)) { map.set(subj, new Set()); countMap.set(subj, 0); }
                    countMap.set(subj, (countMap.get(subj) ?? 0) + 1);
                    const t = (row.topic as string) ?? "";
                    if (t) map.get(subj)!.add(t);
                }

                const list: SubjectInfo[] = Array.from(map.entries())
                    .map(([subject, topicSet]) => ({
                        subject,
                        count: countMap.get(subject) ?? 0,
                        topics: Array.from(topicSet).sort(),
                    }))
                    .sort((a, b) => a.subject.localeCompare(b.subject));

                setSubjects(list);
            } catch {
                setError("Failed to load question bank.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const currentSubjectInfo = subjects.find((s) => s.subject === selectedSubject);
    const availableTopics = currentSubjectInfo?.topics ?? [];
    const availableCount = currentSubjectInfo?.count ?? 0;

    const handleStart = () => {
        if (!selectedSubject) return;
        const params = new URLSearchParams();
        params.set("subject", selectedSubject);
        if (selectedTopic) params.set("topic", selectedTopic);
        if (selectedDifficulty) params.set("difficulty", selectedDifficulty);
        params.set("count", questionCount);
        router.push(`/general/dashboard/practice/session?${params.toString()}`);
    };

    const DIFFICULTIES: { label: string; value: Difficulty; color: string }[] = [
        { label: "All", value: "", color: "bg-gray-100 text-gray-700 border-gray-300" },
        { label: "Easy", value: "easy", color: "bg-green-100 text-green-700 border-green-300" },
        { label: "Medium", value: "medium", color: "bg-amber-100 text-amber-700 border-amber-300" },
        { label: "Hard", value: "hard", color: "bg-orange-100 text-orange-700 border-orange-300" },
        { label: "Extreme", value: "extreme", color: "bg-red-100 text-red-700 border-red-300" },
    ];

    const COUNT_OPTIONS: { label: string; value: QuestionCount }[] = [
        { label: "10", value: "10" },
        { label: "20", value: "20" },
        { label: "50", value: "50" },
        { label: "All", value: "all" },
    ];

    return (
        <div className="min-h-screen bg-[#f0f2f5]">

            {/* ── Header ── */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Link href="/general" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div className="h-4 w-px bg-gray-200" />
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-gray-900 tracking-tight">Practice Mode</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
                        No timer
                    </span>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

                {/* ── Hero ── */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        Set Up Your Practice
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 max-w-lg">
                        Pick a subject and customise your session. Hints are available on every question, and full explanations appear after each answer.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <svg className="w-6 h-6 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-5 py-4 rounded-xl">
                        {error}
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No questions yet</h3>
                        <p className="text-sm text-gray-500 mt-1">The question bank is empty. Check back later!</p>
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* ── Step 1: Subject ── */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                                <h2 className="text-base font-bold text-gray-900">Choose a Subject</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {subjects.map((s) => (
                                    <button
                                        key={s.subject}
                                        onClick={() => { setSelectedSubject(s.subject); setSelectedTopic(""); }}
                                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                                            selectedSubject === s.subject
                                                ? "border-emerald-500 bg-emerald-50 shadow-sm"
                                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        <p className={`text-sm font-bold ${selectedSubject === s.subject ? "text-emerald-700" : "text-gray-900"}`}>
                                            {s.subject}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">{s.count} questions</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Step 2: Topic (optional) ── */}
                        {selectedSubject && availableTopics.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900">Filter by Topic</h2>
                                        <p className="text-xs text-gray-400">Optional — leave blank for all topics</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSelectedTopic("")}
                                        className={`text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all ${
                                            selectedTopic === ""
                                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                                        }`}
                                    >
                                        All Topics
                                    </button>
                                    {availableTopics.map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setSelectedTopic(t)}
                                            className={`text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all ${
                                                selectedTopic === t
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                            }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Step 3: Difficulty + Count ── */}
                        {selectedSubject && (
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                                        {availableTopics.length > 0 ? "3" : "2"}
                                    </div>
                                    <h2 className="text-base font-bold text-gray-900">Customise</h2>
                                </div>

                                {/* Difficulty */}
                                <div className="mb-5">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Difficulty</p>
                                    <div className="flex flex-wrap gap-2">
                                        {DIFFICULTIES.map((d) => (
                                            <button
                                                key={d.value}
                                                onClick={() => setSelectedDifficulty(d.value)}
                                                className={`text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all ${
                                                    selectedDifficulty === d.value
                                                        ? d.color + " border-current"
                                                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                                                }`}
                                            >
                                                {d.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Question count */}
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Questions</p>
                                    <div className="flex gap-2">
                                        {COUNT_OPTIONS.map((c) => (
                                            <button
                                                key={c.value}
                                                onClick={() => setQuestionCount(c.value)}
                                                className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all ${
                                                    questionCount === c.value
                                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                                                }`}
                                            >
                                                {c.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-2">
                                        {availableCount} questions available in {selectedSubject}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── Start Button ── */}
                        {selectedSubject && (
                            <button
                                onClick={handleStart}
                                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-sm"
                            >
                                Start Practice
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}

                    </div>
                )}

                <p className="mt-10 text-center text-xs text-gray-400">
                    Assessly · Practice Mode · Learn at your own pace
                </p>

            </main>
        </div>
    );
}
