import type { Metadata } from "next";
import type { ReactNode } from "react";

const SLUG_META: Record<string, { title: string; description: string; keywords: string[] }> = {
  waec: {
    title: "WAEC Past Questions — Free CBT Practice",
    description:
      "Practice free WAEC past questions online. Timed CBT format, instant results. Covers Mathematics, English, Biology, Chemistry, Physics and more. No account needed.",
    keywords: ["WAEC past questions", "WAEC practice test", "WAEC CBT", "free WAEC questions", "WAEC Mathematics", "WAEC English"],
  },
  "jamb-utme": {
    title: "JAMB / UTME Practice — Free CBT Drills",
    description:
      "Sharpen your UTME skills with free JAMB past questions in CBT format. Practice Use of English, Mathematics, Sciences and Arts subjects. Instant feedback.",
    keywords: ["JAMB past questions", "UTME practice", "JAMB CBT practice", "free JAMB questions", "UTME drills", "JAMB Use of English"],
  },
  neco: {
    title: "NECO Past Questions — Free Practice Sets",
    description:
      "Free NECO past questions and practice sets in CBT format. Improve your score in SSCE subjects with timed objective practice tests.",
    keywords: ["NECO past questions", "NECO practice", "NECO CBT", "free NECO questions", "NECO SSCE practice"],
  },
  bece: {
    title: "BECE Past Questions — Junior Secondary Prep",
    description:
      "Prepare for BECE with free junior secondary past questions. Covers English Language, Mathematics, Basic Science, Social Studies and more.",
    keywords: ["BECE past questions", "junior secondary exam", "BECE practice", "JSS exam practice", "Nigeria BECE"],
  },
  "post-utme": {
    title: "Post-UTME Practice — University Screening Tests",
    description:
      "Free Post-UTME screening practice questions for Nigerian universities. Get exam-ready with timed CBT simulations for UNILAG, OAU, UI, UNIBEN and others.",
    keywords: ["Post-UTME practice", "university screening test Nigeria", "Post-UTME past questions", "UNILAG Post-UTME", "OAU Post-UTME"],
  },
  mock: {
    title: "Mock Exams — Full-Length CBT Simulations",
    description:
      "Take full-length mock CBT exams designed to simulate real WAEC, JAMB and NECO conditions. Track your personal best and identify weak areas.",
    keywords: ["mock exam Nigeria", "CBT mock test", "full length exam practice", "WAEC mock", "JAMB mock test"],
  },
  all: {
    title: "All Practice Exams — WAEC, JAMB, NECO & More",
    description:
      "Browse all free practice exams on Assessly. WAEC, JAMB/UTME, NECO, BECE, Post-UTME and Mock tests. No account required.",
    keywords: ["Nigeria exam practice", "WAEC JAMB NECO practice", "free CBT exams Nigeria"],
  },
};

const BASE_URL = "https://assessly.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = SLUG_META[slug] ?? SLUG_META.all;

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: `${BASE_URL}/general/category/${slug}`,
    },
    openGraph: {
      url: `${BASE_URL}/general/category/${slug}`,
      title: `${meta.title} | Assessly`,
      description: meta.description,
    },
  };
}

export default function SlugLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
