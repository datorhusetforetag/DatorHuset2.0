/**
 * Matchning mellan en rad i ett produktflöde och en katalogprodukt.
 *
 * Ordningen är avsiktlig: EAN och MPN är exakta och testas först. Faller vi
 * tillbaka på titelmatchning krävs att varje modell-token finns i titeln, och
 * att inget avvisande ord finns där. Det är den regeln som hindrar att
 * "RTX 5070" plockar hem ett "RTX 5070 Ti"-pris, vilket är det klassiska
 * felet i prisjämförelser.
 */

/** Ord i en flödestitel som betyder att raden inte är en lös komponent. */
const DEFAULT_REJECT_TOKENS = [
  "begagnad",
  "refurbished",
  "renoverad",
  "demo",
  "openbox",
  "open box",
  "retur",
  "bundle",
  "kit med",
  "paket med",
  "stationär",
  "stationar",
  "gaming pc",
  "desktop",
  "komplett dator",
  "prebuilt",
  "barebone",
  "speldator",
  "config pro",
  "gaming dator",
  "gamingdator",
  "datorpaket",
];

/**
 * Markörer för olika komponentklasser. En färdigbyggd dator räknar upp flera
 * av dem i samma titel ("R7 7800X3D / RX 9070XT / 32GB / 1TB"), medan en lös
 * komponent bara nämner sin egen klass.
 *
 * Det här behövs utöver ordlistan ovan: butikerna hittar hela tiden på nya
 * namn för sina byggen, men själva uppräkningen av delar avslöjar dem alltid.
 */
const COMPONENT_CLASS_PATTERNS = [
  /\b(?:ryzen|core\s*i[3579]|\bi[3579]-|r[357]\s+\d{4})/i, // CPU
  /\b(?:rtx|gtx|radeon\s+rx|\brx\s*\d{4})/i, // GPU
  /\b\d{1,3}\s*gb\s*(?:ddr|ram|minne)?\b/i, // RAM
  /\b\d{1,2}\s*tb\b|\b(?:ssd|nvme|hdd)\b/i, // Lagring
  /\bwin(?:dows)?\s*1[01]\b/i, // OS
];

/** Sant när titeln räknar upp flera komponentklasser, dvs. är ett bygge. */
const looksLikeFullBuild = (title) => {
  const hits = COMPONENT_CLASS_PATTERNS.filter((pattern) => pattern.test(title)).length;
  return hits >= 3;
};

/**
 * Kännetecken som avslöjar vilken sorts komponent en titel gäller.
 *
 * Behövs för att modellnummer krockar mellan kategorier: "Ryzen 5 5600" och
 * "DDR5 5600 MHz" delar token 5600, och "RTX 4070" krockar med chassin som
 * heter 4070. Utan den här spärren kan ett minneskit sättas som CPU-pris.
 */
const CATEGORY_SIGNATURES = {
  cpu: /\b(?:ryzen|core\s*i[3579]|threadripper|athlon|xeon|pentium|celeron)\b|\bprocessor\b/i,
  gpu: /\b(?:geforce|radeon|rtx|gtx|\brx\s*\d{3,4}|arc\s*a\d{3})\b|\bgrafikkort\b/i,
  motherboard: /\b(?:moderkort|motherboard|mainboard)\b|\b[abxzh]\d{3}[a-z]*\s*(?:m|e)?\b.*\b(?:wifi|gaming|aorus|tomahawk|eagle|elite|tuf|rog|msi|asus|gigabyte|asrock)\b/i,
  ram: /\b(?:ddr[345]|dimm|so-?dimm)\b|\bminne(?:skit)?\b|\d{4}\s*mhz\b/i,
  storage: /\b(?:ssd|nvme|m\.?2|hdd|hårddisk|hardisk|sata)\b/i,
  psu: /\b(?:nätaggregat|natagg|power supply|psu|atx\s*3|80\s*plus)\b/i,
  case: /\b(?:chassi|chassis|case|tower|kabinett)\b/i,
  cooling: /\b(?:kylare|cooler|aio|vattenkyl|luftkyl|fläkt|heatsink)\b/i,
};

/**
 * Sant om titeln tydligt tillhör en annan kategori än katalogprodukten.
 *
 * Bara ett tydligt krock avvisar: titeln måste matcha en annan kategori och
 * samtidigt inte matcha produktens egen. Butikstitlar är slarviga, och att
 * kräva att rätt kategori alltid syns skulle kosta fler träffar än det räddar.
 */
const conflictsWithCategory = (itemCategory, title) => {
  const own = CATEGORY_SIGNATURES[itemCategory];
  if (!own) return false;
  if (own.test(title)) return false;

  for (const [category, pattern] of Object.entries(CATEGORY_SIGNATURES)) {
    if (category === itemCategory) continue;
    if (pattern.test(title)) return category;
  }
  return false;
};

