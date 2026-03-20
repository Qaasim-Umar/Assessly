"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getGeneralExams, type DbExam } from "@/lib/examService";

function formatDuration(minutes: number | null): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function getUrgencyColor(duration: number | null): string {
  if (!duration) return "text-green-700";
  if (duration <= 30) return "text-red-600";
  if (duration <= 60) return "text-amber-600";
  return "text-green-700";
}

const SLUG_TO_TYPE: Record<string, string | null> = {
  all: null,
  waec: "WAEC",
  "jamb-utme": "JAMB / UTME",
  neco: "NECO",
  bece: "BECE",
  "post-utme": "Post-UTME",
  mock: "Mock",
};

const SLUG_LABEL: Record<string, string> = {
  all: "All exams",
  waec: "WAEC",
  "jamb-utme": "JAMB / UTME",
  neco: "NECO",
  bece: "BECE",
  "post-utme": "Post-UTME",
  mock: "Mock Tests",
};

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="h-5 w-16 bg-gray-200 rounded-full flex-shrink-0" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-100 rounded w-2/5" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="border-t border-gray-100 pt-3">
        <div className="h-3 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="col-span-2 flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-indigo-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
          />
        </svg>
      </div>
      <h2 className="text-base font-bold text-gray-800 mb-1">
        No exams in {label}
      </h2>
      <p className="text-sm text-gray-500 max-w-xs">
        There are no published General Mode exams for this category yet.
      </p>
    </div>
  );
}

export default function GeneralCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const slug = String(params.slug ?? "all");

  const categoryType = SLUG_TO_TYPE[slug] ?? null;
  const label = SLUG_LABEL[slug] ?? "Category";

  const [exams, setExams] = useState<DbExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!(slug in SLUG_TO_TYPE)) {
      router.replace("/general");
      return;
    }
    getGeneralExams()
      .then((data) => {
        setExams(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load exams. Please refresh.");
        setLoading(false);
      });
  }, [router, slug]);

  const filtered = useMemo(() => {
    if (!categoryType) return exams;
    const target = categoryType.trim().toLowerCase();
    return exams.filter((e) => e.type?.trim().toLowerCase() === target);
  }, [categoryType, exams]);

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push("/general")}
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-700 text-sm font-semibold transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Categories
          </button>
          <span className="text-xs text-gray-400">
            Open to everyone · No login required
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{label}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Click an exam to start (General Mode).
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <svg
              className="w-4 h-4 text-red-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800">Available exams</h2>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            {loading ? "Loading…" : `${filtered.length} exam${filtered.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : filtered.length === 0 ? (
            <EmptyState label={label} />
          ) : (
            filtered.map((exam) => (
              <button
                key={exam.id}
                onClick={() => router.push(`/exam/${exam.id}?mode=general`)}
                className="group w-full text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">
                      {exam.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="inline-flex items-center text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full tracking-wide">
                      {exam.type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-full tracking-wide">
                      <svg
                        className="w-2.5 h-2.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      OPEN
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                      />
                    </svg>
                    <span>{exam.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                      />
                    </svg>
                    <span>{exam.class_level}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <div
                    className={`flex items-center gap-1.5 text-xs font-semibold ${getUrgencyColor(exam.duration)}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" strokeWidth="1.8" />
                      <polyline
                        points="12,6 12,12 16,14"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{formatDuration(exam.duration)} duration</span>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 18l6-6-6-6"
                    />
                  </svg>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="mt-10 text-center text-xs text-gray-400">
          Assessly General Mode · Open Exams · {new Date().getFullYear()}
        </div>
      </main>
    </div>
  );
}

