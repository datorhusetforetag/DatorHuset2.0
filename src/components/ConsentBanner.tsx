import { useEffect, useState } from "react";
import { getConsentChoice, setConsentChoice } from "@/lib/consent";

export function ConsentBanner() {
  const [choice, setChoice] = useState<"granted" | "denied" | null>(() => getConsentChoice());

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

  if (choice) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] p-4">
      <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-foreground/20 dark:bg-background">
        <p className="text-sm font-semibold text-foreground">Integritet och analys</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Vi använder nödvändiga cookies för funktionalitet och valfria mätningar för att förbättra upplevelsen.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            onClick={() => setConsentChoice("granted")}
          >
            Acceptera analytics
          </button>
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 dark:border-foreground/20 dark:text-foreground dark:hover:bg-foreground/[0.09]"
            onClick={() => setConsentChoice("denied")}
          >
            Endast nödvändiga
          </button>
        </div>
      </div>
    </div>
  );
}
