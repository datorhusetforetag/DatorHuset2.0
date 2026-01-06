import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCcw, Wrench } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { AdminAccessContext } from "../useAdminAccess";
import { getOrderStatusInfo, ORDER_STATUS_FLOW } from "@/lib/orderStatus";

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
  customer_name?: string | null;
  customer_email?: string | null;
  total_cents?: number | null;
  order_items?: OrderItem[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(value);

export default function AdminBuild() {
  const { isAdmin, loading, error, token, apiBase, signInWithGoogle } =
    useOutletContext<AdminAccessContext>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [savingOrder, setSavingOrder] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");

  const loadOrders = async () => {
    if (!token || !isAdmin) return;
    setLoadingOrders(true);
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}`, "X-Access-Token": token },
      });
      if (!response.ok) {
        throw new Error("Kunde inte hÃ¤mta bestÃ¤llningar.");
      }
      const data = await response.json();
      setOrders(data || []);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte hÃ¤mta bestÃ¤llningar.");
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

  const handleStatusChange = async (orderId: string, status: string) => {
    if (!token || !isAdmin) return;
    try {
      setSavingOrder(orderId);
      const response = await fetch(`${apiBase}/api/orders/${orderId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Access-Token": token,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Kunde inte uppdatera status.");
      }
      const updated = await response.json();
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, ...updated } : order)));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Statusuppdatering misslyckades.");
    } finally {
      setSavingOrder(null);
    }
  };

  
    if (!token) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <h2 className="text-xl font-semibold">Logga in fÃ¶r att fortsÃ¤tta</h2>
        <p className="mt-2 text-sm text-slate-400">Du mÃ¥ste vara inloggad med ditt admin-konto.</p>
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
          <h2 className="text-2xl font-semibold">Byggstatus</h2>
          <p className="text-sm text-slate-400">Uppdatera status och checklista fÃ¶r varje order.</p>
        </div>
        <button
          type="button"
          onClick={loadOrders}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-4 py-2 text-sm font-semibold hover:border-[#11667b] hover:text-[#11667b]"
        >
          <RefreshCcw className="h-4 w-4" />
          Uppdatera
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Verifierar Ã¥tkomst...</p>}
      {!loading && error && <p className="text-sm text-red-400">{error}</p>}
      {localError && <p className="text-sm text-red-400">{localError}</p>}
      {loadingOrders && <p className="text-sm text-slate-400">Laddar byggstatus...</p>}

      <div className="space-y-5">
        {orders.map((order) => {
          const statusInfo = getOrderStatusInfo(order.status || undefined);
          const total = typeof order.total_cents === "number" ? order.total_cents / 100 : 0;
          return (
            <div key={order.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Order</p>
                  <h3 className="text-lg font-semibold text-white">
                    #{order.order_number ?? order.id.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-slate-400">{order.customer_name || "OkÃ¤nt namn"}</p>
                  <p className="text-sm text-slate-400">{order.customer_email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Totalt</p>
                  <p className="text-lg font-semibold text-white">{formatCurrency(total)}</p>
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <Wrench className="h-4 w-4 text-[#11667b]" />
                    <span className="text-sm text-slate-300">{statusInfo.label}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="text-sm font-semibold text-slate-200">Status</label>
                <select
                  value={statusInfo.value}
                  onChange={(event) => handleStatusChange(order.id, event.target.value)}
                  className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                >
                  {ORDER_STATUS_FLOW.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {savingOrder === order.id && <span className="text-xs text-slate-500">Sparar...</span>}
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#11667b]" />
                  <span>ETA: {statusInfo.eta}</span>
                </div>
              </div>
            </div>
          );
        })}

        {!loadingOrders && orders.length === 0 && (
          <p className="text-sm text-slate-400">Inga ordrar att visa.</p>
        )}
      </div>
    </div>
  );
}





