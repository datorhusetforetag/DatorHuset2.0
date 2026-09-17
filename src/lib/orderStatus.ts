export type OrderStatusInfo = {
  value: string;
  label: string;
  eta: string;
  step: number;
  /** Kort rad som förklarar vad som faktiskt händer just nu. */
  description: string;
};

/**
 * Orderns väg från betalning till levererad dator.
 *
 * "ready" ligger kvar mellan post-bygg och frakt eftersom vi också lämnar ut
 * datorer på plats i Spånga - då är "ready" sista steget kunden ser, och
 * "shipped"/"delivered" hoppas över.
 */
export const ORDER_STATUS_FLOW: OrderStatusInfo[] = [
  {
    value: "received",
    label: "Betald",
    eta: "1-2 dagar",
    step: 1,
    description: "Betalningen är registrerad och ordern ligger i kö för bygge.",
  },
  {
    value: "building",
    label: "Bygger",
    eta: "1-3 dagar",
    step: 2,
    description: "Delarna är plockade och datorn monteras.",
  },
  {
    value: "postbuild",
    label: "Post-bygg",
    eta: "1-2 dagar",
    step: 3,
    description: "BIOS, drivrutiner, stresstest och genomgång innan packning.",
  },
  {
    value: "ready",
    label: "Klar för leverans",
    eta: "Kontakta kund",
    step: 4,
    description: "Datorn är klar och packad. Vi hör av oss om upphämtning eller frakt.",
  },
  {
    value: "shipped",
    label: "Skickad",
    eta: "1-3 dagar",
    step: 5,
    description: "Paketet är lämnat till fraktbolaget och går att spåra.",
  },
  {
    value: "delivered",
    label: "Levererad",
    eta: "Klart",
    step: 6,
    description: "Datorn är framme. Hör av dig om något inte stämmer.",
  },
];

const STATUS_ALIASES: Record<string, string> = {
  pending: "received",
  ordering: "received",
  paid: "received",
  in_progress: "building",
  finished: "ready",
  completed: "delivered",
  cancel_requested: "received",
};

export const getOrderStatusInfo = (status?: string) => {
  const normalized = status ? STATUS_ALIASES[status] || status : "received";
  return ORDER_STATUS_FLOW.find((item) => item.value === normalized) || ORDER_STATUS_FLOW[0];
};

export const ORDER_STATUS_STEPS = ORDER_STATUS_FLOW.map((step) => step.label);

/** Statusar där ordern är ute hos fraktbolaget och spårning är relevant. */
export const SHIPPING_STATUSES = new Set(["shipped", "delivered"]);

export type OrderTracking = {
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
};

const CARRIER_TRACKING_URLS: Record<string, (code: string) => string> = {
  schenker: (code) => `https://www.dbschenker.com/app/tracking-public/?refNumber=${encodeURIComponent(code)}`,
  postnord: (code) => `https://www.postnord.se/vara-verktyg/spara-brev-paket-och-pall?id=${encodeURIComponent(code)}`,
  dhl: (code) => `https://www.dhl.com/se-sv/home/tracking.html?tracking-id=${encodeURIComponent(code)}`,
  budbee: (code) => `https://tracking.budbee.com/${encodeURIComponent(code)}`,
  instabox: (code) => `https://instabox.se/sv/spara?token=${encodeURIComponent(code)}`,
};

export const CARRIER_LABELS: Record<string, string> = {
  schenker: "DB Schenker",
  postnord: "PostNord",
  dhl: "DHL",
  budbee: "Budbee",
  instabox: "Instabox",
  other: "Annat fraktbolag",
};

/**
 * Bygger en spårningslänk. En url som satts för hand vinner alltid över den
 * uträknade - fraktbolagen byter adresser oftare än vi hinner släppa kod.
 */
export const resolveTrackingUrl = (tracking?: OrderTracking | null): string | null => {
  if (!tracking) return null;
  const explicit = tracking.trackingUrl?.trim();
  if (explicit) return explicit;

  const code = tracking.trackingNumber?.trim();
  if (!code) return null;

  const carrier = tracking.carrier?.trim().toLowerCase();
  if (!carrier) return null;

  const build = CARRIER_TRACKING_URLS[carrier];
  return build ? build(code) : null;
};
