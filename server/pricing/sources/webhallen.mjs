/**
 * Webhallens egna sök-API.
 *
 * Den här källan kräver inget affiliatekonto och svarar med strukturerad JSON,
 * så den fungerar direkt. Den är tänkt som brygga medan affiliateansökningarna
 * behandlas, och som komplement efteråt.
 *
 * API:et returnerar inte EAN, så matchningen sker på modell-token. Det är
 * också därför reject_tokens behövs: sökningen returnerar gärna Webhallens
 * egna färdigbyggda datorer som innehåller komponentens namn.
 */

const SEARCH_URL = "https://www.webhallen.com/api/productdiscovery/search/";

const USER_AGENT =
  process.env.PRICING_USER_AGENT ||
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";

export const id = "webhallen";
export const label = "Webhallen";
export const kind = "api";

const parsePrice = (value) => {
  const numeric = Number.parseFloat(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Math.round(numeric * 100);
};

const resolveAvailability = (stock) => {
  if (!stock || typeof stock !== "object") return "unknown";
  const web = Number(stock.web);
  if (Number.isFinite(web) && web > 0) return "in_stock";
  if (stock.isTrue === false) return "out_of_stock";
  if (Number.isFinite(web) && web === 0) return "out_of_stock";
  return "unknown";
};

const resolveImage = (product) => {
  const image = product?.image;
  if (!image) return null;
  if (typeof image === "string") return image;
  const path = image.large || image.medium || image.thumb || image.url;
  if (!path) return null;
  return String(path).startsWith("http") ? String(path) : `https://www.webhallen.com${path}`;
};

/**
 * Lägger på affiliate-taggen om en sådan är konfigurerad.
 * Utan tagg returneras en ren produktlänk - aldrig en trasig sådan.
 */
const withAffiliate = (url) => {
  const tag = process.env.WEBHALLEN_AFFILIATE_PARAM;
  if (!tag || !url) return url;
  try {
    const parsed = new URL(url);
    const [key, value] = tag.split("=");
    if (key && value) parsed.searchParams.set(key, value);
    return parsed.toString();
  } catch {
    return url;
  }
};

/**
 * Söker på en fritextfråga och returnerar råa kandidatrader i det format
 * match.mjs förväntar sig. Filtrering och matchning sker där, inte här.
 */
export const search = async (query, { timeoutMs = 15000 } = {}) => {
  const url = `${SEARCH_URL}${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "sv-SE,sv;q=0.9",
      "User-Agent": USER_AGENT,
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const error = new Error(`Webhallen svarade ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const json = await response.json();
  const products = Array.isArray(json?.products) ? json.products : [];

  return products
    .map((product) => {
      const priceCents = parsePrice(product?.price?.price);
      if (priceCents === null) return null;

      const productUrl = `https://www.webhallen.com/se/product/${product.id}`;

      return {
        store_id: id,
        store_name: label,
        source: id,
        // Behövs för att kunna hämta produktsidan och därmed EAN.
        external_id: product.id,
        title: product.name || product.mainTitle || "",
        price_cents: priceCents,
        // Webhallen anger inte frakt per produkt i sök-API:et.
        shipping_cents: null,
        total_cents: priceCents,
        currency: product?.price?.currency || "SEK",
        availability: resolveAvailability(product.stock),
        stock_count: Number.isFinite(Number(product?.stock?.web))
          ? Number(product.stock.web)
          : null,
        product_url: withAffiliate(productUrl),
        image_url: resolveImage(product),
        ean: null,
        mpn: null,
        // Fyndware är Webhallens begagnat-/öppnad förpackning-sortiment.
        // Det ska aldrig räknas som nypris på en komponent.
        _isUsed: Boolean(product.isFyndware || product.fyndwareOf),
      };
    })
    .filter((row) => row !== null && !row._isUsed)
    .map(({ _isUsed, ...row }) => row);
};

/**
 * Hämtar en produkts identifierare från Webhallens produktsida.
 *
 * Sök-API:et returnerar inte EAN, men produkt-API:et gör det. Det är den
 * enda källan till riktiga EAN-koder vi har innan affiliateflödena är
 * godkända, och EAN är det som gör matchningen exakt i stället för gissad.
 */
export const fetchIdentifiers = async (productId, { timeoutMs = 15000 } = {}) => {
  const response = await fetch(`https://www.webhallen.com/api/product/${productId}`, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "sv-SE,sv;q=0.9",
      "User-Agent": USER_AGENT,
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const error = new Error(`Webhallen produkt ${productId} svarade ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const json = await response.json();
  const product = json?.product || json;

  const firstString = (value) => {
    if (Array.isArray(value)) return value.find((entry) => String(entry || "").trim()) || null;
    const text = String(value ?? "").trim();
    return text || null;
  };

  return {
    ean: firstString(product?.eans),
    mpn: firstString(product?.partNumbers),
    brand: firstString(product?.manufacturer?.name || product?.manufacturer),
    name: product?.name || null,
    discontinued: Boolean(product?.discontinued),
  };
};

export default { id, label, kind, search, fetchIdentifiers };
