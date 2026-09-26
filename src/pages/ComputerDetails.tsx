import { PageShell } from "@/components/PageShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { productPath, productSlug } from "@/lib/productUrl";
import { SHIPPING_COST_CENTS } from "../../shared/checkoutMath.js";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { SeoHead } from "@/components/SeoHead";
import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { getProductIdByName, normalizeProductKey, useProducts, type SupabaseProduct } from "@/hooks/useProducts";
import { COMPUTERS, Computer } from "@/data/computers";
import { getProductArt } from "@/data/productArt";
import { buildProductLookup, getProductFromLookup, mergeProductFields } from "@/lib/productOverrides";
import { normalizeProductImagePath, resolveProductImage } from "@/lib/productImageResolver";
import {
  buildDefaultFpsSandboxSettings,
  normalizeFpsSandboxSettings,
} from "@/lib/fpsSandbox";
import { buildReportedFpsSettingsForProductName } from "../../shared/fpsProfiles.js";
import {
  sanitizeUsedPartsSettings,
} from "@/lib/usedParts";
import { FpsPanel } from "@/components/product/FpsPanel";
import { ProductStage } from "@/components/product/ProductStage";
import { CapacityBar } from "@/components/product/CapacityBar";
import { ProductVariants } from "@/components/product/ProductVariants";
import { checkStock, getAllInventory } from "@/lib/supabaseServices";

const RAM_PRICE_TOOLTIP =
  "Priserna p\u00e5 RAM har g\u00e5tt upp med cirka 500%, d\u00e4rav anv\u00e4ndning av begagnade RAM.";

/*
 * Kul\u00f6r per niv\u00e5. Nycklarna \u00e4r de svenska namn som faktiskt
 * st\u00e5r i datan.
 *
 * Brons l\u00e5g h\u00e4r med motiveringen att niv\u00e5n kunde tillkomma. Den
 * togs bort ur sortimentet i st\u00e4llet, s\u00e5 kul\u00f6ren \u00e4r borta med den -
 * en nyckel som aldrig sl\u00e5r an \u00e4r en nyckel som ingen vet om den
 * anv\u00e4nds.
 */
