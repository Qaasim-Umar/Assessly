"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Database,
  ExternalLink,
  FileJson,
  Loader2,
  MapPinned,
  RefreshCcw,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import GeneralAdminSectionNav from "@/components/GeneralAdminSectionNav";
import { getGeneralAdminSession } from "@/lib/generalAdminAuth";
import {
  fetchCboCentreCount,
  parseCboCentreJson,
  upsertCboCentreBatch,
  type CboCentreParseResult,
} from "@/lib/cboCentreImport";

const BATCH_SIZE = 500;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-NG").format(value);
}

function StatCard({
  label,
  value,
  support,
}: {
  label: string;
  value: number;
  support: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tabular-nums text-slate-950">
        {formatNumber(value)}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{support}</p>
    </article>
  );
}

export default function CboCentreImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [pasteText, setPasteText] = useState("");
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<CboCentreParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [databaseCount, setDatabaseCount] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [resumeIndex, setResumeIndex] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const refreshDatabaseCount = useCallback(async () => {
    try {
      const count = await fetchCboCentreCount();
      setDatabaseCount(count);
    } catch {
      setDatabaseCount(null);
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

      setCheckingSession(false);
      await refreshDatabaseCount();
    }

    void initialise();
    return () => {
      active = false;
    };
  }, [refreshDatabaseCount, router]);

  function resetImportState() {
    setSourceName(null);
    setParseResult(null);
    setParseError(null);
    setImportError(null);
    setImportedCount(0);
    setResumeIndex(0);
    setComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function prepareJson(raw: string, name: string) {
    try {
      const result = parseCboCentreJson(raw);
      setParseResult(result);
      setSourceName(name);
      setParseError(null);
      setImportError(null);
      setImportedCount(0);
      setResumeIndex(0);
      setComplete(false);
    } catch (error) {
      setParseResult(null);
      setSourceName(name);
      setParseError(
        error instanceof Error ? error.message : "Could not read this JSON.",
      );
      setImportError(null);
      setImportedCount(0);
      setResumeIndex(0);
      setComplete(false);
    }
  }

  async function readFile(file: File) {
    if (!file.name.toLocaleLowerCase().endsWith(".json")) {
      resetImportState();
      setSourceName(file.name);
      setParseError("Choose a file ending in .json.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      resetImportState();
      setSourceName(file.name);
      setParseError("This file is larger than 25 MB. Choose a smaller JSON file.");
      return;
    }

    try {
      prepareJson(await file.text(), file.name);
    } catch {
      resetImportState();
      setSourceName(file.name);
      setParseError("The browser could not read this file. Please choose it again.");
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void readFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void readFile(file);
  }

  async function handleImport() {
    if (!parseResult || parseResult.issues.length > 0 || importing) return;

    setImporting(true);
    setImportError(null);
    setComplete(false);
    let nextIndex = resumeIndex;

    try {
      for (
        let start = resumeIndex;
        start < parseResult.centres.length;
        start += BATCH_SIZE
      ) {
        const end = Math.min(start + BATCH_SIZE, parseResult.centres.length);
        await upsertCboCentreBatch(parseResult.centres.slice(start, end));
        nextIndex = end;
        setImportedCount(end);
        setResumeIndex(end);
      }

      setComplete(true);
      await refreshDatabaseCount();
    } catch (error) {
      setResumeIndex(nextIndex);
      const batchNumber = Math.floor(nextIndex / BATCH_SIZE) + 1;
      const message = error instanceof Error ? error.message : "Unknown database error.";
      setImportError(
        `Batch ${batchNumber} could not be saved. ${message} You can retry from where it stopped.`,
      );
    } finally {
      setImporting(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-700 shadow-sm">
          <Loader2 className="animate-spin text-emerald-700" size={20} />
          Checking admin access…
        </div>
      </div>
    );
  }

  const canImport = Boolean(
    parseResult &&
      parseResult.centres.length > 0 &&
      parseResult.issues.length === 0,
  );
  const progress = parseResult?.centres.length
    ? Math.round((importedCount / parseResult.centres.length) * 100)
    : 0;
  const remainingIssues = Math.max((parseResult?.issues.length ?? 0) - 20, 0);

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/general/dashboard"
              className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg text-sm font-bold text-slate-600 transition-colors hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <ArrowLeft size={17} aria-hidden="true" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <span className="h-5 w-px bg-slate-200" aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-slate-950">CBO centres</p>
              <p className="hidden text-[11px] text-slate-500 sm:block">JSON importer</p>
            </div>
          </div>
          <Link
            href="/admissions/cbo-centres"
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:px-3"
          >
            Public finder
            <ExternalLink size={14} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
        <div className="mb-7">
          <GeneralAdminSectionNav active="cbo-centres" />
        </div>

        <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">
              <MapPinned size={15} aria-hidden="true" />
              Registration directory
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Import CBO centres
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Upload the original JSON file, review the validation results, then save all centres to the public directory.
            </p>
          </div>
          <div className="flex min-h-11 items-center gap-2 self-start rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-bold text-emerald-800 sm:self-auto">
            <Database size={16} aria-hidden="true" />
            {databaseCount === null
              ? "Database count unavailable"
              : `${formatNumber(databaseCount)} currently saved`}
          </div>
        </section>

        <section
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          aria-labelledby="choose-json-heading"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <FileJson size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 id="choose-json-heading" className="text-base font-extrabold text-slate-950">
                Choose your JSON
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Use the array exactly as you have it. Nothing needs to be converted to CSV.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-stretch">
            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex min-h-52 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-colors ${
                dragging
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-300 bg-slate-50"
              }`}
            >
              <UploadCloud className="text-emerald-700" size={32} aria-hidden="true" />
              <p className="mt-3 text-sm font-extrabold text-slate-900">
                Drop your JSON file here
              </p>
              <p className="mt-1 text-xs text-slate-500">or choose it from your device</p>
              <label
                htmlFor="cbo-json-file"
                className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-emerald-800 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2"
              >
                Choose JSON file
                <input
                  ref={fileInputRef}
                  id="cbo-json-file"
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
              <p className="mt-3 text-[11px] text-slate-400">Maximum file size: 25 MB</p>
            </div>

            <div className="flex items-center justify-center lg:flex-col">
              <span className="h-px flex-1 bg-slate-200 lg:h-auto lg:w-px" />
              <span className="mx-3 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 lg:my-3 lg:mx-0">
                or
              </span>
              <span className="h-px flex-1 bg-slate-200 lg:h-auto lg:w-px" />
            </div>

            <div className="flex min-h-52 flex-col">
              <label htmlFor="cbo-json-paste" className="text-xs font-extrabold text-slate-700">
                Paste JSON
              </label>
              <textarea
                id="cbo-json-paste"
                value={pasteText}
                onChange={(event) => setPasteText(event.target.value)}
                placeholder={'[\n  { "sn": 1, "cyber_cafe": "..." }\n]'}
                spellCheck={false}
                className="mt-2 min-h-36 flex-1 resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-mono text-xs leading-5 text-slate-800 outline-none transition-shadow placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={() => prepareJson(pasteText, "Pasted JSON")}
                disabled={!pasteText.trim()}
                className="mt-3 min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-extrabold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Validate pasted JSON
              </button>
            </div>
          </div>
        </section>

        {parseError ? (
          <div
            className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            <AlertCircle className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
            <div>
              <p className="font-extrabold">Could not validate {sourceName ?? "the JSON"}</p>
              <p className="mt-1 leading-6">{parseError}</p>
            </div>
          </div>
        ) : null}

        {parseResult ? (
          <section className="mt-6 space-y-5" aria-labelledby="validation-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="validation-heading" className="text-lg font-black text-slate-950">
                  Validation result
                </h2>
                <p className="mt-1 break-all text-xs text-slate-500">{sourceName}</p>
              </div>
              <button
                type="button"
                onClick={resetImportState}
                disabled={importing}
                className="flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 text-xs font-extrabold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCcw size={15} aria-hidden="true" />
                Choose another file
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Rows found"
                value={parseResult.sourceRowCount}
                support="Total records in the file"
              />
              <StatCard
                label="Valid centres"
                value={parseResult.centres.length}
                support="Ready to be imported"
              />
              <StatCard
                label="States"
                value={parseResult.stateCount}
                support="Unique state names"
              />
              <StatCard
                label="State & LGA pairs"
                value={parseResult.lgaCount}
                support="Unique locations"
              />
            </div>

            {parseResult.issues.length > 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5" role="alert">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 shrink-0 text-amber-700" size={20} aria-hidden="true" />
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-amber-950">
                      Fix {formatNumber(parseResult.issues.length)} validation {parseResult.issues.length === 1 ? "issue" : "issues"}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      No rows will be imported until the file passes validation.
                    </p>
                  </div>
                </div>
                <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto border-t border-amber-200 pt-4 text-xs leading-5 text-amber-900">
                  {parseResult.issues.slice(0, 20).map((issue, index) => (
                    <li key={`${issue.row}-${index}`}>
                      <strong>Row {issue.row}{issue.sn ? ` · SN ${issue.sn}` : ""}:</strong>{" "}
                      {issue.message}
                    </li>
                  ))}
                  {remainingIssues > 0 ? (
                    <li className="font-extrabold">…and {formatNumber(remainingIssues)} more.</li>
                  ) : null}
                </ul>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={20} aria-hidden="true" />
                <div>
                  <p className="font-extrabold">This file is ready to import</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-800">
                    New serial numbers will be added. Existing serial numbers will be updated.
                  </p>
                </div>
              </div>
            )}

            {parseResult.centres.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="text-sm font-extrabold text-slate-950">Preview</h3>
                  <p className="mt-1 text-xs text-slate-500">First {Math.min(6, parseResult.centres.length)} valid centres</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[820px] w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">
                      <tr>
                        <th className="px-5 py-3">SN</th>
                        <th className="px-5 py-3">Centre</th>
                        <th className="px-5 py-3">State</th>
                        <th className="px-5 py-3">LGA</th>
                        <th className="px-5 py-3">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {parseResult.centres.slice(0, 6).map((centre) => (
                        <tr key={centre.sn}>
                          <td className="px-5 py-4 font-extrabold tabular-nums text-slate-950">{centre.sn}</td>
                          <td className="max-w-sm px-5 py-4">
                            <p className="font-bold text-slate-900">{centre.cyber_cafe}</p>
                            <p className="mt-1 line-clamp-2 leading-5 text-slate-500">{centre.office_address}</p>
                          </td>
                          <td className="px-5 py-4 font-semibold">{centre.state}</td>
                          <td className="px-5 py-4">{centre.lga}</td>
                          <td className="px-5 py-4 tabular-nums">{centre.phone_number ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {canImport ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <ShieldCheck size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-950">
                        Save to the CBO directory
                      </h3>
                      <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                        The import runs in {formatNumber(Math.ceil(parseResult.centres.length / BATCH_SIZE))} reliable batches. If your connection drops, retry continues from the last completed batch.
                      </p>
                    </div>
                  </div>
                  {!complete ? (
                    <button
                      type="button"
                      onClick={() => void handleImport()}
                      disabled={importing}
                      className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
                    >
                      {importing ? (
                        <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                      ) : importError ? (
                        <RefreshCcw size={17} aria-hidden="true" />
                      ) : (
                        <UploadCloud size={18} aria-hidden="true" />
                      )}
                      {importing
                        ? `Importing ${progress}%`
                        : importError
                          ? `Retry from ${formatNumber(resumeIndex + 1)}`
                          : `Import ${formatNumber(parseResult.centres.length)} centres`}
                    </button>
                  ) : null}
                </div>

                {(importing || importedCount > 0) && !complete ? (
                  <div className="mt-5" aria-live="polite">
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
                      <span>{formatNumber(importedCount)} of {formatNumber(parseResult.centres.length)} saved</span>
                      <span>{progress}%</span>
                    </div>
                    <div
                      className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-label="Import progress"
                      aria-valuemin={0}
                      aria-valuemax={parseResult.centres.length}
                      aria-valuenow={importedCount}
                    >
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-[width] motion-reduce:transition-none"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                {importError ? (
                  <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800" role="alert">
                    {importError}
                  </p>
                ) : null}

                {complete ? (
                  <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={22} aria-hidden="true" />
                      <div>
                        <p className="font-extrabold text-emerald-950">
                          {formatNumber(parseResult.centres.length)} centres imported successfully
                        </p>
                        <p className="mt-1 text-xs leading-5 text-emerald-800">
                          {databaseCount === null
                            ? "The public directory is ready to use."
                            : `The database now contains ${formatNumber(databaseCount)} centres.`}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/admissions/cbo-centres"
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 text-xs font-extrabold text-white transition-colors hover:bg-emerald-900"
                    >
                      Check public finder
                      <ExternalLink size={14} aria-hidden="true" />
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
