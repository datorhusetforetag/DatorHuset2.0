import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCcw, Save, Search, Trash2 } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { AdminAccessContext } from "../useAdminAccess";
import {
  createEmptyFpsEntry,
  FpsSandboxEntry,
  FpsSandboxSettings,
  FPS_SANDBOX_GAME_OPTIONS,
  FPS_SANDBOX_RESOLUTION_OPTIONS,
  normalizeFpsSandboxSettings,
} from "@/lib/fpsSandbox";
import {
  DEFAULT_USED_PARTS_SETTINGS,
  sanitizeUsedPartsSettings,
  USED_PART_KEYS,
  USED_PART_LABELS,
  UsedPartsSettings,
} from "@/lib/usedParts";

type AdminProduct = {
  id: string;
  name: string;
  slug?: string | null;
  legacy_id?: string | null;
  description?: string | null;
  price_cents?: number | null;
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
};

type InventoryItem = {
  product_id: string;
  quantity_in_stock?: number | null;
  is_preorder?: boolean | null;
  allow_preorder?: boolean | null;
  eta_days?: number | null;
  eta_note?: string | null;
  product?: { price_cents?: number | null };
};

type CatalogItem = AdminProduct & {
  quantity_in_stock: number;
  is_preorder: boolean;
  eta_input: string;
  eta_note: string;
  used_variant_enabled: boolean;
};

type ListingDraft = {
  name: string;
  slug: string;
  legacy_id: string;
  description: string;
  price_cents: number;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  storage_type: string;
  tier: string;
  motherboard: string;
  psu: string;
  case_name: string;
  cpu_cooler: string;
  os: string;
  quantity_in_stock: number;
  is_preorder: boolean;
  eta_input: string;
  eta_note: string;
};

type ListingField = Exclude<keyof ListingDraft, "is_preorder" | "description">;

const PRODUCT_FORM_FIELDS: ListingField[] = [
  "name",
  "slug",
  "legacy_id",
  "price_cents",
  "cpu",
  "gpu",
  "ram",
  "storage",
  "storage_type",
  "tier",
  "motherboard",
  "psu",
  "case_name",
  "cpu_cooler",
  "os",
  "quantity_in_stock",
  "eta_input",
  "eta_note",
];

const FIELD_LABELS: Record<ListingField, string> = {
  name: "Titel",
  slug: "Slug",
  legacy_id: "Legacy-ID",
  price_cents: "Pris (öre)",
  cpu: "CPU",
  gpu: "GPU",
  ram: "RAM",
  storage: "Lagring",
  storage_type: "Lagringstyp",
  tier: "Kategori",
  motherboard: "Moderkort",
  psu: "PSU",
  case_name: "Chassi",
  cpu_cooler: "CPU-kylare",
  os: "Operativsystem",
  quantity_in_stock: "Antal i lager",
  eta_input: "ETA (dagar)",
  eta_note: "ETA-notis",
};

const NUMERIC_FIELDS = new Set<ListingField>(["price_cents", "quantity_in_stock"]);

const EMPTY_DRAFT: ListingDraft = {
  name: "",
  slug: "",
  legacy_id: "",
  description: "",
  price_cents: 0,
  cpu: "",
  gpu: "",
  ram: "",
  storage: "",
  storage_type: "SSD",
  tier: "Silver",
  motherboard: "",
  psu: "",
  case_name: "",
  cpu_cooler: "",
  os: "Windows 11 Pro",
  quantity_in_stock: 0,
  is_preorder: false,
  eta_input: "",
  eta_note: "",
};

const toEtaInput = (inventory?: InventoryItem | null) => {
  if (!inventory) return "";
  const note = String(inventory.eta_note || "");
  const range = note.match(/ETA\s+(\d+\s*-\s*\d+)\s*dagar/i);
  if (range?.[1]) return range[1].replace(/\s+/g, "");
  if (inventory.eta_days !== null && inventory.eta_days !== undefined) return String(inventory.eta_days);
  return "";
};

const parseEta = (etaInputRaw: string, etaNoteRaw: string) => {
  const etaInput = etaInputRaw.trim();
  const etaNote = etaNoteRaw.trim();
  if (/^\d+\s*-\s*\d+$/.test(etaInput)) {
    const compact = etaInput.replace(/\s+/g, "");
    return { eta_days: null, eta_note: etaNote || `ETA ${compact} dagar` };
  }
  if (/^\d+$/.test(etaInput)) {
    return { eta_days: Number(etaInput), eta_note: etaNote || null };
  }
  return { eta_days: null, eta_note: etaNote || null };
};

