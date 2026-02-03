import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { getUserOrders, requestOrderCancel } from "@/lib/supabaseServices";
import { getOrderStatusInfo, ORDER_STATUS_STEPS } from "@/lib/orderStatus";
import { Clock, Package, ReceiptText } from "lucide-react";

type OrderItem = {
  id: string;
  quantity: number;
  product?: {
    name?: string;
    price_cents?: number;
    image_url?: string | null;
  };
};

type Order = {
  id: string;
  created_at?: string;
  total_cents?: number;
  status?: string;
  order_items?: OrderItem[];
  receipt_url?: string;
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



  if (!user) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 sm:pt-24 container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <h1 className="text-3xl font-bold">Logga in för att se dina beställningar</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Dina ordrar, kvitton och byggstatus finns i kontot.
            </p>
            <Link
              to="/account"
              className="inline-flex items-center justify-center px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded hover:bg-[#11667b] hover:text-white transition-colors"
            >
              Gå till konto
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 sm:pt-24 container mx-auto px-4 py-12">
        <div className="flex flex-col gap-3 mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Mina beställningar</p>
          <h1 className="text-3xl font-bold">Din orderöversikt</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Se status, ETA och kvitton för alla dina byggen.
          </p>
        </div>

        <div className="space-y-6">
            {loadingOrders && (
              <p className="text-sm text-gray-600 dark:text-gray-300">Hämtar order...</p>
            )}
            {orderError && (
              <p className="text-sm text-red-500">{orderError}</p>
            )}
            {!loadingOrders && !orderError && orders.length === 0 && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-sm text-gray-600 dark:text-gray-300">
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

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Order</p>
                      <p className="text-lg font-semibold mt-2">#{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Beställd: {orderDate}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center justify-center rounded-full border border-yellow-400 bg-yellow-400/15 px-3 py-1 text-xs font-semibold text-gray-900 dark:text-yellow-200">
                        {statusInfo.label}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">ETA: {statusInfo.eta}</p>
                      <p className="text-lg font-semibold mt-2">{total.toLocaleString("sv-SE")} kr</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#0f1824] p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 mb-3">Produkt</p>
                      {items.length === 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">Inga produkter kopplade till ordern.</p>
                      )}
                      <div className="space-y-4">
                        {items.map((item) => {
                          const itemTotal =
                            typeof item.product?.price_cents === "number"
                              ? ((item.product.price_cents * item.quantity) / 100).toLocaleString("sv-SE")
                              : "--";
                          return (
                            <div
                              key={item.id}
                              className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#101a27] p-4"
                            >
                              <div className="h-24 w-full sm:h-24 sm:w-40 lg:h-28 lg:w-44 flex-shrink-0 overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800">
                                {item.product?.image_url ? (
                                  <img
                                    src={item.product.image_url}
                                    alt={item.product?.name || "Produkt"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                                    Bild
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                  {item.product?.name || "Produkt"}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Antal: {item.quantity}</p>
                              </div>
                              <div className="text-base font-semibold text-gray-900 dark:text-gray-100 sm:ml-auto">
                                {itemTotal} kr
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#101a27] p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 mb-3">Status</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ORDER_STATUS_STEPS.map((label, index) => (
                          <span
                            key={label}
                            className={`inline-flex min-h-[34px] items-center justify-center rounded-full px-3 text-xs font-semibold border text-center ${
                              stage >= index + 1
                                ? "border-yellow-400 bg-yellow-400/20 text-gray-900 dark:text-yellow-200"
                                : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <Clock className="w-4 h-4 text-[#11667b]" />
                        <span>Uppskattad tid kvar: {statusInfo.eta}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#11667b]" />
                      <span>Vi uppdaterar statusen manuellt under bygget.</span>
                    </div>
                    {order.receipt_url ? (
                      <a
                        href={order.receipt_url}
                        className="inline-flex items-center gap-2 text-[#11667b] hover:text-[#0d4d5d] font-semibold"
                      >
                        <ReceiptText className="w-4 h-4" />
                        Visa kvitto
                      </a>
                    ) : (
                      <span>Kvitto skickas via e-post</span>
                    )}
                  </div>

                  {(canCancel || cancelSuccess[order.id] || cancelError[order.id]) && (
                    <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#0f1824] px-4 py-3 text-sm">
                      {cancelSuccess[order.id] ? (
                        <p className="text-emerald-600">
                          Avbokningsförfrågan skickad. Vi återkommer via e-post.
                        </p>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-gray-600 dark:text-gray-300">
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

                  {stage === ORDER_STATUS_STEPS.length && (
                    <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50/70 text-gray-900 px-4 py-3 text-sm">
                      DatorHuset kontaktar dig om upphämtning och leverans. Vi ringer och skickar mejl.
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-sm text-gray-600 dark:text-gray-300">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Behov av hjälp?</p>
            <p className="mt-3">
              Har du frågor om leverans, uppgraderingar eller garanti? Kontakta oss så svarar vi snabbt.
            </p>
            <Link
              to="/kundservice"
              className="mt-4 inline-flex items-center justify-center gap-2 border border-yellow-400 text-yellow-700 dark:text-yellow-300 font-semibold px-4 py-2 rounded-lg hover:bg-[#11667b] hover:border-[#11667b] hover:text-white transition-colors"
            >
              Kontakta kundservice
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-sm text-gray-600 dark:text-gray-300">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Bra att veta</p>
            <ul className="mt-3 space-y-2">
              <li>Vi skickar mejl vid varje statusändring.</li>
              <li>Byggtiden varierar beroende på komponenter.</li>
              <li>Du kan få kvitto via e-post eller under ordern.</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
