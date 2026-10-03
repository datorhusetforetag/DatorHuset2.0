import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { PAGE_BANNERS } from "@/lib/pageBanners";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { Link } from "react-router-dom";
import {
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  MemoryStick,
  Menu,
  Microchip,
  PcCase,
  Power,
  Snowflake,
  Wifi,
  ChevronDown,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import { SeoHead } from "@/components/SeoHead";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CUSTOM_BUILD_CATALOG_ITEMS } from "@/data/customBuildCatalog.js";
import { CUSTOM_BUILD_PRELOADED_PRICE_BY_ID } from "@/data/customBuildPreloadedPrices.js";
import { FEED_CATALOG_ITEMS } from "@/data/customBuildFeedCatalog.generated.js";
import cpu7600Image from "../../images/product images/cpu/7600.png";
import cpu7600x3dImage from "../../images/product images/cpu/7600x3d.png";
import cpu7700Image from "../../images/product images/cpu/7700.png";
import cpu7800x3dImage from "../../images/product images/cpu/7800x3d.png";
import cpu7950x3dImage from "../../images/product images/cpu/7950x3d.png";
import cpu12400fImage from "../../images/product images/cpu/12400f.png";
import cpu13400fImage from "../../images/product images/cpu/13400f.png";
import cpu13600kImage from "../../images/product images/cpu/13600k.png";
import cpu13700kImage from "../../images/product images/cpu/13700k.png";
import cpu14700kImage from "../../images/product images/cpu/14700k.png";
import cpu13900kImage from "../../images/product images/cpu/13900k.png";
import cpu14900kImage from "../../images/product images/cpu/14900k.png";
import cpu3600Image from "../../images/product images/cpu/3600.png";
import cpu5500Image from "../../images/product images/cpu/5500.png";
import cpu5600xImage from "../../images/product images/cpu/5600x.png";
import cpu8400fImage from "../../images/product images/cpu/8400f.png";
import cpu9600xImage from "../../images/product images/cpu/9600x.png";
import cpu9800x3dImage from "../../images/product images/cpu/9800x3d.png";
import gpu3050Image from "../../images/product images/gpu/3050.png";
import gpu4060Image from "../../images/product images/gpu/4060.png";
import gpu4060TiImage from "../../images/product images/gpu/4060 ti.png";
import gpu4070Image from "../../images/product images/gpu/4070.png";
import gpu4070SuperImage from "../../images/product images/gpu/4070 super.png";
import gpu4080SuperImage from "../../images/product images/gpu/4080 super.png";
import gpu4090Image from "../../images/product images/gpu/4090.png";
import gpu5060TiImage from "../../images/product images/gpu/5060 ti.png";
import gpu5070Image from "../../images/product images/gpu/5070.png";
import gpu5080Image from "../../images/product images/gpu/5080.png";
import gpu7600Image from "../../images/product images/gpu/7600.png";
import gpu7700xtImage from "../../images/product images/gpu/7700xt.png";
import gpu7800xtImage from "../../images/product images/gpu/7800xt.png";
import gpu9060xtImage from "../../images/product images/gpu/9060 xt.png";
import gpu9070xtImage from "../../images/product images/gpu/9070 xt.png";
import gpuA770Image from "../../images/product images/gpu/a770.png";
import gpuRx7600Image from "../../images/product images/gpu/RX 7600.png";
import moboAsusRogB650EImage from "../../images/product images/mobo/ASUS ROG Strix B650-E.png";
import moboMsiMagB650TomahawkImage from "../../images/product images/mobo/MSI MAG B650 Tomahawk.png";
import moboGigabyteB650AorusEliteImage from "../../images/product images/mobo/Gigabyte B650 Aorus Elite.png";
import moboAsrockX670ESteelLegendImage from "../../images/product images/mobo/ASRock X670E Steel Legend.png";
import moboAsusTufZ790PlusImage from "../../images/product images/mobo/ASUS TUF Gaming Z790-Plus.png";
import moboMsiMpgZ790EdgeImage from "../../images/product images/mobo/MSI MPG Z790 Edge.png";
import moboGigabyteZ790AorusEliteImage from "../../images/product images/mobo/Gigabyte Z790 Aorus Elite.png";
import moboAsrockZ790ProRsImage from "../../images/product images/mobo/ASRock Z790 Pro RS.png";
import moboMsiB760MMortarImage from "../../images/product images/mobo/MSI B760M Mortar.png";
import moboAsusPrimeB650MAImage from "../../images/product images/mobo/ASUS Prime B650M-A.png";
import ramAdataSpectrixD35GImage from "../../images/product images/ram/A-Data XPG SPECTRIX D35G.png";
import ramAdataXpgLancerImage from "../../images/product images/ram/ADATA XPG Lancer.png";
import ramCorsairDominatorDdr4Image from "../../images/product images/ram/Corsair Dominator ddr4.png";
import ramCorsairDominatorImage from "../../images/product images/ram/Corsair Dominator.png";
import ramCorsairVengeanceImage from "../../images/product images/ram/Corsair Vengeance.png";
import ramCrucialProImage from "../../images/product images/ram/Crucial Pro.png";
import ramDellGenericImage from "../../images/product images/ram/dell generic ram.png";
import ramGSkillRipjawsImage from "../../images/product images/ram/G.Skill Ripjaws.png";
import ramGSkillTridentZ5Image from "../../images/product images/ram/G.Skill Trident Z5.png";
import ramKingston32GbDdr5Image from "../../images/product images/ram/Kingston 32GB DDR5.png";
import ramKingstonFuryBeastImage from "../../images/product images/ram/Kingston Fury Beast.png";
import ramKingstonFuryRenegadeImage from "../../images/product images/ram/Kingston Fury Renegade.png";
import ramTeamGroupTForceDeltaImage from "../../images/product images/ram/TeamGroup T-Force Delta.png";
import storageCrucialMx500Image from "../../images/product images/ssd/Crucial MX500 1TB.png";
import storageCrucialT500Image from "../../images/product images/ssd/Crucial T500 1TB.png";
import storageKingstonFuryRenegadeG5Image from "../../images/product images/ssd/Kingston Fury Renegade G5.png";
import storageKingstonKc3000Image from "../../images/product images/ssd/Kingston KC3000 1TB.png";
import storageLexarNm1090Image from "../../images/product images/ssd/Lexar Professional NM1090.png";
import storageSamsung870EvoImage from "../../images/product images/ssd/Samsung 870 Evo 2TB.png";
import storageSamsung990Pro1tbImage from "../../images/product images/ssd/Samsung 990 Pro 1TB.png";
import storageSamsung990Pro2tbImage from "../../images/product images/ssd/Samsung 990 Pro 2TB.png";
import storageSeagateBarraCudaImage from "../../images/product images/ssd/Seagate BarraCuda 4TB.png";
import storageSeagateFireCuda530Image from "../../images/product images/ssd/Seagate FireCuda 530 2TB.png";
import storageTeamGroupG50Image from "../../images/product images/ssd/Team Group T-Force G50.png";
import storageWdBlackSn850xImage from "../../images/product images/ssd/WD Black SN850X 1TB.png";
import storageWdBlueSn580Image from "../../images/product images/ssd/WD Blue SN580 1TBWD Blue SN580 1TB.png";
import psuCorsairRm750eImage from "../../images/product images/psu/Corsair RM750e.png";
import psuCorsairRm850xImage from "../../images/product images/psu/Corsair RM850x.png";
import psuSeasonicFocusGx750Image from "../../images/product images/psu/Seasonic Focus GX-750.png";
import psuSeasonicVertexGx1000Image from "../../images/product images/psu/Seasonic Vertex GX-1000.png";
import psuBeQuietStraightPower12Image from "../../images/product images/psu/be quiet! Straight Power 12.png";
import psuCoolerMasterMwe750Image from "../../images/product images/psu/Cooler Master MWE 750.png";
import psuAsusTufGaming850gImage from "../../images/product images/psu/ASUS TUF Gaming 850G.png";
import psuMsiMpgA850gImage from "../../images/product images/psu/MSI MPG A850G.png";
import psuNzxtC750Image from "../../images/product images/psu/NZXT C750.png";
import psuThermaltakeToughpowerGf3Image from "../../images/product images/psu/Thermaltake Toughpower GF3.png";
import coolingNoctuaNhd15Image from "../../images/product images/cooler/Noctua NH-D15.png";
import coolingBeQuietDarkRockPro5Image from "../../images/product images/cooler/be quiet! Dark Rock Pro 5.png";
import coolingCorsairIcUEH150iImage from "../../images/product images/cooler/Corsair iCUE H150i.png";
import coolingNzxtKraken360Image from "../../images/product images/cooler/NZXT Kraken 360.png";
import coolingArcticLiquidFreezerII360Image from "../../images/product images/cooler/Arctic Liquid Freezer II 360.png";
import coolingDeepCoolAk620Image from "../../images/product images/cooler/DeepCool AK620.png";
import coolingLianLiGalahadIiTrinityImage from "../../images/product images/cooler/Lian Li Galahad II Trinity.png";
import coolingCoolerMasterMasterLiquid360Image from "../../images/product images/cooler/Cooler Master MasterLiquid 360.png";
import coolingThermalrightPeerlessAssassinImage from "../../images/product images/cooler/Thermalright Peerless Assassin.png";
import coolingCorsairIcUEH100iImage from "../../images/product images/cooler/Corsair iCUE H100i.png";

type CategoryKey =
  | "cpu"
  | "gpu"
  | "motherboard"
  | "ram"
  | "storage"
  | "case"
  | "psu"
  | "cooling"
  | "chassifan"
  | "networkcard";

type ComponentItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  specs: string[];
  image?: string;
  highlight?: string;
  socket?: "AM4" | "AM5" | "LGA1700" | "LGA1200" | "LGA1851";
  ramType?: "DDR4" | "DDR5";
  gpuModel?: string;
  performanceClass?: "Budget" | "Entry" | "Performance" | "Sweet-Spot" | "Extreme" | "Overkill";
  details?: Record<string, string>;
  selectedStore?: string;
  selectedCurrency?: string;
  selectedProductUrl?: string | null;
  selectedTotalPrice?: number | null;
};

type StoreOffer = {
  store_id?: string;
  status?: string;
  store: string;
  price: number | null;
  currency?: string;
  shipping_price?: number | null;
  total_price?: number | null;
  product_url?: string | null;
  search_url?: string | null;
  availability?: string | null;
  updated_at?: string | null;
  error?: string | null;
};

type StoreProductResult = {
  product_id: string;
  title: string;
  offers: StoreOffer[];
};

type StoreOffersResponse = {
  ok: boolean;
  query: string;
  products: StoreProductResult[];
};

type CatalogItemOffersResponse = {
  ok: boolean;
  item_id: string;
  updated_at?: string;
  lowest_price?: number | null;
  image_url?: string | null;
  offers: StoreOffer[];
};

type CatalogCategoryPricesResponse = {
  ok: boolean;
  category: string;
  prices: Array<{
    item_id: string;
    lowest_price: number | null;
    updated_at?: string | null;
    image_url?: string | null;
    offer_count?: number;
    in_stock_count?: number;
    stock?: Record<string, number>;
    price_source?: "live-offer" | "fallback" | "search" | "no-store" | null;
  }>;
};

type CustomBuildPriceSource = "live-offer" | "seed" | "fallback" | "search" | "no-store";


type CategoryConfig = {
  key: CategoryKey;
  label: string;
  description: string;
  icon: typeof Cpu;
  /*
   * Ett valfritt steg räknas inte som en komponent kunden måste välja.
   *
   * Datorn startar utan chassifläktar och utan nätverkskort - moderkortet
   * har ett nätverksuttag och chassit har oftast en fläkt med sig. Att
   * kräva dem hade betytt att ingen kund någonsin kom fram till
   * offertknappen, eftersom den öppnas först när allt är valt.
   */
  optional?: boolean;
};

const CATEGORY_LIST: CategoryConfig[] = [
  {
    key: "cpu",
    label: "CPU",
    description: "Hjärnan i datorn",
    icon: Cpu,
  },
  {
    key: "gpu",
    label: "Grafikkort",
    description: "Rendering & FPS",
    /* Var Monitor. En skärm är inte ett grafikkort - den sitter i andra
       änden av kabeln. Lucide har ingen grafikkortsikon, och ett chipp är
       det närmaste som faktiskt läses rätt. */
    icon: Microchip,
  },
  {
    key: "motherboard",
    label: "Moderkort",
    description: "Plattformen",
    icon: CircuitBoard,
  },
  {
    key: "ram",
    label: "RAM-minne",
    description: "Snabbt arbetsminne",
    icon: MemoryStick,
  },
  {
    key: "storage",
    label: "Lagring",
    description: "SSD & NVMe",
    icon: HardDrive,
  },
  {
    key: "case",
    label: "Chassi",
    description: "Design & airflow",
    /* Var Box, alltså en flyttkartong. PcCase är en datorlåda. */
    icon: PcCase,
  },
  {
    key: "psu",
    label: "Nätaggregat",
    description: "Stabil ström",
    icon: Power,
  },
  {
    key: "cooling",
    label: "Kylning",
    description: "Tysta lösningar",
    /* Delade fläktikon med chassifläktarna, så de två stegen såg likadana
       ut i listan. Kylaren står för kylan, fläkten för fläkten. */
    icon: Snowflake,
  },
  {
    key: "chassifan",
    label: "Chassifläktar",
    description: "Luft genom lådan",
    icon: Fan,
    optional: true,
  },
  {
    key: "networkcard",
    label: "Nätverkskort",
    description: "Wi-Fi och snabbare nät",
    icon: Wifi,
    optional: true,
  },
];

/* Stegen kunden måste gå igenom. De valfria ligger sist och räknas inte. */
const REQUIRED_CATEGORIES = CATEGORY_LIST.filter((category) => !category.optional);

/*
 * De valfria ligger i en egen utfällbar lista, inte bland stegen.
 *
 * Chassifläktar och nätverkskort är tillval till ett bygge, inte ett steg
 * på vägen genom det. Som egna steg i kedjan såg de ut som något kunden
 * hade glömt; hopfällda under en rubrik ser de ut som det de är.
 */
const OPTIONAL_CATEGORIES = CATEGORY_LIST.filter((category) => category.optional);

/**
 * Den kedja ett steg tillhör.
 *
 * "Nästa"-knappen ska inte leda från Kylning in i tillvalen - där tar det
 * obligatoriska slut och sammanfattningen tar vid. Inne bland tillvalen
 * ska den däremot leda vidare till nästa tillval.
 */
const getCategoryGroup = (key: CategoryKey) =>
  OPTIONAL_CATEGORIES.some((category) => category.key === key) ? OPTIONAL_CATEGORIES : REQUIRED_CATEGORIES;

const FALLBACK_COMPONENT_IMAGE = cpu12400fImage;
const buildPricespyProductImageUrl = (productId: number | string) =>
  `https://pricespy-75b8.kxcdn.com/product/standard/800/${productId}.jpg`;

// Cases must use external product images, not our local placeholder/reused case assets.
const CASE_REMOTE_IMAGE_BY_ID: Record<string, string> = {
  "case-1": buildPricespyProductImageUrl(13621253),
  "case-2": buildPricespyProductImageUrl(7386085),
  "case-3": buildPricespyProductImageUrl(13464862),
  "case-4": buildPricespyProductImageUrl(14366586),
  "case-5": buildPricespyProductImageUrl(10250470),
  "case-6": buildPricespyProductImageUrl(5339161),
  "case-7": "https://a.storyblok.com/f/281110/0784b7eca1/td500-mesh-black-gallery-1.png",
  "case-8": buildPricespyProductImageUrl(13900663),
  "case-9": "https://komponentkoll.se/api/thumbnail/240/1447178.jpg",
  "case-10": buildPricespyProductImageUrl(5641231),
  "case-11": "https://cdn.deepcool.com/public/ProductFile/DEEPCOOL/Cases/CG530_4F/Gallery/800X800/01.jpg",
  "case-12": "https://cdn.deepcool.com/public/ProductFile/DEEPCOOL/Cases/CG530_WH_4F/Gallery/800X800/01.jpg",
  "case-13": buildPricespyProductImageUrl(13331232),
  "case-14": "https://lian-li.com/wp-content/uploads/2025/06/V100_013.jpg",
  "case-15": buildPricespyProductImageUrl(14434812),
  "case-16": buildPricespyProductImageUrl(12651584),
  "case-17": "https://cdn.deepcool.com/public/ProductFile/DEEPCOOL/Cases/CG530/Gallery/800X800/01.jpg",
  "case-18": buildPricespyProductImageUrl(13464862),
  "case-19": buildPricespyProductImageUrl(13947588),
  "case-20": buildPricespyProductImageUrl(13947603),
  "case-21": buildPricespyProductImageUrl(13646857),
  "case-22": buildPricespyProductImageUrl(15110071),
  "case-23": buildPricespyProductImageUrl(13331233),
  "case-24": "https://www.chieftec.eu/upload/pic/o-product_pic1240919143837_7617.jpg",
  "case-25": "https://cdn.deepcool.com/public/ProductFile/DEEPCOOL/Cases/CG530_WH/Gallery/800X800/01.jpg",
  "case-26": "https://a.storyblok.com/f/281110/3637x4350/63e693d3ef/elite-301b_07.png",
  "case-27": buildPricespyProductImageUrl(13777347),
  "case-28":
    "https://impro.usercontent.one/appid/oneComWsb/domain/kolink.eu/media/kolink.eu/onewebmedia/Cases/OBSERVATORY%20HF%20Glass%20Black/GEKL_129_01.jpg?etag=%22248c3-64e5c359%22&sourceContentType=image%2Fjpeg&quality=85",
  "case-29":
    "https://impro.usercontent.one/appid/oneComWsb/domain/kolink.eu/media/kolink.eu/onewebmedia/Cases/OBSERVATORY%20HF%20Glass%20White/GEKL_131_01.jpg?etag=%222247d-64e5c3ef%22&sourceContentType=image%2Fjpeg&quality=85",
};
const CATALOG_IMAGE_OVERRIDE_BY_ID: Record<string, string> = {
  "cpu-am5-ryzen-7-8700f-tray":
    "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2608523-amd-ryzen-8000-series-processor.jpg",
  "gpu-42":
    "https://storage-asset.msi.com/global/picture/product/product_17421809804a33390517f3c8c98d5b917bf326f327.webp",
  "mb-am5-msi-b650m-mortar-wifi":
    "https://storage-asset.msi.com/global/picture/product/product_1664786100a9659f7edbe77972f26916ac5675fd77.webp",
  "ram-4": ramCrucialProImage,
  "sto-6": storageWdBlueSn580Image,
  "sto-8": storageSamsung870EvoImage,
  "sto-10": storageSeagateBarraCudaImage,
  "sto-21": "https://www.intenso.de/wp-content/uploads/2024/02/intenso-m2-ssd-pcie-premium-intro-1.jpg",
  "sto-29":
    "https://assets.micron.com/adobe/assets/urn:aaid:aem:1f58c474-a1f9-4fb8-a32f-09865f4cba27/renditions/transformpng-640-640.png/as/crucial-ssd-p510-heatsink-isolated-front-2.png",
  "sto-31":
    "https://assets.micron.com/adobe/assets/urn:aaid:aem:315aa9ee-7898-4f13-9aa6-8d14d6dc135e/renditions/transformpng-640-640.png/as/crucial-ssd-p310-2280-heatsink-front-view.png",
  "psu-7": psuAsusTufGaming850gImage,
  "cool-7": coolingLianLiGalahadIiTrinityImage,
  "cool-8": "https://a.storyblok.com/f/281110/2400x2400/14c2f18af4/ml-atmos-ii-vrm-fan-hover-01.png",
  "cool-21": coolingCoolerMasterMasterLiquid360Image,
  "cool-28": "https://www.thermalright.com/wp-content/uploads/2023/08/1-3.jpg",
};
const TrashIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M6 6l1 14h10l1-14" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);
const SOCKET_RAM_TYPE: Record<string, "DDR4" | "DDR5"> = {
  AM4: "DDR4",
  AM5: "DDR5",
  LGA1700: "DDR5",
  LGA1200: "DDR4",
  LGA1851: "DDR5",
};
const CATEGORY_IMAGES: Record<CategoryKey, { src: string; alt: string }> = {
  cpu: { src: cpu12400fImage, alt: "Processor" },
  gpu: { src: gpu5070Image, alt: "Grafikkort" },
  motherboard: { src: moboAsusRogB650EImage, alt: "Moderkort" },
  ram: { src: ramKingstonFuryBeastImage, alt: "RAM-minne" },
  storage: { src: storageSamsung990Pro1tbImage, alt: "Lagring" },
  case: { src: CASE_REMOTE_IMAGE_BY_ID["case-1"], alt: "Chassi" },
  psu: { src: psuCorsairRm750eImage, alt: "Nätaggregat" },
  cooling: { src: coolingNzxtKraken360Image, alt: "Kylning" },
  /* Reservbilder. Nästan varje post i de två kategorierna har en egen
     bild från butiken; de här syns bara när den saknas. */
  chassifan: { src: coolingNzxtKraken360Image, alt: "Chassifläkt" },
  networkcard: { src: moboAsusRogB650EImage, alt: "Nätverkskort" },
};
const CATEGORY_ORDER: CategoryKey[] = [
  "cpu",
  "gpu",
  "motherboard",
  "ram",
  "storage",
  "case",
  "psu",
  "cooling",
  "chassifan",
  "networkcard",
];
const CATEGORY_ID_PREFIX: Record<CategoryKey, string> = {
  cpu: "cpu",
  gpu: "gpu",
  motherboard: "mb",
  ram: "ram",
  storage: "sto",
  case: "case",
  psu: "psu",
  cooling: "cool",
  chassifan: "fan",
  networkcard: "nic",
};

const CATALOG_IMAGE_MAP: Record<string, string> = {
  cpu3600: cpu3600Image,
  cpu5500: cpu5500Image,
  cpu5600x: cpu5600xImage,
  cpu7600: cpu7600Image,
  cpu7700: cpu7700Image,
  cpu7800x3d: cpu7800x3dImage,
  cpu7950x3d: cpu7950x3dImage,
  cpu12400f: cpu12400fImage,
  cpu13400f: cpu13400fImage,
  cpu13600k: cpu13600kImage,
  cpu13700k: cpu13700kImage,
  cpu14700k: cpu14700kImage,
  cpu13900k: cpu13900kImage,
  cpu14900k: cpu14900kImage,
  cpu8400f: cpu8400fImage,
  cpu9600x: cpu9600xImage,
  cpu9800x3d: cpu9800x3dImage,
  moboAsusRogB650E: moboAsusRogB650EImage,
  moboMsiMagB650Tomahawk: moboMsiMagB650TomahawkImage,
  moboGigabyteB650AorusElite: moboGigabyteB650AorusEliteImage,
  moboAsrockX670ESteelLegend: moboAsrockX670ESteelLegendImage,
  moboAsusPrimeB650MA: moboAsusPrimeB650MAImage,
  moboAsusTufZ790Plus: moboAsusTufZ790PlusImage,
  moboMsiMpgZ790Edge: moboMsiMpgZ790EdgeImage,
  moboGigabyteZ790AorusElite: moboGigabyteZ790AorusEliteImage,
  moboAsrockZ790ProRs: moboAsrockZ790ProRsImage,
  moboMsiB760MMortar: moboMsiB760MMortarImage,
};

const catalogItems = CUSTOM_BUILD_CATALOG_ITEMS as Array<{
  id: string;
  category: "cpu" | "motherboard";
  name: string;
  brand: string;
  socket: "AM4" | "AM5" | "LGA1700" | "LGA1200" | "LGA1851";
  price: number;
  imageKey?: string;
  specs: string[];
  details?: Record<string, string>;
  highlight?: string | null;
}>;

const getPreloadedPrice = (itemId: string, fallbackPrice: number) => {
  const preloadedPrice = CUSTOM_BUILD_PRELOADED_PRICE_BY_ID[itemId];
  return Number.isFinite(preloadedPrice) && preloadedPrice > 0
    ? Math.max(0, Math.round(preloadedPrice))
    : fallbackPrice;
};

const catalogComponentItems: Record<"cpu" | "motherboard", ComponentItem[]> = {
  cpu: catalogItems
    .filter((item) => item.category === "cpu")
    .map((item) => ({
      id: item.id,
      name: item.name,
      brand: item.brand,
      price: getPreloadedPrice(item.id, item.price),
      specs: Array.isArray(item.specs) ? item.specs : [],
      socket: item.socket,
      image: item.imageKey ? CATALOG_IMAGE_MAP[item.imageKey] : undefined,
      details: item.details || {},
      highlight: item.highlight || undefined,
    })),
  motherboard: catalogItems
    .filter((item) => item.category === "motherboard")
    .map((item) => ({
      id: item.id,
      name: item.name,
      brand: item.brand,
      price: getPreloadedPrice(item.id, item.price),
      specs: Array.isArray(item.specs) ? item.specs : [],
      socket: item.socket,
      image: item.imageKey ? CATALOG_IMAGE_MAP[item.imageKey] : undefined,
      details: item.details || {},
      highlight: item.highlight || undefined,
  })),
};

const STORAGE_METADATA_BY_ID: Record<string, { interface?: string; pcieGen?: string }> = {
  "sto-1": { interface: "NVMe", pcieGen: "Gen4" },
  "sto-2": { interface: "NVMe", pcieGen: "Gen4" },
  "sto-3": { interface: "NVMe", pcieGen: "Gen4" },
  "sto-4": { interface: "NVMe", pcieGen: "Gen4" },
  "sto-5": { interface: "NVMe", pcieGen: "Gen4" },
  "sto-6": { interface: "NVMe", pcieGen: "Gen4" },
  "sto-7": { interface: "NVMe", pcieGen: "Gen4" },
  "sto-8": { interface: "SATA" },
  "sto-9": { interface: "SATA" },
  "sto-10": { interface: "HDD" },
  "sto-11": { interface: "NVMe", pcieGen: "Gen4" },
  "sto-13": { interface: "NVMe", pcieGen: "Gen5" },
  "sto-14": { interface: "NVMe", pcieGen: "Gen5" },
};

const PSU_METADATA_BY_ID: Record<
  string,
  { wattage: number; rating: string; modular: "Modular" | "Ej modular" }
> = {
  "psu-1": { wattage: 750, rating: "Gold", modular: "Modular" },
  "psu-2": { wattage: 850, rating: "Gold", modular: "Modular" },
  "psu-3": { wattage: 750, rating: "Gold", modular: "Modular" },
  "psu-4": { wattage: 1200, rating: "Gold", modular: "Modular" },
  "psu-5": { wattage: 1200, rating: "Platinum", modular: "Modular" },
  "psu-6": { wattage: 750, rating: "Gold", modular: "Modular" },
  "psu-7": { wattage: 850, rating: "Gold", modular: "Modular" },
  "psu-8": { wattage: 850, rating: "Gold", modular: "Modular" },
  "psu-9": { wattage: 750, rating: "Gold", modular: "Modular" },
  "psu-10": { wattage: 850, rating: "Gold", modular: "Modular" },
  "psu-11": { wattage: 650, rating: "Gold", modular: "Ej modular" },
  "psu-12": { wattage: 650, rating: "Bronze", modular: "Ej modular" },
  "psu-13": { wattage: 650, rating: "Bronze", modular: "Ej modular" },
  "psu-14": { wattage: 650, rating: "Bronze", modular: "Ej modular" },
  "psu-15": { wattage: 750, rating: "Bronze", modular: "Ej modular" },
  "psu-16": { wattage: 650, rating: "Bronze", modular: "Ej modular" },
  "psu-17": { wattage: 750, rating: "Bronze", modular: "Ej modular" },
  "psu-18": { wattage: 750, rating: "Bronze", modular: "Ej modular" },
  "psu-19": { wattage: 750, rating: "Bronze", modular: "Ej modular" },
  "psu-20": { wattage: 750, rating: "Bronze", modular: "Ej modular" },
  "psu-21": { wattage: 750, rating: "Gold", modular: "Modular" },
  "psu-22": { wattage: 850, rating: "Gold", modular: "Modular" },
  "psu-23": { wattage: 850, rating: "Gold", modular: "Modular" },
  "psu-24": { wattage: 850, rating: "Bronze", modular: "Ej modular" },
  "psu-25": { wattage: 850, rating: "Gold", modular: "Modular" },
  "psu-26": { wattage: 850, rating: "Gold", modular: "Modular" },
  "psu-27": { wattage: 850, rating: "Gold", modular: "Modular" },
  "psu-28": { wattage: 1000, rating: "Gold", modular: "Modular" },
  "psu-29": { wattage: 1000, rating: "Gold", modular: "Modular" },
};

const normalizeFilterToken = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const collectItemSearchText = (item: ComponentItem) => [item.name, ...(item.specs || []), ...Object.values(item.details || {})]
  .join(" ");

const getItemSocketFilterValue = (item: ComponentItem) => {
  if (item.socket) return item.socket;
  const text = collectItemSearchText(item);
  if (/am5/i.test(text)) return "AM5";
  if (/am4/i.test(text)) return "AM4";
  if (/lga\s*1700/i.test(text)) return "LGA1700";
  if (/lga\s*1200/i.test(text)) return "LGA1200";
  return "";
};

const getItemRamTypeFilterValue = (item: ComponentItem) => {
  if (item.ramType) return item.ramType;
  const text = collectItemSearchText(item);
  if (/ddr5/i.test(text)) return "DDR5";
  if (/ddr4/i.test(text)) return "DDR4";
  return "";
};

const getItemFormFactorFilterValue = (item: ComponentItem) => {
  const detailValue = String(item.details?.formFactor || "").trim();
  if (detailValue) return detailValue;
  const text = collectItemSearchText(item);
  if (/\bmatx\b/i.test(text)) return "mATX";
  if (/\batx\b/i.test(text)) return "ATX";
  return "";
};

const getItemPcieGenerationFilterValue = (item: ComponentItem) => {
  const detailValue = String(item.details?.pcie || "").trim();
  const metadataValue = STORAGE_METADATA_BY_ID[item.id]?.pcieGen || "";
  const text = `${collectItemSearchText(item)} ${detailValue} ${metadataValue}`;
  if (/pcie\s*5(\.0)?|gen\s*5/i.test(text)) return "Gen5";
  if (/pcie\s*4(\.0)?|gen\s*4/i.test(text)) return "Gen4";
  return "";
};

const getItemChipsetFilterValue = (item: ComponentItem) => {
  const detailValue = String(item.details?.chipset || "").trim();
  if (detailValue) return detailValue;
  const text = collectItemSearchText(item);
  const match = text.match(/\b(B\d{3,4}[A-Z]?|X\d{3,4}[A-Z]?|Z\d{3,4}|H\d{3,4}|A\d{3,4}|Q\d{3,4})\b/i);
  return match ? match[1].toUpperCase() : "";
};

const getItemStorageTypeFilterValue = (item: ComponentItem) => {
  const metadataValue = STORAGE_METADATA_BY_ID[item.id]?.interface || "";
  const text = `${collectItemSearchText(item)} ${metadataValue}`;
  if (/nvme/i.test(text)) return "NVMe";
  if (/sata/i.test(text)) return "SATA";
  if (/\bhdd\b/i.test(text)) return "HDD";
  return "";
};

const getItemPsuWattage = (item: ComponentItem) => {
  const metadataValue = PSU_METADATA_BY_ID[item.id]?.wattage;
  if (typeof metadataValue === "number") return metadataValue;
  const text = collectItemSearchText(item);
  const match = text.match(/(\d{3,4})\s*w/i);
  return match ? Number(match[1]) : null;
};

const getItemPsuRating = (item: ComponentItem) => {
  const metadataValue = PSU_METADATA_BY_ID[item.id]?.rating;
  if (metadataValue) return metadataValue;
  const text = collectItemSearchText(item);
  const match = text.match(/80\+\s*(bronze|silver|gold|platinum|titanium)/i);
  return match ? `${match[1].charAt(0).toUpperCase()}${match[1].slice(1).toLowerCase()}` : "";
};

const getItemPsuModularValue = (item: ComponentItem) => {
  const metadataValue = PSU_METADATA_BY_ID[item.id]?.modular;
  if (metadataValue) return metadataValue;
  const text = normalizeFilterToken(collectItemSearchText(item));
  if (text.includes("modular") || text.includes("modulart")) return "Modular";
  return "";
};

/*
 * Flödets grafikkort ärver prestandaklass av de handplockade.
 *
 * performanceClass sätts för hand, och bara de 67 kurerade korten har
 * en. De 327 ur Proshops flöde hade ingen alls, så klassfiltret dolde
 * fyra femtedelar av listan utan att säga det.
 *
 * Kartan byggs ur de handplockade själva: varje kort med en klass lånar
 * ut den till sin krets, och varje annat kort med samma krets får den.
 * Alltså inga nya omdömen från min sida - ett RTX 5070 ur flödet hamnar
 * i den klass Sahran redan satt på sitt eget RTX 5070.
 *
 * Klassar han ett nytt kort ärver flödet det automatiskt.
 */
/*
 * Byggs vid första användningen, inte när filen läses.
 *
 * CURATED_COMPONENTS och getItemGpuChip står längre ner i filen, och en
 * karta som byggs direkt hade läst dem innan de fanns.
 */
let gpuKlassKarta: Map<string, string> | null = null;

const getGpuKlassKarta = () => {
  if (gpuKlassKarta) return gpuKlassKarta;
  gpuKlassKarta = new Map<string, string>();
  for (const item of CURATED_COMPONENTS.gpu) {
    if (!item.performanceClass) continue;
    const krets = getItemGpuChip(item);
    if (krets && !gpuKlassKarta.has(krets)) gpuKlassKarta.set(krets, item.performanceClass);
  }
  return gpuKlassKarta;
};

const getItemGpuPerformanceClass = (item: ComponentItem) =>
  item.performanceClass || getGpuKlassKarta().get(getItemGpuChip(item)) || "";


const getItemCpuChip = (item: ComponentItem) => {
  const text = normalizeFilterToken(item.name);
  /* Paret maste skrivas ut. Utan typen blir listan (string |
     RegExp)[][], och da vet inte TypeScript att andra platsen alltid
     ar ett monster - pattern.test fanns inte. */
  const chipPatterns: [string, RegExp][] = [
    ["Ryzen 9", /ryzen\s*9/],
    ["Ryzen 7", /ryzen\s*7/],
    ["Ryzen 5", /ryzen\s*5/],
    ["Ryzen 3", /ryzen\s*3/],
    ["Core i9", /core\s*i9/],
    ["Core i7", /core\s*i7/],
    ["Core i5", /core\s*i5/],
    ["Core i3", /core\s*i3/],
  ];

  for (const [label, pattern] of chipPatterns) {
    if (pattern.test(text)) {
      return label;
    }
  }

  return "";
};

const getItemGpuChip = (item: ComponentItem) => {
  const text = normalizeFilterToken(`${item.gpuModel || ""} ${item.name}`);
  const chipPatterns: [string, RegExp][] = [
    ["RTX 5070 Ti", /rtx\s*5070\s*ti/],
    ["RTX 5060 Ti", /rtx\s*5060\s*ti/],
    ["RTX 5090", /rtx\s*5090/],
    ["RTX 5080", /rtx\s*5080/],
    ["RTX 5070", /rtx\s*5070/],
    ["RTX 5060", /rtx\s*5060/],
    ["RTX 5050", /rtx\s*5050/],
    ["RTX 3060", /rtx\s*3060/],
    ["RTX 3050", /rtx\s*3050/],
    ["RX 9070 XT", /rx\s*9070\s*xt/],
    ["RX 9070", /rx\s*9070(?!\s*xt)/],
    ["RX 9060 XT", /rx\s*9060\s*xt/],
    ["Arc B580", /arc\s*b580/],
  ];

  for (const [label, pattern] of chipPatterns) {
    if (pattern.test(text)) {
      return label;
    }
  }

  return "";
};

type SortDirection = "asc" | "desc";
type SortKey =
  | "popularity"
  | "price"
  | "lager"
  | "chipset"
  | "speed"
  | "cores"
  | "vram"
  | "ramSize"
  | "ramSpeed"
  | "ramCl"
  | "storageSize"
  | "read"
  | "write"
  | "wattage"
  | "coolingType";

/*
 * De tre sorteringarna som alltid finns, alltid först, alltid på samma
 * plats oavsett kategori.
 *
 * "exact" betyder att knappen både sätter och visar en bestämd riktning.
 * Billigast och Dyrast delar nyckeln "price" och skiljs bara av
 * riktningen - utan flaggan hade båda lyst upp samtidigt, och den gamla
 * knappen "Lägsta pris" såg aktiv ut även när listan låg dyrast först.
 *
 * Ligger utanför komponenten med flit. Som en konstant inne i renderen
 * blev den ett nytt objekt varje gång, och knappradens useMemo kunde
 * aldrig återanvända något.
 */