/**
 * Ord som ändrar vilken produkt det är, trots att de är korta.
 *
 * De här måste stå med explicit, för extractModelTokens kastar annars bort
 * allt under fyra tecken som brus. Utan dem blir "Pure Rock 3" och "Pure
 * Rock Pro 3 LX" samma sak, och då hamnar en enda EAN på tre olika
 * katalogprodukter - vilket är precis vad som hände vid första körningen.
 */
const SIGNIFICANT_SUFFIXES = [
  // Processorer och grafikkort
  "ti",
  "super",
  "xt",
  "xtx",
  "x3d",
  "ks",
  "kf",
  "k",
  "f",
  "ge",
  "g",
  "hx",
  "eco",
  // Modellvarianter hos kylare, chassin och nätaggregat
  "pro",
  "se",
  "lx",
  "max",
  "plus",
  "elite",
  "argb",
  "digital",
  // Färg säljs som egen artikel hos bl.a. be quiet! och Noctua
  "black",
  "white",
];

/**
 * Kortar ned ett katalognamn till något en butiks sökruta klarar.
 *
 * Katalogen skriver ut hela specifikationen - "G.Skill Trident Z5 Neo RGB
 * 32GB (2x16GB) DDR5 6400MHz CL32". Skickas det rakt in i en sökruta blir
 * svaret noll träffar, vilket såg ut som att matchningen missade när det
 * i själva verket var sökningen som aldrig gav något att matcha mot.
 *
 * Kvar blir tillverkare, produktnamn och de tal som identifierar varianten.
 * Själva matchningen sker ändå mot hela namnet efteråt, så en bredare
 * sökning gör inte träffarna lösare - den ger bara matchningen något att
 * arbeta med.
 */
export const buildSearchQuery = (name) => {
  let text = String(name ?? "");

  // "(2x16GB)" och liknande upprepar bara det som redan står i namnet.
  text = text.replace(/\([^)]*\)/g, " ");
  // Latenstider, XMP/EXPO-profiler och liknande hjälper aldrig en sökruta.
  text = text.replace(/\bCL\d+\b/gi, " ");
  text = text.replace(/\b(?:AMD\s+)?EXPO\b/gi, " ");
  text = text.replace(/\bIntel\s+XMP(?:\s+[\d.]+)?\b/gi, " ");
  text = text.replace(/\s+/g, " ").trim();

  const words = text.split(" ").filter(Boolean);
  // Sex ord räcker för tillverkare, serie och variant. Fler ord gör bara
  // sökningen snävare än butikens egen produkttitel.
  return words.slice(0, 6).join(" ");
};

export const normalizeText = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Bara siffror - EAN/GTIN jämförs aldrig med bindestreck eller mellanslag. */
export const normalizeEan = (value) => {
  const digits = String(value ?? "").replace(/\D+/g, "");
  // Giltiga GTIN-längder. Kortare är skräp, längre är oftast ett internt id.
  if (![8, 12, 13, 14].includes(digits.length)) return null;
  // GTIN-14/UPC-12 padd­as till 13 så att samma vara jämförs lika.
  if (digits.length === 14 && digits.startsWith("0")) return digits.slice(1);
  if (digits.length === 12) return `0${digits}`;
  return digits;
};

export const normalizeMpn = (value) => {
  const cleaned = String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
  return cleaned.length >= 4 ? cleaned : null;
};

/**
 * Plockar ut de ord ur ett produktnamn som faktiskt identifierar modellen.
 * Tillverkarnamn och marknadsföringsord sållas bort; siffergrupper och
 * betydelsebärande suffix behålls.
 */
export const extractModelTokens = (name) => {
  const normalized = normalizeText(name);
  if (!normalized) return [];

  const noise = new Set([
    "amd",
    "intel",
    "nvidia",
    "geforce",
    "radeon",
    "ryzen",
    "core",
    "processor",
    "cpu",
    "gpu",
    "grafikkort",
    "moderkort",
    "minne",
    "ram",
    "gaming",
    "oc",
    "edition",
    "med",
    "och",
    "for",
    "till",
    "ny",
    "the",
  ]);

  const tokens = [];
  for (const word of normalized.split(" ")) {
    if (!word) continue;
    if (noise.has(word)) continue;
    // Behåll allt som innehåller en siffra - det är nästan alltid modellen.
    if (/\d/.test(word)) {
      tokens.push(word);
      continue;
    }
    if (SIGNIFICANT_SUFFIXES.includes(word)) {
      tokens.push(word);
      continue;
    }
    // Korta bokstavsord utan siffror bär sällan identitet.
    if (word.length >= 4) tokens.push(word);
  }

  const unique = Array.from(new Set(tokens));

  // "Ryzen 7 7800X3D" ger token 7 och 7800x3d. Ensiffriga token är serienamn
  // ("Ryzen 7", "Core i5"), inte modellen, och butikerna skriver dem hur som
  // helst - "R7", "Ryzen7", eller inte alls. Kräver vi dem missar vi rätt
  // produkt. Släpp dem så snart det finns en riktig modell-token.
  const hasRealModelToken = unique.some((token) => token.length >= 3 && /\d/.test(token));
  return hasRealModelToken ? unique.filter((token) => !/^\d$/.test(token)) : unique;
};

