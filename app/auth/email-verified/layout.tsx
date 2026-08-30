import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Email verified | Assessly",
  },
  description: "Your Assessly sign-in email has been verified.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmailVerifiedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