/*
 * Vad varje kategori visar för kolumner.
 *
 * "sort" är nyckeln kolumnen sorterar på; utan den är rubriken bara en
 * rubrik. "bredd" går in i rutnätets spaltmall, och samma mall används
 * av både rubrikraden och produktraderna - därav en enda lista.
 *
 * Kolumnerna är valda efter vad man faktiskt jämför i kategorin. Man
 * väljer minne efter hastighet och latens, lagring efter kapacitet och
 * läshastighet, aggregat efter effekt och verkningsgrad. Att visa samma
 * fyra kolumner överallt hade varit enklare och sämre.
 */
type Kolumn = {
  id: string;
  etikett: string;
  bredd: string;
  sort?: SortKey;
  riktning?: SortDirection;
  tal?: boolean;
  varde: (item: ComponentItem) => string;
};

const visaTal = (value: number | null | undefined, enhet = "") =>
  typeof value === "number" && Number.isFinite(value) ? `${value}${enhet}` : "—";

const KOLUMNER_PER_KATEGORI: Record<CategoryKey, Kolumn[]> = {
  cpu: [
    { id: "tillverkare", etikett: "Tillverkare", bredd: "6rem", varde: (i) => i.brand || "—" },
    { id: "karnor", etikett: "Kärnor", bredd: "5rem", sort: "cores", riktning: "desc", tal: true, varde: (i) => visaTal(getCpuCoreCount(i)) },
    { id: "ghz", etikett: "GHz", bredd: "4.5rem", sort: "speed", riktning: "desc", tal: true, varde: (i) => visaTal(getCpuSpeedGhz(i)) },
  ],
  gpu: [
    { id: "tillverkare", etikett: "Tillverkare", bredd: "6rem", varde: (i) => i.brand || "—" },
    { id: "krets", etikett: "Krets", bredd: "7rem", varde: (i) => getItemGpuChip(i) || "—" },
    { id: "vram", etikett: "Minne", bredd: "5rem", sort: "vram", riktning: "desc", tal: true, varde: (i) => visaTal(getGpuVramGb(i), " GB") },
  ],
  motherboard: [
    { id: "tillverkare", etikett: "Tillverkare", bredd: "6rem", varde: (i) => i.brand || "—" },
    { id: "chipset", etikett: "Chipset", bredd: "5.5rem", sort: "chipset", riktning: "desc", varde: (i) => getDisplayChipsetValue(i) || "—" },
    { id: "format", etikett: "Format", bredd: "6rem", varde: (i) => getItemFormFactorFilterValue(i) || "—" },
  ],
  ram: [
    { id: "tillverkare", etikett: "Tillverkare", bredd: "6rem", varde: (i) => i.brand || "—" },
    { id: "storlek", etikett: "Storlek", bredd: "5rem", sort: "ramSize", riktning: "desc", tal: true, varde: (i) => visaTal(getRamSizeGb(i), " GB") },
    { id: "hastighet", etikett: "MHz", bredd: "5rem", sort: "ramSpeed", riktning: "desc", tal: true, varde: (i) => visaTal(getRamSpeedMhz(i)) },
    { id: "cl", etikett: "CL", bredd: "3.5rem", sort: "ramCl", riktning: "asc", tal: true, varde: (i) => visaTal(getRamClValue(i)) },
  ],
  storage: [
    { id: "tillverkare", etikett: "Tillverkare", bredd: "6rem", varde: (i) => i.brand || "—" },
    {
      id: "storlek",
      etikett: "Storlek",
      bredd: "5rem",
      sort: "storageSize",
      riktning: "desc",
      tal: true,
      /* "32768 GB" är rätt men oläsligt. Butiken säger 32 TB och så
         säger kunden också. */
      varde: (i) => {
        const gb = getStorageSizeGb(i);
        if (typeof gb !== "number" || !Number.isFinite(gb)) return "—";
        return gb >= 1024 ? `${Math.round((gb / 1024) * 10) / 10} TB` : `${gb} GB`;
      },
    },
    { id: "las", etikett: "Läs", bredd: "5.5rem", sort: "read", riktning: "desc", tal: true, varde: (i) => visaTal(getStorageReadMb(i), " MB/s") },
    { id: "skriv", etikett: "Skriv", bredd: "5.5rem", sort: "write", riktning: "desc", tal: true, varde: (i) => visaTal(getStorageWriteMb(i), " MB/s") },
  ],
  psu: [
    { id: "tillverkare", etikett: "Tillverkare", bredd: "6rem", varde: (i) => i.brand || "—" },
    { id: "effekt", etikett: "Effekt", bredd: "5rem", sort: "wattage", riktning: "desc", tal: true, varde: (i) => visaTal(getItemPsuWattage(i), " W") },
    { id: "cert", etikett: "80 Plus", bredd: "5.5rem", varde: (i) => getItemPsuRating(i) || "—" },
  ],
  case: [
    { id: "tillverkare", etikett: "Tillverkare", bredd: "6rem", varde: (i) => i.brand || "—" },
    { id: "format", etikett: "Storlek", bredd: "6rem", varde: (i) => getItemFormFactorFilterValue(i) || "—" },
  ],
  cooling: [
    { id: "tillverkare", etikett: "Tillverkare", bredd: "6rem", varde: (i) => i.brand || "—" },
    { id: "typ", etikett: "Typ", bredd: "5.5rem", sort: "coolingType", riktning: "desc", varde: (i) => getCoolingTypeValue(i) || "—" },
  ],
  chassifan: [
    { id: "tillverkare", etikett: "Tillverkare", bredd: "6rem", varde: (i) => i.brand || "—" },
    { id: "storlek", etikett: "Storlek", bredd: "5rem", tal: true, varde: (i) => visaTal(getChassiFanSizeMm(i), " mm") },
  ],
  networkcard: [
    { id: "tillverkare", etikett: "Tillverkare", bredd: "6rem", varde: (i) => i.brand || "—" },
    { id: "fack", etikett: "Fack", bredd: "5rem", varde: (i) => getNetworkCardSlot(i) },
  ],
};

/* Bild, produktnamn, kategorins kolumner, pris, knapp. */
const spaltMall = (kolumner: Kolumn[]) =>
  /*
   * Första spalten är lika bred som raden är hög, så bilden blir
   * kvadratisk när den sträcks över hela höjden. Sista spalten rymmer
   * antingen "Lägg till" eller räknaren − 2 +.
   */
  `5.25rem minmax(0, 1fr) ${kolumner.map((k) => k.bredd).join(" ")} 4.25rem 6rem 5.75rem`;

const PRIMARY_SORTS = [
  { key: "popularity" as SortKey, label: "Populärast", direction: "desc" as SortDirection, exact: true },
  { key: "price" as SortKey, label: "Billigast", direction: "asc" as SortDirection, exact: true },
  { key: "price" as SortKey, label: "Dyrast", direction: "desc" as SortDirection, exact: true },
];

const CPU_VENDOR_CARD_OPTIONS = ["Alla", "AMD", "Intel"];
const CPU_PERFORMANCE_OPTIONS = ["Kontor / Media", "Gaming", "Entusiast"];
const CPU_MODEL_OPTIONS = [
  "Core i3",
  "Core i5",
  "Core i7",
  "Core i9",
  "Ryzen 5",
  "Ryzen 7",
  "Ryzen 9",
  "Core Ultra 5",
  "Core Ultra 7",
  "Core Ultra 9",
  "Threadripper",
];
const GPU_VENDOR_CARD_OPTIONS = ["Alla", "AMD", "Nvidia", "Intel"];
const GPU_MANUFACTURER_OPTIONS = [
  "ASUS",
  "Intel",
  "PNY",
  "Gigabyte",
  "XFX",
  "Acer",
  "MSI",
  "Gainward",
  "Sapphire",
  "PowerColor",
  "Zotac",
  "ASRock",
  "Inno3D",
  "INNO3D",
  "ZOTAC",
  "Palit",
];
const MOTHERBOARD_MANUFACTURER_OPTIONS = ["ASUS", "MSI", "ASRock", "Gigabyte", "NZXT"];
const RAM_SIZE_CARD_OPTIONS = [16, 32, 64];
const RAM_TYPE_CARD_OPTIONS = ["DDR4", "DDR5"];
const RAM_MANUFACTURER_OPTIONS = [
  "Corsair",
  "ADATA",
  "Crucial",
  "G.Skill",
  "Kingston",
  "PNY",
  "Patriot Memory",
  "Team Group",
];
const STORAGE_SIZE_CARD_OPTIONS = [256, 512, 1024, 2048, 4096];
const STORAGE_TYPE_CARD_OPTIONS = ['M.2', '2.5" SATA'];
const STORAGE_MANUFACTURER_OPTIONS = [
  "Corsair",
  "Crucial",
  "Kingston",
  "Lexar",
  "MSI",
  "PNY",
  "Patriot Memory",
  "Samsung",
  "Seagate",
  "Silicon Power",
  "Toshiba",
  "WD",
  "ADATA",
  "Team Group",
];
const STORAGE_FORM_FACTOR_OPTIONS = ['2.5"', "M.2", "M.2 2230", "M.2 2280"];
const STORAGE_INTERFACE_OPTIONS = ["M.2", "M.2 PCIe Gen3", "M.2 PCIe Gen4", "M.2 PCIe Gen5"];
const PSU_WATTAGE_CARD_OPTIONS = [400, 500, 600, 700, 800, 1000, 1200];
const PSU_MIN_RATING_CARD_OPTIONS = ["Bronze", "Gold", "Platinum"];
const PSU_MANUFACTURER_OPTIONS = [
  "Cooler Master",
  "Corsair",
  "EVGA",
  "Fractal Design",
  "ASUS",
  "NZXT",
  "Phanteks",
  "Seasonic",
  "be quiet!",
  "Deepcool",
  "FSP",
  "LIAN LI",
  "Thermaltake",
  "Silverstone",
  "Kolink",
  "MSI",
  "Gigabyte",
];
const PSU_MODULAR_OPTIONS = ["Ja", "Semi", "Nej"];
const PSU_FORM_FACTOR_OPTIONS = ["ATX", "SFX"];
const PSU_ATX_STANDARD_OPTIONS = ["3.0", "3.1"];
const COOLING_TYPE_CARD_OPTIONS = ["Luft", "Vatten"];
const COOLING_MANUFACTURER_OPTIONS = [
  "ASUS",
  "Arctic",
  "Cooler Master",
  "Corsair",
  "Deepcool",
  "Fractal Design",
  "MSI",
  "NZXT",
  "Noctua",
  "Phanteks",
  "Thermalright",
  "Thermaltake",
  "be quiet!",
  "LIAN LI",
];
const COOLING_SOCKET_OPTIONS = ["AM4", "AM5", "1700", "1851", "1200"];
const MOTHERBOARD_FORM_FACTOR_OPTIONS = ["ATX", "mATX", "mITX", "E-ATX"];
const CASE_FORM_FACTOR_OPTIONS = ["ATX", "mATX", "mITX", "E-ATX"];
const MOTHERBOARD_RAM_TYPE_OPTIONS = ["DDR4", "DDR5"];
const CHIPSET_DISPLAY_ORDER = [
  "AMD WRX90",
  "AMD TRX50",
  "AMD X870E",
  "AMD X870",
  "AMD X670E",
  "AMD X670",
  "AMD B850",
  "AMD B840",
  "AMD B650E",
  "AMD B650",
  "AMD A620",
  "AMD X570",
  "AMD B550",
  "AMD B450",
  "AMD A520",
  "Intel Z890",
  "Intel B860",
  "Intel H810",
  "Intel Z790",
  "Intel H770",
  "Intel B760",
  "Intel Z690",
  "Intel H670",
  "Intel B660",
  "Intel H610",
  "Intel Z590",
  "Intel B560",
  "Intel H510",
  "Intel Z490",
];

const normalizeBrandLabel = (value: string) => {
  const normalized = normalizeFilterToken(value);
  if (normalized === "g.skill") return "G.Skill";
  if (normalized === "adata") return "ADATA";
  if (normalized === "patriot memory") return "Patriot Memory";
  if (normalized === "team group") return "Team Group";
  if (normalized === "be quiet!") return "be quiet!";
  if (normalized === "deepcool") return "Deepcool";
  if (normalized === "lian li") return "LIAN LI";
  if (normalized === "wd") return "WD";
  return value;
};

const getFirstMatchNumber = (value: string, pattern: RegExp) => {
  const match = value.match(pattern);
  return match ? Number(match[1]) : null;
};

const withDetailsText = (item: ComponentItem) => `${collectItemSearchText(item)} ${Object.entries(item.details || {})
  .map(([key, value]) => `${key} ${value}`)
  .join(" ")}`;

const normalizeCapacityToGb = (value: number, unit: string) =>
  unit.toLowerCase().startsWith("tb") ? value * 1024 : value;

const getCpuModelFamily = (item: ComponentItem) => {
  const text = normalizeFilterToken(item.name);
  const families = [
    "Core Ultra 9",
    "Core Ultra 7",
    "Core Ultra 5",
    "Core i9",
    "Core i7",
    "Core i5",
    "Core i3",
    "Ryzen 9",
    "Ryzen 7",
    "Ryzen 5",
    "Ryzen 3",
    "Threadripper",
  ];
  return families.find((family) => normalizeFilterToken(family) && text.includes(normalizeFilterToken(family))) || "";
};

const getCpuSpeedGhz = (item: ComponentItem) => {
  const text = withDetailsText(item);
  const speeds = [...text.matchAll(/(\d+(?:[.,]\d+)?)\s*ghz/gi)].map((match) =>
    Number(match[1].replace(",", "."))
  );
  return speeds.length > 0 ? Math.max(...speeds) : null;
};

const getCpuCoreCount = (item: ComponentItem) => {
  const text = withDetailsText(item);
  const coreMatch = text.match(/(\d+)\s*k[äa]rnor/i);
  if (coreMatch) return Number(coreMatch[1]);
  const detailMatch = getFirstMatchNumber(String(item.details?.cores || ""), /(\d+)/);
  return detailMatch;
};

const getCpuPerformanceTier = (item: ComponentItem) => {
  const family = getCpuModelFamily(item);
  const cores = getCpuCoreCount(item) || 0;
  if (/threadripper|core ultra 9|core i9|ryzen 9/i.test(family) || cores >= 16) return "Entusiast";
  if (/core i7|core i5|ryzen 7|ryzen 5|core ultra 7|core ultra 5/i.test(family) || cores >= 6) return "Gaming";
  return "Kontor / Media";
};

const getGpuChipVendor = (item: ComponentItem) => {
  const text = normalizeFilterToken(`${item.name} ${item.gpuModel || ""}`);
  if (text.includes("rx ") || text.includes("radeon")) return "AMD";
  if (text.includes("rtx ") || text.includes("geforce")) return "Nvidia";
  if (text.includes("arc ")) return "Intel";
  return item.brand;
};

const getGpuVramGb = (item: ComponentItem) => {
  const text = withDetailsText(item);
  return getFirstMatchNumber(text, /(\d+)\s*gb/i);
};

const getGpuLengthMm = (item: ComponentItem) => {
  const detailText = String(item.details?.length || item.details?.längd || "");
  const fromDetails = getFirstMatchNumber(detailText, /(\d+)\s*mm/i);
  if (fromDetails) return fromDetails;
  return null;
};

const getMotherboardWifiValue = (item: ComponentItem) => {
  const text = normalizeFilterToken(withDetailsText(item));
  if (text.includes("wifi")) return "Ja";
  return "Nej";
};

const getMotherboardMemorySlots = (item: ComponentItem) => {
  const detailText = String(item.details?.memorySlots || item.details?.minnesplatser || "");
  const fromDetails = getFirstMatchNumber(detailText, /(\d+)/);
  if (fromDetails) return fromDetails;
  const text = withDetailsText(item);
  if (/2\s*x?\s*dimm|2\s*dimm/i.test(text)) return 2;
  if (/4\s*x?\s*dimm|4\s*dimm/i.test(text)) return 4;
  return null;
};

const getMotherboardM2Slots = (item: ComponentItem) => {
  const detailText = String(item.details?.m2Slots || item.details?.m2 || item.details?.["M.2 slots"] || "");
  const fromDetails = getFirstMatchNumber(detailText, /(\d+)/);
  if (fromDetails) return fromDetails;
  const text = withDetailsText(item);
  const match = text.match(/(\d+)\s*x?\s*m\.?2/i);
  return match ? Number(match[1]) : null;
};

const getDisplayChipsetValue = (item: ComponentItem) => {
  const chipset = getItemChipsetFilterValue(item);
  if (!chipset) return "";
  const socket = getItemSocketFilterValue(item);
  const isIntel = socket.startsWith("LGA") || /^Z|^B[6-9]|^H/i.test(chipset);
  return `${isIntel ? "Intel" : "AMD"} ${chipset}`;
};

const getChipsetSortRank = (value: string) => {
  const index = CHIPSET_DISPLAY_ORDER.findIndex((entry) => normalizeFilterToken(entry) === normalizeFilterToken(value));
  return index >= 0 ? CHIPSET_DISPLAY_ORDER.length - index : 0;
};

const getRamSizeGb = (item: ComponentItem) => {
  const text = withDetailsText(item);
  const parenMatch = text.match(/\((\d+)x(\d+)gb\)/i);
  if (parenMatch) return Number(parenMatch[1]) * Number(parenMatch[2]);
  const sizeMatches = [...text.matchAll(/(\d+)\s*gb/gi)].map((match) => Number(match[1]));
  return sizeMatches.length > 0 ? Math.max(...sizeMatches) : null;
};

const getRamSpeedMhz = (item: ComponentItem) => {
  const text = withDetailsText(item);
  const speedMatch = text.match(/(\d{4,5})\s*(?:mhz|mt\/s)/i);
  return speedMatch ? Number(speedMatch[1]) : null;
};

const getRamClValue = (item: ComponentItem) => {
  const text = withDetailsText(item);
  const clMatch = text.match(/cl\s*(\d+)/i);
  return clMatch ? Number(clMatch[1]) : null;
};

const getRamModulesValue = (item: ComponentItem) => {
  const text = withDetailsText(item);
  const moduleMatch = text.match(/\((\d+)x\d+\s*gb\)/i);
  return moduleMatch ? Number(moduleMatch[1]) : null;
};

const getStorageSizeGb = (item: ComponentItem) => {
  const text = withDetailsText(item);
  const matches = [...text.matchAll(/(\d+(?:[.,]\d+)?)\s*(tb|gb)\b/gi)].map((match) =>
    normalizeCapacityToGb(Number(match[1].replace(",", ".")), match[2])
  );
  return matches.length > 0 ? Math.max(...matches) : null;
};

const getStorageReadMb = (item: ComponentItem) => {
  const text = withDetailsText(item);
  const matches = [...text.matchAll(/(\d{3,5})\s*mb\/s/gi)].map((match) => Number(match[1]));
  return matches.length > 0 ? Math.max(...matches) : null;
};

const getStorageWriteMb = (item: ComponentItem) => {
  const text = withDetailsText(item);
  const matches = [...text.matchAll(/(\d{3,5})\s*mb\/s/gi)].map((match) => Number(match[1]));
  return matches.length > 1 ? Math.min(...matches) : matches.length === 1 ? matches[0] : null;
};

const getStorageFormFactorValue = (item: ComponentItem) => {
  const text = normalizeFilterToken(withDetailsText(item));
  if (text.includes('2.5"') || text.includes("2.5 sata")) return '2.5"';
  if (text.includes("2230")) return "M.2 2230";
  if (text.includes("2280")) return "M.2 2280";
  if (text.includes("m.2") || text.includes("m2")) return "M.2";
  return "";
};

const getStorageInterfaceValue = (item: ComponentItem) => {
  const text = normalizeFilterToken(withDetailsText(item));
  if (text.includes("gen5") || text.includes("pcie 5")) return "M.2 PCIe Gen5";
  if (text.includes("gen4") || text.includes("pcie 4")) return "M.2 PCIe Gen4";
  if (text.includes("gen3") || text.includes("pcie 3")) return "M.2 PCIe Gen3";
  if (text.includes("sata")) return "SATA 6Gb/s";
  if (text.includes("m.2") || text.includes("m2")) return "M.2";
  return "";
};

const getStorageTypeCardLabel = (item: ComponentItem) => {
  const type = getItemStorageTypeFilterValue(item);
  if (type === "SATA") return '2.5" SATA';
  return "M.2";
};

const getPsuLengthMm = (item: ComponentItem) => {
  const detailText = String(item.details?.length || item.details?.längd || "");
  const fromDetails = getFirstMatchNumber(detailText, /(\d+)\s*mm/i);
  if (fromDetails) return fromDetails;
  return null;
};

const getPsuModularOption = (item: ComponentItem) => {
  const text = normalizeFilterToken(withDetailsText(item));
  if (text.includes("semi")) return "Semi";
  if (text.includes("modular") || text.includes("modulart")) return "Ja";
  return "Nej";
};

const getPsuAtxStandard = (item: ComponentItem) => {
  const text = withDetailsText(item);
  const match = text.match(/atx\s*(3\.[01])/i);
  return match ? match[1] : "";
};

const getPsuFormFactorValue = (item: ComponentItem) => {
  const text = normalizeFilterToken(withDetailsText(item));
  if (text.includes("sfx")) return "SFX";
  if (text.includes("atx")) return "ATX";
  return "";
};

const getCoolingTypeValue = (item: ComponentItem) => {
  const text = normalizeFilterToken(withDetailsText(item));
  if (text.includes("aio") || text.includes("240") || text.includes("280") || text.includes("360") || text.includes("420") || text.includes("vatten")) {
    return "Vatten";
  }
  return "Luft";
};

const getCoolingHeightMm = (item: ComponentItem) => {
  const detailText = String(item.details?.height || item.details?.hojd || item.details?.höjd || "");
  const fromDetails = getFirstMatchNumber(detailText, /(\d+)\s*mm/i);
  if (fromDetails) return fromDetails;
  if (getCoolingTypeValue(item) === "Luft") {
    return getFirstMatchNumber(withDetailsText(item), /(\d+)\s*mm/i);
  }
  return null;
};

const getCoolingSocketLabels = (item: ComponentItem) => {
  const text = normalizeFilterToken(withDetailsText(item));
  const matches: string[] = [];
  if (text.includes("am4")) matches.push("AM4");
  if (text.includes("am5")) matches.push("AM5");
  if (text.includes("1700")) matches.push("1700");
  if (text.includes("1851")) matches.push("1851");
  if (text.includes("1200")) matches.push("1200");
  return matches;
};

/*
 * Hur många rader som ritas innan "Visa fler".
 *
 * Listan kan inte längre ritas hel. Minneskategorin har 1 275 poster och
 * varje rad är ett fyrtiotal element - hela kategorin blir ungefär hundra
 * tusen noder och webbläsaren hänger sig innan något syns. Bilderna klarar
 * sig på loading="lazy", men noderna finns ändå.
 *
 * Trettio är vad som ryms på ett par skrollningar. Sökrutan och filtren
 * arbetar alltid mot hela listan, inte mot de trettio som råkar vara
 * framme - det är bara ritandet som är begränsat.
 */
const ROWS_PER_PAGE = 30;

/*
 * Fläktens storlek, i millimeter.
 *
 * Det är det enda valet som spelar roll när man bläddrar bland 730
 * fläktar: 120 eller 140 är vad ett chassi har plats för, och resten är
 * smak. Värdet står både i specs och i titeln, och titeln läses som
 * reserv eftersom en handplockad post kan sakna specs.
 */
const getChassiFanSizeMm = (item: ComponentItem) => {
  const fromDetails = item.details?.["Storlek"];
  const found = String(fromDetails || item.name).match(/\b(40|60|80|92|120|140|200)\s*mm\b/i);
  return found ? Number(found[1]) : null;
};

/** Facket kortet sitter i: M.2 sitter platt på moderkortet, PCIe står upp. */
const getNetworkCardSlot = (item: ComponentItem) => {
  const fromDetails = item.details?.["Fack"];
  if (fromDetails) return String(fromDetails);
  return /\bm\.2\b/i.test(item.name) ? "M.2" : "PCIe";
};

/*
 * Vilka moderkort ett chassi rymmer.
 *
 * HÄRLETT, INTE HÄMTAT. Proshops chassititlar nämner aldrig
 * moderkortsformat - noll träffar på ATX, mATX eller ITX bland 1 210
 * chassin. Det enda butiken skriver är tornhöjden.
 *
 * Kopplingen nedan är branschkonvention: ett miditorn tar ATX och allt
 * mindre, ett minitorn tar Micro-ATX och mindre. Den stämmer nästan
 * alltid men är inte butikens besked, och därför är den ett FILTER och
 * ingen kompatibilitetsspärr. Konfiguratorn säger aldrig nej till en
 * kombination på grund av den här tabellen.
 */
const CASE_BOARD_SIZE_OPTIONS = ["E-ATX", "ATX", "Micro-ATX", "Mini-ITX"];

const CASE_BOARD_SIZES_BY_TOWER: Record<string, string[]> = {
  "Full tower": ["E-ATX", "ATX", "Micro-ATX", "Mini-ITX"],
  "E-ATX": ["E-ATX", "ATX", "Micro-ATX", "Mini-ITX"],
  Miditower: ["ATX", "Micro-ATX", "Mini-ITX"],
  Tower: ["ATX", "Micro-ATX", "Mini-ITX"],
  ATX: ["ATX", "Micro-ATX", "Mini-ITX"],
  Desktop: ["Micro-ATX", "Mini-ITX"],
  Cube: ["Micro-ATX", "Mini-ITX"],
  "Mini tower": ["Micro-ATX", "Mini-ITX"],
  "Micro-ATX": ["Micro-ATX", "Mini-ITX"],
  "Mini-ITX": ["Mini-ITX"],
};

const getCaseBoardSizes = (item: ComponentItem) => {
  const torn = getItemFormFactorFilterValue(item);
  return torn ? CASE_BOARD_SIZES_BY_TOWER[torn] || [] : [];
};

const CHASSI_FAN_SIZE_OPTIONS = ["80 mm", "92 mm", "120 mm", "140 mm", "200 mm"];
const NETWORK_CARD_SLOT_OPTIONS = ["PCIe", "M.2"];

const getItemPopularityScore = (item: ComponentItem, category: CategoryKey, index: number) => {
  let score = 1000 - index;
  const highlight = normalizeFilterToken(item.highlight || "");
  if (highlight.includes("popular") || highlight.includes("popul")) score += 200;
  if (highlight.includes("gaming") || highlight.includes("favorit")) score += 150;
  if (highlight.includes("nyhet")) score += 100;
  if (category === "cpu" && /x3d/i.test(item.name)) score += 60;
  if (category === "gpu" && /5070|9070|5080|5090/i.test(item.name)) score += 40;
  return score;
};

const sortValuesByPreferredOrder = (values: string[], preferredOrder: string[]) => {
  const available = new Set(values.map((value) => normalizeFilterToken(value)));
  const ordered = preferredOrder.filter((value) => available.has(normalizeFilterToken(value)));
  const rest = values
    .filter((value) => !ordered.some((orderedValue) => normalizeFilterToken(orderedValue) === normalizeFilterToken(value)))
    .sort((a, b) => a.localeCompare(b, "sv"));
  return [...ordered, ...rest];
};

const getNumericBounds = (values: Array<number | null>) => {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (valid.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...valid), max: Math.max(...valid) };
};

const UNSUPPORTED_RAM_ITEM_IDS = new Set([
  "ram-5",
  "ram-6",
  "ram-7",
  "ram-9",
  "ram-10",
  "ram-11",
  "ram-12",
  "ram-19",
  "ram-30",
]);

