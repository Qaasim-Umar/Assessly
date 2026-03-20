import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Assessly is Nigeria's leading CBT platform for schools and students. Create exams with AI, run timed practice tests, and get instant results — free for every student.",
  alternates: {
    canonical: "https://assessly.app/landing",
  },
  openGraph: {
    url: "https://assessly.app/landing",
    title: "Assessly — Smart CBT Exams for Nigerian Schools",
    description:
      "Create, manage and deliver Computer-Based Tests in minutes. Free practice exams for WAEC, JAMB & NECO students. No account needed.",
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
