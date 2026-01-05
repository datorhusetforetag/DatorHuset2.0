import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-yellow-400">
          <div className="container mx-auto px-4 pt-16 sm:pt-24 pb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-700">Integritet</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-4">Integritetspolicy</h1>
            <p className="text-gray-800 mt-4 max-w-2xl">
              Vi värnar om din integritet och är öppna med hur vi hanterar personuppgifter.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Senast uppdaterad: 2025-12-11</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Om denna policy</h2>
            <p className="text-gray-700 dark:text-gray-300">
              DatorHuset UF behandlar personuppgifter för att kunna leverera varor, hantera
              serviceärenden och ge support. Denna policy förklarar vilken information vi
              samlar in, hur den används och vilka rättigheter du har.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Vilka uppgifter vi samlar in</h2>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Kontaktuppgifter som namn, e-postadress och telefonnummer.</li>
              <li>Order- och betalningsinformation kopplat till dina köp.</li>
              <li>Teknisk information som IP-adress, enhet och webbläsare.</li>
              <li>Serviceinformation om din dator vid felsökning eller reparation.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Hur vi använder uppgifterna</h2>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Genomföra och leverera beställningar.</li>
              <li>Hantera service och garantifrågor.</li>
              <li>Kommunicera statusuppdateringar och viktiga meddelanden.</li>
              <li>Förbättra webbplatsen och kundupplevelsen.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Delning av uppgifter</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Vi delar endast information med betrodda leverantörer som behövs för leverans,
              betalning eller support. Vi säljer aldrig personuppgifter till tredje part.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Lagring och säkerhet</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Vi lagrar endast uppgifter så länge det är nödvändigt för att uppfylla avtal
              eller lagkrav. Vi använder rimliga tekniska och organisatoriska
              säkerhetsåtgärder för att skydda informationen.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Dina rättigheter</h2>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Begära utdrag av de uppgifter vi har om dig.</li>
              <li>Begära rättelse av felaktiga uppgifter.</li>
              <li>Begära radering av uppgifter där det är tillåtet.</li>
              <li>Invända mot viss behandling eller begära begränsning.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Kontakt</h2>
            <p className="text-gray-700 dark:text-gray-300">
              För frågor om integritet, kontakta oss på datorhuset.foretag@gmail.com.
            </p>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