const CURATED_COMPONENTS: Record<CategoryKey, ComponentItem[]> = {
  cpu: [
    {
      id: "cpu-1",
      name: "AMD Ryzen 5 7600",
      brand: "AMD",
      price: 2599,
      socket: "AM5",
      image: cpu7600Image,
      specs: ["6 kärnor", "12 trådar", "5.1 GHz", "AM5"],
    },
    {
      id: "cpu-2",
      name: "AMD Ryzen 7 7800X3D",
      brand: "AMD",
      price: 4990,
      socket: "AM5",
      image: cpu7800x3dImage,
      specs: ["8 kärnor", "3D V-Cache", "5.0 GHz", "AM5"],
      highlight: "Gaming-favorit",
    },
    {
      id: "cpu-3",
      name: "AMD Ryzen 9 7950X3D",
      brand: "AMD",
      price: 7990,
      socket: "AM5",
      image: cpu7950x3dImage,
      specs: ["16 kärnor", "3D V-Cache", "5.7 GHz", "AM5"],
    },
    {
      id: "cpu-4",
      name: "Intel Core i5-13400F",
      brand: "Intel",
      price: 2290,
      socket: "LGA1700",
      image: cpu13400fImage,
      specs: ["10 kärnor", "4.6 GHz", "LGA1700"],
    },
    {
      id: "cpu-5",
      name: "Intel Core i5-13600K",
      brand: "Intel",
      price: 3490,
      socket: "LGA1700",
      image: cpu13600kImage,
      specs: ["14 kärnor", "5.1 GHz", "LGA1700"],
    },
    {
      id: "cpu-6",
      name: "Intel Core i7-13700K",
      brand: "Intel",
      price: 4690,
      socket: "LGA1700",
      image: cpu13700kImage,
      specs: ["16 kärnor", "5.4 GHz", "LGA1700"],
    },
    {
      id: "cpu-7",
      name: "Intel Core i7-14700K",
      brand: "Intel",
      price: 5290,
      socket: "LGA1700",
      image: cpu14700kImage,
      specs: ["20 kärnor", "5.6 GHz", "LGA1700"],
      highlight: "Nyhet",
    },
    {
      id: "cpu-8",
      name: "Intel Core i9-13900K",
      brand: "Intel",
      price: 6490,
      socket: "LGA1700",
      image: cpu13900kImage,
      specs: ["24 kärnor", "5.8 GHz", "LGA1700"],
    },
    {
      id: "cpu-9",
      name: "Intel Core i9-14900K",
      brand: "Intel",
      price: 7190,
      socket: "LGA1700",
      image: cpu14900kImage,
      specs: ["24 kärnor", "6.0 GHz", "LGA1700"],
    },
    {
      id: "cpu-10",
      name: "AMD Ryzen 7 7700",
      brand: "AMD",
      price: 3290,
      socket: "AM5",
      image: cpu7700Image,
      specs: ["8 kärnor", "5.3 GHz", "AM5"],
    },
    {
      id: "cpu-11",
      name: "AMD Ryzen 5 3600",
      brand: "AMD",
      price: 1200,
      socket: "AM4",
      image: cpu3600Image,
      specs: ["AM4"],
    },
    {
      id: "cpu-12",
      name: "Intel Core i5-12400F",
      brand: "Intel",
      price: 1600,
      socket: "LGA1700",
      image: cpu12400fImage,
      specs: ["LGA1700"],
    },
    {
      id: "cpu-13",
      name: "AMD Ryzen 5 5500",
      brand: "AMD",
      price: 1300,
      socket: "AM4",
      image: cpu5500Image,
      specs: ["AM4"],
    },
    {
      id: "cpu-14",
      name: "AMD Ryzen 5 5600X",
      brand: "AMD",
      price: 1800,
      socket: "AM4",
      image: cpu5600xImage,
      specs: ["AM4"],
    },
    {
      id: "cpu-15",
      name: "AMD Ryzen 5 8400F",
      brand: "AMD",
      price: 1900,
      socket: "AM5",
      image: cpu8400fImage,
      specs: ["AM5"],
    },
    {
      id: "cpu-16",
      name: "AMD Ryzen 5 9600X (Tray)",
      brand: "AMD",
      price: 3200,
      socket: "AM5",
      image: cpu9600xImage,
      specs: ["AM5"],
    },
    {
      id: "cpu-17",
      name: "AMD Ryzen 5 7600X3D",
      brand: "AMD",
      price: 3900,
      socket: "AM5",
      image: cpu7600x3dImage,
      specs: ["AM5"],
    },
    {
      id: "cpu-18",
      name: "AMD Ryzen 7 9800X3D",
      brand: "AMD",
      price: 5500,
      socket: "AM5",
      image: cpu9800x3dImage,
      specs: ["AM5"],
    },
  ],
  gpu: [
    {
      id: "gpu-1",
      name: "ASUS Dual GeForce RTX 3050 6GB OC",
      brand: "ASUS",
      price: 2199,
      image: gpu3050Image,
      specs: ["6 GB", "RTX 3050", "1080p"],
      performanceClass: "Budget",
      gpuModel: "ASUS Dual GeForce RTX 3050 6GB OC",
    },
    {
      id: "gpu-2",
      name: "ASUS Dual GeForce RTX 5050 8GB OC",
      brand: "ASUS",
      price: 2899,
      image: gpu4060Image,
      specs: ["8 GB", "RTX 5050", "1080p"],
      performanceClass: "Budget",
      gpuModel: "ASUS Dual GeForce RTX 5050 8GB OC",
    },
    {
      id: "gpu-3",
      name: "Intel Arc B580 12GB Limited Edition",
      brand: "Intel",
      price: 3499,
      image: gpuA770Image,
      specs: ["12 GB", "Arc B580", "1080p+"],
      performanceClass: "Entry",
      gpuModel: "Intel Arc B580 12GB Limited Edition",
    },
    {
      id: "gpu-5",
      name: "ASUS Dual GeForce RTX 5060 8GB OC",
      brand: "ASUS",
      price: 3899,
      image: gpu4060Image,
      specs: ["8 GB", "RTX 5060", "1080p+"],
      performanceClass: "Performance",
      gpuModel: "ASUS Dual GeForce RTX 5060 8GB OC",
    },
    {
      id: "gpu-6",
      name: "PNY GeForce RTX 5060 OC Dual Fan",
      brand: "PNY",
      price: 3999,
      image: gpu4060Image,
      specs: ["8 GB", "RTX 5060", "1080p+"],
      performanceClass: "Performance",
      gpuModel: "PNY GeForce RTX 5060 OC Dual Fan",
    },
    {
      id: "gpu-7",
      name: "Gigabyte GeForce RTX 5060 WINDFORCE MAX 8GB OC",
      brand: "Gigabyte",
      price: 4099,
      image: gpu4060Image,
      specs: ["8 GB", "RTX 5060", "1080p+"],
      performanceClass: "Performance",
      gpuModel: "Gigabyte GeForce RTX 5060 WINDFORCE MAX 8GB OC",
    },
    {
      id: "gpu-8",
      name: "ASUS Radeon RX 9060 XT 8GB Dual",
      brand: "ASUS",
      price: 4190,
      image: gpu9060xtImage,
      specs: ["8 GB", "RX 9060 XT", "1080p+"],
      performanceClass: "Performance",
      gpuModel: "ASUS Radeon RX 9060 XT 8GB Dual",
    },
    {
      id: "gpu-9",
      name: "Gigabyte Radeon RX 9060 XT GAMING 8GB OC",
      brand: "Gigabyte",
      price: 4290,
      image: gpu9060xtImage,
      specs: ["8 GB", "RX 9060 XT", "1080p+"],
      performanceClass: "Performance",
      gpuModel: "Gigabyte Radeon RX 9060 XT GAMING 8GB OC",
    },
    {
      id: "gpu-10",
      name: "XFX Swift AMD Radeon RX 9060 XT OC Gaming White",
      brand: "XFX",
      price: 4390,
      image: gpu9060xtImage,
      specs: ["8 GB", "RX 9060 XT", "1080p+"],
      performanceClass: "Performance",
      gpuModel: "XFX Swift AMD Radeon RX 9060 XT OC Gaming White",
    },
    {
      id: "gpu-11",
      name: "Acer Nitro Radeon RX 9060 XT OC 8GB",
      brand: "Acer",
      price: 4090,
      image: gpu9060xtImage,
      specs: ["8 GB", "RX 9060 XT", "1080p+"],
      performanceClass: "Performance",
      gpuModel: "Acer Nitro Radeon RX 9060 XT OC 8GB",
    },
    {
      id: "gpu-12",
      name: "MSI GeForce RTX 5060 Ti 8GB VENTUS 2X OC PLUS",
      brand: "MSI",
      price: 4990,
      image: gpu5060TiImage,
      specs: ["8 GB", "RTX 5060 Ti", "1440p"],
      performanceClass: "Sweet-Spot",
      gpuModel: "MSI GeForce RTX 5060 Ti 8GB VENTUS 2X OC PLUS",
    },
    {
      id: "gpu-13",
      name: "Gainward GeForce RTX 5060 Ti Ghost 8GB",
      brand: "Gainward",
      price: 5090,
      image: gpu5060TiImage,
      specs: ["8 GB", "RTX 5060 Ti", "1440p"],
      performanceClass: "Sweet-Spot",
      gpuModel: "Gainward GeForce RTX 5060 Ti Ghost 8GB",
    },
    {
      id: "gpu-14",
      name: "Gigabyte GeForce RTX 5060 Ti AERO OC",
      brand: "Gigabyte",
      price: 5290,
      image: gpu5060TiImage,
      specs: ["8 GB", "RTX 5060 Ti", "1440p"],
      performanceClass: "Sweet-Spot",
      gpuModel: "Gigabyte GeForce RTX 5060 Ti AERO OC",
    },
    {
      id: "gpu-15",
      name: "Gigabyte GeForce RTX 5060 Ti WINDFORCE",
      brand: "Gigabyte",
      price: 4890,
      image: gpu5060TiImage,
      specs: ["8 GB", "RTX 5060 Ti", "1440p"],
      performanceClass: "Sweet-Spot",
      gpuModel: "Gigabyte GeForce RTX 5060 Ti WINDFORCE",
    },
    {
      id: "gpu-16",
      name: "MSI GeForce RTX 5060 Ti 16GB VENTUS 2X OC PLUS",
      brand: "MSI",
      price: 5790,
      image: gpu5060TiImage,
      specs: ["16 GB", "RTX 5060 Ti", "1440p"],
      performanceClass: "Sweet-Spot",
      gpuModel: "MSI GeForce RTX 5060 Ti 16GB VENTUS 2X OC PLUS",
    },
    {
      id: "gpu-17",
      name: "Gigabyte GeForce RTX 5060 Ti WINDFORCE 16GB OC",
      brand: "Gigabyte",
      price: 5890,
      image: gpu5060TiImage,
      specs: ["16 GB", "RTX 5060 Ti", "1440p"],
      performanceClass: "Sweet-Spot",
      gpuModel: "Gigabyte GeForce RTX 5060 Ti WINDFORCE 16GB OC",
    },
    {
      id: "gpu-18",
      name: "ASUS GeForce RTX 5060 Ti Dual 16GB OC",
      brand: "ASUS",
      price: 6090,
      image: gpu5060TiImage,
      specs: ["16 GB", "RTX 5060 Ti", "1440p"],
      performanceClass: "Sweet-Spot",
      gpuModel: "ASUS GeForce RTX 5060 Ti Dual 16GB OC",
    },
    {
      id: "gpu-19",
      name: "Gigabyte Radeon RX 9060 XT GAMING 16GB OC",
      brand: "Gigabyte",
      price: 5390,
      image: gpu9060xtImage,
      specs: ["16 GB", "RX 9060 XT", "1440p"],
      performanceClass: "Sweet-Spot",
      gpuModel: "Gigabyte Radeon RX 9060 XT GAMING 16GB OC",
    },
    {
      id: "gpu-20",
      name: "Sapphire PULSE RX 9060 XT GAMING OC 16GB",
      brand: "Sapphire",
      price: 5490,
      image: gpu9060xtImage,
      specs: ["16 GB", "RX 9060 XT", "1440p"],
      performanceClass: "Sweet-Spot",
      gpuModel: "Sapphire PULSE RX 9060 XT GAMING OC 16GB",
    },
    {
      id: "gpu-21",
      name: "PowerColor Reaper AMD Radeon RX 9060 XT",
      brand: "PowerColor",
      price: 5590,
      image: gpu9060xtImage,
      specs: ["16 GB", "RX 9060 XT", "1440p"],
      performanceClass: "Sweet-Spot",
      gpuModel: "PowerColor Reaper AMD Radeon RX 9060 XT",
    },
    {
      id: "gpu-22",
      name: "ASUS Prime Radeon RX 9060 XT 16GB OC",
      brand: "ASUS",
      price: 5790,
      image: gpu9060xtImage,
      specs: ["16 GB", "RX 9060 XT", "1440p"],
      performanceClass: "Sweet-Spot",
      gpuModel: "ASUS Prime Radeon RX 9060 XT 16GB OC",
    },
    {
      id: "gpu-23",
      name: "PowerColor Reaper AMD Radeon RX 9070",
      brand: "PowerColor",
      price: 7290,
      image: gpu9070xtImage,
      specs: ["16 GB", "RX 9070", "1440p Ultra"],
      performanceClass: "Extreme",
      gpuModel: "PowerColor Reaper AMD Radeon RX 9070",
    },
    {
      id: "gpu-24",
      name: "ASUS PRIME Radeon RX 9070 16GB OC",
      brand: "ASUS",
      price: 7490,
      image: gpu9070xtImage,
      specs: ["16 GB", "RX 9070", "1440p Ultra"],
      performanceClass: "Extreme",
      gpuModel: "ASUS PRIME Radeon RX 9070 16GB OC",
    },
    {
      id: "gpu-25",
      name: "Sapphire PULSE RX 9070 GAMING 16 GB",
      brand: "Sapphire",
      price: 7590,
      image: gpu9070xtImage,
      specs: ["16 GB", "RX 9070", "1440p Ultra"],
      performanceClass: "Extreme",
      gpuModel: "Sapphire PULSE RX 9070 GAMING 16 GB",
    },
    {
      id: "gpu-26",
      name: "XFX Radeon RX 9070 Swift Triple 90mm Fan Black",
      brand: "XFX",
      price: 7690,
      image: gpu9070xtImage,
      specs: ["16 GB", "RX 9070", "1440p Ultra"],
      performanceClass: "Extreme",
      gpuModel: "XFX Radeon RX 9070 Swift Triple 90mm Fan Black",
    },
    {
      id: "gpu-27",
      name: "XFX Radeon RX 9070 Swift Triple 90mm Fan White",
      brand: "XFX",
      price: 7790,
      image: gpu9070xtImage,
      specs: ["16 GB", "RX 9070", "1440p Ultra"],
      performanceClass: "Extreme",
      gpuModel: "XFX Radeon RX 9070 Swift Triple 90mm Fan White",
    },
    {
      id: "gpu-28",
      name: "Sapphire PURE RX 9070 GAMING 16 GB",
      brand: "Sapphire",
      price: 7890,
      image: gpu9070xtImage,
      specs: ["16 GB", "RX 9070", "1440p Ultra"],
      performanceClass: "Extreme",
      gpuModel: "Sapphire PURE RX 9070 GAMING 16 GB",
    },
    {
      id: "gpu-29",
      name: "Gigabyte GeForce RTX 5070 WINDFORCE 12GB OC",
      brand: "Gigabyte",
      price: 6790,
      image: gpu5070Image,
      specs: ["12 GB", "RTX 5070", "1440p Ultra"],
      performanceClass: "Extreme",
      gpuModel: "Gigabyte GeForce RTX 5070 WINDFORCE 12GB OC",
    },
    {
      id: "gpu-30",
      name: "MSI GeForce RTX 5070 12G VENTUS 2X OC",
      brand: "MSI",
      price: 6990,
      image: gpu5070Image,
      specs: ["12 GB", "RTX 5070", "1440p Ultra"],
      performanceClass: "Extreme",
      gpuModel: "MSI GeForce RTX 5070 12G VENTUS 2X OC",
    },
    {
      id: "gpu-31",
      name: "ASUS PRIME GeForce RTX 5070 12GB OC",
      brand: "ASUS",
      price: 7090,
      image: gpu5070Image,
      specs: ["12 GB", "RTX 5070", "1440p Ultra"],
      performanceClass: "Extreme",
      gpuModel: "ASUS PRIME GeForce RTX 5070 12GB OC",
    },
    {
      id: "gpu-32",
      name: "Gigabyte GeForce RTX 5070 EAGLE OC ICE",
      brand: "Gigabyte",
      price: 7190,
      image: gpu5070Image,
      specs: ["12 GB", "RTX 5070", "1440p Ultra"],
      performanceClass: "Extreme",
      gpuModel: "Gigabyte GeForce RTX 5070 EAGLE OC ICE",
    },
    {
      id: "gpu-33",
      name: "ASUS GeForce RTX 5070 Dual 12GB OC",
      brand: "ASUS",
      price: 7290,
      image: gpu5070Image,
      specs: ["12 GB", "RTX 5070", "1440p Ultra"],
      performanceClass: "Extreme",
      gpuModel: "ASUS GeForce RTX 5070 Dual 12GB OC",
    },
    {
      id: "gpu-34",
      name: "Zotac Gaming GeForce RTX 5070 Twin Edge",
      brand: "Zotac",
      price: 7190,
      image: gpu5070Image,
      specs: ["12 GB", "RTX 5070", "1440p Ultra"],
      performanceClass: "Extreme",
      gpuModel: "Zotac Gaming GeForce RTX 5070 Twin Edge",
    },
    {
      id: "gpu-35",
      name: "PowerColor Reaper AMD Radeon RX 9070 XT",
      brand: "PowerColor",
      price: 8290,
      image: gpu9070xtImage,
      specs: ["16 GB", "RX 9070 XT", "1440p/4K"],
      performanceClass: "Extreme",
      gpuModel: "PowerColor Reaper AMD Radeon RX 9070 XT",
    },
    {
      id: "gpu-36",
      name: "Sapphire NITRO+ RX 9070 XT GAMING 16 GB",
      brand: "Sapphire",
      price: 9190,
      image: gpu9070xtImage,
      specs: ["16 GB", "RX 9070 XT", "1440p/4K"],
      performanceClass: "Extreme",
      gpuModel: "Sapphire NITRO+ RX 9070 XT GAMING 16 GB",
    },
    {
      id: "gpu-37",
      name: "Sapphire PULSE RX 9070 XT GAMING 16 GB",
      brand: "Sapphire",
      price: 8690,
      image: gpu9070xtImage,
      specs: ["16 GB", "RX 9070 XT", "1440p/4K"],
      performanceClass: "Extreme",
      gpuModel: "Sapphire PULSE RX 9070 XT GAMING 16 GB",
    },
    {
      id: "gpu-38",
      name: "ASUS TUF Gaming Radeon RX 9070 XT 16GB OC",
      brand: "ASUS",
      price: 9390,
      image: gpu9070xtImage,
      specs: ["16 GB", "RX 9070 XT", "1440p/4K"],
      performanceClass: "Extreme",
      gpuModel: "ASUS TUF Gaming Radeon RX 9070 XT 16GB OC",
    },
    {
      id: "gpu-39",
      name: "ASUS Prime Radeon RX 9070 XT OC White",
      brand: "ASUS",
      price: 8990,
      image: gpu9070xtImage,
      specs: ["16 GB", "RX 9070 XT", "1440p/4K"],
      performanceClass: "Extreme",
      gpuModel: "ASUS Prime Radeon RX 9070 XT OC White",
    },
    {
      id: "gpu-40",
      name: "ASRock Radeon RX 9070 XT Steel Legend 16GB",
      brand: "ASRock",
      price: 9490,
      image: gpu9070xtImage,
      specs: ["16 GB", "RX 9070 XT", "1440p/4K"],
      performanceClass: "Extreme",
      gpuModel: "ASRock Radeon RX 9070 XT Steel Legend 16GB",
    },
    {
      id: "gpu-41",
      name: "ASUS PRIME Radeon RX 9070 XT 16GB OC",
      brand: "ASUS",
      price: 8890,
      image: gpu9070xtImage,
      specs: ["16 GB", "RX 9070 XT", "1440p/4K"],
      performanceClass: "Extreme",
      gpuModel: "ASUS PRIME Radeon RX 9070 XT 16GB OC",
    },
    {
      id: "gpu-42",
      name: "MSI RTX 5070 Ti 16G GAMING TRIO OC White 16GB",
      brand: "MSI",
      price: 10490,
      image: gpu5070Image,
      specs: ["16 GB", "RTX 5070 Ti", "4K-ready"],
      performanceClass: "Extreme",
      gpuModel: "MSI RTX 5070 Ti 16G GAMING TRIO OC White 16GB",
    },
    {
      id: "gpu-43",
      name: "MSI GeForce RTX 5070 Ti VENTUS 3X 16GB OC",
      brand: "MSI",
      price: 10690,
      image: gpu5070Image,
      specs: ["16 GB", "RTX 5070 Ti", "4K-ready"],
      performanceClass: "Extreme",
      gpuModel: "MSI GeForce RTX 5070 Ti VENTUS 3X 16GB OC",
    },
    {
      id: "gpu-44",
      name: "ASUS PRIME GeForce RTX 5070 Ti 16GB OC",
      brand: "ASUS",
      price: 10790,
      image: gpu5070Image,
      specs: ["16 GB", "RTX 5070 Ti", "4K-ready"],
      performanceClass: "Extreme",
      gpuModel: "ASUS PRIME GeForce RTX 5070 Ti 16GB OC",
    },
    {
      id: "gpu-45",
      name: "Gigabyte GeForce RTX 5070 Ti WINDFORCE SFF 16GB OC",
      brand: "Gigabyte",
      price: 10890,
      image: gpu5070Image,
      specs: ["16 GB", "RTX 5070 Ti", "4K-ready"],
      performanceClass: "Extreme",
      gpuModel: "Gigabyte GeForce RTX 5070 Ti WINDFORCE SFF 16GB OC",
    },
    {
      id: "gpu-46",
      name: "Inno3D GeForce RTX 5070 Ti X3 OC White",
      brand: "Inno3D",
      price: 10990,
      image: gpu5070Image,
      specs: ["16 GB", "RTX 5070 Ti", "4K-ready"],
      performanceClass: "Extreme",
      gpuModel: "Inno3D GeForce RTX 5070 Ti X3 OC White",
    },
    {
      id: "gpu-47",
      name: "PNY GeForce RTX 5070 Ti OC",
      brand: "PNY",
      price: 10990,
      image: gpu5070Image,
      specs: ["16 GB", "RTX 5070 Ti", "4K-ready"],
      performanceClass: "Extreme",
      gpuModel: "PNY GeForce RTX 5070 Ti OC",
    },
    {
      id: "gpu-48",
      name: "INNO3D GeForce RTX 5070 Ti X3 OC",
      brand: "INNO3D",
      price: 10890,
      image: gpu5070Image,
      specs: ["16 GB", "RTX 5070 Ti", "4K-ready"],
      performanceClass: "Extreme",
      gpuModel: "INNO3D GeForce RTX 5070 Ti X3 OC",
    },
    {
      id: "gpu-49",
      name: "ZOTAC GeForce RTX 5070 Ti Solid Core OC White",
      brand: "ZOTAC",
      price: 11290,
      image: gpu5070Image,
      specs: ["16 GB", "RTX 5070 Ti", "4K-ready"],
      performanceClass: "Extreme",
      gpuModel: "ZOTAC GeForce RTX 5070 Ti Solid Core OC White",
    },
    {
      id: "gpu-50",
      name: "ASUS TUF Gaming GeForce RTX 5070 Ti 16GB OC",
      brand: "ASUS",
      price: 11490,
      image: gpu5070Image,
      specs: ["16 GB", "RTX 5070 Ti", "4K-ready"],
      performanceClass: "Extreme",
      gpuModel: "ASUS TUF Gaming GeForce RTX 5070 Ti 16GB OC",
    },
    {
      id: "gpu-51",
      name: "Gigabyte GeForce RTX 5070 Ti EAGLE ICE SFF 16GB OC",
      brand: "Gigabyte",
      price: 11390,
      image: gpu5070Image,
      specs: ["16 GB", "RTX 5070 Ti", "4K-ready"],
      performanceClass: "Extreme",
      gpuModel: "Gigabyte GeForce RTX 5070 Ti EAGLE ICE SFF 16GB OC",
    },
    {
      id: "gpu-52",
      name: "MSI GeForce RTX 5080 16G VENTUS 3X OC WHITE",
      brand: "MSI",
      price: 14490,
      image: gpu5080Image,
      specs: ["16 GB", "RTX 5080", "4K"],
      performanceClass: "Overkill",
      gpuModel: "MSI GeForce RTX 5080 16G VENTUS 3X OC WHITE",
    },
    {
      id: "gpu-53",
      name: "MSI GeForce RTX 5080 16G GAMING TRIO OC WHITE",
      brand: "MSI",
      price: 15490,
      image: gpu5080Image,
      specs: ["16 GB", "RTX 5080", "4K"],
      performanceClass: "Overkill",
      gpuModel: "MSI GeForce RTX 5080 16G GAMING TRIO OC WHITE",
    },
    {
      id: "gpu-54",
      name: "MSI GeForce RTX 5080 16G VENTUS 3X OC",
      brand: "MSI",
      price: 14290,
      image: gpu5080Image,
      specs: ["16 GB", "RTX 5080", "4K"],
      performanceClass: "Overkill",
      gpuModel: "MSI GeForce RTX 5080 16G VENTUS 3X OC",
    },
    {
      id: "gpu-55",
      name: "Gigabyte GeForce RTX 5080 WINDFORCE OC SFF 16GB",
      brand: "Gigabyte",
      price: 14590,
      image: gpu5080Image,
      specs: ["16 GB", "RTX 5080", "4K"],
      performanceClass: "Overkill",
      gpuModel: "Gigabyte GeForce RTX 5080 WINDFORCE OC SFF 16GB",
    },
    {
      id: "gpu-56",
      name: "Gigabyte GeForce RTX 5080 Aorus Master 16GB",
      brand: "Gigabyte",
      price: 16990,
      image: gpu5080Image,
      specs: ["16 GB", "RTX 5080", "4K"],
      performanceClass: "Overkill",
      gpuModel: "Gigabyte GeForce RTX 5080 Aorus Master 16GB",
    },
    {
      id: "gpu-57",
      name: "ASUS ROG ASTRAL GeForce RTX 5080 16GB OC",
      brand: "ASUS",
      price: 17490,
      image: gpu5080Image,
      specs: ["16 GB", "RTX 5080", "4K"],
      performanceClass: "Overkill",
      gpuModel: "ASUS ROG ASTRAL GeForce RTX 5080 16GB OC",
    },
    {
      id: "gpu-58",
      name: "ASUS TUF Gaming GeForce RTX 5080 16GB OC",
      brand: "ASUS",
      price: 15990,
      image: gpu5080Image,
      specs: ["16 GB", "RTX 5080", "4K"],
      performanceClass: "Overkill",
      gpuModel: "ASUS TUF Gaming GeForce RTX 5080 16GB OC",
    },
    {
      id: "gpu-59",
      name: "ASUS Prime GeForce RTX 5080 16GB OC",
      brand: "ASUS",
      price: 14990,
      image: gpu5080Image,
      specs: ["16 GB", "RTX 5080", "4K"],
      performanceClass: "Overkill",
      gpuModel: "ASUS Prime GeForce RTX 5080 16GB OC",
    },
    {
      id: "gpu-60",
      name: "INNO3D GeForce RTX 5080 X3 OC",
      brand: "INNO3D",
      price: 14690,
      image: gpu5080Image,
      specs: ["16 GB", "RTX 5080", "4K"],
      performanceClass: "Overkill",
      gpuModel: "INNO3D GeForce RTX 5080 X3 OC",
    },
    {
      id: "gpu-61",
      name: "Palit GeForce RTX 5080 GamingPro OC 16GB",
      brand: "Palit",
      price: 14890,
      image: gpu5080Image,
      specs: ["16 GB", "RTX 5080", "4K"],
      performanceClass: "Overkill",
      gpuModel: "Palit GeForce RTX 5080 GamingPro OC 16GB",
    },
    {
      id: "gpu-62",
      name: "ASUS ROG Astral GeForce RTX 5090 32GB OC",
      brand: "ASUS",
      price: 37990,
      image: gpu4090Image,
      specs: ["32 GB", "RTX 5090", "4K+"],
      performanceClass: "Overkill",
      gpuModel: "ASUS ROG Astral GeForce RTX 5090 32GB OC",
    },
    {
      id: "gpu-63",
      name: "INNO3D GeForce RTX 5090 32GB iCHILL Frostbite",
      brand: "INNO3D",
      price: 36990,
      image: gpu4090Image,
      specs: ["32 GB", "RTX 5090", "4K+"],
      performanceClass: "Overkill",
      gpuModel: "INNO3D GeForce RTX 5090 32GB iCHILL Frostbite",
    },
    {
      id: "gpu-64",
      name: "ASUS TUF Gaming GeForce RTX 5090 32GB OC",
      brand: "ASUS",
      price: 35990,
      image: gpu4090Image,
      specs: ["32 GB", "RTX 5090", "4K+"],
      performanceClass: "Overkill",
      gpuModel: "ASUS TUF Gaming GeForce RTX 5090 32GB OC",
    },
    {
      id: "gpu-65",
      name: "Gigabyte GeForce RTX 5090 WINDFORCE 32GB OC",
      brand: "Gigabyte",
      price: 34990,
      image: gpu4090Image,
      specs: ["32 GB", "RTX 5090", "4K+"],
      performanceClass: "Overkill",
      gpuModel: "Gigabyte GeForce RTX 5090 WINDFORCE 32GB OC",
    },
    {
      id: "gpu-66",
      name: "Gigabyte GeForce RTX 5090 32GB Aorus Stealth Ice",
      brand: "Gigabyte",
      price: 38990,
      image: gpu4090Image,
      specs: ["32 GB", "RTX 5090", "4K+"],
      performanceClass: "Overkill",
      gpuModel: "Gigabyte GeForce RTX 5090 32GB Aorus Stealth Ice",
    },
    {
      id: "gpu-67",
      name: "ASUS ROG Astral GeForce RTX 5090 32GB",
      brand: "ASUS",
      price: 36990,
      image: gpu4090Image,
      specs: ["32 GB", "RTX 5090", "4K+"],
      performanceClass: "Overkill",
      gpuModel: "ASUS ROG Astral GeForce RTX 5090 32GB",
    },
    {
      id: "gpu-68",
      name: "ASUS ROG Astral LC GeForce RTX 5090 GAMING 32G OC",
      brand: "ASUS",
      price: 41990,
      image: gpu4090Image,
      specs: ["32 GB", "RTX 5090", "4K+"],
      performanceClass: "Overkill",
      gpuModel: "ASUS ROG Astral LC GeForce RTX 5090 GAMING 32G OC",
      highlight: "Toppklass",
    },
  ],
  motherboard: [
    {
      id: "mb-1",
      name: "ASUS ROG Strix B650-E",
      brand: "AMD",
      price: 3290,
      socket: "AM5",
      image: moboAsusRogB650EImage,
      specs: ["AM5", "ATX", "PCIe 5.0", "Wi-Fi 6E"],
    },
    {
      id: "mb-2",
      name: "MSI MAG B650 Tomahawk",
      brand: "AMD",
      price: 2590,
      socket: "AM5",
      image: moboMsiMagB650TomahawkImage,
      specs: ["AM5", "ATX", "DDR5", "2.5G LAN"],
    },
    {
      id: "mb-3",
      name: "Gigabyte B650 Aorus Elite",
      brand: "AMD",
      price: 2490,
      socket: "AM5",
      image: moboGigabyteB650AorusEliteImage,
      specs: ["AM5", "ATX", "PCIe 4.0", "M.2"],
    },
    {
      id: "mb-4",
      name: "ASRock X670E Steel Legend",
      brand: "AMD",
      price: 3790,
      socket: "AM5",
      image: moboAsrockX670ESteelLegendImage,
      specs: ["AM5", "ATX", "PCIe 5.0", "USB-C"],
    },
    {
      id: "mb-5",
      name: "ASUS TUF Gaming Z790-Plus",
      brand: "Intel",
      price: 3390,
      socket: "LGA1700",
      image: moboAsusTufZ790PlusImage,
      specs: ["LGA1700", "ATX", "DDR5", "Wi-Fi"],
    },
    {
      id: "mb-6",
      name: "MSI MPG Z790 Edge",
      brand: "Intel",
      price: 3990,
      socket: "LGA1700",
      image: moboMsiMpgZ790EdgeImage,
      specs: ["LGA1700", "ATX", "PCIe 5.0", "Wi-Fi 6E"],
    },
    {
      id: "mb-7",
      name: "Gigabyte Z790 Aorus Elite",
      brand: "Intel",
      price: 3190,
      socket: "LGA1700",
      image: moboGigabyteZ790AorusEliteImage,
      specs: ["LGA1700", "ATX", "DDR5", "2.5G LAN"],
    },
    {
      id: "mb-8",
      name: "ASRock Z790 Pro RS",
      brand: "Intel",
      price: 2590,
      socket: "LGA1700",
      image: moboAsrockZ790ProRsImage,
      specs: ["LGA1700", "ATX", "PCIe 4.0", "M.2"],
    },
    {
      id: "mb-9",
      name: "MSI B760M Mortar",
      brand: "Intel",
      price: 2090,
      socket: "LGA1700",
      image: moboMsiB760MMortarImage,
      specs: ["LGA1700", "mATX", "DDR5", "PCIe 4.0"],
    },
    {
      id: "mb-10",
      name: "ASUS Prime B650M-A",
      brand: "AMD",
      price: 1890,
      socket: "AM5",
      image: moboAsusPrimeB650MAImage,
      specs: ["AM5", "mATX", "DDR5", "HDMI"],
    },
  ],
  ram: ([
    {
      id: "ram-1",
      name: "Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz CL36",
      brand: "Corsair",
      price: 1290,
      ramType: "DDR5",
      image: ramCorsairVengeanceImage,
      specs: ["DDR5", "32GB", "6000 MHz", "CL36"],
    },
    {
      id: "ram-2",
      name: "G.Skill Trident Z5 Neo RGB 32GB (2x16GB) DDR5 6400MHz CL32",
      brand: "G.Skill",
      price: 1490,
      ramType: "DDR5",
      image: ramGSkillTridentZ5Image,
      specs: ["DDR5", "32GB", "6400 MHz", "CL32", "RGB"],
    },
    {
      id: "ram-3",
      name: "Kingston Fury Beast 32GB (2x16GB) DDR5 6000MHz CL40",
      brand: "Kingston",
      price: 1190,
      ramType: "DDR5",
      image: ramKingstonFuryBeastImage,
      specs: ["DDR5", "32GB", "6000 MHz", "CL40"],
    },
    {
      id: "ram-4",
      name: "Crucial Pro 32GB (2x16GB) DDR5 5600MHz CL46",
      brand: "Crucial",
      price: 1090,
      ramType: "DDR5",
      image: ramCrucialProImage,
      specs: ["DDR5", "32GB", "5600 MHz", "CL46"],
    },
    {
      id: "ram-5",
      name: "Corsair Dominator Platinum RGB 64GB (2x32GB) DDR5 6000MHz CL30",
      brand: "Corsair",
      price: 2690,
      ramType: "DDR5",
      image: ramCorsairDominatorImage,
      specs: ["DDR5", "64GB", "6000 MHz", "CL30", "RGB"],
    },
    {
      id: "ram-6",
      name: "G.Skill Ripjaws V 32GB (2x16GB) DDR4 3600MHz CL16",
      brand: "G.Skill",
      price: 990,
      ramType: "DDR4",
      image: ramGSkillRipjawsImage,
      specs: ["DDR4", "32GB", "3600 MHz", "CL16"],
    },
    {
      id: "ram-7",
      name: "Kingston Fury Renegade 32GB (2x16GB) DDR5 6400MHz CL32",
      brand: "Kingston",
      price: 1390,
      ramType: "DDR5",
      image: ramKingstonFuryRenegadeImage,
      specs: ["DDR5", "32GB", "6400 MHz", "CL32"],
    },
    {
      id: "ram-8",
      name: "Crucial Pro 64GB (2x32GB) DDR5 5600MHz CL46",
      brand: "Crucial",
      price: 2190,
      ramType: "DDR5",
      image: ramCrucialProImage,
      specs: ["DDR5", "64GB", "5600 MHz", "CL46"],
    },
    {
      id: "ram-9",
      name: "TeamGroup T-Force Delta RGB 32GB (2x16GB) DDR5 6000MHz",
      brand: "TeamGroup",
      price: 1290,
      ramType: "DDR5",
      image: ramTeamGroupTForceDeltaImage,
      specs: ["DDR5", "32GB", "6000 MHz", "RGB"],
    },
    {
      id: "ram-10",
      name: "ADATA XPG Lancer RGB 32GB (2x16GB) DDR5 6000MHz",
      brand: "ADATA",
      price: 1190,
      ramType: "DDR5",
      image: ramAdataXpgLancerImage,
      specs: ["DDR5", "32GB", "6000 MHz", "RGB"],
    },
    {
      id: "ram-11",
      name: "A-Data XPG SPECTRIX D35G 16GB (2x8GB) DDR4 3600MHz CL18",
      brand: "ADATA",
      price: 600,
      ramType: "DDR4",
      image: ramAdataSpectrixD35GImage,
      specs: ["DDR4", "16GB", "3600 MHz", "CL18"],
    },
    {
      id: "ram-12",
      name: "Corsair Dominator Platinum RGB 32GB (2x16GB) DDR4 3600MHz",
      brand: "Corsair",
      price: 1200,
      ramType: "DDR4",
      image: ramCorsairDominatorDdr4Image,
      specs: ["DDR4", "32GB", "3600 MHz", "RGB"],
    },
    {
      id: "ram-16",
      name: "Kingston 32GB (2x16GB) DDR5 6400MHz CL32 FURY Beast Vit AMD EXPO/Intel XMP 3.0",
      brand: "Kingston",
      price: 1400,
      ramType: "DDR5",
      image: ramKingston32GbDdr5Image,
      specs: ["DDR5", "32GB", "6400 MHz", "CL32"],
    },
    {
      id: "ram-17",
      name: "Corsair Vengeance 16GB (2x8GB) DDR5 5600MHz CL36",
      brand: "Corsair",
      price: 699,
      ramType: "DDR5",
      image: ramCorsairVengeanceImage,
      specs: ["DDR5", "16GB", "5600 MHz", "CL36"],
    },
    {
      id: "ram-18",
      name: "Kingston FURY Beast 6000MHz DDR5 16GB (svart)",
      brand: "Kingston",
      price: 749,
      ramType: "DDR5",
      image: ramKingstonFuryBeastImage,
      specs: ["DDR5", "16GB", "6000 MHz", "Svart"],
    },
    {
      id: "ram-19",
      name: "Kingston Fury Beast 16GB (2x8GB) DDR5 5600MHz CL36",
      brand: "Kingston",
      price: 729,
      ramType: "DDR5",
      image: ramKingstonFuryBeastImage,
      specs: ["DDR5", "16GB", "5600 MHz", "CL36"],
    },
    {
      id: "ram-20",
      name: "Corsair Vengeance RGB 16GB (2x8GB) DDR5 6000MHz CL36",
      brand: "Corsair",
      price: 829,
      ramType: "DDR5",
      image: ramCorsairVengeanceImage,
      specs: ["DDR5", "16GB", "6000 MHz", "CL36", "RGB"],
    },
    {
      id: "ram-21",
      name: "Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz CL36",
      brand: "Corsair",
      price: 1299,
      ramType: "DDR5",
      image: ramCorsairVengeanceImage,
      specs: ["DDR5", "32GB", "6000 MHz", "CL36", "RGB"],
    },
    {
      id: "ram-22",
      name: "Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz CL36",
      brand: "Corsair",
      price: 1190,
      ramType: "DDR5",
      image: ramCorsairVengeanceImage,
      specs: ["DDR5", "32GB", "6000 MHz", "CL36"],
    },
    {
      id: "ram-23",
      name: "Corsair Vengeance DDR5 RAM 32GB (16GB x2) 6000 MT/s CL36",
      brand: "Corsair",
      price: 1249,
      ramType: "DDR5",
      image: ramCorsairVengeanceImage,
      specs: ["DDR5", "32GB", "6000 MT/s", "CL36"],
    },
    {
      id: "ram-24",
      name: "Corsair 32GB (2x16GB) DDR5 6000MHz CL36 Vengeance RGB Vit",
      brand: "Corsair",
      price: 1349,
      ramType: "DDR5",
      image: ramCorsairVengeanceImage,
      specs: ["DDR5", "32GB", "6000 MHz", "CL36", "Vit"],
    },
    {
      id: "ram-25",
      name: "Kingston Fury Beast RGB 32GB (2x16GB) DDR5 6000MHz CL36",
      brand: "Kingston",
      price: 1290,
      ramType: "DDR5",
      image: ramKingstonFuryBeastImage,
      specs: ["DDR5", "32GB", "6000 MHz", "CL36", "RGB"],
    },
    {
      id: "ram-26",
      name: "Corsair Dominator Platinum RGB 64GB (2x32GB) DDR5 6000MHz CL40",
      brand: "Corsair",
      price: 2790,
      ramType: "DDR5",
      image: ramCorsairDominatorImage,
      specs: ["DDR5", "64GB", "6000 MHz", "CL40", "RGB"],
    },
    {
      id: "ram-27",
      name: "Kingston Fury Beast Black 64GB (2x32GB) DDR5 6000MHz CL40",
      brand: "Kingston",
      price: 2290,
      ramType: "DDR5",
      image: ramKingstonFuryBeastImage,
      specs: ["DDR5", "64GB", "6000 MHz", "CL40", "Svart"],
    },
    {
      id: "ram-28",
      name: "Corsair Vengeance CMK64GX5M2B5200C40W RAM-minnen 64 GB 2 x 32 GB DDR5 5200 MHz",
      brand: "Corsair",
      price: 2190,
      ramType: "DDR5",
      image: ramCorsairVengeanceImage,
      specs: ["DDR5", "64GB", "5200 MHz"],
    },
    {
      id: "ram-29",
      name: "Kingston Fury Beast RGB 64GB (2x32GB) DDR5 6000MHz CL40",
      brand: "Kingston",
      price: 2490,
      ramType: "DDR5",
      image: ramKingstonFuryBeastImage,
      specs: ["DDR5", "64GB", "6000 MHz", "CL40", "RGB"],
    },
    {
      id: "ram-30",
      name: "Corsair Vengeance RGB 64GB DDR5 RAM 6000 MT/s CL40",
      brand: "Corsair",
      price: 2590,
      ramType: "DDR5",
      image: ramCorsairVengeanceImage,
      specs: ["DDR5", "64GB", "6000 MT/s", "CL40", "RGB"],
    },
    {
      id: "ram-31",
      name: "Corsair Vengeance 64GB DDR5 RAM 6000 MT/s CL40",
      brand: "Corsair",
      price: 2390,
      ramType: "DDR5",
      image: ramCorsairVengeanceImage,
      specs: ["DDR5", "64GB", "6000 MT/s", "CL40"],
    },
  ] satisfies ComponentItem[]).filter((item) => !UNSUPPORTED_RAM_ITEM_IDS.has(item.id)),
  storage: [
    {
      id: "sto-1",
      name: "Samsung 990 Pro 1TB",
      brand: "Samsung",
      price: 1190,
      image: storageSamsung990Pro1tbImage,
      specs: ["NVMe", "PCIe 4.0", "7450 MB/s"],
    },
    {
      id: "sto-2",
      name: "WD Black SN850X 1TB",
      brand: "WD",
      price: 1090,
      image: storageWdBlackSn850xImage,
      specs: ["NVMe", "PCIe 4.0", "7300 MB/s"],
    },
    {
      id: "sto-3",
      name: "Crucial T500 1TB",
      brand: "Crucial",
      price: 990,
      image: storageCrucialT500Image,
      specs: ["NVMe", "PCIe 4.0", "7400 MB/s"],
    },
    {
      id: "sto-4",
      name: "Samsung 990 Pro 2TB",
      brand: "Samsung",
      price: 1890,
      image: storageSamsung990Pro2tbImage,
      specs: ["NVMe", "PCIe 4.0", "7450 MB/s"],
    },
    {
      id: "sto-5",
      name: "Seagate FireCuda 530 2TB",
      brand: "Seagate",
      price: 1990,
      image: storageSeagateFireCuda530Image,
      specs: ["NVMe", "PCIe 4.0", "7300 MB/s"],
    },
    {
      id: "sto-6",
      name: "WD Blue SN580 2TB",
      brand: "WD",
      price: 2537,
      image: storageWdBlueSn580Image,
      specs: ["NVMe", "PCIe 4.0", "2TB"],
    },
    {
      id: "sto-7",
      name: "Kingston KC3000 1TB",
      brand: "Kingston",
      price: 990,
      image: storageKingstonKc3000Image,
      specs: ["NVMe", "PCIe 4.0", "7000 MB/s"],
    },
    {
      id: "sto-8",
      name: "Samsung 870 Evo 2TB",
      brand: "Samsung",
      price: 1590,
      image: storageSamsung870EvoImage,
      specs: ["SATA", "560 MB/s", "2.5-inch"],
    },
    {
      id: "sto-10",
      name: "Seagate BarraCuda 4TB",
      brand: "Seagate",
      price: 1190,
      image: storageSeagateBarraCudaImage,
      specs: ["HDD", "5400 RPM", "3.5-inch"],
    },
    {
      id: "sto-14",
      name: "Kingston Fury Renegade G5",
      brand: "Kingston",
      price: 1400,
      image: storageKingstonFuryRenegadeG5Image,
      specs: ["NVMe"],
    },
    {
      id: "sto-15",
      name: "Crucial E100 M.2 Gen 4 (480GB)",
      brand: "Crucial",
      price: 499,
      image: storageCrucialT500Image,
      specs: ["NVMe", "PCIe 4.0", "480GB"],
    },
    {
      id: "sto-16",
      name: "A-Data XPG GAMMIX S55",
      brand: "ADATA",
      price: 699,
      image: storageTeamGroupG50Image,
      specs: ["NVMe", "PCIe 4.0"],
    },
    {
      id: "sto-17",
      name: "Crucial P310 M.2 2230 NVMe 1TB",
      brand: "Crucial",
      price: 949,
      image: storageCrucialT500Image,
      specs: ["NVMe", "2230", "1TB"],
    },
    {
      id: "sto-18",
      name: "Intenso Premium M.2",
      brand: "Intenso",
      price: 499,
      image: storageSamsung870EvoImage,
      specs: ["NVMe", "M.2"],
    },
    {
      id: "sto-19",
      name: "Crucial P510 1TB",
      brand: "Crucial",
      price: 1190,
      image: storageCrucialT500Image,
      specs: ["NVMe", "PCIe 5.0", "1TB"],
    },
    {
      id: "sto-20",
      name: "Crucial E100 M.2 Gen 4 (1TB)",
      brand: "Crucial",
      price: 699,
      image: storageCrucialT500Image,
      specs: ["NVMe", "PCIe 4.0", "1TB"],
    },
    {
      id: "sto-21",
      name: "Intenso Premium M.2 250GB",
      brand: "Intenso",
      price: 349,
      image: storageSamsung870EvoImage,
      specs: ["NVMe", "250GB"],
    },
    {
      id: "sto-23",
      name: "Corsair MP700 ELITE",
      brand: "Corsair",
      price: 1890,
      image: storageKingstonFuryRenegadeG5Image,
      specs: ["NVMe", "PCIe 5.0"],
    },
    {
      id: "sto-24",
      name: "Kingston NV3 M.2 1TB",
      brand: "Kingston",
      price: 699,
      image: storageKingstonKc3000Image,
      specs: ["NVMe", "1TB"],
    },
    {
      id: "sto-25",
      name: "Crucial T710 (1TB)",
      brand: "Crucial",
      price: 1790,
      image: storageKingstonFuryRenegadeG5Image,
      specs: ["NVMe", "PCIe 5.0", "1TB"],
    },
    {
      id: "sto-26",
      name: "Crucial P510 (2TB)",
      brand: "Crucial",
      price: 1590,
      image: storageCrucialT500Image,
      specs: ["NVMe", "PCIe 5.0", "2TB"],
    },
    {
      id: "sto-27",
      name: "Crucial E100 M.2 Gen 4 (2TB)",
      brand: "Crucial",
      price: 2099,
      image: storageCrucialT500Image,
      specs: ["NVMe", "PCIe 4.0", "2TB"],
    },
    {
      id: "sto-28",
      name: "Corsair MP600 CORE XT NVMe PCIe M.2 2TB",
      brand: "Corsair",
      price: 1290,
      image: storageTeamGroupG50Image,
      specs: ["NVMe", "PCIe 4.0", "2TB"],
    },
    {
      id: "sto-29",
      name: "Crucial P510 Heatsink 2TB",
      brand: "Crucial",
      price: 2249,
      image: storageCrucialT500Image,
      specs: ["NVMe", "PCIe 5.0", "2TB", "Heatsink"],
    },
    {
      id: "sto-30",
      name: "Crucial P310 (2TB)",
      brand: "Crucial",
      price: 1490,
      image: storageCrucialT500Image,
      specs: ["NVMe", "PCIe 4.0", "2TB"],
    },
    {
      id: "sto-31",
      name: "Crucial P310 PCIe G4 2280 NVMe M.2 w heatsink 4TB",
      brand: "Crucial",
      price: 2990,
      image: storageCrucialT500Image,
      specs: ["NVMe", "PCIe 4.0", "4TB", "Heatsink"],
    },
    {
      id: "sto-32",
      name: "Crucial P310 (4TB)",
      brand: "Crucial",
      price: 2790,
      image: storageCrucialT500Image,
      specs: ["NVMe", "PCIe 4.0", "4TB"],
    },
    {
      id: "sto-33",
      name: "WD Black SN7100 4TB",
      brand: "WD",
      price: 4490,
      image: storageWdBlackSn850xImage,
      specs: ["NVMe", "PCIe 4.0", "4TB"],
    },
    {
      id: "sto-34",
      name: "Samsung 990 EVO Plus 4TB",
      brand: "Samsung",
      price: 2990,
      image: storageSamsung990Pro2tbImage,
      specs: ["NVMe", "PCIe 4.0", "4TB"],
    },
    {
      id: "sto-35",
      name: "Crucial T710 (4TB)",
      brand: "Crucial",
      price: 3990,
      image: storageKingstonFuryRenegadeG5Image,
      specs: ["NVMe", "PCIe 5.0", "4TB"],
    },
    {
      id: "sto-36",
      name: "Crucial T500 4TB M.2 NVMe PCIe Gen 4 HS",
      brand: "Crucial",
      price: 3290,
      image: storageCrucialT500Image,
      specs: ["NVMe", "PCIe 4.0", "4TB", "Heatsink"],
    },
    {
      id: "sto-37",
      name: "Lexar NM990",
      brand: "Lexar",
      price: 1990,
      image: storageLexarNm1090Image,
      specs: ["NVMe", "PCIe 5.0"],
    },
    {
      id: "sto-38",
      name: "Patriot Viper Gaming PV593",
      brand: "Patriot",
      price: 1890,
      image: storageTeamGroupG50Image,
      specs: ["NVMe", "PCIe 5.0"],
    },
    {
      id: "sto-39",
      name: "Crucial T700 4TB M.2 NVMe PCIe Gen 5 med varmespridare",
      brand: "Crucial",
      price: 4290,
      image: storageKingstonFuryRenegadeG5Image,
      specs: ["NVMe", "PCIe 5.0", "4TB", "Heatsink"],
    },
    {
      id: "sto-40",
      name: "Sandisk WD_Black SN8100 NVMe 1TB",
      brand: "Sandisk",
      price: 1490,
      image: storageWdBlackSn850xImage,
      specs: ["NVMe", "PCIe 5.0", "1TB"],
    },
  ],
  case: [
    {
      id: "case-1",
      name: "NZXT H7 Flow",
      brand: "NZXT",
      price: 1390,
      image: CASE_REMOTE_IMAGE_BY_ID["case-1"],
      specs: ["ATX", "Mesh", "Svart"],
    },
    {
      id: "case-2",
      name: "Lian Li Lancool 216",
      brand: "Lian Li",
      price: 1290,
      image: CASE_REMOTE_IMAGE_BY_ID["case-2"],
      specs: ["ATX", "Airflow", "RGB"],
    },
    {
      id: "case-3",
      name: "Fractal Design North",
      brand: "Fractal",
      price: 1490,
      image: CASE_REMOTE_IMAGE_BY_ID["case-3"],
      specs: ["ATX", "Träpanel", "Airflow"],
      highlight: "Designfavorit",
    },
    {
      id: "case-4",
      name: "Corsair 4000D Airflow",
      brand: "Corsair",
      price: 1090,
      image: CASE_REMOTE_IMAGE_BY_ID["case-4"],
      specs: ["ATX", "Mesh", "Tyst"],
    },
    {
      id: "case-5",
      name: "Phanteks Eclipse G500A",
      brand: "Phanteks",
      price: 1390,
      image: CASE_REMOTE_IMAGE_BY_ID["case-5"],
      specs: ["ATX", "RGB", "Airflow"],
    },
    {
      id: "case-6",
      name: "be quiet! Pure Base 500DX",
      brand: "be quiet!",
      price: 1290,
      image: CASE_REMOTE_IMAGE_BY_ID["case-6"],
      specs: ["ATX", "Tyst", "RGB"],
    },
    {
      id: "case-7",
      name: "Cooler Master MasterBox TD500 Mesh V2 (Svart)",
      brand: "Cooler Master",
      price: 1261,
      image: CASE_REMOTE_IMAGE_BY_ID["case-7"],
      specs: ["ATX", "Mesh", "ARGB"],
    },
    {
      id: "case-8",
      name: "NZXT H5 Flow",
      brand: "NZXT",
      price: 1090,
      image: CASE_REMOTE_IMAGE_BY_ID["case-8"],
      specs: ["ATX", "Kompakt", "Svart"],
    },
    {
      id: "case-9",
      name: "Lian Li O11 Dynamic Mini V2 Mini-Tower",
      brand: "Lian Li",
      price: 1121,
      image: CASE_REMOTE_IMAGE_BY_ID["case-9"],
      specs: ["ATX", "Mini", "Svart/Transparent"],
    },
    {
      id: "case-10",
      name: "Fractal Design Meshify 2",
      brand: "Fractal",
      price: 1690,
      image: CASE_REMOTE_IMAGE_BY_ID["case-10"],
      specs: ["ATX", "Mesh", "Modulär"],
    },
    {
      id: "case-11",
      name: "DeepCool CG530 4F",
      brand: "DeepCool",
      price: 899,
      image: CASE_REMOTE_IMAGE_BY_ID["case-11"],
      specs: ["ATX", "4x fans", "Svart"],
    },
    {
      id: "case-12",
      name: "DeepCool CG530 4F Vit",
      brand: "DeepCool",
      price: 949,
      image: CASE_REMOTE_IMAGE_BY_ID["case-12"],
      specs: ["ATX", "4x fans", "Vit"],
    },
    {
      id: "case-13",
      name: "Phanteks XT Pro Ultra",
      brand: "Phanteks",
      price: 999,
      image: CASE_REMOTE_IMAGE_BY_ID["case-13"],
      specs: ["ATX", "Airflow", "RGB"],
    },
    {
      id: "case-14",
      name: "Lian Li Vector V100 PC-chassi (svart)",
      brand: "Lian Li",
      price: 1290,
      image: CASE_REMOTE_IMAGE_BY_ID["case-14"],
      specs: ["ATX", "Showcase", "Svart"],
    },
    {
      id: "case-15",
      name: "Lian Li A3",
      brand: "Lian Li",
      price: 899,
      image: CASE_REMOTE_IMAGE_BY_ID["case-15"],
      specs: ["mATX", "Compact", "Mesh"],
    },
    {
      id: "case-16",
      name: "NZXT H6 Flow Case Dual Chamber RGB",
      brand: "NZXT",
      price: 1490,
      image: CASE_REMOTE_IMAGE_BY_ID["case-16"],
      specs: ["ATX", "Dual chamber", "RGB"],
    },
    {
      id: "case-17",
      name: "DeepCool CG530 Svart",
      brand: "DeepCool",
      price: 829,
      image: CASE_REMOTE_IMAGE_BY_ID["case-17"],
      specs: ["ATX", "Airflow", "Svart"],
    },
    {
      id: "case-18",
      name: "Fractal Design North XL",
      brand: "Fractal",
      price: 1990,
      image: CASE_REMOTE_IMAGE_BY_ID["case-18"],
      specs: ["ATX", "XL", "Trapanel"],
    },
    {
      id: "case-19",
      name: "O11 Vision Compact PC-chassi (svart)",
      brand: "Lian Li",
      price: 1490,
      image: CASE_REMOTE_IMAGE_BY_ID["case-19"],
      specs: ["ATX", "Compact", "Svart"],
    },
    {
      id: "case-20",
      name: "Lian Li O11 Vision Compact (Vit/Transparent)",
      brand: "Lian Li",
      price: 1590,
      image: CASE_REMOTE_IMAGE_BY_ID["case-20"],
      specs: ["ATX", "Compact", "Vit"],
    },
    {
      id: "case-21",
      name: "Corsair 3500X",
      brand: "Corsair",
      price: 1490,
      image: CASE_REMOTE_IMAGE_BY_ID["case-21"],
      specs: ["ATX", "Showcase", "RGB"],
    },
    {
      id: "case-22",
      name: "Lian Li O11D Mini V2 White",
      brand: "Lian Li",
      price: 1390,
      image: CASE_REMOTE_IMAGE_BY_ID["case-22"],
      specs: ["ATX", "Mini", "Vit"],
    },
    {
      id: "case-23",
      name: "Phanteks XT View",
      brand: "Phanteks",
      price: 999,
      image: CASE_REMOTE_IMAGE_BY_ID["case-23"],
      specs: ["ATX", "Glass", "Showcase"],
    },
    {
      id: "case-24",
      name: "Chieftec Visio Svart RGB",
      brand: "Chieftec",
      price: 999,
      image: CASE_REMOTE_IMAGE_BY_ID["case-24"],
      specs: ["ATX", "RGB", "Svart"],
    },
    {
      id: "case-25",
      name: "DeepCool CG530 Vit",
      brand: "DeepCool",
      price: 849,
      image: CASE_REMOTE_IMAGE_BY_ID["case-25"],
      specs: ["ATX", "Airflow", "Vit"],
    },
    {
      id: "case-26",
      name: "Cooler Master Elite 301 Mini Tower (svart)",
      brand: "Cooler Master",
      price: 699,
      image: CASE_REMOTE_IMAGE_BY_ID["case-26"],
      specs: ["mATX", "Mini tower", "Svart"],
    },
    {
      id: "case-27",
      name: "Thermaltake View 170 TG ARGB",
      brand: "Thermaltake",
      price: 799,
      image: CASE_REMOTE_IMAGE_BY_ID["case-27"],
      specs: ["mATX", "ARGB", "Glass"],
    },
    {
      id: "case-28",
      name: "Kolink Observatory HF",
      brand: "Kolink",
      price: 749,
      image: CASE_REMOTE_IMAGE_BY_ID["case-28"],
      specs: ["ATX", "Mesh", "RGB"],
    },
    {
      id: "case-29",
      name: "Kolink Observatory HF Glass Vit",
      brand: "Kolink",
      price: 799,
      image: CASE_REMOTE_IMAGE_BY_ID["case-29"],
      specs: ["ATX", "Glass", "Vit"],
    },
  ],
  psu: [
    {
      id: "psu-1",
      name: "Corsair RM750e",
      brand: "Corsair",
      price: 1290,
      image: psuCorsairRm750eImage,
      specs: ["750W", "80+ Gold", "Modulärt"],
    },
    {
      id: "psu-2",
      name: "Corsair RM850x",
      brand: "Corsair",
      price: 1590,
      image: psuCorsairRm850xImage,
      specs: ["850W", "80+ Gold", "Modulärt"],
    },
    {
      id: "psu-3",
      name: "Seasonic Focus GX-750",
      brand: "Seasonic",
      price: 1390,
      image: psuSeasonicFocusGx750Image,
      specs: ["750W", "80+ Gold", "Tyst"],
    },
    {
      id: "psu-4",
      name: "Seasonic VERTEX GX-1200",
      brand: "Seasonic",
      price: 2109,
      image: psuSeasonicVertexGx1000Image,
      specs: ["1200W", "80+ Gold", "ATX 3.1"],
    },
    {
      id: "psu-5",
      name: "be quiet! Straight Power 12 Platinum 1200W",
      brand: "be quiet!",
      price: 1999,
      image: psuBeQuietStraightPower12Image,
      specs: ["1200W", "80+ Platinum", "ATX 3.1"],
    },
    {
      id: "psu-6",
      name: "Cooler Master MWE 750",
      brand: "Cooler Master",
      price: 990,
      image: psuCoolerMasterMwe750Image,
      specs: ["750W", "80+ Gold", "Modulärt"],
    },
    {
      id: "psu-7",
      name: "ASUS TUF Gaming 850G 850W Gold",
      brand: "ASUS",
      price: 1099,
      image: psuAsusTufGaming850gImage,
      specs: ["850W", "80+ Gold", "Modulärt"],
    },
    {
      id: "psu-8",
      name: "MSI MPG A850G",
      brand: "MSI",
      price: 1590,
      image: psuMsiMpgA850gImage,
      specs: ["850W", "80+ Gold", "ATX 3.0"],
    },
    {
      id: "psu-9",
      name: "NZXT C750",
      brand: "NZXT",
      price: 1190,
      image: psuNzxtC750Image,
      specs: ["750W", "80+ Gold", "Modulärt"],
    },
    {
      id: "psu-10",
      name: "Thermaltake Toughpower GF3",
      brand: "Thermaltake",
      price: 1790,
      image: psuThermaltakeToughpowerGf3Image,
      specs: ["850W", "80+ Gold", "ATX 3.0"],
    },
    {
      id: "psu-11",
      name: "GIGABYTE P650G PG5",
      brand: "GIGABYTE",
      price: 799,
      image: psuMsiMpgA850gImage,
      specs: ["650W", "80+ Gold", "ATX 3.0"],
    },
    {
      id: "psu-12",
      name: "DeepCool PL650-D White",
      brand: "DeepCool",
      price: 899,
      image: psuCoolerMasterMwe750Image,
      specs: ["650W", "80+ Bronze", "Vit"],
    },
    {
      id: "psu-13",
      name: "DeepCool PL650D 650W ATX 3.1",
      brand: "DeepCool",
      price: 799,
      image: psuCoolerMasterMwe750Image,
      specs: ["650W", "80+ Bronze", "ATX 3.1"],
    },
    {
      id: "psu-14",
      name: "MSI MAG A650BN",
      brand: "MSI",
      price: 699,
      image: psuMsiMpgA850gImage,
      specs: ["650W", "80+ Bronze", "Prisvärd"],
    },
    {
      id: "psu-15",
      name: "Cooler Master MWE Bronze 750 V3 ATX 3.1",
      brand: "Cooler Master",
      price: 899,
      image: psuCoolerMasterMwe750Image,
      specs: ["750W", "80+ Bronze", "ATX 3.1"],
    },
    {
      id: "psu-16",
      name: "Corsair CX Series CX650 650 Watt",
      brand: "Corsair",
      price: 899,
      image: psuCorsairRm750eImage,
      specs: ["650W", "80+ Bronze", "ATX"],
    },
    {
      id: "psu-17",
      name: "Corsair CX750",
      brand: "Corsair",
      price: 999,
      image: psuCorsairRm750eImage,
      specs: ["750W", "80+ Bronze", "ATX"],
    },
    {
      id: "psu-18",
      name: "Asus Prime 750W Bronze",
      brand: "ASUS",
      price: 999,
      image: psuAsusTufGaming850gImage,
      specs: ["750W", "80+ Bronze", "ATX"],
    },
    {
      id: "psu-19",
      name: "ASUS TUF Gaming 750B",
      brand: "ASUS",
      price: 1099,
      image: psuAsusTufGaming850gImage,
      specs: ["750W", "80+ Bronze", "TUF"],
    },
    {
      id: "psu-20",
      name: "Seasonic Core BC 750W ATX3.1",
      brand: "Seasonic",
      price: 1099,
      image: psuSeasonicFocusGx750Image,
      specs: ["750W", "80+ Bronze", "ATX 3.1"],
    },
    {
      id: "psu-21",
      name: "GIGABYTE UD750GM PG5 V2 ICE",
      brand: "GIGABYTE",
      price: 1299,
      image: psuMsiMpgA850gImage,
      specs: ["750W", "80+ Gold", "Modulärt"],
    },
    {
      id: "psu-22",
      name: "Cooler Master MWE Gold 850 V3 ATX 3.1",
      brand: "Cooler Master",
      price: 948,
      image: psuCoolerMasterMwe750Image,
      specs: ["850W", "80+ Gold", "ATX 3.1"],
    },
    {
      id: "psu-23",
      name: "Gigabyte UD850GM PG5 V2 850W",
      brand: "GIGABYTE",
      price: 1399,
      image: psuMsiMpgA850gImage,
      specs: ["850W", "80+ Gold", "Modulärt"],
    },
    {
      id: "psu-24",
      name: "Seasonic Core BC 850W ATX3.1",
      brand: "Seasonic",
      price: 1299,
      image: psuSeasonicFocusGx750Image,
      specs: ["850W", "80+ Bronze", "ATX 3.1"],
    },
    {
      id: "psu-25",
      name: "Seasonic G12 GM-850 850W",
      brand: "Seasonic",
      price: 1399,
      image: psuSeasonicFocusGx750Image,
      specs: ["850W", "80+ Gold", "Modulärt"],
    },
    {
      id: "psu-26",
      name: "ASUS TUF Gaming 850W Gold ATX 3.1",
      brand: "ASUS",
      price: 1599,
      image: psuAsusTufGaming850gImage,
      specs: ["850W", "80+ Gold", "ATX 3.1"],
    },
    {
      id: "psu-27",
      name: "ASUS Prime 850W Gold",
      brand: "ASUS",
      price: 1499,
      image: psuAsusTufGaming850gImage,
      specs: ["850W", "80+ Gold", "Modulärt"],
    },
    {
      id: "psu-28",
      name: "GIGABYTE UD1000GM PG5 V2 ICE",
      brand: "GIGABYTE",
      price: 1799,
      image: psuMsiMpgA850gImage,
      specs: ["1000W", "80+ Gold", "Modulärt"],
    },
    {
      id: "psu-29",
      name: "ASUS TUF Gaming 1000W Gold ATX 3.1",
      brand: "ASUS",
      price: 1999,
      image: psuAsusTufGaming850gImage,
      specs: ["1000W", "80+ Gold", "ATX 3.1"],
    },
  ],
  cooling: [
    {
      id: "cool-1",
      name: "Noctua NH-D15",
      brand: "Noctua",
      price: 1190,
      image: coolingNoctuaNhd15Image,
      specs: ["Luftkylare", "Tyst", "Topplista"],
    },
    {
      id: "cool-2",
      name: "be quiet! Dark Rock Pro 5",
      brand: "be quiet!",
      price: 1090,
      image: coolingBeQuietDarkRockPro5Image,
      specs: ["Luftkylare", "Tyst", "Hög TDP"],
    },
    {
      id: "cool-3",
      name: "Corsair Nautilus 360",
      brand: "Corsair",
      price: 1990,
      image: coolingCorsairIcUEH150iImage,
      specs: ["360mm AIO", "RGB", "Aktuell modell"],
    },
    {
      id: "cool-4",
      name: "NZXT Kraken Elite V2 360",
      brand: "NZXT",
      price: 1990,
      image: coolingNzxtKraken360Image,
      specs: ["360mm AIO", "LCD", "Premium"],
    },
    {
      id: "cool-5",
      name: "Arctic Liquid Freezer III Pro 360",
      brand: "Arctic",
      price: 1590,
      image: coolingArcticLiquidFreezerII360Image,
      specs: ["360mm AIO", "Tyst", "Prisvärd"],
    },
    {
      id: "cool-6",
      name: "DeepCool AK620",
      brand: "DeepCool",
      price: 790,
      image: coolingDeepCoolAk620Image,
      specs: ["Luftkylare", "Hög TDP", "Prisvärd"],
    },
    {
      id: "cool-7",
      name: "Lian Li Galahad II Trinity SL-INF 360",
      brand: "Lian Li",
      price: 1790,
      image: coolingLianLiGalahadIiTrinityImage,
      specs: ["360mm AIO", "RGB", "Prestanda"],
    },
    {
      id: "cool-8",
      name: "Cooler Master Liquid 360 ATMOS II VRM",
      brand: "Cooler Master",
      price: 1490,
      image: coolingCoolerMasterMasterLiquid360Image,
      specs: ["360mm AIO", "ARGB", "Tyst"],
    },
    {
      id: "cool-9",
      name: "Thermalright Peerless Assassin",
      brand: "Thermalright",
      price: 590,
      image: coolingThermalrightPeerlessAssassinImage,
      specs: ["Luftkylare", "Prisvärd", "Tyst"],
    },
    {
      id: "cool-10",
      name: "Corsair Nautilus 240",
      brand: "Corsair",
      price: 1490,
      image: coolingCorsairIcUEH100iImage,
      specs: ["240mm AIO", "RGB", "Aktuell modell"],
    },
    {
      id: "cool-11",
      name: "DeepCool LE240 V2 Svart",
      brand: "DeepCool",
      price: 699,
      image: coolingCorsairIcUEH100iImage,
      specs: ["240mm AIO", "Svart", "ARGB"],
    },
    {
      id: "cool-12",
      name: "GIGABYTE Gaming 240 vattenkylare (is)",
      brand: "GIGABYTE",
      price: 999,
      image: coolingCorsairIcUEH100iImage,
      specs: ["240mm AIO", "Vit", "RGB"],
    },
    {
      id: "cool-13",
      name: "Gigabyte Gaming 240 ARGB kylare (svart)",
      brand: "GIGABYTE",
      price: 999,
      image: coolingCorsairIcUEH100iImage,
      specs: ["240mm AIO", "Svart", "ARGB"],
    },
    {
      id: "cool-14",
      name: "Cooler Master MasterLiquid 240 Core II ARGB",
      brand: "Cooler Master",
      price: 899,
      image: coolingCoolerMasterMasterLiquid360Image,
      specs: ["240mm AIO", "ARGB", "Svart"],
    },
    {
      id: "cool-15",
      name: "MSI MAG Coreliquid A13 240 Kylare (vit)",
      brand: "MSI",
      price: 999,
      image: coolingCorsairIcUEH100iImage,
      specs: ["240mm AIO", "Vit", "ARGB"],
    },
    {
      id: "cool-16",
      name: "Arctic Liquid Freezer III Pro 280 A-RGB White",
      brand: "Arctic",
      price: 1088,
      image: coolingArcticLiquidFreezerII360Image,
      specs: ["280mm AIO", "Vit", "ARGB", "Pro"],
    },
    {
      id: "cool-17",
      name: "DeepCool LE240 V2 Vit",
      brand: "DeepCool",
      price: 749,
      image: coolingCorsairIcUEH100iImage,
      specs: ["240mm AIO", "Vit", "ARGB"],
    },
    {
      id: "cool-18",
      name: "Arctic Liquid Freezer III Pro 240 Kylare (svart)",
      brand: "Arctic",
      price: 1199,
      image: coolingArcticLiquidFreezerII360Image,
      specs: ["240mm AIO", "Svart", "Pro"],
    },
    {
      id: "cool-19",
      name: "DeepCool LM240",
      brand: "DeepCool",
      price: 799,
      image: coolingCorsairIcUEH100iImage,
      specs: ["240mm AIO", "ARGB", "Prisvärd"],
    },
    {
      id: "cool-20",
      name: "DeepCool LE360 V2 Svart",
      brand: "DeepCool",
      price: 899,
      image: coolingCorsairIcUEH150iImage,
      specs: ["360mm AIO", "Svart", "ARGB"],
    },
    {
      id: "cool-21",
      name: "Cooler Master MasterLiquid 360 Core II ARGB Kylare (vit)",
      brand: "Cooler Master",
      price: 1199,
      image: coolingCoolerMasterMasterLiquid360Image,
      specs: ["360mm AIO", "Vit", "ARGB"],
    },
    {
      id: "cool-22",
      name: "Arctic Liquid Freezer III Pro 240 A-RGB",
      brand: "Arctic",
      price: 937,
      image: coolingArcticLiquidFreezerII360Image,
      specs: ["240mm AIO", "ARGB", "Pro"],
    },
    {
      id: "cool-23",
      name: "MSI MAG Coreliquid A13 240 Kylare (svart)",
      brand: "MSI",
      price: 999,
      image: coolingCorsairIcUEH100iImage,
      specs: ["240mm AIO", "Svart", "ARGB"],
    },
    {
      id: "cool-24",
      name: "Arctic Liquid Freezer III Pro 240 A-RGB Kylare (svart)",
      brand: "Arctic",
      price: 1299,
      image: coolingArcticLiquidFreezerII360Image,
      specs: ["240mm AIO", "Svart", "ARGB"],
    },
    {
      id: "cool-25",
      name: "DeepCool LE360 V2 Vit",
      brand: "DeepCool",
      price: 949,
      image: coolingCorsairIcUEH150iImage,
      specs: ["360mm AIO", "Vit", "ARGB"],
    },
    {
      id: "cool-26",
      name: "Arctic Liquid Freezer III Pro 280 Svart",
      brand: "Arctic",
      price: 1399,
      image: coolingArcticLiquidFreezerII360Image,
      specs: ["280mm AIO", "Svart", "Pro"],
    },
    {
      id: "cool-27",
      name: "Arctic Liquid Freezer III Pro 360 Kylare (svart)",
      brand: "Arctic",
      price: 1499,
      image: coolingArcticLiquidFreezerII360Image,
      specs: ["360mm AIO", "Svart", "Pro"],
    },
    {
      id: "cool-28",
      name: "Thermalright Aqua Elite 360 V3 vit",
      brand: "Thermalright",
      price: 1099,
      image: coolingCorsairIcUEH150iImage,
      specs: ["360mm AIO", "Vit", "ARGB"],
    },
    {
      id: "cool-29",
      name: "MSI MAG Coreliquid A13 360 Kylare (vit)",
      brand: "MSI",
      price: 1299,
      image: coolingCorsairIcUEH150iImage,
      specs: ["360mm AIO", "Vit", "ARGB"],
    },
    {
      id: "cool-30",
      name: "Arctic Liquid Freezer III Pro A-RGB White",
      brand: "Arctic",
      price: 1599,
      image: coolingArcticLiquidFreezerII360Image,
      specs: ["360mm AIO", "Vit", "ARGB"],
    },
    {
      id: "cool-31",
      name: "Arctic Liquid Freezer III Pro 360 A-RGB Kylare (svart)",
      brand: "Arctic",
      price: 1599,
      image: coolingArcticLiquidFreezerII360Image,
      specs: ["360mm AIO", "Svart", "ARGB"],
    },
    {
      id: "cool-32",
      name: "Phanteks Glacier One 360 M25 G2 Kylare (vit)",
      brand: "Phanteks",
      price: 1599,
      image: coolingLianLiGalahadIiTrinityImage,
      specs: ["360mm AIO", "Vit", "ARGB"],
    },
    {
      id: "cool-33",
      name: "Phanteks Glacier One 360 M25 G2",
      brand: "Phanteks",
      price: 1499,
      image: coolingLianLiGalahadIiTrinityImage,
      specs: ["360mm AIO", "Svart", "ARGB"],
    },
    {
      id: "cool-34",
      name: "Arctic Liquid Freezer III Pro 420 Svart",
      brand: "Arctic",
      price: 1799,
      image: coolingArcticLiquidFreezerII360Image,
      specs: ["420mm AIO", "Svart", "Pro"],
    },
    {
      id: "cool-35",
      name: "Arctic Liquid Freezer III Pro 420 A-RGB Svart",
      brand: "Arctic",
      price: 1899,
      image: coolingArcticLiquidFreezerII360Image,
      specs: ["420mm AIO", "Svart", "ARGB"],
    },
    {
      id: "cool-36",
      name: "Corsair Nautilus 360 RS ARGB",
      brand: "Corsair",
      price: 1699,
      image: coolingCorsairIcUEH150iImage,
      specs: ["360mm AIO", "ARGB", "Svart"],
    },
    {
      id: "cool-37",
      name: "Corsair Nautilus 360 (svart)",
      brand: "Corsair",
      price: 1590,
      image: coolingCorsairIcUEH150iImage,
      specs: ["360mm AIO", "Svart", "Aktuell modell"],
    },
    {
      id: "cool-38",
      name: "NZXT Kraken 360 Elite V2 2024 RGB Kylare (svart)",
      brand: "NZXT",
      price: 3237,
      image: coolingNzxtKraken360Image,
      specs: ["360mm AIO", "LCD", "Svart"],
    },
    {
      id: "cool-39",
      name: "NZXT Kraken 360 Elite V2 2024 RGB Kylare (vit)",
      brand: "NZXT",
      price: 3299,
      image: coolingNzxtKraken360Image,
      specs: ["360mm AIO", "LCD", "Vit"],
    },
    {
      id: "cool-40",
      name: "Lian Li Hydroshift II LCD-S 360TL Wireless Svart",
      brand: "Lian Li",
      price: 2990,
      image: coolingLianLiGalahadIiTrinityImage,
      specs: ["360mm AIO", "LCD", "Svart"],
    },
    {
      id: "cool-41",
      name: "Asus ROG Ryuo IV SLC 360 ARGB Kylare",
      brand: "ASUS",
      price: 3290,
      image: coolingNzxtKraken360Image,
      specs: ["360mm AIO", "ARGB", "Premium"],
    },
    {
      id: "cool-42",
      name: "Lian Li Hydroshift II LCD-C 360CL Svart",
      brand: "Lian Li",
      price: 2590,
      image: coolingLianLiGalahadIiTrinityImage,
      specs: ["360mm AIO", "LCD", "Svart"],
    },
    {
      id: "cool-43",
      name: "Tryx Panorama Upgraded A-RGB 360 Vit",
      brand: "Tryx",
      price: 3290,
      image: coolingNzxtKraken360Image,
      specs: ["360mm AIO", "Vit", "ARGB"],
    },
    {
      id: "cool-44",
      name: "Lian Li Hydroshift II LCD-S 360CL Wireless White",
      brand: "Lian Li",
      price: 3090,
      image: coolingLianLiGalahadIiTrinityImage,
      specs: ["360mm AIO", "LCD", "Vit"],
    },
    {
      id: "cool-45",
      name: "Tryx PANORAMA Upgraded 360mm AIO White",
      brand: "Tryx",
      price: 3290,
      image: coolingNzxtKraken360Image,
      specs: ["360mm AIO", "Vit", "ARGB"],
    },
    {
      id: "cool-46",
      name: "ASUS ROG Ryuo IV 360 A-RGB",
      brand: "ASUS",
      price: 2990,
      image: coolingNzxtKraken360Image,
      specs: ["360mm AIO", "ARGB", "Premium"],
    },
    {
      id: "cool-47",
      name: "DeepCool AG400",
      brand: "DeepCool",
      price: 299,
      image: coolingDeepCoolAk620Image,
      specs: ["Luftkylare", "120mm", "Prisvärd"],
    },
    {
      id: "cool-48",
      name: "Thermalright Assassin Spirit 120 V2",
      brand: "Thermalright",
      price: 249,
      image: coolingThermalrightPeerlessAssassinImage,
      specs: ["Luftkylare", "120mm", "Prisvärd"],
    },
    {
      id: "cool-49",
      name: "Thermalright Assassin X120 R SE ARGB 120mm",
      brand: "Thermalright",
      price: 299,
      image: coolingThermalrightPeerlessAssassinImage,
      specs: ["Luftkylare", "120mm", "ARGB"],
    },
    {
      id: "cool-50",
      name: "DeepCool AG400 BK ARGB V2",
      brand: "DeepCool",
      price: 349,
      image: coolingDeepCoolAk620Image,
      specs: ["Luftkylare", "120mm", "ARGB"],
    },
    {
      id: "cool-51",
      name: "Cooler Master Hyper 212 3DHP ARGB kylare (svart)",
      brand: "Cooler Master",
      price: 449,
      image: coolingDeepCoolAk620Image,
      specs: ["Luftkylare", "120mm", "ARGB"],
    },
    {
      id: "cool-52",
      name: "Arctic Freezer 36 Kylare",
      brand: "Arctic",
      price: 349,
      image: coolingArcticLiquidFreezerII360Image,
      specs: ["Luftkylare", "120mm", "Prisvärd"],
    },
    {
      id: "cool-53",
      name: "DeepCool AG400 WH ARGB V2",
      brand: "DeepCool",
      price: 349,
      image: coolingDeepCoolAk620Image,
      specs: ["Luftkylare", "Vit", "ARGB"],
    },
    {
      id: "cool-54",
      name: "be quiet! Pure Rock 3 LX - Black",
      brand: "be quiet!",
      price: 299,
      image: coolingBeQuietDarkRockPro5Image,
      specs: ["Luftkylare", "Tyst", "120mm", "Svart"],
    },
    {
      id: "cool-55",
      name: "DeepCool AK400 Digital SE",
      brand: "DeepCool",
      price: 499,
      image: coolingDeepCoolAk620Image,
      specs: ["Luftkylare", "Digital", "120mm"],
    },
    {
      id: "cool-56",
      name: "DeepCool AK400 Digital SE Vit",
      brand: "DeepCool",
      price: 549,
      image: coolingDeepCoolAk620Image,
      specs: ["Luftkylare", "Digital", "Vit"],
    },
    {
      id: "cool-57",
      name: "Thermalright Peerless Assassin 120 ARGB",
      brand: "Thermalright",
      price: 499,
      image: coolingThermalrightPeerlessAssassinImage,
      specs: ["Luftkylare", "120mm", "ARGB"],
    },
    {
      id: "cool-58",
      name: "Thermalright Peerless Assassin 120 SE ARGB",
      brand: "Thermalright",
      price: 449,
      image: coolingThermalrightPeerlessAssassinImage,
      specs: ["Luftkylare", "120mm", "ARGB"],
    },
    {
      id: "cool-59",
      name: "be quiet! Pure Rock Pro 3 LX",
      brand: "be quiet!",
      price: 799,
      image: coolingBeQuietDarkRockPro5Image,
      specs: ["Luftkylare", "Tyst", "Dual tower"],
    },
    {
      id: "cool-60",
      name: "DeepCool AK500 Zero Dark",
      brand: "DeepCool",
      price: 699,
      image: coolingDeepCoolAk620Image,
      specs: ["Luftkylare", "Svart", "High TDP"],
    },
    {
      id: "cool-61",
      name: "DeepCool AK620 Zero Dark",
      brand: "DeepCool",
      price: 799,
      image: coolingDeepCoolAk620Image,
      specs: ["Luftkylare", "Dual tower", "Svart"],
    },
    {
      id: "cool-62",
      name: "DeepCool AK620 G2 Digital Nyx",
      brand: "DeepCool",
      price: 999,
      image: coolingDeepCoolAk620Image,
      specs: ["Luftkylare", "Digital", "Dual tower"],
    },
    {
      id: "cool-63",
      name: "be quiet! Pure Rock Pro 3",
      brand: "be quiet!",
      price: 749,
      image: coolingBeQuietDarkRockPro5Image,
      specs: ["Luftkylare", "Tyst", "Dual tower"],
    },
    {
      id: "cool-64",
      name: "Noctua NH-L9x65 chromax.black",
      brand: "Noctua",
      price: 699,
      image: coolingNoctuaNhd15Image,
      specs: ["Lågprofil", "Svart", "Tyst"],
    },
    {
      id: "cool-65",
      name: "Noctua NH-L12S",
      brand: "Noctua",
      price: 699,
      image: coolingNoctuaNhd15Image,
      specs: ["Lågprofil", "120mm", "Tyst"],
    },
    {
      id: "cool-66",
      name: "Noctua NH-U12A",
      brand: "Noctua",
      price: 1190,
      image: coolingNoctuaNhd15Image,
      specs: ["Luftkylare", "120mm", "Premium"],
    },
    {
      id: "cool-67",
      name: "Noctua NH-U9S",
      brand: "Noctua",
      price: 699,
      image: coolingNoctuaNhd15Image,
      specs: ["Luftkylare", "92mm", "Kompakt"],
    },
    {
      id: "cool-68",
      name: "Noctua NH-D12L",
      brand: "Noctua",
      price: 999,
      image: coolingNoctuaNhd15Image,
      specs: ["Luftkylare", "120mm", "Dual tower"],
    },
  ],
  /*
   * Tomma med flit. Chassifläktar och nätverkskort kom in med Proshops
   * flöde och har ingen handplockad förlaga. Listorna finns för att
   * kategorierna ska se likadana ut som de andra - en handplockad post
   * kan läggas här när det blir aktuellt.
   */
  chassifan: [],
  networkcard: [],
};

