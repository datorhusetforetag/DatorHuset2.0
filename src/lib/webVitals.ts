import { hasAnalyticsConsent } from "@/lib/consent";

type WebVitalsMetric = {
  id: string;
  name: string;
  value: number;
  rating?: string;
  delta?: number;
  navigationType?: string;
};

let started = false;

const sendMetric = (metric: WebVitalsMetric) => {
  if (!hasAnalyticsConsent()) return;

  const payload = {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating || "",
    delta: metric.delta || 0,
    navigationType: metric.navigationType || "",
    path: window.location.pathname,
    ts: Date.now(),
  };

  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/metrics", body);
    return;
  }

  fetch("/api/metrics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // swallow analytics transport errors
  });
};

const boot = async () => {
  if (started || !hasAnalyticsConsent()) return;
  started = true;

  const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import("web-vitals");
  onCLS(sendMetric);
  onFCP(sendMetric);
  onINP(sendMetric);
  onLCP(sendMetric);
  onTTFB(sendMetric);
};

export const startWebVitalsReporting = () => {
  if (typeof window === "undefined") return;
  void boot();
  window.addEventListener("datorhuset-consent-updated", () => {
    void boot();
  });
};
