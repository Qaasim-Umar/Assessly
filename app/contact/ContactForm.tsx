"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";

export default function ContactForm() {
  const [draftOpened, setDraftOpened] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const topic = String(form.get("topic") ?? "General enquiry");
    const message = String(form.get("message") ?? "").trim();

    const subject = encodeURIComponent(`[${topic}] Message from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`,
    );

    setDraftOpened(true);
    window.location.href = `mailto:hello@assessly.ng?subject=${subject}&body=${body}`;
  }

  return (
    <div className="contact-form-card">
      <h2>Send us a message</h2>
      <p className="contact-form-intro">
        Complete the fields below and we will prepare an email draft for you to review and send.
      </p>

      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="contact-field-row">
          <div className="contact-field">
            <label htmlFor="contact-name">Your name</label>
            <input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              maxLength={100}
            />
          </div>

          <div className="contact-field">
            <label htmlFor="contact-email">Email address</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              maxLength={200}
            />
          </div>
        </div>

        <div className="contact-field">
          <label htmlFor="contact-topic">What can we help with?</label>
          <select id="contact-topic" name="topic" defaultValue="General enquiry">
            <option>General enquiry</option>
            <option>Student support</option>
            <option>School or educator enquiry</option>
            <option>Account access</option>
            <option>Privacy request</option>
            <option>Report a problem</option>
            <option>Product feedback</option>
          </select>
        </div>

        <div className="contact-field">
          <label htmlFor="contact-message">
            Message <span>— please do not include passwords</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            minLength={10}
            maxLength={4000}
          />
        </div>

        <p className="contact-helper">
          This form does not upload your message to Assessly. Your email application
          will open so you can check the draft before sending it.
        </p>

        {draftOpened && (
          <p className="contact-status" role="status" aria-live="polite">
            Your email draft should now be open. If nothing happened, email us directly at hello@assessly.ng.
          </p>
        )}

        <button className="contact-submit" type="submit">
          Open email draft <Send aria-hidden="true" size={17} strokeWidth={2} />
        </button>
      </form>
    </div>
  );
}
