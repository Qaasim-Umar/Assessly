"use client";

import {
  Archive,
  ArchiveRestore,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Copy,
  FilePlus2,
  FileText,
  Home,
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  Library,
  Menu,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  TrendingUp,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import DashboardWorkspaceSwitcher from "@/components/DashboardWorkspaceSwitcher";
import SchoolAssessmentCreator from "@/components/SchoolAssessmentCreator";
import SchoolAssessmentPublisher from "@/components/SchoolAssessmentPublisher";
import SchoolOnboarding from "@/components/SchoolOnboarding";
import SchoolResultsWorkspace from "@/components/SchoolResultsWorkspace";
import SchoolTermManager from "@/components/SchoolTermManager";
import {
  getActiveSchoolContext,
  updateSchoolProfile,
  type AdminSchoolContext,
  type School,
  type SchoolProfileInput,
} from "@/lib/schoolService";
import {
  archiveSchoolClass,
  createSchoolClass,
  getSchoolDashboardData,
  restoreSchoolClass,
  updateSchoolClass,
  type SchoolDashboardAssessment,
  type SchoolDashboardClass,
  type SchoolDashboardData,
  type SchoolDashboardStudent,
  type SchoolDashboardTerm,
} from "@/lib/schoolDashboardService";
import type {
  PublishSchoolAssessmentResult,
  SchoolAssessmentDraftResult,
} from "@/lib/schoolAssessmentService";
import {
  createSchoolPupil,
  generatePupilPin,
  resetSchoolPupilPin,
  updateSchoolPupil,
} from "@/lib/schoolPupilService";

type ViewId = "overview" | "assessments" | "results" | "classes" | "students" | "settings";

const navigation: { id: ViewId; label: string; Icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", Icon: Home },
  { id: "assessments", label: "Assessments", Icon: ClipboardCheck },
  { id: "results", label: "Results", Icon: BarChart3 },
  { id: "classes", label: "Classes", Icon: BookOpen },
  { id: "students", label: "Students", Icon: Users },
];

const emptyDashboardData: SchoolDashboardData = {
  metrics: {
    activeStudents: 0,
    activeClasses: 0,
    liveAssessments: 0,
    pupilsInLiveAssessments: 0,
    averagePercentage: 0,
    submittedResults: 0,
    needsGrading: 0,
  },
  assessments: [],
  results: [],
  classes: [],
  terms: [],
  students: [],
};

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-[var(--cbt-sidebar)] shadow-sm"><ClipboardCheck size={21} strokeWidth={2.2} aria-hidden="true" /></span>
      <span><span className="block text-[17px] font-extrabold tracking-tight text-white">Assessly</span><span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100/65">School dashboard</span></span>
    </div>
  );
}

function initials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AD";
}

function formatDashboardDate(value: string | null): string {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function EmptyState({
  Icon,
  title,
  description,
}: {
  Icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cbt-primary-soft)] text-[var(--cbt-primary)]">
        <Icon size={22} aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-extrabold">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[var(--cbt-muted)]">{description}</p>
    </div>
  );
}

function DataLoadingState({ label = "Loading School data…" }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 px-5 py-12 text-sm font-semibold text-[var(--cbt-muted)]" role="status">
      <RefreshCw size={18} className="animate-spin text-[var(--cbt-primary)]" aria-hidden="true" />
      {label}
    </div>
  );
}

