import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { getProductIdByName, useProducts, type SupabaseProduct } from "@/hooks/useProducts";
import { COMPUTERS, Computer } from "@/data/computers";
import { buildProductLookup, getProductFromLookup, mergeProductFields } from "@/lib/productOverrides";
import { normalizeProductImagePath, resolveProductImage } from "@/lib/productImageResolver";
import {
  buildDefaultFpsSandboxSettings,
  computeSandboxFps,
  findSandboxEntry,
  getSandboxGames,
  getSandboxGraphics,
  getSandboxResolutions,
  normalizeFpsSandboxSettings,
} from "@/lib/fpsSandbox";
import {
  sanitizeUsedPartsSettings,
} from "@/lib/usedParts";
import { checkStock } from "@/lib/supabaseServices";
import fortniteImage from "../../images/fortnite.jpg";
import cyberpunkImage from "../../images/Cyberpunk 2077.jfif";
import gta5Image from "../../images/Gta 5.jpg";
import minecraftImage from "../../images/minecraft.jpg";
import cs2Image from "../../images/cs2.jpg";
import ghostImage from "../../images/Ghost Of Tsushima.jpg";

const GAME_IMAGES: Record<string, string> = {
  Fortnite: fortniteImage,
  "Cyberpunk 2077": cyberpunkImage,
  "GTA 5": gta5Image,
  Minecraft: minecraftImage,
  CS2: cs2Image,
  "Ghost of Tsushima": ghostImage,
};
const RAM_PRICE_TOOLTIP =
  "Priserna p\u00e5 RAM har g\u00e5tt upp med cirka 500%, d\u00e4rav anv\u00e4ndning av begagnade RAM.";