const TIER_ACCENTS: Record<string, string> = {
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

/*
 * Här låg påhittade omdömen.
 *
 * Två tabeller med snittbetyg, antal och namngivna recensenter, och
 * en funktion som hittade på samma sak åt alla övriga maskiner.
 * Ingenting av det syntes på sidan - men allt skickades ut som
 * schema.org aggregateRating och Review, alltså precis den
 * uppmärkning Google läser för att sätta stjärnor i sökresultatet.
 *
 * Påhittade konsumentomdömen står på EU:s svarta lista över
 * otillåten marknadsföring och finns i marknadsföringslagen sedan
 * 2022. Det bryter dessutom mot Googles regler för strukturerad
 * data. Att ingen såg dem i webbläsaren gjorde dem inte osynliga.
 *
 * Sidan visar nu inga betyg alls. När riktiga omdömen finns kan de
 * komma tillbaka, med data från kunder som faktiskt handlat.
 */
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
  /* Uppgraderingarna sätts i adminläget och ligger i databasen. Listan
     i src/data/computers.ts finns kvar som reserv för maskiner som
     ännu inte fått några satta där. */
  const [apiUpgrades, setApiUpgrades] = useState<
    { product_id: string; group: string; label: string; summary: string | null }[]
  >([]);
  const { products, loading: productsLoading } = useProducts();
  const { settings: siteSettings } = useSiteSettings();
  const productLookup = useMemo(() => buildProductLookup(products), [products]);

  const [fpsSettings, setFpsSettings] = useState(buildDefaultFpsSandboxSettings());
  /*
   * Sant när vi har siffror som gäller just den här maskinen.
   *
   * Utgångsvärdet ovan är en generisk tabell, identisk för alla datorer,
   * och den får aldrig visas för kund - då hade en Silver-Speedster och
   * ett 5080-bygge påstått samma bildfrekvens. Därför flaggan.
   *
   * Den sätts från två håll. Först ur maskinens egen profil i
   * shared/fpsProfiles.js, som klienten numera läser direkt. Sedan, om
   * och när servern svarar, ur dess svar - det är där adminläget sparar
   * egna värden, och de vinner.
   *
   * Tidigare fanns bara det andra hållet, och då försvann hela
   * avsnittet så fort servern inte svarade. I utvecklingsläge finns
   * bara Vite och alltså ingen endpoint alls, så det var precis vad som
   * hände.
   */
  const [fpsLoaded, setFpsLoaded] = useState(false);
  /* Indexet pekar på en VY i scenen, inte på ett foto. Vy 0 är
     urklippet när det finns, därefter följer fotona. Se
     buildStageViews i ProductStage. */
  const [selectedView, setSelectedView] = useState(0);
  const [inventoryStatus, setInventoryStatus] = useState<{
    inStock: boolean;
    canPreorder: boolean;
    etaDays: number | null;
    etaNote: string | null;
  } | null>(null);
  const [inventoryMap, setInventoryMap] = useState<Record<string, InventoryEntry>>({});

  /*
   * Adressen kan vara en slug ("silver-speedster") eller ett id ("2").
   *
   * Sluggen är vad länkarna skickar numera, id:t är vad de skickade
   * förut. Båda slås upp här, så en sparad eller indexerad länk
   * fortsätter leda rätt. Se src/lib/productUrl.ts.
   */
  const localComputer = COMPUTERS.find(
    (c) => c.id === id || productSlug(c) === normalizeProductKey(id || ""),
  );
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
    /* Adminläget går före koden. Har någon satt uppgraderingar på
       listningen är det de som gäller; listan i computers.ts är kvar
       som reserv för maskiner ingen hunnit sätta något på. */
    if (apiUpgrades.length > 0) {
      return apiUpgrades.flatMap((upgrade) => {
        const product = getProductFromLookup(productLookup, upgrade.product_id);
        if (!product?.id) return [];
        return [
          {
            id: `upgrade:${upgrade.product_id}`,
            productId: product.id,
            label: upgrade.label,
            detail: upgrade.summary || undefined,
            group: upgrade.group,
            price:
              typeof product.price_cents === "number" ? product.price_cents / 100 : 0,
          },
        ];
      });
    }

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
          group: upgrade.group,
          price:
            typeof product.price_cents === "number" ? product.price_cents / 100 : 0,
        },
      ];
    });
  }, [apiUpgrades, localComputer, productLookup]);

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
    setSelectedView(0);
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

  const activeVariant = useUsedVariant && hasUsedVariant && resolvedComputer.usedVariant ? resolvedComputer.usedVariant : null;
  const usedDisplayName = resolvedComputer.usedVariant?.productKey || toUsedName(resolvedComputer.name);
  const fallbackName =
    useUsedVariant && hasUsedVariant && resolvedComputer.usedVariant ? usedDisplayName : resolvedComputer.name;

  /*
   * Maskinens egen FPS-profil, direkt ur den delade tabellen.
   *
   * Uppslaget går på namn, precis som serverns. Byter man till den
   * begagnade varianten heter maskinen "... - Begagnade", och eftersom
   * uppslaget matchar på delsträng hittar den ändå rätt profil.
   *
   * Finns ingen profil för namnet händer ingenting, och avsnittet ritas
   * inte förrän servern eventuellt svarar med egna värden.
   */
  useEffect(() => {
    const profile = buildReportedFpsSettingsForProductName(fallbackName);
    if (!profile) return;
    setFpsSettings(normalizeFpsSandboxSettings(profile));
    setFpsLoaded(true);
  }, [fallbackName]);
  const activeProduct = useUsedVariant
    ? (usedProductId ? getProductFromLookup(productLookup, usedProductId) : null) ||
      (resolvedComputer.usedVariant?.productKey ? getProductFromLookup(productLookup, resolvedComputer.usedVariant.productKey) : null)
    : getProductFromLookup(productLookup, activeProductId) ||
      getProductFromLookup(productLookup, resolvedComputer.name) ||
      getProductFromLookup(productLookup, resolvedComputer.id);
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

  /* Uppgraderingarna hämtas för GRUNDmaskinen, inte för den valda
     varianten. Väljer man en uppgradering ska listan stå kvar så man
     kan byta tillbaka - hämtade vi om för varianten skulle valet
     försvinna i samma stund det gjordes. */
  useEffect(() => {
    if (!baseProductId) {
      setApiUpgrades([]);
      return;
    }
    let active = true;
    fetch(`/api/product-upgrades/${baseProductId}`)
      .then((response) => response.json())
      .then((payload) => {
        if (active && Array.isArray(payload?.data)) setApiUpgrades(payload.data);
      })
      .catch(() => {
        /* Utan svar visas grundmaskinen. Ett fel här ska inte kunna
           stoppa ett köp. */
      });
    return () => {
      active = false;
    };
  }, [baseProductId]);
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

  /* Frilagd bild och egen duk för just den här maskinen. */
  const art = getProductArt(resolvedComputer.id);

  /*
   * Frågorna kommer ur inställningarna, samma lista som FAQ-sidan
   * och startsidans smakprov. Fem stycken här - fler gör avsnittet
   * till en egen sida mitt i en produktsida.
   */
  const faqItems = (siteSettings.pages.faq.items ?? []).slice(0, 5);

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
        group: variant.group,
      } as (typeof options)[number] & { group: string });
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
        url: `${baseUrl}${productPath(resolvedComputer)}`,

        /*
         * Retur och frakt, som Google efterfrågar i Merchant listings.
         *
         * Båda var giltiga utan dem - rapporten listade dem under "Improve
         * item appearance", inte som fel - men utan dem visas varken
         * fraktkostnad eller returvillkor i sökresultatet. Det är den
         * sortens uppgift kunden annars måste klicka sig in för att hitta.
         *
         * SIFFRORNA MÅSTE STÄMMA MED SIDAN
         *
         * Google jämför strukturdatan med vad som faktiskt står i kassan
         * och i villkoren, och straffar avvikelser. Därför hämtas frakten
         * ur shared/checkoutMath.js i stället för att skrivas in här -
         * ändras priset i kassan följer sökresultatet med av sig självt.
         *
         * De fjorton dagarna och att kunden betalar returfrakten står i
         * ReturnPolicy.tsx. Ändras något där ska det ändras här också.
         */
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "SE",
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: 14,
          returnMethod: "https://schema.org/ReturnByMail",
          returnFees: "https://schema.org/ReturnShippingFees",
        },
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: {
            "@type": "MonetaryAmount",
            value: SHIPPING_COST_CENTS / 100,
            currency: "SEK",
          },
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: "SE",
          },
        },
      },
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
          item: `${baseUrl}${productPath(resolvedComputer)}`,
        },
      ],
    };
    return {
      "@context": "https://schema.org",
      "@graph": [productSchema, breadcrumbSchema],
    };
  }, [availability.schema, resolvedComputer, detailImageCandidates, displayName, displayPrice, displaySpecs]);
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
  /*
   * Bilden i specifikationsavsnittet står still.
   *
   * Den följde tidigare miniatyrraden högst upp på sidan. Eftersom
   * raden inte bytte den stora bilden där uppe var det enda ett
   * klick syntes på en bild långt utanför rutan - man tryckte på
   * något och såg ingenting hända. Nu styr raden scenen, och här
   * nere visas maskinens huvudfoto.
   */
  const specShot = detailImageCandidates[0] || DETAIL_FALLBACK_IMAGE;

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
      {/* Scenen och panelen -------------------------------------------
          Ligger utanför sidans spalt, så den når skärmkanterna som i
          förlagan. Resten av sidan - specifikationer, garanti,
          jämförelse - ligger kvar i spalten längre ned. */}
      <div className="product-split">
        <ProductStage
          art={art}
          images={detailImageCandidates}
          index={selectedView}
          onIndexChange={setSelectedView}
          alt={displayName}
          note={art.cutout ? "Ungefärligt utseende" : undefined}
          fallbackImage={DETAIL_FALLBACK_IMAGE}
        />

        <div className="product-panel">
          <div className="product-panel__scroll">
            {/*
              Brödsmulorna var tre led chrome ovanför rubriken, och två
              av leden står redan i menyn högst upp. Kvar är den enda
              som faktiskt gör något härifrån: vägen tillbaka till
              listan. Strukturerad data för sökmotorn ligger orörd i
              structuredData längre upp i filen.
            */}
            <Link to="/products" className="product-panel__back">
              <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
              Alla datorer
            </Link>

            <h1 className="mt-5 font-display text-2xl font-bold uppercase leading-tight tracking-tight text-foreground sm:text-[1.75rem]">
              {displayName}
            </h1>

            {/*
              Pris och läge på en rad, och EN etikett - inte tre.
              Lager, förbeställning och leveranstid stod som var sin
              pillerknapp bredvid priset, vilket gav fyra saker att läsa
              på översta raden. Leveranstiden hör ihop med leveransen
              och står nu i den raden längst ned i stället.
            */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span
                className="font-display text-2xl font-bold tabular-nums"
                style={{ color: accent }}
              >
                {displayPrice.toLocaleString("sv-SE")} kr
              </span>

              {showPreorderLabel ? (
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{ backgroundColor: `${accent}1F`, color: accent }}
                  title="Förbeställ varan och få den inom 2 veckor då varan är slut på lager."
                >
                  Förbeställ
                </span>
              ) : (
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${availability.className}`}>
                  {availability.label}
                </span>
              )}

              {displaySpecs.tier && (
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {displaySpecs.tier}
                </span>
              )}
            </div>

            {/* Utförandena -------------------------------------------- */}
            <div className="product-panel__block">
              <ProductVariants
                options={variantOptions}
                selectedId={selectedVariantId}
                onSelect={selectVariant}
                accent={accent}
              />
            </div>

            {/* Specifikationer ---------------------------------------- */}
            <div className="product-panel__block">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="panel-label">Specifikationer</h2>
                <a
                  href="#alla-specs"
                  className="text-[11px] font-semibold transition-opacity hover:opacity-80"
                  style={{ color: accent }}
                >
                  Alla specs
                </a>
              </div>

              {/* Samma radform som FPS-listan nedanför, så de två läses
                  som syskon i stället för som två olika sorters ruta. */}
              <dl className="mt-4 divide-y divide-foreground/10 border-t border-foreground/10">
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
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-4 py-2.5"
                    >
                      <dt className="shrink-0 text-xs text-muted-foreground">{row.label}</dt>
                      <dd className="min-w-0 text-right text-[13px] font-semibold leading-snug text-foreground">
                        {row.value}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>

            {/* FPS ---------------------------------------------------- */}
            {fpsLoaded && (
              <div className="product-panel__block">
                <FpsPanel settings={fpsSettings} accent={accent} />
              </div>
            )}


          </div>

          {/* Foten: summa och köp, kvar längst ned i panelen ---------- */}
          <div className="product-panel__foot">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Totalt
              </p>
              <p className="font-display text-xl font-bold tabular-nums text-foreground">
                {(displayPrice * quantity).toLocaleString("sv-SE")} kr
              </p>
            </div>

            <div className="flex flex-1 items-center justify-end gap-3">
              <div className="inline-flex shrink-0 items-center rounded-sm border border-foreground/15">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                  aria-label="Minska antal"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2.25rem] text-center text-sm font-bold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                  aria-label="Öka antal"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addingToCart || !activeProductId}
                className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-[#0c0d14] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                style={{ backgroundColor: accent }}
              >
                <ShoppingCart className="h-4 w-4" />
                {addingToCart ? "Lägger till..." : "Lägg i kundvagn"}
              </button>
            </div>

            {/* Byggkapaciteten. Ligger under knappen och inte över:
                priset är det man kom för, kön är det man vill veta
                strax efter. */}
            <CapacityBar accent={accent} />
          </div>
        </div>
      </div>

      {/* Allt nedanför scenen ligger på en egen yta. Toningen mellan
          de två sitter i scenen, se product-stage__fade - den hör till
          bilden och ska inte läggas över panelen. */}
      <div className="product-lower">
        <div className="container relative mx-auto px-4 pb-24 pt-16">

        {/* Tekniska specifikationer ------------------------------------
            Formen är förlagans: numrerad lista i två spalter, etiketten i
            sidans kulör och värdet under den i fetstil. Låg tidigare som
            en tvåspaltig ruta med rubrikerna "Produktinfo" och
            "Specifikationer" bredvid varandra - två kolumner som inte
            hörde ihop, i en ram. */}
        <section id="alla-specs" className="scroll-mt-24">
          {/* Bilden till vänster, listan till höger - förlagans
              uppdelning. Fotot visar maskinen i ett rum, till skillnad
              från urklippet högst upp på sidan som visar chassit fritt,
              så de två bilderna säger olika saker och upprepar inte
              varandra. */}
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-14">
            <figure className="spec-shot">
              <img
                src={specShot}
                alt={`${displayName} sedd i sin helhet`}
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.src = DETAIL_FALLBACK_IMAGE;
                }}
              />
            </figure>

            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Tekniska specifikationer
              </h2>
              <span
                aria-hidden="true"
                className="mt-3 block h-[3px] w-14 rounded-full"
                style={{ backgroundColor: accent }}
              />

              {/* Två spalter först när det finns bredd för dem. I en
                  halv sida bryts annars varje komponentnamn mitt itu,
                  och ett radbrutet produktnamn är svårare att läsa än
                  en längre lista. */}
              <ol className="mt-8 grid gap-x-8 gap-y-6 xl:grid-cols-2">
                {specRows.map((row, index) => (
                  <li key={row.label} className="flex gap-3.5">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums"
                      style={{ borderColor: `${accent}59`, color: accent }}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block text-[13px] font-semibold"
                        style={{ color: accent }}
                      >
                        {row.label}
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold leading-snug text-foreground">
                        {row.tooltip ? (
                          <span title={row.tooltip} className="cursor-help">
                            {row.value}
                          </span>
                        ) : (
                          row.value
                        )}
                        {row.used && (
                          <span
                            className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                            style={{ backgroundColor: `${accent}1F`, color: accent }}
                          >
                            Begagnade
                          </span>
                        )}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>

              {resolvedComputer.bundleIncludes?.length ? (
                <div className="mt-9 border-t border-foreground/10 pt-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Ingår i paketet
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    {resolvedComputer.bundleIncludes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          {productInfoSections.length > 0 && (
            <div className="mt-12 grid gap-6 border-t border-foreground/10 pt-8 sm:grid-cols-2">
              {productInfoSections.map((section) => (
                <div key={section.title}>
                  <h3 className="font-display text-base font-bold tracking-tight text-foreground">
                    {section.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {section.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p className="mt-10 text-center text-xs leading-relaxed text-muted-foreground">
            Bilderna är referens. Specifikationerna stämmer, men enskilda
            komponenters märke och utseende kan variera med tillgången.
          </p>
        </section>

        {/* Vårt löfte ---------------------------------------------------
            Två åtaganden, inga fler. Båda står redan i köpvillkoren och
            följer av lag - 14 dagar ur distansavtalslagen, tre år ur
            konsumentköplagen - så det är inget nytt som lovas här, bara
            det som gäller skrivet så att man ser det innan man köper. */}
        <section className="mt-24 text-center">
          <p className="eyebrow" style={{ color: accent }}>
            Vårt löfte
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Du är trygg hos oss
          </h2>

          <div className="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
            {[
              {
                figure: "14",
                unit: "dagar",
                title: "Ångerrätt vid frakt",
                body: "Skickas datorn hem till dig har du 14 dagars ångerrätt enligt distansavtalslagen. Packa upp, starta och testa - ångrar du dig hör du bara av dig.",
              },
              {
                figure: "3",
                unit: "år",
                title: "Reklamationsrätt på delar",
                body: "Visar sig ett ursprungligt fel har du tre års reklamationsrätt enligt konsumentköplagen. Vi felsöker, lagar eller byter.",
              },
            ].map((promise) => (
              <div
                key={promise.title}
                className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-8 text-left"
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-display text-3xl font-bold leading-none tabular-nums"
                    style={{ color: accent }}
                  >
                    {promise.figure}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {promise.unit}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base font-bold tracking-tight text-foreground">
                  {promise.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {promise.body}
                </p>
              </div>
            ))}
          </div>

          <Link to="/angerratt-och-returer" className="btn-secondary mt-8">
            Läs villkoren i sin helhet
          </Link>
        </section>

        {/* Vanliga frågor ----------------------------------------------
            Frågorna kommer ur inställningarna, samma lista som FAQ-sidan
            och smakprovet på startsidan visar. Egna frågor just här hade
            blivit en fjärde uppsättning svar att hålla i synk, och den
            som svarar olika på två ställen har fel på ett av dem. */}
        {faqItems.length > 0 && (
          <section className="mt-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow" style={{ color: accent }}>
                  Vi hjälper dig
                </p>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Vanliga frågor
                </h2>
              </div>
              <Link
                to="/faq"
                className="text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ color: accent }}
              >
                Se alla &rarr;
              </Link>
            </div>

            <Accordion type="single" collapsible className="mt-8 flex flex-col gap-3">
              {faqItems.map((item) => (
                <AccordionItem
                  key={item.question}
                  value={item.question}
                  className="overflow-hidden rounded-lg border border-foreground/10 bg-foreground/[0.02] transition-colors hover:border-foreground/25 data-[state=open]:border-foreground/25"
                >
                  <AccordionTrigger className="px-5 py-4 text-left text-sm font-semibold hover:no-underline sm:px-6">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 pr-12 text-sm leading-relaxed text-muted-foreground sm:px-6">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

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
                  to={productPath(item)}
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
                onClick={() => navigate(productPath(related))}
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
      </div>
    </PageShell>
  );
}




