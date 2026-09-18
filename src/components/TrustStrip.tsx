/**
 * Bandet ovanför sidfoten: hur man kan betala och hur varan kommer fram.
 *
 * Betalsätten speglar PAYMENT_METHODS i server-local.js. Stripes "card"
 * visas för kunden som Visa, Mastercard, Apple Pay och Google Pay - samma
 * betalsätt i systemet, fyra olika val i kassan, så de står var för sig.
 *
 * Om märkena: de flesta av de här är ordmärken, och de är satta som text
 * i respektive märkes färg. Mastercards två ringar är ritade som SVG
 * eftersom formen är just två cirklar och går att återge exakt.
 *
 * Det här är inte leverantörernas officiella logotypfiler. Vill man ha
 * dem hämtas de från respektive varumärkessida - Klarna, PayPal, Visa,
 * Mastercard och PostNord har alla sidor med märken för handlare - och
 * läggs i public/brand/pay/. Då byts <Wordmark> mot en <img> och
 * strukturen är densamma.
 */

/** Vit platta som märket ligger på, som i förlagan. */
const Chip = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <li
    title={title}
    className="flex h-10 items-center justify-center rounded-md bg-white px-3 shadow-sm"
  >
    {children}
  </li>
);

const MastercardMark = () => (
  <svg viewBox="0 0 40 24" className="h-5 w-auto" role="img" aria-label="Mastercard">
    <circle cx="15" cy="12" r="9" fill="#EB001B" />
    <circle cx="25" cy="12" r="9" fill="#F79E1B" />
    <path
      d="M20 5.2a9 9 0 0 0 0 13.6 9 9 0 0 0 0-13.6Z"
      fill="#FF5F00"
    />
  </svg>
);

const VisaMark = () => (
  <span
    className="text-[15px] font-bold italic leading-none tracking-tight"
    style={{ color: "#1A1F71" }}
  >
    VISA
  </span>
);

const KlarnaMark = () => (
  <span
    className="rounded px-2 py-1 text-[12px] font-bold leading-none"
    style={{ backgroundColor: "#FFB3C7", color: "#0B051D" }}
  >
    Klarna.
  </span>
);

const PayPalMark = () => (
  <span className="text-[13px] font-bold leading-none tracking-tight">
    <span style={{ color: "#003087" }}>Pay</span>
    <span style={{ color: "#009CDE" }}>Pal</span>
  </span>
);

const AppleMark = () => (
  <span className="flex items-center gap-1 text-[13px] font-medium leading-none text-black">
    <svg viewBox="0 0 16 20" className="h-4 w-auto" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.1 10.6c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.8-3.6 2.1-1.5 2.7-.4 6.6 1.1 8.8.7 1.1 1.6 2.2 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.6.7 2.8.7c1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.4 0-.1-2.2-.9-2.2-3.6ZM10.9 3.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.6-.9 2.6 1 .1 2-.5 2.6-1.2Z"
      />
    </svg>
    Pay
  </span>
);

const GooglePayMark = () => (
  <span className="flex items-center gap-1 text-[13px] font-medium leading-none">
    <span className="text-[14px] font-bold" style={{ color: "#4285F4" }}>
      G
    </span>
    <span style={{ color: "#5F6368" }}>Pay</span>
  </span>
);

const PostNordMark = () => (
  <span className="text-[13px] font-bold leading-none" style={{ color: "#0072BB" }}>
    PostNord
  </span>
);

const PAYMENT_MARKS = [
  { title: "Klarna", mark: <KlarnaMark /> },
  { title: "PayPal", mark: <PayPalMark /> },
  { title: "Visa", mark: <VisaMark /> },
  { title: "Mastercard", mark: <MastercardMark /> },
  { title: "Apple Pay", mark: <AppleMark /> },
  { title: "Google Pay", mark: <GooglePayMark /> },
];

export const TrustStrip = () => {
  return (
    <section
      data-sandbox-id="home-trust"
      aria-label="Betalning och leverans"
      className="relative z-10 border-t border-white/10"
    >
      <div className="container mx-auto px-4 py-12 sm:py-14">
        <div className="flex flex-col gap-6">
          {/* Betalning ---------------------------------------------- */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <h2 className="text-sm font-semibold text-foreground/80">
              Säker betalning med:
            </h2>
            <ul className="flex flex-wrap items-center gap-2.5">
              {PAYMENT_MARKS.map((item) => (
                <Chip key={item.title} title={item.title}>
                  {item.mark}
                </Chip>
              ))}
            </ul>
          </div>

          {/* Leverans ------------------------------------------------ */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <h2 className="text-sm font-semibold text-foreground/80">
              Vi levererar med:
            </h2>
            <ul className="flex flex-wrap items-center gap-2.5">
              <Chip title="PostNord">
                <PostNordMark />
              </Chip>
              <Chip title="Upphämtning i Spånga">
                <span className="text-[13px] font-semibold leading-none text-[#0B051D]">
                  Hämta hos oss
                </span>
              </Chip>
            </ul>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Betalningen hanteras av Stripe. Vi ser aldrig dina kortuppgifter.
        </p>
      </div>
    </section>
  );
};

export default TrustStrip;
