/**
 * Läser granskningslistan från importen och visar den gruppvis.
 *
 *   node scripts/feed-review.mjs                       # skälen med antal
 *   node scripts/feed-review.mjs --reason "sockel"     # smakprov ur ett skäl
 *   node scripts/feed-review.mjs --reason "sockel" --all
 *
 * Granskningslistan är det importen inte vågade avgöra. Den är till för
 * att läsas av en människa, och en fil med tusentals rader läses inte -
 * den skummas. Det här skriptet grupperar den så att man ser mönstret i
 * stället för raderna.
 */

import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const flagValue = (name) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 ? args[index + 1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const FILE = flagValue("file") || "data/feed-import-review.json";
const REASON = flagValue("reason");
const SAMPLE = hasFlag("all") ? Infinity : Number(flagValue("sample")) || 25;

const parsed = JSON.parse(readFileSync(FILE, "utf8"));
const items = parsed.items || parsed;

if (!REASON) {
  const byReason = new Map();
  for (const item of items) {
    const label = `${item.category}: ${item.reason}`;
    byReason.set(label, (byReason.get(label) || 0) + 1);
  }
  console.log(`${items.length.toLocaleString("sv-SE")} rader till granskning\n`);
  for (const [label, count] of [...byReason].sort((a, b) => b[1] - a[1])) {
    console.log(String(count).padStart(6) + "  " + label);
  }
} else {
  const matching = items.filter((item) =>
    `${item.category}: ${item.reason}`.toLowerCase().includes(REASON.toLowerCase()),
  );
  console.log(`${matching.length.toLocaleString("sv-SE")} rader matchar "${REASON}"\n`);

  /* Gruppera på butikens kategori - det avslöjar oftast vad de är. */
  const byFeedCategory = new Map();
  for (const item of matching) {
    const list = byFeedCategory.get(item.feedCategory || "?") || [];
    list.push(item.title);
    byFeedCategory.set(item.feedCategory || "?", list);
  }

  for (const [feedCategory, titles] of [...byFeedCategory].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n--- ${feedCategory} (${titles.length}) ---`);
    titles.slice(0, SAMPLE).forEach((title) => console.log("  " + title));
    if (titles.length > SAMPLE) console.log(`  ... och ${titles.length - SAMPLE} till`);
  }
}
