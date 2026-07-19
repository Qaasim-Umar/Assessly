"use client";

import Link from "next/link";
import Image from "next/image";

interface StudentNavProps {
  back?: { href: string; label: string };
  badge?: string;
  right?: React.ReactNode;
}

export default function StudentNav({ back, badge, right }: StudentNavProps) {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Left: optional back + logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {back && (
            <>
              <Link
                href={back.href}
                aria-label={back.label}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-green-700 transition-colors shrink-0"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 12L6 8l4-4" />
                </svg>
                <span className="hidden sm:inline">{back.label}</span>
              </Link>
              <div className="w-px h-5 bg-gray-200 shrink-0" />
            </>
          )}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0">
            <Image src="/assessly-icon.svg" alt="Assessly" width={28} height={28} style={{ display: 'block' }} className="shrink-0" />
            <span className="text-sm font-bold text-gray-900 tracking-tight truncate">Assessly</span>
          </Link>
        </div>

        {/* Right: badge or custom slot */}
        <div className="flex items-center gap-3 shrink-0">
          {badge && (
            <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">
              {badge}
            </span>
          )}
          {right}
        </div>
      </div>
    </header>
  );
}
