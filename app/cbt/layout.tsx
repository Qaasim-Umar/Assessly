import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "This prototype has moved to the main Assessly dashboard.",
  robots: { index: false, follow: false },
};

export default function CbtLayout({ children }: { children: React.ReactNode }) {
  return children;
}
