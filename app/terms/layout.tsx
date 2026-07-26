import type { Metadata } from "next";
import "../landing/landing.css";
import "../privacy/privacy.css";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the terms that govern access to and use of Assessly by students, educators, schools, and visitors.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service | Assessly",
    description:
      "The rules and responsibilities that apply when using Assessly.",
    url: "/terms",
  },
};

export default function TermsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
