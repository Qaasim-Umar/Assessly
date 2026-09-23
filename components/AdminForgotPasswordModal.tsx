"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, LoaderCircle, Mail } from "lucide-react";
import {
  sendAdminPasswordReset,
  verifyAdminResetOtpAndUpdatePassword,
} from "@/lib/authService";

type Step = "email" | "code" | "done";

const inputClass =
  "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20";

export default function AdminForgotPasswordModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Step 1: send reset email ────────────────────────────────────────────────
  const handleSendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendAdminPasswordReset(email);
      setStep("code");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not send the reset email.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify code + set new password ──────────────────────────────────
  const handleVerifyAndUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await verifyAdminResetOtpAndUpdatePassword(email, code, password);
      setStep("done");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not reset your password.");
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
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <KeyRound size={20} aria-hidden="true" />
          </div>
          <h2 id="forgot-password-title" className="text-xl font-bold text-gray-900">
            {step === "done" ? "Password updated" : "Reset admin password"}
          </h2>
          <p className="mt-1 text-sm leading-5 text-gray-500">
            {step === "email" && "We'll email an 8-digit code to your admin address."}
            {step === "code" && (
              <>
                Enter the code sent to{" "}
                <strong className="text-gray-900">{email.trim().toLowerCase()}</strong>.
              </>
            )}
            {step === "done" && "You can now sign in with your new password."}
          </p>
        </div>

        {/* ── Step 1: email ── */}
        {step === "email" && (
          <form onSubmit={handleSendCode} className="px-6 py-6">
            <label htmlFor="admin-reset-email" className="block text-xs font-semibold text-gray-600">
              Admin email address
            </label>
            <div className="relative mt-2">
              <Mail
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                id="admin-reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, 254))}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                required
                maxLength={254}
                className="mt-0 w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              Still using a username? Sign in first and connect your real email from the dashboard.
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
              {loading ? "Sending code…" : "Send code"}
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

        {/* ── Step 2: code + new password ── */}
        {step === "code" && (
          <form onSubmit={handleVerifyAndUpdate} className="px-6 py-6 space-y-4">
            {/* 8-digit code */}
            <div>
              <label htmlFor="admin-reset-code" className="block text-xs font-semibold text-gray-600">
                8-digit code
              </label>
              <input
                id="admin-reset-code"
                type="text"
                inputMode="numeric"
                pattern="\d{8}"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="00000000"
                autoComplete="one-time-code"
                autoFocus
                required
                className={`${inputClass} tracking-[0.3em] text-center text-lg font-bold`}
              />
            </div>

            {/* New password */}
            <div>
              <label htmlFor="admin-new-password" className="block text-xs font-semibold text-gray-600">
                New password
              </label>
              <div className="relative">
                <input
                  id="admin-new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="admin-confirm-password" className="block text-xs font-semibold text-gray-600">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="admin-confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className={`${inputClass} pr-12`}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length < 8}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
              {loading ? "Updating password…" : "Update password"}
            </button>

            <button
              type="button"
              onClick={() => { setStep("email"); setError(""); setCode(""); }}
              disabled={loading}
              className="w-full px-4 py-2 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-800 disabled:opacity-50"
            >
              ← Back / resend code
            </button>
          </form>
        )}

        {/* ── Step 3: done ── */}
        {step === "done" && (
          <div className="px-6 py-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">All done!</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Your admin password has been updated. Sign in with your new password.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800"
            >
              Go to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
