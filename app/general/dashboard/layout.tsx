import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "General Mode Dashboard",
  description:
    "Manage Assessly's public question bank and admissions content.",
  robots: { index: false, follow: false },
};

export default function GeneralDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
