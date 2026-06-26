"use client";

import { useState } from "react";
import { usePostHog } from "posthog-js/react";

const FILTERS = ["All Schools", "UNILAG", "OAU", "UI", "FUTA", "UNIBEN", "ABU"];

export default function FilterBar() {
  const [activeFilter, setActiveFilter] = useState("All Schools");
  const posthog = usePostHog();

  return (
    <div className="flex items-center gap-2 mb-7 flex-wrap">
      <span className="text-sm font-bold text-[#9db5a3] uppercase tracking-wide mr-1">Filter:</span>
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => {
            setActiveFilter(f);
            posthog.capture("admissions_filter_clicked", { school: f });
          }}
          className={`text-base font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
            activeFilter === f
              ? "bg-green-600 border-green-600 text-white"
              : "bg-white border-[#e2ede6] text-[#4a5e4e] hover:border-green-400 hover:text-green-600"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
