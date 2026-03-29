import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getConsentChoice, setConsentChoice } from "@/lib/consent";

export function ConsentBanner() {
  const [choice, setChoice] = useState<"granted" | "denied" | null>(() => getConsentChoice());
  const location = useLocation();

  useEffect(() => {
    const onConsentUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ choice?: "granted" | "denied" }>).detail;
      if (detail?.choice === "granted" || detail?.choice === "denied") {
        setChoice(detail.choice);
      }
    };
    window.addEventListener("datorhuset-consent-updated", onConsentUpdate);
    return () => window.removeEventListener("datorhuset-consent-updated", onConsentUpdate);
  }, []);

  if (choice || location.pathname === "/site-sandbox/preview") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] p-4">
      <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Integritet och analys</p>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
          Vi använder nödvändiga cookies för funktionalitet och valfria mätningar för att förbättra upplevelsen.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-300"
            onClick={() => setConsentChoice("granted")}
          >
            Acceptera analytics
          </button>
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
            onClick={() => setConsentChoice("denied")}
          >
            Endast nödvändiga
          </button>
        </div>
      </div>
    </div>
  );
}
