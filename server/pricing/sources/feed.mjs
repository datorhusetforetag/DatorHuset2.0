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

/*
 * Kolumn- och elementnamn vi känner igen, i fallande prioritet.
 *
 * Danska namn står med eftersom Partner-ads är ett danskt nätverk och
 * levererar produktnavn, nypris, vareurl och billedurl även i sina
 * svenska flöden.
 *
 * produktid och varenummer är med flit INTE mappade till mpn. De är
 * butikens egna löpnummer, inte tillverkarens artikelnummer, och två
 * butiker sätter olika sådana på samma vara. Matchar man på dem tror
 * man sig ha en exakt träff och har en slumpmässig.
 */
const FIELD_ALIASES = {
  title: ["product_name", "productname", "name", "title", "produktnamn", "produktnavn"],
  ean: ["ean", "gtin", "gtin13", "ean_code", "eancode", "barcode"],
  mpn: ["mpn", "manufacturer_sku", "model_number", "sku", "part_number", "artnr"],
  brand: ["brand", "manufacturer", "varumarke", "tillverkare", "maerke", "mærke"],
  price: ["price", "sale_price", "saleprice", "pris", "current_price", "nypris"],
  regularPrice: [
    "regular_price",
    "list_price",
    "ordinarie_pris",
    "rrp",
    "gammelpris",
    "glpris",
    "foerpris",
  ],
  shipping: [
    "shipping_price",
    "shipping",
    "delivery_cost",
    "frakt",
    "fragt",
    "fragtomk",
  ],
  currency: ["currency", "valuta"],
  availability: [
    "availability",
    "in_stock",
    "instock",
    "stock_status",
    "lagerstatus",
  ],
  stockCount: ["stock_quantity", "quantity", "antal", "stock", "lagerantal"],
  url: [
    "aw_deep_link",
    "deep_link",
    "tracking_url",
    "product_url",
    "vareurl",
    "url",
    "link",
  ],
  image: [
    "image_url",
    "merchant_image_url",
    "aw_image_url",
    "billedurl",
    "image",
    "bild",
  ],
  category: [
    "category",
    "merchant_category",
    "kategorinavn",
    "kategori",
    "product_type",
  ],
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

/*
 * Läser början av en ström och lämnar tillbaka den hel.
 *
 * Formatet avgörs av första tecknet, men strömmen får inte förbrukas av
 * att man tittar. Det lästa läggs tillbaka först i en ny ström, så den
 * som läser efteråt ser allt från början.
 */
const peek = async (stream, bytes) => {
  let head = "";
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
    head += chunk.toString("utf8");
    if (head.length >= bytes) break;
  }
  const rest = Readable.from(
    (async function* () {
      for (const chunk of chunks) yield chunk;
      for await (const chunk of stream) yield chunk;
    })(),
  );
  return [head, rest];
};

/* ------------------------------------------------------------ XML ---- */

/*
 * Partner-ads levererar XML, inte avgränsad text.
 *
 * Läsaren nedan klarade bara CSV, så ett Partner-ads-flöde hade gett noll
 * rader utan att klaga - den hade tagit första raden som rubrikrad, inte
 * hittat någon kolumn som hette pris, och kastat.
 *
 * Ingen XML-parser hämtas in. Ett komplett elektronikflöde är hundratusen
 * produkter, och varenda färdig parser bygger ett träd av alltihop i
 * minnet först. Vi behöver en produkt i taget och kastar den direkt, så
 * här letas <produkt>-block ut ur strömmen medan den rinner förbi.
 */

/** Elementnamn som brukar omsluta en produkt. Första som hittas vinner. */
const ITEM_TAGS = ["produkt", "product", "item", "vare"];

const ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const decodeEntities = (text) =>
  text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, body) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X"
      ? Number.parseInt(body.slice(2), 16)
      : Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    const hit = ENTITIES[body.toLowerCase()];
    return hit === undefined ? whole : hit;
  });

/*
 * Ett produktblock till ett enkelt objekt.
 *
 * Bara direkta barn med text läses. Attribut och djupare nivåer ignoreras
 * - inget flöde vi bryr oss om lägger pris eller titel där, och att ta
 * hand om dem hade krävt en riktig parser.
 *
 * CDATA plockas ut som den är. Produktnamn innehåller ofta & och <, och
 * det är därför butiken lagt dem i CDATA från början.
 */
const parseItemBlock = (block) => {
  const record = {};

  /* Skala av <produkt>-omslaget innan barnen läses. Utan det matchar
     mönstret nedan omslaget först och hela produkten hamnar som ett enda
     fält som heter "produkt". */
  const inner = block
    .replace(/^\s*<[a-z0-9_:-]+(?:\s[^>]*)?>/i, "")
    .replace(/<\/[a-z0-9_:-]+\s*>\s*$/i, "");

  const pattern = /<([a-z0-9_:-]+)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = pattern.exec(inner)) !== null) {
    const key = match[1].toLowerCase().replace(/^.*:/, "");
    let value = match[2];
    const cdata = value.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
    value = cdata ? cdata[1] : decodeEntities(value);
    /* Första förekomsten vinner. Vissa flöden upprepar element för
       varianter, och den första är huvudprodukten. */
    if (record[key] === undefined) record[key] = value.trim();
  }
  return record;
};

/*
 * Plockar ut ett produktblock i taget ur en ström.
 *
 * Bufferten kapas efter varje träff, så minnesanvändningen följer
 * storleken på en produkt och inte på flödet.
 */
