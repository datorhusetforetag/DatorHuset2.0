/**
 * Publikt gränssnitt mot prissystemet.
 *
 * Svarsformerna är avsiktligt identiska med de gamla endpointsen, så att
 * CustomBuild.tsx inte behöver ändras: /api/custom-build/catalog-prices och
 * /api/custom-build/catalog-offers ser likadana ut utifrån.
 */

import * as store from "./store.mjs";
import { runRefresh, startScheduler, isRefreshDue, REFRESH_INTERVAL_MS } from "./refresh.mjs";

export { store, runRefresh, startScheduler, isRefreshDue, REFRESH_INTERVAL_MS };

const centsToKronor = (cents) =>
  Number.isFinite(cents) && cents > 0 ? Math.round(cents / 100) : null;

/** Databasrad till det erbjudandeformat frontend redan förstår. */
const toOfferShape = (row) => ({
  store: row.store_name || row.store_id,
  store_id: row.store_id,
  price: centsToKronor(row.price_cents),
  currency: row.currency || "SEK",
  shipping_price: centsToKronor(row.shipping_cents),
  total_price: centsToKronor(row.total_cents ?? row.price_cents),
  product_url: row.product_url,
  availability: row.availability,
  status: row.availability === "out_of_stock" ? "unavailable" : "available",
  image_url: row.image_url || null,
  updated_at: row.seen_at || null,
});

const lowestFrom = (offers) => {
  const values = offers
    .filter((offer) => offer.status === "available")
    .map((offer) => offer.total_price ?? offer.price)
    .filter((value) => Number.isFinite(value) && value > 0);
  return values.length > 0 ? Math.min(...values) : null;
};

/**
 * Priser för en hel kategori.
 * Ett anrop till databasen för alla produkter, inte ett per produkt.
 */
export const buildCategoryPriceResponse = async (category, items) => {
  const itemIds = items.map((item) => item.id);
  const grouped = await store.getOffersForItems(itemIds);

  const prices = items.map((item) => {
    const rows = grouped.get(item.id) || [];
    const offers = rows.map(toOfferShape);
    const lowest = lowestFrom(offers);
    const newest = rows.reduce(
      (latest, row) => (row.seen_at && row.seen_at > latest ? row.seen_at : latest),
      "",
    );

    return {
      item_id: item.id,
      lowest_price: lowest ?? (Number.isFinite(item.price) ? item.price : null),
      updated_at: newest || null,
      image_url: rows.find((row) => row.image_url)?.image_url || null,
      // "live-offer" = riktigt butikspris, "fallback" = katalogens listpris.
      price_source: lowest ? "live-offer" : Number.isFinite(item.price) ? "fallback" : null,
    };
  });

  return {
    ok: true,
    category,
    updated_at: new Date().toISOString(),
    prices,
  };
};

/** Alla butikspriser för en enskild produkt. */
export const buildItemOffersResponse = async (item) => {
  const rows = await store.getOffersForItem(item.id);
  const offers = rows.map(toOfferShape);
  const lowest = lowestFrom(offers);
  const newest = rows.reduce(
    (latest, row) => (row.seen_at && row.seen_at > latest ? row.seen_at : latest),
    "",
  );

  return {
    ok: true,
    item_id: item.id,
    updated_at: newest || null,
    next_refresh_at: newest
      ? new Date(new Date(newest).getTime() + REFRESH_INTERVAL_MS).toISOString()
      : null,
    lowest_price: lowest ?? (Number.isFinite(item.price) ? item.price : null),
    image_url: rows.find((row) => row.image_url)?.image_url || null,
    offers,
    // Tomt men utan fel betyder "inga källor gav träff", inte "trasigt".
    source: offers.length > 0 ? "affiliate-feeds" : "none",
  };
};

/** Statusrad för adminvyn - vad som hänt och när. */
export const getPricingStatus = async () => {
  const [state, sources] = await Promise.all([
    store.getRefreshState().catch(() => null),
    store.getEnabledSources().catch(() => []),
  ]);

  const lastSuccess = state?.last_success_at ? new Date(state.last_success_at).getTime() : null;
  const ageMs = lastSuccess ? Date.now() - lastSuccess : null;

  return {
    ok: true,
    configured: store.isConfigured(),
    last_run_at: state?.last_run_at || null,
    last_success_at: state?.last_success_at || null,
    last_status: state?.last_status || null,
    age_hours: ageMs === null ? null : Math.round(ageMs / 3600000),
    stale: ageMs === null ? true : ageMs > REFRESH_INTERVAL_MS,
    items_total: state?.items_total ?? 0,
    items_updated: state?.items_updated ?? 0,
    offers_written: state?.offers_written ?? 0,
    last_error: state?.last_error || null,
    sources: sources.map((source) => ({
      id: source.id,
      label: source.label,
      network: source.network,
      kind: source.kind,
      last_ok_at: source.last_ok_at,
      last_error: source.last_error,
      last_row_count: source.last_row_count,
    })),
  };
};
