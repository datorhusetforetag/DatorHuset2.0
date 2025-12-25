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
];
