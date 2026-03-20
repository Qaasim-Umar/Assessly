import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Sign in or sign up to your Assessly admin dashboard to manage exams and students.",
  robots: { index: false, follow: false },
};

export default function DashboardLoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
