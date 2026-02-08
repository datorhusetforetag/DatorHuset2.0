import { Link } from "react-router-dom";
import { buildUtmContent, withUtm } from "@/lib/utm";

export const HomePromoSplit = () => {
  return (
    <section className="bg-gray-50 text-gray-900 dark:bg-background dark:text-gray-50">
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400">Mer från DatorHuset</p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-3">Vi bygger, fixar och optimerar för dig</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 max-w-2xl mx-auto">
            Välj service om du vill få din dator tillbaka i toppform eller bygg ett helt nytt system från grunden.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <article className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-[0_20px_60px_rgba(0,0,0,0.08)] min-h-[520px] sm:min-h-[560px] flex flex-col">
            <div className="relative h-48 sm:h-56 lg:h-64">
              <img
                src="/products/newpc/chieftecvisio-1.jpg"
                alt="Service och reparation av datorer"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <p className="absolute bottom-4 left-6 text-xs uppercase tracking-[0.4em] text-yellow-400">Service & reparation</p>
            </div>
            <div className="p-6 lg:p-8 flex flex-col gap-4 flex-1">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold">Vi får din dator tillbaka i toppform</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Snabb felsökning, tydlig offert och proffsig optimering. Vi tar hand om allt från prestandaproblem
                till uppgraderingar.
              </p>
              <div className="grid gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-yellow-400" />
                  Felsökning inom 24 timmar på vanliga fel
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-yellow-400" />
                  Rengöring, kylning och stabilitetstester
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-yellow-400" />
                  Garanti på utfört arbete och uppgraderingar
                </div>
              </div>
              <div className="mt-auto flex flex-col sm:flex-row gap-3">
                <Link
                  to={withUtm("/service-reparation", {
                    utm_source: "homepage",
                    utm_medium: "promo_card",
                    utm_campaign: "service_reparation",
                    utm_content: buildUtmContent("service-reparation"),
                  })}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:text-white transition-colors"
                >
                  Service & reparation
                </Link>
                <Link
                  to={withUtm("/kundservice", {
                    utm_source: "homepage",
                    utm_medium: "promo_card",
                    utm_campaign: "service_reparation",
                    utm_content: buildUtmContent("kundservice"),
                  })}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-yellow-400 text-gray-900 dark:text-yellow-300 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:border-[#11667b] hover:text-white transition-colors"
                >
                  Fråga en tekniker
                </Link>
              </div>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-[0_20px_60px_rgba(0,0,0,0.08)] min-h-[520px] sm:min-h-[560px] flex flex-col">
            <div className="relative h-48 sm:h-56 lg:h-64">
              <img
                src="/products/newpc/allwhite-1.jpg"
                alt="Custom byggda datorer"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <p className="absolute bottom-4 left-6 text-xs uppercase tracking-[0.4em] text-yellow-400">Custom bygg</p>
            </div>
            <div className="p-6 lg:p-8 flex flex-col gap-4 flex-1">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold">Byggd för din vardag och din gaming</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Välj komponenter, stil och budget. Vi bygger, testar och levererar en dator som är helt anpassad
                efter dig.
              </p>
              <div className="grid gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-yellow-400" />
                  Välj prestandanivå, formfaktor och RGB
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-yellow-400" />
                  Optimerade för gaming, kreativt arbete eller AI
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-yellow-400" />
                  Trygg leverans med test och verifiering
                </div>
              </div>
              <div className="mt-auto flex flex-col sm:flex-row gap-3">
                <Link
                  to={withUtm("/custom-bygg", {
                    utm_source: "homepage",
                    utm_medium: "promo_card",
                    utm_campaign: "custom_bygg",
                    utm_content: buildUtmContent("custom-bygg"),
                  })}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:text-white transition-colors"
                >
                  Gå till custom bygg
                </Link>
                <Link
                  to={withUtm("/products", {
                    utm_source: "homepage",
                    utm_medium: "promo_card",
                    utm_campaign: "custom_bygg",
                    utm_content: buildUtmContent("produkter"),
                  })}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-yellow-400 text-gray-900 dark:text-yellow-300 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:border-[#11667b] hover:text-white transition-colors"
                >
                  Se färdiga datorer
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};
