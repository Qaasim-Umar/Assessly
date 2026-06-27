"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      ph.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, ph]);

  return null;
}

function AuthTracker() {
  const ph = usePostHog();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        ph.identify(session.user.id);
      } else if (event === "SIGNED_OUT") {
        ph.reset();
      }
    });
    return () => subscription.unsubscribe();
  }, [ph]);

  return null;
}

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-05-30",
    capture_pageview: false,
    capture_pageleave: true,
    person_profiles: "always",
  });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageViewTracker />
        <AuthTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}
