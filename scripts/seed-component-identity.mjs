#!/usr/bin/env node
/**
 * Fyller component_identity - kopplingen mellan en katalogprodukt och de
 * identifierare butikernas flöden använder.
 *
 *   node scripts/seed-component-identity.mjs --dry            # visa, spara inget
 *   node scripts/seed-component-identity.mjs --category cpu
 *   node scripts/seed-component-identity.mjs                  # hela katalogen
 *   node scripts/seed-component-identity.mjs --tokens-only    # hoppa över nätverk
 *
 * Två saker skrivs:
 *
 *   1. match_tokens och reject_tokens, härledda ur produktnamnet. De räknas
 *      annars ut på nytt vid varje körning, vilket gör dem omöjliga att
 *      rätta för hand. I tabellen går de att justera när en produkt matchar
 *      fel, utan att någon rör koden.
 *
 *   2. EAN och MPN från Webhallens produkt-API, där produkten finns. EAN är
 *      det som gör matchningen exakt i stället för gissad på titel - och det
 *      är själva poängen med affiliateflödena som är på väg in.
 *
 * Rader skrivs alltid med verified = false. Det betyder "maskinen tror det
 * här" och inte "en människa har kontrollerat det".
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

import {
  CUSTOM_BUILD_CATALOG_ITEMS,
  getCustomBuildCatalogItemsByCategory,
} from "../src/data/customBuildCatalog.js";
import * as pricing from "../server/pricing/index.mjs";
import { matchOffer, extractModelTokens, DEFAULT_REJECT_TOKENS } from "../server/pricing/match.mjs";
import webhallen from "../server/pricing/sources/webhallen.mjs";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};

const DRY = flag("dry");
const TOKENS_ONLY = flag("tokens-only");
const PAUSE_MS = Math.max(0, Number(value("pause") || 350));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

if (!supabase && !DRY) {
  console.error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY saknas. Kör med --dry eller sätt nycklarna.");
  process.exit(1);
}
pricing.store.configure(DRY ? null : supabase);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Tillverkaren, gissad ur namnet. Katalogen har redan brand på vissa
 * kategorier men inte alla, och den som finns är inte alltid den som
 * butikerna använder.
 */
const KNOWN_BRANDS = [
  "ASUS", "MSI", "Gigabyte", "ASRock", "NZXT", "Corsair", "Fractal Design",
  "be quiet!", "Cooler Master", "Noctua", "Kingston", "Crucial", "Samsung",
  "Western Digital", "Seagate", "Intel", "AMD", "NVIDIA", "EVGA", "Zotac",
  "PNY", "Palit", "Gainward", "Sapphire", "XFX", "PowerColor", "Lian Li",
  "Phanteks", "Thermaltake", "Arctic", "DeepCool", "G.Skill", "Patriot",
  "Seasonic", "EndorFy", "Montech", "Antec",
];

const guessBrand = (item) => {
  const name = String(item?.name || "");
  const hit = KNOWN_BRANDS.find((brand) => name.toLowerCase().includes(brand.toLowerCase()));
  return hit || item?.brand || null;
};

/**
 * Extra avvisningsord per kategori. En CPU ska aldrig matcha ett moderkort
 * som råkar heta samma sak, och ett chassi ska inte matcha en fläkt-kit.
 */
const CATEGORY_REJECTS = {
  cpu: ["moderkort", "motherboard", "kylare", "cooler"],
  gpu: ["moderkort", "motherboard", "vattenblock", "waterblock", "stöd", "hållare", "riser"],
  motherboard: ["processor", "cpu only", "kylare"],
  ram: ["moderkort", "ssd", "usb"],
  storage: ["kylare", "heatsink only", "kabel", "adapter", "docka"],
  case: ["fläktkit", "fan kit", "glaspanel", "sidopanel", "hjul"],
  psu: ["kabel", "kabelkit", "cable kit", "extender", "adapter", "testare"],
  cooling: ["moderkort", "processor", "grafikkort", "endast fäste", "bracket only"],
};

const buildIdentity = (item) => ({
  item_id: item.id,
  brand: guessBrand(item),
  model: item.name,
  match_tokens: extractModelTokens(item.name),
  reject_tokens: Array.from(
    new Set([...DEFAULT_REJECT_TOKENS, ...(CATEGORY_REJECTS[item.category] || [])]),
  ),
  ean: null,
  mpn: null,
  verified: false,
});

/**
 * Slår upp produkten hos Webhallen och hämtar EAN/MPN - men bara när exakt
 * en kandidat matchar. Två träffar betyder att vi inte kan avgöra vilken
 * variant som avses, och då är en gissad EAN värre än ingen alls: den låser
 * fast fel produkt för all framtid.
 */
const enrichFromWebhallen = async (item, identity) => {
  let rows = [];
  try {
    rows = await webhallen.search(item.name);
  } catch (error) {
    return { status: "sökfel", detail: error.message };
  }

  const matches = rows.filter((row) => matchOffer(identity, item, row).matched);
  if (matches.length === 0) return { status: "ingen träff" };
  if (matches.length > 1) return { status: `tvetydig (${matches.length})` };

  const candidate = matches[0];
  if (!candidate.external_id) return { status: "saknar id" };

  try {
    const ids = await webhallen.fetchIdentifiers(candidate.external_id);
    if (!ids.ean && !ids.mpn) return { status: "inga koder" };
    return {
      status: "ok",
      ean: ids.ean,
      mpn: ids.mpn,
      brand: ids.brand,
      title: candidate.title,
    };
  } catch (error) {
    return { status: "detaljfel", detail: error.message };
  }
};

