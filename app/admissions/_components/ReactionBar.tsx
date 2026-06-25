"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type ReactionType = "fire" | "think";

const REACTION_EMOJIS: Record<ReactionType, string> = {
  fire: "🔥",
  think: "🤔",
};

const ACTIVE_LIGHT: Record<ReactionType, string> = {
  fire: "!border-orange-200 !bg-orange-50 !text-orange-600",
  think: "!border-blue-200 !bg-blue-50 !text-blue-600",
};

const ACTIVE_DARK: Record<ReactionType, string> = {
  fire: "!border-orange-500/40 !bg-orange-500/20 !text-orange-300",
  think: "!border-blue-500/40 !bg-blue-500/20 !text-blue-300",
};

const VALID: ReactionType[] = ["fire", "think"];

function storageKey(gistId: string) { return `reaction_v2_${gistId}`; }

interface Stored { type: ReactionType; counts: Record<ReactionType, number> }

export default function ReactionBar({
  initial,
  dark = false,
  gistId,
}: {
  initial: Record<ReactionType, number>;
  dark?: boolean;
  gistId?: string;
}) {
  const [counts, setCounts] = useState({ ...initial });
  const [active, setActive] = useState<ReactionType | null>(null);

  useEffect(() => {
    if (!gistId) return;

    // Restore saved counts + active immediately — no flash
    try {
      const raw = localStorage.getItem(storageKey(gistId));
      if (raw) {
        const saved: Stored = JSON.parse(raw);
        if (VALID.includes(saved.type)) {
          setActive(saved.type);
          setCounts(saved.counts);
          return; // skip DB fetch — user already has fresh counts stored
        }
      }
    } catch { /* ignore parse errors */ }

    // No localStorage record — fetch fresh from DB
    supabase
      .from("admissions_gists")
      .select("reactions")
      .eq("id", gistId)
      .single()
      .then(({ data }) => {
        if (data?.reactions) setCounts(data.reactions as Record<ReactionType, number>);
      });
  }, [gistId]);

  async function react(type: ReactionType, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (active === type) {
      const next = { ...counts, [type]: Math.max(0, counts[type] - 1) };
      setCounts(next);
      setActive(null);
      if (gistId) {
        localStorage.removeItem(storageKey(gistId));
        supabase.rpc("decrement_reaction", { gist_id: gistId, reaction_type: type });
      }
    } else {
      let next = { ...counts };
      if (active) {
        next = { ...next, [active]: Math.max(0, next[active] - 1) };
        if (gistId) supabase.rpc("decrement_reaction", { gist_id: gistId, reaction_type: active });
      }
      next = { ...next, [type]: next[type] + 1 };
      setCounts(next);
      setActive(type);
      if (gistId) {
        // Store both the chosen type AND the updated counts so refresh is instant
        localStorage.setItem(storageKey(gistId), JSON.stringify({ type, counts: next } satisfies Stored));
        supabase.rpc("increment_reaction", { gist_id: gistId, reaction_type: type });
      }
    }
  }

  const ACTIVE = dark ? ACTIVE_DARK : ACTIVE_LIGHT;

  return (
    <div className={dark
      ? "flex items-center gap-1.5 flex-wrap mt-3.5"
      : "flex items-center gap-1.5 flex-wrap pt-3 mt-3 border-t border-gray-200"
    }>
      {VALID.map((type) => (
        <button
          key={type}
          onClick={(e) => react(type, e)}
          className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full border transition-all select-none cursor-pointer
            ${dark
              ? "border-white/10 bg-white/5 text-white/50 hover:border-white/25 hover:bg-white/10 hover:text-white/75"
              : "border-[#e2ede6] bg-white text-[#4a5e4e] hover:border-[#9db5a3] hover:bg-[#f7faf8]"
            }
            ${active === type ? ACTIVE[type] : ""}
          `}
        >
          <span className="text-base leading-none">{REACTION_EMOJIS[type]}</span>
          <span>{counts[type]}</span>
        </button>
      ))}
    </div>
  );
}
