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
type FpsVisibility = {
  resolutions: Record<string, boolean>;
  presets: Record<string, boolean>;
};
type FpsSettings = {
  games: Record<
    string,
    {
      supports: { dlss: boolean; frameGen: boolean; rayTracing?: boolean };
      visibility: FpsVisibility;
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
const FPS_PRESETS = ["High", "Ultra", "Ultra + Raytracing/Pathtracing"];
const FPS_MODE_LABELS: { key: string; label: string }[] = [
  { key: "base", label: "Bas" },
  { key: "dlss", label: "DLSS/FSR" },
  { key: "frameGen", label: "Frame Generation" },
  { key: "dlssFrameGen", label: "DLSS + Frame Gen" },
];

const DEFAULT_FPS_BASE: Record<string, Record<string, Record<string, number>>> = {
  Fortnite: {
    "1080p": { High: 170, Ultra: 170, "Ultra + Raytracing/Pathtracing": 95 },
    "1440p": { High: 120, Ultra: 120, "Ultra + Raytracing/Pathtracing": 95 },
    "4K": { High: 70, Ultra: 70, "Ultra + Raytracing/Pathtracing": 95 },
  },
  "Cyberpunk 2077": {
    "1080p": { High: 90, Ultra: 90, "Ultra + Raytracing/Pathtracing": 65 },
    "1440p": { High: 60, Ultra: 60, "Ultra + Raytracing/Pathtracing": 65 },
    "4K": { High: 35, Ultra: 35, "Ultra + Raytracing/Pathtracing": 65 },
  },
  "GTA 5": {
    "1080p": { High: 160, Ultra: 160, "Ultra + Raytracing/Pathtracing": 160 },
    "1440p": { High: 110, Ultra: 110, "Ultra + Raytracing/Pathtracing": 110 },
    "4K": { High: 65, Ultra: 65, "Ultra + Raytracing/Pathtracing": 65 },
  },
  Minecraft: {
    "1080p": { High: 220, Ultra: 220, "Ultra + Raytracing/Pathtracing": 80 },
    "1440p": { High: 170, Ultra: 170, "Ultra + Raytracing/Pathtracing": 80 },
    "4K": { High: 100, Ultra: 100, "Ultra + Raytracing/Pathtracing": 80 },
  },
  CS2: {
    "1080p": { High: 280, Ultra: 280, "Ultra + Raytracing/Pathtracing": 280 },
    "1440p": { High: 220, Ultra: 220, "Ultra + Raytracing/Pathtracing": 220 },
    "4K": { High: 160, Ultra: 160, "Ultra + Raytracing/Pathtracing": 160 },
  },
  "Ghost of Tsushima": {
    "1080p": { High: 110, Ultra: 110, "Ultra + Raytracing/Pathtracing": 70 },
    "1440p": { High: 75, Ultra: 75, "Ultra + Raytracing/Pathtracing": 70 },
    "4K": { High: 45, Ultra: 45, "Ultra + Raytracing/Pathtracing": 70 },
  },
};
const DEFAULT_FPS_SUPPORTS: Record<string, { dlss: boolean; frameGen: boolean }> = {
  Fortnite: { dlss: true, frameGen: false },
  "Cyberpunk 2077": { dlss: true, frameGen: true },
  "GTA 5": { dlss: false, frameGen: false },
  Minecraft: { dlss: false, frameGen: false },
  CS2: { dlss: false, frameGen: false },
  "Ghost of Tsushima": { dlss: true, frameGen: false },
};

const buildDefaultFpsSettings = (): FpsSettings => {
  const games: FpsSettings["games"] = {};
  FPS_GAMES.forEach((game) => {
    const resolutions: Record<string, Record<string, FpsPreset>> = {};
    const visibility: FpsVisibility = {
      resolutions: {},
      presets: {},
    };
    FPS_RESOLUTIONS.forEach((res) => {
      const presets: Record<string, FpsPreset> = {};
      visibility.resolutions[res] = true;
      FPS_PRESETS.forEach((preset) => {
        const fps = DEFAULT_FPS_BASE?.[game]?.[res]?.[preset] ?? 60;
        const min = Math.max(1, Math.round(fps * 0.9));
        const max = Math.max(min + 1, Math.round(fps * 1.1));
        presets[preset] = { base: { min, max } };
        visibility.presets[preset] = true;
      });
      resolutions[res] = presets;
    });
    games[game] = {
      supports: DEFAULT_FPS_SUPPORTS[game] || { dlss: true, frameGen: true },
      visibility,
      resolutions,
    };
  });
  return { games };
};

const normalizeFpsSettings = (input: unknown): FpsSettings => {
  const fallback = buildDefaultFpsSettings();
  if (!input || typeof input !== "object") return fallback;
  const source = input as Partial<FpsSettings>;
  const next: FpsSettings = { games: {} };

  FPS_GAMES.forEach((game) => {
    const fallbackGame = fallback.games[game];
    const sourceGame = source.games?.[game];
    const supports = sourceGame?.supports ?? fallbackGame.supports;
    const sourceVisibility =
      sourceGame?.visibility && typeof sourceGame.visibility === "object"
        ? sourceGame.visibility
        : fallbackGame.visibility;
    const normalizedVisibility: FpsVisibility = {
      resolutions: {},
      presets: {},
    };

    const resolutions: Record<string, Record<string, FpsPreset>> = {};
    FPS_RESOLUTIONS.forEach((resolution) => {
      normalizedVisibility.resolutions[resolution] =
        typeof sourceVisibility.resolutions?.[resolution] === "boolean"
          ? sourceVisibility.resolutions[resolution]
          : true;
      const sourcePresets = sourceGame?.resolutions?.[resolution] || {};
      const nextPresets: Record<string, FpsPreset> = {};
      FPS_PRESETS.forEach((preset) => {
        normalizedVisibility.presets[preset] =
          typeof sourceVisibility.presets?.[preset] === "boolean" ? sourceVisibility.presets[preset] : true;
        const sourcePreset = sourcePresets[preset] || {};
        const base = sourcePreset.base || fallbackGame.resolutions[resolution][preset].base;
        const safeMin = Number.isFinite(Number(base?.min)) ? Math.max(0, Number(base.min)) : 0;
        const safeMax = Number.isFinite(Number(base?.max)) ? Math.max(safeMin, Number(base.max)) : safeMin;
        const normalizedPreset: FpsPreset = {
          base: { min: safeMin, max: safeMax },
        };
        FPS_MODE_LABELS.forEach((mode) => {
          if (mode.key === "base") return;
          const modeValue = sourcePreset[mode.key];
          const modeMin = Number(modeValue?.min);
          const modeMax = Number(modeValue?.max);
          if (Number.isFinite(modeMin) && Number.isFinite(modeMax) && modeMin >= 0 && modeMax >= modeMin) {
            normalizedPreset[mode.key] = { min: modeMin, max: modeMax };
          }
        });
        nextPresets[preset] = normalizedPreset;
      });
      resolutions[resolution] = nextPresets;
    });

    next.games[game] = {
      supports: {
        dlss: Boolean(supports?.dlss),
        frameGen: Boolean(supports?.frameGen),
        rayTracing: Boolean(supports?.rayTracing),
      },
      visibility: normalizedVisibility,
      resolutions,
    };
  });

  return next;
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
      const fps = normalizeFpsSettings(data?.fps);
      setFpsSettingsByProductId((prev) => ({ ...prev, [productId]: fps }));
      ensureFpsUiState(productId);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte hämta FPS-inställningar.");
    } finally {
      setFpsLoadingByProductId((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const updateFpsSettings = (productId: string, next: FpsSettings) => {
    setFpsSettingsByProductId((prev) => ({ ...prev, [productId]: normalizeFpsSettings(next) }));
  };

  const getAverageFps = (range?: FpsRange) => {
    const min = Number(range?.min);
    const max = Number(range?.max);
    if (!Number.isFinite(min) && !Number.isFinite(max)) return 0;
    if (!Number.isFinite(min)) return Math.max(0, Math.round(max));
    if (!Number.isFinite(max)) return Math.max(0, Math.round(min));
    return Math.max(0, Math.round((min + max) / 2));
  };

  const updateFpsSupport = (
    productId: string,
    game: string,
    key: "dlss" | "frameGen",
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

  const updateFpsVisibility = (
    productId: string,
    game: string,
    group: "resolutions" | "presets",
    key: string,
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
          visibility: {
            ...gameSettings.visibility,
            [group]: {
              ...(gameSettings.visibility?.[group] || {}),
              [key]: value,
            },
          },
        },
      },
    };
    updateFpsSettings(productId, next);
  };

  const updateFpsAverage = (
    productId: string,
    game: string,
    resolution: string,
    preset: string,
    modeKey: string,
    value: number
  ) => {
    const safeValue = Math.max(0, Math.round(value));
    const current = fpsSettingsByProductId[productId] || buildDefaultFpsSettings();
    const gameSettings = current.games[game] || buildDefaultFpsSettings().games[game];
    const resolutionSettings = gameSettings.resolutions[resolution] || {};
    const presetSettings = resolutionSettings[preset] || {};
    const nextMode = { min: safeValue, max: safeValue };

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
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Kunde inte spara FPS-inställningar.");
      }
      if (data?.fps?.games) {
        setFpsSettingsByProductId((prev) => ({ ...prev, [productId]: normalizeFpsSettings(data.fps) }));
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
                      <p className="text-sm text-slate-300">Välj spel, upplösning och grafik för att justera snitt-FPS.</p>
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
                            onChange={(event) => {
                              const nextGame = event.target.value;
                              setFpsUiStateByProductId((prev) => ({
                                ...prev,
                                [product.id]: {
                                  ...fpsUi,
                                  game: nextGame,
                                  resolution: FPS_RESOLUTIONS[0],
                                  preset: FPS_PRESETS[1] ?? FPS_PRESETS[0],
                                },
                              }));
                            }}
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
                            onChange={(event) => {
                              const nextResolution = event.target.value;
                              setFpsUiStateByProductId((prev) => ({
                                ...prev,
                                [product.id]: {
                                  ...fpsUi,
                                  resolution: nextResolution,
                                  preset: FPS_PRESETS[1] ?? FPS_PRESETS[0],
                                },
                              }));
                            }}
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

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                          <p className="text-xs text-slate-400 mb-2">Visa upplösningar på frontend</p>
                          <div className="flex flex-wrap gap-2">
                            {FPS_RESOLUTIONS.map((resolution) => {
                              const enabled = selectedGameSettings?.visibility?.resolutions?.[resolution] !== false;
                              return (
                                <label
                                  key={resolution}
                                  className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 px-3 py-1 text-xs text-slate-200"
                                >
                                  <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={(event) =>
                                      updateFpsVisibility(
                                        product.id,
                                        fpsUi.game,
                                        "resolutions",
                                        resolution,
                                        event.target.checked
                                      )
                                    }
                                  />
                                  {resolution}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                          <p className="text-xs text-slate-400 mb-2">Visa grafiknivåer på frontend</p>
                          <div className="flex flex-wrap gap-2">
                            {FPS_PRESETS.map((preset) => {
                              const enabled = selectedGameSettings?.visibility?.presets?.[preset] !== false;
                              return (
                                <label
                                  key={preset}
                                  className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 px-3 py-1 text-xs text-slate-200"
                                >
                                  <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={(event) =>
                                      updateFpsVisibility(
                                        product.id,
                                        fpsUi.game,
                                        "presets",
                                        preset,
                                        event.target.checked
                                      )
                                    }
                                  />
                                  {preset}
                                </label>
                              );
                            })}
                          </div>
                        </div>
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
                                  value={getAverageFps(range)}
                                  onChange={(event) =>
                                    updateFpsAverage(
                                      product.id,
                                      fpsUi.game,
                                      fpsUi.resolution,
                                      fpsUi.preset,
                                      mode.key,
                                      Number(event.target.value)
                                    )
                                  }
                                  className="w-full rounded-md border border-slate-700/60 bg-slate-900/60 px-2 py-1 text-xs text-slate-100"
                                  placeholder="Snitt FPS"
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






