"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LiveTicker() {
    const [text, setText] = useState("");

    useEffect(() => {
        async function load() {
            const [{ data: deadlines }, { data: gists }] = await Promise.all([
                supabase.from("admissions_deadlines").select("title, badge").eq("published", true).order("deadline_date", { ascending: true }).limit(4),
                supabase.from("admissions_gists").select("title").eq("published", true).order("created_at", { ascending: false }).limit(4),
            ]);

            const items = [
                ...(deadlines ?? []).map(d => `${d.title} · ${d.badge}`),
                ...(gists ?? []).map(g => g.title),
            ];

            setText(items.length > 0 ? items.join("  ·  ") : "Stay tuned — new updates coming soon");
        }
        load();
    }, []);

    return (
        <span className="text-base text-white/60 whitespace-nowrap ticker-anim">
            {text || "Loading…"}
        </span>
    );
}
