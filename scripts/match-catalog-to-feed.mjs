/**
 * Ger katalogposterna en EAN genom att leta upp dem i flödet.
 *
 *   node scripts/match-catalog-to-feed.mjs --file flode.xml
 *   node scripts/match-catalog-to-feed.mjs --file flode.xml --out rapport.json
 *   node scripts/match-catalog-to-feed.mjs --file flode.xml --write
 *
 * VARFÖR
 *
 * Konfiguratorns 455 handplockade komponenter saknar både EAN och
 * artikelnummer. Prisjakten har därför inget att känna igen dem på och
 * hittar ingen butik, och konfiguratorn skriver "N/A" i prisrutan i
 * stället för ett pris. 221 av de 455 ser ut så för kunden.
 *
 * Flödet har 36 406 EAN-nummer. Produkterna finns alltså, de är bara
 * inte ihopkopplade. Det här skriptet kopplar ihop dem på namnet och
 * skriver in EAN i katalogfilen, varefter den vanliga prismatchningen
 * hittar dem av sig själv.
 *
 * HUR NAMNEN JÄMFÖRS, OCH VARFÖR INTE ENKLARE
 *
 * Första försöket krävde att katalognamnet var en inledning på titeln.
 * Det gav 229 träffar av 455 och missade allt där butiken skriver orden
 * i en annan ordning:
 *
 *   katalogen  ASUS Dual GeForce RTX 5060 8GB OC
 *   flödet     ASUS GeForce RTX 5060 Dual OC - 8GB GDDR7 RAM - Grafikkort
 *
 * Att i stället kräva att katalogens ord ryms i titeln vore farligt åt
 * andra hållet:
 *
 *   katalogen  MSI MAG B550 Tomahawk
 *   flödet     MSI MAG B550 TOMAHAWK MAX WIFI Moderkort - ...
 *
 * Alla fyra orden ryms, men det är ett annat och dyrare moderkort. En
 * felaktig koppling är värre än ingen koppling: kunden får fel pris och
 * en länk till fel produkt.
 *
 * Därför jämförs ORDMÄNGDERNA och de ska vara LIKA. Extra ord på någon
 * av sidorna fäller matchningen, utom de ord som bara beskriver varan i
 * stället för att namnge den - varutyp, storlek, färg, förpackning. Den
 * listan står i NOISE nedan och är medvetet kort. Ett ord som kan ingå i
 * ett modellnamn hör inte hemma där; "Dual" och "Max" är modellnamn.
 *
 * Titeln kapas dessutom vid första " - ". Proshop lägger varunamnet
 * först och specifikationerna efter, så det är namnet som jämförs.
 */

import { createReadStream, existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";

import { streamFeed } from "../server/pricing/sources/feed.mjs";
import { CUSTOM_BUILD_CATALOG_ITEMS } from "../src/data/customBuildCatalog.js";

const args = process.argv.slice(2);
const flagValue = (name) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 ? args[index + 1] : null;
};

const FILE = flagValue("file");
const OUT = flagValue("out");
const WRITE = args.includes("--write");
const CATALOG = "src/data/customBuildCatalog.js";

if (!FILE || !existsSync(FILE)) throw new Error("Ange --file med en nedladdad flödesfil.");

/*
 * Ord som säger vilken sorts vara det är, inte vilken vara.
 *
 * Bara varutyp och förpackning. Butiken avslutar titeln med varutypen
 * ("... Moderkort", "... - CPU Vattenkylare") medan katalogen skriver
 * bara modellnamnet, så utan den här listan skulle varje moderkort ha
 * ett ord för mycket och aldrig matcha.
 *
 * Färger står INTE här. De skiljer faktiskt två varor åt, och regel 2
 * nedan hittar dem ändå i specifikationsdelen av titeln.
 */
const NOISE = new Set([
  "moderkort", "motherboard", "cpu", "processor", "grafikkort", "graphics", "card",
  "chassi", "case", "kylare", "luftkylare", "vattenkylare", "cooler", "ssd", "hårddisk",
  "hdd", "ram", "minne", "memory", "strömförsörjning", "psu",
  "boxed", "bulk", "tray", "retail", "box", "oem",
  "och", "med", "utan", "and", "with", "för", "for",
]);

