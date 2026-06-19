"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────
type ExamBody = "jamb" | "waec" | "neco" | "post_utme" | "bece" | "mixed";
type Difficulty = "easy" | "medium" | "hard" | "mixed";
type Lives = 2 | 3 | 4;

interface SubjectInfo {
    subject: string;
    topics: string[];
}

// ─── Constants ───────────────────────────────────────────────────────────────
const POST_UTME_SCHOOLS = [
    "UNILAG", "UI", "OAU", "UNN", "ABU", "UNIBEN", "UNILORIN", "UNIPORT",
    "FUTA", "FUNAAB", "LASU", "OOU", "DELSU", "KWASU", "UNIOSUN", "RSU",
    "ABUAD", "CU", "BUK", "FUOYE", "FULOKOJA", "FUPRE", "FUDMA", "FULAFIA",
    "FUTMINNA", "ATBU", "BAUCHI", "UNIMAID", "EBSU", "IMSU", "ESUT",
    "TASUED", "TAI-SOLARIN", "BABCOCK", "BOWEN",
];

const EXAM_BODIES: { value: ExamBody; label: string; sub: string }[] = [
    { value: "jamb",      label: "JAMB",      sub: "Joint Admissions"        },
    { value: "waec",      label: "WAEC",      sub: "W. Africa Exam Council"  },
    { value: "neco",      label: "NECO",      sub: "National Exams Council"  },
    { value: "post_utme", label: "Post-UTME", sub: "University Screening"    },
    { value: "bece",      label: "BECE",      sub: "Basic Cert. Exams"       },
    { value: "mixed",     label: "Mixed",     sub: "All exam bodies"         },
];

const DIFFICULTIES: { value: Difficulty; label: string; desc: string; bg: string; text: string }[] = [
    { value: "easy",   label: "Easy",   desc: "Foundational questions", bg: "bg-green-50",  text: "text-green-700"  },
    { value: "medium", label: "Medium", desc: "Standard exam level",    bg: "bg-amber-50",  text: "text-amber-700"  },
    { value: "hard",   label: "Hard",   desc: "Challenging questions",  bg: "bg-amber-50", text: "text-amber-700" },
    { value: "mixed",  label: "Mixed",  desc: "All difficulty levels",  bg: "bg-violet-50", text: "text-violet-700" },
];

const LIVES_OPTIONS: Lives[] = [2, 3, 4];

// ─── Heart icon ───────────────────────────────────────────────────────────────
function HeartIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
    );
}

