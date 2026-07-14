"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { ADMISSIONS_CATEGORIES } from "@/lib/admissionsCategories";

/**
 * Category pill links. Unlike the in-page TabBar (which filters the
 * already-loaded feed client-side without changing the URL), these are
 * real navigations to the server-rendered /admissions/category/[slug]
 * archive pages — each with its own SEO metadata and paginated query.
 */
export default function FilterBar() {
  const pathname = usePathname();
  const posthog = usePostHog();

  return (
    <div className="flex items-center gap-2 mb-7 flex-wrap">
      <span className="text-sm font-bold text-[#9db5a3] uppercase tracking-wide mr-1">
        Browse:
      </span>
      {ADMISSIONS_CATEGORIES.map((c) => {
        const href = `/admissions/category/${c.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={c.slug}
            href={href}
            onClick={() =>
              posthog.capture("admissions_filter_clicked", { category: c.label })
            }
            className={`text-base font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
              active
                ? "bg-green-600 border-green-600 text-white"
                : "bg-white border-[#e2ede6] text-[#4a5e4e] hover:border-green-400 hover:text-green-600"
            }`}
          >
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}
