import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="container mx-auto px-4 pt-24 pb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Om oss</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mt-4">DatorHuset UF</h1>
            <p className="text-slate-300 mt-4 max-w-2xl">
              Vi bygger och säljer stationära datorer för gaming, kreativa flöden och professionellt arbete.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:text-white transition-colors"
              >
                Se våra datorer
              </Link>
              <Link
                to="/kundservice"
                className="inline-flex items-center justify-center gap-2 border border-yellow-400 text-yellow-400 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:border-[#11667b] hover:text-white transition-colors"
              >
                Kontakta oss
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 max-w-4xl space-y-6">
          <p className="text-gray-700 dark:text-gray-300">
            DatorHuset bygger och säljer stationära datorer för gaming och arbete. Vi fokuserar på
            tydliga specifikationer, rimliga priser och snabb service.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Vår vision är att göra datorbygge och uppgraderingar enkelt. Vi erbjuder färdigbyggda
            paket, custom-byggen och rådgivning för att hitta rätt prestanda till rätt budget.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Har du frågor eller vill ha en skräddarsydd offert? Kontakta oss så hjälper vi till.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