async function* streamXmlItems(stream) {
  let buffer = "";
  let tag = null;

  for await (const chunk of stream) {
    buffer += chunk.toString("utf8");

    if (!tag) {
      for (const candidate of ITEM_TAGS) {
        if (new RegExp(`<${candidate}[\\s>]`, "i").test(buffer)) {
          tag = candidate;
          break;
        }
      }
      /* Ingen känd taggform ännu. Låt bufferten växa, men inte hur
         långt som helst - då är det inte den sortens XML vi tror. */
      if (!tag) {
        if (buffer.length > 262144) {
          throw new Error(
            `Hittade inget produktelement i flödet. Väntade något av: ${ITEM_TAGS.join(", ")}.`,
          );
        }
        continue;
      }
    }

    const open = new RegExp(`<${tag}(?:\\s[^>]*)?>`, "i");
    const close = new RegExp(`</${tag}\\s*>`, "i");

    for (;;) {
      const start = buffer.search(open);
      if (start === -1) break;
      const rest = buffer.slice(start);
      const end = rest.search(close);
      if (end === -1) break;
      const closeLength = rest.match(close)[0].length;
      yield rest.slice(0, end + closeLength);
      buffer = rest.slice(end + closeLength);
    }
  }
}

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
      Accept: "text/csv,text/xml,application/xml,text/plain,application/gzip,*/*",
      "User-Agent": process.env.PRICING_USER_AGENT || "DatorHuset-PriceBot/1.0 (+https://datorhuset.se)",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const error = new Error(`Flödet för ${storeId} svarade ${response.status}`);
    error.status = response.status;
    throw error;
  }

  /*
   * Många nätverk levererar .csv.gz eller .xml.gz för att spara bandbredd.
   *
   * Content-Encoding står med flit INTE här. Det är transportkomprimering
   * och fetch packar upp den åt oss innan vi ser kroppen - packar vi upp en
   * gång till får vi "incorrect header check" och flödet dör.
   *
   * Content-Type: application/gzip är något annat: då ÄR innehållet en
   * gzip-fil, och den måste vi öppna själva.
   */
  const isGzip =
    url.endsWith(".gz") || (response.headers.get("content-type") || "").includes("gzip");

  let stream = Readable.fromWeb(response.body);
  if (isGzip) stream = stream.pipe(createGunzip());

  let total = 0;
  let accepted = 0;
  let skipped = 0;

  /*
   * En produkt, oavsett format.
   *
   * cell(field) svarar på samma frågor vare sig värdet kom ur en
   * CSV-cell eller ett XML-element. Allt nedanför den här punkten var
   * skrivet en gång för CSV och behövde inte skrivas om.
   */
  const handleRecord = async (cell) => {
    total++;

    // Ett elektronikflöde innehåller allt från diskmaskiner till kablar.
    // Filtrera tidigt så vi slipper matcha mot hundratusentals irrelevanta rader.
    if (categoryFilter) {
      const category = String(cell("category") ?? "").toLowerCase();
      const title = String(cell("title") ?? "").toLowerCase();
      if (!categoryFilter.test(category) && !categoryFilter.test(title)) {
        skipped++;
        return;
      }
    }

    const priceCents = toCents(cell("price"));
    const productUrl = cell("url");
    const title = cell("title");
    if (priceCents === null || !productUrl || !title) {
      skipped++;
      return;
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
  };

  /*
   * Formatet avgörs av innehållet, inte av filändelsen.
   *
   * En flödeslänk från ett nätverk slutar ofta på .php eller bär bara en
   * nyckel i frågesträngen, så namnet säger ingenting. Första tecknet
   * som inte är blanksteg gör det: < betyder XML.
   */
  const [head, rest] = await peek(stream, 4096);
  const isXml = head.trimStart().startsWith("<");

  if (isXml) {
    let checked = false;

    for await (const block of streamXmlItems(rest)) {
      const record = parseItemBlock(block);
      const names = Object.keys(record);
      /* Kartan byggs per produkt, inte en gång. Valfria element utelämnas
         ibland, och en karta låst till den första produkten hade då tappat
         fält på alla följande. Femton alias-uppslag per rad kostar inget
         mot hämtningen och databasskrivningen. */
      const fieldMap = buildFieldMap(names, fieldOverrides);

      if (!checked) {
        checked = true;
        if (fieldMap.title === undefined || fieldMap.price === undefined) {
          throw new Error(
            `Flödet för ${storeId} saknar element för titel eller pris. Hittade: ${names.join(", ") || "inga"}`,
          );
        }
      }

      await handleRecord((field) =>
        fieldMap[field] === undefined ? null : record[names[fieldMap[field]]] ?? null,
      );
    }
  } else {
    const lines = createInterface({ input: rest, crlfDelay: Infinity });
    let fieldMap = null;
    let delimiter = ",";

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

      const cells = parseDelimited(line, delimiter);
      await handleRecord((field) =>
        fieldMap[field] === undefined ? null : cells[fieldMap[field]] ?? null,
      );
    }
  }

  return { total, accepted, skipped };
};

/** Bara PC-komponenter - håller matchningsarbetet nere. */
export const COMPONENT_CATEGORY_FILTER =
  /processor|cpu|grafikkort|graphics|gpu|moderkort|motherboard|ram|minne|memory|ssd|nvme|hårddisk|hardisk|storage|chassi|case|nätaggregat|natagg|power supply|psu|kylare|cooler|kylning/i;

export default { streamFeed, parseDelimited, COMPONENT_CATEGORY_FILTER };
