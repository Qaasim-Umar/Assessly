import Link from "next/link";
import { ArrowRight, FileCheck2, Scale } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const sections = [
  { id: "agreement", label: "Your agreement" },
  { id: "eligibility", label: "Eligibility and minors" },
  { id: "accounts", label: "Accounts and access" },
  { id: "acceptable-use", label: "Acceptable use" },
  { id: "schools", label: "Schools and educators" },
  { id: "content", label: "Content and licences" },
  { id: "assessments", label: "Assessments and results" },
  { id: "plans", label: "Plans and payments" },
  { id: "third-parties", label: "Third-party services" },
  { id: "availability", label: "Service availability" },
  { id: "termination", label: "Suspension and termination" },
  { id: "disclaimers", label: "Disclaimers" },
  { id: "liability", label: "Liability" },
  { id: "disputes", label: "Law and disputes" },
  { id: "changes", label: "Changes to these terms" },
  { id: "contact", label: "Contact us" },
];

export default function TermsOfServicePage() {
  return (
    <div className="lp-root privacy-page">
      <Navbar />

      <main id="main-content">
        <header className="privacy-hero">
          <div className="privacy-hero-inner">
            <div className="privacy-eyebrow">
              <Scale aria-hidden="true" size={17} strokeWidth={2} />
              A fair framework for using Assessly
            </div>
            <h1>Terms of Service</h1>
            <p className="privacy-intro">
              These terms explain the rules, rights, and responsibilities that
              apply when students, educators, schools, and visitors use Assessly.
            </p>
            <p className="privacy-date">
              Effective and last updated: <time dateTime="2026-07-26">26 July 2026</time>
            </p>
          </div>
        </header>

        <div className="privacy-shell">
          <aside className="privacy-toc" aria-label="Terms of service contents">
            <p className="privacy-toc-title">On this page</p>
            <nav>
              <ol>
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {section.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="privacy-content">
            <div className="privacy-summary">
              <FileCheck2 aria-hidden="true" size={22} strokeWidth={1.8} />
              <div>
                <strong>The short version</strong>
                <p>
                  Use Assessly lawfully, protect your login details, respect other
                  people’s work and privacy, and check important exam information.
                  We provide learning and assessment tools—not guaranteed grades,
                  admissions, or official examination decisions.
                </p>
              </div>
            </div>

            <section id="agreement">
              <p className="privacy-section-number">01</p>
              <h2>Your agreement</h2>
              <p>
                These Terms of Service (“Terms”) form an agreement between you and
                the operator of Assessly (“Assessly”, “we”, “us”, or “our”). They
                apply when you access assessly.ng or use any Assessly website,
                account, exam, practice tool, dashboard, or related service
                (together, the “Service”).
              </p>
              <p>
                By creating an account, accessing an exam, purchasing a plan, or
                otherwise using the Service, you agree to these Terms and our{" "}
                <Link href="/privacy">Privacy Policy</Link>. If you do not agree,
                do not use the Service. If you use Assessly for a school or another
                organisation, you confirm that you have authority to accept these
                Terms on its behalf.
              </p>
            </section>

            <section id="eligibility">
              <p className="privacy-section-number">02</p>
              <h2>Eligibility and minors</h2>
              <p>
                You must be legally able to enter into this agreement. If you are
                under 18, you may use Assessly only through your school or with the
                involvement and permission of a parent or legal guardian. That adult
                is responsible for supervising your use where applicable.
              </p>
              <p>
                Schools and educators who enable access for minors must have the
                authority and permissions required to provide student information,
                administer assessments, and use the Service for those students.
              </p>
            </section>

            <section id="accounts">
              <p className="privacy-section-number">03</p>
              <h2>Accounts and access</h2>
              <p>
                You must provide accurate information and keep it reasonably up to
                date. You are responsible for activity under your account and for
                keeping passwords, school codes, and access links confidential.
                Do not share an account or allow another person to sit an assessment
                as you.
              </p>
              <p>
                Tell us promptly at{" "}
                <a href="mailto:hello@assessly.ng">hello@assessly.ng</a> if you
                suspect unauthorised access. We may require a password reset or
                other reasonable verification to protect users and the Service.
              </p>
            </section>

            <section id="acceptable-use">
              <p className="privacy-section-number">04</p>
              <h2>Acceptable use</h2>
              <p>You may not use the Service to:</p>
              <ul>
                <li>break any law, regulation, school rule, or another person’s rights;</li>
                <li>cheat, impersonate someone, manipulate results, or bypass assessment controls;</li>
                <li>upload material you do not have the right to use, including confidential exam papers;</li>
                <li>harass, threaten, exploit, or expose personal information about another person;</li>
                <li>introduce malware, probe for vulnerabilities, disrupt the Service, or evade security controls;</li>
                <li>scrape, copy, or extract substantial parts of the Service or question bank without permission;</li>
                <li>reverse engineer or attempt to discover non-public source code, except where law expressly permits it;</li>
                <li>resell, sublicense, or commercially exploit the Service unless we agree in writing; or</li>
                <li>use automated tools in a way that places unreasonable demand on our systems.</li>
              </ul>
              <p>
                Fair, authorised classroom use is welcome. If you are unsure whether
                a planned use is permitted, contact us before proceeding.
              </p>
            </section>

            <section id="schools">
              <p className="privacy-section-number">05</p>
              <h2>Schools and educators</h2>
              <p>
                Schools and educators control the assessments they create, the
                students they invite, when results are released, and the marks they
                assign to theory responses. They are responsible for:
              </p>
              <ul>
                <li>checking that questions, answer keys, marking rules, and time limits are accurate;</li>
                <li>using school codes and student data only for authorised educational purposes;</li>
                <li>obtaining permissions required for student and children’s data;</li>
                <li>protecting administrator credentials and limiting dashboard access; and</li>
                <li>handling appeals, grading decisions, accommodations, and academic-integrity issues fairly.</li>
              </ul>
              <p>
                Assessly provides the technology but does not act as the school,
                examination board, admissions authority, or final decision-maker.
              </p>
            </section>

            <section id="content">
              <p className="privacy-section-number">06</p>
              <h2>Content and licences</h2>
              <h3>Your content</h3>
              <p>
                You keep ownership of original questions, documents, answers, and
                other material you submit (“User Content”). You give Assessly a
                non-exclusive, worldwide licence to host, store, reproduce, format,
                process, and display that content only as needed to operate, secure,
                and improve the Service and fulfil your instructions. This licence
                ends when the content is deleted from active systems, subject to
                reasonable backup periods and legal retention duties.
              </p>
              <p>
                You confirm that you have all rights and permissions needed for User
                Content and that it does not violate law or another person’s rights.
                We may remove content that creates legal, security, or safety risk.
              </p>

              <h3>Assessly content</h3>
              <p>
                The Service, brand, software, design, original question collections,
                and other materials we provide are owned by Assessly or its licensors.
                We grant you a limited, personal, non-exclusive, non-transferable,
                revocable right to use them for learning, teaching, and authorised
                assessment while you comply with these Terms.
              </p>
            </section>

            <section id="assessments">
              <p className="privacy-section-number">07</p>
              <h2>Assessments and results</h2>
              <p>
                Assessly can automatically score objective questions using the
                answer key supplied or selected for an assessment. Automated results
                may be affected by incorrect answer keys, incomplete content, network
                interruptions, device issues, or configuration choices. Theory
                responses may require human grading by an educator.
              </p>
              <p>
                Practice scores are learning aids and are not official WAEC, JAMB,
                NECO, Post-UTME, school, or admissions results. Unless explicitly
                stated, Assessly is not affiliated with or endorsed by any examination
                body or institution. Always confirm dates, requirements, syllabuses,
                and high-stakes results with the relevant official body.
              </p>
              <p>
                We do not guarantee any grade, examination performance, admission,
                scholarship, placement, certification, or other outcome.
              </p>
            </section>

            <section id="plans">
              <p className="privacy-section-number">08</p>
              <h2>Plans and payments</h2>
              <p>
                Some features are free and others may require a paid plan. Prices,
                included features, billing periods, and applicable taxes will be
                shown before purchase or set out in an order agreed with your school.
                You authorise the stated charges when you complete a purchase.
              </p>
              <p>
                Any renewal, cancellation, trial, and refund conditions shown at
                checkout or in a school order form form part of these Terms. We may
                change future pricing or plan features with reasonable notice, but
                we will not retroactively change a completed billing period. Nothing
                in these Terms limits a refund or other remedy required by applicable
                consumer law.
              </p>
            </section>

            <section id="third-parties">
              <p className="privacy-section-number">09</p>
              <h2>Third-party services and links</h2>
              <p>
                Assessly relies on service providers for hosting, authentication,
                analytics, and related infrastructure. The Service may also link to
                websites or resources we do not control. Their own terms and privacy
                policies apply to your use of those services.
              </p>
              <p>
                A link does not mean we endorse all content or services on the linked
                site. To the extent permitted by law, we are not responsible for
                third-party content, availability, or practices.
              </p>
            </section>

            <section id="availability">
              <p className="privacy-section-number">10</p>
              <h2>Service availability and changes</h2>
              <p>
                We work to keep Assessly reliable, but the Service may occasionally
                be unavailable for maintenance, upgrades, security work, provider
                outages, or events beyond our reasonable control. We may add, change,
                or discontinue features as the product develops.
              </p>
              <p>
                We will use reasonable care to avoid unnecessary disruption and,
                where practical, provide notice of material changes affecting paid
                users. Schools should maintain appropriate copies of essential exam
                materials and avoid relying on a single system for emergency records.
              </p>
            </section>

            <section id="termination">
              <p className="privacy-section-number">11</p>
              <h2>Suspension and termination</h2>
              <p>
                You may stop using Assessly at any time and may request account
                deletion as described in our Privacy Policy. We may restrict,
                suspend, or terminate access when reasonably necessary to address a
                serious or repeated breach of these Terms, protect users or systems,
                comply with law, prevent non-payment, or respond to a security risk.
              </p>
              <p>
                Where appropriate, we will give notice and an opportunity to correct
                the issue. We may act immediately when delay could create harm or
                legal exposure. Terms that logically need to continue—including
                ownership, payment obligations, disclaimers, and liability
                provisions—survive termination.
              </p>
            </section>

            <section id="disclaimers">
              <p className="privacy-section-number">12</p>
              <h2>Disclaimers</h2>
              <p>
                We provide the Service with reasonable care and skill. However, to
                the extent the law permits, Assessly is provided “as is” and “as
                available”. We do not promise that every item of content will be
                complete, current, error-free, or suitable for a particular exam,
                curriculum, device, or school process.
              </p>
              <p>
                Educational and admissions information is general information, not
                professional, legal, or official examination advice. Nothing in this
                section excludes promises or protections that cannot lawfully be
                excluded under Nigerian consumer law.
              </p>
            </section>

            <section id="liability">
              <p className="privacy-section-number">13</p>
              <h2>Liability</h2>
              <p>
                Nothing in these Terms excludes or limits liability that cannot be
                excluded or limited by law, including applicable consumer rights.
                Subject to that rule, Assessly is not liable for indirect or
                consequential loss, loss of opportunity, loss of anticipated grades
                or admission, or loss caused by unauthorised use of credentials,
                inaccurate User Content, or circumstances outside our reasonable control.
              </p>
              <p>
                If you use Assessly for business or institutional purposes, our total
                liability arising from the Service will, to the extent permitted by
                law, not exceed the amount your organisation paid us for the Service
                during the 12 months before the event giving rise to the claim. This
                cap does not apply where the law does not permit it.
              </p>
            </section>

            <section id="disputes">
              <p className="privacy-section-number">14</p>
              <h2>Law and disputes</h2>
              <p>
                These Terms are governed by the laws of the Federal Republic of
                Nigeria. If a concern arises, please contact us first so we can try
                to resolve it promptly and fairly. If we cannot resolve it, either
                party may use any court, regulator, consumer-protection process, or
                other dispute-resolution channel available under applicable law.
              </p>
              <p>
                If any part of these Terms is found unenforceable, the remaining
                parts continue in effect. A delay in enforcing a term does not waive
                the right to enforce it later. These Terms, the Privacy Policy, and
                any applicable order form are the agreement between us about the Service.
              </p>
            </section>

            <section id="changes">
              <p className="privacy-section-number">15</p>
              <h2>Changes to these terms</h2>
              <p>
                We may update these Terms to reflect product, legal, or operational
                changes. We will post the revised Terms here and update the date at
                the top. We will provide additional notice before a material change
                takes effect where appropriate. Continued use after the effective
                date means you accept the updated Terms; if you do not agree, you
                should stop using the Service.
              </p>
            </section>

            <section id="contact">
              <p className="privacy-section-number">16</p>
              <h2>Contact us</h2>
              <p>
                Questions or concerns about these Terms are welcome. Email us and
                include enough detail for us to understand and respond to your request.
              </p>
              <a className="privacy-contact-link" href="mailto:hello@assessly.ng">
                hello@assessly.ng
                <ArrowRight aria-hidden="true" size={18} strokeWidth={2} />
              </a>
              <p className="privacy-back-home">
                <Link href="/">Return to the Assessly home page</Link>
              </p>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
