import type { Metadata } from "next";
import Link from "next/link";
import StudentNav from "@/components/StudentNav";
import Footer from "@/components/Footer";

const URL = "https://www.assessly.ng/waec-practice";

export const metadata: Metadata = {
  title: "Free WAEC Practice Questions and Past Papers",
  description:
    "Practice WAEC for free with objective questions by subject and topic, past papers by year, Study Mode, and Survival Mode on Assessly.",
  keywords: [
    "free waec practice",
    "waec past questions",
    "waec objective questions",
    "waec cbt practice",
    "free wassce practice",
  ],
  alternates: {
    canonical: URL,
  },
  openGraph: {
    title: "Free WAEC Practice Questions and Past Papers | Assessly",
    description:
      "Practice WAEC for free with objective questions by subject and topic, past papers by year, Study Mode, and Survival Mode on Assessly.",
    type: "website",
    url: URL,
    siteName: "Assessly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free WAEC Practice Questions and Past Papers | Assessly",
    description:
      "Practice WAEC for free with objective questions by subject, past papers by year, and revision modes on Assessly.",
  },
};

const FEATURES = [
  {
    title: "Practice by Subject and Topic",
    body: "Work through WAEC objective questions subject by subject, then review hints and explanations after each answer.",
  },
  {
    title: "Past Papers by Year",
    body: "Revise with real WAEC past questions organised by year so you know exactly what to expect on exam day.",
  },
  {
    title: "Study and Survival Modes",
    body: "Use Study Mode for relaxed learning and Survival Mode to build speed and confidence under pressure.",
  },
];

const STEPS = [
  "Open Practice Mode or Past Questions in General Mode.",
  "Select WAEC and choose your subject and topic.",
  "Practice for free and review explanations after each question.",
];

const FAQS = [
  {
    question: "Is WAEC practice on Assessly free?",
    answer:
      "Yes. This page leads to free WAEC practice experiences inside Assessly General Mode.",
  },
  {
    question: "Which WAEC subjects can I practice?",
    answer:
      "You can practice WAEC objective questions across the subjects available in Practice Mode and Past Questions, then review explanations as you go.",
  },
  {
    question: "Do I need a school code to practice?",
    answer:
      "No. General Mode is public, so students can start practicing WAEC without a school code.",
  },
];

export default function WaecPracticePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalWebPage",
        name: "Free WAEC Practice Questions and Past Papers",
        url: URL,
        description:
          "Public landing page for free WAEC practice, objective questions by subject, past papers, and revision modes on Assessly.",
        about: ["WAEC", "WASSCE", "CBT practice", "Past questions"],
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
        badge="WAEC Practice"
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <section className="rounded-[28px] bg-[#0d1a0f] px-6 py-8 sm:px-10 sm:py-12 text-white shadow-sm">
          <p className="text-xs font-extrabold tracking-[0.2em] uppercase text-green-300">
            Free WAEC Practice
          </p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Practice WAEC for free before exam day.
          </h1>
          <p className="mt-4 max-w-2xl text-sm sm:text-base leading-7 text-white/75">
            Use Assessly to practice WAEC with objective questions by subject
            and topic, past papers organised by year, Study Mode, and Survival
            Mode. If you are preparing for WASSCE and want a simple place to
            train for free, start here.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/general/dashboard/practice"
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0d1a0f] hover:opacity-90 transition-opacity"
            >
              Start WAEC Practice
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

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            What you can do on Assessly
          </h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            Your WAEC practice happens inside{" "}
            <Link href="/general" className="font-semibold text-green-700 hover:underline">
              General Mode
            </Link>
            , where you can choose the best format for your revision. For
            question-by-question training, open{" "}
            <Link
              href="/general/dashboard/practice"
              className="font-semibold text-green-700 hover:underline"
            >
              Practice Mode
            </Link>
            . To revise with real papers, use{" "}
            <Link
              href="/general/dashboard/past-questions"
              className="font-semibold text-green-700 hover:underline"
            >
              Past Questions
            </Link>
            , or try study and survival from the main hub.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step}
                className="rounded-xl border border-gray-200 bg-[#f8faf9] p-4"
              >
                <p className="text-sm font-medium leading-6 text-gray-700">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            Practising for other exams?
          </h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            Assessly also has free, focused practice for{" "}
            <Link
              href="/jamb-practice"
              className="font-semibold text-green-700 hover:underline"
            >
              JAMB
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
