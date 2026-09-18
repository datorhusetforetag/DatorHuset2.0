import { PageShell } from "@/components/PageShell";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { SeoHead } from "@/components/SeoHead";
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { getProductIdByName, normalizeProductKey, useProducts, type SupabaseProduct } from "@/hooks/useProducts";
import { COMPUTERS, Computer } from "@/data/computers";
import { buildProductLookup, getProductFromLookup, mergeProductFields } from "@/lib/productOverrides";
import { normalizeProductImagePath, resolveProductImage } from "@/lib/productImageResolver";
import {
  buildDefaultFpsSandboxSettings,
  normalizeFpsSandboxSettings,
} from "@/lib/fpsSandbox";
import {
  sanitizeUsedPartsSettings,
} from "@/lib/usedParts";
import { FpsPanel } from "@/components/product/FpsPanel";
import { ProductStage } from "@/components/product/ProductStage";
import { ProductVariants } from "@/components/product/ProductVariants";
import { checkStock, getAllInventory } from "@/lib/supabaseServices";
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

/*
 * Kul\u00f6r per niv\u00e5, samma fyra som niv\u00e5avsnittet p\u00e5 startsidan och
 * kategorierna p\u00e5 produktlistan. Nycklarna \u00e4r de svenska namn som
 * faktiskt st\u00e5r i datan - Brons finns inte i sortimentet idag men
 * ligger med s\u00e5 att niv\u00e5n inte tappar sin kul\u00f6r om den tillkommer.
 */
const TIER_ACCENTS: Record<string, string> = {
  Brons: "#E3A567",
  Silver: "#CBD3E1",
  Guld: "#E3A567",
  Platina: "#B26BDE",
  Diamant: "#3FD9F5",
  default: "#3FD9F5",
};

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

type ProductImagesResponse = {
  images?: string[];
  image_url?: string | null;
};

