"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type SearchResult = {
  id: string;
  title: string;
  slug: string | null;
  type: "gist" | "scholarship" | "deadline" | "cutoff" | "nysc";
};

function hrefFor(r: SearchResult) {
  if (r.type === "gist") return `/admissions/gists/${r.slug}`;
  if (r.type === "scholarship") return `/admissions/scholarships/${r.slug}`;
  if (r.type === "cutoff") return `/admissions/cutoffs/${r.slug}`;
  if (r.type === "nysc") return `/admissions/nysc/${r.slug}`;
  return `/admissions?tab=deadlines#deadlines`; // no detail page yet — jump to section
}

function labelFor(r: SearchResult) {
  if (r.type === "gist") return "Gist";
  if (r.type === "scholarship") return "Scholarship";
  if (r.type === "cutoff") return "Cutoff Mark";
  if (r.type === "nysc") return "NYSC";
  return "Deadline";
}

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryValue = searchParams.get("q") ?? "";
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [value, setValue] = useState(queryValue);
  const [previousQueryValue, setPreviousQueryValue] = useState(queryValue);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (queryValue !== previousQueryValue) {
    setPreviousQueryValue(queryValue);
    setValue(queryValue);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function runSearch(q: string) {
    abortRef.current?.abort();

    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    fetch(`/api/admissions/search?q=${encodeURIComponent(q.trim())}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setResults(data.results ?? []);
        setOpen(true);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Search failed", err);
          setLoading(false);
        }
      });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setValue(q);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) {
        params.set("q", q.trim());
      } else {
        params.delete("q");
      }
      router.push(`/admissions?${params.toString()}`, { scroll: false });
      runSearch(q);
    }, 400);
  }

  function handleClear() {
    setValue("");
    setResults([]);
    setOpen(false);
    abortRef.current?.abort();
    if (timerRef.current) clearTimeout(timerRef.current);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.push(`/admissions?${params.toString()}`, { scroll: false });
  }

  return (
    <div ref={containerRef} className="relative mb-5">
      <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-xl px-4 py-3 hover:border-green-400 focus-within:border-green-400 transition-colors">
        <svg
          className="w-5 h-5 text-[#9db5a3] shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={value}
          placeholder="Search scholarships, schools, deadlines..."
          className="flex-1 text-base text-[#0d1a0f] placeholder:text-[#9db5a3] bg-transparent outline-none"
          onChange={handleChange}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
        />
        {value && (
          <button
            onClick={handleClear}
            className="text-[#9db5a3] hover:text-[#4a5e4e] transition-colors shrink-0"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 text-sm text-[#9db5a3]">Searching…</div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <a
                    href={hrefFor(r)}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-[#f7faf8] transition-colors"
                  >
                    <span className="text-[#0d1a0f] font-medium truncate">
                      {r.title}
                    </span>
                    <span className="text-[12px] font-bold text-[#9db5a3] uppercase ml-3 shrink-0">
                      {labelFor(r)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-[#9db5a3]">
              No results found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
