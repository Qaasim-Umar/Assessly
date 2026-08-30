"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, LoaderCircle, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type VerificationState = "checking" | "success" | "error";
type AccountPortal = "admin" | "student";

function authErrorFromUrl(url: URL): string | null {
  const query = url.searchParams;
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const description = query.get("error_description") ?? hash.get("error_description");
  const code = query.get("error_code") ?? hash.get("error_code");

  if (description) return description.replace(/\+/g, " ");
  if (code) return "This verification link is invalid or has expired.";
  return null;
}

export default function EmailVerifiedPage() {
  const [state, setState] = useState<VerificationState>("checking");
  const [error, setError] = useState("");
  const [portal, setPortal] = useState<AccountPortal>("student");

  useEffect(() => {
    let cancelled = false;

    const finishVerification = async () => {
      const url = new URL(window.location.href);
      setPortal(url.searchParams.get("account") === "admin" ? "admin" : "student");

      const authError = authErrorFromUrl(url);
      if (authError) {
        if (!cancelled) {
          setError(authError);
          setState("error");
        }
        return;
      }

      // Initializing the Supabase client on this page lets it securely store any
      // session returned with the confirmation link before the user continues.
      try {
        await supabase.auth.getSession();
      } catch {
        // The confirmation itself is handled by Supabase before this page loads.
        // A temporary session-read failure should not hide a successful result.
      }
      if (cancelled) return;

      if (url.hash) {
        window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
      }
      setState("success");
    };

    void finishVerification();
    return () => {
      cancelled = true;
    };
  }, []);

  const destination = portal === "admin" ? "/dashboard" : "/student";
  const destinationLabel = portal === "admin" ? "Continue to admin dashboard" : "Continue to student portal";
  const retryDestination = portal === "admin" ? "/dashboard" : "/student";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-100 px-4 py-10">
      <section className="w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-2xl shadow-emerald-950/10">
        <div className="bg-gradient-to-br from-emerald-700 to-green-800 px-6 py-8 text-center text-white sm:px-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
            <MailCheck size={28} aria-hidden="true" />
          </span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Assessly account security</p>
        </div>

        <div className="px-6 py-8 text-center sm:px-10">
          {state === "checking" && (
            <div role="status" aria-live="polite">
              <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-emerald-700" aria-hidden="true" />
              <h1 className="mt-5 text-2xl font-extrabold text-gray-950">Confirming your email…</h1>
              <p className="mt-2 text-sm leading-6 text-gray-600">Please wait while Assessly finishes securing your account.</p>
            </div>
          )}

          {state === "success" && (
            <div role="status" aria-live="polite">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" strokeWidth={2.2} aria-hidden="true" />
              <h1 className="mt-5 text-2xl font-extrabold text-gray-950">Congratulations! Your email is verified</h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-600">
                Your email is now connected to your Assessly account. You can use it with your existing password the next time you sign in.
              </p>
              <Link
                href={destination}
                className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-extrabold text-white transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
              >
                {destinationLabel}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          )}

          {state === "error" && (
            <div role="alert">
              <AlertTriangle className="mx-auto h-12 w-12 text-amber-600" aria-hidden="true" />
              <h1 className="mt-5 text-2xl font-extrabold text-gray-950">Email verification did not finish</h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-600">{error}</p>
              <Link
                href={retryDestination}
                className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gray-900 px-5 text-sm font-extrabold text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2"
              >
                Return and request another link
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