function Sidebar({ activeView, onNavigate, onSwitchToIndividual, onAction, schoolName, adminName, mobile = false }: { activeView: ViewId; onNavigate: (id: ViewId) => void; onSwitchToIndividual: () => void; onAction: (message: string) => void; schoolName: string; adminName: string; mobile?: boolean }) {
  return (
    <aside className={`${mobile ? "flex h-full w-[min(304px,86vw)]" : "fixed inset-y-0 left-0 hidden w-[272px] lg:flex"} z-40 flex-col bg-[var(--cbt-sidebar)] px-4 py-5 text-white`}>
      <div className="px-2"><BrandMark /></div>
      <div className="mt-7"><DashboardWorkspaceSwitcher workspace="school" schoolName={schoolName} onSwitch={onSwitchToIndividual} inverted /></div>
      <nav className="mt-7 flex-1" aria-label="School dashboard navigation">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100/50">School</p>
        <div className="mt-2 space-y-1">
          {navigation.map(({ id, label, Icon }) => {
            const active = activeView === id;
            return (
              <button key={id} type="button" aria-current={active ? "page" : undefined} onClick={() => onNavigate(id)} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300 ${active ? "bg-white text-[var(--cbt-sidebar)] shadow-sm" : "text-emerald-50/75 hover:bg-white/10 hover:text-white"}`}>
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      <div className="space-y-1 border-t border-white/10 pt-4">
        <button type="button" aria-current={activeView === "settings" ? "page" : undefined} onClick={() => onNavigate("settings")} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-300 ${activeView === "settings" ? "bg-white text-[var(--cbt-sidebar)] shadow-sm" : "text-emerald-50/70 hover:bg-white/10 hover:text-white"}`}><Settings size={18} aria-hidden="true" />Settings</button>
        <button type="button" onClick={() => onAction("Opening help and support")} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-emerald-50/70 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"><CircleHelp size={18} aria-hidden="true" />Help and support</button>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-extrabold text-[var(--cbt-sidebar)]">{initials(adminName)}</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{adminName}</span><span className="block truncate text-[11px] text-emerald-100/60">School administrator</span></span>
        <MoreHorizontal size={18} className="text-emerald-100/55" aria-hidden="true" />
      </div>
    </aside>
  );
}

function MetricCard({ label, value, note, Icon, loading = false }: {
  label: string;
  value: string | number;
  note: string;
  Icon: LucideIcon;
  loading?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-[var(--cbt-border)] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-semibold text-[var(--cbt-muted)]">{label}</p><p className={`mt-2 text-2xl font-extrabold tracking-tight tabular-nums ${loading ? "animate-pulse text-slate-300" : ""}`}>{loading ? "—" : value}</p></div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cbt-primary-soft)] text-[var(--cbt-primary)]"><Icon size={19} strokeWidth={1.9} aria-hidden="true" /></span>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[var(--cbt-muted)]"><TrendingUp size={14} className="text-[var(--cbt-primary)]" aria-hidden="true" />{note}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: SchoolDashboardAssessment["status"] }) {
  const styles = {
    Live: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Scheduled: "border-amber-200 bg-amber-50 text-amber-800",
    Published: "border-sky-200 bg-sky-50 text-sky-800",
    Draft: "border-slate-200 bg-white text-slate-600",
    Closed: "border-slate-300 bg-slate-100 text-slate-700",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}>{status === "Live" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />}{status}</span>;
}

function AssessmentList({ items, onAction, onPublish }: {
  items: SchoolDashboardAssessment[];
  onAction: (message: string) => void;
  onPublish?: (assessment: SchoolDashboardAssessment) => void;
}) {
  return (
    <div className="divide-y divide-[var(--cbt-border)]">
      {items.map((assessment) => (
        <article key={assessment.id} className="grid gap-4 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_170px_110px_minmax(44px,150px)] md:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-extrabold">{assessment.title}</h3><StatusBadge status={assessment.status} /></div>
            <p className="mt-1 text-xs text-[var(--cbt-muted)]">{assessment.subject} · {assessment.classNames.length > 0 ? assessment.classNames.join(", ") : "No class assigned"}</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--cbt-muted)] md:block"><CalendarDays size={15} className="md:hidden" aria-hidden="true" /><div><p>{formatDashboardDate(assessment.startsAt)}</p><p className="mt-1 text-[11px] font-normal">{assessment.durationMinutes} min · {assessment.questionCount} questions</p></div></div>
          <div className="text-xs text-[var(--cbt-muted)]"><p className="font-extrabold tabular-nums text-[var(--cbt-ink)]">{assessment.submittedCount} / {assessment.assignedStudentCount}</p><p className="mt-1 text-[11px]">Submitted</p></div>
          {assessment.status === "Draft" && onPublish ? <button type="button" onClick={() => onPublish(assessment)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-800 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"><Send size={15} aria-hidden="true" />Assign &amp; publish</button> : <button type="button" onClick={() => onAction(`Opened options for ${assessment.title}`)} className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--cbt-muted)] hover:bg-[var(--cbt-surface-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500" aria-label={`More options for ${assessment.title}`}><MoreHorizontal size={18} aria-hidden="true" /></button>}
        </article>
      ))}
    </div>
  );
}

function Overview({ data, loading, onNavigate, onAction }: {
  data: SchoolDashboardData;
  loading: boolean;
  onNavigate: (view: ViewId) => void;
  onAction: (message: string) => void;
}) {
  const liveAssessment = data.assessments.find((assessment) => assessment.status === "Live") ?? null;
  const activeClasses = data.classes.filter((item) => item.status === "active");
  const metrics = [
    { label: "Active students", value: data.metrics.activeStudents, note: `Across ${data.metrics.activeClasses} active classes`, Icon: Users },
    { label: "Live assessments", value: data.metrics.liveAssessments, note: `${data.metrics.pupilsInLiveAssessments} pupils assigned`, Icon: Play },
    { label: "Average score", value: `${data.metrics.averagePercentage}%`, note: `${data.metrics.submittedResults} submitted results`, Icon: TrendingUp },
    { label: "Needs grading", value: data.metrics.needsGrading, note: "Theory responses", Icon: FileText },
  ];

  return (
    <>
      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-label="School summary">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} loading={loading} />)}
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.7fr)]">
        <div className="space-y-5">
          {liveAssessment ? (
            <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:p-6" aria-labelledby="live-heading">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-emerald-800"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />Live assessment</span><span className="text-xs font-semibold text-emerald-800">{liveAssessment.submittedCount} of {liveAssessment.assignedStudentCount} submitted</span></div>
                  <h2 id="live-heading" className="cbt-balance mt-3 text-xl font-bold text-emerald-950 sm:text-2xl">{liveAssessment.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-emerald-900/70">{liveAssessment.assignedStudentCount} pupils assigned{liveAssessment.classNames.length > 0 ? ` across ${liveAssessment.classNames.join(", ")}` : ""}. {liveAssessment.endsAt ? `Ends ${formatDashboardDate(liveAssessment.endsAt)}.` : "No closing time set."}</p>
                </div>
                <button type="button" onClick={() => onNavigate("assessments")} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--cbt-primary)] px-5 text-sm font-extrabold text-white hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-emerald-50">View assessment<ChevronRight size={17} aria-hidden="true" /></button>
              </div>
            </section>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-[var(--cbt-border)] bg-white shadow-sm" aria-label="Live assessment status">
              <EmptyState Icon={Play} title="0 live assessments" description="A published assessment will appear here when it is assigned to a class and set live." />
            </section>
          )}
          <section className="overflow-hidden rounded-2xl border border-[var(--cbt-border)] bg-white shadow-sm" aria-labelledby="activity-heading">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--cbt-border)] px-4 py-4 sm:px-5"><div><h2 id="activity-heading" className="text-base font-bold">Assessment activity</h2><p className="mt-0.5 text-xs text-[var(--cbt-muted)]">Live, scheduled, published, draft, and closed assessments</p></div><button type="button" onClick={() => onNavigate("assessments")} className="min-h-10 rounded-lg px-3 text-xs font-bold text-[var(--cbt-primary)] hover:bg-[var(--cbt-primary-soft)] focus:outline-none focus:ring-2 focus:ring-emerald-500">View all</button></div>
            {loading ? <DataLoadingState label="Loading assessments…" /> : data.assessments.length > 0 ? <AssessmentList items={data.assessments.slice(0, 3)} onAction={onAction} /> : <EmptyState Icon={ClipboardCheck} title="No assessments yet" description="School assessments will appear here after they are created." />}
          </section>
        </div>
        <div className="space-y-5">
          <section className="rounded-2xl border border-[var(--cbt-border)] bg-white p-5 shadow-sm" aria-labelledby="quick-actions-heading">
            <h2 id="quick-actions-heading" className="text-base font-bold">Quick actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">{[
              { label: "Create assessment", Icon: FilePlus2, action: () => onNavigate("assessments") },
              { label: "View students", Icon: Users, action: () => onNavigate("students") },
              { label: "View classes", Icon: Library, action: () => onNavigate("classes") },
              { label: "View reports", Icon: BarChart3, action: () => onNavigate("results") },
            ].map(({ label, Icon, action }) => <button key={label} type="button" onClick={action} className="flex min-h-24 flex-col items-start justify-between rounded-xl border border-[var(--cbt-border)] bg-[var(--cbt-surface-muted)] p-3 text-left hover:border-emerald-300 hover:bg-[var(--cbt-primary-soft)] focus:outline-none focus:ring-2 focus:ring-emerald-500"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[var(--cbt-primary)] shadow-sm"><Icon size={17} aria-hidden="true" /></span><span className="text-xs font-extrabold leading-4">{label}</span></button>)}</div>
          </section>
          <section className="overflow-hidden rounded-2xl border border-[var(--cbt-border)] bg-white shadow-sm" aria-labelledby="performance-heading">
            <div className="p-5 pb-0"><h2 id="performance-heading" className="text-base font-bold">Class performance</h2><p className="mt-0.5 text-xs text-[var(--cbt-muted)]">Average from submitted assessments</p></div>
            {loading ? <DataLoadingState label="Loading class performance…" /> : activeClasses.length > 0 ? <div className="space-y-4 p-5">{activeClasses.slice(0, 6).map((item) => <div key={item.id}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-bold">{item.name} <span className="font-normal text-[var(--cbt-muted)]">· {item.studentCount} students</span></span><span className="font-extrabold tabular-nums">{item.averagePercentage}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${item.name} average`} aria-valuenow={item.averagePercentage} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-[var(--cbt-primary)]" style={{ width: `${item.averagePercentage}%` }} /></div></div>)}</div> : <EmptyState Icon={BookOpen} title="0 classes" description="Class performance will show after classes and assessment submissions are available." />}
          </section>
        </div>
      </div>
    </>
  );
}

