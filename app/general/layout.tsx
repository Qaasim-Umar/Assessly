import type { Metadata } from "next";

const BASE_URL = "https://www.assessly.ng";
const URL = `${BASE_URL}/general`;

export const metadata: Metadata = {
  title: "General Mode — Free Practice, Mock & Past Questions",
  description:
    "Practice JAMB, WAEC, NECO, and BECE for free — no school code needed. Topic-based practice, timed JAMB mock exams, Survival Mode, and real past questions.",
  keywords: [
    "free JAMB practice",
    "free WAEC practice",
    "JAMB mock exam online",
    "past questions practice Nigeria",
    "CBT practice Nigeria",
  ],
  alternates: { canonical: URL },
  openGraph: {
    title: "General Mode — Free Practice, Mock & Past Questions | Assessly",
    description:
      "Practice JAMB, WAEC, NECO, and BECE for free — no school code needed. Topic-based practice, timed mock exams, Survival Mode, and real past questions.",
    type: "website",
    url: URL,
    siteName: "Assessly",
  },
  twitter: {
    card: "summary_large_image",
    title: "General Mode — Free Practice, Mock & Past Questions | Assessly",
    description:
      "Practice JAMB, WAEC, NECO, and BECE for free — no school code needed.",
  },
};

export default function GeneralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
