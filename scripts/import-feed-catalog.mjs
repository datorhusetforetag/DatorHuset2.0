/**
 * Läser komponenter ur ett affiliateflöde in i konfiguratorns katalog.
 *
 *   node scripts/import-feed-catalog.mjs                  # hämtar flödet
 *   node scripts/import-feed-catalog.mjs --file feed.xml  # från disk
 *   node scripts/import-feed-catalog.mjs --limit 50       # smakprov
 *
 * Skriver två filer:
 *
 *   src/data/customBuildFeedCatalog.generated.js
 *       De komponenter vars egenskaper gick att läsa ut säkert.
 *
 *   data/feed-import-review.json
 *       De som inte gick att avgöra, med anledningen. Den här är till
 *       för att läsas av en människa och kategoriseras för hand.
 *
 * VARFÖR EN GRIND OCH INTE BARA IMPORT
 *
 * Konfiguratorns värde är att den vet vad som passar ihop. En processor
 * utan känd sockel går inte att para med ett moderkort, och ett minne
 * utan känd DDR-generation går inte att para med något alls. Raden i
 * flödet bär titel, pris, bild och EAN - inte sockel, inte TDP.
 *
 * Det mesta går ändå att läsa ur titeln, för Proshop skriver dem
 * strukturerat:
 *
 *   ASUS PRIME B550-PLUS Moderkort - AMD B550 - AMD AM4 - DDR4 RAM - ATX
 *
 * Men inte allt. En processor heter bara "AMD Ryzen 7 5800X3D CPU - 8
 * kärnor - 3.4 GHz" och nämner ingen sockel alls; den får härledas ur
 * modellnamnet. Går det inte hamnar raden i granskningslistan i stället
 * för att gissas in i katalogen. En gissad sockel är värre än en
 * utelämnad produkt: den bygger ihop en dator som inte går att montera.
 */

import { writeFileSync, createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";

import { streamFeed, COMPONENT_CATEGORY_FILTER } from "../server/pricing/sources/feed.mjs";
import { CUSTOM_BUILD_CATALOG_ITEMS } from "../src/data/customBuildCatalog.js";

const args = process.argv.slice(2);
const flagValue = (name) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] : null;
};
const LIMIT = Number(flagValue("limit")) || Infinity;
const FILE = flagValue("file");

/* ------------------------------------------------------------ tolkning --- */

/** Sockelnamn som konfiguratorn känner till. Andra går inte att använda. */
const KNOWN_SOCKETS = ["AM4", "AM5", "LGA1700", "LGA1200", "LGA1851"];

/*
 * Processorns sockel ur modellnamnet.
 *
 * Titeln nämner den nästan aldrig, men modellnumret avgör den entydigt:
 * Ryzen 7000 och uppåt är AM5, 5000 och neråt AM4, och Intels
 * generationssiffra styr LGA-numret. Reglerna är skrivna efter det som
 * faktiskt säljs, och det som inte täcks hamnar i granskning.
 */
const cpuSocket = (title) => {
  const t = title.toLowerCase();

  const ryzen = t.match(/ryzen\s+\d\s+(\d)(\d{3})/);
  if (ryzen) {
    const series = Number(ryzen[1]);
    if (series >= 7) return "AM5";
    if (series >= 1 && series <= 5) return "AM4";
    return null;
  }

  const coreUltra = t.match(/core\s+ultra\s+\d\s+(\d)/);
  if (coreUltra) return "LGA1851";

  const intel = t.match(/i[3579][\s-]*(\d{4,5})/);
  if (intel) {
    const gen = intel[1].length === 5 ? Number(intel[1].slice(0, 2)) : Number(intel[1][0]);
    if (gen >= 12 && gen <= 14) return "LGA1700";
    if (gen >= 10 && gen <= 11) return "LGA1200";
    return null;
  }
  return null;
};

/** Sockel som står utskriven i titeln, t.ex. på moderkort. */
const statedSocket = (title) => {
  const upper = title.toUpperCase();
  return KNOWN_SOCKETS.find((socket) => upper.includes(socket)) || null;
};

const ramType = (title) => {
  const upper = title.toUpperCase();
  if (upper.includes("DDR5")) return "DDR5";
  if (upper.includes("DDR4")) return "DDR4";
  return null;
};

