import { BadgePercent, ChevronLeft, ChevronRight, Hammer, Monitor, Rocket, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useRef } from "react";
import { COMPUTERS } from "@/data/computers";
import { useProducts } from "@/hooks/useProducts";
import { buildProductLookup, getProductFromLookup, mergeProductFields } from "@/lib/productOverrides";
import { resolveProductImage } from "@/lib/productImageResolver";
import { buildUtmContent, withUtm } from "@/lib/utm";
import winMouseImage from "../../images/WinMouse.png";

const FALLBACK_IMAGE = "/Datorhuset.png";

const categories = [
  { name: "Alla produkter", icon: Monitor, href: "/products?clear_filters=1" },
  { name: "Budgetv\u00e4nliga", icon: Wallet, href: "/products?category=budget&clear_filters=1" },
  { name: "Price-Performance", icon: BadgePercent, href: "/products?category=price-performance&clear_filters=1" },
  { name: "Custom Bygg", icon: Hammer, href: "/custom-bygg" },
  { name: "B\u00e4sta prestanda", icon: Rocket, href: "/products?category=toptier&clear_filters=1" },
];

export const Hero = () => {
  const carouselRef = useRef<HTMLDivElement>(null);
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
        const image = resolveProductImage(product, computer.image) || FALLBACK_IMAGE;
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
          image,
        };
      }),
    [productLookup],
  );

  const scrollByCards = (direction: "left" | "right") => {
    const container = carouselRef.current;
    if (!container) return;
    const cardWidth = 384 + 16;
    container.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  return (
    <section className="bg-white dark:bg-background transition-colors">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-yellow-400 rounded-lg p-4 sm:p-6 lg:p-8 flex flex-col justify-between min-h-[230px] sm:min-h-[320px] col-span-1 md:col-span-2 shadow-lg border border-yellow-500">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">Veckansbygg!</h2>
              <p className="text-sm sm:text-base text-gray-900 font-semibold mb-4 flex items-center gap-2">
                {"Elektronik f\u00f6r f\u00f6retag"} <ChevronRight className="inline w-5 h-5" />
              </p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800 rounded-lg h-28 sm:h-36 flex items-center justify-between overflow-hidden border border-yellow-500/40 dark:border-gray-700 px-4 sm:px-6">
              <div className="relative z-10 pr-3">
                <p className="text-sm uppercase tracking-[0.18em] text-gray-600 dark:text-gray-300">Nyhet!</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{"Platina Curver är nu i lager!"}</p>
              </div>
              <img
                src="/images/foretagsdeal.webp"
                alt="Gamingdator f\u00f6r f\u00f6retagsdeal"
                className="h-[88%] w-auto max-w-[42%] sm:max-w-[40%] md:max-w-[38%] object-contain object-right drop-shadow-[0_16px_28px_rgba(0,0,0,0.25)]"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 sm:p-6 lg:p-8 flex flex-col justify-between min-h-[220px] sm:min-h-[320px] relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {"Veckans Deal - F\u00e5 en g\u00e5va vid k\u00f6pet!"}
              </h2>
              <p className="text-white text-sm mb-4">{"F\u00e5 en exklusiv g\u00e5va n\u00e4r du handlar hos oss."}</p>
              <p className="text-yellow-400 text-sm font-semibold">Musmatta, tangentbord, mus eller uppgraderade komponenter!</p>
            </div>
            <div className="flex gap-2 relative z-10">
              <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded text-sm font-bold">{"G\u00e5va vid k\u00f6p"}</span>
            </div>
            <img
              src={winMouseImage}
              alt={"G\u00e5va vid k\u00f6p"}
              className="pointer-events-none absolute -right-6 -bottom-8 w-40 sm:w-48 md:w-56 opacity-90 drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)]"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{"Popul\u00e4ra kategorier"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
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
            ))}
          </div>
        </div>

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
