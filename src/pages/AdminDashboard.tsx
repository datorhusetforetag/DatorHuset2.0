import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Check, Download, PackageSearch, RefreshCcw } from "lucide-react";

type OrderItem = {
  id: string;
  quantity: number;
  unit_price_cents?: number | null;
  product?: {
    name?: string | null;
  };
};

type BuildChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

type Order = {
  id: string;
  created_at?: string | null;
  status?: string | null;
  total_cents?: number | null;
  currency?: string | null;
  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_postal_code?: string | null;
  customer_city?: string | null;
  receipt_url?: string | null;
  build_checklist?: BuildChecklistItem[] | null;
  order_items?: OrderItem[];
};

type InventoryItem = {
  id?: string;
  product_id: string;
  quantity_in_stock?: number | null;
  is_preorder?: boolean | null;
  eta_days?: number | null;
  eta_note?: string | null;
  product?: {
    name?: string | null;
  };
};

const DEFAULT_CHECKLIST: BuildChecklistItem[] = [
  { id: "parts", label: "Delar plockade", done: false },
  { id: "assembly", label: "Montering klar", done: false },
  { id: "bios", label: "BIOS & uppdateringar", done: false },
  { id: "stress", label: "Stresstest", done: false },
  { id: "qc", label: "QC & packning", done: false },
  { id: "ready", label: "Klar för utlämning", done: false },
];

