/**
 * Uppdateringsmotorn.
 *
 * Den gamla lösningen höll "senast körd" i en variabel i webbprocessen och
 * körde bara i ett smalt fönster runt midnatt. Startade Render om instansen
 * glömdes allt bort, och missades fönstret hände ingenting på ett dygn - eller
 * fem månader, vilket är vad som faktiskt inträffade.
 *
 * Den här versionen lägger tillståndet i Supabase och frågar i stället
 * "hur länge sedan lyckades vi senast?". Är svaret mer än ett dygn körs en
 * uppdatering, oavsett vad klockan är och hur många gånger processen startat om.
 */

import {
  matchOffer,
  missingOnlyCapacity,
  pickBestPerStore,
  buildSearchQuery,
  normalizeEan,
} from "./match.mjs";
import * as store from "./store.mjs";
import webhallen from "./sources/webhallen.mjs";
import { streamFeed, COMPONENT_CATEGORY_FILTER } from "./sources/feed.mjs";

const DAY_MS = 24 * 60 * 60 * 1000;

export const REFRESH_INTERVAL_MS = Math.max(
  60 * 60 * 1000,
  Number(process.env.PRICING_REFRESH_INTERVAL_MS || DAY_MS),
);

/** Hur många katalogprodukter som söks parallellt mot API-källor. */
const API_CONCURRENCY = Math.max(1, Number(process.env.PRICING_API_CONCURRENCY || 3));

/** Paus mellan omgångar, så vi inte hamrar någons API. */
const API_BATCH_PAUSE_MS = Math.max(0, Number(process.env.PRICING_API_PAUSE_MS || 400));

/*
 * Hur länge ett flöde får ta att hämta och läsa.
 *
 * Proshops flöde är 274 MB. Läst från disk tar det fem sekunder, men över
 * internet tog det mer än de 120 sekunder som var standard - hämtningen
 * avbröts mitt i, och bara de produkter som hunnit läsas kom med.
 *
 * Det märks inte som ett fel i prislistan, bara som färre priser än det
 * borde vara, vilket är den sortens sak ingen letar efter. Tio minuter
 * räcker med marginal även på en långsam uppkoppling.
 */
const FEED_TIMEOUT_MS = Math.max(
  60_000,
  Number(process.env.PRICING_FEED_TIMEOUT_MS || 600_000),
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/*
 * Nytt försök när API:et ber oss vänta.
 *
 * Med hela katalogen blir det tusentals sökningar per körning. Ett 429
 * eller ett tillfälligt serverfel räknades förut bara som ett
 * misslyckande, och varan stod utan Webhallen-pris ett dygn. Vi backar
 * i stället och provar igen, två gånger.
 */
const withRetry = async (fn, delays = [3000, 10000]) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const status = Number(error?.status);
      const retryable = status === 429 || status >= 500 || error?.name === "TimeoutError";
      if (!retryable || attempt >= delays.length) throw error;
      await sleep(delays[attempt]);
    }
  }
};

/**
 * Läser flödeskonfiguration ur miljön.
 *
 * Varje butik konfigureras med PRICING_FEED_<ID>_URL. Uppgifterna hör hemma
 * i miljövariabler och inte i databasen, eftersom flödeslänkarna innehåller
 * affiliate-nycklar.
 */
export const getFeedConfigs = () => {
  const configs = [];
  const prefix = "PRICING_FEED_";
  const suffix = "_URL";

  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith(prefix) || !key.endsWith(suffix) || !value) continue;
    const id = key.slice(prefix.length, -suffix.length).toLowerCase().replace(/_/g, "-");
    configs.push({
      id,
      label: process.env[`PRICING_FEED_${id.toUpperCase().replace(/-/g, "_")}_LABEL`] || id,
      network: process.env[`PRICING_FEED_${id.toUpperCase().replace(/-/g, "_")}_NETWORK`] || "feed",
      url: value,
      categoryFilter: COMPONENT_CATEGORY_FILTER,
      fieldOverrides: {},
    });
  }
  return configs;
};

