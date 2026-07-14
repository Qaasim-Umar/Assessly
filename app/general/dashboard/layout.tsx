import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "General Mode Dashboard",
  description:
    "Assessly General Mode dashboard — practice, mock exams, and study sessions.",
  robots: { index: false, follow: false },
};

export default function GeneralDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
