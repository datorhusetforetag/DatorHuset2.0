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
  usedVariantEnabled?: boolean;
}

export const COMPUTERS: Computer[] = [
  {
    id: "2",
    name: "Silver-Speedster",
    price: 9100,
    cpu: "Intel Core i3-12100F",
    gpu: "RTX 3060/3060TI/4060",
    ram: "16GB/32GB DDR4",
    storage: "Crucial E100 M.2 Gen4 (480GB)",
    storagetype: "SSD",
    tier: "Silver",
    rating: 4.2,
    reviews: 0,
    image: "/products/newpc/chieftecvisio-1.jpg",
    images: [
      "/products/newpc/chieftecvisio-1.jpg",
      "/products/newpc/chieftecvisio-2.webp",
      "/products/newpc/chieftecvisio-3.jpg",
    ],
  },
  {
    id: "3",
    name: "Guld-Inferno",
    price: 11250,
    cpu: "Intel Core i3-12100F",
    gpu: "Intel Arc B580 12GB",
    ram: "32GB DDR4",
    storage: "1TB",
    storagetype: "SSD",
    tier: "Guld",
    rating: 4.4,
    reviews: 0,
    image: "/products/newpc/chieftecvisio-1.jpg",
    images: [
      "/products/newpc/chieftecvisio-1.jpg",
      "/products/newpc/chieftecvisio-2.webp",
      "/products/newpc/chieftecvisio-3.jpg",
    ],
    usedVariantEnabled: false,
  },
  {
    id: "5",
    name: "Glimmrande Guldigaspiken",
    price: 15000,
    cpu: "Intel Core i5-12400F Tray",
    gpu: "Gigabyte Radeon RX 9060 XT GAMING OC 16GB",
    ram: "32GB DDR4",
    storage: "Sandisk WD Black SN7100 NVMe 2TB",
    storagetype: "NVMe",
    tier: "Guld",
    rating: 4.6,
    reviews: 0,
    image: "/products/newpc/chieftecvisio-1.jpg",
    images: [
      "/products/newpc/chieftecvisio-1.jpg",
      "/products/newpc/chieftecvisio-2.webp",
      "/products/newpc/chieftecvisio-3.jpg",
    ],
    usedVariant: {
      price: 12200,
      cpu: "Intel Core i5-12400F",
      gpu: "RTX 3070 8GB",
      ram: "32GB",
      storage: "Sandisk WD Black SN7100",
      storagetype: "NVMe",
      tier: "Guld",
      usedParts: { cpu: true, gpu: true, ram: true },
      productKey: "Guldspiken",
    },
    usedVariantEnabled: true,
  },
  {
    id: "7",
    name: "Platina Sleeper",
    price: 18300,
    cpu: "AMD Ryzen 5 7500X3D",
    gpu: "Gigabyte Radeon RX 9060 XT GAMING OC 16GB",
    ram: "32GB DDR5",
    storage: "Sandisk WD Black SN7100 NVMe (1TB)",
    storagetype: "NVMe",
    tier: "Platina",
    rating: 4.6,
    reviews: 0,
    image: "/products/newpc/cg530-2.jpg",
    images: [
      "/products/newpc/cg530-2.jpg",
      "/products/newpc/cg530-1.jpg",
      "/products/newpc/cg530-3.jpg",
    ],
  },
  {
    id: "9",
    name: "Platina Frostbyte",
    price: 25300,
    cpu: "AMD Ryzen 7 7800X3D",
    gpu: "ASUS PRIME Radeon RX 9070 XT 16GB OC",
    ram: "32GB DDR5 6000mhz",
    storage: "Crucial P510 (2TB) Gen5",
    storagetype: "NVMe",
    tier: "Platina",
    rating: 4.7,
    reviews: 0,
    image: "/products/newpc/cg530-3.jpg",
    images: [
      "/products/newpc/cg530-3.jpg",
      "/products/newpc/cg530-1.jpg",
      "/products/newpc/cg530-2.jpg",
    ],
    usedVariant: {
      price: 22600,
      cpu: "AMD Ryzen 7 7600X3D/7800X3D",
      gpu: "AMD Radeon RX 9070 XT 16GB",
      ram: "32GB DDR5",
      storage: "Crucial P510 (2TB) Gen5",
      storagetype: "NVMe",
      tier: "Platina",
      usedParts: { cpu: true, gpu: true, ram: true },
      productKey: "Platina Coldbyte",
    },
    usedVariantEnabled: true,
  },
  {
    id: "10",
    name: "All Black, All Out",
    price: 39490,
    cpu: "AMD Ryzen 7 9800X3D",
    gpu: "ASUS TUF Gaming GeForce RTX 5080 16GB OC",
    ram: "Minimum 32GB 6000mhz",
    storage: "Crucial P510 (2TB) Gen5",
    storagetype: "NVMe",
    tier: "Diamant",
    rating: 4.8,
    reviews: 0,
    image: "/products/newpc/allblack-main.jpg",
    images: [
      "/products/newpc/allblack-main.jpg",
      "/products/newpc/allblack-1.jpg",
      "/products/newpc/allblack-2.jpg",
      "/products/newpc/allblack-3.jpg",
      "/products/newpc/allblack-4.jpg",
      "/products/newpc/allblack-5.jpg",
    ],
  },
  {
    id: "11",
    name: "All White, All Out",
    price: 39490,
    cpu: "AMD Ryzen 7 9800X3D",
    gpu: "Gigabyte GeForce RTX 5080 AERO OC 16GB",
    ram: "Minimum 32GB 6000mhz",
    storage: "Crucial P510 (2TB) Gen5",
    storagetype: "NVMe",
    tier: "Diamant",
    rating: 4.8,
    reviews: 0,
    image: "/products/newpc/allwhite-1.jpg",
    images: [
      "/products/newpc/allwhite-1.jpg",
      "/products/newpc/allwhite-2.jpg",
      "/products/newpc/allwhite-3.jpg",
      "/products/newpc/allwhite-4.jpg",
      "/products/newpc/allwhite-5.jpg",
    ],
  },
];