/**
 * Kör igenom ett flöde en gång och samlar kandidater per katalogprodukt.
 *
 * Flödet läses en gång och matchas mot hela katalogen i minnet. Motsatsen -
 * att läsa om flödet per produkt - skulle innebära hundratals nedladdningar
 * av samma fil.
 */
const ingestFeed = async (config, items, identities, candidatesByItem) => {
  let matched = 0;

  /*
   * Ett index på EAN, i stället för att prova varje rad mot varje post.
   *
   * Slingan nedanför gick igenom hela katalogen för varje rad i flödet.
   * Med 455 handplockade poster gick det an. Med de 6 781 kunden faktiskt
   * ser blir det miljardtals jämförelser för en uppgift som för de allra
   * flesta är en uppslagning: nittiosex procent av flödets rader bär EAN,
   * och det gör 6 423 av katalogens poster också.
   *
   * Posterna utan känt EAN måste fortfarande prövas mot varje rad. De är
   * ett par hundra, och det är den kostnaden som blir kvar.
   */
  const perEan = new Map();
  const utanEan = [];
  for (const item of items) {
    const ean = normalizeEan(identities.get(item.id)?.ean || item.ean);
    if (!ean) {
      utanEan.push(item);
      continue;
    }
    if (!perEan.has(ean)) perEan.set(ean, []);
    perEan.get(ean).push(item);
  }

  /*
   * Vilka poster en rad över huvud taget kan vara.
   *
   * Bär raden ett EAN som vi känner igen är det den posten - plus de utan
   * känt nummer, som mycket väl kan vara samma vara under ett annat namn.
   *
   * Bär raden ett EAN vi inte känner igen kan den inte vara en post med
   * ett ANNAT nummer. Det är en åtstramning mot hur det fungerade förut,
   * då titelmatchningen fick försöka ändå, och det är hela poängen med
   * ett EAN: två olika nummer är två olika varor.
   *
   * Saknar raden EAN finns inget att gå på utom namnet, och då får hela
   * katalogen prövas precis som förut.
   */
  const kandidaterFor = (row) => {
    const ean = normalizeEan(row.ean);
    if (!ean) return items;
    const traffar = perEan.get(ean);
    return traffar ? [...traffar, ...utanEan] : utanEan;
  };

  const stats = await streamFeed(config, async (row) => {
    /* Tidsgränsen sätts nedanför slingan, se FEED_TIMEOUT_MS. */

    /*
     * Raden går till den produkt som passar BÄST, inte den första som
     * passar alls.
     *
     * Förut bröt slingan vid första träffen. Då blev en allmänt hållen
     * katalogpost en dammsugare: "Intenso Premium M.2" saknar kapacitet i
     * namnet och matchade därför flödets alla fyra rader - 250 GB, 500 GB,
     * 1 TB och 2 TB - medan "Intenso Premium M.2 250GB" stod bredvid och
     * aldrig fick något pris alls.
     *
     * Poängen i matchOffer stiger med antalet modelltoken som måste
     * stämma, så den mer specifika posten vinner. Tjugotvå produkter satt
     * fast bakom det här.
     */
    let bestItem = null;
    let bestResult = null;

    for (const item of kandidaterFor(row)) {
      const result = matchOffer(identities.get(item.id), item, row);
      if (!result.matched) continue;
      if (!bestResult || result.score > bestResult.score) {
        bestItem = item;
        bestResult = result;
      }
    }

    if (!bestItem) return;

    if (!candidatesByItem.has(bestItem.id)) candidatesByItem.set(bestItem.id, []);
    candidatesByItem.get(bestItem.id).push({
      ...row,
      match_method: bestResult.method,
      match_score: bestResult.score,
    });
    matched++;
  }, { timeoutMs: FEED_TIMEOUT_MS });
  return { ...stats, matched };
};

