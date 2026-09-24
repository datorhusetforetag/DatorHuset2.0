import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { PAGE_BANNERS } from "@/lib/pageBanners";
import { LegalDocument } from "@/components/LegalDocument";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const termsOfServiceText = `Allmänna villkor för DatorHuset

Senast uppdaterad: 2026-02-08

1. Allmänt
Dessa villkor gäller för köp av produkter från DatorHuset, som drivs av Sahran Rahman, till dig som kund. Genom att beställa en vara från oss godkänner du dessa villkor. För att handla hos oss måste du vara minst 18 år eller ha målsmans godkännande.

2. Beställning och betalning
Beställningar genomförs via vår webbplats. När du slutfört en beställning skickas en orderbekräftelse automatiskt till din e-postadress. Vi använder Stripe som betalningsleverantör och erbjuder bland annat kort, PayPal, Google Pay och Klarna. Alla priser visas i svenska kronor inklusive moms om inget annat anges.

3. Leverans
Vi erbjuder kostnadsfri upphämtning enligt överenskommelse eller frakt med PostNord till ombud inom Sverige. Leveranstid, kostnad och villkor framgår i kassan eller i orderbekräftelsen. Vid transportskador eller förlorad försändelse ska du kontakta oss så snart som möjligt.

4. Ångerrätt
Som konsument har du 14 dagars ångerrätt enligt distansavtalslagen. Meddela oss inom ångerfristen och returnera varan i väsentligen oförändrat skick. Kunden står normalt för returfrakten. Specialbeställda eller personligt anpassade varor kan undantas från ångerrätten enligt gällande lag.

5. Reklamation och garanti
Vi följer konsumentköplagen vid reklamationer. Om en vara är felaktig har du rätt att reklamera den inom skälig tid. Kontakta oss alltid innan retur så hjälper vi dig med nästa steg. Eventuella tillverkargarantier gäller utöver lagstadgade rättigheter.

6. Ansvarsbegränsning
Vi ansvarar inte för indirekta skador, utebliven vinst eller dataförlust om inte tvingande lag säger annat. Vid uppenbara pris- eller skrivfel förbehåller vi oss rätten att rätta informationen eller annullera beställningen innan leverans.

7. Tillämplig lag och tvistlösning
Svensk lag tillämpas på dessa villkor. Om en tvist inte kan lösas direkt med oss kan du som konsument vända dig till ARN eller använda EU:s ODR-plattform. Tvister kan i sista hand prövas av svensk allmän domstol.

8. Kontakt
Har du frågor om villkoren eller ditt köp når du oss via support@datorhuset.se.`;

export default function TermsOfService() {
  const { settings: siteSettings } = useSiteSettings();
  const pageSettings = siteSettings.pages.termsOfService;
  const bodyText = pageSettings.bodyText?.trim() || termsOfServiceText;

  return (
    <PageShell>
      <PageHero
        sandboxId="terms-hero"
        image={PAGE_BANNERS.legal.image}
        accent={PAGE_BANNERS.legal.accent}
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Köpvillkor" }]}
        eyebrow={pageSettings.heroEyebrow}
        title={pageSettings.heroTitle}
        lede={pageSettings.heroDescription}
      />

      <section data-sandbox-id="terms-body" className="relative">
        <div className="container mx-auto max-w-6xl px-4 pb-24 pt-14">
          <LegalDocument
            text={bodyText}
            updatedAt={pageSettings.updatedAt}
            accent={PAGE_BANNERS.legal.accent}
          />
        </div>
      </section>
    </PageShell>
  );
}
