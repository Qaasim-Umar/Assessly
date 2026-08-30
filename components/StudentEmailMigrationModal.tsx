"use client";

import { Check, LoaderCircle, Mail, X } from "lucide-react";
import { useEffect, useState } from "react";

import { requestStudentEmailChange } from "@/lib/authService";

export default function StudentEmailMigrationModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [loading, onClose]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestStudentEmailChange(email);
      setSent(true);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not connect your email.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/55 px-4 py-8 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-email-title"
      aria-describedby="student-email-description"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="relative bg-gradient-to-r from-green-700 to-green-600 px-6 py-5 text-white">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl text-green-100 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-wait disabled:opacity-50"
            aria-label="Close email reminder"
          >
            <X size={20} aria-hidden="true" />
          </button>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <Mail size={21} aria-hidden="true" />
          </div>
          <h2 id="student-email-title" className="pr-10 text-xl font-bold">
            Update how you sign in
          </h2>
          <p id="student-email-description" className="mt-1 pr-6 text-sm leading-5 text-green-100">
            Connect a real email to protect your Individual student account and make account recovery possible.
          </p>
        </div>

        {sent ? (
          <div className="px-6 py-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Check size={23} strokeWidth={2.7} aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Check your inbox</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              We sent a verification link to{" "}
              <strong className="break-all text-gray-900">{email.trim().toLowerCase()}</strong>.
              After you confirm it, sign in with that email and your existing password.
            </p>
            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 ring-1 ring-amber-200">
              Until you verify the email, your current phone number or username will continue to work.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-green-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
            >
              Continue to student portal
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6" noValidate>
            <label htmlFor="student-real-email" className="block text-xs font-semibold text-gray-700">
              Your email address
            </label>
            <input
              id="student-real-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              required
              className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-500/20 sm:text-sm"
            />
            <p className="mt-2 text-xs leading-5 text-gray-500">
              Your password will not change. We will verify the address before switching your login.
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {loading && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
              {loading ? "Sending verification link…" : "Send verification link"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="mt-2 min-h-11 w-full rounded-xl px-4 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-wait disabled:opacity-50"
            >
              Remind me later
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
