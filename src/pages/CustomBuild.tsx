import {
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
  Box,
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  MemoryStick,
  Menu,
  Monitor,
  Power,
  ChevronRight,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SeoHead } from "@/components/SeoHead";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CUSTOM_BUILD_CATALOG_ITEMS } from "@/data/customBuildCatalog.js";
import { CUSTOM_BUILD_PRELOADED_PRICE_BY_ID } from "@/data/customBuildPreloadedPrices.js";
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

type CategoryKey = "cpu" | "gpu" | "motherboard" | "ram" | "storage" | "case" | "psu" | "cooling";

type ComponentItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  specs: string[];
  image?: string;
  highlight?: string;
  socket?: "AM4" | "AM5" | "LGA1700" | "LGA1200";
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
    price_source?: "live-offer" | "fallback" | "search" | "no-store" | null;
  }>;
};

type CustomBuildPriceSource = "live-offer" | "seed" | "fallback" | "search" | "no-store";


type CategoryConfig = {
  key: CategoryKey;
  label: string;
  description: string;
  icon: typeof Cpu;
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
    icon: Monitor,
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
    icon: Box,
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
    icon: Fan,
  },
];

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
  socket: "AM4" | "AM5" | "LGA1700" | "LGA1200";
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

const getItemGpuPerformanceClass = (item: ComponentItem) => item.performanceClass || "";

const getItemGpuExactModel = (item: ComponentItem) =>
  item.category === undefined || item.id.startsWith("gpu-") ? item.gpuModel || item.name : "";

