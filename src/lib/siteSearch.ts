import Fuse from "fuse.js";
import { Computer } from "@/data/computers";
import { SupabaseProduct } from "@/hooks/useProducts";
import { getProductFromLookup, mergeProductFields } from "@/lib/productOverrides";
import { resolveProductImage } from "@/lib/productImageResolver";

export type SearchCatalogItem = {
  id: string;
  name: string;
  price: number;
  cpu: string;
  gpu: string;
  ram: string;
  tier: string;
  image: string | null;
  searchableTier: string;
};

export type CategorySuggestion = {
  id: string;
  label: string;
  description: string;
  path: string;
  keywords: string[];
};

export type SearchResultState = {
  products: SearchCatalogItem[];
  categories: CategorySuggestion[];
  correctedQuery: string | null;
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tierToSearchLabel = (tier: string) => {
  const normalized = normalizeText(tier);
  if (normalized.includes("diamant")) return "diamant high-end premium";
  if (normalized.includes("platina") || normalized.includes("platinum")) return "platina premium";
  if (normalized.includes("guld") || normalized.includes("gold")) return "guld";
  if (normalized.includes("silver")) return "silver";
  if (normalized.includes("paket")) return "paket bundle";
  return tier;
};

const CATEGORY_SUGGESTIONS: CategorySuggestion[] = [
  {
    id: "all",
    label: "Alla produkter",
    description: "Se hela sortimentet",
    path: "/products?clear_filters=1",
    keywords: ["alla", "alla produkter", "all", "produkter", "datorer", "gaming"],
  },
  {
    id: "budget",
    label: "Budgetvänlig",
    description: "Prisvärda byggen med stark prestanda",
    path: "/products?preset=budget",
    keywords: ["budget", "billig", "prisvärd", "entry", "starter"],
  },
  {
    id: "paket",
    label: "Paket",
    description: "Dator + tillbehör i ett paket",
    path: "/products?category=paket&clear_filters=1",
    keywords: ["paket", "bundle", "tillbehör", "komplett"],
  },
  {
    id: "toptier",
    label: "Bästa prestanda",
    description: "Högsta segmentet för max FPS",
    path: "/products?preset=toptier",
    keywords: ["bästa", "prestanda", "high end", "premium", "diamant", "platina"],
  },
  {
    id: "custom",
    label: "Custom bygg",
    description: "Bygg en dator efter dina behov",
    path: "/custom-bygg",
    keywords: ["custom", "bygg", "bygg själv", "konfigurera"],
  },
  {
    id: "service",
    label: "Service och reparation",
    description: "Felsökning, uppgraderingar och service",
    path: "/service-reparation",
    keywords: ["service", "reparation", "hjälp", "support"],
  },
];

const CATEGORY_FUSE = new Fuse(CATEGORY_SUGGESTIONS, {
  includeScore: true,
  threshold: 0.42,
  ignoreLocation: true,
  keys: [
    { name: "label", weight: 0.6 },
    { name: "description", weight: 0.2 },
    { name: "keywords", weight: 0.8 },
  ],
});

const includesNormalized = (source: string, query: string) => normalizeText(source).includes(query);

export const buildSearchCatalog = ({
  computers,
  productLookup,
}: {
  computers: Computer[];
  productLookup: Map<string, SupabaseProduct>;
}): SearchCatalogItem[] =>
  computers.map((computer) => {
    const product =
      getProductFromLookup(productLookup, computer.name) ||
      getProductFromLookup(productLookup, computer.id);

    const merged = mergeProductFields(
      {
        name: computer.name,
        price: computer.price,
        cpu: computer.cpu,
        gpu: computer.gpu,
        ram: computer.ram,
        storage: computer.storage,
        storagetype: computer.storagetype,
        tier: computer.tier,
      },
      product,
    );

    return {
      id: computer.id,
      name: merged.name,
      price: merged.price,
      cpu: merged.cpu,
      gpu: merged.gpu,
      ram: merged.ram,
      tier: merged.tier,
      searchableTier: tierToSearchLabel(merged.tier),
      image: resolveProductImage(product, computer.image) || computer.image,
    };
  });

export const buildSearchState = ({
  query,
  catalog,
  limit = 6,
}: {
  query: string;
  catalog: SearchCatalogItem[];
  limit?: number;
}): SearchResultState => {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return {
      products: [],
      categories: CATEGORY_SUGGESTIONS.slice(0, 4),
      correctedQuery: null,
    };
  }

  const productFuse = new Fuse(catalog, {
    includeScore: true,
    threshold: 0.36,
    ignoreLocation: true,
    keys: [
      { name: "name", weight: 0.52 },
      { name: "gpu", weight: 0.2 },
      { name: "cpu", weight: 0.16 },
      { name: "ram", weight: 0.06 },
      { name: "searchableTier", weight: 0.06 },
    ],
  });

  const fuzzyResults = productFuse.search(normalizedQuery, { limit });
  const products = fuzzyResults.map((entry) => entry.item);

  const hasDirectMatch = catalog.some(
    (item) =>
      includesNormalized(item.name, normalizedQuery) ||
      includesNormalized(item.cpu, normalizedQuery) ||
      includesNormalized(item.gpu, normalizedQuery),
  );

  const correctedQuery =
    !hasDirectMatch && fuzzyResults[0]?.score !== undefined && fuzzyResults[0].score > 0.16
      ? fuzzyResults[0].item.name
      : null;

  const categories = CATEGORY_FUSE.search(normalizedQuery, { limit: 4 }).map((entry) => entry.item);

  return {
    products,
    categories: categories.length > 0 ? categories : CATEGORY_SUGGESTIONS.slice(0, 4),
    correctedQuery,
  };
};

export const defaultCategorySuggestions = CATEGORY_SUGGESTIONS.slice(0, 4);