const formFactor = (title) => {
  const t = title.toLowerCase();
  /* Proshop skriver tornstorlek på chassin, inte moderkortsformat:
     "DeepCool CC560 - Chassi - Miditower - Svart". 3 905 chassin föll på
     att jag bara letade efter ATX. */
  if (/midi.?tower|midi.?torn/.test(t)) return "Miditower";
  if (/full.?tower|big.?tower/.test(t)) return "Full tower";
  if (/mini.?tower/.test(t)) return "Mini tower";
  if (t.includes("mini-itx") || t.includes("mini itx")) return "Mini-ITX";
  if (t.includes("micro-atx") || t.includes("matx") || t.includes("m-atx")) return "Micro-ATX";
  if (t.includes("e-atx") || t.includes("eatx")) return "E-ATX";
  if (t.includes("atx")) return "ATX";
  return null;
};

/** Lagringskapacitet, normaliserad till GB. */
const capacityGb = (title) => {
  const tb = title.match(/(\d+(?:[.,]\d+)?)\s*TB\b/i);
  if (tb) return Math.round(Number(tb[1].replace(",", ".")) * 1024);
  const gb = title.match(/(\d+)\s*GB\b/i);
  if (gb) return Number(gb[1]);
  return null;
};

const watts = (title) => {
  const w = title.match(/(\d{3,4})\s*W\b/i);
  return w ? Number(w[1]) : null;
};

const gpuChip = (title) => {
  const rtx = title.match(/\bRTX\s*(\d{4})\s*(Ti|Super|Ti\s*Super)?/i);
  if (rtx) return `RTX ${rtx[1]}${rtx[2] ? " " + rtx[2].trim() : ""}`.replace(/\s+/g, " ");
  const rx = title.match(/\bRX\s*(\d{4})\s*(XT|XTX|GRE)?/i);
  if (rx) return `RX ${rx[1]}${rx[2] ? " " + rx[2] : ""}`.trim();
  const arc = title.match(/\bArc\s+([AB]\d{3})/i);
  if (arc) return `Arc ${arc[1].toUpperCase()}`;
  return null;
};

/* --------------------------------------------------------- kategorier ---- */

/*
 * Vilken kategori raden hör till, och vad som krävs för att den ska få
 * komma in. Kravet är alltid det configuratorn behöver för att kunna
 * säga nej till en omöjlig kombination.
 */
