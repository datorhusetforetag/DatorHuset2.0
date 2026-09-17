/**
 * Generisk läsare för affiliate-produktflöden.
 *
 * Adtraction, Awin, Adrecord och TradeDoubler levererar alla samma sorts
 * innehåll - en rad per produkt med EAN, pris, lager och en spårningslänk -
 * men kolumnerna heter olika. Därför är kolumnnamnen konfiguration och inte
 * kod: en ny butik ska kunna läggas till med en miljövariabel, inte en fil.
 *
 * Flödet läses som en ström och radvis. Ett komplett elektronikflöde kan vara
 * hundratusentals rader, och att läsa in alltihop i minnet på en liten
 * Render-instans är ett säkert sätt att bli dödad av OOM.
 */

import { createGunzip } from "node:zlib";
import { Readable } from "node:stream";
import { createInterface } from "node:readline";

/** Kolumnnamn vi känner igen, i fallande prioritet. */
const FIELD_ALIASES = {
  title: ["product_name", "productname", "name", "title", "produktnamn"],
  ean: ["ean", "gtin", "gtin13", "ean_code", "eancode", "barcode"],
  mpn: ["mpn", "manufacturer_sku", "model_number", "sku", "part_number", "artnr"],
  brand: ["brand", "manufacturer", "varumarke", "tillverkare"],
  price: ["price", "sale_price", "saleprice", "pris", "current_price"],
  regularPrice: ["regular_price", "list_price", "ordinarie_pris", "rrp"],
  shipping: ["shipping_price", "shipping", "delivery_cost", "frakt"],
  currency: ["currency", "valuta"],
  availability: ["availability", "in_stock", "instock", "stock_status", "lagerstatus"],
  stockCount: ["stock_quantity", "quantity", "antal", "stock"],
  url: ["aw_deep_link", "deep_link", "tracking_url", "product_url", "url", "link"],
  image: ["image_url", "merchant_image_url", "aw_image_url", "image", "bild"],
  category: ["category", "merchant_category", "kategori", "product_type"],
};

const IN_STOCK_VALUES = new Set([
  "in stock",
  "instock",
  "in_stock",
  "yes",
  "ja",
  "1",
  "true",
  "available",
  "i lager",
  "tillganglig",
]);

const OUT_OF_STOCK_VALUES = new Set([
  "out of stock",
  "outofstock",
  "out_of_stock",
  "no",
  "nej",
  "0",
  "false",
  "unavailable",
  "slut",
  "ej i lager",
]);

const normalizeHeader = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/^﻿/, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/** Bygger en karta från vårt fältnamn till kolumnindex i just det här flödet. */
const buildFieldMap = (headers, overrides = {}) => {
  const normalized = headers.map(normalizeHeader);
  const map = {};

  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    // En uttrycklig override vinner alltid över gissningen.
    const override = overrides[field];
    if (override) {
      const idx = normalized.indexOf(normalizeHeader(override));
      if (idx !== -1) {
        map[field] = idx;
        continue;
      }
    }
    for (const alias of aliases) {
      const idx = normalized.indexOf(alias);
      if (idx !== -1) {
        map[field] = idx;
        break;
      }
    }
  }
  return map;
};

/**
 * CSV-rad till fält. Hanterar citattecken och dubblade citattecken inuti fält,
 * vilket produktnamn med tum-tecken ('27" skarm') gör nödvändigt.
 */
export const parseDelimited = (line, delimiter) => {
  const out = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      out.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  out.push(current);
  return out;
};

const detectDelimiter = (headerLine) => {
  const counts = [
    [",", (headerLine.match(/,/g) || []).length],
    ["\t", (headerLine.match(/\t/g) || []).length],
    [";", (headerLine.match(/;/g) || []).length],
    ["|", (headerLine.match(/\|/g) || []).length],
  ];
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ",";
};

const toCents = (value) => {
  if (value === null || value === undefined || value === "") return null;
  // Flöden blandar "1 299,00", "1299.00" och "1,299.00".
  let text = String(value).replace(/[^\d.,-]/g, "").trim();
  if (!text) return null;

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1) {
    // Det som står sist är decimaltecknet.
    if (lastComma > lastDot) text = text.replace(/\./g, "").replace(",", ".");
    else text = text.replace(/,/g, "");
  } else if (lastComma !== -1) {
    // Komma som decimaltecken om exakt två siffror följer.
    text = /,\d{1,2}$/.test(text) ? text.replace(",", ".") : text.replace(/,/g, "");
  }

  const numeric = Number.parseFloat(text);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return Math.round(numeric * 100);
};

