import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12 max-w-4xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold">Integritetspolicy</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Senast uppdaterad: 2025-12-11</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Om denna policy</h2>
          <p className="text-gray-700 dark:text-gray-300">
            DatorHuset UF behandlar personuppgifter for att kunna leverera varor, hantera servicearenden och ge support.
            Denna policy forklarar vilken information vi samlar in, hur den anvands och vilka rattigheter du har.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Vilka uppgifter vi samlar in</h2>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
            <li>Kontaktuppgifter som namn, e-postadress och telefonnummer.</li>
            <li>Order- och betalningsinformation kopplat till dina kop.</li>
            <li>Teknisk information som IP-adress, enhet och webblasare.</li>
            <li>Serviceinformation om din dator vid felsokning eller reparation.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Hur vi anvander uppgifterna</h2>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
            <li>Genomfora och leverera bestallningar.</li>
            <li>Hantera service och garantifragor.</li>
            <li>Kommunicera statusuppdateringar och viktiga meddelanden.</li>
            <li>Forbattra webbplatsen och kundupplevelsen.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Delning av uppgifter</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Vi delar endast information med betrodda leverantorer som behovs for leverans, betalning eller support.
            Vi saljer aldrig personuppgifter till tredje part.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Lagring och sakerhet</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Vi lagrar endast uppgifter sa lange det ar nodvandigt for att uppfylla avtal eller lagkrav.
            Vi anvander rimliga tekniska och organisatoriska sakerhetsatgarder for att skydda informationen.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Dina rattigheter</h2>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
            <li>Begara utdrag av de uppgifter vi har om dig.</li>
            <li>Begara rattelse av felaktiga uppgifter.</li>
            <li>Begara radering av uppgifter dar det ar tillatet.</li>
            <li>Invanda mot viss behandling eller begara begransning.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Kontakt</h2>
          <p className="text-gray-700 dark:text-gray-300">
            For fragor om integritet, kontakta oss pa datorhuset.foretag@gmail.com.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
