import type { Metadata } from "next";
import Link from "next/link";
import StudentNav from "@/components/StudentNav";
import Footer from "@/components/Footer";

const URL = "https://www.assessly.ng/post-utme-practice";

export const metadata: Metadata = {
  title: "Free Post-UTME Practice Questions by University",
  description:
    "Practice Post-UTME for free with school-specific screening questions, past questions by university, and topic revision with explanations on Assessly.",
  keywords: [
    "free post utme practice",
    "post utme past questions",
    "post utme screening practice",
    "university screening test practice",
    "post utme cbt practice",
  ],
  alternates: {
    canonical: URL,
  },
  openGraph: {
    title: "Free Post-UTME Practice Questions by University | Assessly",
    description:
      "Practice Post-UTME for free with school-specific screening questions, past questions by university, and topic revision with explanations on Assessly.",
    type: "website",
    url: URL,
    siteName: "Assessly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Post-UTME Practice Questions by University | Assessly",
    description:
      "Practice Post-UTME for free with school-specific screening questions and past questions by university on Assessly.",
  },
};

const FEATURES = [
  {
    title: "School-Specific Screening",
    body: "Post-UTME screening differs by university, so you pick your school first and practice questions that match its screening.",
  },
  {
    title: "Past Questions by University",
    body: "Revise with real Post-UTME past questions grouped by university so your preparation matches your target school.",
  },
  {
    title: "Topic Practice with Explanations",
    body: "Work through questions by subject and topic, then review hints and explanations after each answer.",
  },
];

const STEPS = [
  "Open Practice Mode or Past Questions in General Mode.",
  "Select Post-UTME, then choose your university.",
  "Practice for free and review explanations after each question.",
];

const FAQS = [
  {
    question: "Is Post-UTME practice on Assessly free?",
    answer:
      "Yes. This page leads to free Post-UTME practice experiences inside Assessly General Mode.",
  },
  {
    question: "Is Post-UTME practice specific to my university?",
    answer:
      "Yes. Post-UTME screening is school-specific, so you select your university first and practice questions matched to that school.",
  },
  {
    question: "Do I need a school code to practice?",
    answer:
      "No. General Mode is public, so students can start practicing Post-UTME without a school code.",
  },
];

export default function PostUtmePracticePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalWebPage",
        name: "Free Post-UTME Practice Questions by University",
        url: URL,
        description:
          "Public landing page for free Post-UTME practice, school-specific screening questions, and past questions by university on Assessly.",
        about: ["Post-UTME", "University screening", "CBT practice", "Past questions"],
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
        badge="Post-UTME Practice"
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <section className="rounded-[28px] bg-[#0d1a0f] px-6 py-8 sm:px-10 sm:py-12 text-white shadow-sm">
          <p className="text-xs font-extrabold tracking-[0.2em] uppercase text-green-300">
            Free Post-UTME Practice
          </p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Practice Post-UTME for free before your screening.
          </h1>
          <p className="mt-4 max-w-2xl text-sm sm:text-base leading-7 text-white/75">
            Use Assessly to practice Post-UTME with school-specific screening
            questions, past questions grouped by university, and topic revision
            with explanations. If you are preparing for university screening and
            want a simple place to train for free, start here.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/general/dashboard/practice"
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0d1a0f] hover:opacity-90 transition-opacity"
            >
              Start Post-UTME Practice
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
            Your Post-UTME practice happens inside{" "}
            <Link href="/general" className="font-semibold text-green-700 hover:underline">
              General Mode
            </Link>
            , where you can choose the best format for your revision. For
            school-specific training, open{" "}
            <Link
              href="/general/dashboard/practice"
              className="font-semibold text-green-700 hover:underline"
            >
              Practice Mode
            </Link>
            {" "}and select your university. To revise with real papers, use{" "}
            <Link
              href="/general/dashboard/past-questions"
              className="font-semibold text-green-700 hover:underline"
            >
              Past Questions
            </Link>
            .
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
              href="/waec-practice"
              className="font-semibold text-green-700 hover:underline"
            >
              WAEC
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
