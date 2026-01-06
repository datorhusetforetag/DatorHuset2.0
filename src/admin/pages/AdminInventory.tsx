import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Save, Search } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { AdminAccessContext } from "../useAdminAccess";

type InventoryItem = {
  id?: string;
  product_id: string;
  quantity_in_stock?: number | null;
  is_preorder?: boolean | null;
  eta_days?: number | null;
  eta_note?: string | null;
  eta_input?: string;
  price_cents?: number | null;
  product?: {
    name?: string | null;
    price_cents?: number | null;
  };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(value);

export default function AdminInventory() {
  const { isAdmin, loading, error, token, apiBase, signInWithGoogle } = useOutletContext<AdminAccessContext>();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [localError, setLocalError] = useState("");

  const loadInventory = async () => {
    if (!token || !isAdmin) return;
    setLoadingItems(true);
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Kunde inte hämta lagerstatus.");
      }
      const data = await response.json();
      const normalized = (data || []).map((item: InventoryItem) => {
        const etaNote = item.eta_note ?? "";
        const etaRangeMatch = etaNote.match(/ETA\s+(\d+\s*-\s*\d+)\s*dagar/i);
        const etaInput = etaRangeMatch
          ? etaRangeMatch[1]?.replace(/\s+/g, "") || ""
          : item.eta_days !== null && item.eta_days !== undefined
            ? String(item.eta_days)
            : "";
        return {
          ...item,
          price_cents: item.product?.price_cents ?? item.price_cents ?? 0,
          eta_input: etaInput,
        };
      });
      setItems(normalized);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte hämta lagret.");
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadInventory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleChange = (productId: string, field: keyof InventoryItem, value: string | boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              [field]: field === "quantity_in_stock" || field === "price_cents" ? Number(value) : value,
            }
          : item
      )
    );
  };

  const handleSave = async (item: InventoryItem) => {
    if (!token || !isAdmin) return;
    setSavingId(item.product_id);
    setLocalError("");
    const etaInput = (item.eta_input ?? "").trim();
    const isRange = /^\d+\s*-\s*\d+$/.test(etaInput);
    const normalizedRange = isRange ? etaInput.replace(/\s+/g, "") : "";
    const etaDays = etaInput && !isRange && /^\d+$/.test(etaInput) ? Number(etaInput) : null;
    const etaNote = (item.eta_note ?? "").trim() || (isRange ? `ETA ${normalizedRange} dagar` : "");
    try {
      const response = await fetch(`${apiBase}/api/admin/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: item.product_id,
          quantity_in_stock: item.quantity_in_stock ?? 0,
          is_preorder: Boolean(item.is_preorder),
          eta_days: etaDays,
          eta_note: etaNote,
          price_cents: item.price_cents ?? 0,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Kunde inte spara lagret.");
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte spara lagret.");
    } finally {
      setSavingId(null);
    }
  };

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => (item.product?.name || item.product_id).toLowerCase().includes(term));
  }, [items, query]);

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
          <h2 className="text-2xl font-semibold">Lager</h2>
          <p className="text-sm text-slate-400">Hantera lagerstatus, priser och förbeställningar.</p>
        </div>
        <button
          type="button"
          onClick={loadInventory}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-4 py-2 text-sm font-semibold hover:border-[#11667b] hover:text-[#11667b]"
        >
          <RefreshCcw className="h-4 w-4" />
          Uppdatera
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Sök produkt"
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      {loading && <p className="text-sm text-slate-400">Verifierar åtkomst...</p>}
      {!loading && error && <p className="text-sm text-red-400">{error}</p>}
      {localError && <p className="text-sm text-red-400">{localError}</p>}
      {loadingItems && <p className="text-sm text-slate-400">Laddar lager...</p>}

      <div className="space-y-4">
        {filteredItems.map((item) => {
          const name = item.product?.name || item.product_id;
          const priceCents = Number(item.price_cents ?? 0);
          const inStock = Number(item.quantity_in_stock ?? 0);
          return (
            <div key={item.product_id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{name}</p>
                  <p className="text-xs text-slate-500">{item.product_id}</p>
                  <p className="mt-2 text-sm text-slate-300">
                    {inStock > 0 ? `I lager: ${inStock} st` : "Slut i lager"}
                  </p>
                </div>
                <div className="text-right text-sm text-slate-300">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Pris</p>
                  <p className="text-lg font-semibold">{formatCurrency(priceCents / 100)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <label className="text-xs text-slate-400">
                  Antal i lager
                  <input
                    type="number"
                    min="0"
                    value={item.quantity_in_stock ?? 0}
                    onChange={(event) => handleChange(item.product_id, "quantity_in_stock", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Pris (SEK)
                  <input
                    type="number"
                    min="0"
                    value={priceCents / 100}
                    onChange={(event) =>
                      handleChange(item.product_id, "price_cents", Number(event.target.value) * 100)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Förbeställning
                  <select
                    value={item.is_preorder ? "true" : "false"}
                    onChange={(event) => handleChange(item.product_id, "is_preorder", event.target.value === "true")}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="false">Nej</option>
                    <option value="true">Ja</option>
                  </select>
                </label>
                <label className="text-xs text-slate-400">
                  ETA (dagar)
                  <input
                    type="text"
                    value={item.eta_input ?? ""}
                    onChange={(event) => handleChange(item.product_id, "eta_input", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                    placeholder="Ex: 5-10"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  ETA-notis
                  <input
                    type="text"
                    value={item.eta_note ?? ""}
                    onChange={(event) => handleChange(item.product_id, "eta_note", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                    placeholder="Ex: Leverans vecka 12"
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSave(item)}
                  className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white disabled:opacity-70"
                  disabled={savingId === item.product_id}
                >
                  <Save className="h-4 w-4" />
                  {savingId === item.product_id ? "Sparar..." : "Spara ändringar"}
                </button>
              </div>
            </div>
          );
        })}

        {!loadingItems && filteredItems.length === 0 && (
          <p className="text-sm text-slate-400">Inga produkter matchar din sökning.</p>
        )}
      </div>
    </div>
  );
}
