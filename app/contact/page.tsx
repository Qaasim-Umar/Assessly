import Link from "next/link";
import {
  ArrowRight,
  FileText,
  LifeBuoy,
  Mail,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "./ContactForm";

export default function ContactPage() {
  return (
    <div className="lp-root company-page">
      <Navbar />

      <main id="main-content">
        <header className="company-hero">
          <div className="company-hero-inner">
            <div className="company-eyebrow">
              <MessageSquareText aria-hidden="true" size={17} strokeWidth={2} />
              Contact Assessly
            </div>
            <h1>
              How can we
              <br />
              <em>help?</em>
            </h1>
            <p className="company-hero-copy">
              Whether you are stuck on an account, considering Assessly for your
              school, or have an idea that could make the product better, send us a message.
            </p>
          </div>
        </header>

        <section className="company-section company-section-alt">
          <div className="company-inner contact-layout">
            <div className="contact-details">
              <p className="company-section-label">Get in touch</p>
              <h2>Start with a simple message.</h2>
              <p className="company-lead">
                Tell us what you are trying to do and what went wrong. Useful
                details help us understand the issue faster.
              </p>

              <a className="contact-email-card" href="mailto:hello@assessly.ng">
                <span className="contact-icon-box">
                  <Mail aria-hidden="true" size={22} strokeWidth={1.8} />
                </span>
                <span>
                  <strong>Email us directly</strong>
                  <span>hello@assessly.ng</span>
                </span>
              </a>

              <p className="contact-note">
                For account help, include the username or school code involved—but
                never send your password. For privacy requests, use the subject
                “Privacy request” so we can route it correctly.
              </p>
            </div>

            <ContactForm />
          </div>
        </section>

        <section className="company-section">
          <div className="company-inner">
            <p className="company-section-label">Find the right path</p>
            <h2>You may find the answer here first.</h2>

            <div className="contact-quick-links">
              <Link href="/login" className="contact-quick-link">
                <LifeBuoy aria-hidden="true" size={22} strokeWidth={1.8} />
                <span>
                  <strong>Student account help</strong>
                  <span>Return to student login or check your school code.</span>
                </span>
              </Link>

              <Link href="/privacy" className="contact-quick-link">
                <ShieldCheck aria-hidden="true" size={22} strokeWidth={1.8} />
                <span>
                  <strong>Privacy questions</strong>
                  <span>See what data we collect and how to make a request.</span>
                </span>
              </Link>

              <Link href="/terms" className="contact-quick-link">
                <FileText aria-hidden="true" size={22} strokeWidth={1.8} />
                <span>
                  <strong>Using Assessly</strong>
                  <span>Read the rules and responsibilities for the Service.</span>
                </span>
              </Link>
            </div>
          </div>
        </section>

        <section className="company-cta">
          <div className="company-cta-inner">
            <div>
              <h2>Looking for the story behind Assessly?</h2>
              <p>Learn what we are building and the principles guiding the product.</p>
            </div>
            <Link href="/about" className="company-cta-link">
              About Assessly <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
