"use client";

import { usePostHog } from "posthog-js/react";
import {
  ADMISSIONS_CATEGORIES,
  type CategorySlug,
} from "@/lib/admissionsCategories";

export type TabId = "all" | CategorySlug;

type Counts = { all: number } & Record<CategorySlug, number>;

interface TabBarProps {
  counts: Counts;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function TabBar({
  counts,
  activeTab,
  onTabChange,
}: TabBarProps) {
  const posthog = usePostHog();

  const TABS: { id: TabId; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    ...ADMISSIONS_CATEGORIES.map((c) => ({
      id: c.slug,
      label: c.label,
      count: counts[c.slug],
    })),
  ];

  return (
    <div className="max-w-[1100px] mx-auto flex mt-6 border-t border-white/10 overflow-x-auto -mb-px">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => {
            onTabChange(t.id);
            posthog.capture("admissions_tab_clicked", { tab: t.label });
          }}
          className={`text-base font-semibold px-6 py-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap
            ${activeTab === t.id ? "text-white border-green-500" : "text-white/40 border-transparent hover:text-white/70"}`}
        >
          {t.label}
          <span
            className={`text-[13px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === t.id
                ? "bg-green-500 text-white"
                : "bg-white/10 text-white/50"
            }`}
          >
            {t.count}
          </span>
        </button>
      ))}
    </div>
  );
}
