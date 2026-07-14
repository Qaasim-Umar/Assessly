import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Dashboard",
  description:
    "Your Assessly student dashboard — view and take published exams.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.assessly.ng/student" },
};

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
