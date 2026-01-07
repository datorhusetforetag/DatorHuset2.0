import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Save, Search } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { AdminAccessContext } from "../useAdminAccess";

type AdminProduct = {
  id: string;
  name: string;
  description?: string | null;
  cpu?: string | null;
  gpu?: string | null;
  ram?: string | null;
  storage?: string | null;
  storage_type?: string | null;
  tier?: string | null;
  motherboard?: string | null;
  psu?: string | null;
  case_name?: string | null;
  cpu_cooler?: string | null;
  os?: string | null;
  slug?: string | null;
  legacy_id?: string | null;
  dlss_multiplier?: number | null;
  frame_gen_multiplier?: number | null;
};

export default function AdminProducts() {
  const { isAdmin, loading, error, token, apiBase, signInWithGoogle } =
    useOutletContext<AdminAccessContext>();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [query, setQuery] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");

  const loadProducts = async () => {
    if (!token || !isAdmin) return;
    setLoadingProducts(true);
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Kunde inte hämta produkter.");
      }
      const data = await response.json();
      setProducts(data || []);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte hämta produkter.");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleChange = (productId: string, field: keyof AdminProduct, value: string | number | null) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              [field]: typeof value === "string" ? value : value,
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
        },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          cpu: product.cpu,
          gpu: product.gpu,
          ram: product.ram,
          storage: product.storage,
          storage_type: product.storage_type,
          tier: product.tier,
          motherboard: product.motherboard,
          psu: product.psu,
          case_name: product.case_name,
          cpu_cooler: product.cpu_cooler,
          os: product.os,
          dlss_multiplier: product.dlss_multiplier ?? null,
          frame_gen_multiplier: product.frame_gen_multiplier ?? null,
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
  };\r\n
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
          <h2 className="text-2xl font-semibold">Produkt-UI</h2>
          <p className="text-sm text-slate-400">Uppdatera titel, specs och multiplikatorer.</p>
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

      {loading && <p className="text-sm text-slate-400">Verifierar åtkomst...</p>}
      {!loading && error && <p className="text-sm text-red-400">{error}</p>}
      {localError && <p className="text-sm text-red-400">{localError}</p>}
      {loadingProducts && <p className="text-sm text-slate-400">Laddar produkter...</p>}

      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Sök produkt"
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      <div className="space-y-4">
        {filteredProducts.map((product) => {
          return (
            <div key={product.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.id}</p>
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
                <label className="text-xs text-slate-400">
                  Moderkort
                  <input
                    type="text"
                    value={product.motherboard ?? ""}
                    onChange={(event) => handleChange(product.id, "motherboard", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Nätaggregat
                  <input
                    type="text"
                    value={product.psu ?? ""}
                    onChange={(event) => handleChange(product.id, "psu", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Chassi
                  <input
                    type="text"
                    value={product.case_name ?? ""}
                    onChange={(event) => handleChange(product.id, "case_name", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  CPU-kylare
                  <input
                    type="text"
                    value={product.cpu_cooler ?? ""}
                    onChange={(event) => handleChange(product.id, "cpu_cooler", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Operativsystem
                  <input
                    type="text"
                    value={product.os ?? ""}
                    onChange={(event) => handleChange(product.id, "os", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  DLSS/FSR multiplier
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={product.dlss_multiplier ?? ""}
                    onChange={(event) =>
                      handleChange(
                        product.id,
                        "dlss_multiplier",
                        event.target.value === "" ? null : Number(event.target.value)
                      )
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
                    value={product.frame_gen_multiplier ?? ""}
                    onChange={(event) =>
                      handleChange(
                        product.id,
                        "frame_gen_multiplier",
                        event.target.value === "" ? null : Number(event.target.value)
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-xs text-slate-400 md:col-span-2 xl:col-span-4">
                  Beskrivning
                  <textarea
                    value={product.description ?? ""}
                    onChange={(event) => handleChange(product.id, "description", event.target.value)}
                    className="mt-1 min-h-[96px] w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                    placeholder="Skriv Produktinfo-texter har. Separera stycken med en tom rad."
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
                  {savingId === product.id ? "Sparar..." : "Spara ändringar"}
                </button>
              </div>
            </div>
          );
        })}

        {!loadingProducts && filteredProducts.length === 0 && (
          <p className="text-sm text-slate-400">Inga produkter matchar din sökning.</p>
        )}
      </div>
    </div>
  );
}






