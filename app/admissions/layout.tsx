import type { Metadata } from "next";
import Footer from "@/components/Footer";
import AdmissionsNavbar from "./_components/AdmissionsNavbar";

export const metadata: Metadata = {
  title: "Nigerian University Scholarships & Admission Deadlines",
  description: "Find Nigerian university scholarships, admission deadlines, cut-off marks, and school gists. Shell, FGN, MTN scholarships and JAMB CAPS deadlines — all updated weekly.",
  keywords: [
    "Nigerian university scholarships",
    "JAMB CAPS",
    "UNILAG Post-UTME",
    "university admission deadlines Nigeria",
    "Shell Nigeria scholarship",
    "OAU admission list",
    "university cut-off marks",
  ],
  openGraph: {
    title: "Admissions Hub | Assessly",
    description: "Find Nigerian university scholarships, admission deadlines, cut-off marks, and school gists. Shell, FGN, MTN scholarships and JAMB CAPS deadlines — all updated weekly.",
    type: "website",
    url: "https://www.assessly.ng/admissions",
  },
  twitter: {
    card: "summary_large_image",
    title: "Admissions Hub | Assessly",
    description: "Find Nigerian university scholarships, admission deadlines, cut-off marks, and school gists.",
  },
  alternates: { canonical: "https://www.assessly.ng/admissions" },
};

export default function AdmissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdmissionsNavbar />
      {children}
      <Footer />
    </>
  );
}
