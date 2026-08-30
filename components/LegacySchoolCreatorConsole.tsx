"use client";

import {
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Copy,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminEmailMigrationModal from "@/components/AdminEmailMigrationModal";
import DashboardWorkspaceSwitcher from "@/components/DashboardWorkspaceSwitcher";
import {
  getAdminProfile,
  needsAdminEmailMigration,
  signOut,
} from "@/lib/authService";
import {
  deleteExam,
  getExams,
  updateExamStatus,
  updateShowResults,
  type DbExam,
} from "@/lib/examService";

const statusStyle: Record<string, string> = {
  Live: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Published: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Draft: "border-slate-200 bg-white text-slate-600",
};

const difficultyStyle: Record<string, string> = {
  Simple: "border-emerald-100 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-100 bg-amber-50 text-amber-700",
  Hard: "border-red-100 bg-red-50 text-red-700",
  Mixed: "border-violet-100 bg-violet-50 text-violet-700",
};

const typeStyle: Record<string, string> = {
  Test: "border-emerald-100 bg-emerald-50 text-emerald-700",
  Mock: "border-emerald-100 bg-emerald-50 text-emerald-800",
  Practice: "border-teal-100 bg-teal-50 text-teal-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string) {
  return name ? name.slice(0, 2).toUpperCase() : "TC";
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-[var(--cbt-sidebar)] shadow-sm">
        <ClipboardCheck size={21} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span>
        <span className="block text-[17px] font-extrabold tracking-tight text-white">Assessly</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100/65">
          Individual dashboard
        </span>
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  Icon,
  tone = "primary",
  loading,
}: {
  label: string;
  value: number;
  Icon: LucideIcon;
  tone?: "primary" | "warning" | "violet";
  loading: boolean;
}) {
  const iconStyle = {
    primary: "bg-[var(--cbt-primary-soft)] text-[var(--cbt-primary)]",
    warning: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  }[tone];

  return (
    <article className="rounded-2xl border border-[var(--cbt-border)] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--cbt-muted)]">{label}</p>
          <p
            className={`mt-2 text-2xl font-extrabold tracking-tight tabular-nums ${
              loading ? "animate-pulse text-slate-300" : ""
            }`}
          >
            {loading ? "—" : value.toLocaleString()}
          </p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}>
          <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function Sidebar({
  adminName,
  schoolCode,
  codeCopied,
  examCount,
  onCopyCode,
  onLogout,
  onSwitchToSchool,
  mobile = false,
}: {
  adminName: string;
  schoolCode: string;
  codeCopied: boolean;
  examCount: number;
  onCopyCode: () => void;
  onLogout: () => void;
  onSwitchToSchool?: () => void;
  mobile?: boolean;
}) {
  return (
    <aside
      className={`${
        mobile
          ? "flex h-full w-[min(304px,86vw)]"
          : "fixed inset-y-0 left-0 hidden w-[272px] lg:flex"
      } z-40 flex-col bg-[var(--cbt-sidebar)] px-4 py-5 text-white`}
    >
      <div className="px-2"><BrandMark /></div>

      {onSwitchToSchool && (
        <div className="mt-7">
          <DashboardWorkspaceSwitcher workspace="individual" onSwitch={onSwitchToSchool} inverted />
        </div>
      )}

      <nav className="mt-7 flex-1" aria-label="Individual dashboard navigation">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100/50">
          Individual
        </p>
        <div className="mt-2 space-y-1">
          <Link
            href="/dashboard"
            aria-current="page"
            className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-white px-3 text-sm font-semibold text-[var(--cbt-sidebar)] shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            <LayoutDashboard size={18} strokeWidth={2.2} aria-hidden="true" />
            <span>Exam management</span>
            <span className="ml-auto rounded-full bg-[var(--cbt-primary-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--cbt-primary)]">
              {examCount}
            </span>
          </Link>
          <Link
            href="/dashboard/create"
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-emerald-50/75 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            <FilePlus2 size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>Create exam</span>
          </Link>
        </div>
      </nav>

      <div className="space-y-2 border-t border-white/10 pt-4">
        {schoolCode && !mobile && (
          <button
            type="button"
            onClick={onCopyCode}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-emerald-50/75 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            aria-label={`Copy account code ${schoolCode}`}
          >
            {codeCopied ? (
              <Check size={18} className="text-emerald-300" aria-hidden="true" />
            ) : (
              <Copy size={18} aria-hidden="true" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-100/45">
                Account code
              </span>
              <span className="block truncate font-mono text-xs tracking-wide">
                {codeCopied ? "Copied" : schoolCode}
              </span>
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-emerald-50/70 transition-colors hover:bg-red-500/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          <LogOut size={18} aria-hidden="true" />
          Log out
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-extrabold text-[var(--cbt-sidebar)]">
          {initials(adminName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{adminName || "Teacher Console"}</span>
          <span className="block truncate text-[11px] text-emerald-100/60">Individual creator</span>
        </span>
        <User size={18} className="text-emerald-100/55" aria-hidden="true" />
      </div>
    </aside>
  );
}

function ExamRow({
  exam,
  deleting,
  togglingStatus,
  togglingResults,
  onDelete,
  onEdit,
  onOpenResults,
  onToggleStatus,
  onToggleResults,
}: {
  exam: DbExam;
  deleting: boolean;
  togglingStatus: boolean;
  togglingResults: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onOpenResults: () => void;
  onToggleStatus: () => void;
  onToggleResults: () => void;
}) {
  const resultCount = exam.takes ?? 0;

  return (
    <article className="grid gap-3 rounded-2xl border border-[var(--cbt-border)] bg-white px-4 py-4 shadow-sm sm:gap-4 sm:px-5 sm:py-5 xl:grid-cols-[minmax(0,1fr)_170px_150px_180px] xl:items-center xl:gap-5 xl:rounded-none xl:border-0 xl:bg-transparent xl:shadow-none">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="min-w-0 flex-1 truncate text-sm font-extrabold">{exam.title}</h3>
          <button
            type="button"
            onClick={onToggleStatus}
            disabled={togglingStatus}
            className={`ml-auto inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1 text-[11px] font-bold transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-50 xl:min-h-9 ${statusStyle[exam.status]}`}
            aria-label={`Status: ${exam.status}. Change exam status`}
            title="Click to cycle status"
          >
            {exam.status === "Live" && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
            )}
            {togglingStatus ? "Updating…" : exam.status}
          </button>
        </div>
        <p className="mt-1 text-xs text-[var(--cbt-muted)]">
          {exam.subject} · {exam.class_level}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[var(--cbt-muted)]">
          <span
            className={`rounded-full border px-2.5 py-1 ${
              typeStyle[exam.type] ?? "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            {exam.type}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 ${
              difficultyStyle[exam.difficulty] ?? "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            {exam.difficulty}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileText size={14} aria-hidden="true" />
            {exam.question_count} questions
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={14} aria-hidden="true" />
            {exam.duration ? `${exam.duration} min` : "No duration"}
          </span>
          <span className="hidden sm:inline">Created {formatDate(exam.created_at)}</span>
        </div>
      </div>

      <div
        className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)_44px] gap-2 xl:hidden"
        aria-label="Exam actions"
      >
        <button
          type="button"
          role="switch"
          aria-checked={exam.show_results}
          aria-label="Show results to students"
          onClick={onToggleResults}
          disabled={togglingResults}
          className="inline-flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-xl bg-[var(--cbt-surface-muted)] px-3 text-xs font-bold text-[var(--cbt-ink)] transition-colors hover:bg-[var(--cbt-primary-soft)] focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-50"
        >
          <span className="truncate">Show results</span>
          <span
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
              exam.show_results
                ? "border-[var(--cbt-primary)] bg-[var(--cbt-primary)]"
                : "border-slate-300 bg-slate-200"
            }`}
            aria-hidden="true"
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                exam.show_results ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenResults}
          aria-label={`${resultCount.toLocaleString()} ${resultCount === 1 ? "result" : "results"}. View submissions`}
          className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-[var(--cbt-border)] bg-white px-2 text-xs font-bold text-[var(--cbt-primary)] transition-colors hover:bg-[var(--cbt-primary-soft)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <BarChart3 size={16} className="shrink-0" aria-hidden="true" />
          <span className="truncate">
            {resultCount.toLocaleString()} {resultCount === 1 ? "result" : "results"}
          </span>
        </button>
        <details className="relative">
          <summary
            className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-[var(--cbt-border)] bg-white text-[var(--cbt-muted)] transition-colors hover:bg-[var(--cbt-surface-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500 [&::-webkit-details-marker]:hidden"
            aria-label={`More actions for ${exam.title}`}
          >
            <MoreHorizontal size={18} aria-hidden="true" />
          </summary>
          <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-40 rounded-xl border border-[var(--cbt-border)] bg-white p-1.5 shadow-xl">
            <button
              type="button"
              onClick={(event) => {
                event.currentTarget.closest("details")?.removeAttribute("open");
                onEdit();
              }}
              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-bold text-[var(--cbt-ink)] transition-colors hover:bg-[var(--cbt-surface-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Pencil size={16} aria-hidden="true" />
              Edit exam
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.currentTarget.closest("details")?.removeAttribute("open");
                onDelete();
              }}
              disabled={deleting}
              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-bold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-wait disabled:opacity-50"
            >
              <Trash2 size={16} aria-hidden="true" />
              {deleting ? "Deleting…" : "Delete exam"}
            </button>
          </div>
        </details>
      </div>

      <div className="hidden xl:block">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--cbt-muted)]">
          Show results
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={exam.show_results}
          aria-label="Show results to students"
          onClick={onToggleResults}
          disabled={togglingResults}
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-1.5 pr-3 text-xs font-bold text-[var(--cbt-ink)] transition-colors hover:bg-[var(--cbt-surface-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-50"
        >
          <span
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
              exam.show_results
                ? "border-[var(--cbt-primary)] bg-[var(--cbt-primary)]"
                : "border-slate-300 bg-slate-200"
            }`}
            aria-hidden="true"
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                exam.show_results ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </span>
        </button>
      </div>

      <div className="hidden xl:block">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--cbt-muted)]">Submissions</p>
        <button
          type="button"
          onClick={onOpenResults}
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--cbt-border)] bg-white px-3 text-xs font-bold text-[var(--cbt-primary)] transition-colors hover:bg-[var(--cbt-primary-soft)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <BarChart3 size={16} aria-hidden="true" />
          {resultCount.toLocaleString()} {resultCount === 1 ? "result" : "results"}
        </button>
      </div>

      <div className="hidden gap-2 xl:flex xl:flex-wrap xl:justify-end">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--cbt-border)] bg-white px-3 text-xs font-bold text-[var(--cbt-ink)] transition-colors hover:bg-[var(--cbt-surface-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <Pencil size={15} aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-wait disabled:opacity-50"
        >
          <Trash2 size={15} aria-hidden="true" />
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </article>
  );
}

export default function LegacySchoolCreatorConsole({
  onSwitchToSchool,
}: {
  onSwitchToSchool?: () => void;
}) {
  const router = useRouter();
  const [exams, setExams] = useState<DbExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminName, setAdminName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [togglingResultsId, setTogglingResultsId] = useState<string | null>(null);
  const [showEmailMigration, setShowEmailMigration] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    getAdminProfile()
      .then(async (profile) => {
        if (!profile) {
          router.replace("/dashboard/login");
          return;
        }

        setAdminName(profile.username);
        setSchoolCode(profile.school_code);
        fetchExams(profile.school_code);
        setShowEmailMigration(await needsAdminEmailMigration());
      })
      .catch(() => router.replace("/dashboard/login"));
    // fetchExams is deliberately scoped to the authenticated profile loaded above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function fetchExams(activeSchoolCode?: string) {
    try {
      setLoading(true);
      setError("");
      const code = activeSchoolCode ?? schoolCode;
      const data = await getExams(code);
      setExams(data);
    } catch (caughtError: unknown) {
      setError("Failed to load exams. Check your Supabase connection.");
      console.error(caughtError);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await signOut();
    router.push("/dashboard/login");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(schoolCode);
    setCodeCopied(true);
    window.setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this exam? This cannot be undone.")) return;

    setDeletingId(id);
    try {
      await deleteExam(id);
      setExams((current) => current.filter((exam) => exam.id !== id));
    } catch {
      window.alert("Failed to delete exam.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (exam: DbExam) => {
    const next: "Draft" | "Published" | "Live" =
      exam.status === "Draft"
        ? "Published"
        : exam.status === "Published"
          ? "Live"
          : "Draft";

    setTogglingId(exam.id);
    try {
      await updateExamStatus(exam.id, next);
      setExams((current) =>
        current.map((item) => (item.id === exam.id ? { ...item, status: next } : item)),
      );
    } catch {
      window.alert("Failed to update status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleShowResults = async (exam: DbExam) => {
    const next = !exam.show_results;
    setTogglingResultsId(exam.id);
    setExams((current) =>
      current.map((item) => (item.id === exam.id ? { ...item, show_results: next } : item)),
    );

    try {
      await updateShowResults(exam.id, next);
    } catch {
      setExams((current) =>
        current.map((item) =>
          item.id === exam.id ? { ...item, show_results: !next } : item,
        ),
      );
      window.alert("Could not update. Run the SQL migration in Supabase first.");
    } finally {
      setTogglingResultsId(null);
    }
  };

  const totalQuestions = exams.reduce((total, exam) => total + exam.question_count, 0);
  const published = exams.filter(
    (exam) => exam.status === "Published" || exam.status === "Live",
  ).length;
  const drafts = exams.filter((exam) => exam.status === "Draft").length;

  const sidebarProps = {
    adminName,
    schoolCode,
    codeCopied,
    examCount: exams.length,
    onCopyCode: copyCode,
    onLogout: handleLogout,
    onSwitchToSchool,
  };

  return (
    <div className="cbt-shell min-h-dvh">
      {showEmailMigration && (
        <AdminEmailMigrationModal onClose={() => setShowEmailMigration(false)} />
      )}

      <a
        href="#individual-dashboard-main"
        className="sr-only z-[100] rounded-lg bg-white px-4 py-3 text-sm font-bold text-[var(--cbt-primary)] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      <Sidebar {...sidebarProps} />

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          />
          <div className="relative h-full" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <Sidebar {...sidebarProps} mobile />
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="absolute left-[min(250px,calc(86vw-54px))] top-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
              aria-label="Close menu"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div className="min-h-dvh lg:pl-[272px]">
        <header className="sticky top-0 z-30 border-b border-[var(--cbt-border)] bg-white/95 backdrop-blur-md">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:min-h-[72px] lg:px-8">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--cbt-border)] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} aria-hidden="true" />
            </button>

            {onSwitchToSchool && (
              <div className="min-w-0 flex-1 lg:hidden">
                <DashboardWorkspaceSwitcher workspace="individual" onSwitch={onSwitchToSchool} />
              </div>
            )}

            <div className="hidden min-w-0 flex-1 lg:block">
              <p className="text-sm font-bold">Individual dashboard</p>
              <p className="mt-0.5 text-xs text-[var(--cbt-muted)]">Manage your existing exams and results</p>
            </div>

            <div className="ml-auto hidden items-center gap-2 lg:flex">
              <button
                type="button"
                onClick={() => fetchExams()}
                disabled={loading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--cbt-border)] bg-white px-3 text-xs font-bold text-[var(--cbt-muted)] transition-colors hover:bg-[var(--cbt-surface-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />
                Refresh
              </button>
              <div className="ml-1 flex items-center gap-3 rounded-xl px-2 py-1.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--cbt-sidebar)] text-xs font-extrabold text-white">
                  {initials(adminName)}
                </span>
                <span>
                  <span className="block text-sm font-bold">{adminName || "Teacher Console"}</span>
                  <span className="block text-[11px] text-[var(--cbt-muted)]">Individual creator</span>
                </span>
              </div>
            </div>
          </div>
        </header>

        <main
          id="individual-dashboard-main"
          className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--cbt-muted)]">
                <span>Individual workspace</span>
                <ChevronRight size={14} aria-hidden="true" />
                <span className="text-[var(--cbt-primary)]">Exam management</span>
              </div>
              <h1 className="cbt-balance mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Exam Management</h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--cbt-muted)]">
                Create, review and publish your CBT exams.
              </p>
            </div>
            <Link
              href="/dashboard/create"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--cbt-primary)] px-5 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <Plus size={17} aria-hidden="true" />
              Create new exam
            </Link>
          </div>

          {schoolCode && (
            <button
              type="button"
              onClick={copyCode}
              className="mb-5 flex min-h-14 w-full items-center gap-3 rounded-xl border border-[var(--cbt-border)] bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-[var(--cbt-surface-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500 lg:hidden"
              aria-label={`Copy account code ${schoolCode}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cbt-primary-soft)] text-[var(--cbt-primary)]">
                {codeCopied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--cbt-muted)]">
                  Account code
                </span>
                <span className="mt-0.5 block truncate font-mono text-sm font-extrabold tracking-[0.12em] text-[var(--cbt-ink)]">
                  {schoolCode}
                </span>
              </span>
              <span className="shrink-0 text-xs font-bold text-[var(--cbt-primary)]">
                {codeCopied ? "Copied" : "Copy"}
              </span>
            </button>
          )}

          {error && (
            <div
              className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 sm:flex-row sm:items-center"
              role="alert"
            >
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => fetchExams()}
                className="min-h-11 rounded-lg px-3 text-xs font-bold underline focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          )}

          <section
            className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
            aria-label="Exam summary"
          >
            <MetricCard label="Total exams" value={exams.length} loading={loading} Icon={ClipboardCheck} />
            <MetricCard label="Published / live" value={published} loading={loading} Icon={CheckCircle2} />
            <MetricCard label="Drafts" value={drafts} loading={loading} Icon={FileText} tone="warning" />
            <MetricCard
              label="Total questions"
              value={totalQuestions}
              loading={loading}
              Icon={BookOpen}
              tone="violet"
            />
          </section>

          <section
            className="xl:overflow-hidden xl:rounded-2xl xl:border xl:border-[var(--cbt-border)] xl:bg-white xl:shadow-sm"
            aria-labelledby="all-exams-heading"
          >
            <div className="mb-3 flex items-center justify-between gap-4 xl:mb-0 xl:border-b xl:border-[var(--cbt-border)] xl:px-5 xl:py-4">
              <div>
                <h2 id="all-exams-heading" className="text-base font-bold">All exams</h2>
                <p className="mt-0.5 text-xs text-[var(--cbt-muted)]">
                  {loading ? "Loading your exams…" : `${exams.length} exam${exams.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchExams()}
                disabled={loading}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--cbt-muted)] transition-colors hover:bg-[var(--cbt-surface-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-50 lg:hidden"
                aria-label="Refresh exams"
              >
                <RefreshCw size={17} className={loading ? "animate-spin" : ""} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3 xl:space-y-0 xl:divide-y xl:divide-[var(--cbt-border)]">
              {loading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className={`${index > 0 ? "hidden sm:grid" : "grid"} animate-pulse gap-3 rounded-2xl border border-[var(--cbt-border)] bg-white px-4 py-4 shadow-sm sm:gap-4 sm:px-5 sm:py-5 xl:grid-cols-[minmax(0,1fr)_170px_150px_180px] xl:gap-5 xl:rounded-none xl:border-0 xl:bg-transparent xl:shadow-none`}
                      aria-hidden="true"
                    >
                      <div>
                        <div className="h-4 w-48 rounded bg-slate-100" />
                        <div className="mt-3 h-3 w-32 rounded bg-slate-100" />
                        <div className="mt-4 h-7 w-72 max-w-full rounded bg-slate-100" />
                      </div>
                      <div className="h-11 rounded-xl bg-slate-100 xl:hidden" />
                      <div className="hidden h-11 rounded-xl bg-slate-100 xl:block" />
                      <div className="hidden h-11 rounded-xl bg-slate-100 xl:block" />
                      <div className="hidden h-11 rounded-xl bg-slate-100 xl:block" />
                    </div>
                  ))
                : exams.map((exam) => (
                    <ExamRow
                      key={exam.id}
                      exam={exam}
                      deleting={deletingId === exam.id}
                      togglingStatus={togglingId === exam.id}
                      togglingResults={togglingResultsId === exam.id}
                      onDelete={() => handleDelete(exam.id)}
                      onEdit={() => router.push(`/dashboard/edit/${exam.id}`)}
                      onOpenResults={() => router.push(`/dashboard/results/${exam.id}`)}
                      onToggleStatus={() => handleToggleStatus(exam)}
                      onToggleResults={() => handleToggleShowResults(exam)}
                    />
                  ))}
            </div>

            {!loading && exams.length === 0 && !error && (
              <div className="rounded-2xl border border-[var(--cbt-border)] bg-white px-5 py-16 text-center shadow-sm xl:rounded-none xl:border-0 xl:shadow-none">
                <FilePlus2 size={34} className="mx-auto text-slate-300" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold">No exams yet</p>
                <p className="mt-1 text-xs text-[var(--cbt-muted)]">Create your first exam to see it here.</p>
                <Link
                  href="/dashboard/create"
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--cbt-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <Plus size={16} aria-hidden="true" />
                  Create exam
                </Link>
              </div>
            )}
          </section>

          <p className="mt-8 text-center text-xs text-[var(--cbt-muted)]">Assessly Creator Console © 2026</p>
        </main>
      </div>
    </div>
  );
}
