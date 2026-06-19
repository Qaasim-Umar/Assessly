"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────
type ExamType = "jamb" | "post_utme" | "waec" | "neco" | "bece" | "";
type Mode = "practice" | "timed" | "";

// ─── Constants ───────────────────────────────────────────────────────────────
const EXAM_TYPES: { value: ExamType; label: string; full: string; active: string }[] = [
    { value: "jamb",      label: "JAMB",      full: "Joint Admissions",       active: "border-green-600 bg-green-50" },
    { value: "post_utme", label: "Post UTME", full: "University Screening",   active: "border-green-600 bg-green-50" },
    { value: "waec",      label: "WAEC",      full: "W. Africa Exam Council", active: "border-green-600 bg-green-50" },
    { value: "neco",      label: "NECO",      full: "National Exams Council", active: "border-green-600 bg-green-50" },
    { value: "bece",      label: "BECE",      full: "Basic Cert. Exams",      active: "border-green-600 bg-green-50" },
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
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function PastQuestionsSetupPage() {
    const router = useRouter();

    const [subjectsLoading, setSubjectsLoading] = useState(false);
    const [yearsLoading, setYearsLoading] = useState(false);
    const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [questionCount, setQuestionCount] = useState(0);
    const [error, setError] = useState("");

    const [examType, setExamType] = useState<ExamType>("");
    const [selectedSchool, setSelectedSchool] = useState("");
    const [schoolSearch, setSchoolSearch] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedMode, setSelectedMode] = useState<Mode>("");
    const [starting, setStarting] = useState(false);

    // Load subjects that have past paper questions (year is not null)
    useEffect(() => {
        const ready = examType && (examType !== "post_utme" || selectedSchool);
        if (!ready) { setSubjects([]); return; }

        async function loadSubjects() {
            setSubjectsLoading(true);
            setError("");
            try {
                let q = supabase
                    .from("questions")
                    .select("subject")
                    .is("exam_id", null)
                    .eq("is_active", true)
                    .eq("exam_type", examType)
                    .not("year", "is", null);

                if (examType === "post_utme" && selectedSchool) q = q.eq("university", selectedSchool);

                const { data, error: err } = await q;
                if (err) throw err;

                const countMap = new Map<string, number>();
                for (const row of data ?? []) {
                    const subj = (row.subject as string) ?? "";
                    if (!subj) continue;
                    countMap.set(subj, (countMap.get(subj) ?? 0) + 1);
                }

                const list: SubjectInfo[] = Array.from(countMap.entries())
                    .map(([subject, count]) => ({ subject, count }))
                    .sort((a, b) => a.subject.localeCompare(b.subject));

                setSubjects(list);
            } catch {
                setError("Failed to load subjects.");
            } finally {
                setSubjectsLoading(false);
            }
        }
        loadSubjects();
    }, [examType, selectedSchool]);

    // Load available years for selected subject
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
    }, [examType, selectedSchool, selectedSubject]);

    // Load question count for selected year
    useEffect(() => {
        if (!examType || !selectedSubject || !selectedYear) { setQuestionCount(0); return; }

        async function loadCount() {
            let q = supabase
                .from("questions")
                .select("id", { count: "exact", head: true })
                .is("exam_id", null)
                .eq("is_active", true)
                .eq("exam_type", examType)
                .eq("subject", selectedSubject)
                .eq("year", selectedYear);

            if (examType === "post_utme" && selectedSchool) q = q.eq("university", selectedSchool);

            const { count } = await q;
            setQuestionCount(count ?? 0);
        }
        loadCount();
    }, [examType, selectedSchool, selectedSubject, selectedYear]);

    const handleStart = () => {
        if (!examType || !selectedSubject || !selectedYear || !selectedMode || starting) return;
        if (examType === "post_utme" && !selectedSchool) return;
        setStarting(true);
        const params = new URLSearchParams();
        params.set("examType", examType);
        if (examType === "post_utme" && selectedSchool) params.set("school", selectedSchool);
        params.set("subject", selectedSubject);
        params.set("year", String(selectedYear));
        router.push(`/general/dashboard/past-questions/${selectedMode}?${params.toString()}`);
    };

    const filteredSchools = POST_UTME_SCHOOLS.filter((s) =>
        s.toLowerCase().includes(schoolSearch.toLowerCase())
    );

    const stepOffset = examType === "post_utme" ? 1 : 0;
    const canStart = examType && (examType !== "post_utme" || selectedSchool) && selectedSubject && selectedYear && selectedMode;

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
                                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-gray-900 tracking-tight">Past Questions</span>
                    </div>
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
                        Real papers
                    </span>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

                {/* ── Hero ── */}
                <div className="mb-8">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2">Past Questions</p>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        Browse Real Papers
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 max-w-lg">
                        Authentic past papers from JAMB, WAEC, NECO, BECE, and Post UTME. Choose a year and decide how you want to attempt it.
                    </p>
                </div>

                <div className="space-y-6">

                    {/* ── Step 1: Exam Type ── */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-bold">1</div>
                            <h2 className="text-base font-bold text-gray-900">Select Exam</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {EXAM_TYPES.map((et) => (
                                <button
                                    key={et.value}
                                    onClick={() => {
                                        setExamType(et.value as ExamType);
                                        setSelectedSchool(""); setSchoolSearch("");
                                        setSelectedSubject(""); setSelectedYear(null); setSelectedMode("");
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
                                    <p className="text-xs text-gray-400">Post UTME papers are school-specific</p>
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
                                        onClick={() => { setSelectedSchool(school); setSelectedSubject(""); setSelectedYear(null); setSelectedMode(""); }}
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

                    {/* Loading / error / empty */}
                    {examType && (examType !== "post_utme" || selectedSchool) && subjectsLoading && (
                        <div className="flex items-center justify-center py-10">
                            <svg className="w-6 h-6 animate-spin text-green-700" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                    )}
                    {examType && (examType !== "post_utme" || selectedSchool) && !subjectsLoading && error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-5 py-4 rounded-xl">{error}</div>
                    )}
                    {examType && (examType !== "post_utme" || selectedSchool) && !subjectsLoading && !error && subjects.length === 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
                            <p className="text-sm font-bold text-gray-700">No past papers available</p>
                            <p className="text-xs text-gray-400 mt-1">
                                No {EXAM_TYPES.find((e) => e.value === examType)?.label} past papers found
                                {examType === "post_utme" && selectedSchool ? ` for ${selectedSchool}` : ""}. Check back later.
                            </p>
                        </div>
                    )}

                    {/* ── Step 2: Subject ── */}
                    {examType && (examType !== "post_utme" || selectedSchool) && !subjectsLoading && !error && subjects.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-bold">
                                    {stepOffset + 2}
                                </div>
                                <h2 className="text-base font-bold text-gray-900">Select Subject</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {subjects.map((s) => (
                                    <button
                                        key={s.subject}
                                        onClick={() => { setSelectedSubject(s.subject); setSelectedYear(null); setSelectedMode(""); }}
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

                    {/* ── Step 3: Year ── */}
                    {selectedSubject && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-bold">
                                    {stepOffset + 3}
                                </div>
                                <h2 className="text-base font-bold text-gray-900">Select Year</h2>
                            </div>

                            {yearsLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <svg className="w-5 h-5 animate-spin text-green-700" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                </div>
                            ) : availableYears.length === 0 ? (
                                <p className="text-sm text-gray-400">No past paper years found for {selectedSubject}.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {availableYears.map((y) => (
                                        <button
                                            key={y}
                                            onClick={() => { setSelectedYear(y); setSelectedMode(""); }}
                                            className={`text-sm font-bold px-4 py-2 rounded-xl border-2 transition-all ${
                                                selectedYear === y
                                                    ? "border-green-600 bg-green-50 text-green-700 shadow-sm"
                                                    : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedYear && questionCount > 0 && (
                                <p className="text-xs text-gray-400 mt-3">
                                    {questionCount} question{questionCount !== 1 ? "s" : ""} in this paper
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Step 4: Mode ── */}
                    {selectedYear && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-bold">
                                    {stepOffset + 4}
                                </div>
                                <h2 className="text-base font-bold text-gray-900">Choose Mode</h2>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">

                                {/* Practice */}
                                <button
                                    onClick={() => setSelectedMode("practice")}
                                    className={`text-left p-5 rounded-xl border-2 transition-all ${
                                        selectedMode === "practice"
                                            ? "border-emerald-500 bg-emerald-50 shadow-sm"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${selectedMode === "practice" ? "bg-emerald-100" : "bg-gray-100"}`}>
                                        <svg className={`w-5 h-5 ${selectedMode === "practice" ? "text-emerald-600" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                        </svg>
                                    </div>
                                    <p className={`text-sm font-extrabold ${selectedMode === "practice" ? "text-emerald-700" : "text-gray-900"}`}>
                                        Practice
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        Attempt questions one by one. Get instant feedback and full explanations after each answer.
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {["Instant feedback", "Explanations", "No timer"].map((tag) => (
                                            <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${selectedMode === "practice" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </button>

                                {/* Timed Exam */}
                                <button
                                    onClick={() => setSelectedMode("timed")}
                                    className={`text-left p-5 rounded-xl border-2 transition-all ${
                                        selectedMode === "timed"
                                            ? "border-green-600 bg-green-50 shadow-sm"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${selectedMode === "timed" ? "bg-green-100" : "bg-gray-100"}`}>
                                        <svg className={`w-5 h-5 ${selectedMode === "timed" ? "text-green-700" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className={`text-sm font-extrabold ${selectedMode === "timed" ? "text-green-700" : "text-gray-900"}`}>
                                        Timed Exam
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        Full paper with a countdown timer. Navigate freely, submit when done. Explanations revealed after.
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {["Countdown timer", "Full paper", "Submit to reveal"].map((tag) => (
                                            <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${selectedMode === "timed" ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    {questionCount > 0 && (
                                        <p className="text-[10px] text-gray-400 mt-2">
                                            ~{Math.round(questionCount * 1.5)} min for {questionCount} questions
                                        </p>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Start Button ── */}
                    {canStart && (
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
                                    {selectedMode === "practice" ? "Start Practice" : "Start Timed Exam"}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    )}

                </div>

                <p className="mt-10 text-center text-xs text-gray-400">
                    Assessly · Past Questions · Real papers, real results
                </p>

            </main>
        </div>
    );
}
