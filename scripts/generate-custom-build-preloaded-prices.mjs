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

const isReasonablePreloadedPrice = (item, price) => {
  if (!Number.isFinite(price) || price <= 0) return false;
  const basePrice = Number(item?.basePrice || 0);
  if (!Number.isFinite(basePrice) || basePrice <= 0) return true;

  let lowerMultiplier = 0.35;
  let upperMultiplier = 2.5;

  if (item.category === "gpu") {
    lowerMultiplier = 0.55;
    upperMultiplier = 1.6;
  } else if (item.category === "cpu") {
    lowerMultiplier = 0.45;
    upperMultiplier = 2.1;
  } else if (item.category === "motherboard") {
    lowerMultiplier = 0.45;
    upperMultiplier = 2.3;
  } else if (item.category === "ram" || item.category === "storage") {
    lowerMultiplier = 0.4;
    upperMultiplier = 1.9;
  } else if (item.category === "psu" || item.category === "cooling") {
    lowerMultiplier = 0.4;
    upperMultiplier = 2.2;
  } else if (item.category === "case") {
    lowerMultiplier = 0.4;
    upperMultiplier = 2;
  }

  const lowerBound = Math.max(50, Math.round(basePrice * lowerMultiplier));
  const upperBound = Math.max(lowerBound, Math.round(basePrice * upperMultiplier));
  return price >= lowerBound && price <= upperBound;
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
      cachePrice: getCachedLowestPrice(cachedResponseByItemId.get(item.id)),
      source: null,
      note: null,
    })),
  ];

  const priceById = {};
  const metaById = {};

  for (const item of allItems) {
    const override = LEGACY_PRICE_OVERRIDES[item.id];
    const acceptedCachePrice =
      Number.isFinite(item.cachePrice) && item.cachePrice > 0 && isReasonablePreloadedPrice(item, item.cachePrice)
        ? item.cachePrice
        : null;
    const effectivePrice = acceptedCachePrice ?? override?.price ?? item.basePrice;

    const source = acceptedCachePrice
      ? "prisjakt_seed"
      : override
      ? "static_legacy_fallback"
      : item.category === "cpu" || item.category === "motherboard"
      ? "catalog_fallback"
      : "static_reference";

    priceById[item.id] = Math.max(0, Math.round(effectivePrice));
    metaById[item.id] = {
      category: item.category,
      name: item.name,
      source,
      note: source === "static_legacy_fallback" ? override?.reason || null : null,
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
