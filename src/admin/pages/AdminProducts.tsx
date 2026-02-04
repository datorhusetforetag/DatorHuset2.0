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
};

type FpsRange = { min: number; max: number };
type FpsPreset = Record<string, FpsRange>;
type FpsSettings = {
  games: Record<
    string,
    {
      supports: { dlss: boolean; frameGen: boolean; rayTracing: boolean };
      resolutions: Record<string, Record<string, FpsPreset>>;
    }
  >;
};

const FPS_GAMES = [
  "Fortnite",
  "Cyberpunk 2077",
  "GTA 5",
  "Minecraft",
  "CS2",
  "Ghost of Tsushima",
];
const FPS_RESOLUTIONS = ["1080p", "1440p", "4K"];
const FPS_PRESETS = ["Low", "Medium", "High", "Ultra"];
const FPS_MODE_LABELS: { key: string; label: string }[] = [
  { key: "base", label: "Bas" },
  { key: "dlss", label: "DLSS/FSR" },
  { key: "frameGen", label: "Frame Generation" },
  { key: "rayTracing", label: "Raytracing/Pathtracing" },
  { key: "dlssFrameGen", label: "DLSS + Frame Gen" },
  { key: "dlssRayTracing", label: "DLSS + Raytracing" },
  { key: "frameGenRayTracing", label: "Frame Gen + Raytracing" },
  { key: "dlssFrameGenRayTracing", label: "DLSS + Frame Gen + Raytracing" },
];

const DEFAULT_FPS_BASE: Record<string, Record<string, Record<string, number>>> = {
  Fortnite: {
    "1080p": { Low: 180, Medium: 160, High: 130, Ultra: 100 },
    "1440p": { Low: 160, Medium: 140, High: 110, Ultra: 85 },
    "4K": { Low: 120, Medium: 95, High: 70, Ultra: 55 },
  },
  "Cyberpunk 2077": {
    "1080p": { Low: 110, Medium: 95, High: 75, Ultra: 60 },
    "1440p": { Low: 90, Medium: 75, High: 60, Ultra: 45 },
    "4K": { Low: 65, Medium: 50, High: 38, Ultra: 28 },
  },
  "GTA 5": {
    "1080p": { Low: 200, Medium: 180, High: 150, Ultra: 120 },
    "1440p": { Low: 170, Medium: 150, High: 125, Ultra: 95 },
    "4K": { Low: 130, Medium: 110, High: 85, Ultra: 65 },
  },
  Minecraft: {
    "1080p": { Low: 240, Medium: 220, High: 180, Ultra: 150 },
    "1440p": { Low: 210, Medium: 190, High: 160, Ultra: 130 },
    "4K": { Low: 180, Medium: 160, High: 130, Ultra: 110 },
  },
  CS2: {
    "1080p": { Low: 320, Medium: 280, High: 240, Ultra: 200 },
    "1440p": { Low: 280, Medium: 240, High: 200, Ultra: 170 },
    "4K": { Low: 230, Medium: 200, High: 170, Ultra: 140 },
  },
  "Ghost of Tsushima": {
    "1080p": { Low: 135, Medium: 120, High: 100, Ultra: 80 },
    "1440p": { Low: 115, Medium: 100, High: 80, Ultra: 65 },
    "4K": { Low: 85, Medium: 70, High: 55, Ultra: 42 },
  },
};
const DEFAULT_FPS_SUPPORTS: Record<string, { dlss: boolean; frameGen: boolean; rayTracing: boolean }> = {
  Fortnite: { dlss: true, frameGen: false, rayTracing: false },
  "Cyberpunk 2077": { dlss: true, frameGen: true, rayTracing: true },
  "GTA 5": { dlss: false, frameGen: false, rayTracing: false },
  Minecraft: { dlss: false, frameGen: false, rayTracing: true },
  CS2: { dlss: false, frameGen: false, rayTracing: false },
  "Ghost of Tsushima": { dlss: true, frameGen: true, rayTracing: false },
};

