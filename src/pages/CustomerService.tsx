import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { SeoJsonLd } from "@/components/SeoJsonLd";

export default function CustomerService() {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "DatorHuset",
    url: "https://datorhuset.site/",
    image: "https://datorhuset.site/Datorhuset.png",
    email: "support@datorhuset.site",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Stockholm",
      addressCountry: "SE",
    },
    areaServed: "SE",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "11:00",
        closes: "15:00",
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Hem",
        item: "https://datorhuset.site/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Kundservice",
        item: "https://datorhuset.site/kundservice",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <SeoJsonLd data={[localBusinessSchema, breadcrumbSchema]} />
      <Navbar />
      <main className="flex-1">
        <section className="bg-yellow-400 overflow-hidden">
          <div className="container mx-auto px-4 pt-16 sm:pt-24 pb-12">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-700">Kundservice</p>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-4">Kontakta oss</h1>
                <p className="text-gray-800 mt-4 max-w-2xl">
                  Behöver du hjälp med en beställning, service eller garanti? Vi svarar snabbt med tydliga besked.
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
              <div className="flex items-center justify-center">
                <img
                  src="/Datorhuset.png"
                  alt="DatorHuset logo"
                  className="w-full max-w-md h-56 sm:h-72 lg:h-80 object-contain object-center"
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
              <p>
                E-post:{" "}
                <a className="text-blue-600 dark:text-blue-400" href="mailto:support@datorhuset.site">
                  support@datorhuset.site
                </a>
              </p>
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

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
              <h2 className="text-lg font-semibold">Vanliga ärenden</h2>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>Orderstatus, leveranstider och spårning</li>
                <li>Ändringar i beställning eller uppgraderingar</li>
                <li>Garantifrågor och reklamation</li>
                <li>Felsökning, service och reparation</li>
                <li>Företagslösningar och faktura</li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-300">Vi återkommer normalt inom 24 timmar på vardagar.</p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
              <h2 className="text-lg font-semibold">Så arbetar vi</h2>
              <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
                <li>Du beskriver ditt ärende via mail eller formulär.</li>
                <li>Vi återkommer med frågor eller förslag.</li>
                <li>Du får en tydlig offert och tidsplan.</li>
                <li>Vi uppdaterar dig när arbetet är klart.</li>
              </ol>
              <Link
                to="/service-reparation"
                className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-[#11667b] hover:text-white transition-colors"
              >
                Starta serviceärende
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
