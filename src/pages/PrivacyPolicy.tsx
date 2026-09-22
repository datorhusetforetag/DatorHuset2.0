import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { PAGE_BANNERS } from "@/lib/pageBanners";
import { LegalDocument } from "@/components/LegalDocument";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Integritetspolicyn.
 *
 * Sidan visade tidigare köpvillkoren - samma text som
 * /terms-of-service, fast under rubriken integritetspolicy. Den enda
 * stycket om personuppgifter slutade med platshållaren "[länk eller
 * hänvisning om sådan finns]". Det fanns alltså ingen policy alls,
 * vilket dataskyddsförordningen artikel 13 kräver att det gör.
 *
 * Texten nedan är skriven mot GDPR och svensk rätt, men två saker måste
 * fyllas i av er innan den stämmer: organisationsnummer och postadress.
 * De står som XXXXXX-XXXX respektive [gatuadress] och ska bytas ut.
 *
 * Underbiträdena är de tjänster koden faktiskt använder. Ändras stacken
 * måste listan i avsnitt 5 ändras med den.
 */

const privacyPolicyText = `Integritetspolicy för DatorHuset
Senast uppdaterad: 2026-09-22

1. Vem som ansvarar för dina uppgifter

DatorHuset UF, organisationsnummer XXXXXX-XXXX, är personuppgiftsansvarig för de uppgifter som behandlas när du använder vår webbplats eller handlar hos oss. Det betyder att vi bestämmer varför och hur uppgifterna används, och att det är vi du vänder dig till med frågor.

        Postadress: [gatuadress], Spånga, Stockholm
        E-post: support@datorhuset.se

Har du en fråga om dina uppgifter räcker det att mejla oss. Du behöver inte uppge något skäl.

2. Vad vi samlar in och varför

Vi samlar bara in det vi behöver för att sköta butiken. Här är allt, och varför:

        Konto: e-postadress, namn och lösenord (lagrat krypterat, aldrig i klartext). Behövs för att du ska kunna logga in och se dina ordrar. Loggar du in med Google får vi din e-postadress och ditt namn från Google, inte ditt Google-lösenord.

        Beställning: namn, e-postadress, telefonnummer, leveransadress, orderrader och belopp. Behövs för att bygga och skicka datorn, och för att kunna svara när du hör av dig om köpet.

        Betalning: vi tar aldrig emot och lagrar aldrig dina kortuppgifter. Betalningen sker hos Stripe, som är ett eget personuppgiftsansvarigt bolag för den delen. Vi får veta att betalningen gick igenom, beloppet och ett referensnummer - inget kortnummer.

        Kontakt: det du skriver i kontaktformuläret, serviceformuläret eller offertförfrågan, tillsammans med den adress du uppger. Behövs för att kunna svara.

        Teknisk information: anonym besöksstatistik om du samtyckt till det i cookierutan. Utan samtycke mäter vi ingenting utöver det som krävs för att sidan ska fungera.

3. Vår rättsliga grund

Dataskyddsförordningen kräver att vi har en giltig grund för varje behandling. Våra är:

        Avtal (artikel 6.1 b): konto, beställning, leverans och support. Utan de uppgifterna kan vi inte fullgöra köpet.

        Rättslig förpliktelse (artikel 6.1 c): bokföring. Bokföringslagen kräver att underlag för affärshändelser sparas, och den skyldigheten går före din rätt att bli raderad.

        Samtycke (artikel 6.1 a): valfri besöksstatistik. Du lämnar det i cookierutan och kan ta tillbaka det när som helst, utan att något annat påverkas.

        Berättigat intresse (artikel 6.1 f): att skydda sajten mot missbruk, till exempel genom att begränsa hur många gånger ett formulär får skickas. Vi har vägt det mot din integritet och bedömt att ett fungerande skydd mot spam väger tyngre än den mycket begränsade behandling det innebär.

Vi använder inte dina uppgifter för marknadsföring utan att först fråga.

4. Hur länge vi sparar

Vi sparar inte något längre än vi behöver. Konkret:

        Bokföringsunderlag - ordrar, fakturor och betalningsuppgifter: sju år efter utgången av det kalenderår då räkenskapsåret avslutades. Det är vad bokföringslagen (1999:1078) kräver, och vi kan inte radera det tidigare ens om du ber oss.

        Konto: så länge du har det kvar. Raderar du kontot, eller har du varit inaktiv i tre år, tar vi bort det. Ordrarna blir då anonyma i bokföringen - beloppen står kvar, kopplingen till dig försvinner.

        Kontakt- och serviceärenden: två år efter att ärendet avslutats. Så länge kan ett garantiärende komma tillbaka och vi behöver kunna se vad som sagts.

        Reklamationer och garantiärenden: tre år efter köpet, eftersom reklamationsrätten enligt konsumentköplagen sträcker sig så långt.

        Besöksstatistik: tolv månader, därefter raderas den.

        Loggar över inloggningar och administrativa åtgärder: tolv månader. De behövs för att kunna utreda om något gått fel eller om någon tagit sig in där de inte ska.

När tiden gått ut raderas uppgifterna eller anonymiseras så att de inte längre går att koppla till dig.

5. Vilka som får se uppgifterna

Vi säljer aldrig dina uppgifter, och vi lämnar dem inte vidare till någon som inte behöver dem för att vi ska kunna göra vårt jobb. De företag som behandlar uppgifter åt oss är:

        Stripe - betalningar. Eget personuppgiftsansvar för betalningen.
        Supabase - databas och inloggning.
        Render - drift av webbplatsen.
        Maileroo - utskick av order- och supportmejl.
        Cloudflare - domän och vidarebefordran av e-post.
        Google - inloggning med Google-konto, om du väljer det.
        PostNord - leverans, när du valt frakt.

Med var och en av dem finns ett personuppgiftsbiträdesavtal som binder dem att bara behandla uppgifterna enligt våra instruktioner.

Vi lämnar också ut uppgifter om en myndighet kräver det med stöd av lag.

6. Överföring utanför EU och EES

Flera av tjänsterna ovan är amerikanska. När uppgifter förs över till ett land utanför EU och EES sker det med stöd av EU-kommissionens beslut om adekvat skyddsnivå (EU-US Data Privacy Framework) eller EU:s standardavtalsklausuler. Vill du veta exakt vilken grund som gäller för en viss tjänst, mejla oss så berättar vi.

7. Dina rättigheter

Du har rätt att:

        Få veta vilka uppgifter vi har om dig, och få en kopia av dem.
        Få felaktiga uppgifter rättade.
        Få uppgifter raderade, när vi inte har en rättslig skyldighet att spara dem.
        Begära att vi begränsar behandlingen medan en fråga utreds.
        Få ut dina uppgifter i ett maskinläsbart format, eller få dem överförda till någon annan.
        Invända mot behandling som vi gör med stöd av berättigat intresse.
        Ta tillbaka ett samtycke du lämnat, utan att det påverkar det som redan behandlats.

Mejla support@datorhuset.se så svarar vi inom en månad. Är frågan komplicerad kan vi behöva två månader till, och då hör vi av oss och säger det. Det kostar ingenting.

Observera att rätten till radering inte gäller bokföringsunderlag. Vi kan ta bort ditt konto, men beloppen i bokföringen måste stå kvar i sju år.

8. Om du inte är nöjd

Tycker du att vi behandlar dina uppgifter fel vill vi först och främst höra det själva - mejla oss så reder vi ut det.

Du har också alltid rätt att klaga till tillsynsmyndigheten. I Sverige är det Integritetsskyddsmyndigheten (IMY), Box 8114, 104 20 Stockholm, imy@imy.se, imy.se.

9. Säkerhet

Trafiken till och från sajten är krypterad. Lösenord lagras hashade, alltså aldrig i läsbar form, och vi ser dem inte ens själva - därför kan vi inte heller återställa ett lösenord åt dig, bara skicka en återställningslänk till din adress. Tillgången till administrationen är begränsad till namngivna konton och varje åtgärd loggas.

10. Cookies

Nödvändiga cookies används för att hålla dig inloggad och för att kundvagnen ska minnas vad du lagt i den. De kräver inget samtycke, eftersom sidan inte fungerar utan dem.

Valfria cookies för besöksstatistik sätts bara om du klickar ja i cookierutan. Väljer du "Endast nödvändiga" mäter vi ingenting. Du kan ändra dig när som helst genom att rensa webbplatsens data i din webbläsare.

11. Automatiserat beslutsfattande

Vi fattar inga beslut om dig automatiskt som har rättsliga följder eller påverkar dig i motsvarande grad. Ingen profilering sker.

12. Ändringar i policyn

Ändrar vi något väsentligt uppdaterar vi datumet högst upp och, om ändringen påverkar dig i någon nämnvärd grad, hör vi av oss per mejl. Den senaste versionen finns alltid på den här sidan.`;

export default function PrivacyPolicy() {
  const { settings } = useSiteSettings();
  const pageSettings = settings.pages.privacyPolicy;

  return (
    <PageShell>
      <PageHero
        sandboxId="privacy-hero"
        image={PAGE_BANNERS.legal.image}
        accent={PAGE_BANNERS.legal.accent}
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Integritetspolicy" }]}
        eyebrow={pageSettings?.heroEyebrow || "Integritet"}
        title={pageSettings?.heroTitle || "Integritetspolicy"}
        lede={
          pageSettings?.heroDescription ||
          "Vad vi sparar, varför, hur länge och vad du kan begära av oss."
        }
      />

      <LegalDocument text={privacyPolicyText} />
    </PageShell>
  );
}
