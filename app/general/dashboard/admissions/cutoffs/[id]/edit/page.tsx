"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getGeneralAdminSession } from "@/lib/generalAdminAuth";
import CutoffForm, { type CutoffData } from "../../../_components/CutoffForm";

export default function EditCutoffPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [data, setData] = useState<CutoffData | null>(null);

    useEffect(() => {
        getGeneralAdminSession().then((session) => {
            if (!session) {
                router.replace("/general/dashboard/login");
                return;
            }
            supabase.from("admissions_cutoffs").select("*").eq("id", id).single().then(({ data: d, error }) => {
                if (error || !d) { router.replace("/general/dashboard/admissions"); return; }
                setData(d as CutoffData);
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (!data) return <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center text-sm text-gray-400">Loading…</div>;
    return <CutoffForm mode="edit" initial={data} />;
}
