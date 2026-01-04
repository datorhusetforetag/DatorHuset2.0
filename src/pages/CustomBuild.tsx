import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  MemoryStick,
  Monitor,
  Power,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import cpu7600Image from "../../images/product images/cpu/7600.png";
import cpu7700Image from "../../images/product images/cpu/7700.png";
import cpu7800x3dImage from "../../images/product images/cpu/7800x3d.png";
import cpu7950x3dImage from "../../images/product images/cpu/7950x3d.png";
import cpu13400fImage from "../../images/product images/cpu/13400f.png";
import cpu13600kImage from "../../images/product images/cpu/13600k.png";
import cpu13700kImage from "../../images/product images/cpu/13700k.png";
import cpu14700kImage from "../../images/product images/cpu/14700k.png";
import cpu13900kImage from "../../images/product images/cpu/13900k.png";
import cpu14900kImage from "../../images/product images/cpu/14900k.png";
import gpu4060Image from "../../images/product images/gpu/4060.png";
import gpu4060TiImage from "../../images/product images/gpu/4060 ti.png";
import gpu4070Image from "../../images/product images/gpu/4070.png";
import gpu4070SuperImage from "../../images/product images/gpu/4070 super.png";
import gpu4080SuperImage from "../../images/product images/gpu/4080 super.png";
import gpu4090Image from "../../images/product images/gpu/4090.png";
import gpu7600Image from "../../images/product images/gpu/7600.png";
import gpu7700xtImage from "../../images/product images/gpu/7700xt.png";
import gpu7800xtImage from "../../images/product images/gpu/7800xt.png";
import gpuA770Image from "../../images/product images/gpu/a770.png";
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
import ramAdataXpgLancerImage from "../../images/product images/ram/ADATA XPG Lancer.png";
import ramCorsairDominatorImage from "../../images/product images/ram/Corsair Dominator.png";
import ramCorsairVengeanceImage from "../../images/product images/ram/Corsair Vengeance.png";
import ramCrucialProImage from "../../images/product images/ram/Crucial Pro.png";
import ramGSkillRipjawsImage from "../../images/product images/ram/G.Skill Ripjaws.png";
import ramGSkillTridentZ5Image from "../../images/product images/ram/G.Skill Trident Z5.png";
import ramKingstonFuryBeastImage from "../../images/product images/ram/Kingston Fury Beast.png";
import ramKingstonFuryRenegadeImage from "../../images/product images/ram/Kingston Fury Renegade.png";
import ramTeamGroupTForceDeltaImage from "../../images/product images/ram/TeamGroup T-Force Delta.png";

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
};

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
      price: 0,
      socket: "AM4",
      specs: ["AM4"],
    },
    {
      id: "cpu-12",
      name: "Intel Core i5-12400F",
      brand: "Intel",
      price: 0,
      socket: "LGA1700",
      specs: ["LGA1700"],
    },
    {
      id: "cpu-13",
      name: "AMD Ryzen 5 5500",
      brand: "AMD",
      price: 0,
      socket: "AM4",
      specs: ["AM4"],
    },
    {
      id: "cpu-14",
      name: "AMD Ryzen 5 5600X",
      brand: "AMD",
      price: 0,
      socket: "AM4",
      specs: ["AM4"],
    },
    {
      id: "cpu-15",
      name: "AMD Ryzen 5 8400F",
      brand: "AMD",
      price: 0,
      socket: "AM5",
      specs: ["AM5"],
    },
    {
      id: "cpu-16",
      name: "AMD Ryzen 5 9600X (Tray)",
      brand: "AMD",
      price: 0,
      socket: "AM5",
      specs: ["AM5"],
    },
    {
      id: "cpu-17",
      name: "AMD Ryzen 5 7600X3D",
      brand: "AMD",
      price: 0,
      socket: "AM5",
      specs: ["AM5"],
    },
    {
      id: "cpu-18",
      name: "AMD Ryzen 7 9800X3D",
      brand: "AMD",
      price: 0,
      socket: "AM5",
      specs: ["AM5"],
    },
  ],
  gpu: [
    {
      id: "gpu-1",
      name: "NVIDIA GeForce RTX 4060",
      brand: "NVIDIA",
      price: 3790,
      image: gpu4060Image,
      specs: ["8 GB", "DLSS 3", "1080p"],
    },
    {
      id: "gpu-2",
      name: "NVIDIA GeForce RTX 4060 Ti",
      brand: "NVIDIA",
      price: 4690,
      image: gpu4060TiImage,
      specs: ["8 GB", "DLSS 3", "1440p"],
    },
    {
      id: "gpu-3",
      name: "NVIDIA GeForce RTX 4070",
      brand: "NVIDIA",
      price: 6990,
      image: gpu4070Image,
      specs: ["12 GB", "DLSS 3", "1440p"],
    },
    {
      id: "gpu-4",
      name: "NVIDIA GeForce RTX 4070 Super",
      brand: "NVIDIA",
      price: 7990,
      image: gpu4070SuperImage,
      specs: ["12 GB", "DLSS 3", "1440p"],
      highlight: "Bästa värde",
    },
    {
      id: "gpu-5",
      name: "NVIDIA GeForce RTX 4080 Super",
      brand: "NVIDIA",
      price: 12990,
      image: gpu4080SuperImage,
      specs: ["16 GB", "DLSS 3", "4K"],
    },
    {
      id: "gpu-6",
      name: "NVIDIA GeForce RTX 4090",
      brand: "NVIDIA",
      price: 21990,
      image: gpu4090Image,
      specs: ["24 GB", "DLSS 3", "4K+"],
      highlight: "Toppklass",
    },
    {
      id: "gpu-7",
      name: "AMD Radeon RX 7600",
      brand: "AMD",
      price: 3190,
      image: gpu7600Image,
      specs: ["8 GB", "FSR", "1080p"],
    },
    {
      id: "gpu-8",
      name: "AMD Radeon RX 7700 XT",
      brand: "AMD",
      price: 4990,
      image: gpu7700xtImage,
      specs: ["12 GB", "FSR", "1440p"],
    },
    {
      id: "gpu-9",
      name: "AMD Radeon RX 7800 XT",
      brand: "AMD",
      price: 5990,
      image: gpu7800xtImage,
      specs: ["16 GB", "FSR", "1440p"],
    },
    {
      id: "gpu-10",
      name: "Intel Arc A770",
      brand: "Intel",
      price: 3290,
      image: gpuA770Image,
      specs: ["16 GB", "XeSS", "1080p"],
    },
    {
      id: "gpu-11",
      name: "ASUS Dual GeForce RTX 3050 6GB OC",
      brand: "ASUS",
      price: 0,
      specs: ["6 GB", "RTX 3050"],
    },
    {
      id: "gpu-12",
      name: "ASUS Dual Radeon RX 7600 EVO OC",
      brand: "ASUS",
      price: 0,
      specs: ["RX 7600"],
    },
    {
      id: "gpu-13",
      name: "ASUS Prime Radeon RX 9060 XT OC Edition 8GB",
      brand: "ASUS",
      price: 0,
      specs: ["8 GB", "RX 9060 XT"],
    },
    {
      id: "gpu-14",
      name: "PNY GeForce RTX 5060 Ti Dual Fan OC",
      brand: "PNY",
      price: 0,
      specs: ["RTX 5060 Ti"],
    },
    {
      id: "gpu-15",
      name: "RTX 5070",
      brand: "NVIDIA",
      price: 0,
      specs: ["RTX 5070"],
    },
    {
      id: "gpu-16",
      name: "Gigabyte GeForce RTX 5070 WINDFORCE SFF 12GB",
      brand: "Gigabyte",
      price: 0,
      specs: ["12 GB", "RTX 5070"],
    },
    {
      id: "gpu-17",
      name: "ASUS PRIME Radeon RX 9070 XT 16GB OC",
      brand: "ASUS",
      price: 0,
      specs: ["16 GB", "RX 9070 XT"],
    },
    {
      id: "gpu-18",
      name: "Asus Dual GeForce RTX 5070 OC",
      brand: "ASUS",
      price: 0,
      specs: ["RTX 5070"],
    },
    {
      id: "gpu-19",
      name: "ASUS Prime GeForce RTX 5080 16GB OC",
      brand: "ASUS",
      price: 0,
      specs: ["16 GB", "RTX 5080"],
    },
    {
      id: "gpu-20",
      name: "INNO3D GeForce RTX 5080 16GB X3 OC White",
      brand: "INNO3D",
      price: 0,
      specs: ["16 GB", "RTX 5080"],
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
      price: 0,
      ramType: "DDR4",
      specs: ["DDR4", "16GB", "3600 MHz", "CL18"],
    },
    {
      id: "ram-12",
      name: "Corsair Dominator RGB DDR4 3600MHz 32GB",
      brand: "Corsair",
      price: 0,
      ramType: "DDR4",
      specs: ["DDR4", "32GB", "3600 MHz", "RGB"],
    },
    {
      id: "ram-13",
      name: "32GB DDR4",
      brand: "Generic",
      price: 0,
      ramType: "DDR4",
      specs: ["DDR4", "32GB"],
    },
    {
      id: "ram-14",
      name: "Dell 32GB DDR5 5600MHz (begagnad)",
      brand: "Dell",
      price: 0,
      ramType: "DDR5",
      specs: ["DDR5", "32GB", "5600 MHz", "Begagnad"],
    },
    {
      id: "ram-15",
      name: "Dell 32GB DDR5 5600MHz",
      brand: "Dell",
      price: 0,
      ramType: "DDR5",
      specs: ["DDR5", "32GB", "5600 MHz"],
    },
    {
      id: "ram-16",
      name: "Kingston 32GB (2x16GB) DDR5 6400MHz CL32 FURY Beast Vit AMD EXPO/Intel XMP 3.0",
      brand: "Kingston",
      price: 0,
      ramType: "DDR5",
      specs: ["DDR5", "32GB", "6400 MHz", "CL32"],
    },
  ],
  storage: [
    {
      id: "sto-1",
      name: "Samsung 990 Pro 1TB",
      brand: "Samsung",
      price: 1190,
      specs: ["NVMe", "PCIe 4.0", "7450 MB/s"],
    },
    {
      id: "sto-2",
      name: "WD Black SN850X 1TB",
      brand: "WD",
      price: 1090,
      specs: ["NVMe", "PCIe 4.0", "7300 MB/s"],
    },
    {
      id: "sto-3",
      name: "Crucial T500 1TB",
      brand: "Crucial",
      price: 990,
      specs: ["NVMe", "PCIe 4.0", "7400 MB/s"],
    },
    {
      id: "sto-4",
      name: "Samsung 990 Pro 2TB",
      brand: "Samsung",
      price: 1890,
      specs: ["NVMe", "PCIe 4.0", "7450 MB/s"],
    },
    {
      id: "sto-5",
      name: "Seagate FireCuda 530 2TB",
      brand: "Seagate",
      price: 1990,
      specs: ["NVMe", "PCIe 4.0", "7300 MB/s"],
    },
    {
      id: "sto-6",
      name: "WD Blue SN580 1TB",
      brand: "WD",
      price: 790,
      specs: ["NVMe", "PCIe 4.0", "4150 MB/s"],
    },
    {
      id: "sto-7",
      name: "Kingston KC3000 1TB",
      brand: "Kingston",
      price: 990,
      specs: ["NVMe", "PCIe 4.0", "7000 MB/s"],
    },
    {
      id: "sto-8",
      name: "Samsung 870 Evo 2TB",
      brand: "Samsung",
      price: 1590,
      specs: ["SATA", "560 MB/s", "2.5-inch"],
    },
    {
      id: "sto-9",
      name: "Crucial MX500 1TB",
      brand: "Crucial",
      price: 890,
      specs: ["SATA", "560 MB/s", "2.5-inch"],
    },
    {
      id: "sto-10",
      name: "Seagate BarraCuda 4TB",
      brand: "Seagate",
      price: 1190,
      specs: ["HDD", "5400 RPM", "3.5-inch"],
    },
    {
      id: "sto-11",
      name: "Team Group T-Force G50",
      brand: "TeamGroup",
      price: 0,
      specs: ["SSD"],
    },
    {
      id: "sto-12",
      name: "2TB",
      brand: "Generic",
      price: 0,
      specs: ["NVMe", "2TB"],
    },
    {
      id: "sto-13",
      name: "Lexar Professional NM1090",
      brand: "Lexar",
      price: 0,
      specs: ["NVMe"],
    },
    {
      id: "sto-14",
      name: "Kingston Fury Renegade G5",
      brand: "Kingston",
      price: 0,
      specs: ["NVMe"],
    },
  ],
  case: [
    {
      id: "case-1",
      name: "NZXT H7 Flow",
      brand: "NZXT",
      price: 1390,
      specs: ["ATX", "Mesh", "Svart"],
    },
    {
      id: "case-2",
      name: "Lian Li Lancool 216",
      brand: "Lian Li",
      price: 1290,
      specs: ["ATX", "Airflow", "RGB"],
    },
    {
      id: "case-3",
      name: "Fractal Design North",
      brand: "Fractal",
      price: 1490,
      specs: ["ATX", "Träpanel", "Airflow"],
      highlight: "Designfavorit",
    },
    {
      id: "case-4",
      name: "Corsair 4000D Airflow",
      brand: "Corsair",
      price: 1090,
      specs: ["ATX", "Mesh", "Tyst"],
    },
    {
      id: "case-5",
      name: "Phanteks Eclipse G500A",
      brand: "Phanteks",
      price: 1390,
      specs: ["ATX", "RGB", "Airflow"],
    },
    {
      id: "case-6",
      name: "be quiet! Pure Base 500DX",
      brand: "be quiet!",
      price: 1290,
      specs: ["ATX", "Tyst", "RGB"],
    },
    {
      id: "case-7",
      name: "Cooler Master TD500 Mesh",
      brand: "Cooler Master",
      price: 1190,
      specs: ["ATX", "Mesh", "ARGB"],
    },
    {
      id: "case-8",
      name: "NZXT H5 Flow",
      brand: "NZXT",
      price: 1090,
      specs: ["ATX", "Kompakt", "Svart"],
    },
    {
      id: "case-9",
      name: "Lian Li O11 Dynamic",
      brand: "Lian Li",
      price: 1690,
      specs: ["ATX", "Glas", "Showcase"],
    },
    {
      id: "case-10",
      name: "Fractal Design Meshify 2",
      brand: "Fractal",
      price: 1690,
      specs: ["ATX", "Mesh", "Modulär"],
    },
  ],
  psu: [
    {
      id: "psu-1",
      name: "Corsair RM750e",
      brand: "Corsair",
      price: 1290,
      specs: ["750W", "80+ Gold", "Modulärt"],
    },
    {
      id: "psu-2",
      name: "Corsair RM850x",
      brand: "Corsair",
      price: 1590,
      specs: ["850W", "80+ Gold", "Modulärt"],
    },
    {
      id: "psu-3",
      name: "Seasonic Focus GX-750",
      brand: "Seasonic",
      price: 1390,
      specs: ["750W", "80+ Gold", "Tyst"],
    },
    {
      id: "psu-4",
      name: "Seasonic Vertex GX-1000",
      brand: "Seasonic",
      price: 2490,
      specs: ["1000W", "80+ Gold", "ATX 3.0"],
    },
    {
      id: "psu-5",
      name: "be quiet! Straight Power 12",
      brand: "be quiet!",
      price: 2290,
      specs: ["1000W", "80+ Platinum", "ATX 3.0"],
    },
    {
      id: "psu-6",
      name: "Cooler Master MWE 750",
      brand: "Cooler Master",
      price: 990,
      specs: ["750W", "80+ Gold", "Modulärt"],
    },
    {
      id: "psu-7",
      name: "ASUS TUF Gaming 850G",
      brand: "ASUS",
      price: 1690,
      specs: ["850W", "80+ Gold", "Tuff byggd"],
    },
    {
      id: "psu-8",
      name: "MSI MPG A850G",
      brand: "MSI",
      price: 1590,
      specs: ["850W", "80+ Gold", "ATX 3.0"],
    },
    {
      id: "psu-9",
      name: "NZXT C750",
      brand: "NZXT",
      price: 1190,
      specs: ["750W", "80+ Gold", "Modulärt"],
    },
    {
      id: "psu-10",
      name: "Thermaltake Toughpower GF3",
      brand: "Thermaltake",
      price: 1790,
      specs: ["850W", "80+ Gold", "ATX 3.0"],
    },
  ],
  cooling: [
    {
      id: "cool-1",
      name: "Noctua NH-D15",
      brand: "Noctua",
      price: 1190,
      specs: ["Luftkylare", "Tyst", "Topplista"],
    },
    {
      id: "cool-2",
      name: "be quiet! Dark Rock Pro 5",
      brand: "be quiet!",
      price: 1090,
      specs: ["Luftkylare", "Tyst", "Hög TDP"],
    },
    {
      id: "cool-3",
      name: "Corsair iCUE H150i",
      brand: "Corsair",
      price: 1990,
      specs: ["360mm AIO", "RGB", "LCD"],
    },
    {
      id: "cool-4",
      name: "NZXT Kraken 360",
      brand: "NZXT",
      price: 1990,
      specs: ["360mm AIO", "RGB", "LCD"],
    },
    {
      id: "cool-5",
      name: "Arctic Liquid Freezer II 360",
      brand: "Arctic",
      price: 1590,
      specs: ["360mm AIO", "Tyst", "Prisvärd"],
    },
    {
      id: "cool-6",
      name: "DeepCool AK620",
      brand: "DeepCool",
      price: 790,
      specs: ["Luftkylare", "Hög TDP", "Prisvärd"],
    },
    {
      id: "cool-7",
      name: "Lian Li Galahad II",
      brand: "Lian Li",
      price: 1790,
      specs: ["360mm AIO", "RGB", "Prestanda"],
    },
    {
      id: "cool-8",
      name: "Cooler Master MasterLiquid 360",
      brand: "Cooler Master",
      price: 1490,
      specs: ["360mm AIO", "ARGB", "Tyst"],
    },
    {
      id: "cool-9",
      name: "Thermalright Peerless Assassin",
      brand: "Thermalright",
      price: 590,
      specs: ["Luftkylare", "Prisvärd", "Tyst"],
    },
    {
      id: "cool-10",
      name: "Corsair iCUE H100i",
      brand: "Corsair",
      price: 1490,
      specs: ["240mm AIO", "RGB", "Kompakt"],
    },
  ],
};

