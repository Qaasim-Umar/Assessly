"use client";

import { useState } from "react";
import CbtDashboard from "@/components/CbtDashboard";
import LegacySchoolCreatorConsole from "@/components/LegacySchoolCreatorConsole";

type DashboardWorkspace = "individual" | "school";

export default function DashboardWorkspace() {
  const [workspace, setWorkspace] = useState<DashboardWorkspace>("individual");

  if (workspace === "school") {
    return <CbtDashboard onSwitchToIndividual={() => setWorkspace("individual")} />;
  }

  return <LegacySchoolCreatorConsole onSwitchToSchool={() => setWorkspace("school")} />;
}