/*
 * MÅTT JÄMFÖRS SOM MÅTT, INTE SOM ORD.
 *
 * Första försöket skalade bort enheten och lät siffran vara ett ord
 * bland andra. Det gav den här matchningen:
 *
 *   katalogen  Samsung 990 Pro 2TB
 *   flödet     Samsung 990 Pro SSD - 1TB - Utan värmespridare - M.2 2280
 *
 * Tvåan ur "2TB" återfanns i "M.2" och provet gick igenom. Kunden hade
 * fått en enterabyte-disk till tvåterabytes-postens pris, med länk till
 * fel vara. Samma sak drabbade "Samsung 990 EVO Plus 4TB", som matchade
 * en 1TB för att det stod "PCIe 4.0" i titeln.
 *
 * Storlek, hastighet och effekt läses därför ut var för sig och jämförs
 * som tal. Skiljer de sig är det inte samma vara, punkt. Talen plockas
 * samtidigt bort ur ordmängden så att de inte kan råka matcha något
 * annat.
 */
const measurements = (value) => {
  const text = String(value || "").replace(/&amp;/g, "&");
  const tb = text.match(/(\d+(?:[.,]\d+)?)\s*TB\b/i);
  const gb = text.match(/(\d+)\s*GB\b/i);
  const ddr = text.match(/DDR\d-(\d{3,5})/i);
  const mhz = text.match(/(\d{3,5})\s*MHz/i);
  const watt = text.match(/(\d{3,4})\s*(?:Watt|W)\b/i);
  return {
    gb: tb ? Math.round(Number(tb[1].replace(",", ".")) * 1024) : gb ? Number(gb[1]) : null,
    mhz: ddr ? Number(ddr[1]) : mhz ? Number(mhz[1]) : null,
    watt: watt ? Number(watt[1]) : null,
  };
};

/**
 * Stämmer måtten överens?
 *
 * Ett mått som katalogen anger måste butiken också ange, och med samma
 * tal. Saknas det hos butiken går det inte att verifiera, och då är
 * svaret nej - att gissa är just det som gick fel förut.
 */
const sameMeasurements = (a, b) => {
  for (const key of ["gb", "mhz", "watt"]) {
    if (a[key] === null) continue;
    if (b[key] !== a[key]) return false;
  }
  return true;
};

/*
 * "2x16GB" är en skrivning, inte ett modellnamn.
 *
 * Katalogen skriver "Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz" och
 * butiken samma sats som "DDR5-6000 - 32GB - Dual Channel (2 pcs)".
 * Samma besked, olika notation, och ordet 2x16gb finns ingenstans i
 * butikens titel. Totalen står redan som eget ord i båda, så
 * uppdelningen kan släppas utan att något går förlorat.
 *
 * 18 av de 19 minnena i katalogen föll enbart på det här.
 */
const isKitNotation = (token) => /^\d+x\d+(?:gb|tb|mb)?$/.test(token);

/** Ett ord som bara är ett mått. Talet har redan fångats ovan. */
const isMeasurementToken = (token) =>
  /^\d+(?:gb|tb|mb|kb|mhz|ghz|w|watt|mm|cm|tum|dba|pcs)$/.test(token);

/** Titeln som en mängd ord, utan varutyp och utan enheter. */
const significantTokens = (value) => {
  const cleaned = String(value || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    /* DDR5-6000: talet är hastigheten och fångas av measurements(). */
    .replace(/ddr(\d)-\d{3,5}/g, "ddr$1")
    .replace(/[^a-z0-9åäöé]+/g, " ")
    .trim();
  const tokens = cleaned.split(" ").filter(Boolean);
  return new Set(
    tokens.filter(
      (token) => !NOISE.has(token) && !isKitNotation(token) && !isMeasurementToken(token),
    ),
  );
};

/*
 * Varunamnet, alltså titeln fram till första specifikationen.
 *
 * Tre snitt behövs, inte ett:
 *
 *   " - "   Proshops vanliga skiljetecken mellan namn och specifikation.
 *   " / "   processorerna får en extra frekvens instoppad i namnet:
 *           "Intel Core i5 14600K / 3.5 GHz processor - OEM CPU - ..."
 *           Utan snittet blir 3, 5 och ghz extra ord som fäller regel 1.
 *   ( )     parentesen beskriver förpackningen, inte varan:
 *           "AMD Ryzen 7 5800X3D (10th Anniversary Edition)".
 *           Samma resonemang som i importens kylarfilter.
 *
 * Parentesen tas bort ur katalognamnet också, av samma skäl.
 */
const productNamePart = (title) =>
  String(title || "")
    .replace(/\([^)]*\)/g, " ")
    .split(" - ")[0]
    .split(" / ")[0];

