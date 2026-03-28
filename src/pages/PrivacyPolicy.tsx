import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildSiteThemeVars } from "@/lib/siteTheme";

const privacyPolicyText = `Allmänna Villkor för DatorHuset (Köpvillkor)
1. Parter och Allmänt

Dessa allmänna villkor ("Villkoren") gäller för alla köp som görs av konsumenten ("Kunden") via DatorHuset's webbutik. Säljaren är DatorHuset (nedan kallad "vi" eller "DatorHuset"). Genom att genomföra ett köp hos oss godkänner Kunden Villkoren. Kunden måste vara minst 18 år gammal eller ha målsmans godkännande för att få handla hos DatorHuset.

Kontaktuppgifter: För frågor gällande beställningar når du oss via e-post [ange e-postadress] eller telefon [ange telefonnummer]. DatorHuset är baserat i Rinkeby, Stockholm.

2. Priser och Betalning

Alla priser anges i svenska kronor (SEK) och inkluderar moms (25%) om inget annat anges. Eventuella avgifter såsom fraktkostnad (se nedan) läggs till i kassan innan du bekräftar köpet. Vi reserverar oss för uppenbara prisfel och förbehåller oss rätten att justera priser utan föregående meddelande; priset som anges vid köptillfället gäller för ditt köp.

Betalningsalternativ: Samtliga köp betalas genom DatorHusets säkra betalningslösning (Stripe). Via Stripe erbjuder vi flera betalningsmetoder, bland annat:

Kortbetalning: Visa, MasterCard, American Express och andra vanliga bankkort.

PayPal: Betala smidigt via ditt PayPal-konto.

Google Pay & Apple Pay: Snabba betalningar via mobil/plånbokstjänster.

Klarna: Faktura, delbetalning eller direktbetalning genom Klarna (vid användning av Klarna gäller även Klarnas villkor för betalning).

Betalningen debiteras normalt i samband med att beställningen genomförs. Ingen kontant betalning accepteras - även vid avhämtning ska ordern vara betald i förväg via något av ovanstående alternativ. Observera: Varor förblir DatorHusets egendom tills full betalning har mottagits.

3. Beställning och Orderbekräftelse

När du slutfört din betalning får du en orderbekräftelse via e-post. Kontrollera att alla uppgifter i orderbekräftelsen är korrekta. Om något behöver ändras, kontakta oss omgående. Vi förbehåller oss rätten att neka en beställning (till exempel vid misstanke om bedrägeri eller om varan av misstag listats med felaktigt pris). Skulle detta inträffa kontaktar vi dig så snart som möjligt.

4. Leveransalternativ

Kunden kan välja mellan avhämtning (upphämtning) på plats eller leverans med PostNord. Nedan följer villkor för båda leveransalternativen:

Avhämtning (Kostnadsfri): Du kan välja att hämta varan kostnadsfritt vid Rinkeby Centrum i Stockholm vid en förbestämd tid. Efter att din order är färdigbehandlad kontaktar vi dig för att avtala en tid och exakt plats för upphämtning. Vid avhämtning måste giltig legitimation och orderbekräftelse uppvisas. Om ombud hämtar ut varan åt dig krävs skriftlig fullmakt samt legitimation för både dig och ombudet. Observera att ordern måste vara betald i förväg; ingen betalning hanteras vid avhämtning.

PostNord Frakt (Rekommenderat Brev/Paket): Vi erbjuder säker leverans via PostNord Extra Rekommenderat för en fast fraktkostnad om 700 kr. Detta fraktalternativ är spårbart och försäkrat upp till 25 000 kr. Försändelsen levereras normalt till ditt närmaste PostNord-ombud och måste kvitteras med giltig legitimation av mottagaren. Leveranstiden är vanligtvis 1-2 arbetsdagar från det att vi skickar paketet (inom Sverige). Vi strävar efter att expediera din order så snart som möjligt; normal hanteringstid innan utskick är 1-3 arbetsdagar. Skulle försändelsen bli försenad meddelar vi dig snarast möjligt.

Leveransbegränsningar: I nuläget levererar vi enbart inom Sverige. Om du önskar leverans utanför Sverige, vänligen kontakta oss innan köp för att undersöka möjligheterna.

Outlöst försändelse: Paket som levereras till postombud ligger normalt kvar i 7-14 dagar (beroende på PostNords regler) för avhämtning. Om du inte hämtar ut ditt paket i tid och det går i retur till oss, förbehåller vi oss rätten att debitera dig för faktiska kostnader för frakt och retur. Outlöst paket räknas inte som utnyttjande av ångerrätt (se Ångerrätt nedan); du måste aktivt meddela oss om du ångrar köpet. Vi kontaktar dig om vi mottar en retur på grund av outlöst försändelse för att göra upp om eventuellt återköp minus kostnader eller om ny utkörning (mot ny fraktavgift).

Leveransansvar: Vi står för transportrisken tills paketet har överlämnats till dig. Det innebär att om varan skadas eller kommer bort under transporten till dig, skickar vi en ny vara (om möjligt) eller ersätter dig för köpet. Kontrollera alltid paketets yttre innan du kvitterar hos ombudet. Transportskador: Om emballaget är synbart skadat vid utlämning bör du anmäla detta direkt hos postombudet eller transportören och kontakta oss snarast möjligt. Dokumentera skadan gärna med fotografier. Dold transportskada (skada som upptäcks först efter att du öppnat paketet) bör anmälas till oss och PostNord så snart som möjligt efter mottagandet.

5. Ångerrätt (Öppet köp)

Som konsument har du enligt Distansavtalslagen rätt att ångra ditt köp inom 14 dagar från det att du tagit emot varan. För att utnyttja ångerrätten ska du meddela oss inom ångerfristen (14 dagar räknat från dagen efter att du mottagit varan). Kontakta oss skriftligen via e-post för att utöva ångerrätten och ange ditt ordernummer, vilka varor du vill returnera samt ditt namn och kontaktuppgifter. Vi bekräftar därefter din begäran och ger dig instruktioner för retur.

Villkor för ångrat köp:

Skick på varan: Varan ska returneras i väsentligen oförändrat skick. Det innebär att den ska vara komplett, oanvänd (utöver normal undersökning) och gärna i originalförpackning med allt medföljande material. Du får försiktigt undersöka och prova varan för att fastställa dess egenskaper eller funktion, men inte använda den mer än nödvändigt. Om varan hanterats i större omfattning än vad som behövs för att pröva den kan en värdeminskning dras av från återbetalningen.

Returfrakt: Kunden står för kostnaden för returfrakt vid ångrat köp. Du ansvarar också för varan under returfrakten, så se till att förpacka den väl. Vi rekommenderar spårbar och försäkrad försändelse vid retur, särskilt för högvärdiga varor, för att minimera risken för transportskador eller borttappade paket.

Återbetalning: När vi har mottagit och kontrollerat den returnerade varan, kommer vi att återbetala köpesumman inom 14 dagar. Återbetalningen sker via samma betalningssätt som du använde vid köpet, om inget annat överenskommes. Notera att eventuell fraktkostnad (700 kr) för den ursprungliga leveransen normalt inte återbetalas vid ångrat köp, utom i de fall varan var defekt eller felaktig (se Reklamation nedan). Eventuell värdeminskningsavgift (se ovan) dras av från beloppet som återbetalas om varan inte är i nyskick.

Undantag: Ångerrätten gäller inte för varor som har specialtillverkats eller anpassats specifikt efter dina anvisningar eller personliga önskemål. Om du till exempel beställt en unikt konfigurerad dator som byggs enligt dina specifika önskemål kan ångerrätten vara begränsad eller inte gälla alls. (Standardprodukter och förkonfigurerade datorer omfattas dock av ångerrätten.) Ångerrätten gäller inte heller för förseglade datorprogram eller liknande programvara om förseglingen brutits.

För att undvika missförstånd: att helt enkelt låta bli att hämta ut ett paket räknas inte som att du utövar ångerrätten. Du måste meddela oss om du vill ångra köpet och därefter returnera varan enligt instruktion. Om du har några frågor om ångerrätten eller är osäker på hur du ska gå tillväga, kontakta vår kundservice så hjälper vi dig.

6. Reklamation och Garanti

Reklamation: Om varan skulle visa sig vara felaktig, defekt eller på något sätt inte motsvara beskrivningen, har du som kund rätt att reklamera produkten enligt Konsumentköplagen. Reklamationsrätten gäller i upp till 3 år från inköpsdatum, men för att den ska vara giltig behöver felet vara ursprungligt (dvs. det fanns på varan från början). Upptäcker du ett fel på varan bör du meddela oss inom skälig tid efter att felet upptäckts. Meddelanden inom två månader från att felet upptäckts anses alltid vara inom skälig tid.

För att reklamera en vara, kontakta oss via e-post och beskriv problemet. Bifoga gärna bilder som visar felet eller skadan, om möjligt. Efter att du kontaktat oss kommer vi att ge instruktioner om eventuellt returförfarande eller annan åtgärd. Vid en godkänd reklamation står vi för returfraktkostnaden och du har rätt att få varan reparerad, utbytt eller - om det inte är möjligt - pengarna tillbaka. Vi följer Allmänna reklamationsnämndens (ARN) rekommendationer vid en eventuell tvist gällande reklamationer.

Garanti: Om en särskild garanti erbjuds för produkten framgår det av produktbeskrivningen eller medföljande handlingar. Om ingen uttrycklig garanti anges, gäller enbart reklamationsrätten enligt lag. Eventuella tillverkargarantier på enskilda komponenter (t.ex. grafikkort, processor) kan gälla utöver vår reklamationsrätt; vi hjälper gärna till att förmedla garantiservice hos tillverkaren i den mån det är möjligt. Notera att garanti och reklamationsrätt är skilda saker - garanti kan ge extra rättigheter under en viss tid, men påverkar inte dina lagstadgade rättigheter att reklamera varor som är felaktiga.

Transportskador vid leverans: Skulle produkten vara skadad vid mottagandet (transportskada) ska detta rapporteras omedelbart enligt avsnitt 4 ovan. Sådana skador hanteras som reklamation gentemot transportören, men kontakta också oss så att vi kan hjälpa till och påbörja ett ersättningsärende. Vid transportskador ersätter vi dig med en ny vara eller full återbetalning, och hanterar ersättningen med PostNord inom ramen för försäkringen.

7. Ansvar och Begränsningar

DatorHuset ansvarar för att leverera varan i utlovat skick och enligt dessa villkor. Vi ansvarar dock inte för indirekta skador eller följdförluster som kan drabba kunden. Det innebär till exempel att vi inte ersätter förlorad inkomst, förlorade data, driftstopp eller annan följdförlust som kan uppstå i samband med försenad eller utebliven leverans, fel på produkten eller liknande omständigheter.

Vid tekniska produkter som datorer är det Kundens ansvar att säkerhetskopiera viktig data före användning. DatorHuset kan inte hållas ansvarigt för dataförlust eller skador på annan utrustning i samband med installation eller användning av den sålda varan, såvida inte tvingande lag föreskriver annat.

Force Majeure: DatorHuset förbehåller sig rätten att frias från påföljd för underlåtenhet att fullgöra vissa förpliktelser enligt detta avtal, om underlåtenheten har sin grund i befriande omständigheter (så kallade force majeure-händelser). Exempel på sådana omständigheter kan vara extrema väderförhållanden, brand, översvämning, krig, pandemier, strejk, lockout, myndighetsbeslut eller andra omständigheter utanför vår kontroll som väsentligen påverkar förpliktelserna. Skulle en sådan situation uppstå kommer vi att meddela Kunden så snart som möjligt och göra vårt bästa för att lösa situationen.

8. Personuppgifter och Sekretess

När du handlar hos DatorHuset behandlar vi dina personuppgifter i enlighet med gällande dataskyddslagar (GDPR). De uppgifter du lämnar (såsom namn, adress, kontaktinformation och betalningsuppgifter) används endast för att administrera din order, leverera varan och ge dig service. Vi vidtar lämpliga säkerhetsåtgärder för att skydda dina personuppgifter. Vi delar endast nödvändiga uppgifter med våra betalnings- och leveranspartners (t.ex. Stripe/Paypal/Klarna för betalning och PostNord för frakt) för att kunna genomföra köpet. Mer information om vår hantering av personuppgifter finns i vår Integritetspolicy [länk eller hänvisning om sådan finns].

9. Tillämplig lag och Tvistlösning

Alla köp som görs under dessa Villkor lyder under svensk lag. Vi strävar efter att i första hand lösa eventuella tvister direkt med Kunden på ett smidigt sätt. Om en tvist mot förmodan inte kan lösas i samförstånd, rekommenderar vi konsumenten att vända sig till Allmänna reklamationsnämnden (ARN) för prövning. DatorHuset följer ARNs beslut.

Kunden har även möjlighet att använda EU-kommissionens onlineplattform för tvistlösning (ODR) för att få hjälp att lösa en tvist online. Du hittar plattformen på ec.europa.eu/consumers/odr.

Om en tvist trots allt behöver avgöras rättsligt, ska den avgöras av allmän domstol i Sverige, med Stockholms tingsrätt som första instans (såvida tvingande lag inte föreskriver annat).

10. Övrigt

Vi förbehåller oss rätten att ändra dessa allmänna villkor vid behov. Eventuella ändringar publiceras på DatorHusets webbplats. De villkor som var gällande vid tidpunkten för ditt köp kommer dock att fortsätta gälla för just det köpet. Spara därför gärna en kopia av villkoren tillsammans med din orderbekräftelse.

Om någon bestämmelse i dessa villkor skulle befinnas ogiltig eller inte verkställbar av domstol eller myndighet, ska detta inte påverka giltigheten av övriga bestämmelser - villkoren ska tolkas som om den ogiltiga bestämmelsen inte fanns, med syftet att skydda parternas rättigheter i möjligaste mån.

Tack för att du handlar hos DatorHuset! Vi uppskattar ditt förtroende. Har du några frågor om dessa villkor eller kring ditt köp är du alltid välkommen att kontakta oss. Vi hjälper gärna till och vill att du ska känna dig trygg med ditt köp. Vår målsättning är att du som kund ska vara nöjd, både med produkten och med köpupplevelsen.`;

export default function PrivacyPolicy() {
  const { settings: siteSettings } = useSiteSettings();
  const pageSettings = siteSettings.pages.privacyPolicy;
  const themeVars = buildSiteThemeVars(siteSettings.site.theme);
  const bodyText = pageSettings.bodyText?.trim() || privacyPolicyText;

  return (
    <div
      data-sandbox-id="global-theme"
      style={themeVars}
      className="min-h-screen flex flex-col bg-[var(--site-page-bg)] text-[var(--site-text-primary)] dark:bg-[var(--site-page-bg-dark)] dark:text-[var(--site-text-primary-dark)]"
    >
      <Navbar />
      <main className="flex-1">
        <section data-sandbox-id="privacy-hero" className="overflow-hidden bg-[var(--site-brand-bg)] text-[var(--site-brand-text)]">
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
                  style={{ minHeight: "20rem", backgroundColor: "var(--site-hero-frame-bg)", borderRadius: "var(--site-radius-xl)" }}
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

        <section data-sandbox-id="privacy-body" className="container mx-auto max-w-5xl space-y-5 px-4 py-12">
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
