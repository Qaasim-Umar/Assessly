"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

interface PostHogProviderProps {
  apiKey: string;
  host: string;
  children: React.ReactNode;
}

export function PostHogProvider({ apiKey, host, children }: PostHogProviderProps) {
  useEffect(() => {
    posthog.init(apiKey, {
      api_host: host,
      ui_host: "https://us.posthog.com",
      capture_pageview: "history_change",
      capture_pageleave: true,
      person_profiles: "identified_only",
    });
  }, [apiKey, host]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
