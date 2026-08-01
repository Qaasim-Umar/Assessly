"use client";

import InlineMarkdown from "@/components/InlineMarkdown";
import { useDeadlineCountdown, type DeadlineUrgency } from "@/lib/admissionsDeadline";

const URGENCY_STYLES: Record<DeadlineUrgency, { block: string; text: string; badge: string }> = {
  urgent: {
    block: "bg-rose-100 border border-rose-200",
    text: "text-rose-600",
    badge: "bg-rose-100 text-rose-600",
  },
  soon: {
    block: "bg-amber-100 border border-amber-200",
    text: "text-amber-600",
    badge: "bg-amber-100 text-amber-600",
  },
  open: {
    block: "bg-green-100 border border-green-200",
    text: "text-green-600",
    badge: "bg-green-100 text-green-700",
  },
};

export default function DeadlineListCard({
  title,
  desc,
  deadlineDate,
}: {
  title: string;
  desc: string;
  deadlineDate: string;
}) {
  // Always compute day/month/urgency/badge live from deadlineDate rather than
  // trusting any stale badge/urgency value stored in the database, so the
  // card correctly flips to "Passed" once the date has gone by.
  const { day_label: day, month_label: month, urgency, badge } = useDeadlineCountdown(deadlineDate);
  const s = URGENCY_STYLES[urgency] ?? URGENCY_STYLES.open;
  return (
    <div className="bg-white border border-gray-300 rounded-xl px-3 py-2.5 sm:px-4 hover:border-green-200 transition-colors">
      <div className="grid grid-cols-[48px_minmax(0,1fr)_auto] gap-3 items-center">
        <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${s.block}`}>
          <span className={`text-lg font-extrabold leading-none ${s.text}`}>
            {day}
          </span>
          <span className={`text-[10px] font-extrabold tracking-wide uppercase ${s.text}`}>
            {month}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold leading-snug text-[#0d1a0f]">{title}</h3>
          <p className="line-clamp-1 text-xs sm:text-sm text-[#4a5e4e]">
            <InlineMarkdown content={desc} />
          </p>
        </div>
        <span className={`text-[11px] sm:text-xs font-extrabold tracking-wide px-2 py-1 rounded-full flex-shrink-0 ${s.badge}`}>
          {badge}
        </span>
      </div>
    </div>
  );
}
