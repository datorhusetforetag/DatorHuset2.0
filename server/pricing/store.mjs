/**
 * Läsning och skrivning av priser mot Supabase.
 *
 * Skrivning sker alltid med service-rollen. Går Supabase inte att nå faller
 * modulen tillbaka på en cache i minnet så att custom build-sidan visar
 * gamla priser i stället för tomma rutor - ett gammalt pris med synligt
 * datum är mer användbart för kunden än ingen uppgift alls.
 */

const REFRESH_KEY = "component-offers";

/** Senast kända priser per item_id, som skydd när databasen tappar kontakt. */
const memoryCache = new Map();

let client = null;

export const configure = (supabaseClient) => {
  client = supabaseClient || null;
};

export const isConfigured = () => Boolean(client);

// ------------------------------------------------------------------ identitet

export const loadIdentities = async () => {
  if (!client) return new Map();
  const { data, error } = await client
    .from("component_identity")
    .select("item_id, ean, mpn, brand, model, match_tokens, reject_tokens, verified");

  if (error) {
    // Saknas tabellen har migrationen inte körts. Matchningen faller då
    // tillbaka på token som härleds ur produktnamnet.
    if (error.code === "42P01" || error.code === "PGRST205") return new Map();
    throw error;
  }
  return new Map((data || []).map((row) => [row.item_id, row]));
};

export const upsertIdentity = async (identity) => {
  if (!client) return null;
  const { data, error } = await client
    .from("component_identity")
    .upsert({ ...identity, updated_at: new Date().toISOString() }, { onConflict: "item_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ---------------------------------------------------------------- erbjudanden

/**
 * Skriver erbjudanden för en produkt och tar bort butiker som inte längre
 * har varan. Utan den städningen ligger gamla priser kvar och visas som
 * "lägsta pris" långt efter att butiken slutat sälja produkten.
 */
export const replaceOffersForItem = async (itemId, offers) => {
  memoryCache.set(itemId, { offers, seenAt: Date.now() });
  if (!client) return { written: offers.length, removed: 0 };

  const now = new Date().toISOString();
  const rows = offers.map((offer) => ({
    item_id: itemId,
    store_id: offer.store_id,
    store_name: offer.store_name,
    price_cents: offer.price_cents,
    shipping_cents: offer.shipping_cents ?? null,
    total_cents: offer.total_cents ?? offer.price_cents,
    currency: offer.currency || "SEK",
    availability: offer.availability || "unknown",
    stock_count: offer.stock_count ?? null,
    product_url: offer.product_url,
    image_url: offer.image_url ?? null,
    ean: offer.ean ?? null,
    mpn: offer.mpn ?? null,
    feed_title: offer.title ?? null,
    source: offer.source,
    match_method: offer.match_method || "token",
    match_score: offer.match_score ?? null,
    seen_at: now,
  }));

  if (rows.length > 0) {
    const { error } = await client
      .from("component_offers")
      .upsert(rows, { onConflict: "item_id,store_id" });
    if (error) throw error;
  }

  // Ta bort butiker som inte fanns med i den här körningen.
  const keptStores = rows.map((row) => row.store_id);
  let removed = 0;
  const deleteQuery = client.from("component_offers").delete().eq("item_id", itemId);
  const { error: deleteError, count } =
    keptStores.length > 0
      ? await deleteQuery.not("store_id", "in", `(${keptStores.join(",")})`)
      : await deleteQuery;
  if (!deleteError && Number.isFinite(count)) removed = count;

  return { written: rows.length, removed };
};

export const getOffersForItem = async (itemId) => {
  if (!client) return memoryCache.get(itemId)?.offers || [];
  const { data, error } = await client
    .from("component_offers")
    .select("*")
    .eq("item_id", itemId)
    .order("total_cents", { ascending: true });

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    // Databasen svarar inte - visa det vi senast såg hellre än ingenting.
    return memoryCache.get(itemId)?.offers || [];
  }
  return data || [];
};

export const getOffersForItems = async (itemIds) => {
  if (!Array.isArray(itemIds) || itemIds.length === 0) return new Map();
  if (!client) {
    return new Map(itemIds.map((id) => [id, memoryCache.get(id)?.offers || []]));
  }

  const { data, error } = await client
    .from("component_offers")
    .select("*")
    .in("item_id", itemIds)
    .order("total_cents", { ascending: true });

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return new Map();
    return new Map(itemIds.map((id) => [id, memoryCache.get(id)?.offers || []]));
  }

  const grouped = new Map();
  for (const row of data || []) {
    if (!grouped.has(row.item_id)) grouped.set(row.item_id, []);
    grouped.get(row.item_id).push(row);
  }
  return grouped;
};

// ------------------------------------------------------------- schemaläggning

export const getRefreshState = async () => {
  if (!client) return null;
  const { data, error } = await client
    .from("pricing_refresh_state")
    .select("*")
    .eq("key", REFRESH_KEY)
    .maybeSingle();
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return null;
    throw error;
  }
  return data;
};

export const setRefreshState = async (patch) => {
  if (!client) return null;
  const { data, error } = await client
    .from("pricing_refresh_state")
    .upsert(
      { key: REFRESH_KEY, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    )
    .select()
    .maybeSingle();
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return null;
    throw error;
  }
  return data;
};

export const getEnabledSources = async () => {
  if (!client) return [];
  const { data, error } = await client
    .from("pricing_sources")
    .select("*")
    .eq("enabled", true)
    .order("priority", { ascending: true });
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }
  return data || [];
};

export const markSourceResult = async (sourceId, { ok, rowCount = null, error = null }) => {
  if (!client) return;
  await client
    .from("pricing_sources")
    .update({
      last_ok_at: ok ? new Date().toISOString() : undefined,
      last_error: ok ? null : String(error || "okänt fel").slice(0, 500),
      last_row_count: rowCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sourceId);
};

export { REFRESH_KEY };
