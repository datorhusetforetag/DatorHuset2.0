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
  cpu: ["https://www.prisjakt.nu/c/processorer"],
  gpu: ["https://www.prisjakt.nu/c/grafikkort"],
  motherboard: ["https://www.prisjakt.nu/c/moderkort"],
  ram: ["https://www.prisjakt.nu/c/ram-minne"],
  storage: ["https://www.prisjakt.nu/c/interna-ssd-diskar", "https://www.prisjakt.nu/c/interna-harddiskar"],
  case: ["https://www.prisjakt.nu/c/chassin"],
  psu: ["https://www.prisjakt.nu/c/nataggregat"],
  cooling: ["https://www.prisjakt.nu/c/pc-komponentkylare"],
};
const forceReseedCategories =
  process.env.CUSTOM_BUILD_FORCE_RESEED_STATIC === "true"
    ? new Set(["gpu", "ram", "storage", "case", "psu", "cooling"])
    : new Set();

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeText(value, maxLength = 200) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
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

async function buildCategoryProductIndex(category) {
  const urls = Array.isArray(categoryUrls[category]) ? categoryUrls[category] : [];
  const productsById = new Map();
  for (const baseUrl of urls) {
    for (let offset = 0; offset <= 440; offset += 44) {
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
      await sleep(120);
    }
  }
  return Array.from(productsById.values());
}

