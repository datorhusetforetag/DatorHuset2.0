import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCcw, ShieldAlert } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { AdminAccessContext } from "../useAdminAccess";
import { getOrderStatusInfo } from "@/lib/orderStatus";

type OrderItem = {
  id: string;
  quantity: number;
  unit_price_cents?: number | null;
  product?: {
    name?: string | null;
  };
};

type Order = {
  id: string;
  order_number?: string | number | null;
  created_at?: string | null;
  status?: string | null;
  total_cents?: number | null;
  currency?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_postal_code?: string | null;
  customer_city?: string | null;
  receipt_url?: string | null;
  receipt_number?: string | null;
  order_items?: OrderItem[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(value);

export default function AdminOrders() {
  const { isAdmin, loading, error, token, apiBase, signInWithGoogle } =
    useOutletContext<AdminAccessContext>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [localError, setLocalError] = useState("");

  const loadOrders = async () => {
    if (!token || !isAdmin) return;
    setLoadingOrders(true);
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Kunde inte hämta beställningar.");
      }
      const data = await response.json();
      setOrders(data || []);
    } catch (err) {
      setLocalError(err instanceof Error ?err.message : "Kunde inte hämta beställningar.");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleExportCsv = async () => {
    if (!token || !isAdmin) return;
    try {
      const response = await fetch(`${apiBase}/api/admin/orders.csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Kunde inte exportera CSV.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `datorhuset-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setLocalError(err instanceof Error ?err.message : "CSV-export misslyckades.");
    }
  };

  const orderCount = useMemo(() => orders.length, [orders]);

  if (!token) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <h2 className="text-xl font-semibold">Logga in för att fortsätta</h2>
        <p className="mt-2 text-sm text-slate-400">Du måste vara inloggad med ditt admin-konto.</p>
        <button
          type="button"
          onClick={signInWithGoogle}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white"
        >
          Logga in med Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Adminpanel</p>
          <h2 className="text-2xl font-semibold">Beställningar</h2>
          <p className="text-sm text-slate-400">{orderCount} registrerade ordrar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white"
          >
            <Download className="h-4 w-4" />
            Exportera CSV
          </button>
          <button
            type="button"
            onClick={loadOrders}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-4 py-2 text-sm font-semibold hover:border-[#11667b] hover:text-[#11667b]"
          >
            <RefreshCcw className="h-4 w-4" />
            Uppdatera
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400">Verifierar åtkomst...</p>}
      {!loading && error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          <ShieldAlert className="h-4 w-4 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
      {localError && <p className="text-sm text-red-400">{localError}</p>}
      {loadingOrders && <p className="text-sm text-slate-400">Laddar beställningar...</p>}

      <div className="space-y-5">
        {orders.map((order) => {
          const total = typeof order.total_cents === "number" ? order.total_cents / 100 : 0;
          const orderDate = order.created_at
            ? new Date(order.created_at).toLocaleDateString("sv-SE")
            : "Okänt datum";
          const orderNumber =
            order.order_number === null || order.order_number === undefined || order.order_number === ""
              ? order.id.slice(0, 8)
              : String(order.order_number);
          const statusInfo = getOrderStatusInfo(order.status || undefined);
          return (

            <div key={order.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Order</p>
                  <h3 className="text-lg font-semibold text-white">
                    #{orderNumber}
                  </h3>
                  <p className="text-sm text-slate-400">Beställd: {orderDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Totalt</p>
                  <p className="text-lg font-semibold text-white">{formatCurrency(total)}</p>
                  <span className="mt-2 inline-flex rounded-full border border-slate-700/60 px-3 py-1 text-xs text-slate-300">
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <div className="space-y-2 text-sm text-slate-300">
                  <p className="font-semibold text-white">{order.customer_name || "Okänt namn"}</p>
                  <p>{order.customer_email}</p>
                  <p>{order.customer_phone}</p>
                  <p>{order.customer_address}</p>
                  <p>
                    {order.customer_postal_code} {order.customer_city}
                  </p>
                </div>
                <div className="space-y-2 text-sm text-slate-300">
                  {order.receipt_number && (
                    <p className="text-xs text-slate-400">Kvittonummer: {order.receipt_number}</p>
                  )}
                  {order.receipt_url ? (
                    <a
                      href={order.receipt_url}
                      className="inline-flex text-[#11667b] font-semibold hover:text-[#9dd4e0]"
                    >
                      Visa kvitto
                    </a>
                  ) : (
                    <p className="text-xs text-slate-500">Kvitto skickas via Stripe.</p>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-slate-800 pt-4">
                <p className="text-sm font-semibold text-white mb-2">Produkter</p>
                <div className="space-y-1 text-sm text-slate-300">
                  {(order.order_items || []).map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.product?.name || "Produkt"} x{item.quantity}
                      </span>
                      <span>
                        {item.unit_price_cents
                          ?formatCurrency((item.unit_price_cents * item.quantity) / 100)
                          : "-"}
                      </span>
                    </div>
                  ))}
                  {(order.order_items || []).length === 0 && (
                    <p className="text-xs text-slate-500">Inga produkter kopplade till ordern.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!loadingOrders && orders.length === 0 && (
          <p className="text-sm text-slate-400">Inga beställningar hittades.</p>
        )}
      </div>
    </div>
  );
}
