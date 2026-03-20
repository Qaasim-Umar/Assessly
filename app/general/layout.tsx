import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Practice Exams — WAEC, JAMB & NECO",
  description:
    "Access thousands of free WAEC, JAMB/UTME, NECO, BECE and Post-UTME past questions. No login, no account — just pick a category and start practising instantly.",
  keywords: [
    "free WAEC practice questions",
    "JAMB past questions free",
    "NECO practice test",
    "BECE past questions",
    "Post-UTME practice",
    "free CBT practice Nigeria",
    "Nigerian exam past questions",
  ],
  alternates: {
    canonical: "https://assessly.app/general",
  },
  openGraph: {
    url: "https://assessly.app/general",
    title: "Free Practice Exams — WAEC, JAMB & NECO | Assessly",
    description:
      "Thousands of free past questions for WAEC, JAMB/UTME, NECO, BECE and Post-UTME. No account required. Instant results.",
  },
};

export default function GeneralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
