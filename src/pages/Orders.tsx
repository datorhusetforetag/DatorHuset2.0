import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { StatusScene, type StatusKey } from "@/components/orders/StatusScene";
import { PAGE_BANNERS } from "@/lib/pageBanners";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getUserOrders, requestOrderCancel } from "@/lib/supabaseServices";
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
  };
};

type Order = {
  id: string;
  order_number?: string | number | null;
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
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<Record<string, boolean>>({});
  const [cancelError, setCancelError] = useState<Record<string, string>>({});

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

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancelingOrderId(orderId);
      setCancelError((prev) => ({ ...prev, [orderId]: "" }));
      await requestOrderCancel(orderId);
      setCancelSuccess((prev) => ({ ...prev, [orderId]: true }));
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "cancel_requested" } : order
        )
      );
    } catch (error) {
      setCancelError((prev) => ({
        ...prev,
        [orderId]:
          error instanceof Error
            ? error.message
            : "Kunde inte skicka avbokningsförfrågan.",
      }));
    } finally {
      setCancelingOrderId(null);
    }
  };



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
              const canCancel =
                stage === 1 &&
                ["received", "ordering", "pending"].includes(rawStatus) &&
                !cancelSuccess[order.id] &&
                rawStatus !== "cancel_requested";
              const orderDate = order.created_at
                ? new Date(order.created_at).toLocaleDateString("sv-SE")
                : "Okänt datum";
              const total = typeof order.total_cents === "number" ? order.total_cents / 100 : 0;
              const items = order.order_items || [];
              const orderNumber =
                order.order_number === null || order.order_number === undefined || order.order_number === ""
                  ? order.id.slice(0, 8)
                  : String(order.order_number);

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
                  className="rounded-2xl border border-foreground/10 bg-background/70 p-6"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        Order #{orderNumber}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">Beställd {orderDate}</p>
                    </div>
                    <p className="font-display text-xl font-bold tabular-nums">
                      {total.toLocaleString("sv-SE")} kr
                    </p>
                  </div>

                  {/* Statusen som en scen, i full bredd.

                      Den låg som en liten rund etikett i hörnet och en rad
                      med sex chips längre ned - samma sak sagd två gånger,
                      ingen av dem särskilt tydlig. Nu är det ett band över
                      hela kortet: stapeln visar hur långt bygget kommit och
                      det som rör sig säger vad som händer just nu. */}
                  <div className="mt-5">
                    <StatusScene
                      status={(statusInfo.value || "received") as StatusKey}
                      label={statusInfo.label}
                    />
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {statusInfo.description}
                      {statusInfo.eta ? ` Uppskattad tid kvar: ${statusInfo.eta}.` : ""}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                    <div className="rounded-xl border border-foreground/10 bg-background/60 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Produkt</p>
                      {items.length === 0 && (
                        <p className="text-sm text-muted-foreground">Inga produkter kopplade till ordern.</p>
                      )}
                      <div className="space-y-4">
                        {items.map((item) => {
                          const itemTotal =
                            typeof item.product?.price_cents === "number"
                              ? ((item.product.price_cents * item.quantity) / 100).toLocaleString("sv-SE")
                              : "--";
                          const imageSrc = resolveProductImage(item.product);
                          return (
                            <div
                              key={item.id}
                              className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-foreground/10 bg-white/80 dark:bg-background/70 p-4"
                            >
                              <div className="h-24 w-full sm:h-24 sm:w-40 lg:h-28 lg:w-44 flex-shrink-0 overflow-hidden rounded-xl bg-foreground/[0.08] dark:bg-foreground/[0.06]">
                                {imageSrc ? (
                                  <img
                                    src={imageSrc}
                                    alt={item.product?.name || "Produkt"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                    Bild
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-base font-semibold text-foreground">
                                  {item.product?.name || "Produkt"}
                                </p>
                                <p className="text-sm text-muted-foreground">Antal: {item.quantity}</p>
                              </div>
                              <div className="text-base font-semibold text-foreground sm:ml-auto">
                                {itemTotal} kr
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-foreground/10 bg-background/70 dark:bg-background/70 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
                        Leverans
                      </p>

                      {showTracking && (
                        <div className="mt-4 rounded-lg border border-foreground/10 bg-background/60 p-4">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-primary" />
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                              Spårning
                            </p>
                          </div>
                          {carrierLabel && (
                            <p className="mt-2 text-sm text-muted-foreground">{carrierLabel}</p>
                          )}
                          {order.tracking_number && (
                            <p className="mt-1 font-mono text-sm text-foreground break-all">
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
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
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

                  {(canCancel || cancelSuccess[order.id] || cancelError[order.id]) && (
                    <div className="mt-4 rounded-lg border border-foreground/10 bg-background/60 px-4 py-3 text-sm">
                      {cancelSuccess[order.id] ? (
                        <p className="text-emerald-600">
                          Avbokningsförfrågan skickad. Vi återkommer via e-post.
                        </p>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-muted-foreground">
                            Du kan avbryta ordern innan produktionen har startat.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancelingOrderId === order.id}
                            className="inline-flex items-center justify-center rounded-lg border border-red-400 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-60"
                          >
                            {cancelingOrderId === order.id ? "Skickar..." : "Avbryt order"}
                          </button>
                        </div>
                      )}
                      {cancelError[order.id] && (
                        <p className="mt-2 text-sm text-red-500">{cancelError[order.id]}</p>
                      )}
                    </div>
                  )}

                  {/* Gäller steget "Klar för leverans" - det är då vi ringer.
                      Efter det talar spårningspanelen för sig själv. */}
                  {rawStatus === "ready" && (
                    <div className="mt-4 rounded-lg border border-primary/40 bg-primary/10 text-foreground px-4 py-3 text-sm">
                      DatorHuset kontaktar dig om upphämtning och leverans. Vi ringer och skickar mejl.
                    </div>
                  )}
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
