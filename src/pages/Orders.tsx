import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { StatusScene, type StatusKey } from "@/components/orders/StatusScene";
import { PAGE_BANNERS } from "@/lib/pageBanners";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getUserOrders } from "@/lib/supabaseServices";
import {
  CARRIER_LABELS,
  getOrderStatusInfo,
  resolveTrackingUrl,
} from "@/lib/orderStatus";
import { resolveProductImage } from "@/lib/productImageResolver";
import { ExternalLink, Package, ReceiptText, Truck } from "lucide-react";

type OrderItem = {
  id: string;
  quantity: number;
  product?: {
    id?: string;
    legacy_id?: string | number | null;
    slug?: string | null;
    name?: string;
    price_cents?: number;
    image_url?: string | null;
    cpu?: string | null;
    gpu?: string | null;
    ram?: string | null;
    storage?: string | null;
    storage_type?: string | null;
  };
};

type Order = {
  id: string;
  order_number?: string | number | null;
  /** DH-1004-K7M. Saknas på ordrar lagda före referenserna infördes. */
  order_reference?: string | null;
  created_at?: string;
  total_cents?: number;
  status?: string;
  order_items?: OrderItem[];
  receipt_url?: string;
  shipping_carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState("");


  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const loadOrders = async () => {
      try {
        setLoadingOrders(true);
        setOrderError("");
        const data = await getUserOrders(user.id);
        if (!isMounted) return;
        setOrders(data as Order[]);
      } catch (error) {
        if (!isMounted) return;
        setOrderError("Kunde inte hämta orderhistorik just nu.");
      } finally {
        if (isMounted) setLoadingOrders(false);
      }
    };
    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [user]);

  /* Utloggad: samma banderoll som inloggad, bara med ett annat
     erbjudande. Ett eget centrerat block hade sett ut som en annan
     sida, och det är det inte - det är samma sida utan nyckel. */
  if (!user) {
    return (
      <PageShell>
        <PageHero
          compact
          accent={PAGE_BANNERS.orders.accent}
          sandboxId="orders-hero"
          breadcrumb={[{ label: "Hem", href: "/" }, { label: "Mina beställningar" }]}
          eyebrow="Mina beställningar"
          title="Logga in för att se dina ordrar"
          lede="Ordrar, kvitton och byggstatus ligger i ditt konto."
          actions={
            <>
              <Link to="/account" className="btn-primary">
                Gå till konto
              </Link>
              <Link to="/products" className="btn-secondary">
                Se våra datorer
              </Link>
            </>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHero
        compact
        accent={PAGE_BANNERS.orders.accent}
        sandboxId="orders-hero"
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Mina beställningar" }]}
        eyebrow="Mina beställningar"
        title="Din orderöversikt"
        lede="Status, beräknad leverans och kvitton för allt du beställt."
      />

      <main className="container mx-auto px-4 pb-24 pt-10">
        <div className="space-y-6">
            {loadingOrders && (
              <p className="text-sm text-muted-foreground">Hämtar order...</p>
            )}
            {orderError && (
              <p className="text-sm text-red-500">{orderError}</p>
            )}
            {!loadingOrders && !orderError && orders.length === 0 && (
              <div className="rounded-2xl border border-foreground/10 bg-background/70 p-6 text-sm text-muted-foreground">
                Du har inga registrerade ordrar ännu.
              </div>
            )}

            {orders.map((order) => {
              const statusInfo = getOrderStatusInfo(order.status);
              const stage = statusInfo.step;
              const rawStatus = order.status || "received";
              /* Hänvisningen visas bara medan det fortfarande går att
                 ändra något. Är datorn byggd och packad är det för sent
                 att avbryta, och då vore raden ett falskt löfte. */
              const canCancel =
                stage === 1 &&
                ["received", "ordering", "pending"].includes(rawStatus);
              const orderDate = order.created_at
                ? new Date(order.created_at).toLocaleDateString("sv-SE")
                : "Okänt datum";
              const total = typeof order.total_cents === "number" ? order.total_cents / 100 : 0;
              const items = order.order_items || [];
              /* Referensen går före löpnumret. Gamla ordrar saknar den
                 och faller tillbaka på numret, så inget kort blir
                 tomt. */
              const orderNumber =
                order.order_reference ||
                (order.order_number === null ||
                order.order_number === undefined ||
                order.order_number === ""
                  ? order.id.slice(0, 8)
                  : String(order.order_number));

              const trackingUrl = resolveTrackingUrl({
                carrier: order.shipping_carrier,
                trackingNumber: order.tracking_number,
                trackingUrl: order.tracking_url,
              });
              const carrierLabel = order.shipping_carrier
                ? CARRIER_LABELS[order.shipping_carrier] || order.shipping_carrier
                : null;
              // Panelen visas så fort det finns ett spårningsnummer, även om
              // statusen inte hunnit bytas till "Skickad" ännu.
              const showTracking = Boolean(order.tracking_number || trackingUrl);

              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-foreground/10 bg-background/70"
                >
                  {/* Huvudet ligger på egen yta, avskilt med en linje.
                      Ordernumret är det man letar efter när man ringer,
                      så det står störst och i monospace - bokstäver och
                      siffror blandade blir lättare att läsa upp när de
                      har samma bredd. */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-foreground/10 bg-foreground/[0.02] px-6 py-4">
                    <div>
                      <p className="font-mono text-base font-bold tracking-tight text-foreground">
                        {orderNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Beställd {orderDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Totalt
                      </p>
                      <p className="font-display text-lg font-bold tabular-nums text-foreground">
                        {total.toLocaleString("sv-SE")} kr
                      </p>
                    </div>
                  </div>

                  <div className="px-6 py-5">

                  {/* Statusen som en scen, i full bredd.

                      Den låg som en liten rund etikett i hörnet och en rad
                      med sex chips längre ned - samma sak sagd två gånger,
                      ingen av dem särskilt tydlig. Nu är det ett band över
                      hela kortet: stapeln visar hur långt bygget kommit och
                      det som rör sig säger vad som händer just nu. */}
                  <div>
                    <StatusScene
                      status={(statusInfo.value || "received") as StatusKey}
                      label={statusInfo.label}
                    />
                    {/* Bara beskrivningen. Tiden kvar var en gissning
                        som räknades ned oavsett vad som faktiskt hände,
                        och en uppskattning som inte stämmer är sämre än
                        ingen. */}
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {statusInfo.description}
                    </p>
                  </div>

                  {/* Det som köptes.

                      En dator är inte en rad i en kvittolista. Folk
                      handlar här en gång, och det de vill se när de
                      kommer tillbaka är maskinen de väntar på - inte en
                      miniatyr bredvid ett pris.

                      Därför stor bild och specifikationen bredvid. Vid
                      flera rader upprepas formen; det är ovanligt nog
                      att det inte är värt en egen, tätare vy. */}
                  <div className="mt-7 space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Det här byggde vi
                    </p>

                    {items.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Inga produkter kopplade till ordern.
                      </p>
                    )}

                    {items.map((item) => {
                      const product = item.product;
                      const itemTotal =
                        typeof product?.price_cents === "number"
                          ? ((product.price_cents * item.quantity) / 100).toLocaleString("sv-SE")
                          : "--";
                      const imageSrc = resolveProductImage(product);
                      /* Bara det som faktiskt finns. En rad som säger
                         "Grafikkort: -" är sämre än ingen rad alls. */
                      const specs = [
                        { label: "Processor", value: product?.cpu },
                        { label: "Grafikkort", value: product?.gpu },
                        { label: "Minne", value: product?.ram },
                        {
                          label: "Lagring",
                          value: product?.storage
                            ? `${product.storage}${product.storage_type ? ` ${product.storage_type}` : ""}`
                            : null,
                        },
                      ].filter((row) => Boolean(row.value));

                      return (
                        <div
                          key={item.id}
                          className="overflow-hidden rounded-2xl border border-foreground/10"
                        >
                          <div className="grid gap-0 sm:grid-cols-[minmax(0,15rem)_1fr]">
                            {/* Bilden får stå i sitt eget fält och fylla
                                det. Tidigare låg den i en liten ruta med
                                luft runt, vilket fick datorn att se ut som
                                en ikon. */}
                            <div className="aspect-[4/3] w-full overflow-hidden bg-foreground/[0.06] sm:aspect-auto sm:h-full">
                              {imageSrc ? (
                                <img
                                  src={imageSrc}
                                  alt={product?.name || "Produkt"}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                  Ingen bild
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-4 p-5">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="font-display text-lg font-bold leading-tight text-foreground">
                                    {product?.name || "Produkt"}
                                  </p>
                                  {item.quantity > 1 && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {item.quantity} exemplar
                                    </p>
                                  )}
                                </div>
                                <p className="font-display text-lg font-bold tabular-nums text-foreground">
                                  {itemTotal} kr
                                </p>
                              </div>

                              {specs.length > 0 && (
                                <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                                  {specs.map((spec) => (
                                    <div key={spec.label}>
                                      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        {spec.label}
                                      </dt>
                                      <dd className="mt-0.5 text-sm font-medium leading-snug text-foreground">
                                        {spec.value}
                                      </dd>
                                    </div>
                                  ))}
                                </dl>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Spårningen står för sig, i full bredd och bara när
                      det finns något att spåra. En tom ruta som väntar på
                      ett nummer säger bara att något saknas. */}
                  {showTracking && (
                    <div className="mt-6 rounded-xl border border-primary/30 bg-primary/[0.06] p-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Truck className="h-4 w-4 text-primary" />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Spåra paketet
                        </p>
                        {carrierLabel && (
                          <span className="text-xs text-muted-foreground">· {carrierLabel}</span>
                        )}
                      </div>
                        {order.tracking_number && (
                          <p className="mt-2 break-all font-mono text-sm font-semibold text-foreground">
                            {order.tracking_number}
                          </p>
                        )}
                          {trackingUrl && (
                            <a
                              href={trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-secondary"
                            >
                              Följ paketet
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                      {order.delivered_at && (
                        <p className="mt-3 text-sm text-emerald-600">
                          Levererad {new Date(order.delivered_at).toLocaleDateString("sv-SE")}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 pt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <span>Vi uppdaterar statusen manuellt under bygget.</span>
                    </div>
                    {order.receipt_url ? (
                      <a
                        href={order.receipt_url}
                        className="inline-flex items-center gap-2 text-primary hover:text-secondary font-semibold"
                      >
                        <ReceiptText className="w-4 h-4" />
                        Visa kvitto
                      </a>
                    ) : (
                      <span>Kvitto skickas via e-post</span>
                    )}
                  </div>

                  {/* Avbrytknappen är borta.

                      Att avbryta en order betyder att pengar ska
                      tillbaka och att ett bygge ska stoppas, ofta mitt i.
                      Det är inget som ska gå på ett klick utan att någon
                      hos oss vet om det - vi hanterar det för hand i
                      portalen, där återbetalningen sker i samma steg. */}
                  {canCancel && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Behöver du ändra eller avbryta ordern?{" "}
                      <Link
                        to="/kundservice"
                        className="font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        Hör av dig till kundservice
                      </Link>{" "}
                      så löser vi det.
                    </p>
                  )}
                  {/* Gäller steget "Klar för leverans" - det är då vi ringer.
                      Efter det talar spårningspanelen för sig själv. */}
                  {rawStatus === "ready" && (
                    <div className="mt-4 rounded-lg border border-primary/40 bg-primary/10 text-foreground px-4 py-3 text-sm">
                      DatorHuset kontaktar dig om upphämtning och leverans. Vi ringer och skickar mejl.
                    </div>
                  )}
                  </div>
                </div>
              );
            })}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-foreground/10 bg-background/70 p-6 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Behov av hjälp?</p>
            <p className="mt-3">
              Har du frågor om leverans, uppgraderingar eller garanti? Kontakta oss så svarar vi snabbt.
            </p>
            <Link
              to="/kundservice"
              className="mt-4 inline-flex items-center justify-center gap-2 border border-primary text-primary dark:text-primary font-semibold px-4 py-2 rounded-lg hover:bg-secondary hover:border-secondary hover:text-white transition-colors"
            >
              Kontakta kundservice
            </Link>
          </div>

          <div className="rounded-2xl border border-foreground/10 bg-background/70 p-6 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Bra att veta</p>
            <ul className="mt-3 space-y-2">
              <li>Vi skickar mejl när bygget är klart.</li>
              <li>Byggtiden varierar beroende på komponenter.</li>
              <li>Du kan få kvitto via e-post eller under ordern.</li>
            </ul>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
