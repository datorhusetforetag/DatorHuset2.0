import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-yellow-400">
          <div className="container mx-auto px-4 pt-24 pb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-700">Om oss</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-4">DatorHuset UF</h1>
            <p className="text-gray-800 mt-4 max-w-2xl">
              Vi bygger och säljer stationära datorer för gaming, kreativa flöden och professionellt arbete.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] transition-colors"
              >
                Se våra datorer
              </Link>
              <Link
                to="/kundservice"
                className="inline-flex items-center justify-center gap-2 border border-gray-900 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:border-[#11667b] hover:text-white transition-colors"
              >
                Kontakta oss
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 max-w-5xl space-y-10">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vår historia</h2>
            <p className="text-gray-700 dark:text-gray-300">
              DatorHuset startade som ett skolprojekt med en enkel idé: göra det lättare att hitta rätt dator
              utan krångliga specifikationer. Vi byggde våra första datorer för vänner och klasskamrater,
              och växte snabbt tack vare rekommendationer och tydlig service.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Idag hjälper vi kunder att välja, bygga och optimera datorer för gaming, kreativa flöden och
              professionellt arbete. Vi tror på ärliga råd, tydliga priser och snabb återkoppling.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold mb-2">Tydlighet</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Du ska alltid förstå vad du får, varför det passar dig och vad det kostar.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold mb-2">Prestanda</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Vi fokuserar på rätt komponenter och optimal balans för ditt användningsområde.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold mb-2">Service</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Snabba svar, tydliga offerter och uppföljning när du behöver oss.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <img
              src="/products/Horizon3_Elite_Hero_2000x.webp"
              alt="DatorHuset premiumbygge"
              className="w-full h-56 object-cover rounded-xl border border-gray-200 dark:border-gray-800"
              loading="lazy"
            />
            <img
              src="/products/Voyager_Hero_NoGeforce_2000x.webp"
              alt="DatorHuset gamingdator"
              className="w-full h-56 object-cover rounded-xl border border-gray-200 dark:border-gray-800"
              loading="lazy"
            />
            <img
              src="/products/NavBase_Hero_Colorswap_2000x.webp"
              alt="DatorHuset kompakt dator"
              className="w-full h-56 object-cover rounded-xl border border-gray-200 dark:border-gray-800"
              loading="lazy"
            />
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vårt löfte</h2>
            <ul className="grid gap-3 md:grid-cols-2 text-sm text-gray-700 dark:text-gray-300">
              <li>Personlig rådgivning anpassad efter dina behov</li>
              <li>Tydliga offerter utan dolda kostnader</li>
              <li>Snabb leverans och trygg support</li>
              <li>Hjälp med uppgraderingar när du växer</li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
