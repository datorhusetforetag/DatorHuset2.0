/**
 * Tester för uppgraderingarna: vilka val en dator får och vad de kostar.
 *
 *   node tests/upgradePricing.test.mjs
 *
 * Samma regler används av sajten och av kassan (shared/upgradePricing.js),
 * så det här är både vad kunden ser och vad kunden betalar.
 */

import { buildCartLineItems } from "../shared/checkoutMath.js";
import {
  cleanConfiguration,
  describeConfiguration,
  findBaseConfig,
  getUpgradeOptions,
  normalizePricing,
  priceConfiguration,
} from "../shared/upgradePricing.js";

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

const ram = (config) => getUpgradeOptions(config).ram.map((o) => [o.gb, o.price]);
const storage = (config) => getUpgradeOptions(config).storage.map((o) => [o.gb, o.price]);

const ddr4at16 = { computerId: "t1", names: [], ram: { gb: 16, type: "DDR4" }, storageGb: 512 };
const ddr5at32 = { computerId: "t2", names: [], ram: { gb: 32, type: "DDR5" }, storageGb: 1000 };
const at2tb = { computerId: "t3", names: [], ram: { gb: 32, type: "DDR4" }, storageGb: 2000 };

/* --- Vilka nivåer som visas -------------------------------------------- */

check("16GB får två steg uppåt", ram(ddr4at16), [[16, 0], [32, 1500], [64, 4500]]);
check("32GB får ett ned och ett upp", ram(ddr5at32), [[16, -3000], [32, 0], [64, 7000]]);
check("512GB får två steg uppåt", storage(ddr4at16), [[512, 0], [1000, 1000], [2000, 2500]]);
check("1TB kan inte gå ned till 512GB", storage(ddr5at32), [[1000, 0], [2000, 1500], [4000, 4000]]);
check("2TB får ett ned och ett upp", storage(at2tb), [[1000, -1500], [2000, 0], [4000, 2500]]);

/* --- Priserna ---------------------------------------------------------- */

check("stegen läggs ihop", priceConfiguration(ddr5at32, { ramGb: 64, storageGb: 4000 }), 7000 + 4000);
check("nedgradering dras av", priceConfiguration(ddr5at32, { ramGb: 16 }), -3000);
check("ogiltigt val ger null", priceConfiguration(ddr5at32, { storageGb: 512 }), null);
check("okänd storlek ger null", priceConfiguration(ddr5at32, { ramGb: 48 }), null);
check("tomt utförande kostar inget", priceConfiguration(ddr5at32, {}), 0);
check(
  "ändrad tabell slår igenom",
  priceConfiguration(ddr5at32, { ramGb: 64 }, { ram: { DDR5: { "16-32": 3000, "32-64": 9000 } } }),
  9000,
);

/* En halvfylld eller trasig tabell får aldrig ge ett gratis steg. */
check(
  "ogiltigt belopp ersätts med reserven",
  normalizePricing({ storage: { "512-1000": "abc", "1000-2000": -5 } }).storage,
  { "512-1000": 1000, "1000-2000": 1500, "2000-4000": 2500 },
);

/* --- Egna priser per dator --------------------------------------------- */

const withOverride = { overrides: { t2: { ram: { "32-64": 6500 }, storage: { "1000-2000": 1800 } } } };
check("eget steg går före standard", priceConfiguration(ddr5at32, { ramGb: 64 }, withOverride), 6500);
check("eget steg räknas i summan", priceConfiguration(ddr5at32, { storageGb: 4000 }, withOverride), 1800 + 2500);
check("andra datorer påverkas inte", priceConfiguration(at2tb, { storageGb: 4000 }, withOverride), 2500);
check("steg utan eget pris följer standard", priceConfiguration(ddr5at32, { ramGb: 16 }, withOverride), -3000);
check(
  "ogiltigt eget pris tas bort",
  normalizePricing({ overrides: { t2: { ram: { "32-64": "abc" } } } }).overrides,
  {},
);
check(
  "kassan använder datorns eget pris",
  buildCartLineItems(
    [{ quantity: 1, configuration: { ramGb: 64 }, product: { id: "p", name: "Platina Sleeper", price_cents: 1650000 } }],
    { overrides: { 7: { ram: { "32-64": 6500 } } } },
  )[0].price_data.unit_amount,
  1650000 + 650000,
);

/* --- Grafikkort -------------------------------------------------------- */

const withGpu = { gpu: { t2: [{ id: "rtx-5080", label: "RTX 5080", price: 6000 }] } };
check("grafikkortsval prissätts", priceConfiguration(ddr5at32, { gpu: "rtx-5080" }, withGpu), 6000);
check("borttaget grafikkort ger null", priceConfiguration(ddr5at32, { gpu: "rtx-5080" }), null);
check(
  "beskrivning",
  describeConfiguration(ddr5at32, { ramGb: 64, storageGb: 2000, gpu: "rtx-5080" }, withGpu),
  "64GB DDR5 · 2TB · RTX 5080",
);

/* --- Städning och uppslag ---------------------------------------------- */

check("grundvärden tas bort", cleanConfiguration(ddr5at32, { ramGb: 32, storageGb: 1000 }), null);
check("ändringar står kvar", cleanConfiguration(ddr5at32, { ramGb: 64, storageGb: 1000 }), { ramGb: 64 });
check("hittas på namn", findBaseConfig("Platina Sleeper")?.computerId, "7");
check("hittas på id", findBaseConfig("11")?.ram, { gb: 32, type: "DDR5" });
check("Silver-Speedster har 16GB", findBaseConfig("Silver-Speedster")?.ram.gb, 16);

/* --- Kassan ------------------------------------------------------------ */

const line = (configuration) =>
  buildCartLineItems([
    { quantity: 1, configuration, product: { id: "p", name: "Platina Sleeper", price_cents: 1650000 } },
  ])[0].price_data;

check("kassan lägger på tillägget", line({ ramGb: 64, storageGb: 2000 }).unit_amount, 1650000 + 850000);
check("kassan namnger utförandet", line({ ramGb: 64 }).product_data.name, "Platina Sleeper · 64GB DDR5");
check("grundutförande som förut", line(null).unit_amount, 1650000);

let rejected = null;
try {
  line({ storageGb: 512 });
} catch (error) {
  rejected = error.code;
}
check("kassan stoppar ogiltigt utförande", rejected, "INVALID_CONFIGURATION");

console.log("");
console.log(`${pass} godkända, ${fail} underkända`);
if (fail > 0) process.exit(1);