/*
 * Slår upp EAN på en kandidat och provar matchningen igen.
 *
 * Sök-API:er returnerar sällan EAN - Webhallens gör det inte - så en
 * titel som utelämnat kapaciteten går inte att avgöra på det man fått.
 * Produktsidan har EAN:et. Ett extra anrop per närmiss är billigt i ett
 * nattjobb och gör skillnad på gissat och vetat.
 *
 * Hämtas bara vid närmiss, aldrig för varje rad. Ett uppslag per
 * sökträff hade blivit tusentals anrop per körning.
 */
const resolveByEan = async (source, identity, item, row) => {
  if (typeof source.fetchIdentifiers !== "function" || !row.external_id) return null;

  const ids = await source.fetchIdentifiers(row.external_id);
  if (!ids?.ean) return null;

  const enriched = { ...row, ean: ids.ean, mpn: row.mpn || ids.mpn || null };
  const result = matchOffer(identity, item, enriched);
  return result.matched ? { row: enriched, result, identifiers: ids } : null;
};

/** Frågar ett sök-API per katalogprodukt, i små omgångar. */
const ingestApiSource = async (source, items, identities, candidatesByItem, onProgress) => {
  let matched = 0;
  let failures = 0;
  let idLookups = 0;
  let eanRescued = 0;
  let idLearned = 0;
  let eanConfirmed = 0;
  let eanRejected = 0;
  /* Samma Webhallen-produkt dyker upp i sökningar för flera poster.
     Ett uppslag per produkt räcker. */
  const identifierCache = new Map();

  /* En sökning ger flera kandidatrader för samma produkt. Utan den här
     hade varje rad slagit upp sitt eget EAN och vi hade ringt
     produktsidan fem gånger för att lära oss en siffra. */
  const enriched = new Set();

  for (let i = 0; i < items.length; i += API_CONCURRENCY) {
    const batch = items.slice(i, i + API_CONCURRENCY);

    await Promise.all(
      batch.map(async (item) => {
        const identity = identities.get(item.id);
        // Sök brett, matcha strikt. Hela namnet används fortfarande när
        // kandidaterna vägs mot varandra i matchOffer.
        const query = buildSearchQuery(identity?.model || item.name);
        try {
          const rows = await withRetry(() => source.search(query));
          for (const row of rows) {
            let accepted = row;
            let result = matchOffer(identity, item, row);

            /* Närmiss på bara kapacitet: fråga produktsidan om EAN i
               stället för att gissa. Utan identitets-EAN att jämföra
               mot blir svaret ändå nej, men uppslaget är inte bortkastat
               - EAN:et sparas nedan och gör nästa körning säkrare. */
            if (!result.matched && missingOnlyCapacity(result)) {
              idLookups++;
              try {
                const rescued = await resolveByEan(source, identity, item, row);
                if (rescued) {
                  accepted = rescued.row;
                  result = rescued.result;
                  eanRescued++;
                }
              } catch {
                // Produktsidan svarade inte. Raden förblir omatchad.
              }
            }

            if (!result.matched) continue;

            /* Kontrollera namnträffen mot EAN när vi har ett.

               Sök-API:et svarar utan EAN, så en träff här är en
               namnträff. Nästan alla poster ur Proshops flöde bär EAN,
               och Webhallens produktsida har det också. Stämmer numren
               är det samma vara; skiljer de sig är det en annan, hur
               lika namnen än är. Saknar Webhallen numret står
               namnträffen kvar. */
            const identityEan = normalizeEan(identity?.ean);
            if (result.method === "token" && identityEan && accepted.external_id) {
              let ids = identifierCache.get(accepted.external_id);
              if (ids === undefined) {
                idLookups++;
                try {
                  ids = (await source.fetchIdentifiers?.(accepted.external_id)) || null;
                } catch {
                  ids = null;
                }
                identifierCache.set(accepted.external_id, ids);
              }
              const rowEan = normalizeEan(ids?.ean);
              if (rowEan) {
                if (rowEan !== identityEan) {
                  eanRejected++;
                  continue;
                }
                accepted = { ...accepted, ean: ids.ean, mpn: accepted.mpn || ids.mpn || null };
                result = { ...result, method: "ean", score: 1, reason: "ean_kontrollerad" };
                eanConfirmed++;
              }
            }

            /* Lär katalogen produktens identifierare.

               Det här är den verkliga utdelningen. Affiliateflödena bär
               både EAN och MPN, så när de kopplas in avgörs matchningen av
               hur många av de 455 produkterna som har en identifierare.
               Varje träff hos Webhallen är ett tillfälle att fylla i en.

               EAN OCH MPN, INTE BARA EAN

               Webhallens produkt-API svarar ofta med ean: null men med ett
               ifyllt partNumber. Första versionen sparade bara EAN och
               lärde sig därför ingenting: 35 träffar gav noll rader. MPN är
               nästan lika bra - matchOffer väger det till 0,95 mot EAN:s
               1,0 - och det är det som faktiskt finns att hämta.

               Sök-API:et svarar utan identifierare alls, så en träff måste
               slå upp produktsidan för att ha något att lära ut. En gång
               per produkt, inte per kandidatrad. */
            const needsIdentity = !identity?.ean && !identity?.mpn;
            if (needsIdentity && !enriched.has(item.id)) {
              enriched.add(item.id);
              idLookups++;
              try {
                const ids = await source.fetchIdentifiers?.(accepted.external_id);
                if (ids?.ean || ids?.mpn) {
                  accepted = {
                    ...accepted,
                    ean: accepted.ean || ids.ean || null,
                    mpn: accepted.mpn || ids.mpn || null,
                  };
                  const learned = {
                    item_id: item.id,
                    ean: accepted.ean,
                    mpn: accepted.mpn,
                    brand: identity?.brand || ids.brand || null,
                    model: identity?.model || null,
                  };
                  await store.upsertIdentity(learned);
                  identities.set(item.id, { ...(identity || {}), ...learned });
                  idLearned++;
                }
              } catch {
                // Produktsidan svarade inte, eller gick inte att spara.
                // Priset gäller ändå - identiteten får vänta till nästa varv.
              }
            }

            if (!candidatesByItem.has(item.id)) candidatesByItem.set(item.id, []);
            candidatesByItem.get(item.id).push({
              ...accepted,
              match_method: result.method,
              match_score: result.score,
            });
            matched++;
          }
        } catch {
          // En enskild produkt som inte går att slå upp får inte stoppa körningen.
          failures++;
        }
      }),
    );

    if (onProgress) onProgress(Math.min(i + API_CONCURRENCY, items.length), items.length);
    if (API_BATCH_PAUSE_MS > 0) await sleep(API_BATCH_PAUSE_MS);
  }

  return { matched, failures, idLookups, eanRescued, idLearned, eanConfirmed, eanRejected };
};

