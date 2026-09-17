import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, RefreshCcw, Search, ShieldAlert, Truck, Wrench } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { AdminAccessContext } from "../useAdminAccess";
import {
  CARRIER_LABELS,
  getOrderStatusInfo,
  ORDER_STATUS_FLOW,
  resolveTrackingUrl,
  SHIPPING_STATUSES,
} from "@/lib/orderStatus";

type OrderItem = {
  id: string;
  quantity: number;
  unit_price_cents?: number | null;
  product?: { name?: string | null };
};

type BuildChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

type TrackingFieldsProps = {
  order: Order;
  disabled: boolean;
  onSave: (tracking: { carrier: string | null; tracking_number: string | null }) => void;
};

/**
 * Fraktbolag och spårningsnummer för en order.
 *
 * Har egen lokal state så att den som skriver i fälten inte tappar det som
 * skrivits varje gång listan hämtas om. Sparas först när man trycker Spara,
 * och skickas då med samma statusvärde som ordern redan har - det här är
 * inte ett statusbyte.
 */
function TrackingFields({ order, disabled, onSave }: TrackingFieldsProps) {
  const [carrier, setCarrier] = useState(order.shipping_carrier || "");
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");

  // Följ med när ordern uppdateras utifrån, t.ex. efter en omladdning.
  useEffect(() => {
    setCarrier(order.shipping_carrier || "");
    setTrackingNumber(order.tracking_number || "");
  }, [order.shipping_carrier, order.tracking_number]);

  const dirty =
    carrier !== (order.shipping_carrier || "") ||
    trackingNumber.trim() !== (order.tracking_number || "");

  const previewUrl = resolveTrackingUrl({
    carrier,
    trackingNumber,
    trackingUrl: order.tracking_url,
  });

  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
        <Truck className="h-4 w-4 text-[#11667b]" />
        Frakt och spårning
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Fraktbolag</span>
          <select
            value={carrier}
            onChange={(event) => setCarrier(event.target.value)}
            disabled={disabled}
            className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          >
            <option value="">Inget valt</option>
            {Object.entries(CARRIER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Spårningsnummer</span>
          <input
            type="text"
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
            disabled={disabled}
            placeholder="t.ex. 12345678901"
            className="w-56 rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 font-mono text-sm text-slate-100"
          />
        </label>

        <button
          type="button"
          disabled={disabled || !dirty}
          onClick={() =>
            onSave({
              carrier: carrier || null,
              tracking_number: trackingNumber.trim() || null,
            })
          }
          className="rounded-lg border border-[#11667b] px-4 py-2 text-sm font-semibold text-[#11667b] transition-colors hover:bg-[#11667b] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#11667b]"
        >
          Spara frakt
        </button>
      </div>

      {previewUrl && (
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-xs text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline"
        >
          {previewUrl}
        </a>
      )}

      {!carrier && trackingNumber.trim() && (
        <p className="mt-3 text-xs text-amber-400">
          Välj fraktbolag också – utan det kan kunden inte få någon spårningslänk.
        </p>
      )}
    </div>
  );
}

type Order = {
  id: string;
  order_number?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
  total_cents?: number | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_postal_code?: string | null;
  customer_city?: string | null;
  receipt_url?: string | null;
  receipt_number?: string | null;
  shipping_carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  build_checklist?: BuildChecklistItem[] | null;
  order_items?: OrderItem[];
};

const DEFAULT_CHECKLIST: BuildChecklistItem[] = [
  { id: "parts", label: "Delar plockade", done: false },
  { id: "assembly", label: "Montering klar", done: false },
  { id: "bios", label: "BIOS & uppdateringar", done: false },
  { id: "stress", label: "Stresstest", done: false },
  { id: "qc", label: "QC & packning", done: false },
  { id: "ready", label: "Klar för utlämning", done: false },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(value);

const readApiError = (data: any, fallback: string) => data?.error?.message || data?.error || fallback;

export default function AdminOrders() {
  const { isAdmin, role, loading, error, token, apiBase, signInWithGoogle } =
    useOutletContext<AdminAccessContext>();
  const canMutate = role === "admin" || role === "ops" || role === "";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [savingOrder, setSavingOrder] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadOrders = async () => {
    if (!token || !isAdmin) return;
    setLoadingOrders(true);
    setLocalError("");
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (query.trim()) params.set("q", query.trim());
      if (statusFilter) params.set("status", statusFilter);
      const response = await fetch(`${apiBase}/api/admin/v2/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(readApiError(data, "Kunde inte hämta beställningar."));
      }
      setOrders(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte hämta beställningar.");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleExportCsv = async () => {
    if (!token || !isAdmin) return;
    try {
      const response = await fetch(`${apiBase}/api/admin/orders.csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Kunde inte exportera CSV.");
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
      setLocalError(err instanceof Error ? err.message : "CSV-export misslyckades.");
    }
  };

  const handleStatusChange = async (
    order: Order,
    status: string,
    tracking?: { carrier?: string | null; tracking_number?: string | null },
  ) => {
    if (!token || !isAdmin) return;
    if (!canMutate) {
      setLocalError("Du har läsbehörighet och kan inte uppdatera byggstatus.");
      return;
    }
    try {
      setSavingOrder(order.id);
      const response = await fetch(`${apiBase}/api/admin/v2/orders/${order.id}/byggstatus`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          expected_updated_at: order.updated_at || null,
          // Skickas bara med när fraktfälten faktiskt ändrats, så att ett
          // vanligt statusbyte inte nollar ett sparat spårningsnummer.
          ...(tracking || {}),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(readApiError(data, "Kunde inte uppdatera byggstatus."));
      }
      setOrders((prev) => prev.map((entry) => (entry.id === order.id ? { ...entry, ...(data?.data || {}) } : entry)));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Statusuppdatering misslyckades.");
    } finally {
      setSavingOrder(null);
    }
  };

  const handleChecklistToggle = async (order: Order, checklistItemId: string) => {
    if (!token || !isAdmin) return;
    if (!canMutate) {
      setLocalError("Du har läsbehörighet och kan inte uppdatera checklistan.");
      return;
    }
    const baseChecklist = order.build_checklist?.length ? order.build_checklist : DEFAULT_CHECKLIST;
    const updatedChecklist = baseChecklist.map((item) =>
      item.id === checklistItemId ? { ...item, done: !item.done } : item
    );
    try {
      setSavingOrder(order.id);
      const response = await fetch(`${apiBase}/api/admin/v2/orders/${order.id}/checklista`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ build_checklist: updatedChecklist, expected_updated_at: order.updated_at || null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(readApiError(data, "Kunde inte uppdatera checklistan."));
      }
      setOrders((prev) =>
        prev.map((entry) =>
          entry.id === order.id
            ? {
                ...entry,
                build_checklist: Array.isArray(data?.data?.build_checklist)
                  ? data.data.build_checklist
                  : updatedChecklist,
                updated_at: data?.data?.updated_at || entry.updated_at,
              }
            : entry
        )
      );
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Checklist-uppdatering misslyckades.");
    } finally {
      setSavingOrder(null);
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
          <h2 className="text-2xl font-semibold">Beställningar & byggstatus</h2>
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
            onClick={() => void loadOrders()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-4 py-2 text-sm font-semibold hover:border-[#11667b] hover:text-[#11667b]"
          >
            <RefreshCcw className="h-4 w-4" />
            Uppdatera
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-[1fr_180px_auto]">
        <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sök order, kund eller e-post"
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
        >
          <option value="">Alla statusar</option>
          {ORDER_STATUS_FLOW.map((status) => (
            <option key={`filter-${status.value}`} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void loadOrders()}
          className="rounded-lg border border-slate-700/60 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-[#11667b] hover:text-[#11667b]"
        >
          Filtrera
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Verifierar åtkomst...</p>}
      {!loading && error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          <ShieldAlert className="mt-0.5 h-4 w-4" />
          <p>{error}</p>
        </div>
      )}
      {isAdmin && !canMutate && <p className="text-sm text-yellow-300">Du har läsbehörighet (readonly).</p>}
      {localError && <p className="text-sm text-red-400">{localError}</p>}
      {loadingOrders && <p className="text-sm text-slate-400">Laddar beställningar...</p>}

      <div className="space-y-5">
        {orders.map((order) => {
          const total = typeof order.total_cents === "number" ? order.total_cents / 100 : 0;
          const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString("sv-SE") : "Okänt datum";
          const orderNumber =
            order.order_number === null || order.order_number === undefined || order.order_number === ""
              ? order.id.slice(0, 8)
              : String(order.order_number);
          const statusInfo = getOrderStatusInfo(order.status || undefined);
          const checklist = order.build_checklist?.length ? order.build_checklist : DEFAULT_CHECKLIST;

          return (
            <section key={order.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Order</p>
                  <h3 className="text-lg font-semibold text-white">#{orderNumber}</h3>
                  <p className="text-sm text-slate-400">Beställd: {orderDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Totalt</p>
                  <p className="text-lg font-semibold text-white">{formatCurrency(total)}</p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-700/60 px-3 py-1 text-xs text-slate-200">
                    <Wrench className="h-3.5 w-3.5 text-[#11667b]" />
                    {statusInfo.label}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <div className="space-y-1 text-sm text-slate-300">
                  <p className="font-semibold text-white">{order.customer_name || "Okänt namn"}</p>
                  <p>{order.customer_email || "-"}</p>
                  <p>{order.customer_phone || "-"}</p>
                  <p>{order.customer_address || "-"}</p>
                  <p>
                    {order.customer_postal_code || ""} {order.customer_city || ""}
                  </p>
                </div>
                <div className="space-y-2 text-sm text-slate-300">
                  {order.receipt_number && (
                    <p className="text-xs text-slate-400">Kvittonummer: {order.receipt_number}</p>
                  )}
                  {order.receipt_url ? (
                    <a href={order.receipt_url} className="inline-flex font-semibold text-[#9dd4e0] hover:text-white">
                      Visa kvitto
                    </a>
                  ) : (
                    <p className="text-xs text-slate-500">Kvitto skickas via Stripe.</p>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-slate-800 pt-4">
                <p className="mb-2 text-sm font-semibold text-white">Produkter</p>
                <div className="space-y-1 text-sm text-slate-300">
                  {(order.order_items || []).map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.product?.name || "Produkt"} x{item.quantity}
                      </span>
                      <span>
                        {item.unit_price_cents ? formatCurrency((item.unit_price_cents * item.quantity) / 100) : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="text-sm font-semibold text-slate-100">Byggstatus</label>
                <select
                  value={statusInfo.value}
                  onChange={(event) => void handleStatusChange(order, event.target.value)}
                  disabled={!canMutate}
                  className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                >
                  {ORDER_STATUS_FLOW.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {savingOrder === order.id ? <span className="text-xs text-slate-500">Sparar...</span> : null}
              </div>

              {/* Fraktfälten visas när ordern är på väg ut, eller när det
                  redan finns ett nummer sparat på den. */}
              {(SHIPPING_STATUSES.has(statusInfo.value) ||
                statusInfo.value === "ready" ||
                order.tracking_number) && (
                <TrackingFields
                  order={order}
                  disabled={!canMutate || savingOrder === order.id}
                  onSave={(tracking) =>
                    void handleStatusChange(order, statusInfo.value, tracking)
                  }
                />
              )}

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-[#11667b]" />
                  Byggchecklista
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {checklist.map((item) => (
                    <label
                      key={`${order.id}-${item.id}`}
                      className="flex items-center gap-2 rounded-lg border border-slate-700/60 px-3 py-2 text-sm text-slate-200"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(item.done)}
                        disabled={!canMutate}
                        onChange={() => void handleChecklistToggle(order, item.id)}
                      />
                      <span className={item.done ? "text-slate-500 line-through" : ""}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        {!loadingOrders && orders.length === 0 && (
          <p className="text-sm text-slate-400">Inga beställningar hittades.</p>
        )}
      </div>
    </div>
  );
}