function AssessmentsView({ schoolId, query, items, classes, terms, loading, canManage, onSaved, onPublished, onAction }: {
  schoolId: string;
  query: string;
  items: SchoolDashboardAssessment[];
  classes: SchoolDashboardClass[];
  terms: SchoolDashboardTerm[];
  loading: boolean;
  canManage: boolean;
  onSaved: (result: SchoolAssessmentDraftResult) => Promise<void>;
  onPublished: (result: PublishSchoolAssessmentResult) => Promise<void>;
  onAction: (message: string) => void;
}) {
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [publishTarget, setPublishTarget] = useState<SchoolDashboardAssessment | null>(null);
  const filtered = items.filter((assessment) => `${assessment.title} ${assessment.subject} ${assessment.classNames.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-[var(--cbt-border)] bg-white shadow-sm" aria-labelledby="all-assessments-heading">
        <div className="flex flex-col gap-3 border-b border-[var(--cbt-border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h2 id="all-assessments-heading" className="text-base font-bold">All assessments</h2><p className="mt-0.5 text-xs text-[var(--cbt-muted)]">{filtered.length} assessment{filtered.length === 1 ? "" : "s"}</p></div>{canManage && <button type="button" onClick={() => setCreatorOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--cbt-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"><Plus size={17} aria-hidden="true" />Create assessment</button>}</div>
        {!canManage && <p className="m-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Your School role can view assessments but cannot create them.</p>}
        {loading ? <DataLoadingState label="Loading assessments…" /> : filtered.length > 0 ? <AssessmentList items={filtered} onAction={onAction} onPublish={canManage ? setPublishTarget : undefined} /> : query ? <EmptyState Icon={Search} title={`No match for “${query}”`} description="Try a subject, class, or different assessment title." /> : <EmptyState Icon={ClipboardCheck} title="No assessments yet" description="Create the first School assessment and add its questions." />}
      </section>
      {creatorOpen && <SchoolAssessmentCreator schoolId={schoolId} terms={terms} onClose={() => setCreatorOpen(false)} onSaved={onSaved} />}
      {publishTarget && <SchoolAssessmentPublisher schoolId={schoolId} assessment={publishTarget} classes={classes} onClose={() => setPublishTarget(null)} onPublished={onPublished} />}
    </>
  );
}

function ClassEditorDialog({ schoolId, terms, schoolClass, onClose, onSaved }: {
  schoolId: string;
  terms: SchoolDashboardTerm[];
  schoolClass: SchoolDashboardClass | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const defaultTermId = terms.find((term) => term.status === "current")?.id ?? terms[0]?.id ?? "";
  const [form, setForm] = useState({
    name: schoolClass?.name ?? "",
    gradeLevel: schoolClass?.gradeLevel ?? "",
    academicTermId: schoolClass?.academicTermId ?? defaultTermId,
    displayOrder: String(schoolClass?.displayOrder ?? 0),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const editing = Boolean(schoolClass);
  const orderedTerms = useMemo(
    () => [...terms].sort((left, right) => Number(right.status === "current") - Number(left.status === "current")),
    [terms],
  );

  useEffect(() => {
    nameInputRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    const displayOrder = Number(form.displayOrder);
    if (!name) {
      setError("Enter a class name.");
      nameInputRef.current?.focus();
      return;
    }
    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      setError("Display order must be a whole number starting from 0.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const input = {
        name,
        gradeLevel: form.gradeLevel.trim() || null,
        academicTermId: form.academicTermId || null,
        displayOrder,
      };
      if (schoolClass) {
        await updateSchoolClass(schoolId, schoolClass.id, input);
      } else {
        await createSchoolClass(schoolId, input);
      }
      await onSaved(editing ? `${name} updated` : `${name} created`);
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save the class.");
      setSaving(false);
    }
  };

  const inputClass = "mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-wait disabled:bg-slate-50";

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="presentation">
      <section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur-xl sm:max-w-xl sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="class-editor-heading">
        <div className="relative overflow-hidden border-b border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-5 py-5 sm:px-6">
          <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-emerald-300/25 blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">Class setup</p>
              <h2 id="class-editor-heading" className="mt-1 text-xl font-extrabold text-emerald-950">{editing ? "Edit class" : "Create a class"}</h2>
              <p className="mt-1 text-xs leading-5 text-emerald-900/70">Use a clear name pupils and teachers will recognize.</p>
            </div>
            <button type="button" onClick={onClose} disabled={saving} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white/80 text-emerald-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-50" aria-label="Close class form"><X size={18} aria-hidden="true" /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <fieldset disabled={saving} className="grid gap-5 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-700 sm:col-span-2">Class name <span className="text-red-600" aria-hidden="true">*</span><input ref={nameInputRef} required maxLength={80} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={inputClass} placeholder="Example: Primary 2 Blue" /></label>
            <label className="text-xs font-bold text-slate-700">Grade or level<input maxLength={80} value={form.gradeLevel} onChange={(event) => setForm((current) => ({ ...current, gradeLevel: event.target.value }))} className={inputClass} placeholder="Example: Primary 2" /></label>
            <label className="text-xs font-bold text-slate-700">Display order<input type="number" min="0" step="1" inputMode="numeric" value={form.displayOrder} onChange={(event) => setForm((current) => ({ ...current, displayOrder: event.target.value }))} className={inputClass} aria-describedby="display-order-help" /><span id="display-order-help" className="mt-1.5 block text-[11px] font-normal leading-4 text-slate-500">Lower numbers appear first.</span></label>
            <label className="text-xs font-bold text-slate-700 sm:col-span-2">Academic term<select value={form.academicTermId} onChange={(event) => setForm((current) => ({ ...current, academicTermId: event.target.value }))} className={inputClass}><option value="">No academic term</option>{orderedTerms.map((term) => <option key={term.id} value={term.id}>{term.name} · {term.academicYear}{term.status === "current" ? " (Current)" : ""}</option>)}</select></label>
          </fieldset>

          {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800" role="alert">{error}</p>}
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={saving} className="min-h-12 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--cbt-primary)] px-5 text-sm font-extrabold text-white hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{saving && <RefreshCw size={17} className="animate-spin" aria-hidden="true" />}{saving ? "Saving class…" : editing ? "Save changes" : "Create class"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ClassManagementView({ schoolId, classes, terms, loading, canManage, canManageTerms, onChanged, onAction }: {
  schoolId: string;
  classes: SchoolDashboardClass[];
  terms: SchoolDashboardTerm[];
  loading: boolean;
  canManage: boolean;
  canManageTerms: boolean;
  onChanged: () => Promise<void>;
  onAction: (message: string) => void;
}) {
  const [filter, setFilter] = useState<"active" | "archived">("active");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolDashboardClass | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<SchoolDashboardClass | null>(null);
  const [workingId, setWorkingId] = useState("");
  const [actionError, setActionError] = useState("");
  const activeCount = classes.filter((item) => item.status === "active").length;
  const archivedCount = classes.filter((item) => item.status === "archived").length;
  const visibleClasses = classes.filter((item) => item.status === filter);

  const openCreate = () => {
    setEditingClass(null);
    setActionError("");
    setEditorOpen(true);
  };

  const openEdit = (schoolClass: SchoolDashboardClass) => {
    setEditingClass(schoolClass);
    setActionError("");
    setEditorOpen(true);
  };

  const handleSaved = async (message: string) => {
    setEditorOpen(false);
    onAction(message);
    await onChanged();
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setWorkingId(archiveTarget.id);
    setActionError("");
    try {
      await archiveSchoolClass(schoolId, archiveTarget.id);
      const name = archiveTarget.name;
      setArchiveTarget(null);
      onAction(`${name} archived`);
      await onChanged();
    } catch (caughtError: unknown) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not archive the class.");
    } finally {
      setWorkingId("");
    }
  };

  const handleRestore = async (schoolClass: SchoolDashboardClass) => {
    setWorkingId(schoolClass.id);
    setActionError("");
    try {
      await restoreSchoolClass(schoolId, schoolClass.id);
      onAction(`${schoolClass.name} restored`);
      await onChanged();
    } catch (caughtError: unknown) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Could not restore the class.");
    } finally {
      setWorkingId("");
    }
  };

  return (
    <>
      <div className="space-y-5">
        <SchoolTermManager schoolId={schoolId} terms={terms} loading={loading} canManage={canManageTerms} onChanged={onChanged} onAction={onAction} />

        <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-md" aria-labelledby="classes-heading">
        <div className="flex flex-col gap-4 border-b border-slate-300 bg-gradient-to-r from-white via-emerald-50 to-emerald-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 id="classes-heading" className="text-base font-extrabold text-slate-950">Class setup</h2><p className="mt-1 text-xs font-medium leading-5 text-slate-700">Create, organize, and safely archive School classes.</p></div>
          {canManage && <button type="button" onClick={openCreate} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--cbt-primary)] px-5 text-sm font-extrabold text-white hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"><Plus size={17} aria-hidden="true" />Add class</button>}
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-300 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="inline-flex w-full rounded-xl border border-slate-300 bg-slate-100 p-1 sm:w-auto" role="group" aria-label="Filter classes">
            <button type="button" onClick={() => setFilter("active")} aria-pressed={filter === "active"} className={`min-h-10 flex-1 rounded-lg px-4 text-xs font-extrabold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:flex-none ${filter === "active" ? "bg-emerald-700 text-white shadow-sm" : "text-slate-700 hover:bg-white hover:text-slate-950"}`}>Active <span className="ml-1 tabular-nums">{activeCount}</span></button>
            <button type="button" onClick={() => setFilter("archived")} aria-pressed={filter === "archived"} className={`min-h-10 flex-1 rounded-lg px-4 text-xs font-extrabold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:flex-none ${filter === "archived" ? "bg-slate-700 text-white shadow-sm" : "text-slate-700 hover:bg-white hover:text-slate-950"}`}>Archived <span className="ml-1 tabular-nums">{archivedCount}</span></button>
          </div>
          <p className="text-xs font-medium text-slate-700">Archived classes can be restored at any time.</p>
        </div>

        {!canManage && <p className="m-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Your School role can view classes but cannot change them.</p>}
        {actionError && <p className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{actionError}</p>}

        {loading ? <DataLoadingState label="Loading classes…" /> : visibleClasses.length > 0 ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
            {visibleClasses.map((item) => (
              <article key={item.id} className={`flex min-h-52 flex-col rounded-2xl border-2 p-4 shadow-sm transition-colors ${item.status === "active" ? "border-emerald-300 bg-white" : "border-slate-300 bg-slate-100"}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ${item.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-700 text-white"}`}><BookOpen size={19} aria-hidden="true" /></span>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] ${item.status === "active" ? "border-emerald-400 bg-emerald-100 text-emerald-950" : "border-slate-400 bg-white text-slate-800"}`}>{item.status}</span>
                </div>
                <h3 className="mt-4 text-base font-extrabold leading-5 text-slate-950">{item.name}</h3>
                <p className="mt-1 min-h-5 text-xs font-medium text-slate-700">{item.gradeLevel ?? "No grade level set"}</p>
                <p className="mt-3 text-[11px] font-bold text-emerald-900">{item.academicTermName ? `${item.academicTermName} · ${item.academicYear}` : "No academic term"}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-300 pt-3 text-xs"><span><span className="block font-extrabold tabular-nums text-slate-950">{item.studentCount}</span><span className="text-[11px] font-medium text-slate-600">Students</span></span><span><span className="block font-extrabold tabular-nums text-slate-950">{item.averagePercentage}%</span><span className="text-[11px] font-medium text-slate-600">Average</span></span></div>
                {canManage && <div className="mt-auto flex gap-2 pt-4"><button type="button" onClick={() => openEdit(item)} disabled={Boolean(workingId)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-50"><Pencil size={15} aria-hidden="true" />Edit</button>{item.status === "active" ? <button type="button" onClick={() => { setActionError(""); setArchiveTarget(item); }} disabled={Boolean(workingId)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:cursor-wait disabled:opacity-50"><Archive size={15} aria-hidden="true" />Archive</button> : <button type="button" onClick={() => handleRestore(item)} disabled={Boolean(workingId)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-50"><ArchiveRestore size={15} aria-hidden="true" />{workingId === item.id ? "Restoring…" : "Restore"}</button>}</div>}
              </article>
            ))}
          </div>
        ) : <EmptyState Icon={filter === "active" ? BookOpen : Archive} title={filter === "active" ? "0 active classes" : "0 archived classes"} description={filter === "active" ? "Create your first class to begin organizing pupils and assessments." : "Classes you archive will appear here and can be restored."} />}
        </section>
      </div>

      {editorOpen && <ClassEditorDialog schoolId={schoolId} terms={terms} schoolClass={editingClass} onClose={() => setEditorOpen(false)} onSaved={handleSaved} />}

      {archiveTarget && <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"><section className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-5 shadow-2xl sm:p-6" role="alertdialog" aria-modal="true" aria-labelledby="archive-class-heading" aria-describedby="archive-class-description"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800"><Archive size={21} aria-hidden="true" /></span><h2 id="archive-class-heading" className="mt-4 text-xl font-extrabold text-slate-950">Archive {archiveTarget.name}?</h2><p id="archive-class-description" className="mt-2 text-sm leading-6 text-slate-600">No pupils or results will be deleted. The class will stop appearing in active class lists, and pupils in it will not receive School assessments until the class is restored or they are transferred.</p>{actionError && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{actionError}</p>}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setArchiveTarget(null)} disabled={workingId === archiveTarget.id} className="min-h-12 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-50">Keep active</button><button type="button" onClick={confirmArchive} disabled={workingId === archiveTarget.id} autoFocus className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-700 px-5 text-sm font-extrabold text-white hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{workingId === archiveTarget.id && <RefreshCw size={17} className="animate-spin" aria-hidden="true" />}{workingId === archiveTarget.id ? "Archiving…" : "Archive class"}</button></div></section></div>}
    </>
  );
}

