"use client";

import { useEffect, useState } from "react";
import CbtDashboard from "@/components/CbtDashboard";
import LegacySchoolCreatorConsole from "@/components/LegacySchoolCreatorConsole";

type DashboardWorkspace = "individual" | "school";
const WORKSPACE_STORAGE_KEY = "assessly_dashboard_workspace";

export default function DashboardWorkspace() {
  const [workspace, setWorkspace] = useState<DashboardWorkspace | null>(null);

  useEffect(() => {
    let active = true;
    let restoredWorkspace: DashboardWorkspace = "individual";
    try {
      const savedWorkspace = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
      restoredWorkspace = savedWorkspace === "school" ? "school" : "individual";
    } catch { /* Browser storage is optional. */ }

    queueMicrotask(() => {
      if (active) setWorkspace(restoredWorkspace);
    });
    return () => { active = false; };
  }, []);

  const selectWorkspace = (nextWorkspace: DashboardWorkspace) => {
    setWorkspace(nextWorkspace);
    try {
      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, nextWorkspace);
    } catch {
      // The switch still works for this visit when browser storage is unavailable.
    }
  };

  if (workspace === null) {
    return (
      <div className="min-h-dvh bg-[var(--cbt-background)]" role="status" aria-label="Restoring dashboard workspace">
        <span className="sr-only">Restoring dashboard workspace…</span>
      </div>
    );
  }

  if (workspace === "school") {
    return <CbtDashboard onSwitchToIndividual={() => selectWorkspace("individual")} />;
  }

  return <LegacySchoolCreatorConsole onSwitchToSchool={() => selectWorkspace("school")} />;
}
