/**
 * Slår upp enskilda produkter i flödet och visar vad butiken säger om dem.
 *
 *   node scripts/feed-find.mjs --file flode.xml --match "Corsair ONE a600" --match "Backplate"
 *
 * Till för att svara på frågan "var kom den här skräpposten ifrån", som
 * annars bara går att gissa. Visar kategorinamn, pris och titel.
 */

import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";

import { streamFeed } from "../server/pricing/sources/feed.mjs";

const args = process.argv.slice(2);
const flagValue = (name) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 ? args[index + 1] : null;
};
const flagValues = (name) =>
  args.map((value, index) => (value === `--${name}` ? args[index + 1] : null)).filter(Boolean);

const FILE = flagValue("file");
const MATCHES = flagValues("match");
const PER_MATCH = Number(flagValue("limit")) || 4;

if (!FILE || !existsSync(FILE)) throw new Error("Ange --file med en nedladdad flödesfil.");
if (MATCHES.length === 0) throw new Error("Ange minst ett --match.");

const server = createServer((request, response) => {
  response.writeHead(200, { "content-type": "text/xml" });
  createReadStream(FILE).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

const found = new Map(MATCHES.map((match) => [match, []]));

await streamFeed(
  {
    id: "proshop",
    label: "Proshop",
    network: "partner-ads",
    url: `http://127.0.0.1:${server.address().port}/feed.xml`,
    categoryFilter: null,
  },
  (row) => {
    for (const match of MATCHES) {
      const list = found.get(match);
      if (list.length >= PER_MATCH) continue;
      if (!row.title || !row.title.toLowerCase().includes(match.toLowerCase())) continue;
      list.push(row);
    }
  },
  { timeoutMs: 1800000 },
);
server.close();

for (const [match, list] of found) {
  console.log(`\n=== "${match}" - ${list.length} träffar ===`);
  for (const row of list) {
    console.log(`  kategori : ${row.feed_category}`);
    console.log(`  titel    : ${row.title}`);
    console.log(`  pris     : ${row.total_price_cents ? row.total_price_cents / 100 : "?"} kr`);
    console.log("");
  }
}
