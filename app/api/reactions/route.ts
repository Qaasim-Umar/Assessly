import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { gistId, type, action } = await req.json() as {
    gistId: string;
    type: string;
    action: "increment" | "decrement";
  };

  if (!gistId || !type || !action) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Fetch current reactions
  const { data, error } = await supabase
    .from("admissions_gists")
    .select("reactions")
    .eq("id", gistId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Gist not found" }, { status: 404 });
  }

  const reactions = (data.reactions ?? {}) as Record<string, number>;
  const current = typeof reactions[type] === "number" ? reactions[type] : 0;
  const next = action === "increment" ? current + 1 : Math.max(0, current - 1);

  const { error: updateError } = await supabase
    .from("admissions_gists")
    .update({ reactions: { ...reactions, [type]: next } })
    .eq("id", gistId);

  if (updateError) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ [type]: next });
}
