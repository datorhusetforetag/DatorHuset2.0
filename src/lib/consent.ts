const CONSENT_STORAGE_KEY = "datorhuset_cookie_consent_v1";

export type ConsentChoice = "granted" | "denied";

export const getConsentChoice = (): ConsentChoice | null => {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (stored === "granted" || stored === "denied") return stored;
  return null;
};

export const setConsentChoice = (choice: ConsentChoice) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  window.dispatchEvent(new CustomEvent("datorhuset-consent-updated", { detail: { choice } }));
};

export const hasAnalyticsConsent = () => getConsentChoice() === "granted";
