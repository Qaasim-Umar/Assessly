"use client";

import { useDeadlineCountdown } from "@/lib/admissionsDeadline";

/**
 * Compact sidebar row for the "Coming Up" deadlines card — a dot, title,
 * and countdown badge only. Distinct from DeadlineListCard, which is the
 * full-width card style used in the main feed/archive lists.
 */
export default function ComingUpItem({
  title,
  deadlineDate,
}: {
  title: string;
  deadlineDate: string;
}) {
  const { urgency, badge } = useDeadlineCountdown(deadlineDate);
  const dotColor: Record<string, string> = {
    urgent: "bg-rose-500",
    soon: "bg-amber-500",
    open: "bg-green-500",
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${dotColor[urgency] ?? "bg-gray-400"}`}
      />
      <div>
        <strong className="text-base font-bold text-[#0d1a0f] block">
          {title}
        </strong>
        <span className="text-sm text-[#9db5a3]">{badge}</span>
      </div>
    </div>
  );
}
