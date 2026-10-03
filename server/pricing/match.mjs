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
  cpu: /\b(?:ryzen|core\s*i[3579]|core\s*ultra|threadripper|athlon|epyc|xeon|pentium|celeron)\b|\bprocessor\b/i,
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
/*
 * Processorer och grafikkort måste dessutom säga vad de är.
 *
 * Deras butikstitlar nämner alltid Ryzen, Core, GeForce, Radeon eller
 * liknande, så kravet kostar inga riktiga träffar. Utan det matchade
 * "AMD Ryzen 3 3100" ett rackmonteringskit "for Check Point
 * 3100/3200/3600": den enda modelltoken var 3100, och ett rackkit liknar
 * ingen annan kategori heller, så krockspärren nedan sa inget.
 */
const REQUIRE_OWN_SIGNATURE = new Set(["cpu", "gpu"]);

const conflictsWithCategory = (itemCategory, title) => {
  const own = CATEGORY_SIGNATURES[itemCategory];
  if (!own) return false;
  if (own.test(title)) return false;

  for (const [category, pattern] of Object.entries(CATEGORY_SIGNATURES)) {
    if (category === itemCategory) continue;
    if (pattern.test(title)) return category;
  }

  /* Tillverkaren räcker när ingen annan kategori gör anspråk på titeln:
     "AMD R7 7800X3D Boxed" är en processor. */
  if (REQUIRE_OWN_SIGNATURE.has(itemCategory) && !/\b(?:amd|intel|nvidia|r[3579])\b/i.test(title)) {
    return "saknar_kategoriord";
  }
  return false;
};

/*
 * Butikens egen kategori, när källan anger en.
 *
 * Webhallens sök-API skickar med var varan ligger i sortimentet. En
 * sökning på "RTX 5070" ger lika många laptops och färdigbyggda datorer
 * som grafikkort, och fyndvaror ligger i ett eget träd. Butikens egen
 * placering är säkrare än något vi kan läsa ut ur titeln.
 *
 * SODIMM är laptopminne och passar inte i ett stationärt moderkort.
 */
const STORE_CATEGORY_PATHS = {
  cpu: /\/Processor CPU/i,
  gpu: /\/Grafikkort/i,
  ram: /\/RAM-minne\/(?!SODIMM)/i,
  storage: /\/Lagring\//i,
  motherboard: /\/Moderkort/i,
  psu: /\/Nätaggregat/i,
  case: /\/Chassi(?:\/|$)/i,
  cooling: /\/Kylning\/(?:Processorkylare|Vattenkylning)/i,
  chassifan: /\/Chassifläkt/i,
  networkcard: /Nätverkskort/i,
};

const storeCategoryMismatch = (itemCategory, path) => {
  if (!path) return null;
  if (/^Fyndvaror/i.test(path)) return "fyndvara";
  const expected = STORE_CATEGORY_PATHS[itemCategory];
  if (expected && !expected.test(path)) return "fel_butikskategori";
  return null;
};

/*
 * Minnesvarianter och färg.
 *
 * Proshop säljer "Kingston FURY Beast RGB DDR5-6000 - 32GB" i CL30 och
 * CL36, som ett kit med två stickor och som en ensam, i svart och i vitt -
 * åtta varor med åtta priser och samma modellnamn. Webhallen skriver
 * samma sak som "32GB (2x16GB) / 6000 Mhz / DDR5 / CL36". Utan de här
 * kontrollerna fick alla åtta Webhallens pris för en av dem.
 *
 * Latens och kit jämförs bara när båda sidor anger dem; saknas uppgiften
 * i ena titeln finns inget att säga emot. Färgen jämförs alltid: en vit
 * vara är en egen artikel, och en titel utan färg är den svarta.
 */
const WHITE_WORDS = /\b(?:vit|white|snow|wh)\b/;

const kitTokenFromName = (rawName) => {
  const text = String(rawName ?? "");
  const explicit = text.match(/\b(\d+)\s*x\s*(\d+)\s*GB\b/i);
  if (explicit) return `${explicit[1]}x${explicit[2]}gb`;
  const total = text.match(/\b(\d+)\s*GB\b/i);
  const pieces = text.match(/\((\d+)\s*pcs\)/i);
  if (total && pieces) {
    const perStick = Number(total[1]) / Number(pieces[1]);
    if (Number.isInteger(perStick)) return `${pieces[1]}x${perStick}gb`;
  }
  return null;
};