type InventoryEntry = {
  product_id: string;
  quantity_in_stock: number;
  is_preorder?: boolean | null;
  allow_preorder?: boolean | null;
  eta_days?: number | null;
  eta_note?: string | null;
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

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

export default function ComputerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);
  const [useUsedVariant, setUseUsedVariant] = useState(false);
  /* Vald uppgradering, eller null för grundmaskinen. Se variantOptions. */
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<string | null>(null);
  const [usedVariantEnabled, setUsedVariantEnabled] = useState<boolean | null>(null);
  const [usedPartsFromApi, setUsedPartsFromApi] = useState<Record<string, boolean> | null>(null);
  const [usedPartsConfigured, setUsedPartsConfigured] = useState<boolean>(false);
  const [productImagesFromApi, setProductImagesFromApi] = useState<string[]>([]);
  const { products, loading: productsLoading } = useProducts();
  const productLookup = useMemo(() => buildProductLookup(products), [products]);

  const [fpsSettings, setFpsSettings] = useState(buildDefaultFpsSandboxSettings());
  /*
   * Sant först när servern svarat med den här maskinens egna värden.
   *
   * Utgångsvärdet ovan är en generisk tabell som är identisk för alla
   * datorer - den finns för adminvyns skull. Visades den för kunden
   * skulle en Silver-Speedster och ett 5080-bygge påstå samma
   * bildfrekvens, vilket inte bara är fel utan ett påstående om en
   * produkt. Servern räknar om tabellen per maskin
   * (FPS_REPORT_PROFILE_FACTORS i server-local.js), så raden ritas
   * först när det svaret kommit. Uteblir svaret ritas ingenting.
   */
  const [fpsLoaded, setFpsLoaded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [inventoryStatus, setInventoryStatus] = useState<{
    inStock: boolean;
    canPreorder: boolean;
    etaDays: number | null;
    etaNote: string | null;
  } | null>(null);
  const [inventoryMap, setInventoryMap] = useState<Record<string, InventoryEntry>>({});

  const localComputer = COMPUTERS.find((c) => c.id === id);
  const supabaseOnlyProduct = localComputer ? null : getProductFromLookup(productLookup, id);
  const computer: Computer | undefined = localComputer || (supabaseOnlyProduct ? buildComputerFromSupabaseProduct(supabaseOnlyProduct) : undefined);
  const resolvedComputer: Computer = computer || {
    id: id || "unknown-product",
    name: "Laddar produkt",
    price: 0,
    cpu: "",
    gpu: "",
    ram: "",
    storage: "",
    storagetype: "SSD",
    tier: "Silver",
    rating: 0,
    reviews: 0,
    image: DETAIL_FALLBACK_IMAGE,
    images: [DETAIL_FALLBACK_IMAGE],
    usedVariantEnabled: false,
  };
  const baseProductId = computer
    ? localComputer
      ? getProductIdByName(localComputer.name) || getProductIdByName(localComputer.id)
      : supabaseOnlyProduct?.id || null
    : null;
  const usedProductId = localComputer?.usedVariant?.productKey
    ? getProductIdByName(localComputer.usedVariant.productKey)
    : null;
  /*
   * Uppgraderingarna: samma dator med mer minne eller större disk.
   *
   * Varje uppgradering pekar ut en riktig produkt, och priset läses ur
   * den. Hittas ingen produkt med nyckeln hoppas kortet över - en
   * felstavad nyckel ska ge en saknad valmöjlighet, aldrig ett köp till
   * fel pris. Se ComputerUpgrade i src/data/computers.ts.
   */
  const upgradeVariants = useMemo(() => {
    const declared = localComputer?.upgrades ?? [];
    return declared.flatMap((upgrade) => {
      const product = getProductFromLookup(productLookup, upgrade.productKey);
      if (!product?.id) return [];
      return [
        {
          id: `upgrade:${upgrade.productKey}`,
          productId: product.id,
          label: upgrade.label,
          detail: upgrade.summary,
          price:
            typeof product.price_cents === "number" ? product.price_cents / 100 : 0,
        },
      ];
    });
  }, [localComputer, productLookup]);

  const selectedUpgrade =
    upgradeVariants.find((variant) => variant.id === selectedUpgradeId) || null;

  /* Uppgraderingen vinner över nytt/begagnat: den är en egen produkt. */
  const activeProductId = selectedUpgrade
    ? selectedUpgrade.productId
    : useUsedVariant && usedProductId
      ? usedProductId
      : baseProductId;

  const fallbackComputerImages = useMemo(() => {
    return Array.from(
      new Set(
        [...(Array.isArray(resolvedComputer.images) ? resolvedComputer.images : []), resolvedComputer.image || ""]
          .map((image) => normalizeProductImagePath(image) || "")
          .filter(Boolean)
      )
    );
  }, [resolvedComputer]);

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

  const reviewData = TOP_SELLER_REVIEWS[resolvedComputer.id] ?? buildDefaultReviewData(resolvedComputer);
  const activeVariant = useUsedVariant && hasUsedVariant && resolvedComputer.usedVariant ? resolvedComputer.usedVariant : null;
  const usedDisplayName = resolvedComputer.usedVariant?.productKey || toUsedName(resolvedComputer.name);
  const fallbackName =
    useUsedVariant && hasUsedVariant && resolvedComputer.usedVariant ? usedDisplayName : resolvedComputer.name;
  const activeProduct = useUsedVariant
    ? (usedProductId ? getProductFromLookup(productLookup, usedProductId) : null) ||
      (resolvedComputer.usedVariant?.productKey ? getProductFromLookup(productLookup, resolvedComputer.usedVariant.productKey) : null)
    : getProductFromLookup(productLookup, activeProductId) ||
      getProductFromLookup(productLookup, resolvedComputer.name) ||
      getProductFromLookup(productLookup, resolvedComputer.id);
  useEffect(() => {
    /* Byter man utförande är den gamla maskinens siffror inte längre
       sanna, så raden döljs tills svaret för den nya kommit. */
    setFpsLoaded(false);
    if (!activeProductId) return;
    let isMounted = true;
    const loadFps = async () => {
      try {
        const response = await fetch(`/api/fps-settings/${activeProductId}`);
        if (!response.ok) return;
        const data = await response.json();
        if (isMounted && data?.fps) {
          setFpsSettings(normalizeFpsSandboxSettings(data.fps));
          setFpsLoaded(true);
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
    let active = true;
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
        console.warn("Failed to load inventory list", error);
      });

    return () => {
      active = false;
    };
  }, []);

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

  const merged = mergeProductFields(
    {
      name: fallbackName,
      price: activeVariant?.price ?? resolvedComputer.price,
      cpu: activeVariant?.cpu ?? resolvedComputer.cpu,
      gpu: activeVariant?.gpu ?? resolvedComputer.gpu,
      ram: activeVariant?.ram ?? resolvedComputer.ram,
      storage: activeVariant?.storage ?? resolvedComputer.storage,
      storagetype: activeVariant?.storagetype ?? resolvedComputer.storagetype,
      tier: activeVariant?.tier ?? resolvedComputer.tier,
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
  /*
   * Sidans kulör kommer från nivån maskinen tillhör, samma fyra som
   * nivåavsnittet på startsidan och kategorierna på produktlistan. En
   * Diamant-dator lyser alltså cyan hela vägen från startsidan hit.
   */
  const accent = TIER_ACCENTS[displaySpecs.tier] ?? TIER_ACCENTS.default;

  /*
   * Korten för utförande. Priserna läses ur respektive produkt och inte
   * ur den valda, så alla kort visar sitt eget pris samtidigt.
   */
  const variantOptions = useMemo(() => {
    const baseProduct =
      getProductFromLookup(productLookup, baseProductId) ||
      getProductFromLookup(productLookup, resolvedComputer.name);
    const basePrice =
      typeof baseProduct?.price_cents === "number"
        ? baseProduct.price_cents / 100
        : resolvedComputer.price;

    const options = [
      {
        id: "base",
        label: "Nya delar",
        detail: "Allt fabriksnytt",
        price: basePrice,
      },
    ];

    if (hasUsedVariant && resolvedComputer.usedVariant) {
      const usedProduct =
        (usedProductId ? getProductFromLookup(productLookup, usedProductId) : null) ||
        (resolvedComputer.usedVariant.productKey
          ? getProductFromLookup(productLookup, resolvedComputer.usedVariant.productKey)
          : null);
      const usedPrice =
        typeof usedProduct?.price_cents === "number"
          ? usedProduct.price_cents / 100
          : resolvedComputer.usedVariant.price;

      options.push({
        id: "used",
        label: "Begagnade delar",
        detail: "Utvalda begagnade komponenter",
        price: usedPrice,
        /* Jämförpriset visas bara när det begagnade faktiskt är
           billigare - komponenten döljer det annars. */
        comparePrice: basePrice,
      } as (typeof options)[number] & { comparePrice: number });
    }

    upgradeVariants.forEach((variant) => {
      options.push({
        id: variant.id,
        label: variant.label,
        detail: variant.detail,
        price: variant.price,
      });
    });

    return options;
  }, [
    baseProductId,
    hasUsedVariant,
    productLookup,
    resolvedComputer,
    upgradeVariants,
    usedProductId,
  ]);

  const selectedVariantId = selectedUpgradeId ?? (useUsedVariant ? "used" : "base");

  const selectVariant = (nextId: string) => {
    if (nextId === "base") {
      setSelectedUpgradeId(null);
      setUseUsedVariant(false);
      return;
    }
    if (nextId === "used") {
      setSelectedUpgradeId(null);
      setUseUsedVariant(true);
      return;
    }
    /* En uppgradering är en egen produkt, så nytt/begagnat nollställs. */
    setSelectedUpgradeId(nextId);
    setUseUsedVariant(false);
  };

  const baseUsedParts = (resolvedComputer as Computer & { usedParts?: DetailUsedPartsSource }).usedParts || null;
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
        className: "bg-foreground/[0.04] text-muted-foreground dark:bg-foreground/[0.06] dark:text-foreground",
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
        className: "bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary",
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
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://datorhuset.se";
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
      sku: resolvedComputer.id,
      brand: {
        "@type": "Brand",
        name: "DatorHuset",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "SEK",
        price: displayPrice,
        availability: availability.schema,
        url: `${baseUrl}/computer/${resolvedComputer.id}`,
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
          item: `${baseUrl}/computer/${resolvedComputer.id}`,
        },
      ],
    };
    return {
      "@context": "https://schema.org",
      "@graph": [productSchema, breadcrumbSchema],
    };
  }, [availability.schema, resolvedComputer, detailImageCandidates, displayName, displayPrice, displaySpecs, reviewData]);
  const seoBaseUrl = typeof window !== "undefined" ? window.location.origin : "https://datorhuset.se";
  const seoImage = (detailImageCandidates[0] || DETAIL_FALLBACK_IMAGE).startsWith("http")
    ? detailImageCandidates[0] || DETAIL_FALLBACK_IMAGE
    : new URL(detailImageCandidates[0] || DETAIL_FALLBACK_IMAGE, seoBaseUrl).toString();
  const seoDescription =
    (merged.description?.trim() || "").slice(0, 160) ||
    `${displaySpecs.cpu}, ${displaySpecs.gpu}, ${displaySpecs.ram}, ${displaySpecs.storage} ${displaySpecs.storagetype}`;

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={index < rating ? "text-primary" : "text-muted-foreground dark:text-muted-foreground"}
        >
          {"\u2605"}
        </span>
      ))}
    </div>
  );

  const localComputerKeys = useMemo(() => {
    const keys = new Set<string>();
    COMPUTERS.forEach((computerEntry) => {
      [computerEntry.id, computerEntry.name, computerEntry.usedVariant?.productKey].forEach((value) => {
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
  }, [localComputerKeys, products]);

  const enrichedComputers = useMemo(
    () =>
      [...COMPUTERS, ...supabaseOnlyComputers].map((item) => {
        const product =
          getProductFromLookup(productLookup, item.id) ||
          getProductFromLookup(productLookup, item.name);
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
    [productLookup, supabaseOnlyComputers],
  );
  const comparisonCandidates = enrichedComputers.filter((c) => c.id !== resolvedComputer.id);
  const sameTier = comparisonCandidates.filter((c) => c.tier === resolvedComputer.tier);
  const comparisonPool = (sameTier.length >= 2
    ? sameTier
    : [...sameTier, ...comparisonCandidates.filter((c) => c.tier !== resolvedComputer.tier)]
  ).slice(0, 2);
  const currentComparisonItem =
    enrichedComputers.find((entry) => entry.id === resolvedComputer.id) ||
    ({ ...resolvedComputer, image: detailImageCandidates[0] || DETAIL_FALLBACK_IMAGE, images: detailImageCandidates } as Computer);
  const comparisonItems = [currentComparisonItem, ...comparisonPool];
  const popularItems = useMemo(() => {
    return enrichedComputers
      .filter((item) => item.id !== resolvedComputer.id)
      .map((item) => {
        const productId = getProductIdByName(item.name) || getProductIdByName(item.id) || null;
        const inStock = productId ? (inventoryMap[productId]?.quantity_in_stock ?? 0) > 0 : false;
        const randomRank = hashString(`${resolvedComputer.id}:${productId || item.id}:${item.name}`);
        return { item, inStock, randomRank };
      })
      .sort((a, b) => {
        if (a.inStock !== b.inStock) {
          return a.inStock ? -1 : 1;
        }
        return a.randomRank - b.randomRank;
      })
      .slice(0, 4)
      .map(({ item }) => item);
  }, [enrichedComputers, inventoryMap, resolvedComputer.id]);
  const hasMultipleImages = detailImageCandidates.length > 1;
  const resolvedImage = detailImageCandidates[selectedImage] || detailImageCandidates[0] || DETAIL_FALLBACK_IMAGE;

  if (!computer && productsLoading) {
    return (
      <PageShell>
        <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
          <p className="eyebrow">Hämtar</p>
          <p className="mt-3 text-muted-foreground">Laddar produkt...</p>
        </div>
      </PageShell>
    );
  }

  /* En produkt som inte finns är en återvändsgränd som 404-sidan, och
     ska erbjuda samma sak: en väg vidare, inte bara ett besked. */
  if (!computer) {
    return (
      <PageShell>
        <div className="container mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
          <p className="eyebrow">Finns inte</p>
          <h1 className="section-title mt-4 text-3xl sm:text-4xl">
            Datorn hittades inte
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Modellen kan vara utgången, eller så har länken blivit gammal. Hela
            sortimentet ligger kvar.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/products" className="btn-primary">
              <ArrowLeft className="h-4 w-4" />
              Se alla datorer
            </Link>
            <Link to="/custom-bygg" className="btn-secondary">
              Bygg din egen
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="flex-1 container mx-auto px-4 py-6 sm:py-10 lg:py-16 pb-24 lg:pb-16">
        {/* Brödsmulor.
            Var fyra steg djupa, varav bara det första gick att klicka
            på - "Datorer & Surfplattor" och "Gamingdatorer stationära"
            var ren text som såg ut som länkar. En brödsmula som inte
            leder någonstans är värre än ingen alls, så de två
            påhittade nivåerna är borta och den som finns på riktigt
            är en länk. Samma form som banderollen på övriga sidor. */}
        <nav aria-label="Brödsmulor" className="page-banner__crumbs mb-6 sm:mb-8">
          <ol>
            <li>
              <Link to="/">Hem</Link>
              <span aria-hidden="true" className="page-banner__crumb-sep">/</span>
            </li>
            <li>
              <Link to="/products">Datorer</Link>
              <span aria-hidden="true" className="page-banner__crumb-sep">/</span>
            </li>
            <li>
              <span aria-current="page">{displayName}</span>
            </li>
          </ol>
        </nav>

        {/* Scenen och panelen ------------------------------------------
            Förlagans uppdelning: datorn stor till vänster, allt man
            behöver för att bestämma sig samlat till höger.

            Scenen står klistrad medan panelen rullar. Panelen är den
            långa av de två - utförande, specifikationer, antal, köp -
            och utan det hade man rullat förbi datorn efter en halv
            skärm och sedan läst resten bredvid en tom yta. */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-12">
          <div className="lg:sticky lg:top-24">
            <ProductStage
              images={detailImageCandidates}
              index={selectedImage}
              onIndexChange={setSelectedImage}
              alt={displayName}
              accent={accent}
              note="Ungefärligt utseende"
              fallbackImage={DETAIL_FALLBACK_IMAGE}
            />
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
                {displayName}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {[displaySpecs.tier, displaySpecs.gpu].filter(Boolean).join(" · ")}
              </p>
            </div>

            <div>
              <div className="flex flex-wrap items-baseline gap-3">
                <span
                  className="font-display text-3xl font-bold tabular-nums sm:text-4xl"
                  style={{ color: accent }}
                >
                  {displayPrice.toLocaleString("sv-SE")} kr
                </span>
                <span className="text-xs text-muted-foreground">Exkl. moms</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                {!showPreorderLabel && (
                  <span className={`rounded-full px-3 py-1 ${availability.className}`}>
                    {availability.label}
                  </span>
                )}
                {etaLabel && (
                  <span className="rounded-full bg-foreground/[0.06] px-3 py-1 text-muted-foreground">
                    {etaLabel}
                  </span>
                )}
                {showPreorderLabel && (
                  <span
                    className="rounded-full px-3 py-1"
                    style={{ backgroundColor: `${accent}1F`, color: accent }}
                    title="Förbeställ varan och få den inom 2 veckor då varan är slut på lager."
                  >
                    Förbeställ
                  </span>
                )}
              </div>
            </div>

            {/* Utförandena. Var en vippknapp nedtryckt i brödtexten
                förut, så att det inte syntes att priset ändrades. */}
            <ProductVariants
              options={variantOptions}
              selectedId={selectedVariantId}
              onSelect={selectVariant}
              accent={accent}
            />

            {/* Nyckelspecifikationerna: de fyra som avgör köpet, framme
                direkt. Resten ligger kvar längre ned - länken hoppar
                dit i stället för att upprepa dem här. */}
            <div>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  Nyckelspecifikationer
                </h2>
                <a
                  href="#alla-specs"
                  className="text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ color: accent }}
                >
                  Visa alla specs
                </a>
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 border-t border-foreground/10 pt-5 sm:grid-cols-2">
                {[
                  { label: "Grafikkort", value: displaySpecs.gpu },
                  { label: "Processor", value: displaySpecs.cpu },
                  { label: "Minne", value: displaySpecs.ram },
                  {
                    label: "Lagring",
                    value: `${displaySpecs.storage} ${displaySpecs.storagetype}`.trim(),
                  },
                ]
                  .filter((row) => Boolean(String(row.value || "").trim()))
                  .map((row) => (
                    <div key={row.label}>
                      <dt className="text-xs text-muted-foreground">{row.label}</dt>
                      <dd className="mt-1 text-sm font-semibold leading-snug text-foreground">
                        {row.value}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>

            {/* Köpet */}
            <div className="border-t border-foreground/10 pt-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="inline-flex items-center rounded-sm border border-foreground/15">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                    aria-label="Minska antal"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[3rem] text-center text-base font-bold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                    aria-label="Öka antal"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addingToCart || !activeProductId}
                  className="btn-primary w-full flex-1 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {addingToCart ? "Lägger till..." : "Lägg i kundvagn"}
                </button>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                Beräknad leverans 1-2 arbetsdagar. Byggtid: i lager 1-2 dagar,
                förbeställd (nya delar) cirka 5 dagar, förbeställd (begagnade
                delar) 1-2 veckor.
              </p>
            </div>
          </div>
        </div>

        {/* FPS-raden ligger under båda spalterna och inte inuti panelen.
            Den vill vara bred - sex spel bredvid varandra läses i ett
            svep, staplade i en smal spalt blir de en lista man rullar
            förbi. */}
        {fpsLoaded && (
          <div className="mt-12">
            <FpsPanel settings={fpsSettings} accent={accent} gameImages={GAME_IMAGES} />
          </div>
        )}

        {/* Tabs */}
        <div
          id="alla-specs"
          className="mt-10 sm:mt-12 scroll-mt-24 bg-foreground/[0.06] border border-foreground/10 rounded-2xl p-4 sm:p-6"
        >
          <div className="flex gap-6 border-b border-foreground/10 pb-4 mb-6 text-sm font-semibold text-muted-foreground">
            <span className="text-foreground">Produktinfo</span>
            <span>Specifikationer</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-foreground">
            <div className="space-y-4">
              {productInfoSections.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground">{section.title}</h3>
                  <p className="text-sm text-muted-foreground">{section.body}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3 text-sm">
              {specRows.map((row, index) => {
                const showUsedBadge = Boolean(row.used);
                return (
                <div
                  key={row.label}
                  className={`flex justify-between ${index < specRows.length - 1 ? "border-b border-foreground/10 pb-2" : ""}`}
                >
                  <span>{row.label}</span>
                  <span className="font-semibold text-foreground text-right">
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
                      <span className="ml-2 inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary dark:bg-primary/20 dark:text-primary">
                        Begagnade
                      </span>
                    )}
                  </span>
                </div>
              );
              })}
              {resolvedComputer.bundleIncludes?.length ? (
                <div className="mt-4 rounded-lg border border-foreground/10 bg-background/70 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Ingår i paketet</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {resolvedComputer.bundleIncludes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Warranty */}
        <div className="mt-10 rounded-2xl border border-foreground/10 bg-background/70 p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-foreground">Garanti & returer</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p className="font-semibold text-foreground">3 års reklamationsrätt</p>
              <p>Du har rätt att reklamera och skicka tillbaka varan om ett ursprungligt fel upptäcks.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">14 dagars öppet köp vid frakt!</p>
              <p>Testa i lugn och ro. Returnera om den inte passar dina behov.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Trygg support</p>
              <p>Vi hjälper dig med felsökning och uppgraderingar när du vill.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Snabb återkoppling</p>
              <p>Kontakta oss så återkommer vi med nästa steg och tidsplan.</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/kundservice"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2 rounded-lg hover:bg-secondary hover:text-white transition-colors"
            >
              Kontakta kundservice
            </Link>
          </div>
        </div>

        {/* Comparison */}
        <div className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{"J\u00e4mf\u00f6r liknande datorer"}</h2>
            <span className="text-xs sm:text-sm text-muted-foreground">{"2\u20133 alternativ med liknande niv\u00e5"}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisonItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-foreground/10 bg-background/70 p-4 space-y-4"
              >
                <div className="h-52 sm:h-56 md:h-32 rounded-lg overflow-hidden border border-foreground/10">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.price.toLocaleString("sv-SE")} kr
                  </p>
                </div>
                <div className="text-sm text-muted-foreground space-y-1 border-t border-foreground/10 pt-3">
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
                      className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary dark:bg-primary/20 dark:text-primary cursor-help"
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
                    item.id === resolvedComputer.id
                      ? "bg-foreground/[0.08] text-muted-foreground cursor-default dark:bg-foreground/[0.06] dark:text-muted-foreground"
                      : "bg-primary text-primary-foreground hover:bg-secondary hover:text-white"
                  }`}
                >
                  {item.id === resolvedComputer.id ? "Aktuell" : "Visa produkt"}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Related */}
        <div className="mt-12 border-t border-foreground/10 pt-10">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Mest populära</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularItems.map((related) => (
              <button
                key={related.id}
                onClick={() => navigate(`/computer/${related.id}`)}
                className="bg-background/70 border border-foreground/10 rounded-xl overflow-hidden hover:border-emerald-500 transition-all text-left"
              >
                <div className="h-28 bg-foreground/[0.05] flex items-center justify-center text-3xl text-muted-foreground overflow-hidden">
                  <img
                    src={related.image}
                    alt={related.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-foreground text-sm line-clamp-2">{related.name}</h3>
                  <p className="text-sm text-muted-foreground">{related.price.toLocaleString("sv-SE")} kr</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}