/*
 * Handplockade komponenter först, Proshops flöde efter.
 *
 * CURATED_COMPONENTS ovan är de dryga 280 som valts för hand. Flödet
 * lägger till drygt fyra tusen till, alla med specifikationer som gått
 * att läsa ut säkert ur butikens titel - se scripts/import-feed-catalog.mjs
 * för var gränsen går och varför.
 *
 * ORDNINGEN BÄR MER ÄN DEN TÅL
 *
 * De handplockade ligger först i varje lista, och popularitetssorteringen
 * räknar fram sin poäng ur just den platsen - 1000 minus index. Där den
 * sorteringen är förvald syns alltså våra val överst.
 *
 * Men den är bara förvald för processorer, grafikkort och moderkort.
 * Minne, lagring, chassi, nätaggregat och kylning öppnar på billigast
 * först, och billigast i flödet är en fyra gigabyte DDR4-sticka för
 * några hundralappar. Det var ofarligt när listan var trettiofem poster
 * lång och är det inte längre när den är tolvhundra.
 *
 * Ordningen är i dag den enda kvarvarande kureringen, och den räcker
 * uppenbart inte. Den uttryckliga taggen är det som ska ersätta den.
 *
 * Dubbletter rensas på normaliserat namn: samma produkt två gånger ser
 * ut som ett fel, inte som två alternativ.
 */
