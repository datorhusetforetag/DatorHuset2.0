/**
 * Uppgraderingar av minne, lagring och grafikkort - regler och priser.
 *
 * Den här filen är den enda platsen där det räknas ut vilka val en dator
 * har och vad de kostar. Sajten använder den för att visa valen och
 * priserna, och servern använder samma fil i kassan för att räkna fram
 * vad kunden faktiskt debiteras. Det som visas och det som tas betalt
 * kan därför aldrig skilja sig åt.
 *
 * PRISTABELLEN
 *
 * Stegpriserna (i kronor) ändras ofta - komponentpriserna svänger - och
 * redigeras i adminläget under "Uppgraderingspriser". Tabellen sparas i
 * ui_settings under nyckeln "upgrade_pricing". DEFAULT_UPGRADE_PRICING
 * nedan är bara reserven om inget har sparats.
 *
 * Stegen läggs ihop: 512GB -> 2TB kostar 512->1TB + 1TB->2TB. Går kunden
 * ned ett steg dras samma belopp av som steget kostar uppåt.
 *
 * REGLERNA
 *
 *   Minne:    16GB -> 32GB -> 64GB, per minnestyp (DDR4 och DDR5 har
 *             olika priser).
 *   Lagring:  512GB -> 1TB -> 2TB -> 4TB.
 *
 *   Varje dator visar högst tre nivåer: sin egen och två till. Finns det
 *   en nivå både under och över visas en av varje; annars de två närmaste
 *   ovanför. Lagring går aldrig ned under 1TB - den som har 1TB kan inte
 *   välja 512GB.
 *
 * Grafikkort är inget steg i en trappa utan ett fåtal valda alternativ
 * per dator, med var sitt pristillägg. Även de redigeras i adminläget.
 */

export const RAM_TIERS = [16, 32, 64];
export const STORAGE_TIERS = [512, 1000, 2000, 4000];
export const RAM_TYPES = ["DDR4", "DDR5"];

/* Lagring under den här storleken går inte att välja som nedgradering. */
const STORAGE_DOWNGRADE_FLOOR = 1000;

export const DEFAULT_UPGRADE_PRICING = {
  storage: {
    "512-1000": 1000,
    "1000-2000": 1500,
    "2000-4000": 2500,
  },
  ram: {
    DDR4: { "16-32": 1500, "32-64": 3000 },
    DDR5: { "16-32": 3000, "32-64": 7000 },
  },
  /* Grafikkortsval per dator: { "<datorns id>": [{ id, label, price }] }.
     price är tillägget i kronor jämfört med datorns eget grafikkort. */
  gpu: {},
  /* Egna stegpriser för enskilda datorer: { "<datorns id>": { storage:
     { "1000-2000": 1800 }, ram: { "32-64": 6500 } } }. Bara de steg som
     står här ändras; resten följer standardtabellen ovanför. */
  overrides: {},
  updatedAt: null,
};

/*
 * Grundutförandet per dator: minnet och lagringen den har som standard.
 *
 * Står här och inte i src/data/computers.ts eftersom servern också måste
 * kunna läsa det, och servern läser inte TypeScript. names är de namn och
 * nycklar datorn kan dyka upp under i databasen; servern hittar datorn
 * genom att jämföra produktens namn, slug och legacy_id mot dem.
 *
 * Silver-Speedster har en 480GB-disk. Den räknas som 512GB-nivån - det är
 * butikens minsta lagringsnivå, och nästa steg därifrån är 1TB.
 */
export const BASE_CONFIGS = [
  { computerId: "2", names: ["Silver-Speedster"], ram: { gb: 16, type: "DDR4" }, storageGb: 512 },
  { computerId: "3", names: ["Guld-Inferno"], ram: { gb: 32, type: "DDR4" }, storageGb: 1000 },
  { computerId: "5", names: ["Glimmrande Guldigaspiken"], ram: { gb: 32, type: "DDR4" }, storageGb: 2000 },
  { computerId: "7", names: ["Platina Sleeper"], ram: { gb: 32, type: "DDR5" }, storageGb: 1000 },
  { computerId: "9", names: ["Platina Frostbyte"], ram: { gb: 32, type: "DDR5" }, storageGb: 2000 },
  { computerId: "10", names: ["All Black, All Out"], ram: { gb: 32, type: "DDR5" }, storageGb: 2000 },
  { computerId: "11", names: ["All White, All Out"], ram: { gb: 32, type: "DDR5" }, storageGb: 2000 },
];

