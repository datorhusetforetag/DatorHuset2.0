/**
 * Tester för flödesläsaren, med tonvikt på XML.
 *
 *   node tests/pricing.feed.test.mjs
 *
 * Partner-ads levererar XML med danska elementnamn, inte avgränsad text.
 * Läsaren klarade bara CSV, och ett Partner-ads-flöde hade därför gett noll
 * rader - den hade tagit första raden som rubrikrad, inte hittat någon
 * kolumn som hette pris, och kastat.
 *
 * Testerna kör mot en riktig HTTP-server i stället för mot en påhittad
 * ström. Det är där formatgissningen och gzip-hanteringen bor, och en
 * attrapp hade hoppat över just de delarna.
 */

import { createServer } from "node:http";
import { gzipSync } from "node:zlib";

import { streamFeed, COMPONENT_CATEGORY_FILTER } from "../server/pricing/sources/feed.mjs";

let pass = 0;
let fail = 0;

const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(
    `${ok ? "  PASS" : "  FAIL"}  ${name}${
      ok ? "" : `  (fick ${JSON.stringify(actual)}, ville ha ${JSON.stringify(expected)})`
    }`,
  );
  ok ? pass++ : fail++;
};

/* Formen kommer från Partner-ads egen fältbeskrivning: danska namn,
   CDATA kring titlar som innehåller & och <, pris med decimalkomma. */
const PARTNER_ADS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<produkter>
  <produkt>
    <produktid>10041</produktid>
    <produktnavn><![CDATA[ASUS Dual GeForce RTX 5060 8GB OC & Edition]]></produktnavn>
    <kategorinavn>Grafikkort</kategorinavn>
    <brand>ASUS</brand>
    <ean>4711387478844</ean>
    <nypris>4990,00</nypris>
    <gammelpris>5490,00</gammelpris>
    <fragt>49,00</fragt>
    <lagerstatus>1</lagerstatus>
    <lagerantal>7</lagerantal>
    <billedurl>https://exempel.se/bild/10041.jpg</billedurl>
    <vareurl>https://partner-ads.com/se/klikbanner.php?bannerid=1&amp;pid=10041</vareurl>
  </produkt>
  <produkt>
    <produktid>10042</produktid>
    <produktnavn>Diskmaskin Bosch Serie 4</produktnavn>
    <kategorinavn>Vitvaror</kategorinavn>
    <nypris>6990,00</nypris>
    <lagerstatus>1</lagerstatus>
    <vareurl>https://exempel.se/p/10042</vareurl>
  </produkt>
  <produkt>
    <produktid>10043</produktid>
    <produktnavn>Corsair Vengeance 32GB DDR5 minne</produktnavn>
    <kategorinavn>RAM-minne</kategorinavn>
    <ean>0840006645924</ean>
    <nypris>1290,50</nypris>
    <lagerstatus>0</lagerstatus>
    <vareurl>https://exempel.se/p/10043</vareurl>
  </produkt>
</produkter>`;

const CSV = [
  "product_name,price,product_url,category,ean",
  "Gigabyte RTX 5060 grafikkort,5290,https://exempel.se/p/1,Grafikkort,111",
  "Handduk,99,https://exempel.se/p/2,Badrum,222",
].join("\n");

/**
 * Kör streamFeed mot en server som svarar med body en gång.
 *
 * gzip sätter content-type: application/gzip, alltså gzip som innehåll.
 * Content-Encoding används med flit inte - fetch packar upp den själv, och
 * då ska läsaren låta bli.
 */
const collect = async (body, { gzip = false, contentType = "text/plain" } = {}) => {
  const payload = gzip ? gzipSync(body) : Buffer.from(body, "utf8");
  const server = createServer((req, res) => {
    res.writeHead(200, { "content-type": gzip ? "application/gzip" : contentType });
    res.end(payload);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  const rows = [];
  try {
    const stats = await streamFeed(
      {
        id: "test",
        label: "Testbutik",
        url: `http://127.0.0.1:${port}/feed`,
        network: "partner-ads",
        /* Samma filter som refresh.mjs sätter. Utan det släpps hela
           butikens sortiment igenom och testet mäter fel sak. */
        categoryFilter: COMPONENT_CATEGORY_FILTER,
      },
      (row) => rows.push(row),
    );
    return { rows, stats };
  } finally {
    server.close();
  }
};

console.log("\n=== Partner-ads XML ===");
{
  const { rows, stats } = await collect(PARTNER_ADS_XML, { contentType: "text/xml" });

  check("tre produkter lästes", stats.total, 3);
  check("diskmaskinen filtrerades bort", stats.skipped, 1);
  check("två komponenter togs emot", stats.accepted, 2);

  const [gpu, ram] = rows;

  check("CDATA plockades ut, inte taggarna", gpu.title, "ASUS Dual GeForce RTX 5060 8GB OC & Edition");
  check("decimalkomma blev ören", gpu.price_cents, 499000);
  check("frakten lästes", gpu.shipping_cents, 4900);
  check("totalen är pris plus frakt", gpu.total_cents, 503900);
  check("EAN följde med", gpu.ean, "4711387478844");
  check("varumärket följde med", gpu.brand, "ASUS");
  check("lagerstatus 1 är i lager", gpu.availability, "in_stock");
  check("lagerantalet lästes", gpu.stock_count, 7);
  check("butiken sattes", gpu.store_name, "Testbutik");

  /* &amp; i en url måste bli & - annars går spårningslänken till en
     parameter som heter amp;pid och klicket registreras aldrig. */
  check(
    "entiteten i spårningslänken avkodades",
    gpu.product_url,
    "https://partner-ads.com/se/klikbanner.php?bannerid=1&pid=10041",
  );

  check("lagerstatus 0 är slut", ram.availability, "out_of_stock");
  check("halvören avrundas inte bort", ram.price_cents, 129050);
  check("utan frakt blir totalen priset", ram.total_cents, 129050);
}

console.log("\n=== XML gzippad ===");
{
  const { stats } = await collect(PARTNER_ADS_XML, { gzip: true, contentType: "application/xml" });
  check("gzip packas upp innan formatet gissas", stats.accepted, 2);
}

console.log("\n=== CSV fungerar fortfarande ===");
{
  const { rows, stats } = await collect(CSV, { contentType: "text/csv" });
  check("en komponent togs emot", stats.accepted, 1);
  check("handduken filtrerades bort", stats.skipped, 1);
  check("titeln lästes", rows[0].title, "Gigabyte RTX 5060 grafikkort");
}

console.log("\n=== Flöde utan pris ===");
{
  let message = null;
  try {
    await collect("<produkter><produkt><produktnavn>Bara namn</produktnavn></produkt></produkter>", {
      contentType: "text/xml",
    });
  } catch (error) {
    message = error.message;
  }
  check(
    "saknat priselement ger ett begripligt fel",
    Boolean(message && message.includes("titel eller pris")),
    true,
  );
}

console.log(`\n${pass} godkända, ${fail} underkända`);
process.exit(fail === 0 ? 0 : 1);
