"use client";

import { useEffect, useState } from "react";
import { Check, KeyRound, LoaderCircle, Mail, X } from "lucide-react";
import { sendStudentPasswordReset } from "@/lib/authService";

export default function StudentForgotPasswordModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, onClose]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendStudentPasswordReset(email);
      setSent(true);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not send the reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/55 px-4 py-8 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-forgot-password-title"
      aria-describedby="student-forgot-password-description"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
          aria-label="Close password recovery"
        >
          <X size={19} aria-hidden="true" />
        </button>

        <div className="border-b border-gray-100 px-6 py-5 pr-16">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <KeyRound size={20} aria-hidden="true" />
          </div>
          <h2 id="student-forgot-password-title" className="text-xl font-bold text-gray-900">
            Reset student password
          </h2>
          <p id="student-forgot-password-description" className="mt-1 text-sm leading-5 text-gray-600">
            For Individual students with a real email connected to their account.
          </p>
        </div>

        {sent ? (
          <div className="px-6 py-6" role="status">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Check size={22} strokeWidth={2.5} aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Check your inbox</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              If an Individual student account uses <strong className="text-gray-900">{email.trim().toLowerCase()}</strong>, it will receive a secure reset link.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 min-h-12 w-full rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6">
            <label htmlFor="student-reset-email" className="block text-xs font-semibold text-gray-700">
              Student email address
            </label>
            <div className="relative mt-2">
              <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id="student-reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value.slice(0, 254))}
                placeholder="student@example.com"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                required
                maxLength={254}
                aria-describedby="student-reset-help"
                className="min-h-12 w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <p id="student-reset-help" className="mt-2 text-xs leading-5 text-gray-600">
              School pupil using a Pupil ID and PIN? Ask your teacher or school admin to reset your PIN.
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-800" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {loading && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
              {loading ? "Sending reset link…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