// ------------------------------------------------------------------- urval

const category = value("category");
let items = category ? getCustomBuildCatalogItemsByCategory(category) : CUSTOM_BUILD_CATALOG_ITEMS;

const limit = Number(value("limit"));
if (Number.isFinite(limit) && limit > 0) items = items.slice(0, limit);

if (items.length === 0) {
  console.error(`Inga produkter för kategori "${category}".`);
  process.exit(1);
}

console.log(
  `${items.length} produkter${category ? ` i ${category}` : ""}` +
    `${DRY ? " (torrkörning - inget sparas)" : ""}` +
    `${TOKENS_ONLY ? " (bara token, ingen uppslagning)" : ""}\n`,
);

// ------------------------------------------------------------------ körning

const stats = { total: 0, ean: 0, mpn: 0, tokensOnly: 0, failed: 0, written: 0 };

// Skrivs undan löpande i klumpar. En full körning tar flera minuter, och
// att spara allt först på slutet betyder att ett avbrott vid produkt 450
// kastar bort alla 449 uppslagningar som redan gjorts.
const CHUNK = 50;
let pending = [];
// Allt som skrivits, för den avslutande dubblettkontrollen. Dubbletter kan
// ligga i olika klumpar, så de går inte att upptäcka vid själva skrivningen.
const allRows = [];

/**
 * Samma EAN får aldrig hamna på två katalogprodukter.
 *
 * En EAN identifierar exakt en vara. Dyker samma kod upp på flera av våra
 * produkter betyder det att matchningen inte kunnat skilja varianterna åt -
 * och då är minst en av dem fel. Eftersom vi inte kan avgöra vilken, tas
 * koden bort från allihop och de får falla tillbaka på titelmatchning.
 *
 * En saknad EAN kostar lite träffsäkerhet. En felaktig EAN låser fast fel
 * produkt för gott, eftersom exakt matchning litar på den före allt annat.
 */
const dropAmbiguousCodes = (rows) => {
  const count = (field) => {
    const seen = new Map();
    for (const row of rows) {
      const value = row[field];
      if (!value) continue;
      seen.set(value, (seen.get(value) || 0) + 1);
    }
    return seen;
  };

  const eanCounts = count("ean");
  const mpnCounts = count("mpn");
  let dropped = 0;

  for (const row of rows) {
    if (row.ean && eanCounts.get(row.ean) > 1) {
      row.ean = null;
      dropped++;
    }
    if (row.mpn && mpnCounts.get(row.mpn) > 1) {
      row.mpn = null;
    }
  }
  return dropped;
};

const flush = async () => {
  if (DRY || pending.length === 0) return;
  const chunk = pending.map((row) => ({ ...row, updated_at: new Date().toISOString() }));
  pending = [];
  const { error } = await supabase
    .from("component_identity")
    .upsert(chunk, { onConflict: "item_id" });
  if (error) {
    console.error(`  ! skrivfel: ${error.code} ${error.message}`);
    stats.failed += chunk.length;
  } else {
    stats.written += chunk.length;
    console.log(`  -- sparade ${stats.written}/${items.length}`);
  }
};

for (const item of items) {
  const identity = buildIdentity(item);
  stats.total++;

  let note = "bara token";
  if (!TOKENS_ONLY) {
    const result = await enrichFromWebhallen(item, identity);
    if (result.status === "ok") {
      identity.ean = result.ean;
      identity.mpn = result.mpn;
      if (result.brand) identity.brand = result.brand;
      if (result.ean) stats.ean++;
      if (result.mpn) stats.mpn++;
      note = `EAN ${result.ean || "-"}  MPN ${result.mpn || "-"}`;
    } else {
      stats.tokensOnly++;
      note = result.status + (result.detail ? ` (${result.detail})` : "");
    }
    await sleep(PAUSE_MS);
  } else {
    stats.tokensOnly++;
  }

  pending.push(identity);
  allRows.push(identity);
  console.log(
    `  ${item.id.padEnd(38).slice(0, 38)} ${String(identity.match_tokens.join(",")).padEnd(22).slice(0, 22)} ${note}`,
  );

  if (pending.length >= CHUNK) await flush();
}

await flush();

// ------------------------------------------------------- dubblettkontroll

const beforeEan = allRows.filter((row) => row.ean).length;
const dropped = dropAmbiguousCodes(allRows);

if (dropped > 0) {
  console.log(
    `\n! ${dropped} produkter delade EAN med en annan produkt - koden togs bort från dem.`,
  );
  if (!DRY) {
    const changed = allRows.filter((row) => !row.ean || !row.mpn);
    for (let i = 0; i < changed.length; i += CHUNK) {
      const chunk = changed.slice(i, i + CHUNK).map((row) => ({
        ...row,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from("component_identity")
        .upsert(chunk, { onConflict: "item_id" });
      if (error) console.error(`  ! kunde inte rensa: ${error.code} ${error.message}`);
    }
  }
  stats.ean = beforeEan - dropped;
}

// ------------------------------------------------------------------ skrivning

console.log(
  DRY
    ? "\nTorrkörning - inget sparades."
    : `\nSparade ${stats.written} rader i component_identity.`,
);

console.log(
  `\n${stats.total} produkter  |  ${stats.ean} med EAN  |  ${stats.mpn} med MPN  |  ${stats.tokensOnly} bara token${stats.failed ? `  |  ${stats.failed} misslyckades` : ""}`,
);
