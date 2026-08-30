"use client";

import {
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Search,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getSchoolPerformanceReport,
  type PupilAssessmentPerformance,
  type SchoolClassAssessmentPerformance,
  type SchoolClassPerformance,
  type SchoolPerformanceReport,
  type SchoolPupilPerformance,
} from "@/lib/schoolReportsService";

const ALL = "all";

type PerformanceMetrics = {
  pupilCount: number;
  expectedCount: number;
  submittedCount: number;
  completedCount: number;
  pendingCount: number;
  passedCount: number;
  averagePercentage: number | null;
  highestPercentage: number | null;
  lowestPercentage: number | null;
  submissionRate: number;
  passRate: number;
};

type VisiblePupil = {
  classId: string;
  className: string;
  pupil: SchoolPupilPerformance;
  assessmentResult: PupilAssessmentPerformance | null;
};

function formatPercentage(value: number | null): string {
  if (value === null) return "—";
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function selectedMetrics(
  schoolClass: SchoolClassPerformance,
  assessmentId: string,
): SchoolClassAssessmentPerformance | SchoolClassPerformance | null {
  if (assessmentId === ALL) return schoolClass;
  return schoolClass.assessments.find((assessment) => assessment.assessmentId === assessmentId) ?? null;
}

function aggregateMetrics(classes: SchoolClassPerformance[], assessmentId: string): PerformanceMetrics {
  const rows = classes
    .map((schoolClass) => ({ schoolClass, metrics: selectedMetrics(schoolClass, assessmentId) }))
    .filter((row): row is { schoolClass: SchoolClassPerformance; metrics: SchoolClassAssessmentPerformance | SchoolClassPerformance } => Boolean(row.metrics));
  const completedCount = rows.reduce((sum, row) => sum + row.metrics.completedCount, 0);
  const expectedCount = rows.reduce((sum, row) => sum + ("expectedCount" in row.metrics ? row.metrics.expectedCount : row.metrics.expectedSubmissions), 0);
  const submittedCount = rows.reduce((sum, row) => sum + row.metrics.submittedCount, 0);
  const passedCount = rows.reduce((sum, row) => sum + row.metrics.passedCount, 0);
  const averages = rows.filter((row) => row.metrics.averagePercentage !== null);
  const highestValues = rows.map((row) => row.metrics.highestPercentage).filter((value): value is number => value !== null);
  const lowestValues = rows.map((row) => row.metrics.lowestPercentage).filter((value): value is number => value !== null);
  const averagePercentage = completedCount > 0
    ? Math.round((averages.reduce((sum, row) => sum + (row.metrics.averagePercentage ?? 0) * row.metrics.completedCount, 0) / completedCount) * 10) / 10
    : null;

  return {
    pupilCount: assessmentId === ALL
      ? rows.reduce((sum, row) => sum + row.schoolClass.studentCount, 0)
      : expectedCount,
    expectedCount,
    submittedCount,
    completedCount,
    pendingCount: rows.reduce((sum, row) => sum + row.metrics.pendingCount, 0),
    passedCount,
    averagePercentage,
    highestPercentage: highestValues.length > 0 ? Math.max(...highestValues) : null,
    lowestPercentage: lowestValues.length > 0 ? Math.min(...lowestValues) : null,
    submissionRate: expectedCount > 0 ? Math.round((submittedCount / expectedCount) * 100) : 0,
    passRate: completedCount > 0 ? Math.round((passedCount / completedCount) * 100) : 0,
  };
}

function csvCell(value: string | number | null): string {
  let safeValue = value === null ? "" : String(value);
  if (/^[\s]*[=+\-@]/.test(safeValue)) safeValue = `'${safeValue}`;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function filenamePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "school";
}

function statusLabel(result: PupilAssessmentPerformance | null): string {
  if (!result || result.status === "not_submitted") return "Not submitted";
  if (result.status === "pending") return "Theory pending";
  return "Completed";
}

function statusClasses(result: PupilAssessmentPerformance | null): string {
  if (!result || result.status === "not_submitted") return "border-slate-200 bg-slate-100 text-slate-700";
  if (result.status === "pending") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function LoadingState() {
  return (
    <div className="flex min-h-64 items-center justify-center gap-3 rounded-2xl border border-[var(--cbt-border)] bg-white px-5 py-12 text-sm font-semibold text-[var(--cbt-muted)]" role="status">
      <RefreshCw size={18} className="animate-spin text-[var(--cbt-primary)]" aria-hidden="true" />
      Preparing class performance…
    </div>
  );
}

export default function SchoolClassPerformanceReports({
  schoolId,
  schoolName,
  onAction,
}: {
  schoolId: string;
  schoolName: string;
  onAction: (message: string) => void;
}) {
  const [report, setReport] = useState<SchoolPerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedClassId, setSelectedClassId] = useState(ALL);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(ALL);
  const [pupilQuery, setPupilQuery] = useState("");

  useEffect(() => {
    let active = true;
    getSchoolPerformanceReport(schoolId)
      .then((data) => {
        if (!active) return;
        setReport(data);
        setSelectedClassId((current) => {
          if (current === ALL || data.classes.some((schoolClass) => schoolClass.classId === current)) return current;
          return ALL;
        });
      })
      .catch((caughtError: unknown) => {
        if (active) setError(caughtError instanceof Error ? caughtError.message : "Could not load class performance.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [reloadToken, schoolId]);

  const visibleClasses = useMemo(() => {
    if (!report) return [];
    return selectedClassId === ALL
      ? report.classes
      : report.classes.filter((schoolClass) => schoolClass.classId === selectedClassId);
  }, [report, selectedClassId]);

  const assessmentOptions = useMemo(() => {
    if (!report) return [];
    if (selectedClassId === ALL) return report.assessments;
    return report.classes
      .find((schoolClass) => schoolClass.classId === selectedClassId)
      ?.assessments.map((assessment) => ({ id: assessment.assessmentId, title: assessment.title, subject: assessment.subject })) ?? [];
  }, [report, selectedClassId]);

  const activeAssessmentId = selectedAssessmentId === ALL
    || assessmentOptions.some((assessment) => assessment.id === selectedAssessmentId)
    ? selectedAssessmentId
    : ALL;

  const summary = useMemo(
    () => aggregateMetrics(visibleClasses, activeAssessmentId),
    [activeAssessmentId, visibleClasses],
  );

  const visiblePupils = useMemo<VisiblePupil[]>(() => {
    const normalizedQuery = pupilQuery.trim().toLowerCase();
    return visibleClasses.flatMap((schoolClass) => schoolClass.pupils
      .map((pupil) => ({
        classId: schoolClass.classId,
        className: schoolClass.className,
        pupil,
        assessmentResult: activeAssessmentId === ALL
          ? null
          : pupil.assessmentResults.find((result) => result.assessmentId === activeAssessmentId) ?? null,
      }))
      .filter((row) => activeAssessmentId === ALL || row.assessmentResult)
      .filter((row) => !normalizedQuery
        || row.pupil.studentName.toLowerCase().includes(normalizedQuery)
        || row.pupil.admissionNumber?.toLowerCase().includes(normalizedQuery)));
  }, [activeAssessmentId, pupilQuery, visibleClasses]);

  const selectedClassName = selectedClassId === ALL
    ? "All classes"
    : report?.classes.find((schoolClass) => schoolClass.classId === selectedClassId)?.className ?? "Selected class";
  const selectedAssessmentName = activeAssessmentId === ALL
    ? "All assessments"
    : assessmentOptions.find((assessment) => assessment.id === activeAssessmentId)?.title ?? "Selected assessment";

  const downloadCsv = () => {
    if (!report) return;
    const headers = [
      "Class",
      "Pupil",
      "Pupil ID",
      "Assessment",
      "Subject",
      "Status",
      "Objective score",
      "Final score",
      "Final percentage",
      "Submitted at",
    ];
    const rows: Array<Array<string | number | null>> = [];
    for (const schoolClass of visibleClasses) {
      for (const pupil of schoolClass.pupils) {
        const results = pupil.assessmentResults.filter((result) =>
          activeAssessmentId === ALL || result.assessmentId === activeAssessmentId,
        );
        for (const result of results) {
          rows.push([
            schoolClass.className,
            pupil.studentName,
            pupil.admissionNumber,
            result.title,
            result.subject,
            statusLabel(result),
            result.automaticScore,
            result.finalScore,
            result.finalPercentage,
            result.submittedAt,
          ]);
        }
      }
    }

    const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${filenamePart(schoolName)}-${filenamePart(selectedClassName)}-performance.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    onAction(`Downloaded ${rows.length} performance row${rows.length === 1 ? "" : "s"} for Excel`);
  };

  const printReport = () => {
    const cleanup = () => document.body.classList.remove("school-report-printing");
    document.body.classList.add("school-report-printing");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 30_000);
  };

  if (loading && !report) return <LoadingState />;

  if (error && !report) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900" role="alert">
        <h2 className="text-base font-extrabold">Could not load class performance</h2>
        <p className="mt-2 text-sm leading-6">{error}</p>
        <button type="button" onClick={() => { setLoading(true); setError(""); setReloadToken((value) => value + 1); }} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
          <RefreshCw size={16} aria-hidden="true" /> Retry
        </button>
      </section>
    );
  }

  if (!report) return null;

  const summaryCards = [
    { label: activeAssessmentId === ALL ? "Current pupils" : "Expected pupils", value: summary.pupilCount, Icon: UserRound },
    { label: "Class average", value: formatPercentage(summary.averagePercentage), Icon: BarChart3 },
    { label: "Highest / lowest", value: summary.completedCount ? `${formatPercentage(summary.highestPercentage)} / ${formatPercentage(summary.lowestPercentage)}` : "—", Icon: TrendingUp },
    { label: "Submission rate", value: `${summary.submissionRate}%`, detail: `${summary.submittedCount} of ${summary.expectedCount}`, Icon: FileSpreadsheet },
    { label: "Pass rate", value: summary.completedCount ? `${summary.passRate}%` : "—", detail: `${summary.passedCount} of ${summary.completedCount} completed`, Icon: CheckCircle2 },
    { label: "Theory pending", value: summary.pendingCount, detail: "Excluded from final metrics", Icon: RefreshCw },
  ];

  return (
    <div className="space-y-5" data-school-report-print-root>
      <section className="rounded-2xl border border-[var(--cbt-border)] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--cbt-primary)]">Class performance report</p>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">{schoolName}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cbt-muted)]">Compare classes, inspect every pupil, and export the exact filtered results. Pending theory is shown separately and does not affect final performance.</p>
            <p className="mt-2 hidden text-xs font-semibold text-slate-600 school-report-print-only">Generated {formatDate(report.generatedAt)} · Pass mark: 50%</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row" data-print-hidden>
            <button type="button" onClick={downloadCsv} disabled={summary.expectedCount === 0} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-extrabold text-emerald-800 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
              <Download size={17} aria-hidden="true" /> Download for Excel
            </button>
            <button type="button" onClick={printReport} disabled={summary.expectedCount === 0} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--cbt-primary)] px-4 text-sm font-extrabold text-white hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <Printer size={17} aria-hidden="true" /> Print / Save PDF
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-[var(--cbt-border)] pt-5 md:grid-cols-2 xl:grid-cols-[minmax(220px,0.8fr)_minmax(260px,1fr)_auto]" data-print-hidden>
          <label htmlFor="performance-class-filter" className="text-xs font-bold text-slate-700">
            Class
            <select id="performance-class-filter" value={selectedClassId} onChange={(event) => { setSelectedClassId(event.target.value); setSelectedAssessmentId(ALL); setPupilQuery(""); }} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--cbt-border)] bg-white px-3 text-base font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm">
              <option value={ALL}>All classes</option>
              {report.classes.map((schoolClass) => <option key={schoolClass.classId} value={schoolClass.classId}>{schoolClass.className}{schoolClass.classStatus === "archived" ? " (archived)" : ""}</option>)}
            </select>
          </label>
          <label htmlFor="performance-assessment-filter" className="text-xs font-bold text-slate-700">
            Assessment
            <select id="performance-assessment-filter" value={activeAssessmentId} onChange={(event) => setSelectedAssessmentId(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--cbt-border)] bg-white px-3 text-base font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm">
              <option value={ALL}>All assessments</option>
              {assessmentOptions.map((assessment) => <option key={assessment.id} value={assessment.id}>{assessment.title} · {assessment.subject}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => { setLoading(true); setError(""); setReloadToken((value) => value + 1); }} disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2 self-end rounded-xl border border-[var(--cbt-border)] bg-white px-4 text-sm font-bold text-[var(--cbt-primary)] hover:bg-[var(--cbt-primary-soft)] focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-60">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" /> {loading ? "Refreshing…" : "Refresh report"}
          </button>
        </div>

        <div className="mt-5 hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 school-report-print-only">
          {selectedClassName} · {selectedAssessmentName}
        </div>
        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert" data-print-hidden>{error}</p>}
      </section>

      {visibleClasses.length === 0 ? (
        <section className="rounded-2xl border border-[var(--cbt-border)] bg-white px-5 py-16 text-center shadow-sm">
          <BarChart3 size={28} className="mx-auto text-slate-300" aria-hidden="true" />
          <h2 className="mt-4 text-base font-extrabold text-slate-800">No classes available yet</h2>
          <p className="mt-2 text-sm text-[var(--cbt-muted)]">Create a class, add pupils, and assign an assessment to begin reporting.</p>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Filtered performance summary">
            {summaryCards.map(({ label, value, detail, Icon }) => (
              <article key={label} className="min-w-0 rounded-2xl border border-[var(--cbt-border)] bg-white p-4 shadow-sm school-report-avoid-break">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--cbt-primary-soft)] text-[var(--cbt-primary)]"><Icon size={17} aria-hidden="true" /></span>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cbt-muted)]">{label}</p>
                <p className="mt-1 break-words text-xl font-extrabold tabular-nums text-slate-950">{value}</p>
                {detail && <p className="mt-1 text-[11px] leading-4 text-slate-500">{detail}</p>}
              </article>
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-[var(--cbt-border)] bg-white shadow-sm school-report-avoid-break" aria-labelledby="class-comparison-heading">
            <div className="border-b border-[var(--cbt-border)] px-5 py-5 sm:px-6">
              <h2 id="class-comparison-heading" className="text-base font-extrabold text-slate-950">Class comparison</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--cbt-muted)]">Average is calculated from completed results only.</p>
            </div>
            <div className="divide-y divide-[var(--cbt-border)]">
              {visibleClasses.map((schoolClass) => {
                const metrics = selectedMetrics(schoolClass, activeAssessmentId);
                if (!metrics) return null;
                const average = metrics.averagePercentage ?? 0;
                return (
                  <article key={schoolClass.classId} className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(170px,0.55fr)_minmax(240px,1fr)_repeat(3,minmax(88px,0.32fr))] lg:items-center">
                    <div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-slate-950">{schoolClass.className}</h3><p className="mt-1 text-xs text-[var(--cbt-muted)]">{schoolClass.studentCount} current pupil{schoolClass.studentCount === 1 ? "" : "s"}{schoolClass.classStatus === "archived" ? " · Archived" : ""}</p></div>
                    <div>
                      <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700"><span>Completed average</span><span className="tabular-nums">{formatPercentage(metrics.averagePercentage)}</span></div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${schoolClass.className} average ${formatPercentage(metrics.averagePercentage)}`}><span className="block h-full rounded-full bg-emerald-600" style={{ width: `${Math.max(0, Math.min(100, average))}%` }} /></div>
                    </div>
                    <div><p className="text-[10px] font-bold uppercase tracking-wide text-[var(--cbt-muted)]">Submitted</p><p className="mt-1 text-sm font-extrabold tabular-nums text-slate-900">{metrics.submittedCount} / {"expectedCount" in metrics ? metrics.expectedCount : metrics.expectedSubmissions}</p></div>
                    <div><p className="text-[10px] font-bold uppercase tracking-wide text-[var(--cbt-muted)]">Pass rate</p><p className="mt-1 text-sm font-extrabold tabular-nums text-slate-900">{metrics.completedCount ? `${metrics.passRate}%` : "—"}</p></div>
                    <div><p className="text-[10px] font-bold uppercase tracking-wide text-[var(--cbt-muted)]">Pending</p><p className="mt-1 text-sm font-extrabold tabular-nums text-amber-700">{metrics.pendingCount}</p></div>
                  </article>
                );
              })}
            </div>
          </section>

          {activeAssessmentId === ALL && (
            <section aria-labelledby="assessment-breakdown-heading">
              <div className="mb-4"><h2 id="assessment-breakdown-heading" className="text-base font-extrabold text-slate-950">Assessment breakdown</h2><p className="mt-1 text-xs text-[var(--cbt-muted)]">Grouped under each selected class.</p></div>
              <div className="space-y-4">
                {visibleClasses.map((schoolClass) => (
                  <article key={schoolClass.classId} className="rounded-2xl border border-[var(--cbt-border)] bg-white p-5 shadow-sm school-report-avoid-break sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-extrabold text-slate-950">{schoolClass.className}</h3><span className="text-xs font-semibold text-[var(--cbt-muted)]">{schoolClass.assessments.length} reported assessment{schoolClass.assessments.length === 1 ? "" : "s"}</span></div>
                    {schoolClass.assessments.length > 0 ? <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{schoolClass.assessments.map((assessment) => (
                      <div key={assessment.assessmentId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="truncate text-sm font-extrabold text-slate-900">{assessment.title}</p><p className="mt-1 text-xs text-slate-500">{assessment.subject}</p>
                        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-500">Average</dt><dd className="mt-1 font-extrabold tabular-nums text-slate-900">{formatPercentage(assessment.averagePercentage)}</dd></div><div><dt className="text-slate-500">Submitted</dt><dd className="mt-1 font-extrabold tabular-nums text-slate-900">{assessment.submittedCount} / {assessment.expectedCount}</dd></div><div><dt className="text-slate-500">Pass rate</dt><dd className="mt-1 font-extrabold tabular-nums text-slate-900">{assessment.completedCount ? `${assessment.passRate}%` : "—"}</dd></div><div><dt className="text-slate-500">Pending theory</dt><dd className="mt-1 font-extrabold tabular-nums text-amber-700">{assessment.pendingCount}</dd></div></dl>
                      </div>
                    ))}</div> : <p className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">No started assessments for this class yet.</p>}
                  </article>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="pupil-performance-heading">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div><h2 id="pupil-performance-heading" className="text-base font-extrabold text-slate-950">Individual pupil performance</h2><p className="mt-1 text-xs text-[var(--cbt-muted)]">{visiblePupils.length} pupil record{visiblePupils.length === 1 ? "" : "s"} shown</p></div>
              <label className="relative block w-full sm:max-w-xs" data-print-hidden><span className="sr-only">Search pupils by name or Pupil ID</span><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--cbt-muted)]" aria-hidden="true" /><input type="search" value={pupilQuery} onChange={(event) => setPupilQuery(event.target.value)} placeholder="Search pupil or ID" className="min-h-12 w-full rounded-xl border border-[var(--cbt-border)] bg-white pl-10 pr-4 text-base outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm" /></label>
            </div>

            {visiblePupils.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {visiblePupils.map(({ classId, className, pupil, assessmentResult }) => {
                  const specificAssessment = activeAssessmentId !== ALL;
                  return (
                    <article key={`${classId}:${pupil.membershipId}`} className="rounded-2xl border border-[var(--cbt-border)] bg-white p-5 shadow-sm school-report-avoid-break">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-slate-950">{pupil.studentName}</h3><p className="mt-1 text-xs text-[var(--cbt-muted)]">{pupil.admissionNumber ?? "No Pupil ID"} · {className}</p></div>
                        {specificAssessment && <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusClasses(assessmentResult)}`}>{statusLabel(assessmentResult)}</span>}
                      </div>
                      {specificAssessment ? (
                        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                          <div><dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--cbt-muted)]">Final result</dt><dd className="mt-1 text-lg font-extrabold tabular-nums text-slate-950">{assessmentResult?.status === "completed" ? formatPercentage(assessmentResult.finalPercentage) : "—"}</dd></div>
                          <div><dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--cbt-muted)]">Objective score</dt><dd className="mt-1 text-sm font-extrabold tabular-nums text-slate-900">{assessmentResult?.automaticScore ?? "—"}</dd></div>
                          <div className="col-span-2"><dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--cbt-muted)]">Submitted</dt><dd className="mt-1 text-sm font-bold text-slate-700">{assessmentResult?.submittedAt ? formatDate(assessmentResult.submittedAt) : "Not submitted"}</dd></div>
                        </dl>
                      ) : (
                        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
                          <div><dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--cbt-muted)]">Submitted</dt><dd className="mt-1 text-sm font-extrabold tabular-nums text-slate-900">{pupil.submittedCount} / {pupil.assignedCount}</dd></div>
                          <div><dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--cbt-muted)]">Average</dt><dd className="mt-1 text-sm font-extrabold tabular-nums text-slate-900">{formatPercentage(pupil.averagePercentage)}</dd></div>
                          <div><dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--cbt-muted)]">Highest</dt><dd className="mt-1 text-sm font-extrabold tabular-nums text-slate-900">{formatPercentage(pupil.highestPercentage)}</dd></div>
                          <div><dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--cbt-muted)]">Submission</dt><dd className="mt-1 text-sm font-extrabold tabular-nums text-slate-900">{pupil.submissionRate}%</dd></div>
                          <div><dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--cbt-muted)]">Pending</dt><dd className="mt-1 text-sm font-extrabold tabular-nums text-amber-700">{pupil.pendingCount}</dd></div>
                        </dl>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--cbt-border)] bg-white px-5 py-14 text-center shadow-sm">
                <Search size={24} className="mx-auto text-slate-300" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold text-slate-700">No pupil records match this view</p>
                <p className="mt-1 text-xs text-[var(--cbt-muted)]">Try another class, assessment, or pupil search.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