const resolveAvailability = (raw, stockCount) => {
  const value = String(raw ?? "").toLowerCase().trim();
  if (IN_STOCK_VALUES.has(value)) return "in_stock";
  if (OUT_OF_STOCK_VALUES.has(value)) return "out_of_stock";
  if (value.includes("preorder") || value.includes("forhandsbok")) return "preorder";

  const count = Number(stockCount);
  if (Number.isFinite(count)) return count > 0 ? "in_stock" : "out_of_stock";
  return "unknown";
};

/**
 * Läser ett flöde och anropar onRow för varje produktrad.
 *
 * onRow returnerar inget - anroparen bestämmer själv vad som ska sparas.
 * Det håller minnesanvändningen konstant oavsett hur stort flödet är.
 */
export const streamFeed = async (config, onRow, { timeoutMs = 120000 } = {}) => {
  const { id: storeId, label, url, fieldOverrides = {}, categoryFilter = null } = config;
  if (!url) throw new Error(`Flödet för ${storeId} saknar url.`);

  const response = await fetch(url, {
    headers: {
      Accept: "text/csv,text/plain,application/gzip,*/*",
      "User-Agent": process.env.PRICING_USER_AGENT || "DatorHuset-PriceBot/1.0 (+https://datorhuset.se)",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const error = new Error(`Flödet för ${storeId} svarade ${response.status}`);
    error.status = response.status;
    throw error;
  }

  // Många nätverk levererar .csv.gz för att spara bandbredd.
  const isGzip =
    url.endsWith(".gz") ||
    (response.headers.get("content-type") || "").includes("gzip") ||
    (response.headers.get("content-encoding") || "").includes("gzip");

  let stream = Readable.fromWeb(response.body);
  if (isGzip) stream = stream.pipe(createGunzip());

  const lines = createInterface({ input: stream, crlfDelay: Infinity });

  let fieldMap = null;
  let delimiter = ",";
  let total = 0;
  let accepted = 0;
  let skipped = 0;

  for await (const line of lines) {
    if (!line.trim()) continue;

    if (fieldMap === null) {
      delimiter = detectDelimiter(line);
      fieldMap = buildFieldMap(parseDelimited(line, delimiter), fieldOverrides);
      if (fieldMap.title === undefined || fieldMap.price === undefined) {
        throw new Error(
          `Flödet för ${storeId} saknar kolumn för titel eller pris. Hittade: ${Object.keys(fieldMap).join(", ") || "inga"}`,
        );
      }
      continue;
    }

    total++;
    const cells = parseDelimited(line, delimiter);
    const cell = (field) => (fieldMap[field] === undefined ? null : cells[fieldMap[field]] ?? null);

    // Ett elektronikflöde innehåller allt från diskmaskiner till kablar.
    // Filtrera tidigt så vi slipper matcha mot hundratusentals irrelevanta rader.
    if (categoryFilter) {
      const category = String(cell("category") ?? "").toLowerCase();
      const title = String(cell("title") ?? "").toLowerCase();
      if (!categoryFilter.test(category) && !categoryFilter.test(title)) {
        skipped++;
        continue;
      }
    }

    const priceCents = toCents(cell("price"));
    const productUrl = cell("url");
    const title = cell("title");
    if (priceCents === null || !productUrl || !title) {
      skipped++;
      continue;
    }

    const shippingCents = toCents(cell("shipping"));
    const stockCount = cell("stockCount");

    accepted++;
    await onRow({
      store_id: storeId,
      store_name: label || storeId,
      source: config.network || storeId,
      title: String(title).trim(),
      price_cents: priceCents,
      shipping_cents: shippingCents,
      total_cents: shippingCents === null ? priceCents : priceCents + shippingCents,
      currency: (cell("currency") || "SEK").toUpperCase(),
      availability: resolveAvailability(cell("availability"), stockCount),
      stock_count: Number.isFinite(Number(stockCount)) ? Number(stockCount) : null,
      product_url: String(productUrl).trim(),
      image_url: cell("image") || null,
      ean: cell("ean"),
      mpn: cell("mpn"),
      brand: cell("brand"),
    });
  }

  return { total, accepted, skipped };
};

/** Bara PC-komponenter - håller matchningsarbetet nere. */
export const COMPONENT_CATEGORY_FILTER =
  /processor|cpu|grafikkort|graphics|gpu|moderkort|motherboard|ram|minne|memory|ssd|nvme|hårddisk|hardisk|storage|chassi|case|nätaggregat|natagg|power supply|psu|kylare|cooler|kylning/i;

export default { streamFeed, parseDelimited, COMPONENT_CATEGORY_FILTER };
