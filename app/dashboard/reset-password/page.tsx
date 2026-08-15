"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getAdminProfile, signOut, updateAdminPassword } from "@/lib/authService";
import { supabase } from "@/lib/supabase";

type PageState = "checking" | "ready" | "invalid" | "complete";

export default function AdminResetPasswordPage() {
  const [pageState, setPageState] = useState<PageState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    let active = true;

    const checkRecoverySession = async () => {
      if (!active || completedRef.current) return;
      try {
        const profile = await getAdminProfile();
        if (active) setPageState(profile ? "ready" : "invalid");
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
      await updateAdminPassword(password);
      completedRef.current = true;
      setPageState("complete");
      await signOut();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not update your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-3xl bg-white p-7 shadow-2xl shadow-green-900/10 ring-1 ring-black/5 sm:p-8">
          <Link href="/dashboard/login" className="mb-7 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-800">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Back to admin sign in
          </Link>

          {pageState === "checking" && (
            <div className="py-12 text-center">
              <svg className="mx-auto h-7 w-7 animate-spin text-green-700" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              <p className="mt-3 text-sm text-gray-500">Checking your recovery link…</p>
            </div>
          )}

          {pageState === "invalid" && (
            <div className="py-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              </div>
              <h1 className="mt-4 text-xl font-bold text-gray-900">Recovery link unavailable</h1>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                This link may have expired, already been used, or does not belong to an admin account.
              </p>
              <Link href="/dashboard/login" className="mt-5 inline-flex rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800">
                Request another link
              </Link>
            </div>
          )}

          {pageState === "ready" && (
            <>
              <div className="mb-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75z" /></svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1>
                <p className="mt-1.5 text-sm leading-6 text-gray-500">Enter a new password for your Assessly admin account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="block text-xs font-semibold text-gray-600">New password</label>
                  <input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={6} required className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                </div>
                <div>
                  <label htmlFor="confirm-new-password" className="block text-xs font-semibold text-gray-600">Confirm new password</label>
                  <input id="confirm-new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={6} required className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                </div>

                {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>}

                <button type="submit" disabled={loading} className="flex w-full items-center justify-center rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? "Updating password…" : "Update password"}
                </button>
              </form>
            </>
          )}

          {pageState === "complete" && (
            <div className="py-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </div>
              <h1 className="mt-4 text-xl font-bold text-gray-900">Password updated</h1>
              <p className="mt-2 text-sm leading-6 text-gray-500">You can now sign in using your admin email and new password.</p>
              <Link href="/dashboard/login" className="mt-5 inline-flex rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800">
                Go to admin sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
