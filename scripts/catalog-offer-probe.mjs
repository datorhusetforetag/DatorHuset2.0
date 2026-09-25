/**
 * Frågar butiksuppslaget om varje katalogpost och visar vilka som står
 * utan erbjudande.
 *
 *   node scripts/catalog-offer-probe.mjs --ids fallback-ids.json
 *   node scripts/catalog-offer-probe.mjs --ids fallback-ids.json --refresh
 *
 * Konfiguratorn skriver "N/A" i prisrutan när en post saknar
 * erbjudanden helt. Den kontrollen sker i kundens webbläsare, en post i
 * taget, efter att kategorilistan laddats - därför syns den inte i
 * kategorisvaret och går inte att hitta genom att läsa det. Det här
 * skriptet gör samma anrop som webbläsaren gör.
 *
 * --refresh tvingar fram en ny hämtning hos butikerna, precis som
 * webbläsaren gör för poster med reservpris. Utan flaggan läses bara det
 * som redan finns sparat, vilket är snällare mot butikerna.
 */

import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const flagValue = (name) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 ? args[index + 1] : null;
};

const IDS = flagValue("ids");
const BASE = flagValue("base") || "http://localhost:3001";
const REFRESH = args.includes("--refresh");
const WORKERS = Number(flagValue("workers")) || 4;
const OUT = flagValue("out");

if (!IDS) throw new Error("Ange --ids med en JSON-fil som innehåller poster med id.");

const entries = JSON.parse(readFileSync(IDS, "utf8"));
const queue = [...entries];
const results = [];

const worker = async () => {
  while (queue.length > 0) {
    const entry = queue.shift();
    if (!entry) return;
    const url = `${BASE}/api/custom-build/catalog-offers?item_id=${encodeURIComponent(entry.id)}${REFRESH ? "&refresh=1" : ""}`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
      const data = await response.json().catch(() => ({}));
      const offers = Array.isArray(data?.offers) ? data.offers : [];
      const priced = offers.filter((offer) => Number(offer?.total_price) > 0 || Number(offer?.price) > 0);
      results.push({
        ...entry,
        ok: data?.ok === true,
        offers: offers.length,
        priced: priced.length,
        lowest: priced.length ? Math.min(...priced.map((o) => Number(o.total_price) || Number(o.price))) : null,
      });
    } catch (error) {
      results.push({ ...entry, ok: false, offers: 0, priced: 0, lowest: null, error: String(error.message || error) });
    }
    if (results.length % 25 === 0) process.stderr.write(`  ${results.length}/${entries.length}\n`);
  }
};

await Promise.all(Array.from({ length: Math.min(WORKERS, entries.length) }, worker));

const nA = results.filter((row) => row.offers === 0);
const noPrice = results.filter((row) => row.offers > 0 && row.priced === 0);

console.log(`\n${results.length} poster frågade${REFRESH ? " (med ny hämtning)" : ""}\n`);
console.log(`  visar N/A i konfiguratorn : ${nA.length}`);
console.log(`  har butik men inget pris  : ${noPrice.length}`);
console.log(`  har pris                  : ${results.length - nA.length - noPrice.length}`);

if (nA.length > 0) {
  console.log("\n=== utan erbjudanden (blir N/A) ===");
  const byCategory = new Map();
  for (const row of nA) byCategory.set(row.c, [...(byCategory.get(row.c) || []), row.id]);
  for (const [category, ids] of [...byCategory].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n  ${category} (${ids.length})`);
    ids.forEach((id) => console.log("    " + id));
  }
}

if (OUT) {
  writeFileSync(OUT, JSON.stringify(results, null, 1), "utf8");
  console.log(`\nskrev ${OUT}`);
}
