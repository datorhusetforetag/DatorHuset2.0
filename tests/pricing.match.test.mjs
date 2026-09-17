/**
 * Tester för matchningen mellan flödesrader och katalogprodukter.
 *
 *   node tests/pricing.match.test.mjs
 *
 * Sista blocket slår mot Webhallens riktiga API. Går nätet inte att nå
 * hoppas det över i stället för att fälla hela sviten.
 */

import { matchOffer, extractModelTokens, pickBestPerStore } from "../server/pricing/match.mjs";
import webhallen from "../server/pricing/sources/webhallen.mjs";

let pass = 0;
let fail = 0;
const check = (name, actual, expected) => {
  const ok = actual === expected;
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${name}${ok ? "" : `  (fick ${JSON.stringify(actual)}, ville ha ${JSON.stringify(expected)})`}`);
  ok ? pass++ : fail++;
};

const cpu7800 = { id: "cpu-7800x3d", category: "cpu", name: "AMD Ryzen 7 7800X3D" };
const cpu5600 = { id: "cpu-5600", category: "cpu", name: "AMD Ryzen 5 5600" };
const gpu5070 = { id: "gpu-5070", category: "gpu", name: "GeForce RTX 5070" };
const gpu5070ti = { id: "gpu-5070-ti", category: "gpu", name: "GeForce RTX 5070 Ti" };
const gpu4070 = { id: "gpu-4070", category: "gpu", name: "GeForce RTX 4070" };
const ram5600 = { id: "ram-5600", category: "ram", name: "Corsair Vengeance 32GB DDR5 5600MHz" };

console.log("=== varianter får inte blandas ihop ===");
check("5070 != 5070 Ti", matchOffer(null, gpu5070, { title: "ASUS GeForce RTX 5070 Ti TUF OC" }).matched, false);
check("5070 == 5070 DUAL OC", matchOffer(null, gpu5070, { title: "ASUS GeForce RTX 5070 DUAL OC 12GB" }).matched, true);
check("5070 Ti == 5070 Ti Gaming OC", matchOffer(null, gpu5070ti, { title: "MSI GeForce RTX 5070 Ti Gaming OC" }).matched, true);
check("7800X3D != 9800X3D", matchOffer(null, cpu7800, { title: "AMD Ryzen 7 9800X3D" }).matched, false);
check("5600 != 5600XT", matchOffer(null, cpu5600, { title: "AMD Ryzen 5 5600XT / 6 core" }).matched, false);

console.log("\n=== serienamn krävs inte (butiker skriver R7, Ryzen 7, inget alls) ===");
check("ingen ensam siffertoken", extractModelTokens("AMD Ryzen 7 7800X3D").includes("7"), false);
check("utan 'Ryzen 7'", matchOffer(null, cpu7800, { title: "AMD 7800X3D AM5 processor" }).matched, true);
check("med 'R7'", matchOffer(null, cpu7800, { title: "AMD R7 7800X3D Boxed" }).matched, true);

console.log("\n=== färdigbyggda datorer och begagnat ===");
check("Config Pro avvisas", matchOffer(null, cpu7800, { title: "Webhallen Config Pro - R7 7800X3D / RX 9070XT / 32GB / 1TB / Win 11" }).matched, false);
check("speldator avvisas", matchOffer(null, cpu7800, { title: "Speldator 7800X3D RTX 5070 32GB 2TB SSD" }).matched, false);
check("uppräkning av delar avvisas", matchOffer(null, cpu7800, { title: "PC med Ryzen 7 7800X3D, RTX 4070, 32GB DDR5, 1TB NVMe, Windows 11" }).matched, false);
check("begagnad avvisas", matchOffer(null, cpu7800, { title: "AMD Ryzen 7 7800X3D Begagnad" }).matched, false);

console.log("\n=== kategorikrock ===");
check("CPU 5600 != DDR5 5600 MHz", matchOffer(null, cpu5600, { title: "Kingston Fury Beast 32GB DDR5 5600 MHz CL36" }).matched, false);
check("CPU 5600 != moderkort", matchOffer(null, cpu5600, { title: "Gigabyte B850 EAGLE WIFI D5" }).matched, false);
check("GPU 4070 != chassi 4070", matchOffer(null, gpu4070, { title: "Fractal Design Meshify 4070 Tower chassi" }).matched, false);
check("RAM 5600 == riktigt minne", matchOffer(null, ram5600, { title: "Corsair Vengeance 32GB (2x16GB) DDR5 5600MHz CL36" }).matched, true);
check("CPU utan kategoriord matchar ändå", matchOffer(null, cpu5600, { title: "AMD Ryzen 5 5600 Boxed AM4" }).matched, true);

console.log("\n=== EAN och MPN vinner över titel ===");
check("EAN ger method=ean", matchOffer({ ean: "0730143314626" }, cpu7800, { ean: "730143314626", title: "helt annan titel" }).method, "ean");
check("MPN ger method=mpn", matchOffer({ mpn: "100-100000910WOF" }, cpu7800, { mpn: "100100000910WOF", title: "annan titel" }).method, "mpn");

console.log("\n=== billigaste per butik ===");
const best = pickBestPerStore([
  { store_id: "a", price_cents: 500000, total_cents: 500000, match_score: 0.9 },
  { store_id: "a", price_cents: 450000, total_cents: 450000, match_score: 0.8 },
  { store_id: "b", price_cents: 470000, total_cents: 470000, match_score: 0.9 },
]);
check("en rad per butik", best.length, 2);
check("billigaste vann", best.find((o) => o.store_id === "a").total_cents, 450000);

console.log("\n=== mot Webhallens riktiga API ===");
try {
  const rows = await webhallen.search("Ryzen 7 7800X3D");
  const matched = rows.filter((row) => matchOffer(null, cpu7800, row).matched);
  for (const row of matched) {
    console.log(`    ${String(Math.round(row.price_cents / 100)).padStart(6)} kr  ${row.title.slice(0, 58)}`);
  }
  check("minst en lös komponent matchade", matched.length > 0, true);
  check("inga färdigbyggda slank igenom", matched.every((r) => !/config|speldator/i.test(r.title)), true);
} catch (error) {
  console.log(`  HOPPAS ÖVER (nätverk): ${error.message}`);
}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
