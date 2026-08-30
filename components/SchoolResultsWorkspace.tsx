"use client";

import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Eye,
  EyeOff,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import SchoolClassPerformanceReports from "@/components/SchoolClassPerformanceReports";
import type { SchoolDashboardResult } from "@/lib/schoolDashboardService";
import {
  getSchoolAssessmentResults,
  gradeSchoolTheorySubmission,
  updateSchoolResultVisibility,
  type SchoolAssessmentResultDetail,
  type SchoolResultQuestion,
  type SchoolResultSubmission,
} from "@/lib/schoolResultsService";

type ResultFilter = "all" | "pending" | "completed";
type ResultsWorkspaceView = "assessments" | "classes";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function initials(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-52 items-center justify-center gap-3 px-5 py-12 text-sm font-semibold text-[var(--cbt-muted)]" role="status">
      <RefreshCw size={18} className="animate-spin text-[var(--cbt-primary)]" aria-hidden="true" />
      {label}
    </div>
  );
}

function TheoryGradingPanel({
  submission,
  theoryQuestions,
  canGrade,
  onSaved,
}: {
  submission: SchoolResultSubmission;
  theoryQuestions: SchoolResultQuestion[];
  canGrade: boolean;
  onSaved: (updated: SchoolResultSubmission) => void;
}) {
  const [marks, setMarks] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      theoryQuestions.map((question) => [String(question.orderIndex), submission.theoryMarks[String(question.orderIndex)] ?? 0]),
    ),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const theoryTotal = theoryQuestions.reduce(
    (total, question) => total + (marks[String(question.orderIndex)] ?? 0),
    0,
  );

  const saveMarks = async () => {
    setSaving(true);
    setError("");
    try {
      const result = await gradeSchoolTheorySubmission(submission.id, marks);
      onSaved({
        ...submission,
        theoryMarks: marks,
        theoryStatus: "graded",
        finalScore: result.finalScore,
        finalPercentage: result.finalPercentage,
      });
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save the theory marks.");
    } finally {
      setSaving(false);
    }
  };

  if (theoryQuestions.length === 0) {
    return <p className="border-t border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">No active theory questions were found for this assessment.</p>;
  }

  return (
    <section className="border-t border-amber-200 bg-amber-50/70 p-4 sm:p-5" aria-label={`Theory grading for ${submission.studentName}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-extrabold text-amber-950">Theory answers</h4>
          <p className="mt-1 text-xs leading-5 text-amber-900/75">Award each theory question between 0 and 1 mark.</p>
        </div>
        <p className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-950">
          Theory total: <span className="tabular-nums">{formatScore(theoryTotal)} / {theoryQuestions.length}</span>
        </p>
      </div>

      <fieldset disabled={saving || !canGrade} className="mt-4 space-y-4">
        {theoryQuestions.map((question) => {
          const key = String(question.orderIndex);
          const answer = submission.theoryAnswers[key]?.trim();
          const inputId = `theory-mark-${submission.id}-${question.id}`;
          return (
            <article key={question.id} className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-amber-700">Question {question.orderIndex + 1}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-900">{question.text}</p>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Pupil answer</p>
                {answer ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{answer}</p> : <p className="mt-2 text-sm italic text-slate-500">No answer provided.</p>}
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <label htmlFor={inputId} className="text-sm font-bold text-slate-700">Mark awarded</label>
                <div className="flex items-center gap-2">
                  <input
                    id={inputId}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={1}
                    step={0.5}
                    value={marks[key] ?? 0}
                    onChange={(event) => {
                      const parsed = Number(event.target.value);
                      const value = Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0;
                      setMarks((current) => ({ ...current, [key]: value }));
                    }}
                    className="min-h-11 w-24 rounded-xl border border-slate-300 bg-white px-3 text-center text-base font-extrabold tabular-nums text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  <span className="text-sm font-semibold text-slate-500">/ 1</span>
                </div>
              </div>
            </article>
          );
        })}
      </fieldset>

      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
      {!canGrade && <p className="mt-4 rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-amber-900">Your School role can view these answers but cannot grade them.</p>}
      {canGrade && (
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={saveMarks} disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--cbt-primary)] px-5 text-sm font-extrabold text-white hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:w-auto">
            {saving ? <RefreshCw size={17} className="animate-spin" aria-hidden="true" /> : <CheckCircle2 size={17} aria-hidden="true" />}
            {saving ? "Saving marks…" : submission.theoryStatus === "graded" ? "Update final result" : "Save final result"}
          </button>
        </div>
      )}
    </section>
  );
}

function SubmissionCard({
  submission,
  theoryQuestions,
  questionCount,
  canGrade,
  onSaved,
}: {
  submission: SchoolResultSubmission;
  theoryQuestions: SchoolResultQuestion[];
  questionCount: number;
  canGrade: boolean;
  onSaved: (updated: SchoolResultSubmission) => void;
}) {
  const [expanded, setExpanded] = useState(submission.theoryStatus === "pending");
  const hasTheory = submission.theoryStatus !== "not_required";
  const pending = submission.theoryStatus === "pending";
  const displayScore = submission.finalScore ?? submission.automaticScore;
  const displayPercentage = submission.finalPercentage ?? submission.automaticPercentage;

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--cbt-border)] bg-white shadow-sm">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--cbt-primary-soft)] text-xs font-extrabold text-[var(--cbt-primary)]" aria-hidden="true">{initials(submission.studentName)}</span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-extrabold text-slate-950">{submission.studentName}</h3>
              <p className="mt-1 text-xs text-[var(--cbt-muted)]">{submission.admissionNumber ?? "No Pupil ID"} · {submission.className}</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:w-[430px]">
            <div><dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--cbt-muted)]">Submitted</dt><dd className="mt-1 text-xs font-semibold text-slate-700">{formatDate(submission.submittedAt)}</dd></div>
            <div><dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--cbt-muted)]">Status</dt><dd className={`mt-1 text-xs font-extrabold ${pending ? "text-amber-700" : "text-emerald-700"}`}>{pending ? "Needs grading" : submission.theoryStatus === "graded" ? "Graded" : "Auto-graded"}</dd></div>
            <div className="col-span-2 sm:col-span-1"><dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--cbt-muted)]">Final result</dt><dd className="mt-1 text-base font-extrabold tabular-nums text-slate-950">{pending ? "Pending" : `${formatScore(displayScore)} / ${questionCount} · ${Math.round(displayPercentage)}%`}</dd></div>
          </dl>

          {hasTheory && (
            <button type="button" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-xs font-extrabold text-amber-900 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <FileText size={16} aria-hidden="true" />
              {expanded ? "Hide answers" : submission.theoryStatus === "graded" ? "Review grading" : "Grade theory"}
              <ChevronDown size={15} className={`transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
          )}
        </div>

        {pending && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">Automatic objective score: <strong>{formatScore(submission.automaticScore)} marks</strong>. The final result will be calculated after the theory answers are graded.</p>}
      </div>

      {expanded && hasTheory && <TheoryGradingPanel submission={submission} theoryQuestions={theoryQuestions} canGrade={canGrade} onSaved={onSaved} />}
    </article>
  );
}

