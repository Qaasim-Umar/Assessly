import Link from "next/link";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const sections = [
  { id: "scope", label: "Who this policy covers" },
  { id: "data-we-collect", label: "Data we collect" },
  { id: "how-we-use-data", label: "How we use data" },
  { id: "legal-bases", label: "Why we may process data" },
  { id: "sharing", label: "When we share data" },
  { id: "children", label: "Children’s privacy" },
  { id: "advertising", label: "Advertising and cookies" },
  { id: "storage", label: "Storage and security" },
  { id: "retention", label: "How long we keep data" },
  { id: "rights", label: "Your privacy rights" },
  { id: "choices", label: "Your choices" },
  { id: "changes", label: "Changes to this policy" },
  { id: "contact", label: "Contact us" },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="lp-root privacy-page">
      <Navbar />

      <main id="main-content">
        <header className="privacy-hero">
          <div className="privacy-hero-inner">
            <div className="privacy-eyebrow">
              <ShieldCheck aria-hidden="true" size={17} strokeWidth={2} />
              Your data, clearly explained
            </div>
            <h1>Privacy Policy</h1>
            <p className="privacy-intro">
              This policy explains what personal data Assessly collects, why we
              use it, who we share it with, and the choices available to you.
            </p>
            <p className="privacy-date">
              Effective and last updated: <time dateTime="2026-07-29">29 July 2026</time>
            </p>
          </div>
        </header>

        <div className="privacy-shell">
          <aside className="privacy-toc" aria-label="Privacy policy contents">
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
              <LockKeyhole aria-hidden="true" size={22} strokeWidth={1.8} />
              <div>
                <strong>The short version</strong>
                <p>
                  We use data to provide and improve Assessly, keep accounts and
                  exams secure, and show schools and students their results. We
                  do not sell your personal data.
                </p>
              </div>
            </div>

            <section id="scope">
              <p className="privacy-section-number">01</p>
              <h2>Who this policy covers</h2>
              <p>
                This Privacy Policy applies when you visit assessly.ng or use
                Assessly as a student, school administrator, educator, or other
                visitor. In this policy, “Assessly”, “we”, “us”, and “our” refer
                to the operator of the Assessly platform.
              </p>
              <p>
                Schools may also make decisions about student information they
                enter or manage through Assessly. In those situations, the school
                may have its own privacy responsibilities and policies. You can
                contact your school for questions about how it uses your data.
              </p>
            </section>

            <section id="data-we-collect">
              <p className="privacy-section-number">02</p>
              <h2>Data we collect</h2>

              <h3>Information you provide</h3>
              <ul>
                <li>
                  <strong>Account information:</strong> a name or display name,
                  username, phone number when used as a username, password, and
                  school code.
                </li>
                <li>
                  <strong>School and educator information:</strong> administrator
                  usernames, school codes, exams, questions, marking settings,
                  and other content submitted to the platform.
                </li>
                <li>
                  <strong>Assessment information:</strong> exam answers, theory
                  responses, scores, percentages, timing and progress information,
                  and related submission records.
                </li>
                <li>
                  <strong>Communications:</strong> information you include when
                  you contact us for help, feedback, or another request.
                </li>
              </ul>

              <h3>Information collected automatically</h3>
              <ul>
                <li>
                  <strong>Usage and device information:</strong> pages viewed,
                  features used, referring pages, browser and device type,
                  approximate location derived from an IP address, and diagnostic
                  information such as errors and performance data.
                </li>
                <li>
                  <strong>Browser storage:</strong> authentication tokens, your
                  most recently used school code, exam progress, practice-session
                  state, and content reactions may be stored in cookies, local
                  storage, or session storage so the service works as expected.
                </li>
              </ul>
              <p>
                We do not intentionally ask for sensitive information such as
                health data, biometric data, financial account details, or
                government identification numbers through the normal use of
                Assessly. Please do not include this information in exam content
                or support messages unless it is necessary and you are authorised
                to do so.
              </p>
            </section>

            <section id="how-we-use-data">
              <p className="privacy-section-number">03</p>
              <h2>How we use data</h2>
              <p>We use personal data to:</p>
              <ul>
                <li>create and secure student and administrator accounts;</li>
                <li>connect students with the correct school and exams;</li>
                <li>deliver assessments, save answers, calculate scores, and display results;</li>
                <li>allow educators to create exams, review submissions, and grade theory answers;</li>
                <li>provide support and respond to privacy or account requests;</li>
                <li>understand how the service is used and improve its reliability and usability;</li>
                <li>detect abuse, investigate security issues, and protect users and the platform; and</li>
                <li>meet legal, regulatory, and record-keeping obligations.</li>
              </ul>
              <p>
                Multiple-choice scores may be calculated automatically from an
                answer key. Theory responses can be reviewed and graded by an
                educator. Assessly does not use automated scoring to make legal or
                similarly significant decisions about you.
              </p>
            </section>

            <section id="legal-bases">
              <p className="privacy-section-number">04</p>
              <h2>Why we may process data</h2>
              <p>
                Under the Nigeria Data Protection Act 2023 and other applicable
                laws, we rely on one or more lawful bases depending on the context:
              </p>
              <ul>
                <li>
                  <strong>Contract:</strong> to provide the Assessly service you
                  or your school requested.
                </li>
                <li>
                  <strong>Legitimate interests:</strong> to operate, secure, analyse,
                  and improve the platform, where those interests do not override
                  your rights.
                </li>
                <li>
                  <strong>Consent:</strong> where we ask for and receive your
                  permission. You may withdraw consent at any time.
                </li>
                <li>
                  <strong>Legal obligation:</strong> where processing is necessary
                  to comply with applicable law or a lawful request.
                </li>
              </ul>
            </section>

            <section id="sharing">
              <p className="privacy-section-number">05</p>
              <h2>When we share data</h2>
              <p>We may share personal data with:</p>
              <ul>
                <li>
                  <strong>Your school or educator:</strong> student names, exam
                  submissions, scores, and related records may be visible to the
                  school that provided the relevant school code or exam.
                </li>
                <li>
                  <strong>Service providers:</strong> suppliers that help us host,
                  secure, analyse, and operate Assessly, including Supabase,
                  Vercel, and PostHog. They process data for the services they
                  provide to us and under their own contractual and privacy terms.
                </li>
                <li>
                  <strong>Authorities or other parties:</strong> where disclosure
                  is required by law, necessary to protect rights and safety, or
                  needed to investigate fraud or a security incident.
                </li>
                <li>
                  <strong>A successor organisation:</strong> in connection with a
                  merger, financing, reorganisation, or sale of all or part of the
                  service, subject to appropriate safeguards.
                </li>
              </ul>
              <p>
                Some providers may process data outside Nigeria. Where personal
                data is transferred internationally, we take steps intended to
                ensure the transfer is permitted and protected under applicable law.
                We do not sell your personal data.
              </p>
            </section>

            <section id="children">
              <p className="privacy-section-number">06</p>
              <h2>Children’s privacy</h2>
              <p>
                Assessly is an education service and may be used by students under
                18. If you are under 18, you should use Assessly through your school
                or with the involvement and permission of a parent or guardian.
                Schools and educators should only provide children’s personal data
                when they have the authority and any permission required to do so.
              </p>
              <p>
                We use children’s data only to provide and protect the education
                service, support assessment activities, and meet applicable legal
                requirements. We do not use children’s personal data for targeted
                advertising. A parent or guardian who believes a child’s data was
                provided without proper permission can contact us to request review
                or deletion.
              </p>
            </section>

            <section id="advertising">
              <p className="privacy-section-number">07</p>
              <h2>Advertising and cookies</h2>
              <p>
                Assessly may use Google AdSense and other advertising partners to
                display, deliver, limit, and measure ads. If advertising is shown,
                Google and its partners may use cookies, device identifiers, or
                similar technologies to serve ads based on your visits to Assessly
                and other websites, subject to applicable consent and age rules.
              </p>
              <p>
                Where required, we will ask for consent before using non-essential
                advertising technologies. Depending on your location, choices, and
                the context in which Assessly is used, ads may be personalised or
                non-personalised. We do not use children’s personal data to
                personalise advertising, and school assessment areas or experiences
                directed to children will not use personalised ads.
              </p>
              <p>
                You can review or change Google ad personalisation choices in{" "}
                <a
                  href="https://adssettings.google.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google Ads Settings
                </a>
                . You can also restrict cookies through your browser or use any
                consent controls displayed on Assessly. Rejecting non-essential
                cookies will not disable cookies that are necessary for security,
                account access, or core assessment features.
              </p>
            </section>

            <section id="storage">
              <p className="privacy-section-number">08</p>
              <h2>Storage and security</h2>
              <p>
                We use administrative, technical, and organisational safeguards
                designed to protect personal data. These include authentication,
                access controls, encrypted network connections, and database
                security rules. No online service can guarantee absolute security,
                so please use a strong, unique password and keep school codes and
                login details private.
              </p>
              <p>
                If you believe your account or personal data has been compromised,
                contact us promptly at{" "}
                <a href="mailto:hello@assessly.ng">hello@assessly.ng</a>.
              </p>
            </section>

            <section id="retention">
              <p className="privacy-section-number">09</p>
              <h2>How long we keep data</h2>
              <p>
                We keep personal data only for as long as reasonably necessary to
                provide the service, maintain academic and security records, meet
                legal obligations, resolve disputes, and enforce agreements. The
                period depends on the type of data, why it was collected, and
                whether an account or school relationship remains active.
              </p>
              <p>
                When data is no longer needed, we delete it, anonymise it, or place
                it beyond active use. Backup copies may remain for a limited period
                before being overwritten. You may ask us to delete your data as
                described below, although we may retain information where the law
                permits or requires it.
              </p>
            </section>

            <section id="rights">
              <p className="privacy-section-number">10</p>
              <h2>Your privacy rights</h2>
              <p>
                Depending on the law that applies, you may have the right to be
                informed about our processing and to request access, correction,
                deletion, restriction, objection, or portability of your personal
                data. You may also withdraw consent and object to certain automated
                decision-making.
              </p>
              <p>
                To make a request, email{" "}
                <a href="mailto:hello@assessly.ng">hello@assessly.ng</a> and tell
                us what you need. We may ask for information needed to confirm your
                identity and protect your account. If your data is controlled by a
                school, we may direct the request to that school or work with it to
                respond.
              </p>
              <p>
                You may lodge a complaint with the{" "}
                <a href="https://www.ndpc.gov.ng/" target="_blank" rel="noreferrer">
                  Nigeria Data Protection Commission
                </a>. We would appreciate the opportunity to address your concern first.
              </p>
            </section>

            <section id="choices">
              <p className="privacy-section-number">11</p>
              <h2>Your choices</h2>
              <ul>
                <li>
                  You can update inaccurate profile information by contacting us
                  or your school administrator.
                </li>
                <li>
                  You can clear site data through your browser settings, but doing
                  so may sign you out or erase saved exam and practice progress.
                </li>
                <li>
                  You can block or limit cookies and similar technologies in your
                  browser. Some essential account and session features may then stop working.
                </li>
                <li>
                  You can request account deletion by emailing us. School-held
                  assessment records may also require action by your school.
                </li>
              </ul>
            </section>

            <section id="changes">
              <p className="privacy-section-number">12</p>
              <h2>Changes to this policy</h2>
              <p>
                We may update this policy as Assessly changes or when legal
                requirements change. We will post the revised policy here and
                update the date at the top. If a change materially affects how we
                use personal data, we will provide additional notice where appropriate.
              </p>
            </section>

            <section id="contact">
              <p className="privacy-section-number">13</p>
              <h2>Contact us</h2>
              <p>
                Questions, requests, or concerns about this policy or your personal
                data are welcome. Email our privacy team and include enough detail
                for us to understand and respond to your request.
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
