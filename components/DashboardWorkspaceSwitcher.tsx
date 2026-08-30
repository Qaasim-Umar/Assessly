"use client";

import { Building2, Check, ChevronDown, User } from "lucide-react";
import { useEffect, useState } from "react";

type DashboardWorkspaceSwitcherProps = {
  workspace: "individual" | "school";
  onSwitch: () => void;
  inverted?: boolean;
  schoolName?: string;
};

export default function DashboardWorkspaceSwitcher({
  workspace,
  onSwitch,
  inverted = false,
  schoolName,
}: DashboardWorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const isSchool = workspace === "school";
  const WorkspaceIcon = isSchool ? Building2 : User;

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const optionClass = (active: boolean) =>
    `flex min-h-16 w-full items-center gap-3 rounded-xl px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
      active
        ? "bg-[var(--cbt-primary-soft)]"
        : "hover:bg-[var(--cbt-surface-muted)]"
    }`;

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${
          inverted
            ? "border-white/15 bg-white/10 text-white hover:bg-white/15 focus:ring-offset-[var(--cbt-sidebar)]"
            : "border-[var(--cbt-border)] bg-white text-[var(--cbt-ink)] hover:bg-[var(--cbt-surface-muted)] focus:ring-offset-white"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            inverted
              ? "bg-white/10 text-emerald-200"
              : "bg-[var(--cbt-primary-soft)] text-[var(--cbt-primary)]"
          }`}
        >
          <WorkspaceIcon size={18} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">
            {isSchool ? schoolName || "School" : "Individual"}
          </span>
          <span
            className={`block truncate text-[11px] ${
              inverted ? "text-emerald-100/70" : "text-[var(--cbt-muted)]"
            }`}
          >
            {isSchool ? "School workspace" : "Creator workspace"}
          </span>
        </span>
        <ChevronDown
          size={17}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Switch dashboard workspace"
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-[min(340px,calc(100vw-32px))] rounded-2xl border border-[var(--cbt-border)] bg-white p-2 text-[var(--cbt-ink)] shadow-2xl"
        >
          <div className="px-3 pb-2 pt-1">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--cbt-muted)]">
              Switch workspace
            </p>
            <p className="mt-1 text-xs text-[var(--cbt-muted)]">
              Choose which exam-creation dashboard to use.
            </p>
          </div>

          <button
            type="button"
            role="menuitemradio"
            aria-checked={isSchool}
            onClick={() => {
              if (!isSchool) onSwitch();
              setOpen(false);
            }}
            className={optionClass(isSchool)}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--cbt-primary)] shadow-sm">
              <Building2 size={19} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">School</span>
              <span className="mt-0.5 block text-xs text-[var(--cbt-muted)]">
                Manage school assessments and students
              </span>
            </span>
            {isSchool && (
              <Check
                size={18}
                className="text-[var(--cbt-primary)]"
                aria-label="Current workspace"
              />
            )}
          </button>

          <button
            type="button"
            role="menuitemradio"
            aria-checked={!isSchool}
            onClick={() => {
              if (isSchool) onSwitch();
              setOpen(false);
            }}
            className={`mt-1 ${optionClass(!isSchool)}`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <User size={19} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">Individual</span>
              <span className="mt-0.5 block text-xs text-[var(--cbt-muted)]">
                Create and manage your existing exams
              </span>
            </span>
            {!isSchool && (
              <Check
                size={18}
                className="text-[var(--cbt-primary)]"
                aria-label="Current workspace"
              />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
