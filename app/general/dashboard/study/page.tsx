"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────
type ExamType = "jamb" | "post_utme" | "waec" | "neco" | "bece" | "";

// ─── Constants ───────────────────────────────────────────────────────────────
const EXAM_TYPES: { value: ExamType; label: string; full: string; active: string }[] = [
    { value: "jamb",      label: "JAMB",      full: "Joint Admissions",      active: "border-green-600 bg-green-50" },
    { value: "post_utme", label: "Post UTME", full: "University Screening",  active: "border-green-600 bg-green-50" },
    { value: "waec",      label: "WAEC",      full: "W. Africa Exam Council", active: "border-green-600 bg-green-50" },
    { value: "neco",      label: "NECO",      full: "National Exams Council", active: "border-green-600 bg-green-50" },
    { value: "bece",      label: "BECE",      full: "Basic Cert. Exams",     active: "border-green-600 bg-green-50" },
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
export default function StudySetupPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [yearsLoading, setYearsLoading] = useState(false);
    const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [error, setError] = useState("");

    const [examType, setExamType] = useState<ExamType>("");
    const [selectedSchool, setSelectedSchool] = useState("");
    const [schoolSearch, setSchoolSearch] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("");
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [starting, setStarting] = useState(false);

    // Load subjects when exam type (and school for Post UTME) is ready
    useEffect(() => {
        const ready = examType && (examType !== "post_utme" || selectedSchool);
        if (!ready) { setSubjects([]); return; }

        async function loadSubjects() {
            setLoading(true);
            setError("");
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
        loadSubjects();
    }, [examType, selectedSchool]);

    // Load available years when subject (and optional topic) is selected
    useEffect(() => {
        if (!examType || !selectedSubject) { setAvailableYears([]); return; }

        async function loadYears() {
            setYearsLoading(true);
            try {
                let q = supabase
                    .from("questions")
                    .select("year")
                    .is("exam_id", null)
                    .eq("is_active", true)
                    .eq("exam_type", examType)
                    .eq("subject", selectedSubject)
                    .not("year", "is", null);

                if (examType === "post_utme" && selectedSchool) q = q.eq("university", selectedSchool);
                if (selectedTopic) q = q.eq("topic", selectedTopic);

                const { data } = await q;
                const years = Array.from(new Set((data ?? []).map((r: any) => r.year as number)))
                    .filter(Boolean)
                    .sort((a, b) => b - a);
                setAvailableYears(years);
            } catch {
                setAvailableYears([]);
            } finally {
                setYearsLoading(false);
            }
        }
        loadYears();
    }, [examType, selectedSchool, selectedSubject, selectedTopic]);

    const currentSubjectInfo = subjects.find((s) => s.subject === selectedSubject);
    const availableTopics = currentSubjectInfo?.topics ?? [];

    const handleStart = () => {
        if (!examType || !selectedSubject || starting) return;
        if (examType === "post_utme" && !selectedSchool) return;
        setStarting(true);
        const params = new URLSearchParams();
        params.set("examType", examType);
        if (examType === "post_utme" && selectedSchool) params.set("school", selectedSchool);
        params.set("subject", selectedSubject);
        if (selectedTopic) params.set("topic", selectedTopic);
        if (selectedYear) params.set("year", String(selectedYear));
        router.push(`/general/dashboard/study/session?${params.toString()}`);
    };

    const filteredSchools = POST_UTME_SCHOOLS.filter((s) =>
        s.toLowerCase().includes(schoolSearch.toLowerCase())
    );

    // Derived step numbers (Post UTME adds a school step)
    const stepOffset = examType === "post_utme" ? 1 : 0;

    return (
        <div className="min-h-screen bg-[#f0f2f5]">

            {/* ── Header ── */}
            <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Link href="/general" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div className="h-4 w-px bg-gray-200" />
                        <div className="w-7 h-7 rounded-lg bg-green-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                    d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-gray-900 tracking-tight">Study Mode</span>
                    </div>
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
                        No pressure
                    </span>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

                {/* ── Hero ── */}
                <div className="mb-8">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2">Study Mode</p>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        Set Up Your Study Session
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 max-w-lg">
                        Browse questions at your own pace with answers and explanations always visible. Perfect for revision.
                    </p>
                </div>

                <div className="space-y-6">

                    {/* ── Step 1: Exam Type ── */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-bold">1</div>
                            <h2 className="text-base font-bold text-gray-900">Select Exam Type</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {EXAM_TYPES.map((et) => (
                                <button
                                    key={et.value}
                                    onClick={() => {
                                        setExamType(et.value as ExamType);
                                        setSelectedSchool(""); setSchoolSearch("");
                                        setSelectedSubject(""); setSelectedTopic("");
                                        setSelectedYear(null);
                                    }}
                                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                                        examType === et.value
                                            ? et.active + " shadow-sm"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <p className={`text-sm font-bold ${examType === et.value ? "text-green-700" : "text-gray-900"}`}>
                                        {et.label}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">{et.full}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Step 1b: School (Post UTME only) ── */}
                    {examType === "post_utme" && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-bold">2</div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">Select Your School</h2>
                                    <p className="text-xs text-gray-400">Post UTME questions are school-specific</p>
                                </div>
                            </div>
                            <input
                                type="text"
                                value={schoolSearch}
                                onChange={(e) => setSchoolSearch(e.target.value)}
                                placeholder="Search school…"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 mb-3"
                            />
                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                                {filteredSchools.map((school) => (
                                    <button
                                        key={school}
                                        onClick={() => { setSelectedSchool(school); setSelectedSubject(""); setSelectedTopic(""); setSelectedYear(null); }}
                                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                                            selectedSchool === school
                                                ? "border-green-600 bg-green-50 text-green-700"
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

                    {/* ── Loading / error / empty (after exam type chosen) ── */}
                    {examType && (examType !== "post_utme" || selectedSchool) && loading && (
                        <div className="flex items-center justify-center py-12">
                            <svg className="w-6 h-6 animate-spin text-green-700" fill="none" viewBox="0 0 24 24">
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
                            <p className="text-xs text-gray-400 mt-1">
                                No {EXAM_TYPES.find((e) => e.value === examType)?.label} questions found
                                {examType === "post_utme" && selectedSchool ? ` for ${selectedSchool}` : ""}. Check back later.
                            </p>
                        </div>
                    )}

                    {/* ── Step 2: Subject ── */}
                    {examType && (examType !== "post_utme" || selectedSchool) && !loading && !error && subjects.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-bold">
                                    {stepOffset + 2}
                                </div>
                                <h2 className="text-base font-bold text-gray-900">Choose a Subject</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {subjects.map((s) => (
                                    <button
                                        key={s.subject}
                                        onClick={() => { setSelectedSubject(s.subject); setSelectedTopic(""); setSelectedYear(null); }}
                                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                                            selectedSubject === s.subject
                                                ? "border-green-600 bg-green-50 shadow-sm"
                                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        <p className={`text-sm font-bold ${selectedSubject === s.subject ? "text-green-700" : "text-gray-900"}`}>
                                            {s.subject}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">{s.count} questions</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Topic (optional) ── */}
                    {examType && (examType !== "post_utme" || selectedSchool) && selectedSubject && availableTopics.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-bold">
                                    {stepOffset + 3}
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">Filter by Topic</h2>
                                    <p className="text-xs text-gray-400">Optional — leave blank for all topics</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => { setSelectedTopic(""); setSelectedYear(null); }}
                                    className={`text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all ${
                                        selectedTopic === ""
                                            ? "border-green-600 bg-green-50 text-green-700"
                                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                                    }`}
                                >
                                    All Topics
                                </button>
                                {availableTopics.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => { setSelectedTopic(t); setSelectedYear(null); }}
                                        className={`text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all ${
                                            selectedTopic === t
                                                ? "border-green-600 bg-green-50 text-green-700"
                                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Step 4: Year (optional, only shown if years exist) ── */}
                    {selectedSubject && !yearsLoading && availableYears.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-bold">
                                    {stepOffset + (availableTopics.length > 0 ? 4 : 3)}
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">Filter by Year</h2>
                                    <p className="text-xs text-gray-400">Optional — browse a specific past paper year</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedYear(null)}
                                    className={`text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all ${
                                        selectedYear === null
                                            ? "border-green-600 bg-green-50 text-green-700"
                                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                                    }`}
                                >
                                    All Years
                                </button>
                                {availableYears.map((y) => (
                                    <button
                                        key={y}
                                        onClick={() => setSelectedYear(y)}
                                        className={`text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all ${
                                            selectedYear === y
                                                ? "border-green-600 bg-green-50 text-green-700"
                                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                                        }`}
                                    >
                                        {y}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Browse Button ── */}
                    {examType && (examType !== "post_utme" || selectedSchool) && selectedSubject && (
                        <button
                            onClick={handleStart}
                            disabled={starting}
                            className={`w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-700 text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-sm ${starting ? "opacity-70 cursor-not-allowed" : ""}`}
                        >
                            {starting ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Loading…
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                    </svg>
                                    Browse Questions
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    )}

                </div>

                <p className="mt-10 text-center text-xs text-gray-400">
                    Assessly · Study Mode · Learn without pressure
                </p>

            </main>
        </div>
    );
}
