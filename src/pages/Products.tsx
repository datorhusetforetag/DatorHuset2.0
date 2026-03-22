import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import { Headphones, Keyboard, Monitor, Mouse } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { COMPUTERS, Computer } from "@/data/computers";
import { normalizeProductKey, useProducts, type SupabaseProduct } from "@/hooks/useProducts";
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

const DEFAULT_BANNER: BannerConfig = {
  eyebrow: "Topplistan",
  title: "B\u00e4sta s\u00e4ljare inom station\u00e4ra datorer i hela Norden!",
  description: "Utvalda byggen som levererar prestanda, design och trygg service.",
  images: [chieftecVistaBanner, chieftecVisioBanner, cg530Banner],
  background: "bg-[#facc15]",
  imageSize: "large",
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
        className: "bg-[#11667b] text-white",
      },
    ],
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
        className: "bg-[#11667b] text-white",
      },
      {
        label: "Mest valuta",
        className: "bg-[#11667b] text-white",
      },
      {
        label: "Otrolig Prestanda",
        className: "bg-[#11667b] text-white",
      },
    ],
    background: "bg-[#facc15]",
  },
  "price-performance": {
    eyebrow: "Price-Performance",
    title: "Price-Performance",
    description: "Byggen med starkast balans mellan pris och prestanda.",
    images: [pricePerformanceCategoryBanner],
    stickers: [
      {
        label: "Mest f\u00f6r pengarna",
        className: "bg-[#11667b] text-white",
      },
    ],
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
        className: "bg-[#11667b] text-white",
      },
    ],
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

