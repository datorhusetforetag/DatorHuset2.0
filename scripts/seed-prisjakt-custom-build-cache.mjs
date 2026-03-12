import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CUSTOM_BUILD_CATALOG_ITEMS } from "../src/data/customBuildCatalog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const cacheFile = path.join(repoRoot, "data", "custom-build-product-cache.json");
const productMapFile = path.join(repoRoot, "data", "prisjakt-product-map.json");
const cacheVersion = "prisjakt-v1";
const allowedStores = new Map(
  [
    ["amazon se", { id: "amazon-se", name: "Amazon.se" }],
    ["amazon.se", { id: "amazon-se", name: "Amazon.se" }],
    ["computersalg", { id: "computersalg", name: "Computersalg" }],
    ["elgiganten", { id: "elgiganten", name: "Elgiganten" }],
    ["komplett", { id: "komplett", name: "Komplett" }],
    ["netonnet", { id: "netonnet", name: "NetOnNet" }],
    ["proshop", { id: "proshop", name: "Proshop" }],
    ["webhallen", { id: "webhallen", name: "Webhallen" }],
    ["webbhallen", { id: "webhallen", name: "Webhallen" }],
  ].map(([key, value]) => [normalizeKey(key), value])
);
const manualProductOverrides = {
  "cpu-lga1700-core-i5-12400f": "https://www.prisjakt.nu/produkt.php?p=5948013",
  "mb-am4-msi-b550-tomahawk": "https://www.prisjakt.nu/produkt.php?p=5386548",
  "mb-am5-msi-b650-tomahawk-wifi": "https://www.prisjakt.nu/produkt.php?p=7153870",
};
const categoryUrls = {
  cpu: "https://www.prisjakt.nu/c/processorer",
  motherboard: "https://www.prisjakt.nu/c/moderkort",
};

