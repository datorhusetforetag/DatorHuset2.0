import { PageShell } from "@/components/PageShell";
import { productPath } from "@/lib/productUrl";
import { PageHero } from "@/components/PageHero";
import { BANNER_ACCENTS, PAGE_BANNERS } from "@/lib/pageBanners";
import { Reveal } from "@/components/Reveal";
import { useState, useMemo, useEffect, useRef, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import { Headphones, Keyboard, Monitor, Mouse } from "lucide-react";
import { SeoHead } from "@/components/SeoHead";
import { COMPUTERS, Computer } from "@/data/computers";
import { getProductArt } from "@/data/productArt";
import { buildReportedFpsSettingsForProductName } from "../../shared/fpsProfiles.js";
import { normalizeProductKey, useProducts, type SupabaseProduct } from "@/hooks/useProducts";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildProductLookup, getProductFromLookup, mergeProductFields } from "@/lib/productOverrides";
import { getAllInventory } from "@/lib/supabaseServices";
import { normalizeProductImagePath } from "@/lib/productImageResolver";
import chieftecVistaBanner from "../../public/products/newpc/chieftecvista_new3.jpg";
import chieftecVisioBanner from "../../public/products/newpc/chieftecvisio_new.png";
import cg530Banner from "../../public/products/newpc/cg530_new4.jpg";
import allBlackBanner from "../../public/products/newpc/allblack-main.jpg";
import allWhiteBanner from "../../public/products/newpc/allwhite-1.jpg";
import budgetCategoryBanner from "../../images/product images/Budget-catagory.webp";
import pricePerformanceCategoryBanner from "../../images/product images/price-performance-banner.webp";
import o11WhiteBanner from "../../images/product images/o11white.webp";
import o11BlackBanner from "../../images/product images/o11black.webp";

const FALLBACK_IMAGE = "https://placehold.co/800x600?text=Gaming+PC";
const FILTER_STORAGE_KEY = "datorhuset_filters_v3";
const DEFAULT_PRODUCTS_PRICE_MAX = 40000;
const RAM_PRICE_TOOLTIP =
  "Priserna p\u00e5 RAM har g\u00e5tt upp med cirka 500%, d\u00e4rav anv\u00e4ndning av begagnade RAM.";
const toUsedName = (name: string) => {
  const trimmed = name.trim();
  const replaced = trimmed.replace(/\s*-\s*Ny$/i, " - Begagnade");
  return replaced === trimmed ? `${trimmed} - Begagnade` : replaced;
};
const FILTER_LABELS = {
  gpu: {
    "ASUS Dual GeForce RTX 3050 6GB OC": "RTX 3050",
    "ASUS Dual Radeon RX 7600 EVO OC": "RX 7600",
    "ASUS Prime Radeon RX 9060 XT OC Edition 8GB": "RX 9060 XT",
    "PNY GeForce RTX 5060 Ti Dual Fan OC": "RTX 5060 Ti",
    "Gigabyte GeForce RTX 5070 WINDFORCE OC 12GB": "RTX 5070",
    "Gigabyte GeForce RTX 5070 WINDFORCE SFF 12GB": "RTX 5070",
    "ASUS PRIME Radeon RX 9070 XT 16GB OC": "RX 9070 XT",
    "Asus Dual GeForce RTX 5070 OC": "RTX 5070",
    "ASUS Prime GeForce RTX 5080 16GB OC": "RTX 5080",
    "INNO3D GeForce RTX 5080 16GB X3 OC White": "RTX 5080",
  },
} as const;
const GPU_ORDER = [
  "RTX 5080",
  "RTX 4090",
  "RTX 4080 SUPER",
  "RTX 4080",
  "RTX 5070",
  "RTX 4070 SUPER",
  "RTX 5060 TI",
  "RTX 4070",
  "RTX 3060",
  "RTX 3050",
  "RX 9070 XT",
  "RX 9060 XT",
  "RX 7600",
];

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
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  background: string;
  variant?: "bundle";
  imageSize?: "normal" | "large";
};

type InventoryEntry = {
  product_id: string;
  quantity_in_stock: number;
  is_preorder?: boolean | null;
  allow_preorder?: boolean | null;
  eta_days?: number | null;
  eta_note?: string | null;
};

type SortKey = "featured" | "price-asc" | "price-desc" | "name";

const SORT_LABELS: Record<SortKey, string> = {
  featured: "Utvalda",
  "price-asc": "Lägst pris",
  "price-desc": "Högst pris",
  name: "Namn A-Ö",
};

/*
 * "Bäst för" på produktkortet.
 *
 * Inte en marknadsföringsetikett utan ett svar räknat ur maskinens egna
 * FPS-värden: den högsta upplösning där Cyberpunk 2077 på High ger
 * minst 60 bilder per sekund. Cyberpunk för att det är det tyngsta
 * spelet i tabellen, High för att det är den nivå folk faktiskt spelar
 * på, 60 för att det är gränsen under vilken det känns trögt.
 *
 * Saknar maskinen profil visas ingen etikett alls. En gissning här hade
 * varit ett prestandapåstående om en produkt.
 */
const RESOLUTION_ORDER = ["4K", "1440p", "1080p"] as const;

const bestForResolution = (productName: string): string | null => {
  const profile = buildReportedFpsSettingsForProductName(productName);
  if (!profile) return null;

  for (const resolution of RESOLUTION_ORDER) {
    const entry = profile.entries.find(
      (item: { game: string; resolution: string; graphics: string; baseFps: number }) =>
        item.game === "Cyberpunk 2077" &&
        item.resolution === resolution &&
        item.graphics === "High",
    );
    if (entry && entry.baseFps >= 60) return resolution;
  }
  return null;
};

const DEFAULT_BANNER: BannerConfig = {
  eyebrow: "Topplistan",
  title: "B\u00e4sta s\u00e4ljare inom station\u00e4ra datorer i hela Norden!",
  description: "Utvalda byggen som levererar prestanda, design och trygg service.",
  images: [chieftecVistaBanner, chieftecVisioBanner, cg530Banner],
  primaryLabel: "Se alla datorer",
  primaryHref: "/products",
  secondaryLabel: "Custom bygg",
  secondaryHref: "/custom-bygg",
  background: "bg-[#facc15]",
  imageSize: "large",
};

/*
 * Kulören på kategoribanderollen.
 *
 * Det är inte fyra nya färger utan exakt de fyra som nivåerna på
 * startsidan använder, och kategorierna länkar redan till samma
 * nivåer. Klickar man sig från Bronze till budgetdatorerna följer alltså
 * kulören med, och sidan känns som en fortsättning i stället för som
 * ett nytt ställe.
 */
