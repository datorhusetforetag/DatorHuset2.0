import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildSiteThemeVars } from "@/lib/siteTheme";

const termsOfServiceText = `Allmänna villkor för DatorHuset

Senast uppdaterad: 2026-02-08

1. Allmänt
Dessa villkor gäller för köp av produkter från DatorHuset UF till dig som kund. Genom att beställa en vara från oss godkänner du dessa villkor. För att handla hos oss måste du vara minst 18 år eller ha målsmans godkännande.

2. Beställning och betalning
Beställningar genomförs via vår webbplats. När du slutfört en beställning skickas en orderbekräftelse automatiskt till din e-postadress. Vi använder Stripe som betalningsleverantör och erbjuder bland annat kort, PayPal, Google Pay och Klarna. Alla priser visas i svenska kronor inklusive moms om inget annat anges.

3. Leverans
Vi erbjuder kostnadsfri upphämtning enligt överenskommelse eller frakt med DB Schenker till ombud inom Sverige. Leveranstid, kostnad och villkor framgår i kassan eller i orderbekräftelsen. Vid transportskador eller förlorad försändelse ska du kontakta oss så snart som möjligt.

4. Ångerrätt
Som konsument har du 14 dagars ångerrätt enligt distansavtalslagen. Meddela oss inom ångerfristen och returnera varan i väsentligen oförändrat skick. Kunden står normalt för returfrakten. Specialbeställda eller personligt anpassade varor kan undantas från ångerrätten enligt gällande lag.

5. Reklamation och garanti
Vi följer konsumentköplagen vid reklamationer. Om en vara är felaktig har du rätt att reklamera den inom skälig tid. Kontakta oss alltid innan retur så hjälper vi dig med nästa steg. Eventuella tillverkargarantier gäller utöver lagstadgade rättigheter.

6. Ansvarsbegränsning
Vi ansvarar inte för indirekta skador, utebliven vinst eller dataförlust om inte tvingande lag säger annat. Vid uppenbara pris- eller skrivfel förbehåller vi oss rätten att rätta informationen eller annullera beställningen innan leverans.

7. Tillämplig lag och tvistlösning
Svensk lag tillämpas på dessa villkor. Om en tvist inte kan lösas direkt med oss kan du som konsument vända dig till ARN eller använda EU:s ODR-plattform. Tvister kan i sista hand prövas av svensk allmän domstol.

8. Kontakt
Har du frågor om villkoren eller ditt köp når du oss via support@datorhuset.site.`;

export default function TermsOfService() {
  const { settings: siteSettings } = useSiteSettings();
  const pageSettings = siteSettings.pages.termsOfService;
  const themeVars = buildSiteThemeVars(siteSettings.site.theme);
  const bodyText = pageSettings.bodyText?.trim() || termsOfServiceText;

  return (
    <div
      data-sandbox-id="global-theme"
      style={themeVars}
      className="min-h-screen flex flex-col bg-[var(--site-page-bg)] text-[var(--site-text-primary)] dark:bg-[var(--site-page-bg-dark)] dark:text-[var(--site-text-primary-dark)]"
    >
      <Navbar />
      <main className="flex-1">
        <section data-sandbox-id="terms-hero" className="overflow-hidden bg-[var(--site-brand-bg)] text-[var(--site-brand-text)]">
          <div className="container mx-auto px-4 pb-12 pt-16 sm:pt-24">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] opacity-70">{pageSettings.heroEyebrow}</p>
                <h1 className="mt-4 text-4xl font-bold lg:text-5xl">{pageSettings.heroTitle}</h1>
                <p className="mt-4 max-w-2xl opacity-85">{pageSettings.heroDescription}</p>
              </div>
              <div className="flex items-center justify-center">
                <div
                  className="flex w-full max-w-md items-center justify-center"
                  style={{ minHeight: "20rem", backgroundColor: "var(--site-hero-frame-bg-current)", borderRadius: "var(--site-radius-xl)" }}
                >
                  <img
                    src={pageSettings.heroImage}
                    alt={pageSettings.heroImageAlt}
                    className="h-56 w-full object-contain object-center sm:h-72 lg:h-80"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section data-sandbox-id="terms-body" className="container mx-auto max-w-5xl space-y-5 px-4 py-12">
          <p className="text-sm text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)]">
            Senast uppdaterad: {pageSettings.updatedAt}
          </p>
          <div
            className="rounded-[var(--site-radius-xl)] border border-[var(--site-card-border)] bg-[var(--site-card-bg)] p-6 dark:border-[var(--site-card-border-dark)] dark:bg-[var(--site-card-bg-dark)]"
          >
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)] sm:text-base">
              {bodyText}
            </pre>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
