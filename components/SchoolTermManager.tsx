"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  createSchoolTerm,
  makeSchoolTermCurrent,
  type SchoolDashboardTerm,
  type SchoolTermInput,
} from "@/lib/schoolDashboardService";

const inputClass = "mt-1.5 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-950 outline-none transition-colors placeholder:text-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/25 disabled:cursor-wait disabled:bg-slate-100 sm:text-sm";

function nextAcademicYear(value: string): string {
  const match = /^(\d{4})\/(\d{4})$/.exec(value);
  if (!match) return value;
  return `${Number(match[1]) + 1}/${Number(match[2]) + 1}`;
}

function suggestedTerm(terms: SchoolDashboardTerm[]): Pick<SchoolTermInput, "academicYear" | "name"> {
  const current = terms.find((term) => term.status === "current") ?? terms[0];
  if (!current) {
    const year = new Date().getFullYear();
    return { academicYear: `${year}/${year + 1}`, name: "First Term" };
  }

  const normalizedName = current.name.trim().toLowerCase();
  if (normalizedName === "first term") return { academicYear: current.academicYear, name: "Second Term" };
  if (normalizedName === "second term") return { academicYear: current.academicYear, name: "Third Term" };
  if (normalizedName === "third term") return { academicYear: nextAcademicYear(current.academicYear), name: "First Term" };
  return { academicYear: current.academicYear, name: "" };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function termDates(term: SchoolDashboardTerm): string {
  if (term.startsOn && term.endsOn) return `${formatDate(term.startsOn)} – ${formatDate(term.endsOn)}`;
  if (term.startsOn) return `Starts ${formatDate(term.startsOn)}`;
  if (term.endsOn) return `Ends ${formatDate(term.endsOn)}`;
  return "Dates not set";
}

function statusLabel(status: SchoolDashboardTerm["status"]): string {
  if (status === "current") return "Current";
  if (status === "draft") return "Upcoming";
  return "Closed";
}

function TermEditorDialog({
  schoolId,
  terms,
  onClose,
  onSaved,
}: {
  schoolId: string;
  terms: SchoolDashboardTerm[];
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const suggestion = suggestedTerm(terms);
  const [form, setForm] = useState<SchoolTermInput>({
    academicYear: suggestion.academicYear,
    name: suggestion.name,
    startsOn: null,
    endsOn: null,
    makeCurrent: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const setField = <K extends keyof SchoolTermInput>(key: K, value: SchoolTermInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Enter a term name.");
      nameRef.current?.focus();
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createSchoolTerm(schoolId, form);
      await onSaved(`${form.name.trim()} created${form.makeCurrent ? " and made current" : " as an upcoming term"}`);
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not create the academic term.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <section className="max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl border border-white/70 bg-white shadow-2xl sm:max-w-xl sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="term-editor-heading">
        <div className="border-b border-emerald-300 bg-emerald-950 px-5 py-5 text-white sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-emerald-300">Academic calendar</p><h2 id="term-editor-heading" className="mt-1 text-xl font-extrabold">Create a new term</h2><p className="mt-1 text-xs leading-5 text-emerald-100/80">Classes and results from previous terms remain unchanged.</p></div>
            <button type="button" onClick={onClose} disabled={saving} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-wait disabled:opacity-50" aria-label="Close term form"><X size={18} aria-hidden="true" /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <fieldset disabled={saving} className="grid gap-5 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-800">Term name <span className="text-red-700" aria-hidden="true">*</span><input ref={nameRef} list="school-term-names" required minLength={2} maxLength={80} value={form.name} onChange={(event) => setField("name", event.target.value)} className={inputClass} placeholder="Example: Second Term" /></label>
            <datalist id="school-term-names"><option value="First Term" /><option value="Second Term" /><option value="Third Term" /><option value="Summer Term" /></datalist>
            <label className="text-xs font-bold text-slate-800">Academic year <span className="text-red-700" aria-hidden="true">*</span><input required inputMode="numeric" pattern="[0-9]{4}/[0-9]{4}" maxLength={9} value={form.academicYear} onChange={(event) => setField("academicYear", event.target.value)} className={inputClass} placeholder="2026/2027" aria-describedby="academic-year-help" /><span id="academic-year-help" className="mt-1.5 block text-[11px] font-normal leading-4 text-slate-600">Use the format 2026/2027.</span></label>
            <label className="text-xs font-bold text-slate-800">Start date <span className="font-normal text-slate-600">(optional)</span><input type="date" value={form.startsOn ?? ""} onChange={(event) => setField("startsOn", event.target.value || null)} className={inputClass} /></label>
            <label className="text-xs font-bold text-slate-800">End date <span className="font-normal text-slate-600">(optional)</span><input type="date" min={form.startsOn ?? undefined} value={form.endsOn ?? ""} onChange={(event) => setField("endsOn", event.target.value || null)} className={inputClass} /></label>
          </fieldset>

          <fieldset disabled={saving} className="mt-6"><legend className="text-xs font-bold text-slate-800">How should this term start?</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className={`flex min-h-24 cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-emerald-500 ${!form.makeCurrent ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-white hover:bg-slate-50"}`}><input type="radio" name="term-status" checked={!form.makeCurrent} onChange={() => setField("makeCurrent", false)} className="mt-1 h-5 w-5 shrink-0 accent-emerald-700" /><span><span className="block text-sm font-extrabold text-slate-950">Upcoming</span><span className="mt-1 block text-xs leading-5 text-slate-600">Save it now and activate it later.</span></span></label>
            <label className={`flex min-h-24 cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-emerald-500 ${form.makeCurrent ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-white hover:bg-slate-50"}`}><input type="radio" name="term-status" checked={form.makeCurrent} onChange={() => setField("makeCurrent", true)} className="mt-1 h-5 w-5 shrink-0 accent-emerald-700" /><span><span className="block text-sm font-extrabold text-slate-950">Make current now</span><span className="mt-1 block text-xs leading-5 text-slate-600">The current term will be marked closed.</span></span></label>
          </div></fieldset>

          {error && <p className="mt-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm leading-6 text-red-900" role="alert">{error}</p>}
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="min-h-12 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-50">Cancel</button><button type="submit" disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-extrabold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{saving ? <RefreshCw size={17} className="animate-spin" aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}{saving ? "Creating term…" : "Create term"}</button></div>
        </form>
      </section>
    </div>
  );
}

export default function SchoolTermManager({
  schoolId,
  terms,
  loading,
  canManage,
  onChanged,
  onAction,
}: {
  schoolId: string;
  terms: SchoolDashboardTerm[];
  loading: boolean;
  canManage: boolean;
  onChanged: () => Promise<void>;
  onAction: (message: string) => void;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [activateTarget, setActivateTarget] = useState<SchoolDashboardTerm | null>(null);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const orderedTerms = [...terms].sort((left, right) => {
    const statusOrder = { current: 0, draft: 1, closed: 2 } as const;
    return statusOrder[left.status] - statusOrder[right.status]
      || right.academicYear.localeCompare(left.academicYear)
      || left.name.localeCompare(right.name);
  });

  const handleCreated = async (message: string) => {
    setEditorOpen(false);
    onAction(message);
    await onChanged();
  };

  const activateTerm = async () => {
    if (!activateTarget) return;
    setWorkingId(activateTarget.id);
    setError("");
    try {
      await makeSchoolTermCurrent(schoolId, activateTarget.id);
      const termName = activateTarget.name;
      setActivateTarget(null);
      onAction(`${termName} is now the current term`);
      await onChanged();
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not make this term current.");
    } finally {
      setWorkingId("");
    }
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-md" aria-labelledby="academic-terms-heading">
        <div className="flex flex-col gap-4 border-b border-slate-300 bg-emerald-950 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-300">School calendar</p><h2 id="academic-terms-heading" className="mt-1 text-lg font-extrabold">Academic terms</h2><p className="mt-1 text-xs leading-5 text-emerald-100/80">Create the next term here, then assign it to new or existing classes.</p></div>
          {canManage && <button type="button" onClick={() => { setError(""); setEditorOpen(true); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-extrabold text-emerald-900 shadow-sm hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-emerald-950"><Plus size={17} aria-hidden="true" />New term</button>}
        </div>

        {!canManage && <p className="m-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">Only a School owner or administrator can create or activate academic terms.</p>}
        {error && !activateTarget && <p className="mx-5 mt-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">{error}</p>}

        {loading ? (
          <div className="flex min-h-36 items-center justify-center gap-3 px-5 py-10 text-sm font-semibold text-slate-700" role="status"><RefreshCw size={18} className="animate-spin text-emerald-700" aria-hidden="true" />Loading academic terms…</div>
        ) : terms.length > 0 ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
            {orderedTerms.map((term) => {
              const current = term.status === "current";
              const upcoming = term.status === "draft";
              return (
                <article key={term.id} className={`flex min-h-44 flex-col rounded-2xl border-2 p-4 shadow-sm ${current ? "border-emerald-500 bg-emerald-50" : upcoming ? "border-sky-300 bg-sky-50" : "border-slate-300 bg-slate-100"}`}>
                  <div className="flex items-start justify-between gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${current ? "bg-emerald-700 text-white" : upcoming ? "bg-sky-700 text-white" : "bg-slate-700 text-white"}`}>{current ? <CheckCircle2 size={18} aria-hidden="true" /> : upcoming ? <Clock3 size={18} aria-hidden="true" /> : <CalendarDays size={18} aria-hidden="true" />}</span><span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] ${current ? "border-emerald-600 bg-white text-emerald-900" : upcoming ? "border-sky-500 bg-white text-sky-900" : "border-slate-500 bg-white text-slate-800"}`}>{statusLabel(term.status)}</span></div>
                  <h3 className="mt-4 text-base font-extrabold text-slate-950">{term.name}</h3><p className="mt-1 text-sm font-bold tabular-nums text-slate-800">{term.academicYear}</p><p className="mt-2 text-xs font-medium text-slate-700">{termDates(term)}</p>
                  {canManage && upcoming && <button type="button" onClick={() => { setError(""); setActivateTarget(term); }} disabled={Boolean(workingId)} className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-white px-3 text-xs font-extrabold text-emerald-800 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-50"><CheckCircle2 size={15} aria-hidden="true" />Make current</button>}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-12 text-center"><CalendarDays size={26} className="mx-auto text-slate-500" aria-hidden="true" /><p className="mt-3 text-sm font-extrabold text-slate-900">No academic terms yet</p><p className="mt-1 text-xs text-slate-600">Create the first term to organize classes and assessments.</p></div>
        )}
      </section>

      {editorOpen && <TermEditorDialog schoolId={schoolId} terms={terms} onClose={() => setEditorOpen(false)} onSaved={handleCreated} />}

      {activateTarget && <div className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><section className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-5 shadow-2xl sm:p-6" role="alertdialog" aria-modal="true" aria-labelledby="activate-term-heading" aria-describedby="activate-term-description"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800"><CheckCircle2 size={21} aria-hidden="true" /></span><h2 id="activate-term-heading" className="mt-4 text-xl font-extrabold text-slate-950">Make {activateTarget.name} current?</h2><p id="activate-term-description" className="mt-2 text-sm leading-6 text-slate-700">The existing current term will be marked closed. Its classes, assessments, pupils, and results will not be deleted.</p>{error && <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">{error}</p>}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setActivateTarget(null); setError(""); }} disabled={workingId === activateTarget.id} className="min-h-12 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50">Cancel</button><button type="button" onClick={activateTerm} disabled={workingId === activateTarget.id} autoFocus className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-extrabold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{workingId === activateTarget.id && <RefreshCw size={17} className="animate-spin" aria-hidden="true" />}{workingId === activateTarget.id ? "Updating term…" : "Make current"}</button></div></section></div>}
    </>
  );
}