const feedByCategory = FEED_CATALOG_ITEMS.reduce<Record<string, ComponentItem[]>>(
  (acc, item) => {
    const list = acc[item.category] || (acc[item.category] = []);
    list.push({
      id: item.id,
      name: item.name,
      brand: item.brand || "",
      price: item.price,
      specs: Array.isArray(item.specs) ? item.specs : [],
      image: item.image,
      details: item.details || {},
      ...(item.socket ? { socket: item.socket as ComponentItem["socket"] } : {}),
      ...(item.ramType ? { ramType: item.ramType as ComponentItem["ramType"] } : {}),
      ...(item.gpuModel ? { gpuModel: item.gpuModel } : {}),
    });
    return acc;
  },
  {},
);

const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const mergeFeedInto = (base: ComponentItem[], category: CategoryKey): ComponentItem[] => {
  const seen = new Set(base.map((item) => normalizeName(item.name)));
  const merged = [...base];

  for (const item of feedByCategory[category] || []) {
    const key = normalizeName(item.name);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged;
};

const mergeCategory = (category: CategoryKey): ComponentItem[] =>
  mergeFeedInto(CURATED_COMPONENTS[category], category);

const COMPONENTS: Record<CategoryKey, ComponentItem[]> = {
  cpu: mergeCategory("cpu"),
  gpu: mergeCategory("gpu"),
  motherboard: mergeCategory("motherboard"),
  ram: mergeCategory("ram"),
  storage: mergeCategory("storage"),
  case: mergeCategory("case"),
  psu: mergeCategory("psu"),
  cooling: mergeCategory("cooling"),
  chassifan: mergeCategory("chassifan"),
  networkcard: mergeCategory("networkcard"),
};

/*
 * Det kunden ser i en kategori.
 *
 * PROCESSORER OCH MODERKORT KOMMER INTE FRÅN CURATED_COMPONENTS
 *
 * De två bygger på catalogComponentItems, alltså samma katalog som
 * administrationen och prisjakten arbetar mot, för att ett id ska betyda
 * samma sak överallt. CURATED_COMPONENTS.cpu och .motherboard finns kvar
 * men ritas inte ut. Den som lägger flödet enbart på COMPONENTS får därför
 * fyra tusen nya minnen och chassin, och exakt noll nya processorer - det
 * var så det såg ut här innan.
 *
 * getPreloadedPrice lämnar priset orört när posten inte finns i
 * reservpristabellen, så flödets egna priser klarar sig igenom.
 */
const displayComponentItems: Record<CategoryKey, ComponentItem[]> = {
  cpu: mergeFeedInto(catalogComponentItems.cpu, "cpu"),
  motherboard: mergeFeedInto(catalogComponentItems.motherboard, "motherboard"),
  gpu: COMPONENTS.gpu.map((item) => ({ ...item, price: getPreloadedPrice(item.id, item.price) })),
  ram: COMPONENTS.ram.map((item) => ({ ...item, price: getPreloadedPrice(item.id, item.price) })),
  storage: COMPONENTS.storage.map((item) => ({ ...item, price: getPreloadedPrice(item.id, item.price) })),
  case: COMPONENTS.case.map((item) => ({ ...item, price: getPreloadedPrice(item.id, item.price) })),
  psu: COMPONENTS.psu.map((item) => ({ ...item, price: getPreloadedPrice(item.id, item.price) })),
  cooling: COMPONENTS.cooling.map((item) => ({ ...item, price: getPreloadedPrice(item.id, item.price) })),
  chassifan: COMPONENTS.chassifan.map((item) => ({ ...item, price: getPreloadedPrice(item.id, item.price) })),
  networkcard: COMPONENTS.networkcard.map((item) => ({ ...item, price: getPreloadedPrice(item.id, item.price) })),
};

const getResolvedComponentImage = (
  category: CategoryKey,
  item: ComponentItem,
  catalogImageUrl?: string | null
) => {
  if (catalogImageUrl) {
    return catalogImageUrl;
  }
  if (CATALOG_IMAGE_OVERRIDE_BY_ID[item.id]) {
    return CATALOG_IMAGE_OVERRIDE_BY_ID[item.id];
  }
  if (category === "case" && CASE_REMOTE_IMAGE_BY_ID[item.id]) {
    return CASE_REMOTE_IMAGE_BY_ID[item.id];
  }
  if (item.image) {
    return item.image;
  }
  return CATEGORY_IMAGES[category]?.src ?? FALLBACK_COMPONENT_IMAGE;
};

const getCategoryItems = (category: CategoryKey): ComponentItem[] => {
  return displayComponentItems[category];
};

/*
 * Butikernas märken.
 *
 * Adresserna är butikernas egna och hotlänkas, precis som
 * produktbilderna. Vi sparar dem inte: märket tillhör butiken, och
 * hämtas det hos dem byts det dessutom ut av sig självt den dag de gör
 * om det.
 *
 * Nycklarna är store_id ur component_offers, alltså samma sträng
 * prissystemet skriver.
 */
const BUTIKSMARKEN: Record<string, string[]> = {
  /* Två adresser var. Proshop byter filnamn ibland - "-v2" i namnet
     röjer att de redan gjort det en gång - och favicon-32 har legat
     still längre. Går ingen av dem fram står butikens begynnelsebokstav
     kvar i rutan, så det aldrig blir en trasig ikon. */
  proshop: [
    "https://www.proshop.se/apple-touch-icon-v2.png",
    "https://www.proshop.se/favicon-32x32.png",
  ],
  webhallen: [
    "https://www.webhallen.com/icon.svg",
    "https://www.webhallen.com/apple-favicon.png",
  ],
};

/*
 * Ordningen butikerna står i lagerrutan.
 *
 * Fast ordning, inte den databasen råkar svara med. Annars byter
 * rutorna plats mellan två rader och kolumnen blir omöjlig att läsa
 * nedåt - det är just det den finns för.
 */
const BUTIKSORDNING = ["proshop", "webhallen"];

const sorteradeButiker = (stock: Record<string, number> | undefined) => {
  if (!stock) return [];
  const nycklar = Object.keys(stock);
  return [
    ...BUTIKSORDNING.filter((id) => nycklar.includes(id)),
    ...nycklar.filter((id) => !BUTIKSORDNING.includes(id)).sort(),
  ];
};

const getButiksmarken = (offer: StoreOffer) => {
  const id = String(offer.store_id || offer.store || "").toLowerCase().trim();
  return BUTIKSMARKEN[id] || [];
};

const formatPrice = (price: number) => price.toLocaleString("sv-SE");
const formatCurrencyPrice = (price: number, currency = "SEK") =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency }).format(price);
const getLowestPricedStoreOfferValue = (offers: StoreOffer[]) => {
  const pricedValues = (Array.isArray(offers) ? offers : [])
    .filter((offer) => offer?.status === "available" && Number.isFinite(offer?.total_price ?? offer?.price))
    .map((offer) => Number(offer.total_price ?? offer.price))
    .filter((value) => Number.isFinite(value) && value > 0);
  return pricedValues.length > 0 ? Math.min(...pricedValues) : null;
};
const CATEGORY_BASE_PRICE: Record<CategoryKey, number> = {
  cpu: 2990,
  gpu: 6990,
  motherboard: 2490,
  ram: 1190,
  storage: 990,
  case: 1290,
  psu: 1290,
  cooling: 990,
  chassifan: 250,
  networkcard: 350,
};
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeApiBase = (value: string) => value.replace(/\/+$/, "");

const initialOfferForm = {
  name: "",
  email: "",
  phone: "",
  notes: "",
};


const getBasePrice = (item: ComponentItem, category: CategoryKey) =>
  item.price && item.price > 0 ? item.price : CATEGORY_BASE_PRICE[category];

/*
 * Ett bygge håller flera val per kategori, inte ett.
 *
 * Man sätter fem fläktar i ett chassi, och tre diskar i ett moderkort:
 * en systemdisk, en för spelen och en gammal snurrande för lagringen.
 * Förut höll bygget exakt en komponent per kategori, så den kunden fick
 * välja vilken av sina tre diskar hon ville berätta om i offerten.
 *
 * Antalet ligger i valet i stället för som upprepade poster. Fem rader
 * "Arctic P12" i sammanfattningen säger samma sak som en rad med en
 * femma, bara sämre, och att ta bort en av fem likadana rader är en
 * gissning om vilken.
 */
type Byggval = {
  item: ComponentItem;
  antal: number;
};

type Bygge = Record<CategoryKey, Byggval[]>;

/*
 * Hur många enheter varje kategori tar.
 *
 * Taken är fysiska och inte hittade på: ett moderkort har en sockel, ett
 * chassi en plats, en processor ett fäste. Fläktarna begränsas av
 * chassits fästen och kortets kontakter, diskarna av M.2-platserna och
 * SATA-portarna, minnet av hur många kitt som får plats i fyra bankar.
 *
 * Där taket är ett fungerar allt precis som innan - samma knapp, samma
 * rad i bygget, samma länk.
 */
const MAX_ANTAL: Record<CategoryKey, number> = {
  cpu: 1,
  gpu: 1,
  motherboard: 1,
  ram: 2,
  storage: 4,
  case: 1,
  psu: 1,
  cooling: 1,
  chassifan: 10,
  networkcard: 2,
};

const tarFlera = (key: CategoryKey) => MAX_ANTAL[key] > 1;

const tomtBygge = (): Bygge => ({
  cpu: [],
  gpu: [],
  motherboard: [],
  ram: [],
  storage: [],
  case: [],
  psu: [],
  cooling: [],
  chassifan: [],
  networkcard: [],
});

/*
 * Det första valet i en kategori.
 *
 * Kompatibilitetsreglerna handlar om sockeln och minnestypen, och dem
 * bestämmer moderkortet - det finns bara ett. Att fråga efter "det
 * första" är därför inte en förenkling utan hela sanningen för de
 * kategorier reglerna gäller.
 */
const forstaValet = (bygge: Bygge, key: CategoryKey) => bygge[key][0]?.item ?? null;

const antalEnheter = (val: Byggval[]) => val.reduce((sum, v) => sum + v.antal, 0);

/*
 * Lägger till ett val, eller räknar upp det som redan ligger där.
 *
 * För en kategori som bara tar en byts valet ut i stället för att
 * vägras. Annars hade man inte kunnat ändra sig om processorn utan att
 * först tömma steget.
 */
const medTillagd = (bygge: Bygge, key: CategoryKey, item: ComponentItem): Bygge => {
  const nuvarande = bygge[key];

  if (MAX_ANTAL[key] === 1) {
    return { ...bygge, [key]: [{ item, antal: 1 }] };
  }

  if (antalEnheter(nuvarande) >= MAX_ANTAL[key]) {
    return bygge;
  }

  const index = nuvarande.findIndex((v) => v.item.id === item.id);
  if (index === -1) {
    return { ...bygge, [key]: [...nuvarande, { item, antal: 1 }] };
  }

  const nasta = [...nuvarande];
  nasta[index] = { ...nasta[index], antal: nasta[index].antal + 1 };
  return { ...bygge, [key]: nasta };
};

const utanVal = (bygge: Bygge, key: CategoryKey, itemId: string): Bygge => ({
  ...bygge,
  [key]: bygge[key].filter((v) => v.item.id !== itemId),
});

/* Ett steg upp eller ner. Under ett betyder bort ur bygget. */
const medAndratAntal = (
  bygge: Bygge,
  key: CategoryKey,
  itemId: string,
  steg: number,
): Bygge => {
  const nuvarande = bygge[key];
  const index = nuvarande.findIndex((v) => v.item.id === itemId);
  if (index === -1) return bygge;

  const nyttAntal = nuvarande[index].antal + steg;
  if (nyttAntal < 1) {
    return utanVal(bygge, key, itemId);
  }
  /* Taket räknas på kategorin som helhet, inte på den enskilda raden:
     tio fläktar är tio oavsett om de är tio likadana eller fem av två. */
  if (steg > 0 && antalEnheter(nuvarande) >= MAX_ANTAL[key]) {
    return bygge;
  }

  const nasta = [...nuvarande];
  nasta[index] = { ...nasta[index], antal: nyttAntal };
  return { ...bygge, [key]: nasta };
};

/*
 * Bygget i en länk.
 *
 * Ett fält per kategori i CATEGORY_ORDER, åtskilda med punkt. Fältet är
 * "-" när inget valts, annars ett eller flera val åtskilda med
 * understreck, där varje val är id-numret i bas 36 följt av "*antal"
 * när antalet är mer än ett:
 *
 *   -.1f.-.2a_3b.4c*5
 *
 * Gamla länkar har varken understreck eller stjärna och läses därför
 * precis som förut. De ligger i folks chattar och bokmärken och ska
 * fortsätta fungera.
 *
 * De handplockade komponenterna har löpnummer i sitt id - "sto-3" - och
 * blir därför korta koder. Katalogen ur butiksflödet har det inte:
 * "feed-storage-1yn6wg6" har inget nummer att förkorta. De skrivs ut i
 * sin helhet efter ett tilde.
 *
 * Utan det tappade en delad länk tyst allt utom de handplockade, alltså
 * sextusen av sidans knappt sjutusen komponenter. "Spara build" gav en
 * länk som öppnade ett halvtomt bygge, och den som skickat den fick
 * ingen aning om varför.
 */
const kodaValId = (item: ComponentItem) => {
  const lastSegment = item.id.split("-").pop();
  const numberValue = lastSegment ? Number(lastSegment) : Number.NaN;
  if (Number.isFinite(numberValue)) {
    return numberValue.toString(36);
  }
  /* Id:n innehåller bara bokstäver, siffror och bindestreck, aldrig
     punkt, understreck eller stjärna - alltså ingen av avgränsarna. */
  return `~${item.id}`;
};

const encodeBuildSelection = (selection: Bygge) =>
  CATEGORY_ORDER.map((key) => {
    const kodade = selection[key]
      .map(({ item, antal }) => {
        const kod = kodaValId(item);
        return antal > 1 ? `${kod}*${antal.toString(36)}` : kod;
      })
      .filter(Boolean);
    return kodade.length ? kodade.join("_") : "-";
  }).join(".");

const decodeBuildSelection = (encoded: string) => {
  const parts = encoded.split(".");
  /*
   * Kortare är tillåtet, längre inte.
   *
   * En länk som delades innan chassifläktarna och nätverkskorten fanns
   * har åtta fält i stället för tio. Ett krav på exakt längd hade gjort
   * varje sådan länk ogiltig i samma stund som stegen lades till, och de
   * ligger i folks chattar och bokmärken.
   */
  if (parts.length > CATEGORY_ORDER.length) return null;
  const result: Partial<Record<CategoryKey, { id: string; antal: number }[]>> = {};
  parts.forEach((part, index) => {
    if (!part || part === "-") return;
    const key = CATEGORY_ORDER[index];
    if (!key) return;

    const val = part
      .split("_")
      .map((bit) => {
        const [idDel, antalDel] = bit.split("*");
        /*
         * Antalet klipps mot kategorins tak.
         *
         * Länken kommer utifrån och kan vara handredigerad. "chassifan
         * gånger nittontusen" ska bli tio fläktar, inte en total på
         * fyra miljoner kronor i ett mejl till Sahran.
         */
        const rattAntal = antalDel ? parseInt(antalDel, 36) : 1;
        const antal = Number.isFinite(rattAntal)
          ? Math.min(Math.max(1, rattAntal), MAX_ANTAL[key])
          : 1;

        /* Tilde betyder att id:t står skrivet i klartext. */
        if (idDel.startsWith("~")) {
          const id = idDel.slice(1);
          return id ? { id, antal } : null;
        }

        const numberValue = parseInt(idDel, 36);
        if (!Number.isFinite(numberValue)) return null;
        return { id: `${CATEGORY_ID_PREFIX[key]}-${numberValue}`, antal };
      })
      .filter((v): v is { id: string; antal: number } => Boolean(v));

    if (val.length) {
      result[key] = val;
    }
  });
  return result;
};

