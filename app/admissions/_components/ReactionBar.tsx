"use client";

import { useState } from "react";

type ReactionType = "fire" | "shock" | "check" | "think";

const REACTION_EMOJIS: Record<ReactionType, string> = {
  fire: "🔥",
  shock: "😮",
  check: "✅",
  think: "🤔",
};

const ACTIVE_LIGHT: Record<ReactionType, string> = {
  fire: "!border-orange-200 !bg-orange-50 !text-orange-600",
  shock: "!border-amber-200 !bg-amber-50 !text-amber-600",
  check: "!border-green-200 !bg-green-50 !text-green-700",
  think: "!border-blue-200 !bg-blue-50 !text-blue-600",
};

const ACTIVE_DARK: Record<ReactionType, string> = {
  fire: "!border-orange-500/40 !bg-orange-500/20 !text-orange-300",
  shock: "!border-amber-500/40 !bg-amber-500/20 !text-yellow-300",
  check: "!border-green-500/40 !bg-green-500/20 !text-green-300",
  think: "!border-blue-500/40 !bg-blue-500/20 !text-blue-300",
};

export default function ReactionBar({
  initial,
  dark = false,
}: {
  initial: Record<ReactionType, number>;
  dark?: boolean;
}) {
  const [counts, setCounts] = useState({ ...initial });
  const [active, setActive] = useState<ReactionType | null>(null);

  function react(type: ReactionType, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (active === type) {
      setCounts({ ...initial });
      setActive(null);
    } else {
      setCounts({ ...initial, [type]: initial[type] + 1 });
      setActive(type);
    }
  }

  const ACTIVE = dark ? ACTIVE_DARK : ACTIVE_LIGHT;

  return (
    <div
      className={
        dark
          ? "flex items-center gap-1.5 flex-wrap mt-3.5"
          : "flex items-center gap-1.5 flex-wrap pt-3 mt-3 border-t border-gray-200"
      }
    >
      {(["fire", "shock", "check", "think"] as ReactionType[]).map((type) => (
        <button
          key={type}
          onClick={(e) => react(type, e)}
          className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full border transition-all select-none cursor-pointer
            ${
              dark
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