const CATEGORY_ACCENTS: Record<string, string> = {
  budget: "#E3A567",
  "price-performance": "#CBD3E1",
  "best-selling": "#B26BDE",
  toptier: "#3FD9F5",
  default: "#3FD9F5",
};

const CATEGORY_BANNERS: Record<string, BannerConfig> = {
  budget: {
    eyebrow: "Budgetv\u00e4nliga",
    title: "Budget betyder inte d\u00e5ligt",
    description: "Smarta val som h\u00e5ller priset nere utan att tumma p\u00e5 k\u00e4nslan.",
    images: [budgetCategoryBanner],
    stickers: [
      {
        label: "B\u00e4st i budget-klass",
        className: "bg-secondary text-white",
      },
    ],
    primaryLabel: "Se budgetdatorer",
    primaryHref: "/products?category=budget&clear_filters=1",
    secondaryLabel: "Fr\u00e5ga oss",
    secondaryHref: "/kundservice",
    background: "bg-[#facc15]",
  },
  "best-selling": {
    eyebrow: "Mest f\u00f6r pengarna",
    title: "Mest f\u00f6r pengarna",
    description: "V\u00e5ra mest prisv\u00e4rda byggen \u2013 noggrant utvalda f\u00f6r maximal valuta.",
    images: [chieftecVistaBanner, chieftecVisioBanner, cg530Banner],
    stickers: [
      {
        label: "DatorHusets val",
        className: "bg-secondary text-white",
      },
      {
        label: "Mest valuta",
        className: "bg-secondary text-white",
      },
      {
        label: "Otrolig Prestanda",
        className: "bg-secondary text-white",
      },
    ],
    primaryLabel: "Se favoriterna",
    primaryHref: "/products?category=best-selling&clear_filters=1",
    secondaryLabel: "Custom bygg",
    secondaryHref: "/custom-bygg",
    background: "bg-[#facc15]",
  },
  "price-performance": {
    eyebrow: "Pris/prestanda",
    title: "Pris/prestanda",
    description: "Byggen med starkast balans mellan pris och prestanda.",
    images: [pricePerformanceCategoryBanner],
    stickers: [
      {
        label: "Mest f\u00f6r pengarna",
        className: "bg-secondary text-white",
      },
    ],
    primaryLabel: "Se pris/prestanda",
    primaryHref: "/products?category=price-performance&clear_filters=1",
    secondaryLabel: "J\u00e4mf\u00f6r alternativ",
    secondaryHref: "/kundservice",
    background: "bg-[#facc15]",
  },
  toptier: {
    eyebrow: "B\u00e4sta prestanda",
    title: "N\u00e4r bara det snabbaste duger",
    description: "Toppbyggen f\u00f6r dig som vill ha maximal kraft och kompromissl\u00f6s kvalitet.",
    images: [o11WhiteBanner, o11BlackBanner],
    stickers: [
      {
        label: "Topline",
        className: "bg-secondary text-white",
      },
    ],
    primaryLabel: "Se toppmodeller",
    primaryHref: "/products?category=toptier&clear_filters=1",
    secondaryLabel: "Bygg din egen",
    secondaryHref: "/custom-bygg",
    background: "bg-[#facc15]",
    imageSize: "large",
  },
};

const bundleItems = [
  { label: "Sk\u00e4rm", icon: Monitor },
  { label: "Tangentbord", icon: Keyboard },
  { label: "Mus", icon: Mouse },
  { label: "Headset", icon: Headphones },
];

const buildComputerFromSupabaseProduct = (product: SupabaseProduct): Computer => {
  const normalizedImage = normalizeProductImagePath(product.image_url || "") || FALLBACK_IMAGE;
  return {
    id: product.id,
    name: product.name,
    price: typeof product.price_cents === "number" ? product.price_cents / 100 : 0,
    cpu: product.cpu || "",
    gpu: product.gpu || "",
    ram: product.ram || "",
    storage: product.storage || "",
    storagetype: product.storage_type || "SSD",
    tier: product.tier || "Silver",
    rating: typeof product.rating === "number" ? product.rating : 0,
    reviews: typeof product.reviews_count === "number" ? product.reviews_count : 0,
    image: normalizedImage,
    images: [normalizedImage],
    usedVariantEnabled: false,
  };
};

const normalizeListingTagKey = (value: string) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const PRODUCT_CATEGORY_TAGS: Record<string, string[]> = {
  budget: ["budgetvanliga"],
  "price-performance": ["price-performance"],
  "best-selling": ["price-performance"],
  toptier: ["basta-prestanda"],
};

const STOCK_PRIORITY_ORDER = new Map<string, number>([
  ["platina-curver", 0],
  ["curver", 0],
  ["guld-sparet", 1],
  ["sparet", 1],
]);