const supportedItems = CUSTOM_BUILD_CATALOG_ITEMS.filter(
  (item) => item.category === "cpu" || item.category === "motherboard"
);

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function parseMoneyValue(value) {
  const raw = String(value || "")
    .replace(/[\u00A0\s]+/g, "")
    .replace(/[^0-9,.-]/g, "");
  if (!raw) return null;
  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  let normalized = raw;
  if (lastComma >= 0 && lastDot >= 0) {
    normalized = lastComma > lastDot ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "");
  } else if (lastComma >= 0) {
    const decimals = raw.length - lastComma - 1;
    normalized = decimals <= 2 ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "");
  } else if (lastDot >= 0) {
    const decimals = raw.length - lastDot - 1;
    normalized = decimals <= 2 ? raw.replace(/,/g, "") : raw.replace(/\./g, "");
  }
  const parsed = Number(normalized.replace(/(?!^)-/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function tokenize(value) {
  return normalizeKey(value)
    .split(" ")
    .filter(Boolean);
}

function extractModelTokens(value) {
  return Array.from(new Set(tokenize(value).filter((token) => token.length >= 3 && /\d/.test(token))));
}

function matchesModelTokens(text, modelTokens) {
  if (!modelTokens.length) return true;
  const haystack = normalizeKey(text);
  return modelTokens.every((token) => haystack.includes(token));
}

function scoreTitleAgainstQuery(title, query) {
  const titleTokens = new Set(tokenize(title));
  return tokenize(query).reduce((score, token) => score + (titleTokens.has(token) ? 2 : 0), 0);
}

function normalizePrisjaktProductUrl(value) {
  const url = String(value || "").trim().replace(/&amp;/g, "&");
  if (!/^https:\/\/www\.prisjakt\.nu\/produkt\.php\?p=\d+/i.test(url)) return null;
  return url.replace(/([?&])rut=[^&]+/i, "$1").replace(/[?&]$/g, "");
}

function normalizePrisjaktGoToShopUrl(value) {
  const url = String(value || "").trim().replace(/&amp;/g, "&");
  return /^https:\/\/www\.prisjakt\.nu\/go-to-shop\/\d+\/offer\/[^"\s<]+/i.test(url) ? url : null;
}

async function fetchText(url, accept = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8") {
  const response = await fetch(url, {
    headers: {
      Accept: accept,
      "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "User-Agent":
        process.env.CUSTOM_PRICE_USER_AGENT ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) return null;
  return response.text();
}

function extractTitleFromPrisjaktHtml(html) {
  const title = decodeHtmlEntities(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "");
  return title.replace(/,\s*från\s+.+$/i, "").trim();
}

function extractProductsFromCategoryHtml(html) {
  const products = [];
  const regex = /href="\/produkt\.php\?p=(\d+)"[\s\S]*?<span[^>]*title="([^"]+)"[^>]*data-test="ProductName"/g;
  let match = regex.exec(html);
  while (match) {
    const productId = String(match[1] || "").trim();
    const title = decodeHtmlEntities(match[2]).trim();
    if (productId && title) {
      products.push({
        id: productId,
        title,
        url: `https://www.prisjakt.nu/produkt.php?p=${productId}`,
      });
    }
    match = regex.exec(html);
  }
  return products;
}

function extractOffersFromPrisjaktHtml(html) {
  const offersByStoreId = new Map();
  const rowRegex =
    /<a href="(https:\/\/www\.prisjakt\.nu\/go-to-shop\/[^"]+)"[\s\S]*?<span class="StoreInfoTitle[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<h4[^>]*data-test="PriceLabel"[^>]*>([^<]+)<\/h4>/gi;
  let match = rowRegex.exec(html);
  while (match) {
    const productUrl = normalizePrisjaktGoToShopUrl(match[1]);
    const storeMatch = allowedStores.get(normalizeKey(decodeHtmlEntities(match[2])));
    const price = parseMoneyValue(decodeHtmlEntities(match[3]));
    if (!productUrl || !storeMatch || !Number.isFinite(price)) {
      match = rowRegex.exec(html);
      continue;
    }
    const offer = {
      store_id: storeMatch.id,
      store: storeMatch.name,
      status: "available",
      product_url: productUrl,
      search_url: null,
      price: Math.max(0, Math.round(price)),
      total_price: Math.max(0, Math.round(price)),
      currency: "SEK",
      shipping_price: null,
      availability: "in_stock",
    };
    const current = offersByStoreId.get(offer.store_id);
    if (!current || current.total_price > offer.total_price) {
      offersByStoreId.set(offer.store_id, offer);
    }
    match = rowRegex.exec(html);
  }
  return Array.from(offersByStoreId.values())
    .sort((a, b) => a.total_price - b.total_price || a.store.localeCompare(b.store, "sv"))
    .slice(0, 5);
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function buildCategoryProductIndex(category) {
  const baseUrl = categoryUrls[category];
  if (!baseUrl) return [];
  const productsById = new Map();
  for (let offset = 0; offset <= 1320; offset += 44) {
    const url = offset === 0 ? baseUrl : `${baseUrl}?offset=${offset}`;
    const html = await fetchText(url).catch(() => null);
    if (!html) break;
    const products = extractProductsFromCategoryHtml(html);
    if (products.length === 0) break;
    products.forEach((product) => {
      if (!productsById.has(product.id)) {
        productsById.set(product.id, product);
      }
    });
    await sleep(200);
  }
  return Array.from(productsById.values());
}

const productIndexByCategory = {
  cpu: await buildCategoryProductIndex("cpu"),
  motherboard: await buildCategoryProductIndex("motherboard"),
};

async function findPrisjaktProductUrl(item) {
  const overrideUrl = normalizePrisjaktProductUrl(manualProductOverrides[item.id]);
  if (overrideUrl) return overrideUrl;

  const candidates = productIndexByCategory[item.category] || [];
  const modelTokens = extractModelTokens(item.name);
  let bestCandidate = null;
  for (const candidate of candidates) {
    if (!matchesModelTokens(candidate.title, modelTokens)) continue;
    const score = scoreTitleAgainstQuery(candidate.title, item.name);
    if (!bestCandidate || score > bestCandidate.score) {
      bestCandidate = { ...candidate, score };
    }
  }
  return bestCandidate?.url || null;
}

async function buildSeedEntry(item) {
  const productUrl = await findPrisjaktProductUrl(item);
  if (!productUrl) {
    return {
      key: `${cacheVersion}:${item.id}`,
      item_id: item.id,
      updatedAt: Date.now(),
      response: {
        offers: [],
      },
      productUrl: null,
    };
  }

  await sleep(500);
  const html = await fetchText(productUrl).catch(() => null);
  const offers = html ? extractOffersFromPrisjaktHtml(html) : [];
  return {
    key: `${cacheVersion}:${item.id}`,
    item_id: item.id,
    updatedAt: Date.now(),
    response: {
      offers,
    },
    productUrl,
  };
}

const entries = [];
const productUrlMap = {};
for (let index = 0; index < supportedItems.length; index += 1) {
  const item = supportedItems[index];
  console.log(`[${index + 1}/${supportedItems.length}] ${item.id} ${item.name}`);
  const entry = await buildSeedEntry(item);
  entries.push({
    key: entry.key,
    item_id: entry.item_id,
    updatedAt: entry.updatedAt,
    response: entry.response,
  });
  if (entry.productUrl) {
    productUrlMap[item.id] = entry.productUrl;
  }
  await sleep(700);
}

await fs.mkdir(path.dirname(cacheFile), { recursive: true });
await fs.writeFile(
  cacheFile,
  JSON.stringify(
    {
      version: cacheVersion,
      saved_at: new Date().toISOString(),
      entries,
    },
    null,
    2
  ),
  "utf8"
);
await fs.writeFile(productMapFile, JSON.stringify(productUrlMap, null, 2), "utf8");

const seededCount = entries.filter((entry) => Array.isArray(entry.response?.offers) && entry.response.offers.length > 0).length;
console.log(`Seeded offers for ${seededCount}/${supportedItems.length} items.`);
