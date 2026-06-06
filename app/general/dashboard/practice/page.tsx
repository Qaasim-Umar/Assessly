"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────
type Difficulty = "easy" | "medium" | "hard" | "extreme" | "";
type QuestionCount = "10" | "20" | "50" | "all";
type ExamType = "jamb" | "post_utme" | "waec" | "neco" | "bece" | "";

// ─── Constants ──────────────────────────────────────────────────────────────
const EXAM_TYPES: { value: ExamType; label: string; full: string; color: string; active: string }[] = [
    { value: "jamb",      label: "JAMB",      full: "Joint Admissions",     color: "text-indigo-700 bg-indigo-50 border-indigo-200",   active: "border-indigo-500 bg-indigo-50" },
    { value: "post_utme", label: "Post UTME", full: "University Screening",  color: "text-violet-700 bg-violet-50 border-violet-200",  active: "border-violet-500 bg-violet-50" },
    { value: "waec",      label: "WAEC",      full: "W. Africa Exam Council", color: "text-blue-700 bg-blue-50 border-blue-200",         active: "border-blue-500 bg-blue-50" },
    { value: "neco",      label: "NECO",      full: "National Exams Council", color: "text-amber-700 bg-amber-50 border-amber-200",      active: "border-amber-500 bg-amber-50" },
    { value: "bece",      label: "BECE",      full: "Basic Cert. Exams",     color: "text-teal-700 bg-teal-50 border-teal-200",         active: "border-teal-500 bg-teal-50" },
];

const POST_UTME_SCHOOLS = [
    "UNILAG", "UI", "OAU", "UNN", "ABU", "UNIBEN", "UNILORIN", "UNIPORT",
    "FUTA", "FUNAAB", "LASU", "OOU", "DELSU", "KWASU", "UNIOSUN", "RSU",
    "ABUAD", "CU", "BUK", "FUOYE", "FULOKOJA", "FUPRE", "FUDMA", "FULAFIA",
    "FUTMINNA", "ATBU", "BAUCHI", "UNIMAID", "EBSU", "IMSU", "ESUT",
    "TASUED", "TAI-SOLARIN", "BABCOCK", "BOWEN",
];

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
    const [examType, setExamType] = useState<ExamType>("");
    const [selectedSchool, setSelectedSchool] = useState("");
    const [schoolSearch, setSchoolSearch] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("");
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("");
    const [questionCount, setQuestionCount] = useState<QuestionCount>("20");
    const [starting, setStarting] = useState(false);

    // Fetch distinct subjects + topics filtered by exam type
    useEffect(() => {
        if (!examType) { setSubjects([]); setLoading(false); return; }
        async function load() {
            setLoading(true);
            try {
                let q = supabase
                    .from("questions")
                    .select("subject, topic")
                    .is("exam_id", null)
                    .eq("is_active", true)
                    .eq("exam_type", examType);

                if (examType === "post_utme" && selectedSchool) q = q.eq("university", selectedSchool);

                const { data, error: err } = await q;

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
    }, [examType, selectedSchool]);

    const currentSubjectInfo = subjects.find((s) => s.subject === selectedSubject);
    const availableTopics = currentSubjectInfo?.topics ?? [];
    const availableCount = currentSubjectInfo?.count ?? 0;

    const handleStart = () => {
        if (!examType || !selectedSubject || starting) return;
        if (examType === "post_utme" && !selectedSchool) return;
        setStarting(true);
        const params = new URLSearchParams();
        params.set("examType", examType);
        if (examType === "post_utme" && selectedSchool) params.set("school", selectedSchool);
        params.set("subject", selectedSubject);
        if (selectedTopic) params.set("topic", selectedTopic);
        if (selectedDifficulty) params.set("difficulty", selectedDifficulty);
        params.set("count", questionCount);
        router.push(`/general/dashboard/practice/session?${params.toString()}`);
    };

    const filteredSchools = POST_UTME_SCHOOLS.filter((s) =>
        s.toLowerCase().includes(schoolSearch.toLowerCase())
    );

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

                <div className="space-y-6">

                        {/* ── Step 0: Exam Type — always visible ── */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                                <h2 className="text-base font-bold text-gray-900">Select Exam Type</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {EXAM_TYPES.map((et) => (
                                    <button
                                        key={et.value}
                                        onClick={() => { setExamType(et.value as ExamType); setSelectedSchool(""); setSchoolSearch(""); setSelectedSubject(""); setSelectedTopic(""); }}
                                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                                            examType === et.value
                                                ? et.active + " shadow-sm"
                                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        <p className={`text-sm font-bold ${examType === et.value ? et.color.split(" ")[0] : "text-gray-900"}`}>
                                            {et.label}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">{et.full}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Step 0b: School (Post UTME only) ── */}
                        {examType === "post_utme" && (
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900">Select Your School</h2>
                                        <p className="text-xs text-gray-400">Post UTME screening is school-specific</p>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={schoolSearch}
                                    onChange={(e) => setSchoolSearch(e.target.value)}
                                    placeholder="Search school…"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
                                />
                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                                    {filteredSchools.map((school) => (
                                        <button
                                            key={school}
                                            onClick={() => setSelectedSchool(school)}
                                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                                                selectedSchool === school
                                                    ? "border-violet-500 bg-violet-50 text-violet-700"
                                                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            {school}
                                        </button>
                                    ))}
                                    {filteredSchools.length === 0 && (
                                        <p className="text-xs text-gray-400 py-2">No schools match your search.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Loading / error / empty states (only after exam type chosen) ── */}
                        {examType && (examType !== "post_utme" || selectedSchool) && loading && (
                            <div className="flex items-center justify-center py-12">
                                <svg className="w-6 h-6 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            </div>
                        )}
                        {examType && (examType !== "post_utme" || selectedSchool) && !loading && error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-5 py-4 rounded-xl">
                                {error}
                            </div>
                        )}
                        {examType && (examType !== "post_utme" || selectedSchool) && !loading && !error && subjects.length === 0 && (
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
                                <p className="text-sm font-bold text-gray-700">No questions available</p>
                                <p className="text-xs text-gray-400 mt-1">No {EXAM_TYPES.find(e => e.value === examType)?.label} questions found{examType === "post_utme" && selectedSchool ? ` for ${selectedSchool}` : ""}. Check back later.</p>
                            </div>
                        )}

                        {/* ── Step 1: Subject ── */}
                        {examType && (examType !== "post_utme" || selectedSchool) && !loading && !error && subjects.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                                    {examType === "post_utme" ? "3" : "2"}
                                </div>
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
                        )}

                        {/* ── Step 2: Topic (optional) ── */}
                        {examType && (examType !== "post_utme" || selectedSchool) && selectedSubject && availableTopics.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                                        {examType === "post_utme" ? "4" : "3"}
                                    </div>
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
                        {examType && (examType !== "post_utme" || selectedSchool) && selectedSubject && (
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                                        {examType === "post_utme"
                                            ? (availableTopics.length > 0 ? "5" : "4")
                                            : (availableTopics.length > 0 ? "4" : "3")}
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
                        {examType && (examType !== "post_utme" || selectedSchool) && selectedSubject && (
                            <button
                                onClick={handleStart}
                                disabled={starting}
                                className={`w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-sm ${starting ? "opacity-70 cursor-not-allowed" : ""}`}
                            >
                                {starting ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Loading Session…
                                    </>
                                ) : (
                                    <>
                                        Start Practice
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        )}

                    </div>

                <p className="mt-10 text-center text-xs text-gray-400">
                    Assessly · Practice Mode · Learn at your own pace
                </p>

            </main>
        </div>
    );
}
