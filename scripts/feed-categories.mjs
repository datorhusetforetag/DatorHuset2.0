/**
 * Listar vad Proshop själv kallar sina kategorier.
 *
 *   node scripts/feed-categories.mjs --file flode.xml
 *   node scripts/feed-categories.mjs --file flode.xml --category SSD,RAM,CPU
 *
 * Titeln är en gissningslek, kategorinamnet är butikens eget besked. Det
 * här skriptet finns för att kunna läsa beskedet innan reglerna skrivs,
 * i stället för att skriva reglerna och hoppas.
 *
 * Utan --category skrivs varje kategorinamn med antal. Med --category
 * skrivs ett smakprov av titlarna i just den kategorin, vilket är vad
 * man behöver för att se om en kategori är ren eller blandad.
 */

import { createReadStream, existsSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";

import { streamFeed } from "../server/pricing/sources/feed.mjs";

const args = process.argv.slice(2);
const flagValue = (name) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 ? args[index + 1] : null;
};

const FILE = flagValue("file");
const WANTED = (flagValue("category") || "")
  .split(",")
  .map((name) => name.trim().toLowerCase())
  .filter(Boolean);
const SAMPLE = Number(flagValue("sample")) || 40;
const OUT = flagValue("out");

if (!FILE || !existsSync(FILE)) {
  throw new Error("Ange --file med en nedladdad flödesfil.");
}

const server = createServer((request, response) => {
  response.writeHead(200, { "content-type": "text/xml" });
  createReadStream(FILE).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

const counts = new Map();
const samples = new Map();

const handleRow = (row) => {
  const category = row.feed_category || "(utan kategori)";
  counts.set(category, (counts.get(category) || 0) + 1);

  if (!WANTED.includes(category.toLowerCase())) return;
  const list = samples.get(category) || [];
  if (list.length < SAMPLE) {
    list.push(row.title);
    samples.set(category, list);
  }
};

await streamFeed(
  {
    id: "proshop",
    label: "Proshop",
    network: "partner-ads",
    url: `http://127.0.0.1:${server.address().port}/feed.xml`,
    categoryFilter: null,
  },
  handleRow,
  { timeoutMs: 1800000 },
);
server.close();

const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

if (WANTED.length > 0) {
  for (const [name, list] of samples) {
    console.log(`\n=== ${name} (${counts.get(name)} rader) ===`);
    list.forEach((title) => console.log("  " + title));
  }
} else {
  console.log(`${sorted.length} kategorinamn, ${[...counts.values()].reduce((a, b) => a + b, 0).toLocaleString("sv-SE")} produkter\n`);
  for (const [name, count] of sorted) {
    console.log(String(count).padStart(7) + "  " + name);
  }
}

if (OUT) {
  writeFileSync(OUT, JSON.stringify(Object.fromEntries(sorted), null, 2), "utf8");
  console.log(`\nskrev ${OUT}`);
}
