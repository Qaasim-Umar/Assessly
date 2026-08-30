"use client";

import Link from "next/link";
import { BarChart3, ClipboardList, Upload } from "lucide-react";

type GeneralAdminSection = "analytics" | "admissions" | "questions";

const sections = [
  {
    id: "analytics" as const,
    label: "Analytics",
    href: "/general/dashboard",
    Icon: BarChart3,
  },
  {
    id: "admissions" as const,
    label: "Admissions",
    href: "/general/dashboard/admissions",
    Icon: ClipboardList,
  },
  {
    id: "questions" as const,
    label: "Question upload",
    href: "/general/dashboard/create",
    Icon: Upload,
  },
];

export default function GeneralAdminSectionNav({
  active,
}: {
  active: GeneralAdminSection;
}) {
  return (
    <nav aria-label="General admin sections" className="w-full sm:w-fit">
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-sm">
        {sections.map(({ id, label, href, Icon }) => {
          const isActive = active === id;
          return (
            <Link
              key={id}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-center text-[11px] font-extrabold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 sm:px-4 sm:text-xs ${
                isActive
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white hover:text-slate-950"
              }`}
            >
              <Icon size={15} className="shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
