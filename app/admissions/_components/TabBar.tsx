"use client";

import { useState } from "react";

type TabId = "All" | "School Gists" | "Scholarships" | "Deadlines" | "Cut-off Marks";

const TABS: { id: TabId; count: number }[] = [
  { id: "All", count: 94 },
  { id: "School Gists", count: 38 },
  { id: "Scholarships", count: 47 },
  { id: "Deadlines", count: 12 },
  { id: "Cut-off Marks", count: 9 },
];

export default function TabBar() {
  const [activeTab, setActiveTab] = useState<TabId>("All");

  return (
    <div className="max-w-[1100px] mx-auto flex mt-6 border-t border-white/10 overflow-x-auto -mb-px">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          className={`text-base font-semibold px-6 py-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap
            ${activeTab === t.id ? "text-white border-green-500" : "text-white/40 border-transparent hover:text-white/70"}`}
        >
          {t.id}
          <span
            className={`text-[13px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === t.id ? "bg-green-500 text-white" : "bg-white/10 text-white/50"
            }`}
          >
            {t.count}
          </span>
        </button>
      ))}
    </div>
  );
}
