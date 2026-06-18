"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JambQuestion {
    id: string;
    subject: string;
    text: string;
    topic: string | null;
    explanation: string | null;
    image_url: string | null;
    instruction: string | null;
    passage: string | null;
    options: { label: string; text: string }[];
    correct_answer: number;
}

interface SubjectResult {
    subject: string;
    correct: number;
    total: number;
    score: number;
}

interface ExamResults {
    sessionId: string;
    subjectResults: SubjectResult[];
    totalScore: number;
    timeSpent: number;
    wasAutoSubmitted: boolean;
}

type PageState = "loading" | "exam" | "results" | "review";

// ─── localStorage backup ──────────────────────────────────────────────────────

const LS_KEY = "jamb_sim_backup";

interface Backup {
    sessionId: string;
    subjects: string[];
    questions: JambQuestion[];
    answers: Record<string, number>;
    flags: Record<string, boolean>;
    timeLeft: number;
}

function saveBackup(data: Backup) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* quota */ }
}

function loadBackup(): Backup | null {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? (JSON.parse(raw) as Backup) : null;
    } catch { return null; }
}

function clearBackup() {
    try { localStorage.removeItem(LS_KEY); } catch { /* */ }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ─── Wrappers ─────────────────────────────────────────────────────────────────

export default function JambSessionWrapper() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <svg className="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        }>
            <JambSessionPage />
        </Suspense>
    );
}

// ─── Main session component ───────────────────────────────────────────────────

