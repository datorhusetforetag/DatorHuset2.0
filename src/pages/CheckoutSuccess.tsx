import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { CheckoutSteps } from "@/components/CheckoutSteps";
import { Reveal } from "@/components/Reveal";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { PAGE_BANNERS } from "@/lib/pageBanners";

/**
 * Kvittot efter betalning.
 *
 * Sidan var i sämst skick av alla. Tre olika pastellrutor - grön, blå
 * och gul - på en sida vars duk är mörklila, och all text skriven med
 * text-gray-900. Mörkgrå text i en vit ruta går att läsa; mörkgrå text
 * som ärvs ned på en mörk duk gör det inte.
 *
 * Och värre än så: rubriken stod skriven som "Tack f\\u00f6r din
 * best\\u00e4llning!" rakt i JSX. Escape-sekvenser tolkas i
 * strängliteraler, inte i text mellan taggar, så kunden fick se
 * bokstavligen "Tack f\\u00f6r din best\\u00e4llning!" efter att ha
 * betalat. Det är rättat med riktiga tecken.
 *
 * Formen är nu densamma som varukorgen och kassan, med stegindikatorn
 * framme på sista steget så att det syns att man är klar. Rutorna är
 * borta: orderuppgifterna står som en lista, och "vad händer nu" som
 * numrerade steg i stället för som prickar i en gul ruta.
 */

const ACCENT = PAGE_BANNERS.receipt.accent;

const NEXT_STEPS = [
  {
    title: "Bekräftelsen kommer på mejl",
    body: "Den brukar vara framme inom några minuter. Titta i skräpposten om den dröjer.",
  },
  {
    title: "Vi packar och skickar",
    body: "Datorn provkörs innan den packas, precis som alla maskiner som lämnar oss.",
  },
  {
    title: "Du får en spårningslänk",
    body: "Så fort paketet är på väg skickar vi numret du kan följa det med.",
  },
  {
    title: "Leverans inom 3-5 arbetsdagar",
    body: "Har du valt upphämtning hör vi av oss när den står redo i Spånga.",
  },
];

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const hasInitializedRef = useRef(false);
  const sessionId = searchParams.get("session_id");
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const token = session?.access_token || "";

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    let isMounted = true;
    const controller = new AbortController();
    const safetyTimeout = window.setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 12000);

    const init = async () => {
      try {
        clearCart().catch((error) => {
          console.warn("Failed to clear cart", error);
        });
      } catch (error) {
        console.warn("Failed to clear cart", error);
      }

      if (sessionId && token) {
        const timeoutId = window.setTimeout(() => controller.abort(), 8000);
        try {
          const response = await fetch(`${apiBase}/api/orders/by-session/${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          if (response.ok) {
            const data = await response.json();
            if (!isMounted) return;
            const nextOrderNumber = data?.order_number ?? data?.fallback ?? null;
            setOrderNumber(nextOrderNumber ? String(nextOrderNumber) : null);
            setOrderStatus(data?.status ?? null);
          }
        } catch (error) {
          console.warn("Failed to load order number", error);
        } finally {
          window.clearTimeout(timeoutId);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    void init();
    return () => {
      isMounted = false;
      controller.abort();
      window.clearTimeout(safetyTimeout);
    };
  }, [apiBase, sessionId, token, clearCart]);

  if (loading) {
    return (
      <PageShell>
        <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <Loader className="mb-5 h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Bearbetar din betalning...</p>
        </div>
      </PageShell>
    );
  }

  const orderNumberLabel = orderNumber || (sessionId ? sessionId.slice(0, 8) : "-");
  const statusLabel = orderStatus === "received" ? "Order mottagen" : orderStatus || "Betald";

  return (
    <PageShell>
      <PageHero
        compact
        accent={ACCENT}
        sandboxId="receipt-hero"
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Orderbekräftelse" }]}
        eyebrow="Klart"
        title="Tack för din beställning!"
        lede="Betalningen gick igenom. Nu tar vi över."
        actions={<CheckoutSteps current={3} accent={ACCENT} />}
      />

      <section data-sandbox-id="receipt-body" className="relative">
        <div className="container mx-auto max-w-5xl px-4 pb-24 pt-10">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
            {/* Orderuppgifterna ---------------------------------------- */}
            <Reveal>
              <div className="rounded-lg border border-foreground/10 bg-background/70 p-7 sm:p-8">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: ACCENT + "24", color: ACCENT }}
                  >
                    <CheckCircle2 className="h-6 w-6" />
                  </span>
                  <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
                    Orderdetaljer
                  </h2>
                </div>

                {sessionId ? (
                  <dl className="mt-7 divide-y divide-foreground/10 border-y border-foreground/10 text-sm">
                    <div className="flex items-baseline justify-between gap-4 py-3.5">
                      <dt className="text-muted-foreground">Ordernummer</dt>
                      <dd className="font-mono text-sm font-semibold text-foreground">
                        {orderNumberLabel}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-3.5">
                      <dt className="text-muted-foreground">Status</dt>
                      <dd className="font-semibold" style={{ color: ACCENT }}>
                        {statusLabel}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-3.5">
                      <dt className="text-muted-foreground">Tid</dt>
                      <dd className="text-foreground">
                        {new Date().toLocaleString("sv-SE")}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                    Kunde inte hitta ordernumret än. Det står i bekräftelsen som
                    kommer på mejl, och under Mina beställningar.
                  </p>
                )}

                <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                  Bekräftelsen skickas till din e-post. Hittar du den inte inom
                  en kvart, hör av dig så skickar vi om den.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link to="/orders" className="btn-primary sm:flex-1">
                    Mina beställningar
                  </Link>
                  <Link to="/products" className="btn-secondary sm:flex-1">
                    Fortsätt handla
                  </Link>
                </div>
              </div>
            </Reveal>

            {/* Vad händer nu ------------------------------------------- */}
            <Reveal delay={110}>
              <p className="eyebrow" style={{ color: ACCENT }}>
                Vad händer nu
              </p>
              <h2 className="section-title mt-3 text-2xl sm:text-3xl">
                Härifrån sköter vi resten
              </h2>

              <ol className="mt-8 divide-y divide-foreground/10 border-t border-foreground/10">
                {NEXT_STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className="grid gap-2 py-5 sm:grid-cols-[3rem_1fr] sm:gap-5"
                  >
                    <span
                      aria-hidden="true"
                      className="select-none font-display text-xl font-bold leading-none tabular-nums sm:text-2xl"
                      style={{ color: ACCENT, opacity: 0.5 }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block font-display text-base font-bold tracking-tight text-foreground">
                        {step.title}
                      </span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                        {step.body}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>

              <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
                Något som inte stämmer?{" "}
                <Link to="/kundservice" className="link-underline font-semibold text-primary">
                  Hör av dig till kundservice
                </Link>{" "}
                med ordernumret ovan så löser vi det.
              </p>
            </Reveal>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