type PupilCredentials = {
  displayName: string;
  admissionNumber: string;
  pin: string;
};

function PupilEditorDialog({ schoolId, classes, pupil, onClose, onSaved }: {
  schoolId: string;
  classes: SchoolDashboardClass[];
  pupil: SchoolDashboardStudent | null;
  onClose: () => void;
  onSaved: (message: string, credentials?: PupilCredentials) => Promise<void>;
}) {
  const [form, setForm] = useState({
    displayName: pupil?.displayName ?? "",
    admissionNumber: pupil?.admissionNumber ?? "",
    classId: pupil?.classId ?? "",
    pin: generatePupilPin(),
  });
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const editing = Boolean(pupil);

  useEffect(() => {
    nameInputRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const displayName = form.displayName.trim();
    const admissionNumber = form.admissionNumber.trim().toUpperCase();
    if (!displayName) {
      setError("Enter the pupil's full name.");
      nameInputRef.current?.focus();
      return;
    }
    if (!admissionNumber) {
      setError("Enter a Pupil ID or admission number.");
      return;
    }
    if (!editing && !/^\d{6}$/.test(form.pin)) {
      setError("PIN must contain exactly 6 digits.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (pupil) {
        await updateSchoolPupil({
          schoolId,
          membershipId: pupil.id,
          displayName,
          admissionNumber,
          classId: form.classId || null,
        });
        await onSaved(`${displayName} updated`);
      } else {
        await createSchoolPupil({
          schoolId,
          displayName,
          admissionNumber,
          classId: form.classId || null,
          pin: form.pin,
        });
        await onSaved(`${displayName} added`, { displayName, admissionNumber, pin: form.pin });
      }
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save the pupil.");
      setSaving(false);
    }
  };

  const inputClass = "mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-wait disabled:bg-slate-50 sm:text-sm";

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur-xl sm:max-w-xl sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="pupil-editor-heading">
        <div className="relative overflow-hidden border-b border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-5 py-5 sm:px-6">
          <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-emerald-300/25 blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">Pupil setup</p><h2 id="pupil-editor-heading" className="mt-1 text-xl font-extrabold text-emerald-950">{editing ? "Edit pupil" : "Add a pupil"}</h2><p className="mt-1 text-xs leading-5 text-emerald-900/70">No email is required for a School pupil account.</p></div>
            <button type="button" onClick={onClose} disabled={saving} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white/80 text-emerald-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-50" aria-label="Close pupil form"><X size={18} aria-hidden="true" /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <fieldset disabled={saving} className="grid gap-5 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-700 sm:col-span-2">Pupil full name <span className="text-red-600" aria-hidden="true">*</span><input ref={nameInputRef} required maxLength={120} value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} className={inputClass} placeholder="Example: Amina Bello" autoComplete="off" /></label>
            <label className="text-xs font-bold text-slate-700">Pupil ID <span className="text-red-600" aria-hidden="true">*</span><input required maxLength={80} value={form.admissionNumber} onChange={(event) => setForm((current) => ({ ...current, admissionNumber: event.target.value }))} className={`${inputClass} font-mono uppercase`} placeholder="Example: PRY2-014" autoCapitalize="characters" autoComplete="off" /><span className="mt-1.5 block text-[11px] font-normal leading-4 text-slate-500">This is the pupil&apos;s login ID.</span></label>
            <label className="text-xs font-bold text-slate-700">Class<select value={form.classId} onChange={(event) => setForm((current) => ({ ...current, classId: event.target.value }))} className={inputClass}><option value="">No class yet</option>{classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}{schoolClass.gradeLevel ? ` · ${schoolClass.gradeLevel}` : ""}</option>)}</select><span className="mt-1.5 block text-[11px] font-normal leading-4 text-slate-500">Changing this later transfers the pupil.</span></label>

            {!editing && <label className="text-xs font-bold text-slate-700 sm:col-span-2">Six-digit PIN <span className="text-red-600" aria-hidden="true">*</span><span className="relative block"><input type={showPin ? "text" : "password"} inputMode="numeric" pattern="[0-9]{6}" required maxLength={6} value={form.pin} onChange={(event) => setForm((current) => ({ ...current, pin: event.target.value.replace(/\D/g, "").slice(0, 6) }))} className={`${inputClass} pr-28 font-mono tracking-[0.3em]`} autoComplete="new-password" aria-describedby="pupil-pin-help" /><button type="button" onClick={() => setShowPin((current) => !current)} className="absolute right-1.5 top-[7px] flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" aria-label={showPin ? "Hide PIN" : "Show PIN"}>{showPin ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}{showPin ? "Hide" : "Show"}</button></span><span id="pupil-pin-help" className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-normal leading-4 text-slate-500"><span>Used with the School Code and Pupil ID.</span><button type="button" onClick={() => { setForm((current) => ({ ...current, pin: generatePupilPin() })); setShowPin(true); }} className="min-h-9 rounded-lg px-2 font-bold text-emerald-800 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">Generate another PIN</button></span></label>}
          </fieldset>

          {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800" role="alert">{error}</p>}
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="min-h-12 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-50">Cancel</button><button type="submit" disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--cbt-primary)] px-5 text-sm font-extrabold text-white hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{saving && <RefreshCw size={17} className="animate-spin" aria-hidden="true" />}{saving ? "Saving pupil…" : editing ? "Save changes" : "Add pupil"}</button></div>
        </form>
      </section>
    </div>
  );
}

