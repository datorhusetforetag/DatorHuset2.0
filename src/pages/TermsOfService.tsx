import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12 max-w-4xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold">Allmanna villkor</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Senast uppdaterad: 2025-12-11</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Allmant</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Dessa villkor reglerar kop av produkter och tjanster fran DatorHuset UF. Genom att handla hos oss godkanner du villkoren.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Bestallning och betalning</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Vid bestallning skickas en orderbekraftelse via e-post. Betalning sker via de betalningssatt som anges i kassan.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Leverans</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Leveranstid anges pa respektive produkt. Vid forsening kontaktar vi dig med uppdaterad tidsplan.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Returer och reklamation</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Om du vill reklamera en produkt eller begara retur, kontakta kundservice. Vi foljer konsumentkoplagen och gallerande regler.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Service och reparation</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Servicearenden hanteras enligt overenskommen offert. Vi ansvarar inte for dataforlust och rekommenderar backup innan inlamning.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Ansvarsbegransning</h2>
          <p className="text-gray-700 dark:text-gray-300">
            DatorHuset UF ansvarar inte for indirekta skador eller forluster som kan uppsta vid anvandning av vara produkter.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Andringar</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Vi kan uppdatera villkoren vid behov. Den senaste versionen finns alltid tillganglig pa webbplatsen.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Kontakt</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Har du fragor om villkoren, kontakta oss pa datorhuset.foretag@gmail.com.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