const formatPrice = (price: number) => price.toLocaleString("sv-SE");
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
const STORE_NAMES = [
  "Komplett",
  "Inet",
  "Webhallen",
  "NetOnNet",
  "Dustin",
  "Proshop",
  "Elgiganten",
  "Amazon",
];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return hash;
};

const getBasePrice = (item: ComponentItem, category: CategoryKey) =>
  item.price && item.price > 0 ? item.price : CATEGORY_BASE_PRICE[category];

const buildPriceHistory = (basePrice: number) =>
  MONTH_LABELS.map((_, index) => {
    const trend = 1.08 - index * 0.03;
    const wobble = (index % 3) * 0.01;
    const multiplier = Math.max(0.72, trend + wobble);
    return Math.max(100, Math.round(basePrice * multiplier));
  });

const buildStorePrices = (item: ComponentItem, category: CategoryKey) => {
  const basePrice = getBasePrice(item, category);
  const hash = hashString(`${item.id}-${item.name}-${category}`);
  const stores = STORE_NAMES.map((name, index) => {
    const variance = ((hash + index * 17) % 9 - 4) * 0.01;
    const price = Math.max(100, Math.round(basePrice * (1 + variance)));
    const inStock = (hash + index) % 4 !== 0;
    return { name, price, inStock };
  }).sort((a, b) => a.price - b.price);
  const cheapest = stores[0]?.price ?? basePrice;
  return stores.map((store) => ({ ...store, isCheapest: store.price === cheapest }));
};