/**
 * Sant om titeln innehåller ett betydelsebärande suffix som modellen saknar.
 * "RTX 5070" får inte matcha "RTX 5070 Ti", men "RTX 5070 Ti" får matcha
 * "RTX 5070 Ti OC" - extra marknadsföringsord spelar ingen roll.
 */
const hasExtraSignificantSuffix = (titleTokens, modelTokens) => {
  const modelSet = new Set(modelTokens);
  return titleTokens.some(
    (token) => SIGNIFICANT_SUFFIXES.includes(token) && !modelSet.has(token),
  );
};

/**
 * Poängsätter en flödesrad mot en katalogprodukt.
 * Returnerar { matched, method, score, reason }.
 */
export const matchOffer = (identity, item, row) => {
  const rowEan = normalizeEan(row.ean);
  const rowMpn = normalizeMpn(row.mpn);

  // 1. EAN - exakt, högsta tilltro.
  const identityEan = normalizeEan(identity?.ean);
  if (identityEan && rowEan && identityEan === rowEan) {
    return { matched: true, method: "ean", score: 1, reason: "ean" };
  }

  // 2. MPN - exakt, men tillverkare återanvänder ibland nummer mellan varianter.
  const identityMpn = normalizeMpn(identity?.mpn);
  if (identityMpn && rowMpn && identityMpn === rowMpn) {
    return { matched: true, method: "mpn", score: 0.95, reason: "mpn" };
  }

  // Har vi en identitet med EAN men raden saknar det, är titelmatchning
  // fortfarande tillåten - men bara om alla modell-token finns.
  const title = normalizeText(row.title);
  if (!title) {
    return { matched: false, method: "token", score: 0, reason: "tom_titel" };
  }

  const rejectTokens =
    identity?.reject_tokens?.length > 0 ? identity.reject_tokens : DEFAULT_REJECT_TOKENS;
  const rejected = rejectTokens.find((token) => title.includes(normalizeText(token)));
  if (rejected) {
    return { matched: false, method: "token", score: 0, reason: `avvisad:${rejected}` };
  }

  // Kollas mot råtiteln, inte den normaliserade - mönstren bygger på
  // bindestreck och snedstreck som normaliseringen tar bort.
  const rawTitle = String(row.title ?? "");
  if (looksLikeFullBuild(rawTitle)) {
    return { matched: false, method: "token", score: 0, reason: "fardigbyggd" };
  }

  const categoryConflict = conflictsWithCategory(item?.category, rawTitle);
  if (categoryConflict) {
    return {
      matched: false,
      method: "token",
      score: 0,
      reason: `fel_kategori:${categoryConflict}`,
    };
  }

  const modelTokens =
    identity?.match_tokens?.length > 0
      ? identity.match_tokens.map(normalizeText).filter(Boolean)
      : extractModelTokens(item?.name);

  if (modelTokens.length === 0) {
    return { matched: false, method: "token", score: 0, reason: "inga_token" };
  }

  const titleTokens = title.split(" ").filter(Boolean);
  const titleTokenSet = new Set(titleTokens);

  // Varje modell-token måste finnas. Siffergrupper kräver exakt token-träff så
  // att "5070" inte matchar "50700"; rena ord får matcha som delsträng.
  const missing = modelTokens.filter((token) => {
    if (/\d/.test(token)) return !titleTokenSet.has(token);
    return !title.includes(token);
  });

  if (missing.length > 0) {
    return {
      matched: false,
      method: "token",
      score: 0,
      reason: `saknar:${missing.join(",")}`,
    };
  }

  if (hasExtraSignificantSuffix(titleTokens, modelTokens)) {
    return {
      matched: false,
      method: "token",
      score: 0,
      reason: "annan_variant",
    };
  }

  // Ju mindre överskott i titeln, desto troligare rätt produkt.
  const score = Math.min(0.9, modelTokens.length / Math.max(titleTokens.length, 1) + 0.3);
  return { matched: true, method: "token", score, reason: "token" };
};

/**
 * Väljer bästa raden per butik ur en lista kandidater.
 * Lägsta totalpris vinner; vid lika pris vinner högre matchningspoäng.
 */
export const pickBestPerStore = (candidates) => {
  const byStore = new Map();
  for (const candidate of candidates) {
    if (!candidate?.store_id) continue;
    const current = byStore.get(candidate.store_id);
    if (!current) {
      byStore.set(candidate.store_id, candidate);
      continue;
    }
    const currentTotal = current.total_cents ?? current.price_cents ?? Infinity;
    const nextTotal = candidate.total_cents ?? candidate.price_cents ?? Infinity;
    if (nextTotal < currentTotal) {
      byStore.set(candidate.store_id, candidate);
    } else if (nextTotal === currentTotal && (candidate.match_score ?? 0) > (current.match_score ?? 0)) {
      byStore.set(candidate.store_id, candidate);
    }
  }
  return Array.from(byStore.values());
};

export { DEFAULT_REJECT_TOKENS };
