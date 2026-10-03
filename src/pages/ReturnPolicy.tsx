import { INFO_PAGE_BACKGROUND, PageShell } from "@/components/PageShell";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PackageCheck, Wrench } from "lucide-react";

import { InfoPageHeader } from "@/components/InfoPageHeader";
import { SeoHead } from "@/components/SeoHead";
import { SeoJsonLd } from "@/components/SeoJsonLd";

const SITE_URL = "https://datorhuset.se";
const SUPPORT_EMAIL = "support@datorhuset.se";

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
    <PageShell
      background={INFO_PAGE_BACKGROUND}
      head={
        <>
          <SeoHead
          title="Ångerrätt och returer – DatorHuset"
          description="14 dagars ångerrätt, 3 års reklamationsrätt och hur du går till väga för att returnera en dator köpt hos DatorHuset."
          url={`${SITE_URL}/angerratt-och-returer`}
        />
        <SeoJsonLd data={breadcrumbSchema} />
        </>
      }
    >
        <InfoPageHeader
          sandboxId="returns-hero"
          breadcrumb={[{ label: "Hem", href: "/" }, { label: "Ångerrätt och returer" }]}
          eyebrow="Köpvillkor"
          title="Ångerrätt och returer"
        />

        <div className="container mx-auto max-w-6xl px-4 pb-24 pt-10 sm:pt-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:gap-10">
            <div className="info-panel divide-y divide-white/10 px-6 sm:px-10 [&>section]:max-w-3xl [&>section]:py-8">
              {/* Ångerrätt ------------------------------------------- */}
              <section>
                <h2 className="text-xl font-semibold text-white">Ångerrätt</h2>
                <div className="mt-4 space-y-4 text-[15px] leading-7 text-white/75">
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
                <h2 className="text-xl font-semibold text-white">
                  När ångerrätten inte gäller
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-7 text-white/75">
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
                <h2 className="text-xl font-semibold text-white">
                  Reklamation – om något är fel
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-7 text-white/75">
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
                <h2 className="text-xl font-semibold text-white">
                  Garanti kontra reklamationsrätt
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-7 text-white/75">
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
                <h2 className="text-xl font-semibold text-white">Så gör du en retur</h2>
                <ol className="mt-5 space-y-5">
                  {STEPS.map((step, index) => (
                    <li key={step.title} className="flex gap-4">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white"
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          {step.title}
                        </h3>
                        <p className="mt-1.5 text-[15px] leading-7 text-white/75">
                          {step.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Transportskada -------------------------------------- */}
              <section>
                <h2 className="text-xl font-semibold text-white">
                  Transportskada eller fel vara
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-7 text-white/75">
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

              {/* Ångerblankett ---------------------------------------
                  Distansavtalslagen kräver att vi tillhandahåller
                  standardformuläret för ångerrätt. Det behöver inte
                  användas - ett vanligt mejl duger lika bra och står
                  utskrivet ovan - men det ska finnas, och det ska gå
                  att komma åt utan att fråga efter det. */}
              <section>
                <h2 className="text-xl font-semibold text-white">
                  Ångerblankett
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-7 text-white/75">
                  <p>
                    Du behöver inte använda den här blanketten. Ett mejl där du säger
                    att du ångrar köpet räcker lika bra. Men lagen säger att den ska
                    finnas, så här är den - kopiera, fyll i och mejla till{" "}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}?subject=Ångerblankett`}
                      className="font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                    .
                  </p>

                  <div className="rounded-lg border border-white/10 bg-[#110c18] p-6">
                    <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-white/80">
{`Till DatorHuset, Sahran Rahman
E-post: support@datorhuset.se

Jag meddelar härmed att jag frånträder mitt köpeavtal
avseende följande vara:

Vara: ..................................................
Ordernummer: ...........................................
Beställdes den: ........................................
Mottogs den: ...........................................

Konsumentens namn: .....................................
Konsumentens adress: ...................................

Datum: .................................................
Underskrift: ...........................................
(behövs bara om blanketten lämnas på papper)`}
                    </pre>
                  </div>

                  <p className="text-sm text-white/55">
                    Ångerfristen räknas från den dag du tog emot datorn. Skickar du
                    meddelandet inom fjorton dagar har du använt din ångerrätt i tid,
                    även om returen kommer fram senare.
                  </p>
                </div>
              </section>

              {/* Tvist ----------------------------------------------- */}
              <section>
                <h2 className="text-xl font-semibold text-white">
                  Om vi inte kommer överens
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-7 text-white/75">
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
            <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
              <div className="info-panel p-6">
                <PackageCheck className="h-5 w-5 text-white/60" strokeWidth={1.75} />
                <h2 className="mt-4 text-base font-semibold text-white">
                  Starta en retur
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  Mejla oss med ditt ordernummer så får du ett returnummer och instruktioner
                  tillbaka.
                </p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=Retur%20-%20ordernummer`}
                  className="mt-5 block rounded-md bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {SUPPORT_EMAIL}
                </a>
                <Link
                  to="/orders"
                  className="mt-3 block rounded-md border border-white/15 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/[0.05]"
                >
                  Mina ordrar
                </Link>
              </div>

              <div className="info-panel p-6">
                <Wrench className="h-5 w-5 text-white/60" strokeWidth={1.75} />
                <h2 className="mt-4 text-base font-semibold text-white">
                  Krånglar datorn?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  Ofta går det att lösa utan retur. Vi felsöker gärna med dig först.
                </p>
                <Link
                  to="/service-reparation"
                  className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Service och reparation →
                </Link>
              </div>

              <nav className="info-panel p-6" aria-label="Relaterade villkor">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                  Övriga villkor
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link to="/terms-of-service" className="text-white/80 transition-colors hover:text-white">
                      Allmänna villkor
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy-policy" className="text-white/80 transition-colors hover:text-white">
                      Integritetspolicy
                    </Link>
                  </li>
                  <li>
                    <Link to="/kundservice" className="text-white/80 transition-colors hover:text-white">
                      Kontaktuppgifter
                    </Link>
                  </li>
                </ul>
              </nav>
            </aside>
          </div>
        </div>
    </PageShell>
  );
}
