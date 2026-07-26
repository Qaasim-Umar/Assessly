import type { Metadata } from "next";
import "../landing/landing.css";
import "../company.css";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Assessly for student support, school enquiries, account help, privacy requests, or product feedback.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Assessly",
    description: "Get help with Assessly or talk to us about your school.",
    url: "/contact",
  },
};

export default function ContactLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
