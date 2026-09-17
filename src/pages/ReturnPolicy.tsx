import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, PackageCheck, RotateCcw, ShieldCheck, Wrench } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SeoHead } from "@/components/SeoHead";
import { SeoJsonLd } from "@/components/SeoJsonLd";

const SITE_URL = "https://datorhuset.se";
const SUPPORT_EMAIL = "support@datorhuset.se";
const LAST_UPDATED = "2026-09-17";

/**
 * Nyckeltalen samlade på ett ställe. Ändras fristerna är det här de ändras,
 * inte i brödtexten - annars säger sidan två olika saker.
 */
const KEY_FACTS = [
  {
    icon: CalendarClock,
    value: "14 dagar",
    label: "Ångerrätt",
    detail: "Från den dag du tog emot datorn. Gäller lagerförda datorer och tillbehör.",
  },
  {
    icon: ShieldCheck,
    value: "3 år",
    label: "Reklamationsrätt",
    detail: "Enligt konsumentköplagen, räknat från leveransdagen.",
  },
  {
    icon: RotateCcw,
    value: "14 dagar",
    label: "Återbetalning",
    detail: "Efter att vi tagit emot och kontrollerat returen.",
  },
];

const STEPS = [
  {
    title: "Hör av dig först",
    body: `Mejla ${SUPPORT_EMAIL} med ordernummer och vad det gäller. Skicka aldrig en retur utan att ha fått ett returnummer av oss – vi kan inte spåra paket vi inte vet om.`,
  },
  {
    title: "Packa som den kom",
    body: "Använd originalkartongen och innerskyddet. En dator som skickas i fel emballage tar nästan alltid skada på vägen, och den skadan räknas som värdeminskning.",
  },
  {
    title: "Skicka eller lämna in",
    body: "Du kan lämna datorn hos oss i Spånga efter överenskommelse, eller skicka den med det fraktsätt vi anger i returnumret.",
  },
  {
    title: "Vi kontrollerar och betalar tillbaka",
    body: "Vi testar datorn när den kommit in. Är allt i sin ordning betalar vi tillbaka till samma betalmedel du använde, senast 14 dagar efter att vi tagit emot returen.",
  },
];