const ramOrColorConflict = (rawName, title, titleTokens) => {
  const name = normalizeText(rawName);

  const itemCl = name.match(/\bcl ?(\d{2})\b/)?.[1];
  const titleCls = titleTokens.filter((token) => /^cl\d{2}$/.test(token)).map((t) => t.slice(2));
  if (itemCl && titleCls.length > 0 && !titleCls.includes(itemCl)) return "annan_latens";

  const itemKit = kitTokenFromName(rawName);
  const titleKits = titleTokens.filter((token) => /^\d+x\d+gb$/.test(token));
  if (itemKit && titleKits.length > 0 && !titleKits.includes(itemKit)) return "annat_kit";

  if (WHITE_WORDS.test(name) !== WHITE_WORDS.test(title)) return "annan_farg";
  return null;
};

/*
 * Tillverkaren måste stå i titeln.
 *
 * Utan det kunde ett PNY-kort få priset för ett Gigabyte-kort och en
 * HP-disk priset för en Kingston, så länge modellnumren råkade
 * sammanfalla. Märket jämförs utan mellanslag, så "A-Data", "ADATA" och
 * "Lian Li" / "LianLi" räknas lika. Korta märken som HP och WD måste stå
 * som eget ord, annars hittas de inuti andra ord.
 */
const BRAND_ALIASES = {
  wd: ["wd", "westerndigital", "sandisk"],
  westerndigital: ["wd", "westerndigital"],
  sandisk: ["sandisk", "wd"],
  adata: ["adata", "xpg"],
  hewlettpackardenterprise: ["hpe", "hewlett"],
  dellrefurbished: ["dell"],
  teamgroup: ["teamgroup", "tforce"],
  fractaldesign: ["fractal"],
  startechcom: ["startech"],
};

const brandInTitle = (brand, title, titleTokenSet) => {
  const key = normalizeText(brand).replace(/ /g, "");
  if (!key) return true;
  const compactTitle = title.replace(/ /g, "");
  const firstWord = normalizeText(brand).split(" ")[0];
  const candidates = BRAND_ALIASES[key] || [key, ...(firstWord.length >= 4 ? [firstWord] : [])];
  return candidates.some((candidate) =>
    candidate.length < 4 ? titleTokenSet.has(candidate) : compactTitle.includes(candidate),
  );
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
  /* Varianter som butikerna skriver ut men katalogen ibland inte gör.
     Varje ord här stod bakom en felmatchning i databasen: RX 9070 fick
     9070 GRE:s pris, Astral 5090 fick Astral LC:s, Nautilus 360 fick
     360 RS:s, Visio fick Visio Air:s, Vector V100 fick V100 Mini:s, XT
     Pro Ultra fick V2:ans och MasterLiquid Core II fick Core Nex:s. ice
     är den vita utgåvan, sff den kompakta och ax wifi-modellen. */
  "gre",
  "lc",
  "rs",
  "air",
  "mini",
  "nex",
  "ice",
  "sff",
  "ax",
  "ii",
  "iii",
  "v2",
  "v3",
];

/*
 * Modelldelen av ett namn ur flödet.
 *
 * Proshops namn är byggda som "Noctua NH-D9L - CPU Luftkylare - Max 22
 * dBA": modellen först, sedan butikens egna fält. De fälten skriver
 * ingen annan butik, så krävdes de i Webhallens titel matchade nästan
 * ingenting - noll av sextio i ett stickprov. Är första ledet ett
 * ensamt ord ("HP - SSD - 1 TB") är det inget modellnamn, och då får
 * hela namnet stå kvar utan strecken.
 */
const NAME_SEPARATOR = /\s+[-/]\s+/;

const modelSegment = (name) => {
  const segments = String(name ?? "").split(NAME_SEPARATOR).filter(Boolean);
  if (segments.length > 1 && segments[0].trim().split(/\s+/).length >= 2) return segments[0];
  return segments.join(" ");
};

const GENERIC_WORDS =
  /\b(?:strömförsörjning|moderkort|chassi|computer case|processor cooler|cpu cooler|cpu luftkylare|cpu vattenkylare|luftkylare|vattenkylare)\b/gi;

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

  text = modelSegment(text);
  /* Butikens kategoriord. "MSI MPG A850GS PCIE5 Strömförsörjning" gav
     noll träffar hos Webhallen; utan det sista ordet hittas aggregatet. */
  text = text.replace(GENERIC_WORDS, " ");
  text = text.replace(/\s+/g, " ").trim();

  const words = text.split(" ").filter(Boolean);
  // Sex ord räcker för tillverkare, serie och variant. Fler ord gör bara
  // sökningen snävare än butikens egen produkttitel.
  return words.slice(0, 6).join(" ");
};

