import { normalizeProductKey } from "@/hooks/useProducts";

/**
 * Adressen till en produktsida.
 *
 * Länkarna pekade tidigare på produktens id: /computer/2, /computer/11,
 * och för produkter som bara finns i Supabase på hela dess UUID -
 * /computer/9f3c1a7e-4b28-4d55-9a11-2f6c8e0d7b41. Det säger ingenting
 * om vad man tittar på, går inte att läsa upp i telefon, ser ut som
 * spårningsparametrar när någon delar det, och ger sökmotorn noll
 * signal om sidans innehåll.
 *
 * Nu blir det /computer/silver-speedster.
 *
 * GAMLA LÄNKAR FORTSÄTTER FUNGERA. ComputerDetails slår upp värdet i
 * adressen i tur och ordning: id först, sedan namnets slug, sedan
 * Supabase-uppslaget (som sedan tidigare känner igen både slug och
 * namn). En länk någon sparat eller en sökmotor redan indexerat leder
 * alltså fortfarande rätt.
 */

type ProductLike = {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
};

/**
 * Slugen för en produkt.
 *
 * Namnet går före slug-fältet och id, eftersom namnet är det som står
 * på sidan. normalizeProductKey används och inte en egen variant - det
 * är samma funktion som produktuppslaget nycklar på, så en slug härifrån
 * hittar alltid tillbaka till rätt produkt.
 */
export const productSlug = (product: ProductLike): string => {
  const fromName = normalizeProductKey(product.name || "");
  if (fromName) return fromName;

  const fromSlug = normalizeProductKey(product.slug || "");
  if (fromSlug) return fromSlug;

  return String(product.id || "").trim();
};

/** Sökvägen till produktsidan, redo att lämnas till <Link to>. */
export const productPath = (product: ProductLike): string => {
  const slug = productSlug(product);
  return slug ? `/computer/${slug}` : "/products";
};
