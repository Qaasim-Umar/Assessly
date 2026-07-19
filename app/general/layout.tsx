import type { Metadata } from "next";

const BASE_URL = "https://www.assessly.ng";
const URL = `${BASE_URL}/general`;

export const metadata: Metadata = {
  title: "General Mode — Free JAMB, WAEC, NECO & BECE Practice",
  description:
    "Practice JAMB, WAEC, NECO, and BECE for free in five modes: JAMB Simulator, Practice Mode, Survival Mode, Past Questions, and Study Mode.",
  keywords: [
    "free JAMB practice",
    "free WAEC practice",
    "free NECO practice",
    "free BECE practice",
    "JAMB mock exam online",
    "past questions practice Nigeria",
    "CBT practice Nigeria",
  ],
  alternates: { canonical: URL },
  openGraph: {
    title: "General Mode — Free JAMB, WAEC, NECO & BECE Practice | Assessly",
    description:
      "Practice JAMB, WAEC, NECO, and BECE for free in five modes — no school code needed. JAMB Simulator, Practice Mode, Survival Mode, Past Questions, and Study Mode.",
    type: "website",
    url: URL,
    siteName: "Assessly",
  },
  twitter: {
    card: "summary_large_image",
    title: "General Mode — Free JAMB, WAEC, NECO & BECE Practice | Assessly",
    description:
      "Practice JAMB, WAEC, NECO, and BECE for free in five modes — no school code needed.",
  },
};

export default function GeneralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
