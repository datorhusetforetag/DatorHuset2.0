import { Link } from "react-router-dom";

export const HomePromoSplit = () => {
  return (
    <section className="bg-white dark:bg-gray-950 transition-colors">
      <div className="container mx-auto px-4 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-900/60">
            <img
              src="/products/Voyager_Hero_NoGeforce_2000x.webp"
              alt="Service och reparation av datorer"
              className="w-full h-56 object-cover"
              loading="lazy"
            />
            <div className="p-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Service & reparation</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vi fixar din dator snabbt</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Felsökning, uppgraderingar och optimering med tydlig offert och snabb återkoppling.
              </p>
              <Link
                to="/service-reparation"
                className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-gray-900 font-semibold px-5 py-2 rounded-lg hover:bg-[#11667b] hover:text-white transition-colors"
              >
                Service & reparation
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-900/60">
            <img
              src="/products/Horizon3_Elite_Hero_2000x.webp"
              alt="Custom byggda datorer"
              className="w-full h-56 object-cover"
              loading="lazy"
            />
            <div className="p-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Custom bygg</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Byggd för dig</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Välj komponenter, prestanda och utseende. Vi bygger, testar och levererar färdig dator.
              </p>
              <Link
                to="/custom-bygg"
                className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-gray-900 font-semibold px-5 py-2 rounded-lg hover:bg-[#11667b] hover:text-white transition-colors"
              >
                Gå till custom bygg
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