/* Samma normalisering som resten av sajten använder för produktnycklar. */
export const normalizeKey = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Grundutförandet för en dator, sökt på id, namn, slug eller legacy_id. */
export const findBaseConfig = (...keys) => {
  const wanted = keys.map(normalizeKey).filter(Boolean);
  if (wanted.length === 0) return null;
  return (
    BASE_CONFIGS.find((config) =>
      [config.computerId, ...config.names].map(normalizeKey).some((key) => wanted.includes(key)),
    ) || null
  );
};

/* ------------------------------------------------------------------ */

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : null;
};

/**
 * Gör en sparad eller inskickad tabell säker att räkna med. Saknade eller
 * ogiltiga belopp ersätts med reservtabellens, så en halvfylld tabell
 * aldrig ger ett gratis steg.
 */
export const normalizePricing = (raw) => {
  const source = raw && typeof raw === "object" ? raw : {};
  const storage = {};
  for (const key of Object.keys(DEFAULT_UPGRADE_PRICING.storage)) {
    storage[key] = toNumber(source.storage?.[key]) ?? DEFAULT_UPGRADE_PRICING.storage[key];
  }
  const ram = {};
  for (const type of RAM_TYPES) {
    ram[type] = {};
    for (const key of Object.keys(DEFAULT_UPGRADE_PRICING.ram[type])) {
      ram[type][key] = toNumber(source.ram?.[type]?.[key]) ?? DEFAULT_UPGRADE_PRICING.ram[type][key];
    }
  }
  const gpu = {};
  if (source.gpu && typeof source.gpu === "object") {
    for (const [computerId, options] of Object.entries(source.gpu)) {
      if (!Array.isArray(options)) continue;
      const clean = options
        .map((option) => ({
          id: String(option?.id || "").trim().slice(0, 40),
          label: String(option?.label || "").trim().slice(0, 80),
          price: toNumber(option?.price),
        }))
        .filter((option) => option.id && option.label && option.price !== null);
      if (clean.length > 0) gpu[String(computerId).slice(0, 20)] = clean.slice(0, 6);
    }
  }
  const overrides = {};
  if (source.overrides && typeof source.overrides === "object") {
    for (const [computerId, override] of Object.entries(source.overrides)) {
      const clean = {};
      for (const group of ["storage", "ram"]) {
        const allowed = group === "storage"
          ? Object.keys(DEFAULT_UPGRADE_PRICING.storage)
          : Object.keys(DEFAULT_UPGRADE_PRICING.ram.DDR4);
        const steps = {};
        for (const key of allowed) {
          const value = toNumber(override?.[group]?.[key]);
          if (value !== null) steps[key] = value;
        }
        if (Object.keys(steps).length > 0) clean[group] = steps;
      }
      if (Object.keys(clean).length > 0) overrides[String(computerId).slice(0, 20)] = clean;
    }
  }
  return {
    storage,
    ram,
    gpu,
    overrides,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null,
  };
};

/* Summan av stegen mellan två nivåer. Negativ när målet ligger under. */
const stepSum = (tiers, steps, from, to) => {
  const a = tiers.indexOf(from);
  const b = tiers.indexOf(to);
  if (a === -1 || b === -1) return null;
  if (a === b) return 0;
  const [low, high] = a < b ? [a, b] : [b, a];
  let total = 0;
  for (let i = low; i < high; i += 1) {
    const step = steps[`${tiers[i]}-${tiers[i + 1]}`];
    if (typeof step !== "number") return null;
    total += step;
  }
  return a < b ? total : -total;
};

/* Högst tre nivåer: en under och en över om båda finns, annars de två
   närmaste ovanför, annars det som finns nedanför. */
const tierWindow = (tiers, base, allowBelow) => {
  const index = tiers.indexOf(base);
  if (index === -1) return [base];
  const below = index > 0 && allowBelow(tiers[index - 1]) ? tiers[index - 1] : null;
  const above1 = tiers[index + 1] ?? null;
  const above2 = tiers[index + 2] ?? null;
  if (below !== null && above1 !== null) return [below, base, above1];
  if (above1 !== null) return [base, above1, ...(above2 !== null ? [above2] : [])];
  if (below !== null) return [below, base];
  return [base];
};

export const formatStorage = (gb) => (gb >= 1000 ? `${gb / 1000}TB` : `${gb}GB`);
export const formatRam = (gb, type) => `${gb}GB ${type}`;

/**
 * Valen för en dator, med pristillägget för varje.
 *
 *   { ram: [{ gb, label, price, isBase }], storage: [...], gpu: [...] }
 *
 * price är skillnaden mot grundutförandet i kronor; 0 för grunden själv.
 */