/*
 * "1 TB" och "1TB" blir samma token.
 *
 * Utan det blev "HP - SSD - 1 TB" tokenen 1 och tb, ingen av dem en
 * riktig modell, och 1 fanns i en nätverkskabel på 1,5 m. Nu krävs 1tb,
 * och en 256 GB-disk kan inte längre ta en 4 TB-disks plats.
 */
export const normalizeText = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(\d+) (gb|tb)\b/g, "$1$2")
    /* "3200Mhz", "3200 MHz" och "DDR4-3200" betyder samma sak. Enheten
       tas bort så att alla tre blir tokenen 3200. */
    .replace(/\b(\d{3,5}) ?(?:mhz|mt s)\b/g, "$1")
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
/*
 * Bokstaven efter ett bindestreck i ett modellnamn är en egen modell.
 *
 * X870-A och X870-I, Z890-P och Z890-A, B650E-F och B650E-I: samma
 * kretsuppsättning, olika kort. Bokstaven kastades bort som brus, och
 * korten fick varandras priser.
 */
const HYPHEN_VARIANT = /\b[a-z]*\d+[a-z0-9]*-([a-z])\b/gi;

export const extractModelTokens = (name, { category = null } = {}) => {
  /* Bara modelldelen krävs, se modelSegment. Kapaciteten står ofta i
     ett senare led ("... DDR4-3200 - 16GB - CL16") och följer med, för
     ett 16 GB-kit och ett 32 GB-kit har samma modellnamn. */
  const model = modelSegment(name);
  const rest = normalizeText(String(name ?? "").slice(model.length));
  const capacities = rest.split(" ").filter((word) => /^\d+(?:gb|tb)$/.test(word));

  const normalized = [normalizeText(model), ...capacities].join(" ").trim();
  if (!normalized) return [];
  const hyphenVariants = Array.from(model.matchAll(HYPHEN_VARIANT), (match) =>
    match[1].toLowerCase(),
  );

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
    /* Tekniknamn, inte modellnamn.

       Katalogen skriver "Sandisk WD_Black SN8100 NVMe 1TB", Proshop
       skriver "SANDISK WD Black SN8100 SSD - 1TB". Samma disk, men ordet
       nvme fattades och matchningen föll - trots att modellnumret SN8100
       och kapaciteten 1tb stämde exakt.

       Att släppa dem är säkert eftersom modelltoken fortfarande krävs:
       en SN8100 är NVMe oavsett vad butiken kallar den. sata står med
       flit inte här - en disk finns ibland i både sata- och nvme-utförande
       under näraliggande modellnamn. */
    "nvme",
    "ssd",
    "pcie",
    "med",
    "och",
    "for",
    "till",
    "ny",
    "the",
    /* Kodnamn och förpackning. Proshop skriver "Core Ultra 5 250K Plus
       Arrow Lake-S Refresh", Webhallen bara "Core Ultra 5 250K Plus". */
    "arrow",
    "lake",
    "raptor",
    "refresh",
    "wraith",
    "spire",
    "stealth",
    "prism",
    "boxed",
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
    if (hyphenVariants.includes(word)) {
      tokens.push(word);
      continue;
    }
    // Korta bokstavsord utan siffror bär sällan identitet - utom i
    // moderkortsnamn, där "Gaming X", "TUF" och "Ice" skiljer kort åt.
    if (word.length >= 4 || category === "motherboard") tokens.push(word);
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

  // Före EAN: en fyndvara bär samma EAN som den nya varan.
  const pathMismatch = storeCategoryMismatch(item?.category, row.category_path);
  if (pathMismatch) {
    return { matched: false, method: "token", score: 0, reason: pathMismatch };
  }

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

  const titleTokens = title.split(" ").filter(Boolean);
  const titleTokenSet = new Set(titleTokens);

  if (!brandInTitle(item?.brand, title, titleTokenSet)) {
    return { matched: false, method: "token", score: 0, reason: "annat_marke" };
  }

  /* NVMe och SATA är olika diskar även när namn och storlek stämmer.
     Fujitsus 480 GB NVMe fick annars priset för deras 480 GB SATA. */
  if (item?.category === "storage") {
    const name = normalizeText(item?.name);
    const itemNvme = /\b(?:nvme|pcie)\b/.test(name);
    const itemSata = /\bsata\b/.test(name);
    if ((itemNvme && /\bsata\b/.test(title)) || (itemSata && /\b(?:nvme|pcie)\b/.test(title))) {
      return { matched: false, method: "token", score: 0, reason: "annat_granssnitt" };
    }
  }

  /* Sparade token och token ur namnet gäller tillsammans.

     match_tokens i component_identity såddes ur en äldre version av
     extractModelTokens och fick då ersätta namnet helt. De saknade allt
     som lagts till sedan - bokstaven i Z890-P, lc, sff, ii - och de 455
     handplockade varorna matchades därför fortfarande med de gamla,
     lösare reglerna. */
  const modelTokens = Array.from(
    new Set([
      ...(identity?.match_tokens || []).map(normalizeText).filter(Boolean),
      ...extractModelTokens(item?.name, { category: item?.category }),
    ]),
  );

  /* Bara korta token kvar - "1", "0", "x4" - är inget att matcha på.
     Det är så en nätverkskabel kunde bli en SSD. */
  if (modelTokens.length === 0 || !modelTokens.some((token) => token.length >= 3)) {
    return { matched: false, method: "token", score: 0, reason: "inga_token" };
  }

  /* B650 är inte B650M. Butikerna skriver ut kretsuppsättningen i
     titeln ("B650M AORUS ELITE ... AMD B650"), så tokenen b650 finns
     där även för micro-ATX-kortet och kravet ovan räcker inte. */
  if (item?.category === "motherboard") {
    const modelSet = new Set(modelTokens);
    const mVariant = modelTokens.find(
      (token) => /\d/.test(token) && titleTokenSet.has(`${token}m`) && !modelSet.has(`${token}m`),
    );
    if (mVariant) {
      return { matched: false, method: "token", score: 0, reason: "annan_variant" };
    }
  }

  // Varje modell-token måste finnas. Siffergrupper kräver exakt token-träff så
  // att "5070" inte matchar "50700". Längre rena ord får matcha som
  // delsträng; korta som "f" eller "ice" måste stå som egna ord, annars
  // hittades B650E-F:s "f" i nästan vilken titel som helst.
  const missing = modelTokens.filter((token) => {
    if (/\d/.test(token) || token.length < 4) return !titleTokenSet.has(token);
    return !title.includes(token);
  });

  if (missing.length > 0) {
    /* missing följer med ut, inte bara som text i reason.

       Anroparen behöver kunna skilja "saknar 6gb" från "saknar 5070".
       Det första är en titel som utelämnat kapaciteten och går att
       avgöra med ett EAN-uppslag; det andra är fel produkt. Att låta
       refresh.mjs parsa reason-strängen hade fungerat tills någon
       skrev om formuleringen. */
    return {
      matched: false,
      method: "token",
      score: 0,
      reason: `saknar:${missing.join(",")}`,
      missing,
    };
  }

  const variantConflict = ramOrColorConflict(item?.name, title, titleTokens);
  if (variantConflict) {
    return { matched: false, method: "token", score: 0, reason: variantConflict };
  }

  /* Variantorden jämförs mot hela namnet, inte bara modelldelen: färgen
     står i ett senare led hos Proshop ("... - Svart"), och på svenska. */
  const fullNameWords = normalizeText(item?.name)
    .split(" ")
    .map((word) => ({ svart: "black", vit: "white" })[word] || word);
  if (hasExtraSignificantSuffix(titleTokens, [...modelTokens, ...fullNameWords])) {
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
 * Är det enda som saknas en kapacitetsangivelse?
 *
 * Butiker skriver inte alltid ut minnesstorleken i titeln. Katalogen
 * säger "ASUS Dual GeForce RTX 3050 6GB OC", Webhallen skriver "ASUS
 * GeForce RTX 3050 Dual OC" - samma kort, men token 6gb fattas och
 * matchningen faller.
 *
 * Att bara släppa kravet vore fel: RTX 3050 finns i både 6 och 8 GB och
 * det är olika kort. Men det är precis den frågan ett EAN besvarar, så
 * den här funktionen pekar ut när det är värt att hämta ett.
 */
const CAPACITY_TOKEN = /^\d{1,4}(gb|tb|mb)$/;

export const missingOnlyCapacity = (result) =>
  Array.isArray(result?.missing) &&
  result.missing.length > 0 &&
  result.missing.every((token) => CAPACITY_TOKEN.test(token));

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