function ResetPupilPinDialog({ schoolId, pupil, onClose, onSaved }: {
  schoolId: string;
  pupil: SchoolDashboardStudent;
  onClose: () => void;
  onSaved: (credentials: PupilCredentials) => Promise<void>;
}) {
  const [pin, setPin] = useState(generatePupilPin);
  const [showPin, setShowPin] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(pin)) {
      setError("PIN must contain exactly 6 digits.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await resetSchoolPupilPin(schoolId, pupil.id, pin);
      await onSaved({
        displayName: pupil.displayName,
        admissionNumber: pupil.admissionNumber ?? "",
        pin,
      });
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not reset the pupil PIN.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"><form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-5 shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="reset-pin-heading"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800"><KeyRound size={21} aria-hidden="true" /></span><h2 id="reset-pin-heading" className="mt-4 text-xl font-extrabold text-slate-950">Reset {pupil.displayName}&apos;s PIN</h2><p className="mt-2 text-sm leading-6 text-slate-600">The old PIN will stop working. Share the new PIN directly with the pupil or guardian.</p><label className="mt-5 block text-xs font-bold text-slate-700">New six-digit PIN<span className="relative block"><input type={showPin ? "text" : "password"} inputMode="numeric" pattern="[0-9]{6}" required maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-24 font-mono text-base tracking-[0.3em] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" autoComplete="new-password" /><button type="button" onClick={() => setShowPin((current) => !current)} className="absolute right-1.5 top-[7px] flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">{showPin ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}{showPin ? "Hide" : "Show"}</button></span></label><button type="button" onClick={() => { setPin(generatePupilPin()); setShowPin(true); }} className="mt-2 min-h-10 rounded-lg px-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">Generate another PIN</button>{error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="min-h-12 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50">Cancel</button><button type="submit" disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--cbt-primary)] px-5 text-sm font-extrabold text-white hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{saving && <RefreshCw size={17} className="animate-spin" aria-hidden="true" />}{saving ? "Resetting PIN…" : "Reset PIN"}</button></div></form></div>
  );
}

