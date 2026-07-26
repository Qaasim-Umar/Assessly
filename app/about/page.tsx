import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  GraduationCap,
  HeartHandshake,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="lp-root company-page">
      <Navbar />

      <main id="main-content">
        <header className="company-hero">
          <div className="company-hero-inner">
            <div className="company-eyebrow">
              <HeartHandshake aria-hidden="true" size={17} strokeWidth={2} />
              About Assessly
            </div>
            <h1>
              Better practice.
              <br />
              <em>Better testing.</em>
            </h1>
            <p className="company-hero-copy">
              Assessly helps Nigerian students prepare with confidence and gives
              schools practical tools to create, deliver, and review computer-based
              assessments without unnecessary complexity.
            </p>
          </div>
        </header>

        <section className="company-section">
          <div className="company-inner company-story-grid">
            <div className="company-story-copy">
              <p className="company-section-label">Why we exist</p>
              <h2>Learning tools should remove friction, not add to it.</h2>
              <p className="company-lead">
                Exam preparation is already demanding. Students should not need to
                fight confusing software before they can practise, and educators
                should not lose hours turning question papers into usable tests.
              </p>
              <p>
                Assessly brings both sides of assessment into one focused platform:
                accessible practice for learners and a straightforward CBT workflow
                for the people teaching them.
              </p>
              <p>
                We are building for the realities of Nigerian education—from WAEC,
                JAMB, NECO, and Post-UTME preparation to the everyday tests schools
                need to run reliably.
              </p>
            </div>

            <aside className="company-promise" aria-label="Our promise">
              <div className="company-promise-icon">
                <Lightbulb aria-hidden="true" size={23} strokeWidth={1.8} />
              </div>
              <blockquote>
                “Make every practice session useful and every assessment easier to run.”
              </blockquote>
            </aside>
          </div>
        </section>

        <section className="company-section company-section-alt">
          <div className="company-inner">
            <p className="company-section-label">Who we build for</p>
            <h2>One platform, built around two real needs.</h2>

            <div className="company-audience-grid">
              <article className="company-card">
                <div className="company-card-icon">
                  <GraduationCap aria-hidden="true" size={24} strokeWidth={1.8} />
                </div>
                <h3>For students</h3>
                <p>
                  Practise authentic exam-style questions, work under timed
                  conditions, review explanations, and build the confidence to
                  perform when the real exam begins.
                </p>
                <Link href="/general">
                  Start practising <ArrowRight aria-hidden="true" size={17} />
                </Link>
              </article>

              <article className="company-card">
                <div className="company-card-icon">
                  <Building2 aria-hidden="true" size={24} strokeWidth={1.8} />
                </div>
                <h3>For schools and educators</h3>
                <p>
                  Turn question banks into structured CBT exams, manage access with
                  school codes, score objective questions instantly, and review
                  student performance in one place.
                </p>
                <Link href="/dashboard/login">
                  Explore school tools <ArrowRight aria-hidden="true" size={17} />
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="company-section">
          <div className="company-inner">
            <p className="company-section-label">How we work</p>
            <h2>Principles that keep the product grounded.</h2>

            <div className="company-values-grid">
              <article className="company-value">
                <span>01</span>
                <h3>Useful over flashy</h3>
                <p>
                  Every feature should help someone learn, teach, or assess more effectively.
                </p>
              </article>
              <article className="company-value">
                <span>02</span>
                <h3>Simple by design</h3>
                <p>
                  Clear language and focused workflows should make the next step obvious.
                </p>
              </article>
              <article className="company-value">
                <span>03</span>
                <h3>Trust is essential</h3>
                <p>
                  Student information and assessment records deserve thoughtful protection.
                </p>
              </article>
              <article className="company-value">
                <span>04</span>
                <h3>Built for context</h3>
                <p>
                  Nigerian learners and educators shape the problems we choose to solve.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="company-section company-section-alt">
          <div className="company-inner company-story-grid">
            <div>
              <p className="company-section-label">What we are building</p>
              <h2>Assessment technology that helps people move forward.</h2>
              <p className="company-lead">
                Our goal is not simply to put paper tests on a screen. It is to
                create better feedback loops: practise, understand, improve—and
                give educators the insight to support that progress.
              </p>
            </div>
            <div className="company-mini-grid">
              <article className="company-card">
                <div className="company-card-icon">
                  <BookOpenCheck aria-hidden="true" size={24} strokeWidth={1.8} />
                </div>
                <h3>Focused learning</h3>
                <p>Practice experiences designed around understanding, not just scores.</p>
              </article>
              <article className="company-card">
                <div className="company-card-icon">
                  <ShieldCheck aria-hidden="true" size={24} strokeWidth={1.8} />
                </div>
                <h3>Responsible growth</h3>
                <p>Product decisions that respect schools, students, and their data.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="company-cta">
          <div className="company-cta-inner">
            <div>
              <h2>Have a question, idea, or school challenge we should understand?</h2>
              <p>We would genuinely like to hear from you.</p>
            </div>
            <Link href="/contact" className="company-cta-link">
              Contact us <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