const slugify = (value: string) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const buildUsedDraftFromBase = (base: ListingDraft): ListingDraft => {
  const baseSlug = base.slug || slugify(base.name);
  return {
    ...base,
    name: base.name ? `${base.name} - Begagnade` : "",
    slug: baseSlug ? `${baseSlug}-begagnade` : "",
  };
};

const normalizeFpsEditorEntry = (entry: FpsSandboxEntry): FpsSandboxEntry => {
  const game = FPS_SANDBOX_GAME_OPTIONS.includes(entry.game as (typeof FPS_SANDBOX_GAME_OPTIONS)[number])
    ? entry.game
    : FPS_SANDBOX_GAME_OPTIONS[0];
  const resolution = FPS_SANDBOX_RESOLUTION_OPTIONS.includes(
    entry.resolution as (typeof FPS_SANDBOX_RESOLUTION_OPTIONS)[number]
  )
    ? entry.resolution
    : FPS_SANDBOX_RESOLUTION_OPTIONS[0];
  const supportsDlssFsr = Boolean(entry.supportsDlssFsr);
  return {
    game,
    resolution,
    graphics: String(entry.graphics || ""),
    baseFps: Math.max(0, Number(entry.baseFps) || 0),
    supportsDlssFsr,
    dlssFsrMode: supportsDlssFsr ? "balanced" : null,
    supportsFrameGeneration: Boolean(entry.supportsFrameGeneration),
  };
};

const makeNewFpsEntry = (): FpsSandboxEntry =>
  normalizeFpsEditorEntry({
    ...createEmptyFpsEntry(),
    game: FPS_SANDBOX_GAME_OPTIONS[0],
    resolution: FPS_SANDBOX_RESOLUTION_OPTIONS[0],
    graphics: "",
  });

const hasInvalidFpsEntries = (entries: FpsSandboxEntry[]) =>
  entries.some((entry) => !String(entry.graphics || "").trim());

