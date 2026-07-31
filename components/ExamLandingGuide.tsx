import Link from "next/link";
import type { ExamLandingGuideContent } from "@/lib/examLandingGuides";

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-green-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-7 text-gray-600">{body}</p>
    </div>
  );
}

export default function ExamLandingGuide({
  content,
}: {
  content: ExamLandingGuideContent;
}) {
  return (
    <div className="mt-10 space-y-10">
      <section
        id="exam-structure"
        className="scroll-mt-20 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <SectionHeading
          eyebrow="Know the exam"
          title={content.structure.title}
          body={content.structure.intro}
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.structure.facts.map((fact) => (
            <article key={fact.label} className="rounded-xl bg-[#f5f8f6] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                {fact.label}
              </p>
              <p className="mt-2 text-base font-bold leading-6 text-gray-900">
                {fact.value}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Subject requirements</h3>
            <ul className="mt-3 space-y-2 text-base leading-7 text-gray-600">
              {content.structure.requirements.map((requirement) => (
                <li key={requirement} className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
          <aside className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="text-base font-bold text-amber-950">Before you register</h3>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              {content.structure.registrationNote}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {content.officialLinks.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-bold text-amber-900 hover:border-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
                >
                  {source.label} ↗
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section id="practice-modes" className="scroll-mt-20">
        <SectionHeading
          eyebrow="Choose deliberately"
          title="How each practice mode works"
          body={content.modesIntro}
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.modes.map((mode) => (
            <article
              key={mode.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                Best for: {mode.bestFor}
              </p>
              <h3 className="mt-2 text-lg font-bold text-gray-900">{mode.title}</h3>
              <p className="mt-2 text-base leading-7 text-gray-600">{mode.body}</p>
              <Link
                href={mode.href}
                className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-green-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
              >
                Open {mode.title} →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
            A study strategy that compounds
          </h2>
          <ol className="mt-5 space-y-5">
            {content.studyStrategy.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-700 text-sm font-extrabold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-bold text-gray-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </article>

        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-rose-950">
            Frequently made mistakes
          </h2>
          <ul className="mt-5 space-y-3">
            {content.mistakes.map((mistake) => (
              <li key={mistake} className="flex gap-3 text-base leading-7 text-rose-900">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-600" />
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section
        id="scoring"
        className="scroll-mt-20 rounded-2xl border border-blue-200 bg-blue-50 p-6 sm:p-8"
      >
        <SectionHeading
          eyebrow="Read your results correctly"
          title={content.scoring.title}
          body={content.scoring.intro}
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {content.scoring.points.map((point) => (
            <article key={point.title} className="rounded-xl bg-white p-5">
              <h3 className="font-bold text-blue-950">{point.title}</h3>
              <p className="mt-2 text-sm leading-6 text-blue-900">{point.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="subject-guides" className="scroll-mt-20">
        <SectionHeading
          eyebrow="Revise by subject"
          title="Detailed subject guides"
          body={content.subjectIntro}
        />
        <nav aria-label={`${content.examName} subject guides`} className="mt-5 flex flex-wrap gap-2">
          {content.subjectGuides.map((guide) => (
            <a
              key={guide.id}
              href={`#${guide.id}`}
              className="inline-flex min-h-11 items-center rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-bold text-green-800 hover:border-green-500 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
            >
              {guide.title}
            </a>
          ))}
        </nav>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {content.subjectGuides.map((guide) => (
            <article
              key={guide.id}
              id={guide.id}
              className="scroll-mt-20 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold text-gray-900">{guide.title}</h3>
              <p className="mt-2 text-base leading-7 text-gray-600">{guide.overview}</p>
              <h4 className="mt-4 text-sm font-bold uppercase tracking-wide text-gray-700">
                High-value topics
              </h4>
              <ul className="mt-2 flex flex-wrap gap-2">
                {guide.topics.map((topic) => (
                  <li
                    key={topic}
                    className="rounded-md border border-gray-200 bg-[#f8faf9] px-2.5 py-1 text-sm font-medium text-gray-700"
                  >
                    {topic}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                <strong className="text-gray-900">Study method:</strong> {guide.method}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="sample-questions" className="scroll-mt-20">
        <SectionHeading
          eyebrow="Try before you start"
          title="Original sample questions with explanations"
          body="These examples were written for this guide. They demonstrate the reasoning process you should practise, not questions copied from an examination paper."
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {content.samples.map((sample, sampleIndex) => (
            <article
              key={sample.question}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-extrabold uppercase tracking-wide text-green-700">
                {sample.subject} · Sample {sampleIndex + 1}
              </p>
              <h3 className="mt-3 text-lg font-bold leading-7 text-gray-900">
                {sample.question}
              </h3>
              <ol className="mt-4 space-y-2" type="A">
                {sample.options.map((option) => (
                  <li
                    key={option}
                    className="ml-5 rounded-lg border border-gray-200 bg-[#f8faf9] px-3 py-2 text-sm text-gray-700"
                  >
                    {option}
                  </li>
                ))}
              </ol>
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-bold text-green-900">Answer: {sample.answer}</p>
                <p className="mt-2 text-sm leading-6 text-green-900">
                  {sample.explanation}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
