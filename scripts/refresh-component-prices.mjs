#!/usr/bin/env node
/**
 * Kör en prisuppdatering från kommandoraden.
 *
 *   node scripts/refresh-component-prices.mjs              # hela katalogen
 *   node scripts/refresh-component-prices.mjs --category cpu
 *   node scripts/refresh-component-prices.mjs --limit 5 --dry
 *   node scripts/refresh-component-prices.mjs --status
 *
 * --dry skriver ingenting till databasen och är rätt sätt att se vad
 * matchningen skulle ha gjort innan man litar på den.
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

import {
  CUSTOM_BUILD_CATALOG_ITEMS,
  getCustomBuildCatalogItemsByCategory,
} from "../src/data/customBuildCatalog.js";
import * as pricing from "../server/pricing/index.mjs";
import { matchOffer, pickBestPerStore, buildSearchQuery } from "../server/pricing/match.mjs";
import webhallen from "../server/pricing/sources/webhallen.mjs";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};

const log = (level, event, payload = {}) => {
  const parts = Object.entries(payload)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  console.log(`[${level}] ${event} ${parts}`);
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

if (!supabase) {
  console.warn("! SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY saknas - kör utan att spara.\n");
}
pricing.store.configure(flag("dry") ? null : supabase);

// --------------------------------------------------------------------- status

if (flag("status")) {
  const status = await pricing.getPricingStatus();
  console.log(JSON.stringify(status, null, 2));
  process.exit(0);
}

// ---------------------------------------------------------------- urval

const category = value("category");
let items = category
  ? getCustomBuildCatalogItemsByCategory(category)
  : CUSTOM_BUILD_CATALOG_ITEMS;

const limit = Number(value("limit"));
if (Number.isFinite(limit) && limit > 0) items = items.slice(0, limit);

if (items.length === 0) {
  console.error(`Inga produkter för kategori "${category}".`);
  process.exit(1);
}

console.log(
  `${items.length} produkter${category ? ` i kategorin ${category}` : ""}${flag("dry") ? " (torrkörning)" : ""}\n`,
);

// ------------------------------------------------------------------ torrkörning

if (flag("dry")) {
  const identities = await pricing.store.loadIdentities().catch(() => new Map());
  let withPrice = 0;

  for (const item of items) {
    const identity = identities.get(item.id);
    let rows = [];
    try {
      rows = await webhallen.search(buildSearchQuery(identity?.model || item.name));
    } catch (error) {
      console.log(`  ${item.name}\n    API-fel: ${error.message}`);
      continue;
    }

    const matched = [];
    for (const row of rows) {
      const result = matchOffer(identity, item, row);
      if (result.matched) matched.push({ ...row, match_method: result.method, match_score: result.score });
    }
    const best = pickBestPerStore(matched);

    if (best.length > 0) {
      withPrice++;
      console.log(`  ${item.name}`);
      for (const offer of best) {
        console.log(
          `    ${String(Math.round(offer.price_cents / 100)).padStart(7)} kr  ${offer.store_name.padEnd(12)} ${offer.availability.padEnd(12)} ${offer.title.slice(0, 54)}`,
        );
      }
    } else {
      console.log(`  ${item.name}\n    ingen träff (${rows.length} kandidater avvisades)`);
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`\n${withPrice}/${items.length} fick pris.`);
  process.exit(0);
}

// -------------------------------------------------------------- riktig körning

const result = await pricing.runRefresh(items, { reason: "cli", logger: log });

console.log(
  `\nstatus=${result.status}  produkter=${result.itemsUpdated}/${items.length}  priser=${result.offersWritten}  tid=${Math.round(result.durationMs / 1000)}s`,
);
for (const source of result.sources) {
  console.log(`  ${source.ok ? "ok " : "FEL"} ${source.id}${source.error ? `: ${source.error}` : ""}`);
}
process.exit(result.status === "failed" ? 1 : 0);