export default function AdminProducts() {
  const { isAdmin, loading, error, token, apiBase, signInWithGoogle } =
    useOutletContext<AdminAccessContext>();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [query, setQuery] = useState("");
  const [loadingItems, setLoadingItems] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");

  const [draft, setDraft] = useState<ListingDraft>(EMPTY_DRAFT);
  const [createUsedVariant, setCreateUsedVariant] = useState(false);
  const [usedDraft, setUsedDraft] = useState<ListingDraft>(buildUsedDraftFromBase(EMPTY_DRAFT));
  const [usedDraftParts, setUsedDraftParts] = useState<UsedPartsSettings>(DEFAULT_USED_PARTS_SETTINGS);
  const [creating, setCreating] = useState(false);

  const [draftFpsEntries, setDraftFpsEntries] = useState<FpsSandboxEntry[]>([]);
  const [fpsByProduct, setFpsByProduct] = useState<Record<string, FpsSandboxSettings>>({});
  const [fpsLoadingByProduct, setFpsLoadingByProduct] = useState<Record<string, boolean>>({});
  const [fpsSavingByProduct, setFpsSavingByProduct] = useState<Record<string, boolean>>({});
  const [usedPartsByProduct, setUsedPartsByProduct] = useState<Record<string, UsedPartsSettings>>({});
  const [usedPartsLoadingByProduct, setUsedPartsLoadingByProduct] = useState<Record<string, boolean>>({});
  const [usedPartsSavingByProduct, setUsedPartsSavingByProduct] = useState<Record<string, boolean>>({});

  const loadItems = async () => {
    if (!token || !isAdmin) return;
    setLoadingItems(true);
    setLocalError("");
    try {
      const [productsRes, inventoryRes] = await Promise.all([
        fetch(`${apiBase}/api/admin/products`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/api/admin/inventory`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!productsRes.ok) throw new Error("Kunde inte hämta produkter.");
      if (!inventoryRes.ok) throw new Error("Kunde inte hämta lager.");

      const products: AdminProduct[] = await productsRes.json();
      const inventory: InventoryItem[] = await inventoryRes.json();
      const inventoryMap = new Map(inventory.map((row) => [row.product_id, row]));
      const merged = (products || [])
        .filter((product) => {
          const name = (product.name || "").trim().toLowerCase();
          const slug = (product.slug || "").trim().toLowerCase();
          return name !== "remove" && slug !== "test";
        })
        .map((product) => {
          const inv = inventoryMap.get(product.id);
          const invPrice = Number(inv?.product?.price_cents ?? NaN);
          return {
            ...product,
            price_cents: Number.isFinite(invPrice) ? invPrice : Number(product.price_cents || 0),
            quantity_in_stock: Math.max(0, Number(inv?.quantity_in_stock ?? 0)),
            is_preorder: Boolean(inv?.is_preorder ?? inv?.allow_preorder),
            eta_input: toEtaInput(inv),
            eta_note: String(inv?.eta_note || ""),
            used_variant_enabled: true,
          } as CatalogItem;
        });
      setItems(merged);

      const flags = await Promise.all(
        merged.map(async (item) => {
          try {
            const response = await fetch(`${apiBase}/api/admin/products/${item.id}/used-variant`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) return [item.id, true] as const;
            const data = await response.json();
            return [item.id, Boolean(data?.enabled ?? true)] as const;
          } catch {
            return [item.id, true] as const;
          }
        })
      );
      const flagMap = new Map(flags);
      setItems((prev) => prev.map((item) => ({ ...item, used_variant_enabled: flagMap.get(item.id) ?? true })));

      const fpsPairs = await Promise.all(
        merged.map(async (item) => {
          try {
            const response = await fetch(`${apiBase}/api/admin/products/${item.id}/fps-settings`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
              return [item.id, normalizeFpsSandboxSettings({ version: 2, entries: [] })] as const;
            }
            const data = await response.json();
            return [item.id, normalizeFpsSandboxSettings(data?.fps || { version: 2, entries: [] })] as const;
          } catch {
            return [item.id, normalizeFpsSandboxSettings({ version: 2, entries: [] })] as const;
          }
        })
      );
      setFpsByProduct(Object.fromEntries(fpsPairs));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte hämta data.");
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (isAdmin) void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const setItem = <K extends keyof CatalogItem>(id: string, key: K, value: CatalogItem[K]) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const setDraftField = (key: ListingField, rawValue: string) => {
    setDraft((prev) => ({
      ...prev,
      [key]: NUMERIC_FIELDS.has(key) ? Math.max(0, Number(rawValue) || 0) : rawValue,
    }));
  };

  const setUsedDraftField = (key: ListingField, rawValue: string) => {
    setUsedDraft((prev) => ({
      ...prev,
      [key]: NUMERIC_FIELDS.has(key) ? Math.max(0, Number(rawValue) || 0) : rawValue,
    }));
  };

  const persistUsedParts = async (productId: string, value: UsedPartsSettings) => {
    const response = await fetch(`${apiBase}/api/admin/products/${productId}/used-parts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ used_parts: value }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || "Kunde inte spara begagnade komponenttaggar.");
    return sanitizeUsedPartsSettings(data?.used_parts);
  };

  const saveItem = async (item: CatalogItem) => {
    if (!token || !isAdmin) return;
    setSavingId(item.id);
    setLocalError("");
    try {
      const productRes = await fetch(`${apiBase}/api/admin/products/${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: item.name,
          slug: item.slug || "",
          legacy_id: item.legacy_id || "",
          description: item.description || "",
          cpu: item.cpu || "",
          gpu: item.gpu || "",
          ram: item.ram || "",
          storage: item.storage || "",
          storage_type: item.storage_type || "",
          tier: item.tier || "",
          motherboard: item.motherboard || "",
          psu: item.psu || "",
          case_name: item.case_name || "",
          cpu_cooler: item.cpu_cooler || "",
          os: item.os || "",
        }),
      });
      const productData = await productRes.json().catch(() => ({}));
      if (!productRes.ok) throw new Error(productData?.error || "Kunde inte spara produkt.");

      const eta = parseEta(item.eta_input, item.eta_note);
      const inventoryRes = await fetch(`${apiBase}/api/admin/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productId: item.id,
          quantity_in_stock: Math.max(0, Number(item.quantity_in_stock || 0)),
          is_preorder: Boolean(item.is_preorder),
          eta_days: eta.eta_days,
          eta_note: eta.eta_note,
          price_cents: Math.max(0, Math.round(Number(item.price_cents || 0))),
        }),
      });
      const inventoryData = await inventoryRes.json().catch(() => ({}));
      if (!inventoryRes.ok) throw new Error(inventoryData?.error || "Kunde inte spara lager.");

      const usedRes = await fetch(`${apiBase}/api/admin/products/${item.id}/used-variant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: Boolean(item.used_variant_enabled) }),
      });
      const usedData = await usedRes.json().catch(() => ({}));
      if (!usedRes.ok) throw new Error(usedData?.error || "Kunde inte spara begagnad variant.");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte spara.");
    } finally {
      setSavingId(null);
    }
  };

  const loadFps = async (productId: string) => {
    if (!token || !isAdmin) return;
    setFpsLoadingByProduct((prev) => ({ ...prev, [productId]: true }));
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/products/${productId}/fps-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Kunde inte hämta FPS-inställningar.");
      const data = await response.json();
      setFpsByProduct((prev) => ({
        ...prev,
        [productId]: normalizeFpsSandboxSettings(data?.fps || { version: 2, entries: [] }),
      }));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte hämta FPS-inställningar.");
    } finally {
      setFpsLoadingByProduct((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const updateFpsEntry = (productId: string, index: number, patch: Partial<FpsSandboxEntry>) => {
    setFpsByProduct((prev) => {
      const current = prev[productId] || normalizeFpsSandboxSettings({ version: 2, entries: [] });
      const entries = current.entries.map((entry, i) =>
        i === index ? normalizeFpsEditorEntry({ ...entry, ...patch }) : entry
      );
      return { ...prev, [productId]: normalizeFpsSandboxSettings({ version: 2, entries }) };
    });
  };

  const saveFps = async (productId: string) => {
    if (!token || !isAdmin) return;
    const current = fpsByProduct[productId] || normalizeFpsSandboxSettings({ version: 2, entries: [] });
    const entries = current.entries.map((entry) => normalizeFpsEditorEntry(entry));
    if (hasInvalidFpsEntries(entries)) {
      setLocalError("Alla FPS-rader måste ha en grafik-text innan de kan sparas.");
      return;
    }
    const fps = normalizeFpsSandboxSettings({ version: 2, entries });
    setFpsSavingByProduct((prev) => ({ ...prev, [productId]: true }));
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/products/${productId}/fps-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fps }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Kunde inte spara FPS-inställningar.");
      setFpsByProduct((prev) => ({ ...prev, [productId]: normalizeFpsSandboxSettings(data?.fps || fps) }));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte spara FPS-inställningar.");
    } finally {
      setFpsSavingByProduct((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const loadUsedParts = async (productId: string) => {
    if (!token || !isAdmin) return;
    setUsedPartsLoadingByProduct((prev) => ({ ...prev, [productId]: true }));
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/products/${productId}/used-parts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Kunde inte hämta begagnade komponenttaggar.");
      const data = await response.json();
      setUsedPartsByProduct((prev) => ({ ...prev, [productId]: sanitizeUsedPartsSettings(data?.used_parts) }));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte hämta begagnade komponenttaggar.");
    } finally {
      setUsedPartsLoadingByProduct((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const saveUsedParts = async (productId: string) => {
    if (!token || !isAdmin) return;
    setUsedPartsSavingByProduct((prev) => ({ ...prev, [productId]: true }));
    setLocalError("");
    try {
      const current = sanitizeUsedPartsSettings(usedPartsByProduct[productId]);
      const saved = await persistUsedParts(productId, current);
      setUsedPartsByProduct((prev) => ({ ...prev, [productId]: saved }));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte spara begagnade komponenttaggar.");
    } finally {
      setUsedPartsSavingByProduct((prev) => ({ ...prev, [productId]: false }));
    }
  };
  const createProduct = async (input: ListingDraft) => {
    const response = await fetch(`${apiBase}/api/admin/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...input,
        slug: input.slug || slugify(input.name),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || "Kunde inte skapa produkt.");
    return data as AdminProduct;
  };

  const saveInventoryForCreatedProduct = async (productId: string, input: ListingDraft) => {
    const eta = parseEta(input.eta_input, input.eta_note);
    const response = await fetch(`${apiBase}/api/admin/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        productId,
        quantity_in_stock: Math.max(0, Number(input.quantity_in_stock || 0)),
        is_preorder: Boolean(input.is_preorder),
        eta_days: eta.eta_days,
        eta_note: eta.eta_note,
        price_cents: Math.max(0, Math.round(Number(input.price_cents || 0))),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || "Kunde inte spara lager för ny produkt.");
  };

  const createListing = async () => {
    if (!token || !isAdmin) return;
    if (!draft.name || !draft.cpu || !draft.gpu || !draft.ram || !draft.storage) {
      setLocalError("Fyll i titel, CPU, GPU, RAM och lagring innan du skapar produkten.");
      return;
    }

    const normalizedDraftFps = draftFpsEntries.map((entry) => normalizeFpsEditorEntry(entry));
    if (hasInvalidFpsEntries(normalizedDraftFps)) {
      setLocalError("Alla FPS-rader måste ha en grafik-text innan du kan skapa produkten.");
      return;
    }

    setCreating(true);
    setLocalError("");
    try {
      const baseProduct = await createProduct(draft);
      await saveInventoryForCreatedProduct(baseProduct.id, draft);
      if (normalizedDraftFps.length > 0) {
        await fetch(`${apiBase}/api/admin/products/${baseProduct.id}/fps-settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fps: normalizeFpsSandboxSettings({ version: 2, entries: normalizedDraftFps }) }),
        });
      }

      if (createUsedVariant) {
        const resolvedUsed: ListingDraft = {
          ...usedDraft,
          name: (usedDraft.name || `${draft.name} - Begagnade`).trim(),
          slug: (usedDraft.slug || `${slugify(draft.name)}-begagnade`).trim(),
        };
        const usedProduct = await createProduct(resolvedUsed);
        await saveInventoryForCreatedProduct(usedProduct.id, resolvedUsed);
        await persistUsedParts(usedProduct.id, usedDraftParts);
        await fetch(`${apiBase}/api/admin/products/${baseProduct.id}/used-variant`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ enabled: true }),
        });
      }

      setDraft(EMPTY_DRAFT);
      setUsedDraft(buildUsedDraftFromBase(EMPTY_DRAFT));
      setUsedDraftParts(DEFAULT_USED_PARTS_SETTINGS);
      setCreateUsedVariant(false);
      setDraftFpsEntries([]);
      await loadItems();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte skapa produkt.");
    } finally {
      setCreating(false);
    }
  };

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      `${item.name} ${item.slug || ""} ${item.legacy_id || ""} ${item.id}`.toLowerCase().includes(term)
    );
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
          <h2 className="text-2xl font-semibold">Produkter & lager</h2>
          <p className="text-sm text-slate-400">Produktinfo, pris, lager, begagnad variant och uppskattad FPS.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadItems()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-4 py-2 text-sm font-semibold hover:border-[#11667b] hover:text-[#11667b]"
        >
          <RefreshCcw className="h-4 w-4" />
          Uppdatera
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Verifierar åtkomst...</p>}
      {!loading && error && <p className="text-sm text-red-400">{error}</p>}
      {localError && <p className="text-sm text-red-400">{localError}</p>}
      {loadingItems && <p className="text-sm text-slate-400">Laddar produkter...</p>}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white">Skapa ny produkt</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {PRODUCT_FORM_FIELDS.map((key) => (
            <label key={`draft-${key}`} className="text-xs text-slate-400">
              {FIELD_LABELS[key]}
              <input
                type={NUMERIC_FIELDS.has(key) ? "number" : "text"}
                value={String(draft[key] ?? "")}
                onChange={(event) => setDraftField(key, event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              />
            </label>
          ))}
          <label className="text-xs text-slate-400">
            Förbeställning
            <select
              value={draft.is_preorder ? "true" : "false"}
              onChange={(event) => setDraft((prev) => ({ ...prev, is_preorder: event.target.value === "true" }))}
              className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            >
              <option value="false">Nej</option>
              <option value="true">Ja</option>
            </select>
          </label>
        </div>
        <label className="block text-xs text-slate-400">
          Beskrivning
          <textarea
            rows={2}
            value={draft.description}
            onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
        </label>

        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 space-y-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={createUsedVariant}
              onChange={(event) => {
                const enabled = event.target.checked;
                setCreateUsedVariant(enabled);
                if (enabled) {
                  setUsedDraft(buildUsedDraftFromBase(draft));
                  setUsedDraftParts(DEFAULT_USED_PARTS_SETTINGS);
                }
              }}
            />
            Skapa begagnad variant
          </label>

          {createUsedVariant && (
            <>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setUsedDraft(buildUsedDraftFromBase(draft))}
                  className="rounded-lg border border-slate-700/60 px-3 py-1 text-xs text-slate-100"
                >
                  Kopiera från basprodukt
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {PRODUCT_FORM_FIELDS.map((key) => (
                  <label key={`used-draft-${key}`} className="text-xs text-slate-400">
                    {FIELD_LABELS[key]}
                    <input
                      type={NUMERIC_FIELDS.has(key) ? "number" : "text"}
                      value={String(usedDraft[key] ?? "")}
                      onChange={(event) => setUsedDraftField(key, event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>
                ))}
                <label className="text-xs text-slate-400">
                  Förbeställning
                  <select
                    value={usedDraft.is_preorder ? "true" : "false"}
                    onChange={(event) => setUsedDraft((prev) => ({ ...prev, is_preorder: event.target.value === "true" }))}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="false">Nej</option>
                    <option value="true">Ja</option>
                  </select>
                </label>
              </div>

              <label className="block text-xs text-slate-400">
                Beskrivning
                <textarea
                  rows={2}
                  value={usedDraft.description}
                  onChange={(event) => setUsedDraft((prev) => ({ ...prev, description: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                />
              </label>

              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                <p className="text-sm text-slate-200">Begagnade komponenttaggar för varianten</p>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  {USED_PART_KEYS.map((key) => (
                    <label key={`used-draft-part-${key}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-950/70 px-3 py-2 text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={usedDraftParts[key]}
                        onChange={(event) =>
                          setUsedDraftParts((prev) => ({ ...prev, [key]: event.target.checked }))
                        }
                      />
                      {USED_PART_LABELS[key]}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-200">FPS-variabler för nya produkten</p>
            <button
              type="button"
              onClick={() => setDraftFpsEntries((prev) => [...prev, makeNewFpsEntry()])}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700/60 px-3 py-1 text-xs text-slate-100"
            >
              <Plus className="h-3.5 w-3.5" /> Lägg till
            </button>
          </div>
          {draftFpsEntries.map((entry, index) => (
            <div key={`draft-fps-${index}`} className="grid gap-2 md:grid-cols-2 xl:grid-cols-7 items-end">
              <select
                value={entry.game}
                onChange={(event) =>
                  setDraftFpsEntries((prev) =>
                    prev.map((row, i) => (i === index ? normalizeFpsEditorEntry({ ...row, game: event.target.value }) : row))
                  )
                }
                className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-2 py-2 text-sm text-slate-100"
              >
                {FPS_SANDBOX_GAME_OPTIONS.map((game) => (
                  <option key={`draft-game-${game}`} value={game}>{game}</option>
                ))}
              </select>
              <select
                value={entry.resolution}
                onChange={(event) =>
                  setDraftFpsEntries((prev) =>
                    prev.map((row, i) => (i === index ? normalizeFpsEditorEntry({ ...row, resolution: event.target.value }) : row))
                  )
                }
                className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-2 py-2 text-sm text-slate-100"
              >
                {FPS_SANDBOX_RESOLUTION_OPTIONS.map((resolution) => (
                  <option key={`draft-resolution-${resolution}`} value={resolution}>{resolution}</option>
                ))}
              </select>
              <input
                value={entry.graphics}
                onChange={(event) =>
                  setDraftFpsEntries((prev) =>
                    prev.map((row, i) => (i === index ? normalizeFpsEditorEntry({ ...row, graphics: event.target.value }) : row))
                  )
                }
                placeholder="Grafik (fri text)"
                className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-2 py-2 text-sm text-slate-100"
              />
              <input
                type="number"
                min={0}
                value={entry.baseFps}
                onChange={(event) =>
                  setDraftFpsEntries((prev) =>
                    prev.map((row, i) => (i === index ? normalizeFpsEditorEntry({ ...row, baseFps: Math.max(0, Number(event.target.value) || 0) }) : row))
                  )
                }
                placeholder="Bas-FPS"
                className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-2 py-2 text-sm text-slate-100"
              />
              <button
                type="button"
                onClick={() =>
                  setDraftFpsEntries((prev) =>
                    prev.map((row, i) =>
                      i === index
                        ? normalizeFpsEditorEntry({
                            ...row,
                            supportsDlssFsr: !row.supportsDlssFsr,
                            dlssFsrMode: !row.supportsDlssFsr ? "balanced" : null,
                          })
                        : row
                    )
                  )
                }
                className={`rounded-lg border px-2 py-2 text-sm font-semibold ${entry.supportsDlssFsr ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200" : "border-slate-700/60 text-slate-100"}`}
              >
                DLSS/FSR {entry.supportsDlssFsr ? "På" : "Av"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setDraftFpsEntries((prev) =>
                    prev.map((row, i) =>
                      i === index
                        ? normalizeFpsEditorEntry({ ...row, supportsFrameGeneration: !row.supportsFrameGeneration })
                        : row
                    )
                  )
                }
                className={`rounded-lg border px-2 py-2 text-sm font-semibold ${entry.supportsFrameGeneration ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200" : "border-slate-700/60 text-slate-100"}`}
              >
                Frame Gen {entry.supportsFrameGeneration ? "På" : "Av"}
              </button>
              <button type="button" onClick={() => setDraftFpsEntries((prev) => prev.filter((_, i) => i !== index))} className="h-[38px] rounded-lg border border-red-500/40 text-red-300"><Trash2 className="h-4 w-4 mx-auto" /></button>
            </div>
          ))}
        </div>

        <button type="button" onClick={createListing} disabled={creating} className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white disabled:opacity-70">
          <Save className="h-4 w-4" /> {creating ? "Skapar..." : "Skapa produkt"}
        </button>
      </section>

      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sök produkt" className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none" />
      </div>

      <div className="space-y-4">
        {filteredItems.map((item) => (
          <section key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">{item.name}</p>
                <p className="text-xs text-slate-500">{item.id}</p>
              </div>
              <button type="button" onClick={() => void saveItem(item)} disabled={savingId === item.id} className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white disabled:opacity-70">
                <Save className="h-4 w-4" /> {savingId === item.id ? "Sparar..." : "Spara"}
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {PRODUCT_FORM_FIELDS.map((key) => (
                <label key={`${item.id}-${key}`} className="text-xs text-slate-400">
                  {FIELD_LABELS[key]}
                  <input
                    type={NUMERIC_FIELDS.has(key) ? "number" : "text"}
                    value={String(item[key] ?? "")}
                    onChange={(event) =>
                      setItem(
                        item.id,
                        key,
                        (NUMERIC_FIELDS.has(key) ? Math.max(0, Number(event.target.value) || 0) : event.target.value) as CatalogItem[typeof key]
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
              ))}
              <label className="text-xs text-slate-400">
                Förbeställning
                <select value={item.is_preorder ? "true" : "false"} onChange={(event) => setItem(item.id, "is_preorder", event.target.value === "true")} className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100">
                  <option value="false">Nej</option><option value="true">Ja</option>
                </select>
              </label>
              <label className="text-xs text-slate-400">
                Begagnad variant
                <select value={item.used_variant_enabled ? "true" : "false"} onChange={(event) => setItem(item.id, "used_variant_enabled", event.target.value === "true")} className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100">
                  <option value="false">Av</option><option value="true">På</option>
                </select>
              </label>
            </div>
            <label className="block text-xs text-slate-400">
              Beskrivning
              <textarea value={item.description || ""} onChange={(event) => setItem(item.id, "description", event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100" />
            </label>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-200">Begagnade komponenttaggar</p>
                {!usedPartsByProduct[item.id] ? (
                  <button type="button" onClick={() => void loadUsedParts(item.id)} disabled={usedPartsLoadingByProduct[item.id]} className="rounded-lg border border-slate-700/60 px-3 py-1 text-xs text-slate-100 disabled:opacity-70">{usedPartsLoadingByProduct[item.id] ? "Laddar..." : "Ladda"}</button>
                ) : (
                  <button type="button" onClick={() => void saveUsedParts(item.id)} disabled={usedPartsSavingByProduct[item.id]} className="rounded-lg bg-yellow-400 px-3 py-1 text-xs font-semibold text-slate-900 disabled:opacity-70">{usedPartsSavingByProduct[item.id] ? "Sparar..." : "Spara taggar"}</button>
                )}
              </div>
              {usedPartsByProduct[item.id] ? (
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  {USED_PART_KEYS.map((key) => (
                    <label key={`${item.id}-used-${key}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-950/70 px-3 py-2 text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(usedPartsByProduct[item.id]?.[key])}
                        onChange={(event) =>
                          setUsedPartsByProduct((prev) => ({
                            ...prev,
                            [item.id]: sanitizeUsedPartsSettings({ ...prev[item.id], [key]: event.target.checked }),
                          }))
                        }
                      />
                      {USED_PART_LABELS[key]}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-200">FPS-variabler för produkten</p>
                {!fpsByProduct[item.id] ? (
                  <button type="button" onClick={() => void loadFps(item.id)} disabled={fpsLoadingByProduct[item.id]} className="rounded-lg border border-slate-700/60 px-3 py-1 text-xs text-slate-100 disabled:opacity-70">{fpsLoadingByProduct[item.id] ? "Laddar..." : "Ladda"}</button>
                ) : (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setFpsByProduct((prev) => ({ ...prev, [item.id]: normalizeFpsSandboxSettings({ version: 2, entries: [...(prev[item.id]?.entries || []), makeNewFpsEntry()] }) }))} className="rounded-lg border border-slate-700/60 px-3 py-1 text-xs text-slate-100">Lägg till</button>
                    <button type="button" onClick={() => void saveFps(item.id)} disabled={fpsSavingByProduct[item.id]} className="rounded-lg bg-yellow-400 px-3 py-1 text-xs font-semibold text-slate-900 disabled:opacity-70">{fpsSavingByProduct[item.id] ? "Sparar..." : "Spara FPS"}</button>
                  </div>
                )}
              </div>
              {(fpsByProduct[item.id]?.entries || []).map((entry, index) => (
                <div key={`${item.id}-fps-${index}`} className="grid gap-2 md:grid-cols-2 xl:grid-cols-7 items-end">
                  <select value={entry.game} onChange={(event) => updateFpsEntry(item.id, index, { game: event.target.value })} className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-2 py-2 text-sm text-slate-100">
                    {FPS_SANDBOX_GAME_OPTIONS.map((game) => (
                      <option key={`${item.id}-game-${game}`} value={game}>{game}</option>
                    ))}
                  </select>
                  <select value={entry.resolution} onChange={(event) => updateFpsEntry(item.id, index, { resolution: event.target.value })} className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-2 py-2 text-sm text-slate-100">
                    {FPS_SANDBOX_RESOLUTION_OPTIONS.map((resolution) => (
                      <option key={`${item.id}-resolution-${resolution}`} value={resolution}>{resolution}</option>
                    ))}
                  </select>
                  <input value={entry.graphics} onChange={(event) => updateFpsEntry(item.id, index, { graphics: event.target.value })} placeholder="Grafik (fri text)" className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-2 py-2 text-sm text-slate-100" />
                  <input type="number" min={0} value={entry.baseFps} onChange={(event) => updateFpsEntry(item.id, index, { baseFps: Math.max(0, Number(event.target.value) || 0) })} placeholder="Bas-FPS" className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-2 py-2 text-sm text-slate-100" />
                  <button type="button" onClick={() => updateFpsEntry(item.id, index, { supportsDlssFsr: !entry.supportsDlssFsr, dlssFsrMode: !entry.supportsDlssFsr ? "balanced" : null })} className={`rounded-lg border px-2 py-2 text-sm font-semibold ${entry.supportsDlssFsr ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200" : "border-slate-700/60 text-slate-100"}`}>
                    DLSS/FSR {entry.supportsDlssFsr ? "På" : "Av"}
                  </button>
                  <button type="button" onClick={() => updateFpsEntry(item.id, index, { supportsFrameGeneration: !entry.supportsFrameGeneration })} className={`rounded-lg border px-2 py-2 text-sm font-semibold ${entry.supportsFrameGeneration ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200" : "border-slate-700/60 text-slate-100"}`}>
                    Frame Gen {entry.supportsFrameGeneration ? "På" : "Av"}
                  </button>
                  <button type="button" onClick={() => setFpsByProduct((prev) => ({ ...prev, [item.id]: normalizeFpsSandboxSettings({ version: 2, entries: (prev[item.id]?.entries || []).filter((_, i) => i !== index) }) }))} className="h-[38px] rounded-lg border border-red-500/40 text-red-300"><Trash2 className="h-4 w-4 mx-auto" /></button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}







