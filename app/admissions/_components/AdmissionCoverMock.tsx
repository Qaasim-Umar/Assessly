import Image from "next/image";
import { Image as ImageIcon, Newspaper } from "lucide-react";

export default function AdmissionCoverMock({
  label,
  title,
  imageUrl,
  priority = false,
}: {
  label: string;
  title: string;
  imageUrl?: string | null;
  priority?: boolean;
}) {
  if (imageUrl) {
    return (
      <div className="relative min-h-[190px] overflow-hidden bg-[#dce9df] sm:min-h-[260px]">
        <Image
          src={imageUrl}
          alt={`${title} featured image`}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, 480px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Cover image area for ${title}`}
      className="relative isolate min-h-[190px] overflow-hidden bg-gradient-to-br from-emerald-500 via-green-700 to-[#0d1a0f] sm:min-h-[260px]"
    >
      <div className="absolute -left-12 -top-16 h-48 w-48 rounded-full border-[34px] border-white/10" aria-hidden="true" />
      <div className="absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-amber-300/15 blur-sm" aria-hidden="true" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_48%,rgba(255,255,255,0.07)_48%,rgba(255,255,255,0.07)_52%,transparent_52%,transparent_100%)]" aria-hidden="true" />

      <div className="relative flex h-full min-h-[190px] flex-col justify-between p-5 sm:min-h-[260px] sm:p-6">
        <span className="w-fit rounded-full border border-white/20 bg-black/15 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white/90 backdrop-blur-sm">{label}</span>

        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-lg backdrop-blur-sm">
          <ImageIcon size={26} strokeWidth={1.8} aria-hidden="true" />
        </span>

        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-white/75">
          <Newspaper size={14} aria-hidden="true" />
          Assessly Admissions
        </span>
      </div>
    </div>
  );
}