/**
 * Kör en full uppdatering av alla katalogprodukter.
 * Returnerar en sammanfattning; kastar bara om ingenting alls gick att göra.
 */
export const runRefresh = async (
  items,
  { reason = "manual", logger = null, apiItems = null } = {},
) => {
  const started = Date.now();
  const log = (level, event, payload = {}) => logger?.(level, event, { reason, ...payload });

  await store.setRefreshState({
    last_run_at: new Date().toISOString(),
    last_status: "running",
    items_total: items.length,
  });

  const identities = await store.loadIdentities();

  /*
   * Katalogens eget EAN gäller när identitetsraden saknar ett.
   *
   * matchOffer läser numret ur identiteten, aldrig ur katalogposten.
   * component_identity innehöll 86 EAN medan katalogfilerna bredvid bar
   * 6 423 - matchningen kände alltså inte till numret för sextusen varor
   * som har det. Ett EAN är hela skillnaden mellan att veta och att
   * gissa, och de låg oanvända.
   *
   * Identitetsraden vinner när den har ett nummer: den är handkontrollerad
   * och kan vara en rättelse av just det katalogen säger.
   */
  let eanFranKatalogen = 0;
  for (const item of items) {
    if (!item.ean) continue;
    const identity = identities.get(item.id);
    if (identity?.ean) continue;
    identities.set(item.id, { ...(identity || { item_id: item.id }), ean: item.ean });
    eanFranKatalogen++;
  }
  log("info", "pricing_identities_loaded", {
    identities: identities.size,
    ean_from_catalog: eanFranKatalogen,
  });

  const candidatesByItem = new Map();
  const sourceResults = [];

  // 1. Affiliateflöden - läses en gång var och matchas mot hela katalogen.
  for (const config of getFeedConfigs()) {
    try {
      const stats = await ingestFeed(config, items, identities, candidatesByItem);
      sourceResults.push({ id: config.id, ok: true, ...stats });
      await store.markSourceResult(config.id, { ok: true, rowCount: stats.accepted });
      log("info", "pricing_feed_ingested", { source: config.id, ...stats });
    } catch (error) {
      const message = error instanceof Error ? error.message : "okänt fel";
      sourceResults.push({ id: config.id, ok: false, error: message });
      await store.markSourceResult(config.id, { ok: false, error: message });
      log("warn", "pricing_feed_failed", { source: config.id, message });
    }
  }

  // 2. Sök-API:er utan affiliatekrav.
  if (process.env.PRICING_DISABLE_WEBHALLEN !== "1") {
    try {
      /*
       * Sök-API:erna söker en gång per post i apiItems.
       *
       * Det är hela katalogen sedan oktober 2026: utan det hade bara de
       * handplockade posterna någonsin mer än en butik. Det blir
       * tusentals anrop per körning mot någon annans server, så de går
       * tre i taget med paus emellan, och withRetry backar vid 429.
       */
      const stats = await ingestApiSource(
        webhallen,
        apiItems || items,
        identities,
        candidatesByItem,
      );
      sourceResults.push({ id: webhallen.id, ok: true, ...stats });
      await store.markSourceResult(webhallen.id, { ok: true, rowCount: stats.matched });
      log("info", "pricing_api_ingested", { source: webhallen.id, ...stats });
    } catch (error) {
      const message = error instanceof Error ? error.message : "okänt fel";
      sourceResults.push({ id: webhallen.id, ok: false, error: message });
      await store.markSourceResult(webhallen.id, { ok: false, error: message });
      log("warn", "pricing_api_failed", { source: webhallen.id, message });
    }
  }

  /*
   * 3. Skriv ned bästa erbjudandet per butik och produkt.
   *
   * En butik får bara städas bort från en vara om dess källa kördes utan
   * fel OCH faktiskt frågades om varan. Flödena läses mot hela katalogen;
   * Webhallen söks bara för apiItems. En källa som inte kördes säger
   * ingenting om huruvida butiken har varan, och dess rader står kvar.
   *
   * Varor utan någon träff alls gås också igenom, men bara de som redan
   * har rader från en frågad butik. Annars stod en felmatchning kvar för
   * evigt när matchningen rättats: ingen ny träff, alltså ingen skrivning,
   * alltså ingen städning.
   */
  const feedStoresOk = sourceResults
    .filter((result) => result.ok && result.id !== webhallen.id && (result.accepted ?? 0) > 0)
    .map((result) => result.id);
  const webhallenOk = sourceResults.some((result) => result.id === webhallen.id && result.ok);
  const apiItemIds = new Set((apiItems || items).map((item) => item.id));
  const managedStoresFor = (itemId) =>
    webhallenOk && apiItemIds.has(itemId) ? [...feedStoresOk, webhallen.id] : feedStoresOk;

  const existing =
    feedStoresOk.length > 0 || webhallenOk
      ? await store.getOffersForItems(items.map((item) => item.id)).catch(() => new Map())
      : new Map();

  let itemsUpdated = 0;
  let offersWritten = 0;

  for (const item of items) {
    const candidates = candidatesByItem.get(item.id) || [];
    const managedStores = managedStoresFor(item.id);
    if (candidates.length === 0) {
      const stale = (existing.get(item.id) || []).some((row) => managedStores.includes(row.store_id));
      if (!stale) continue;
    }
    const best = pickBestPerStore(candidates);
    try {
      const { written } = await store.replaceOffersForItem(item.id, best, { managedStores });
      offersWritten += written;
      if (written > 0) itemsUpdated++;
    } catch (error) {
      log("warn", "pricing_write_failed", {
        item_id: item.id,
        message: error instanceof Error ? error.message : "okänt fel",
      });
    }
  }

  const durationMs = Date.now() - started;
  const anySourceOk = sourceResults.some((result) => result.ok);
  const status = !anySourceOk ? "failed" : itemsUpdated === items.length ? "ok" : "partial";

  await store.setRefreshState({
    last_status: status,
    last_success_at: anySourceOk ? new Date().toISOString() : undefined,
    items_total: items.length,
    items_updated: itemsUpdated,
    offers_written: offersWritten,
    duration_ms: durationMs,
    last_error: anySourceOk ? null : "Ingen priskälla svarade.",
  });

  log("info", "pricing_refresh_completed", {
    status,
    items_total: items.length,
    items_updated: itemsUpdated,
    offers_written: offersWritten,
    duration_ms: durationMs,
    sources: sourceResults.map((r) => `${r.id}:${r.ok ? "ok" : "fel"}`).join(","),
  });

  return { status, itemsUpdated, offersWritten, durationMs, sources: sourceResults };
};

