/**
 * Hur många förbeställningar vi tar emot samtidigt.
 *
 * Varje förbeställd dator byggs för hand. Kapaciteten är alltså inte en
 * siffra i ett lager utan hur många maskiner som ryms i veckorna
 * framåt, och en begagnad bygger vi långsammare: delarna ska hämtas,
 * testas och matchas ihop innan bygget ens börjar.
 *
 * TABELLEN ÄR GIVEN, INTE UTRÄKNAD
 *
 *   begagnade  nybyggda  totalt
 *   0          10        10
 *   1          8         9
 *   2          6         8
 *   3          5         8
 *
 * De tre första stegen ser ut som "en begagnad kostar två nybyggda",
 * men det fjärde gör det inte - där kostar den bara en. Det är med
 * flit och kommer från hur arbetet faktiskt fördelar sig, inte från en
 * formel. Därför står tabellen utskriven i stället för att räknas fram:
 * en formel hade behövt ett undantag ändå, och undantaget hade varit
 * lättare att tappa bort än raden här nedanför.
 *
 * Fler än tre begagnade tar vi inte, oavsett hur få nybyggda det finns.
 */

/** Största antal nybyggda förbeställningar, per antal begagnade. */
const NEW_LIMIT_BY_USED = [10, 8, 6, 5];

/** Fler begagnade än så tar vi inte emot samtidigt. */
export const MAX_USED_PREORDERS = NEW_LIMIT_BY_USED.length - 1;

/**
 * Taket för nybyggda när ett visst antal begagnade är igång.
 *
 * Över tre begagnade finns inget tak att tala om - då är butiken redan
 * stängd för förbeställningar - men noll är rätt svar och inte ett fel,
 * eftersom den som frågar vill veta hur många som får plats.
 */
export const newPreorderLimit = (usedCount) => {
  const used = Math.max(0, Math.round(Number(usedCount) || 0));
  if (used > MAX_USED_PREORDERS) return 0;
  return NEW_LIMIT_BY_USED[used];
};

/**
 * Får det här läggas till?
 *
 * current  { newCount, usedCount } - det som redan är igång.
 * adding   { newCount, usedCount } - det kunden vill lägga till.
 *
 * Returnerar { ok } eller { ok: false, reason, message } där message är
 * skriven för kunden, inte för loggen.
 */
export const checkPreorderCapacity = (current, adding) => {
  const nowNew = Math.max(0, Number(current?.newCount) || 0);
  const nowUsed = Math.max(0, Number(current?.usedCount) || 0);
  const addNew = Math.max(0, Number(adding?.newCount) || 0);
  const addUsed = Math.max(0, Number(adding?.usedCount) || 0);

  if (addNew === 0 && addUsed === 0) return { ok: true };

  const totalUsed = nowUsed + addUsed;
  const totalNew = nowNew + addNew;

  /* Begagnade prövas först. Går de inte igenom spelar antalet nybyggda
     ingen roll, och kunden ska få veta vad som faktiskt stoppade. */
  if (totalUsed > MAX_USED_PREORDERS) {
    const left = Math.max(0, MAX_USED_PREORDERS - nowUsed);
    return {
      ok: false,
      reason: "USED_LIMIT",
      message:
        left === 0
          ? "Vi bygger redan så många begagnade datorer som vi hinner med. Hör av dig så säger vi till när en plats blir ledig."
          : `Vi har plats för ${left} begagnad dator till just nu, inte ${addUsed}.`,
    };
  }

  const limit = newPreorderLimit(totalUsed);
  if (totalNew > limit) {
    const left = Math.max(0, limit - nowNew);
    return {
      ok: false,
      reason: "NEW_LIMIT",
      message:
        left === 0
          ? "Vi är fullbokade på förbeställningar just nu. Hör av dig så säger vi till när nästa plats öppnar."
          : `Vi har plats för ${left} dator till just nu, inte ${addNew}.`,
    };
  }

  return { ok: true };
};

/**
 * Hur många platser som är kvar, för att kunna visa det.
 *
 * Begagnade räknas mot sitt eget tak. Nybyggda räknas mot taket som
 * gäller vid nuvarande antal begagnade - lägger någon en begagnad order
 * krymper utrymmet för nybyggda, och det ska synas direkt.
 */
export const remainingCapacity = (current) => {
  const nowNew = Math.max(0, Number(current?.newCount) || 0);
  const nowUsed = Math.max(0, Number(current?.usedCount) || 0);
  return {
    used: Math.max(0, MAX_USED_PREORDERS - nowUsed),
    new: Math.max(0, newPreorderLimit(nowUsed) - nowNew),
    isFull: nowUsed >= MAX_USED_PREORDERS && nowNew >= newPreorderLimit(nowUsed),
  };
};
