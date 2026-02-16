import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-yellow-400 overflow-hidden">
          <div className="container mx-auto px-4 pt-16 sm:pt-24 pb-12">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-700">Villkor</p>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-4">Allm&auml;nna villkor</h1>
                <p className="text-gray-800 mt-4 max-w-2xl">
                  L&auml;s igenom v&aring;ra villkor f&ouml;r k&ouml;p, leverans och service hos DatorHuset UF.
                </p>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src="/Datorhuset.png"
                  alt="DatorHuset logo"
                  className="w-full max-w-md h-56 sm:h-72 lg:h-80 object-contain object-center"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 max-w-5xl space-y-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Senast uppdaterad: 2026-02-08</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Allm&auml;nt</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Dessa villkor g&auml;ller f&ouml;r k&ouml;p av produkter fr&aring;n DatorHuset UF (nedan kallat
              &quot;DatorHuset&quot; eller &quot;vi&quot;) till dig som kund. Genom att best&auml;lla en vara fr&aring;n oss godk&auml;nner
              du dessa allm&auml;nna villkor. F&ouml;r att handla hos DatorHuset m&aring;ste du vara minst 18 &aring;r gammal
              (eller ha m&aring;lsmans godk&auml;nnande om du &auml;r under 18).
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              &Auml;gander&auml;tten till varan f&ouml;rblir hos DatorHuset tills full betalning har mottagits. Alla f&ouml;rs&ouml;k
              till bedr&auml;geri polisanm&auml;ls. Vid fr&aring;gor eller behov av kontakt n&aring;r du oss enklast via e-post:
              {" "}
              <a className="text-blue-600 dark:text-blue-400" href="mailto:support@datorhuset.site">
                support@datorhuset.site
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Best&auml;llning och betalning</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Best&auml;llningar genomf&ouml;rs via v&aring;r webbplats (datorhuset.site). N&auml;r du slutf&ouml;rt en best&auml;llning
              skickas en orderbekr&auml;ftelse automatiskt till den e-postadress du angivit. I samband med best&auml;llningen
              reserveras eller debiteras k&ouml;pesumman via vald betalningsmetod.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Vi anv&auml;nder Stripe som betalningsleverant&ouml;r och erbjuder flera betalningsalternativ f&ouml;r din bekv&auml;mlighet, bland annat:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
              <li>Betalkort: Visa, MasterCard m.fl.</li>
              <li>PayPal</li>
              <li>Google Pay</li>
              <li>Klarna: (t.ex. direktbetalning, delbetalning eller faktura via Klarna)</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300">
              All betalning sker i svenska kronor (SEK). Priserna p&aring; v&aring;r hemsida &auml;r angivna i SEK och inkluderar
              moms (25%) om inget annat anges. Eventuell fraktkostnad (700 kr vid val av PostNord-frakt, se nedan)
              tillkommer och redovisas innan du bekr&auml;ftar k&ouml;pet. Inga ytterligare avgifter tillkommer ut&ouml;ver det
              som anges i kassan.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Observera att k&ouml;p endast kan genomf&ouml;ras via v&aring;r officiella betalningsl&ouml;sning p&aring; webbplatsen; vi
              accepterar inte kontant betalning eller transaktioner via externa tj&auml;nster. N&auml;r din betalning har
              registrerats hos oss erh&aring;ller du en betalningsbekr&auml;ftelse/kvitto via e-post som underlag f&ouml;r ditt k&ouml;p.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Leverans</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Vi erbjuder tv&aring; leveransalternativ f&ouml;r din order: kostnadsfri upph&auml;mtning eller frakt med PostNord.
              Du v&auml;ljer &ouml;nskat leveranss&auml;tt i kassan n&auml;r du genomf&ouml;r k&ouml;pet. Nedan f&ouml;ljer villkoren f&ouml;r respektive leveranss&auml;tt.
            </p>

            <h3 className="text-lg font-semibold">3.1 Upph&auml;mtning</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Du kan v&auml;lja att h&auml;mta din produkt kostnadsfritt vid Rinkeby Centrum i Stockholm enligt &ouml;verenskommelse.
              Efter att best&auml;llningen mottagits kontaktar vi dig f&ouml;r att komma &ouml;verens om en tid och exakt plats f&ouml;r
              &ouml;verl&auml;mning. Vid upph&auml;mtning m&aring;ste du uppvisa giltig legitimation samt orderbekr&auml;ftelse, och varan
              l&auml;mnas ut f&ouml;rst efter att full betalning har mottagits av oss.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Vi rekommenderar att du inspekterar varan vid &ouml;verl&auml;mnandet f&ouml;r att s&auml;kerst&auml;lla att den motsvarar
              beskrivningen och dina f&ouml;rv&auml;ntningar. N&auml;r varan v&auml;l har &ouml;verl&auml;mnats i felfritt skick &ouml;verg&aring;r ansvar
              och risk f&ouml;r varan till dig som kund.
            </p>

            <h3 className="text-lg font-semibold">3.2 PostNord-frakt</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Om du inte har m&ouml;jlighet att h&auml;mta varan p&aring; plats erbjuder vi leverans inom Sverige med PostNord.
              F&ouml;rs&auml;ndelsen skickas som Rekommenderat brev (Rek Extra) &ndash; en sp&aring;rbar f&ouml;rs&auml;ndelse med f&ouml;rs&auml;kring.
              Fraktkostnaden &auml;r 700 kr (fast pris), vilket inkluderar sp&aring;rbar frakt och f&ouml;rs&auml;kring av inneh&aring;llet
              upp till 25&nbsp;000 kr.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Leveranstiden &auml;r normalt 1&ndash;2 arbetsdagar inom Sverige (enligt PostNords uppskattning). S&aring; snart vi har
              skickat din vara f&aring;r du ett sp&aring;rningsnummer s&aring; att du kan f&ouml;lja f&ouml;rs&auml;ndelsen online. Paketet levereras
              vanligen till ditt n&auml;rmaste postombud eller utl&auml;mningsst&auml;lle, och du kommer att aviseras via SMS eller
              e-post n&auml;r f&ouml;rs&auml;ndelsen finns att h&auml;mta. Legitimation kr&auml;vs fr&aring;n mottagaren vid uth&auml;mtning hos ombudet.
              Observera att vi i dagsl&auml;get endast levererar inom Sverige.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Vi paketerar varan omsorgsfullt f&ouml;r att minimera risken f&ouml;r skador under transport. Om paketet verkar
              skadat vid uth&auml;mtning ska du anm&auml;la det direkt hos ombudet innan du tar emot f&ouml;rs&auml;ndelsen, samt kontakta
              oss omg&aring;ende. Skulle paketet mot f&ouml;rmodan komma bort eller om inneh&aring;llet skadas under transporten hj&auml;lper
              vi dig att reklamera f&ouml;rs&auml;ndelsen hos PostNord. Ers&auml;ttning vid transportskada eller f&ouml;rlust &auml;r begr&auml;nsad
              till 25&nbsp;000 kr enligt PostNords villkor; vi kan tyv&auml;rr inte ers&auml;tta n&aring;got belopp ut&ouml;ver vad f&ouml;rs&auml;kringen t&auml;cker.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. &Aring;ngerr&auml;tt (Returr&auml;tt)</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Som konsument har du enligt lag (distansavtalslagen) r&auml;tt att &aring;ngra ditt k&ouml;p inom 14 dagar fr&aring;n det att
              du mottagit varan. Under denna period kan du returnera varan och f&aring; pengarna tillbaka, f&ouml;rutsatt att du
              f&ouml;ljer nedanst&aring;ende villkor f&ouml;r retur. Du beh&ouml;ver inte ange n&aring;gon s&auml;rskild anledning vid nyttjande av
              &aring;ngerr&auml;tten, men vi uppskattar frivillig feedback om varf&ouml;r du &aring;ngrar k&ouml;pet d&aring; det kan hj&auml;lpa oss att bli b&auml;ttre.
            </p>
            <p className="text-gray-700 dark:text-gray-300">F&ouml;r att utnyttja din &aring;ngerr&auml;tt, v&auml;nligen g&ouml;r f&ouml;ljande:</p>
            <ol className="list-decimal pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>
                Meddela oss inom 14 dagar fr&aring;n att du mottagit varan att du vill &aring;ngra k&ouml;pet. Skicka ett tydligt
                meddelande (t.ex. via e-post till support@datorhuset.site) d&auml;r du anger ditt namn, ordernummer samt
                att du vill utnyttja &aring;ngerr&auml;tten.
              </li>
              <li>
                Skicka tillbaka varan inom 14 dagar efter att du meddelat oss om ditt beslut att &aring;ngra k&ouml;pet. Varan
                ska returneras i v&auml;sentligen of&ouml;r&auml;ndrat skick, g&auml;rna i originalf&ouml;rpackning med allt medf&ouml;ljande inneh&aring;ll.
              </li>
              <li>
                Betala returfrakten sj&auml;lv. Du som kund st&aring;r f&ouml;r kostnaden att skicka tillbaka varan vid &aring;ngrat k&ouml;p.
                V&auml;lj en l&auml;mplig fraktmetod och emballera varan v&auml;l f&ouml;r att undvika skador under transport.
              </li>
              <li>
                Bifoga orderinformation. L&auml;gg med orderbekr&auml;ftelse eller ange ordernummer och dina kontaktuppgifter i
                returf&ouml;rs&auml;ndelsen, s&aring; att vi kan identifiera &auml;rendet snabbare n&auml;r vi tar emot den.
              </li>
            </ol>
            <p className="text-gray-700 dark:text-gray-300">
              N&auml;r vi har mottagit den returnerade varan (eller du har kunnat visa att varan har s&auml;nts tillbaka) kommer
              vi att &aring;terbetala hela k&ouml;pesumman snarast m&ouml;jligt, dock senast inom 14 dagar fr&aring;n att du meddelade oss
              om ditt beslut att &aring;ngra k&ouml;pet. &Aring;terbetalningen sker via samma betalningss&auml;tt som du anv&auml;nde vid k&ouml;pet,
              s&aring;vida inget annat &ouml;verenskommits.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Om varan har hanterats mer &auml;n n&ouml;dv&auml;ndigt f&ouml;r att fastst&auml;lla dess funktion eller skick, f&ouml;rbeh&aring;ller vi
              oss r&auml;tten att g&ouml;ra ett avdrag p&aring; &aring;terbetalningsbeloppet motsvarande varans eventuella v&auml;rdeminskning.
              Vi kontaktar dig i s&aring; fall innan vi g&ouml;r ett s&aring;dant avdrag.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Viktigt: &Aring;ngerr&auml;tten g&auml;ller inte f&ouml;r varor som har specialtillverkats enligt dina anvisningar eller som
              p&aring; annat s&auml;tt f&aring;tt en tydligt personlig pr&auml;gel (undantaget &auml;r ej till&auml;mpligt p&aring; standardprodukter s&aring;som
              v&aring;ra datorer, utan avser t.ex. kundspecifika best&auml;llningsvaror). Observera ocks&aring; att en outl&ouml;st f&ouml;rs&auml;ndelse
              inte r&auml;knas som ut&ouml;vande av &aring;ngerr&auml;tt. Du m&aring;ste f&ouml;rst h&auml;mta ut paketet (om varan skickats) och d&auml;refter
              kontakta oss f&ouml;r att formellt &aring;ngra k&ouml;pet enligt stegen ovan.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Om du skulle underl&aring;ta att h&auml;mta ut paketet och det returneras till oss utan f&ouml;reg&aring;ende &ouml;verenskommelse,
              har vi r&auml;tt att debitera dig f&ouml;r de faktiska kostnader som uppst&aring;r f&ouml;r frakt och hantering av returen.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              F&ouml;r att underl&auml;tta f&ouml;r dig som kund finns en standardblankett f&ouml;r ut&ouml;vande av &aring;ngerr&auml;tt (framtagen av
              Konsumentverket) som du kan anv&auml;nda om du s&aring; &ouml;nskar. Att anv&auml;nda blanketten &auml;r dock frivilligt &ndash; det
              g&aring;r lika bra att kontakta oss genom ett vanligt e-mail enligt instruktionerna ovan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Reklamation och garanti</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Vi f&ouml;ljer konsumentk&ouml;plagen vid reklamationer. Det inneb&auml;r att du som kund har r&auml;tt att reklamera fel
              p&aring; varan som &auml;r ursprungliga (tillverkningsfel eller andra fel som funnits vid leveransen) upp till 3 &aring;r
              fr&aring;n k&ouml;pet. F&ouml;r att en reklamation ska vara giltig b&ouml;r du p&aring;peka felet inom sk&auml;lig tid efter att du m&auml;rkt det.
              Meddelar du oss inom tv&aring; m&aring;nader fr&aring;n det att felet uppt&auml;cktes anses det alltid vara inom sk&auml;lig tid.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Om det visar sig vara ett ursprungligt fel p&aring; varan som du reklamerar kommer vi i f&ouml;rsta hand att erbjuda
              att avhj&auml;lpa felet (t.ex. genom reparation) eller ers&auml;tta varan med en likv&auml;rdig produkt. I de fall det inte
              &auml;r m&ouml;jligt med reparation eller ers&auml;ttningsvara har du r&auml;tt att f&aring; k&ouml;pet h&auml;vt och pengarna &aring;terbetalda.
              Eventuella kostnader f&ouml;r returfrakt vid en godk&auml;nd reklamation bekostas av oss.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Kontakta oss alltid p&aring;
              {" "}
              <a className="text-blue-600 dark:text-blue-400" href="mailto:support@datorhuset.site">
                support@datorhuset.site
              </a>
              {" "}
              innan du skickar tillbaka en produkt vid reklamation, s&aring; ger vi instruktioner och en returetikett om det &auml;r aktuellt.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Notera att reklamationsr&auml;tten inte t&auml;cker fel som uppst&aring;tt p&aring; grund av yttre &aring;verkan, olycksh&auml;ndelse,
              vanv&aring;rd eller felaktig anv&auml;ndning av produkten efter att du f&aring;tt den. Produkten &auml;r funktionstestad innan
              leverans och f&ouml;ruts&auml;tts anv&auml;ndas enligt medf&ouml;ljande instruktioner och normal aktsamhet.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Flera av komponenterna i datorn kan ha egna tillverkargarantier (till exempel 1&ndash;3 &aring;rs fabriksgaranti
              fr&aring;n tillverkaren). Vi bifogar kvitto eller garantibevis f&ouml;r relevanta komponenter i den m&aring;n s&aring;dana finns,
              s&aring; att du vid behov kan g&ouml;ra g&auml;llande eventuell tillverkargaranti direkt gentemot tillverkaren eller via oss.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Ansvarsbegr&auml;nsning</h2>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Fel och prisjusteringar:</span> Vi reserverar oss f&ouml;r eventuella skrivfel,
              prisfel eller andra uppenbara misstag i produktinformation p&aring; hemsidan. Skulle ett pris eller lagersaldo
              vara uppenbart felaktigt f&ouml;rbeh&aring;ller vi oss r&auml;tten att annullera best&auml;llningen och &aring;terbetala eventuellt
              erlagt belopp, innan varan har skickats.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Indirekta skador:</span> DatorHuset ansvarar inte f&ouml;r indirekta skador eller
              f&ouml;ljdf&ouml;rluster, s&aring;som f&ouml;rlorad inkomst, f&ouml;rlorad data, utebliven vinst eller annan ekonomisk f&ouml;ljdskada.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Force Majeure:</span> Vi &auml;r befriade fr&aring;n p&aring;f&ouml;ljd f&ouml;r underl&aring;tenhet att fullg&ouml;ra
              viss f&ouml;rpliktelse enligt detta avtal, om underl&aring;tenheten har sin grund i befriande omst&auml;ndighet (&quot;force majeure&quot;).
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Maximalt ansvar:</span> DatorHusets sammanlagda ansvar gentemot dig som kund
              &auml;r i samtliga fall begr&auml;nsat till det totalbelopp du betalat f&ouml;r den aktuella produkten/tj&auml;nsten, s&aring;vida
              inte annat uttryckligen f&ouml;ljer av tvingande lag.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Till&auml;mplig lag och tvistl&ouml;sning</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Detta avtal och dessa villkor ska tolkas och till&auml;mpas i enlighet med svensk lag. Vid en eventuell tvist
              str&auml;var vi alltid efter att i f&ouml;rsta hand l&ouml;sa &auml;rendet i samf&ouml;rst&aring;nd med dig som kund.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Om en tvist inte kan l&ouml;sas genom dialog mellan oss, har du som konsument r&auml;tt att v&auml;nda dig till
              Allm&auml;nna reklamationsn&auml;mnden (ARN) f&ouml;r pr&ouml;vning av tvisten. Vi f&ouml;rbinder oss att f&ouml;lja ARN:s
              rekommendationer i en eventuell tvist. Du har &auml;ven m&ouml;jlighet att anv&auml;nda EU-kommissionens Online Dispute
              Resolution (ODR)-plattform f&ouml;r att anm&auml;la en tvist online.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Som sista utv&auml;g kan tvisten pr&ouml;vas av allm&auml;n domstol i Sverige. DatorHuset f&ouml;ljer svensk lagstiftning
              och eventuella tvingande konsumentskyddsregler. Dessa villkor begr&auml;nsar inte dina r&auml;ttigheter enligt lag,
              utan syftar till att klarg&ouml;ra de &ouml;verenskommelser som g&auml;ller mellan oss som s&auml;ljare och dig som kund.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Tack f&ouml;r att du har tagit dig tid att l&auml;sa igenom v&aring;ra allm&auml;nna villkor. Vi uppskattar ditt f&ouml;rtroende
              och hoppas att du blir n&ouml;jd med ditt k&ouml;p.
            </p>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
