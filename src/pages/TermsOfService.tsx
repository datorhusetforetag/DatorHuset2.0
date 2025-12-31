import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-yellow-400">
          <div className="container mx-auto px-4 pt-16 sm:pt-24 pb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-700">Villkor</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-4">Allm&auml;nna villkor</h1>
            <p className="text-gray-800 mt-4 max-w-2xl">
              L&auml;s igenom v&aring;ra villkor f&ouml;r k&ouml;p, leverans och service hos DatorHuset UF.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Senast uppdaterad: 2025-12-11</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Allm&auml;nt</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Dessa villkor reglerar k&ouml;p av produkter och tj&auml;nster fr&aring;n DatorHuset UF. Genom
              att handla hos oss godk&auml;nner du villkoren.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Best&auml;llning och betalning</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Vid best&auml;llning skickas en orderbekr&auml;ftelse via e-post. Betalning sker via de
              betalningss&auml;tt som anges i kassan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Leverans</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Leveranstid anges p&aring; respektive produkt. Vid f&ouml;rsening kontaktar vi dig med
              uppdaterad tidsplan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Returer och reklamation</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Om du vill reklamera en produkt eller beg&auml;ra retur, kontakta kundservice. Vi
              f&ouml;ljer konsumentk&ouml;plagen och g&auml;llande regler.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Service och reparation</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Service&auml;renden hanteras enligt &ouml;verenskommen offert. Vi ansvarar inte f&ouml;r
              dataf&ouml;rlust och rekommenderar backup innan inl&auml;mning.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Ansvarsbegr&auml;nsning</h2>
            <p className="text-gray-700 dark:text-gray-300">
              DatorHuset UF ansvarar inte f&ouml;r indirekta skador eller f&ouml;rluster som kan uppst&aring;
              vid anv&auml;ndning av v&aring;ra produkter.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. &Auml;ndringar</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Vi kan uppdatera villkoren vid behov. Den senaste versionen finns alltid
              tillgänglig på webbplatsen.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Kontakt</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Har du frågor om villkoren, kontakta oss på datorhuset.foretag@gmail.com.
            </p>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
