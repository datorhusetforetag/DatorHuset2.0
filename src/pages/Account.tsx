import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { getUserOrders, updateOrderStatus } from "@/lib/supabaseServices";
import { KeyRound, MapPin, Package, User } from "lucide-react";

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

const statusConfig: Record<string, { label: string; step: number }> = {
  pending: { label: "Order mottagen", step: 1 },
  received: { label: "Order mottagen", step: 1 },
  building: { label: "Byggs", step: 2 },
  in_progress: { label: "Byggs", step: 2 },
  completed: { label: "Klar", step: 3 },
  finished: { label: "Klar", step: 3 },
};

const statusOptions = [
  { value: "received", label: "Order mottagen" },
  { value: "building", label: "Byggs" },
  { value: "finished", label: "Klar" },
];

export default function Account() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [resetStatus, setResetStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [statusEdits, setStatusEdits] = useState<Record<string, string>>({});
  const [statusSaving, setStatusSaving] = useState<Record<string, boolean>>({});
  const [statusError, setStatusError] = useState<Record<string, string>>({});

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

  const profileName = useMemo(() => {
    if (!user) return "";
    const metadata = user.user_metadata || {};
    return metadata.full_name || metadata.username || user.email?.split("@")[0] || "Kund";
  }, [user]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const metadata = user.user_metadata || {};
    return metadata.is_admin === true || metadata.role === "admin";
  }, [user]);

  const phoneNumber = useMemo(() => {
    if (!user) return "";
    const metadata = user.user_metadata || {};
    return metadata.phone || user.phone || "";
  }, [user]);

  const addressLine = useMemo(() => {
    if (!user) return "";
    const metadata = user.user_metadata || {};
    return metadata.address || "";
  }, [user]);

  const postalCode = useMemo(() => {
    if (!user) return "";
    const metadata = user.user_metadata || {};
    return metadata.postalCode || metadata.postal_code || "";
  }, [user]);

  const city = useMemo(() => {
    if (!user) return "";
    const metadata = user.user_metadata || {};
    return metadata.city || "";
  }, [user]);

  const statusSteps = ["Order mottagen", "Byggs", "Klar"];

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      setResetStatus("sending");
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin,
      });
      if (error) {
        setResetStatus("error");
        return;
      }
      setResetStatus("sent");
    } catch (error) {
      setResetStatus("error");
    }
  };

  const handleStatusChange = (orderId: string, value: string) => {
    setStatusEdits((prev) => ({ ...prev, [orderId]: value }));
  };

  const handleStatusSave = async (orderId: string) => {
    const newStatus = statusEdits[orderId];
    if (!newStatus) return;
    try {
      setStatusSaving((prev) => ({ ...prev, [orderId]: true }));
      setStatusError((prev) => ({ ...prev, [orderId]: "" }));
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: updated.status } : order))
      );
    } catch (error) {
      setStatusError((prev) => ({ ...prev, [orderId]: "Kunde inte uppdatera status." }));
    } finally {
      setStatusSaving((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16 sm:pt-24 container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <h1 className="text-3xl font-bold">Logga in för att se ditt konto</h1>
            <p className="text-gray-600 dark:text-gray-300">
              För att hantera dina uppgifter och orderhistorik behöver du vara inloggad.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded hover:bg-[#11667b] hover:text-white transition-colors"
            >
              Tillbaka till startsidan
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
        <div className="flex flex-col gap-2 mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Mitt konto</p>
          <h1 className="text-3xl font-bold">Hej {profileName}</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_1.3fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-[#11667b]" />
                <h2 className="text-xl font-semibold">Mina uppgifter</h2>
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{profileName}</p>
                <p>{user.email}</p>
                <p>{phoneNumber || "Telefonnummer saknas"}</p>
              </div>
              <Link
                to="/kundservice"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#11667b] hover:text-[#0d4d5d] mt-4"
              >
                Uppdatera information
              </Link>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-[#11667b]" />
                <h2 className="text-xl font-semibold">Adress</h2>
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>{addressLine || "Adress saknas"}</p>
                <p>{postalCode ? `${postalCode} ${city}` : "Postnummer och postort saknas"}</p>
                <p>Sverige</p>
              </div>
              <Link
                to="/kundservice"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#11667b] hover:text-[#0d4d5d] mt-4"
              >
                Uppdatera adress
              </Link>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <div className="flex items-center gap-3 mb-4">
                <KeyRound className="w-5 h-5 text-[#11667b]" />
                <h2 className="text-xl font-semibold">Lösenord</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                För att byta lösenord skickar vi en säker länk till din e-post.
              </p>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={resetStatus === "sending"}
                className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-yellow-400 text-gray-900 font-semibold bg-yellow-400 hover:bg-[#11667b] hover:text-white disabled:opacity-60 transition-colors"
              >
                {resetStatus === "sending" ? "Skickar..." : "Skicka lösenordslänk"}
              </button>
              {resetStatus === "sent" && (
                <p className="text-sm text-green-600 mt-3">
                  En verifieringslänk har skickats till {user.email}.
                </p>
              )}
              {resetStatus === "error" && (
                <p className="text-sm text-red-500 mt-3">
                  Kunde inte skicka länken just nu. Försök igen senare.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-[#11667b]" />
                <h2 className="text-xl font-semibold">Orderhistorik</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                Status uppdateras manuellt när vi bygger din dator.
              </p>

              {loadingOrders && (
                <p className="text-sm text-gray-600 dark:text-gray-300">Hämtar order...</p>
              )}
              {orderError && (
                <p className="text-sm text-red-500">{orderError}</p>
              )}
              {!loadingOrders && !orderError && orders.length === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Du har inga registrerade ordrar ännu.
                </p>
              )}

              <div className="space-y-6">
                {orders.map((order) => {
                  const normalizedStatus = order.status || "pending";
                  const statusInfo = statusConfig[normalizedStatus] || statusConfig.pending;
                  const stage = statusInfo.step;
                  const orderDate = order.created_at
                    ? new Date(order.created_at).toLocaleDateString("sv-SE")
                    : "Okänt datum";
                  const total = typeof order.total_cents === "number" ? order.total_cents / 100 : 0;
                  const items = order.order_items || [];

                  return (
                    <div key={order.id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Beställd: {orderDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Totalt</p>
                          <p className="text-lg font-semibold">{total.toLocaleString("sv-SE")} kr</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {items.length === 0 && <p>Inga produkter kopplade till ordern.</p>}
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span>{item.product?.name || "Produkt"} x{item.quantity}</span>
                            <span>
                              {typeof item.product?.price_cents === "number"
                                ? ((item.product.price_cents * item.quantity) / 100).toLocaleString("sv-SE")
                                : "--"}{" "}
                              kr
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
                        {statusSteps.map((label, index) => (
                          <div
                            key={label}
                            className={`rounded-full px-3 py-1 text-center border ${
                              stage >= index + 1
                                ? "border-yellow-400 bg-yellow-400/20 text-gray-900 dark:text-yellow-200"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            {label}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                        <span>Status: {statusInfo.label}</span>
                        {order.receipt_url ? (
                          <a
                            href={order.receipt_url}
                            className="text-[#11667b] hover:text-[#0d4d5d] font-semibold"
                          >
                            Kvitto
                          </a>
                        ) : (
                          <span>Kvitto skickas via e-post</span>
                        )}
                      </div>

                      {stage === 3 && (
                        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50/70 text-gray-900 px-4 py-3 text-sm">
                          DatorHuset kommer ringa dig angående när och vart du kan hämta upp datorn. Vi kommer ringa
                          dig och skicka ett mejl.
                        </div>
                      )}

                      {isAdmin && (
                        <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 mb-3">
                            Adminläge
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <select
                              value={statusEdits[order.id] || normalizedStatus}
                              onChange={(event) => handleStatusChange(order.id, event.target.value)}
                              className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                            >
                              {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleStatusSave(order.id)}
                              disabled={statusSaving[order.id]}
                              className="px-4 py-2 rounded-lg bg-yellow-400 text-gray-900 font-semibold hover:bg-[#11667b] hover:text-white disabled:opacity-60 transition-colors"
                            >
                              {statusSaving[order.id] ? "Uppdaterar..." : "Spara status"}
                            </button>
                          </div>
                          {statusError[order.id] && (
                            <p className="text-xs text-red-500 mt-2">{statusError[order.id]}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
