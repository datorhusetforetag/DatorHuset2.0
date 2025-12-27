import { ChevronLeft, ChevronRight, Hammer, HelpCircle, Monitor, Package, Rocket, Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { COMPUTERS } from "@/data/computers";

const FEATURED_COMPUTERS = COMPUTERS.slice(0, 6);
const FALLBACK_IMAGE = "https://placehold.co/800x600?text=Gaming+PC";

const categories = [
  { name: "Hj\u00e4lp mig v\u00e4lja", icon: HelpCircle, kind: "quiz" as const },
  { name: "Alla produkter", icon: Monitor, href: "/products" },
  { name: "Paket", icon: Package, href: "/products?category=paket" },
  { name: "Budgetv\u00e4nlig", icon: Wallet, href: "/products?category=budget" },
  { name: "Custom Bygg", icon: Hammer, href: "/custom-bygg" },
  { name: "B\u00e4sta Prestanda", icon: Rocket, href: "/products?category=toptier" },
];

export const Hero = () => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [showQuiz, setShowQuiz] = useState(false);
  const [budgetChoice, setBudgetChoice] = useState("low");
  const [performanceNeed, setPerformanceNeed] = useState("balanced");

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
              <p className="text-lg text-gray-900 font-semibold mb-6 flex items-center gap-2">{"Elektronik f\u00f6r f\u00f6retag"} <ChevronRight className="inline w-5 h-5" /></p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800 rounded-lg h-40 flex items-center justify-between overflow-hidden border border-yellow-500/40 dark:border-gray-700 px-6">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold">Spara upp till 20%</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">{"P\u00e5 utvalda gamingdatorer hela veckan"}</p>
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
              <h2 className="text-3xl font-bold text-white mb-2">{"GE GL\u00c4DJE"}</h2>
              <p className="text-white text-sm mb-4">{"F\u00e5 chans till en tackg\u00e5va!"}</p>
              <p className="text-yellow-400 text-sm font-semibold">{"Allt st\u00f6d g\u00e5r till Min Stora Dag"}</p>
            </div>
            <div className="flex gap-2">
              <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded text-sm font-bold">Julklapp</span>
            </div>
          </div>
        </div>

        {/* Popular categories section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{"Popul\u00e4ra kategorier"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) =>
              category.kind === "quiz" ? (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => setShowQuiz((prev) => !prev)}
                  className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg hover:border-gray-300 transition-all dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:hover:border-[#11667b] dark:hover:bg-gray-800"
                >
                  <category.icon className="w-10 h-10 mx-auto text-yellow-500 mb-3" aria-hidden />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{category.name}</p>
                </button>
              ) : (
                <Link
                  key={category.name}
                  to={category.href}
                  className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg hover:border-gray-300 transition-all dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:hover:border-[#11667b] dark:hover:bg-gray-800"
                >
                  <category.icon className="w-10 h-10 mx-auto text-yellow-500 mb-3" aria-hidden />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{category.name}</p>
                </Link>
              )
            )}
          </div>
          {showQuiz && (
            <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{"Hj\u00e4lp mig v\u00e4lja"}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {"Besvara tv\u00e5 fr\u00e5gor s\u00e5 f\u00f6resl\u00e5r vi r\u00e4tt kategori direkt."}
                  </p>
                </div>
                <button type="button" onClick={() => setShowQuiz(false)} className="text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">{"St\u00e4ng"}</button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                    <option value="low">Under 6 000 kr</option>
                    <option value="mid">6 000 - 12 000 kr</option>
                    <option value="high">12 000+ kr</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-100" htmlFor="quiz-performance">
                    Prestanda
                  </label>
                  <select
                    id="quiz-performance"
                    value={performanceNeed}
                    onChange={(e) => setPerformanceNeed(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-4 py-2 text-sm"
                  >
                    <option value="balanced">{"Balans f\u00f6r vardag & gaming"}</option>
                    <option value="gaming">{"Gaming med h\u00f6ga krav"}</option>
                    <option value="max">Maximal prestanda</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const recommendation =
                      budgetChoice === "low"
                        ? "budget"
                        : performanceNeed === "max" || budgetChoice === "high"
                          ? "toptier"
                          : "best-selling";
                    navigate(`/products?category=${recommendation}`);
                    setShowQuiz(false);
                  }}
                  className="bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:text-white transition-colors"
                >
                  Visa rekommenderade datorer
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/products")}
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
