import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Faq() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="container mx-auto px-4 pt-24 pb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">FAQ</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mt-4">Vanliga fr&aring;gor &amp; svar</h1>
            <p className="text-slate-300 mt-4 max-w-2xl">
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
        </section>
      </main>
      <Footer />
    </div>
  );
}