export default function CustomBuild() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const normalizedApiBase = normalizeApiBase(apiBase);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerForm, setOfferForm] = useState(initialOfferForm);
  const [offerStatus, setOfferStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [offerError, setOfferError] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("cpu");
  const [activeBrand, setActiveBrand] = useState("Alla");
  const [searchTerm, setSearchTerm] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [customBuildDebugEnabled, setCustomBuildDebugEnabled] = useState(false);
  const [showDetailedFilters, setShowDetailedFilters] = useState(false);
  const [socketFilters, setSocketFilters] = useState<string[]>([]);
  const [chipsetFilters, setChipsetFilters] = useState<string[]>([]);
  const [ramTypeFilters, setRamTypeFilters] = useState<string[]>([]);
  const [formFactorFilters, setFormFactorFilters] = useState<string[]>([]);
  const [pcieGenerationFilters, setPcieGenerationFilters] = useState<string[]>([]);
  const [storageTypeFilters, setStorageTypeFilters] = useState<string[]>([]);
  const [gpuPerformanceFilters, setGpuPerformanceFilters] = useState<string[]>([]);
  const [psuRatingFilters, setPsuRatingFilters] = useState<string[]>([]);
  const [psuWattageRange, setPsuWattageRange] = useState<[number, number]>([0, 0]);
  const [tableSortByCategory, setTableSortByCategory] = useState<Record<CategoryKey, { key: SortKey; direction: SortDirection }>>({
    cpu: { key: "popularity", direction: "desc" },
    gpu: { key: "popularity", direction: "desc" },
    motherboard: { key: "popularity", direction: "desc" },
    /*
     * Alla tio öppnar på populärast, inte på billigast.
     *
     * Fem av dem öppnade förut på lägsta pris. Det var ofarligt när
     * minneskategorin hade trettiofem poster och är det inte när den har
     * tusen: det första en kund såg var en fyra gigabyte DDR4-sticka för
     * några hundralappar, och chassilistan började på det billigaste
     * plåtskal Proshop säljer.
     *
     * Populärast sorterar på listans egen ordning, och där ligger de
     * handplockade först. Tills taggen finns är det den enda kurering
     * som når kunden.
     */
    ram: { key: "popularity", direction: "desc" },
    storage: { key: "popularity", direction: "desc" },
    case: { key: "popularity", direction: "desc" },
    psu: { key: "popularity", direction: "desc" },
    cooling: { key: "popularity", direction: "desc" },
    chassifan: { key: "popularity", direction: "desc" },
    networkcard: { key: "popularity", direction: "desc" },
  });
  const [cpuPerformanceFilters, setCpuPerformanceFilters] = useState<string[]>([]);
  const [cpuModelFilters, setCpuModelFilters] = useState<string[]>([]);
  const [gpuChipVendorFilter, setGpuChipVendorFilter] = useState("Alla");
  const [gpuManufacturerFilters, setGpuManufacturerFilters] = useState<string[]>([]);
  const [gpuVramRange, setGpuVramRange] = useState<[number, number]>([0, 0]);
  const [gpuLengthRange, setGpuLengthRange] = useState<[number, number]>([0, 0]);
  const [motherboardManufacturerFilters, setMotherboardManufacturerFilters] = useState<string[]>([]);
  const [motherboardWifiFilter, setMotherboardWifiFilter] = useState<"Alla" | "Ja" | "Nej">("Alla");
  const [motherboardMemorySlotsRange, setMotherboardMemorySlotsRange] = useState<[number, number]>([0, 0]);
  const [motherboardM2SlotsRange, setMotherboardM2SlotsRange] = useState<[number, number]>([0, 0]);
  const [ramMinimumSizeCard, setRamMinimumSizeCard] = useState<number | null>(null);
  const [ramManufacturers, setRamManufacturers] = useState<string[]>([]);
  const [ramSizeRange, setRamSizeRange] = useState<[number, number]>([0, 0]);
  const [ramSpeedRange, setRamSpeedRange] = useState<[number, number]>([0, 0]);
  const [ramClRange, setRamClRange] = useState<[number, number]>([0, 0]);
  const [ramModulesRange, setRamModulesRange] = useState<[number, number]>([0, 0]);
  const [storageMinimumSizeCard, setStorageMinimumSizeCard] = useState<number | null>(null);
  const [storageManufacturerFilters, setStorageManufacturerFilters] = useState<string[]>([]);
  const [storageFormFactorFilters, setStorageFormFactorFilters] = useState<string[]>([]);
  const [storageInterfaceFilters, setStorageInterfaceFilters] = useState<string[]>([]);
  const [storageSizeRange, setStorageSizeRange] = useState<[number, number]>([0, 0]);
  const [storageReadRange, setStorageReadRange] = useState<[number, number]>([0, 0]);
  const [storageWriteRange, setStorageWriteRange] = useState<[number, number]>([0, 0]);
  const [psuMinimumWattCard, setPsuMinimumWattCard] = useState<number | null>(null);
  const [psuMinimumRatingCard, setPsuMinimumRatingCard] = useState<string | null>(null);
  const [psuManufacturerFilters, setPsuManufacturerFilters] = useState<string[]>([]);
  const [psuModularFiltersDetailed, setPsuModularFiltersDetailed] = useState<string[]>([]);
  const [psuAtxStandardFilters, setPsuAtxStandardFilters] = useState<string[]>([]);
  const [psuFormFactorFilters, setPsuFormFactorFilters] = useState<string[]>([]);
  const [psuLengthRange, setPsuLengthRange] = useState<[number, number]>([0, 0]);
  const [coolingTypeFilter, setCoolingTypeFilter] = useState<"Alla" | "Luft" | "Vatten">("Alla");
  const [coolingManufacturerFilters, setCoolingManufacturerFilters] = useState<string[]>([]);
  const [coolingSocketFilters, setCoolingSocketFilters] = useState<string[]>([]);
  const [coolingHeightRange, setCoolingHeightRange] = useState<[number, number]>([0, 0]);
  /*
   * Ett gemensamt tillverkarfilter i stället för fyra nya.
   *
   * Moderkort, grafikkort, minne, lagring, aggregat och kylare har
   * vardera sitt eget tillstånd för tillverkare. Chassi, chassifläktar
   * och nätverkskort saknade helt - och att lägga till tre till hade
   * betytt tre nya tillstånd, tre nollställningar och tre grenar att
   * glömma. Ett delat räcker: bara en kategori är öppen i taget, och
   * det nollställs när man byter.
   */
  const [genericBrandFilters, setGenericBrandFilters] = useState<string[]>([]);
  const [caseBoardSizeFilters, setCaseBoardSizeFilters] = useState<string[]>([]);
  const [chassiFanSizeFilters, setChassiFanSizeFilters] = useState<string[]>([]);
  const [chassiFanRgbFilter, setChassiFanRgbFilter] = useState<"Alla" | "RGB" | "Utan RGB">("Alla");
  const [networkCardSlotFilters, setNetworkCardSlotFilters] = useState<string[]>([]);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [bygge, setBygge] = useState<Bygge>(tomtBygge);
  const [visibleCount, setVisibleCount] = useState(ROWS_PER_PAGE);
  const [expandedItemId, setExpandedItemId] = useState("");
  const [expandedItemCategory, setExpandedItemCategory] = useState<CategoryKey | null>(null);
  /* Bilden som visas stort när man klickar på den i den utfällda panelen. */
  const [storBild, setStorBild] = useState<{ src: string; alt: string } | null>(null);
  const [storePickerComponent, setStorePickerComponent] = useState<ComponentItem | null>(null);
  const [storePickerLoading, setStorePickerLoading] = useState(false);
  const [storePickerError, setStorePickerError] = useState("");
  const [storePickerCache, setStorePickerCache] = useState<Record<string, CatalogItemOffersResponse>>({});
  const [lowestOfferPriceByItemId, setLowestOfferPriceByItemId] = useState<Record<string, number>>(
    () => ({ ...CUSTOM_BUILD_PRELOADED_PRICE_BY_ID })
  );
  const [imageUrlByItemId, setImageUrlByItemId] = useState<Record<string, string>>({});
  const [priceSourceByItemId, setPriceSourceByItemId] = useState<Record<string, CustomBuildPriceSource>>(() =>
    Object.fromEntries(
      Object.keys(CUSTOM_BUILD_PRELOADED_PRICE_BY_ID).map((itemId) => [itemId, "fallback" as CustomBuildPriceSource])
    )
  );
  const [itemsWithoutStorePrice, setItemsWithoutStorePrice] = useState<Record<string, boolean>>({});
  /*
   * Hur många butiker varje komponent finns hos.
   *
   * Listan visar bara det som någon butik faktiskt för. Utan den här
   * siffran gick det inte att skilja "slut hos Proshop" från "finns
   * ingenstans" - båda visade ett pris, men det ena var butikens och det
   * andra vår uppskattning.
   */
  const [offerCountByItemId, setOfferCountByItemId] = useState<Record<string, number>>({});
  /* Lagerstatus per butik och komponent: 1 i lager, 0 slut, saknas helt
     om butiken inte för varan. */
  const [stockByItemId, setStockByItemId] = useState<Record<string, Record<string, number>>>({});
  /* Filtret som bara visar det som går att köpa i dag. */
  const [endastILager, setEndastILager] = useState(false);
  /* Kategorier vars prislista hunnit fram. Före svaret vet vi ingenting
     om butikerna, och då är det fel att dölja något. */
  const [kategorierMedPrislista, setKategorierMedPrislista] = useState<Record<string, boolean>>({});
  /* Vilka kategorier vi redan hämtat bulkpriser för. Ett anrop räcker
     per kategori - svaret innehåller hela kategorin. */
  const bulkprisHamtatRef = useRef<Set<CategoryKey>>(new Set());
  /* Sätts när servern svarat 429. Då slutar vi fråga helt. */
  const prisSparrRef = useRef(false);
  /* Löpnummer på butiksuppslagen, så att ett sent svar från en komponent
     man lämnat inte skriver över det man tittar på nu. */
  const butiksuppslagRef = useRef(0);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryValue = params.get("cbdebug");
      const storedValue = window.localStorage.getItem("custom-build-debug");
      const enabled = queryValue === "1" || storedValue === "1";
      setCustomBuildDebugEnabled(enabled);
      if (queryValue === "1") {
        window.localStorage.setItem("custom-build-debug", "1");
      } else if (queryValue === "0") {
        window.localStorage.removeItem("custom-build-debug");
      }
    } catch {
      setCustomBuildDebugEnabled(false);
    }
  }, []);

  const toggleCustomBuildDebug = () => {
    setCustomBuildDebugEnabled((prev) => {
      const next = !prev;
      try {
        if (next) {
          window.localStorage.setItem("custom-build-debug", "1");
        } else {
          window.localStorage.removeItem("custom-build-debug");
        }
      } catch {
        // Ignore localStorage failures.
      }
      return next;
    });
  };


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shortCode = params.get("b");
    const decodedIds = shortCode ? decodeBuildSelection(shortCode) : null;
    const next: Bygge = tomtBygge();
    let firstKey: CategoryKey | null = null;

    if (decodedIds) {
      CATEGORY_ORDER.forEach((key) => {
        const val = decodedIds[key];
        if (!val?.length) return;
        const katalog = getCategoryItems(key);
        val.forEach(({ id, antal }) => {
          const match = katalog.find((item) => item.id === id);
          if (!match) return;
          next[key] = [...next[key], { item: match, antal }];
          if (!firstKey) {
            firstKey = key;
          }
        });
      });
    } else {
      /* Den gamla formen, ett id per frågeparameter: ?cpu=cpu-12&gpu=... */
      (Object.keys(COMPONENTS) as CategoryKey[]).forEach((key) => {
        const id = params.get(key);
        if (!id) return;
        const match = getCategoryItems(key).find((item) => item.id === id);
        if (match) {
          next[key] = [{ item: match, antal: 1 }];
          if (!firstKey) {
            firstKey = key;
          }
        }
      });
    }

    setBygge(next);
    /* En delad länk kan innehålla en fläkt eller ett nätverkskort. Då ska
       tillvalslistan stå öppen, annars ser bygget ut att sakna något. */
    if (OPTIONAL_CATEGORIES.some((category) => next[category.key].length > 0)) {
      setExtraOpen(true);
    }
    if (firstKey) {
      setActiveCategory(firstKey);
    }
  }, []);

  useEffect(() => {
    setActiveBrand("Alla");
    setSearchTerm("");
  }, [activeCategory]);

  useEffect(() => {
    const summary = document.getElementById("build-summary");
    if (!summary || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSummaryVisible(entry.isIntersecting && entry.intersectionRatio >= 0.5);
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    observer.observe(summary);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const socket = bygge.motherboard[0]?.item.socket;
    if (!socket) return;
    const allowedRamType = SOCKET_RAM_TYPE[socket];

    setBygge((prev) => {
      /* Filter, inte nollning: minnet kan vara två kitt och då ska bara
         det som inte passar bort. Val utan uppgift om sockel eller
         minnestyp får stanna - vi vet inte att de är fel. */
      const nextCpu = prev.cpu.filter((v) => !v.item.socket || v.item.socket === socket);
      const nextRam = allowedRamType
        ? prev.ram.filter((v) => !v.item.ramType || v.item.ramType === allowedRamType)
        : prev.ram;

      if (nextCpu.length === prev.cpu.length && nextRam.length === prev.ram.length) {
        return prev;
      }

      return {
        ...prev,
        cpu: nextCpu,
        ram: nextRam,
      };
    });
  }, [bygge.motherboard]);

  const activeConfig = CATEGORY_LIST.find((category) => category.key === activeCategory);

  /*
   * Bara komponenter som någon butik faktiskt för.
   *
   * Katalogen innehåller 6 781 poster, men 492 av dem fanns varken hos
   * Proshop eller Webhallen. De visade katalogens riktpris, alltså en
   * uppskattning som såg ut precis som ett riktigt pris - och en kund som
   * valde en sådan fick ett bygge ingen kan handla.
   *
   * Filtret går på data och inte på en lista i koden: slutar en butik
   * föra en vara försvinner den av sig själv vid nästa prisuppdatering,
   * och börjar de föra den igen kommer den tillbaka.
   *
   * Före prislistans svar vet vi ingenting, och då visas allt. Annars
   * hade listan stått tom en sekund vid varje kategoribyte.
   */
  const items = useMemo(() => {
    const alla = getCategoryItems(activeCategory);
    if (!kategorierMedPrislista[activeCategory]) return alla;
    return alla.filter((item) => (offerCountByItemId[item.id] ?? 0) > 0);
  }, [activeCategory, kategorierMedPrislista, offerCountByItemId]);

  /* Hur många butiker som har varan hemma just nu. Memoiserad för att
     sorteringen har den som beroende och annars skulle räkna om hela
     listan vid varje rendering. */
  const antalILager = useCallback(
    (itemId: string) => Object.values(stockByItemId[itemId] || {}).filter((v) => v === 1).length,
    [stockByItemId],
  );
  const getComparablePrice = (item: ComponentItem, category: CategoryKey) => {
    const livePrice = lowestOfferPriceByItemId[item.id];
    if (typeof livePrice === "number" && Number.isFinite(livePrice) && livePrice > 0) {
      return Math.max(0, Math.round(livePrice));
    }
    return getBasePrice(item, category);
  };

  /*
   * Priset visas alltid. "N/A" stod här förut och var fel på två sätt.
   *
   * Det första: posten har ett pris. getComparablePrice faller tillbaka
   * på katalogens eget riktpris när ingen butik hittats, och det priset
   * är dessutom precis det som summeringen längst ner redan räknar med.
   * Raden sa alltså "N/A" medan sammanfattningen la till 1 499 kr för
   * samma komponent. Kunden fick en total byggd på siffror hon inte fick
   * se.
   *
   * Det andra: det gällde 221 av de 455 handplockade komponenterna, för
   * att de saknade EAN och prisjakten därför inte kunde känna igen dem.
   * Halva katalogen såg trasig ut av ett skäl som inte hade med
   * komponenterna att göra.
   *
   * Etiketten under priset säger fortfarande varifrån siffran kommer, så
   * skillnaden mellan ett pris från en butik i dag och vårt riktpris går
   * att se. Det är den upplysningen som behövdes, inte ett dolt pris.
   */
  const getDisplayPriceLabel = (item: ComponentItem, category: CategoryKey) => {
    return `${formatPrice(getComparablePrice(item, category))} kr`;
  };

  const getPriceSource = (item: ComponentItem): CustomBuildPriceSource => {
    if (priceSourceByItemId[item.id]) {
      return priceSourceByItemId[item.id];
    }
    if (itemsWithoutStorePrice[item.id]) {
      return "no-store";
    }
    if (typeof CUSTOM_BUILD_PRELOADED_PRICE_BY_ID[item.id] === "number") {
      return "fallback";
    }
    return "fallback";
  };

  const getPriceSourceLabel = (item: ComponentItem) => {
    const source = getPriceSource(item);
    switch (source) {
      case "live-offer":
        return "Live butik";
      case "seed":
        return "Cachad pris";
      case "search":
        return "Riktpris";
      case "no-store":
        /* Står under ett pris, så "Ingen butik" läses som att priset inte
           gäller. Det gör det - det är vårt riktpris, inte dagens pris
           hos en handlare. */
        return "Riktpris";
      default:
        return "Reservpris";
    }
  };

  const priceBounds = useMemo(() => {
    const prices = items.map((item) => getComparablePrice(item, activeCategory));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return {
      min: Number.isFinite(min) ? min : 0,
      max: Number.isFinite(max) ? max : 0,
    };
  }, [items, activeCategory, lowestOfferPriceByItemId]);

  useEffect(() => {
    setPriceRange([priceBounds.min, priceBounds.max]);
  }, [priceBounds.min, priceBounds.max]);

  const gpuVramBounds = useMemo(() => getNumericBounds(items.map((item) => getGpuVramGb(item))), [items]);
  const gpuLengthBounds = useMemo(() => getNumericBounds(items.map((item) => getGpuLengthMm(item))), [items]);
  const motherboardMemorySlotBounds = useMemo(() => getNumericBounds(items.map((item) => getMotherboardMemorySlots(item))), [items]);
  const motherboardM2Bounds = useMemo(() => getNumericBounds(items.map((item) => getMotherboardM2Slots(item))), [items]);
  const ramSizeBounds = useMemo(() => getNumericBounds(items.map((item) => getRamSizeGb(item))), [items]);
  const ramSpeedBounds = useMemo(() => getNumericBounds(items.map((item) => getRamSpeedMhz(item))), [items]);
  const ramClBounds = useMemo(() => getNumericBounds(items.map((item) => getRamClValue(item))), [items]);
  const ramModulesBounds = useMemo(() => getNumericBounds(items.map((item) => getRamModulesValue(item))), [items]);
  const storageSizeBounds = useMemo(() => getNumericBounds(items.map((item) => getStorageSizeGb(item))), [items]);
  const storageReadBounds = useMemo(() => getNumericBounds(items.map((item) => getStorageReadMb(item))), [items]);
  const storageWriteBounds = useMemo(() => getNumericBounds(items.map((item) => getStorageWriteMb(item))), [items]);
  const psuWattageBounds = useMemo(() => getNumericBounds(items.map((item) => getItemPsuWattage(item))), [items]);
  const psuLengthBounds = useMemo(() => getNumericBounds(items.map((item) => getPsuLengthMm(item))), [items]);
  const coolingHeightBounds = useMemo(() => getNumericBounds(items.map((item) => getCoolingHeightMm(item))), [items]);

  useEffect(() => setGpuVramRange([gpuVramBounds.min, gpuVramBounds.max]), [gpuVramBounds.min, gpuVramBounds.max]);
  useEffect(() => setGpuLengthRange([gpuLengthBounds.min, gpuLengthBounds.max]), [gpuLengthBounds.min, gpuLengthBounds.max]);
  useEffect(() => setMotherboardMemorySlotsRange([motherboardMemorySlotBounds.min, motherboardMemorySlotBounds.max]), [motherboardMemorySlotBounds.min, motherboardMemorySlotBounds.max]);
  useEffect(() => setMotherboardM2SlotsRange([motherboardM2Bounds.min, motherboardM2Bounds.max]), [motherboardM2Bounds.min, motherboardM2Bounds.max]);
  useEffect(() => setRamSizeRange([ramSizeBounds.min, ramSizeBounds.max]), [ramSizeBounds.min, ramSizeBounds.max]);
  useEffect(() => setRamSpeedRange([ramSpeedBounds.min, ramSpeedBounds.max]), [ramSpeedBounds.min, ramSpeedBounds.max]);
  useEffect(() => setRamClRange([ramClBounds.min, ramClBounds.max]), [ramClBounds.min, ramClBounds.max]);
  useEffect(() => setRamModulesRange([ramModulesBounds.min, ramModulesBounds.max]), [ramModulesBounds.min, ramModulesBounds.max]);
  useEffect(() => setStorageSizeRange([storageSizeBounds.min, storageSizeBounds.max]), [storageSizeBounds.min, storageSizeBounds.max]);
  useEffect(() => setStorageReadRange([storageReadBounds.min, storageReadBounds.max]), [storageReadBounds.min, storageReadBounds.max]);
  useEffect(() => setStorageWriteRange([storageWriteBounds.min, storageWriteBounds.max]), [storageWriteBounds.min, storageWriteBounds.max]);
  useEffect(() => setPsuWattageRange([psuWattageBounds.min, psuWattageBounds.max]), [psuWattageBounds.min, psuWattageBounds.max]);
  useEffect(() => setPsuLengthRange([psuLengthBounds.min, psuLengthBounds.max]), [psuLengthBounds.min, psuLengthBounds.max]);
  useEffect(() => setCoolingHeightRange([coolingHeightBounds.min, coolingHeightBounds.max]), [coolingHeightBounds.min, coolingHeightBounds.max]);

  const socketFilterOptions = useMemo(
    () => Array.from(new Set(items.map((item) => getItemSocketFilterValue(item)).filter(Boolean))).sort((a, b) => a.localeCompare(b, "sv")),
    [items]
  );
  const chipsetFilterOptions = useMemo(
    () => sortValuesByPreferredOrder(Array.from(new Set(items.map((item) => getDisplayChipsetValue(item)).filter(Boolean))), CHIPSET_DISPLAY_ORDER),
    [items]
  );
  const gpuPerformanceFilterOptions = useMemo(
    () => Array.from(new Set(items.map((item) => getItemGpuPerformanceClass(item)).filter(Boolean))),
    [items]
  );

  /*
   * Kretsarna per klass, räknade ur den lista som faktiskt visas.
   *
   * Hårdkodad hade listan blivit fel den dag ett kort byter klass eller
   * butiken slutar sälja en krets. Räknad ur items säger den alltid vad
   * kunden verkligen kan välja på just nu.
   */
  const gpuKretsarPerKlass = useMemo(() => {
    const karta = new Map<string, string[]>();
    if (activeCategory !== "gpu") return karta;
    for (const item of items) {
      const klass = getItemGpuPerformanceClass(item);
      const krets = getItemGpuChip(item);
      if (!klass || !krets) continue;
      const lista = karta.get(klass) || [];
      if (!lista.includes(krets)) {
        lista.push(krets);
        karta.set(klass, lista);
      }
    }
    for (const lista of karta.values()) lista.sort((a, b) => a.localeCompare(b, "sv"));
    return karta;
  }, [items, activeCategory]);
  const ramTypeFilterOptions = useMemo(
    () => sortValuesByPreferredOrder(Array.from(new Set(items.map((item) => getItemRamTypeFilterValue(item)).filter(Boolean))), RAM_TYPE_CARD_OPTIONS),
    [items]
  );
  const motherboardManufacturerOptions = useMemo(
    () => sortValuesByPreferredOrder(Array.from(new Set(items.map((item) => normalizeBrandLabel(item.brand)).filter(Boolean))), MOTHERBOARD_MANUFACTURER_OPTIONS),
    [items]
  );
  const gpuManufacturerOptions = useMemo(
    () => sortValuesByPreferredOrder(Array.from(new Set(items.map((item) => normalizeBrandLabel(item.brand)).filter(Boolean))), GPU_MANUFACTURER_OPTIONS),
    [items]
  );
  const ramManufacturerOptions = useMemo(
    () => sortValuesByPreferredOrder(Array.from(new Set(items.map((item) => normalizeBrandLabel(item.brand)).filter(Boolean))), RAM_MANUFACTURER_OPTIONS),
    [items]
  );
  const storageManufacturerOptions = useMemo(
    () => sortValuesByPreferredOrder(Array.from(new Set(items.map((item) => normalizeBrandLabel(item.brand)).filter(Boolean))), STORAGE_MANUFACTURER_OPTIONS),
    [items]
  );
  const storageFormFactorOptions = useMemo(
    () => sortValuesByPreferredOrder(Array.from(new Set(items.map((item) => getStorageFormFactorValue(item)).filter(Boolean))), STORAGE_FORM_FACTOR_OPTIONS),
    [items]
  );
  const storageInterfaceOptions = useMemo(
    () => sortValuesByPreferredOrder(Array.from(new Set(items.map((item) => getStorageInterfaceValue(item)).filter(Boolean))), STORAGE_INTERFACE_OPTIONS),
    [items]
  );
  const psuRatingFilterOptions = useMemo(
    () => sortValuesByPreferredOrder(Array.from(new Set(items.map((item) => getItemPsuRating(item)).filter(Boolean))), ["Bronze", "Silver", "Gold", "Platinum", "Titanium"]),
    [items]
  );
  const psuManufacturerOptions = useMemo(
    () => sortValuesByPreferredOrder(Array.from(new Set(items.map((item) => normalizeBrandLabel(item.brand)).filter(Boolean))), PSU_MANUFACTURER_OPTIONS),
    [items]
  );
  const coolingManufacturerOptions = useMemo(
    () => sortValuesByPreferredOrder(Array.from(new Set(items.map((item) => normalizeBrandLabel(item.brand)).filter(Boolean))), COOLING_MANUFACTURER_OPTIONS),
    [items]
  );
  const caseFormFactorOptions = useMemo(
    () => sortValuesByPreferredOrder(Array.from(new Set(items.map((item) => getItemFormFactorFilterValue(item)).filter(Boolean))), CASE_FORM_FACTOR_OPTIONS),
    [items]
  );

  // Samma härledning som för chassin, men sorterad efter moderkortens
  // ordning. Referensen fanns i filtret för moderkort utan att variabeln
  // någonsin deklarerats, vilket kraschade vyn så fort man valde kategorin.
  const motherboardFormFactorOptions = useMemo(
    () => sortValuesByPreferredOrder(Array.from(new Set(items.map((item) => getItemFormFactorFilterValue(item)).filter(Boolean))), MOTHERBOARD_FORM_FACTOR_OPTIONS),
    [items]
  );

  const supportsStoreOffersForCategory = (_categoryKey: CategoryKey) => true;

  const applyStoreOffersSnapshotToItem = (
    item: ComponentItem,
    categoryKey: CategoryKey,
    data: CatalogItemOffersResponse
  ) => {
    const cacheKey = getStoreCacheKey(categoryKey, item.id);
    const offers = Array.isArray(data?.offers) ? data.offers.filter((offer) => isDisplayableStoreOffer(offer)) : [];
    const lowestPricedOffer = getLowestPricedStoreOfferValue(offers);
    const hasPricedOffer = Number.isFinite(lowestPricedOffer) && Number(lowestPricedOffer) > 0;

    setStorePickerCache((prev) => ({
      ...prev,
      [cacheKey]: {
        ok: true,
        item_id: item.id,
        image_url: typeof data?.image_url === "string" ? data.image_url : null,
        offers,
      },
    }));

    if (typeof data?.image_url === "string" && data.image_url.trim()) {
      setImageUrlByItemId((prev) => ({
        ...prev,
        [item.id]:
          prev[item.id] ||
          getResolvedComponentImage(categoryKey, item, null) ||
          data.image_url!.trim(),
      }));
    }

    if (hasPricedOffer) {
      setLowestOfferPriceByItemId((prev) => ({
        ...prev,
        [item.id]: Math.max(0, Math.round(Number(lowestPricedOffer))),
      }));
    }

    setPriceSourceByItemId((prev) => ({
      ...prev,
      [item.id]: hasPricedOffer ? "live-offer" : offers.length > 0 ? "fallback" : "no-store",
    }));

    setItemsWithoutStorePrice((prev) => {
      if (hasPricedOffer) {
        if (!prev[item.id]) return prev;
        const nextState = { ...prev };
        delete nextState[item.id];
        return nextState;
      }
      if (offers.length === 0) {
        return { ...prev, [item.id]: true };
      }
      if (!prev[item.id]) return prev;
      const nextState = { ...prev };
      delete nextState[item.id];
      return nextState;
    });
  };

  /*
   * Ett bulkanrop per kategori.
   *
   * Svaret innehåller priserna för hela kategorin, så en gång räcker.
   * Förut var grinden en mängd med varje komponent-id i, vilket gav
   * samma resultat på ett krångligare sätt.
   */
  useEffect(() => {
    if (!supportsStoreOffersForCategory(activeCategory)) return;
    if (bulkprisHamtatRef.current.has(activeCategory)) return;
    if (prisSparrRef.current) return;
    bulkprisHamtatRef.current.add(activeCategory);
    let isCancelled = false;

    const loadLowestPrices = async () => {
      try {
        const endpoint = `${normalizedApiBase}/api/custom-build/catalog-prices?category=${encodeURIComponent(activeCategory)}`;
        const response = await fetch(endpoint);
        if (response.status === 429) {
          prisSparrRef.current = true;
          return;
        }
        if (!response.ok) {
          /* Markeringen bort igen, annars ger ett tillfälligt fel att
             kategorin aldrig får sina priser under hela besöket. */
          bulkprisHamtatRef.current.delete(activeCategory);
          return;
        }
        const data = (await response.json().catch(() => ({}))) as CatalogCategoryPricesResponse;
        const nextEntries = Array.isArray(data?.prices) ? data.prices : [];
        if (isCancelled || nextEntries.length === 0) return;
        setImageUrlByItemId((prev) => {
          const nextState = { ...prev };
          nextEntries.forEach((entry) => {
            if (typeof entry?.image_url === "string" && entry.image_url.trim()) {
              nextState[entry.item_id] = entry.image_url.trim();
            }
          });
          return nextState;
        });
        setLowestOfferPriceByItemId((prev) => {
          const nextState = { ...prev };
          nextEntries.forEach((entry) => {
            if (Number.isFinite(entry?.lowest_price) && Number(entry.lowest_price) > 0) {
              nextState[entry.item_id] = Math.max(0, Math.round(Number(entry.lowest_price)));
            } else {
              delete nextState[entry.item_id];
            }
          });
          return nextState;
        });
        setOfferCountByItemId((prev) => {
          const nextState = { ...prev };
          nextEntries.forEach((entry) => {
            nextState[entry.item_id] = Number(entry?.offer_count) || 0;
          });
          return nextState;
        });
        setStockByItemId((prev) => {
          const nextState = { ...prev };
          nextEntries.forEach((entry) => {
            nextState[entry.item_id] = entry?.stock && typeof entry.stock === "object" ? entry.stock : {};
          });
          return nextState;
        });
        setKategorierMedPrislista((prev) => ({ ...prev, [activeCategory]: true }));
        setPriceSourceByItemId((prev) => {
          const nextState = { ...prev };
          nextEntries.forEach((entry) => {
            if (entry?.price_source === "fallback") {
              nextState[entry.item_id] = "fallback";
            } else if (Number.isFinite(entry?.lowest_price) && Number(entry.lowest_price) > 0) {
              nextState[entry.item_id] = "live-offer";
            } else if (entry?.price_source === "search") {
              nextState[entry.item_id] = "search";
            } else if (entry?.price_source === "no-store") {
              nextState[entry.item_id] = "no-store";
            }
          });
          return nextState;
        });
        setItemsWithoutStorePrice((prev) => {
          const nextState = { ...prev };
          nextEntries.forEach((entry) => {
            if (Number.isFinite(entry?.lowest_price) && Number(entry.lowest_price) > 0) {
              delete nextState[entry.item_id];
            } else if (entry?.price_source === "no-store") {
              nextState[entry.item_id] = true;
            } else {
              delete nextState[entry.item_id];
            }
          });
          return nextState;
        });

      } catch {
        // Keep cached or reference prices on temporary API issues.
      }
    };

    void loadLowestPrices();
    return () => {
      isCancelled = true;
    };
  }, [normalizedApiBase, activeCategory]);

  const toggleArrayFilter = (value: string, setter: Dispatch<SetStateAction<string[]>>) => {
    setter((prev) => (prev.includes(value) ? prev.filter((entry) => entry !== value) : [...prev, value]));
  };

  /*
   * Sätter sorteringen rakt av, utan att vända på den.
   *
   * De tre huvudknapparna säger vad de gör - Populärast, Billigast,
   * Dyrast - och måste därför landa på exakt den ordningen varje gång.
   * Med toggleSortForCategory hade ett klick på "Billigast" när
   * billigast redan var valt vänt listan till dyrast, under en knapp som
   * fortfarande sa Billigast.
   */
  const setSortForCategory = (key: SortKey, direction: SortDirection) => {
    setTableSortByCategory((prev) => ({ ...prev, [activeCategory]: { key, direction } }));
  };

  const toggleSortForCategory = (key: SortKey, defaultDirection: SortDirection = "desc") => {
    setTableSortByCategory((prev) => {
      const current = prev[activeCategory];
      if (current?.key === key) {
        return {
          ...prev,
          [activeCategory]: {
            key,
            direction: current.direction === "asc" ? "desc" : "asc",
          },
        };
      }
      return {
        ...prev,
        [activeCategory]: { key, direction: defaultDirection },
      };
    });
  };

  const clearAdvancedFilters = () => {
    setSocketFilters([]);
    setChipsetFilters([]);
    setRamTypeFilters([]);
    setFormFactorFilters([]);
    setStorageTypeFilters([]);
    setGpuPerformanceFilters([]);
    setCpuPerformanceFilters([]);
    setCpuModelFilters([]);
    setGpuManufacturerFilters([]);
    setMotherboardManufacturerFilters([]);
    setMotherboardWifiFilter("Alla");
    setRamManufacturers([]);
    setStorageManufacturerFilters([]);
    setStorageFormFactorFilters([]);
    setStorageInterfaceFilters([]);
    setPsuRatingFilters([]);
    setPsuManufacturerFilters([]);
    setPsuModularFiltersDetailed([]);
    setPsuAtxStandardFilters([]);
    setPsuFormFactorFilters([]);
    setCoolingManufacturerFilters([]);
    setCoolingSocketFilters([]);
    setGenericBrandFilters([]);
    setCaseBoardSizeFilters([]);
    setChassiFanSizeFilters([]);
    setChassiFanRgbFilter("Alla");
    setNetworkCardSlotFilters([]);
    setRamMinimumSizeCard(null);
    setStorageMinimumSizeCard(null);
    setPsuMinimumWattCard(null);
    setPsuMinimumRatingCard(null);
    setCoolingTypeFilter("Alla");
    setGpuChipVendorFilter("Alla");
    setGpuVramRange([gpuVramBounds.min, gpuVramBounds.max]);
    setGpuLengthRange([gpuLengthBounds.min, gpuLengthBounds.max]);
    setMotherboardMemorySlotsRange([motherboardMemorySlotBounds.min, motherboardMemorySlotBounds.max]);
    setMotherboardM2SlotsRange([motherboardM2Bounds.min, motherboardM2Bounds.max]);
    setRamSizeRange([ramSizeBounds.min, ramSizeBounds.max]);
    setRamSpeedRange([ramSpeedBounds.min, ramSpeedBounds.max]);
    setRamClRange([ramClBounds.min, ramClBounds.max]);
    setRamModulesRange([ramModulesBounds.min, ramModulesBounds.max]);
    setStorageSizeRange([storageSizeBounds.min, storageSizeBounds.max]);
    setStorageReadRange([storageReadBounds.min, storageReadBounds.max]);
    setStorageWriteRange([storageWriteBounds.min, storageWriteBounds.max]);
    setPsuWattageRange([psuWattageBounds.min, psuWattageBounds.max]);
    setPsuLengthRange([psuLengthBounds.min, psuLengthBounds.max]);
    setCoolingHeightRange([coolingHeightBounds.min, coolingHeightBounds.max]);
  };

  const hasActiveAdvancedFilters =
    socketFilters.length > 0 ||
    chipsetFilters.length > 0 ||
    gpuPerformanceFilters.length > 0 ||
    cpuPerformanceFilters.length > 0 ||
    cpuModelFilters.length > 0 ||
    gpuManufacturerFilters.length > 0 ||
    motherboardManufacturerFilters.length > 0 ||
    motherboardWifiFilter !== "Alla" ||
    ramTypeFilters.length > 0 ||
    formFactorFilters.length > 0 ||
    storageTypeFilters.length > 0 ||
    ramManufacturers.length > 0 ||
    storageManufacturerFilters.length > 0 ||
    storageFormFactorFilters.length > 0 ||
    storageInterfaceFilters.length > 0 ||
    psuRatingFilters.length > 0 ||
    psuManufacturerFilters.length > 0 ||
    psuModularFiltersDetailed.length > 0 ||
    psuAtxStandardFilters.length > 0 ||
    psuFormFactorFilters.length > 0 ||
    coolingManufacturerFilters.length > 0 ||
    coolingSocketFilters.length > 0 ||
    genericBrandFilters.length > 0 ||
    caseBoardSizeFilters.length > 0 ||
    chassiFanSizeFilters.length > 0 ||
    chassiFanRgbFilter !== "Alla" ||
    networkCardSlotFilters.length > 0 ||
    ramMinimumSizeCard !== null ||
    storageMinimumSizeCard !== null ||
    psuMinimumWattCard !== null ||
    psuMinimumRatingCard !== null ||
    gpuChipVendorFilter !== "Alla" ||
    coolingTypeFilter !== "Alla" ||
    gpuVramRange[0] !== gpuVramBounds.min ||
    gpuVramRange[1] !== gpuVramBounds.max ||
    gpuLengthRange[0] !== gpuLengthBounds.min ||
    gpuLengthRange[1] !== gpuLengthBounds.max ||
    motherboardMemorySlotsRange[0] !== motherboardMemorySlotBounds.min ||
    motherboardMemorySlotsRange[1] !== motherboardMemorySlotBounds.max ||
    motherboardM2SlotsRange[0] !== motherboardM2Bounds.min ||
    motherboardM2SlotsRange[1] !== motherboardM2Bounds.max ||
    ramSizeRange[0] !== ramSizeBounds.min ||
    ramSizeRange[1] !== ramSizeBounds.max ||
    ramSpeedRange[0] !== ramSpeedBounds.min ||
    ramSpeedRange[1] !== ramSpeedBounds.max ||
    ramClRange[0] !== ramClBounds.min ||
    ramClRange[1] !== ramClBounds.max ||
    ramModulesRange[0] !== ramModulesBounds.min ||
    ramModulesRange[1] !== ramModulesBounds.max ||
    storageSizeRange[0] !== storageSizeBounds.min ||
    storageSizeRange[1] !== storageSizeBounds.max ||
    storageReadRange[0] !== storageReadBounds.min ||
    storageReadRange[1] !== storageReadBounds.max ||
    storageWriteRange[0] !== storageWriteBounds.min ||
    storageWriteRange[1] !== storageWriteBounds.max ||
    psuWattageRange[0] !== psuWattageBounds.min ||
    psuWattageRange[1] !== psuWattageBounds.max ||
    psuLengthRange[0] !== psuLengthBounds.min ||
    psuLengthRange[1] !== psuLengthBounds.max ||
    coolingHeightRange[0] !== coolingHeightBounds.min ||
    coolingHeightRange[1] !== coolingHeightBounds.max;

  /*
   * Sockeln, inte hela kortet.
   *
   * Filtret bryr sig bara om vilken sockel som är vald. Läste det ur
   * bygget direkt blev beroendet hela bygget, och då kördes filtret om
   * varje gång kunden räknade upp en chassifläkt - sextusen komponenter
   * silade i onödan. Byter man dessutom moderkort till ett annat med
   * samma sockel har ingenting förändrats för det filtret gör.
   */
  const valdSockelModerkort = forstaValet(bygge, "motherboard")?.socket;
  const valdSockelProcessor = forstaValet(bygge, "cpu")?.socket;

  const filteredItems = useMemo(() => {
    const selectedMotherboardSocket = valdSockelModerkort;
    const selectedCpuSocket = valdSockelProcessor;
    const allowedRamType = selectedMotherboardSocket ? SOCKET_RAM_TYPE[selectedMotherboardSocket] : null;

    return items.filter((item) => {
      /* "Bara i lager" är ett hårt nej, inte en sortering: den som
         kryssat i den vill inte se varor hon inte kan beställa. */
      if (endastILager && !Object.values(stockByItemId[item.id] || {}).some((v) => v === 1)) {
        return false;
      }
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const comparablePrice = getComparablePrice(item, activeCategory);
      const matchesPrice = comparablePrice >= priceRange[0] && comparablePrice <= priceRange[1];
      const matchesCompatibilitySocket =
        activeCategory === "cpu" && selectedMotherboardSocket
          ? item.socket === selectedMotherboardSocket
          : activeCategory === "motherboard" && selectedCpuSocket
          ? item.socket === selectedCpuSocket
          : true;
      const matchesCompatibilityRam = activeCategory !== "ram" || !allowedRamType ? true : item.ramType === allowedRamType;

      if (!matchesSearch || !matchesPrice || !matchesCompatibilitySocket || !matchesCompatibilityRam) {
        return false;
      }

      if (activeCategory === "cpu") {
        const modelFamily = getCpuModelFamily(item);
        const performanceTier = getCpuPerformanceTier(item);
        if (activeBrand !== "Alla" && item.brand !== activeBrand) return false;
        if (cpuPerformanceFilters.length > 0 && !cpuPerformanceFilters.includes(performanceTier)) return false;
        if (cpuModelFilters.length > 0 && !cpuModelFilters.includes(modelFamily)) return false;
        return true;
      }

      if (activeCategory === "motherboard") {
        const manufacturer = normalizeBrandLabel(item.brand);
        const itemChipset = getDisplayChipsetValue(item);
        const itemFormFactor = getItemFormFactorFilterValue(item);
        const itemRamType = getItemRamTypeFilterValue(item);
        const itemWifi = getMotherboardWifiValue(item);
        const memorySlots = getMotherboardMemorySlots(item);
        const m2Slots = getMotherboardM2Slots(item);
        if (motherboardManufacturerFilters.length > 0 && !motherboardManufacturerFilters.includes(manufacturer)) return false;
        if (chipsetFilters.length > 0 && (!itemChipset || !chipsetFilters.includes(itemChipset))) return false;
        if (formFactorFilters.length > 0 && (!itemFormFactor || !formFactorFilters.includes(itemFormFactor))) return false;
        if (ramTypeFilters.length > 0 && (!itemRamType || !ramTypeFilters.includes(itemRamType))) return false;
        if (socketFilters.length > 0 && !socketFilters.includes(getItemSocketFilterValue(item))) return false;
        if (motherboardWifiFilter !== "Alla" && itemWifi !== motherboardWifiFilter) return false;
        if (memorySlots !== null && (memorySlots < motherboardMemorySlotsRange[0] || memorySlots > motherboardMemorySlotsRange[1])) return false;
        if (m2Slots !== null && (m2Slots < motherboardM2SlotsRange[0] || m2Slots > motherboardM2SlotsRange[1])) return false;
        return true;
      }

      if (activeCategory === "gpu") {
        const manufacturer = normalizeBrandLabel(item.brand);
        const vendor = getGpuChipVendor(item);
        const vram = getGpuVramGb(item);
        const length = getGpuLengthMm(item);
        if (gpuChipVendorFilter !== "Alla" && vendor !== gpuChipVendorFilter) return false;
        if (gpuPerformanceFilters.length > 0 && !gpuPerformanceFilters.includes(getItemGpuPerformanceClass(item))) return false;
        if (gpuManufacturerFilters.length > 0 && !gpuManufacturerFilters.includes(manufacturer)) return false;
        if (vram !== null && (vram < gpuVramRange[0] || vram > gpuVramRange[1])) return false;
        if (length !== null && (length < gpuLengthRange[0] || length > gpuLengthRange[1])) return false;
        return true;
      }

      if (activeCategory === "ram") {
        const manufacturer = normalizeBrandLabel(item.brand);
        const size = getRamSizeGb(item);
        const speed = getRamSpeedMhz(item);
        const cl = getRamClValue(item);
        const modules = getRamModulesValue(item);
        const type = getItemRamTypeFilterValue(item);
        if (ramMinimumSizeCard !== null && (size === null || size < ramMinimumSizeCard)) return false;
        if (ramTypeFilters.length > 0 && (!type || !ramTypeFilters.includes(type))) return false;
        if (ramManufacturers.length > 0 && !ramManufacturers.includes(manufacturer)) return false;
        if (size !== null && (size < ramSizeRange[0] || size > ramSizeRange[1])) return false;
        if (speed !== null && (speed < ramSpeedRange[0] || speed > ramSpeedRange[1])) return false;
        if (cl !== null && (cl < ramClRange[0] || cl > ramClRange[1])) return false;
        if (modules !== null && (modules < ramModulesRange[0] || modules > ramModulesRange[1])) return false;
        return true;
      }

      if (activeCategory === "storage") {
        const manufacturer = normalizeBrandLabel(item.brand);
        const size = getStorageSizeGb(item);
        const read = getStorageReadMb(item);
        const write = getStorageWriteMb(item);
        const formFactor = getStorageFormFactorValue(item);
        const iface = getStorageInterfaceValue(item);
        const typeLabel = getStorageTypeCardLabel(item);
        if (storageMinimumSizeCard !== null && (size === null || size < storageMinimumSizeCard)) return false;
        if (storageTypeFilters.length > 0 && !storageTypeFilters.includes(typeLabel)) return false;
        if (storageManufacturerFilters.length > 0 && !storageManufacturerFilters.includes(manufacturer)) return false;
        if (storageFormFactorFilters.length > 0 && (!formFactor || !storageFormFactorFilters.includes(formFactor))) return false;
        if (storageInterfaceFilters.length > 0 && (!iface || !storageInterfaceFilters.includes(iface))) return false;
        if (size !== null && (size < storageSizeRange[0] || size > storageSizeRange[1])) return false;
        if (read !== null && (read < storageReadRange[0] || read > storageReadRange[1])) return false;
        if (write !== null && (write < storageWriteRange[0] || write > storageWriteRange[1])) return false;
        return true;
      }

      /* Gäller de tre kategorier som delar tillverkarfiltret. */
      if (
        genericBrandFilters.length > 0 &&
        (activeCategory === "case" || activeCategory === "chassifan" || activeCategory === "networkcard") &&
        !genericBrandFilters.includes(normalizeBrandLabel(item.brand))
      ) {
        return false;
      }

      if (activeCategory === "case" && caseBoardSizeFilters.length > 0) {
        const storlekar = getCaseBoardSizes(item);
        if (!caseBoardSizeFilters.some((val) => storlekar.includes(val))) return false;
      }

      if (activeCategory === "chassifan") {
        const size = getChassiFanSizeMm(item);
        const rgb = /\bargb\b|\brgb\b/i.test(item.name);
        if (chassiFanSizeFilters.length > 0 && (size === null || !chassiFanSizeFilters.includes(`${size} mm`))) return false;
        if (chassiFanRgbFilter === "RGB" && !rgb) return false;
        if (chassiFanRgbFilter === "Utan RGB" && rgb) return false;
        return true;
      }

      if (activeCategory === "networkcard") {
        if (networkCardSlotFilters.length > 0 && !networkCardSlotFilters.includes(getNetworkCardSlot(item))) return false;
        return true;
      }

      if (activeCategory === "psu") {
        const manufacturer = normalizeBrandLabel(item.brand);
        const wattage = getItemPsuWattage(item);
        const rating = getItemPsuRating(item);
        const modular = getPsuModularOption(item);
        const atxStandard = getPsuAtxStandard(item);
        const formFactor = getPsuFormFactorValue(item);
        const length = getPsuLengthMm(item);
        const ratingRank = ["Bronze", "Silver", "Gold", "Platinum", "Titanium"];
        const requiredRatingIndex = psuMinimumRatingCard ? ratingRank.indexOf(psuMinimumRatingCard) : -1;
        const itemRatingIndex = ratingRank.indexOf(rating);
        if (psuMinimumWattCard !== null && (wattage === null || wattage < psuMinimumWattCard)) return false;
        if (requiredRatingIndex >= 0 && itemRatingIndex >= 0 && itemRatingIndex < requiredRatingIndex) return false;
        if (psuManufacturerFilters.length > 0 && !psuManufacturerFilters.includes(manufacturer)) return false;
        if (psuRatingFilters.length > 0 && (!rating || !psuRatingFilters.includes(rating))) return false;
        if (psuModularFiltersDetailed.length > 0 && !psuModularFiltersDetailed.includes(modular)) return false;
        if (psuAtxStandardFilters.length > 0 && (!atxStandard || !psuAtxStandardFilters.includes(atxStandard))) return false;
        if (psuFormFactorFilters.length > 0 && (!formFactor || !psuFormFactorFilters.includes(formFactor))) return false;
        if (wattage !== null && (wattage < psuWattageRange[0] || wattage > psuWattageRange[1])) return false;
        if (length !== null && (length < psuLengthRange[0] || length > psuLengthRange[1])) return false;
        return true;
      }

      if (activeCategory === "cooling") {
        const manufacturer = normalizeBrandLabel(item.brand);
        const type = getCoolingTypeValue(item);
        const height = getCoolingHeightMm(item);
        const sockets = getCoolingSocketLabels(item);
        if (coolingTypeFilter !== "Alla" && type !== coolingTypeFilter) return false;
        if (coolingManufacturerFilters.length > 0 && !coolingManufacturerFilters.includes(manufacturer)) return false;
        if (coolingSocketFilters.length > 0 && !coolingSocketFilters.every((socket) => sockets.includes(socket))) return false;
        if (height !== null && (height < coolingHeightRange[0] || height > coolingHeightRange[1])) return false;
        return true;
      }

      if (activeCategory === "case") {
        const itemFormFactor = getItemFormFactorFilterValue(item);
        if (formFactorFilters.length > 0 && (!itemFormFactor || !formFactorFilters.includes(itemFormFactor))) return false;
      }

      return true;
    });
  }, [
    endastILager,
    stockByItemId,
    valdSockelModerkort,
    valdSockelProcessor,
    items,
    activeBrand,
    searchTerm,
    activeCategory,
    priceRange,
    lowestOfferPriceByItemId,
    socketFilters,
    chipsetFilters,
    ramTypeFilters,
    formFactorFilters,
    storageTypeFilters,
    gpuPerformanceFilters,
    cpuPerformanceFilters,
    cpuModelFilters,
    gpuChipVendorFilter,
    gpuManufacturerFilters,
    motherboardManufacturerFilters,
    motherboardWifiFilter,
    motherboardMemorySlotsRange,
    motherboardM2SlotsRange,
    ramMinimumSizeCard,
    ramManufacturers,
    ramSizeRange,
    ramSpeedRange,
    ramClRange,
    ramModulesRange,
    storageMinimumSizeCard,
    storageManufacturerFilters,
    storageFormFactorFilters,
    storageInterfaceFilters,
    storageSizeRange,
    storageReadRange,
    storageWriteRange,
    psuMinimumWattCard,
    psuMinimumRatingCard,
    psuManufacturerFilters,
    psuRatingFilters,
    psuModularFiltersDetailed,
    psuAtxStandardFilters,
    psuFormFactorFilters,
    psuWattageRange,
    psuLengthRange,
    coolingTypeFilter,
    coolingManufacturerFilters,
    coolingSocketFilters,
    coolingHeightRange,
    genericBrandFilters,
    caseBoardSizeFilters,
    chassiFanSizeFilters,
    chassiFanRgbFilter,
    networkCardSlotFilters,
    gpuVramRange,
    gpuLengthRange,
  ]);

  const activeSort = tableSortByCategory[activeCategory];
  const itemIndexLookup = useMemo(() => Object.fromEntries(items.map((item, index) => [item.id, index])), [items]);

  const sortedItems = useMemo(() => {
    const direction = activeSort?.direction === "asc" ? 1 : -1;
    const getSortValue = (item: ComponentItem) => {
      switch (activeSort?.key) {
        case "price":
          return getComparablePrice(item, activeCategory);
        case "chipset":
          return getChipsetSortRank(getDisplayChipsetValue(item));
        /*
         * Saknat värde är null, inte noll.
         *
         * Med ?? 0 hamnade varje komponent utan uppgift överst vid
         * stigande sortering: "lägst CL" gav tre rader med streck innan
         * det första riktiga talet. Noll är ett värde, okänt är det inte.
         */
        /* Flest butiker med varan hemma först. */
        case "lager":
          return antalILager(item.id);
        case "speed":
          return getCpuSpeedGhz(item);
        case "cores":
          return getCpuCoreCount(item);
        case "vram":
          return getGpuVramGb(item);
        case "ramSize":
          return getRamSizeGb(item);
        case "ramSpeed":
          return getRamSpeedMhz(item);
        case "ramCl":
          return getRamClValue(item);
        case "storageSize":
          return getStorageSizeGb(item);
        case "read":
          return getStorageReadMb(item);
        case "write":
          return getStorageWriteMb(item);
        case "wattage":
          return getItemPsuWattage(item);
        case "coolingType":
          return getCoolingTypeValue(item) === "Vatten" ? 2 : 1;
        case "popularity":
        default:
          return getItemPopularityScore(item, activeCategory, itemIndexLookup[item.id] ?? 0);
      }
    };

    const saknas = (value: unknown) =>
      value === null ||
      value === undefined ||
      value === "" ||
      (typeof value === "number" && !Number.isFinite(value));

    return [...filteredItems].sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);

      /*
       * Okända värden ligger sist åt BÅDA hållen.
       *
       * Utan det här hamnade de överst vid stigande sortering och
       * längst ner vid fallande, alltså precis där man letar efter det
       * lägsta riktiga värdet. Den som sorterar på läshastighet vill se
       * diskar med känd läshastighet, inte de utan uppgift.
       */
      const aSaknas = saknas(aValue);
      const bSaknas = saknas(bValue);
      if (aSaknas && bSaknas) {
        return (itemIndexLookup[a.id] ?? 0) - (itemIndexLookup[b.id] ?? 0);
      }
      if (aSaknas) return 1;
      if (bSaknas) return -1;

      if (aValue === bValue) {
        return (itemIndexLookup[a.id] ?? 0) - (itemIndexLookup[b.id] ?? 0);
      }
      if (typeof aValue === "string" || typeof bValue === "string") {
        return String(aValue).localeCompare(String(bValue), "sv") * direction;
      }
      return ((aValue as number) - (bValue as number)) * direction;
    });
  }, [filteredItems, activeSort, activeCategory, itemIndexLookup, lowestOfferPriceByItemId]);

  /*
   * Tillbaka till trettio när urvalet ändras.
   *
   * Avsiktligt inte beroende av filteredItems i sig: den listan byter
   * identitet även när priserna kommer in från butiken i bakgrunden, och
   * då skulle kunden som just tryckt "Visa fler" kastas tillbaka. Antalet
   * räcker som signal - ett filter som byts utan att antalet ändras lämnar
   * bara fler rader framme än vanligt, vilket är det ofarliga felet.
   */
  useEffect(() => {
    setVisibleCount(ROWS_PER_PAGE);
  }, [activeCategory, searchTerm, sortedItems.length, activeSort]);

  const visibleItems = useMemo(() => sortedItems.slice(0, visibleCount), [sortedItems, visibleCount]);
  const hiddenItemCount = sortedItems.length - visibleItems.length;

  /*
   * INGEN BAKGRUNDSUPPDATERING PER KOMPONENT - OCH DET ÄR MED FLIT
   *
   * Här låg förut en kö som frågade /api/custom-build/catalog-offers en
   * gång per komponent i kategorin. Två saker var fel med den.
   *
   * Den frågade för mycket. Att öppna Chassi betydde 1 210 anrop, och
   * serverns spärr släpper igenom 120 per kvart. Anrop nummer 121 och
   * framåt fick "För många API-förfrågningar", och eftersom spärren
   * gäller hela /api/ slutade resten av sidan svara också - därav att
   * komponenterna ibland inte gick att hämta alls.
   *
   * Och den frågade i onödan. Båda vägarna läser samma tabell:
   * catalog-prices gör ett getOffersForItems för hela kategorin,
   * catalog-offers ett getOffersForItem för en post. Svaret per post kan
   * alltså inte innehålla något som bulksvaret inte redan gav. Det var
   * tusen anrop för att fråga om samma sak en gång till.
   *
   * Priset per post hämtas nu när kunden faktiskt öppnar en rad eller
   * butiksväljaren. Där behövs det: då vill hon se alla butiker, inte
   * bara det lägsta priset.
   */

  /* Kategorins egna mått. De vänder vid upprepat klick och visar pil. */
  const categorySortButtons = useMemo(() => {
    switch (activeCategory) {
      case "cpu":
        return [
          { key: "speed" as SortKey, label: "Hastighet", direction: "desc" as SortDirection },
          { key: "cores" as SortKey, label: "Kärnor", direction: "desc" as SortDirection },
        ];
      case "motherboard":
        return [
          { key: "chipset" as SortKey, label: "Chipset", direction: "desc" as SortDirection },
        ];
      case "gpu":
        return [
          { key: "vram" as SortKey, label: "Minne", direction: "desc" as SortDirection },
        ];
      case "ram":
        return [
          { key: "ramSpeed" as SortKey, label: "Hastighet", direction: "desc" as SortDirection },
          { key: "ramCl" as SortKey, label: "CL", direction: "asc" as SortDirection },
        ];
      case "storage":
        return [
          { key: "read" as SortKey, label: "Läs", direction: "desc" as SortDirection },
          { key: "write" as SortKey, label: "Skriv", direction: "desc" as SortDirection },
        ];
      case "psu":
        return [
          { key: "wattage" as SortKey, label: "Effekt", direction: "desc" as SortDirection },
        ];
      case "cooling":
        return [
          { key: "coolingType" as SortKey, label: "Typ", direction: "desc" as SortDirection },
        ];
      default:
        return [];
    }
  }, [activeCategory]);

  const tableSortButtons = useMemo(
    () => [...PRIMARY_SORTS, ...categorySortButtons],
    [categorySortButtons],
  );

  /*
   * Ett steg i bygget.
   *
   * En rad per vald komponent, aldrig samma namn två gånger. Förut stod
   * kategorin med sitt val på en rad OCH samma val en gång till i en
   * lista under - två rader som sa samma sak, plus en alltid synlig
   * räknare och två papperskorgar. Åtta valda komponenter blev en spalt
   * man fick leta i.
   *
   * Nu: kategorin är en rubrik, valen står under den, och knapparna
   * kommer fram när pekaren är på raden. Det som alltid syns är det man
   * läser - namn och pris. Det man ibland gör - ändra antal, ta bort -
   * finns där när man sträcker sig efter det.
   */
  const renderCategoryRow = (category: CategoryConfig, options?: { nested?: boolean }) => {
    const Icon = category.icon;
    const isActive = category.key === activeCategory;
    const val = bygge[category.key];
    const flera = tarFlera(category.key);
    const nested = options?.nested === true;
    const enheter = antalEnheter(val);

    return (
      <div
        key={category.key}
        className="cb-steg"
        data-aktiv={isActive ? "true" : "false"}
        data-klart={val.length > 0 ? "true" : "false"}
      >
        <button
          type="button"
          onClick={() => handleCategorySelect(category.key)}
          className="cb-steg__rubrik"
        >
          <span className="cb-steg__ikon">
            <Icon className={nested ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </span>
          <span className="cb-steg__namn">{category.label}</span>
          {/* Antalet bara när det är mer än ett. "1 st" bredvid en rad
              som redan visar en enda vara är ett ord utan innehåll. */}
          {flera && enheter > 1 ? <span className="cb-steg__antal">{enheter} st</span> : null}
        </button>

        {val.length === 0 ? (
          <button
            type="button"
            onClick={() => handleCategorySelect(category.key)}
            className="cb-steg__tom"
          >
            {category.description}
          </button>
        ) : (
          val.map(({ item, antal }) => (
            <div key={item.id} className="cb-val" data-flera={flera ? "true" : "false"}>
              <button
                type="button"
                onClick={() => handleCategorySelect(category.key)}
                className="cb-val__namn"
                title={item.name}
              >
                {item.name}
              </button>

              <div className="cb-val__rad">
                {/* Antalet i vila, räknaren när man pekar - i samma ruta, så
                    raden varken hoppar eller lägger räknaren över priset. */}
                {flera ? (
                  <span className="cb-val__kvantitet">
                    <span className="cb-val__antal">&times;{antal}</span>
                    <span className="cb-antal" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() =>
                          setBygge((prev) => medAndratAntal(prev, category.key, item.id, -1))
                        }
                        aria-label={`Färre ${item.name}`}
                      >
                        −
                      </button>
                      <span className="cb-antal__tal">{antal}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setBygge((prev) => medAndratAntal(prev, category.key, item.id, 1))
                        }
                        disabled={enheter >= MAX_ANTAL[category.key]}
                        aria-label={`Fler ${item.name}`}
                      >
                        +
                      </button>
                    </span>
                  </span>
                ) : null}

                <span className="cb-val__pris">
                  {formatPrice(getComparablePrice(item, category.key) * antal)} kr
                </span>

                <button
                  type="button"
                  onClick={() => setBygge((prev) => utanVal(prev, category.key, item.id))}
                  className="cb-val__bort"
                  aria-label={`Ta bort ${item.name}`}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}

        {flera && enheter >= MAX_ANTAL[category.key] ? (
          <p className="cb-steg__tak">Max {MAX_ANTAL[category.key]} st i det här steget.</p>
        ) : null}
      </div>
    );
  };

  /* Tillverkarna som faktiskt finns i den öppna kategorin. */
  const genericBrandOptions = useMemo(
    () =>
      Array.from(new Set(items.map((item) => normalizeBrandLabel(item.brand)).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "sv"),
      ),
    [items],
  );

  const caseBoardSizeOptions = useMemo(
    () => CASE_BOARD_SIZE_OPTIONS.filter((val) => items.some((item) => getCaseBoardSizes(item).includes(val))),
    [items],
  );

  const aktivaKolumner = KOLUMNER_PER_KATEGORI[activeCategory];
  const kategorinTarFlera = tarFlera(activeCategory);
  /* Taket gäller kategorin, så det är samma svar för alla trettio rader.
     Att räkna det per rad hade varit trettio gånger samma summa. */
  const kategorinFull = antalEnheter(bygge[activeCategory]) >= MAX_ANTAL[activeCategory];

  /* Antalet enheter, inte antalet rader: fem fläktar är fem tillägg. */
  const selectedExtraCount = OPTIONAL_CATEGORIES.reduce(
    (sum, category) => sum + antalEnheter(bygge[category.key]),
    0,
  );

  /*
   * Etiketterna kortas ner när de ritas, inte där de skrivs.
   *
   * "Välj processortillverkare" var en rubrik på egen rad och läste sig
   * som en instruktion. Bredvid sina egna knappar räcker "Tillverkare" -
   * att man ska välja framgår av att det står knappar där. Kortningen
   * sitter här och inte på de tolv anropsställena, så att ett nytt
   * filter får samma behandling utan att någon behöver tänka på det.
   */
  const kortEtikett = (label: string) =>
    label
      .replace(/^Välj din /i, "")
      .replace(/^Välj /i, "")
      .replace(/^Minsta storlek på /i, "Minst ")
      .replace(/^./, (c) => c.toUpperCase());

  const renderCardFilterGrid = (
    label: string,
    options: string[],
    isActive: (option: string) => boolean,
    onToggle: (option: string) => void,
  ) => {
    if (options.length === 0) return null;
    return (
      <div className="cb-snabbfilter">
        <span className="cb-snabbfilter__etikett">{kortEtikett(label)}</span>
        <div className="cb-snabbfilter__val">
          {options.map((option) => (
            <button
              key={`${label}-${option}`}
              type="button"
              onClick={() => onToggle(option)}
              className="cb-chip"
              data-aktiv={isActive(option) ? "true" : "false"}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderToggleChipGroup = (
    label: string,
    options: string[],
    selectedOptions: string[],
    onToggle: (option: string) => void
  ) => {
    if (options.length === 0) return null;
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={`${label}-${option}`}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedOptions.includes(option)
                  ? "bg-primary text-primary-foreground dark:bg-primary/15 dark:!text-white"
                  : "bg-foreground/[0.04] text-muted-foreground hover:bg-foreground/[0.06] dark:bg-background/70 dark:text-foreground dark:hover:bg-background/70"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderRangeFilter = (
    label: string,
    range: [number, number],
    bounds: { min: number; max: number },
    onChange: (value: [number, number]) => void,
    unit = "",
    step = 1
  ) => {
    if (bounds.max <= bounds.min) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">
            {range[0]}
            {unit} - {range[1]}
            {unit}
          </p>
        </div>
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={range[1]}
          onChange={(event) => onChange([bounds.min, Number(event.target.value)])}
          className="h-1 w-full accent-primary"
        />
      </div>
    );
  };

  const formatCapacityCardLabel = (value: number) => {
    if (value >= 1024) {
      return `${value / 1024}TB`;
    }
    return `${value}GB`;
  };
  /*
   * Totalen räknar antalet, och räknar med samma pris som raderna visar.
   *
   * Förut lästes item.price rakt, alltså katalogens riktpris, medan varje
   * rad i bygget visade getComparablePrice - butikspriset när ett hittats.
   * De två siffrorna kunde skilja hundralappar, och det var totalen som
   * följde med in i offertmejlet.
   */
  const totalPrice = (Object.keys(bygge) as CategoryKey[]).reduce(
    (sum, key) =>
      sum +
      bygge[key].reduce(
        (delsumma, { item, antal }) => delsumma + getComparablePrice(item, key) * antal,
        0,
      ),
    0,
  );
  /*
   * Bara de obligatoriska stegen räknas.
   *
   * allComponentsSelected öppnar offertknappen. Räknades de valfria
   * stegen med skulle knappen förbli låst för varje kund som inte
   * dessutom valde chassifläktar och nätverkskort, alltså för nästan
   * alla. Fläktarna syns fortfarande i sammanfattningen och i totalen
   * när de valts - de är bara inte ett krav.
   */
  const selectedCount = REQUIRED_CATEGORIES.filter(
    (category) => bygge[category.key].length > 0,
  ).length;
  const allComponentsSelected = selectedCount === REQUIRED_CATEGORIES.length;
  const activeCategoryGroup = getCategoryGroup(activeCategory);
  const activeCategoryIndex = activeCategoryGroup.findIndex((category) => category.key === activeCategory);
  const nextCategory = activeCategoryIndex >= 0 ? activeCategoryGroup[activeCategoryIndex + 1] : null;
  const isLastCategory = activeCategoryIndex === activeCategoryGroup.length - 1;
  const nextBubbleLabel = nextCategory?.label ?? "Sammanfattning";
  const showNextBubble = Boolean(
    bygge[activeCategory].length > 0 && (nextCategory || isLastCategory) && !isSummaryVisible
  );
  const getStoreCacheKey = (categoryKey: CategoryKey, itemId: string) => `${categoryKey}:${itemId}`;
  const expandedStoreCacheKey =
    expandedItemId && expandedItemCategory ? getStoreCacheKey(expandedItemCategory, expandedItemId) : "";
  const expandedStoreSnapshot = expandedStoreCacheKey ? storePickerCache[expandedStoreCacheKey] : undefined;
  /*
   * En slutsåld vara är inte en vara vi inte hittat.
   *
   * Slutsålda erbjudanden filtrerades bort helt, så panelen sa "Inga
   * butiksträffar hittades för komponenten" om ett minne som Proshop
   * mycket väl säljer men just nu inte har hemma. Det är två olika
   * besked, och det ena får kunden att tro att sidan är trasig.
   *
   * Priset påverkas inte: getLowestPricedStoreOfferValue räknar bara
   * med det som går att köpa, och canSelectStoreOffer vägrar fortfarande
   * välja en butik som inte har varan.
   */
  const isDisplayableStoreOffer = (offer: StoreOffer) => {
    if (!offer || !offer.product_url) return false;
    return (
      offer.status === "available" ||
      offer.status === "linked_no_price" ||
      offer.status === "unavailable"
    );
  };

  /* Det som går att köpa först. Rubriken lovar billigast överst, och en
     slutsåld hundralapp är inte billigast, den är inte till salu. */
  const expandedStoreOffers = (
    Array.isArray(expandedStoreSnapshot?.offers)
      ? expandedStoreSnapshot.offers.filter((offer) => isDisplayableStoreOffer(offer))
      : []
  )
    .slice()
    .sort((a, b) => {
      const aSlut = a.status === "unavailable" ? 1 : 0;
      const bSlut = b.status === "unavailable" ? 1 : 0;
      if (aSlut !== bSlut) return aSlut - bSlut;
      const aPris = Number(a.total_price ?? a.price);
      const bPris = Number(b.total_price ?? b.price);
      if (!Number.isFinite(aPris)) return 1;
      if (!Number.isFinite(bPris)) return -1;
      return aPris - bPris;
    });

  const getNextCategoryKey = (currentCategory: CategoryKey) => {
    const group = getCategoryGroup(currentCategory);
    const currentIndex = group.findIndex((category) => category.key === currentCategory);
    if (currentIndex < 0 || currentIndex >= group.length - 1) return null;
    return group[currentIndex + 1].key;
  };

  const handleNextBubbleClick = () => {
    if (nextCategory) {
      setActiveCategory(nextCategory.key);
      return;
    }

    const summary = document.getElementById("build-summary");
    summary?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToCategoryPicker = () => {
    const target = document.getElementById("component-picker");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const advanceAfterSelection = (currentCategory: CategoryKey) => {
    const nextCategoryKey = getNextCategoryKey(currentCategory);
    if (nextCategoryKey) {
      setActiveCategory(nextCategoryKey);
      setTimeout(() => {
        scrollToCategoryPicker();
      }, 120);
      return;
    }
    const summary = document.getElementById("build-summary");
    summary?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleStorePickerClose = () => {
    setExpandedItemId("");
    setExpandedItemCategory(null);
    setStorePickerComponent(null);
    setStorePickerLoading(false);
    setStorePickerError("");
  };

  const openStorePickerForComponent = async (categoryKey: CategoryKey, item: ComponentItem) => {
    const cacheKey = getStoreCacheKey(categoryKey, item.id);
    const isSameExpanded = expandedItemId === item.id && expandedItemCategory === categoryKey;
    if (isSameExpanded) {
      handleStorePickerClose();
      return;
    }
    setExpandedItemId(item.id);
    setExpandedItemCategory(categoryKey);
    setStorePickerComponent(item);
    setStorePickerError("");
    /*
     * Vilken uppslagning som är den aktuella.
     *
     * Öppnar man en komponent utan butiker och sedan snabbt en med, hann
     * det första svaret fram efteråt och skrev "Inga butiksträffar
     * hittades" ovanför två butiker som stod där och syntes. Svaret gällde
     * en annan vara.
     */
    butiksuppslagRef.current += 1;
    const uppslag = butiksuppslagRef.current;
    if (!supportsStoreOffersForCategory(categoryKey)) {
      setStorePickerLoading(false);
      return;
    }

    const cachedResult = storePickerCache[cacheKey];
    const cachedOffers = Array.isArray(cachedResult?.offers)
      ? cachedResult.offers.filter((offer) => isDisplayableStoreOffer(offer))
      : [];
    if (cachedResult && cachedOffers.length > 0) {
      if (typeof cachedResult.image_url === "string" && cachedResult.image_url.trim()) {
        setImageUrlByItemId((prev) => ({
          ...prev,
          [item.id]:
            prev[item.id] ||
            getResolvedComponentImage(categoryKey, item, null) ||
            cachedResult.image_url!.trim(),
        }));
      }
      const cachedLowestPricedOffer = getLowestPricedStoreOfferValue(cachedOffers);
      if (Number.isFinite(cachedLowestPricedOffer) && cachedLowestPricedOffer > 0) {
        setLowestOfferPriceByItemId((prev) => ({
          ...prev,
          [item.id]: Math.max(0, Math.round(cachedLowestPricedOffer)),
        }));
        setPriceSourceByItemId((prev) => ({
          ...prev,
          [item.id]: "live-offer",
        }));
        setItemsWithoutStorePrice((prev) => {
          if (!prev[item.id]) return prev;
          const nextState = { ...prev };
          delete nextState[item.id];
          return nextState;
        });
      }
      setStorePickerLoading(false);
      return;
    }

    setStorePickerLoading(true);
    try {
      const endpoint = `${normalizedApiBase}/api/custom-build/catalog-offers?item_id=${encodeURIComponent(
        item.id
      )}`;
      const response = await fetch(endpoint);
      const data = (await response.json().catch(() => ({}))) as CatalogItemOffersResponse & {
        error?: { message?: string } | string;
      };
      if (!response.ok) {
        const fallbackMessage =
          typeof data?.error === "string"
            ? data.error
            : data?.error?.message || "Kunde inte hämta butikpriser just nu.";
        throw new Error(fallbackMessage);
      }
      const offers = Array.isArray(data?.offers) ? data.offers.filter((offer) => isDisplayableStoreOffer(offer)) : [];
      const lowestPricedOffer = getLowestPricedStoreOfferValue(offers);
      const hasPricedOffer = Number.isFinite(lowestPricedOffer) && Number(lowestPricedOffer) > 0;
      applyStoreOffersSnapshotToItem(item, categoryKey, data);
      if (uppslag !== butiksuppslagRef.current) return;
      if (offers.length === 0) {
        setStorePickerError("Inga butiksträffar hittades för komponenten.");
      }
    } catch (error) {
      if (uppslag !== butiksuppslagRef.current) return;
      setStorePickerError(
        error instanceof Error ? error.message : "Kunde inte hämta butikpriser just nu."
      );
    } finally {
      if (uppslag === butiksuppslagRef.current) {
        setStorePickerLoading(false);
      }
    }
  };

  const selectComponentAndAdvance = (
    categoryKey: CategoryKey,
    component: ComponentItem,
    selectedOffer?: StoreOffer
  ) => {
    const fallbackLowestPrice = lowestOfferPriceByItemId[component.id];
    const normalizedPrice = Math.max(
      0,
      Math.round(
        selectedOffer?.total_price ??
          selectedOffer?.price ??
          (typeof fallbackLowestPrice === "number" && Number.isFinite(fallbackLowestPrice)
            ? fallbackLowestPrice
            : component.price ?? 0)
      )
    );
    const selectedComponent: ComponentItem = {
      ...component,
      price: normalizedPrice,
      selectedStore: selectedOffer?.store || undefined,
      selectedCurrency: selectedOffer?.currency || "SEK",
      selectedProductUrl: selectedOffer?.product_url || null,
      selectedTotalPrice:
        selectedOffer?.total_price !== undefined && selectedOffer?.total_price !== null
          ? Math.max(0, Math.round(selectedOffer.total_price))
          : null,
    };
    setBygge((prev) => medTillagd(prev, categoryKey, selectedComponent));
    if (normalizedPrice > 0) {
      setLowestOfferPriceByItemId((prev) => ({ ...prev, [component.id]: normalizedPrice }));
    }
    handleStorePickerClose();
    /*
     * Ingen automatisk framflyttning när kategorin tar flera.
     *
     * Den som just lade till sin första av fem fläktar ska inte kastas
     * vidare till nästa steg och få leta tillbaka fyra gånger.
     */
    if (!tarFlera(categoryKey)) {
      advanceAfterSelection(categoryKey);
    }
  };

  const handleSelectWithoutStore = () => {
    if (!expandedItemCategory || !storePickerComponent) return;
    selectComponentAndAdvance(expandedItemCategory, storePickerComponent);
  };

  const handleCategorySelect = (key: CategoryKey) => {
    handleStorePickerClose();
    /* Klickar man sig hit från sammanfattningen ska listan inte vara
       hopfälld när man kommer fram. */
    if (OPTIONAL_CATEGORIES.some((category) => category.key === key)) {
      setExtraOpen(true);
    }
    setActiveCategory(key);
    setMobileSidebarOpen(false);
    scrollToCategoryPicker();
  };

  const getStoreOfferStatusLabel = (offer: StoreOffer, item: ComponentItem, category: CategoryKey) => {
    if (offer.status === "available" && Number.isFinite(offer.total_price ?? offer.price)) {
      return formatCurrencyPrice(Number(offer.total_price ?? offer.price), offer.currency || "SEK");
    }
    if (offer.status === "linked_no_price") {
      if (category === "ram") {
        const fallbackPrice = getComparablePrice(item, category);
        if (Number.isFinite(fallbackPrice) && fallbackPrice > 0) {
          return `Ca ${formatPrice(fallbackPrice)} kr`;
        }
      }
      return "Pris saknas";
    }
    if (offer.status === "search_only") return "Sök i butik";
    if (offer.status === "unavailable") return "Ej tillgänglig";
    if (offer.status === "error") return "Kunde inte läsa";
    return "Ingen träff";
  };

  /*
   * Lagerstatus skild från priset.
   *
   * getStoreOfferStatusLabel returnerar antingen priset eller ett
   * statusord i samma fält, så butiksraden kunde visa det ena eller det
   * andra men aldrig båda. Kunden vill veta bådadera: vad det kostar och
   * om det finns hemma.
   */
  const getStoreStockLabel = (offer: StoreOffer) => {
    if (offer.status !== "available") {
      if (offer.status === "unavailable") return { text: "Slut", tone: "slut" };
      if (offer.status === "search_only") return { text: "Sök i butik", tone: "okant" };
      if (offer.status === "linked_no_price") return { text: "Pris saknas", tone: "okant" };
      return { text: "Ingen träff", tone: "okant" };
    }
    const availability = String(offer.availability || "").toLowerCase();
    if (availability.includes("out") || availability.includes("slut")) return { text: "Slut", tone: "slut" };
    if (availability.includes("in_stock") || availability.includes("lager")) return { text: "I lager", tone: "lager" };
    return { text: "Tillgänglig", tone: "lager" };
  };

  const canSelectStoreOffer = (offer: StoreOffer) =>
    offer.status === "available" && Number.isFinite(offer.total_price ?? offer.price);


  const updateOfferField = (field: keyof typeof initialOfferForm) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setOfferForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOfferSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setOfferError("");

    if (!allComponentsSelected) {
      setOfferStatus("error");
      setOfferError("Välj en komponent i varje kategori innan du skickar offertförfrågan.");
      return;
    }

    const trimmedName = offerForm.name.trim();
    const trimmedEmail = offerForm.email.trim();
    const trimmedNotes = offerForm.notes.trim();

    if (!trimmedName) {
      setOfferStatus("error");
      setOfferError("Ange ditt namn så att vi kan återkomma.");
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setOfferStatus("error");
      setOfferError("Ange en giltig e-postadress.");
      return;
    }

    /*
     * En post per val, med antal och med priset raden visar.
     *
     * Antalet måste med: "Arctic P12" i en offert på fem fläktar är en
     * offert Sahran får ringa upp kunden om.
     */
    const components = CATEGORY_LIST.flatMap((category) =>
      bygge[category.key].map(({ item, antal }) => ({
        category: category.label,
        name: item.name,
        price: getComparablePrice(item, category.key),
        quantity: antal,
      })),
    );

    const hasSelection = components.length > 0;
    const shareUrl = hasSelection
      ? `${window.location.origin}/custom-bygg?b=${encodeBuildSelection(bygge)}`
      : `${window.location.origin}/custom-bygg`;

    setOfferStatus("sending");

    let timeoutId: number | undefined;

    try {
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${normalizedApiBase}/api/offer-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: offerForm.phone.trim(),
          notes: trimmedNotes,
          totalPrice,
          components,
          shareUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Kunde inte skicka offertförfrågan.");
      }

      setOfferStatus("sent");
      setOfferForm(initialOfferForm);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    } catch (error) {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      setOfferStatus("error");
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "Förfrågan tog för lång tid. Försök igen om en stund."
          : error instanceof Error
            ? error.message
            : "Kunde inte skicka offertförfrågan.";
      setOfferError(message);
    }
  };

  const handleShareBuild = async () => {
    const hasSelection = (Object.keys(bygge) as CategoryKey[]).some(
      (key) => bygge[key].length > 0,
    );
    const shareUrl = hasSelection
      ? `${window.location.origin}/custom-bygg?b=${encodeBuildSelection(bygge)}`
      : `${window.location.origin}/custom-bygg`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus("L\u00e4nk kopierad till urklipp.");
    } catch (error) {
      window.prompt("Kopiera l\u00e4nken:", shareUrl);
      setShareStatus("L\u00e4nk redo att kopieras.");
    } finally {
      setTimeout(() => setShareStatus(""), 3000);
    }
  };

  return (
    <PageShell>
      <Dialog
        open={offerOpen}
        onOpenChange={(open) => {
          setOfferOpen(open);
          if (!open) {
            setOfferStatus("idle");
            setOfferError("");
          }
        }}
      >
        {offerOpen ? (
          <DialogContent className="max-w-lg bg-background/70">
            <DialogHeader>
              <DialogTitle>Offertförfrågan</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Fyll i dina uppgifter så återkommer vi med offert och leveranstid.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleOfferSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="offer-name">Namn</label>
                <input
                  id="offer-name"
                  type="text"
                  value={offerForm.name}
                  onChange={updateOfferField("name")}
                  placeholder="For- och efternamn"
                  className="w-full rounded-lg border border-foreground/10 bg-background/70 px-4 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="offer-email">E-post</label>
                <input
                  id="offer-email"
                  type="email"
                  value={offerForm.email}
                  onChange={updateOfferField("email")}
                  placeholder="namn@exempel.se"
                  className="w-full rounded-lg border border-foreground/10 bg-background/70 px-4 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="offer-phone">Telefon (valfritt)</label>
                <input
                  id="offer-phone"
                  type="text"
                  value={offerForm.phone}
                  onChange={updateOfferField("phone")}
                  placeholder="07x xxx xx xx"
                  className="w-full rounded-lg border border-foreground/10 bg-background/70 px-4 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="offer-notes">Kommentar (valfritt)</label>
                <textarea
                  id="offer-notes"
                  value={offerForm.notes}
                  onChange={updateOfferField("notes")}
                  placeholder="Beskriv önskemål eller annat"
                  className="min-h-[120px] w-full rounded-lg border border-foreground/10 bg-background/70 px-4 py-2 text-sm"
                />
              </div>
              {!allComponentsSelected ? (
                <p className="text-sm text-amber-600">
                  Välj en komponent i varje kategori innan du kan skicka offertförfrågan.
                </p>
              ) : null}
              {offerError ? <p className="text-sm text-red-600">{offerError}</p> : null}
              {offerStatus === "sent" ? (
                <p className="text-sm text-emerald-600">Tack! Vi har tagit emot din offertförfrågan.</p>
              ) : null}
              <button
                type="submit"
                disabled={offerStatus === "sending" || !allComponentsSelected}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-secondary hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {offerStatus === "sending" ? "Skickar..." : "Skicka offertförfrågan"}
              </button>
            </form>
          </DialogContent>
        ) : null}
      </Dialog>
      {/* Stor bildvisning. Vit yta och mörk text, så att stängknappen syns
          mot det vita och fotot inte får en kant. */}
      <Dialog open={storBild !== null} onOpenChange={(open) => (open ? null : setStorBild(null))}>
        {storBild ? (
          <DialogContent className="max-w-4xl border-0 bg-white p-6 text-slate-900 sm:p-8">
            <DialogTitle className="pr-8 text-base font-semibold text-slate-900">
              {storBild.alt}
            </DialogTitle>
            <DialogDescription className="sr-only">Produktbild i full storlek.</DialogDescription>
            <div className="cb-storbild">
              <img src={storBild.src} alt={storBild.alt} decoding="async" />
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
      <main className="flex-1">
        {/* Banderollen var ett eget mörkt skifferband tvärs över sidan,
            i en gråblå ton som inte fanns någon annanstans i butiken.
            Nu är det samma banderoll som resten av undersidorna, med
            fotot av ett moderkort bakom - och bilden på en färdig maskin
            står kvar, men fritt i rummet i stället för i en rundad ram. */}
        <PageHero
          sandboxId="custom-hero"
          image={PAGE_BANNERS.customBuild.image}
          accent={PAGE_BANNERS.customBuild.accent}
          breadcrumb={[{ label: "Hem", href: "/" }, { label: "Custom bygg" }]}
          eyebrow="Custom bygg"
          title="Bygg din drömdator, din väg"
          lede="Välj komponenter som passar din budget, dina favoritspel och din stil. Vi bygger, testar och levererar ett färdigt bygge."
          facts={["Komplett montering ingår", "Provkörd innan leverans", "Offert innan du beställer"]}
          actions={
            <>
              <a href="#bygg" className="btn-primary">
                Börja bygga
              </a>
              <Link to="/products" className="btn-secondary">
                Se färdiga datorer
              </Link>
            </>
          }
          /* Ingen produktbild bredvid rubriken - se samma kommentar i
             Products.tsx. Fotot var inte frilagt, så det låg som en
             vit rektangel ovanpå banderollens egen bild. */
        />

        <section id="bygg" className="bg-foreground/[0.04] text-foreground dark:bg-background dark:text-foreground">
          <div className="container mx-auto px-4 py-10 sm:py-12 lg:py-16">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Välj komponenter</p>
                <h2 className="text-2xl sm:text-3xl font-bold mt-3">Bygg ditt system steg för steg</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Klicka på en kategori till vänster för att se rekommenderade komponenter och filtrera efter märke.
                </p>
              </div>
              <div className="rounded-2xl border border-foreground/10 bg-background/70 px-4 py-3 text-sm text-muted-foreground shadow-sm dark:border-foreground/10 dark:bg-background/70 dark:text-muted-foreground">
                {selectedCount} av {REQUIRED_CATEGORIES.length} komponenter valda · Totalt {formatPrice(totalPrice)} kr
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 lg:hidden mb-4">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg border border-foreground/10 bg-background/70 px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-secondary hover:text-primary dark:border-foreground/10 dark:bg-background dark:text-foreground"
              >
                Komponenter
                <span className="text-xs text-muted-foreground">
                  {mobileSidebarOpen ? "Dölj" : "Visa"}
                </span>
              </button>
            </div>

            {/* Ingen items-start här. Spalterna ska sträcka sig till
                radens höjd, annars har det klistrade innehållet ingen
                plats att glida i och står stilla. */}
            {/* Två spalter, inte tre. Bygget och priserna bor i samma
                lista till vänster, och mittenspalten växer från omkring
                680 till drygt 1 000 pixlar - komponentnamnen får plats på
                en rad och specifikationerna behöver inte kapas. */}
            <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
              <aside className={`${mobileSidebarOpen ? "block" : "hidden"} lg:block`}>
                {/* h-full med flit. Det klistrade kortets rörelseutrymme
                    bestäms av FÖRÄLDERNS höjd, inte av spaltens. Utan den
                    här raden är blocket bara så högt som sitt innehåll, och
                    kortet fastnar i 252 px innan det följer med ändå. */}
                <div className="space-y-4 lg:h-full">
                  {/* Bara steglistan är klistrad. Tillsammans med tipsrutan
                      blev blocket 866 px högt - högre än fönstret minus
                      sidhuvudet, och då syns aldrig slutet av det. Tipsrutan
                      får skrolla förbi som vanligt innehåll. */}
                  <div
                    id="build-summary"
                    /* Ogenomskinlig botten, inte 70 procent. Rutan är
                       klistrad, och innehållet som rullar förbi under den
                       lyste igenom: tipsrutans text låg ovanpå totalen och
                       offertknappen och gjorde båda oläsliga. */
                    className="rounded-2xl border border-foreground/10 bg-background p-4 shadow-sm dark:border-foreground/10 dark:bg-background scroll-mt-24 lg:sticky lg:top-24"
                  >
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Ditt bygge</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {selectedCount} av {REQUIRED_CATEGORIES.length} valda
                      </p>
                      <div className="cb-forlopp mt-2">
                        <div
                          className="cb-forlopp__fyllt"
                          style={{ width: `${(selectedCount / REQUIRED_CATEGORIES.length) * 100}%` }}
                        />
                      </div>
                      <div className="mt-4 space-y-1">
                        {REQUIRED_CATEGORIES.map((category) => renderCategoryRow(category))}

                        <div className="rounded-xl border border-dashed border-foreground/15 bg-foreground/[0.02] dark:bg-background/40">
                          <button
                            type="button"
                            onClick={() => setExtraOpen((open) => !open)}
                            aria-expanded={extraOpen}
                            className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                          >
                            <span>
                              <span className="block text-sm font-semibold text-foreground">Extra komponenter</span>
                              <span className="block text-xs text-muted-foreground">
                                {selectedExtraCount > 0
                                  ? `${selectedExtraCount} tillagd${selectedExtraCount === 1 ? "" : "a"}`
                                  : "Valfritt - fläktar och nätverkskort"}
                              </span>
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${extraOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                          {extraOpen ? (
                            <div className="space-y-2 border-t border-foreground/10 px-2 pb-2 pt-2">
                              {OPTIONAL_CATEGORIES.map((category) => renderCategoryRow(category, { nested: true }))}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-foreground/10 pt-3">
                        <span className="text-sm text-muted-foreground">Totalt</span>
                        <span className="text-lg font-bold tabular-nums text-foreground">
                          {formatPrice(totalPrice)} kr
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOfferOpen(true)}
                        disabled={!allComponentsSelected}
                        className="mt-3 w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Skicka offertförfrågan
                      </button>
                      {!allComponentsSelected ? (
                        <p className="mt-2 text-xs text-amber-600">
                          Välj alla komponenter innan du skickar offertförfrågan.
                        </p>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleShareBuild}
                        className="mt-2 w-full rounded-lg border border-primary px-6 py-2.5 font-semibold text-primary transition-colors hover:border-secondary hover:bg-secondary hover:text-white"
                      >
                        Spara build
                      </button>
                      {shareStatus ? (
                        <p className="mt-2 text-xs text-muted-foreground">{shareStatus}</p>
                      ) : null}
                  </div>
                </div>
              </aside>

              <div className="space-y-6 self-start">
                <div
                  id="component-picker"
                  className="rounded-2xl border border-foreground/10 bg-background/70 p-6 shadow-sm dark:border-foreground/10 dark:bg-background/80"
                >
                  {/*
                    * Rubrik, beskrivning och sökruta på en rad.
                    *
                    * "VALD KATEGORI" över "CPU" över "Hjärnan i datorn" tog
                    * hundratrettio pixlar för att säga det vänsterspalten
                    * redan visar med markerad ruta. Kvar står namnet, och
                    * bredvid det antalet träffar - som aldrig stod någonstans
                    * trots att listan kan vara tolvhundra poster lång.
                    */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-baseline gap-3">
                      <h3 className="text-xl font-bold">{activeConfig?.label}</h3>
                      <span className="text-sm text-muted-foreground">
                        {sortedItems.length.toLocaleString("sv-SE")}
                        {sortedItems.length === 1 ? " komponent" : " komponenter"}
                      </span>
                    </div>
                    <input
                      type="search"
                      placeholder="Sök komponent..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="w-full sm:w-64 rounded-lg bg-background/70 border border-foreground/20 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  {/* Reglaget står på samma rad som sin etikett, som
                      snabbfiltren under. En egen rubrikrad för ett enda
                      reglage var en rad för mycket. */}
                  <div className="mt-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="cb-snabbfilter__etikett">Högst</span>
                      <input
                        type="range"
                        min={priceBounds.min}
                        max={priceBounds.max}
                        step="10"
                        value={priceRange[1]}
                        onChange={(event) =>
                          setPriceRange([priceRange[0], parseInt(event.target.value)])
                        }
                        className="h-1 w-full max-w-[220px] accent-primary"
                      />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <label htmlFor="custom-price-max" className="sr-only">
                          Maxpris
                        </label>
                        <input
                          id="custom-price-max"
                          type="number"
                          inputMode="numeric"
                          min={priceBounds.min}
                          max={priceBounds.max}
                          value={priceRange[1]}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value);
                            const clamped = Number.isFinite(nextValue)
                              ? Math.min(priceBounds.max, Math.max(priceBounds.min, nextValue))
                              : priceBounds.max;
                            setPriceRange([priceRange[0], clamped]);
                          }}
                          className="w-20 rounded-md border border-foreground/20 bg-background/70 px-2 py-1 text-right text-xs text-foreground focus:border-primary focus:outline-none"
                        />
                        <span>kr</span>
                      </div>

                      {/* Lagerfiltret står här och inte bland de detaljerade.
                          Det är den vanligaste frågan en kund har - går den
                          att få hem - och ska inte ligga bakom ett utfäll. */}
                      <button
                        type="button"
                        onClick={() => setEndastILager((pa) => !pa)}
                        className="cb-chip ml-auto"
                        data-aktiv={endastILager ? "true" : "false"}
                        aria-pressed={endastILager}
                      >
                        <span className="cb-lager__ruta" data-lager="ja" aria-hidden="true" />
                        Endast i lager
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">
                    {activeCategory === "cpu"
                      ? (
                        <>
                          {renderCardFilterGrid("Välj processortillverkare", CPU_VENDOR_CARD_OPTIONS, (option) => activeBrand === option, (option) => setActiveBrand(option))}
                          {renderCardFilterGrid("Välj din prestandanivå", CPU_PERFORMANCE_OPTIONS, (option) => cpuPerformanceFilters.includes(option), (option) => toggleArrayFilter(option, setCpuPerformanceFilters))}
                        </>
                      )
                      : null}
                    {activeCategory === "gpu"
                      ? (
                        <>
                          {renderCardFilterGrid("Välj chiptillverkare", GPU_VENDOR_CARD_OPTIONS, (option) => gpuChipVendorFilter === option, (option) => setGpuChipVendorFilter(option))}
                          <div>
                            <span className="cb-snabbfilter__etikett">Prestandaklass</span>
                            <div className="cb-klasser">
                              {gpuPerformanceFilterOptions.map((option) => (
                                <button
                                  key={`klass-${option}`}
                                  type="button"
                                  onClick={() => toggleArrayFilter(option, setGpuPerformanceFilters)}
                                  className="cb-klass"
                                  data-aktiv={gpuPerformanceFilters.includes(option) ? "true" : "false"}
                                >
                                  <span className="cb-klass__namn">{option}</span>
                                  <span className="cb-klass__kretsar">
                                    {(gpuKretsarPerKlass.get(option) || []).join(", ") || "—"}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )
                      : null}
                    {activeCategory === "ram"
                      ? (
                        <>
                          {renderCardFilterGrid("Minsta storlek på minne", RAM_SIZE_CARD_OPTIONS.map((value) => `${value}GB`), (option) => ramMinimumSizeCard === Number(option.replace("GB", "")), (option) => {
                            const next = Number(option.replace("GB", ""));
                            setRamMinimumSizeCard((prev) => (prev === next ? null : next));
                          })}
                          {renderCardFilterGrid("Typ", RAM_TYPE_CARD_OPTIONS, (option) => ramTypeFilters.includes(option), (option) => toggleArrayFilter(option, setRamTypeFilters))}
                        </>
                      )
                      : null}
                    {activeCategory === "storage"
                      ? (
                        <>
                          {renderCardFilterGrid("Storlek", STORAGE_SIZE_CARD_OPTIONS.map((value) => formatCapacityCardLabel(value)), (option) => storageMinimumSizeCard === (option.endsWith("TB") ? Number(option.replace("TB", "")) * 1024 : Number(option.replace("GB", ""))), (option) => {
                            const next = option.endsWith("TB") ? Number(option.replace("TB", "")) * 1024 : Number(option.replace("GB", ""));
                            setStorageMinimumSizeCard((prev) => (prev === next ? null : next));
                          })}
                          {renderCardFilterGrid("Typ", STORAGE_TYPE_CARD_OPTIONS, (option) => storageTypeFilters.includes(option), (option) => toggleArrayFilter(option, setStorageTypeFilters))}
                        </>
                      )
                      : null}
                    {activeCategory === "psu"
                      ? (
                        <>
                          {renderCardFilterGrid("Välj minsta effekt", PSU_WATTAGE_CARD_OPTIONS.map((value) => (value >= 1200 ? "1200W+" : `${value}W`)), (option) => {
                            const next = option === "1200W+" ? 1200 : Number(option.replace("W", ""));
                            return psuMinimumWattCard === next;
                          }, (option) => {
                            const next = option === "1200W+" ? 1200 : Number(option.replace("W", ""));
                            setPsuMinimumWattCard((prev) => (prev === next ? null : next));
                          })}
                          {renderCardFilterGrid("Välj 80-plus certifiering", PSU_MIN_RATING_CARD_OPTIONS, (option) => psuMinimumRatingCard === option, (option) => setPsuMinimumRatingCard((prev) => (prev === option ? null : option)))}
                        </>
                      )
                      : null}
                    {activeCategory === "cooling"
                      ? renderCardFilterGrid("Välj kylningstyp", COOLING_TYPE_CARD_OPTIONS, (option) => coolingTypeFilter === option, (option) => setCoolingTypeFilter((prev) => (prev === option ? "Alla" : option as "Luft" | "Vatten")))
                      : null}
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setShowDetailedFilters((prev) => !prev)}
                        className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Detaljerat filter {showDetailedFilters ? "▴" : "▾"}
                      </button>
                      {hasActiveAdvancedFilters ? (
                        <button
                          type="button"
                          onClick={clearAdvancedFilters}
                          className="text-xs font-semibold text-muted-foreground transition-colors hover:text-primary dark:text-muted-foreground dark:hover:text-white"
                        >
                          Rensa filter
                        </button>
                      ) : null}
                    </div>
                    {showDetailedFilters ? (
                      <div className="mt-4 space-y-5">
                        {activeCategory === "cpu" ? (
                          <>
                            {renderToggleChipGroup("Modell", CPU_MODEL_OPTIONS.filter((option) => items.some((item) => getCpuModelFamily(item) === option)), cpuModelFilters, (option) => toggleArrayFilter(option, setCpuModelFilters))}
                            {renderToggleChipGroup("Socket", socketFilterOptions, socketFilters, (option) => toggleArrayFilter(option, setSocketFilters))}
                          </>
                        ) : null}
                        {activeCategory === "motherboard" ? (
                          <>
                            {renderToggleChipGroup("Tillverkare", motherboardManufacturerOptions, motherboardManufacturerFilters, (option) => toggleArrayFilter(option, setMotherboardManufacturerFilters))}
                            {renderToggleChipGroup("Formfaktor", MOTHERBOARD_FORM_FACTOR_OPTIONS.filter((option) => motherboardFormFactorOptions.includes(option)), formFactorFilters, (option) => toggleArrayFilter(option, setFormFactorFilters))}
                            {renderToggleChipGroup("Socket", socketFilterOptions, socketFilters, (option) => toggleArrayFilter(option, setSocketFilters))}
                            {renderToggleChipGroup("Chipset", chipsetFilterOptions, chipsetFilters, (option) => toggleArrayFilter(option, setChipsetFilters))}
                            {renderToggleChipGroup("Minnestyp", MOTHERBOARD_RAM_TYPE_OPTIONS.filter((option) => ramTypeFilterOptions.includes(option)), ramTypeFilters, (option) => toggleArrayFilter(option, setRamTypeFilters))}
                            {renderCardFilterGrid("Wi-Fi", ["Ja", "Nej"], (option) => motherboardWifiFilter === option, (option) => setMotherboardWifiFilter((prev) => (prev === option ? "Alla" : option as "Ja" | "Nej")))}
                            {renderRangeFilter("Minnesplatser", motherboardMemorySlotsRange, motherboardMemorySlotBounds, setMotherboardMemorySlotsRange)}
                            {renderRangeFilter("M.2 platser", motherboardM2SlotsRange, motherboardM2Bounds, setMotherboardM2SlotsRange)}
                          </>
                        ) : null}
                        {activeCategory === "gpu" ? (
                          <>
                            {renderToggleChipGroup("Tillverkare", gpuManufacturerOptions, gpuManufacturerFilters, (option) => toggleArrayFilter(option, setGpuManufacturerFilters))}
                            {renderRangeFilter("Minne", gpuVramRange, gpuVramBounds, setGpuVramRange, " GB")}
                            {renderRangeFilter("Längd", gpuLengthRange, gpuLengthBounds, setGpuLengthRange, " mm")}
                          </>
                        ) : null}
                        {activeCategory === "ram" ? (
                          <>
                            {renderToggleChipGroup("Tillverkare", ramManufacturerOptions, ramManufacturers, (option) => toggleArrayFilter(option, setRamManufacturers))}
                            {renderRangeFilter("Storlek", ramSizeRange, ramSizeBounds, setRamSizeRange, " GB")}
                            {renderRangeFilter("Hastighet", ramSpeedRange, ramSpeedBounds, setRamSpeedRange, " MHz")}
                            {renderRangeFilter("CL", ramClRange, ramClBounds, setRamClRange)}
                            {renderRangeFilter("Moduler", ramModulesRange, ramModulesBounds, setRamModulesRange)}
                          </>
                        ) : null}
                        {activeCategory === "storage" ? (
                          <>
                            {renderToggleChipGroup("Tillverkare", storageManufacturerOptions, storageManufacturerFilters, (option) => toggleArrayFilter(option, setStorageManufacturerFilters))}
                            {renderToggleChipGroup("Formfaktor", storageFormFactorOptions, storageFormFactorFilters, (option) => toggleArrayFilter(option, setStorageFormFactorFilters))}
                            {renderToggleChipGroup("Interface", storageInterfaceOptions, storageInterfaceFilters, (option) => toggleArrayFilter(option, setStorageInterfaceFilters))}
                            {renderRangeFilter("Storlek", storageSizeRange, storageSizeBounds, setStorageSizeRange, " GB")}
                            {renderRangeFilter("Läs", storageReadRange, storageReadBounds, setStorageReadRange, " MB/s")}
                            {renderRangeFilter("Skriv", storageWriteRange, storageWriteBounds, setStorageWriteRange, " MB/s")}
                          </>
                        ) : null}
                        {activeCategory === "psu" ? (
                          <>
                            {renderToggleChipGroup("Tillverkare", psuManufacturerOptions, psuManufacturerFilters, (option) => toggleArrayFilter(option, setPsuManufacturerFilters))}
                            {renderRangeFilter("Längd", psuLengthRange, psuLengthBounds, setPsuLengthRange, " mm")}
                            {renderRangeFilter("Effekt", psuWattageRange, psuWattageBounds, setPsuWattageRange, " W", 50)}
                            {renderToggleChipGroup("Modulär", PSU_MODULAR_OPTIONS, psuModularFiltersDetailed, (option) => toggleArrayFilter(option, setPsuModularFiltersDetailed))}
                            {renderToggleChipGroup("80 PLUS", ["Bronze", "Silver", "Gold", "Platinum", "Titanium"], psuRatingFilters, (option) => toggleArrayFilter(option, setPsuRatingFilters))}
                            {renderToggleChipGroup("ATX standard", PSU_ATX_STANDARD_OPTIONS, psuAtxStandardFilters, (option) => toggleArrayFilter(option, setPsuAtxStandardFilters))}
                            {renderToggleChipGroup("Formfaktor", PSU_FORM_FACTOR_OPTIONS, psuFormFactorFilters, (option) => toggleArrayFilter(option, setPsuFormFactorFilters))}
                          </>
                        ) : null}
                        {activeCategory === "cooling" ? (
                          <>
                            {renderToggleChipGroup("Tillverkare", coolingManufacturerOptions, coolingManufacturerFilters, (option) => toggleArrayFilter(option, setCoolingManufacturerFilters))}
                            {renderRangeFilter("Höjd", coolingHeightRange, coolingHeightBounds, setCoolingHeightRange, " mm")}
                            {renderToggleChipGroup("Kompatibla sockets", COOLING_SOCKET_OPTIONS.filter((option) => items.some((item) => getCoolingSocketLabels(item).includes(option))), coolingSocketFilters, (option) => toggleArrayFilter(option, setCoolingSocketFilters))}
                          </>
                        ) : null}
                        {activeCategory === "case" ? (
                          <>
                            {renderToggleChipGroup("Formfaktor", CASE_FORM_FACTOR_OPTIONS.filter((option) => caseFormFactorOptions.includes(option)), formFactorFilters, (option) => toggleArrayFilter(option, setFormFactorFilters))}
                          </>
                        ) : null}
                        {activeCategory === "case" ||
                        activeCategory === "chassifan" ||
                        activeCategory === "networkcard" ? (
                          renderToggleChipGroup("Tillverkare", genericBrandOptions, genericBrandFilters, (option) =>
                            toggleArrayFilter(option, setGenericBrandFilters),
                          )
                        ) : null}
                        {activeCategory === "case" ? (
                          renderToggleChipGroup(
                            "Passar moderkort",
                            caseBoardSizeOptions,
                            caseBoardSizeFilters,
                            (option) => toggleArrayFilter(option, setCaseBoardSizeFilters),
                          )
                        ) : null}
                        {activeCategory === "chassifan" ? (
                          <>
                            {renderToggleChipGroup(
                              "Storlek",
                              CHASSI_FAN_SIZE_OPTIONS.filter((option) =>
                                items.some((item) => `${getChassiFanSizeMm(item)} mm` === option),
                              ),
                              chassiFanSizeFilters,
                              (option) => toggleArrayFilter(option, setChassiFanSizeFilters),
                            )}
                            {renderToggleChipGroup(
                              "Belysning",
                              ["RGB", "Utan RGB"],
                              chassiFanRgbFilter === "Alla" ? [] : [chassiFanRgbFilter],
                              (option) =>
                                setChassiFanRgbFilter((prev) =>
                                  prev === option ? "Alla" : (option as "RGB" | "Utan RGB"),
                                ),
                            )}
                          </>
                        ) : null}
                        {activeCategory === "networkcard" ? (
                          <>
                            {renderToggleChipGroup(
                              "Fack",
                              NETWORK_CARD_SLOT_OPTIONS.filter((option) =>
                                items.some((item) => getNetworkCardSlot(item) === option),
                              ),
                              networkCardSlotFilters,
                              (option) => toggleArrayFilter(option, setNetworkCardSlotFilters),
                            )}
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {/* Sorteringen flyttade till kolumnrubrikerna ovanför
                      listan. Kvar här stod den långt från det den sorterade
                      och kunde bara nå pris och populärast - kärnor, minne
                      och effekt låg som egna knappar man först måste hitta. */}
                  <div className="hidden">
                    <span className="cb-snabbfilter__etikett">Sortera</span>
                    {tableSortButtons.map((sortButton) => {
                      /*
                       * Huvudknapparna jämförs på både nyckel och riktning.
                       *
                       * Billigast och Dyrast delar nyckeln "price" och skiljs
                       * bara av riktningen. Ett prov på enbart nyckeln hade
                       * tänt båda samtidigt, och den gamla knappen "Lägsta
                       * pris" såg aktiv ut även när listan låg dyrast först.
                       */
                      const exact = "exact" in sortButton && sortButton.exact;
                      const isActive = exact
                        ? activeSort?.key === sortButton.key && activeSort?.direction === sortButton.direction
                        : activeSort?.key === sortButton.key;
                      /* Pil bara där riktningen går att vända. */
                      const arrow = exact ? null : isActive ? (activeSort.direction === "asc" ? "↑" : "↓") : "↕";
                      return (
                        <button
                          key={`${activeCategory}-${sortButton.key}-${sortButton.direction}`}
                          type="button"
                          onClick={() =>
                            exact
                              ? setSortForCategory(sortButton.key, sortButton.direction)
                              : toggleSortForCategory(sortButton.key, sortButton.direction)
                          }
                          className="cb-chip"
                          data-aktiv={isActive ? "true" : "false"}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>{sortButton.label}</span>
                            {arrow ? <span className="opacity-60">{arrow}</span> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  {/* Rubrikraden. Klickbar där kolumnen går att sortera på. */}
                  <div
                    className="cb-tabell cb-huvud"
                    style={{ ["--cb-spalter" as string]: spaltMall(aktivaKolumner) }}
                  >
                    <span />
                    <button
                      type="button"
                      onClick={() => setSortForCategory("popularity", "desc")}
                      className="cb-huvud__cell"
                      data-aktiv={activeSort?.key === "popularity" ? "true" : "false"}
                    >
                      Produkt
                      <span className="cb-huvud__pil">
                        {activeSort?.key === "popularity" ? "▾" : "⇅"}
                      </span>
                    </button>
                    {aktivaKolumner.map((kolumn) =>
                      kolumn.sort ? (
                        <button
                          key={kolumn.id}
                          type="button"
                          onClick={() => toggleSortForCategory(kolumn.sort!, kolumn.riktning ?? "desc")}
                          className={`cb-huvud__cell${kolumn.tal ? " cb-cell--tal" : ""}`}
                          data-aktiv={activeSort?.key === kolumn.sort ? "true" : "false"}
                        >
                          {kolumn.etikett}
                          <span className="cb-huvud__pil">
                            {activeSort?.key === kolumn.sort
                              ? activeSort.direction === "asc"
                                ? "▴"
                                : "▾"
                              : "⇅"}
                          </span>
                        </button>
                      ) : (
                        <span
                          key={kolumn.id}
                          className={`cb-huvud__cell${kolumn.tal ? " cb-cell--tal" : ""}`}
                        >
                          {kolumn.etikett}
                        </span>
                      ),
                    )}
                    <button
                      type="button"
                      onClick={() => toggleSortForCategory("lager", "desc")}
                      className="cb-huvud__cell"
                      data-aktiv={activeSort?.key === "lager" ? "true" : "false"}
                      title="En ruta per butik som för varan. Grön betyder i lager."
                    >
                      Lager
                      <span className="cb-huvud__pil">
                        {activeSort?.key === "lager" ? (activeSort.direction === "asc" ? "▴" : "▾") : "⇅"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSortForCategory("price", "asc")}
                      className="cb-huvud__cell cb-cell--tal"
                      data-aktiv={activeSort?.key === "price" ? "true" : "false"}
                    >
                      Pris
                      <span className="cb-huvud__pil">
                        {activeSort?.key === "price" ? (activeSort.direction === "asc" ? "▴" : "▾") : "⇅"}
                      </span>
                    </button>
                    <span />
                  </div>

                  {visibleItems.map((item) => {
                    /* Antalet av just den här varan i bygget, noll när den
                       inte är vald. Ersätter det gamla av/på-läget. */
                    const valtAntal =
                      bygge[activeCategory].find((v) => v.item.id === item.id)?.antal ?? 0;
                    const isSelected = valtAntal > 0;
                    const isExpanded = expandedItemId === item.id && expandedItemCategory === activeCategory;
                    const categoryImage = CATEGORY_IMAGES[activeCategory];
                    const resolvedItemImage = getResolvedComponentImage(
                      activeCategory,
                      item,
                      imageUrlByItemId[item.id]
                    );
                    const imageSrc = resolvedItemImage ?? categoryImage?.src ?? FALLBACK_COMPONENT_IMAGE;
                    const backupImageSrc =
                      CATALOG_IMAGE_OVERRIDE_BY_ID[item.id] ||
                      item.image ||
                      categoryImage?.src ||
                      FALLBACK_COMPONENT_IMAGE;
                    const imageAlt = item.name || categoryImage?.alt || "Komponent";

                    /*
                     * Reservbilderna provas en gång var, i ordning.
                     *
                     * Förut jämfördes bara adressen mot föregående steg, och
                     * när två adresser i rad misslyckades pekade provet
                     * tillbaka på den första: reserven ledde till
                     * kategoribilden, kategoribilden tillbaka till reserven,
                     * i all oändlighet. Den lokala bilden sist i kedjan
                     * nåddes aldrig, och raden visade webbläsarens trasiga
                     * ikon. Räknaren i data-attributet gör kedjan ändlig.
                     *
                     * Samma bild ritas nu på tre ställen - i raden, i
                     * förstoringen vid hovring och i den utfällda panelen -
                     * så kedjan bor här och inte i tre kopior.
                     */
                    const hanteraBildfel = (
                      event: React.SyntheticEvent<HTMLImageElement>,
                    ) => {
                      const bild = event.currentTarget;
                      const kedja = [
                        backupImageSrc,
                        categoryImage?.src,
                        FALLBACK_COMPONENT_IMAGE,
                      ].filter((kandidat): kandidat is string => Boolean(kandidat));
                      const steg = Number(bild.dataset.reserv ?? "0");
                      if (steg >= kedja.length) {
                        bild.onerror = null;
                        return;
                      }
                      bild.dataset.reserv = String(steg + 1);
                      bild.src = kedja[steg];
                    };
                    const detailEntries = Object.entries(item.details || {});
                    const showStorePanel = supportsStoreOffersForCategory(activeCategory);
                    const storeOffersForItem = isExpanded ? expandedStoreOffers : [];

                    /*
                     * Priset kommer inte alltid från en butik.
                     *
                     * För 128 av de handplockade posterna har prisjakten
                     * ingen träff, och då visas katalogens riktpris. Det
                     * stod ingenstans för kunden förut - etiketten fanns
                     * men renderades bara i felsökningsläge - så en siffra
                     * vi satt själva såg ut som ett butikspris.
                     */
                    const visarRiktpris = getPriceSource(item) === "no-store" || getPriceSource(item) === "search";

                    return (
                      <div
                        key={item.id}
                        className="cb-row"
                        data-vald={isSelected ? "true" : "false"}
                        data-oppen={isExpanded ? "true" : "false"}
                      >
                        {/*
                          * Hela raden öppnar panelen, inte bara knappen.
                          *
                          * Man pekar på varan man vill veta mer om, inte på
                          * en knapp som råkar ligga i samma rad. Knappen och
                          * räknaren stoppar sin egen klickning, så de gör
                          * fortfarande bara sitt.
                          */}
                        <div
                          className="cb-row__topp cb-tabell"
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          onClick={() => openStorePickerForComponent(activeCategory, item)}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            openStorePickerForComponent(activeCategory, item);
                          }}
                          style={{ ["--cb-spalter" as string]: spaltMall(aktivaKolumner) }}
                        >
                        <div className="cb-row__media">
                          <img
                            src={imageSrc}
                            alt={imageAlt}
                            loading="lazy"
                            decoding="async"
                            onError={hanteraBildfel}
                          />

                          {/* Förstoringen vid hovring. Brickan är 3,5 rem och
                              räcker för att känna igen en vara, inte för att
                              se om chassit har glasruta. aria-hidden för att
                              det är samma bild en gång till - skärmläsaren
                              har redan läst alt-texten ovan. */}
                          <span className="cb-row__forstoring" aria-hidden="true">
                            <img
                              src={imageSrc}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              onError={hanteraBildfel}
                            />
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="cb-row__brandrad">
                            <span className="cb-row__brand">{item.brand}</span>
                            {item.highlight ? (
                              <span className="cb-row__markning">{item.highlight}</span>
                            ) : null}
                          </div>
                          <h4 className="cb-row__namn">{item.name}</h4>
                          {/* Etiketterna står kvar. På smala skärmar döljs
                              kolumnerna och då är de det enda som berättar
                              vad varan är. */}
                          <div className="cb-row__specar">
                            {item.specs.slice(0, 4).map((spec) => (
                              <span key={spec} className="cb-row__spec">
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>

                        {aktivaKolumner.map((kolumn) => (
                          <span
                            key={kolumn.id}
                            className={`cb-cell${kolumn.tal ? " cb-cell--tal" : ""}`}
                            title={kolumn.varde(item)}
                          >
                            {kolumn.varde(item)}
                          </span>
                        ))}

                        <span className="cb-cell cb-lager">
                          {sorteradeButiker(stockByItemId[item.id]).map((butik) => (
                            <span
                              key={butik}
                              className="cb-lager__ruta"
                              data-lager={stockByItemId[item.id]?.[butik] === 1 ? "ja" : "nej"}
                              title={`${butik === "proshop" ? "Proshop" : butik === "webhallen" ? "Webhallen" : butik}: ${
                                stockByItemId[item.id]?.[butik] === 1 ? "i lager" : "slut"
                              }`}
                            />
                          ))}
                        </span>

                        <span className="cb-cell cb-cell--pris cb-cell--tal">
                          <span className="cb-row__pris block">
                            {getDisplayPriceLabel(item, activeCategory)}
                          </span>
                          {visarRiktpris ? <span className="cb-row__kalla">Riktpris</span> : null}
                          {customBuildDebugEnabled ? (
                            <span className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-sky-400">
                              {getPriceSourceLabel(item)}
                            </span>
                          ) : null}
                        </span>

                        <span className="cb-cell cb-cell--knapp">
                          {/*
                            * Vald vara i en kategori som tar flera får en
                            * räknare i stället för knappen.
                            *
                            * Fem likadana fläktar är fem klick på plus, och
                            * de klicken hör hemma där varan står. Att gå
                            * till bygget i högerspalten för att räkna upp
                            * något man just tittar på är en omväg.
                            */}
                          {isSelected && kategorinTarFlera ? (
                            <span className="cb-antal" onClick={(event) => event.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() =>
                                  setBygge((prev) => medAndratAntal(prev, activeCategory, item.id, -1))
                                }
                                aria-label={`Färre ${item.name}`}
                              >
                                −
                              </button>
                              <span className="cb-antal__tal">{valtAntal}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setBygge((prev) => medAndratAntal(prev, activeCategory, item.id, 1))
                                }
                                disabled={kategorinFull}
                                aria-label={`Fler ${item.name}`}
                              >
                                +
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (isSelected) {
                                  setBygge((prev) => utanVal(prev, activeCategory, item.id));
                                  return;
                                }
                                openStorePickerForComponent(activeCategory, item);
                              }}
                              disabled={!isSelected && kategorinFull}
                              className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "border border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground"
                              }`}
                            >
                              {isSelected ? "Vald" : kategorinTarFlera ? "Lägg till" : "Välj"}
                            </button>
                          )}
                        </span>
                        </div>
                        {isExpanded ? (
                          <div className="cb-panel">
                            <div className="cb-panel__ovre">
                              {/* Samma bricka som i raden, tio gånger ytan.
                                  Här har kunden stannat för att titta närmare,
                                  och ett klick till öppnar bilden i full storlek.
                                  Adressen tas från bilden själv, så att en
                                  reservbild som redan bytts in följer med. */}
                              <button
                                type="button"
                                className="cb-panel__bild"
                                aria-label={`Visa större bild av ${imageAlt}`}
                                onClick={(event) => {
                                  const bild = event.currentTarget.querySelector("img");
                                  setStorBild({
                                    src: bild?.currentSrc || bild?.src || imageSrc,
                                    alt: imageAlt,
                                  });
                                }}
                              >
                                <img
                                  src={imageSrc}
                                  alt={imageAlt}
                                  loading="lazy"
                                  decoding="async"
                                  onError={hanteraBildfel}
                                />
                                <span className="cb-panel__forstora" aria-hidden="true">
                                  <ZoomIn className="h-3.5 w-3.5" />
                                </span>
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="cb-panel__etikett">Specifikation</p>
                                    <h5 className="cb-panel__namn">{item.name}</h5>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    {item.selectedProductUrl ? (
                                      <a
                                        href={item.selectedProductUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-lg border border-foreground/20 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                      >
                                        Produktsida
                                      </a>
                                    ) : null}
                                    <button
                                      type="button"
                                      onClick={handleStorePickerClose}
                                      className="rounded-lg border border-foreground/20 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                    >
                                      Stäng
                                    </button>
                                  </div>
                                </div>

                                {detailEntries.length > 0 ? (
                                  <dl className="cb-panel__specar">
                                    {detailEntries.map(([label, value]) => (
                                      <div key={`${item.id}-${label}`}>
                                        <dt>{label}</dt>
                                        <dd>{String(value)}</dd>
                                      </div>
                                    ))}
                                  </dl>
                                ) : (
                                  <p className="mt-4 text-sm text-muted-foreground">
                                    Butiken har inte lämnat några specifikationer för den här varan.
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="cb-panel__butiker">
                              <p className="cb-panel__etikett">Butiker</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {showStorePanel
                                  ? "Rangordnade från billigast till dyrast."
                                  : "Den här komponenten har ingen butiksväljare ännu."}
                              </p>
                              {customBuildDebugEnabled ? (
                                <p className="mt-2 text-[11px] text-sky-700 dark:text-sky-300">
                                  {"Debug: Live butik = verifierad butikslänk med pris, Cachad pris = senast sparad eller lokal reservprisdata, Reservpris = katalogpris eller aggregatorpris, Ingen butik = inga butiksträffar."}
                                </p>
                              ) : null}

                              {storePickerLoading && isExpanded ? (
                                <div className="mt-3 rounded-lg border border-dashed border-foreground/20 px-4 py-4 text-sm text-muted-foreground">
                                  Hämtar butikslänkar och priser...
                                </div>
                              ) : null}
                              {storePickerError && isExpanded ? (
                                <p className="mt-3 text-sm text-amber-600">{storePickerError}</p>
                              ) : null}

                              {showStorePanel ? (
                                storeOffersForItem.length > 0 ? (
                                  <div className="mt-3">
                                    {storeOffersForItem.map((offer) => {
                                      const lager = getStoreStockLabel(offer);
                                      const pris = Number(offer.total_price ?? offer.price);
                                      return (
                                        <div
                                          key={`${item.id}-${offer.store_id || offer.store}`}
                                          className="cb-butik"
                                        >
                                          {/* Bokstaven ligger under bilden och syns bara
                                              om butikens ikon inte går att hämta. */}
                                          <span className="cb-butik__marke" aria-hidden="true">
                                            <span className="cb-butik__initial">
                                              {String(offer.store || "?").charAt(0).toUpperCase()}
                                            </span>
                                            {getButiksmarken(offer).length > 0 ? (
                                              <img
                                                src={getButiksmarken(offer)[0]}
                                                alt=""
                                                loading="lazy"
                                                decoding="async"
                                                onError={(event) => {
                                                  const bild = event.currentTarget;
                                                  const kedja = getButiksmarken(offer);
                                                  const steg = Number(bild.dataset.steg ?? "1");
                                                  if (steg >= kedja.length) {
                                                    bild.onerror = null;
                                                    bild.style.display = "none";
                                                    return;
                                                  }
                                                  bild.dataset.steg = String(steg + 1);
                                                  bild.src = kedja[steg];
                                                }}
                                              />
                                            ) : null}
                                          </span>
                                          <div className="min-w-0">
                                            <span className="cb-butik__namn block truncate">{offer.store}</span>
                                            <span className="cb-butik__lager" data-ton={lager.tone}>
                                              {lager.text}
                                            </span>
                                          </div>
                                          <span className="cb-butik__pris">
                                            {Number.isFinite(pris) && pris > 0
                                              ? formatCurrencyPrice(pris, offer.currency || "SEK")
                                              : "—"}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            {offer.product_url ? (
                                              <a
                                                href={offer.product_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="rounded-lg border border-foreground/20 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                              >
                                                Till butik
                                              </a>
                                            ) : null}
                                            <button
                                              type="button"
                                              disabled={!canSelectStoreOffer(offer)}
                                              onClick={() => selectComponentAndAdvance(activeCategory, item, offer)}
                                              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                              Välj
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : !storePickerLoading ? (
                                  <div className="mt-3 rounded-lg border border-dashed border-foreground/20 px-4 py-4 text-sm text-muted-foreground">
                                    Ingen butik hittades för den här komponenten i dag.
                                  </div>
                                ) : null
                              ) : (
                                <div className="mt-3 rounded-lg border border-dashed border-foreground/20 px-4 py-4 text-sm text-muted-foreground">
                                  Välj komponenten direkt för att fortsätta till nästa steg.
                                </div>
                              )}

                              {/* Måste stå intill priserna, inte bara i en policy.
                                  Se AffiliateDisclosure för varför. */}
                              {showStorePanel ? <AffiliateDisclosure className="mt-3" /> : null}

                              <div className="mt-3 flex justify-end">
                                <button
                                  type="button"
                                  onClick={handleSelectWithoutStore}
                                  disabled={!isExpanded}
                                  className="rounded-lg border border-primary/60 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Välj utan butik
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  {hiddenItemCount > 0 ? (
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((count) => count + ROWS_PER_PAGE)}
                        className="rounded-xl border border-foreground/15 bg-foreground/[0.04] px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary dark:bg-background/70"
                      >
                        Visa fler ({hiddenItemCount} kvar)
                      </button>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Sök eller filtrera för att smalna av listan.
                      </p>
                    </div>
                  ) : null}
                  {sortedItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-foreground/15 px-6 py-10 text-center">
                      {/*
                        * Två olika tomma lägen, och de kräver olika besked.
                        *
                        * Är hela kategorin borta för att ingen butik för något
                        * av den hjälper det inte att nollställa filtren, och
                        * att be kunden göra det är att skicka henne på en
                        * uppgift som inte går att lösa.
                        */}
                      {items.length === 0 && getCategoryItems(activeCategory).length > 0 ? (
                        <>
                          <p className="text-sm font-semibold text-foreground">
                            Inga butiker har {(activeConfig?.label || "komponenten").toLowerCase()} just nu
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Vi visar bara det Proshop eller Webhallen faktiskt för. Priserna läses om
                            varje dygn, så titta in igen i morgon.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-foreground">Inga komponenter matchar</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Prova en bredare sökning eller nollställ prisintervallet.
                          </p>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
      <button
        type="button"
        onClick={() => {
          setMobileSidebarOpen((prev) => {
            const next = !prev;
            if (next) {
              scrollToCategoryPicker();
            }
            return next;
          });
        }}
        className="sm:hidden fixed top-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
        aria-label="Komponenter"
      >
        <Menu className="h-5 w-5" />
      </button>
      {showNextBubble ? (
        <button
          type="button"
          onClick={handleNextBubbleClick}
          className="sm:hidden fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
        >
          <span className="text-muted-foreground/70">{"\u2022"}</span>
          <span>{"N\u00e4sta"}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={toggleCustomBuildDebug}
        className={`fixed bottom-5 left-5 z-40 rounded-full border px-4 py-2 text-xs font-semibold shadow-lg shadow-black/15 transition-colors ${
          customBuildDebugEnabled
            ? "border-sky-500 bg-sky-500 text-white hover:bg-sky-600"
            : "border-foreground/20 bg-white/95 text-gray-700 hover:border-sky-400 hover:text-sky-700 dark:border-foreground/20 dark:bg-background/80 dark:text-foreground dark:hover:border-sky-700 dark:hover:text-sky-300"
        }`}
      >
        {customBuildDebugEnabled ? "Debug på" : "Debug av"}
      </button>
      {activeCategory === "ram" ? (
        <div className="fixed bottom-5 right-5 z-40 hidden max-w-xs rounded-2xl border border-primary/60 bg-white/95 p-4 text-sm text-gray-700 shadow-xl shadow-black/15 backdrop-blur sm:block dark:border-primary/30 dark:bg-background/80 dark:text-foreground">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <MemoryStick className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">RAM-marknaden</p>
              <p className="mt-1 leading-relaxed">
                {"Priserna p\u00e5 RAM har g\u00e5tt upp med cirka 600% p\u00e5 grund av efterfr\u00e5gan fr\u00e5n AI-datacenter, vilket har skapat brist p\u00e5 chip."}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      {customBuildDebugEnabled ? (
        <div className="fixed bottom-20 left-5 z-40 hidden max-w-xs rounded-2xl border border-sky-300 bg-white/95 p-4 text-sm text-gray-700 shadow-xl shadow-black/15 backdrop-blur sm:block dark:border-sky-800 dark:bg-background/80 dark:text-foreground">
          <p className="font-semibold text-foreground">Custom Build Debug</p>
          <p className="mt-1 text-xs leading-relaxed">
            {"Källor: "}<span className="font-semibold">Live butik</span>{", "}<span className="font-semibold">Cachad pris</span>{", "}<span className="font-semibold">Reservpris</span>{", "}<span className="font-semibold">Ingen butik</span>{"."}
          </p>
        </div>
      ) : null}
    </PageShell>
  );
}