export default function ReturnPolicy() {
  const breadcrumbSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Hem", item: `${SITE_URL}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: "Ångerrätt och returer",
          item: `${SITE_URL}/angerratt-och-returer`,
        },
      ],
    }),
    [],
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SeoHead
        title="Ångerrätt och returer – DatorHuset"
        description="14 dagars ångerrätt, 3 års reklamationsrätt och hur du går till väga för att returnera en dator köpt hos DatorHuset."
        url={`${SITE_URL}/angerratt-och-returer`}
      />
      <SeoJsonLd data={breadcrumbSchema} />

      <Navbar />

      <main className="flex-1 pt-16 sm:pt-24">
        <section className="hero-surface border-b border-border">
          <div className="container mx-auto px-4 py-14 md:py-20">
            <p className="eyebrow">Köpvillkor</p>
            <h1 className="section-title mt-3 text-4xl md:text-5xl">
              Ångerrätt och <span className="text-gradient">returer</span>
            </h1>
            <p className="section-lede mt-4">
              Ångrar du köpet har du 14 dagar på dig. Är det fel på datorn har du tre år.
              Här står exakt vad som gäller och hur du gör.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              Senast uppdaterad: {new Date(LAST_UPDATED).toLocaleDateString("sv-SE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </section>

        {/* Nyckeltal ---------------------------------------------------- */}
        <section className="section-tight border-b border-border">
          <div className="container mx-auto px-4">
            <ul className="grid gap-4 sm:grid-cols-3">
              {KEY_FACTS.map((fact) => (
                <li key={fact.label} className="surface-card p-6">
                  <fact.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                  <p className="mt-4 font-display text-2xl font-bold text-foreground">{fact.value}</p>
                  <p className="text-sm font-semibold text-foreground">{fact.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{fact.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="container mx-auto px-4 py-14">
          <div className="grid gap-12 lg:grid-cols-[1fr_320px] lg:gap-16">
            <div className="max-w-2xl space-y-12">
              {/* Ångerrätt ------------------------------------------- */}
              <section>
                <h2 className="font-display text-2xl font-bold text-foreground">Ångerrätt</h2>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/85">
                  <p>
                    Som konsument har du enligt distansavtalslagen rätt att ångra ditt köp inom
                    14 dagar från den dag du tog emot varan. Du behöver inte uppge något skäl.
                    Meddela oss innan fristen gått ut – det räcker att du hör av dig, returen
                    får komma fram efteråt.
                  </p>
                  <p>
                    Du får packa upp och undersöka datorn på samma sätt som du hade fått göra i
                    en fysisk butik. Har du använt den mer än så får vi göra avdrag för
                    värdeminskningen. I praktiken: starta upp, titta, testa – men installera inte
                    ett halvår av spel innan du bestämmer dig.
                  </p>
                  <p>Kunden står för returfrakten vid ångerköp.</p>
                </div>
              </section>

              {/* Undantag -------------------------------------------- */}
              <section>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  När ångerrätten inte gäller
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/85">
                  <p>
                    Datorer som vi bygger efter dina val i{" "}
                    <Link to="/custom-bygg" className="text-primary underline-offset-4 hover:underline">
                      Custom Bygg
                    </Link>{" "}
                    är specialtillverkade efter dina anvisningar. Sådana varor är undantagna från
                    ångerrätten enligt distansavtalslagen, eftersom vi inte kan sälja dem vidare
                    som lagervara.
                  </p>
                  <p>
                    Det påverkar <strong>inte</strong> din reklamationsrätt. Är det fel på en
                    specialbyggd dator gäller samma tre år som på allt annat vi säljer.
                  </p>
                  <p>
                    Ångerrätten gäller inte heller programvarulicenser eller liknande digitalt
                    innehåll där förseglingen brutits eller koden lösts in.
                  </p>
                </div>
              </section>

              {/* Reklamation ----------------------------------------- */}
              <section>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Reklamation – om något är fel
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/85">
                  <p>
                    Du har rätt att reklamera en felaktig vara i tre år från leveransdagen enligt
                    konsumentköplagen. Reklamera inom skälig tid från att du upptäckte felet –
                    hör du av dig inom två månader räknas det alltid som skälig tid.
                  </p>
                  <p>
                    Visar sig ett fel inom det första året utgår lagen från att felet fanns där
                    redan vid leverans, om vi inte kan visa något annat. Vi avhjälper i första
                    hand genom reparation eller utbyte. Går det inte har du rätt till prisavdrag
                    eller att häva köpet.
                  </p>
                  <p>Vid en godkänd reklamation står vi för returfrakten.</p>
                </div>
              </section>

              {/* Garanti --------------------------------------------- */}
              <section>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Garanti kontra reklamationsrätt
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/85">
                  <p>
                    Enskilda komponenter har ofta en tillverkargaranti – tre år på nätaggregat,
                    fem på vissa SSD:er, och så vidare. Den garantin är ett tillägg och kan aldrig
                    inskränka din lagstadgade reklamationsrätt.
                  </p>
                  <p>
                    Du behöver inte hålla reda på vilken komponent som gått sönder eller vems
                    garanti som gäller. Hör av dig till oss så sköter vi kontakten med
                    tillverkaren.
                  </p>
                </div>
              </section>

              {/* Gör så här ------------------------------------------ */}
              <section>
                <h2 className="font-display text-2xl font-bold text-foreground">Så gör du en retur</h2>
                <ol className="mt-5 space-y-5">
                  {STEPS.map((step, index) => (
                    <li key={step.title} className="flex gap-4">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary"
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-display text-base font-semibold text-foreground">
                          {step.title}
                        </h3>
                        <p className="mt-1.5 text-[15px] leading-relaxed text-foreground/85">
                          {step.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Transportskada -------------------------------------- */}
              <section>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Transportskada eller fel vara
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/85">
                  <p>
                    Är kartongen synligt skadad när du hämtar ut paketet – anmäl det direkt till
                    ombudet och hör av dig till oss samma dag. Upptäcker du skadan först när du
                    packat upp, fotografera både kartongen och datorn innan du gör något annat.
                  </p>
                  <p>
                    Har du fått fel dator eller fel komponent skickar vi rätt vara och står för
                    all frakt åt båda hållen.
                  </p>
                </div>
              </section>

              {/* Tvist ----------------------------------------------- */}
              <section>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Om vi inte kommer överens
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/85">
                  <p>
                    Skulle vi hamna i en tvist som vi inte löser oss emellan kan du vända dig
                    till{" "}
                    <a
                      href="https://www.arn.se"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Allmänna reklamationsnämnden (ARN)
                    </a>
                    . Vi följer ARN:s rekommendationer. Du kan också använda EU-kommissionens{" "}
                    <a
                      href="https://ec.europa.eu/consumers/odr"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      ODR-plattform
                    </a>
                    .
                  </p>
                </div>
              </section>
            </div>

            {/* Sidopanel ---------------------------------------------- */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="surface-card p-6">
                <PackageCheck className="h-6 w-6 text-primary" strokeWidth={1.5} />
                <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
                  Starta en retur
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Mejla oss med ditt ordernummer så får du ett returnummer och instruktioner
                  tillbaka.
                </p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=Retur%20-%20ordernummer`}
                  className="mt-5 block rounded-sm bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {SUPPORT_EMAIL}
                </a>
                <Link
                  to="/orders"
                  className="mt-3 block rounded-sm border border-border px-4 py-2.5 text-center text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Mina ordrar
                </Link>
              </div>

              <div className="surface-card mt-4 p-6">
                <Wrench className="h-6 w-6 text-secondary" strokeWidth={1.5} />
                <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
                  Krånglar datorn?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Ofta går det att lösa utan retur. Vi felsöker gärna med dig först.
                </p>
                <Link
                  to="/service-reparation"
                  className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Service och reparation →
                </Link>
              </div>

              <nav className="surface-card mt-4 p-6" aria-label="Relaterade villkor">
                <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Övriga villkor
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link to="/terms-of-service" className="text-foreground hover:text-primary">
                      Allmänna villkor
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy-policy" className="text-foreground hover:text-primary">
                      Integritetspolicy
                    </Link>
                  </li>
                  <li>
                    <Link to="/kundservice" className="text-foreground hover:text-primary">
                      Kontaktuppgifter
                    </Link>
                  </li>
                </ul>
              </nav>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