const buildDefaultFpsSettings = (): FpsSettings => {
  const games: FpsSettings["games"] = {};
  FPS_GAMES.forEach((game) => {
    const resolutions: Record<string, Record<string, FpsPreset>> = {};
    FPS_RESOLUTIONS.forEach((res) => {
      const presets: Record<string, FpsPreset> = {};
      FPS_PRESETS.forEach((preset) => {
        const fps = DEFAULT_FPS_BASE?.[game]?.[res]?.[preset] ?? 60;
        const min = Math.max(1, Math.round(fps * 0.9));
        const max = Math.max(min + 1, Math.round(fps * 1.1));
        presets[preset] = { base: { min, max } };
      });
      resolutions[res] = presets;
    });
    games[game] = {
      supports: DEFAULT_FPS_SUPPORTS[game] || { dlss: true, frameGen: true, rayTracing: false },
      resolutions,
    };
  });
  return { games };
};

export default function AdminProducts() {
  const { isAdmin, loading, error, token, apiBase, signInWithGoogle } =
    useOutletContext<AdminAccessContext>();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [query, setQuery] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [fpsSettingsByProductId, setFpsSettingsByProductId] = useState<Record<string, FpsSettings>>(
    {}
  );
  const [usedVariantEnabledByProductId, setUsedVariantEnabledByProductId] = useState<
    Record<string, boolean>
  >({});
  const [usedVariantLoadingByProductId, setUsedVariantLoadingByProductId] = useState<
    Record<string, boolean>
  >({});
  const [usedVariantSavingByProductId, setUsedVariantSavingByProductId] = useState<
    Record<string, boolean>
  >({});
  const [fpsUiStateByProductId, setFpsUiStateByProductId] = useState<
    Record<string, { game: string; resolution: string; preset: string }>
  >({});
  const [fpsLoadingByProductId, setFpsLoadingByProductId] = useState<Record<string, boolean>>({});
  const [fpsSavingByProductId, setFpsSavingByProductId] = useState<Record<string, boolean>>({});
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
      const filtered = (data || []).filter((product: AdminProduct) => {
        const name = (product.name || "").trim().toLowerCase();
        const slug = (product.slug || "").trim().toLowerCase();
        return name !== "remove" && slug !== "test";
      });
      setProducts(filtered);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte hämta produkter.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const ensureFpsUiState = (productId: string) => {
    setFpsUiStateByProductId((prev) => {
      if (prev[productId]) return prev;
      return {
        ...prev,
        [productId]: {
          game: FPS_GAMES[0],
          resolution: FPS_RESOLUTIONS[0],
          preset: FPS_PRESETS[1] ?? FPS_PRESETS[0],
        },
      };
    });
  };

  const loadUsedVariantSetting = async (productId: string) => {
    if (!token || !isAdmin) return;
    setUsedVariantLoadingByProductId((prev) => ({ ...prev, [productId]: true }));
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/products/${productId}/used-variant`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Kunde inte hämta begagnad-flagga.");
      }
      const data = await response.json();
      const enabled = typeof data?.enabled === "boolean" ? data.enabled : true;
      setUsedVariantEnabledByProductId((prev) => ({ ...prev, [productId]: enabled }));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte hämta begagnad-flagga.");
    } finally {
      setUsedVariantLoadingByProductId((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const saveUsedVariantSetting = async (productId: string, enabled: boolean) => {
    if (!token || !isAdmin) return;
    setUsedVariantSavingByProductId((prev) => ({ ...prev, [productId]: true }));
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/products/${productId}/used-variant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Kunde inte spara begagnad-flagga.");
      }
      const data = await response.json();
      const nextEnabled = typeof data?.enabled === "boolean" ? data.enabled : enabled;
      setUsedVariantEnabledByProductId((prev) => ({ ...prev, [productId]: nextEnabled }));
    } catch (err) {
      setUsedVariantEnabledByProductId((prev) => ({ ...prev, [productId]: enabled }));
      setLocalError(err instanceof Error ? err.message : "Kunde inte spara begagnad-flagga.");
    } finally {
      setUsedVariantSavingByProductId((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const loadFpsSettings = async (productId: string) => {
    if (!token || !isAdmin) return;
    setFpsLoadingByProductId((prev) => ({ ...prev, [productId]: true }));
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/products/${productId}/fps-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Kunde inte hämta FPS-inställningar.");
      }
      const data = await response.json();
      const fps = data?.fps || buildDefaultFpsSettings();
      setFpsSettingsByProductId((prev) => ({ ...prev, [productId]: fps }));
      ensureFpsUiState(productId);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte hämta FPS-inställningar.");
    } finally {
      setFpsLoadingByProductId((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const updateFpsSettings = (productId: string, next: FpsSettings) => {
    setFpsSettingsByProductId((prev) => ({ ...prev, [productId]: next }));
  };

  const updateFpsSupport = (
    productId: string,
    game: string,
    key: "dlss" | "frameGen" | "rayTracing",
    value: boolean
  ) => {
    const current = fpsSettingsByProductId[productId] || buildDefaultFpsSettings();
    const gameSettings = current.games[game] || buildDefaultFpsSettings().games[game];
    const next: FpsSettings = {
      ...current,
      games: {
        ...current.games,
        [game]: {
          ...gameSettings,
          supports: { ...gameSettings.supports, [key]: value },
        },
      },
    };
    updateFpsSettings(productId, next);
  };

  const updateFpsRange = (
    productId: string,
    game: string,
    resolution: string,
    preset: string,
    modeKey: string,
    field: "min" | "max",
    value: number
  ) => {
    const current = fpsSettingsByProductId[productId] || buildDefaultFpsSettings();
    const gameSettings = current.games[game] || buildDefaultFpsSettings().games[game];
    const resolutionSettings = gameSettings.resolutions[resolution] || {};
    const presetSettings = resolutionSettings[preset] || {};
    const modeSettings = presetSettings[modeKey] || { min: 1, max: 1 };

    const nextMode = { ...modeSettings, [field]: value };
    if (nextMode.min > nextMode.max) {
      if (field === "min") nextMode.max = nextMode.min;
      if (field === "max") nextMode.min = nextMode.max;
    }

    const next: FpsSettings = {
      ...current,
      games: {
        ...current.games,
        [game]: {
          ...gameSettings,
          resolutions: {
            ...gameSettings.resolutions,
            [resolution]: {
              ...resolutionSettings,
              [preset]: {
                ...presetSettings,
                [modeKey]: nextMode,
              },
            },
          },
        },
      },
    };
    updateFpsSettings(productId, next);
  };

  const handleSaveFpsSettings = async (productId: string) => {
    if (!token || !isAdmin) return;
    const fps = fpsSettingsByProductId[productId] || buildDefaultFpsSettings();
    setFpsSavingByProductId((prev) => ({ ...prev, [productId]: true }));
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/products/${productId}/fps-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fps }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Kunde inte spara FPS-inställningar.");
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte spara FPS-inställningar.");
    } finally {
      setFpsSavingByProductId((prev) => ({ ...prev, [productId]: false }));
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !token || products.length === 0) return;
    const missing = products
      .map((product) => product.id)
      .filter((id) => usedVariantEnabledByProductId[id] === undefined && !usedVariantLoadingByProductId[id]);
    if (missing.length === 0) return;
    missing.forEach((id) => {
      void loadUsedVariantSetting(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, isAdmin, token]);

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
          const fpsSettings = fpsSettingsByProductId[product.id];
          const fpsUi = fpsUiStateByProductId[product.id] || {
            game: FPS_GAMES[0],
            resolution: FPS_RESOLUTIONS[0],
            preset: FPS_PRESETS[1] ?? FPS_PRESETS[0],
          };
          const usedVariantEnabled = usedVariantEnabledByProductId[product.id] ?? true;
          const usedVariantSaving = usedVariantSavingByProductId[product.id];
          const usedVariantLoading = usedVariantLoadingByProductId[product.id];
          const selectedGameSettings =
            fpsSettings?.games?.[fpsUi.game] ?? buildDefaultFpsSettings().games[fpsUi.game];
          const selectedResolutionSettings =
            selectedGameSettings?.resolutions?.[fpsUi.resolution] ||
            selectedGameSettings?.resolutions?.[FPS_RESOLUTIONS[0]];
          const selectedPresetSettings =
            selectedResolutionSettings?.[fpsUi.preset] ||
            selectedResolutionSettings?.[FPS_PRESETS[1] ?? FPS_PRESETS[0]];
          const supports = selectedGameSettings?.supports || {
            dlss: true,
            frameGen: true,
            rayTracing: false,
          };
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
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 md:col-span-2 xl:col-span-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Begagnad variant</p>
                      <p className="text-sm text-slate-300">
                        Styr om denna produkt ska kunna växlas till begagnade delar.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={usedVariantEnabled}
                      onClick={() => saveUsedVariantSetting(product.id, !usedVariantEnabled)}
                      disabled={usedVariantSaving || usedVariantLoading}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        usedVariantEnabled ? "bg-yellow-400" : "bg-slate-700"
                      } ${usedVariantSaving || usedVariantLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <span className="sr-only">Aktivera begagnad variant</span>
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          usedVariantEnabled ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 md:col-span-2 xl:col-span-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Uppskattad FPS</p>
                      <p className="text-sm text-slate-300">Välj spel, upplösning och grafik för att justera FPS.</p>
                    </div>
                    {!fpsSettings ? (
                      <button
                        type="button"
                        onClick={() => loadFpsSettings(product.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-[#11667b] hover:text-[#11667b]"
                        disabled={fpsLoadingByProductId[product.id]}
                      >
                        {fpsLoadingByProductId[product.id] ? "Laddar..." : "Ladda FPS-inställningar"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSaveFpsSettings(product.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white"
                        disabled={fpsSavingByProductId[product.id]}
                      >
                        <Save className="h-4 w-4" />
                        {fpsSavingByProductId[product.id] ? "Sparar..." : "Spara FPS-inställningar"}
                      </button>
                    )}
                  </div>
                  {fpsSettings && (
                    <div className="mt-4 space-y-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="text-xs text-slate-400">
                          Spel
                          <select
                            value={fpsUi.game}
                            onChange={(event) =>
                              setFpsUiStateByProductId((prev) => ({
                                ...prev,
                                [product.id]: {
                                  ...fpsUi,
                                  game: event.target.value,
                                  resolution: FPS_RESOLUTIONS[0],
                                  preset: FPS_PRESETS[1] ?? FPS_PRESETS[0],
                                },
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                          >
                            {FPS_GAMES.map((game) => (
                              <option key={game} value={game}>
                                {game}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs text-slate-400">
                          Upplösning
                          <select
                            value={fpsUi.resolution}
                            onChange={(event) =>
                              setFpsUiStateByProductId((prev) => ({
                                ...prev,
                                [product.id]: {
                                  ...fpsUi,
                                  resolution: event.target.value,
                                  preset: FPS_PRESETS[1] ?? FPS_PRESETS[0],
                                },
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                          >
                            {FPS_RESOLUTIONS.map((res) => (
                              <option key={res} value={res}>
                                {res}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs text-slate-400">
                          Grafik
                          <select
                            value={fpsUi.preset}
                            onChange={(event) =>
                              setFpsUiStateByProductId((prev) => ({
                                ...prev,
                                [product.id]: { ...fpsUi, preset: event.target.value },
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                          >
                            {FPS_PRESETS.map((preset) => (
                              <option key={preset} value={preset}>
                                {preset}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={supports.dlss}
                            onChange={(event) =>
                              updateFpsSupport(product.id, fpsUi.game, "dlss", event.target.checked)
                            }
                          />
                          DLSS/FSR tillgängligt
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={supports.frameGen}
                            onChange={(event) =>
                              updateFpsSupport(product.id, fpsUi.game, "frameGen", event.target.checked)
                            }
                          />
                          Frame Generation tillgängligt
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={supports.rayTracing}
                            onChange={(event) =>
                              updateFpsSupport(product.id, fpsUi.game, "rayTracing", event.target.checked)
                            }
                          />
                          Raytracing/Pathtracing tillgängligt
                        </label>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {FPS_MODE_LABELS.map((mode) => {
                          const range = selectedPresetSettings?.[mode.key] || { min: 0, max: 0 };
                          return (
                            <div key={mode.key} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                              <p className="text-xs text-slate-400 mb-2">{mode.label}</p>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={range.min ?? ""}
                                  onChange={(event) =>
                                    updateFpsRange(
                                      product.id,
                                      fpsUi.game,
                                      fpsUi.resolution,
                                      fpsUi.preset,
                                      mode.key,
                                      "min",
                                      Number(event.target.value)
                                    )
                                  }
                                  className="w-full rounded-md border border-slate-700/60 bg-slate-900/60 px-2 py-1 text-xs text-slate-100"
                                  placeholder="Min"
                                />
                                <input
                                  type="number"
                                  min={0}
                                  value={range.max ?? ""}
                                  onChange={(event) =>
                                    updateFpsRange(
                                      product.id,
                                      fpsUi.game,
                                      fpsUi.resolution,
                                      fpsUi.preset,
                                      mode.key,
                                      "max",
                                      Number(event.target.value)
                                    )
                                  }
                                  className="w-full rounded-md border border-slate-700/60 bg-slate-900/60 px-2 py-1 text-xs text-slate-100"
                                  placeholder="Max"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
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