const getItemCpuChip = (item: ComponentItem) => {
  const text = normalizeFilterToken(item.name);
  const chipPatterns = [
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
  const chipPatterns = [
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

const COMPONENTS: Record<CategoryKey, ComponentItem[]> = {
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
  ram: [
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
  ].filter((item) => !UNSUPPORTED_RAM_ITEM_IDS.has(item.id)),
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
};

const staticComponentItemsWithPreloadedPrices: Record<
  Exclude<CategoryKey, "cpu" | "motherboard">,
  ComponentItem[]
> = {
  gpu: COMPONENTS.gpu.map((item) => ({ ...item, price: getPreloadedPrice(item.id, item.price) })),
  ram: COMPONENTS.ram.map((item) => ({ ...item, price: getPreloadedPrice(item.id, item.price) })),
  storage: COMPONENTS.storage.map((item) => ({ ...item, price: getPreloadedPrice(item.id, item.price) })),
  case: COMPONENTS.case.map((item) => ({ ...item, price: getPreloadedPrice(item.id, item.price) })),
  psu: COMPONENTS.psu.map((item) => ({ ...item, price: getPreloadedPrice(item.id, item.price) })),
  cooling: COMPONENTS.cooling.map((item) => ({ ...item, price: getPreloadedPrice(item.id, item.price) })),
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
  if (category === "cpu") return catalogComponentItems.cpu;
  if (category === "motherboard") return catalogComponentItems.motherboard;
  return staticComponentItemsWithPreloadedPrices[category];
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

const encodeBuildSelection = (selection: Record<CategoryKey, ComponentItem | null>) =>
  CATEGORY_ORDER.map((key) => {
    const item = selection[key];
    if (!item) return "-";
    const lastSegment = item.id.split("-").pop();
    const numberValue = lastSegment ? Number(lastSegment) : Number.NaN;
    if (!Number.isFinite(numberValue)) return "-";
    return numberValue.toString(36);
  }).join(".");

const decodeBuildSelection = (encoded: string) => {
  const parts = encoded.split(".");
  if (parts.length !== CATEGORY_ORDER.length) return null;
  const result: Partial<Record<CategoryKey, string>> = {};
  parts.forEach((part, index) => {
    if (!part || part === "-") return;
    const numberValue = parseInt(part, 36);
    if (!Number.isFinite(numberValue)) return;
    const key = CATEGORY_ORDER[index];
    result[key] = `${CATEGORY_ID_PREFIX[key]}-${numberValue}`;
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
    ram: { key: "price", direction: "asc" },
    storage: { key: "price", direction: "asc" },
    case: { key: "price", direction: "asc" },
    psu: { key: "price", direction: "asc" },
    cooling: { key: "price", direction: "asc" },
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
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [selected, setSelected] = useState<Record<CategoryKey, ComponentItem | null>>({
    cpu: null,
    gpu: null,
    motherboard: null,
    ram: null,
    storage: null,
    case: null,
    psu: null,
    cooling: null,
  });
  const [expandedItemId, setExpandedItemId] = useState("");
  const [expandedItemCategory, setExpandedItemCategory] = useState<CategoryKey | null>(null);
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
  const lowestPriceLookupStartedRef = useRef<Set<string>>(new Set());

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
    const next: Record<CategoryKey, ComponentItem | null> = {
      cpu: null,
      gpu: null,
      motherboard: null,
      ram: null,
      storage: null,
      case: null,
      psu: null,
      cooling: null,
    };
    let firstKey: CategoryKey | null = null;

    if (decodedIds) {
      CATEGORY_ORDER.forEach((key) => {
        const id = decodedIds[key];
        if (!id) return;
        const match = getCategoryItems(key).find((item) => item.id === id);
        if (match) {
          next[key] = match;
          if (!firstKey) {
            firstKey = key;
          }
        }
      });
    } else {
      (Object.keys(COMPONENTS) as CategoryKey[]).forEach((key) => {
        const id = params.get(key);
        if (!id) return;
        const match = getCategoryItems(key).find((item) => item.id === id);
        if (match) {
          next[key] = match;
          if (!firstKey) {
            firstKey = key;
          }
        }
      });
    }

    setSelected(next);
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
    const socket = selected.motherboard?.socket;
    if (!socket) return;
    const allowedRamType = SOCKET_RAM_TYPE[socket];

    setSelected((prev) => {
      const nextCpu =
        prev.cpu && prev.cpu.socket && prev.cpu.socket !== socket ? null : prev.cpu;
      const nextRam =
        prev.ram && prev.ram.ramType && allowedRamType && prev.ram.ramType !== allowedRamType
          ? null
          : prev.ram;

      if (nextCpu === prev.cpu && nextRam === prev.ram) {
        return prev;
      }

      return {
        ...prev,
        cpu: nextCpu,
        ram: nextRam,
      };
    });
  }, [selected.motherboard]);

  const activeConfig = CATEGORY_LIST.find((category) => category.key === activeCategory);
  const items = getCategoryItems(activeCategory);
  const getComparablePrice = (item: ComponentItem, category: CategoryKey) => {
    const livePrice = lowestOfferPriceByItemId[item.id];
    if (typeof livePrice === "number" && Number.isFinite(livePrice) && livePrice > 0) {
      return Math.max(0, Math.round(livePrice));
    }
    return getBasePrice(item, category);
  };

  const getDisplayPriceLabel = (item: ComponentItem, category: CategoryKey) => {
    if (itemsWithoutStorePrice[item.id]) {
      return "N/A";
    }
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
        return "Ingen butik";
      case "no-store":
        return "Ingen butik";
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

  const supportsStoreOffersForCategory = (_categoryKey: CategoryKey) => true;

  useEffect(() => {
    if (!supportsStoreOffersForCategory(activeCategory)) return;
    const pendingItems = items.filter((item) => !lowestPriceLookupStartedRef.current.has(item.id));
    if (pendingItems.length === 0) return;
    let isCancelled = false;

    const loadLowestPrices = async () => {
      pendingItems.forEach((item) => lowestPriceLookupStartedRef.current.add(item.id));
      try {
        const endpoint = `${normalizedApiBase}/api/custom-build/catalog-prices?category=${encodeURIComponent(activeCategory)}`;
        const response = await fetch(endpoint);
        if (!response.ok) return;
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
  }, [items, normalizedApiBase, activeCategory]);

  const toggleArrayFilter = (value: string, setter: Dispatch<SetStateAction<string[]>>) => {
    setter((prev) => (prev.includes(value) ? prev.filter((entry) => entry !== value) : [...prev, value]));
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

  const filteredItems = useMemo(() => {
    const selectedMotherboardSocket = selected.motherboard?.socket;
    const selectedCpuSocket = selected.cpu?.socket;
    const allowedRamType = selectedMotherboardSocket ? SOCKET_RAM_TYPE[selectedMotherboardSocket] : null;

    return items.filter((item) => {
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
    items,
    activeBrand,
    searchTerm,
    activeCategory,
    selected.motherboard,
    selected.cpu,
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
        case "speed":
          return getCpuSpeedGhz(item) ?? 0;
        case "cores":
          return getCpuCoreCount(item) ?? 0;
        case "vram":
          return getGpuVramGb(item) ?? 0;
        case "ramSize":
          return getRamSizeGb(item) ?? 0;
        case "ramSpeed":
          return getRamSpeedMhz(item) ?? 0;
        case "ramCl":
          return getRamClValue(item) ?? 0;
        case "storageSize":
          return getStorageSizeGb(item) ?? 0;
        case "read":
          return getStorageReadMb(item) ?? 0;
        case "write":
          return getStorageWriteMb(item) ?? 0;
        case "wattage":
          return getItemPsuWattage(item) ?? 0;
        case "coolingType":
          return getCoolingTypeValue(item) === "Vatten" ? 2 : 1;
        case "popularity":
        default:
          return getItemPopularityScore(item, activeCategory, itemIndexLookup[item.id] ?? 0);
      }
    };

    return [...filteredItems].sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);
      if (aValue === bValue) {
        return (itemIndexLookup[a.id] ?? 0) - (itemIndexLookup[b.id] ?? 0);
      }
      if (typeof aValue === "string" || typeof bValue === "string") {
        return String(aValue).localeCompare(String(bValue), "sv") * direction;
      }
      return ((aValue as number) - (bValue as number)) * direction;
    });
  }, [filteredItems, activeSort, activeCategory, itemIndexLookup, lowestOfferPriceByItemId]);

  const tableSortButtons = useMemo(() => {
    switch (activeCategory) {
      case "cpu":
        return [
          { key: "popularity" as SortKey, label: "Populär", direction: "desc" as SortDirection },
          { key: "speed" as SortKey, label: "Hastighet", direction: "desc" as SortDirection },
          { key: "cores" as SortKey, label: "Kärnor", direction: "desc" as SortDirection },
          { key: "price" as SortKey, label: "Lägsta pris", direction: "asc" as SortDirection },
        ];
      case "motherboard":
        return [
          { key: "popularity" as SortKey, label: "Populär", direction: "desc" as SortDirection },
          { key: "chipset" as SortKey, label: "Chipset", direction: "desc" as SortDirection },
          { key: "price" as SortKey, label: "Lägsta pris", direction: "asc" as SortDirection },
        ];
      case "gpu":
        return [
          { key: "popularity" as SortKey, label: "Populär", direction: "desc" as SortDirection },
          { key: "vram" as SortKey, label: "Minne", direction: "desc" as SortDirection },
          { key: "price" as SortKey, label: "Lägsta pris", direction: "asc" as SortDirection },
        ];
      case "ram":
        return [
          { key: "popularity" as SortKey, label: "Populär", direction: "desc" as SortDirection },
          { key: "ramSpeed" as SortKey, label: "Hastighet", direction: "desc" as SortDirection },
          { key: "ramCl" as SortKey, label: "CL", direction: "asc" as SortDirection },
          { key: "price" as SortKey, label: "Lägsta pris", direction: "asc" as SortDirection },
        ];
      case "storage":
        return [
          { key: "popularity" as SortKey, label: "Populär", direction: "desc" as SortDirection },
          { key: "read" as SortKey, label: "Läs", direction: "desc" as SortDirection },
          { key: "write" as SortKey, label: "Skriv", direction: "desc" as SortDirection },
          { key: "price" as SortKey, label: "Lägsta pris", direction: "asc" as SortDirection },
        ];
      case "psu":
        return [
          { key: "popularity" as SortKey, label: "Populär", direction: "desc" as SortDirection },
          { key: "wattage" as SortKey, label: "Effekt", direction: "desc" as SortDirection },
          { key: "price" as SortKey, label: "Lägsta pris", direction: "asc" as SortDirection },
        ];
      case "cooling":
        return [
          { key: "popularity" as SortKey, label: "Populär", direction: "desc" as SortDirection },
          { key: "coolingType" as SortKey, label: "Typ", direction: "desc" as SortDirection },
          { key: "price" as SortKey, label: "Lägsta pris", direction: "asc" as SortDirection },
        ];
      default:
        return [
          { key: "popularity" as SortKey, label: "Populär", direction: "desc" as SortDirection },
          { key: "price" as SortKey, label: "Lägsta pris", direction: "asc" as SortDirection },
        ];
    }
  }, [activeCategory]);

  const renderCardFilterGrid = (
    label: string,
    options: string[],
    isActive: (option: string) => boolean,
    onToggle: (option: string) => void,
    columns = "sm:grid-cols-2 xl:grid-cols-3"
  ) => {
    if (options.length === 0) return null;
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</p>
        <div className={`grid grid-cols-1 gap-3 ${columns}`}>
          {options.map((option) => (
            <button
              key={`${label}-${option}`}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                isActive(option)
                  ? "border-yellow-400 bg-yellow-50 text-gray-900 dark:bg-yellow-400/10 dark:!text-white"
                  : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 dark:border-gray-800 dark:bg-[#101926] dark:text-gray-200"
              }`}
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
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</p>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={`${label}-${option}`}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedOptions.includes(option)
                  ? "bg-yellow-400 text-gray-900 dark:bg-yellow-400/15 dark:!text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#101926] dark:text-gray-200 dark:hover:bg-[#162234]"
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
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
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
          className="h-1 w-full accent-yellow-400"
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
  const totalPrice = Object.values(selected).reduce((sum, item) => sum + (item?.price ?? 0), 0);
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const allComponentsSelected = selectedCount === CATEGORY_LIST.length;
  const activeCategoryIndex = CATEGORY_LIST.findIndex((category) => category.key === activeCategory);
  const nextCategory = activeCategoryIndex >= 0 ? CATEGORY_LIST[activeCategoryIndex + 1] : null;
  const isLastCategory = activeCategoryIndex === CATEGORY_LIST.length - 1;
  const nextBubbleLabel = nextCategory?.label ?? "Sammanfattning";
  const showNextBubble = Boolean(
    selected[activeCategory] && (nextCategory || isLastCategory) && !isSummaryVisible
  );
  const getStoreCacheKey = (categoryKey: CategoryKey, itemId: string) => `${categoryKey}:${itemId}`;
  const expandedStoreCacheKey =
    expandedItemId && expandedItemCategory ? getStoreCacheKey(expandedItemCategory, expandedItemId) : "";
  const expandedStoreSnapshot = expandedStoreCacheKey ? storePickerCache[expandedStoreCacheKey] : undefined;
  const isDisplayableStoreOffer = (offer: StoreOffer) => {
    if (!offer || !offer.product_url) return false;
    return offer.status === "available" || offer.status === "linked_no_price";
  };
  const expandedStoreOffers = Array.isArray(expandedStoreSnapshot?.offers)
    ? expandedStoreSnapshot.offers.filter((offer) => isDisplayableStoreOffer(offer))
    : [];

  const getNextCategoryKey = (currentCategory: CategoryKey) => {
    const currentIndex = CATEGORY_ORDER.indexOf(currentCategory);
    if (currentIndex < 0 || currentIndex >= CATEGORY_ORDER.length - 1) return null;
    return CATEGORY_ORDER[currentIndex + 1];
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
      if (offers.length === 0) {
        setItemsWithoutStorePrice((prev) => ({ ...prev, [item.id]: true }));
        setPriceSourceByItemId((prev) => ({ ...prev, [item.id]: "no-store" }));
        setStorePickerError("Inga butiksträffar hittades för komponenten.");
      } else {
        if (hasPricedOffer) {
          setLowestOfferPriceByItemId((prev) => ({
            ...prev,
            [item.id]: Math.max(0, Math.round(Number(lowestPricedOffer))),
          }));
        }
        setPriceSourceByItemId((prev) => ({
          ...prev,
          [item.id]: hasPricedOffer ? "live-offer" : "fallback",
        }));
        setItemsWithoutStorePrice((prev) => {
          if (hasPricedOffer) {
            if (!prev[item.id]) return prev;
            const nextState = { ...prev };
            delete nextState[item.id];
            return nextState;
          }
          return { ...prev, [item.id]: true };
        });
      }
    } catch (error) {
      setStorePickerError(
        error instanceof Error ? error.message : "Kunde inte hämta butikpriser just nu."
      );
    } finally {
      setStorePickerLoading(false);
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
    setSelected((prev) => ({
      ...prev,
      [categoryKey]: selectedComponent,
    }));
    if (normalizedPrice > 0) {
      setLowestOfferPriceByItemId((prev) => ({ ...prev, [component.id]: normalizedPrice }));
    }
    handleStorePickerClose();
    advanceAfterSelection(categoryKey);
  };

  const handleSelectWithoutStore = () => {
    if (!expandedItemCategory || !storePickerComponent) return;
    selectComponentAndAdvance(expandedItemCategory, storePickerComponent);
  };

  const handleCategorySelect = (key: CategoryKey) => {
    handleStorePickerClose();
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

    const components = CATEGORY_LIST.map((category) => {
      const item = selected[category.key];
      if (!item) return null;
      return {
        category: category.label,
        name: item.name,
        price: item.price || 0,
      };
    }).filter(Boolean);

    const hasSelection = Object.values(selected).some(Boolean);
    const shareUrl = hasSelection
      ? `${window.location.origin}/custom-bygg?b=${encodeBuildSelection(selected)}`
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
    const hasSelection = Object.values(selected).some(Boolean);
    const shareUrl = hasSelection
      ? `${window.location.origin}/custom-bygg?b=${encodeBuildSelection(selected)}`
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
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <SeoHead
        title="Custom bygg | DatorHuset"
        description="Bygg din dator steg för steg och skicka en verifierad offertförfrågan till DatorHuset."
        image="/products/newpc/allblack-main.jpg"
        url={typeof window !== "undefined" ? window.location.href : "https://datorhuset.site/custom-bygg"}
        type="website"
      />
      <Navbar />
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
          <DialogContent className="max-w-lg bg-white dark:bg-[#0f1824]">
            <DialogHeader>
              <DialogTitle>Offertförfrågan</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
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
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-4 py-2 text-sm"
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
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-4 py-2 text-sm"
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
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-4 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="offer-notes">Kommentar (valfritt)</label>
                <textarea
                  id="offer-notes"
                  value={offerForm.notes}
                  onChange={updateOfferField("notes")}
                  placeholder="Beskriv önskemål eller annat"
                  className="min-h-[120px] w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-4 py-2 text-sm"
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
                className="w-full rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-[#11667b] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {offerStatus === "sending" ? "Skickar..." : "Skicka offertförfrågan"}
              </button>
            </form>
          </DialogContent>
        ) : null}
      </Dialog>
      <main className="flex-1">
        <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white">
          <div className="container mx-auto px-4 pt-16 sm:pt-20 lg:pt-24 pb-12 sm:pb-16">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-yellow-300">Custom bygg</p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4">Bygg din drömdator, din väg</h1>
                <p className="text-gray-300 mt-4 max-w-xl">
                  Välj komponenter som passar din budget, dina favoritspel och din stil. Vi bygger, testar och levererar
                  ett färdigt bygge.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/custom-bygg#bygg"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:text-white transition-colors"
                  >
                    Börja bygga
                  </Link>
                  <Link
                    to="/products"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-yellow-400 text-yellow-300 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:border-[#11667b] hover:text-white transition-colors"
                  >
                    Se färdiga datorer
                  </Link>
                </div>
              </div>
              <div className="relative">
                <img
                  src="/products/newpc/allblack-main.jpg"
                  alt="Custom bygg"
                  className="w-full h-56 sm:h-72 lg:h-80 object-cover rounded-3xl border border-white/10 shadow-xl"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute -bottom-5 left-6 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  Komplett montering & test ingår
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="bygg" className="bg-gray-100 text-gray-900 dark:bg-background dark:text-gray-100">
          <div className="container mx-auto px-4 py-10 sm:py-12 lg:py-16">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400">Välj komponenter</p>
                <h2 className="text-2xl sm:text-3xl font-bold mt-3">Bygg ditt system steg för steg</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Klicka på en kategori till vänster för att se rekommenderade komponenter och filtrera efter märke.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-300">
                {selectedCount} av {CATEGORY_LIST.length} komponenter valda · Totalt {formatPrice(totalPrice)} kr
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 lg:hidden mb-4">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:border-[#11667b] hover:text-[#11667b] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
              >
                Komponenter
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {mobileSidebarOpen ? "Dölj" : "Visa"}
                </span>
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)_340px] lg:items-start">
              <aside className={`${mobileSidebarOpen ? "block" : "hidden"} lg:block self-start`}>
                <div className="space-y-4 lg:sticky lg:top-24">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Komponenter</p>
                      <div className="mt-4 space-y-2">
                        {CATEGORY_LIST.map((category) => {
                          const Icon = category.icon;
                          const isActive = category.key === activeCategory;
                          const selectedItem = selected[category.key];

                          return (
                            <div key={category.key} className="relative">
                              <button
                                type="button"
                                onClick={() => handleCategorySelect(category.key)}
                                className={`w-full text-left rounded-xl border px-3 py-3 pr-10 transition-colors ${
                                  isActive
                                    ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-400/10"
                                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-[#0f1824]/60 dark:hover:border-gray-700"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span
                                    className={`mt-1 rounded-lg p-2 ${
                                      isActive
                                        ? "bg-yellow-400 text-gray-900"
                                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                    }`}
                                  >
                                    <Icon className="w-5 h-5" />
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{category.label}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{category.description}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                      {selectedItem ? selectedItem.name : "Ej valt"}
                                    </p>
                                  </div>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (!selectedItem) return;
                                  setSelected((prev) => ({ ...prev, [category.key]: null }));
                                }}
                                className={`absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-white shadow-sm transition-colors dark:bg-slate-700 ${
                                  selectedItem
                                    ? "hover:bg-slate-800 dark:hover:bg-slate-600"
                                    : "opacity-40 cursor-default"
                                }`}
                                aria-label={`Ta bort ${category.label}`}
                                aria-disabled={!selectedItem}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Tips</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                      {"\u00c4r du os\u00e4ker? V\u00e4lj en budgetniv\u00e5 i b\u00f6rjan och uppgradera stegvis. Vi hj\u00e4lper dig hitta r\u00e4tt balans."}
                    </p>
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                      Hittar du inte exakt komponent? Mejla oss vilket build du vill ha.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        to="/kundservice"
                        className="inline-flex items-center justify-center gap-2 border border-yellow-400 text-yellow-700 dark:text-yellow-300 font-semibold px-4 py-2 rounded-lg hover:bg-[#11667b] hover:border-[#11667b] hover:text-white transition-colors"
                      >
                        {"F\u00e5 r\u00e5dgivning"}
                      </Link>
                      <a
                        href="https://datorhuset.site/service-reparation"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#11667b] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#0d4d5d]"
                      >
                        Mejla oss
                      </a>
                    </div>
                  </div>
                </div>
              </aside>

              <div className="space-y-6 self-start">
                <div
                  id="component-picker"
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Vald kategori</p>
                      <h3 className="text-2xl font-bold mt-2">{activeConfig?.label}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{activeConfig?.description}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="search"
                        placeholder="Sök komponent..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full sm:w-60 rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:outline-none dark:bg-[#0f1824] dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                  <div className="mt-5 space-y-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pris</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="range"
                        min={priceBounds.min}
                        max={priceBounds.max}
                        step="10"
                        value={priceRange[1]}
                        onChange={(event) =>
                          setPriceRange([priceRange[0], parseInt(event.target.value)])
                        }
                        className="h-1 w-full max-w-[260px] accent-yellow-400"
                      />
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
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
                          className="w-20 rounded-md border border-gray-300 bg-white px-2 py-1 text-right text-xs text-gray-900 focus:border-yellow-400 focus:outline-none dark:border-gray-700 dark:bg-[#0f1824] dark:text-gray-100"
                        />
                        <span>kr</span>
                      </div>
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
                          {renderCardFilterGrid("Välj chiptillverkare", GPU_VENDOR_CARD_OPTIONS, (option) => gpuChipVendorFilter === option, (option) => setGpuChipVendorFilter(option), "sm:grid-cols-2 xl:grid-cols-4")}
                          {renderCardFilterGrid("Välj din prestandaklass", gpuPerformanceFilterOptions, (option) => gpuPerformanceFilters.includes(option), (option) => toggleArrayFilter(option, setGpuPerformanceFilters), "sm:grid-cols-2 xl:grid-cols-3")}
                        </>
                      )
                      : null}
                    {activeCategory === "ram"
                      ? (
                        <>
                          {renderCardFilterGrid("Minsta storlek på minne", RAM_SIZE_CARD_OPTIONS.map((value) => `${value}GB`), (option) => ramMinimumSizeCard === Number(option.replace("GB", "")), (option) => {
                            const next = Number(option.replace("GB", ""));
                            setRamMinimumSizeCard((prev) => (prev === next ? null : next));
                          }, "sm:grid-cols-3")}
                          {renderCardFilterGrid("Typ", RAM_TYPE_CARD_OPTIONS, (option) => ramTypeFilters.includes(option), (option) => toggleArrayFilter(option, setRamTypeFilters), "sm:grid-cols-2")}
                        </>
                      )
                      : null}
                    {activeCategory === "storage"
                      ? (
                        <>
                          {renderCardFilterGrid("Storlek", STORAGE_SIZE_CARD_OPTIONS.map((value) => formatCapacityCardLabel(value)), (option) => storageMinimumSizeCard === (option.endsWith("TB") ? Number(option.replace("TB", "")) * 1024 : Number(option.replace("GB", ""))), (option) => {
                            const next = option.endsWith("TB") ? Number(option.replace("TB", "")) * 1024 : Number(option.replace("GB", ""));
                            setStorageMinimumSizeCard((prev) => (prev === next ? null : next));
                          }, "sm:grid-cols-3 xl:grid-cols-5")}
                          {renderCardFilterGrid("Typ", STORAGE_TYPE_CARD_OPTIONS, (option) => storageTypeFilters.includes(option), (option) => toggleArrayFilter(option, setStorageTypeFilters), "sm:grid-cols-2")}
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
                          }, "sm:grid-cols-3 xl:grid-cols-4")}
                          {renderCardFilterGrid("Välj 80-plus certifiering", PSU_MIN_RATING_CARD_OPTIONS, (option) => psuMinimumRatingCard === option, (option) => setPsuMinimumRatingCard((prev) => (prev === option ? null : option)), "sm:grid-cols-3")}
                        </>
                      )
                      : null}
                    {activeCategory === "cooling"
                      ? renderCardFilterGrid("Välj kylningstyp", COOLING_TYPE_CARD_OPTIONS, (option) => coolingTypeFilter === option, (option) => setCoolingTypeFilter((prev) => (prev === option ? "Alla" : option as "Luft" | "Vatten")), "sm:grid-cols-2")
                      : null}
                  </div>

                  <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#111926]">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setShowDetailedFilters((prev) => !prev)}
                        className="text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                      >
                        Detaljerat filter {showDetailedFilters ? "▴" : "▾"}
                      </button>
                      {hasActiveAdvancedFilters ? (
                        <button
                          type="button"
                          onClick={clearAdvancedFilters}
                          className="text-xs font-semibold text-gray-500 transition-colors hover:text-[#11667b] dark:text-gray-400 dark:hover:text-white"
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
                            {renderToggleChipGroup("Formfaktor", MOTHERBOARD_FORM_FACTOR_OPTIONS.filter((option) => formFactorFilterOptions.includes(option)), formFactorFilters, (option) => toggleArrayFilter(option, setFormFactorFilters))}
                            {renderToggleChipGroup("Socket", socketFilterOptions, socketFilters, (option) => toggleArrayFilter(option, setSocketFilters))}
                            {renderToggleChipGroup("Chipset", chipsetFilterOptions, chipsetFilters, (option) => toggleArrayFilter(option, setChipsetFilters))}
                            {renderToggleChipGroup("Minnestyp", MOTHERBOARD_RAM_TYPE_OPTIONS.filter((option) => ramTypeFilterOptions.includes(option)), ramTypeFilters, (option) => toggleArrayFilter(option, setRamTypeFilters))}
                            {renderCardFilterGrid("Wi-Fi", ["Ja", "Nej"], (option) => motherboardWifiFilter === option, (option) => setMotherboardWifiFilter((prev) => (prev === option ? "Alla" : option as "Ja" | "Nej")), "sm:grid-cols-2")}
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
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-2 border-b border-gray-200 pb-4 dark:border-gray-800 sm:grid-cols-2 xl:grid-cols-4">
                    {tableSortButtons.map((sortButton) => {
                      const isActive = activeSort?.key === sortButton.key;
                      const arrow = isActive ? (activeSort.direction === "asc" ? "↑" : "↓") : "↕";
                      return (
                        <button
                          key={`${activeCategory}-${sortButton.key}`}
                          type="button"
                          onClick={() => toggleSortForCategory(sortButton.key, sortButton.direction)}
                          className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                            isActive
                              ? "border-yellow-400 bg-yellow-50 text-gray-900 dark:bg-yellow-400/10 dark:!text-white"
                              : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 dark:border-gray-800 dark:bg-[#101926] dark:text-gray-200"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span>{sortButton.label}</span>
                            <span>{arrow}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-4">
                  {sortedItems.map((item) => {
                    const isSelected = selected[activeCategory]?.id === item.id;
                    const isExpanded = expandedItemId === item.id && expandedItemCategory === activeCategory;
                    const ActiveIcon = activeConfig?.icon ?? Cpu;
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
                    const detailEntries = Object.entries(item.details || {});
                    const showStorePanel = supportsStoreOffersForCategory(activeCategory);
                    const storeOffersForItem = isExpanded ? expandedStoreOffers : [];

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border bg-white p-3 shadow-sm transition-colors dark:bg-gray-900/80 sm:p-4 ${
                          isSelected ? "border-yellow-400 ring-1 ring-yellow-300/30" : "border-gray-200 dark:border-gray-800"
                        }`}
                      >
                        <div className="grid items-center gap-3 grid-cols-[72px_minmax(0,1fr)_auto] sm:grid-cols-[96px_minmax(0,1fr)_auto] md:grid-cols-[160px_minmax(0,1fr)_auto] sm:gap-4">
                          <div className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-40 md:w-40">
                            <img
                              src={imageSrc}
                              alt={imageAlt}
                              className="w-full h-full object-contain rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/70"
                              loading="lazy"
                              decoding="async"
                              onError={(event) => {
                                const categoryFallbackSrc = categoryImage?.src ?? FALLBACK_COMPONENT_IMAGE;
                                if (event.currentTarget.src !== backupImageSrc) {
                                  event.currentTarget.src = backupImageSrc;
                                  return;
                                }
                                if (event.currentTarget.src !== categoryFallbackSrc) {
                                  event.currentTarget.src = categoryFallbackSrc;
                                  return;
                                }
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = FALLBACK_COMPONENT_IMAGE;
                              }}
                            />
                            <span className="absolute top-1 left-1 rounded-full bg-white/90 text-gray-700 border border-gray-200 p-1.5 shadow-sm dark:bg-gray-900/90 dark:text-gray-200 dark:border-gray-700 sm:top-2 sm:left-2 sm:p-2">
                              <ActiveIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400 sm:text-xs">{item.brand}</p>
                                <h4 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100 sm:mt-2 sm:text-lg">{item.name}</h4>
                              </div>
                              {item.highlight ? (
                                <span className="text-[10px] font-semibold bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full sm:text-xs sm:px-3 sm:py-1">
                                  {item.highlight}
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
                              {item.specs.map((spec, index) => (
                                <span
                                  key={spec}
                                  className={`text-[10px] border border-gray-200 text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full dark:border-gray-700 dark:text-gray-200 dark:bg-gray-800 sm:px-2.5 sm:py-1 sm:text-xs ${
                                    index > 1 ? "hidden sm:inline-flex" : ""
                                  }`}
                                >
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <p className="text-base font-bold text-gray-900 dark:text-gray-100 sm:text-xl">
                              {getDisplayPriceLabel(item, activeCategory)}
                            </p>
                            {customBuildDebugEnabled ? (
                              <span className="rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                                {getPriceSourceLabel(item)}
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (isSelected) {
                                  setSelected((prev) => ({
                                    ...prev,
                                    [activeCategory]: null,
                                  }));
                                  return;
                                }
                                openStorePickerForComponent(activeCategory, item);
                              }}
                              className={`min-w-[84px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:min-w-[96px] sm:px-5 sm:py-2 sm:text-sm ${
                                isSelected
                                  ? "bg-yellow-400 text-gray-900"
                                  : "border border-yellow-400 text-yellow-700 dark:text-yellow-300 hover:bg-[#11667b] hover:text-white hover:border-[#11667b]"
                              }`}
                            >
                              {isSelected ? "Vald" : "Välj"}
                            </button>
                          </div>
                        </div>
                        {isExpanded ? (
                          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
                              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#111926]">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                                      Produktinfo
                                    </p>
                                    <h5 className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                                      {item.name}
                                    </h5>
                                  </div>
                                  {item.selectedProductUrl ? (
                                    <a
                                      href={item.selectedProductUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-[#11667b] hover:text-[#11667b] dark:border-gray-700 dark:text-gray-200"
                                    >
                                      Produktsida
                                    </a>
                                  ) : null}
                                </div>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                  {detailEntries.length > 0 ? (
                                    detailEntries.map(([label, value]) => (
                                      <div key={`${item.id}-${label}`}>
                                        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                                          {label}
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                                          {value}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="sm:col-span-2 xl:col-span-3">
                                      <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Välj komponenten direkt eller öppna butikslänken om den finns.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#111926]">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                                      Butiker
                                    </p>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                                      {showStorePanel
                                        ? "Valbar butik rangordnad från billigast till dyrast."
                                        : "Den här komponenten har ingen butiksväljare ännu."}
                                    </p>
                                    {customBuildDebugEnabled ? (
                                      <p className="mt-2 text-[11px] text-sky-700 dark:text-sky-300">
                                        {"Debug: Live butik = verifierad butikslänk med pris, Cachad pris = senast sparad eller lokal reservprisdata, Reservpris = katalogpris eller aggregatorpris, Ingen butik = inga butiksträffar."}
                                      </p>
                                    ) : null}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleStorePickerClose}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-[#11667b] hover:text-[#11667b] dark:border-gray-700 dark:text-gray-200"
                                  >
                                    Stäng
                                  </button>
                                </div>
                                {storePickerLoading && isExpanded ? (
                                  <div className="mt-4 rounded-lg border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                                    Hämtar butikslänkar och priser...
                                  </div>
                                ) : null}
                                {storePickerError && isExpanded ? (
                                  <p className="mt-4 text-sm text-amber-600">{storePickerError}</p>
                                ) : null}
                                {showStorePanel ? (
                                  <div className="mt-4 space-y-2">
                                    {storeOffersForItem.map((offer) => (
                                      <div
                                        key={`${item.id}-${offer.store_id || offer.store}`}
                                        className="rounded-lg border border-gray-200 px-3 py-2.5 dark:border-gray-800"
                                      >
                                        <div className="flex items-center justify-between gap-3">
                                          <div className="min-w-0">
                                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {offer.store}
                                          </p>
                                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {getStoreOfferStatusLabel(offer, item, activeCategory)}
                                          </p>
                                        </div>
                                          <div className="flex items-center gap-2">
                                        {offer.product_url ? (
                                          <a
                                            href={offer.product_url || "#"}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-[#11667b] hover:text-[#11667b] dark:border-gray-700 dark:text-gray-200"
                                          >
                                            Till butik
                                          </a>
                                        ) : (
                                          <span className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-400 dark:border-gray-800 dark:text-gray-500">
                                            Ingen länk
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          disabled={!canSelectStoreOffer(offer)}
                                          onClick={() => selectComponentAndAdvance(activeCategory, item, offer)}
                                          className="rounded-lg bg-yellow-400 px-2.5 py-1.5 text-xs font-semibold text-gray-900 transition-colors hover:bg-[#11667b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          Välj
                                        </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="mt-4 rounded-lg border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                                    Välj komponenten direkt för att fortsätta till nästa steg.
                                  </div>
                                )}
                                <div className="mt-4 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={handleSelectWithoutStore}
                                    disabled={!isExpanded}
                                    className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#11667b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Välj utan butik
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <aside className="hidden lg:block self-start">
                <div className="space-y-4 lg:sticky lg:top-24">
                  <div
                    id="build-summary"
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80 scroll-mt-24"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Din build</p>
                    <h3 className="text-xl font-semibold mt-2">Sammanfattning</h3>
                    <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                      {CATEGORY_LIST.map((category) => (
                        <button
                          key={category.key}
                          type="button"
                          onClick={() => {
                            handleCategorySelect(category.key);
                          }}
                          className="flex w-full items-start justify-between gap-3 text-left transition-colors hover:text-gray-900 dark:hover:text-white"
                        >
                          <span className="text-gray-500 dark:text-gray-400">{category.label}</span>
                          <span className="text-right">
                            {selected[category.key]?.name ?? "Ej vald"}
                            {selected[category.key]?.selectedStore ? (
                              <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                                {selected[category.key]?.selectedStore}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatPrice(totalPrice)} kr</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOfferOpen(true)}
                      disabled={!allComponentsSelected}
                      className="mt-4 w-full bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      Skicka offertförfrågan
                    </button>
                    {!allComponentsSelected ? (
                      <p className="mt-2 text-xs text-amber-600">Välj alla komponenter innan du skickar offertförfrågan.</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleShareBuild}
                      className="mt-3 w-full border border-yellow-400 text-yellow-700 dark:text-yellow-300 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:text-white hover:border-[#11667b] transition-colors"
                    >
                      Spara build
                    </button>
                    {shareStatus ? (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{shareStatus}</p>
                    ) : null}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-300">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{"Vad h\u00e4nder sen?"}</p>
                    <ul className="mt-3 space-y-2">
                      <li>{"Vi granskar dina val och s\u00e4kerst\u00e4ller kompatibilitet."}</li>
                      <li>{"Du f\u00e5r en offert med bygg- och leveranstid."}</li>
                      <li>{"N\u00e4r du godk\u00e4nt startar vi bygget."}</li>
                    </ul>
                  </div>
                </div>
              </aside>
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
        className="sm:hidden fixed top-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-gray-900 shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
        aria-label="Komponenter"
      >
        <Menu className="h-5 w-5" />
      </button>
      {showNextBubble ? (
        <button
          type="button"
          onClick={handleNextBubbleClick}
          className="sm:hidden fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full bg-yellow-400 text-gray-900 px-4 py-3 text-sm font-semibold shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
        >
          <span className="text-gray-700/70">{"\u2022"}</span>
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
            : "border-gray-300 bg-white/95 text-gray-700 hover:border-sky-400 hover:text-sky-700 dark:border-gray-700 dark:bg-[#101926]/95 dark:text-gray-200 dark:hover:border-sky-700 dark:hover:text-sky-300"
        }`}
      >
        {customBuildDebugEnabled ? "Debug på" : "Debug av"}
      </button>
      {activeCategory === "ram" ? (
        <div className="fixed bottom-5 right-5 z-40 hidden max-w-xs rounded-2xl border border-yellow-300 bg-white/95 p-4 text-sm text-gray-700 shadow-xl shadow-black/15 backdrop-blur sm:block dark:border-yellow-500/30 dark:bg-[#101926]/95 dark:text-gray-200">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-gray-900">
              <MemoryStick className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">RAM-marknaden</p>
              <p className="mt-1 leading-relaxed">
                {"Priserna p\u00e5 RAM har g\u00e5tt upp med cirka 600% p\u00e5 grund av efterfr\u00e5gan fr\u00e5n AI-datacenter, vilket har skapat brist p\u00e5 chip."}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      {customBuildDebugEnabled ? (
        <div className="fixed bottom-20 left-5 z-40 hidden max-w-xs rounded-2xl border border-sky-300 bg-white/95 p-4 text-sm text-gray-700 shadow-xl shadow-black/15 backdrop-blur sm:block dark:border-sky-800 dark:bg-[#101926]/95 dark:text-gray-200">
          <p className="font-semibold text-gray-900 dark:text-gray-100">Custom Build Debug</p>
          <p className="mt-1 text-xs leading-relaxed">
            {"Källor: "}<span className="font-semibold">Live butik</span>{", "}<span className="font-semibold">Cachad pris</span>{", "}<span className="font-semibold">Reservpris</span>{", "}<span className="font-semibold">Ingen butik</span>{"."}
          </p>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}





