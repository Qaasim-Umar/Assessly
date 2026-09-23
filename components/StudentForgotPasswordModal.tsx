"use client";

import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, KeyRound, LoaderCircle, Mail, X } from "lucide-react";
import {
  sendStudentPasswordReset,
  verifyStudentResetOtpAndUpdatePassword,
} from "@/lib/authService";

type Step = "email" | "code" | "done";

const inputClass =
  "min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none transition-colors focus:border-green-600 focus:ring-2 focus:ring-green-500/20 sm:text-sm";

export default function StudentForgotPasswordModal({
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, onClose]);

  // ── Step 1: send reset email ────────────────────────────────────────────────
  const handleSendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendStudentPasswordReset(email);
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
      await verifyStudentResetOtpAndUpdatePassword(email, code, password);
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
      aria-labelledby="student-forgot-password-title"
      aria-describedby="student-forgot-password-description"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
          aria-label="Close password recovery"
        >
          <X size={19} aria-hidden="true" />
        </button>

        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-5 pr-16">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <KeyRound size={20} aria-hidden="true" />
          </div>
          <h2 id="student-forgot-password-title" className="text-xl font-bold text-gray-900">
            {step === "done" ? "Password updated" : "Reset student password"}
          </h2>
          <p id="student-forgot-password-description" className="mt-1 text-sm leading-5 text-gray-600">
            {step === "email" && "For Individual students with a real email on their account."}
            {step === "code" && (
              <>
                Enter the 8-digit code sent to{" "}
                <strong className="text-gray-900">{email.trim().toLowerCase()}</strong>.
              </>
            )}
            {step === "done" && "You can now sign in with your new password."}
          </p>
        </div>

        {/* ── Step 1: email ── */}
        {step === "email" && (
          <form onSubmit={handleSendCode} className="px-6 py-6">
            <label htmlFor="student-reset-email" className="block text-xs font-semibold text-gray-700">
              Student email address
            </label>
            <div className="relative mt-2">
              <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id="student-reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, 254))}
                placeholder="student@example.com"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                required
                maxLength={254}
                className="min-h-12 w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-500/20 sm:text-sm"
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-gray-600">
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
              {loading ? "Sending code…" : "Send code"}
            </button>
          </form>
        )}

        {/* ── Step 2: code + new password ── */}
        {step === "code" && (
          <form onSubmit={handleVerifyAndUpdate} className="px-6 py-6 space-y-4">
            {/* 8-digit OTP */}
            <div>
              <label htmlFor="student-reset-code" className="block text-xs font-semibold text-gray-700">
                8-digit code
              </label>
              <input
                id="student-reset-code"
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
                className={`${inputClass} mt-2 tracking-[0.35em] text-center text-lg font-bold`}
              />
            </div>

            {/* New password */}
            <div>
              <label htmlFor="student-new-password" className="block text-xs font-semibold text-gray-700">
                New password
              </label>
              <div className="relative mt-2">
                <input
                  id="student-new-password"
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
                  className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="student-confirm-password" className="block text-xs font-semibold text-gray-700">
                Confirm new password
              </label>
              <div className="relative mt-2">
                <input
                  id="student-confirm-password"
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
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-800" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length < 8}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {loading && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
              {loading ? "Updating password…" : "Update password"}
            </button>

            <button
              type="button"
              onClick={() => { setStep("email"); setError(""); setCode(""); }}
              disabled={loading}
              className="min-h-11 w-full px-4 py-2 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-800 disabled:opacity-50"
            >
              ← Back / resend code
            </button>
          </form>
        )}

        {/* ── Step 3: done ── */}
        {step === "done" && (
          <div className="px-6 py-6" role="status">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Check size={22} strokeWidth={2.5} aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">All done!</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Your password has been updated. Sign in with your new password.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 min-h-12 w-full rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
            >
              Go to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
