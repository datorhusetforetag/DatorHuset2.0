import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Faq() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-yellow-400">
          <div className="container mx-auto px-4 pt-24 pb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-700">FAQ</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-4">Vanliga fr&aring;gor &amp; svar</h1>
            <p className="text-gray-800 mt-4 max-w-2xl">
              H&auml;r hittar du svar p&aring; de vanligaste fr&aring;gorna om best&auml;llning, leverans och service.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 max-w-4xl space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Hur l&aring;ng leveranstid har ni?</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Normalt 3-5 arbetsdagar f&ouml;r lagervaror. Special- eller custom-byggen kan ta l&auml;ngre tid.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Vilka betalmetoder accepterar ni?</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Kort, Swish och faktura via Stripe/partner. Alla k&ouml;p sker &ouml;ver s&auml;ker anslutning.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Kan jag avbryta eller &auml;ndra min order?</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Kontakta oss s&aring; snabbt som m&ouml;jligt. Om ordern inte har skickats kan vi oftast justera den.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Hur fungerar service och reparation?</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Beskriv problemet via kundservice s&aring; &aring;terkommer vi med offert, tidsplan och instruktioner.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Kan jag f&aring; r&aring;dgivning innan k&ouml;p?</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Absolut. Kontakta oss via kundservice s&aring; hj&auml;lper vi dig att v&auml;lja r&auml;tt dator efter behov och budget.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Ing&aring;r Windows i era datorer?</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Ja, alla f&auml;rdigbyggda datorer levereras med licens och grundinstallation s&aring; att du kan starta direkt.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Hur fungerar garanti och reklamation?</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Du har alltid r&auml;tt att reklamera fel enligt konsumentk&ouml;plagen. Vi hj&auml;lper dig snabbt med fels&ouml;kning och &aring;tg&auml;rd.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Kan jag &auml;ndra komponenter i en order?</h2>
            <p className="text-gray-600 dark:text-gray-300">
              I m&aring;nga fall g&aring;r det att uppgradera komponenter innan produktionen startar. Kontakta oss s&aring; tittar vi p&aring; alternativen.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Hur sp&aring;rar jag min leverans?</h2>
            <p className="text-gray-600 dark:text-gray-300">
              N&auml;r din order skickas f&aring;r du en sp&aring;rningsl&auml;nk via e-post. Du kan ocks&aring; kontakta oss f&ouml;r status.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Erbjuder ni f&ouml;retagsl&ouml;sningar?</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Ja, vi tar fram paket f&ouml;r f&ouml;retag med faktura, volympriser och anpassade konfigurationer.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Vad kostar fels&ouml;kning?</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Vi ger alltid en tydlig offert innan vi p&aring;b&ouml;rjar arbete. Du best&auml;mmer om du vill g&aring; vidare.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
