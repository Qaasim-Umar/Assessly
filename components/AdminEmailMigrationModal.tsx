"use client";

import { useState } from "react";
import { requestAdminEmailChange } from "@/lib/authService";

export default function AdminEmailMigrationModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestAdminEmailChange(email);
      setSent(true);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not update your email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/55 px-4 py-8 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-email-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-5 text-white">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21.75 6.75v10.5A2.25 2.25 0 0119.5 19.5h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 id="admin-email-title" className="text-xl font-bold">
            Update how you sign in
          </h2>
          <p className="mt-1 text-sm leading-5 text-green-100">
            Connect a real email to protect your account and make password recovery possible.
          </p>
        </div>

        {sent ? (
          <div className="px-6 py-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Check your inbox</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              We sent a verification link to <strong className="text-gray-900">{email.trim().toLowerCase()}</strong>.
              After you confirm it, sign in with that email and your existing password.
            </p>
            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 ring-1 ring-amber-200">
              Until you verify the email, your current username will continue to work.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800"
            >
              Continue to dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6">
            <label htmlFor="admin-real-email" className="block text-xs font-semibold text-gray-600">
              Your email address
            </label>
            <input
              id="admin-real-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              required
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
            <p className="mt-2 text-xs leading-5 text-gray-500">
              Your password will not change. We will send a verification link before switching your login.
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending verification link…" : "Send verification link"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="mt-2 w-full px-4 py-2 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-800 disabled:opacity-50"
            >
              Remind me later
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
