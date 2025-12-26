import { ChevronLeft, ChevronRight, Flame, HelpCircle, Monitor, Package, Rocket, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";
import { COMPUTERS } from "@/data/computers";

const FEATURED_COMPUTERS = COMPUTERS.slice(0, 6);
const FALLBACK_IMAGE = "https://placehold.co/800x600?text=Gaming+PC";

const categories = [
  { name: "Hjälp mig välja", icon: HelpCircle, href: "/products" },
  { name: "Alla produkter", icon: Monitor, href: "/products" },
  { name: "Paket", icon: Package, href: "/products?category=paket" },
  { name: "Budgetvänlig", icon: Wallet, href: "/products?category=budget" },
  { name: "Mest för pengarna", icon: Flame, href: "/products?category=best-selling" },
  { name: "Bästa Prestanda", icon: Rocket, href: "/products?category=toptier" },
];

export const Hero = () => {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollByCards = (direction: "left" | "right") => {
    const container = carouselRef.current;
    if (!container) return;
    const cardWidth = 384 + 16; // w-96 + gap
    container.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  return (
    <section className="bg-white dark:bg-background transition-colors">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Banners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-yellow-400 rounded-lg p-8 flex flex-col justify-between min-h-64 col-span-1 md:col-span-2 shadow-lg border border-yellow-500">
            <div>
              <h2 className="text-5xl font-bold text-gray-900 mb-4">Veckans Deal</h2>
              <p className="text-lg text-gray-900 font-semibold mb-6 flex items-center gap-2">
                Elektronik för företag <ChevronRight className="inline w-5 h-5" />
              </p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800 rounded-lg h-40 flex items-center justify-between overflow-hidden border border-yellow-500/40 dark:border-gray-700 px-6">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold">Spara upp till 20%</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">På utvalda gamingdatorer hela veckan</p>
              </div>
              <img
                src="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80"
                alt="Veckans deal"
                className="h-full w-48 object-cover rounded-lg shadow"
                loading="lazy"
              />
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-8 flex flex-col justify-between min-h-64">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">GE GLÄDJE</h2>
              <p className="text-white text-sm mb-4">Få chans till en tackgåva!</p>
              <p className="text-yellow-400 text-sm font-semibold">Allt stöd går till Min Stora Dag</p>
            </div>
            <div className="flex gap-2">
              <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded text-sm font-bold">Julklapp</span>
            </div>
          </div>
        </div>

        {/* Popular categories section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Populära kategorier</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.href}
                className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg hover:border-gray-300 transition-all dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:hover:border-[#11667b] dark:hover:bg-gray-800"
              >
                <category.icon className="w-10 h-10 mx-auto text-yellow-500 mb-3" aria-hidden />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{category.name}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Products Section */}
        <div className="mb-12 relative">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Senast visade produkter</h3>
          <div className="relative">
            <div ref={carouselRef} className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4 pr-4">
              {FEATURED_COMPUTERS.map((computer) => (
                <Link
                  key={computer.id}
                  to={`/computer/${computer.id}`}
                  className="flex-shrink-0 w-96 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all dark:bg-gray-900 dark:border-gray-700 dark:hover:border-gray-500"
                >
                  <div className="h-56 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <img
                      src={computer.image}
                      alt={computer.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-300">
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
