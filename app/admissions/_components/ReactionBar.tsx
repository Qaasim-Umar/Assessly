"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Flame, Lightbulb } from "lucide-react";

type ReactionType = "fire" | "think";

const REACTION_LABELS: Record<ReactionType, string> = {
  fire: "fire",
  think: "thinking",
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

async function callReaction(gistId: string, type: ReactionType, action: "increment" | "decrement") {
  await fetch("/api/reactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gistId, type, action }),
  });
}

export default function ReactionBar({
  initial,
  dark = false,
  compact = false,
  gistId,
}: {
  initial: Record<ReactionType, number>;
  dark?: boolean;
  compact?: boolean;
  gistId?: string;
}) {
  const [counts, setCounts] = useState({ ...initial });
  const [active, setActive] = useState<ReactionType | null>(null);

  useEffect(() => {
    if (!gistId) return;
    let cancelled = false;

    // Restore which reaction this user picked
    const saved = localStorage.getItem(`reaction_${gistId}`);
    if (saved && VALID.includes(saved as ReactionType)) {
      queueMicrotask(() => {
        if (!cancelled) setActive(saved as ReactionType);
      });
    }

    // Fetch real counts from DB
    supabase
      .from("admissions_gists")
      .select("reactions")
      .eq("id", gistId)
      .single()
      .then(({ data }) => {
        if (!cancelled && data?.reactions) {
          setCounts(data.reactions as Record<ReactionType, number>);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [gistId]);

  async function react(type: ReactionType, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!gistId) return;

    if (active === type) {
      // Toggle off
      setCounts(p => ({ ...p, [type]: Math.max(0, p[type] - 1) }));
      setActive(null);
      localStorage.removeItem(`reaction_${gistId}`);
      callReaction(gistId, type, "decrement");
    } else {
      // Switch from previous reaction if any
      if (active) {
        setCounts(p => ({ ...p, [active]: Math.max(0, p[active] - 1) }));
        callReaction(gistId, active, "decrement");
      }
      setCounts(p => ({ ...p, [type]: p[type] + 1 }));
      setActive(type);
      localStorage.setItem(`reaction_${gistId}`, type);
      callReaction(gistId, type, "increment");
    }
  }

  const ACTIVE = dark ? ACTIVE_DARK : ACTIVE_LIGHT;

  const containerClass = compact
    ? "flex shrink-0 items-center gap-0.5"
    : dark
      ? "flex items-center gap-1.5 flex-wrap mt-3.5"
      : "flex items-center gap-1.5 flex-wrap pt-3 mt-3 border-t border-gray-200";

  const buttonTone = compact
    ? dark
      ? "border border-transparent bg-transparent px-2 text-white/60 hover:bg-white/10 hover:text-white/85"
      : "border border-transparent bg-transparent px-2 text-[#4a5e4e] hover:bg-black/5 hover:text-[#0d1a0f]"
    : dark
      ? "border border-white/10 bg-white/5 px-3 py-2 text-white/50 hover:border-white/25 hover:bg-white/10 hover:text-white/75"
      : "border border-[#e2ede6] bg-white px-3 py-2 text-[#4a5e4e] hover:border-[#9db5a3] hover:bg-[#f7faf8]";

  return (
    <div className={containerClass}>
      {VALID.map((type) => (
        <button
          key={type}
          type="button"
          onClick={(e) => react(type, e)}
          aria-pressed={active === type}
          aria-label={`${active === type ? "Remove" : "Add"} ${REACTION_LABELS[type]} reaction`}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1 text-sm font-bold rounded-full transition-[color,background-color,border-color] select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2
            ${buttonTone}
            ${active === type ? ACTIVE[type] : ""}
          `}
        >
          {type === "fire" ? (
            <Flame size={16} aria-hidden="true" />
          ) : (
            <Lightbulb size={16} aria-hidden="true" />
          )}
          <span>{counts[type]}</span>
        </button>
      ))}
    </div>
  );
}