function JambSessionPage() {
    const searchParams = useSearchParams();
    const subjectsParam = searchParams.get("subjects") ?? "";
    const chosenSubjects = subjectsParam.split(",").filter(Boolean).slice(0, 3);
    const allSubjects = ["English Language", ...chosenSubjects];

    // ── Page state ────────────────────────────────────────────────────────────
    const [pageState, setPageState] = useState<PageState>("loading");
    const [loadError, setLoadError] = useState("");

    // ── Exam data ─────────────────────────────────────────────────────────────
    const [questions, setQuestions] = useState<JambQuestion[]>([]);
    const [sessionId, setSessionId] = useState("");
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [flags, setFlags] = useState<Record<string, boolean>>({});
    const [currentIdx, setCurrentIdx] = useState(0);
    const [activeTab, setActiveTab] = useState("English Language");

    // ── Timer ─────────────────────────────────────────────────────────────────
    const [timeLeft, setTimeLeft] = useState(7200);
    const timeLeftRef = useRef(7200);
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Submit state ──────────────────────────────────────────────────────────
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const submittingRef = useRef(false);
    const [results, setResults] = useState<ExamResults | null>(null);

    // ── Review state ──────────────────────────────────────────────────────────
    const [reviewSubject, setReviewSubject] = useState("all");

    // ── Stable refs so timer/submit can always read latest state ──────────────
    const answersRef = useRef(answers);
    const flagsRef = useRef(flags);
    const questionsRef = useRef(questions);
    const sessionIdRef = useRef(sessionId);
    useEffect(() => { answersRef.current = answers; }, [answers]);
    useEffect(() => { flagsRef.current = flags; }, [flags]);
    useEffect(() => { questionsRef.current = questions; }, [questions]);
    useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

    // ── Submit exam ───────────────────────────────────────────────────────────
    const submitExam = useCallback(async (wasAuto: boolean) => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        setSubmitting(true);

        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        const currentAnswers = answersRef.current;
        const currentQuestions = questionsRef.current;
        const sid = sessionIdRef.current;

        // Compute results
        const subjectResults: SubjectResult[] = allSubjects.map((subj, i) => {
            const total = i === 0 ? 60 : 40;
            const subjQs = currentQuestions.filter((q) => q.subject === subj);
            const correct = subjQs.filter((q) => currentAnswers[q.id] === q.correct_answer).length;
            return { subject: subj, correct, total, score: (correct / total) * 100 };
        });
        const totalScore = subjectResults.reduce((acc, s) => acc + s.score, 0);
        const timeSpent = 7200 - timeLeftRef.current;

        const res: ExamResults = { sessionId: sid, subjectResults, totalScore, timeSpent, wasAutoSubmitted: wasAuto };

        // Update session row
        const subjectScores: Record<string, number> = {};
        subjectResults.forEach((s) => { subjectScores[s.subject] = s.score; });
        await supabase
            .from("mock_exam_sessions")
            .update({
                total_score: Math.round(totalScore),
                subject_scores: subjectScores,
                was_auto_submitted: wasAuto,
                status: "completed",
                completed_at: new Date().toISOString(),
            })
            .eq("id", sid);

        // Bulk insert answers
        const answerRows = currentQuestions
            .filter((q) => currentAnswers[q.id] !== undefined)
            .map((q) => ({
                session_id: sid,
                question_id: q.id,
                subject: q.subject,
                selected_option: currentAnswers[q.id],
                is_correct: currentAnswers[q.id] === q.correct_answer,
            }));
        if (answerRows.length > 0) {
            await supabase.from("mock_exam_answers").insert(answerRows);
        }

        // upsert_topic_stat per answered question
        for (const q of currentQuestions.filter((q) => currentAnswers[q.id] !== undefined && q.topic)) {
            await supabase
                .rpc("upsert_topic_stat", {
                    p_question_id: q.id,
                    p_subject: q.subject,
                    p_topic: q.topic,
                    p_is_correct: currentAnswers[q.id] === q.correct_answer,
                })
                ;
        }

        clearBackup();

        try {
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        } catch { /* */ }

        setResults(res);
        setSubmitting(false);
        setShowSubmitModal(false);
        setPageState("results");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep a ref to submitExam so the timer can always call the latest version
    const submitExamRef = useRef(submitExam);
    useEffect(() => { submitExamRef.current = submitExam; }, [submitExam]);

    // ── Start timer once exam begins ──────────────────────────────────────────
    useEffect(() => {
        if (pageState !== "exam") return;
        if (timerIntervalRef.current) return;

        const id = setInterval(() => {
            timeLeftRef.current -= 1;
            setTimeLeft(timeLeftRef.current);
            if (timeLeftRef.current <= 0) {
                clearInterval(id);
                timerIntervalRef.current = null;
                submitExamRef.current(true);
            }
        }, 1000);
        timerIntervalRef.current = id;

        return () => {
            clearInterval(id);
            timerIntervalRef.current = null;
        };
    }, [pageState]);

    // ── Auto-backup every 30 seconds while in exam ────────────────────────────
    useEffect(() => {
        if (pageState !== "exam") return;
        const id = setInterval(() => {
            saveBackup({
                sessionId: sessionIdRef.current,
                subjects: chosenSubjects,
                questions: questionsRef.current,
                answers: answersRef.current,
                flags: flagsRef.current,
                timeLeft: timeLeftRef.current,
            });
        }, 30_000);
        return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageState]);

    // ── Load questions & create session ───────────────────────────────────────
    useEffect(() => {
        async function init() {
            if (chosenSubjects.length !== 3) {
                setLoadError("Invalid subject selection. Please go back and choose 3 subjects.");
                return;
            }

            // Restore from localStorage backup if subjects match
            const backup = loadBackup();
            if (
                backup &&
                backup.subjects.join(",") === chosenSubjects.join(",") &&
                backup.questions.length > 0
            ) {
                setQuestions(backup.questions);
                setSessionId(backup.sessionId);
                setAnswers(backup.answers);
                setFlags(backup.flags);
                timeLeftRef.current = backup.timeLeft;
                setTimeLeft(backup.timeLeft);
                setActiveTab("English Language");
                setPageState("exam");
                return;
            }

            try {
                // Fetch English Language questions (fetch generous pool, shuffle + take 60)
                const { data: engData, error: engErr } = await supabase
                    .from("questions")
                    .select("id, text, topic, explanation, image_url, instruction, passage, options, correct_answer")
                    .eq("exam_type", "jamb")
                    .eq("subject", "English Language")
                    .eq("is_active", true);
                if (engErr) throw engErr;

                // Fetch chosen subject questions in parallel
                const subjectFetches = await Promise.all(
                    chosenSubjects.map((subj) =>
                        supabase
                            .from("questions")
                            .select("id, text, topic, explanation, image_url, instruction, passage, options, correct_answer")
                            .eq("exam_type", "jamb")
                            .eq("subject", subj)
                            .eq("is_active", true)
                    )
                );

                for (const { error: err } of subjectFetches) {
                    if (err) throw err;
                }

                const engQuestions: JambQuestion[] = shuffle(
                    (engData ?? []).map((r) => ({
                        id: r.id as string,
                        subject: "English Language",
                        text: r.text as string,
                        topic: r.topic as string | null,
                        explanation: r.explanation as string | null,
                        image_url: r.image_url as string | null,
                        instruction: r.instruction as string | null,
                        passage: r.passage as string | null,
                        options: (r.options as { label: string; text: string }[]) ?? [],
                        correct_answer: (r.correct_answer as number) ?? 0,
                    }))
                ).slice(0, 60);

                const subjectQuestions: JambQuestion[][] = subjectFetches.map(({ data }, i) =>
                    shuffle(
                        (data ?? []).map((r) => ({
                            id: r.id as string,
                            subject: chosenSubjects[i],
                            text: r.text as string,
                            topic: r.topic as string | null,
                            explanation: r.explanation as string | null,
                            image_url: r.image_url as string | null,
                            instruction: r.instruction as string | null,
                            passage: r.passage as string | null,
                            options: (r.options as { label: string; text: string }[]) ?? [],
                            correct_answer: (r.correct_answer as number) ?? 0,
                        }))
                    ).slice(0, 40)
                );

                const allQuestions: JambQuestion[] = [
                    ...engQuestions,
                    ...subjectQuestions[0],
                    ...subjectQuestions[1],
                    ...subjectQuestions[2],
                ];

                if (allQuestions.length === 0) {
                    throw new Error("No questions found for the selected subjects.");
                }

                // Create session row (best-effort; fall back to random UUID)
                let sid = crypto.randomUUID();
                const { data: sessionData, error: sessionErr } = await supabase
                    .from("mock_exam_sessions")
                    .insert({
                        subjects: allSubjects,
                        status: "in_progress",
                        exam_type: "jamb",
                    })
                    .select("id")
                    .single();
                if (!sessionErr && sessionData?.id) sid = sessionData.id as string;

                setQuestions(allQuestions);
                setSessionId(sid);
                setAnswers({});
                setFlags({});
                timeLeftRef.current = 7200;
                setTimeLeft(7200);
                setActiveTab("English Language");

                saveBackup({
                    sessionId: sid,
                    subjects: chosenSubjects,
                    questions: allQuestions,
                    answers: {},
                    flags: {},
                    timeLeft: 7200,
                });

                setPageState("exam");
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Unknown error";
                setLoadError(`Failed to load exam: ${msg}. Please go back and try again.`);
            }
        }
        init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Fullscreen on exam start ──────────────────────────────────────────────
    useEffect(() => {
        if (pageState === "exam") {
            document.documentElement.requestFullscreen().catch(() => {});
        }
    }, [pageState]);

    // ── Derived values ────────────────────────────────────────────────────────

    function subjectStartIndex(subj: string): number {
        if (subj === "English Language") return 0;
        let idx = 60;
        for (let i = 0; i < chosenSubjects.length; i++) {
            if (chosenSubjects[i] === subj) return idx;
            idx += 40;
        }
        return 0;
    }

    function questionsForSubject(subj: string): JambQuestion[] {
        return questions.filter((q) => q.subject === subj);
    }

    function answeredCountForSubject(subj: string): number {
        return questionsForSubject(subj).filter((q) => answers[q.id] !== undefined).length;
    }

    const totalAnswered = Object.keys(answers).length;
    const totalUnanswered = questions.length - totalAnswered;
    const currentQ = questions[currentIdx];

    // ── Answer & flag helpers ─────────────────────────────────────────────────

    function recordAnswer(questionId: string, optionIdx: number) {
        const updated = { ...answersRef.current, [questionId]: optionIdx };
        answersRef.current = updated;
        setAnswers(updated);
        // immediate backup on every answer
        saveBackup({
            sessionId: sessionIdRef.current,
            subjects: chosenSubjects,
            questions: questionsRef.current,
            answers: updated,
            flags: flagsRef.current,
            timeLeft: timeLeftRef.current,
        });
    }

    function toggleFlag(questionId: string) {
        const updated = { ...flagsRef.current };
        if (updated[questionId]) delete updated[questionId];
        else updated[questionId] = true;
        flagsRef.current = updated;
        setFlags(updated);
    }

    function navigateTo(idx: number) {
        setCurrentIdx(idx);
        const subj = questions[idx]?.subject;
        if (subj && subj !== activeTab) setActiveTab(subj);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOADING
    // ─────────────────────────────────────────────────────────────────────────

    if (pageState === "loading") {
        return (
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-6">
                {loadError ? (
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 max-w-md w-full text-center space-y-4">
                        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-gray-900">{loadError}</h3>
                        <Link href="/general/dashboard/mock/jamb" className="inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
                            ← Back to subject selection
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-5 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-lg font-extrabold text-gray-900">Preparing your exam…</p>
                            <p className="text-sm text-gray-500 mt-1">Loading 180 questions across 4 subjects</p>
                        </div>
                        <svg className="w-7 h-7 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                )}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESULTS
    // ─────────────────────────────────────────────────────────────────────────

    if (pageState === "results" && results) {
        const { totalScore, subjectResults, timeSpent, wasAutoSubmitted } = results;
        const perfLabel =
            totalScore >= 300 ? "Excellent" :
            totalScore >= 250 ? "Good" :
            totalScore >= 200 ? "Average" : "Needs Improvement";
        const perfColors =
            totalScore >= 300 ? "text-green-700 bg-green-50 border-green-200" :
            totalScore >= 250 ? "text-blue-700 bg-blue-50 border-blue-200" :
            totalScore >= 200 ? "text-amber-700 bg-amber-50 border-amber-200" :
            "text-red-700 bg-red-50 border-red-200";
        const perfBar =
            totalScore >= 300 ? "bg-green-500" :
            totalScore >= 250 ? "bg-blue-500" :
            totalScore >= 200 ? "bg-amber-500" : "bg-red-500";

        const mins = Math.floor(timeSpent / 60);
        const secs = timeSpent % 60;

        return (
            <div className="min-h-screen bg-[#f0f2f5]">

                <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-sm font-bold text-gray-900">JAMB Simulator</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-sm font-semibold text-gray-500">Results</span>
                        </div>
                        {wasAutoSubmitted && (
                            <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
                                Auto-submitted
                            </span>
                        )}
                    </div>
                </header>

                <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

                    {/* Total score hero */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Total Score</p>
                        <div className="flex items-end justify-center gap-1">
                            <span className="text-7xl font-extrabold text-gray-900 leading-none">
                                {Math.round(totalScore)}
                            </span>
                            <span className="text-2xl font-bold text-gray-400 mb-2">/400</span>
                        </div>
                        {/* Score bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2.5 mt-4 mx-auto max-w-xs">
                            <div
                                className={`h-2.5 rounded-full transition-all ${perfBar}`}
                                style={{ width: `${Math.min(100, (totalScore / 400) * 100)}%` }}
                            />
                        </div>
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold mt-4 ${perfColors}`}>
                            {perfLabel}
                        </div>
                        <p className="text-xs text-gray-400 mt-3">
                            Time: {mins}m {secs}s
                            {wasAutoSubmitted ? " · Auto-submitted when timer expired" : " · Manually submitted"}
                        </p>
                    </div>

                    {/* Subject breakdown table */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-900">Subject Breakdown</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {subjectResults.map((s) => {
                                const accuracy = Math.round((s.correct / s.total) * 100);
                                return (
                                    <div key={s.subject} className="px-6 py-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{s.subject}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{s.correct}/{s.total} correct · {accuracy}% accuracy</p>
                                            </div>
                                            <p className="text-xl font-extrabold text-gray-900">{Math.round(s.score)}<span className="text-xs text-gray-400 font-normal">/100</span></p>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div
                                                className="h-1.5 rounded-full bg-blue-500"
                                                style={{ width: `${accuracy}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Predicted performance */}
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <h3 className="text-sm font-bold text-blue-900">Predicted JAMB Performance</h3>
                        </div>
                        <p className="text-sm text-blue-700 leading-relaxed">
                            {totalScore >= 300
                                ? "Outstanding performance. With this score, you are likely to exceed cut-off marks for most competitive universities in Nigeria. Keep maintaining this level."
                                : totalScore >= 250
                                ? "Strong performance. You are on track to meet most university cut-offs. Focus on weak subjects to push past 300 and improve your options."
                                : totalScore >= 200
                                ? "Average performance. You may meet some cut-offs but need improvement. Identify the topics where you lost marks and study them consistently."
                                : "This score needs significant improvement before sitting JAMB. Prioritise consistent practice across all 4 subjects, especially English Language."}
                        </p>
                    </div>

                    {/* CTAs */}
                    <div className="grid sm:grid-cols-3 gap-3">
                        <button
                            onClick={() => { setReviewSubject("all"); setPageState("review"); }}
                            className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-bold text-sm py-3 rounded-xl transition-colors"
                        >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Review Wrong Answers
                        </button>
                        <Link
                            href="/general/dashboard/mock/jamb"
                            onClick={clearBackup}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Try Again
                        </Link>
                        <Link
                            href="/general/dashboard/practice"
                            className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-bold text-sm py-3 rounded-xl transition-colors"
                        >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                            Study Weak Topics
                        </Link>
                    </div>

                </main>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REVIEW
    // ─────────────────────────────────────────────────────────────────────────

    if (pageState === "review" && results) {
        const wrongQuestions = questions.filter(
            (q) => answers[q.id] !== undefined && answers[q.id] !== q.correct_answer
        );
        const filtered =
            reviewSubject === "all"
                ? wrongQuestions
                : wrongQuestions.filter((q) => q.subject === reviewSubject);

        return (
            <div className="min-h-screen bg-[#f0f2f5]">

                <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => setPageState("results")}
                                aria-label="Back to results"
                                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="h-4 w-px bg-gray-200" />
                            <span className="text-sm font-bold text-gray-900">Review Wrong Answers</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-500">
                            {wrongQuestions.length} incorrect
                        </span>
                    </div>
                </header>

                <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

                    {/* Subject filter tabs */}
                    <div className="flex flex-wrap gap-2">
                        {["all", ...allSubjects].map((subj) => {
                            const count =
                                subj === "all"
                                    ? wrongQuestions.length
                                    : wrongQuestions.filter((q) => q.subject === subj).length;
                            return (
                                <button
                                    key={subj}
                                    onClick={() => setReviewSubject(subj)}
                                    className={`text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all ${
                                        reviewSubject === subj
                                            ? "border-blue-500 bg-blue-50 text-blue-700"
                                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    {subj === "all" ? "All" : subj} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {filtered.length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
                            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-sm font-bold text-gray-900">No wrong answers here!</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {reviewSubject === "all"
                                    ? "You answered every question correctly."
                                    : `Great performance in ${reviewSubject}.`}
                            </p>
                        </div>
                    ) : (
                        filtered.map((q) => {
                            const studentAns = answers[q.id]!;
                            return (
                                <div key={q.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                    {/* Card header */}
                                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-600">{q.subject}</span>
                                        {q.topic && (
                                            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                                {q.topic}
                                            </span>
                                        )}
                                    </div>

                                    {/* Question text */}
                                    <div className="px-5 py-4">
                                        {q.image_url && (
                                            <div className="mb-3">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={q.image_url}
                                                    alt="Question diagram"
                                                    className="w-full max-h-56 object-contain rounded-lg border border-gray-200 bg-white"
                                                />
                                            </div>
                                        )}
                                        <p className="text-sm font-semibold text-gray-900 leading-relaxed mb-4">
                                            {q.text}
                                        </p>

                                        {/* Options */}
                                        <div className="space-y-2">
                                            {q.options.map((opt, idx) => {
                                                const isStudentChoice = idx === studentAns;
                                                const isCorrect = idx === q.correct_answer;
                                                let cls = "border-gray-200 bg-gray-50 text-gray-500";
                                                if (isCorrect)
                                                    cls = "border-green-500 bg-green-50 text-green-800";
                                                else if (isStudentChoice)
                                                    cls = "border-red-400 bg-red-50 text-red-700";
                                                return (
                                                    <div
                                                        key={opt.label}
                                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 text-sm ${cls}`}
                                                    >
                                                        <span className={`font-bold flex-shrink-0 w-5 ${isStudentChoice && !isCorrect ? "line-through" : ""}`}>
                                                            {opt.label}.
                                                        </span>
                                                        <span className={`flex-1 leading-snug ${isStudentChoice && !isCorrect ? "line-through" : ""}`}>
                                                            {opt.text}
                                                        </span>
                                                        {isCorrect && (
                                                            <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                        {isStudentChoice && !isCorrect && (
                                                            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Explanation */}
                                        {q.explanation && (
                                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                                                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1.5">
                                                    Explanation
                                                </p>
                                                <p className="text-sm text-blue-800 leading-relaxed">
                                                    {q.explanation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </main>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXAM HALL
    // ─────────────────────────────────────────────────────────────────────────

    if (pageState !== "exam" || !currentQ) return null;

    const tabQuestions = questionsForSubject(activeTab);
    const tabStartIdx = subjectStartIndex(activeTab);

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col">

            {/* ── Top bar ── */}
            <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
                <div className="max-w-screen-xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-3">

                    {/* Left: branding */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-white hidden sm:block">JAMB Simulator</span>
                    </div>

                    {/* Centre: timer */}
                    <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border font-mono font-bold text-base transition-colors ${
                        timeLeft < 300
                            ? "bg-red-950 border-red-700 text-red-400"
                            : timeLeft < 600
                            ? "bg-amber-950 border-amber-700 text-amber-400"
                            : "bg-gray-800 border-gray-700 text-white"
                    }`}>
                        {timeLeft < 300 && (
                            <svg className="w-4 h-4 flex-shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {formatTime(timeLeft)}
                    </div>

                    {/* Right: progress + submit */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-gray-400 hidden sm:block">
                            {totalAnswered}/{questions.length}
                        </span>
                        <button
                            onClick={() => setShowSubmitModal(true)}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-colors min-h-[44px]"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            Submit
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Subject tabs ── */}
            <nav className="bg-gray-900 border-b border-gray-800 sticky top-14 z-20 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="max-w-screen-xl mx-auto px-3 sm:px-5 flex gap-0">
                    {allSubjects.map((subj) => {
                        const answered = answeredCountForSubject(subj);
                        const total = subj === "English Language" ? 60 : 40;
                        const isActive = activeTab === subj;
                        return (
                            <button
                                key={subj}
                                onClick={() => {
                                    setActiveTab(subj);
                                    navigateTo(subjectStartIndex(subj));
                                }}
                                className={`flex-shrink-0 px-3 sm:px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                                    isActive
                                        ? "border-blue-500 text-blue-400"
                                        : answered === total
                                        ? "border-transparent text-green-400 hover:text-green-300"
                                        : "border-transparent text-gray-400 hover:text-gray-200"
                                }`}
                            >
                                {subj} ({answered}/{total})
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* ── Body ── */}
            <div className="flex-1 max-w-screen-xl mx-auto w-full px-3 sm:px-5 py-5 flex gap-5">

                {/* ── Navigator sidebar (desktop) ── */}
                <aside className="hidden lg:flex flex-col gap-4 w-56 flex-shrink-0">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 sticky top-[112px]">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                            {activeTab.length > 20 ? activeTab.slice(0, 18) + "…" : activeTab}
                        </p>
                        <div className="grid grid-cols-5 gap-1.5">
                            {tabQuestions.map((q, relIdx) => {
                                const absIdx = tabStartIdx + relIdx;
                                const isAnswered = answers[q.id] !== undefined;
                                const isFlagged = flags[q.id];
                                const isCurrent = absIdx === currentIdx;
                                let cls = "bg-gray-700 hover:bg-gray-600 text-gray-300";
                                if (isCurrent) cls = "bg-blue-600 text-white ring-1 ring-blue-400 ring-offset-1 ring-offset-gray-800";
                                else if (isFlagged) cls = "bg-yellow-500 hover:bg-yellow-400 text-gray-900";
                                else if (isAnswered) cls = "bg-emerald-700 hover:bg-emerald-600 text-white";
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => navigateTo(absIdx)}
                                        aria-label={`Go to question ${relIdx + 1}`}
                                        className={`aspect-square min-w-[28px] min-h-[28px] flex items-center justify-center text-[11px] font-bold rounded transition-colors cursor-pointer ${cls}`}
                                    >
                                        {relIdx + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-4 space-y-1.5">
                            {[
                                { color: "bg-emerald-700", label: "Answered" },
                                { color: "bg-yellow-500", label: "Flagged" },
                                { color: "bg-gray-700", label: "Unanswered" },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded ${item.color}`} />
                                    <span className="text-[10px] text-gray-400">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* ── Question panel ── */}
                <div className="flex-1 min-w-0 flex flex-col gap-4">

                    {/* Question meta row */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-gray-400 flex-shrink-0">
                                Q{currentIdx + 1}/{questions.length}
                            </span>
                            {currentQ.topic && (
                                <span className="text-[10px] font-semibold text-blue-400 bg-blue-950 border border-blue-800 px-2 py-0.5 rounded-full truncate">
                                    {currentQ.topic}
                                </span>
                            )}
                        </div>
                        {/* Flag button */}
                        <button
                            onClick={() => toggleFlag(currentQ.id)}
                            aria-label={flags[currentQ.id] ? "Remove flag from this question" : "Flag this question for review"}
                            aria-pressed={!!flags[currentQ.id]}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors flex-shrink-0 cursor-pointer min-h-[36px] ${
                                flags[currentQ.id]
                                    ? "bg-yellow-500 border-yellow-500 text-gray-900"
                                    : "border-gray-700 text-gray-400 hover:border-yellow-500 hover:text-yellow-400"
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill={flags[currentQ.id] ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                            </svg>
                            {flags[currentQ.id] ? "Flagged" : "Flag"}
                        </button>
                    </div>

                    {/* Question card */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1">
                        <div className="px-5 sm:px-6 py-5">
                            {currentQ.image_url && (
                                <div className="mb-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={currentQ.image_url}
                                        alt="Question diagram"
                                        className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
                                    />
                                </div>
                            )}
                            {currentQ.passage && (
                                <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg px-4 sm:px-5 py-4 max-h-72 overflow-y-auto">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Passage</p>
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{currentQ.passage}</p>
                                </div>
                            )}
                            {currentQ.instruction && (
                                <p className="text-xs font-medium text-gray-500 italic mb-2">{currentQ.instruction}</p>
                            )}
                            <p className="text-sm sm:text-base font-semibold text-gray-900 leading-relaxed">
                                {currentQ.text}
                            </p>
                        </div>

                        <div className="px-5 sm:px-6 pb-6 space-y-2.5">
                            {currentQ.options.map((opt, idx) => {
                                const isSelected = answers[currentQ.id] === idx;
                                return (
                                    <button
                                        key={opt.label}
                                        onClick={() => recordAnswer(currentQ.id, idx)}
                                        className={`w-full flex items-center gap-3.5 text-left p-3.5 rounded-xl border-2 transition-all ${
                                            isSelected
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/40"
                                        }`}
                                    >
                                        <span className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                                            isSelected
                                                ? "bg-blue-600 border-blue-600 text-white"
                                                : "border-gray-300 text-gray-500"
                                        }`}>
                                            {opt.label}
                                        </span>
                                        <span className={`text-sm font-medium leading-snug flex-1 ${
                                            isSelected ? "text-blue-800 font-semibold" : "text-gray-800"
                                        }`}>
                                            {opt.text}
                                        </span>
                                        {isSelected && (
                                            <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Navigation row */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => currentIdx > 0 && navigateTo(currentIdx - 1)}
                            disabled={currentIdx === 0}
                            className="flex items-center gap-2 border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors min-h-[44px]"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            Prev
                        </button>

                        {/* Mini navigator (mobile only) */}
                        <div className="flex lg:hidden flex-1 gap-1 justify-center overflow-x-auto">
                            {(() => {
                                const relIdx = currentIdx - tabStartIdx;
                                const start = Math.max(0, relIdx - 3);
                                const end = Math.min(tabQuestions.length, start + 7);
                                return tabQuestions.slice(start, end).map((q, i) => {
                                    const absIdx = tabStartIdx + start + i;
                                    const isAns = answers[q.id] !== undefined;
                                    const isFlg = flags[q.id];
                                    const isCur = absIdx === currentIdx;
                                    let cls = "bg-gray-700 text-gray-300";
                                    if (isCur) cls = "bg-blue-600 text-white";
                                    else if (isFlg) cls = "bg-yellow-500 text-gray-900";
                                    else if (isAns) cls = "bg-emerald-700 text-white";
                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => navigateTo(absIdx)}
                                            className={`w-8 h-8 flex-shrink-0 flex items-center justify-center text-[11px] font-bold rounded-lg ${cls}`}
                                        >
                                            {start + i + 1}
                                        </button>
                                    );
                                });
                            })()}
                        </div>

                        <button
                            onClick={() => currentIdx < questions.length - 1 && navigateTo(currentIdx + 1)}
                            disabled={currentIdx === questions.length - 1}
                            className="flex items-center gap-2 border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors min-h-[44px]"
                        >
                            Next
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                </div>
            </div>

            {/* ── Submit confirmation modal ── */}
            {showSubmitModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowSubmitModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-base font-extrabold text-gray-900">Submit Exam?</h3>
                        </div>

                        {totalUnanswered > 0 ? (
                            <p className="text-sm text-gray-500 leading-relaxed">
                                You have{" "}
                                <span className="font-bold text-red-600">{totalUnanswered} unanswered question{totalUnanswered !== 1 ? "s" : ""}</span>
                                {" "}remaining. Unanswered questions score zero.
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500 leading-relaxed">
                                You have answered all 180 questions. Ready to submit?
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                className="border border-gray-200 text-gray-700 font-bold text-sm py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Continue
                            </button>
                            <button
                                onClick={() => submitExam(false)}
                                disabled={submitting}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
                            >
                                {submitting ? "Submitting…" : "Submit Now"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
