import { ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";

const FEATURED_COMPUTERS = [
  {
    id: '1',
    name: 'Komplett-PC Epic Gaming a340 RGB - RTX 5080 Edition',
    specs: 'Windows 11 Home, Geforce RTX 5080, Ryzen 7 9800X3D, 32GB DDR5, 2TB SSD',
    price: 31999,
    originalPrice: null,
    availability: 'Preliminär sändningsklar 4 februari 202...'
  },
  {
    id: '2',
    name: 'Komplett-PC Advanced Gaming a165 RGB',
    specs: 'Windows 11 Home, Geforce RTX 5060 Ti 16GB, Ryzen 7 9700X, 16GB DDR5, 2TB SSD',
    price: 17999,
    originalPrice: null,
    availability: 'Preliminär sändningsklar 14 januari 202...'
  },
  {
    id: '3',
    name: 'Komplett-PC Epic Gaming i230 RGB',
    specs: 'Windows 11 Home, Geforce RTX 5070, Core Ultra 7 265KF, 32GB DDR5, 2TB SSD',
    price: 23199,
    originalPrice: null,
    availability: 'Inte i lager.'
  },
  {
    id: '4',
    name: 'Komplett-PC Epic Gaming a385 RGB',
    specs: 'Windows 11 Home, Geforce RTX 5090, Ryzen 9 9950X3D, 64GB DDR5, 4TB SSD',
    price: 51199,
    originalPrice: null,
    availability: '68 st i lager, produktionstid 23-24...'
  },
  {
    id: '5',
    name: 'Komplett-PC Epic Gaming RGB - RTX 5090 Edition',
    specs: 'Windows 11 Home, Geforce RTX 5090, i9-14900KF, 32GB DDR5, 2TB SSD',
    price: 46399,
    originalPrice: null,
    availability: 'Preliminär sändningsklar 13 jan...'
  }
];

const categories = [
  { name: "Hjälp mig välja", icon: "🧭" },
  { name: "Alla produkter", icon: "🖥️" },
  { name: "Paket", icon: "📦" },
  { name: "RGB & Stil", icon: "✨" },
  { name: "Föräldrarnas val", icon: "👍" },
  { name: "Budgetvänlig", icon: "💳" },
  { name: "Mest för pengarna", icon: "🔥" },
  { name: "Bästa prestanda", icon: "🚀" },
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
    <section className="bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Banners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Yellow banner - Veckans Deal */}
          <div className="bg-yellow-400 rounded-lg p-8 flex flex-col justify-between min-h-64 col-span-1 md:col-span-2">
            <div>
              <h2 className="text-5xl font-bold text-gray-900 mb-4">Veckans Deal</h2>
              <p className="text-lg text-gray-900 font-semibold mb-6">Elektronik för företag <ChevronRight className="inline w-5 h-5" /></p>
            </div>
            <div className="bg-gray-200 rounded-lg h-40 flex items-center justify-center">
              <span className="text-gray-500">Bannerbilder här</span>
            </div>
          </div>

          {/* Black banner - GE GLÄDJE */}
          <div className="bg-gray-900 rounded-lg p-8 flex flex-col justify-between min-h-64">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">GE GLÄDJE</h2>
              <p className="text-white text-sm mb-4">Få chans till en tackgåva!</p>
              <p className="text-yellow-400 text-sm font-semibold">Allt stöd går till Min Stora Dag</p>
            </div>
            <div className="flex gap-2">
              <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded text-sm font-bold">🎁</span>
            </div>
          </div>
        </div>

        {/* Popular categories section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Populära kategorier</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                to="/products"
                className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg hover:border-gray-300 transition-all"
              >
                <div className="text-4xl mb-3" aria-hidden>{category.icon}</div>
                <p className="text-sm font-medium text-gray-900 line-clamp-2">{category.name}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Products Section */}
        <div className="mb-12 relative">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Senast visade produkter</h3>
          <div className="overflow-hidden relative">
            <div ref={carouselRef} className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4">
              {FEATURED_COMPUTERS.map((computer) => (
                <Link
                  key={computer.id}
                  to={`/computer/${computer.id}`}
                  className="flex-shrink-0 w-96 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  {/* Product image area */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-56 flex items-center justify-center hover:from-gray-200 hover:to-gray-300 transition-colors">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-gray-400">PC</div>
                    </div>
                  </div>

                  {/* Product info */}
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                      {computer.name}
                    </h4>

                    {/* Specs */}
                    <div className="text-xs text-gray-600 space-y-1 mb-4 border-t border-gray-100 pt-3">
                      <p className="line-clamp-2">{computer.specs}</p>
                    </div>

                    {/* Price and availability */}
                    <div className="border-t border-gray-100 pt-3">
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        {computer.price.toLocaleString('sv-SE')}:-
                      </div>
                      <p className="text-xs text-gray-600">{computer.availability}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <button
              onClick={() => scrollByCards("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white border border-gray-200 rounded-full p-2 shadow hover:bg-gray-100 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
            <button
              onClick={() => scrollByCards("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white border border-gray-200 rounded-full p-2 shadow hover:bg-gray-100 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6 text-gray-900" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
