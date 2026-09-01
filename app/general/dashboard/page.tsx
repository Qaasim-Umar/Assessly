"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileQuestion,
  GraduationCap,
  LogOut,
  UserCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getGeneralAdminSession,
  signOutGeneralAdmin,
} from "@/lib/generalAdminAuth";
import GeneralAdminSectionNav from "@/components/GeneralAdminSectionNav";

type RangeDays = 7 | 30 | 90;

type LabelValue = {
  label: string;
  value: number;
};

type GrowthPoint = {
  date: string;
  newUsers: number;
  attempts: number;
  activeUsers: number;
};

type RecentContent = {
  id: string;
  title: string;
  subject: string;
  status: string;
  createdAt: string;
  questionCount: number;
  creator: string;
  source: string;
};

type AnalyticsPayload = {
  generatedAt: string;
  timezone: string;
  periodDays: number;
  dailyWindowStart: string;
  dailyWindowEnd: string;
  metrics: {
    totalLearners: number;
    newUsersToday: number;
    returningUsersToday: number;
    activeUsersToday: number;
    newUsersPeriod: number;
    newUsersGrowthPct: number | null;
    activeUsersPeriod: number;
    userQuestionsTotal: number;
    userQuestionsToday: number;
    generalQuestionsTotal: number;
    userExamsTotal: number;
    userExamsToday: number;
    publishedUserExams: number;
    activeSchools: number;
    attemptsToday: number;
    attemptsPeriod: number;
    completionRatePeriod: number;
    averageScorePeriod: number | null;
  };
  accountMix: LabelValue[];
  growthTrend: GrowthPoint[];
  questionSources: LabelValue[];
  activityByMode: LabelValue[];
  topSubjects: LabelValue[];
  recentContent: RecentContent[];
};

type AnalyticsSnapshot = {
  generatedAt: string;
  nextRefreshAt: string;
  timezone: string;
  ranges: Record<string, AnalyticsPayload>;
};

const RANGE_OPTIONS: RangeDays[] = [7, 30, 90];
const ANALYTICS_CACHE_VERSION = "v2";
const BAR_COLORS = [
  "bg-emerald-600",
  "bg-blue-600",
  "bg-violet-600",
  "bg-amber-500",
  "bg-cyan-600",
  "bg-rose-500",
];

function analyticsCacheKey(userId: string) {
  return `assessly:general-admin:cbt-analytics:${ANALYTICS_CACHE_VERSION}:${userId}`;
}

function isAnalyticsSnapshot(value: unknown): value is AnalyticsSnapshot {
  if (!value || typeof value !== "object") return false;

  const snapshot = value as Partial<AnalyticsSnapshot>;
  if (
    typeof snapshot.generatedAt !== "string" ||
    typeof snapshot.nextRefreshAt !== "string" ||
    typeof snapshot.timezone !== "string" ||
    !snapshot.ranges ||
    typeof snapshot.ranges !== "object"
  ) {
    return false;
  }

  return RANGE_OPTIONS.every((days) => {
    const payload = snapshot.ranges?.[String(days)];
    return Boolean(
      payload &&
        typeof payload === "object" &&
        payload.periodDays === days &&
        typeof payload.dailyWindowStart === "string" &&
        typeof payload.dailyWindowEnd === "string" &&
        payload.metrics &&
        Array.isArray(payload.growthTrend),
    );
  });
}

function readAnalyticsCache(userId: string): AnalyticsSnapshot | null {
  try {
    const key = analyticsCacheKey(userId);
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const snapshot: unknown = JSON.parse(raw);
    if (!isAnalyticsSnapshot(snapshot)) {
      window.localStorage.removeItem(key);
      return null;
    }

    const nextRefreshAt = Date.parse(snapshot.nextRefreshAt);
    if (!Number.isFinite(nextRefreshAt) || Date.now() >= nextRefreshAt) {
      window.localStorage.removeItem(key);
      return null;
    }

    return snapshot;
  } catch {
    return null;
  }
}

