import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-yellow-400">
          <div className="container mx-auto px-4 pt-24 pb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-700">Integritet</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-4">Integritetspolicy</h1>
            <p className="text-gray-800 mt-4 max-w-2xl">
              Vi v&auml;rnar om din integritet och &auml;r &ouml;ppna med hur vi hanterar personuppgifter.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Senast uppdaterad: 2025-12-11</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Om denna policy</h2>
            <p className="text-gray-700 dark:text-gray-300">
              DatorHuset UF behandlar personuppgifter f&ouml;r att kunna leverera varor, hantera
              service&auml;renden och ge support. Denna policy f&ouml;rklarar vilken information vi
              samlar in, hur den anv&auml;nds och vilka r&auml;ttigheter du har.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Vilka uppgifter vi samlar in</h2>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Kontaktuppgifter som namn, e-postadress och telefonnummer.</li>
              <li>Order- och betalningsinformation kopplat till dina k&ouml;p.</li>
              <li>Teknisk information som IP-adress, enhet och webbl&auml;sare.</li>
              <li>Serviceinformation om din dator vid fels&ouml;kning eller reparation.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Hur vi anv&auml;nder uppgifterna</h2>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Genomf&ouml;ra och leverera best&auml;llningar.</li>
              <li>Hantera service och garantifr&aring;gor.</li>
              <li>Kommunicera statusuppdateringar och viktiga meddelanden.</li>
              <li>F&ouml;rb&auml;ttra webbplatsen och kundupplevelsen.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Delning av uppgifter</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Vi delar endast information med betrodda leverant&ouml;rer som beh&ouml;vs f&ouml;r leverans,
              betalning eller support. Vi s&auml;ljer aldrig personuppgifter till tredje part.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Lagring och s&auml;kerhet</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Vi lagrar endast uppgifter s&aring; l&auml;nge det &auml;r n&ouml;dv&auml;ndigt f&ouml;r att uppfylla avtal
              eller lagkrav. Vi anv&auml;nder rimliga tekniska och organisatoriska
              s&auml;kerhets&aring;tg&auml;rder f&ouml;r att skydda informationen.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Dina r&auml;ttigheter</h2>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Beg&auml;ra utdrag av de uppgifter vi har om dig.</li>
              <li>Beg&auml;ra r&auml;ttelse av felaktiga uppgifter.</li>
              <li>Beg&auml;ra radering av uppgifter d&auml;r det &auml;r till&aring;tet.</li>
              <li>Inv&auml;nda mot viss behandling eller beg&auml;ra begr&auml;nsning.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Kontakt</h2>
            <p className="text-gray-700 dark:text-gray-300">
              F&ouml;r fr&aring;gor om integritet, kontakta oss p&aring; datorhuset.foretag@gmail.com.
            </p>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
