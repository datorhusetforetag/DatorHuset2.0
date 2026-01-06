import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Save, Search, SlidersHorizontal } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { AdminAccessContext } from "../useAdminAccess";

type AdminProduct = {
  id: string;
  name: string;
  description?: string | null;
  price_cents?: number | null;
  cpu?: string | null;
  gpu?: string | null;
  ram?: string | null;
  storage?: string | null;
  storage_type?: string | null;
  tier?: string | null;
  slug?: string | null;
  legacy_id?: string | null;
};

type FpsSettings = {
  dlssMultiplier: number;
  frameGenMultiplier: number;
};

const DEFAULT_FPS_SETTINGS: FpsSettings = {
  dlssMultiplier: 1.2,
  frameGenMultiplier: 1.15,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(value);

export default function AdminProducts() {
  const { isAdmin, loading, error, token, apiBase, signInWithGoogle } =
    useOutletContext<AdminAccessContext>();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [query, setQuery] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");
  const [fpsSettings, setFpsSettings] = useState<FpsSettings>(DEFAULT_FPS_SETTINGS);
  const [savingFps, setSavingFps] = useState(false);

  const loadProducts = async () => {
    if (!token || !isAdmin) return;
    setLoadingProducts(true);
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/products`, {
        headers: { Authorization: `Bearer ${token}`, "X-Access-Token": token },
      });
      if (!response.ok) {
        throw new Error("Kunde inte h\u00e4mta produkter.");
      }
      const data = await response.json();
      setProducts(data || []);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte h\u00e4mta produkter.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadFpsSettings = async () => {
    if (!token || !isAdmin) return;
    try {
      const response = await fetch(`${apiBase}/api/admin/ui-settings`, {
        headers: { Authorization: `Bearer ${token}`, "X-Access-Token": token },
      });
      if (!response.ok) {
        throw new Error("Kunde inte h\u00e4mta FPS-inst\u00e4llningar.");
      }
      const data = await response.json();
      if (data?.fps) {
        setFpsSettings({
          dlssMultiplier: Number(data.fps.dlssMultiplier ?? DEFAULT_FPS_SETTINGS.dlssMultiplier),
          frameGenMultiplier: Number(data.fps.frameGenMultiplier ?? DEFAULT_FPS_SETTINGS.frameGenMultiplier),
        });
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte h\u00e4mta FPS-inst\u00e4llningar.");
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadProducts();
      loadFpsSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleChange = (productId: string, field: keyof AdminProduct, value: string | number) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              [field]:
                field === "price_cents" ? Number(value) : typeof value === "string" ? value : value,
            }
          : product
      )
    );
  };

  const handleSave = async (product: AdminProduct) => {
    if (!token || !isAdmin) return;
    setSavingId(product.id);
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/products/${product.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Access-Token": token,
        },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          price_cents: product.price_cents ?? 0,
          cpu: product.cpu,
          gpu: product.gpu,
          ram: product.ram,
          storage: product.storage,
          storage_type: product.storage_type,
          tier: product.tier,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Kunde inte spara produkten.");
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte spara produkten.");
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveFps = async () => {
    if (!token || !isAdmin) return;
    setSavingFps(true);
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/ui-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Access-Token": token,
        },
        body: JSON.stringify({ fps: fpsSettings }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Kunde inte spara FPS-inst\u00e4llningar.");
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte spara FPS-inst\u00e4llningar.");
    } finally {
      setSavingFps(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      `${product.name} ${product.slug ?? ""} ${product.legacy_id ?? ""}`.toLowerCase().includes(term)
    );
  }, [products, query]);

  if (!token) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <h2 className="text-xl font-semibold">Logga in f\u00f6r att forts\u00e4tta</h2>
        <p className="mt-2 text-sm text-slate-400">Du m\u00e5ste vara inloggad med ditt admin-konto.</p>
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
          <h2 className="text-2xl font-semibold">Produkt-UI</h2>
          <p className="text-sm text-slate-400">Uppdatera titel, specs, pris och FPS-inst\u00e4llningar.</p>
        </div>
        <button
          type="button"
          onClick={loadProducts}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-4 py-2 text-sm font-semibold hover:border-[#11667b] hover:text-[#11667b]"
        >
          <RefreshCcw className="h-4 w-4" />
          Uppdatera
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Verifierar \u00e5tkomst...</p>}
      {!loading && error && <p className="text-sm text-red-400">{error}</p>}
      {localError && <p className="text-sm text-red-400">{localError}</p>}
      {loadingProducts && <p className="text-sm text-slate-400">Laddar produkter...</p>}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Uppskattad FPS</p>
            <h3 className="text-lg font-semibold text-white">Multiplier-inst\u00e4llningar</h3>
            <p className="text-sm text-slate-400">
              Justera hur mycket DLSS/FSR och Frame Generation p\u00e5verkar FPS-ber\u00e4kningen.
            </p>
          </div>
          <SlidersHorizontal className="h-5 w-5 text-[#11667b]" />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-xs text-slate-400">
            DLSS/FSR multiplier
            <input
              type="number"
              step="0.01"
              min="0"
              value={fpsSettings.dlssMultiplier}
              onChange={(event) =>
                setFpsSettings((prev) => ({ ...prev, dlssMultiplier: Number(event.target.value) }))
              }
              className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Frame Gen multiplier
            <input
              type="number"
              step="0.01"
              min="0"
              value={fpsSettings.frameGenMultiplier}
              onChange={(event) =>
                setFpsSettings((prev) => ({ ...prev, frameGenMultiplier: Number(event.target.value) }))
              }
              className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSaveFps}
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white disabled:opacity-70"
            disabled={savingFps}
          >
            <Save className="h-4 w-4" />
            {savingFps ? "Sparar..." : "Spara FPS-inst\u00e4llningar"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="S\u00f6k produkt"
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      <div className="space-y-4">
        {filteredProducts.map((product) => {
          const priceCents = Number(product.price_cents ?? 0);
          return (
            <div key={product.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.id}</p>
                  <p className="mt-2 text-sm text-slate-300">{formatCurrency(priceCents / 100)}</p>
                </div>
                <div className="text-right text-sm text-slate-300">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Slug</p>
                  <p className="text-sm">{product.slug || "-"}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mt-2">Legacy ID</p>
                  <p className="text-sm">{product.legacy_id || "-"}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-xs text-slate-400">
                  Titel
                  <input
                    type="text"
                    value={product.name}
                    onChange={(event) => handleChange(product.id, "name", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Pris (SEK)
                  <input
                    type="number"
                    min="0"
                    value={priceCents / 100}
                    onChange={(event) => handleChange(product.id, "price_cents", Number(event.target.value) * 100)}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  CPU
                  <input
                    type="text"
                    value={product.cpu ?? ""}
                    onChange={(event) => handleChange(product.id, "cpu", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  GPU
                  <input
                    type="text"
                    value={product.gpu ?? ""}
                    onChange={(event) => handleChange(product.id, "gpu", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  RAM
                  <input
                    type="text"
                    value={product.ram ?? ""}
                    onChange={(event) => handleChange(product.id, "ram", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Lagring
                  <input
                    type="text"
                    value={product.storage ?? ""}
                    onChange={(event) => handleChange(product.id, "storage", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Lagringstyp
                  <input
                    type="text"
                    value={product.storage_type ?? ""}
                    onChange={(event) => handleChange(product.id, "storage_type", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Kategori
                  <input
                    type="text"
                    value={product.tier ?? ""}
                    onChange={(event) => handleChange(product.id, "tier", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400 md:col-span-2 xl:col-span-4">
                  Beskrivning
                  <textarea
                    value={product.description ?? ""}
                    onChange={(event) => handleChange(product.id, "description", event.target.value)}
                    className="mt-1 min-h-[96px] w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSave(product)}
                  className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white disabled:opacity-70"
                  disabled={savingId === product.id}
                >
                  <Save className="h-4 w-4" />
                  {savingId === product.id ? "Sparar..." : "Spara \u00e4ndringar"}
                </button>
              </div>
            </div>
          );
        })}

        {!loadingProducts && filteredProducts.length === 0 && (
          <p className="text-sm text-slate-400">Inga produkter matchar din s\u00f6kning.</p>
        )}
      </div>
    </div>
  );
}
