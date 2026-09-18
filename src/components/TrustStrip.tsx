import { Store, Truck } from "lucide-react";

/**
 * Bandet ovanför sidfoten: hur man kan betala och hur varan kommer fram.
 *
 * Betalsätten speglar PAYMENT_METHODS i server-local.js. "card" hos
 * Stripe visas för kunden som Visa, Mastercard, Apple Pay och Google Pay
 * - de är samma betalsätt i systemet men fyra olika saker att välja på i
 * kassan, så de står var för sig här.
 *
 * Märkena är satta som text och inte som logotyper. Visa, Klarna och de
 * andra har egna riktlinjer för hur deras märken får återges, och en
 * hemmagjord efterlikning är sämre än ett rent ordmärke. Vill man ha de
 * riktiga logotyperna hämtas de från respektive leverantörs
 * varumärkessida och byts in här - strukturen är densamma.
 */

type Method = {
  name: string;
  /** Sant för de betalsätt som ligger under Stripes "card". */
  viaCard?: boolean;
};

const PAYMENT_METHODS: Method[] = [
  { name: "Klarna" },
  { name: "PayPal" },
  { name: "Visa", viaCard: true },
  { name: "Mastercard", viaCard: true },
  { name: "Apple Pay", viaCard: true },
  { name: "Google Pay", viaCard: true },
];

const SHIPPING_METHODS = [
  { name: "PostNord", detail: "Till ombud i hela Sverige", icon: Truck },
  { name: "Hämta hos oss", detail: "Spånga, efter överenskommelse", icon: Store },
];

export const TrustStrip = () => {
  return (
    <section
      data-sandbox-id="home-trust"
      aria-label="Betalning och leverans"
      className="relative z-10 border-t border-white/10"
    >
      <div className="container mx-auto px-4 py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Betalning ---------------------------------------------- */}
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Säker betalning med
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2.5">
              {PAYMENT_METHODS.map((method) => (
                <li
                  key={method.name}
                  className="rounded-sm border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-foreground/90"
                >
                  {method.name}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Betalningen hanteras av Stripe. Vi ser aldrig dina kortuppgifter.
            </p>
          </div>

          {/* Leverans ------------------------------------------------ */}
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Så får du datorn
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {SHIPPING_METHODS.map((method) => (
                <li
                  key={method.name}
                  className="flex items-start gap-3 rounded-sm border border-white/12 bg-white/[0.04] px-4 py-3"
                >
                  <method.icon
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-foreground/90">
                      {method.name}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      {method.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