const STATUS_OPTIONS = [
  { value: "received", label: "Order mottagen" },
  { value: "building", label: "Byggs" },
  { value: "finished", label: "Klar" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(value);

export default function AdminDashboard() {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [error, setError] = useState("");
  const [savingOrder, setSavingOrder] = useState<string | null>(null);
  const [savingInventory, setSavingInventory] = useState<string | null>(null);

  const token = session?.access_token || "";
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";

  const loadAdminData = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const adminResponse = await fetch(`${apiBase}/api/admin/me`, {
        headers: { Authorization: `Bearer ${token}`, "X-Access-Token": token },
      });
      const adminData = await adminResponse.json();
      if (!adminResponse.ok || !adminData?.isAdmin) {
        setIsAdmin(false);
        setError("Du saknar behörighet för adminpanelen.");
        return;
      }
      setIsAdmin(true);

      const [ordersResponse, inventoryResponse] = await Promise.all([
        fetch(`${apiBase}/api/admin/orders`, {
          headers: { Authorization: `Bearer ${token}`, "X-Access-Token": token },
        }),
        fetch(`${apiBase}/api/admin/inventory`, {
          headers: { Authorization: `Bearer ${token}`, "X-Access-Token": token },
        }),
      ]);

      if (!ordersResponse.ok) {
        throw new Error("Kunde inte hämta orders.");
      }
      if (!inventoryResponse.ok) {
        throw new Error("Kunde inte hämta lagerstatus.");
      }

      const ordersData = await ordersResponse.json();
      const inventoryData = await inventoryResponse.json();
      setOrders(ordersData || []);
      setInventory(inventoryData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ett fel uppstod.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleStatusChange = async (orderId: string, status: string) => {
    if (!token) return;
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
      console.error(err);
      setError(err instanceof Error ? err.message : "Statusuppdatering misslyckades.");
    } finally {
      setSavingOrder(null);
    }
  };

  const handleChecklistToggle = async (order: Order, itemId: string) => {
    if (!token) return;
    const currentChecklist = (order.build_checklist?.length ? order.build_checklist : DEFAULT_CHECKLIST).map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    try {
      setSavingOrder(order.id);
      const response = await fetch(`${apiBase}/api/admin/orders/${order.id}/checklist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Access-Token": token,
        },
        body: JSON.stringify({ build_checklist: currentChecklist }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Kunde inte uppdatera checklistan.");
      }
      const updated = await response.json();
      setOrders((prev) =>
        prev.map((existing) =>
          existing.id === order.id ? { ...existing, build_checklist: updated.build_checklist } : existing
        )
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Checklist-uppdatering misslyckades.");
    } finally {
      setSavingOrder(null);
    }
  };

  const handleExportCsv = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${apiBase}/api/admin/orders.csv`, {
        headers: { Authorization: `Bearer ${token}`, "X-Access-Token": token },
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
      setError(err instanceof Error ? err.message : "CSV-export misslyckades.");
    }
  };

  const handleInventoryChange = (productId: string, field: keyof InventoryItem, value: string | boolean) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              [field]:
                field === "quantity_in_stock" || field === "eta_days"
                  ? Number(value)
                  : value,
            }
          : item
      )
    );
  };

  const handleInventorySave = async (item: InventoryItem) => {
    if (!token) return;
    try {
      setSavingInventory(item.product_id);
      const response = await fetch(`${apiBase}/api/admin/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Access-Token": token,
        },
        body: JSON.stringify({
          productId: item.product_id,
          quantity_in_stock: item.quantity_in_stock ?? 0,
          is_preorder: Boolean(item.is_preorder),
          eta_days: item.eta_days ?? null,
          eta_note: item.eta_note ?? "",
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Kunde inte spara lager.");
      }
      const updated = await response.json();
      setInventory((prev) =>
        prev.map((entry) => (entry.product_id === item.product_id ? { ...entry, ...updated } : entry))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lageruppdatering misslyckades.");
    } finally {
      setSavingInventory(null);
    }
  };

  const ordersWithChecklist = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        build_checklist: order.build_checklist?.length ? order.build_checklist : DEFAULT_CHECKLIST,
      })),
    [orders]
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 sm:pt-24 container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Adminpanel</p>
            <h1 className="text-3xl font-bold">Order & lager</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 text-gray-900 font-semibold px-4 py-2 hover:bg-[#11667b] hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportera CSV
            </button>
            <button
              type="button"
              onClick={loadAdminData}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-semibold hover:border-[#11667b] hover:text-[#11667b] transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Uppdatera
            </button>
          </div>
        </div>

        {loading && <p className="text-sm text-gray-600 dark:text-gray-300">Laddar adminpanel...</p>}
        {!loading && error && <p className="text-sm text-red-500 mb-6">{error}</p>}

        {!loading && !isAdmin && !error && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-300">Du saknar behörighet för att se adminpanelen.</p>
          </div>
        )}

        {!loading && isAdmin && (
          <div className="space-y-10">
            <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <div className="flex items-center gap-3 mb-6">
                <PackageSearch className="w-5 h-5 text-[#11667b]" />
                <h2 className="text-xl font-semibold">Beställningar</h2>
              </div>

              {ordersWithChecklist.length === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-300">Inga ordrar hittades.</p>
              )}

              <div className="space-y-6">
                {ordersWithChecklist.map((order) => {
                  const totalValue = typeof order.total_cents === "number" ? order.total_cents / 100 : 0;
                  const orderDate = order.created_at
                    ? new Date(order.created_at).toLocaleDateString("sv-SE")
                    : "Okänt datum";
                  return (
                    <div key={order.id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Beställd: {orderDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Totalt</p>
                          <p className="text-lg font-semibold">{formatCurrency(totalValue)}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{order.customer_name || "Okänt namn"}</p>
                          <p>{order.customer_email}</p>
                          <p>{order.customer_phone}</p>
                          <p>{order.customer_address}</p>
                          <p>
                            {order.customer_postal_code} {order.customer_city}
                          </p>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                          <p>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">Stripe session:</span>{" "}
                            {order.stripe_session_id || "—"}
                          </p>
                          <p>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">Payment intent:</span>{" "}
                            {order.stripe_payment_intent_id || "—"}
                          </p>
                          {order.receipt_url && (
                            <a
                              href={order.receipt_url}
                              className="text-[#11667b] font-semibold hover:text-[#0d4d5d]"
                            >
                              Visa kvitto
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Produkter</p>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                          {order.order_items?.map((item) => (
                            <div key={item.id} className="flex justify-between">
                              <span>{item.product?.name || "Produkt"} x{item.quantity}</span>
                              <span>
                                {item.unit_price_cents
                                  ? formatCurrency((item.unit_price_cents * item.quantity) / 100)
                                  : "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Status</label>
                        <select
                          value={order.status || "received"}
                          onChange={(event) => handleStatusChange(order.id, event.target.value)}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {savingOrder === order.id && (
                          <span className="text-xs text-gray-500">Sparar...</span>
                        )}
                      </div>

                      <div className="mt-5">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Byggchecklista</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {order.build_checklist?.map((item) => (
                            <label
                              key={item.id}
                              className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm text-gray-600 dark:text-gray-300"
                            >
                              <input
                                type="checkbox"
                                checked={item.done}
                                onChange={() => handleChecklistToggle(order, item.id)}
                                className="h-4 w-4 text-yellow-400"
                              />
                              <span className={item.done ? "line-through text-gray-400" : ""}>{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <h2 className="text-xl font-semibold mb-6">Lager & förbeställningar</h2>
              {inventory.length === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-300">Ingen lagerdata hittades.</p>
              )}
              <div className="space-y-4">
                {inventory.map((item) => (
                  <div
                    key={item.product_id}
                    className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 grid gap-4 lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))_auto]"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {item.product?.name || item.product_id}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.product_id}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Antal i lager</label>
                      <input
                        type="number"
                        min="0"
                        value={item.quantity_in_stock ?? 0}
                        onChange={(event) => handleInventoryChange(item.product_id, "quantity_in_stock", event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Förbeställning</label>
                      <select
                        value={item.is_preorder ? "true" : "false"}
                        onChange={(event) => handleInventoryChange(item.product_id, "is_preorder", event.target.value === "true")}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                      >
                        <option value="false">Nej</option>
                        <option value="true">Ja</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">ETA (dagar)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.eta_days ?? ""}
                        onChange={(event) => handleInventoryChange(item.product_id, "eta_days", event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">ETA-notis</label>
                      <input
                        type="text"
                        value={item.eta_note ?? ""}
                        onChange={(event) => handleInventoryChange(item.product_id, "eta_note", event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-3 py-2 text-sm"
                        placeholder="Ex: Leverans v.12"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleInventorySave(item)}
                        className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 text-gray-900 font-semibold px-4 py-2 hover:bg-[#11667b] hover:text-white transition-colors"
                        disabled={savingInventory === item.product_id}
                      >
                        <Check className="w-4 h-4" />
                        {savingInventory === item.product_id ? "Sparar..." : "Spara"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