const CATEGORIES = [
  {
    key: "motherboard",
    matches: (c, t) => /moderkort|motherboard/i.test(c) || /moderkort/i.test(t),
    build: (row) => {
      const socket = statedSocket(row.title);
      const ram = ramType(row.title);
      const form = formFactor(row.title);
      if (!socket) return { reject: "sockel saknas i titeln" };
      if (!ram) return { reject: "DDR-generation saknas" };
      return {
        socket,
        ramType: ram,
        specs: [socket, ram, form].filter(Boolean),
        details: { Sockel: socket, Minne: ram, ...(form ? { Formfaktor: form } : {}) },
      };
    },
  },
  {
    key: "cpu",
    /*
     * En CPU-kylare heter "Arctic Liquid Freezer III Pro 360 - CPU
     * Vattenkylare" och fastnade här på ordet CPU. 1 256 kylare
     * klassades som processorer och föll sedan på att de saknade
     * sockel - de hamnade alltså i granskningslistan i stället för i
     * kylarkategorin där de hör hemma.
     */
    matches: (c, t) => {
      if (!/^cpu$|processor/i.test(c) && !/\bCPU\b/.test(t)) return false;
      /*
       * Parentesen tas bort före provet.
       *
       * En processor i retailkartong heter "AMD Ryzen 7 5800X3D CPU - 8
       * kärnor - AMD Boxed (med kylare)". Ett rakt kylarfilter kastade
       * därför ut 629 riktiga processorer - de levereras med kylare, de
       * är inte kylare. Det som står inom parentes beskriver förpackningen,
       * det som står utanför beskriver varan.
       */
      const withoutParens = t.replace(/\([^)]*\)/g, " ");
      return !/kylare|cooler|flaekt|fläkt|vattenkyl|luftkyl/i.test(withoutParens);
    },
    build: (row) => {
      const socket = statedSocket(row.title) || cpuSocket(row.title);
      if (!socket) return { reject: "sockel går inte att härleda ur modellnamnet" };
      if (!KNOWN_SOCKETS.includes(socket)) return { reject: `okänd sockel ${socket}` };
      const cores = row.title.match(/(\d+)\s*(?:kärnor|cores)/i);
      return {
        socket,
        specs: [socket, cores ? `${cores[1]} kärnor` : null].filter(Boolean),
        details: { Sockel: socket, ...(cores ? { Kärnor: cores[1] } : {}) },
      };
    },
  },
  {
    key: "gpu",
    matches: (c, t) => /grafikkort|graphics/i.test(c) || /grafikkort/i.test(t),
    build: (row) => {
      const chip = gpuChip(row.title);
      if (!chip) return { reject: "grafikkretsen går inte att läsa ut" };
      const vram = row.title.match(/(\d+)\s*GB\s*(GDDR\d)?/i);
      return {
        gpuModel: row.title,
        specs: [chip, vram ? `${vram[1]} GB` : null].filter(Boolean),
        details: { Krets: chip, ...(vram ? { Minne: `${vram[1]} GB` } : {}) },
      };
    },
  },
  {
    key: "ram",
    matches: (c, t) => /minne|ram\b|memory/i.test(c),
    build: (row) => {
      const ram = ramType(row.title);
      const size = capacityGb(row.title);
      const speed = row.title.match(/(\d{4,5})\s*MHz/i);
      if (!ram) return { reject: "DDR-generation saknas" };
      if (!size) return { reject: "storlek saknas" };
      return {
        ramType: ram,
        specs: [`${size} GB`, ram, speed ? `${speed[1]} MHz` : null].filter(Boolean),
        details: { Typ: ram, Storlek: `${size} GB`, ...(speed ? { Hastighet: `${speed[1]} MHz` } : {}) },
      };
    },
  },
  {
    key: "storage",
    matches: (c, t) => /ssd|hdd|lagring|hårddisk|storage/i.test(c),
    build: (row) => {
      const size = capacityGb(row.title);
      if (!size) return { reject: "kapacitet saknas" };
      const iface = /m\.?2|nvme/i.test(row.title) ? "NVMe" : /sata/i.test(row.title) ? "SATA" : null;
      const gen = row.title.match(/PCIe\s*(\d(?:\.\d)?)/i);
      return {
        specs: [size >= 1024 ? `${size / 1024} TB` : `${size} GB`, iface, gen ? `PCIe ${gen[1]}` : null].filter(Boolean),
        details: {
          Kapacitet: size >= 1024 ? `${size / 1024} TB` : `${size} GB`,
          ...(iface ? { Gränssnitt: iface } : {}),
          ...(gen ? { PCIe: gen[1] } : {}),
        },
      };
    },
  },
  {
    key: "psu",
    matches: (c, t) => /nätagg|natagg|power supply|psu|strömförsörjning/i.test(c),
    build: (row) => {
      const w = watts(row.title);
      if (!w) return { reject: "effekt saknas" };
      const cert = row.title.match(/80\s*PLUS\s*(\w+)/i);
      return {
        specs: [`${w} W`, cert ? `80 Plus ${cert[1]}` : null].filter(Boolean),
        details: { Effekt: `${w} W`, ...(cert ? { Certifiering: `80 Plus ${cert[1]}` } : {}) },
      };
    },
  },
  {
    key: "case",
    matches: (c, t) => /chassi|kabinett|case\b/i.test(c),
    build: (row) => {
      const form = formFactor(row.title);
      if (!form) return { reject: "formfaktor saknas" };
      return { specs: [form], details: { Formfaktor: form } };
    },
  },
  {
    key: "cooling",
    /* Titeln räknas också. Proshop lägger kylare under kategorier som
       "CPU flaektar" och "Kabinet koelere", och 1 028 av dem hamnade i
       högen "ingen kategori" när bara kategorinamnet provades. */
    matches: (c, t) =>
      /kylare|kylning|cooler|cooling|flaekt|fläkt/i.test(c) ||
      /(vatten|luft)kylare|cpu[\s-]*cooler|cpu[\s-]*fl(ä|ae)kt/i.test(t),
    build: (row) => {
      const aio = /vattenkyl|aio|liquid|water/i.test(row.title);
      const size = row.title.match(/\b(120|140|240|280|360|420)\b/);
      if (!aio && !size) return { reject: "kylartyp och storlek saknas" };
      return {
        specs: [aio ? "Vattenkylning" : "Luftkylning", size ? `${size[1]} mm` : null].filter(Boolean),
        details: { Typ: aio ? "Vattenkylning" : "Luftkylning", ...(size ? { Storlek: `${size[1]} mm` } : {}) },
      };
    },
  },
];

/* -------------------------------------------------------------- körning -- */

/* Namn som redan finns i katalogen. Samma produkt två gånger är värre än
   en produkt för lite - kunden ser två rader som ser identiska ut. */
const existing = new Set(
  CUSTOM_BUILD_CATALOG_ITEMS.map((i) => i.name.toLowerCase().replace(/[^a-z0-9]/g, "")),
);