const buildComputerFromSupabaseProduct = (product: SupabaseProduct): Computer => {
  const normalizedImage = normalizeProductImagePath(product.image_url || "") || DETAIL_FALLBACK_IMAGE;
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
const DEFAULT_PRODUCT_INFO = [
  {
    title: "Game Changer",
    body:
      "Kraftfulla komponenter ger hög prestanda för spel och kreativa arbetsflöden. Perfekt balans mellan CPU, GPU och snabb lagring.",
  },
  {
    title: "Ultimat strålspårning och AI",
    body:
      "Modern grafik med ray tracing och AI-förbättringar levererar skarpa bilder och mjuk upplevelse även i krävande titlar.",
  },
];
const DETAIL_FALLBACK_IMAGE = "/Datorhuset.png";
const DISABLED_FEATURE_TOOLTIP = "funktion ej implementerad i spelet";
const DLSS_MODE_LABELS: Record<string, string> = {
  quality: "Quality",
  balanced: "Balanced",
  performance: "Performance",
};

type ProductImagesResponse = {
  images?: string[];
  image_url?: string | null;
};

const toUsedName = (name: string) => {
  const trimmed = name.trim();
  const replaced = trimmed.replace(/\s*-\s*Ny$/i, " - Begagnade");
  return replaced === trimmed ? `${trimmed} - Begagnade` : replaced;
};

type DetailUsedPartsSource = {
  cpu?: boolean;
  gpu?: boolean;
  ram?: boolean;
  storage?: boolean;
  motherboard?: boolean;
  psu?: boolean;
  case_name?: boolean;
  cpu_cooler?: boolean;
  caseName?: boolean;
  cpuCooler?: boolean;
};

const toUsedPartsSettings = (source?: DetailUsedPartsSource | null) =>
  sanitizeUsedPartsSettings({
    ...(source || {}),
    case_name: source?.case_name ?? source?.caseName,
    cpu_cooler: source?.cpu_cooler ?? source?.cpuCooler,
  });

const TOP_SELLER_REVIEWS: Record<
  string,
  {
    average: number;
    total: number;
    breakdown: { stars: number; count: number }[];
    reviews: { name: string; rating: number; text: string; date: string }[];
  }
> = {
  "2": {
    average: 4.6,
    total: 287,
    breakdown: [
      { stars: 5, count: 188 },
      { stars: 4, count: 72 },
      { stars: 3, count: 18 },
      { stars: 2, count: 6 },
      { stars: 1, count: 3 },
    ],
    reviews: [
      {
        name: "Emma L.",
        rating: 5,
        text: "Otrolig prestanda i spel och streaming. Tyst och stabil.",
        date: "2025-11-18",
      },
      {
        name: "Johan M.",
        rating: 4,
        text: "Snabb leverans och snyggt bygge. Rekommenderas.",
        date: "2025-10-29",
      },
      {
        name: "Sara K.",
        rating: 5,
        text: "Perfekt balans mellan pris och prestanda.",
        date: "2025-10-12",
      },
    ],
  },
  "4": {
    average: 4.9,
    total: 834,
    breakdown: [
      { stars: 5, count: 620 },
      { stars: 4, count: 150 },
      { stars: 3, count: 40 },
      { stars: 2, count: 14 },
      { stars: 1, count: 10 },
    ],
    reviews: [
      {
        name: "Oskar R.",
        rating: 5,
        text: "B\u00e4sta datorn jag haft. Maxar allt i 4K.",
        date: "2025-11-22",
      },
      {
        name: "Lina S.",
        rating: 5,
        text: "K\u00e4nns riktigt premium. Byggkvaliteten \u00e4r topp.",
        date: "2025-11-03",
      },
      {
        name: "Mahmoud A.",
        rating: 4,
        text: "Snabb och kraftfull, men ville ha fler USB-portar.",
        date: "2025-10-08",
      },
    ],
  },
  "7": {
    average: 4.7,
    total: 423,
    breakdown: [
      { stars: 5, count: 280 },
      { stars: 4, count: 105 },
      { stars: 3, count: 26 },
      { stars: 2, count: 8 },
      { stars: 1, count: 4 },
    ],
    reviews: [
      {
        name: "Anton P.",
        rating: 5,
        text: "Stabil FPS i alla spel jag k\u00f6r. Supern\u00f6jd.",
        date: "2025-11-09",
      },
      {
        name: "Felicia T.",
        rating: 4,
        text: "Snyggt bygge och bra kylning. Lite h\u00f6g leveranstid.",
        date: "2025-10-20",
      },
      {
        name: "Daniel N.",
        rating: 5,
        text: "Perfekt f\u00f6r 1440p. Rekommenderas varmt.",
        date: "2025-10-02",
      },
    ],
  },
};

const buildDefaultReviewData = (computer: Computer) => {
  const total = Math.max(18, Math.min(999, computer.reviews || 120));
  const average = 4.2 + (total % 6) * 0.1;
  const breakdown = [
    { stars: 5, count: Math.round(total * 0.55) },
    { stars: 4, count: Math.round(total * 0.28) },
    { stars: 3, count: Math.round(total * 0.1) },
    { stars: 2, count: Math.round(total * 0.05) },
    { stars: 1, count: Math.max(1, total - Math.round(total * 0.98)) },
  ];
  return {
    average: Number(average.toFixed(1)),
    total,
    breakdown,
    reviews: [
      {
        name: "Alex S.",
        rating: 5,
        text: "Stabil prestanda och snyggt bygge. Mycket n\u00f6jd.",
        date: "2025-11-04",
      },
      {
        name: "Nora G.",
        rating: 4,
        text: "Snabb leverans och bra support. Rekommenderas.",
        date: "2025-10-22",
      },
      {
        name: "Lucas W.",
        rating: 4,
        text: "Prisv\u00e4rt val f\u00f6r vardag och gaming.",
        date: "2025-10-10",
      },
    ],
  };
};

export default function ComputerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);
  const [useUsedVariant, setUseUsedVariant] = useState(false);
  const [usedVariantEnabled, setUsedVariantEnabled] = useState<boolean | null>(null);
  const [usedPartsFromApi, setUsedPartsFromApi] = useState<Record<string, boolean> | null>(null);
  const [usedPartsConfigured, setUsedPartsConfigured] = useState<boolean>(false);
  const [productImagesFromApi, setProductImagesFromApi] = useState<string[]>([]);
  const { products } = useProducts();
  const productLookup = useMemo(() => buildProductLookup(products), [products]);

  const [fpsSettings, setFpsSettings] = useState(buildDefaultFpsSandboxSettings());
  const gameList = useMemo(() => getSandboxGames(fpsSettings), [fpsSettings]);
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedResolution, setSelectedResolution] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [dlssOn, setDlssOn] = useState(false);
  const [frameGenOn, setFrameGenOn] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [inventoryStatus, setInventoryStatus] = useState<{
    inStock: boolean;
    canPreorder: boolean;
    etaDays: number | null;
    etaNote: string | null;
  } | null>(null);

  const localComputer = COMPUTERS.find((c) => c.id === id);
  const supabaseOnlyProduct = localComputer ? null : getProductFromLookup(productLookup, id);
  const computer: Computer | undefined = localComputer || (supabaseOnlyProduct ? buildComputerFromSupabaseProduct(supabaseOnlyProduct) : undefined);
  const baseProductId = computer
    ? localComputer
      ? getProductIdByName(localComputer.name) || getProductIdByName(localComputer.id)
      : supabaseOnlyProduct?.id || null
    : null;
  const usedProductId = localComputer?.usedVariant?.productKey
    ? getProductIdByName(localComputer.usedVariant.productKey)
    : null;
  const activeProductId = useUsedVariant && usedProductId ? usedProductId : baseProductId;

  const fallbackComputerImages = useMemo(() => {
    if (!computer) return [];
    return Array.from(
      new Set(
        [...(Array.isArray(computer.images) ? computer.images : []), computer.image || ""]
          .map((image) => normalizeProductImagePath(image) || "")
          .filter(Boolean)
      )
    );
  }, [computer]);

  const images = useMemo(() => {
    const rawImages = productImagesFromApi.length > 0 ? productImagesFromApi : fallbackComputerImages;
    return Array.from(
      new Set(
        rawImages
          .map((image) => normalizeProductImagePath(image) || "")
          .filter(Boolean)
      )
    );
  }, [fallbackComputerImages, productImagesFromApi]);
  const detailImageCandidates = useMemo(() => {
    if (images.length > 0) return images;
    if (fallbackComputerImages.length > 0) return fallbackComputerImages;
    return [DETAIL_FALLBACK_IMAGE];
  }, [fallbackComputerImages, images]);

  useEffect(() => {
    if (!baseProductId || !computer?.usedVariant) {
      setUsedVariantEnabled(computer?.usedVariantEnabled ?? null);
      return;
    }
    let active = true;
    const loadUsedVariant = async () => {
      try {
        const response = await fetch(`/api/used-variant/${baseProductId}`);
        if (!response.ok) return;
        const data = await response.json();
        if (!active) return;
        if (typeof data?.enabled === "boolean") {
          setUsedVariantEnabled(data.enabled);
        }
      } catch (error) {
        console.warn("Failed to load used-variant setting", error);
      }
    };
    loadUsedVariant();
    return () => {
      active = false;
    };
  }, [baseProductId, computer?.usedVariant, computer?.usedVariantEnabled]);

  useEffect(() => {
    setSelectedImage(0);
  }, [computer?.id]);

  const hasUsedVariant =
    Boolean(computer?.usedVariant) && (usedVariantEnabled ?? computer?.usedVariantEnabled ?? true);

  useEffect(() => {
    const variant = searchParams.get("variant");
    setUseUsedVariant(Boolean(variant === "used" && hasUsedVariant));
  }, [computer?.id, computer?.usedVariant, hasUsedVariant, searchParams]);

  useEffect(() => {
    if (!hasUsedVariant && useUsedVariant) {
      setUseUsedVariant(false);
    }
  }, [hasUsedVariant, useUsedVariant]);

  useEffect(() => {
    if (!activeProductId) return;
    let isMounted = true;
    const loadInventory = async () => {
      try {
        const status = await checkStock(activeProductId);
        if (!isMounted) return;
        setInventoryStatus({
          inStock: status.inStock,
          canPreorder: status.canPreorder,
          etaDays: status.etaDays ?? null,
          etaNote: status.etaNote ?? null,
        });
      } catch (error) {
        console.warn("Failed to fetch inventory status", error);
      }
    };
    loadInventory();
    return () => {
      isMounted = false;
    };
  }, [activeProductId]);

  if (!computer) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-24 flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold mb-4">Datorn hittades inte</h1>
          <button
            onClick={() => navigate("/products")}
            className="bg-yellow-400 hover:bg-[#11667b] hover:text-white text-gray-900 px-6 py-3 rounded font-semibold transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till produkter
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      if (!activeProductId) {
        alert("Laddar produktinformation, försök igen om en stund.");
        return;
      }
      await addToCart(activeProductId, quantity);
      navigate("/cart");
    } catch (error) {
      console.error("Failed to add to cart", error);
      alert("Kunde inte lägga till i kundvagn");
    } finally {
      setAddingToCart(false);
    }
  };

  const reviewData = TOP_SELLER_REVIEWS[computer.id] ?? buildDefaultReviewData(computer);
  const activeVariant = useUsedVariant && hasUsedVariant && computer.usedVariant ? computer.usedVariant : null;
  const usedDisplayName = computer.usedVariant?.productKey || toUsedName(computer.name);
  const fallbackName =
    useUsedVariant && hasUsedVariant && computer.usedVariant ? usedDisplayName : computer.name;
  const activeProduct = useUsedVariant
    ? (usedProductId ? getProductFromLookup(productLookup, usedProductId) : null) ||
      (computer.usedVariant?.productKey ? getProductFromLookup(productLookup, computer.usedVariant.productKey) : null)
    : getProductFromLookup(productLookup, activeProductId) ||
      getProductFromLookup(productLookup, computer.name) ||
      getProductFromLookup(productLookup, computer.id);
  useEffect(() => {
    if (!activeProductId) return;
    let isMounted = true;
    const loadFps = async () => {
      try {
        const response = await fetch(`/api/fps-settings/${activeProductId}`);
        if (!response.ok) return;
        const data = await response.json();
        if (isMounted && data?.fps) {
          setFpsSettings(normalizeFpsSandboxSettings(data.fps));
        }
      } catch (error) {
        console.error("Failed to load FPS settings", error);
      }
    };
    loadFps();
    return () => {
      isMounted = false;
    };
  }, [activeProductId]);

  useEffect(() => {
    if (!activeProductId) {
      setProductImagesFromApi([]);
      return;
    }
    let isMounted = true;
    setProductImagesFromApi([]);
    const loadProductImages = async () => {
      try {
        const response = await fetch(`/api/product-images/${activeProductId}`);
        const data = (await response.json().catch(() => ({}))) as ProductImagesResponse;
        if (!response.ok || !isMounted) return;
        const merged = Array.from(
          new Set(
            [...(Array.isArray(data?.images) ? data.images : []), data?.image_url || ""]
              .map((image) => normalizeProductImagePath(image || "") || "")
              .filter((image) => Boolean(image) && !/\/datorhuset\.png$/i.test(image))
          )
        );
        setProductImagesFromApi(merged);
      } catch (error) {
        console.warn("Failed to load product images", error);
        if (isMounted) setProductImagesFromApi([]);
      }
    };
    loadProductImages();
    return () => {
      isMounted = false;
    };
  }, [activeProductId]);

  useEffect(() => {
    if (!activeProductId) {
      setUsedPartsConfigured(false);
      setUsedPartsFromApi(null);
      return;
    }
    let isMounted = true;
    const loadUsedParts = async () => {
      try {
        const response = await fetch(`/api/used-parts/${activeProductId}`);
        if (!response.ok) return;
        const data = await response.json();
        if (!isMounted) return;
        const configured = data?.configured === true;
        setUsedPartsConfigured(configured);
        setUsedPartsFromApi(configured ? sanitizeUsedPartsSettings(data?.used_parts) : null);
      } catch (error) {
        console.warn("Failed to load used-parts settings", error);
        if (isMounted) {
          setUsedPartsConfigured(false);
          setUsedPartsFromApi(null);
        }
      }
    };
    loadUsedParts();
    return () => {
      isMounted = false;
    };
  }, [activeProductId]);

  useEffect(() => {
    if (!gameList.length) return;
    if (!gameList.includes(selectedGame)) {
      setSelectedGame(gameList[0]);
    }
  }, [gameList, selectedGame]);

  const visibleResolutions = useMemo(
    () => (selectedGame ? getSandboxResolutions(fpsSettings, selectedGame) : []),
    [fpsSettings, selectedGame]
  );

  useEffect(() => {
    if (!visibleResolutions.length) {
      if (selectedResolution !== "") {
        setSelectedResolution("");
      }
      return;
    }
    if (!visibleResolutions.includes(selectedResolution)) {
      setSelectedResolution(visibleResolutions[0]);
    }
  }, [selectedResolution, visibleResolutions]);

  const activeResolution = visibleResolutions.includes(selectedResolution)
    ? selectedResolution
    : visibleResolutions[0] || "";
  const visiblePresets = useMemo(
    () => (selectedGame && activeResolution ? getSandboxGraphics(fpsSettings, selectedGame, activeResolution) : []),
    [activeResolution, fpsSettings, selectedGame]
  );

  useEffect(() => {
    if (!visiblePresets.length) {
      if (selectedPreset !== "") {
        setSelectedPreset("");
      }
      return;
    }
    if (!visiblePresets.includes(selectedPreset)) {
      setSelectedPreset(visiblePresets[0]);
    }
  }, [selectedPreset, visiblePresets]);

  const activePreset = visiblePresets.includes(selectedPreset) ? selectedPreset : visiblePresets[0] || "";
  const activeFpsEntry = findSandboxEntry(fpsSettings, selectedGame, activeResolution, activePreset);
  const supports = {
    dlss: Boolean(activeFpsEntry?.supportsDlssFsr),
    frameGen: Boolean(activeFpsEntry?.supportsFrameGeneration),
  };
  useEffect(() => {
    if (!supports.dlss && dlssOn) setDlssOn(false);
    if (!supports.frameGen && frameGenOn) setFrameGenOn(false);
  }, [supports, dlssOn, frameGenOn]);
  const averageFps = computeSandboxFps(activeFpsEntry, {
    dlssFsrOn: dlssOn,
    frameGenerationOn: frameGenOn,
  });
  const dlssTooltipText = !supports.dlss
    ? DISABLED_FEATURE_TOOLTIP
    : activeFpsEntry?.dlssFsrMode
      ? `Läge: ${DLSS_MODE_LABELS[activeFpsEntry.dlssFsrMode] || activeFpsEntry.dlssFsrMode}`
      : "";
  const frameGenTooltipText = !supports.frameGen ? DISABLED_FEATURE_TOOLTIP : "";
  const hasFpsData =
    gameList.length > 0 &&
    visibleResolutions.length > 0 &&
    visiblePresets.length > 0 &&
    Boolean(activeFpsEntry);

  const merged = mergeProductFields(
    {
      name: fallbackName,
      price: activeVariant?.price ?? computer.price,
      cpu: activeVariant?.cpu ?? computer.cpu,
      gpu: activeVariant?.gpu ?? computer.gpu,
      ram: activeVariant?.ram ?? computer.ram,
      storage: activeVariant?.storage ?? computer.storage,
      storagetype: activeVariant?.storagetype ?? computer.storagetype,
      tier: activeVariant?.tier ?? computer.tier,
    },
    activeProduct,
  );
  const displayPrice = merged.price;
  const displayName = merged.name;
  const osValue = merged.os || "Windows 10 Pro";
  const displaySpecs = {
    cpu: merged.cpu,
    gpu: merged.gpu,
    ram: merged.ram,
    storage: merged.storage,
    storagetype: merged.storagetype,
    tier: merged.tier,
    motherboard: merged.motherboard,
    psu: merged.psu,
    caseName: merged.caseName,
    cpuCooler: merged.cpuCooler,
    os: osValue,
  };
  const baseUsedParts = (computer as Computer & { usedParts?: DetailUsedPartsSource }).usedParts || null;
  const fallbackUsedParts = toUsedPartsSettings(useUsedVariant ? activeVariant?.usedParts : baseUsedParts);
  const usedParts = useMemo(
    () => (usedPartsConfigured ? sanitizeUsedPartsSettings(usedPartsFromApi) : fallbackUsedParts),
    [fallbackUsedParts, usedPartsConfigured, usedPartsFromApi]
  );
  const specRows = useMemo(
    () => {
      const rows = [
        { label: "Processor (CPU)", value: displaySpecs.cpu, used: usedParts.cpu },
        { label: "Grafikkort (GPU)", value: displaySpecs.gpu, used: usedParts.gpu },
        {
          label: "RAM-minne",
          value: displaySpecs.ram,
          used: usedParts.ram,
          tooltip: usedParts.ram ? RAM_PRICE_TOOLTIP : undefined,
        },
        {
          label: "Lagring",
          value: `${displaySpecs.storage} ${displaySpecs.storagetype}`.trim(),
          used: usedParts.storage,
        },
        { label: "Moderkort", value: displaySpecs.motherboard, used: usedParts.motherboard },
        { label: "Nätaggregat", value: displaySpecs.psu, used: usedParts.psu },
        { label: "Chassi", value: displaySpecs.caseName, used: usedParts.case_name },
        { label: "CPU-kylare", value: displaySpecs.cpuCooler, used: usedParts.cpu_cooler },
        { label: "Operativsystem", value: displaySpecs.os, used: false },
        { label: "Kategori", value: displaySpecs.tier, used: false },
      ];

      return rows.filter((row) => {
        const value = typeof row.value === "string" ? row.value.trim() : row.value;
        return Boolean(value);
      });
    },
    [
      displaySpecs.cpu,
      displaySpecs.gpu,
      displaySpecs.ram,
      displaySpecs.storage,
      displaySpecs.storagetype,
      displaySpecs.tier,
      displaySpecs.motherboard,
      displaySpecs.psu,
      displaySpecs.caseName,
      displaySpecs.cpuCooler,
      displaySpecs.os,
      usedParts.cpu,
      usedParts.gpu,
      usedParts.ram,
      usedParts.storage,
      usedParts.motherboard,
      usedParts.psu,
      usedParts.case_name,
      usedParts.cpu_cooler,
    ],
  );
  const productInfoSections = useMemo(() => {
    const rawDescription = merged.description?.trim() || "";
    if (!rawDescription) return DEFAULT_PRODUCT_INFO;
    const parts = rawDescription
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);
    if (parts.length === 1) {
      return [{ title: "Produktinfo", body: parts[0] }];
    }
    const [first, second, ...rest] = parts;
    const secondBody = rest.length ? `${second}\n\n${rest.join("\n\n")}` : second;
    return [
      { title: DEFAULT_PRODUCT_INFO[0].title, body: first },
      { title: DEFAULT_PRODUCT_INFO[1].title, body: secondBody },
    ];
  }, [merged.description]);
  const availability = useMemo(() => {
    if (!inventoryStatus) {
      return {
        label: "Kontrollerar lager",
        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
        schema: "https://schema.org/InStock",
      };
    }
    if (inventoryStatus.inStock) {
      return {
        label: "I lager",
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
        schema: "https://schema.org/InStock",
      };
    }
    if (inventoryStatus.canPreorder) {
      return {
        label: "Slut i lager",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
        schema: "https://schema.org/PreOrder",
      };
    }
    return {
      label: "Slut i lager",
      className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
      schema: "https://schema.org/OutOfStock",
    };
  }, [inventoryStatus]);
  const showPreorderLabel = Boolean(inventoryStatus && !inventoryStatus.inStock && inventoryStatus.canPreorder);
  const etaLabel = useMemo(() => {
    if (!inventoryStatus || !inventoryStatus.canPreorder) return null;
    return inventoryStatus.etaNote || (inventoryStatus.etaDays ? `ETA ${inventoryStatus.etaDays} dagar` : null);
  }, [inventoryStatus]);
  const structuredData = useMemo(() => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://datorhuset.site";
    const imageUrls = (detailImageCandidates.length
      ? detailImageCandidates
      : [DETAIL_FALLBACK_IMAGE]
    ).map((img) => (img.startsWith("http") ? img : new URL(img, baseUrl).toString()));
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: displayName,
      image: imageUrls,
      description: `${displaySpecs.cpu}, ${displaySpecs.gpu}, ${displaySpecs.ram}, ${displaySpecs.storage} ${displaySpecs.storagetype}`,
      sku: computer.id,
      brand: {
        "@type": "Brand",
        name: "DatorHuset",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "SEK",
        price: displayPrice,
        availability: availability.schema,
        url: `${baseUrl}/computer/${computer.id}`,
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: reviewData.average,
        reviewCount: reviewData.total,
      },
      review: reviewData.reviews.slice(0, 2).map((review) => ({
        "@type": "Review",
        author: { "@type": "Person", name: review.name },
        datePublished: review.date,
        reviewBody: review.text,
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.rating,
          bestRating: "5",
          worstRating: "1",
        },
      })),
    };
    const breadcrumbSchema = {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Hem",
          item: `${baseUrl}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Produkter",
          item: `${baseUrl}/products`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: displayName,
          item: `${baseUrl}/computer/${computer.id}`,
        },
      ],
    };
    return {
      "@context": "https://schema.org",
      "@graph": [productSchema, breadcrumbSchema],
    };
  }, [availability.schema, computer, detailImageCandidates, displayName, displayPrice, displaySpecs, reviewData]);

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={index < rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}
        >
          {"\u2605"}
        </span>
      ))}
    </div>
  );

  const enrichedComputers = useMemo(
    () =>
      COMPUTERS.map((item) => {
        const product = getProductFromLookup(productLookup, item.name);
        const resolvedItemImage = resolveProductImage(product, DETAIL_FALLBACK_IMAGE) || DETAIL_FALLBACK_IMAGE;
        const mergedItem = mergeProductFields(
          {
            name: item.name,
            price: item.price,
            cpu: item.cpu,
            gpu: item.gpu,
            ram: item.ram,
            storage: item.storage,
            storagetype: item.storagetype,
            tier: item.tier,
          },
          product,
        );
        return {
          ...item,
          image: resolvedItemImage,
          images: [resolvedItemImage],
          name: mergedItem.name,
          price: mergedItem.price,
          cpu: mergedItem.cpu,
          gpu: mergedItem.gpu,
          ram: mergedItem.ram,
          storage: mergedItem.storage,
          storagetype: mergedItem.storagetype,
          tier: mergedItem.tier,
        };
      }),
    [productLookup],
  );
  const comparisonCandidates = enrichedComputers.filter((c) => c.id !== computer.id);
  const sameTier = comparisonCandidates.filter((c) => c.tier === computer.tier);
  const comparisonPool = (sameTier.length >= 2
    ? sameTier
    : [...sameTier, ...comparisonCandidates.filter((c) => c.tier !== computer.tier)]
  ).slice(0, 2);
  const currentComparisonItem =
    enrichedComputers.find((entry) => entry.id === computer.id) ||
    ({ ...computer, image: detailImageCandidates[0] || DETAIL_FALLBACK_IMAGE, images: detailImageCandidates } as Computer);
  const comparisonItems = [currentComparisonItem, ...comparisonPool];
  const hasMultipleImages = detailImageCandidates.length > 1;
  const resolvedImage = detailImageCandidates[selectedImage] || detailImageCandidates[0] || DETAIL_FALLBACK_IMAGE;

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="flex-1 container mx-auto px-4 py-6 sm:py-10 lg:py-16 pb-24 lg:pb-16">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 gap-2 mb-6 sm:mb-8">
          <button className="hover:text-gray-800 dark:hover:text-gray-200" onClick={() => navigate("/")}>Hem</button>
          <span>/</span>
          <span>Datorer & Surfplattor</span>
          <span>/</span>
          <span>Gamingdatorer stationära</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-semibold">{displayName}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
          {/* Left: image area */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-4 sm:p-5 lg:p-6 flex flex-col gap-4 shadow-lg border border-gray-200 dark:border-gray-800">
            <div className="relative w-full aspect-[4/3] bg-gray-200 dark:bg-[#0f1824] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-800 shadow-sm backdrop-blur dark:bg-black/70 dark:text-gray-100">
                Ungefärligt hur bygget ska se ut som
              </div>
              <img
                src={resolvedImage}
                alt={displayName}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
                draggable={false}
                data-image-index={String(selectedImage)}
                onError={(e) => {
                  const currentIndex = Number(e.currentTarget.dataset.imageIndex || "0");
                  const nextIndex = currentIndex + 1;
                  if (nextIndex < detailImageCandidates.length) {
                    setSelectedImage(nextIndex);
                    e.currentTarget.dataset.imageIndex = String(nextIndex);
                    return;
                  }
                  e.currentTarget.src = DETAIL_FALLBACK_IMAGE;
                }}
              />
              {hasMultipleImages && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImage(
                        (prev) => (prev - 1 + detailImageCandidates.length) % detailImageCandidates.length
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-gray-900 shadow hover:bg-white transition-colors dark:bg-gray-900/90 dark:text-gray-100"
                    aria-label="Föregående bild"
                  >
                    <ChevronLeft className="w-5 h-5 mx-auto" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev + 1) % detailImageCandidates.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-gray-900 shadow hover:bg-white transition-colors dark:bg-gray-900/90 dark:text-gray-100"
                    aria-label="Nästa bild"
                  >
                    <ChevronRight className="w-5 h-5 mx-auto" />
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              {detailImageCandidates.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 transition-all duration-200 ${selectedImage === i ? "border-[#22d3ee] ring-4 ring-[#22d3ee]/55 shadow-[0_0_24px_rgba(34,211,238,0.7)] scale-105" : "border-gray-300 dark:border-gray-700"} bg-white dark:bg-gray-900 overflow-hidden`}
                  aria-label={`Vy ${i + 1}`}
                >
                  <img
                    src={img}
                    alt={`${displayName} vy ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = DETAIL_FALLBACK_IMAGE;
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right: info/buy box */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">{displayName}</h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {displaySpecs.cpu}, {displaySpecs.gpu}, {displaySpecs.ram}, {displaySpecs.storage}{" "}
                {displaySpecs.storagetype}
              </p>
            </div>

            <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              {displayPrice.toLocaleString("sv-SE")} kr
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Exkl. moms</div>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold">
              {!showPreorderLabel && (
                <span className={`rounded-full px-3 py-1 ${availability.className}`}>{availability.label}</span>
              )}
              {etaLabel && (
                <span className="rounded-full px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  {etaLabel}
                </span>
              )}
              {showPreorderLabel && (
                <span className="relative group">
                  <span className="rounded-full px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">
                    F&ouml;rbest&auml;ll
                  </span>
                  <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    F&ouml;rbest&auml;ll varan och f&aring; den inom 2 veckor d&aring; varan &auml;r slut p&aring; lager.
                  </span>
                </span>
              )}
            </div>

            {hasUsedVariant && (
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-600 dark:text-gray-300">
                <span className={useUsedVariant ? "text-gray-500" : "text-gray-900 dark:text-white"}>Nya delar</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={useUsedVariant}
                  onClick={() => setUseUsedVariant((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useUsedVariant ? "bg-yellow-400" : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span className="sr-only">V\u00e4xla begagnade delar</span>
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      useUsedVariant ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className={useUsedVariant ? "text-gray-900 dark:text-white" : "text-gray-500"}>
                  Begagnade delar
                </span>
              </div>
            )}

            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:flex sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Minska antal"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-6 py-3 text-lg font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="?ka antal"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !activeProductId}
                className="w-full sm:flex-1 sm:min-w-[220px] inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-[#11667b] hover:text-white disabled:bg-gray-300 dark:disabled:bg-gray-700 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {addingToCart ? "Lägger till..." : "Lägg i kundvagn"}
              </button>
            </div>

            <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
              <p>Beräknad leverans: 1-2 arbetsdagar</p>
              <p>Byggtid: i lager 1-2 dagar, förbeställd (nya delar) cirka 5 dagar, förbeställd (begagnade delar) 1-2 veckor.</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-10 sm:mt-12 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6">
          <div className="flex gap-6 border-b border-gray-200 dark:border-gray-800 pb-4 mb-6 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <span className="text-gray-900 dark:text-white">Produktinfo</span>
            <span>Specifikationer</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-gray-700 dark:text-gray-200">
            <div className="space-y-4">
              {productInfoSections.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{section.title}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{section.body}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3 text-sm">
              {specRows.map((row, index) => {
                const showUsedBadge = Boolean(row.used);
                return (
                <div
                  key={row.label}
                  className={`flex justify-between ${index < specRows.length - 1 ? "border-b border-gray-200 dark:border-gray-800 pb-2" : ""}`}
                >
                  <span>{row.label}</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-right">
                    {row.tooltip ? (
                      <span className="relative inline-flex items-center justify-end gap-1 group">
                        <span>{row.value}</span>
                        <span className="pointer-events-none absolute right-0 top-full z-10 mt-2 w-60 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                          {row.tooltip}
                        </span>
                      </span>
                    ) : (
                      row.value
                    )}
                    {showUsedBadge && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">
                        Begagnade
                      </span>
                    )}
                  </span>
                </div>
              );
              })}
              {computer.bundleIncludes?.length ? (
                <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1824] p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-2">Ingår i paketet</p>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {computer.bundleIncludes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Warranty */}
        <div className="mt-10 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Garanti & returer</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-gray-700 dark:text-gray-300">
            <div className="space-y-2">
              <p className="font-semibold text-gray-900 dark:text-white">3 års reklamationsrätt</p>
              <p>Du har rätt att reklamera och skicka tillbaka varan om ett ursprungligt fel upptäcks.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-900 dark:text-white">14 dagars öppet köp vid frakt!</p>
              <p>Testa i lugn och ro. Returnera om den inte passar dina behov.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-900 dark:text-white">Trygg support</p>
              <p>Vi hjälper dig med felsökning och uppgraderingar när du vill.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-900 dark:text-white">Snabb återkoppling</p>
              <p>Kontakta oss så återkommer vi med nästa steg och tidsplan.</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/kundservice"
              className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-gray-900 font-semibold px-5 py-2 rounded-lg hover:bg-[#11667b] hover:text-white transition-colors"
            >
              Kontakta kundservice
            </Link>
          </div>
        </div>

        {/* FPS estimator */}
        <div className="mt-12 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Uppskattad FPS</h2>
              <div className="space-y-3">
                <label className="text-sm text-gray-700 dark:text-gray-300" htmlFor="game">Välj spel</label>
                <select
                  id="game"
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  disabled={gameList.length === 0}
                  className="w-full bg-white dark:bg-[#0f1824] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  {gameList.length ? (
                    gameList.map((game) => (
                      <option key={game} value={game}>{game}</option>
                    ))
                  ) : (
                    <option value="">Inga spel tillgängliga</option>
                  )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300" htmlFor="res">Upplösning</label>
                  <select
                    id="res"
                    value={activeResolution}
                    onChange={(e) => setSelectedResolution(e.target.value)}
                    disabled={visibleResolutions.length === 0}
                    className="w-full bg-white dark:bg-[#0f1824] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {visibleResolutions.length ? (
                      visibleResolutions.map((res) => (
                        <option key={res} value={res}>{res}</option>
                      ))
                    ) : (
                      <option value="">Ingen upplösning</option>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300" htmlFor="preset">Grafik</label>
                  <select
                    id="preset"
                    value={activePreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    disabled={visiblePresets.length === 0}
                    className="w-full bg-white dark:bg-[#0f1824] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {visiblePresets.length ? (
                      visiblePresets.map((preset) => (
                        <option key={preset} value={preset}>{preset}</option>
                      ))
                    ) : (
                      <option value="">Ingen grafikprofil</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <span className="relative group">
                  <button
                    onClick={() => setDlssOn((v) => !v)}
                    disabled={!supports.dlss}
                    className={`px-4 py-2 rounded-lg border ${
                      dlssOn
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                        : "border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0f1824]"
                    } text-sm font-semibold ${!supports.dlss ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    DLSS / FSR {dlssOn ? "On" : "Off"}
                  </button>
                  {dlssTooltipText ? (
                    <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      {dlssTooltipText}
                    </span>
                  ) : null}
                </span>
                <span className="relative group">
                  <button
                    onClick={() => setFrameGenOn((v) => !v)}
                    disabled={!supports.frameGen}
                    className={`px-4 py-2 rounded-lg border ${
                      frameGenOn
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                        : "border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0f1824]"
                    } text-sm font-semibold ${!supports.frameGen ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    Frame generation {frameGenOn ? "On" : "Off"}
                  </button>
                  {frameGenTooltipText ? (
                    <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      {frameGenTooltipText}
                    </span>
                  ) : null}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f1824] border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-28 h-28 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                  {GAME_IMAGES[selectedGame] ? (
                    <img
                      src={GAME_IMAGES[selectedGame]}
                      alt={selectedGame}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-center text-sm text-gray-700 dark:text-gray-300">
                      {selectedGame}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{activeResolution} {"\u00d7"} {activePreset}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{hasFpsData ? `${averageFps} FPS` : "-"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {hasFpsData ? "Beräknat med vald konfiguration" : "Inga FPS-variabler finns för den här produkten ännu"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Comparison */}
        <div className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{"J\u00e4mf\u00f6r liknande datorer"}</h2>
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{"2\u20133 alternativ med liknande niv\u00e5"}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisonItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4"
              >
                <div className="h-52 sm:h-56 md:h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {item.price.toLocaleString("sv-SE")} kr
                  </p>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 border-t border-gray-200 dark:border-gray-800 pt-3">
                  <p>CPU: {item.cpu}</p>
                  <p>GPU: {item.gpu}</p>
                  <p className="flex flex-wrap items-center gap-2">
                    <span>
                      RAM:{" "}
                      <span className="cursor-help" title={RAM_PRICE_TOOLTIP}>
                        {item.ram}
                      </span>
                    </span>
                    <span
                      className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 cursor-help"
                      title={RAM_PRICE_TOOLTIP}
                    >
                      Begagnade
                    </span>
                  </p>
                  <p>
                    Lagring: {item.storage} {item.storagetype}
                  </p>
                </div>
                <Link
                  to={`/computer/${item.id}`}
                  className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    item.id === computer.id
                      ? "bg-gray-200 text-gray-700 cursor-default dark:bg-gray-800 dark:text-gray-300"
                      : "bg-yellow-400 text-gray-900 hover:bg-[#11667b] hover:text-white"
                  }`}
                >
                  {item.id === computer.id ? "Aktuell" : "Visa produkt"}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Related */}
        <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-10">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{"Andra som tittat p\u00e5 samma produkt tittar \u00e4ven p\u00e5:"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {enrichedComputers.filter((c) => c.id !== computer.id).slice(0, 4).map((related) => (
              <button
                key={related.id}
                onClick={() => navigate(`/computer/${related.id}`)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:border-emerald-500 transition-all text-left"
              >
                <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-3xl text-gray-400 overflow-hidden">
                  <img
                    src={related.image}
                    alt={related.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">{related.name}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{related.price.toLocaleString("sv-SE")} kr</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}