function ResultsList({
  results,
  loading,
  onOpen,
}: {
  results: SchoolDashboardResult[];
  loading: boolean;
  onOpen: (assessmentId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const visibleResults = results.filter((result) => result.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
      <section className="overflow-hidden rounded-2xl border border-[var(--cbt-border)] bg-white shadow-sm" aria-labelledby="school-results-heading">
        <div className="flex flex-col gap-4 border-b border-[var(--cbt-border)] px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 id="school-results-heading" className="text-base font-bold">Assessment results</h2><p className="mt-1 text-xs leading-5 text-[var(--cbt-muted)]">Open an assessment to review every pupil submission and grade theory answers.</p></div>
          <label className="relative block w-full sm:max-w-xs"><span className="sr-only">Search assessment results</span><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--cbt-muted)]" aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search results" className="min-h-11 w-full rounded-xl border border-[var(--cbt-border)] bg-[var(--cbt-surface-muted)] pl-10 pr-4 text-base outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 sm:text-sm" /></label>
        </div>
        {loading ? <LoadingState label="Loading School results…" /> : visibleResults.length > 0 ? (
          <div className="divide-y divide-[var(--cbt-border)]">
            {visibleResults.map((result) => (
              <button key={result.assessmentId} type="button" onClick={() => onOpen(result.assessmentId)} className="grid min-h-24 w-full gap-4 px-5 py-4 text-left hover:bg-[var(--cbt-surface-muted)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:grid-cols-[minmax(0,1fr)_110px_110px_24px] sm:items-center">
                <span className="min-w-0"><span className="block truncate text-sm font-extrabold text-slate-950">{result.title}</span><span className="mt-1 block text-xs text-[var(--cbt-muted)]">{result.submittedCount} submission{result.submittedCount === 1 ? "" : "s"} · Latest {formatDate(result.latestSubmissionAt)}</span>{result.needsGradingCount > 0 && <span className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold text-amber-800">{result.needsGradingCount} need{result.needsGradingCount === 1 ? "s" : ""} grading</span>}</span>
                <span className="text-xs font-semibold text-[var(--cbt-muted)]">Completed<br /><strong className="mt-1 block text-sm tabular-nums text-slate-900">{result.completedCount}</strong></span>
                <span className="text-xs font-semibold text-[var(--cbt-muted)]">Average<br /><strong className="mt-1 block text-xl tabular-nums text-slate-950">{result.averagePercentage}%</strong></span>
                <ChevronRight size={18} className="hidden text-[var(--cbt-muted)] sm:block" aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : query ? (
          <div className="px-5 py-14 text-center"><Search size={24} className="mx-auto text-slate-300" aria-hidden="true" /><p className="mt-3 text-sm font-bold text-slate-700">No matching assessment results</p><p className="mt-1 text-xs text-[var(--cbt-muted)]">Try a different assessment title.</p></div>
        ) : (
          <div className="px-5 py-14 text-center"><BarChart3 size={26} className="mx-auto text-slate-300" aria-hidden="true" /><p className="mt-3 text-sm font-bold text-slate-700">No results yet</p><p className="mt-1 text-xs text-[var(--cbt-muted)]">Assessments will appear here after pupils submit them.</p></div>
        )}
      </section>

      <aside className="space-y-5">
        <section className="rounded-2xl border border-[var(--cbt-border)] bg-white p-5 shadow-sm" aria-labelledby="grading-flow-heading">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--cbt-primary-soft)] text-[var(--cbt-primary)]"><ClipboardCheck size={19} aria-hidden="true" /></span>
          <h2 id="grading-flow-heading" className="mt-4 text-base font-bold">How grading works</h2>
          <ol className="mt-4 space-y-3 text-xs leading-5 text-[var(--cbt-muted)]">
            <li className="flex gap-3"><span className="font-extrabold text-[var(--cbt-primary)]">1</span><span>Objective questions are scored automatically when a pupil submits.</span></li>
            <li className="flex gap-3"><span className="font-extrabold text-[var(--cbt-primary)]">2</span><span>Theory submissions remain pending until a teacher awards marks.</span></li>
            <li className="flex gap-3"><span className="font-extrabold text-[var(--cbt-primary)]">3</span><span>Pupils only see released, completed results.</span></li>
          </ol>
        </section>
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5" aria-label="Result privacy"><ShieldCheck size={20} className="text-emerald-800" aria-hidden="true" /><p className="mt-3 text-sm font-extrabold text-emerald-950">Result privacy is controlled per assessment</p><p className="mt-1 text-xs leading-5 text-emerald-900/75">Use the visibility switch inside an assessment before pupils can see final scores.</p></section>
      </aside>
    </div>
  );
}

export default function SchoolResultsWorkspace({
  schoolId,
  schoolName,
  results,
  loading,
  canGrade,
  onChanged,
  onAction,
}: {
  schoolId: string;
  schoolName: string;
  results: SchoolDashboardResult[];
  loading: boolean;
  canGrade: boolean;
  onChanged: () => Promise<void>;
  onAction: (message: string) => void;
}) {
  const [workspaceView, setWorkspaceView] = useState<ResultsWorkspaceView>("assessments");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SchoolAssessmentResultDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [filter, setFilter] = useState<ResultFilter>("all");
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [visibilityError, setVisibilityError] = useState("");

  useEffect(() => {
    if (!selectedAssessmentId) return;
    let active = true;
    setDetailLoading(true);
    setDetailError("");
    getSchoolAssessmentResults(schoolId, selectedAssessmentId)
      .then((data) => { if (active) setDetail(data); })
      .catch((caughtError: unknown) => { if (active) setDetailError(caughtError instanceof Error ? caughtError.message : "Could not load these results."); })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [reloadToken, schoolId, selectedAssessmentId]);

  const filteredSubmissions = useMemo(() => {
    if (!detail) return [];
    if (filter === "pending") return detail.submissions.filter((submission) => submission.theoryStatus === "pending");
    if (filter === "completed") return detail.submissions.filter((submission) => submission.theoryStatus !== "pending");
    return detail.submissions;
  }, [detail, filter]);

  if (!selectedAssessmentId) {
    return (
      <div className="space-y-5">
        <nav className="grid grid-cols-2 gap-1 rounded-2xl border border-[var(--cbt-border)] bg-white p-1.5 shadow-sm sm:max-w-lg" aria-label="Results views" data-print-hidden>
          <button type="button" onClick={() => setWorkspaceView("assessments")} aria-current={workspaceView === "assessments" ? "page" : undefined} className={`min-h-11 rounded-xl px-4 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${workspaceView === "assessments" ? "bg-[var(--cbt-primary)] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>Assessment results</button>
          <button type="button" onClick={() => setWorkspaceView("classes")} aria-current={workspaceView === "classes" ? "page" : undefined} className={`min-h-11 rounded-xl px-4 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${workspaceView === "classes" ? "bg-[var(--cbt-primary)] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>Class performance</button>
        </nav>
        {workspaceView === "assessments"
          ? <ResultsList results={results} loading={loading} onOpen={(assessmentId) => { setDetail(null); setFilter("all"); setSelectedAssessmentId(assessmentId); }} />
          : <SchoolClassPerformanceReports schoolId={schoolId} schoolName={schoolName} onAction={onAction} />}
      </div>
    );
  }

  if (detailLoading && !detail) return <LoadingState label="Loading pupil submissions…" />;

  if (detailError && !detail) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900" role="alert">
        <h2 className="text-base font-extrabold">Could not load assessment results</h2>
        <p className="mt-2 text-sm leading-6">{detailError}</p>
        <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setSelectedAssessmentId(null)} className="min-h-11 rounded-xl border border-red-300 bg-white px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500">Back to results</button><button type="button" onClick={() => setReloadToken((value) => value + 1)} className="min-h-11 rounded-xl bg-red-700 px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">Retry</button></div>
      </section>
    );
  }

  if (!detail) return null;

  const completed = detail.submissions.filter((submission) => submission.theoryStatus !== "pending");
  const pendingCount = detail.submissions.length - completed.length;
  const average = completed.length > 0 ? Math.round(completed.reduce((sum, submission) => sum + (submission.finalPercentage ?? submission.automaticPercentage), 0) / completed.length) : 0;
  const highest = completed.length > 0 ? Math.round(Math.max(...completed.map((submission) => submission.finalPercentage ?? submission.automaticPercentage))) : 0;
  const theoryQuestions = detail.questions.filter((question) => question.type === "Theory");

  const saveVisibility = async () => {
    const nextValue = !detail.showResults;
    setVisibilitySaving(true);
    setVisibilityError("");
    try {
      await updateSchoolResultVisibility(schoolId, detail.id, nextValue);
      setDetail((current) => current ? { ...current, showResults: nextValue } : current);
      onAction(nextValue ? "Pupil result visibility enabled" : "Pupil result visibility disabled");
      await onChanged();
    } catch (caughtError: unknown) {
      setVisibilityError(caughtError instanceof Error ? caughtError.message : "Could not update result visibility.");
    } finally {
      setVisibilitySaving(false);
    }
  };

  const handleGraded = (updated: SchoolResultSubmission) => {
    setDetail((current) => current ? { ...current, submissions: current.submissions.map((submission) => submission.id === updated.id ? updated : submission) } : current);
    onAction(`${updated.studentName}'s final result was saved`);
    void onChanged();
  };

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => { setSelectedAssessmentId(null); setDetail(null); setDetailError(""); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[var(--cbt-primary)] hover:bg-[var(--cbt-primary-soft)] focus:outline-none focus:ring-2 focus:ring-emerald-500"><ArrowLeft size={17} aria-hidden="true" />All assessment results</button>

      <section className="overflow-hidden rounded-2xl border border-[var(--cbt-border)] bg-white shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--cbt-primary)]">{detail.subject}</p><h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">{detail.title}</h2><p className="mt-2 text-sm leading-6 text-[var(--cbt-muted)]">{detail.submissions.length} submission{detail.submissions.length === 1 ? "" : "s"} · {detail.questionCount} question{detail.questionCount === 1 ? "" : "s"}</p></div>
          <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:max-w-sm">
            <div className="flex items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${detail.showResults ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>{detail.showResults ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />}</span><div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-slate-900">Pupil result visibility</p><p className="mt-0.5 text-xs leading-5 text-slate-600">{detail.showResults ? "Completed final results are visible to pupils." : "Results remain hidden from pupils."}</p></div><button type="button" role="switch" aria-checked={detail.showResults} aria-label="Allow pupils to see completed results" onClick={saveVisibility} disabled={!canGrade || visibilitySaving} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${detail.showResults ? "bg-emerald-600" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${detail.showResults ? "left-6" : "left-1"}`} /></button></div>
            {visibilitySaving && <p className="mt-3 text-xs font-semibold text-slate-600" role="status">Updating visibility…</p>}
            {visibilityError && <p className="mt-3 text-xs font-semibold text-red-700" role="alert">{visibilityError}</p>}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Assessment result summary">
        {[{ label: "Submissions", value: detail.submissions.length, Icon: UserRound }, { label: "Completed", value: completed.length, Icon: CheckCircle2 }, { label: "Average", value: completed.length ? `${average}%` : "—", Icon: BarChart3 }, { label: "Highest", value: completed.length ? `${highest}%` : "—", Icon: ClipboardCheck }].map(({ label, value, Icon }) => <article key={label} className="rounded-2xl border border-[var(--cbt-border)] bg-white p-4 shadow-sm sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[var(--cbt-muted)]">{label}</p><p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-950">{value}</p></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--cbt-primary-soft)] text-[var(--cbt-primary)]"><Icon size={17} aria-hidden="true" /></span></div></article>)}
      </section>

      {pendingCount > 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 sm:px-5"><p className="font-extrabold">{pendingCount} theory submission{pendingCount === 1 ? " needs" : "s need"} grading</p><p className="mt-1 text-xs leading-5 text-amber-900/80">Open each pending pupil card, review their answers, and save the final result.</p></div>}

      <section aria-labelledby="pupil-submissions-heading">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="pupil-submissions-heading" className="text-base font-bold text-slate-950">Pupil submissions</h2><p className="mt-1 text-xs text-[var(--cbt-muted)]">{filteredSubmissions.length} shown</p></div><div className="grid grid-cols-3 gap-1 rounded-xl border border-[var(--cbt-border)] bg-white p-1" aria-label="Filter pupil submissions">{([{ id: "all", label: "All" }, { id: "pending", label: `Pending (${pendingCount})` }, { id: "completed", label: `Completed (${completed.length})` }] as const).map((option) => <button key={option.id} type="button" onClick={() => setFilter(option.id)} aria-pressed={filter === option.id} className={`min-h-10 rounded-lg px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${filter === option.id ? "bg-[var(--cbt-primary)] text-white" : "text-slate-600 hover:bg-slate-100"}`}>{option.label}</button>)}</div></div>

        {filteredSubmissions.length > 0 ? <div className="space-y-4">{filteredSubmissions.map((submission) => <SubmissionCard key={submission.id} submission={submission} theoryQuestions={theoryQuestions} questionCount={detail.questionCount} canGrade={canGrade} onSaved={handleGraded} />)}</div> : <div className="rounded-2xl border border-[var(--cbt-border)] bg-white px-5 py-14 text-center"><FileText size={25} className="mx-auto text-slate-300" aria-hidden="true" /><p className="mt-3 text-sm font-bold text-slate-700">No submissions in this filter</p><p className="mt-1 text-xs text-[var(--cbt-muted)]">Choose another filter to continue.</p></div>}
      </section>
    </div>
  );
}
