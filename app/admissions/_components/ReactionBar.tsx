"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Flame, Lightbulb } from "lucide-react";

type ReactionType = "fire" | "think";
type ReactionTargetType = "gist" | "scholarship";
type ReactionCounts = Record<ReactionType, number>;

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

const REACTION_TABLES: Record<ReactionTargetType, "admissions_gists" | "admissions_scholarships"> = {
  gist: "admissions_gists",
  scholarship: "admissions_scholarships",
};

async function callReaction(
  targetId: string,
  targetType: ReactionTargetType,
  type: ReactionType,
  action: "increment" | "decrement",
): Promise<ReactionCounts> {
  const response = await fetch("/api/reactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetId, targetType, type, action }),
  });

  const result = await response.json() as {
    reactions?: ReactionCounts;
    error?: string;
  };

  if (!response.ok || !result.reactions) {
    throw new Error(result.error || "Unable to save reaction");
  }

  return result.reactions;
}

export default function ReactionBar({
  initial,
  dark = false,
  compact = false,
  targetId,
  targetType = "gist",
}: {
  initial: Record<ReactionType, number>;
  dark?: boolean;
  compact?: boolean;
  targetId?: string;
  targetType?: ReactionTargetType;
}) {
  const [counts, setCounts] = useState({ ...initial });
  const [active, setActive] = useState<ReactionType | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!targetId) return;
    let cancelled = false;
    const storageKey = `reaction_${targetType}_${targetId}`;

    // Restore which reaction this user picked
    const saved = localStorage.getItem(storageKey);
    if (saved && VALID.includes(saved as ReactionType)) {
      queueMicrotask(() => {
        if (!cancelled) setActive(saved as ReactionType);
      });
    }

    // Fetch real counts from DB
    supabase
      .from(REACTION_TABLES[targetType])
      .select("reactions")
      .eq("id", targetId)
      .single()
      .then(({ data }) => {
        if (!cancelled && data?.reactions) {
          setCounts(data.reactions as Record<ReactionType, number>);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [targetId, targetType]);

  async function react(type: ReactionType, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!targetId || saving) return;
    const storageKey = `reaction_${targetType}_${targetId}`;
    const previousActive = active;
    const previousCounts = { ...counts };

    setSaving(true);

    if (previousActive === type) {
      // Toggle off
      setCounts(p => ({ ...p, [type]: Math.max(0, p[type] - 1) }));
      setActive(null);
      localStorage.removeItem(storageKey);
    } else {
      // Switch from previous reaction if any
      setCounts(p => {
        const next = { ...p };
        if (previousActive) {
          next[previousActive] = Math.max(0, next[previousActive] - 1);
        }
        next[type] += 1;
        return next;
      });
      setActive(type);
      localStorage.setItem(storageKey, type);
    }

    try {
      let savedCounts: ReactionCounts;

      if (previousActive === type) {
        savedCounts = await callReaction(targetId, targetType, type, "decrement");
      } else {
        if (previousActive) {
          await callReaction(targetId, targetType, previousActive, "decrement");
        }
        savedCounts = await callReaction(targetId, targetType, type, "increment");
      }

      setCounts(savedCounts);
    } catch (error) {
      console.error("Unable to save reaction", error);
      setCounts(previousCounts);
      setActive(previousActive);
      if (previousActive) {
        localStorage.setItem(storageKey, previousActive);
      } else {
        localStorage.removeItem(storageKey);
      }
    } finally {
      setSaving(false);
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
          disabled={saving}
          onClick={(e) => react(type, e)}
          aria-pressed={active === type}
          aria-label={`${active === type ? "Remove" : "Add"} ${REACTION_LABELS[type]} reaction`}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1 text-sm font-bold rounded-full transition-[color,background-color,border-color] select-none cursor-pointer disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2
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
