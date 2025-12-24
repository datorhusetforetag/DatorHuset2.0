import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="container mx-auto px-4 pt-24 pb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Villkor</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mt-4">Allmänna villkor</h1>
            <p className="text-slate-300 mt-4 max-w-2xl">
              Läs igenom våra villkor för köp, leverans och service hos DatorHuset UF.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Senast uppdaterad: 2025-12-11</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Allmänt</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Dessa villkor reglerar köp av produkter och tjänster från DatorHuset UF. Genom
              att handla hos oss godkänner du villkoren.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Beställning och betalning</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Vid beställning skickas en orderbekräftelse via e-post. Betalning sker via de
              betalningssätt som anges i kassan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Leverans</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Leveranstid anges på respektive produkt. Vid försening kontaktar vi dig med
              uppdaterad tidsplan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Returer och reklamation</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Om du vill reklamera en produkt eller begära retur, kontakta kundservice. Vi
              följer konsumentköplagen och gällande regler.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Service och reparation</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Serviceärenden hanteras enligt överenskommen offert. Vi ansvarar inte för
              dataförlust och rekommenderar backup innan inlämning.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Ansvarsbegränsning</h2>
            <p className="text-gray-700 dark:text-gray-300">
              DatorHuset UF ansvarar inte för indirekta skador eller förluster som kan uppstå
              vid användning av våra produkter.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Ändringar</h2>
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
