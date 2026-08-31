"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff, KeyRound, LoaderCircle, TriangleAlert } from "lucide-react";
import {
  getStudentProfile,
  studentSignOut,
  updateStudentPassword,
} from "@/lib/authService";
import { supabase } from "@/lib/supabase";

type PageState = "checking" | "ready" | "invalid" | "complete";

const passwordInputClass = "min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-base text-gray-900 outline-none transition-colors focus:border-green-600 focus:ring-2 focus:ring-green-500/20 sm:text-sm";

export default function StudentResetPasswordPage() {
  const [pageState, setPageState] = useState<PageState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    let active = true;

    const checkRecoverySession = async () => {
      if (!active || completedRef.current) return;
      try {
        const profile = await getStudentProfile();
        const validStudent = profile?.account_type === "individual_student";
        if (active) setPageState(validStudent ? "ready" : "invalid");
      } catch {
        if (active) setPageState("invalid");
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION" || event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        window.setTimeout(checkRecoverySession, 0);
      }
    });

    const timer = window.setTimeout(checkRecoverySession, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await updateStudentPassword(password);
      completedRef.current = true;
      setPageState("complete");
      await studentSignOut();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not update your password.");
    } finally {
      setLoading(false);
    }
  };

  const passwordToggle = (label: string) => (
    <button
      type="button"
      onClick={() => setShowPassword((current) => !current)}
      className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-600"
      aria-label={`${showPassword ? "Hide" : "Show"} ${label}`}
    >
      {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
    </button>
  );

  return (
    <main className="min-h-dvh bg-gradient-to-br from-green-50 via-white to-green-100 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-3xl bg-white p-7 shadow-2xl shadow-green-900/10 ring-1 ring-black/5 sm:p-8">
          <Link href="/login" className="mb-7 inline-flex min-h-11 items-center rounded-lg text-xs font-semibold text-gray-600 transition-colors hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600">
            Back to student sign in
          </Link>

          {pageState === "checking" && (
            <div className="py-12 text-center" role="status">
              <LoaderCircle size={28} className="mx-auto animate-spin text-green-700" aria-hidden="true" />
              <p className="mt-3 text-sm text-gray-600">Checking your recovery link…</p>
            </div>
          )}

          {pageState === "invalid" && (
            <div className="py-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <TriangleAlert size={23} aria-hidden="true" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-gray-900">Recovery link unavailable</h1>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                This link may have expired, already been used, or does not belong to an Individual student account.
              </p>
              <Link href="/login" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2">
                Request another link
              </Link>
            </div>
          )}

          {pageState === "ready" && (
            <>
              <div className="mb-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                  <KeyRound size={22} aria-hidden="true" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1>
                <p className="mt-1.5 text-sm leading-6 text-gray-600">Enter a new password for your Individual student account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="student-new-password" className="block text-xs font-semibold text-gray-700">New password</label>
                  <div className="relative mt-2">
                    <input id="student-new-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={6} required autoFocus className={passwordInputClass} />
                    {passwordToggle("new password")}
                  </div>
                </div>
                <div>
                  <label htmlFor="student-confirm-password" className="block text-xs font-semibold text-gray-700">Confirm new password</label>
                  <div className="relative mt-2">
                    <input id="student-confirm-password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={6} required className={passwordInputClass} />
                    {passwordToggle("password confirmation")}
                  </div>
                </div>

                {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-800" role="alert">{error}</div>}

                <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
                  {loading && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
                  {loading ? "Updating password…" : "Update password"}
                </button>
              </form>
            </>
          )}

          {pageState === "complete" && (
            <div className="py-5 text-center" role="status">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                <Check size={23} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-gray-900">Password updated</h1>
              <p className="mt-2 text-sm leading-6 text-gray-600">You can now sign in using your student email and new password.</p>
              <Link href="/login" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2">
                Go to student sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
