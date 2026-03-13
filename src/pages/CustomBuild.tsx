import { useEffect, useMemo, useRef, useState, type ChangeEvent, type Dispatch, type FormEvent, type SetStateAction } from "react";
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
import caseNzxtH7FlowImage from "../../images/product images/chassi/NZXT H7 Flow.png";
import caseLianLiLancool216Image from "../../images/product images/chassi/Lian Li Lancool 216.png";
import caseFractalDesignNorthImage from "../../images/product images/chassi/Fractal Design North.png";
import caseCorsair4000dAirflowImage from "../../images/product images/chassi/Corsair 4000D Airflow.png";
import casePhanteksEclipseG500aImage from "../../images/product images/chassi/Phanteks Eclipse G500A.png";
import caseBeQuietPureBase500DxImage from "../../images/product images/chassi/be quiet! Pure Base 500DX.png";
import caseCoolerMasterTd500MeshImage from "../../images/product images/chassi/Cooler Master TD500 Mesh.png";
import caseNzxtH5FlowImage from "../../images/product images/chassi/NZXT H5 Flow.png";
import caseLianLiO11DynamicImage from "../../images/product images/chassi/Lian Li O11 Dynamic.png";
import caseFractalDesignMeshify2Image from "../../images/product images/chassi/Fractal Design Meshify 2.png";
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
  offers: StoreOffer[];
};

type CatalogCategoryPricesResponse = {
  ok: boolean;
  category: string;
  prices: Array<{
    item_id: string;
    lowest_price: number | null;
    updated_at?: string | null;
    price_source?: "prisjakt-offer" | "search" | "no-store" | null;
  }>;
};

type CustomBuildPriceSource = "prisjakt-offer" | "seed" | "fallback" | "search" | "no-store";

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

