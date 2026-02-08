import { ChevronLeft, ChevronRight, Hammer, HelpCircle, Monitor, Package, Rocket, Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMemo, useRef, useState } from "react";
import { COMPUTERS } from "@/data/computers";
import { useProducts } from "@/hooks/useProducts";
import { buildProductLookup, getProductFromLookup, mergeProductFields } from "@/lib/productOverrides";
import { buildUtmContent, withUtm } from "@/lib/utm";
import winMouseImage from "../../images/WinMouse.png";

const FALLBACK_IMAGE = "https://placehold.co/800x600?text=Gaming+PC";

const categories = [
  { name: "Hjälp mig välja", icon: HelpCircle, kind: "quiz" as const },
  { name: "Alla produkter", icon: Monitor, href: "/products?clear_filters=1" },
  { name: "Paket", icon: Package, href: "/products?category=paket&clear_filters=1" },
  { name: "Budgetvänlig", icon: Wallet, href: "/products?preset=budget" },
  { name: "Custom Bygg", icon: Hammer, href: "/custom-bygg" },
  { name: "Bästa Prestanda", icon: Rocket, href: "/products?preset=toptier" },
];

export const Hero = () => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [showQuiz, setShowQuiz] = useState(false);
  const [budgetChoice, setBudgetChoice] = useState("starter");
  const { products } = useProducts();
  const productLookup = useMemo(() => buildProductLookup(products), [products]);
  const featuredComputers = useMemo(
    () =>
      COMPUTERS.slice(0, 6).map((computer) => {
        const product =
          getProductFromLookup(productLookup, computer.name) ||
          getProductFromLookup(productLookup, computer.id);
        const merged = mergeProductFields(
          {
            name: computer.name,
            price: computer.price,
            cpu: computer.cpu,
            gpu: computer.gpu,
            ram: computer.ram,
            storage: computer.storage,
            storagetype: computer.storagetype,
            tier: computer.tier,
          },
          product,
        );
        return {
          ...computer,
          name: merged.name,
          price: merged.price,
          cpu: merged.cpu,
          gpu: merged.gpu,
          ram: merged.ram,
          storage: merged.storage,
          storagetype: merged.storagetype,
          tier: merged.tier,
        };
      }),
    [productLookup],
  );

  const scrollByCards = (direction: "left" | "right") => {
    const container = carouselRef.current;
    if (!container) return;
    const cardWidth = 384 + 16; // w-96 + gap
    container.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  return (
    <section className="bg-white dark:bg-background transition-colors">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Hero Banners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-yellow-400 rounded-lg p-4 sm:p-6 lg:p-8 flex flex-col justify-between min-h-[230px] sm:min-h-[320px] col-span-1 md:col-span-2 shadow-lg border border-yellow-500">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">Företagsdeal</h2>
              <p className="text-sm sm:text-base text-gray-900 font-semibold mb-4 flex items-center gap-2">{"Elektronik för företag"} <ChevronRight className="inline w-5 h-5" /></p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800 rounded-lg h-28 sm:h-36 flex items-center justify-between overflow-hidden border border-yellow-500/40 dark:border-gray-700 px-4 sm:px-6">
              <div className="relative z-10">
                <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold">Spara upp till 20%</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">{"På utvalda gamingdatorer hela veckan"}</p>
              </div>
              <img
                src="/images/foretagsdeal.webp"
                alt="Gamingdator för företagsdeal"
                className="h-[88%] w-auto max-w-[42%] sm:max-w-[40%] md:max-w-[38%] object-contain object-right drop-shadow-[0_16px_28px_rgba(0,0,0,0.25)]"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 sm:p-6 lg:p-8 flex flex-col justify-between min-h-[220px] sm:min-h-[320px] relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Veckans Deal - Få en gåva vid köpet!
              </h2>
              <p className="text-white text-sm mb-4">{"Få en exklusiv gåva när du handlar hos oss."}</p>
              <p className="text-yellow-400 text-sm font-semibold">{"Musmatta, tangentbord eller en mus!"}</p>
            </div>
            <div className="flex gap-2 relative z-10">
              <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded text-sm font-bold">Gåva vid köp</span>
            </div>
            <img
              src={winMouseImage}
              alt="Gåva vid köp"
              className="pointer-events-none absolute -right-6 -bottom-8 w-40 sm:w-48 md:w-56 opacity-90 drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)]"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {/* Popular categories section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{"Populära kategorier"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {categories.map((category) =>
              category.kind === "quiz" ? (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => setShowQuiz((prev) => !prev)}
                  className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 text-center hover:shadow-lg hover:border-[#11667b] transition-all dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:hover:border-[#11667b] dark:hover:bg-gray-800"
                >
                  <category.icon className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-yellow-500 mb-3" aria-hidden />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{category.name}</p>
                </button>
              ) : (
                <Link
                  key={category.name}
                  to={withUtm(category.href, {
                    utm_source: "homepage",
                    utm_medium: "category_card",
                    utm_campaign: "populara_kategorier",
                    utm_content: buildUtmContent(category.name),
                  })}
                  className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 text-center hover:shadow-lg hover:border-[#11667b] transition-all dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:hover:border-[#11667b] dark:hover:bg-gray-800"
                >
                  <category.icon className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-yellow-500 mb-3" aria-hidden />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{category.name}</p>
                </Link>
              )
            )}
          </div>
          {showQuiz && (
            <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{"Hjälp mig välja"}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {"Besvara två frågor så föreslår vi rätt kategori direkt."}
                  </p>
                </div>
                <button type="button" onClick={() => setShowQuiz(false)} className="text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">{"Stäng"}</button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-1">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-100" htmlFor="quiz-budget">
                    Budget
                  </label>
                  <select
                    id="quiz-budget"
                    value={budgetChoice}
                    onChange={(e) => setBudgetChoice(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-4 py-2 text-sm"
                  >
                    <option value="starter">7 500 - 12 500 kr</option>
                    <option value="mid">13 500 - 21 000 kr</option>
                    <option value="high">24 000 - 40 000 kr</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const budgetRanges: Record<string, [number, number]> = {
                      starter: [7500, 12500],
                      mid: [13500, 21000],
                      high: [24000, 40000],
                    };
                    const [minPrice, maxPrice] = budgetRanges[budgetChoice] || budgetRanges.starter;
                    const params = new URLSearchParams({
                      price_min: String(minPrice),
                      price_max: String(maxPrice),
                    });
                    const recommendation = params.toString();
                    navigate(
                      withUtm(`/products?${recommendation}`, {
                        utm_source: "homepage",
                        utm_medium: "quiz",
                        utm_campaign: "help_me_choose",
                        utm_content: budgetChoice,
                      })
                    );
                    setShowQuiz(false);
                  }}
                  className="bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:text-white transition-colors"
                >
                  Visa rekommenderade datorer
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      withUtm("/products?clear_filters=1", {
                        utm_source: "homepage",
                        utm_medium: "quiz",
                        utm_campaign: "help_me_choose",
                        utm_content: "alla-produkter",
                      })
                    )
                  }
                  className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold px-6 py-3 rounded-lg hover:border-[#11667b] hover:text-[#11667b] transition-colors"
                >
                  Se alla produkter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Featured Products Section */}
        <div className="mb-12 relative">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Senast visade produkter</h3>
          <div className="relative">
            <div ref={carouselRef} className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4 pr-4 snap-x snap-mandatory">
              {featuredComputers.map((computer) => (
                <Link
                  key={computer.id}
                  to={`/computer/${computer.id}`}
                  className="flex-shrink-0 w-72 sm:w-80 md:w-96 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-[#11667b] transition-all dark:bg-gray-900 dark:border-gray-700 dark:hover:border-[#11667b] snap-start"
                >
                  <div className="h-44 sm:h-52 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <img
                      src={computer.image}
                      alt={computer.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 hover:text-[#11667b] dark:hover:text-[#11667b]">
                      {computer.name}
                    </h4>
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1 mb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                      <p className="line-clamp-2">{computer.cpu}</p>
                      <p className="line-clamp-2">{computer.gpu}</p>
                      <p className="line-clamp-2">{computer.ram}</p>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {computer.price.toLocaleString("sv-SE")} kr
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">I lager</p>
                  </div>
                </Link>
              ))}
            </div>
            <button
              onClick={() => scrollByCards("left")}
              className="hidden md:flex items-center justify-center absolute -left-14 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-2 shadow hover:bg-gray-100 transition-colors dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-gray-100" />
            </button>
            <button
              onClick={() => scrollByCards("right")}
              className="hidden md:flex items-center justify-center absolute -right-14 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-2 shadow hover:bg-gray-100 transition-colors dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6 text-gray-900 dark:text-gray-100" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
