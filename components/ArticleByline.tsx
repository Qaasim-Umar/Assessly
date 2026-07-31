import { UserRound } from "lucide-react";

export default function ArticleByline({
  publishedAt,
  dark = false,
}: {
  publishedAt?: string | null;
  dark?: boolean;
}) {
  const date = publishedAt ? new Date(publishedAt) : null;
  const publishedLabel =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "Africa/Lagos",
        })
      : null;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm ${dark ? "text-white/55" : "text-[#6f8374]"}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <UserRound size={14} aria-hidden="true" />
        By <strong className={dark ? "text-white/80" : "text-[#29432f]"}>UQB</strong>
      </span>
      {publishedLabel && <span>Published {publishedLabel}</span>}
      <a
        href="mailto:hello@assessly.ng?subject=Admission%20article%20correction"
        className={`font-semibold underline underline-offset-2 ${dark ? "hover:text-white" : "hover:text-green-700"}`}
      >
        Report a correction
      </a>
    </div>
  );
}
