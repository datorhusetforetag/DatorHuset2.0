/**
 * Tester för matchningen mellan flödesrader och katalogprodukter.
 *
 *   node tests/pricing.match.test.mjs
 *
 * Sista blocket slår mot Webhallens riktiga API. Går nätet inte att nå
 * hoppas det över i stället för att fälla hela sviten.
 */

import { matchOffer, extractModelTokens, pickBestPerStore, buildSearchQuery } from "../server/pricing/match.mjs";
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

console.log("\n=== felmatchningar som låg i databasen ===");
const cpu3100 = { category: "cpu", brand: "AMD", name: "AMD Ryzen 3 3100" };
const hp1tb = { category: "storage", brand: "HP", name: "HP - SSD - 1 TB - PCIe (NVMe)" };
const lenovo4tb = { category: "storage", brand: "Lenovo", name: "Lenovo - SSD - 4 TB - PCIe 4.0 x4 (NVMe)" };
const fujitsuNvme = { category: "storage", brand: "Fujitsu", name: "Fujitsu - SSD - 480 GB - PCIe 4.0 (NVMe)" };
const pny5070ti = { category: "gpu", brand: "PNY", name: "PNY GeForce RTX 5070 Ti OC" };
const reaper9070 = { category: "gpu", brand: "PowerColor", name: "PowerColor Reaper AMD Radeon RX 9070" };
const strixF = { category: "motherboard", brand: "ASUS", name: "ASUS ROG Strix B650E-F Gaming WiFi" };
const z890p = { category: "motherboard", brand: "MSI", name: "MSI PRO Z890-P WIFI" };
const b650ax = { category: "motherboard", brand: "Gigabyte", name: "Gigabyte B650 Aorus Elite AX" };
const nautilus = { category: "cooling", brand: "Corsair", name: "Corsair Nautilus 360" };
check("Ryzen 3 3100 != rackkit", matchOffer(null, cpu3100, { title: "Rackmount.IT Rack Mount Kit for Check Point 3100/3200/3600" }).matched, false);
check("HP-disk != nätverkskabel", matchOffer(null, hp1tb, { title: "Nedis CCGL85200GY15 networking cable - Grå - 1.5m" }).matched, false);
check("HP-disk == HP-disk", matchOffer(null, hp1tb, { title: "HP FX900 - SSD - 1TB - PCIe 4.0 (NVMe)" }).matched, true);
check("4 TB != 256 GB", matchOffer(null, lenovo4tb, { title: "Lenovo - SSD - Value - 256 GB - PCIe 4.0 x4 (NVMe)" }).matched, false);
check("NVMe != SATA", matchOffer(null, fujitsuNvme, { title: "Fujitsu Micron - SSD - 480 GB - boot drive - SATA 6Gb/s" }).matched, false);
check("PNY != Gigabyte", matchOffer(null, pny5070ti, { title: "GIGABYTE GeForce RTX 5070 Ti AERO OC - 16GB" }).matched, false);
check("RX 9070 != 9070 GRE", matchOffer(null, reaper9070, { title: "PowerColor Radeon RX 9070 GRE Reaper - 12GB" }).matched, false);
check("B650E-F != B650E-I", matchOffer(null, strixF, { title: "ASUS ROG STRIX B650E-I GAMING WIFI Moderkort" }).matched, false);
check("B650E-F == B650E-F", matchOffer(null, strixF, { title: "ASUS ROG STRIX B650E-F GAMING WIFI Moderkort" }).matched, true);
check("Z890-P != Z890-A", matchOffer(null, z890p, { title: "MSI PRO Z890-A WIFI" }).matched, false);
check("B650 != B650M", matchOffer(null, b650ax, { title: "GIGABYTE B650M AORUS ELITE Moderkort - AMD B650 - AMD AM5" }).matched, false);
check("Nautilus 360 != 360 RS", matchOffer(null, nautilus, { title: "Corsair Nautilus 360 RS / 360mm" }).matched, false);
check("sparade token ersätter inte namnet", matchOffer({ match_tokens: ["z890"] }, z890p, { title: "MSI PRO Z890-A WIFI" }).matched, false);

console.log("\n=== Webhallen: butikskategori, minnesvarianter och färg ===");
const fury30 = { category: "ram", brand: "Kingston", name: "Kingston FURY Beast RGB DDR5-6000 - 32GB - CL30 - Dual Channel (2 pcs) - Svart med RGB" };
const furySingle = { category: "ram", brand: "Kingston", name: "Kingston FURY Beast RGB DDR5-6000 - 32GB - CL36 - Single Channel (1 pcs) - Svart med RGB" };
const fury36 = { category: "ram", brand: "Kingston", name: "Kingston FURY Beast RGB DDR5-6000 - 32GB - CL36 - Dual Channel (2 pcs) - Svart med RGB" };
const d9l = { category: "cooling", brand: "Noctua", name: "Noctua NH-D9L - CPU Luftkylare - Max 22 dBA" };
const le240vit = { category: "cooling", brand: "DeepCool", name: "DeepCool LE240 V2 Vit" };
const whFury = "Kingston Fury Beast RGB 32GB (2x16GB) / 6000 Mhz / DDR5 / CL36 / KF560C36BBEA2K2-32";
const ramPath = "Datorkomponenter/RAM-minne/DDR5";
check("CL30 != CL36", matchOffer(null, fury30, { title: whFury, category_path: ramPath }).matched, false);
check("1x32 != 2x16", matchOffer(null, furySingle, { title: whFury, category_path: ramPath }).matched, false);
check("CL36 2x16 == CL36 2x16", matchOffer(null, fury36, { title: whFury, category_path: ramPath }).matched, true);
check("SODIMM avvisas", matchOffer(null, fury36, { title: whFury, category_path: "Datorkomponenter/RAM-minne/SODIMM DDR5" }).matched, false);
check("fyndvara avvisas även på EAN", matchOffer({ ean: "0740617345902" }, fury36, { ean: "0740617345902", title: whFury, category_path: "Fyndvaror/Datorkomponenter/RAM-minne" }).matched, false);
check("laptop avvisas", matchOffer(null, gpu5070, { title: "ASUS TUF A16 / RTX 5070", category_path: "Datorer & Tillbehör/Laptop Bärbar dator/Gaming laptop" }).matched, false);
check("Proshops fält krävs inte", matchOffer(null, d9l, { title: "Noctua NH-D9L", category_path: "Datorkomponenter/Kylning/Processorkylare/Luftkylare" }).matched, true);
check("svart != chromax.black", matchOffer(null, d9l, { title: "Noctua NH-D9L chromax.black" }).matched, false);
check("vit == WH", matchOffer(null, le240vit, { title: "DeepCool LE240 WH V2 - CPU Vattenkylare" }).matched, true);
check("vit != svart", matchOffer(null, le240vit, { title: "DeepCool LE240 V2 - CPU Vattenkylare" }).matched, false);
check("sökfrågan tar modelldelen", buildSearchQuery("Seasonic CORE GX-850 Strömförsörjning - 850 Watt - ATX"), "Seasonic CORE GX-850");

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
