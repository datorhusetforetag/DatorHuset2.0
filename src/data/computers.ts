export type UsedParts = {
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

/**
 * En uppgraderad version av samma dator - mer minne, större disk.
 *
 * VIKTIGT: productKey pekar ut en RIKTIG produkt i Supabase, den som
 * faktiskt hamnar i varukorgen om man väljer kortet. Priset läses
 * därifrån och skrivs aldrig här.
 *
 * Det är med flit. Varukorgen tar ett produkt-id och ett antal - den
 * har ingen plats för "grundpris plus 1 200 kr för extra minne". Ett
 * pristillägg skrivet här hade alltså visats på sidan men aldrig
 * följt med till kassan, och kunden hade debiterats grundpriset. Ett
 * pris på skärmen som inte är det som dras är det värsta en butik kan
 * visa, så uppgraderingen är en egen produkt eller ingenting.
 *
 * Så här lägger du till en:
 *
 *   1. Skapa produkten i adminläget, till exempel
 *      "Silver-Speedster - 64GB".
 *   2. Lägg till raden här:
 *
 *        upgrades: [
 *          { productKey: "Silver-Speedster - 64GB",
 *            group: "ram",
 *            label: "64GB DDR4",
 *            summary: "Dubbelt minne" },
 *        ],
 *
 * Hittas ingen produkt med den nyckeln visas kortet inte alls, så en
 * felstavad nyckel ger en saknad valmöjlighet - aldrig ett trasigt köp.
 */
export type ComputerUpgrade = {
  /** Namnet på produkten i Supabase. Priset hämtas därifrån. */
  productKey: string;
  /**
   * Vilken rubrik uppgraderingen hamnar under på produktsidan.
   *
   * performance är processor och grafikkort tillsammans. De byts i
   * praktiken ihop - ett snabbare grafikkort utan processor att mata
   * det med är inte en uppgradering - och att erbjuda dem var för
   * sig hade bjudit in till obalanserade byggen.
   */
  group: "storage" | "performance" | "ram" | "other";
  /** Kort etikett på kortet, till exempel "64GB DDR5". */
  label: string;
  /** En rad under etiketten. */
  summary?: string;
};

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
  /**
   * Vad maskinen är byggd för. Styr "Gaming datorer" och "Workstation"
   * i navigeringen (/products?use=gaming respektive ?use=workstation).
   *
   * Utelämnad betyder "gaming", eftersom allt vi byggt hittills är
   * speldatorer. Det är därför Workstation-vyn är tom tills någon
   * faktiskt märker upp en maskin här - och tom är rätt svar. En
   * workstation-sida som visar speldatorer påstår något som inte är
   * sant, och det är värre än en sida som säger att det inte finns
   * några ännu.
   *
   * Sätt use: "workstation" på de maskiner som ska ligga där.
   */
  use?: "gaming" | "workstation";
  /** Uppgraderade utföranden av samma dator. Se ComputerUpgrade. */
  upgrades?: ComputerUpgrade[];
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
    image: "/products/newpc/chieftecvista_new.png",
    images: [
      "/products/newpc/chieftecvista_new.png",
      "/products/newpc/chieftecvista_new2.jpg",
      "/products/newpc/chieftecvista_new3.jpg",
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
    image: "/products/newpc/chieftecvisio_new.png",
    images: [
      "/products/newpc/chieftecvisio_new.png",
      "/products/newpc/chieftecvisio_new2.png",
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
    image: "/products/newpc/chieftecvisio_new.png",
    images: [
      "/products/newpc/chieftecvisio_new.png",
      "/products/newpc/chieftecvisio_new2.png",
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
    image: "/products/newpc/cg530_new.png",
    images: [
      "/products/newpc/cg530_new.png",
      "/products/newpc/cg530_new3.jpg",
      "/products/newpc/cg530_new2.jpg",
      "/products/newpc/cg530_new4.jpg",
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
    image: "/products/newpc/cg530_new.png",
    images: [
      "/products/newpc/cg530_new.png",
      "/products/newpc/cg530_new2.jpg",
      "/products/newpc/cg530_new3.jpg",
      "/products/newpc/cg530_new4.jpg",
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
