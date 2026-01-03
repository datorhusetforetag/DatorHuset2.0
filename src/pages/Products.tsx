import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
import { Headphones, Keyboard, Monitor, Mouse } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { COMPUTERS } from "@/data/computers";

const FALLBACK_IMAGE = "https://placehold.co/800x600?text=Gaming+PC";
const FILTER_STORAGE_KEY = "datorhuset_filters_v1";

type BannerSticker = {
  label: string;
  className: string;
};

type BannerConfig = {
  eyebrow: string;
  title: string;
  description: string;
  images: string[];
  stickers?: BannerSticker[];
  background: string;
  variant?: "bundle";
  imageSize?: "normal" | "large";
};

const DEFAULT_BANNER: BannerConfig = {
  eyebrow: "Topplistan",
  title: "B\u00e4sta s\u00e4ljare inom station\u00e4ra datorer i hela Norden!",
  description: "Utvalda byggen som levererar prestanda, design och trygg service.",
  images: [
    "/products/Horizon_Pro_Hero_wEliteComponents_2000x.webp",
    "/products/Horizon3_Elite_Hero_2000x.webp",
    "/products/Voyager_Hero_NoGeforce_2000x.webp",
  ],
  background:
    "bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 dark:bg-[#0F1824] dark:[background-image:none]",
  imageSize: "large",
};

const CATEGORY_BANNERS: Record<string, BannerConfig> = {
  budget: {
    eyebrow: "Budgetv\u00e4nligt",
    title: "Budget betyder inte d\u00e5ligt",
    description: "Smarta val som h\u00e5ller priset nere utan att tumma p\u00e5 k\u00e4nslan.",
    images: ["/products/NavBase_Hero_Colorswap_2000x.webp"],
    stickers: [
      {
        label: "B\u00e4st i budget-klass",
        className: "bg-yellow-400 text-gray-900",
      },
    ],
    background:
      "bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 dark:bg-[#0F1824] dark:[background-image:none]",
  },
  paket: {
    eyebrow: "Paket",
    title: "Allt du beh\u00f6ver, redo att k\u00f6ra",
    description: "Kompletta paket med dator, sk\u00e4rm och tillbeh\u00f6r i ett och samma k\u00f6p.",
    images: ["/products/Horizon3_Elite_Hero_2000x.webp"],
    background:
      "bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 dark:bg-[#0F1824] dark:[background-image:none]",
    variant: "bundle",
  },
  "best-selling": {
    eyebrow: "Mest f\u00f6r pengarna",
    title: "Mest f\u00f6r pengarna",
    description: "V\u00e5ra mest prisv\u00e4rda byggen \u2013 noggrant utvalda f\u00f6r maximal valuta.",
    images: [
      "/products/Horizon_Pro_Hero_wEliteComponents_2000x.webp",
      "/products/Traveler_Hero_1_2000x.webp",
      "/products/Voyager_Hero_NoGeforce_2000x.webp",
    ],
    stickers: [
      {
        label: "DatorHusets val",
        className: "bg-red-500 text-white",
      },
      {
        label: "Mest valuta",
        className: "bg-sky-500 text-white",
      },
      {
        label: "Otrolig Prestanda",
        className: "bg-orange-500 text-white",
      },
    ],
    background:
      "bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 dark:bg-[#0F1824] dark:[background-image:none]",
  },
  toptier: {
    eyebrow: "B\u00e4sta prestanda",
    title: "N\u00e4r bara det snabbaste duger",
    description: "Toppbyggen f\u00f6r dig som vill ha maximal kraft och kompromissl\u00f6s kvalitet.",
    images: [
      "/products/Voy_Red_Hero_2000x.webp",
      "/products/Voyager_Hero_NoGeforce_2000x_2.webp",
    ],
    stickers: [
      {
        label: "B\u00e4st i Klass",
        className: "bg-yellow-400 text-gray-900",
      },
      {
        label: "Topline",
        className: "bg-[#11667b] text-white",
      },
    ],
    background:
      "bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 dark:bg-[#0F1824] dark:[background-image:none]",
    imageSize: "large",
  },
};

