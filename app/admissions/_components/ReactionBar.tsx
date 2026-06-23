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

  // Restore the user's previous reaction from localStorage
  useEffect(() => {
    if (!gistId) return;
    const saved = localStorage.getItem(`reaction_${gistId}`);
    if (saved && VALID.includes(saved as ReactionType)) {
      setActive(saved as ReactionType);
    }
  }, [gistId]);

  async function react(type: ReactionType, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (active === type) {
      // Un-react: undo
      setCounts(p => ({ ...p, [type]: Math.max(0, p[type] - 1) }));
      setActive(null);
      if (gistId) {
        localStorage.removeItem(`reaction_${gistId}`);
        supabase.rpc("decrement_reaction", { gist_id: gistId, reaction_type: type });
      }
    } else {
      if (active) {
        // Switching from one reaction to another — undo the old one first
        setCounts(p => ({ ...p, [active]: Math.max(0, p[active] - 1) }));
        if (gistId) {
          supabase.rpc("decrement_reaction", { gist_id: gistId, reaction_type: active });
        }
      }
      // Apply new reaction
      setCounts(p => ({ ...p, [type]: p[type] + 1 }));
      setActive(type);
      if (gistId) {
        localStorage.setItem(`reaction_${gistId}`, type);
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
