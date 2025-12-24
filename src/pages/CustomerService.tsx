import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";

export default function CustomerService() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="container mx-auto px-4 pt-24 pb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Kundservice</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mt-4">Kontakta oss</h1>
            <p className="text-slate-300 mt-4 max-w-2xl">
              Behöver du hjälp med en beställning, service eller garanti? Vi svarar snabbt med tydliga besked.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:datorhuset.foretag@gmail.com"
                className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:text-white transition-colors"
              >
                E-posta oss
              </a>
              <Link
                to="/faq"
                className="inline-flex items-center justify-center gap-2 border border-yellow-400 text-yellow-400 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:border-[#11667b] hover:text-white transition-colors"
              >
                Se FAQ
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 max-w-4xl space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-2">
              <h2 className="text-lg font-semibold">Kontaktuppgifter</h2>
              <p>E-post: <a className="text-blue-600 dark:text-blue-400" href="mailto:datorhuset.foretag@gmail.com">datorhuset.foretag@gmail.com</a></p>
              <p>Telefon: +46 (0)10 138 82 08</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-2">
              <h2 className="text-lg font-semibold">Öppettider</h2>
              <p>Svarstider: 11:00 - 15:00</p>
              <p>Vi svarar på mail under vardagar.</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-3">
            <h2 className="text-lg font-semibold">Supportärenden</h2>
            <p>För frågor om beställningar, returer eller fakturor: ange ordernummer och beskriv ärendet kort.</p>
            <p>Teknisk support: beskriv problemet, vilka komponenter som används och bifoga bilder om möjligt.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
