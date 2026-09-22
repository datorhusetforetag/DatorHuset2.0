/**
 * Formen på en listning, som adminportalen ser den.
 *
 * Fälten kommer från buildListingResponse i server-local.js. Typen är
 * skriven för vad portalen faktiskt läser, inte för hela raden - allt
 * som inte används här skulle bara bli något att hålla synkroniserat i
 * onödan.
 */

export type Listing = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  images: string[];
  price_cents: number;
  currency: string | null;

  cpu: string | null;
  gpu: string | null;
  ram: string | null;
  storage: string | null;
  storage_type: string | null;
  motherboard: string | null;
  psu: string | null;
  case_name: string | null;
  cpu_cooler: string | null;
  os: string | null;

  tier: string | null;
  tags: string[];
  use: "gaming" | "workstation" | null;

  quantity_in_stock: number;
  is_preorder: boolean;
  eta_days: number | null;
  eta_note: string | null;

  /* Begagnatvarianten.

     En maskin kan säljas i två skick: nybyggd och begagnad. De ligger
     som två rader i databasen och pekar på varandra, med variant_role
     som säger vilken som är vilken. Adminportalen visar dem ihop -
     två identiska namn bredvid varandra i listan ser ut som ett
     misstag, inte som ett val. */
  variant_role: "base" | "used" | null;
  linked_product_id: string | null;

  sort_order: number | null;
  archived_at: string | null;
  updated_at: string | null;
};

export const READY = "ready" as const;
export const SOLD_OUT = "sold_out" as const;
export const PREORDER = "preorder" as const;
export const ARCHIVED = "archived" as const;
export type ListingGroup =
  | typeof READY
  | typeof SOLD_OUT
  | typeof PREORDER
  | typeof ARCHIVED;

/**
 * Vilken grupp en listning hör till.
 *
 * Ordningen på villkoren är själva flödet:
 *
 *   1. Arkiverad  - borttagen från butiken, ligger i Arkiv slutsålda.
 *   2. Förbeställning - byggs på beställning, saldot är inte relevant.
 *   3. Slutsåld   - skulle skickas direkt, men lagret är tomt. Syns
 *                   fortfarande i butiken med texten Slutsåld tills
 *                   någon väljer att ta bort den.
 *   4. Redo att skickas - finns på hyllan.
 *
 * Arkiv går först. En borttagen listning ska inte dyka upp bland de
 * säljbara bara för att den råkar ha saldo kvar.
 *
 * Förbeställning går före slutsåld. En maskin som byggs på beställning
 * har inget lager att ta slut, så noll betyder ingenting där.
 */
export const groupOf = (listing: Listing): ListingGroup => {
  if (listing.archived_at) return ARCHIVED;
  if (listing.is_preorder) return PREORDER;
  return listing.quantity_in_stock <= 0 ? SOLD_OUT : READY;
};

/**
 * Vad raden säger om tillgängligheten.
 *
 * "Slutsåld" och "förbeställning" är inte samma sak och ska inte se
 * likadana ut. Det första är ett problem att åtgärda, det andra är hur
 * maskinen är tänkt att säljas.
 */
export const statusOf = (listing: Listing) => {
  if (listing.archived_at) {
    return { label: "Borttagen", className: "bg-slate-800 text-slate-400" };
  }
  if (listing.is_preorder) {
    const eta = listing.eta_note?.trim() || (listing.eta_days ? `${listing.eta_days} dagar` : "");
    return {
      label: eta || "Förbeställning",
      className: "bg-violet-500/15 text-violet-200",
    };
  }
  if (listing.quantity_in_stock <= 0) {
    return { label: "Slutsåld", className: "bg-rose-500/15 text-rose-200" };
  }
  return {
    label: `${listing.quantity_in_stock} i lager`,
    className: "bg-emerald-500/15 text-emerald-200",
  };
};

/** Priset i kronor, som kunden ser det. Ören lagras, kronor visas. */
export const formatPrice = (cents: number) =>
  `${Math.round((Number(cents) || 0) / 100).toLocaleString("sv-SE")} kr`;

/**
 * En tom listning.
 *
 * is_preorder är sant från start. De allra flesta maskiner byggs på
 * beställning, och en ny listning som råkar gå ut som "i lager" med
 * saldo noll blir en slutsåld produkt i butiken i samma stund den
 * skapas.
 */
export const emptyDraft = (): Listing => ({
  id: "",
  name: "",
  slug: null,
  description: null,
  image_url: null,
  images: [],
  price_cents: 0,
  currency: "SEK",
  cpu: "",
  gpu: "",
  ram: "",
  storage: "",
  storage_type: "SSD",
  motherboard: null,
  psu: null,
  case_name: null,
  cpu_cooler: null,
  os: null,
  tier: "Silver",
  tags: [],
  use: "gaming",
  quantity_in_stock: 0,
  is_preorder: true,
  eta_days: null,
  eta_note: null,
  variant_role: null,
  linked_product_id: null,
  sort_order: null,
  archived_at: null,
  updated_at: null,
});
