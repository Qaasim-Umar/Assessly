export type DeadlineUrgency = "urgent" | "soon" | "open";

export interface ComputedDeadline {
  day_label: string;
  month_label: string;
  urgency: DeadlineUrgency;
  badge: string;
}

export function computeDeadlineFromDate(iso: string): ComputedDeadline {
  const date = new Date(iso);
  const diff = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  const day_label = date.getDate().toString();
  const month_label = date.toLocaleDateString("en-GB", { month: "short" });
  const urgency: DeadlineUrgency =
    diff < 0 ? "urgent" : diff < 14 ? "urgent" : diff < 30 ? "soon" : "open";
  const badge =
    diff < 0 ? "Passed" : diff === 0 ? "Today!" : `${diff} days left`;

  return { day_label, month_label, urgency, badge };
}
