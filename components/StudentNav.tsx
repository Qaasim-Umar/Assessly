"use client";

import Link from "next/link";

interface StudentNavProps {
  back?: { href: string; label: string };
  badge?: string;
  right?: React.ReactNode;
}

export default function StudentNav({ back, badge, right }: StudentNavProps) {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: optional back + logo */}
        <div className="flex items-center gap-3">
          {back && (
            <>
              <Link
                href={back.href}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-green-700 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 12L6 8l4-4" />
                </svg>
                {back.label}
              </Link>
              <div className="w-px h-5 bg-gray-200" />
            </>
          )}
          <Link href="/landing" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-green-700 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-tight">Assessly</span>
          </Link>
        </div>

        {/* Right: badge or custom slot */}
        <div className="flex items-center gap-3">
          {badge && (
            <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
              {badge}
            </span>
          )}
          {right}
        </div>
      </div>
    </header>
  );
}
