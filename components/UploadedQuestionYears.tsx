"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Coverage = { examType: string; subject: string; count: number; years: number[] };

export default function UploadedQuestionYears() {
  const [rows, setRows] = useState<Coverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const groups = new Map<string, Coverage>();
        const pageSize = 1000;
        for (let offset = 0; ; offset += pageSize) {
          const { data, error: queryError } = await supabase
            .from("questions")
            .select("exam_type, subject, year")
            .is("exam_id", null)
            .eq("is_active", true)
            .order("id")
            .range(offset, offset + pageSize - 1);
          if (!active) return;
          if (queryError) throw queryError;
          for (const question of data ?? []) {
            const examType = question.exam_type ?? "Unknown";
            const subject = question.subject ?? "Unknown";
            const key = JSON.stringify([examType, subject]);
            const group: Coverage = groups.get(key) ?? { examType, subject, count: 0, years: [] };
            group.count += 1;
            if (typeof question.year === "number" && !group.years.includes(question.year)) {
              group.years.push(question.year);
            }
            groups.set(key, group);
          }
          if (!data || data.length < pageSize) break;
        }
        setRows(Array.from(groups.values()).map((group) => ({
          ...group, years: group.years.sort((a, b) => b - a),
        })).sort((a, b) => a.examType.localeCompare(b.examType) || a.subject.localeCompare(b.subject)));
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [refresh]);

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="uploaded-years-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="uploaded-years-heading" className="text-base font-extrabold text-slate-950">Uploaded question years</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Years available in your active question bank, grouped by exam type and subject.</p>
        </div>
        <button type="button" disabled={loading} onClick={() => setRefresh((value) => value + 1)} className="min-h-11 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50">Refresh</button>
      </div>
      {loading ? <p className="mt-5 text-sm text-slate-500" role="status">Loading uploaded years…</p>
        : error ? <p className="mt-5 text-sm text-rose-700" role="alert">Could not load uploaded years. Please try Refresh.</p>
        : rows.length === 0 ? <p className="mt-5 text-sm text-slate-500">No active questions have been uploaded yet.</p>
        : <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => <article key={JSON.stringify([row.examType, row.subject])} className="rounded-xl border border-slate-200 p-4">
            <p className="text-[11px] font-bold text-emerald-700">{row.examType}</p>
            <h3 className="mt-1 text-sm font-bold text-slate-900">{row.subject}</h3>
            <p className="mt-1 text-xs text-slate-500">{row.count.toLocaleString("en-NG")} questions</p>
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label={`Years stored for ${row.examType} ${row.subject}`}>
              {row.years.length ? row.years.map((year) => <span key={year} className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-blue-700">{year}</span>) : <span className="text-xs text-slate-500">No year stored</span>}
            </div>
          </article>)}
        </div>}
    </section>
  );
}
