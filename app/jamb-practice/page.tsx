import type { Metadata } from "next";
import Link from "next/link";
import StudentNav from "@/components/StudentNav";
import Footer from "@/components/Footer";
import ExamLandingGuide from "@/components/ExamLandingGuide";
import { JAMB_GUIDE } from "@/lib/examLandingGuides";

const URL = "https://www.assessly.ng/jamb-practice";

export const metadata: Metadata = {
  title: "Free JAMB Practice Questions and Mock Exam",
  description:
    "Practice JAMB for free with timed mock exams, topic-based revision, study mode, survival mode, and past questions on Assessly.",
  keywords: [
    "free jamb practice",
    "jamb mock exam online",
    "jamb past questions",
    "jamb cbt practice",
    "free utme practice",
  ],
  alternates: {
    canonical: URL,
  },
  openGraph: {
    title: "Free JAMB Practice Questions and Mock Exam | Assessly",
    description:
      "Practice JAMB for free with timed mock exams, topic-based revision, study mode, survival mode, and past questions on Assessly.",
    type: "website",
    url: URL,
    siteName: "Assessly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free JAMB Practice Questions and Mock Exam | Assessly",
    description:
      "Practice JAMB for free with timed mock exams, revision modes, and past questions on Assessly.",
  },
};

const FEATURES = [
  {
    title: "Timed JAMB Simulator",
    body: "Run a full UTME-style session with English plus three subjects under exam timing.",
  },
  {
    title: "Topic Practice",
    body: "Work through questions by subject and topic, then review hints and explanations after each answer.",
  },
  {
    title: "Past Questions and Revision",
    body: "Use past questions, Study Mode, and Survival Mode to build speed, confidence, and recall.",
  },
];

const FAQS = [
  {
    question: "Is JAMB practice on Assessly free?",
    answer:
      "Yes. This page leads to free JAMB practice experiences inside Assessly General Mode.",
  },
  {
    question: "Can I take a timed JAMB mock exam?",
    answer:
      "Yes. The JAMB Simulator is designed for UTME-style timed practice with English and three additional subjects.",
  },
  {
    question: "Do I need a school code to practice?",
    answer:
      "No. General Mode is public, so students can start practicing without a school code.",
  },
];

export default function JambPracticePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalWebPage",
        name: "Free JAMB Practice Questions and Mock Exam",
        url: URL,
        description:
          "Public landing page for free JAMB practice, timed mock exams, topic-based revision, and past questions on Assessly.",
        about: ["JAMB", "UTME", "CBT practice", "Past questions"],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <StudentNav
        back={{ href: "/general", label: "General Mode" }}
        badge="JAMB Practice"
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <section className="rounded-[28px] bg-[#0d1a0f] px-6 py-8 sm:px-10 sm:py-12 text-white shadow-sm">
          <p className="text-xs font-extrabold tracking-[0.2em] uppercase text-green-300">
            Free JAMB Practice
          </p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Practice JAMB for free before exam day.
          </h1>
          <p className="mt-4 max-w-2xl text-sm sm:text-base leading-7 text-white/75">
            Use Assessly to practice JAMB with a timed mock exam, topic-based
            revision, Study Mode, Survival Mode, and past questions. If you are
            preparing for UTME and want a simple place to train for free, start
            here.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/practice/mock/jamb"
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0d1a0f] hover:opacity-90 transition-opacity"
            >
              Start JAMB Simulator
            </Link>
            <Link
              href="/general"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              Explore All 5 Modes
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-bold text-gray-900">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {feature.body}
              </p>
            </article>
          ))}
        </section>

        <ExamLandingGuide content={JAMB_GUIDE} />

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            Practising for other exams?
          </h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            Assessly also has free, focused practice for{" "}
            <Link
              href="/waec-practice"
              className="font-semibold text-green-700 hover:underline"
            >
              WAEC
            </Link>
            {" "}and{" "}
            <Link
              href="/post-utme-practice"
              className="font-semibold text-green-700 hover:underline"
            >
              Post-UTME
            </Link>
            , plus NECO and BECE inside General Mode.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">FAQs</h2>
          <div className="mt-4 space-y-4">
            {FAQS.map((faq) => (
              <article key={faq.question}>
                <h3 className="text-base font-bold text-gray-900">
                  {faq.question}
                </h3>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
