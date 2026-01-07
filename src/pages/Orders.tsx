import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { getUserOrders } from "@/lib/supabaseServices";
import { getOrderStatusInfo, ORDER_STATUS_STEPS } from "@/lib/orderStatus";
import { Clock, Package, ReceiptText } from "lucide-react";

type OrderItem = {
  id: string;
  quantity: number;
  product?: {
    name?: string;
    price_cents?: number;
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
        setOrderError("Kunde inte hamta orderhistorik just nu.");
      } finally {
        if (isMounted) setLoadingOrders(false);
      }
    };
    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const orderStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalCents = orders.reduce((sum, order) => sum + (order.total_cents ?? 0), 0);
    const activeOrders = orders.filter((order) => {
      const status = getOrderStatusInfo(order.status);
      return status.step < ORDER_STATUS_STEPS.length;
    }).length;
    const latestOrderDate = orders[0]?.created_at
      ? new Date(orders[0].created_at).toLocaleDateString("sv-SE")
      : "Ingen order an";
    return {
      totalOrders,
      totalCents,
      activeOrders,
      latestOrderDate,
    };
  }, [orders]);

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 sm:pt-24 container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <h1 className="text-3xl font-bold">Logga in for att se dina bestallningar</h1>
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
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Mina bestallningar</p>
          <h1 className="text-3xl font-bold">Din orderoversikt</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Se status, ETA och kvitton for alla dina byggen.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Totalt</p>
            <p className="text-2xl font-bold mt-2">{orderStats.totalOrders}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">registrerade ordrar</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Aktiva</p>
            <p className="text-2xl font-bold mt-2">{orderStats.activeOrders}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">under behandling</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Senaste order</p>
            <p className="text-lg font-semibold mt-2">{orderStats.latestOrderDate}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">senaste bestallning</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Totalt spenderat</p>
            <p className="text-lg font-semibold mt-2">
              {(orderStats.totalCents / 100).toLocaleString("sv-SE")} kr
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">sammanlagt</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] items-start">
          <div className="space-y-6">
            {loadingOrders && (
              <p className="text-sm text-gray-600 dark:text-gray-300">Hamtar order...</p>
            )}
            {orderError && (
              <p className="text-sm text-red-500">{orderError}</p>
            )}
            {!loadingOrders && !orderError && orders.length === 0 && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-sm text-gray-600 dark:text-gray-300">
                Du har inga registrerade ordrar annu.
              </div>
            )}

            {orders.map((order) => {
              const statusInfo = getOrderStatusInfo(order.status);
              const stage = statusInfo.step;
              const orderDate = order.created_at
                ? new Date(order.created_at).toLocaleDateString("sv-SE")
                : "Okant datum";
              const total = typeof order.total_cents === "number" ? order.total_cents / 100 : 0;
              const items = order.order_items || [];

              return (
                <div key={order.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Order</p>
                      <p className="text-lg font-semibold mt-2">#{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Bestalld: {orderDate}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center justify-center rounded-full border border-yellow-400 bg-yellow-400/15 px-3 py-1 text-xs font-semibold text-gray-900 dark:text-yellow-200">
                        {statusInfo.label}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">ETA: {statusInfo.eta}</p>
                      <p className="text-lg font-semibold mt-2">{total.toLocaleString("sv-SE")} kr</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#0f1824] p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 mb-3">Innehall</p>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        {items.length === 0 && <p>Inga produkter kopplade till ordern.</p>}
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between gap-3">
                            <span className="truncate">{item.product?.name || "Produkt"} x{item.quantity}</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {typeof item.product?.price_cents === "number"
                                ? ((item.product.price_cents * item.quantity) / 100).toLocaleString("sv-SE")
                                : "--"} kr
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#101a27] p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 mb-3">Status</p>
                      <div className="flex flex-wrap gap-2">
                        {ORDER_STATUS_STEPS.map((label, index) => (
                          <span
                            key={label}
                            className={`inline-flex min-h-[28px] items-center justify-center rounded-full px-3 text-xs font-semibold border ${
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

                  {stage === 5 && (
                    <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50/70 text-gray-900 px-4 py-3 text-sm">
                      DatorHuset kontaktar dig om upphamtning och leverans. Vi ringer och skickar mejl.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-gray-100">Behov av hjalp?</p>
              <p className="mt-3">
                Har du fragor om leverans, uppgraderingar eller garanti? Kontakta oss sa svarar vi snabbt.
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
                <li>Vi skickar mejl vid varje statusandring.</li>
                <li>Byggtiden varierar beroende pa komponenter.</li>
                <li>Du kan fa kvitto via e-post eller under ordern.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
