export type UsedParts = {
  cpu?: boolean;
  gpu?: boolean;
  ram?: boolean;
  storage?: boolean;
};

export interface ComputerVariant {
  price: number;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  storagetype: string;
  tier: string;
  usedParts?: UsedParts;
  productKey?: string;
}

export interface Computer {
  id: string;
  name: string;
  price: number;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  storagetype: string;
  tier: string;
  rating: number;
  reviews: number;
  image: string;
  images: string[];
  classLabels?: string[];
  bundleIncludes?: string[];
  usedVariant?: ComputerVariant;
}

export const COMPUTERS: Computer[] = [
  {
    id: "2",
    name: "Cheapo - Ny",
    price: 7500,
    cpu: "AMD Ryzen 5 3600",
    gpu: "ASUS Dual Radeon RX 7600 EVO OC",
    ram: "A-Data XPG SPECTRIX D35G 16GB (2x8GB) DDR4 3600MHz CL18",
    storage: "Team Group T-Force G50",
    storagetype: "SSD",
    tier: "Bronze",
    rating: 4.0,
    reviews: 0,
    image: "/products/NavPro_Hero_Colorswap_2000x.webp",
    images: [
      "/products/NavPro_Hero_Colorswap_2000x.webp",
      "/products/NavPro_Front_Colorswap_2000x.webp",
      "/products/NavPro_Side_Colorswap_2000x.webp",
    ],
    classLabels: ["Budget PC's"],
    usedVariant: {
      price: 6500,
      cpu: "AMD Ryzen 5 3600",
      gpu: "3060 TI / 3070",
      ram: "A-Data XPG SPECTRIX D35G 16GB (2x8GB) DDR4 3600MHz CL18",
      storage: "Team Group T-Force G50",
      storagetype: "SSD",
      tier: "Bronze",
      usedParts: { cpu: true, gpu: true, ram: true },
      productKey: "Cheapo - Begagnade",
    },
  },
  {
    id: "3",
    name: "Price-performance - Ny",
    price: 10500,
    cpu: "Intel Core i5-12400F",
    gpu: "ASUS Prime Radeon RX 9060 XT OC Edition 8GB",
    ram: "Corsair Dominator RGB DDR4 3600MHz 32GB",
    storage: "2TB",
    storagetype: "NVMe",
    tier: "Silver",
    rating: 4.2,
    reviews: 0,
    image: "/products/Horizon_Pro_Hero_wEliteComponents_2000x.webp",
    images: [
      "/products/Horizon_Pro_Hero_wEliteComponents_2000x.webp",
      "/products/Horizon_Pro_Front_wEliteComponents_2000x.webp",
      "/products/Horizon_Pro_Side_wEliteComponents_2000x.webp",
    ],
  },
  {
    id: "5",
    name: "12.5k - Ny",
    price: 12500,
    cpu: "AMD Ryzen 5 5600X",
    gpu: "RTX 5070",
    ram: "32GB DDR4",
    storage: "2TB",
    storagetype: "NVMe",
    tier: "Silver",
    rating: 4.3,
    reviews: 0,
    image: "/products/Traveler_Hero_1_2000x.webp",
    images: [
      "/products/Traveler_Hero_1_2000x.webp",
      "/products/Traveler_Front_1_2000x.webp",
      "/products/Traveler_Side_1_2000x.webp",
    ],
  },
  {
    id: "7",
    name: "Plat build - Ny",
    price: 18500,
    cpu: "AMD Ryzen 5 9600X (Tray)",
    gpu: "ASUS PRIME Radeon RX 9070 XT 16GB OC",
    ram: "Dell 32GB DDR5 5600MHz",
    storage: "Lexar Professional NM1090",
    storagetype: "NVMe",
    tier: "Platinum",
    rating: 4.5,
    reviews: 0,
    image: "/products/Voy_Red_Hero_2000x.webp",
    images: [
      "/products/Voy_Red_Hero_2000x.webp",
      "/products/Voy_Red_Front_2000x.webp",
      "/products/Voy_Red_Side_2000x.webp",
    ],
  },
  {
    id: "9",
    name: "The All rounder - Ny",
    price: 20500,
    cpu: "AMD Ryzen 7 7800X3D",
    gpu: "ASUS PRIME Radeon RX 9070 XT 16GB OC",
    ram: "Dell 32GB DDR5 5600MHz",
    storage: "Lexar Professional NM1090",
    storagetype: "NVMe",
    tier: "Gold",
    rating: 4.5,
    reviews: 0,
    image: "/products/Horizon3_Elite_Hero_2000x.webp",
    images: [
      "/products/Horizon3_Elite_Hero_2000x.webp",
      "/products/Horizon3_Elite_Front_2000x.webp",
      "/products/Horizon3_Elite_Side_2000x.webp",
    ],
    usedVariant: {
      price: 19000,
      cpu: "AMD Ryzen 5 7600X3D eller 7800X3D",
      gpu: "Asus Dual GeForce RTX 5070 OC eller 9070 XT",
      ram: "Dell 32GB DDR5 5600MHz",
      storage: "Lexar Professional NM1090",
      storagetype: "NVMe",
      tier: "Gold",
      usedParts: { cpu: true, gpu: true, ram: true },
      productKey: "All rounder - Begagnade",
    },
  },
  {
    id: "10",
    name: "All in, all out - BLACK nybyggd",
    price: 32000,
    cpu: "AMD Ryzen 7 9800X3D",
    gpu: "ASUS Prime GeForce RTX 5080 16GB OC",
    ram: "Dell 32GB DDR5 5600MHz",
    storage: "Kingston Fury Renegade G5",
    storagetype: "NVMe",
    tier: "Platinum",
    rating: 4.7,
    reviews: 0,
    image: "/products/Voyager_Hero_NoGeforce_2000x.webp",
    images: [
      "/products/Voyager_Hero_NoGeforce_2000x.webp",
      "/products/Voyager_Front_NoGeforce_2000x.webp",
      "/products/Voyager_Side_NoGeforce_2000x.webp",
    ],
  },
  {
    id: "11",
    name: "All white, all out - NYPRIS",
    price: 35000,
    cpu: "AMD Ryzen 7 9800X3D",
    gpu: "INNO3D GeForce RTX 5080 16GB X3 OC White",
    ram: "Kingston 32GB (2x16GB) DDR5 6400MHz CL32 FURY Beast Vit AMD EXPO/Intel XMP 3.0",
    storage: "Kingston Fury Renegade G5",
    storagetype: "NVMe",
    tier: "Platinum",
    rating: 4.7,
    reviews: 0,
    image: "/products/Voyager_Hero_NoGeforce_2000x_2.webp",
    images: [
      "/products/Voyager_Hero_NoGeforce_2000x_2.webp",
      "/products/Voyager_Front_NoGeforce_2000x_2.webp",
      "/products/Voyager_Side_NoGeforce_2000x_2.webp",
    ],
  },
];
