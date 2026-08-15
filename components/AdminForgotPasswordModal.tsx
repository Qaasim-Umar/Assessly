"use client";

import { useState } from "react";
import { sendAdminPasswordReset } from "@/lib/authService";

export default function AdminForgotPasswordModal({
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
      await sendAdminPasswordReset(email);
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
      aria-labelledby="forgot-password-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.75 5.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0M18.75 8.25v6m3-3h-6" />
            </svg>
          </div>
          <h2 id="forgot-password-title" className="text-xl font-bold text-gray-900">
            Reset admin password
          </h2>
          <p className="mt-1 text-sm leading-5 text-gray-500">
            We will email a secure password-reset link to your admin address.
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
              If an admin account uses <strong className="text-gray-900">{email.trim().toLowerCase()}</strong>,
              it will receive a password-reset link.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6">
            <label htmlFor="admin-reset-email" className="block text-xs font-semibold text-gray-600">
              Admin email address
            </label>
            <input
              id="admin-reset-email"
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
              Still using a username? Sign in first and connect your real email from the dashboard.
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
              {loading ? "Sending reset link…" : "Send reset link"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="mt-2 w-full px-4 py-2 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