function buildPrisjaktDuckDuckGoSearchUrl(query, exact = true) {
  const safeQuery = sanitizeText(query, 180);
  if (!safeQuery) return null;
  const encodedQuery = encodeURIComponent(
    exact ? `site:prisjakt.nu/produkt.php "${safeQuery}"` : `site:prisjakt.nu ${safeQuery}`
  );
  return `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
}

async function fetchPrisjaktDuckDuckGoSearchText(query) {
  const urls = [
    buildPrisjaktDuckDuckGoSearchUrl(query, true),
    buildPrisjaktDuckDuckGoSearchUrl(query, false),
  ].filter(Boolean);
  if (urls.length === 0) return null;
  const texts = (
    await Promise.all(urls.map((url) => fetchText(url).catch(() => null)))
  ).filter((value) => typeof value === "string" && value.trim().length > 0);
  return texts.length > 0 ? texts.join("\n\n") : null;
}

function extractPrisjaktProductUrlsFromDuckDuckGoSearch(markdown) {
  if (!markdown || typeof markdown !== "string") return [];
  const urls = [];
  const seen = new Set();
  const redirectRegex = /https?:\/\/(?:duckduckgo\.com|html\.duckduckgo\.com)\/l\/\?uddg=([^\s)]+)/gi;
  let match = redirectRegex.exec(markdown);
  while (match) {
    const decodedUrl = decodeURIComponent(String(match[1] || "").trim());
    const normalizedUrl = normalizePrisjaktProductUrl(decodedUrl);
    if (normalizedUrl && !seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      urls.push(normalizedUrl);
    }
    match = redirectRegex.exec(markdown);
  }
  return urls;
}

function extractPrisjaktProductTitle(html) {
  const title = decodeHtmlEntities(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "");
  return title.replace(/,\s*fr[åa]n\s+.+$/i, "").trim();
}

function buildSearchQueries(item) {
  const variants = new Set();
  const addVariant = (value) => {
    const normalized = sanitizeText(String(value || ""), 160)
      .replace(/\s*\([^)]*\)\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (normalized.length >= 3) {
      variants.add(normalized);
    }
  };

  (Array.isArray(item?.searchTerms) ? item.searchTerms : []).forEach((term) => addVariant(term));
  addVariant(item?.name);

  const name = sanitizeText(String(item?.name || ""), 160);
  if (name) {
    addVariant(name.replace(/^AMD\s+/i, ""));
    addVariant(name.replace(/^Intel\s+/i, ""));
    addVariant(name.replace(/^ASUS\s+/i, ""));
    addVariant(name.replace(/^MSI\s+/i, ""));
    addVariant(name.replace(/^Gigabyte\s+/i, ""));
    addVariant(name.replace(/^ASRock\s+/i, ""));
    addVariant(name.replace(/^Corsair\s+/i, ""));
    addVariant(name.replace(/^Kingston\s+/i, ""));
    addVariant(name.replace(/^Samsung\s+/i, ""));
    addVariant(name.replace(/^NVIDIA\s+/i, ""));
  }

  return Array.from(variants).slice(0, 6);
}

function scorePrisjaktProductHtmlForItem(html, item) {
  const title = extractPrisjaktProductTitle(html);
  if (!title) return -1;
  const combinedQuery = [item?.name || "", ...(Array.isArray(item?.searchTerms) ? item.searchTerms : [])].join(" ");
  const modelTokens = extractModelTokens(combinedQuery);
  if (!matchesModelTokens(title, modelTokens)) return -1;
  const normalizedTitle = normalizeKey(title);
  const normalizedName = normalizeKey(combinedQuery);
  let score = scoreTitleAgainstQuery(title, combinedQuery);
  if (normalizedTitle === normalizedName) score += 12;
  if (normalizedTitle.includes(normalizedName)) score += 6;
  return score;
}

function scorePriceMatch(expectedPrice, actualPrice) {
  if (!Number.isFinite(expectedPrice) || expectedPrice <= 0) return 0;
  if (!Number.isFinite(actualPrice) || actualPrice <= 0) return 0;
  const diffRatio = Math.abs(actualPrice - expectedPrice) / expectedPrice;
  if (diffRatio <= 0.12) return 8;
  if (diffRatio <= 0.25) return 5;
  if (diffRatio <= 0.4) return 2;
  if (diffRatio <= 0.7) return -2;
  if (diffRatio <= 1.2) return -6;
  return -12;
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

async function loadExistingProductMap() {
  try {
    const raw = await fs.readFile(productMapFile, "utf8");
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function loadExistingCacheEntries() {
  try {
    const raw = await fs.readFile(cacheFile, "utf8");
    const parsed = raw ? JSON.parse(raw) : {};
    const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
    return new Map(entries.filter((entry) => entry?.item_id).map((entry) => [entry.item_id, entry]));
  } catch {
    return new Map();
  }
}

async function persistSeedState(entries, productUrlMap) {
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
}

function hasUsefulOffers(entry) {
  const offers = Array.isArray(entry?.response?.offers) ? entry.response.offers : [];
  return offers.some((offer) => Number.isFinite(offer?.total_price ?? offer?.price) && (offer?.product_url || offer?.search_url));
}

async function findPrisjaktProduct(item, existingProductMap) {
  const candidateUrls = [];
  const seenUrls = new Set();

  const seedUrl = normalizePrisjaktProductUrl(existingProductMap[item.id] || manualProductOverrides[item.id]);
  if (seedUrl) {
    seenUrls.add(seedUrl);
    candidateUrls.push(seedUrl);
  }

  const indexedCandidates = productIndexByCategory[item.category] || [];
  const combinedQuery = [item?.name || "", ...(Array.isArray(item?.searchTerms) ? item.searchTerms : [])].join(" ");
  const modelTokens = extractModelTokens(combinedQuery);
  const rankedIndexedCandidates = indexedCandidates
    .filter((candidate) => matchesModelTokens(candidate.title, modelTokens))
    .map((candidate) => ({
      ...candidate,
      score: scoreTitleAgainstQuery(candidate.title, combinedQuery),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  for (const candidate of rankedIndexedCandidates) {
    if (seenUrls.has(candidate.url)) continue;
    seenUrls.add(candidate.url);
    candidateUrls.push(candidate.url);
  }

  for (const searchQuery of buildSearchQueries(item)) {
    const searchText = await fetchPrisjaktDuckDuckGoSearchText(searchQuery).catch(() => null);
    const urls = extractPrisjaktProductUrlsFromDuckDuckGoSearch(searchText);
    for (const url of urls) {
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
      candidateUrls.push(url);
      if (candidateUrls.length >= 6) break;
    }
    if (candidateUrls.length >= 6) break;
    await sleep(150);
  }

  let bestCandidate = null;
  for (const url of candidateUrls) {
    const html = await fetchText(url).catch(() => null);
    if (!html) continue;
    const titleScore = scorePrisjaktProductHtmlForItem(html, item);
    if (titleScore < 0) continue;
    const offers = extractOffersFromPrisjaktHtml(html);
    const lowestOfferPrice =
      offers.length > 0 ? Math.min(...offers.map((offer) => offer.total_price ?? offer.price).filter(Number.isFinite)) : null;
    const score = titleScore + scorePriceMatch(item?.price, lowestOfferPrice);
    if (!bestCandidate || score > bestCandidate.score) {
      bestCandidate = { url, html, score };
    }
    await sleep(150);
  }

  return bestCandidate;
}

async function buildSeedEntry(item, existingProductMap) {
  const product = await findPrisjaktProduct(item, existingProductMap);
  const offers = product?.html ? extractOffersFromPrisjaktHtml(product.html) : [];
  return {
    key: `${cacheVersion}:${item.id}`,
    item_id: item.id,
    updatedAt: Date.now(),
    response: {
      offers,
    },
    productUrl: product?.url || null,
  };
}

const existingProductMap = await loadExistingProductMap();
const productIndexByCategory = Object.fromEntries(
  await Promise.all(
    Object.keys(categoryUrls).map(async (category) => [category, await buildCategoryProductIndex(category)])
  )
);
const existingCacheEntries = await loadExistingCacheEntries();
const entriesByItemId = new Map(existingCacheEntries);
const nextProductUrlMap = { ...existingProductMap };

for (let index = 0; index < CUSTOM_BUILD_CATALOG_ITEMS.length; index += 1) {
  const item = CUSTOM_BUILD_CATALOG_ITEMS[index];
  const cachedEntry = entriesByItemId.get(item.id);
  if (!forceReseedCategories.has(item.category) && hasUsefulOffers(cachedEntry)) {
    console.log(`[${index + 1}/${CUSTOM_BUILD_CATALOG_ITEMS.length}] reuse ${item.category} ${item.id} ${item.name}`);
    continue;
  }

  console.log(`[${index + 1}/${CUSTOM_BUILD_CATALOG_ITEMS.length}] fetch ${item.category} ${item.id} ${item.name}`);
  const entry = await buildSeedEntry(item, nextProductUrlMap);
  entriesByItemId.set(item.id, {
    key: entry.key,
    item_id: entry.item_id,
    updatedAt: entry.updatedAt,
    response: entry.response,
  });
  if (entry.productUrl) {
    nextProductUrlMap[item.id] = entry.productUrl;
  }
  if ((index + 1) % 5 === 0) {
    await persistSeedState(
      CUSTOM_BUILD_CATALOG_ITEMS.map((catalogItem) => {
        const cachedValue = entriesByItemId.get(catalogItem.id);
        return cachedValue || {
          key: `${cacheVersion}:${catalogItem.id}`,
          item_id: catalogItem.id,
          updatedAt: Date.now(),
          response: { offers: [] },
        };
      }),
      nextProductUrlMap
    );
  }
  await sleep(150);
}

const entries = CUSTOM_BUILD_CATALOG_ITEMS.map((item) => {
  const cachedValue = entriesByItemId.get(item.id);
  return (
    cachedValue || {
      key: `${cacheVersion}:${item.id}`,
      item_id: item.id,
      updatedAt: Date.now(),
      response: { offers: [] },
    }
  );
});

await persistSeedState(entries, nextProductUrlMap);

const seededCount = entries.filter((entry) => Array.isArray(entry.response?.offers) && entry.response.offers.length > 0).length;
console.log(`Seeded offers for ${seededCount}/${CUSTOM_BUILD_CATALOG_ITEMS.length} items.`);