const bundleItems = [
  { label: "Sk\u00e4rm", icon: Monitor },
  { label: "Tangentbord", icon: Keyboard },
  { label: "Mus", icon: Mouse },
  { label: "Headset", icon: Headphones },
];

export default function Products() {
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category")?.toLowerCase() || "";
  const hasAppliedCategory = useRef(false);
  const [priceRange, setPriceRange] = useState([0, 30000]);
  const [selectedGPUs, setSelectedGPUs] = useState<string[]>([]);
  const [selectedCPUs, setSelectedCPUs] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as {
        priceRange?: number[];
        selectedGPUs?: string[];
        selectedCPUs?: string[];
        selectedTiers?: string[];
      };
      if (Array.isArray(parsed.priceRange) && parsed.priceRange.length === 2) {
        setPriceRange([parsed.priceRange[0], parsed.priceRange[1]]);
      }
      if (Array.isArray(parsed.selectedGPUs)) {
        setSelectedGPUs(parsed.selectedGPUs);
      }
      if (Array.isArray(parsed.selectedCPUs)) {
        setSelectedCPUs(parsed.selectedCPUs);
      }
      if (Array.isArray(parsed.selectedTiers)) {
        setSelectedTiers(parsed.selectedTiers);
      }
    } catch (error) {
      console.warn("Failed to read saved filters", error);
    }
  }, []);

  useEffect(() => {
    if (!activeCategory || hasAppliedCategory.current) return;
    if (activeCategory === "budget") {
      setPriceRange([0, 6000]);
    }
    hasAppliedCategory.current = true;
  }, [activeCategory]);

  useEffect(() => {
    const payload = {
      priceRange,
      selectedGPUs,
      selectedCPUs,
      selectedTiers,
    };
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(payload));
  }, [priceRange, selectedGPUs, selectedCPUs, selectedTiers]);

  const gpus = Array.from(new Set(COMPUTERS.map((c) => c.gpu)));
  const cpus = Array.from(new Set(COMPUTERS.map((c) => c.cpu)));
  const tiers = Array.from(new Set(COMPUTERS.map((c) => c.tier)));

  const filteredProducts = useMemo(() => {
    return COMPUTERS.filter((computer) => {
      const categoryMatch = (() => {
        if (!activeCategory) return true;
        if (activeCategory === "budget") {
          return computer.price <= 6000 || computer.classLabels?.includes("Budget PC's");
        }
          if (activeCategory === "best-selling") {
            return computer.classLabels?.includes("Best-Selling PC's");
          }
          if (activeCategory === "toptier") {
            return computer.classLabels?.includes("Toptier PC's");
          }
        if (activeCategory === "paket") {
          return computer.classLabels?.includes("Paket PC's");
        }
        return true;
      })();

      const withinPrice = computer.price >= priceRange[0] && computer.price <= priceRange[1];
      const gpuMatch = selectedGPUs.length === 0 || selectedGPUs.includes(computer.gpu);
      const cpuMatch = selectedCPUs.length === 0 || selectedCPUs.includes(computer.cpu);
      const tierMatch = selectedTiers.length === 0 || selectedTiers.includes(computer.tier);

      return categoryMatch && withinPrice && gpuMatch && cpuMatch && tierMatch;
    });
  }, [activeCategory, priceRange, selectedGPUs, selectedCPUs, selectedTiers]);

  const toggleFilter = (value: string, selected: string[], setSelected: (v: string[]) => void) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const clearFilters = () => {
    setPriceRange([0, 30000]);
    setSelectedGPUs([]);
    setSelectedCPUs([]);
    setSelectedTiers([]);
  };

  const categoryLabel = (() => {
    if (activeCategory === "budget") return "Budgetv\u00e4nlig";
    if (activeCategory === "best-selling") return "Mest f\u00f6r pengarna";
    if (activeCategory === "toptier") return "B\u00e4sta prestanda";
    if (activeCategory === "paket") return "Paket";
    return "";
  })();

  const activeFilters: string[] = [];
  if (categoryLabel) activeFilters.push(categoryLabel);
  if (priceRange[0] !== 0 || priceRange[1] !== 30000) {
    activeFilters.push(`Pris: ${priceRange[0].toLocaleString("sv-SE")} - ${priceRange[1].toLocaleString("sv-SE")} kr`);
  }
  selectedGPUs.forEach((gpu) => activeFilters.push(`GPU: ${gpu}`));
  selectedCPUs.forEach((cpu) => activeFilters.push(`CPU: ${cpu}`));
  selectedTiers.forEach((tier) => activeFilters.push(`Kategori: ${tier}`));
  const hasFilters = activeFilters.length > 0;

  const banner = CATEGORY_BANNERS[activeCategory] ?? DEFAULT_BANNER;
  const hasMultipleImages = banner.images.length > 1;
  const bannerImageSize = banner.imageSize ?? "normal";
  const imageMaxWidth =
    bannerImageSize === "large" ? "sm:max-w-[600px] lg:max-w-[640px]" : "sm:max-w-[520px] lg:max-w-[560px]";
  const imageAspect = hasMultipleImages ? "aspect-[16/10] sm:aspect-[16/9]" : "aspect-[16/9]";
  const imageGridColumns = banner.images.length >= 3 ? "grid-cols-3" : "grid-cols-2";
  const imageGridClass = hasMultipleImages
    ? `grid ${imageGridColumns} gap-2 sm:gap-3 w-full max-w-full ${imageMaxWidth} ml-auto`
    : `grid grid-cols-1 w-full max-w-full ${imageMaxWidth} ml-auto`;
  const imageItemClass = "w-full";

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0F1824] dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="px-4 pt-16 sm:pt-20 lg:pt-24 pb-6">
          <div className="container mx-auto">
            <div className="rounded-3xl border border-gray-200 dark:border-[#1a2636] bg-[#facc15] overflow-hidden">
              <div className="grid gap-6 sm:gap-8 lg:gap-10 md:grid-cols-[1.25fr_0.75fr] lg:grid-cols-[1.35fr_0.65fr] p-5 sm:p-6 lg:p-10 items-start">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-900/70">
                    {banner.eyebrow}
                  </p>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-4 leading-tight text-gray-900 break-words">
                    {banner.title}
                  </h1>
                  <p className="text-sm md:text-base text-gray-800 mt-4 max-w-xl break-words">
                    {banner.description}
                  </p>
                  {banner.variant === "bundle" ? (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {bundleItems.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-2 rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 text-xs dark:bg-[#0b131f] dark:text-slate-200 dark:border-[#1a2636]"
                        >
                          <item.icon className="w-4 h-4 text-yellow-500 dark:text-yellow-300" />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className={imageGridClass}>
                    {banner.images.map((image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className={`relative w-full ${imageAspect} ${imageItemClass} rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 dark:border-[#1a2636] dark:bg-[#0b131f]`}
                      >
                        <img
                          src={image}
                          alt={`Bannerbild ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {banner.stickers?.[index] ? (
                          <span
                            className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
                              banner.stickers[index].className
                            }`}
                          >
                            {banner.stickers[index].label}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:hidden mt-4 sm:mt-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:border-[#11667b] hover:text-[#11667b] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
            >
              Filter
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {mobileFiltersOpen ? "D\u00f6lj" : "Visa"}
              </span>
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-[#11667b] hover:text-[#0d4d5d]"
              >
                Rensa filter
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 mt-4 sm:mt-6 pt-6 sm:pt-8 border-t border-gray-200 dark:border-[#1a2636] gap-6">
          <div
            className={`w-full lg:max-w-xs bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 lg:border-r lg:border-y-0 lg:border-l-0 rounded-2xl lg:rounded-none p-5 sm:p-6 space-y-8 h-fit lg:sticky lg:top-24 ${
              mobileFiltersOpen ? "block" : "hidden"
            } lg:block`}
          >
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Filter</h2>

              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Pris</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="30000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-yellow-400"
                  />
                  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span>{priceRange[0].toLocaleString("sv-SE")} kr</span>
                    <span>{priceRange[1].toLocaleString("sv-SE")} kr</span>
                  </div>
                </div>
              </div>

              <hr className="my-6 border-gray-200 dark:border-gray-800" />

              <div className="mb-8 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Grafikkort</h3>
                {gpus.map((gpu) => (
                  <label key={gpu} className="flex items-center cursor-pointer gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedGPUs.includes(gpu)}
                      onChange={() => toggleFilter(gpu, selectedGPUs, setSelectedGPUs)}
                      className="w-4 h-4 text-yellow-400 rounded border-gray-300 dark:border-gray-700"
                    />
                    <span>{gpu}</span>
                  </label>
                ))}
              </div>

              <hr className="my-6 border-gray-200 dark:border-gray-800" />

              <div className="mb-8 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Processor</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {cpus.map((cpu) => (
                    <label key={cpu} className="flex items-center cursor-pointer gap-3 text-sm text-gray-700 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={selectedCPUs.includes(cpu)}
                        onChange={() => toggleFilter(cpu, selectedCPUs, setSelectedCPUs)}
                        className="w-4 h-4 text-yellow-400 rounded border-gray-300 dark:border-gray-700"
                      />
                      <span>{cpu}</span>
                    </label>
                  ))}
                </div>
              </div>

              <hr className="my-6 border-gray-200 dark:border-gray-800" />

              <div className="mb-8 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Kategori</h3>
                {tiers.map((tier) => (
                  <label key={tier} className="flex items-center cursor-pointer gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedTiers.includes(tier)}
                      onChange={() => toggleFilter(tier, selectedTiers, setSelectedTiers)}
                      className="w-4 h-4 text-yellow-400 rounded border-gray-300 dark:border-gray-700"
                    />
                    <span className="capitalize">{tier}</span>
                  </label>
                ))}
              </div>

              <button
                onClick={clearFilters}
                className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded font-medium transition-colors dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100"
              >
                Rensa filter
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6 lg:p-10 bg-white dark:bg-[#0f1824]">
            {hasFilters && (
              <div className="sticky top-24 z-10 mb-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#0f1824]/95 backdrop-blur px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Aktiva filter:</span>
                  {activeFilters.map((filter) => (
                    <span
                      key={filter}
                      className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200"
                    >
                      {filter}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-semibold text-[#11667b] hover:text-[#0d4d5d]"
                  >
                    Rensa filter
                  </button>
                </div>
              </div>
            )}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{"Station\u00e4ra datorer"}</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Visar {filteredProducts.length} av {COMPUTERS.length} produkter
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Inga datorer hittades</p>
                  <p className="text-gray-600 dark:text-gray-300">Prova att justera dina filter</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((computer) => (
                  <Link key={computer.id} to={`/computer/${computer.id}`} className="group">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all min-h-[520px]">
                      <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 h-72 sm:h-80 flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 dark:group-hover:from-gray-700 dark:group-hover:to-gray-800 transition-colors">
                        <img
                          src={computer.image}
                          alt={computer.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                      </div>

                      <div className="p-4 pb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                          {computer.name}
                        </h3>

                        <div className="flex items-center mb-3">
                          <div className="flex items-center text-yellow-400" aria-hidden>
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star key={index} className="w-4 h-4 fill-current" />
                            ))}
                          </div>
                          <span className="ml-2 text-xs text-gray-600 dark:text-gray-300">({computer.reviews})</span>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                          <p className="truncate">CPU: {computer.cpu}</p>
                          <p className="truncate">GPU: {computer.gpu}</p>
                          <p className="truncate">RAM: {computer.ram}</p>
                          <p className="truncate">
                            Lagring: {computer.storage} {computer.storagetype}
                          </p>
                        </div>

                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {computer.price.toLocaleString("sv-SE")} kr
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
