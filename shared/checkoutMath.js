/**
 * Räkningen i kassan.
 *
 * Funktionerna här låg tidigare inuti /api/create-checkout-session och
 * handleSuccessfulPayment, mitt bland anrop till Stripe och Supabase.
 * Det gjorde dem omöjliga att pröva utan att starta en server och göra
 * ett riktigt köp - och det här är koden som bestämmer vad kunden
 * betalar.
 *
 * Inget här rör nätverket eller databasen. In går siffror, ut kommer
 * siffror, och tests/checkout.test.mjs prövar dem.
 */

/** Högsta antal rader i en order. */
import {
  cleanConfiguration,
  describeConfiguration,
  findBaseConfig,
  priceConfiguration,
} from "./upgradePricing.js";

export const MAX_LINE_ITEMS = 50;

/** Högsta antal av samma produkt i en rad. */
export const MAX_QUANTITY = 10;

/** Frakt med PostNord till ombud, i ören. */
export const SHIPPING_COST_CENTS = 31500;

/**
 * Antalet, klämt till ett rimligt intervall.
 *
 * Noll, negativa tal, text och NaN blir ett. Att låta noll passera hade
 * gett en orderrad utan innehåll, och ett negativt antal hade dragit
 * ifrån summan - alltså en rabatt kunden satt själv.
 */
export const normalizeQuantity = (value) =>
  Math.min(MAX_QUANTITY, Math.max(1, Number(value) || 1));

/**
 * Är fraktavgift med?
 *
 * Allt annat än postnord räknas som upphämtning. Ett okänt värde ska bli
 * det billigare alternativet: tar vi betalt för frakt kunden inte bett
 * om är det vi som har fel, och det märks först på kvittot.
 */
export const requiresShipping = (shippingMethod) => shippingMethod === "postnord";

/**
 * Raderna Stripe ska ta betalt för.
 *
 * Kastar hellre än att gissa när ett pris saknas eller är noll. En
 * produkt utan pris är ett fel i katalogen, och att tyst sätta den till
 * noll hade gett bort en dator.
 *
 * Har kunden valt ett annat utförande (mer minne, större disk, annat
 * grafikkort) räknas tillägget här, ur pristabellen som gäller just nu -
 * aldrig ur ett pris som skickats från webbläsaren. Är valet inte
 * tillåtet för datorn kastas INVALID_CONFIGURATION, så köpet stoppas i
 * stället för att debiteras fel. Utförandet står i radens namn, så det
 * syns på betalsidan och kvittot, och följer med i metadata till ordern.
 */
export const buildCartLineItems = (cartItems, upgradePricing = null) => {
  const items = Array.isArray(cartItems) ? cartItems : [];
  if (items.length > MAX_LINE_ITEMS) {
    const error = new Error("Too many items in cart");
    error.code = "TOO_MANY_ITEMS";
    throw error;
  }

  return items.map((item) => {
    const quantity = normalizeQuantity(item?.quantity);
    const baseAmount = Number(item?.product?.price_cents || 0);
    if (!baseAmount || baseAmount < 1) {
      const error = new Error("Invalid product price");
      error.code = "INVALID_PRICE";
      throw error;
    }

    const product = item?.product || {};
    const baseConfig = findBaseConfig(product.name, product.slug, product.legacy_id);
    const configuration = cleanConfiguration(baseConfig, item?.configuration);
    const extraKronor = configuration ? priceConfiguration(baseConfig, configuration, upgradePricing) : 0;
    if (extraKronor === null) {
      const error = new Error("Invalid configuration");
      error.code = "INVALID_CONFIGURATION";
      throw error;
    }
    const unitAmount = baseAmount + extraKronor * 100;
    if (unitAmount < 1) {
      const error = new Error("Invalid product price");
      error.code = "INVALID_PRICE";
      throw error;
    }
    const description = configuration
      ? describeConfiguration(baseConfig, configuration, upgradePricing)
      : "";

    return {
      price_data: {
        currency: "sek",
        product_data: {
          name: description ? `${product.name || "Produkt"} · ${description}` : product.name || "Produkt",
          metadata: {
            product_id: product.id || "",
            ...(configuration ? { configuration: JSON.stringify(configuration) } : {}),
          },
        },
        unit_amount: unitAmount,
      },
      quantity,
    };
  });
};

/*
 * Frakt när den valts. Det är den enda avgiften.
 *
 * Här låg också en serviceavgift på 5 kr per order. Den togs bort i
 * oktober 2026: ett belopp så litet säger inget om tjänsten, bara att
 * butiken lägger på något, och det syntes på varje kvitto.
 */
export const buildFeeLineItems = (shippingMethod) => {
  const fees = [];
  if (requiresShipping(shippingMethod)) {
    fees.push({
      price_data: {
        currency: "sek",
        product_data: { name: "Frakt med PostNord till ombud" },
        unit_amount: SHIPPING_COST_CENTS,
      },
      quantity: 1,
    });
  }
  return fees;
};

/** Summan av rader, i ören. */
export const sumLineItems = (lineItems) =>
  (lineItems || []).reduce(
    (total, item) =>
      total + Number(item?.price_data?.unit_amount || 0) * normalizeQuantity(item?.quantity),
    0,
  );

/**
 * Vad kunden ska betala totalt.
 *
 * Används för att jämföra mot beloppet Stripe rapporterar tillbaka. Går
 * de isär har något ändrats mellan kassan och betalningen, och då är det
 * Stripes siffra som gäller - pengarna är redan dragna.
 */
export const expectedTotalCents = (cartItems, shippingMethod) =>
  sumLineItems(buildCartLineItems(cartItems)) + sumLineItems(buildFeeLineItems(shippingMethod));