/*
 * Två prov, och båda ska gå igenom.
 *
 * REGEL 1, säkerheten: varje ord i butikens VARUNAMN ska finnas i
 * katalognamnet. Ett extra ord i butikens namn betyder en annan modell.
 * Det är den här regeln som håller isär
 *
 *   katalogen  MSI MAG B550 Tomahawk
 *   flödet     MSI MAG B550 TOMAHAWK MAX WIFI Moderkort
 *
 * där "max" och "wifi" saknas i katalogen.
 *
 * REGEL 2, fullständigheten: varje ord i katalognamnet ska finnas
 * någonstans i HELA titeln, specifikationerna inräknade. Det är den här
 * regeln som ändå släpper igenom
 *
 *   katalogen  ASUS Dual GeForce RTX 5060 8GB OC
 *   flödet     ASUS GeForce RTX 5060 Dual OC - 8GB GDDR7 RAM - Grafikkort
 *
 * där 8GB står i specifikationsdelen i stället för i namnet.
 */
const matches = (catalogTokens, feedNameTokens, feedAllTokens) => {
  const extraInFeed = [...feedNameTokens].filter((token) => !catalogTokens.has(token));
  const missingInFeed = [...catalogTokens].filter((token) => !feedAllTokens.has(token));
  return { ok: extraInFeed.length === 0 && missingInFeed.length === 0, extraInFeed, missingInFeed };
};

/** Hur nära en kandidat var, till diagnosen. Lägre är närmare. */
const distance = (result) => result.extraInFeed.length + result.missingInFeed.length;

const FEED_CATEGORY_MAP = new Map([
  ["cpu", "cpu"],
  ["grafikkort", "gpu"],
  ["moderkort", "motherboard"],
  ["ram", "ram"],
  ["ssd", "storage"],
  ["haarddisk", "storage"],
  ["chassi", "case"],
  ["stroemfoersoerjning", "psu"],
  ["cpu flaektar", "cooling"],
]);

const wanted = CUSTOM_BUILD_CATALOG_ITEMS.map((item) => ({
  id: item.id,
  category: item.category,
  name: item.name,
  tokens: significantTokens(item.name.replace(/\([^)]*\)/g, " ")),
  measures: measurements(item.name),
  hasEan: Boolean(item.ean),
}));

const byCategory = new Map();
for (const item of wanted) {
  byCategory.set(item.category, [...(byCategory.get(item.category) || []), item]);
}

const hits = new Map();
const nearest = new Map();