function writeAnalyticsCache(userId: string, snapshot: AnalyticsSnapshot) {
  try {
    window.localStorage.setItem(analyticsCacheKey(userId), JSON.stringify(snapshot));
  } catch {
    // The daily database snapshot still prevents expensive recalculation when
    // browser storage is unavailable.
  }
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("en-NG").format(value ?? 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function formatWindowBoundary(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

function MetricCard({
  label,
  value,
  support,
  Icon,
  tone = "emerald",
}: {
  label: string;
  value: string;
  support: string;
  Icon: LucideIcon;
  tone?: "emerald" | "blue" | "violet" | "amber";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-extrabold tabular-nums tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}
        >
          <Icon size={19} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{support}</p>
    </article>
  );
}

function LoadingDashboard() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading CBT analytics">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
        <div className="h-[360px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-[360px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

function BreakdownBars({
  rows,
  emptyMessage,
}: {
  rows: LabelValue[];
  emptyMessage: string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  if (rows.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row, index) => {
        const percentage = Math.max((row.value / max) * 100, row.value > 0 ? 3 : 0);
        return (
          <div key={row.label}>
            <div className="mb-1.5 flex items-center justify-between gap-4 text-xs">
              <span className="min-w-0 font-semibold text-slate-700">{row.label}</span>
              <span className="shrink-0 font-extrabold tabular-nums text-slate-950">
                {formatNumber(row.value)}
              </span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label={`${row.label}: ${formatNumber(row.value)}`}
              aria-valuemin={0}
              aria-valuemax={max}
              aria-valuenow={row.value}
            >
              <div
                className={`h-full rounded-full ${BAR_COLORS[index % BAR_COLORS.length]}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GrowthChart({ rows }: { rows: GrowthPoint[] }) {
  const width = 720;
  const height = 250;
  const left = 44;
  const right = 18;
  const top = 18;
  const bottom = 42;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => [row.newUsers, row.attempts]),
  );
  const x = (index: number) =>
    left + (rows.length <= 1 ? chartWidth / 2 : (index / (rows.length - 1)) * chartWidth);
  const y = (value: number) => top + chartHeight - (value / maxValue) * chartHeight;
  const points = (key: "newUsers" | "attempts") =>
    rows.map((row, index) => `${x(index)},${y(row[key])}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const labelIndexes = Array.from(
    new Set([0, Math.floor((rows.length - 1) / 2), rows.length - 1]),
  ).filter((index) => index >= 0);
  const totalNew = rows.reduce((sum, row) => sum + row.newUsers, 0);
  const totalAttempts = rows.reduce((sum, row) => sum + row.attempts, 0);

  if (rows.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
        No growth data is available for this range yet.
      </p>
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-600">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
          New learners ({formatNumber(totalNew)})
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
          CBT attempts ({formatNumber(totalAttempts)})
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-labelledby="growth-chart-title growth-chart-description"
      >
        <title id="growth-chart-title">Learner growth and CBT attempts</title>
        <desc id="growth-chart-description">
          Daily new learner accounts and CBT attempts for the selected period.
        </desc>
        {ticks.map((tick) => {
          const tickY = top + chartHeight - tick * chartHeight;
          return (
            <g key={tick}>
              <line
                x1={left}
                x2={width - right}
                y1={tickY}
                y2={tickY}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={left - 9}
                y={tickY + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {Math.round(maxValue * tick)}
              </text>
            </g>
          );
        })}
        <polyline
          points={points("attempts")}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={points("newUsers")}
          fill="none"
          stroke="#059669"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {rows.length <= 30 &&
          rows.map((row, index) => (
            <g key={row.date}>
              <circle cx={x(index)} cy={y(row.attempts)} r="4" fill="#2563eb">
                <title>{`${formatShortDate(row.date)}: ${row.attempts} attempts`}</title>
              </circle>
              <circle cx={x(index)} cy={y(row.newUsers)} r="4" fill="#059669">
                <title>{`${formatShortDate(row.date)}: ${row.newUsers} new learners`}</title>
              </circle>
            </g>
          ))}
        {labelIndexes.map((index) => (
          <text
            key={rows[index].date}
            x={x(index)}
            y={height - 13}
            textAnchor={index === 0 ? "start" : index === rows.length - 1 ? "end" : "middle"}
            className="fill-slate-500 text-[10px] font-semibold"
          >
            {formatShortDate(rows[index].date)}
          </text>
        ))}
      </svg>
      <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <summary className="cursor-pointer text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          View daily data table
        </summary>
        <div className="mt-3 max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 text-slate-500">
              <tr>
                <th className="py-2 font-bold">Date</th>
                <th className="py-2 text-right font-bold">New</th>
                <th className="py-2 text-right font-bold">Active</th>
                <th className="py-2 text-right font-bold">Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {rows.map((row) => (
                <tr key={row.date}>
                  <td className="py-2">{formatShortDate(row.date)}</td>
                  <td className="py-2 text-right tabular-nums">{row.newUsers}</td>
                  <td className="py-2 text-right tabular-nums">{row.activeUsers}</td>
                  <td className="py-2 text-right tabular-nums">{row.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

function RecentContentList({ rows }: { rows: RecentContent[] }) {
  if (rows.length === 0) {
    return (
      <p className="px-5 py-12 text-center text-sm text-slate-500">
        User-created CBT exams and assessments will appear here.
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(120px,0.8fr)_100px_90px] gap-4 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 md:grid">
        <span>Content</span>
        <span>Creator</span>
        <span>Status</span>
        <span className="text-right">Questions</span>
      </div>
      {rows.map((row) => (
        <article
          key={`${row.source}-${row.id}`}
          className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,2fr)_minmax(120px,0.8fr)_100px_90px] md:items-center md:gap-4"
        >
          <div className="min-w-0">
            <p className="break-words text-sm font-bold text-slate-900">{row.title}</p>
            <p className="mt-1 text-xs text-slate-500">
              {row.subject} · {row.source} · {formatDate(row.createdAt)}
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600">
            <span className="mr-1 text-slate-400 md:hidden">Creator:</span>
            {row.creator}
          </div>
          <div>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ring-1 ${
                row.status === "Live" || row.status === "Published"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-slate-100 text-slate-600 ring-slate-200"
              }`}
            >
              {row.status}
            </span>
          </div>
          <p className="text-sm font-extrabold tabular-nums text-slate-950 md:text-right">
            <span className="mr-1 text-xs font-medium text-slate-400 md:hidden">Questions:</span>
            {formatNumber(row.questionCount)}
          </p>
        </article>
      ))}
    </div>
  );
}

export default function GeneralDashboardPage() {
  const router = useRouter();
  const [range, setRange] = useState<RangeDays>(30);
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (userId: string, background = false) => {
    if (!background) setLoading(true);
    setError(null);

    try {
      const { data, error: analyticsError } = await supabase.functions.invoke<AnalyticsSnapshot>(
        "general-admin-cbt-analytics",
        {
          body: {},
        },
      );
      if (analyticsError) {
        let message = analyticsError.message;
        const context = (analyticsError as { context?: unknown }).context;
        if (context instanceof Response) {
          const body = await context.clone().json().catch(() => null) as { error?: unknown } | null;
          if (typeof body?.error === "string") message = body.error;
        }
        throw new Error(message);
      }
      if (!isAnalyticsSnapshot(data)) {
        throw new Error("The analytics service returned no data.");
      }
      writeAnalyticsCache(userId, data);
      setSnapshot(data);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not load CBT analytics.";
      if (!background) setError(message);
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function initialise() {
      const session = await getGeneralAdminSession();
      if (!active) return;
      if (!session) {
        router.replace("/general/dashboard/login");
        return;
      }
      setAdminUserId(session.user.id);
      const cachedSnapshot = readAnalyticsCache(session.user.id);
      if (cachedSnapshot) {
        setSnapshot(cachedSnapshot);
        setLoading(false);
        return;
      }
      await fetchAnalytics(session.user.id);
    }
    initialise();
    return () => {
      active = false;
    };
  }, [fetchAnalytics, router]);

  useEffect(() => {
    if (!adminUserId || !snapshot?.nextRefreshAt) return;

    const nextRefreshAt = Date.parse(snapshot.nextRefreshAt);
    if (!Number.isFinite(nextRefreshAt)) return;

    let cancelled = false;
    let timeoutId: number | undefined;
    const initialGraceMs = 10_000;
    const retryDelayMs = 30_000;
    let remainingRetries = 10;

    const refreshAfterSnapshotJob = async () => {
      await fetchAnalytics(adminUserId, true);
      if (!cancelled && remainingRetries > 0) {
        remainingRetries -= 1;
        timeoutId = window.setTimeout(refreshAfterSnapshotJob, retryDelayMs);
      }
    };

    const initialDelay = Math.max(initialGraceMs, nextRefreshAt - Date.now() + initialGraceMs);
    timeoutId = window.setTimeout(refreshAfterSnapshotJob, initialDelay);

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [adminUserId, fetchAnalytics, snapshot?.nextRefreshAt]);

  const handleLogout = async () => {
    await signOutGeneralAdmin();
    router.push("/general/dashboard/login");
  };

  const analytics = snapshot?.ranges[String(range)] ?? null;

  const growthText = useMemo(() => {
    const growth = analytics?.metrics.newUsersGrowthPct;
    if (growth === null || growth === undefined) return "No previous baseline";
    if (growth === 0) return "No change vs previous period";
    return `${growth > 0 ? "+" : ""}${growth}% vs previous period`;
  }, [analytics]);

  const metrics = analytics?.metrics;
  const dailyWindow = analytics
    ? `${formatWindowBoundary(analytics.dailyWindowStart, analytics.timezone)} – ${formatWindowBoundary(analytics.dailyWindowEnd, analytics.timezone)}`
    : null;
  const lastUpdated = snapshot?.generatedAt
    ? new Intl.DateTimeFormat("en-NG", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        timeZone: snapshot.timezone,
      }).format(new Date(snapshot.generatedAt))
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/general/dashboard"
            className="flex min-h-11 items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <GraduationCap size={19} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight text-slate-950">Assessly</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                General admin
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/general"
              target="_blank"
              className="hidden min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:flex"
            >
              Public CBT
              <ExternalLink size={14} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <LogOut size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-7">
          <GeneralAdminSectionNav active="analytics" />
        </div>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              CBT-only analytics
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              Learner growth overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Track learner acquisition, returning users, CBT engagement and questions created outside the general admin console.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-bold text-emerald-800">
              <Clock3 size={15} aria-hidden="true" />
              Refreshes daily at 4:00 AM
            </span>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 px-2 text-xs text-slate-500">
            <Clock3 size={15} className="text-emerald-700" aria-hidden="true" />
            <span>
              Daily snapshot in <strong className="font-bold text-slate-700">Lagos time</strong>
              {lastUpdated ? ` · refreshed ${lastUpdated}` : ""}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" aria-label="Analytics date range">
            {RANGE_OPTIONS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setRange(days)}
                aria-pressed={range === days}
                className={`min-h-10 rounded-lg px-4 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  range === days
                    ? "bg-white text-emerald-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-6">
            <LoadingDashboard />
          </div>
        ) : error ? (
          <section className="mt-6 rounded-2xl border border-rose-200 bg-white px-5 py-14 text-center shadow-sm" role="alert">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
              <BarChart3 size={22} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold text-slate-950">Analytics could not be loaded</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{error}</p>
            <button
              type="button"
              onClick={() => adminUserId && fetchAnalytics(adminUserId)}
              disabled={!adminUserId}
              className="mt-5 min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2"
            >
              Try again
            </button>
          </section>
        ) : analytics && metrics ? (
          <div className="mt-6 space-y-6">
            <section aria-labelledby="daily-window-heading">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 id="daily-window-heading" className="text-base font-extrabold text-slate-950">Last 24 hours at a glance</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Completed daily window{dailyWindow ? `: ${dailyWindow}` : ""} (Lagos time).
                  </p>
                </div>
                <span className="hidden text-xs font-semibold text-slate-400 sm:inline">{formatDate(analytics.generatedAt)}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="New users"
                  value={formatNumber(metrics.newUsersToday)}
                  support="Learner accounts created in this window"
                  Icon={UserPlus}
                />
                <MetricCard
                  label="Returning users"
                  value={formatNumber(metrics.returningUsersToday)}
                  support="Existing learners whose latest sign-in was in this window"
                  Icon={UserCheck}
                  tone="blue"
                />
                <MetricCard
                  label="CBT-active users"
                  value={formatNumber(metrics.activeUsersToday)}
                  support={`${formatNumber(metrics.attemptsToday)} CBT attempt${metrics.attemptsToday === 1 ? "" : "s"} recorded in this window`}
                  Icon={Activity}
                  tone="violet"
                />
                <MetricCard
                  label="User-added questions"
                  value={formatNumber(metrics.userQuestionsTotal)}
                  support={`+${formatNumber(metrics.userQuestionsToday)} in this window · excludes general admin content`}
                  Icon={FileQuestion}
                  tone="amber"
                />
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(310px,0.85fr)]">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="growth-heading">
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 id="growth-heading" className="text-base font-extrabold text-slate-950">Growth and engagement</h2>
                    <p className="mt-1 text-xs text-slate-500">Daily learner sign-ups and recorded CBT attempts.</p>
                  </div>
                  <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold text-emerald-700 ring-1 ring-emerald-200">
                    Last {range} days
                  </span>
                </div>
                <GrowthChart rows={analytics.growthTrend} />
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="activity-heading">
                <div className="mb-6">
                  <h2 id="activity-heading" className="text-base font-extrabold text-slate-950">Activity by CBT mode</h2>
                  <p className="mt-1 text-xs text-slate-500">Attempts started or submitted in this period.</p>
                </div>
                <BreakdownBars rows={analytics.activityByMode} emptyMessage="No CBT attempts in this period." />
              </article>
            </section>

            <section aria-labelledby="health-heading">
              <div className="mb-4">
                <h2 id="health-heading" className="text-base font-extrabold text-slate-950">Growth health</h2>
                <p className="mt-1 text-xs text-slate-500">Core totals and {range}-day engagement quality.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <MetricCard label="Total learners" value={formatNumber(metrics.totalLearners)} support="Individual learners and school pupils" Icon={Users} />
                <MetricCard label={`New in ${range} days`} value={formatNumber(metrics.newUsersPeriod)} support={growthText} Icon={UserPlus} tone="blue" />
                <MetricCard label={`Active in ${range} days`} value={formatNumber(metrics.activeUsersPeriod)} support="Signed in or recorded CBT activity" Icon={Activity} tone="violet" />
                <MetricCard label={`Attempts in ${range} days`} value={formatNumber(metrics.attemptsPeriod)} support="Across every tracked CBT mode" Icon={BookOpen} tone="amber" />
                <MetricCard label="Completion rate" value={`${metrics.completionRatePeriod ?? 0}%`} support={`Completed attempts in the last ${range} days`} Icon={CheckCircle2} />
                <MetricCard label="Average score" value={metrics.averageScorePeriod === null ? "—" : `${metrics.averageScorePeriod}%`} support="Scored exam and assessment submissions" Icon={BarChart3} tone="blue" />
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="question-source-heading">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 id="question-source-heading" className="text-base font-extrabold text-slate-950">Questions by source</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Separates general-admin content from questions created by schools and other creators.</p>
                  </div>
                  <span className="rounded-xl bg-amber-50 px-3 py-2 text-right text-xs font-extrabold tabular-nums text-amber-800 ring-1 ring-amber-200">
                    {formatNumber(metrics.userQuestionsTotal)} user-added
                  </span>
                </div>
                <BreakdownBars rows={analytics.questionSources} emptyMessage="No questions have been added yet." />
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="subject-heading">
                <div className="mb-6">
                  <h2 id="subject-heading" className="text-base font-extrabold text-slate-950">Top user-created subjects</h2>
                  <p className="mt-1 text-xs text-slate-500">Subjects receiving the most questions outside the general admin console.</p>
                </div>
                <BreakdownBars rows={analytics.topSubjects} emptyMessage="No user-created subject data yet." />
              </article>
            </section>

            <section aria-labelledby="content-health-heading">
              <div className="mb-4">
                <h2 id="content-health-heading" className="text-base font-extrabold text-slate-950">Creator content health</h2>
                <p className="mt-1 text-xs text-slate-500">How quickly users and schools are building their own CBT libraries.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="User-created CBTs" value={formatNumber(metrics.userExamsTotal)} support={`+${formatNumber(metrics.userExamsToday)} in the last completed window`} Icon={BookOpen} />
                <MetricCard label="Published or live" value={formatNumber(metrics.publishedUserExams)} support="Creator CBTs currently available to learners" Icon={CheckCircle2} tone="blue" />
                <MetricCard label="General questions" value={formatNumber(metrics.generalQuestionsTotal)} support="Question bank and public exams managed by you" Icon={FileQuestion} tone="violet" />
                <MetricCard label="Active schools" value={formatNumber(metrics.activeSchools)} support="School workspaces currently active" Icon={Building2} tone="amber" />
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,0.7fr)]">
              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="recent-content-heading">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 id="recent-content-heading" className="text-base font-extrabold text-slate-950">Recent user-created CBT content</h2>
                  <p className="mt-1 text-xs text-slate-500">Latest exams and school assessments across the platform.</p>
                </div>
                <RecentContentList rows={analytics.recentContent} />
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="learner-mix-heading">
                <div className="mb-6">
                  <h2 id="learner-mix-heading" className="text-base font-extrabold text-slate-950">Learner mix</h2>
                  <p className="mt-1 text-xs text-slate-500">Where registered CBT learners come from.</p>
                </div>
                <BreakdownBars rows={analytics.accountMix} emptyMessage="No learner accounts yet." />
                <details className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <summary className="cursor-pointer text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    How these metrics are counted
                  </summary>
                  <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                    <li><strong className="text-slate-800">Returning users:</strong> an account created before the window whose latest sign-in happened between 4:00 AM yesterday and 4:00 AM today.</li>
                    <li><strong className="text-slate-800">User-added questions:</strong> current questions in creator exams and School workspaces; general-admin uploads are excluded.</li>
                    <li><strong className="text-slate-800">CBT attempts:</strong> submitted exams and assessments plus tracked practice, mock, past-question and survival sessions.</li>
                  </ul>
                </details>
              </article>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
