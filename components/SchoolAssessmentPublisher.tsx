"use client";

import {
  CalendarClock,
  Check,
  CircleAlert,
  Clock3,
  RefreshCw,
  Send,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  publishSchoolAssessment,
  type PublishSchoolAssessmentResult,
} from "@/lib/schoolAssessmentService";
import type {
  SchoolDashboardAssessment,
  SchoolDashboardClass,
} from "@/lib/schoolDashboardService";

type Props = {
  schoolId: string;
  assessment: SchoolDashboardAssessment;
  classes: SchoolDashboardClass[];
  onClose: () => void;
  onPublished: (result: PublishSchoolAssessmentResult) => Promise<void>;
};

type Availability = "now" | "scheduled";

function localDateTimeValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function defaultScheduledTime(): string {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0);
  return localDateTimeValue(date);
}

const inputClass = "mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm";

export default function SchoolAssessmentPublisher({ schoolId, assessment, classes, onClose, onPublished }: Props) {
  const activeClasses = useMemo(() => classes.filter((item) => item.status === "active"), [classes]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Availability>("now");
  const [startsAt, setStartsAt] = useState(defaultScheduledTime);
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);

  const selectedClasses = activeClasses.filter((item) => selectedClassIds.includes(item.id));
  const pupilCount = selectedClasses.reduce((total, item) => total + item.studentCount, 0);
  const allSelected = activeClasses.length > 0 && selectedClassIds.length === activeClasses.length;

  const requestClose = useCallback(() => {
    if (!publishing) onClose();
  }, [onClose, publishing]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  const toggleClass = (classId: string) => {
    setSelectedClassIds((current) => current.includes(classId)
      ? current.filter((id) => id !== classId)
      : [...current, classId]);
    setError("");
  };

  const publish = async () => {
    if (selectedClassIds.length === 0) {
      setError("Select at least one class for this assessment.");
      return;
    }
    if (availability === "scheduled" && !startsAt) {
      setError("Choose when the assessment should become available.");
      return;
    }

    setPublishing(true);
    setError("");
    try {
      const result = await publishSchoolAssessment({
        schoolId,
        assessmentId: assessment.id,
        classIds: selectedClassIds,
        availability,
        startsAt: availability === "scheduled" ? startsAt : null,
        endsAt: endsAt || null,
      });
      await onPublished(result);
      onClose();
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not publish the assessment.");
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[115] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation">
      <section className="flex max-h-dvh w-full flex-col overflow-hidden rounded-t-3xl border border-white/70 bg-[var(--cbt-background)] shadow-2xl sm:max-h-[min(820px,calc(100dvh-32px))] sm:max-w-3xl sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="publish-assessment-heading">
        <header className="shrink-0 border-b border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-4 py-4 text-white sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-emerald-100"><Send size={20} aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-200/75">Assign and publish</p>
              <h2 id="publish-assessment-heading" className="mt-1 truncate text-lg font-extrabold sm:text-xl">{assessment.title}</h2>
              <p className="mt-1 text-xs leading-5 text-emerald-100/75">Choose who receives this assessment and when it becomes available.</p>
            </div>
            <button type="button" onClick={requestClose} disabled={publishing} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-wait disabled:opacity-50" aria-label="Close publishing dialog"><X size={19} aria-hidden="true" /></button>
          </div>
        </header>

        <div className="cbt-scrollbar flex-1 overflow-y-auto">
          <div className="space-y-5 p-4 sm:p-6">
            {error && <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800" role="alert"><CircleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{error}</span></div>}

            <section className="rounded-2xl border border-[var(--cbt-border)] bg-white p-4 shadow-sm sm:p-5" aria-labelledby="assessment-summary-heading">
              <h3 id="assessment-summary-heading" className="text-sm font-extrabold text-slate-950">Assessment summary</h3>
              <dl className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3"><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Subject</dt><dd className="mt-1 truncate text-xs font-extrabold text-slate-900">{assessment.subject}</dd></div>
                <div className="rounded-xl bg-slate-50 p-3"><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Questions</dt><dd className="mt-1 text-xs font-extrabold tabular-nums text-slate-900">{assessment.questionCount}</dd></div>
                <div className="rounded-xl bg-slate-50 p-3"><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Duration</dt><dd className="mt-1 text-xs font-extrabold tabular-nums text-slate-900">{assessment.durationMinutes > 0 ? `${assessment.durationMinutes} min` : "No timer"}</dd></div>
              </dl>
            </section>

            <fieldset className="overflow-hidden rounded-2xl border border-[var(--cbt-border)] bg-white shadow-sm" disabled={publishing} aria-labelledby="publish-classes-heading">
              <div className="flex flex-col gap-3 border-b border-[var(--cbt-border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div><h3 id="publish-classes-heading" className="text-sm font-extrabold text-slate-950">Select classes</h3><p className="mt-1 text-xs leading-5 text-slate-600">Every active pupil in the selected classes will receive it.</p></div>
                {activeClasses.length > 0 && <button type="button" onClick={() => { setSelectedClassIds(allSelected ? [] : activeClasses.map((item) => item.id)); setError(""); }} className="min-h-11 rounded-xl px-3 text-xs font-extrabold text-emerald-800 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">{allSelected ? "Clear all" : "Select all"}</button>}
              </div>
              {activeClasses.length > 0 ? (
                <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                  {activeClasses.map((item) => {
                    const selected = selectedClassIds.includes(item.id);
                    return <label key={item.id} className={`flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-emerald-500 ${selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}><input type="checkbox" checked={selected} onChange={() => toggleClass(item.id)} className="sr-only" /><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${selected ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-transparent"}`} aria-hidden="true"><Check size={17} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold text-slate-900">{item.name}</span><span className="mt-1 block text-xs text-slate-600">{item.studentCount} pupil{item.studentCount === 1 ? "" : "s"}{item.gradeLevel ? ` · ${item.gradeLevel}` : ""}</span></span></label>;
                  })}
                </div>
              ) : <div className="p-5"><div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"><CircleAlert size={18} className="mt-1 shrink-0" aria-hidden="true" /><p>Create an active class before publishing this assessment.</p></div></div>}
            </fieldset>

            <fieldset className="overflow-hidden rounded-2xl border border-[var(--cbt-border)] bg-white shadow-sm" disabled={publishing || activeClasses.length === 0} aria-labelledby="publish-availability-heading">
              <div className="border-b border-[var(--cbt-border)] px-4 py-4 sm:px-5"><h3 id="publish-availability-heading" className="text-sm font-extrabold text-slate-950">Availability</h3><p className="mt-1 text-xs leading-5 text-slate-600">Times use this device&apos;s local timezone.</p></div>
              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                <button type="button" onClick={() => { setAvailability("now"); setError(""); }} aria-pressed={availability === "now"} className={`min-h-24 rounded-xl border p-4 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${availability === "now" ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}><span className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><Send size={17} className="text-emerald-700" aria-hidden="true" />Available now</span><span className="mt-2 block text-xs leading-5 text-slate-600">Pupils can access it as soon as publishing finishes.</span></button>
                <button type="button" onClick={() => { setAvailability("scheduled"); setError(""); }} aria-pressed={availability === "scheduled"} className={`min-h-24 rounded-xl border p-4 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${availability === "scheduled" ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}><span className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><CalendarClock size={17} className="text-emerald-700" aria-hidden="true" />Schedule for later</span><span className="mt-2 block text-xs leading-5 text-slate-600">Set a future date and time for access.</span></button>
              </div>
              <div className="grid gap-4 border-t border-[var(--cbt-border)] bg-slate-50/70 p-4 sm:grid-cols-2 sm:p-5">
                {availability === "scheduled" && <label className="text-xs font-bold text-slate-700">Starts <span className="text-red-600" aria-hidden="true">*</span><input type="datetime-local" required value={startsAt} min={localDateTimeValue(new Date())} onChange={(event) => { setStartsAt(event.target.value); setError(""); }} className={inputClass} /></label>}
                <label className={`text-xs font-bold text-slate-700 ${availability === "now" ? "sm:col-span-2" : ""}`}>Closes <span className="font-normal text-slate-500">(optional)</span><input type="datetime-local" value={endsAt} min={availability === "scheduled" ? startsAt : localDateTimeValue(new Date())} onChange={(event) => { setEndsAt(event.target.value); setError(""); }} className={inputClass} /><span className="mt-1.5 block text-[11px] font-normal leading-4 text-slate-500">Leave blank to keep the assessment open until you close it manually.</span></label>
              </div>
            </fieldset>

            {selectedClassIds.length > 0 && <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6 ${pupilCount > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}><Users size={18} className="mt-1 shrink-0" aria-hidden="true" /><p><strong>{selectedClassIds.length} class{selectedClassIds.length === 1 ? "" : "es"}</strong> selected with <strong>{pupilCount} active pupil{pupilCount === 1 ? "" : "s"}</strong>.{pupilCount === 0 ? " You can publish, but no pupil will receive it until they are added to those classes." : ""}</p></div>}
          </div>
        </div>

        <footer className="shrink-0 border-t border-[var(--cbt-border)] bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={requestClose} disabled={publishing} className="min-h-12 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-50">Cancel</button>
            <button type="button" onClick={publish} disabled={publishing || activeClasses.length === 0} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--cbt-primary)] px-6 text-sm font-extrabold text-white hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">{publishing ? <RefreshCw size={17} className="animate-spin" aria-hidden="true" /> : availability === "now" ? <Send size={17} aria-hidden="true" /> : <Clock3 size={17} aria-hidden="true" />}{publishing ? "Publishing…" : availability === "now" ? "Publish now" : "Schedule assessment"}</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