const server = createServer((request, response) => {
  response.writeHead(200, { "content-type": "text/xml" });
  createReadStream(FILE).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

await streamFeed(
  {
    id: "proshop",
    label: "Proshop",
    network: "partner-ads",
    url: `http://127.0.0.1:${server.address().port}/feed.xml`,
    categoryFilter: null,
  },
  (row) => {
    const category = FEED_CATEGORY_MAP.get(String(row.feed_category || "").trim().toLowerCase());
    if (!category || !row.ean) return;

    const feedNameTokens = significantTokens(productNamePart(row.title));
    if (feedNameTokens.size === 0) return;
    const feedAllTokens = significantTokens(row.title);
    const feedMeasures = measurements(row.title);

    for (const item of byCategory.get(category) || []) {
      if (!sameMeasurements(item.measures, feedMeasures)) continue;
      const result = matches(item.tokens, feedNameTokens, feedAllTokens);
      if (result.ok) {
        hits.set(item.id, [
          ...(hits.get(item.id) || []),
          { ean: row.ean, title: row.title, price: Math.round((row.price_cents || 0) / 100) },
        ]);
        continue;
      }
      /* Spara den närmaste kandidaten, så att missarna går att förklara. */
      const previous = nearest.get(item.id);
      if (!previous || distance(result) < previous.distance) {
        nearest.set(item.id, { title: row.title, distance: distance(result), ...result });
      }
    }
  },
  { timeoutMs: 1800000 },
);
server.close();

/* Billigaste träffen vinner: samma modell säljs i flera förpackningar. */
const resolved = new Map();
for (const [id, list] of hits) {
  const priced = list.filter((row) => row.price > 0);
  const best = (priced.length ? priced : list).sort((a, b) => a.price - b.price)[0];
  resolved.set(id, { ...best, candidates: list.length });
}

const missing = wanted.filter((item) => !resolved.has(item.id));

console.log(`${wanted.length} katalogposter\n`);
console.log(`  hittade i flödet : ${resolved.size}`);
console.log(`  hittades inte    : ${missing.length}\n`);

const perCategory = new Map();
for (const item of wanted) {
  const row = perCategory.get(item.category) || { total: 0, found: 0 };
  row.total += 1;
  if (resolved.has(item.id)) row.found += 1;
  perCategory.set(item.category, row);
}
for (const [category, row] of [...perCategory].sort((a, b) => b[1].total - a[1].total)) {
  console.log(`  ${category.padEnd(13)} ${String(row.found).padStart(4)} / ${row.total}`);
}

/* Varför missarna missade. Utan den här listan blir nästa justering
   av reglerna en gissning i stället för en rättelse. */
if (args.includes("--explain")) {
  const perCategoryLimit = Number(flagValue("explain-sample")) || 6;
  console.log("\n=== närmaste kandidat för missarna ===");
  const shown = new Map();
  for (const item of missing) {
    const near = nearest.get(item.id);
    if (!near) continue;
    const count = shown.get(item.category) || 0;
    if (count >= perCategoryLimit) continue;
    shown.set(item.category, count + 1);
    console.log(`\n  [${item.category}] ${item.name}`);
    console.log(`    flödet: ${near.title.slice(0, 92)}`);
    if (near.extraInFeed.length) console.log(`    butiken har extra   : ${near.extraInFeed.join(", ")}`);
    if (near.missingInFeed.length) console.log(`    katalogen har extra : ${near.missingInFeed.join(", ")}`);
  }
}

if (OUT) {
  const byId = new Map(wanted.map((item) => [item.id, item]));
  writeFileSync(
    OUT,
    JSON.stringify(
      {
        matched: [...resolved].map(([id, row]) => ({ id, name: byId.get(id).name, ...row })),
        missing: missing.map((item) => ({ id: item.id, category: item.category, name: item.name })),
      },
      null,
      1,
    ),
    "utf8",
  );
  console.log(`\nskrev ${OUT}`);
}

if (WRITE) {
  /*
   * Egen fil, inte en ändring i katalogen.
   *
   * customBuildCatalog.js är handskriven och bygger posterna med
   * hjälpfunktioner i stället för att räkna upp dem som data. Att klippa
   * in rader i den hade fungerat en gång och gått sönder nästa. Den här
   * filen går att skriva om när som helst utan att röra något handskrivet.
   */
  const byId = new Map(wanted.map((item) => [item.id, item]));
  const rows = [...resolved]
    .sort((a, b) => a[0].localeCompare(b[0], "sv"))
    .map(([id, row]) => `  /* ${byId.get(id).name} */\n  "${id}": "${row.ean}",`)
    .join("\n");

  const header = `/**
 * GENERERAD FIL - ÄNDRA INTE FÖR HAND.
 *
 * Skapad av scripts/match-catalog-to-feed.mjs.
 *
 * EAN-nummer till de handplockade katalogposterna, hämtade ur Proshops
 * flöde genom att jämföra namnen. Utan dem har prismatchningen inget att
 * känna igen posten på, hittar ingen butik, och konfiguratorn skriver
 * "Ingen butik" i stället för ett pris från en riktig handlare.
 *
 * Kommentaren över varje rad är katalogens namn på posten, så att en
 * felaktig koppling går att se utan att slå upp id:t.
 */

export const CATALOG_EAN_BY_ID = {
${rows}
};
`;

  writeFileSync("src/data/customBuildCatalogEans.generated.js", header, "utf8");
  console.log(`\nskrev ${resolved.size} EAN-nummer till src/data/customBuildCatalogEans.generated.js`);
} else {
  console.log("\n(kör med --write för att skriva EAN-filen)");
}
