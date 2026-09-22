/**
 * Tester för hur många förbeställningar vi tar emot.
 *
 *   node tests/orderCapacity.test.mjs
 *
 * Tabellen är given och inte uträknad, så testerna prövar varje rad i
 * den för sig. Ändras en siffra i shared/orderCapacity.js ska exakt ett
 * test gå sönder och peka på vilken rad det gäller.
 */

import {
  MAX_USED_PREORDERS,
  checkPreorderCapacity,
  newPreorderLimit,
  remainingCapacity,
} from "../shared/orderCapacity.js";

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

/** Går det att lägga till en till, med det som redan är igång? */
const fits = (nowNew, nowUsed, addNew, addUsed) =>
  checkPreorderCapacity({ newCount: nowNew, usedCount: nowUsed }, { newCount: addNew, usedCount: addUsed }).ok;

console.log("=== tabellen, rad för rad ===");
check("0 begagnade ger 10 nybyggda", newPreorderLimit(0), 10);
check("1 begagnad ger 8 nybyggda", newPreorderLimit(1), 8);
check("2 begagnade ger 6 nybyggda", newPreorderLimit(2), 6);
check("3 begagnade ger 5 nybyggda", newPreorderLimit(3), 5);
/* Fjärde steget kostar bara en nybyggd, inte två som de tre första.
   Det är avsiktligt - se kommentaren i orderCapacity.js. */
check("steget från 2 till 3 begagnade kostar en nybyggd", newPreorderLimit(2) - newPreorderLimit(3), 1);
check("fler än tre begagnade ger noll", newPreorderLimit(4), 0);
check("taket för begagnade är tre", MAX_USED_PREORDERS, 3);

console.log("");
console.log("=== exakt fullt går igenom ===");
check("9 nybyggda plus en till, utan begagnade", fits(9, 0, 1, 0), true);
check("7 nybyggda plus en till, med en begagnad", fits(7, 1, 1, 0), true);
check("5 nybyggda plus en till, med två begagnade", fits(5, 2, 1, 0), true);
check("4 nybyggda plus en till, med tre begagnade", fits(4, 3, 1, 0), true);
check("två begagnade plus en till", fits(0, 2, 0, 1), true);

console.log("");
console.log("=== en över taket stoppas ===");
check("11:e nybyggda stoppas", fits(10, 0, 1, 0), false);
check("9:e nybyggda med en begagnad stoppas", fits(8, 1, 1, 0), false);
check("7:e nybyggda med två begagnade stoppas", fits(6, 2, 1, 0), false);
check("6:e nybyggda med tre begagnade stoppas", fits(5, 3, 1, 0), false);
check("fjärde begagnade stoppas", fits(0, 3, 0, 1), false);

console.log("");
console.log("=== en begagnad krymper utrymmet för nybyggda ===");
/* Den som redan har 8 nybyggda igång kan inte lägga till en begagnad:
   taket faller då från 10 till 8, och 8 nybyggda får precis plats -
   men inte mer. */
check("8 nybyggda plus en begagnad går", fits(8, 0, 0, 1), true);
check("9 nybyggda plus en begagnad stoppas", fits(9, 0, 0, 1), false);
check("6 nybyggda plus andra begagnade går", fits(6, 1, 0, 1), true);
check("7 nybyggda plus andra begagnade stoppas", fits(7, 1, 0, 1), false);

console.log("");
console.log("=== flera i samma köp ===");
check("tre nybyggda på en gång i tom butik", fits(0, 0, 3, 0), true);
check("tio nybyggda på en gång", fits(0, 0, 10, 0), true);
check("elva nybyggda på en gång stoppas", fits(0, 0, 11, 0), false);
check("två nybyggda och en begagnad", fits(0, 0, 2, 1), true);
check("nio nybyggda och en begagnad stoppas", fits(0, 0, 9, 1), false);
check("fyra begagnade på en gång stoppas", fits(0, 0, 0, 4), false);

console.log("");
console.log("=== inget läggs till ===");
/* En vagn utan förbeställningar ska aldrig stoppas, inte ens när
   butiken är full - den innehåller bara sådant som redan står färdigt. */
check("tom tilläggning går igenom även i full butik", fits(10, 3, 0, 0), true);

console.log("");
console.log("=== beskedet säger vad som stoppade ===");
check(
  "fullt på begagnade nämner begagnade",
  checkPreorderCapacity({ newCount: 0, usedCount: 3 }, { newCount: 0, usedCount: 1 }).reason,
  "USED_LIMIT",
);
check(
  "fullt på nybyggda nämner nybyggda",
  checkPreorderCapacity({ newCount: 10, usedCount: 0 }, { newCount: 1, usedCount: 0 }).reason,
  "NEW_LIMIT",
);
check(
  "beskedet är skrivet för kunden",
  typeof checkPreorderCapacity({ newCount: 10, usedCount: 0 }, { newCount: 1, usedCount: 0 }).message,
  "string",
);

console.log("");
console.log("=== platser kvar ===");
check("tom butik", remainingCapacity({ newCount: 0, usedCount: 0 }), { used: 3, new: 10, isFull: false });
check("en begagnad igång", remainingCapacity({ newCount: 0, usedCount: 1 }), { used: 2, new: 8, isFull: false });
check("helt fullt", remainingCapacity({ newCount: 5, usedCount: 3 }), { used: 0, new: 0, isFull: true });
/* Fler igång än taket tillåter kan inträffa om någon ändrar tabellen
   medan ordrar redan ligger. Då är svaret noll platser, inte ett
   negativt tal. */
check("över taket ger noll, inte minus", remainingCapacity({ newCount: 99, usedCount: 99 }), {
  used: 0,
  new: 0,
  isFull: true,
});

console.log("");
console.log(`${pass} godkända, ${fail} underkända`);
if (fail > 0) process.exit(1);
