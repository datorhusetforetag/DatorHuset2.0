/**
 * Granskar den genererade katalogen och letar efter sådant som inte är
 * den komponent det utger sig för att vara.
 *
 *   node scripts/feed-audit.mjs
 *   node scripts/feed-audit.mjs --category psu --sample 30
 *
 * Importen litar på butikens kategorinamn. Det är rätt utgångspunkt men
 * inte ofelbart - butiken lägger kylpasta under "CPU flaektar" och
 * solpaneler under "Stroemfoersoerjning". Det här skriptet provar tre
 * saker som brukar avslöja en felplacerad rad:
 *
 *   1. Saknar titeln det ord butiken brukar sätta på varutypen?
 *   2. Ligger priset orimligt för kategorin?
 *   3. Finns ord i titeln som hör till en annan varugrupp?
 *
 * Skriptet dömer ingenting. Det pekar på rader som bör läsas.
 */

import { FEED_CATALOG_ITEMS } from "../src/data/customBuildFeedCatalog.generated.js";

const args = process.argv.slice(2);
const flagValue = (name) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 ? args[index + 1] : null;
};
const ONLY = flagValue("category");
const SAMPLE = Number(flagValue("sample")) || 12;

/*
 * Vad en rad i varje kategori ska se ut som.
 *
 * "marker" är det ord Proshop sätter på varutypen. Saknas det är raden
 * värd att titta på. "sane" är det prisintervall där varan rimligen
 * ligger; utanför det är den antingen felplacerad eller extrem.
 */
const EXPECTED = {
  cpu: {
    marker: /\bCPU\b|processor/i,
    sane: [400, 60000],
    foreign: /\bPC\b|barebone|rack|k(?:y|oe)lare|monteringsf|moderkort|bundle/i,
  },
  gpu: {
    marker: /grafikkort|graphics card/i,
    sane: [500, 120000],
    foreign: /backplate|bracket|riser|st(?:ö|oe)d|holder|cable|kabel|vattenblock|waterblock/i,
  },
  motherboard: {
    marker: /moderkort|motherboard/i,
    sane: [500, 40000],
    foreign: /\bPC\b|barebone|controller|arduino|raspberry/i,
  },
  ram: {
    marker: /DDR[45]/i,
    sane: [150, 60000],
    foreign: /so.?dimm|sodimm|laptop|b(?:ä|ae)rbar|ecc reg|rdimm|server/i,
  },
  storage: {
    marker: /\bSSD\b|h(?:å|ae)rddisk|\bHDD\b|\bNVMe\b|\bM\.2\b/i,
    sane: [150, 80000],
    foreign: /adapter|kabinett|enclosure|docking|extern|portable|kylare|heatsink|\bmag\b/i,
  },
  psu: {
    marker: /str(?:ö|oe)mf(?:ö|oe)rs(?:ö|oe)rjning|power supply/i,
    sane: [300, 25000],
    foreign: /inverter|charger|laddare|solar|batteri|battery|splitter|\bpoe\b|\bups\b|adapter/i,
  },
  case: {
    marker: /\bchassi\b|computer case/i,
    sane: [200, 30000],
    foreign: /rack|server|\b\d+U\b|panel kit|sidopanel|side panel|fot|bracket/i,
  },
  cooling: {
    marker: /CPU\s+(?:Luft|Vatten)kylare/i,
    sane: [80, 20000],
    foreign: /kylpasta|thermal (?:paste|compound|grease)|monteringsf(?:ä|ae)st|mounting|backplate|controller|hub/i,
  },
};

const problems = new Map();
const note = (category, label, item) => {
  const key = `${category}: ${label}`;
  const list = problems.get(key) || [];
  list.push(item);
  problems.set(key, list);
};

for (const item of FEED_CATALOG_ITEMS) {
  if (ONLY && item.category !== ONLY) continue;
  const rules = EXPECTED[item.category];
  if (!rules) {
    note(item.category, "okänd kategori i granskningsreglerna", item);
    continue;
  }
  if (!rules.marker.test(item.name)) note(item.category, "titeln saknar varutypen", item);
  /* Parentesen bort först. "AMD Boxed (utan kylare)" beskriver kartongen,
     inte varan, och fick 255 riktiga processorer att se ut som kylare. */
  if (rules.foreign.test(item.name.replace(/\([^)]*\)/g, " "))) {
    note(item.category, "titeln innehåller ord från en annan varugrupp", item);
  }
  if (item.price < rules.sane[0]) note(item.category, `pris under ${rules.sane[0]} kr`, item);
  if (item.price > rules.sane[1]) note(item.category, `pris över ${rules.sane[1]} kr`, item);
  if (!item.image) note(item.category, "ingen bild", item);
  if (!item.price || !Number.isFinite(item.price)) note(item.category, "pris saknas", item);
}

const total = FEED_CATALOG_ITEMS.filter((item) => !ONLY || item.category === ONLY).length;
console.log(`${total.toLocaleString("sv-SE")} poster granskade\n`);

if (problems.size === 0) {
  console.log("inget att anmärka på");
} else {
  for (const [label, list] of [...problems].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n=== ${label} (${list.length}) ===`);
    list.slice(0, SAMPLE).forEach((item) => console.log(`  ${String(item.price).padStart(6)} kr  ${item.name.slice(0, 105)}`));
    if (list.length > SAMPLE) console.log(`  ... och ${list.length - SAMPLE} till`);
  }
}