export const getUpgradeOptions = (baseConfig, rawPricing) => {
  if (!baseConfig) return { ram: [], storage: [], gpu: [] };
  const pricing = normalizePricing(rawPricing);
  /* Datorns egna stegpriser går före standardtabellen, steg för steg. */
  const override = pricing.overrides[baseConfig.computerId] || {};
  const ramSteps = { ...(pricing.ram[baseConfig.ram.type] || {}), ...(override.ram || {}) };
  const storageSteps = { ...pricing.storage, ...(override.storage || {}) };

  const ram = tierWindow(RAM_TIERS, baseConfig.ram.gb, () => true)
    .map((gb) => ({
      gb,
      label: formatRam(gb, baseConfig.ram.type),
      price: stepSum(RAM_TIERS, ramSteps, baseConfig.ram.gb, gb),
      isBase: gb === baseConfig.ram.gb,
    }))
    .filter((option) => option.price !== null);

  const storage = tierWindow(STORAGE_TIERS, baseConfig.storageGb, (gb) => gb >= STORAGE_DOWNGRADE_FLOOR)
    .map((gb) => ({
      gb,
      label: formatStorage(gb),
      price: stepSum(STORAGE_TIERS, storageSteps, baseConfig.storageGb, gb),
      isBase: gb === baseConfig.storageGb,
    }))
    .filter((option) => option.price !== null);

  const gpu = pricing.gpu[baseConfig.computerId] || [];

  return { ram, storage, gpu };
};

/**
 * Prisskillnaden för ett valt utförande, i kronor, eller null om valet
 * inte är tillåtet för datorn. Kassan avvisar köpet när det blir null -
 * ett val som inte står bland alternativen ska aldrig kunna debiteras.
 *
 *   configuration: { ramGb?, storageGb?, gpu? }  (utelämnat = grund)
 */
export const priceConfiguration = (baseConfig, configuration, rawPricing) => {
  if (!configuration || typeof configuration !== "object") return 0;
  if (!baseConfig) return isEmptyConfiguration(configuration) ? 0 : null;
  const options = getUpgradeOptions(baseConfig, rawPricing);
  let total = 0;

  if (configuration.ramGb != null) {
    const option = options.ram.find((item) => item.gb === Number(configuration.ramGb));
    if (!option) return null;
    total += option.price;
  }
  if (configuration.storageGb != null) {
    const option = options.storage.find((item) => item.gb === Number(configuration.storageGb));
    if (!option) return null;
    total += option.price;
  }
  if (configuration.gpu) {
    const option = options.gpu.find((item) => item.id === configuration.gpu);
    if (!option) return null;
    total += option.price;
  }
  return total;
};

/**
 * Städar ett inskickat utförande: bara kända fält, och fält som är lika
 * med grunden tas bort. Ett utförande utan ändringar blir null, så en
 * vanlig beställning ser ut precis som förut.
 */
export const cleanConfiguration = (baseConfig, configuration) => {
  if (!baseConfig || !configuration || typeof configuration !== "object") return null;
  const clean = {};
  const ramGb = Number(configuration.ramGb);
  if (Number.isFinite(ramGb) && ramGb !== baseConfig.ram.gb) clean.ramGb = ramGb;
  const storageGb = Number(configuration.storageGb);
  if (Number.isFinite(storageGb) && storageGb !== baseConfig.storageGb) clean.storageGb = storageGb;
  if (typeof configuration.gpu === "string" && configuration.gpu.trim()) clean.gpu = configuration.gpu.trim().slice(0, 40);
  return Object.keys(clean).length > 0 ? clean : null;
};

export const isEmptyConfiguration = (configuration) =>
  !configuration || (configuration.ramGb == null && configuration.storageGb == null && !configuration.gpu);

/** En läsbar rad för kvitto, kassa och order: "64GB DDR5 · 2TB · RTX 5080". */
export const describeConfiguration = (baseConfig, configuration, rawPricing) => {
  if (!baseConfig || isEmptyConfiguration(configuration)) return "";
  const parts = [];
  if (configuration.ramGb != null) parts.push(formatRam(Number(configuration.ramGb), baseConfig.ram.type));
  if (configuration.storageGb != null) parts.push(formatStorage(Number(configuration.storageGb)));
  if (configuration.gpu) {
    const option = getUpgradeOptions(baseConfig, rawPricing).gpu.find((item) => item.id === configuration.gpu);
    if (option) parts.push(option.label);
  }
  return parts.join(" · ");
};
