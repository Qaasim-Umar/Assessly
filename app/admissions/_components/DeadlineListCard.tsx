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
    <div className="bg-white border border-gray-300 rounded-[18px] p-4 sm:px-5 sm:py-4 hover:border-green-200 transition-colors">
      {/* Mobile: stack vertically */}
      <div className="flex sm:hidden flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className={`w-[60px] h-[60px] rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${s.block}`}>
            <span className={`text-2xl font-extrabold leading-none ${s.text}`}>
              {day}
            </span>
            <span className={`text-[12px] font-extrabold tracking-wide uppercase ${s.text}`}>
              {month}
            </span>
          </div>
          <span className={`text-[13px] font-extrabold tracking-wide px-3 py-1.5 rounded-full ${s.badge}`}>
            {badge}
          </span>
        </div>
        <div>
          <h3 className="text-base font-bold text-[#0d1a0f] mb-0.5">{title}</h3>
          <p className="text-sm text-[#4a5e4e]">
            <InlineMarkdown content={desc} />
          </p>
        </div>
      </div>

      {/* Desktop: grid layout */}
      <div className="hidden sm:grid grid-cols-[auto_1fr_auto] gap-4 items-center">
        <div className={`w-[60px] h-[60px] rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${s.block}`}>
          <span className={`text-2xl font-extrabold leading-none ${s.text}`}>
            {day}
          </span>
          <span className={`text-[12px] font-extrabold tracking-wide uppercase ${s.text}`}>
            {month}
          </span>
        </div>
        <div>
          <h3 className="text-base font-bold text-[#0d1a0f] mb-0.5">{title}</h3>
          <p className="text-base text-[#4a5e4e]">
            <InlineMarkdown content={desc} />
          </p>
        </div>
        <span className={`text-[13px] font-extrabold tracking-wide px-3 py-1.5 rounded-full flex-shrink-0 ${s.badge}`}>
          {badge}
        </span>
      </div>
    </div>
  );
}