const accepted = [];
const review = [];
const seen = new Set();
const counts = {};
const rejects = {};

const handleRow = (row) => {
  if (accepted.length + review.length >= LIMIT) return;

  const category = String(row.feed_category || "");
  const hit = CATEGORIES.find((c) => c.matches(category, row.title));
  if (!hit) {
    rejects["ingen kategori"] = (rejects["ingen kategori"] || 0) + 1;
    review.push({ title: row.title, category, reason: "ingen kategori", url: row.product_url });
    return;
  }

  const key = row.title.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (seen.has(key)) return;
  seen.add(key);
  if (existing.has(key)) {
    rejects["finns redan"] = (rejects["finns redan"] || 0) + 1;
    return;
  }

  const built = hit.build(row);
  if (built.reject) {
    const label = `${hit.key}: ${built.reject}`;
    rejects[label] = (rejects[label] || 0) + 1;
    review.push({ title: row.title, category: hit.key, reason: built.reject, url: row.product_url });
    return;
  }

  counts[hit.key] = (counts[hit.key] || 0) + 1;
  accepted.push({
    id: `feed-${hit.key}-${row.ean || key.slice(0, 16)}`,
    category: hit.key,
    name: row.title,
    brand: row.brand || "",
    price: Math.round(row.price_cents / 100),
    /* Bilden hotlänkas från butiken. Partner-ads villkor säger uttryckligen
       att den inte får sparas eller cachas lokalt - upphovsrätten ligger
       hos annonsören. */
    image: row.image_url || undefined,
    ean: row.ean || null,
    specs: built.specs,
    details: built.details,
    ...(built.socket ? { socket: built.socket } : {}),
    ...(built.ramType ? { ramType: built.ramType } : {}),
    ...(built.gpuModel ? { gpuModel: built.gpuModel } : {}),
  });
};

const config = {
  id: "proshop",
  label: "Proshop",
  network: "partner-ads",
  categoryFilter: COMPONENT_CATEGORY_FILTER,
};

let server = null;
if (FILE) {
  if (!existsSync(FILE)) throw new Error(`Hittar inte ${FILE}`);
  server = createServer((q, r) => {
    r.writeHead(200, { "content-type": "text/xml" });
    createReadStream(FILE).pipe(r);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  config.url = `http://127.0.0.1:${server.address().port}/feed.xml`;
} else {
  config.url = process.env.PRICING_FEED_PROSHOP_URL;
  if (!config.url) throw new Error("PRICING_FEED_PROSHOP_URL saknas. Kör med --file, eller sätt den i .env.");
}

const stats = await streamFeed(config, handleRow, { timeoutMs: 900000 });
if (server) server.close();

/* --------------------------------------------------------------- utdata -- */

const header = `/**
 * GENERERAD FIL - ÄNDRA INTE FÖR HAND.
 *
 * Skapad av scripts/import-feed-catalog.mjs ur Proshops produktflöde.
 * Kör om skriptet i stället för att redigera här.
 *
 * Bilderna är hotlänkade till butikens url med flit. Partner-ads villkor
 * säger att de inte får sparas eller cachas lokalt - upphovsrätten ligger
 * hos annonsören.
 *
 * Varje post har kommit genom en grind: konfiguratorn kan bara säga nej
 * till en omöjlig kombination om den vet sockel, DDR-generation och
 * formfaktor. Det som inte gick att läsa ut ligger i
 * data/feed-import-review.json i stället för att vara gissat.
 */

export const FEED_CATALOG_ITEMS = `;

writeFileSync(
  "src/data/customBuildFeedCatalog.generated.js",
  header + JSON.stringify(accepted, null, 2) + ";\n",
  "utf8",
);

writeFileSync(
  "data/feed-import-review.json",
  JSON.stringify({ generated: new Date().toISOString(), count: review.length, items: review }, null, 2),
  "utf8",
);

console.log(`\nflödet          : ${stats.total.toLocaleString("sv-SE")} produkter, ${stats.accepted.toLocaleString("sv-SE")} komponenter`);
console.log(`godkända        : ${accepted.length.toLocaleString("sv-SE")}`);
console.log(`till granskning : ${review.length.toLocaleString("sv-SE")}`);

console.log("\nper kategori:");
for (const [k, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(13)} ${n}`);
}

console.log("\nvanligaste skälen att en rad inte kom in:");
for (const [k, n] of Object.entries(rejects).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`  ${String(n).padStart(6)}  ${k}`);
}
