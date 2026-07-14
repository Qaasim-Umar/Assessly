import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Sign Up",
  description: "Create your Assessly student account with your school code.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.assessly.ng/student/signup" },
};

export default function StudentSignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
