import type { Metadata } from "next";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Create and manage Assessly exams as an individual creator or school.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