function PupilCredentialsDialog({ schoolCode, credentials, onClose }: {
  schoolCode: string;
  credentials: PupilCredentials;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copyCredentials = async () => {
    const details = [
      `School Code: ${schoolCode || "Ask the school owner"}`,
      `Pupil ID: ${credentials.admissionNumber}`,
      `PIN: ${credentials.pin}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><section className="w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="pupil-credentials-heading"><div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 text-white"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><CheckCircle2 size={22} aria-hidden="true" /></span><h2 id="pupil-credentials-heading" className="mt-4 text-xl font-extrabold">Pupil login details ready</h2><p className="mt-1 text-sm leading-6 text-emerald-100/80">Save these details now. The PIN will not be shown again after you close this card.</p></div><div className="space-y-3 p-5 sm:p-6"><div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4"><p className="text-xs font-bold text-emerald-900">{credentials.displayName}</p><dl className="mt-4 space-y-3"><div className="flex items-center justify-between gap-4"><dt className="text-xs text-slate-600">School Code</dt><dd className="font-mono text-sm font-extrabold tracking-[0.12em] text-slate-950">{schoolCode || "Ask owner"}</dd></div><div className="flex items-center justify-between gap-4"><dt className="text-xs text-slate-600">Pupil ID</dt><dd className="font-mono text-sm font-extrabold text-slate-950">{credentials.admissionNumber}</dd></div><div className="flex items-center justify-between gap-4 border-t border-emerald-200 pt-3"><dt className="text-xs text-slate-600">PIN</dt><dd className="font-mono text-xl font-black tracking-[0.3em] text-emerald-900">{credentials.pin}</dd></div></dl></div><button type="button" onClick={copyCredentials} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-5 text-sm font-extrabold text-emerald-800 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">{copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}{copied ? "Login details copied" : "Copy login details"}</button><button type="button" onClick={onClose} className="min-h-12 w-full rounded-xl bg-[var(--cbt-primary)] px-5 text-sm font-extrabold text-white hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">I have saved the details</button></div></section></div>
  );
}

function StudentManagementView({ schoolId, schoolCode, students, classes, loading, canManage, onChanged, onAction, schoolName }: {
  schoolId: string;
  schoolCode: string;
  students: SchoolDashboardStudent[];
  classes: SchoolDashboardClass[];
  loading: boolean;
  canManage: boolean;
  onChanged: () => Promise<void>;
  onAction: (message: string) => void;
  schoolName: string;
}) {
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPupil, setEditingPupil] = useState<SchoolDashboardStudent | null>(null);
  const [resetPupil, setResetPupil] = useState<SchoolDashboardStudent | null>(null);
  const [credentials, setCredentials] = useState<PupilCredentials | null>(null);
  const activeClasses = classes.filter((item) => item.status === "active");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleStudents = normalizedQuery
    ? students.filter((student) => `${student.displayName} ${student.admissionNumber ?? ""} ${student.className ?? ""}`.toLowerCase().includes(normalizedQuery))
    : students;

  const handleSaved = async (message: string, newCredentials?: PupilCredentials) => {
    setEditorOpen(false);
    onAction(message);
    if (newCredentials) setCredentials(newCredentials);
    await onChanged();
  };

  const handlePinSaved = async (newCredentials: PupilCredentials) => {
    setResetPupil(null);
    setCredentials(newCredentials);
    onAction(`${newCredentials.displayName}'s PIN was reset`);
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-[var(--cbt-border)] bg-white shadow-sm" aria-labelledby="pupils-heading">
        <div className="flex flex-col gap-4 border-b border-[var(--cbt-border)] bg-gradient-to-r from-white via-white to-emerald-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="pupils-heading" className="text-base font-bold">Pupil setup</h2><p className="mt-1 text-xs leading-5 text-[var(--cbt-muted)]">{students.length} active pupil{students.length === 1 ? "" : "s"} in {schoolName}. No pupil email required.</p></div>{canManage && <button type="button" onClick={() => { setEditingPupil(null); setEditorOpen(true); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--cbt-primary)] px-5 text-sm font-extrabold text-white hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"><UserPlus size={17} aria-hidden="true" />Add pupil</button>}</div>

        <div className="border-b border-[var(--cbt-border)] px-4 py-3 sm:px-5"><label className="relative block max-w-md"><span className="sr-only">Search pupils</span><Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--cbt-muted)]" aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, Pupil ID, or class" className="min-h-12 w-full rounded-xl border border-[var(--cbt-border)] bg-[var(--cbt-surface-muted)] pl-10 pr-4 text-base outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 sm:text-sm" /></label></div>

        {!canManage && <p className="m-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Only a School owner or administrator can add pupils, transfer them, or reset their PINs.</p>}

        {loading ? <DataLoadingState label="Loading pupils…" /> : visibleStudents.length > 0 ? <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">{visibleStudents.map((item) => <article key={item.id} className="flex min-h-52 flex-col rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/60 p-4"><div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[var(--cbt-primary)] shadow-sm"><Users size={19} aria-hidden="true" /></span><span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${item.classId ? "border-emerald-200 bg-white text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{item.className ?? "No class"}</span></div><h3 className="mt-4 text-base font-extrabold leading-5 text-slate-900">{item.displayName}</h3><p className="mt-2 flex items-center gap-2 font-mono text-xs font-bold text-emerald-800"><IdCard size={15} aria-hidden="true" />{item.admissionNumber ?? "No Pupil ID"}</p><p className="mt-3 text-xs leading-5 text-[var(--cbt-muted)]">{item.classId ? "Ready for class-assigned assessments." : "Assign a class before scheduling assessments."}</p>{canManage && <div className="mt-auto flex gap-2 pt-4"><button type="button" onClick={() => { setEditingPupil(item); setEditorOpen(true); }} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"><Pencil size={15} aria-hidden="true" />Edit / transfer</button><button type="button" onClick={() => setResetPupil(item)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"><KeyRound size={15} aria-hidden="true" />Reset PIN</button></div>}</article>)}</div> : normalizedQuery ? <EmptyState Icon={Search} title={`No match for “${query}”`} description="Try a pupil name, Pupil ID, or class name." /> : <EmptyState Icon={Users} title="0 pupils" description="Add the first pupil, assign a class, and create their six-digit PIN." />}
      </section>

      {editorOpen && <PupilEditorDialog schoolId={schoolId} classes={activeClasses} pupil={editingPupil} onClose={() => setEditorOpen(false)} onSaved={handleSaved} />}
      {resetPupil && <ResetPupilPinDialog schoolId={schoolId} pupil={resetPupil} onClose={() => setResetPupil(null)} onSaved={handlePinSaved} />}
      {credentials && <PupilCredentialsDialog schoolCode={schoolCode} credentials={credentials} onClose={() => setCredentials(null)} />}
    </>
  );
}

function SchoolSettingsView({ school, canEdit, onSaved }: { school: School; canEdit: boolean; onSaved: (school: School) => void }) {
  const [form, setForm] = useState<SchoolProfileInput>({
    name: school.name,
    short_name: school.short_name,
    school_type: school.school_type,
    description: school.description,
    email: school.email,
    phone: school.phone,
    website: school.website,
    country_code: school.country_code,
    state: school.state,
    city: school.city,
    address_line1: school.address_line1,
    timezone: school.timezone,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const inputClass = "mt-1.5 min-h-11 w-full rounded-xl border border-[var(--cbt-border)] bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

  const setField = <K extends keyof SchoolProfileInput>(key: K, value: SchoolProfileInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Enter the school name.");
      return;
    }

    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await updateSchoolProfile(school.id, form);
      onSaved(updated);
      setSaved(true);
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not update the school profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-[var(--cbt-border)] bg-white shadow-sm" aria-labelledby="school-profile-heading">
      <div className="border-b border-[var(--cbt-border)] px-5 py-4">
        <h2 id="school-profile-heading" className="text-base font-bold">School profile</h2>
        <p className="mt-1 text-xs leading-5 text-[var(--cbt-muted)]">This identity now appears throughout the School workspace. Student and class setup comes next.</p>
      </div>

      <fieldset disabled={saving || !canEdit} className="grid gap-5 p-5 md:grid-cols-2">
        <label className="text-xs font-bold text-slate-700">School name <span className="text-red-600" aria-hidden="true">*</span><input required value={form.name} onChange={(event) => setField("name", event.target.value)} className={inputClass} autoComplete="organization" /></label>
        <label className="text-xs font-bold text-slate-700">Short name<input value={form.short_name ?? ""} onChange={(event) => setField("short_name", event.target.value)} className={inputClass} placeholder="Used in compact headers" /></label>
        <label className="text-xs font-bold text-slate-700">School type<select value={form.school_type} onChange={(event) => setField("school_type", event.target.value as SchoolProfileInput["school_type"])} className={inputClass}><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="combined">Primary and secondary</option><option value="tertiary">Tertiary</option><option value="academy">Academy</option><option value="other">Other</option></select></label>
        <label className="text-xs font-bold text-slate-700">Official email<input type="email" value={form.email ?? ""} onChange={(event) => setField("email", event.target.value)} className={inputClass} autoComplete="email" /></label>
        <label className="text-xs font-bold text-slate-700">Phone<input type="tel" value={form.phone ?? ""} onChange={(event) => setField("phone", event.target.value)} className={inputClass} autoComplete="tel" /></label>
        <label className="text-xs font-bold text-slate-700">Website<input type="url" value={form.website ?? ""} onChange={(event) => setField("website", event.target.value)} className={inputClass} placeholder="https://" autoComplete="url" /></label>
        <label className="text-xs font-bold text-slate-700">State<input value={form.state ?? ""} onChange={(event) => setField("state", event.target.value)} className={inputClass} autoComplete="address-level1" /></label>
        <label className="text-xs font-bold text-slate-700">City<input value={form.city ?? ""} onChange={(event) => setField("city", event.target.value)} className={inputClass} autoComplete="address-level2" /></label>
        <label className="text-xs font-bold text-slate-700 md:col-span-2">Address<input value={form.address_line1 ?? ""} onChange={(event) => setField("address_line1", event.target.value)} className={inputClass} autoComplete="street-address" /></label>
        <label className="text-xs font-bold text-slate-700 md:col-span-2">About the school<textarea value={form.description ?? ""} onChange={(event) => setField("description", event.target.value)} className={`${inputClass} min-h-28 py-3 leading-6`} maxLength={600} /></label>
      </fieldset>

      {!canEdit && <p className="mx-5 mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Only a school owner or administrator can edit this profile.</p>}
      {error && <p className="mx-5 mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
      {saved && <p className="mx-5 mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">School profile saved.</p>}

      {canEdit && <div className="flex justify-end border-t border-[var(--cbt-border)] bg-[var(--cbt-surface-muted)] px-5 py-4"><button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--cbt-primary)] px-5 text-sm font-bold text-white hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{saving ? "Saving…" : "Save school profile"}</button></div>}
    </form>
  );
}

export default function CbtDashboard({ onSwitchToIndividual }: { onSwitchToIndividual: () => void }) {
  const [activeView, setActiveView] = useState<ViewId>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState("");
  const [schoolContext, setSchoolContext] = useState<AdminSchoolContext | null>(null);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<SchoolDashboardData>(emptyDashboardData);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [schoolError, setSchoolError] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const toastTimer = useRef<number | null>(null);
  const codeTimer = useRef<number | null>(null);

  const activeNav = navigation.find((item) => item.id === activeView) ?? navigation[0];
  const activeLabel = activeView === "settings" ? "Settings" : activeNav.label;
  const schoolName = schoolContext?.school.name ?? (schoolLoading ? "Loading school…" : "School");
  const adminName = schoolContext?.admin.displayName ?? "Administrator";
  const schoolCode = schoolContext?.joinCode ?? "";
  const canManageClasses = schoolContext
    ? ["owner", "admin", "teacher"].includes(schoolContext.membership.role)
    : false;
  const canManageTerms = schoolContext
    ? ["owner", "admin"].includes(schoolContext.membership.role)
    : false;
  const canManageAssessments = schoolContext
    ? ["owner", "admin", "teacher"].includes(schoolContext.membership.role)
    : false;
  const canManagePupils = schoolContext
    ? ["owner", "admin"].includes(schoolContext.membership.role)
    : false;
  const pageCopy = useMemo(() => {
    if (activeView === "overview") {
      return { title: "School overview", subtitle: `Monitor assessments, students, and performance for ${schoolName}.` };
    }
    if (activeView === "settings") {
      return { title: "School settings", subtitle: "Manage the identity and contact information used across your School workspace." };
    }
    return { title: activeNav.label, subtitle: `${activeNav.label} data for ${schoolName}.` };
  }, [activeNav.label, activeView, schoolName]);

  useEffect(() => {
    let active = true;

    getActiveSchoolContext()
      .then(async (context) => {
        if (!active) return;
        setSchoolContext(context);
        setSchoolError(context ? "" : "No active school could be loaded.");
        if (context) {
          const data = await getSchoolDashboardData(context.school.id);
          if (active) setDashboardData(data);
        }
      })
      .catch((caughtError: unknown) => {
        if (!active) return;
        setSchoolError(caughtError instanceof Error ? caughtError.message : "Could not load the school workspace.");
      })
      .finally(() => {
        if (active) {
          setSchoolLoading(false);
          setDashboardLoading(false);
        }
      });

    return () => {
      active = false;
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      if (codeTimer.current) window.clearTimeout(codeTimer.current);
    };
  }, []);

  const retrySchoolContext = async () => {
    setSchoolLoading(true);
    setDashboardLoading(true);
    setSchoolError("");
    try {
      const context = await getActiveSchoolContext();
      setSchoolContext(context);
      if (!context) {
        setDashboardData(emptyDashboardData);
        setSchoolError("No active school could be loaded.");
      } else {
        setDashboardData(await getSchoolDashboardData(context.school.id));
      }
    } catch (caughtError: unknown) {
      setSchoolError(caughtError instanceof Error ? caughtError.message : "Could not load the school workspace.");
    } finally {
      setSchoolLoading(false);
      setDashboardLoading(false);
    }
  };

  const refreshDashboardData = async () => {
    if (!schoolContext) return;
    setDashboardLoading(true);
    setSchoolError("");
    try {
      setDashboardData(await getSchoolDashboardData(schoolContext.school.id));
    } catch (caughtError: unknown) {
      setSchoolError(caughtError instanceof Error ? caughtError.message : "Could not refresh the School data.");
    } finally {
      setDashboardLoading(false);
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3200);
  };

  const copySchoolCode = async () => {
    try {
      await navigator.clipboard.writeText(schoolCode);
      setCodeCopied(true);
      showToast("School code copied");
      if (codeTimer.current) window.clearTimeout(codeTimer.current);
      codeTimer.current = window.setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      showToast("Could not copy the school code");
    }
  };

  const navigate = (id: ViewId) => {
    setActiveView(id);
    setSearchQuery("");
    setMobileNavOpen(false);
  };

  if (
    schoolContext
    && !schoolContext.school.onboarding_completed_at
    && (schoolContext.membership.role === "owner" || schoolContext.membership.role === "admin")
  ) {
    return (
      <SchoolOnboarding
        school={schoolContext.school}
        adminName={adminName}
        onBack={onSwitchToIndividual}
        onCompleted={(school) => {
          setSchoolContext((current) => current ? { ...current, school } : current);
          showToast("School profile created");
        }}
      />
    );
  }

  return (
    <div className="cbt-shell min-h-dvh">
      <a href="#school-dashboard-main" className="sr-only z-[100] rounded-lg bg-white px-4 py-3 text-sm font-bold text-[var(--cbt-primary)] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
      <Sidebar activeView={activeView} onNavigate={navigate} onSwitchToIndividual={onSwitchToIndividual} onAction={showToast} schoolName={schoolName} adminName={adminName} />

      {mobileNavOpen && <div className="fixed inset-0 z-50 lg:hidden"><button type="button" className="absolute inset-0 bg-black/55" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" /><div className="relative h-full" role="dialog" aria-modal="true" aria-label="Navigation menu"><Sidebar mobile activeView={activeView} onNavigate={navigate} onSwitchToIndividual={onSwitchToIndividual} onAction={showToast} schoolName={schoolName} adminName={adminName} /><button type="button" onClick={() => setMobileNavOpen(false)} className="absolute left-[min(250px,calc(86vw-54px))] top-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-300" aria-label="Close menu"><X size={20} aria-hidden="true" /></button></div></div>}

      <div className="min-h-dvh lg:pl-[272px]">
        <header className="sticky top-0 z-30 border-b border-[var(--cbt-border)] bg-white/95 backdrop-blur-md">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:min-h-[72px] lg:px-8">
            <button type="button" onClick={() => setMobileNavOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--cbt-border)] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 lg:hidden" aria-label="Open navigation"><Menu size={20} aria-hidden="true" /></button>
            <div className="min-w-0 flex-1 lg:hidden"><DashboardWorkspaceSwitcher workspace="school" schoolName={schoolName} onSwitch={onSwitchToIndividual} /></div>
            {activeView === "assessments" ? <label className="relative hidden max-w-md flex-1 lg:block"><span className="sr-only">Search assessments</span><Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--cbt-muted)]" aria-hidden="true" /><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search assessments" className="h-11 w-full rounded-xl border border-[var(--cbt-border)] bg-[var(--cbt-surface-muted)] pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" /></label> : <div className="hidden flex-1 lg:block" />}
            <div className="ml-auto hidden items-center gap-3 lg:flex"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--cbt-sidebar)] text-xs font-extrabold text-white">{initials(adminName)}</span><span><span className="block text-sm font-bold">{adminName}</span><span className="block text-[11px] text-[var(--cbt-muted)]">School administrator</span></span></div>
          </div>
        </header>

        <main id="school-dashboard-main" className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--cbt-muted)]"><span>School workspace</span><ChevronRight size={14} aria-hidden="true" /><span className="text-[var(--cbt-primary)]">{activeLabel}</span>{activeView !== "settings" && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">Live data</span>}</div><h1 className="cbt-balance mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{pageCopy.title}</h1><p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--cbt-muted)]">{pageCopy.subtitle}</p></div>{activeView !== "settings" && <button type="button" onClick={retrySchoolContext} disabled={schoolLoading || dashboardLoading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--cbt-border)] bg-white px-5 text-sm font-extrabold text-[var(--cbt-primary)] shadow-sm hover:bg-[var(--cbt-primary-soft)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"><RefreshCw size={17} className={schoolLoading || dashboardLoading ? "animate-spin" : ""} aria-hidden="true" />{schoolLoading || dashboardLoading ? "Refreshing…" : "Refresh data"}</button>}</div>

          {schoolError && <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center" role="alert"><span className="flex-1">{schoolError}</span><button type="button" onClick={retrySchoolContext} disabled={schoolLoading} className="min-h-10 rounded-lg border border-red-300 bg-white px-3 text-xs font-bold hover:bg-red-100 disabled:cursor-wait disabled:opacity-60">{schoolLoading ? "Retrying…" : "Retry"}</button></div>}

          {schoolCode && (
            <button
              type="button"
              onClick={copySchoolCode}
              className="mb-5 flex min-h-14 w-full max-w-md items-center gap-3 rounded-xl border border-[var(--cbt-border)] bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-[var(--cbt-surface-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label={`Copy school code ${schoolCode}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cbt-primary-soft)] text-[var(--cbt-primary)]">
                {codeCopied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--cbt-muted)]">School code</span>
                <span className="mt-0.5 block truncate font-mono text-sm font-extrabold tracking-[0.12em] text-[var(--cbt-ink)]">{schoolCode}</span>
              </span>
              <span className="shrink-0 text-xs font-bold text-[var(--cbt-primary)]">{codeCopied ? "Copied" : "Copy"}</span>
            </button>
          )}

          {activeView === "overview" && <Overview data={dashboardData} loading={dashboardLoading} onNavigate={navigate} onAction={showToast} />}
          {activeView === "assessments" && schoolContext && <AssessmentsView schoolId={schoolContext.school.id} query={searchQuery} items={dashboardData.assessments} classes={dashboardData.classes} terms={dashboardData.terms} loading={dashboardLoading} canManage={canManageAssessments} onSaved={async (result) => { await refreshDashboardData(); showToast(`${result.title} saved as a draft with ${result.questionCount} question${result.questionCount === 1 ? "" : "s"}`); }} onPublished={async (result) => { await refreshDashboardData(); showToast(result.status === "Live" ? `Assessment is live for ${result.classCount} class${result.classCount === 1 ? "" : "es"}` : `Assessment scheduled for ${result.classCount} class${result.classCount === 1 ? "" : "es"}`); }} onAction={showToast} />}
          {activeView === "results" && schoolContext && <SchoolResultsWorkspace schoolId={schoolContext.school.id} schoolName={schoolName} results={dashboardData.results} loading={dashboardLoading} canGrade={canManageAssessments} onChanged={refreshDashboardData} onAction={showToast} />}
          {activeView === "classes" && schoolContext && <ClassManagementView schoolId={schoolContext.school.id} classes={dashboardData.classes} terms={dashboardData.terms} loading={dashboardLoading} canManage={canManageClasses} canManageTerms={canManageTerms} onChanged={refreshDashboardData} onAction={showToast} />}
          {activeView === "students" && schoolContext && <StudentManagementView schoolId={schoolContext.school.id} schoolCode={schoolCode} students={dashboardData.students} classes={dashboardData.classes} loading={dashboardLoading} canManage={canManagePupils} onChanged={refreshDashboardData} onAction={showToast} schoolName={schoolName} />}
          {activeView === "settings" && schoolContext && <SchoolSettingsView school={schoolContext.school} canEdit={schoolContext.membership.role === "owner" || schoolContext.membership.role === "admin"} onSaved={(school) => setSchoolContext((current) => current ? { ...current, school } : current)} />}
        </main>
      </div>

      {toast && <div className="fixed bottom-4 left-1/2 z-[80] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-xl bg-[var(--cbt-ink)] px-4 py-3 text-sm font-semibold text-white shadow-2xl sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0" role="status" aria-live="polite"><div className="flex items-center gap-3"><CheckCircle2 size={18} className="shrink-0 text-emerald-300" aria-hidden="true" /><span className="flex-1">{toast}</span><button type="button" onClick={() => setToast("")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300" aria-label="Dismiss notification"><X size={16} aria-hidden="true" /></button></div></div>}
    </div>
  );
}
