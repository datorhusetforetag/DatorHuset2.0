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

  isUsed?: boolean;
}

export const COMPUTERS: Computer[] = [
  {
    id: "1",
    name: "Bronze Starter",
    price: 4999,
    cpu: "Intel i5-13600K",
    gpu: "RTX 3060",
    ram: "16GB DDR5",
    storage: "512GB",
    storagetype: "SSD",
    tier: "Bronze",
    rating: 4.2,
    reviews: 145,
    image: "/products/NavBase_Hero_Colorswap_2000x.webp",
    images: [
      "/products/NavBase_Hero_Colorswap_2000x.webp",
      "/products/NavBase_Front_Colorswap_2000x.webp",
      "/products/NavBase_Side_Colorswap_2000x.webp",
    ],
    classLabels: ["Budget PC's"],
  },
  {
    id: "2",
    name: "Silver Ascent",
    price: 8999,
    cpu: "Intel i7-13700K",
    gpu: "RTX 4070",
    ram: "32GB DDR5",
    storage: "1TB",
    storagetype: "SSD",
    tier: "Silver",
    rating: 4.5,
    reviews: 287,
    image: "/products/Horizon_Pro_Hero_wEliteComponents_2000x.webp",
    images: [
      "/products/Horizon_Pro_Hero_wEliteComponents_2000x.webp",
      "/products/Horizon_Pro_Front_wEliteComponents_2000x.webp",
      "/products/Horizon_Pro_Side_wEliteComponents_2000x.webp",
    ],
    classLabels: ["Best-Selling PC's"],
  },
  {
    id: "3",
    name: "Gold Pinnacle",
    price: 12999,
    cpu: "Intel i9-13900K",
    gpu: "RTX 4080",
    ram: "64GB DDR5",
    storage: "2TB",
    storagetype: "SSD",
    tier: "Gold",
    rating: 4.8,
    reviews: 512,
    image: "/products/Horizon3_Elite_Hero_2000x.webp",
    images: [
      "/products/Horizon3_Elite_Hero_2000x.webp",
      "/products/Horizon3_Elite_Front_2000x.webp",
      "/products/Horizon3_Elite_Side_2000x.webp",
    ],
  },
  {
    id: "4",
    name: "Platina Frostbyte",
    price: 18999,
    cpu: "Intel i9-14900KS",
    gpu: "RTX 4090",
    ram: "128GB DDR5",
    storage: "4TB",
    storagetype: "SSD",
    tier: "Platinum",
    rating: 4.9,
    reviews: 834,
    image: "/products/Voyager_Hero_NoGeforce_2000x.webp",
    images: [
      "/products/Voyager_Hero_NoGeforce_2000x.webp",
      "/products/Voyager_Front_NoGeforce_2000x.webp",
      "/products/Voyager_Side_NoGeforce_2000x.webp",
    ],
    classLabels: ["Best-Selling PC's", "Toptier PC's"],
  },
  {
    id: "5",
    name: "Diamond Quantum",
    price: 24999,
    cpu: "Intel Xeon W9-3595X",
    gpu: "RTX 6000 Ada",
    ram: "256GB DDR5",
    storage: "8TB",
    storagetype: "SSD",
    tier: "Diamond",
    rating: 5.0,
    reviews: 92,
    image: "/products/Voy_Red_Hero_2000x.webp",
    images: [
      "/products/Voy_Red_Hero_2000x.webp",
      "/products/Voy_Red_Front_2000x.webp",
      "/products/Voy_Red_Side_2000x.webp",
    ],
    classLabels: ["Toptier PC's"],
  },
  {
    id: "6",
    name: "Bronze Compact",
    price: 3999,
    cpu: "AMD Ryzen 5 5600X",
    gpu: "RTX 3050",
    ram: "8GB DDR4",
    storage: "256GB",
    storagetype: "SSD",
    tier: "Bronze",
    rating: 4.1,
    reviews: 198,
    image: "/products/NavPro_Hero_Colorswap_2000x.webp",
    images: [
      "/products/NavPro_Hero_Colorswap_2000x.webp",
      "/products/NavPro_Front_Colorswap_2000x.webp",
      "/products/NavPro_Side_Colorswap_2000x.webp",
    ],
    classLabels: ["Budget PC's"],
  },
  {
    id: "7",
    name: "Silver Speedster",
    price: 9999,
    cpu: "AMD Ryzen 7 7700X",
    gpu: "RTX 4070 Super",
    ram: "32GB DDR5",
    storage: "1TB",
    storagetype: "NVMe",
    tier: "Silver",
    rating: 4.6,
    reviews: 423,
    image: "/products/Traveler_Hero_1_2000x.webp",
    images: [
      "/products/Traveler_Hero_1_2000x.webp",
      "/products/Traveler_Front_1_2000x.webp",
      "/products/Traveler_Side_1_2000x.webp",
    ],
    classLabels: ["Best-Selling PC's"],
  },
  {
    id: "8",
    name: "Gold Architect",
    price: 14999,
    cpu: "AMD Ryzen 9 7950X",
    gpu: "RTX 4090",
    ram: "64GB DDR5",
    storage: "2TB",
    storagetype: "NVMe",
    tier: "Gold",
    rating: 4.7,
    reviews: 687,
    image: "/products/Voyager_Hero_NoGeforce_2000x_2.webp",
    images: [
      "/products/Voyager_Hero_NoGeforce_2000x_2.webp",
      "/products/Voyager_Front_NoGeforce_2000x_2.webp",
      "/products/Voyager_Side_NoGeforce_2000x_2.webp",
    ],
    classLabels: ["Toptier PC's"],
  },
  {
    id: "9",
    name: "Test item 4kr",
    price: 4,
    cpu: "Placeholder CPU",
    gpu: "Placeholder GPU",
    ram: "Placeholder RAM",
    storage: "Placeholder storage",
    storagetype: "SSD",
    tier: "Bronze",
    rating: 4.0,
    reviews: 1,
    image: "/products/Traveler_Back_2000x.webp",
    images: [
      "/products/Traveler_Back_2000x.webp",
      "/products/Traveler_Top_2000x.webp",
      "/products/Traveler_Front_1_2000x.webp",
    ],
    classLabels: ["Budget PC's"],
  },
  {
    id: "10",
    name: "Paket Silver Ascent",
    price: 11999,
    cpu: "Intel i7-13700K",
    gpu: "RTX 4070",
    ram: "32GB DDR5",
    storage: "1TB",
    storagetype: "SSD",
    tier: "Paket",
    rating: 4.6,
    reviews: 74,
    image: "/products/Horizon_Pro_Hero_wEliteComponents_2000x.webp",
    images: [
      "/products/Horizon_Pro_Hero_wEliteComponents_2000x.webp",
      "/products/Horizon_Pro_Front_wEliteComponents_2000x.webp",
      "/products/Horizon_Pro_Side_wEliteComponents_2000x.webp",
    ],
    classLabels: ["Paket PC's"],
    bundleIncludes: ["Skärm", "Tangentbord", "Mus", "Headset"],
  },
  {
    id: "11",
    name: "Paket Gold Pinnacle",
    price: 15999,
    cpu: "Intel i9-13900K",
    gpu: "RTX 4080",
    ram: "64GB DDR5",
    storage: "2TB",
    storagetype: "SSD",
    tier: "Paket",
    rating: 4.7,
    reviews: 61,
    image: "/products/Horizon3_Elite_Hero_2000x.webp",
    images: [
      "/products/Horizon3_Elite_Hero_2000x.webp",
      "/products/Horizon3_Elite_Front_2000x.webp",
      "/products/Horizon3_Elite_Side_2000x.webp",
    ],
    classLabels: ["Paket PC's"],
    bundleIncludes: ["Skärm", "Tangentbord", "Mus", "Headset"],
  },
  {
    id: "12",
    name: "Paket Platina Frostbyte",
    price: 21999,
    cpu: "Intel i9-14900KS",
    gpu: "RTX 4090",
    ram: "128GB DDR5",
    storage: "4TB",
    storagetype: "SSD",
    tier: "Paket",
    rating: 4.9,
    reviews: 38,
    image: "/products/Voyager_Hero_NoGeforce_2000x.webp",
    images: [
      "/products/Voyager_Hero_NoGeforce_2000x.webp",
      "/products/Voyager_Front_NoGeforce_2000x.webp",
      "/products/Voyager_Side_NoGeforce_2000x.webp",
    ],
    classLabels: ["Paket PC's"],
    bundleIncludes: ["Skärm", "Tangentbord", "Mus", "Headset"],
  },
  {

    id: "13",

    name: "Cheapo - Begagnade",

    price: 6027,

    cpu: "AMD Ryzen 5 3600",

    gpu: "ASUS Dual GeForce RTX 3050 6GB OC",

    ram: "A-Data XPG SPECTRIX D35G 16GB (2x8GB) DDR4 3600MHz CL18",

    storage: "Team Group T-Force G50",

    storagetype: "SSD",

    tier: "Bronze",

    rating: 4.0,

    reviews: 0,

    image: "/products/NavBase_Hero_Colorswap_2000x.webp",

    images: [

      "/products/NavBase_Hero_Colorswap_2000x.webp",

      "/products/NavBase_Front_Colorswap_2000x.webp",

      "/products/NavBase_Side_Colorswap_2000x.webp",

    ],

    classLabels: ["Budget PC's"],

    isUsed: true,

  },
  {

    id: "14",

    name: "Cheapo - Ny",

    price: 7009,

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

  },
  {

    id: "15",

    name: "Price-performance - Ny",

    price: 9564,

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

    id: "16",

    name: "11k - Beg",

    price: 11112,

    cpu: "AMD Ryzen 5 5500",

    gpu: "PNY GeForce RTX 5060 Ti Dual Fan OC",

    ram: "Corsair Dominator RGB DDR4 3600MHz 32GB",

    storage: "2TB",

    storagetype: "NVMe",

    tier: "Silver",

    rating: 4.1,

    reviews: 0,

    image: "/products/Horizon3_Elite_Hero_2000x.webp",

    images: [

      "/products/Horizon3_Elite_Hero_2000x.webp",

      "/products/Horizon3_Elite_Front_2000x.webp",

      "/products/Horizon3_Elite_Side_2000x.webp",

    ],

    classLabels: ["Budget PC's"],

    isUsed: true,

  },
  {

    id: "17",

    name: "12.5k - Ny",

    price: 12425,

    cpu: "AMD Ryzen 5 5600X",

    gpu: "Gigabyte GeForce RTX 5070 WINDFORCE OC 12GB",

    ram: "Corsair Dominator RGB DDR4 3600MHz 32GB",

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

    id: "18",

    name: "Plat build - Beg",

    price: 15395,

    cpu: "AMD Ryzen 5 8400F",

    gpu: "Gigabyte GeForce RTX 5070 WINDFORCE SFF 12GB",

    ram: "Dell 32GB DDR5 5600MHz (begagnad)",

    storage: "Lexar Professional NM1090",

    storagetype: "NVMe",

    tier: "Gold",

    rating: 4.4,

    reviews: 0,

    image: "/products/Voyager_Hero_NoGeforce_2000x_2.webp",

    images: [

      "/products/Voyager_Hero_NoGeforce_2000x_2.webp",

      "/products/Voyager_Front_NoGeforce_2000x_2.webp",

      "/products/Voyager_Side_NoGeforce_2000x_2.webp",

    ],

    isUsed: true,

  },
  {

    id: "19",

    name: "Plat build - Ny",

    price: 17956,

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

    id: "20",

    name: "All rounder - Begagnade",

    price: 18641,

    cpu: "AMD Ryzen 5 7600X3D",

    gpu: "Asus Dual GeForce RTX 5070 OC",

    ram: "Dell 32GB DDR5 5600MHz (begagnad)",

    storage: "Lexar Professional NM1090",

    storagetype: "NVMe",

    tier: "Gold",

    rating: 4.4,

    reviews: 0,

    image: "/products/Traveler_Back_2000x.webp",

    images: [

      "/products/Traveler_Back_2000x.webp",

      "/products/Traveler_Top_2000x.webp",

      "/products/Traveler_Front_1_2000x.webp",

    ],

    isUsed: true,

  },
  {

    id: "21",

    name: "All rounder - Ny",

    price: 20771,

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

  },
  {

    id: "22",

    name: "All in, all out - BLACK Nybyggd",

    price: 31791,

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

    id: "23",

    name: "All white, all out - NYPRIS",

    price: 34233,

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
