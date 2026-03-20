import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "General Admin Login",
  description: "Sign in to the Assessly General Mode admin panel to manage public practice exams.",
  robots: { index: false, follow: false },
};

export default function GeneralDashboardLoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
