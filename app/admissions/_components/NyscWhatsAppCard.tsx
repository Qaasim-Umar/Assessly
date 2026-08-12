import { ArrowUpRight, MessageCircle } from "lucide-react";

const NYSC_WHATSAPP_GROUP_URL =
  "https://chat.whatsapp.com/GvsanT2PVGp8aGyjRYUmvX?s=cl&p=i&ilr=0";

export default function NyscWhatsAppCard() {
  return (
    <aside
      aria-label="NYSC WhatsApp community"
      className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-5 sm:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
            <MessageCircle size={24} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-[18px] font-bold leading-snug text-[#0d1a0f] sm:text-[19px]">
              Join our NYSC WhatsApp community
            </h3>
            <p className="mt-1 text-base leading-relaxed text-[#4a5e4e]">
              Get camp updates, registration reminders, and important NYSC news.
            </p>
          </div>
        </div>

        <a
          href={NYSC_WHATSAPP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-base font-bold text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
          aria-label="Join the NYSC WhatsApp group (opens in a new tab)"
          data-ph-capture-attribute-cta="join_nysc_whatsapp_group"
        >
          Join WhatsApp group
          <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
}
