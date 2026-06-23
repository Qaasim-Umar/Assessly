"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ScholarshipForm, { type ScholarshipData } from "../../../_components/ScholarshipForm";

export default function EditScholarshipPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [data, setData] = useState<ScholarshipData | null>(null);

    useEffect(() => {
        if (sessionStorage.getItem("generalAdmin") !== "1") { router.replace("/general/dashboard/login"); return; }
        supabase.from("admissions_scholarships").select("*").eq("id", id).single().then(({ data: d, error }) => {
            if (error || !d) { router.replace("/general/dashboard/admissions"); return; }
            setData(d as ScholarshipData);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (!data) return <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center text-sm text-gray-400">Loading…</div>;
    return <ScholarshipForm mode="edit" initial={data} />;
}