/**
 * Avgör om en uppdatering behövs.
 *
 * Bygger på tidsstämpeln i databasen, inte på processens minne - det är hela
 * poängen med omskrivningen.
 */
export const isRefreshDue = async () => {
  const state = await store.getRefreshState().catch(() => null);
  if (!state?.last_success_at) return true;

  const last = new Date(state.last_success_at).getTime();
  if (!Number.isFinite(last)) return true;

  // En körning som fastnat i "running" ska inte blockera för evigt.
  if (state.last_status === "running") {
    const startedAt = new Date(state.last_run_at || 0).getTime();
    if (Number.isFinite(startedAt) && Date.now() - startedAt > 2 * 60 * 60 * 1000) return true;
    return false;
  }

  return Date.now() - last >= REFRESH_INTERVAL_MS;
};

/**
 * Startar schemaläggaren.
 *
 * Kör en gång kort efter start om det behövs, och kollar sedan en gång i
 * timmen. Ingen unref() - timern ska hålla igång även om servern annars
 * är sysslolös.
 */
export const startScheduler = (getItems, { logger = null, apiItems = null } = {}) => {
  let running = false;

  const tick = async (reason) => {
    if (running) return;
    try {
      if (!(await isRefreshDue())) return;
      running = true;
      await runRefresh(getItems(), {
        reason,
        logger,
        /* Listan hämtas vid körning, inte vid start - katalogen läses in
           en gång men anropsformen är densamma som för getItems. */
        apiItems: typeof apiItems === "function" ? apiItems() : apiItems,
      });
    } catch (error) {
      logger?.("warn", "pricing_scheduler_failed", {
        reason,
        message: error instanceof Error ? error.message : "okänt fel",
      });
    } finally {
      running = false;
    }
  };

  // Vänta in att servern kommit igång innan första körningen.
  const startupDelay = Math.max(0, Number(process.env.PRICING_STARTUP_DELAY_MS || 15_000));
  setTimeout(() => void tick("startup"), startupDelay);

  const timer = setInterval(() => void tick("interval"), 60 * 60 * 1000);
  return () => clearInterval(timer);
};
