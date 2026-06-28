"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const posthog = usePostHog();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setValue(q);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) {
        params.set("q", q.trim());
        posthog.capture("admissions_search", { query: q.trim() });
      } else {
        params.delete("q");
      }
      router.push(`/admissions?${params.toString()}`);
    }, 400);
  }

  function handleClear() {
    setValue("");
    if (timerRef.current) clearTimeout(timerRef.current);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.push(`/admissions?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-xl px-4 py-3 mb-5 hover:border-green-400 focus-within:border-green-400 transition-colors">
      <svg className="w-5 h-5 text-[#9db5a3] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={value}
        placeholder="Search scholarships, schools, deadlines..."
        className="flex-1 text-base text-[#0d1a0f] placeholder:text-[#9db5a3] bg-transparent outline-none"
        onChange={handleChange}
      />
      {value && (
        <button onClick={handleClear} className="text-[#9db5a3] hover:text-[#4a5e4e] transition-colors flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      )}
    </div>
  );
}
