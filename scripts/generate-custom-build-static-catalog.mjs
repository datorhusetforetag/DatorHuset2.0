import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import {
  CUSTOM_BUILD_PRELOADED_PRICE_BY_ID,
  CUSTOM_BUILD_PRELOADED_PRICE_META_BY_ID,
} from "../src/data/customBuildPreloadedPrices.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const CUSTOM_BUILD_PAGE_FILE = path.join(repoRoot, "src", "pages", "CustomBuild.tsx");
const OUTPUT_FILE = path.join(repoRoot, "src", "data", "customBuildStaticCatalog.js");

const STATIC_CATEGORIES = ["gpu", "ram", "storage", "case", "psu", "cooling"];

const parseStringArray = (value) =>
  Array.from(value.matchAll(/"([^"]+)"/g)).map((match) => match[1]).filter(Boolean);

const buildSearchTerms = (item) => {
  const variants = new Set([item.name]);
  const combinedSpecsVariant = [item.name, ...(Array.isArray(item.specs) ? item.specs : [])].join(" ").trim();
  if (combinedSpecsVariant) {
    variants.add(combinedSpecsVariant);
  }
  const normalizedWithoutParens = item.name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  if (normalizedWithoutParens && normalizedWithoutParens !== item.name) {
    variants.add(normalizedWithoutParens);
    variants.add([normalizedWithoutParens, ...(Array.isArray(item.specs) ? item.specs : [])].join(" ").trim());
  }

  const withoutBrand = item.name.replace(new RegExp(`^${item.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "").trim();
  if (withoutBrand && withoutBrand !== item.name) {
    variants.add(withoutBrand);
  }

  if (item.category === "gpu") {
    variants.add(item.name.replace(/^NVIDIA\s+/i, "").replace(/^ASUS\s+/i, "").trim());
    variants.add(item.name.replace(/^Gigabyte\s+/i, "").replace(/^PNY\s+/i, "").trim());
  }

  return Array.from(variants).filter((value) => value.length >= 3);
};

const parseStaticItemsFromCustomBuildPage = (sourceText) => {
  const output = [];

  for (const category of STATIC_CATEGORIES) {
    const categoryRegex = new RegExp(`${category}: \\[(.*?)\\n  \\],`, "s");
    const categoryMatch = sourceText.match(categoryRegex);
    if (!categoryMatch) continue;

    const block = categoryMatch[1];
    const itemBlocks = block.match(/\{[\s\S]*?\n\s*\},/g) || [];
    for (const itemBlock of itemBlocks) {
      const id = itemBlock.match(/id:\s*"([^"]+)"/)?.[1] || "";
      const name = itemBlock.match(/name:\s*"([^"]+)"/)?.[1] || "";
      const brand = itemBlock.match(/brand:\s*"([^"]+)"/)?.[1] || "";
      const specsRaw = itemBlock.match(/specs:\s*\[([\s\S]*?)\]/)?.[1] || "";
      const specs = parseStringArray(specsRaw);
      if (!id || !name || !brand) continue;

      const preloadedPrice = CUSTOM_BUILD_PRELOADED_PRICE_BY_ID[id];
      output.push({
        id,
        category,
        name,
        brand,
        price: Number.isFinite(preloadedPrice) ? Math.round(preloadedPrice) : 0,
        specs,
        searchTerms: buildSearchTerms({ id, category, name, brand, specs }),
      });
    }
  }

  return output;
};

const main = async () => {
  const customBuildPageSource = await fs.readFile(CUSTOM_BUILD_PAGE_FILE, "utf8");
  const staticItems = parseStaticItemsFromCustomBuildPage(customBuildPageSource);

  const output = `export const STATIC_CUSTOM_BUILD_CATALOG_ITEMS = ${JSON.stringify(staticItems, null, 2)};

export const STATIC_CUSTOM_BUILD_CATALOG_BY_ID = Object.fromEntries(
  STATIC_CUSTOM_BUILD_CATALOG_ITEMS.map((item) => [item.id, item])
);

export const STATIC_CUSTOM_BUILD_CATEGORY_KEYS = ${JSON.stringify(STATIC_CATEGORIES, null, 2)};

export const STATIC_CUSTOM_BUILD_PRELOAD_METADATA = ${JSON.stringify(
    Object.fromEntries(
      staticItems.map((item) => [
        item.id,
        {
          source: CUSTOM_BUILD_PRELOADED_PRICE_META_BY_ID[item.id]?.source || "static_reference",
          note: CUSTOM_BUILD_PRELOADED_PRICE_META_BY_ID[item.id]?.note || null,
        },
      ])
    ),
    null,
    2
  )};
`;

  await fs.writeFile(OUTPUT_FILE, output, "utf8");
  console.log(JSON.stringify({ count: staticItems.length }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
