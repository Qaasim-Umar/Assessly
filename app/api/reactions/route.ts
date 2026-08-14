import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

type ReactionType = "fire" | "think";
type ReactionTargetType = "gist" | "scholarship";
type ReactionAction = "increment" | "decrement";
type ReactionCounts = Record<ReactionType, number>;

const REACTION_TABLES: Record<
  ReactionTargetType,
  "admissions_gists" | "admissions_scholarships"
> = {
  gist: "admissions_gists",
  scholarship: "admissions_scholarships",
};

const VALID_REACTION_TYPES: ReactionType[] = ["fire", "think"];
const VALID_ACTIONS: ReactionAction[] = ["increment", "decrement"];

function normaliseCounts(value: unknown): ReactionCounts {
  const reactions = value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};

  return {
    fire: typeof reactions.fire === "number" ? reactions.fire : 0,
    think: typeof reactions.think === "number" ? reactions.think : 0,
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { targetId, targetType, type, action } = (body ?? {}) as {
    targetId?: string;
    targetType?: ReactionTargetType;
    type?: ReactionType;
    action?: ReactionAction;
  };

  if (
    typeof targetId !== "string" ||
    !targetId ||
    !targetType ||
    !(targetType in REACTION_TABLES) ||
    !type ||
    !VALID_REACTION_TYPES.includes(type) ||
    !action ||
    !VALID_ACTIONS.includes(action)
  ) {
    return NextResponse.json({ error: "Invalid reaction request" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const table = REACTION_TABLES[targetType];
  const { data, error } = await supabase
    .from(table)
    .select("reactions")
    .eq("id", targetId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Reaction target not found" }, { status: 404 });
  }

  const reactions = normaliseCounts(data.reactions);
  const current = reactions[type];
  const next = action === "increment" ? current + 1 : Math.max(0, current - 1);

  const { data: updated, error: updateError } = await supabase
    .from(table)
    .update({ reactions: { ...reactions, [type]: next } })
    .eq("id", targetId)
    .select("reactions")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ reactions: normaliseCounts(updated.reactions) });
}
