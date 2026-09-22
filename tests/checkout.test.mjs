/**
 * Tester för räkningen i kassan.
 *
 *   node tests/checkout.test.mjs
 *
 * Inget nätverk, ingen databas. Det här är koden som bestämmer vad
 * kunden betalar, och den ska gå att pröva utan att göra ett riktigt
 * köp.
 */

import {
  MAX_LINE_ITEMS,
  MAX_QUANTITY,
  SERVICE_FEE_CENTS,
  SHIPPING_COST_CENTS,
  buildCartLineItems,
  buildFeeLineItems,
  expectedTotalCents,
  normalizeQuantity,
  requiresShipping,
  sumLineItems,
} from "../shared/checkoutMath.js";

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

const throws = (name, fn, expectedCode) => {
  let code = null;
  try {
    fn();
  } catch (error) {
    code = error?.code || "OKÄND";
  }
  const ok = code === expectedCode;
  console.log(
    `${ok ? "  PASS" : "  FAIL"}  ${name}${ok ? "" : `  (fick ${code}, ville ha ${expectedCode})`}`,
  );
  ok ? pass++ : fail++;
};

const item = (priceCents, quantity = 1, id = "p1") => ({
  quantity,
  product: { id, name: "Testdator", price_cents: priceCents },
});

console.log("=== antalet ===");
check("vanligt antal går igenom", normalizeQuantity(3), 3);
check("noll blir ett", normalizeQuantity(0), 1);
/* Ett negativt antal hade dragit ifrån summan, alltså en rabatt kunden
   satt själv. */
check("negativt blir ett", normalizeQuantity(-5), 1);
check("text blir ett", normalizeQuantity("abc"), 1);
check("tomt blir ett", normalizeQuantity(undefined), 1);
check("decimaltal behålls inte över taket", normalizeQuantity(999), MAX_QUANTITY);
check("taket håller", normalizeQuantity(MAX_QUANTITY + 1), MAX_QUANTITY);

console.log("");
console.log("=== fraktvalet ===");
check("postnord ger frakt", requiresShipping("postnord"), true);
check("upphämtning ger ingen frakt", requiresShipping("pickup"), false);
/* Ett okänt värde ska bli det billigare alternativet. Tar vi betalt för
   frakt kunden inte bett om är det vi som har fel. */
check("okänt värde ger ingen frakt", requiresShipping("hemleverans"), false);
check("tomt ger ingen frakt", requiresShipping(undefined), false);

console.log("");
console.log("=== priset måste finnas ===");
throws("pris noll stoppas", () => buildCartLineItems([item(0)]), "INVALID_PRICE");
throws("pris saknas stoppas", () => buildCartLineItems([{ quantity: 1, product: {} }]), "INVALID_PRICE");
throws("negativt pris stoppas", () => buildCartLineItems([item(-100)]), "INVALID_PRICE");
throws("text som pris stoppas", () => buildCartLineItems([item("gratis")]), "INVALID_PRICE");
throws(
  "för många rader stoppas",
  () => buildCartLineItems(Array.from({ length: MAX_LINE_ITEMS + 1 }, () => item(100))),
  "TOO_MANY_ITEMS",
);
check("exakt taket går igenom", buildCartLineItems(Array.from({ length: MAX_LINE_ITEMS }, () => item(100))).length, MAX_LINE_ITEMS);

console.log("");
console.log("=== raderna ===");
const rows = buildCartLineItems([item(1099000, 2, "abc")]);
check("priset i ören behålls", rows[0].price_data.unit_amount, 1099000);
check("antalet följer med", rows[0].quantity, 2);
/* product_id är det webhooken använder för att koppla raden till en
   produkt. Tappas den blir ordern en rad utan produkt. */
check("product_id följer med", rows[0].price_data.product_data.metadata.product_id, "abc");
check("valutan är sek", rows[0].price_data.currency, "sek");
check(
  "namnlös produkt får ett namn",
  buildCartLineItems([{ quantity: 1, product: { id: "x", price_cents: 100 } }])[0].price_data
    .product_data.name,
  "Produkt",
);

console.log("");
console.log("=== avgifterna ===");
check("upphämtning ger bara serviceavgift", buildFeeLineItems("pickup").length, 1);
check("postnord ger två avgifter", buildFeeLineItems("postnord").length, 2);
check("serviceavgiften är rätt", buildFeeLineItems("pickup")[0].price_data.unit_amount, SERVICE_FEE_CENTS);
check("frakten är rätt", buildFeeLineItems("postnord")[1].price_data.unit_amount, SHIPPING_COST_CENTS);

console.log("");
console.log("=== summan ===");
check("en dator plus serviceavgift", expectedTotalCents([item(1099000)], "pickup"), 1099000 + SERVICE_FEE_CENTS);
check(
  "en dator plus frakt och serviceavgift",
  expectedTotalCents([item(1099000)], "postnord"),
  1099000 + SERVICE_FEE_CENTS + SHIPPING_COST_CENTS,
);
check(
  "två av samma dator räknas dubbelt",
  expectedTotalCents([item(1000000, 2)], "pickup"),
  2000000 + SERVICE_FEE_CENTS,
);
check(
  "två olika datorer läggs ihop",
  expectedTotalCents([item(1000000, 1, "a"), item(500000, 1, "b")], "pickup"),
  1500000 + SERVICE_FEE_CENTS,
);
/* Antalet klipps innan summan räknas, annars hade elva datorer i vagnen
   gett ett pris ingen tänkt sig. */
check(
  "antal över taket summeras mot taket",
  expectedTotalCents([item(1000000, 99)], "pickup"),
  1000000 * MAX_QUANTITY + SERVICE_FEE_CENTS,
);
check("tom vagn ger bara serviceavgift", expectedTotalCents([], "pickup"), SERVICE_FEE_CENTS);
check("sumLineItems på tom lista är noll", sumLineItems([]), 0);

console.log("");
console.log(`${pass} godkända, ${fail} underkända`);
if (fail > 0) process.exit(1);
