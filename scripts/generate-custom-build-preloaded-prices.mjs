import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { CUSTOM_BUILD_CATALOG_ITEMS } from "../src/data/customBuildCatalog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const CUSTOM_BUILD_PAGE_FILE = path.join(repoRoot, "src", "pages", "CustomBuild.tsx");
const CUSTOM_BUILD_CACHE_FILE = path.join(repoRoot, "data", "custom-build-product-cache.json");
const OUTPUT_FILE = path.join(repoRoot, "src", "data", "customBuildPreloadedPrices.js");

const STATIC_CATEGORIES = ["gpu", "ram", "storage", "case", "psu", "cooling"];

const LEGACY_PRICE_OVERRIDES = {
  "gpu-1": { price: 3490, reason: "Approximerad marknadsnivå för äldre instegsmodell." },
  "gpu-2": { price: 4290, reason: "Approximerad marknadsnivå för äldre mellanklassmodell." },
  "gpu-3": { price: 5890, reason: "Lagts strax under RTX 5070 som ungefärlig ersättningsnivå." },
  "gpu-4": { price: 6290, reason: "Lagts strax under RTX 5070 som ungefärlig ersättningsnivå." },
  "gpu-5": { price: 10990, reason: "Lagts strax under RTX 5080 som ungefärlig ersättningsnivå." },
  "gpu-6": { price: 17990, reason: "Statisk high-end-nivå i avsaknad av stabil nybutiksdata." },
  "gpu-7": { price: 2990, reason: "Approximerad marknadsnivå för äldre 1080p-kort." },
  "gpu-8": { price: 4390, reason: "Approximerad marknadsnivå för äldre 1440p-kort." },
  "gpu-9": { price: 5390, reason: "Lagts under RX 9070 XT som ungefärlig ersättningsnivå." },
  "gpu-10": { price: 2890, reason: "Approximerad marknadsnivå för äldre Intel Arc-modell." },
  "ram-14": { price: 799, reason: "Begagnad OEM-modul prissatt under motsvarande ny modul." },
};

const getCachedLowestPrice = (response) => {
  if (Number.isFinite(response?.lowest_price) && Number(response.lowest_price) > 0) {
    return Math.max(0, Math.round(Number(response.lowest_price)));
  }

  const offers = Array.isArray(response?.offers) ? response.offers : [];
  const prices = offers
    .map((offer) => {
      const value = offer?.total_price ?? offer?.price;
      return Number.isFinite(value) && Number(value) > 0 ? Math.round(Number(value)) : null;
    })
    .filter((value) => typeof value === "number");

  if (prices.length === 0) return null;
  return Math.min(...prices);
};

const parseStaticItemsFromCustomBuildPage = (sourceText) => {
  const output = [];

  for (const category of STATIC_CATEGORIES) {
    const categoryRegex = new RegExp(`${category}: \\[(.*?)\\n  \\],`, "s");
    const categoryMatch = sourceText.match(categoryRegex);
    if (!categoryMatch) continue;

    const block = categoryMatch[1];
    const itemRegex =
      /{\s*[\r\n]+(?:\s+.+[\r\n]+)*?\s+id:\s*"([^"]+)"\s*,[\r\n]+(?:\s+.+[\r\n]+)*?\s+name:\s*"([^"]+)"\s*,[\r\n]+(?:\s+.+[\r\n]+)*?\s+price:\s*(\d+)/g;

    for (const match of block.matchAll(itemRegex)) {
      output.push({
        id: match[1],
        category,
        name: match[2],
        price: Number(match[3]),
      });
    }
  }

  return output;
};

const formatJsObject = (value) => JSON.stringify(value, null, 2);

const main = async () => {
  const [customBuildPageSource, rawCacheFile] = await Promise.all([
    fs.readFile(CUSTOM_BUILD_PAGE_FILE, "utf8"),
    fs.readFile(CUSTOM_BUILD_CACHE_FILE, "utf8"),
  ]);

  const cachePayload = JSON.parse(rawCacheFile);
  const cacheEntries = Array.isArray(cachePayload?.entries) ? cachePayload.entries : [];
  const cachedResponseByItemId = new Map(
    cacheEntries
      .filter((entry) => entry?.item_id && entry?.response)
      .map((entry) => [entry.item_id, entry.response])
  );

  const staticItems = parseStaticItemsFromCustomBuildPage(customBuildPageSource);
  const allItems = [
    ...CUSTOM_BUILD_CATALOG_ITEMS.map((item) => ({
      id: item.id,
      category: item.category,
      name: item.name,
      basePrice: item.price,
      cachePrice: getCachedLowestPrice(cachedResponseByItemId.get(item.id)),
      source: null,
      note: null,
    })),
    ...staticItems.map((item) => ({
      id: item.id,
      category: item.category,
      name: item.name,
      basePrice: item.price,
      cachePrice: null,
      source: null,
      note: null,
    })),
  ];

  const priceById = {};
  const metaById = {};

  for (const item of allItems) {
    const override = LEGACY_PRICE_OVERRIDES[item.id];
    const effectivePrice =
      override?.price ??
      (Number.isFinite(item.cachePrice) && item.cachePrice > 0 ? item.cachePrice : item.basePrice);

    const source = override
      ? "static_legacy_fallback"
      : Number.isFinite(item.cachePrice) && item.cachePrice > 0
      ? "prisjakt_seed"
      : item.category === "cpu" || item.category === "motherboard"
      ? "catalog_fallback"
      : "static_reference";

    priceById[item.id] = Math.max(0, Math.round(effectivePrice));
    metaById[item.id] = {
      category: item.category,
      name: item.name,
      source,
      note: override?.reason || null,
    };
  }

  const output = `export const CUSTOM_BUILD_PRELOADED_PRICES_VERSION = ${JSON.stringify(
    `generated-${new Date().toISOString()}`
  )};

export const CUSTOM_BUILD_PRELOADED_PRICE_BY_ID = ${formatJsObject(priceById)};

export const CUSTOM_BUILD_PRELOADED_PRICE_META_BY_ID = ${formatJsObject(metaById)};
`;

  await fs.writeFile(OUTPUT_FILE, output, "utf8");

  const stats = {
    totalItems: Object.keys(priceById).length,
    catalogItems: CUSTOM_BUILD_CATALOG_ITEMS.length,
    staticItems: staticItems.length,
    legacyOverrides: Object.keys(LEGACY_PRICE_OVERRIDES).length,
  };

  console.log(JSON.stringify(stats, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