// ─── Step header ──────────────────────────────────────────────────────────────
function StepHeader({ n, label, done }: { n: number; label: string; done: boolean }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${done ? "bg-green-700 text-white" : "bg-amber-500 text-white"}`}>
                {done ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                ) : n}
            </div>
            <h2 className="text-base font-bold text-gray-900">{label}</h2>
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function SurvivalSetupPage() {
    const router = useRouter();

    const [subjectList, setSubjectList]         = useState<SubjectInfo[]>([]);
    const [loadingSubjects, setLoadingSubjects]  = useState(true);
    const [subjectError, setSubjectError]        = useState("");

    const [selectedSubject,    setSelectedSubject]    = useState("");
    const [selectedTopic,      setSelectedTopic]      = useState("");
    const [selectedExamBody,   setSelectedExamBody]   = useState<ExamBody | "">("");
    const [selectedSchool,     setSelectedSchool]     = useState("");
    const [schoolSearch,       setSchoolSearch]       = useState("");
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "">("");
    const [selectedLives,      setSelectedLives]      = useState<Lives | 0>(0);
    const [starting,           setStarting]           = useState(false);

    // Fetch all distinct subjects + topics on mount
    useEffect(() => {
        async function load() {
            setLoadingSubjects(true);
            try {
                const { data, error } = await supabase
                    .from("questions")
                    .select("subject, topic")
                    .is("exam_id", null)
                    .eq("is_active", true);

                if (error) throw error;

                const map = new Map<string, Set<string>>();
                for (const row of data ?? []) {
                    const subj = (row.subject as string) ?? "";
                    if (!subj) continue;
                    if (!map.has(subj)) map.set(subj, new Set());
                    const t = (row.topic as string) ?? "";
                    if (t) map.get(subj)!.add(t);
                }

                const list: SubjectInfo[] = Array.from(map.entries())
                    .map(([subject, topicSet]) => ({ subject, topics: Array.from(topicSet).sort() }))
                    .sort((a, b) => a.subject.localeCompare(b.subject));

                setSubjectList(list);
            } catch {
                setSubjectError("Failed to load subjects.");
            } finally {
                setLoadingSubjects(false);
            }
        }
        load();
    }, []);

    const currentSubjectInfo = subjectList.find((s) => s.subject === selectedSubject);
    const availableTopics    = currentSubjectInfo?.topics ?? [];
    const filteredSchools    = POST_UTME_SCHOOLS.filter((s) =>
        s.toLowerCase().includes(schoolSearch.toLowerCase())
    );

    const needsSchool = selectedExamBody === "post_utme";
    const allSelected =
        selectedSubject !== "" &&
        selectedExamBody !== "" &&
        (!needsSchool || selectedSchool !== "") &&
        selectedDifficulty !== "" &&
        selectedLives !== 0;

    const handleStart = () => {
        if (!allSelected || starting) return;
        setStarting(true);
        const params = new URLSearchParams({
            subject:    selectedSubject,
            examBody:   selectedExamBody,
            difficulty: selectedDifficulty,
            lives:      String(selectedLives),
        });
        if (selectedTopic)  params.set("topic", selectedTopic);
        if (needsSchool && selectedSchool) params.set("school", selectedSchool);
        router.push(`/general/dashboard/survival/session?${params.toString()}`);
    };

    // Shared pill button style
    const pill = (active: boolean, activeExtra = "") =>
        `text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
            active
                ? `border-amber-500 bg-amber-50 text-amber-700 shadow-sm ${activeExtra}`
                : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
        }`;

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
                        <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-gray-900 tracking-tight">Survival Mode</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
                        One life per wrong answer
                    </span>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

                {/* ── Hero ── */}
                <div className="mb-8">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Survival Mode</p>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        Set Up Survival
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 max-w-lg">
                        One wrong answer costs a life. Lose them all and it&apos;s over. How far can you go?
                    </p>
                </div>

                <div className="space-y-5">

                    {/* ── Step 1: Subject ── */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                        <StepHeader n={1} label="Choose a Subject" done={selectedSubject !== ""} />

                        {loadingSubjects && (
                            <div className="flex items-center gap-2 py-4">
                                <svg className="w-5 h-5 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span className="text-sm text-gray-400">Loading subjects…</span>
                            </div>
                        )}

                        {!loadingSubjects && subjectError && (
                            <p className="text-sm text-red-600 font-medium">{subjectError}</p>
                        )}

                        {!loadingSubjects && !subjectError && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {subjectList.map(({ subject }) => (
                                    <button
                                        key={subject}
                                        onClick={() => { setSelectedSubject(subject); setSelectedTopic(""); }}
                                        className={pill(selectedSubject === subject)}
                                    >
                                        {subject}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Step 1b: Topic (optional, appears after subject chosen) ── */}
                    {selectedSubject && availableTopics.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-7 h-7 rounded-full bg-orange-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">Filter by Topic</h2>
                                    <p className="text-xs text-gray-400">Optional — leave on All for mixed topics</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedTopic("")}
                                    className={`text-xs font-semibold px-3.5 py-2 rounded-lg border-2 transition-all ${
                                        selectedTopic === ""
                                            ? "border-amber-500 bg-amber-50 text-amber-700"
                                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    All Topics
                                </button>
                                {availableTopics.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setSelectedTopic(t)}
                                        className={`text-xs font-semibold px-3.5 py-2 rounded-lg border-2 transition-all ${
                                            selectedTopic === t
                                                ? "border-amber-500 bg-amber-50 text-amber-700"
                                                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Exam Body ── */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                        <StepHeader n={2} label="Select Exam Body" done={selectedExamBody !== "" && (!needsSchool || selectedSchool !== "")} />
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {EXAM_BODIES.map((eb) => (
                                <button
                                    key={eb.value}
                                    onClick={() => {
                                        setSelectedExamBody(eb.value);
                                        setSelectedSchool("");
                                        setSchoolSearch("");
                                    }}
                                    className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                                        selectedExamBody === eb.value
                                            ? "border-amber-500 bg-amber-50 shadow-sm"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <p className={`text-sm font-bold ${selectedExamBody === eb.value ? "text-amber-700" : "text-gray-900"}`}>
                                        {eb.label}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">{eb.sub}</p>
                                </button>
                            ))}
                        </div>

                        {/* ── Step 2b: School picker (Post-UTME only) ── */}
                        {needsSchool && (
                            <div className="mt-5 pt-5 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Select Your School</p>
                                <input
                                    type="text"
                                    value={schoolSearch}
                                    onChange={(e) => setSchoolSearch(e.target.value)}
                                    placeholder="Search school…"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 mb-3"
                                />
                                <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
                                    {filteredSchools.map((school) => (
                                        <button
                                            key={school}
                                            onClick={() => setSelectedSchool(school)}
                                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                                                selectedSchool === school
                                                    ? "border-amber-500 bg-amber-50 text-amber-700"
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
                    </div>

                    {/* ── Step 3: Difficulty ── */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                        <StepHeader n={3} label="Choose Difficulty" done={selectedDifficulty !== ""} />
                        <div className="grid grid-cols-2 gap-2.5">
                            {DIFFICULTIES.map((d) => (
                                <button
                                    key={d.value}
                                    onClick={() => setSelectedDifficulty(d.value)}
                                    className={`text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                                        selectedDifficulty === d.value
                                            ? `border-amber-500 ${d.bg} shadow-sm`
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <p className={`text-sm font-bold ${selectedDifficulty === d.value ? d.text : "text-gray-900"}`}>
                                        {d.label}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">{d.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Step 4: Lives ── */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                        <StepHeader n={4} label="Choose Your Lives" done={selectedLives !== 0} />
                        <div className="flex gap-3">
                            {LIVES_OPTIONS.map((n) => (
                                <button
                                    key={n}
                                    onClick={() => setSelectedLives(n)}
                                    className={`flex-1 flex flex-col items-center gap-2.5 py-5 rounded-xl border-2 transition-all ${
                                        selectedLives === n
                                            ? "border-red-400 bg-red-50 shadow-sm"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <div className={`flex gap-1 ${selectedLives === n ? "text-red-500" : "text-gray-300"}`}>
                                        {Array.from({ length: n }).map((_, i) => (
                                            <HeartIcon key={i} size={22} />
                                        ))}
                                    </div>
                                    <span className={`text-sm font-bold ${selectedLives === n ? "text-red-600" : "text-gray-500"}`}>
                                        {n} lives
                                    </span>
                                </button>
                            ))}
                        </div>
                        <p className="mt-3 text-[11px] text-gray-400 text-center">
                            Each wrong answer removes one life. Lose them all and the session ends.
                        </p>
                    </div>

                    {/* ── Progress summary ── */}
                    {(selectedSubject || selectedExamBody || selectedDifficulty || selectedLives) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex flex-wrap gap-x-4 gap-y-1">
                            {selectedSubject    && <span className="text-xs font-semibold text-amber-700">Subject: {selectedSubject}{selectedTopic ? ` · ${selectedTopic}` : ""}</span>}
                            {selectedExamBody   && <span className="text-xs font-semibold text-amber-700">Exam: {EXAM_BODIES.find(e => e.value === selectedExamBody)?.label}{selectedSchool ? ` (${selectedSchool})` : ""}</span>}
                            {selectedDifficulty && <span className="text-xs font-semibold text-amber-700">Difficulty: {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}</span>}
                            {selectedLives !== 0 && <span className="text-xs font-semibold text-amber-700">Lives: {"❤️".repeat(selectedLives)}</span>}
                        </div>
                    )}

                    {/* ── Start button ── */}
                    <button
                        onClick={handleStart}
                        disabled={!allSelected || starting}
                        className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-xl transition-all shadow-sm ${
                            allSelected
                                ? "bg-amber-500 hover:bg-amber-600 text-white"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        } ${starting ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                        {starting ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Loading Session…
                            </>
                        ) : allSelected ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                </svg>
                                Start Survival
                            </>
                        ) : (
                            `Complete all ${needsSchool ? 5 : 4} selections to start`
                        )}
                    </button>

                </div>

                <p className="mt-10 text-center text-xs text-gray-400">
                    Assessly · Survival Mode · How far can you go?
                </p>

            </main>
        </div>
    );
}
