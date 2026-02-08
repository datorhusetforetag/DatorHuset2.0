import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";

export default function CustomerService() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-yellow-400 overflow-hidden">
          <div className="container mx-auto px-4 pt-16 sm:pt-24 pb-12">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-700">Kundservice</p>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-4">Kontakta oss</h1>
                <p className="text-gray-800 mt-4 max-w-2xl">
                  BehÃƒÆ’Ã‚Â¶ver du hjÃƒÆ’Ã‚Â¤lp med en bestÃƒÆ’Ã‚Â¤llning, service eller garanti? Vi svarar snabbt med tydliga besked.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/faq"
                    className="inline-flex items-center justify-center gap-2 border border-gray-900 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:border-[#11667b] hover:text-white transition-colors"
                  >
                    Se FAQ
                  </Link>
                </div>
              </div>
              <div className="rounded-3xl border border-yellow-500/40 bg-yellow-300/40 p-4 sm:p-6">
                <img
                  src="/Datorhuset.png"
                  alt="DatorHuset logo"
                  className="w-full h-56 sm:h-72 lg:h-80 object-contain object-center"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 max-w-5xl space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-2">
              <h2 className="text-lg font-semibold">Kontaktuppgifter</h2>
              <p>E-post: <a className="text-blue-600 dark:text-blue-400" href="mailto:support@datorhuset.site">support@datorhuset.site</a></p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-2">
              <h2 className="text-lg font-semibold">ÃƒÆ’Ã¢â‚¬â€œppettider</h2>
              <p>Svarstider: 11:00 - 15:00</p>
              <p>Vi svarar pÃƒÆ’Ã‚Â¥ mail under vardagar.</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-3">
            <h2 className="text-lg font-semibold">SupportÃƒÆ’Ã‚Â¤renden</h2>
            <p>FÃƒÆ’Ã‚Â¶r frÃƒÆ’Ã‚Â¥gor om bestÃƒÆ’Ã‚Â¤llningar, returer eller fakturor: ange ordernummer och beskriv ÃƒÆ’Ã‚Â¤rendet kort.</p>
            <p>Teknisk support: beskriv problemet, vilka komponenter som anvÃƒÆ’Ã‚Â¤nds och bifoga bilder om mÃƒÆ’Ã‚Â¶jligt.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
              <h2 className="text-lg font-semibold">Vanliga ÃƒÆ’Ã‚Â¤renden</h2>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>Orderstatus, leveranstider och spÃƒÆ’Ã‚Â¥rning</li>
                <li>ÃƒÆ’Ã¢â‚¬Å¾ndringar i bestÃƒÆ’Ã‚Â¤llning eller uppgraderingar</li>
                <li>GarantifrÃƒÆ’Ã‚Â¥gor och reklamation</li>
                <li>FelsÃƒÆ’Ã‚Â¶kning, service och reparation</li>
                <li>FÃƒÆ’Ã‚Â¶retagslÃƒÆ’Ã‚Â¶sningar och faktura</li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Vi ÃƒÆ’Ã‚Â¥terkommer normalt inom 24 timmar pÃƒÆ’Ã‚Â¥ vardagar.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
              <h2 className="text-lg font-semibold">SÃƒÆ’Ã‚Â¥ arbetar vi</h2>
              <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
                <li>Du beskriver ditt ÃƒÆ’Ã‚Â¤rende via mail eller formulÃƒÆ’Ã‚Â¤r.</li>
                <li>Vi ÃƒÆ’Ã‚Â¥terkommer med frÃƒÆ’Ã‚Â¥gor eller fÃƒÆ’Ã‚Â¶rslag.</li>
                <li>Du fÃƒÆ’Ã‚Â¥r en tydlig offert och tidsplan.</li>
                <li>Vi uppdaterar dig nÃƒÆ’Ã‚Â¤r arbetet ÃƒÆ’Ã‚Â¤r klart.</li>
              </ol>
              <Link
                to="/service-reparation"
                className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-[#11667b] hover:text-white transition-colors"
              >
                Starta serviceÃƒÆ’Ã‚Â¤rende
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
