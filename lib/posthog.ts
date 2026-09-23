import { PostHog } from "posthog-node";

let _posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog {
  if (!_posthogClient) {
    _posthogClient = new PostHog(process.env.POSTHOG_KEY!, {
      host: process.env.POSTHOG_HOST ?? "https://us.i.posthog.com",
      // Flush events immediately in serverless environments
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return _posthogClient;
}
