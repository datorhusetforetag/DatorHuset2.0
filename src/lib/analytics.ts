import { hasAnalyticsConsent } from "@/lib/consent";

type AnalyticsPayload = {
  event: string;
  properties?: Record<string, unknown>;
};

export const trackEvent = async ({ event, properties = {} }: AnalyticsPayload) => {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  const payload = {
    event,
    properties,
    path: window.location.pathname,
    ts: Date.now(),
  };

  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // ignore analytics transport failures
  });
};
