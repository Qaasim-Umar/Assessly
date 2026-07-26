import type { Metadata } from "next";
import "../landing/landing.css";
import "../company.css";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn why Assessly is building simpler, more useful exam practice and computer-based testing tools for Nigerian students and schools.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Assessly",
    description:
      "Better exam practice for students and better testing tools for schools.",
    url: "/about",
  },
};

export default function AboutLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
