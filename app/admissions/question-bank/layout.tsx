import type { Metadata } from "next";

const BASE_URL = "https://www.assessly.ng";
const URL = `${BASE_URL}/admissions/question-bank`;

export const metadata: Metadata = {
  title: "Free JAMB, WAEC & Post-UTME Past Questions | Question Bank",
  description:
    "Download free JAMB, WAEC, NECO, BECE, and Post-UTME past question papers with answer keys and study notes. 340+ packs, no payment required during early access.",
  keywords: [
    "JAMB past questions free download",
    "WAEC past questions PDF",
    "Post UTME past questions",
    "NECO past questions download",
    "free past questions Nigeria",
    "JAMB answer keys",
    "WAEC marking scheme",
  ],
  alternates: { canonical: URL },
  openGraph: {
    title: "Free JAMB, WAEC & Post-UTME Past Questions | Assessly",
    description:
      "Download free JAMB, WAEC, NECO, BECE, and Post-UTME past question papers with answer keys and study notes — 340+ packs, no payment required.",
    type: "website",
    url: URL,
    siteName: "Assessly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free JAMB, WAEC & Post-UTME Past Questions | Assessly",
    description:
      "Download free JAMB, WAEC, NECO, BECE, and Post-UTME past question papers with answer keys and study notes.",
  },
};

export default function QuestionBankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