const FALLBACK_COMPONENT_IMAGE = "https://placehold.co/360x240?text=Komponent";
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
  cpu: { src: "https://placehold.co/360x240?text=CPU", alt: "Processor" },
  gpu: { src: "https://placehold.co/360x240?text=GPU", alt: "Grafikkort" },
  motherboard: { src: "https://placehold.co/360x240?text=Moderkort", alt: "Moderkort" },
  ram: { src: "https://placehold.co/360x240?text=RAM", alt: "RAM-minne" },
  storage: { src: "https://placehold.co/360x240?text=SSD", alt: "Lagring" },
  case: { src: "https://placehold.co/360x240?text=Chassi", alt: "Chassi" },
  psu: { src: "https://placehold.co/360x240?text=PSU", alt: "Nätaggregat" },
  cooling: { src: "https://placehold.co/360x240?text=Kylning", alt: "Kylning" },
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
  "psu-4": { wattage: 1000, rating: "Gold", modular: "Modular" },
  "psu-5": { wattage: 1000, rating: "Platinum", modular: "Modular" },
  "psu-6": { wattage: 750, rating: "Gold", modular: "Modular" },
  "psu-7": { wattage: 850, rating: "Gold", modular: "Modular" },
  "psu-8": { wattage: 850, rating: "Gold", modular: "Modular" },
  "psu-9": { wattage: 750, rating: "Gold", modular: "Modular" },
  "psu-10": { wattage: 850, rating: "Gold", modular: "Modular" },
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
      id: "gpu-4",
      name: "Zotac GeForce RTX 3060 Twin Edge 12GB",
      brand: "Zotac",
      price: 3299,
      image: gpu4060Image,
      specs: ["12 GB", "RTX 3060", "1080p+"],
      performanceClass: "Entry",
      gpuModel: "Zotac GeForce RTX 3060 Twin Edge 12GB",
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
      name: "Corsair Vengeance 32GB",
      brand: "Corsair",
      price: 1290,
      ramType: "DDR5",
      image: ramCorsairVengeanceImage,
      specs: ["DDR5", "6000 MHz", "CL36"],
    },
    {
      id: "ram-2",
      name: "G.Skill Trident Z5 32GB",
      brand: "G.Skill",
      price: 1490,
      ramType: "DDR5",
      image: ramGSkillTridentZ5Image,
      specs: ["DDR5", "6400 MHz", "CL32"],
    },
    {
      id: "ram-3",
      name: "Kingston Fury Beast 32GB",
      brand: "Kingston",
      price: 1190,
      ramType: "DDR5",
      image: ramKingstonFuryBeastImage,
      specs: ["DDR5", "6000 MHz", "CL40"],
    },
    {
      id: "ram-4",
      name: "Crucial Pro 32GB",
      brand: "Crucial",
      price: 1090,
      ramType: "DDR5",
      image: ramCrucialProImage,
      specs: ["DDR5", "5600 MHz", "CL46"],
    },
    {
      id: "ram-5",
      name: "Corsair Dominator 64GB",
      brand: "Corsair",
      price: 2690,
      ramType: "DDR5",
      image: ramCorsairDominatorImage,
      specs: ["DDR5", "6000 MHz", "CL30"],
    },
    {
      id: "ram-6",
      name: "G.Skill Ripjaws 32GB",
      brand: "G.Skill",
      price: 990,
      ramType: "DDR4",
      image: ramGSkillRipjawsImage,
      specs: ["DDR4", "3600 MHz", "CL16"],
    },
    {
      id: "ram-7",
      name: "Kingston Fury Renegade 32GB",
      brand: "Kingston",
      price: 1390,
      ramType: "DDR5",
      image: ramKingstonFuryRenegadeImage,
      specs: ["DDR5", "6400 MHz", "CL32"],
    },
    {
      id: "ram-8",
      name: "Crucial Pro 64GB",
      brand: "Crucial",
      price: 2190,
      ramType: "DDR5",
      image: ramCrucialProImage,
      specs: ["DDR5", "5600 MHz", "CL46"],
    },
    {
      id: "ram-9",
      name: "TeamGroup T-Force Delta 32GB",
      brand: "TeamGroup",
      price: 1290,
      ramType: "DDR5",
      image: ramTeamGroupTForceDeltaImage,
      specs: ["DDR5", "6000 MHz", "RGB"],
    },
    {
      id: "ram-10",
      name: "ADATA XPG Lancer 32GB",
      brand: "ADATA",
      price: 1190,
      ramType: "DDR5",
      image: ramAdataXpgLancerImage,
      specs: ["DDR5", "6000 MHz", "RGB"],
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
      name: "Corsair Dominator RGB DDR4 3600MHz 32GB",
      brand: "Corsair",
      price: 1200,
      ramType: "DDR4",
      image: ramCorsairDominatorDdr4Image,
      specs: ["DDR4", "32GB", "3600 MHz", "RGB"],
    },
    {
      id: "ram-13",
      name: "32GB DDR4",
      brand: "Generic",
      price: 900,
      ramType: "DDR4",
      image: ramKingston32GbDdr5Image,
      specs: ["DDR4", "32GB"],
    },
    {
      id: "ram-14",
      name: "Dell 32GB DDR5 5600MHz (begagnad)",
      brand: "Dell",
      price: 900,
      ramType: "DDR5",
      image: ramDellGenericImage,
      specs: ["DDR5", "32GB", "5600 MHz", "Begagnad"],
    },
    {
      id: "ram-15",
      name: "Dell 32GB DDR5 5600MHz",
      brand: "Dell",
      price: 1100,
      ramType: "DDR5",
      image: ramDellGenericImage,
      specs: ["DDR5", "32GB", "5600 MHz"],
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
      name: "Corsair Vengeance 16GB (2x8GB)",
      brand: "Corsair",
      price: 699,
      ramType: "DDR5",
      image: ramCorsairVengeanceImage,
      specs: ["DDR5", "16GB", "5600 MHz"],
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
      name: "Kingston Fury Beast 16GB (2x8GB)",
      brand: "Kingston",
      price: 729,
      ramType: "DDR5",
      image: ramKingstonFuryBeastImage,
      specs: ["DDR5", "16GB", "5600 MHz"],
    },
    {
      id: "ram-20",
      name: "Corsair Vengeance RGB 16GB (2x8GB)",
      brand: "Corsair",
      price: 829,
      ramType: "DDR5",
      image: ramCorsairVengeanceImage,
      specs: ["DDR5", "16GB", "RGB"],
    },
    {
      id: "ram-21",
      name: "Corsair Vengeance RGB 32GB (2x16GB)",
      brand: "Corsair",
      price: 1299,
      ramType: "DDR5",
      image: ramCorsairVengeanceImage,
      specs: ["DDR5", "32GB", "RGB"],
    },
    {
      id: "ram-22",
      name: "Corsair Vengeance 32GB (2x16GB)",
      brand: "Corsair",
      price: 1190,
      ramType: "DDR5",
      image: ramCorsairVengeanceImage,
      specs: ["DDR5", "32GB", "6000 MHz"],
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
      name: "Kingston Fury Beast RGB 32GB (2x16GB)",
      brand: "Kingston",
      price: 1290,
      ramType: "DDR5",
      image: ramKingstonFuryBeastImage,
      specs: ["DDR5", "32GB", "RGB"],
    },
    {
      id: "ram-26",
      name: "Corsair Dominator Platinum RGB 64GB (2x32GB)",
      brand: "Corsair",
      price: 2790,
      ramType: "DDR5",
      image: ramCorsairDominatorImage,
      specs: ["DDR5", "64GB", "RGB"],
    },
    {
      id: "ram-27",
      name: "Kingston Fury Beast Black 64GB (2x32GB)",
      brand: "Kingston",
      price: 2290,
      ramType: "DDR5",
      image: ramKingstonFuryBeastImage,
      specs: ["DDR5", "64GB", "Svart"],
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
      name: "Kingston Fury Beast RGB 64GB (2x32GB)",
      brand: "Kingston",
      price: 2490,
      ramType: "DDR5",
      image: ramKingstonFuryBeastImage,
      specs: ["DDR5", "64GB", "RGB"],
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
  ],
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
      name: "WD Blue SN580 1TB",
      brand: "WD",
      price: 790,
      image: storageWdBlueSn580Image,
      specs: ["NVMe", "PCIe 4.0", "4150 MB/s"],
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
      id: "sto-9",
      name: "Crucial MX500 1TB",
      brand: "Crucial",
      price: 890,
      image: storageCrucialMx500Image,
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
      id: "sto-11",
      name: "Team Group T-Force G50",
      brand: "TeamGroup",
      price: 900,
      image: storageTeamGroupG50Image,
      specs: ["SSD"],
    },
    {
      id: "sto-13",
      name: "Lexar Professional NM1090",
      brand: "Lexar",
      price: 1200,
      image: storageLexarNm1090Image,
      specs: ["NVMe"],
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
      price: 999,
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
      id: "sto-22",
      name: "Team Group MP33 256GB",
      brand: "TeamGroup",
      price: 399,
      image: storageTeamGroupG50Image,
      specs: ["NVMe", "256GB"],
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
      price: 1190,
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
      name: "Crucial P510 med kylflansar (2TB)",
      brand: "Crucial",
      price: 1690,
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
      name: "WD Black SN7100 4TB Gen 4",
      brand: "WD",
      price: 2990,
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
      image: caseNzxtH7FlowImage,
      specs: ["ATX", "Mesh", "Svart"],
    },
    {
      id: "case-2",
      name: "Lian Li Lancool 216",
      brand: "Lian Li",
      price: 1290,
      image: caseLianLiLancool216Image,
      specs: ["ATX", "Airflow", "RGB"],
    },
    {
      id: "case-3",
      name: "Fractal Design North",
      brand: "Fractal",
      price: 1490,
      image: caseFractalDesignNorthImage,
      specs: ["ATX", "Träpanel", "Airflow"],
      highlight: "Designfavorit",
    },
    {
      id: "case-4",
      name: "Corsair 4000D Airflow",
      brand: "Corsair",
      price: 1090,
      image: caseCorsair4000dAirflowImage,
      specs: ["ATX", "Mesh", "Tyst"],
    },
    {
      id: "case-5",
      name: "Phanteks Eclipse G500A",
      brand: "Phanteks",
      price: 1390,
      image: casePhanteksEclipseG500aImage,
      specs: ["ATX", "RGB", "Airflow"],
    },
    {
      id: "case-6",
      name: "be quiet! Pure Base 500DX",
      brand: "be quiet!",
      price: 1290,
      image: caseBeQuietPureBase500DxImage,
      specs: ["ATX", "Tyst", "RGB"],
    },
    {
      id: "case-7",
      name: "Cooler Master TD500 Mesh",
      brand: "Cooler Master",
      price: 1190,
      image: caseCoolerMasterTd500MeshImage,
      specs: ["ATX", "Mesh", "ARGB"],
    },
    {
      id: "case-8",
      name: "NZXT H5 Flow",
      brand: "NZXT",
      price: 1090,
      image: caseNzxtH5FlowImage,
      specs: ["ATX", "Kompakt", "Svart"],
    },
    {
      id: "case-9",
      name: "Lian Li O11 Dynamic",
      brand: "Lian Li",
      price: 1690,
      image: caseLianLiO11DynamicImage,
      specs: ["ATX", "Glas", "Showcase"],
    },
    {
      id: "case-10",
      name: "Fractal Design Meshify 2",
      brand: "Fractal",
      price: 1690,
      image: caseFractalDesignMeshify2Image,
      specs: ["ATX", "Mesh", "Modulär"],
    },
    {
      id: "case-11",
      name: "DeepCool CG530 4F",
      brand: "DeepCool",
      price: 899,
      image: caseCoolerMasterTd500MeshImage,
      specs: ["ATX", "4x fans", "Svart"],
    },
    {
      id: "case-12",
      name: "DeepCool CG530 4F Vit",
      brand: "DeepCool",
      price: 949,
      image: caseCoolerMasterTd500MeshImage,
      specs: ["ATX", "4x fans", "Vit"],
    },
    {
      id: "case-13",
      name: "Phanteks XT Pro Ultra",
      brand: "Phanteks",
      price: 999,
      image: casePhanteksEclipseG500aImage,
      specs: ["ATX", "Airflow", "RGB"],
    },
    {
      id: "case-14",
      name: "Lian Li Vector V100 PC-chassi (svart)",
      brand: "Lian Li",
      price: 1290,
      image: caseLianLiO11DynamicImage,
      specs: ["ATX", "Showcase", "Svart"],
    },
    {
      id: "case-15",
      name: "Lian Li A3",
      brand: "Lian Li",
      price: 899,
      image: caseLianLiLancool216Image,
      specs: ["mATX", "Compact", "Mesh"],
    },
    {
      id: "case-16",
      name: "NZXT H6 Flow Case Dual Chamber RGB",
      brand: "NZXT",
      price: 1490,
      image: caseNzxtH7FlowImage,
      specs: ["ATX", "Dual chamber", "RGB"],
    },
    {
      id: "case-17",
      name: "DeepCool CG530 Svart",
      brand: "DeepCool",
      price: 829,
      image: caseCoolerMasterTd500MeshImage,
      specs: ["ATX", "Airflow", "Svart"],
    },
    {
      id: "case-18",
      name: "Fractal Design North XL",
      brand: "Fractal",
      price: 1990,
      image: caseFractalDesignNorthImage,
      specs: ["ATX", "XL", "Trapanel"],
    },
    {
      id: "case-19",
      name: "O11 Vision Compact PC-chassi (svart)",
      brand: "Lian Li",
      price: 1490,
      image: caseLianLiO11DynamicImage,
      specs: ["ATX", "Compact", "Svart"],
    },
    {
      id: "case-20",
      name: "Lian Li O11 Vision Compact (Vit/Transparent)",
      brand: "Lian Li",
      price: 1590,
      image: caseLianLiO11DynamicImage,
      specs: ["ATX", "Compact", "Vit"],
    },
    {
      id: "case-21",
      name: "Corsair 3500X",
      brand: "Corsair",
      price: 1490,
      image: caseCorsair4000dAirflowImage,
      specs: ["ATX", "Showcase", "RGB"],
    },
    {
      id: "case-22",
      name: "Lian Li O11D Mini V2 White",
      brand: "Lian Li",
      price: 1390,
      image: caseLianLiO11DynamicImage,
      specs: ["ATX", "Mini", "Vit"],
    },
    {
      id: "case-23",
      name: "Phanteks XT View",
      brand: "Phanteks",
      price: 999,
      image: casePhanteksEclipseG500aImage,
      specs: ["ATX", "Glass", "Showcase"],
    },
    {
      id: "case-24",
      name: "Chieftec Visio Svart RGB",
      brand: "Chieftec",
      price: 999,
      image: caseNzxtH5FlowImage,
      specs: ["ATX", "RGB", "Svart"],
    },
    {
      id: "case-25",
      name: "DeepCool CG530 Vit",
      brand: "DeepCool",
      price: 849,
      image: caseCoolerMasterTd500MeshImage,
      specs: ["ATX", "Airflow", "Vit"],
    },
    {
      id: "case-26",
      name: "Cooler Master Elite 301 Mini Tower (svart)",
      brand: "Cooler Master",
      price: 699,
      image: caseCoolerMasterTd500MeshImage,
      specs: ["mATX", "Mini tower", "Svart"],
    },
    {
      id: "case-27",
      name: "Thermaltake View 170 TG ARGB",
      brand: "Thermaltake",
      price: 799,
      image: caseNzxtH5FlowImage,
      specs: ["mATX", "ARGB", "Glass"],
    },
    {
      id: "case-28",
      name: "Kolink Observatory HF",
      brand: "Kolink",
      price: 749,
      image: caseNzxtH5FlowImage,
      specs: ["ATX", "Mesh", "RGB"],
    },
    {
      id: "case-29",
      name: "Kolink Observatory HF Glass Vit",
      brand: "Kolink",
      price: 799,
      image: caseNzxtH5FlowImage,
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
      name: "Seasonic Vertex GX-1000",
      brand: "Seasonic",
      price: 2490,
      image: psuSeasonicVertexGx1000Image,
      specs: ["1000W", "80+ Gold", "ATX 3.0"],
    },
    {
      id: "psu-5",
      name: "be quiet! Straight Power 12",
      brand: "be quiet!",
      price: 2290,
      image: psuBeQuietStraightPower12Image,
      specs: ["1000W", "80+ Platinum", "ATX 3.0"],
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
      name: "ASUS TUF Gaming 850G",
      brand: "ASUS",
      price: 1690,
      image: psuAsusTufGaming850gImage,
      specs: ["850W", "80+ Gold", "Tuff byggd"],
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

const getCategoryItems = (category: CategoryKey): ComponentItem[] => {
  if (category === "cpu") return catalogComponentItems.cpu;
  if (category === "motherboard") return catalogComponentItems.motherboard;
  return staticComponentItemsWithPreloadedPrices[category];
};

const formatPrice = (price: number) => price.toLocaleString("sv-SE");
const formatCurrencyPrice = (price: number, currency = "SEK") =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency }).format(price);
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
  const [socketFilters, setSocketFilters] = useState<string[]>([]);
  const [chipsetFilters, setChipsetFilters] = useState<string[]>([]);
  const [ramTypeFilters, setRamTypeFilters] = useState<string[]>([]);
  const [formFactorFilters, setFormFactorFilters] = useState<string[]>([]);
  const [pcieGenerationFilters, setPcieGenerationFilters] = useState<string[]>([]);
  const [storageTypeFilters, setStorageTypeFilters] = useState<string[]>([]);
  const [cpuChipFilter, setCpuChipFilter] = useState("Alla");
  const [gpuPerformanceFilters, setGpuPerformanceFilters] = useState<string[]>([]);
  const [gpuChipFilter, setGpuChipFilter] = useState("Alla");
  const [gpuExactModelFilter, setGpuExactModelFilter] = useState("Alla");
  const [psuRatingFilters, setPsuRatingFilters] = useState<string[]>([]);
  const [psuModularFilter, setPsuModularFilter] = useState<"Alla" | "Modular">("Alla");
  const [psuWattageRange, setPsuWattageRange] = useState<[number, number]>([0, 0]);
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
  const [priceSourceByItemId, setPriceSourceByItemId] = useState<Record<string, CustomBuildPriceSource>>(() =>
    Object.fromEntries(
      Object.keys(CUSTOM_BUILD_PRELOADED_PRICE_BY_ID).map((itemId) => [itemId, "seed" as CustomBuildPriceSource])
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
      return "seed";
    }
    return "fallback";
  };

  const getPriceSourceLabel = (item: ComponentItem) => {
    const source = getPriceSource(item);
    switch (source) {
      case "prisjakt-offer":
        return "Prisjakt-offer";
      case "seed":
        return "Seed";
      case "search":
        return "Search-link";
      case "no-store":
        return "No-store";
      default:
        return "Fallback";
    }
  };

  const brandOptions = useMemo(() => {
    const brands = Array.from(new Set(items.map((item) => item.brand)));
    return ["Alla", ...brands];
  }, [items]);

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

  const psuWattageBounds = useMemo(() => {
    const values = COMPONENTS.psu
      .map((item) => getItemPsuWattage(item))
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;
    return { min, max };
  }, []);

  useEffect(() => {
    setPsuWattageRange([psuWattageBounds.min, psuWattageBounds.max]);
  }, [psuWattageBounds.min, psuWattageBounds.max]);

  const socketFilterOptions = useMemo(
    () => Array.from(new Set(items.map((item) => getItemSocketFilterValue(item)).filter(Boolean))),
    [items]
  );
  const chipsetFilterOptions = useMemo(
    () => Array.from(new Set(items.map((item) => getItemChipsetFilterValue(item)).filter(Boolean))).sort((a, b) => a.localeCompare(b, "sv")),
    [items]
  );
  const gpuPerformanceFilterOptions = useMemo(
    () => Array.from(new Set(items.map((item) => getItemGpuPerformanceClass(item)).filter(Boolean))),
    [items]
  );
  const cpuChipFilterOptions = useMemo(
    () => Array.from(new Set(items.map((item) => getItemCpuChip(item)).filter(Boolean))).sort((a, b) => a.localeCompare(b, "sv")),
    [items]
  );
  const gpuChipFilterOptions = useMemo(
    () => Array.from(new Set(items.map((item) => getItemGpuChip(item)).filter(Boolean))).sort((a, b) => a.localeCompare(b, "sv")),
    [items]
  );
  const gpuExactModelFilterOptions = useMemo(
    () => Array.from(new Set(items.map((item) => getItemGpuExactModel(item)).filter(Boolean))).sort((a, b) => a.localeCompare(b, "sv")),
    [items]
  );
  const ramTypeFilterOptions = useMemo(
    () => Array.from(new Set(items.map((item) => getItemRamTypeFilterValue(item)).filter(Boolean))),
    [items]
  );
  const formFactorFilterOptions = useMemo(
    () => Array.from(new Set(items.map((item) => getItemFormFactorFilterValue(item)).filter(Boolean))),
    [items]
  );
  const pcieGenerationFilterOptions = useMemo(
    () => Array.from(new Set(items.map((item) => getItemPcieGenerationFilterValue(item)).filter(Boolean))),
    [items]
  );
  const storageTypeFilterOptions = useMemo(
    () => Array.from(new Set(items.map((item) => getItemStorageTypeFilterValue(item)).filter(Boolean))),
    [items]
  );
  const psuRatingFilterOptions = useMemo(
    () => Array.from(new Set(items.map((item) => getItemPsuRating(item)).filter(Boolean))),
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
        const endpoint = `${normalizedApiBase}/api/custom-build/catalog-prices?category=${encodeURIComponent(
          activeCategory
        )}`;
        const response = await fetch(endpoint);
        if (!response.ok) return;
        const data = (await response.json().catch(() => ({}))) as CatalogCategoryPricesResponse;
        const nextEntries = Array.isArray(data?.prices) ? data.prices : [];
        if (isCancelled || nextEntries.length === 0) return;
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
            if (Number.isFinite(entry?.lowest_price) && Number(entry.lowest_price) > 0) {
              nextState[entry.item_id] = "prisjakt-offer";
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
      } catch (error) {
        // Keep reference prices if the catalog price endpoint is temporarily unavailable.
      }
    };

    void loadLowestPrices();
    return () => {
      isCancelled = true;
    };
  }, [items, normalizedApiBase, activeCategory]);

  const toggleArrayFilter = (
    value: string,
    setter: Dispatch<SetStateAction<string[]>>
  ) => {
    setter((prev) => (prev.includes(value) ? prev.filter((entry) => entry !== value) : [...prev, value]));
  };

  const usesSocketFilters = activeCategory === "cpu" || activeCategory === "motherboard";
  const usesChipsetFilters = activeCategory === "motherboard";
  const usesGpuFilters = activeCategory === "gpu";
  const usesRamTypeFilters = activeCategory === "motherboard" || activeCategory === "ram";
  const usesFormFactorFilters = activeCategory === "motherboard" || activeCategory === "case";
  const usesPcieGenerationFilters = activeCategory === "motherboard" || activeCategory === "storage";
  const usesStorageTypeFilters = activeCategory === "storage";
  const usesPsuFilters = activeCategory === "psu";

  const clearAdvancedFilters = () => {
    if (usesSocketFilters) setSocketFilters([]);
    if (usesChipsetFilters) setChipsetFilters([]);
    if (activeCategory === "cpu") setCpuChipFilter("Alla");
    if (usesGpuFilters) {
      setGpuPerformanceFilters([]);
      setGpuChipFilter("Alla");
      setGpuExactModelFilter("Alla");
    }
    if (usesRamTypeFilters) setRamTypeFilters([]);
    if (usesFormFactorFilters) setFormFactorFilters([]);
    if (usesPcieGenerationFilters) setPcieGenerationFilters([]);
    if (usesStorageTypeFilters) setStorageTypeFilters([]);
    if (usesPsuFilters) {
      setPsuRatingFilters([]);
      setPsuModularFilter("Alla");
      setPsuWattageRange([psuWattageBounds.min, psuWattageBounds.max]);
    }
  };

  const hasActiveAdvancedFilters =
    (usesSocketFilters && socketFilters.length > 0) ||
    (usesChipsetFilters && chipsetFilters.length > 0) ||
    (activeCategory === "cpu" && cpuChipFilter !== "Alla") ||
    (usesGpuFilters && (gpuPerformanceFilters.length > 0 || gpuChipFilter !== "Alla" || gpuExactModelFilter !== "Alla")) ||
    (usesRamTypeFilters && ramTypeFilters.length > 0) ||
    (usesFormFactorFilters && formFactorFilters.length > 0) ||
    (usesPcieGenerationFilters && pcieGenerationFilters.length > 0) ||
    (usesStorageTypeFilters && storageTypeFilters.length > 0) ||
    (usesPsuFilters &&
      (psuRatingFilters.length > 0 ||
        psuModularFilter !== "Alla" ||
        psuWattageRange[0] !== psuWattageBounds.min ||
        psuWattageRange[1] !== psuWattageBounds.max));

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesBrand = activeBrand === "Alla" || item.brand === activeBrand;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const selectedMotherboardSocket = selected.motherboard?.socket;
      const selectedCpuSocket = selected.cpu?.socket;
      const allowedRamType = selectedMotherboardSocket
        ? SOCKET_RAM_TYPE[selectedMotherboardSocket]
        : null;
      const matchesSocket =
        activeCategory === "cpu" && selectedMotherboardSocket
          ? item.socket === selectedMotherboardSocket
          : activeCategory === "motherboard" && selectedCpuSocket
          ? item.socket === selectedCpuSocket
          : true;
      const matchesRamType =
        activeCategory !== "ram" || !allowedRamType ? true : item.ramType === allowedRamType;
      const matchesPrice = getComparablePrice(item, activeCategory) <= priceRange[1];
      const itemSocket = getItemSocketFilterValue(item);
      const itemChipset = getItemChipsetFilterValue(item);
      const itemCpuChip = getItemCpuChip(item);
      const itemGpuPerformanceClass = getItemGpuPerformanceClass(item);
      const itemGpuChip = getItemGpuChip(item);
      const itemGpuExactModel = getItemGpuExactModel(item);
      const itemRamType = getItemRamTypeFilterValue(item);
      const itemFormFactor = getItemFormFactorFilterValue(item);
      const itemPcieGeneration = getItemPcieGenerationFilterValue(item);
      const itemStorageType = getItemStorageTypeFilterValue(item);
      const itemPsuRating = getItemPsuRating(item);
      const itemPsuModular = getItemPsuModularValue(item);
      const itemPsuWattage = getItemPsuWattage(item);

      const matchesSelectedSocketFilter =
        !usesSocketFilters || socketFilters.length === 0 || (itemSocket ? socketFilters.includes(itemSocket) : false);
      const matchesSelectedChipsetFilter =
        !usesChipsetFilters || chipsetFilters.length === 0 || (itemChipset ? chipsetFilters.includes(itemChipset) : false);
      const matchesSelectedCpuChipFilter =
        activeCategory !== "cpu" || cpuChipFilter === "Alla" || itemCpuChip === cpuChipFilter;
      const matchesSelectedGpuPerformanceFilter =
        !usesGpuFilters ||
        gpuPerformanceFilters.length === 0 ||
        (itemGpuPerformanceClass ? gpuPerformanceFilters.includes(itemGpuPerformanceClass) : false);
      const matchesSelectedGpuChipFilter =
        !usesGpuFilters || gpuChipFilter === "Alla" || itemGpuChip === gpuChipFilter;
      const matchesSelectedGpuExactModelFilter =
        !usesGpuFilters || gpuExactModelFilter === "Alla" || itemGpuExactModel === gpuExactModelFilter;
      const matchesSelectedRamTypeFilter =
        !usesRamTypeFilters || ramTypeFilters.length === 0 || (itemRamType ? ramTypeFilters.includes(itemRamType) : false);
      const matchesSelectedFormFactorFilter =
        !usesFormFactorFilters ||
        formFactorFilters.length === 0 ||
        (itemFormFactor ? formFactorFilters.includes(itemFormFactor) : false);
      const matchesSelectedPcieGenerationFilter =
        !usesPcieGenerationFilters ||
        pcieGenerationFilters.length === 0 ||
        (itemPcieGeneration ? pcieGenerationFilters.includes(itemPcieGeneration) : false);
      const matchesSelectedStorageTypeFilter =
        !usesStorageTypeFilters ||
        storageTypeFilters.length === 0 ||
        (itemStorageType ? storageTypeFilters.includes(itemStorageType) : false);
      const matchesSelectedPsuRatingFilter =
        !usesPsuFilters ||
        psuRatingFilters.length === 0 ||
        (itemPsuRating ? psuRatingFilters.includes(itemPsuRating) : false);
      const matchesSelectedPsuModularFilter =
        !usesPsuFilters || psuModularFilter === "Alla" || itemPsuModular === psuModularFilter;
      const matchesSelectedPsuWattage =
        !usesPsuFilters ||
        itemPsuWattage === null ||
        (itemPsuWattage >= psuWattageRange[0] && itemPsuWattage <= psuWattageRange[1]);

      return (
        matchesBrand &&
        matchesSearch &&
        matchesSocket &&
        matchesRamType &&
        matchesPrice &&
        matchesSelectedSocketFilter &&
        matchesSelectedChipsetFilter &&
        matchesSelectedCpuChipFilter &&
        matchesSelectedGpuPerformanceFilter &&
        matchesSelectedGpuChipFilter &&
        matchesSelectedGpuExactModelFilter &&
        matchesSelectedRamTypeFilter &&
        matchesSelectedFormFactorFilter &&
        matchesSelectedPcieGenerationFilter &&
        matchesSelectedStorageTypeFilter &&
        matchesSelectedPsuRatingFilter &&
        matchesSelectedPsuModularFilter &&
        matchesSelectedPsuWattage
      );
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
    cpuChipFilter,
    gpuPerformanceFilters,
    gpuChipFilter,
    gpuExactModelFilter,
    ramTypeFilters,
    formFactorFilters,
    pcieGenerationFilters,
    storageTypeFilters,
    psuRatingFilters,
    psuModularFilter,
    psuWattageRange,
    usesSocketFilters,
    usesChipsetFilters,
    usesGpuFilters,
    usesRamTypeFilters,
    usesFormFactorFilters,
    usesPcieGenerationFilters,
    usesStorageTypeFilters,
    usesPsuFilters,
  ]);


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
  const expandedStoreOffers = Array.isArray(expandedStoreSnapshot?.offers)
    ? expandedStoreSnapshot.offers.filter(
        (offer) => Boolean(offer.product_url) || Boolean(offer.search_url) || Number.isFinite(offer.total_price ?? offer.price)
      )
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
    const cachedOffers = Array.isArray(cachedResult?.offers) ? cachedResult.offers : [];
    if (cachedResult && cachedOffers.length > 0) {
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
      const offers = Array.isArray(data?.offers) ? data.offers : [];
      const hasPricedOffer = offers.some(
        (offer) => offer.status === "available" && Number.isFinite(offer.total_price ?? offer.price)
      );
      const hasLinkedOffer = offers.some((offer) => Boolean(offer.product_url) || Boolean(offer.search_url));
      setStorePickerCache((prev) => ({ ...prev, [cacheKey]: { ok: true, item_id: item.id, offers } }));
      if (offers.length === 0) {
        setItemsWithoutStorePrice((prev) => ({ ...prev, [item.id]: true }));
        setPriceSourceByItemId((prev) => ({ ...prev, [item.id]: "no-store" }));
        setStorePickerError("Inga butikstr?ffar hittades f?r komponenten.");
      } else {
        setPriceSourceByItemId((prev) => ({
          ...prev,
          [item.id]: hasPricedOffer ? "prisjakt-offer" : hasLinkedOffer ? "search" : "no-store",
        }));
        if (hasPricedOffer) {
          setItemsWithoutStorePrice((prev) => {
            if (!prev[item.id]) return prev;
            const nextState = { ...prev };
            delete nextState[item.id];
            return nextState;
          });
        } else {
          setItemsWithoutStorePrice((prev) => {
            if (!prev[item.id]) return prev;
            const nextState = { ...prev };
            delete nextState[item.id];
            return nextState;
          });
        }
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

  const getStoreOfferStatusLabel = (offer: StoreOffer) => {
    if (offer.status === "available" && Number.isFinite(offer.total_price ?? offer.price)) {
      return formatCurrencyPrice(Number(offer.total_price ?? offer.price), offer.currency || "SEK");
    }
    if (offer.status === "linked_no_price") return "Pris saknas";
    if (offer.status === "search_only") return "Sok i butik";
    if (offer.status === "unavailable") return "Ej tillg?nglig";
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

            <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)_340px] items-start">
              <aside className={`space-y-4 ${mobileSidebarOpen ? "block" : "hidden"} lg:block lg:sticky lg:top-24 lg:self-start`}>
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
                    Är du osäker? Välj en budgetnivå i början och uppgradera stegvis. Vi hjälper dig hitta rätt balans.
                  </p>
                  <Link
                    to="/kundservice"
                    className="mt-4 inline-flex items-center justify-center gap-2 border border-yellow-400 text-yellow-700 dark:text-yellow-300 font-semibold px-4 py-2 rounded-lg hover:bg-[#11667b] hover:border-[#11667b] hover:text-white transition-colors"
                  >
                    Få rådgivning
                  </Link>
                </div>
              </aside>

              <div className="space-y-6">
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
                  <div className="mt-4 flex flex-wrap gap-2">
                    {brandOptions.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => setActiveBrand(brand)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold border transition-colors ${
                          activeBrand === brand
                            ? "bg-yellow-400 text-gray-900 border-yellow-400"
                            : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-500"
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-800">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Filter</p>
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

                    {(activeCategory === "cpu" || activeCategory === "motherboard") && socketFilterOptions.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Socket</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {socketFilterOptions.map((socket) => (
                            <button
                              key={socket}
                              type="button"
                              onClick={() => toggleArrayFilter(socket, setSocketFilters)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                socketFilters.includes(socket)
                                  ? "border-yellow-400 bg-yellow-400 text-gray-900"
                                  : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {socket}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {activeCategory === "motherboard" && chipsetFilterOptions.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Chipset</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {chipsetFilterOptions.map((chipset) => (
                            <button
                              key={chipset}
                              type="button"
                              onClick={() => toggleArrayFilter(chipset, setChipsetFilters)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                chipsetFilters.includes(chipset)
                                  ? "border-yellow-400 bg-yellow-400 text-gray-900"
                                  : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {chipset}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {activeCategory === "cpu" && cpuChipFilterOptions.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">CPU-chip</p>
                        <div className="mt-2">
                          <select
                            value={cpuChipFilter}
                            onChange={(event) => setCpuChipFilter(event.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-yellow-400 focus:outline-none dark:border-gray-700 dark:bg-[#0f1824] dark:text-gray-100"
                          >
                            <option value="Alla">Alla chip</option>
                            {cpuChipFilterOptions.map((cpuChip) => (
                              <option key={cpuChip} value={cpuChip}>
                                {cpuChip}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : null}

                    {activeCategory === "gpu" && gpuPerformanceFilterOptions.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Prestandaklass</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {gpuPerformanceFilterOptions.map((performanceClass) => (
                            <button
                              key={performanceClass}
                              type="button"
                              onClick={() => toggleArrayFilter(performanceClass, setGpuPerformanceFilters)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                gpuPerformanceFilters.includes(performanceClass)
                                  ? "border-yellow-400 bg-yellow-400 text-gray-900"
                                  : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {performanceClass}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {activeCategory === "gpu" && gpuChipFilterOptions.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">GPU-chip</p>
                        <div className="mt-2">
                          <select
                            value={gpuChipFilter}
                            onChange={(event) => setGpuChipFilter(event.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-yellow-400 focus:outline-none dark:border-gray-700 dark:bg-[#0f1824] dark:text-gray-100"
                          >
                            <option value="Alla">Alla chip</option>
                            {gpuChipFilterOptions.map((gpuChip) => (
                              <option key={gpuChip} value={gpuChip}>
                                {gpuChip}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : null}

                    {activeCategory === "gpu" && gpuExactModelFilterOptions.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Exakt modell</p>
                        <div className="mt-2">
                          <select
                            value={gpuExactModelFilter}
                            onChange={(event) => setGpuExactModelFilter(event.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-yellow-400 focus:outline-none dark:border-gray-700 dark:bg-[#0f1824] dark:text-gray-100"
                          >
                            <option value="Alla">Alla modeller</option>
                            {gpuExactModelFilterOptions.map((gpuModel) => (
                              <option key={gpuModel} value={gpuModel}>
                                {gpuModel}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : null}

                    {(activeCategory === "motherboard" || activeCategory === "ram") && ramTypeFilterOptions.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Minne</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {ramTypeFilterOptions.map((ramType) => (
                            <button
                              key={ramType}
                              type="button"
                              onClick={() => toggleArrayFilter(ramType, setRamTypeFilters)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                ramTypeFilters.includes(ramType)
                                  ? "border-yellow-400 bg-yellow-400 text-gray-900"
                                  : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {ramType}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {(activeCategory === "motherboard" || activeCategory === "case") && formFactorFilterOptions.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Formfaktor</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {formFactorFilterOptions.map((formFactor) => (
                            <button
                              key={formFactor}
                              type="button"
                              onClick={() => toggleArrayFilter(formFactor, setFormFactorFilters)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                formFactorFilters.includes(formFactor)
                                  ? "border-yellow-400 bg-yellow-400 text-gray-900"
                                  : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {formFactor}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {(activeCategory === "motherboard" || activeCategory === "storage") && pcieGenerationFilterOptions.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">PCIe-generation</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {pcieGenerationFilterOptions.map((pcieGeneration) => (
                            <button
                              key={pcieGeneration}
                              type="button"
                              onClick={() => toggleArrayFilter(pcieGeneration, setPcieGenerationFilters)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                pcieGenerationFilters.includes(pcieGeneration)
                                  ? "border-yellow-400 bg-yellow-400 text-gray-900"
                                  : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {pcieGeneration}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {activeCategory === "storage" && storageTypeFilterOptions.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Lagringstyp</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {storageTypeFilterOptions.map((storageType) => (
                            <button
                              key={storageType}
                              type="button"
                              onClick={() => toggleArrayFilter(storageType, setStorageTypeFilters)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                storageTypeFilters.includes(storageType)
                                  ? "border-yellow-400 bg-yellow-400 text-gray-900"
                                  : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {storageType}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {activeCategory === "psu" ? (
                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Effekt</p>
                          <div className="mt-2 flex items-center gap-3">
                            <input
                              type="range"
                              min={psuWattageBounds.min}
                              max={psuWattageBounds.max}
                              step="50"
                              value={psuWattageRange[1]}
                              onChange={(event) =>
                                setPsuWattageRange([psuWattageBounds.min, Number(event.target.value)])
                              }
                              className="h-1 w-full max-w-[260px] accent-yellow-400"
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {psuWattageRange[0]}-{psuWattageRange[1]} W
                            </span>
                          </div>
                        </div>

                        {psuRatingFilterOptions.length > 0 ? (
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">80+ rating</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {psuRatingFilterOptions.map((rating) => (
                                <button
                                  key={rating}
                                  type="button"
                                  onClick={() => toggleArrayFilter(rating, setPsuRatingFilters)}
                                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    psuRatingFilters.includes(rating)
                                      ? "border-yellow-400 bg-yellow-400 text-gray-900"
                                      : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {rating}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Kablage</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {["Alla", "Modular"].map((modularOption) => (
                              <button
                                key={modularOption}
                                type="button"
                                onClick={() => setPsuModularFilter(modularOption as "Alla" | "Modular")}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                  psuModularFilter === modularOption
                                    ? "border-yellow-400 bg-yellow-400 text-gray-900"
                                    : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {modularOption}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredItems.map((item) => {
                    const isSelected = selected[activeCategory]?.id === item.id;
                    const isExpanded = expandedItemId === item.id && expandedItemCategory === activeCategory;
                    const ActiveIcon = activeConfig?.icon ?? Cpu;
                    const categoryImage = CATEGORY_IMAGES[activeCategory];
                    const imageSrc = item.image ?? categoryImage?.src ?? FALLBACK_COMPONENT_IMAGE;
                    const imageAlt = item.image ? item.name : (categoryImage?.alt ?? "Komponent");
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
                                        Debug: Prisjakt-offer = live butik, Seed = preloadad prisfil, Fallback = katalogpris, Search-link = butikssokning, No-store = inga butikstraffar.
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
                                            {getStoreOfferStatusLabel(offer)}
                                          </p>
                                        </div>
                                          <div className="flex items-center gap-2">
                                        {offer.product_url || offer.search_url ? (
                                          <a
                                            href={offer.product_url || offer.search_url || "#"}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-[#11667b] hover:text-[#11667b] dark:border-gray-700 dark:text-gray-200"
                                          >
                                            {offer.product_url ? "Till butik" : "Sok i butik"}
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

              <aside className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
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
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Vad händer sen?</p>
                  <ul className="mt-3 space-y-2">
                    <li>Vi granskar dina val och säkerställer kompatibilitet.</li>
                    <li>Du får en offert med bygg- och leveranstid.</li>
                    <li>När du godkänt startar vi bygget.</li>
                  </ul>
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
        {customBuildDebugEnabled ? "Debug pa" : "Debug av"}
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
                {"Priserna på RAM har gått upp med cirka 600% på grund av efterfrågan från AI-datacenter, vilket har skapat brist på chip."}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      {customBuildDebugEnabled ? (
        <div className="fixed bottom-20 left-5 z-40 hidden max-w-xs rounded-2xl border border-sky-300 bg-white/95 p-4 text-sm text-gray-700 shadow-xl shadow-black/15 backdrop-blur sm:block dark:border-sky-800 dark:bg-[#101926]/95 dark:text-gray-200">
          <p className="font-semibold text-gray-900 dark:text-gray-100">Custom Build Debug</p>
          <p className="mt-1 text-xs leading-relaxed">
            Kallor: <span className="font-semibold">Prisjakt-offer</span>, <span className="font-semibold">Seed</span>, <span className="font-semibold">Fallback</span>, <span className="font-semibold">Search-link</span>, <span className="font-semibold">No-store</span>.
          </p>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}

