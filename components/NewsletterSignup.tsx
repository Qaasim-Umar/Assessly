import { Mail } from "lucide-react";

type NewsletterSignupProps = {
  id: string;
  variant?: "sidebar" | "inline" | "footer";
};

const SUBSTACK_EMBED_URL =
  "https://assessly.substack.com/embed?transparent=1&light=1";

export default function NewsletterSignup({
  id,
  variant = "sidebar",
}: NewsletterSignupProps) {
  const titleId = `newsletter-title-${id}`;
  const isFooter = variant === "footer";

  return (
    <aside
      className={`relative overflow-hidden rounded-2xl p-5 text-white sm:p-6 ${
        isFooter
          ? "border border-white/10 bg-white/[0.035]"
          : "bg-[#13351d] shadow-[0_12px_30px_rgba(13,26,15,0.12)]"
      }`}
      aria-labelledby={titleId}
    >
      <div
        className="absolute -right-8 -top-10 size-32 rounded-full bg-green-400/10"
        aria-hidden="true"
      />

      <div
        className={`relative ${
          isFooter
            ? "grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(320px,500px)] md:items-center"
            : ""
        }`}
      >
        <div>
          <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-white/10 text-green-300">
            <Mail size={20} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <p className="mb-1.5 text-[12px] font-extrabold uppercase tracking-[0.12em] text-green-300">
            Weekly updates
          </p>
          <h3
            id={titleId}
            className="text-[22px] font-extrabold leading-tight tracking-[-0.3px]"
          >
            Don&apos;t miss an important date
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
            Get scholarships, upcoming events and school news in one useful
            weekly email.
          </p>
        </div>

        <div className={isFooter ? "min-w-0" : "mt-5 min-w-0"}>
          <iframe
            src={SUBSTACK_EMBED_URL}
            title="Subscribe to the Assessly newsletter on Substack"
            width="480"
            height="150"
            loading="lazy"
            frameBorder="0"
            scrolling="no"
            className="block h-[150px] w-full max-w-full bg-transparent"
            style={{ border: 0, background: "transparent" }}
          />
        </div>
      </div>
    </aside>
  );
}
