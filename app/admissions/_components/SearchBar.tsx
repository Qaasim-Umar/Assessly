"use client";

import { useRef } from "react";
import { usePostHog } from "posthog-js/react";

export default function SearchBar() {
  const posthog = usePostHog();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.trim();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value) return;
    timerRef.current = setTimeout(() => {
      posthog.capture("admissions_search", { query: value });
    }, 800);
  }

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-xl px-4 py-3 mb-5 hover:border-green-400 transition-colors cursor-text">
      <svg className="w-5 h-5 text-[#9db5a3] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        placeholder="Search scholarships, schools, deadlines..."
        className="flex-1 text-base text-[#0d1a0f] placeholder:text-[#9db5a3] bg-transparent outline-none"
        onChange={handleChange}
      />
    </div>
  );
}
