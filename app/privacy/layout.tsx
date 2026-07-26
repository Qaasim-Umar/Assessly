import type { Metadata } from "next";
import "../landing/landing.css";
import "./privacy.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Assessly collects, uses, stores, and protects personal data when students, schools, and visitors use our services.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Assessly",
    description:
      "How Assessly handles personal data for students, schools, and website visitors.",
    url: "/privacy",
  },
};

export default function PrivacyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
