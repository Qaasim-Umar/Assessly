import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Download,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  getPublishedQuestionBankPack,
  listPublishedQuestionBankPacks,
} from "@/lib/questionBankData";
import "../../../landing/landing.css";

const BASE_URL = "https://www.assessly.ng";

type PackPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const packs = await listPublishedQuestionBankPacks();
  return packs.map((pack) => ({ slug: pack.slug }));
}

export async function generateMetadata({
  params,
}: PackPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pack = await getPublishedQuestionBankPack(slug);

  if (!pack) return { title: "Question Pack Not Found" };

  const url = `${BASE_URL}/admissions/question-bank/${pack.slug}`;
  const title = `${pack.title} PDF`;

  return {
    title,
    description: pack.shortDescription,
    keywords: [
      `${pack.examLabel} past questions`,
      `${pack.subject} past questions PDF`,
      `${pack.years} past questions`,
      "free past questions Nigeria",
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description: pack.shortDescription,
      siteName: "Assessly",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: pack.shortDescription,
    },
    robots: { index: true, follow: true },
  };
}

export default async function QuestionBankPackPage({ params }: PackPageProps) {
  const { slug } = await params;
  const pack = await getPublishedQuestionBankPack(slug);

  if (!pack) notFound();

  const files =
    pack.packType === "single"
      ? [
          {
            name: `${pack.title} PDF`,
            objectKey: pack.objectKey,
            format: "PDF" as const,
          },
        ]
      : pack.packFiles;
  const fileLabel = `${files.length} ${files.length === 1 ? "file" : "files"}`;
  const subjects = Array.from(
    new Set(
      pack.subject
        .split(/\s*(?:,|&)\s*/)
        .map((subject) => subject.trim())
        .filter(Boolean),
    ),
  );
  const allPacks = await listPublishedQuestionBankPacks();
  const relatedPacks = allPacks.filter(
    (candidate) => candidate.slug !== pack.slug,
  ).slice(0, 3);
  const pageUrl = `${BASE_URL}/admissions/question-bank/${pack.slug}`;

  const learningResourceJsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: pack.title,
    description: pack.shortDescription,
    url: pageUrl,
    inLanguage: "en-NG",
    isAccessibleForFree: true,
    learningResourceType: "Past question paper",
    educationalLevel: pack.section,
    about: pack.subject,
    teaches: "Exam preparation, past-question practice, and self-assessment",
    provider: {
      "@type": "Organization",
      name: "Assessly",
      url: BASE_URL,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Admissions",
        item: `${BASE_URL}/admissions`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Question Bank",
        item: `${BASE_URL}/admissions/question-bank`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: pack.title,
        item: pageUrl,
      },
    ],
  };

  return (
    <div className="lp-root min-h-dvh bg-[#f7faf8] text-[#0d1a0f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(learningResourceJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <Navbar />

      <main id="main-content">
        <section className="relative overflow-hidden bg-[#0d1a0f] text-white">
          <div className="pointer-events-none absolute -right-32 -top-40 h-[420px] w-[420px] rounded-full bg-green-500/10 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-12 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="mb-8 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-white/55"
            >
              <Link
                href="/admissions"
                className="rounded-sm outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-green-400"
              >
                Admissions
              </Link>
              <ChevronRight aria-hidden="true" size={13} />
              <Link
                href="/admissions/question-bank"
                className="rounded-sm outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-green-400"
              >
                Question Bank
              </Link>
            </nav>

            <div className="max-w-3xl">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-green-400/25 bg-green-400/10 px-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-green-300">
                  <Sparkles aria-hidden="true" size={13} /> Free resource
                </span>
                <span className="inline-flex min-h-7 items-center rounded-full border border-white/10 bg-white/[0.06] px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white/65">
                  {pack.examLabel}
                </span>
              </div>

              <h1 className="font-[var(--lp-serif)] text-[clamp(2.125rem,5vw,4rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-white">
                {pack.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
                {pack.shortDescription}
              </p>

              <a
                href="#download-files"
                className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-500 px-5 text-sm font-extrabold text-white shadow-lg shadow-green-950/25 outline-none transition-colors hover:bg-green-400 focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1a0f]"
              >
                <Download aria-hidden="true" size={17} /> Download pack
              </a>
            </div>
          </div>
        </section>

        <section aria-label="Pack details" className="border-b border-[#e2ede6] bg-white">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 px-5 py-5 sm:px-6 lg:px-8">
            <div>
              <dt className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#718477]">Year</dt>
              <dd className="mt-1 text-sm font-extrabold leading-5 text-[#0d1a0f]">{pack.years}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#718477]">Files</dt>
              <dd className="mt-1 text-sm font-extrabold leading-5 text-[#0d1a0f]">{fileLabel}</dd>
            </div>
          </dl>
        </section>

        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-12 lg:px-8">
          <div className="min-w-0 space-y-10">
            <section aria-labelledby="included-subjects">
              <SectionEyebrow>Included subjects</SectionEyebrow>
              <h2 id="included-subjects" className="mt-2 font-[var(--lp-serif)] text-3xl font-semibold tracking-tight sm:text-4xl">
                Subjects in this pack
              </h2>
              <ul className={`mt-6 grid gap-3 ${subjects.length > 1 ? "sm:grid-cols-2 xl:grid-cols-3" : ""}`}>
                {subjects.map((subject) => (
                  <li key={subject} className="flex min-h-16 items-center gap-3 rounded-2xl border border-[#d7e8dc] bg-white px-4 py-3 text-base font-extrabold text-[#0d1a0f]">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                      <BookOpen aria-hidden="true" size={19} />
                    </span>
                    {subject}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="study-guide">
              <SectionEyebrow>Study smarter</SectionEyebrow>
              <h2 id="study-guide" className="mt-2 font-[var(--lp-serif)] text-3xl font-semibold tracking-tight sm:text-4xl">
                Make the most of your question pack
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#4a5e4e]">
                Use each paper as focused practice, then let your results guide what you revise next.
              </p>
              <ol className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  ["Attempt", "Answer the questions without checking notes or solutions first."],
                  ["Review", "Mark what you missed and identify the areas that need more attention."],
                  ["Repeat", "Return to difficult questions until you can answer them confidently."],
                ].map(([title, description], index) => (
                  <li key={title} className="rounded-2xl border border-[#d7e8dc] bg-white p-5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-sm font-extrabold text-green-700">
                      {index + 1}
                    </span>
                    <h3 className="mt-4 font-extrabold text-[#0d1a0f]">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#5f7364]">{description}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside id="download-files" aria-label="Download this question pack" className="scroll-mt-24 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-[24px] border border-[#d7e8dc] bg-white shadow-[0_18px_60px_rgba(13,26,15,0.09)]">
              <div className="bg-[#0d1a0f] px-5 py-5 text-white sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-green-300">
                    <ShieldCheck aria-hidden="true" size={16} /> Secure download
                  </span>
                  <span className="rounded-full bg-green-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">Free</span>
                </div>
                <p className="mt-3 font-[var(--lp-serif)] text-2xl font-semibold leading-tight">Choose your file</p>
              </div>

              <div className="p-4 sm:p-5">
                <div className="space-y-2.5">
                  {files.map((file, fileIndex) => (
                    <a
                      key={file.name}
                      href={`/api/question-bank/download?packId=${encodeURIComponent(pack.id)}&file=${fileIndex}`}
                      className="group flex min-h-14 items-center gap-3 rounded-xl border border-[#e2ede6] bg-[#f7faf8] p-3 outline-none transition-colors hover:border-green-300 hover:bg-green-50 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm ring-1 ring-[#e2ede6]">
                        <FileText aria-hidden="true" size={19} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-extrabold leading-5 text-[#0d1a0f]">{file.name}</span>
                        <span className="mt-0.5 block text-[11px] font-semibold text-[#718477]">{file.format ?? "PDF"}</span>
                      </span>
                      <Download aria-hidden="true" size={18} className="shrink-0 text-green-700" />
                    </a>
                  ))}
                </div>
                <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-[#718477]">
                  <ShieldCheck aria-hidden="true" size={15} className="shrink-0 text-green-700" />
                  A short-lived private link is created when you download.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {relatedPacks.length > 0 && (
          <section className="border-t border-[#e2ede6] bg-white">
            <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
              <SectionEyebrow>Keep practising</SectionEyebrow>
              <h2 className="mt-2 font-[var(--lp-serif)] text-3xl font-semibold tracking-tight">Related question packs</h2>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {relatedPacks.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/admissions/question-bank/${related.slug}`}
                    className="group rounded-2xl border border-[#e2ede6] bg-[#f7faf8] p-5 outline-none transition-colors hover:border-green-300 hover:bg-green-50 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                  >
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-green-700">{related.examLabel}</p>
                    <h3 className="mt-2 font-bold leading-6 text-[#0d1a0f]">{related.title}</h3>
                    <p className="mt-2 text-sm text-[#718477]">{related.subject} · {related.years}</p>
                    <span className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-green-700">
                      View pack <ChevronRight aria-hidden="true" size={16} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
          <Link
            href="/admissions/question-bank"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-[#4a5e4e] outline-none transition-colors hover:text-green-700 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
          >
            <ArrowLeft aria-hidden="true" size={17} /> Back to all question packs
          </Link>
        </div>
      </main>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-green-700">{children}</p>;
}