export default function Products() {
  const { settings: siteSettings } = useSiteSettings();
  const motion = siteSettings.site.motion;
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category")?.toLowerCase() || "";
  const shouldClearFilters = searchParams.get("clear_filters") === "1";

  /*
   * Navigeringens två ingångar till sortimentet.
   *
   *   ?stock=in-stock   maskiner som står på hyllan
   *   ?stock=preorder   maskiner som byggs när delarna kommer in
   *   ?use=gaming       speldatorer
   *   ?use=workstation  arbetsstationer
   *
   * Lagerstatusen kommer från Supabase och inte från listan i koden, så
   * den är sann i stunden - men den hämtas efter att sidan ritats. Se
   * stockMatch längre ned för vad som händer under tiden.
   */
  const stockFilter = searchParams.get("stock")?.toLowerCase() || "";
  const useFilter = searchParams.get("use")?.toLowerCase() || "";
  const hasAppliedCategory = useRef(false);
  const hasAppliedQueryFilters = useRef(false);
  const [priceRange, setPriceRange] = useState([0, DEFAULT_PRODUCTS_PRICE_MAX]);
  const [selectedGPUs, setSelectedGPUs] = useState<string[]>([]);
  const [selectedCPUs, setSelectedCPUs] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [showUsedOnly, setShowUsedOnly] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  /* Filterpanelen fälls ut över hela bredden, inte i en sidospalt. */
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [sortOpen, setSortOpen] = useState(false);
  const [showAllGpus, setShowAllGpus] = useState(false);
  const [showAllCpus, setShowAllCpus] = useState(false);
  const [showAllTiers, setShowAllTiers] = useState(false);
  const { products } = useProducts();
  const [inventoryMap, setInventoryMap] = useState<Record<string, InventoryEntry>>({});
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const productLookup = useMemo(() => buildProductLookup(products), [products]);

  const getFilterLabel = (type: "gpu" | "cpu" | "tier", value: string) => {
    if (type === "gpu") {
      return FILTER_LABELS.gpu[value as keyof typeof FILTER_LABELS.gpu] ?? value;
    }
    if (type === "cpu") {
      let label = value.replace(/\(\s*tray\s*\)/i, "").replace(/\btray\b/i, "");
      label = label.replace(/^AMD\s+/i, "").replace(/^Intel\s+/i, "").trim();
      label = label.replace(/^Core\s+/i, "").replace(/^Ryzen\s+/i, "Ryzen ");
      label = label.replace(/\s{2,}/g, " ");
      return label;
    }
    return value;
  };
  const getGpuOrderIndex = (label: string) => {
    const upper = label.toUpperCase();
    return GPU_ORDER.findIndex((entry) => upper.includes(entry));
  };
  const getGpuRank = (label: string) => {
    const upper = label.toUpperCase();
    const match = upper.match(/\d{3,4}/);
    const base = match ? Number.parseInt(match[0], 10) : 0;
    let score = base;
    if (upper.includes("SUPER")) score += 0.2;
    if (upper.includes("TI")) score += 0.1;
    if (upper.includes("XT")) score += 0.2;
    return score;
  };
  const getCpuRank = (label: string) => {
    const upper = label.toUpperCase();
    const match = upper.match(/\d{3,5}/);
    const base = match ? Number.parseInt(match[0], 10) : 0;
    let score = base;
    if (upper.includes("XEON")) score += 20000;
    return score;
  };
  type FilterOption = { label: string; values: string[] };
  const sortGpuOptions = (a: FilterOption, b: FilterOption) => {
    const aIndex = getGpuOrderIndex(a.label);
    const bIndex = getGpuOrderIndex(b.label);
    if (aIndex !== -1 || bIndex !== -1) {
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }
    const aUpper = a.label.toUpperCase();
    const bUpper = b.label.toUpperCase();
    const aVendor = aUpper.startsWith("RTX") ? 0 : aUpper.startsWith("RX") ? 1 : 2;
    const bVendor = bUpper.startsWith("RTX") ? 0 : bUpper.startsWith("RX") ? 1 : 2;
    if (aVendor !== bVendor) return aVendor - bVendor;
    const rankDiff = getGpuRank(b.label) - getGpuRank(a.label);
    if (rankDiff !== 0) return rankDiff;
    return a.label.localeCompare(b.label, "sv-SE");
  };
  const sortCpuOptions = (a: FilterOption, b: FilterOption) => {
    const aUpper = a.label.toUpperCase();
    const bUpper = b.label.toUpperCase();
    const aVendor =
      aUpper.startsWith("RYZEN") ? 0 : aUpper.startsWith("I") || aUpper.includes("XEON") ? 1 : 2;
    const bVendor =
      bUpper.startsWith("RYZEN") ? 0 : bUpper.startsWith("I") || bUpper.includes("XEON") ? 1 : 2;
    if (aVendor !== bVendor) return aVendor - bVendor;
    const rankDiff = getCpuRank(b.label) - getCpuRank(a.label);
    if (rankDiff !== 0) return rankDiff;
    return a.label.localeCompare(b.label, "sv-SE");
  };
  const buildFilterOptions = (items: string[], type: "gpu" | "cpu" | "tier") => {
    const options = new Map<string, string[]>();
    items.forEach((item) => {
      if (item.toLowerCase().includes("placeholder")) return;
      const label = getFilterLabel(type, item);
      const existing = options.get(label);
      if (existing) {
        existing.push(item);
      } else {
        options.set(label, [item]);
      }
    });
    return Array.from(options.entries()).map(([label, values]) => ({ label, values }));
  };

  const productIdByName = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((product) => {
      const nameKey = normalizeProductKey(product.name);
      if (nameKey) {
        map.set(nameKey, product.id);
      }
      if (product.slug) {
        const slugKey = normalizeProductKey(product.slug);
        if (slugKey) {
          map.set(slugKey, product.id);
        }
      }
    });
    return map;
  }, [products]);

  const localComputerKeys = useMemo(() => {
    const keys = new Set<string>();
    COMPUTERS.forEach((computer) => {
      [computer.id, computer.name, computer.usedVariant?.productKey].forEach((value) => {
        const normalized = normalizeProductKey(String(value || ""));
        if (normalized) {
          keys.add(normalized);
        }
      });
    });
    return keys;
  }, []);

  const supabaseOnlyComputers = useMemo(() => {
    return products
      .filter((product) => {
        const lookupCandidates = [product.id, product.slug, product.legacy_id, product.name];
        return !lookupCandidates.some((candidate) => {
          const normalized = normalizeProductKey(String(candidate || ""));
          return normalized ? localComputerKeys.has(normalized) : false;
        });
      })
      .map((product) => buildComputerFromSupabaseProduct(product));
  }, [products, localComputerKeys]);

  useEffect(() => {
    let active = true;
    setInventoryLoading(true);
    getAllInventory()
      .then((items) => {
        if (!active) return;
        const nextMap: Record<string, InventoryEntry> = {};
        items.forEach((item) => {
          if (item?.product_id) {
            nextMap[item.product_id] = item as InventoryEntry;
          }
        });
        setInventoryMap(nextMap);
      })
      .catch((error) => {
        console.error("Failed to load inventory", error);
      })
      .finally(() => {
        if (active) setInventoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (shouldClearFilters) {
      localStorage.removeItem(FILTER_STORAGE_KEY);
      setPriceRange([0, DEFAULT_PRODUCTS_PRICE_MAX]);
      setSelectedGPUs([]);
      setSelectedCPUs([]);
      setSelectedTiers([]);
      setShowUsedOnly(false);
      return;
    }

    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as {
        priceRange?: number[];
        selectedGPUs?: string[];
        selectedCPUs?: string[];
        selectedTiers?: string[];
        showUsedOnly?: boolean;
      };
      if (Array.isArray(parsed.priceRange) && parsed.priceRange.length === 2) {
        const [storedMin, storedMax] = parsed.priceRange;
        if (
          Number.isFinite(storedMin) &&
          Number.isFinite(storedMax) &&
          storedMin >= 0 &&
          storedMax > storedMin &&
          storedMax >= storedMin
        ) {
          setPriceRange([storedMin, storedMax]);
        }
      }
      if (Array.isArray(parsed.selectedGPUs)) {
        const normalized = parsed.selectedGPUs.map((gpu) => getFilterLabel("gpu", gpu));
        setSelectedGPUs(Array.from(new Set(normalized)));
      }
      if (Array.isArray(parsed.selectedCPUs)) {
        const normalized = parsed.selectedCPUs.map((cpu) => getFilterLabel("cpu", cpu));
        setSelectedCPUs(Array.from(new Set(normalized)));
      }
      if (Array.isArray(parsed.selectedTiers)) {
        const normalized = parsed.selectedTiers.map((tier) => getFilterLabel("tier", tier));
        setSelectedTiers(Array.from(new Set(normalized)));
      }
      if (typeof parsed.showUsedOnly === "boolean") {
        setShowUsedOnly(parsed.showUsedOnly);
      }
    } catch (error) {
      console.warn("Failed to read saved filters", error);
    }
  }, [shouldClearFilters]);

  useEffect(() => {
    if (!activeCategory || hasAppliedCategory.current) return;
    hasAppliedCategory.current = true;
  }, [activeCategory]);

  useEffect(() => {
    if (hasAppliedQueryFilters.current) return;
    const minParamRaw = searchParams.get("price_min");
    const maxParamRaw = searchParams.get("price_max");
    const minParam = minParamRaw !== null ? Number(minParamRaw) : null;
    const maxParam = maxParamRaw !== null ? Number(maxParamRaw) : null;
    if (
      minParam !== null &&
      maxParam !== null &&
      Number.isFinite(minParam) &&
      Number.isFinite(maxParam) &&
      minParam >= 0 &&
      maxParam > 0 &&
      maxParam >= minParam
    ) {
      setPriceRange([minParam, maxParam]);
    }
    const tiersParam = searchParams.get("tiers");
    if (tiersParam) {
      const normalized = tiersParam
        .split(",")
        .map((tier) => tier.trim())
        .filter(Boolean)
        .map((tier) => tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase());
      setSelectedTiers(normalized);
    }
    hasAppliedQueryFilters.current = true;
  }, [searchParams]);

  useEffect(() => {
    const payload = {
      priceRange,
      selectedGPUs,
      selectedCPUs,
      selectedTiers,
      showUsedOnly,
    };
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(payload));
  }, [priceRange, selectedGPUs, selectedCPUs, selectedTiers, showUsedOnly]);

  const preset = searchParams.get("preset")?.toLowerCase() || "";
  useEffect(() => {
    if (!preset) return;
    setSelectedGPUs([]);
    setSelectedCPUs([]);
    setSelectedTiers([]);
    setShowUsedOnly(false);
    setPriceRange([0, DEFAULT_PRODUCTS_PRICE_MAX]);
  }, [preset]);
  const filterComputers = useMemo(() => {
    if (preset === "budget") {
      return COMPUTERS.filter((computer) => computer.name === "Cheapo - Ny");
    }
    if (preset === "price-performance") {
      return COMPUTERS.filter((computer) => computer.classLabels?.includes("Best-Selling PC's"));
    }
    if (preset === "toptier") {
      return COMPUTERS.filter((computer) =>
        ["All in, all out - BLACK nybyggd", "All white, all out - NYPRIS"].includes(computer.name)
      );
    }
    return showUsedOnly ? COMPUTERS.filter((computer) => computer.usedVariant) : [...COMPUTERS, ...supabaseOnlyComputers];
  }, [preset, showUsedOnly, supabaseOnlyComputers]);
  const getProductForVariant = (computer: Computer, useUsedVariant: boolean) => {
    const key =
      useUsedVariant && computer.usedVariant?.productKey ? computer.usedVariant.productKey : computer.name;
    const lookupId =
      productIdByName.get(normalizeProductKey(key)) || productIdByName.get(normalizeProductKey(computer.id));
    return getProductFromLookup(productLookup, lookupId);
  };
  const hasCategoryTag = (product: SupabaseProduct | null | undefined, category: string) => {
    if (!product) return false;
    const allowed = PRODUCT_CATEGORY_TAGS[category] || [];
    if (allowed.length === 0) return false;
    const productTags = Array.isArray(product.tags) ? product.tags.map(normalizeListingTagKey) : [];
    return allowed.some((tag) => productTags.includes(tag));
  };
  const getDisplayVariant = (computer: Computer, useUsedVariant: boolean) => {
    const baseVariant = useUsedVariant && computer.usedVariant ? computer.usedVariant : computer;
    return mergeProductFields(
      {
        name: computer.name,
        price: baseVariant.price,
        cpu: baseVariant.cpu,
        gpu: baseVariant.gpu,
        ram: baseVariant.ram,
        storage: baseVariant.storage,
        storagetype: baseVariant.storagetype,
        tier: baseVariant.tier,
      },
      getProductForVariant(computer, useUsedVariant),
    );
  };
  const getDisplayName = (computer: Computer, useUsedVariant: boolean) => {
    const product = getProductForVariant(computer, useUsedVariant);
    if (product?.name) return product.name;
    return useUsedVariant && computer.usedVariant ? toUsedName(computer.name) : computer.name;
  };
  const getInventoryProductId = (computer: Computer, useUsedVariant: boolean) => {
    const lookupKey =
      useUsedVariant && computer.usedVariant?.productKey ? computer.usedVariant.productKey : computer.name;
    return (
      productIdByName.get(normalizeProductKey(lookupKey)) ||
      productIdByName.get(normalizeProductKey(computer.id)) ||
      null
    );
  };
  const getStockPriority = (computer: Computer, useUsedVariant: boolean) => {
    const product = getProductForVariant(computer, useUsedVariant);
    const candidates = [
      product?.slug,
      product?.name,
      product?.legacy_id,
      useUsedVariant ? computer.usedVariant?.productKey : null,
      computer.name,
      computer.id,
    ];
    for (const candidate of candidates) {
      const normalized = normalizeProductKey(String(candidate || ""));
      const priority = STOCK_PRIORITY_ORDER.get(normalized);
      if (priority !== undefined) {
        return priority;
      }
    }
    return Number.MAX_SAFE_INTEGER;
  };
  type DisplayCard = { computer: Computer; useUsedVariant: boolean };
  const displayCards = useMemo<DisplayCard[]>(() => {
    if (preset === "budget") {
      const cheapo = filterComputers[0];
      if (!cheapo) return [];
      const baseCard = {
        computer: cheapo,
        useUsedVariant: false,
      };
      const usedCard = cheapo.usedVariant
        ? {
            computer: cheapo,
            useUsedVariant: true,
          }
        : null;
      if (showUsedOnly) {
        return usedCard ? [usedCard] : [];
      }
      return usedCard ? [baseCard, usedCard] : [baseCard];
    }
    return filterComputers.map((computer) => ({
      computer,
      useUsedVariant: showUsedOnly && Boolean(computer.usedVariant),
    }));
  }, [filterComputers, preset, showUsedOnly]);
  const effectivePriceMax = useMemo(() => {
    const maxPrice = displayCards.reduce((max, card) => {
      const variant = getDisplayVariant(card.computer, card.useUsedVariant);
      return Number.isFinite(variant.price) ? Math.max(max, variant.price) : max;
    }, 0);
    return Math.max(DEFAULT_PRODUCTS_PRICE_MAX, maxPrice);
  }, [displayCards]);

  useEffect(() => {
    setPriceRange((prev) => {
      const [min, max] = prev;
      if (!Number.isFinite(min) || !Number.isFinite(max) || max <= 0 || max < min) {
        return [0, effectivePriceMax];
      }
      const clampedMin = Math.max(0, Math.min(min, effectivePriceMax));
      const clampedMax = Math.max(clampedMin, Math.min(max, effectivePriceMax));
      if (clampedMin !== min || clampedMax !== max) {
        return [clampedMin, clampedMax];
      }
      return prev;
    });
  }, [effectivePriceMax]);

  useEffect(() => {
    if (shouldClearFilters) return;
    if (searchParams.has("price_min") || searchParams.has("price_max")) return;
    setPriceRange((prev) => {
      if (prev[0] === 0 && prev[1] === 0 && effectivePriceMax > 0) {
        return [0, effectivePriceMax];
      }
      return prev;
    });
  }, [effectivePriceMax, searchParams, shouldClearFilters]);
  const gpus = Array.from(new Set(displayCards.map((card) => getDisplayVariant(card.computer, card.useUsedVariant).gpu)));
  const cpus = Array.from(new Set(displayCards.map((card) => getDisplayVariant(card.computer, card.useUsedVariant).cpu)));
  const tiers = Array.from(new Set(displayCards.map((card) => getDisplayVariant(card.computer, card.useUsedVariant).tier)));
  const filterPreviewCount = 3;
  const gpuOptions = useMemo(() => buildFilterOptions(gpus, "gpu").sort(sortGpuOptions), [gpus]);
  const cpuOptions = useMemo(() => buildFilterOptions(cpus, "cpu").sort(sortCpuOptions), [cpus]);
  const tierOptions = useMemo(() => buildFilterOptions(tiers, "tier"), [tiers]);

  /*
   * Antal bakom varje filterval.
   *
   * Räknas över hela den kategori man står i, inte över det som råkar
   * vara framfiltrerat just nu. Räknades de om vid varje bock skulle
   * siffrorna hoppa medan man klickar, och ett val som visar "(0)" men
   * ändå går att kryssa i är värre än ingen siffra alls.
   */
  const optionCounts = useMemo(() => {
    const gpu = new Map<string, number>();
    const cpu = new Map<string, number>();
    const tier = new Map<string, number>();

    const bump = (map: Map<string, number>, options: FilterOption[], value: string) => {
      const hit = options.find((option) => option.values.includes(value));
      if (!hit) return;
      map.set(hit.label, (map.get(hit.label) ?? 0) + 1);
    };

    displayCards.forEach((card) => {
      const variant = getDisplayVariant(card.computer, card.useUsedVariant);
      bump(gpu, gpuOptions, variant.gpu);
      bump(cpu, cpuOptions, variant.cpu);
      bump(tier, tierOptions, variant.tier);
    });

    return { gpu, cpu, tier };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayCards, gpuOptions, cpuOptions, tierOptions]);

  const gpuLabelMap = useMemo(
    () => new Map(gpuOptions.map((option) => [option.label, option.values])),
    [gpuOptions],
  );
  const cpuLabelMap = useMemo(
    () => new Map(cpuOptions.map((option) => [option.label, option.values])),
    [cpuOptions],
  );
  const tierLabelMap = useMemo(
    () => new Map(tierOptions.map((option) => [option.label, option.values])),
    [tierOptions],
  );
  const visibleGpus = gpuOptions.slice(0, filterPreviewCount);
  const visibleCpus = cpuOptions.slice(0, filterPreviewCount);
  const visibleTiers = tierOptions.slice(0, filterPreviewCount);
  const extraGpus = gpuOptions.slice(filterPreviewCount);
  const extraCpus = cpuOptions.slice(filterPreviewCount);
  const extraTiers = tierOptions.slice(filterPreviewCount);
  const hasMoreGpus = gpuOptions.length > filterPreviewCount;
  const hasMoreCpus = cpuOptions.length > filterPreviewCount;
  const hasMoreTiers = tierOptions.length > filterPreviewCount;

  const filteredProducts = useMemo(() => {
    return displayCards
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => {
        const variant = getDisplayVariant(card.computer, card.useUsedVariant);
        const product = getProductForVariant(card.computer, card.useUsedVariant);
        const displayPrice = variant.price;
        const categoryMatch = (() => {
          if (!activeCategory) return true;
          if (activeCategory === "budget") {
            return hasCategoryTag(product, activeCategory) || card.computer.classLabels?.includes("Budget PC's");
          }
          if (activeCategory === "best-selling" || activeCategory === "price-performance") {
            return hasCategoryTag(product, activeCategory) || card.computer.classLabels?.includes("Best-Selling PC's");
          }
          if (activeCategory === "toptier") {
            return hasCategoryTag(product, activeCategory) || card.computer.classLabels?.includes("Toptier PC's");
          }
          return true;
        })();

        const withinPrice = displayPrice >= priceRange[0] && displayPrice <= priceRange[1];
        const gpuMatch =
          selectedGPUs.length === 0 ||
          selectedGPUs.some((label) => gpuLabelMap.get(label)?.includes(variant.gpu));
        const cpuMatch =
          selectedCPUs.length === 0 ||
          selectedCPUs.some((label) => cpuLabelMap.get(label)?.includes(variant.cpu));
        const tierMatch =
          selectedTiers.length === 0 ||
          selectedTiers.some((label) => tierLabelMap.get(label)?.includes(variant.tier));

        /* Lagerstatus.
         *
         * Medan lagret hämtas filtrerar vi inte bort någonting. Annars
         * hade "Redo att skickas" blinkat tom i en halv sekund innan
         * svaret kom, och en tom sida som sedan fylls är svårare att
         * förstå än en full sida som krymper. */
        const stockMatch = (() => {
          if (!stockFilter || inventoryLoading) return true;
          const inventoryId = getInventoryProductId(card.computer, card.useUsedVariant);
          const inventory = inventoryId ? inventoryMap[inventoryId] : undefined;
          const inStock = (inventory?.quantity_in_stock ?? 0) > 0;
          const canPreorder = Boolean(inventory?.is_preorder ?? inventory?.allow_preorder);
          if (stockFilter === "in-stock") return inStock;
          if (stockFilter === "preorder") return !inStock && canPreorder;
          return true;
        })();

        /* Utan use-fält räknas maskinen som speldator. Se kommentaren
           vid fältet i src/data/computers.ts. */
        const useMatch = !useFilter || (card.computer.use ?? "gaming") === useFilter;

        return (
          categoryMatch && withinPrice && gpuMatch && cpuMatch && tierMatch && stockMatch && useMatch
        );
      })
      .sort((a, b) => {
        const aInventoryId = getInventoryProductId(a.card.computer, a.card.useUsedVariant);
        const bInventoryId = getInventoryProductId(b.card.computer, b.card.useUsedVariant);
        const aInStock = aInventoryId ? (inventoryMap[aInventoryId]?.quantity_in_stock ?? 0) > 0 : false;
        const bInStock = bInventoryId ? (inventoryMap[bInventoryId]?.quantity_in_stock ?? 0) > 0 : false;

        if (aInStock !== bInStock) {
          return aInStock ? -1 : 1;
        }

        const aPriority = getStockPriority(a.card.computer, a.card.useUsedVariant);
        const bPriority = getStockPriority(b.card.computer, b.card.useUsedVariant);
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        return a.index - b.index;
      })
      .map(({ card }) => card);
  }, [
    activeCategory,
    inventoryMap,
    inventoryLoading,
    stockFilter,
    useFilter,
    priceRange,
    selectedGPUs,
    selectedCPUs,
    selectedTiers,
    gpuLabelMap,
    cpuLabelMap,
    tierLabelMap,
    displayCards,
  ]);

  /*
   * Sorteringen läggs ovanpå lagerordningen.
   *
   * "Utvalda" är listan som den kommer ur filtreringen, alltså med
   * lagervaror först - det är den ordning en butik vill visa. Väljer man
   * pris eller namn går den ordningen förlorad med flit; har man bett om
   * pris vill man ha pris, inte pris-inom-lagerstatus.
   */
  const sortedProducts = useMemo(() => {
    if (sortBy === "featured") return filteredProducts;

    const priceOf = (card: DisplayCard) =>
      getDisplayVariant(card.computer, card.useUsedVariant).price;

    const copy = [...filteredProducts];
    if (sortBy === "price-asc") copy.sort((a, b) => priceOf(a) - priceOf(b));
    else if (sortBy === "price-desc") copy.sort((a, b) => priceOf(b) - priceOf(a));
    else
      copy.sort((a, b) =>
        getDisplayName(a.computer, a.useUsedVariant).localeCompare(
          getDisplayName(b.computer, b.useUsedVariant),
          "sv",
        ),
      );
    return copy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProducts, sortBy]);

  const toggleFilter = (value: string, selected: string[], setSelected: (v: string[]) => void) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const clearFilters = () => {
    setPriceRange([0, effectivePriceMax]);
    setSelectedGPUs([]);
    setSelectedCPUs([]);
    setSelectedTiers([]);
    setShowUsedOnly(false);
  };

  const categoryLabel = (() => {
    if (activeCategory === "budget") return "Budgetv\u00e4nliga";
    if (activeCategory === "price-performance") return "Pris/prestanda";
    if (activeCategory === "best-selling") return "Mest f\u00f6r pengarna";
    if (activeCategory === "toptier") return "B\u00e4sta prestanda";
    return "";
  })();

  const activeFilters: string[] = [];
  if (categoryLabel) activeFilters.push(categoryLabel);
  if (showUsedOnly) {
    activeFilters.push("Begagnade datorer");
  }
  if (priceRange[0] !== 0 || priceRange[1] !== effectivePriceMax) {
    activeFilters.push(`Pris: ${priceRange[0].toLocaleString("sv-SE")} - ${priceRange[1].toLocaleString("sv-SE")} kr`);
  }
  selectedGPUs.forEach((gpu) => activeFilters.push(`GPU: ${gpu}`));
  selectedCPUs.forEach((cpu) => activeFilters.push(`CPU: ${cpu}`));
  selectedTiers.forEach((tier) => activeFilters.push(`Kategori: ${tier}`));
  const hasFilters = activeFilters.length > 0;

  const configuredBanners = siteSettings.pages.products.banners;
  const bannerKey =
    activeCategory === "budget" ||
    activeCategory === "best-selling" ||
    activeCategory === "price-performance" ||
    activeCategory === "toptier"
      ? activeCategory
      : "default";
  const configuredBanner = configuredBanners[bannerKey];
  const fallbackBanner = bannerKey === "default" ? DEFAULT_BANNER : CATEGORY_BANNERS[bannerKey];
  const banner = {
    ...fallbackBanner,
    eyebrow: configuredBanner.eyebrow,
    title: configuredBanner.title,
    description: configuredBanner.description,
    images: configuredBanner.images.filter(Boolean).length > 0 ? configuredBanner.images.filter(Boolean) : fallbackBanner.images,
    primaryLabel: configuredBanner.primaryLabel,
    primaryHref: configuredBanner.primaryHref,
    secondaryLabel: configuredBanner.secondaryLabel,
    secondaryHref: configuredBanner.secondaryHref,
    stickers:
      configuredBanner.stickers.length > 0
        ? configuredBanner.stickers.map((label) => ({
            label,
            className: "bg-secondary text-white",
          }))
        : fallbackBanner.stickers,
  };

  /*
   * Rubriken när man kommit hit via navigeringen.
   *
   * Utan det här hade "Redo att skickas" landat på en sida vars
   * banderoll säger "Topplistan" - alltså något annat än det man
   * klickade på, vilket får sidan att kännas som att den inte lyssnade.
   *
   * Texterna är inte nya löften. Leveranstiden står redan i FAQ:n
   * ("normalt 3-5 arbetsdagar för lagervaror") och definitionen av
   * förbeställning likaså.
   */
  const navView = (() => {
    if (!stockFilter && !useFilter) return null;

    const noun =
      useFilter === "workstation"
        ? "arbetsstationer"
        : useFilter === "gaming"
          ? "speldatorer"
          : "datorer";

    if (stockFilter === "in-stock") {
      return {
        eyebrow: "Redo att skickas",
        title: `Färdiga ${noun} på hyllan`,
        description:
          "Står färdigbyggda hos oss och skickas normalt inom 3-5 arbetsdagar.",
      };
    }

    if (stockFilter === "preorder") {
      return {
        eyebrow: "Preorder",
        title: `Förbeställ ${noun}`,
        description:
          "Inte i lager just nu. Vi bygger och levererar så snart delarna finns - hör av dig om du vill ha en tidsuppskattning först.",
      };
    }

    return {
      eyebrow: useFilter === "workstation" ? "Workstation" : "Gaming",
      title: useFilter === "workstation" ? "Arbetsstationer" : "Speldatorer",
      description:
        useFilter === "workstation"
          ? "Byggda för arbete som tar tid: rendering, kompilering och annat som får gå på natten."
          : "Byggda för spel, handmonterade och provkörda innan de packas.",
    };
  })();

  if (navView) {
    banner.eyebrow = navView.eyebrow;
    banner.title = navView.title;
    banner.description = navView.description;
    banner.stickers = undefined;
  }

  const bannerAccent = CATEGORY_ACCENTS[bannerKey] ?? BANNER_ACCENTS.buy;

  /*
   * Datorn i banderollen.
   *
   * Tas ur kategorins FÖRSTA maskin och inte ur den filtrerade
   * listan. Ur den filtrerade hade bilden bytts varje gång någon
   * kryssade i ett filter, och en banderoll som byter motiv medan
   * man filtrerar drar blicken från det man höll på med.
   *
   * Bara frilagda bilder duger här. Ett foto med egen bakgrund blir
   * en rektangel klistrad på banderollen.
   */
  const heroCutout = getProductArt(displayCards[0]?.computer.id).cutout;
  const leadBannerImage = banner.images[0];
  const secondaryBannerImage = banner.images[1];
  const primarySticker = banner.stickers?.[0];
  const secondaryStickers = banner.stickers?.slice(1, 3) ?? [];
  const seoUrl =
    typeof window !== "undefined" ? window.location.href : `https://datorhuset.se${activeCategory ? `/products?category=${activeCategory}` : "/products"}`;
  const seoTitle = `${banner.title} | DatorHuset`;
  const seoDescription = banner.description || "Gamingdatorer och färdiga byggen från DatorHuset.";

  return (
    <PageShell head={<SeoHead title={seoTitle} description={seoDescription} image={leadBannerImage} url={seoUrl} type="website" />}>
      {/* Banderollen ---------------------------------------------------
          Ett rundat kort i spalten, inte ett band tvärs över skärmen.
          Rubriken till vänster, en av kategorins datorer svävande till
          höger, och kategorins egen bild suddad bakom. Suddad med flit:
          skarp konkurrerar den med både rubriken och datorn, suddad ger
          den bara rummet en kulör. */}
      <section data-sandbox-id="products-banner" className="container mx-auto px-4 pt-8 sm:pt-10">
        <div className="collection-hero" style={{ ["--hero-accent" as string]: bannerAccent }}>
          <img
            src={PAGE_BANNERS.products.image}
            alt=""
            aria-hidden="true"
            className="collection-hero__wash"
            loading="eager"
            decoding="async"
          />
          <span aria-hidden="true" className="collection-hero__glow" />

          <div className="collection-hero__text">
            <h1 className="font-display text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl">
              {banner.title}
            </h1>
            <p className="mt-2 font-display text-lg font-semibold text-white/70 sm:text-xl">
              {banner.eyebrow}
            </p>
          </div>

          {heroCutout && (
            <img
              src={heroCutout}
              alt=""
              aria-hidden="true"
              className="collection-hero__pc"
              loading="eager"
              decoding="async"
            />
          )}
        </div>
      </section>

      {/* Raden med filter och sortering -------------------------------- */}
      <div className="collection-bar">
        <div className="container mx-auto flex items-center justify-end gap-0 px-4">
          <button
            type="button"
            onClick={() => {
              setFiltersOpen((prev) => !prev);
              setSortOpen(false);
            }}
            aria-expanded={filtersOpen}
            className="collection-bar__button"
            data-open={filtersOpen || undefined}
          >
            Filter
            {activeFilters.length > 0 && (
              <span className="collection-bar__count">{activeFilters.length}</span>
            )}
            <ChevronDown
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform"
              style={{ transform: filtersOpen ? "rotate(180deg)" : undefined }}
            />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setSortOpen((prev) => !prev);
                setFiltersOpen(false);
              }}
              aria-expanded={sortOpen}
              className="collection-bar__button"
              data-open={sortOpen || undefined}
            >
              Sortera:
              <span style={{ color: bannerAccent }}>{SORT_LABELS[sortBy]}</span>
              <ChevronDown
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform"
                style={{ transform: sortOpen ? "rotate(180deg)" : undefined }}
              />
            </button>

            {sortOpen && (
              <div className="collection-sort">
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSortBy(key);
                      setSortOpen(false);
                    }}
                    className="collection-sort__item"
                    style={key === sortBy ? { color: bannerAccent } : undefined}
                  >
                    {SORT_LABELS[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filterpanelen -------------------------------------------------
          Hela bredden, alla grupper samtidigt. Den gamla sidospalten
          visade tre val per grupp och gömde resten bakom en pil, så man
          fick klicka sig fram till vad butiken ens har. */}
      {filtersOpen && (
        <div className="collection-filters">
          <div className="container mx-auto px-4 py-8">
            <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
              <FilterColumn title="Processor">
                {cpuOptions.map((option) => (
                  <FilterCheck
                    key={option.label}
                    label={option.label}
                    count={optionCounts.cpu.get(option.label) ?? 0}
                    checked={selectedCPUs.includes(option.label)}
                    onChange={() => toggleFilter(option.label, selectedCPUs, setSelectedCPUs)}
                    accent={bannerAccent}
                  />
                ))}
              </FilterColumn>

              <FilterColumn title="Grafikkort">
                {gpuOptions.map((option) => (
                  <FilterCheck
                    key={option.label}
                    label={option.label}
                    count={optionCounts.gpu.get(option.label) ?? 0}
                    checked={selectedGPUs.includes(option.label)}
                    onChange={() => toggleFilter(option.label, selectedGPUs, setSelectedGPUs)}
                    accent={bannerAccent}
                  />
                ))}
              </FilterColumn>

              <FilterColumn title="Kategori">
                {tierOptions.map((option) => (
                  <FilterCheck
                    key={option.label}
                    label={option.label}
                    count={optionCounts.tier.get(option.label) ?? 0}
                    checked={selectedTiers.includes(option.label)}
                    onChange={() => toggleFilter(option.label, selectedTiers, setSelectedTiers)}
                    accent={bannerAccent}
                  />
                ))}
                <FilterCheck
                  label="Begagnade delar"
                  checked={showUsedOnly}
                  onChange={() => setShowUsedOnly((prev) => !prev)}
                  accent={bannerAccent}
                />
              </FilterColumn>

              {/* Priset är ett spann och inte en lista, så det får en
                  egen form i stället för att tvingas in i kryssrutor. */}
              <FilterColumn title="Pris">
                <label className="block text-sm text-muted-foreground" htmlFor="price-max">
                  Upp till{" "}
                  <span className="font-semibold text-foreground">
                    {priceRange[1].toLocaleString("sv-SE")} kr
                  </span>
                </label>
                <input
                  id="price-max"
                  type="range"
                  min={0}
                  max={effectivePriceMax}
                  step={500}
                  value={priceRange[1]}
                  onChange={(event) =>
                    setPriceRange([priceRange[0], Number.parseInt(event.target.value, 10)])
                  }
                  className="mt-3 w-full accent-primary"
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>0 kr</span>
                  <span>{effectivePriceMax.toLocaleString("sv-SE")} kr</span>
                </div>
              </FilterColumn>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-foreground/10 pt-5">
              <p className="text-xs text-muted-foreground">
                Visar{" "}
                <span className="font-semibold text-foreground">{sortedProducts.length}</span> av{" "}
                {displayCards.length} datorer
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-primary hover:opacity-80"
                >
                  Rensa alla filter
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rutnätet ------------------------------------------------------ */}
      <section className="container mx-auto px-4 pb-24 pt-10">
        {sortedProducts.length === 0 ? (
          /* Tomma läget säger vad som faktiskt hände. "Prova att justera
             dina filter" är fel svar när man klickat på Workstation i
             menyn och det inte finns några - då är det inte filtren som
             är i vägen, det är sortimentet. */
          <div className="flex min-h-[20rem] flex-col items-center justify-center px-6 py-16 text-center">
            <p className="font-display text-lg font-bold text-foreground">
              {useFilter === "workstation"
                ? "Inga arbetsstationer just nu"
                : stockFilter === "in-stock"
                  ? "Inget färdigbyggt på hyllan just nu"
                  : stockFilter === "preorder"
                    ? "Inget att förbeställa just nu"
                    : "Inga datorer hittades"}
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {useFilter === "workstation"
                ? "Vi bygger dem på beställning. Beskriv vad maskinen ska göra så sätter vi ihop ett förslag."
                : stockFilter
                  ? "Sortimentet ändras löpande. Titta på hela listan, eller bygg en egen precis som du vill ha den."
                  : "Prova att justera dina filter."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {(stockFilter || useFilter || hasFilters) && (
                <Link to="/products?clear_filters=1" className="btn-primary">
                  Se alla datorer
                </Link>
              )}
              <Link to="/custom-bygg" className="btn-secondary">
                Bygg din egen
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
            {sortedProducts.map((card) => {
              const { computer, useUsedVariant } = card;
              const variant = getDisplayVariant(computer, useUsedVariant);
              const displayPrice = variant.price;
              const displayName = getDisplayName(computer, useUsedVariant);
              const supabaseKey =
                useUsedVariant && computer.usedVariant?.productKey
                  ? computer.usedVariant.productKey
                  : computer.name;
              const supabaseId =
                productIdByName.get(normalizeProductKey(supabaseKey)) ||
                productIdByName.get(normalizeProductKey(computer.id));
              const inventory = supabaseId ? inventoryMap[supabaseId] : undefined;
              const hasInventory = Boolean(inventory);
              const inStock = (inventory?.quantity_in_stock ?? 0) > 0;
              const canPreorder = Boolean(inventory?.is_preorder ?? inventory?.allow_preorder);

              const badge = !hasInventory || inventoryLoading
                ? null
                : inStock
                  ? { label: "I lager", tone: "stock" }
                  : canPreorder
                    ? { label: "Förbeställ", tone: "preorder" }
                    : { label: "Slutsåld", tone: "sold" };

              /* Frilagd bild om den finns - samma urklipp som
                 produktsidan visar. Annars fotot, i ram. Ett foto med
                 egen bakgrund lagt fritt blir en rektangel klistrad på
                 kortet.

                 Glöden vid hovring tas ur samma konst. backdrop.glow är
                 maskinens egen belysning - CG530 lyser rött, Chieftec
                 Visio lila, Montechen blått - så kortet tänds i datorns
                 kulör utan att någon behöver välja en till. */
              const art = getProductArt(computer.id);
              const cutout = art.cutout;
              const bestFor = bestForResolution(computer.name);
              const cardKey = `${computer.id}-${useUsedVariant ? "used" : "new"}`;

              return (
                <Link
                  key={cardKey}
                  to={productPath(computer)}
                  className="pc-card"
                  style={{ ["--pc-glow" as string]: art.backdrop.glow }}
                >
                  <div className="pc-card__media">
                    {badge && (
                      <span className="pc-card__badge" data-tone={badge.tone}>
                        {badge.label}
                      </span>
                    )}
                    <img
                      src={cutout || computer.image}
                      alt={displayName}
                      className={cutout ? "pc-card__cutout" : "pc-card__photo"}
                      loading="lazy"
                      decoding="async"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>

                  <div className="pc-card__body">
                    <h2 className="pc-card__name">{displayName}</h2>

                    {bestFor && (
                      <p className="pc-card__bestfor">
                        Bäst för:
                        <span className="pc-card__pill" style={{ color: bannerAccent, borderColor: `${bannerAccent}66` }}>
                          {bestFor}
                        </span>
                      </p>
                    )}

                    <p className="pc-card__price">
                      {displayPrice.toLocaleString("sv-SE")} kr
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}

/**
 * En kolumn i filterpanelen.
 *
 * Rubriken och en lodrät lista. Ingen ram, ingen bakgrund - kolumnen
 * hålls ihop av luften runt den, och i en panel med fyra kolumner blir
 * fyra ramar bara fyra ramar.
 */
const FilterColumn = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <h3 className="text-sm font-bold text-foreground">{title}</h3>
    <div className="mt-4 space-y-2.5">{children}</div>
  </div>
);

/**
 * Ett kryssbart filterval med antal.
 *
 * Antalet står i parentes efter etiketten, som i förlagan. Det är
 * skillnaden mellan att gissa och att veta: ser man (1) innan man
 * klickar vet man att det blir en dator kvar.
 *
 * Rutan är en riktig input och inte en ritad fyrkant, så tangentbord
 * och uppläsare får den gratis.
 */
const FilterCheck = ({
  label,
  count,
  checked,
  onChange,
  accent,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
  accent: string;
}) => (
  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 shrink-0 rounded-sm border-foreground/25"
      style={{ accentColor: accent }}
    />
    <span className={checked ? "text-foreground" : undefined}>
      {label}
      {typeof count === "number" && (
        <span className="ml-1.5 text-xs text-muted-foreground">({count})</span>
      )}
    </span>
  </label>
);