const buildSpecList = (item: ComponentItem) => {
  const specs = [...item.specs];
  if (item.socket && !specs.some((spec) => spec.includes(item.socket))) {
    specs.push(`Socket ${item.socket}`);
  }
  if (item.ramType && !specs.some((spec) => spec.includes(item.ramType))) {
    specs.push(item.ramType);
  }
  return specs;
};

export default function CustomBuild() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("cpu");
  const [activeBrand, setActiveBrand] = useState("Alla");
  const [searchTerm, setSearchTerm] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
  const [detailItem, setDetailItem] = useState<{ item: ComponentItem; category: CategoryKey } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
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

    (Object.keys(COMPONENTS) as CategoryKey[]).forEach((key) => {
      const id = params.get(key);
      if (!id) return;
      const match = COMPONENTS[key].find((item) => item.id === id);
      if (match) {
        next[key] = match;
        if (!firstKey) {
          firstKey = key;
        }
      }
    });

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
  const items = COMPONENTS[activeCategory];

  const brandOptions = useMemo(() => {
    const brands = Array.from(new Set(items.map((item) => item.brand)));
    return ["Alla", ...brands];
  }, [items]);

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
      return matchesBrand && matchesSearch && matchesSocket && matchesRamType;
    });
  }, [items, activeBrand, searchTerm, activeCategory, selected.motherboard, selected.cpu]);

  const detailData = useMemo(() => {
    if (!detailItem) {
      return null;
    }
    const basePrice = getBasePrice(detailItem.item, detailItem.category);
    const specs = buildSpecList(detailItem.item);
    const history = buildPriceHistory(basePrice);
    const stores = buildStorePrices(detailItem.item, detailItem.category);
    const cheapestStore = stores[0] ?? null;
    const inStockStore = stores.find((store) => store.inStock) ?? stores[0] ?? null;
    const image =
      detailItem.item.image ?? CATEGORY_IMAGES[detailItem.category]?.src ?? FALLBACK_COMPONENT_IMAGE;
    return {
      basePrice,
      specs,
      history,
      stores,
      cheapestStore,
      inStockStore,
      image,
    };
  }, [detailItem]);

  const totalPrice = Object.values(selected).reduce((sum, item) => sum + (item?.price ?? 0), 0);
  const selectedCount = Object.values(selected).filter(Boolean).length;

  const handleOpenDetails = (item: ComponentItem) => {
    setDetailItem({ item, category: activeCategory });
  };
  const detailIsSelected = detailItem
    ? selected[detailItem.category]?.id === detailItem.item.id
    : false;
  const detailHistoryMax = detailData ? Math.max(...detailData.history) : 0;
  const detailHistoryMin = detailData ? Math.min(...detailData.history) : 0;

  const handleShareBuild = async () => {
    const params = new URLSearchParams();
    (Object.entries(selected) as [CategoryKey, ComponentItem | null][]).forEach(([key, item]) => {
      if (item) {
        params.set(key, item.id);
      }
    });
    const query = params.toString();
    const shareUrl = `${window.location.origin}/custom-bygg${query ? `?${query}` : ""}`;

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
        open={Boolean(detailItem)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailItem(null);
          }
        }}
      >
        {detailItem && detailData ? (
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0f1824]">
            <DialogHeader>
              <DialogTitle>{detailItem.item.name}</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Utokad vy for specifikationer, pris och lagerstatus.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative w-full md:w-52 aspect-square">
                      <img
                        src={detailData.image}
                        alt={detailItem.item.name}
                        className="w-full h-full object-cover rounded-xl border border-gray-200 dark:border-gray-800"
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="absolute top-2 left-2 rounded-full bg-white/90 text-gray-700 border border-gray-200 px-2 py-1 text-xs shadow-sm dark:bg-gray-900/90 dark:text-gray-200 dark:border-gray-700">
                        {detailItem.item.brand}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Komponent</p>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                        {detailItem.item.name}
                      </h3>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {formatPrice(detailData.basePrice)} kr
                        </span>
                        {detailData.cheapestStore ? (
                          <span className="text-xs font-semibold bg-yellow-400 text-gray-900 px-3 py-1 rounded-full">
                            Lagsta pris hos {detailData.cheapestStore.name}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {detailData.specs.map((spec) => (
                          <span
                            key={spec}
                            className="text-xs border border-gray-200 text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full dark:border-gray-700 dark:text-gray-200 dark:bg-gray-800"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelected((prev) => ({
                              ...prev,
                              [detailItem.category]: detailIsSelected ? null : detailItem.item,
                            }))
                          }
                          className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                            detailIsSelected
                              ? "bg-yellow-400 text-gray-900"
                              : "border border-yellow-400 text-yellow-700 dark:text-yellow-300 hover:bg-[#11667b] hover:text-white hover:border-[#11667b]"
                          }`}
                        >
                          {detailIsSelected ? "Vald" : "Valj"}
                        </button>
                        {detailData.inStockStore ? (
                          <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full dark:text-green-200 dark:bg-green-900/40">
                            I lager hos {detailData.inStockStore.name}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Prishistorik</p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Senaste 12 manader</span>
                  </div>
                  <div className="mt-4 flex items-end gap-1 h-28">
                    {detailData.history.map((value, index) => {
                      const range = detailHistoryMax - detailHistoryMin || 1;
                      const height = ((value - detailHistoryMin) / range) * 100;
                      return (
                        <div key={`${value}-${index}`} className="flex-1">
                          <div
                            className="w-full rounded-md bg-yellow-400/80"
                            style={{ height: `${Math.max(8, height)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 grid grid-cols-6 gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                    {MONTH_LABELS.slice(0, 6).map((label) => (
                      <span key={label} className="text-center">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Prisdata ar demo tills riktig koppling ar klar.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Butiker</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {detailData.stores.length} jamforelser
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {detailData.stores.map((store) => (
                    <div
                      key={store.name}
                      className={`rounded-xl border px-3 py-3 flex items-center justify-between gap-3 ${
                        store.isCheapest
                          ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-400/10"
                          : "border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{store.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {store.inStock ? "I lager" : "Ej i lager"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatPrice(store.price)} kr
                        </span>
                        <button
                          type="button"
                          className="rounded-lg border border-yellow-400 px-3 py-1 text-xs font-semibold text-yellow-700 hover:bg-[#11667b] hover:text-white hover:border-[#11667b] dark:text-yellow-300"
                        >
                          Till butik
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
                  src="/products/Horizon3_Elite_Hero_2000x.webp"
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

            <div className="grid gap-6 lg:grid-cols-[280px_1fr_320px] items-start">
              <aside className={`space-y-4 ${mobileSidebarOpen ? "block" : "hidden"} lg:block`}>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Komponenter</p>
                  <div className="mt-4 space-y-2">
                    {CATEGORY_LIST.map((category) => {
                      const Icon = category.icon;
                      const isActive = category.key === activeCategory;
                      const selectedItem = selected[category.key];

                      return (
                        <button
                          key={category.key}
                          type="button"
                          onClick={() => setActiveCategory(category.key)}
                          className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
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
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
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
                  <div className="mt-5 flex flex-wrap gap-2">
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
                </div>

                <div className="space-y-4">
                  {filteredItems.map((item) => {
                    const isSelected = selected[activeCategory]?.id === item.id;
                    const ActiveIcon = activeConfig?.icon ?? Cpu;
                    const categoryImage = CATEGORY_IMAGES[activeCategory];
                    const imageSrc = item.image ?? categoryImage?.src ?? FALLBACK_COMPONENT_IMAGE;
                    const imageAlt = item.image ? item.name : categoryImage?.alt ?? "Komponent";

                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenDetails(item)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleOpenDetails(item);
                          }
                        }}
                        className={`rounded-2xl border bg-white p-4 shadow-sm transition-colors dark:bg-gray-900/80 ${
                          isSelected ? "border-yellow-400 ring-1 ring-yellow-300/30" : "border-gray-200 dark:border-gray-800"
                        }`}
                      >
                        <div className="grid gap-4 md:grid-cols-[160px_1fr_auto] items-start">
                          <div className="relative w-full md:w-40 aspect-square">
                            <img
                              src={imageSrc}
                              alt={imageAlt}
                              className="w-full h-full object-cover rounded-xl border border-gray-200 dark:border-gray-800"
                              loading="lazy"
                              decoding="async"
                              onError={(event) => {
                                event.currentTarget.src = FALLBACK_COMPONENT_IMAGE;
                              }}
                            />
                            <span className="absolute top-2 left-2 rounded-full bg-white/90 text-gray-700 border border-gray-200 p-2 shadow-sm dark:bg-gray-900/90 dark:text-gray-200 dark:border-gray-700">
                              <ActiveIcon className="w-5 h-5" />
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">{item.brand}</p>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-2">{item.name}</h4>
                              </div>
                              {item.highlight ? (
                                <span className="text-xs font-semibold bg-yellow-400 text-gray-900 px-3 py-1 rounded-full">
                                  {item.highlight}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {item.specs.map((spec) => (
                                <span
                                  key={spec}
                                  className="text-xs border border-gray-200 text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full dark:border-gray-700 dark:text-gray-200 dark:bg-gray-800"
                                >
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="w-full md:w-40 flex flex-row md:flex-col items-start md:items-end justify-between gap-3">
                            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatPrice(item.price)} kr</p>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelected((prev) => ({
                                  ...prev,
                                  [activeCategory]: isSelected ? null : item,
                                }));
                              }}
                              className={`w-full md:w-auto rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                                isSelected
                                  ? "bg-yellow-400 text-gray-900"
                                  : "border border-yellow-400 text-yellow-700 dark:text-yellow-300 hover:bg-[#11667b] hover:text-white hover:border-[#11667b]"
                              }`}
                            >
                              {isSelected ? "Vald" : "Välj"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Din build</p>
                  <h3 className="text-xl font-semibold mt-2">Sammanfattning</h3>
                  <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    {CATEGORY_LIST.map((category) => (
                      <div key={category.key} className="flex items-start justify-between gap-3">
                        <span className="text-gray-500 dark:text-gray-400">{category.label}</span>
                        <span className="text-right">{selected[category.key]?.name ?? "Ej vald"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatPrice(totalPrice)} kr</span>
                  </div>
                  <button
                    type="button"
                    className="mt-4 w-full bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:text-white transition-colors"
                  >
                    Skicka offertförfrågan
                  </button>
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
      <Footer />
    </div>
  );
}