export default function Products() {
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category")?.toLowerCase() || "";
  const shouldClearFilters = searchParams.get("clear_filters") === "1";
  const hasAppliedCategory = useRef(false);
  const hasAppliedQueryFilters = useRef(false);
  const [priceRange, setPriceRange] = useState([0, DEFAULT_PRODUCTS_PRICE_MAX]);
  const [selectedGPUs, setSelectedGPUs] = useState<string[]>([]);
  const [selectedCPUs, setSelectedCPUs] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [showUsedOnly, setShowUsedOnly] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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
    if (activeCategory === "budget") {
      setPriceRange([0, 6000]);
    }
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
    return displayCards.filter((card) => {
      const variant = getDisplayVariant(card.computer, card.useUsedVariant);
      const product = getProductForVariant(card.computer, card.useUsedVariant);
      const displayPrice = variant.price;
      const categoryMatch = (() => {
        if (!activeCategory) return true;
        if (activeCategory === "budget") {
          return hasCategoryTag(product, activeCategory) || displayPrice <= 6000 || card.computer.classLabels?.includes("Budget PC's");
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

      return categoryMatch && withinPrice && gpuMatch && cpuMatch && tierMatch;
    });
  }, [
    activeCategory,
    priceRange,
    selectedGPUs,
    selectedCPUs,
    selectedTiers,
    gpuLabelMap,
    cpuLabelMap,
    tierLabelMap,
    displayCards,
  ]);

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
    if (activeCategory === "price-performance") return "Price-Performance";
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

  const banner = CATEGORY_BANNERS[activeCategory] ?? DEFAULT_BANNER;
  const leadBannerImage = banner.images[0];
  const secondaryBannerImage = banner.images[1];
  const primarySticker = banner.stickers?.[0];
  const secondaryStickers = banner.stickers?.slice(1, 3) ?? [];

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0F1824] dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="px-4 pt-16 sm:pt-20 lg:pt-24 pb-6">
          <div className="mx-auto w-full max-w-[1480px]">
            <div className={`overflow-hidden rounded-3xl border border-[#e4b700] text-gray-900 ${banner.background}`}>
              {activeCategory === "toptier" ? (
                <div className="grid items-center gap-6 px-8 py-8 sm:px-10 sm:py-10 lg:grid-cols-[0.82fr_1.1fr_0.82fr] lg:gap-8 lg:px-10 xl:px-12">
                  <div className="min-w-0">
                    <div className="relative mr-auto w-full max-w-[21rem]">
                      <img
                        src={leadBannerImage}
                        alt={"Bannerbild v\u00e4nster"}
                        className="h-40 w-full rounded-[1.35rem] object-contain shadow-none sm:h-48 lg:h-56"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <div className="min-w-0 text-center">
                    <p className="text-xs uppercase tracking-[0.4em] text-gray-900/65">
                      {banner.eyebrow}
                    </p>
                    <h1 className="mt-4 break-words text-3xl font-bold leading-[1.08] tracking-[-0.02em] sm:text-4xl sm:leading-[1.02] lg:text-[4rem]">
                      {banner.title}
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl break-words text-sm text-gray-800 sm:text-base lg:text-[1.05rem]">
                      {banner.description}
                    </p>
                    {primarySticker ? (
                      <div className="mt-6 flex justify-center">
                        <div className={`rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${primarySticker.className}`}>
                          {primarySticker.label}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="relative ml-auto w-full max-w-[21rem]">
                      <img
                        src={secondaryBannerImage ?? leadBannerImage}
                        alt={"Bannerbild h\u00f6ger"}
                        className="h-40 w-full rounded-[1.35rem] object-contain shadow-none sm:h-48 lg:h-56"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid items-center gap-6 px-8 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1.18fr_0.82fr] lg:gap-10 lg:px-10 xl:px-12">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.4em] text-gray-900/65">
                      {banner.eyebrow}
                    </p>
                    <h1 className="mt-4 break-words text-3xl font-bold leading-[1.08] tracking-[-0.02em] sm:text-4xl sm:leading-[1.02] lg:text-[4rem]">
                      {banner.title}
                    </h1>
                    <p className="mt-4 max-w-2xl break-words text-sm text-gray-800 sm:text-base lg:text-[1.05rem]">
                      {banner.description}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <div className="relative ml-auto w-full max-w-[24rem] lg:max-w-[26rem]">
                      <img
                        src={leadBannerImage}
                        alt="Bannerbild"
                        className="h-40 w-full rounded-[1.35rem] object-contain shadow-none sm:h-48 lg:h-56"
                        loading="lazy"
                      />
                      <div
                        className={`absolute left-4 top-4 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${primarySticker?.className ?? "bg-[#11667b] text-white"}`}
                      >
                        {primarySticker?.label ?? banner.eyebrow}
                      </div>
                      {secondaryStickers.length > 0 ? (
                        <div className="absolute bottom-3 left-4 flex gap-2">
                          {secondaryStickers.map((sticker) => (
                            <span
                              key={sticker.label}
                              className={`rounded-full px-3 py-1 text-xs font-semibold shadow-md ${sticker.className}`}
                            >
                              {sticker.label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
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
                    max={effectivePriceMax}
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

              <div className="mb-8 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Skick</h3>
                <label className="flex items-center cursor-pointer gap-3 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={showUsedOnly}
                    onChange={() => setShowUsedOnly((prev) => !prev)}
                    className="w-4 h-4 text-yellow-400 rounded border-gray-300 dark:border-gray-700"
                  />
                  <span>Begagnade datorer</span>
                </label>
              </div>

              <hr className="my-6 border-gray-200 dark:border-gray-800" />

              <div className="mb-8 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Grafikkort</h3>
                <div
                  className={`transition-all duration-300 ${
                    showAllGpus
                      ? "max-h-72 overflow-y-auto pr-1 no-scrollbar opacity-100 translate-y-0"
                      : "max-h-48 overflow-hidden opacity-100 -translate-y-1"
                  }`}
                >
                  <div className="space-y-3">
                    {visibleGpus.map((option) => (
                      <label
                        key={option.label}
                        className="flex items-center cursor-pointer gap-3 text-sm text-gray-700 dark:text-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGPUs.includes(option.label)}
                          onChange={() => toggleFilter(option.label, selectedGPUs, setSelectedGPUs)}
                          className="w-4 h-4 text-yellow-400 rounded border-gray-300 dark:border-gray-700"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      showAllGpus ? "max-h-[1000px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1"
                    }`}
                  >
                    <div className="mt-3 space-y-3">
                      {extraGpus.map((option) => (
                        <label
                          key={option.label}
                          className="flex items-center cursor-pointer gap-3 text-sm text-gray-700 dark:text-gray-200"
                        >
                          <input
                            type="checkbox"
                            checked={selectedGPUs.includes(option.label)}
                            onChange={() => toggleFilter(option.label, selectedGPUs, setSelectedGPUs)}
                            className="w-4 h-4 text-yellow-400 rounded border-gray-300 dark:border-gray-700"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                {hasMoreGpus && (
                  <button
                    type="button"
                    onClick={() => setShowAllGpus((prev) => !prev)}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={showAllGpus ? "Visa f\u00e4rre grafikkort" : "Visa fler grafikkort"}
                  >
                    {showAllGpus ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <hr className="my-6 border-gray-200 dark:border-gray-800" />

              <div className="mb-8 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Processor</h3>
                <div
                  className={`transition-all duration-300 ${
                    showAllCpus
                      ? "max-h-72 overflow-y-auto pr-1 no-scrollbar opacity-100 translate-y-0"
                      : "max-h-48 overflow-hidden opacity-100 -translate-y-1"
                  }`}
                >
                  <div className="space-y-3">
                    {visibleCpus.map((option) => (
                      <label
                        key={option.label}
                        className="flex items-center cursor-pointer gap-3 text-sm text-gray-700 dark:text-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCPUs.includes(option.label)}
                          onChange={() => toggleFilter(option.label, selectedCPUs, setSelectedCPUs)}
                          className="w-4 h-4 text-yellow-400 rounded border-gray-300 dark:border-gray-700"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      showAllCpus ? "max-h-[1000px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1"
                    }`}
                  >
                    <div className="mt-3 space-y-3">
                      {extraCpus.map((option) => (
                        <label
                          key={option.label}
                          className="flex items-center cursor-pointer gap-3 text-sm text-gray-700 dark:text-gray-200"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCPUs.includes(option.label)}
                            onChange={() => toggleFilter(option.label, selectedCPUs, setSelectedCPUs)}
                            className="w-4 h-4 text-yellow-400 rounded border-gray-300 dark:border-gray-700"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                {hasMoreCpus && (
                  <button
                    type="button"
                    onClick={() => setShowAllCpus((prev) => !prev)}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={showAllCpus ? "Visa f\u00e4rre processorer" : "Visa fler processorer"}
                  >
                    {showAllCpus ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <hr className="my-6 border-gray-200 dark:border-gray-800" />

              <div className="mb-8 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Kategori</h3>
                <div
                  className={`transition-all duration-300 ${
                    showAllTiers
                      ? "max-h-72 overflow-y-auto pr-1 no-scrollbar opacity-100 translate-y-0"
                      : "max-h-48 overflow-hidden opacity-100 -translate-y-1"
                  }`}
                >
                  <div className="space-y-3">
                    {visibleTiers.map((option) => (
                      <label
                        key={option.label}
                        className="flex items-center cursor-pointer gap-3 text-sm text-gray-700 dark:text-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTiers.includes(option.label)}
                          onChange={() => toggleFilter(option.label, selectedTiers, setSelectedTiers)}
                          className="w-4 h-4 text-yellow-400 rounded border-gray-300 dark:border-gray-700"
                        />
                        <span className="capitalize">{option.label}</span>
                      </label>
                    ))}
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      showAllTiers ? "max-h-[1000px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1"
                    }`}
                  >
                    <div className="mt-3 space-y-3">
                      {extraTiers.map((option) => (
                        <label
                          key={option.label}
                          className="flex items-center cursor-pointer gap-3 text-sm text-gray-700 dark:text-gray-200"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTiers.includes(option.label)}
                            onChange={() => toggleFilter(option.label, selectedTiers, setSelectedTiers)}
                            className="w-4 h-4 text-yellow-400 rounded border-gray-300 dark:border-gray-700"
                          />
                          <span className="capitalize">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                {hasMoreTiers && (
                  <button
                    type="button"
                    onClick={() => setShowAllTiers((prev) => !prev)}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={showAllTiers ? "Visa f\u00e4rre kategorier" : "Visa fler kategorier"}
                  >
                    {showAllTiers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
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
                Visar {filteredProducts.length} av {displayCards.length} produkter
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
                {filteredProducts.map((card) => {
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
                  const showPreorderLabel = !inStock && canPreorder;
                  const badgeText = !hasInventory || inventoryLoading
                    ? "Kontrollerar lager"
                    : inStock
                    ? "I lager"
                    : canPreorder
                    ? "Slut i lager"
                    : "Slut i lager";
                  const badgeTone = !hasInventory || inventoryLoading
                    ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    : inStock
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                    : canPreorder
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200"
                    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200";
                  const etaNote =
                    !inStock && canPreorder
                      ? inventory?.eta_note ?? (inventory?.eta_days ? `ETA ${inventory.eta_days} dagar` : null)
                      : null;

                  const cardKey = `${computer.id}-${useUsedVariant ? "used" : "new"}`;

                  return (
                    <Link key={cardKey} to={`/computer/${computer.id}`} className="group">
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-lg hover:border-[#11667b] dark:hover:border-[#11667b] transition-all min-h-[520px]">
                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 h-72 sm:h-80 flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 dark:group-hover:from-gray-700 dark:group-hover:to-gray-800 transition-colors relative">
                          <img
                            src={computer.image}
                            alt={displayName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_IMAGE;
                            }}
                          />
                          {!showPreorderLabel && (
                            <span
                              className={`absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full ${badgeTone}`}
                            >
                              {badgeText}
                            </span>
                          )}
                          {showPreorderLabel ? (
                            <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">
                              F&ouml;rbest&auml;ll
                            </span>
                          ) : null}
                          {etaNote ? (
                            <span className="absolute bottom-3 left-3 text-xs font-semibold px-3 py-1 rounded-full bg-gray-900/80 text-white">
                              {etaNote}
                            </span>
                          ) : null}
                          </div>

                        <div className="p-4 pb-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-[#11667b] dark:group-hover:text-[#11667b] transition-colors">
                            {displayName}
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
                            <p className="truncate">CPU: {variant.cpu}</p>
                            <p className="truncate">GPU: {variant.gpu}</p>
                            <p className="flex flex-wrap items-center gap-2">
                              <span>
                                RAM:{" "}
                                <span className="cursor-help" title={RAM_PRICE_TOOLTIP}>
                                  {variant.ram}
                                </span>
                              </span>
                              <span
                                className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 cursor-help"
                                title={RAM_PRICE_TOOLTIP}
                              >
                                Begagnade
                              </span>
                            </p>
                            <p className="truncate">
                              Lagring: {variant.storage} {variant.storagetype}
                            </p>
                          </div>

                          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {displayPrice.toLocaleString("sv-SE")} kr
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
