import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus, RefreshCcw, Save, Search, Trash2, Upload } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { AdminAccessContext } from "../useAdminAccess";
import { COMPUTERS } from "@/data/computers";
import { normalizeProductKey } from "@/hooks/useProducts";
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
import { normalizeProductImagePath } from "@/lib/productImageResolver";
import {
  ADMIN_DLSS_FSR_MODE_OPTIONS,
  createListingRequestSchema as sharedCreateListingRequestSchema,
  formatZodValidationError as formatContractValidationError,
  updateListingRequestSchema as sharedUpdateListingRequestSchema,
} from "../../../shared/adminListingContract.js";

const DRAFT_STORAGE_KEY = "admin-products-v2-draft";

type AdminProduct = {
  id: string;
  name: string;
  slug?: string | null;
  legacy_id?: string | null;
  description?: string | null;
  image_url?: string | null;
  images?: string[] | null;
  listing_group_id?: string | null;
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
  eta_days?: number | null;
  eta_input: string;
  eta_note: string;
  used_variant_enabled: boolean;
  used_parts?: UsedPartsSettings;
  fps?: FpsSandboxSettings;
  linked_product_id?: string | null;
  listing_group_id?: string | null;
  variant_role?: "base" | "used" | null;
  variant_group_id?: string | null;
  updated_at?: string | null;
  inventory_updated_at?: string | null;
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

const toTextValue = (value: unknown) => String(value ?? "");

const toExpectedUpdatedAt = (value: unknown) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed.toISOString();
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

const DEFAULT_USED_DRAFT = buildUsedDraftFromBase(EMPTY_DRAFT);

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
  const normalizedDlssMode =
    supportsDlssFsr && ADMIN_DLSS_FSR_MODE_OPTIONS.includes(entry.dlssFsrMode as (typeof ADMIN_DLSS_FSR_MODE_OPTIONS)[number])
      ? entry.dlssFsrMode
      : supportsDlssFsr
        ? "balanced"
        : null;
  return {
    game,
    resolution,
    graphics: String(entry.graphics || ""),
    baseFps: Math.max(0, Number(entry.baseFps) || 0),
    supportsDlssFsr,
    dlssFsrMode: normalizedDlssMode,
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

const sanitizeImageInputUrl = (value: string) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const normalized = normalizeProductImagePath(trimmed);
  if (!normalized) return "";
  if (normalized.startsWith("/") || /^https?:\/\//i.test(normalized)) return normalized;
  return "";
};

const dedupeImageUrls = (input: string[]) => {
  const next: string[] = [];
  input.forEach((entry) => {
    const normalized = sanitizeImageInputUrl(entry);
    if (normalized && !next.includes(normalized)) {
      next.push(normalized);
    }
  });
  return next.slice(0, 10);
};

const COMPUTER_IMAGE_LOOKUP = (() => {
  const lookup = new Map<string, string[]>();
  const add = (rawKey: unknown, images: string[]) => {
    const key = normalizeProductKey(String(rawKey || ""));
    if (!key || lookup.has(key)) return;
    lookup.set(key, images);
  };
  COMPUTERS.forEach((computer) => {
    const images = dedupeImageUrls([...(Array.isArray(computer.images) ? computer.images : []), computer.image || ""]);
    if (images.length === 0) return;
    add(computer.id, images);
    add(computer.name, images);
    if (computer.usedVariant?.productKey) {
      add(computer.usedVariant.productKey, images);
    }
  });
  return lookup;
})();

const resolveFallbackListingImages = (row: {
  id?: unknown;
  name?: unknown;
  slug?: unknown;
  legacy_id?: unknown;
}) => {
  const candidates = [row.id, row.name, row.slug, row.legacy_id];
  for (const candidate of candidates) {
    const key = normalizeProductKey(String(candidate || ""));
    if (!key) continue;
    const images = COMPUTER_IMAGE_LOOKUP.get(key);
    if (images && images.length > 0) {
      return [...images];
    }
  }
  return [];
};

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64 = result.split(",")[1] || "";
      if (!base64) {
        reject(new Error("Kunde inte läsa filen."));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Kunde inte läsa filen."));
    reader.readAsDataURL(file);
  });

export default function AdminProducts() {
  const { isAdmin, role, loading, error, token, apiBase, signInWithGoogle } =
    useOutletContext<AdminAccessContext>();
  const canMutate = role === "admin" || role === "ops" || role === "";
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [query, setQuery] = useState("");
  const [loadingItems, setLoadingItems] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");

  const [draft, setDraft] = useState<ListingDraft>(EMPTY_DRAFT);
  const [createUsedVariant, setCreateUsedVariant] = useState(false);
  const [usedDraft, setUsedDraft] = useState<ListingDraft>({ ...DEFAULT_USED_DRAFT });
  const [usedDraftParts, setUsedDraftParts] = useState<UsedPartsSettings>(DEFAULT_USED_PARTS_SETTINGS);
  const [draftImages, setDraftImages] = useState<string[]>([]);
  const [usedDraftImages, setUsedDraftImages] = useState<string[]>([]);
  const [draftImageUrlInput, setDraftImageUrlInput] = useState("");
  const [usedDraftImageUrlInput, setUsedDraftImageUrlInput] = useState("");
  const [uploadingBaseImages, setUploadingBaseImages] = useState(false);
  const [uploadingUsedImages, setUploadingUsedImages] = useState(false);
  const [itemImageUrlInputByProduct, setItemImageUrlInputByProduct] = useState<Record<string, string>>({});
  const [uploadingItemImagesByProduct, setUploadingItemImagesByProduct] = useState<Record<string, boolean>>({});
  const [imagesExpandedByProduct, setImagesExpandedByProduct] = useState<Record<string, boolean>>({});
  const [draggedItemImage, setDraggedItemImage] = useState<{ productId: string; index: number } | null>(null);
  const [creating, setCreating] = useState(false);

  const [draftFpsEntries, setDraftFpsEntries] = useState<FpsSandboxEntry[]>([]);
  const [fpsByProduct, setFpsByProduct] = useState<Record<string, FpsSandboxSettings>>({});
  const [fpsLoadingByProduct, setFpsLoadingByProduct] = useState<Record<string, boolean>>({});
  const [fpsSavingByProduct, setFpsSavingByProduct] = useState<Record<string, boolean>>({});
  const [fpsExpandedByProduct, setFpsExpandedByProduct] = useState<Record<string, boolean>>({});
  const [usedPartsByProduct, setUsedPartsByProduct] = useState<Record<string, UsedPartsSettings>>({});
  const [usedPartsLoadingByProduct, setUsedPartsLoadingByProduct] = useState<Record<string, boolean>>({});
  const [usedPartsSavingByProduct, setUsedPartsSavingByProduct] = useState<Record<string, boolean>>({});
  const [dirtyProductIds, setDirtyProductIds] = useState<Record<string, boolean>>({});
  const [lastSavedByProduct, setLastSavedByProduct] = useState<Record<string, string>>({});
  const [lastDraftAutosaveAt, setLastDraftAutosaveAt] = useState<string>("");
  const [draftHydrated, setDraftHydrated] = useState(false);

  const mapListingToCatalogItem = (row: any): CatalogItem => ({
    // Keep UI payloads free from legacy placeholder paths.
    ...(() => {
      const normalizedImages = dedupeImageUrls([
        ...(Array.isArray(row.images) ? row.images.map((entry: unknown) => String(entry || "")) : []),
        String(row.image_url ?? ""),
      ]);
      const fallbackImages = normalizedImages.length > 0 ? [] : resolveFallbackListingImages(row);
      const finalImages = normalizedImages.length > 0 ? normalizedImages : fallbackImages;
      return {
        image_url: finalImages[0] || "",
        images: finalImages,
      };
    })(),
    id: row.id,
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    legacy_id: String(row.legacy_id ?? ""),
    description: String(row.description ?? ""),
    price_cents: Number(row.price_cents || 0),
    cpu: String(row.cpu ?? ""),
    gpu: String(row.gpu ?? ""),
    ram: String(row.ram ?? ""),
    storage: String(row.storage ?? ""),
    storage_type: String(row.storage_type ?? ""),
    tier: String(row.tier ?? ""),
    motherboard: String(row.motherboard ?? ""),
    psu: String(row.psu ?? ""),
    case_name: String(row.case_name ?? ""),
    cpu_cooler: String(row.cpu_cooler ?? ""),
    os: String(row.os ?? ""),
    quantity_in_stock: Math.max(0, Number(row.quantity_in_stock || 0)),
    is_preorder: Boolean(row.is_preorder),
    eta_days: Number.isFinite(Number(row.eta_days)) ? Number(row.eta_days) : null,
    eta_input: toEtaInput({
      eta_days: Number.isFinite(Number(row.eta_days)) ? Number(row.eta_days) : null,
      eta_note: row.eta_note || "",
    }),
    eta_note: String(row.eta_note || ""),
    used_variant_enabled: Boolean(row.used_variant_enabled ?? true),
    used_parts: sanitizeUsedPartsSettings(row.used_parts),
    fps: normalizeFpsSandboxSettings(row.fps || { version: 2, entries: [] }),
    linked_product_id: row.linked_product_id ? String(row.linked_product_id) : null,
    listing_group_id: row.listing_group_id ? String(row.listing_group_id) : row.variant_group_id ? String(row.variant_group_id) : null,
    variant_role: row.variant_role === "base" || row.variant_role === "used" ? row.variant_role : null,
    variant_group_id: row.variant_group_id ? String(row.variant_group_id) : null,
    updated_at: row.updated_at || null,
    inventory_updated_at: row.inventory_updated_at || null,
  });

  const loadItems = async () => {
    if (!token || !isAdmin) return;
    setLoadingItems(true);
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/listings?limit=300`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte hämta produkter.");
      }

      const rows: CatalogItem[] = Array.isArray(payload?.data) ? payload.data.map(mapListingToCatalogItem) : [];

      setItems(rows);
      setFpsByProduct(
        Object.fromEntries(
          rows.map((item) => [item.id, normalizeFpsSandboxSettings(item.fps || { version: 2, entries: [] })])
        )
      );
      setUsedPartsByProduct(
        Object.fromEntries(rows.map((item) => [item.id, sanitizeUsedPartsSettings(item.used_parts)]))
      );
      setDirtyProductIds({});
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) {
        setDraftHydrated(true);
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed?.draft) setDraft({ ...EMPTY_DRAFT, ...parsed.draft });
      if (typeof parsed?.createUsedVariant === "boolean") setCreateUsedVariant(parsed.createUsedVariant);
      if (parsed?.usedDraft) setUsedDraft({ ...DEFAULT_USED_DRAFT, ...parsed.usedDraft });
      if (parsed?.usedDraftParts) setUsedDraftParts(sanitizeUsedPartsSettings(parsed.usedDraftParts));
      if (Array.isArray(parsed?.draftImages)) setDraftImages(dedupeImageUrls(parsed.draftImages));
      if (Array.isArray(parsed?.usedDraftImages)) setUsedDraftImages(dedupeImageUrls(parsed.usedDraftImages));
      if (Array.isArray(parsed?.draftFpsEntries)) {
        setDraftFpsEntries(parsed.draftFpsEntries.map((entry: FpsSandboxEntry) => normalizeFpsEditorEntry(entry)));
      }
      if (typeof parsed?.savedAt === "string") setLastDraftAutosaveAt(parsed.savedAt);
    } catch {
      // Ignore invalid localStorage payloads.
    } finally {
      setDraftHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!draftHydrated) return;
    const payload = {
      draft,
      createUsedVariant,
      usedDraft,
      usedDraftParts,
      draftImages,
      usedDraftImages,
      draftFpsEntries,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    setLastDraftAutosaveAt(payload.savedAt);
  }, [draft, createUsedVariant, usedDraft, usedDraftParts, draftImages, usedDraftImages, draftFpsEntries, draftHydrated]);

  const hasDraftChanges = useMemo(() => {
    const defaultState = {
      draft: EMPTY_DRAFT,
      createUsedVariant: false,
      usedDraft: DEFAULT_USED_DRAFT,
      usedDraftParts: DEFAULT_USED_PARTS_SETTINGS,
      draftImages: [],
      usedDraftImages: [],
      draftFpsEntries: [],
    };
    const currentState = { draft, createUsedVariant, usedDraft, usedDraftParts, draftImages, usedDraftImages, draftFpsEntries };
    return JSON.stringify(defaultState) !== JSON.stringify(currentState);
  }, [draft, createUsedVariant, usedDraft, usedDraftParts, draftImages, usedDraftImages, draftFpsEntries]);

  useEffect(() => {
    const hasDirtyProducts = Object.values(dirtyProductIds).some(Boolean);
    if (!hasDirtyProducts && !hasDraftChanges) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirtyProductIds, hasDraftChanges]);

  const markProductDirty = (id: string) => {
    setDirtyProductIds((prev) => ({ ...prev, [id]: true }));
  };

  const clearProductDirty = (id: string) => {
    setDirtyProductIds((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const resolveApiErrorMessage = (data: any, fallback: string) => {
    const baseMessage = data?.error?.message || data?.error || fallback;
    const fieldErrors = data?.error?.details?.fieldErrors || data?.error?.details?.field_errors;
    if (fieldErrors && typeof fieldErrors === "object") {
      const firstField = Object.keys(fieldErrors)[0];
      const firstFieldError = Array.isArray(fieldErrors[firstField]) ? fieldErrors[firstField][0] : "";
      if (firstField && firstFieldError) {
        return `${baseMessage} (${firstField}: ${firstFieldError})`;
      }
    }
    return baseMessage;
  };

  const getValidationMessage = (error: any, fallback: string) => {
    const details = formatContractValidationError(error);
    const fieldErrors = details?.fieldErrors || {};
    const firstField = Object.keys(fieldErrors)[0];
    const firstFieldError = Array.isArray(fieldErrors[firstField]) ? fieldErrors[firstField][0] : "";
    if (firstField && firstFieldError) {
      return `${fallback} (${firstField}: ${firstFieldError})`;
    }
    return fallback;
  };

  const setItem = <K extends keyof CatalogItem>(id: string, key: K, value: CatalogItem[K]) => {
    markProductDirty(id);
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

  const addImageUrlToDraft = (target: "base" | "used", rawUrl: string) => {
    const normalized = sanitizeImageInputUrl(rawUrl);
    if (!normalized) {
      setLocalError("Bildlänk måste börja med / eller http(s)://");
      return;
    }
    if (target === "base") {
      setDraftImages((prev) => dedupeImageUrls([...prev, normalized]));
      setDraftImageUrlInput("");
      return;
    }
    setUsedDraftImages((prev) => dedupeImageUrls([...prev, normalized]));
    setUsedDraftImageUrlInput("");
  };

  const removeDraftImageAt = (target: "base" | "used", index: number) => {
    if (target === "base") {
      setDraftImages((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    setUsedDraftImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveDraftImage = (target: "base" | "used", index: number, direction: "up" | "down") => {
    const updater = (images: string[]) => {
      const next = [...images];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= next.length) return next;
      const tmp = next[index];
      next[index] = next[swapIndex];
      next[swapIndex] = tmp;
      return next;
    };
    if (target === "base") {
      setDraftImages(updater);
      return;
    }
    setUsedDraftImages(updater);
  };

  const uploadDraftImages = async (target: "base" | "used", files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!token || !isAdmin) return;
    if (!canMutate) {
      setLocalError("Du har läsbehörighet och kan inte ladda upp bilder.");
      return;
    }
    setLocalError("");
    if (target === "base") setUploadingBaseImages(true);
    if (target === "used") setUploadingUsedImages(true);
    try {
      const listingSlugHint =
        target === "base"
          ? (draft.slug || draft.name || "basprodukt")
          : (usedDraft.slug || usedDraft.name || "begagnad-variant");
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const base64 = await fileToBase64(file);
        const response = await fetch(`${apiBase}/api/admin/v2/uploads/product-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            file_name: file.name,
            mime_type: file.type || "image/jpeg",
            data_base64: base64,
            listing_slug: listingSlugHint,
            variant: target,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(resolveApiErrorMessage(data, "Kunde inte ladda upp bild."));
        }
        const url = sanitizeImageInputUrl(String(data?.data?.url || ""));
        if (url) uploadedUrls.push(url);
      }
      if (target === "base") {
        setDraftImages((prev) => dedupeImageUrls([...prev, ...uploadedUrls]));
      } else {
        setUsedDraftImages((prev) => dedupeImageUrls([...prev, ...uploadedUrls]));
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte ladda upp bild.");
    } finally {
      if (target === "base") setUploadingBaseImages(false);
      if (target === "used") setUploadingUsedImages(false);
    }
  };

  const setItemImages = (productId: string, images: string[]) => {
    const normalized = dedupeImageUrls(images);
    markProductDirty(productId);
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId
          ? {
              ...item,
              images: normalized,
              image_url: normalized[0] || "",
            }
          : item
      )
    );
  };

  const addImageUrlToItem = (productId: string, rawUrl: string) => {
    const normalized = sanitizeImageInputUrl(rawUrl);
    if (!normalized) {
      setLocalError("Bildlänk måste börja med / eller http(s)://");
      return;
    }
    const item = items.find((entry) => entry.id === productId);
    const current = Array.isArray(item?.images) ? item.images : item?.image_url ? [item.image_url] : [];
    setItemImages(productId, [...current, normalized]);
    setItemImageUrlInputByProduct((prev) => ({ ...prev, [productId]: "" }));
  };

  const removeItemImageAt = (productId: string, index: number) => {
    const item = items.find((entry) => entry.id === productId);
    const current = Array.isArray(item?.images) ? item.images : [];
    setItemImages(
      productId,
      current.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  const moveItemImage = (productId: string, index: number, direction: "up" | "down") => {
    const item = items.find((entry) => entry.id === productId);
    const current = Array.isArray(item?.images) ? [...item.images] : [];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= current.length) return;
    const tmp = current[index];
    current[index] = current[swapIndex];
    current[swapIndex] = tmp;
    setItemImages(productId, current);
  };

  const reorderItemImage = (productId: string, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const item = items.find((entry) => entry.id === productId);
    const current = Array.isArray(item?.images) ? [...item.images] : [];
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= current.length || toIndex >= current.length) return;
    const [moved] = current.splice(fromIndex, 1);
    if (!moved) return;
    current.splice(toIndex, 0, moved);
    setItemImages(productId, current);
  };

  const uploadItemImages = async (item: CatalogItem, files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!token || !isAdmin) return;
    if (!canMutate) {
      setLocalError("Du har läsbehörighet och kan inte ladda upp bilder.");
      return;
    }
    setLocalError("");
    setUploadingItemImagesByProduct((prev) => ({ ...prev, [item.id]: true }));
    try {
      const uploadedUrls: string[] = [];
      const variant = item.variant_role === "used" ? "used" : "base";
      const listingSlugHint = item.slug || item.name || item.id;
      for (const file of Array.from(files)) {
        const base64 = await fileToBase64(file);
        const response = await fetch(`${apiBase}/api/admin/v2/uploads/product-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            file_name: file.name,
            mime_type: file.type || "image/jpeg",
            data_base64: base64,
            listing_slug: listingSlugHint,
            variant,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(resolveApiErrorMessage(data, "Kunde inte ladda upp bild."));
        }
        const url = sanitizeImageInputUrl(String(data?.data?.url || ""));
        if (url) uploadedUrls.push(url);
      }
      const current = Array.isArray(item.images) ? item.images : item.image_url ? [item.image_url] : [];
      setItemImages(item.id, [...current, ...uploadedUrls]);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte ladda upp bild.");
    } finally {
      setUploadingItemImagesByProduct((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const saveItem = async (item: CatalogItem) => {
    if (!token || !isAdmin) return;
    if (!canMutate) {
      setLocalError("Du har läsbehörighet och kan inte spara ändringar.");
      return;
    }
    setSavingId(item.id);
    setLocalError("");
    try {
      const expectedUpdatedAt = toExpectedUpdatedAt(item.updated_at);
      const eta = parseEta(item.eta_input, item.eta_note);
      const fps = normalizeFpsSandboxSettings(
        fpsByProduct[item.id] || item.fps || { version: 2, entries: [] }
      );
      const usedParts = sanitizeUsedPartsSettings(usedPartsByProduct[item.id] || item.used_parts);
      if (hasInvalidFpsEntries(fps.entries)) {
        throw new Error("Alla FPS-rader måste ha en grafik-text innan de kan sparas.");
      }

      const listing = {
        name: toTextValue(item.name),
        slug: toTextValue(item.slug),
        legacy_id: toTextValue(item.legacy_id),
        description: toTextValue(item.description),
        image_url: toTextValue(item.image_url),
        images: dedupeImageUrls(Array.isArray(item.images) ? item.images : []),
        price_cents: Math.max(0, Math.round(Number(item.price_cents || 0))),
        currency: "SEK",
        cpu: toTextValue(item.cpu),
        gpu: toTextValue(item.gpu),
        ram: toTextValue(item.ram),
        storage: toTextValue(item.storage),
        storage_type: toTextValue(item.storage_type),
        tier: toTextValue(item.tier),
        motherboard: toTextValue(item.motherboard),
        psu: toTextValue(item.psu),
        case_name: toTextValue(item.case_name),
        cpu_cooler: toTextValue(item.cpu_cooler),
        os: toTextValue(item.os),
        quantity_in_stock: Math.max(0, Math.round(Number(item.quantity_in_stock || 0))),
        is_preorder: Boolean(item.is_preorder),
        eta_days: eta.eta_days,
        eta_note: toTextValue(eta.eta_note),
        used_variant_enabled: Boolean(item.used_variant_enabled),
        listing_group_id: toTextValue(item.listing_group_id),
        expected_updated_at: expectedUpdatedAt,
      };

      const requestPayload = {
        listing,
        fps,
        used_parts: usedParts,
        expected_updated_at: expectedUpdatedAt,
      };
      const parsedPayload = sharedUpdateListingRequestSchema.safeParse(requestPayload);
      if (!parsedPayload.success) {
        throw new Error(getValidationMessage(parsedPayload.error, "Ogiltig payload för listning."));
      }

      const response = await fetch(`${apiBase}/api/admin/v2/listings/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(parsedPayload.data),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(resolveApiErrorMessage(data, "Kunde inte spara produkt."));

      const saved = data?.data ? mapListingToCatalogItem(data.data) : item;
      setItems((prev) => prev.map((row) => (row.id === item.id ? saved : row)));
      setFpsByProduct((prev) => ({ ...prev, [item.id]: normalizeFpsSandboxSettings(data?.data?.fps || fps) }));
      setUsedPartsByProduct((prev) => ({ ...prev, [item.id]: sanitizeUsedPartsSettings(data?.data?.used_parts || usedParts) }));
      clearProductDirty(item.id);
      setLastSavedByProduct((prev) => ({ ...prev, [item.id]: new Date().toISOString() }));
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
      const response = await fetch(`${apiBase}/api/admin/v2/listings/${productId}/fps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(resolveApiErrorMessage(data, "Kunde inte hämta FPS-inställningar."));
      setFpsByProduct((prev) => ({
        ...prev,
        [productId]: normalizeFpsSandboxSettings(data?.data || { version: 2, entries: [] }),
      }));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte hämta FPS-inställningar.");
    } finally {
      setFpsLoadingByProduct((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const updateFpsEntry = (productId: string, index: number, patch: Partial<FpsSandboxEntry>) => {
    markProductDirty(productId);
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
    if (!canMutate) {
      setLocalError("Du har läsbehörighet och kan inte spara FPS.");
      return;
    }
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
      const item = items.find((entry) => entry.id === productId);
      const expectedUpdatedAt = toExpectedUpdatedAt(item?.updated_at);
      const response = await fetch(`${apiBase}/api/admin/v2/listings/${productId}/fps`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fps, expected_updated_at: expectedUpdatedAt }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(resolveApiErrorMessage(data, "Kunde inte spara FPS-inställningar."));
      setFpsByProduct((prev) => ({ ...prev, [productId]: normalizeFpsSandboxSettings(data?.data || fps) }));
      setLastSavedByProduct((prev) => ({ ...prev, [productId]: new Date().toISOString() }));
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
      const response = await fetch(`${apiBase}/api/admin/v2/listings/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(resolveApiErrorMessage(data, "Kunde inte hämta begagnade komponenttaggar."));
      setUsedPartsByProduct((prev) => ({ ...prev, [productId]: sanitizeUsedPartsSettings(data?.data?.used_parts) }));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte hämta begagnade komponenttaggar.");
    } finally {
      setUsedPartsLoadingByProduct((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const toggleFpsPanel = (productId: string) => {
    setFpsExpandedByProduct((prev) => {
      const next = !prev[productId];
      if (next && !fpsByProduct[productId] && !fpsLoadingByProduct[productId]) {
        void loadFps(productId);
      }
      return { ...prev, [productId]: next };
    });
  };

  const toggleImagePanel = (productId: string) => {
    setImagesExpandedByProduct((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const saveUsedParts = async (productId: string) => {
    if (!token || !isAdmin) return;
    if (!canMutate) {
      setLocalError("Du har läsbehörighet och kan inte spara taggar.");
      return;
    }
    setUsedPartsSavingByProduct((prev) => ({ ...prev, [productId]: true }));
    setLocalError("");
    try {
      const current = sanitizeUsedPartsSettings(usedPartsByProduct[productId]);
      const item = items.find((entry) => entry.id === productId);
      const expectedUpdatedAt = toExpectedUpdatedAt(item?.updated_at);
      const listing = {
        name: toTextValue(item?.name),
        slug: toTextValue(item?.slug),
        legacy_id: toTextValue(item?.legacy_id),
        description: toTextValue(item?.description),
        image_url: toTextValue(item?.image_url),
        images: dedupeImageUrls(Array.isArray(item?.images) ? item?.images : []),
        price_cents: Math.max(0, Math.round(Number(item?.price_cents || 0))),
        currency: "SEK",
        cpu: toTextValue(item?.cpu),
        gpu: toTextValue(item?.gpu),
        ram: toTextValue(item?.ram),
        storage: toTextValue(item?.storage),
        storage_type: toTextValue(item?.storage_type),
        tier: toTextValue(item?.tier),
        motherboard: toTextValue(item?.motherboard),
        psu: toTextValue(item?.psu),
        case_name: toTextValue(item?.case_name),
        cpu_cooler: toTextValue(item?.cpu_cooler),
        os: toTextValue(item?.os),
        quantity_in_stock: Math.max(0, Math.round(Number(item?.quantity_in_stock || 0))),
        is_preorder: Boolean(item?.is_preorder),
        eta_days: item?.eta_days ?? null,
        eta_note: toTextValue(item?.eta_note),
        used_variant_enabled: Boolean(item?.used_variant_enabled),
        listing_group_id: toTextValue(item?.listing_group_id),
        expected_updated_at: expectedUpdatedAt,
      };
      const requestPayload = {
        listing,
        used_parts: current,
        fps: fpsByProduct[productId] || normalizeFpsSandboxSettings({ version: 2, entries: [] }),
        expected_updated_at: expectedUpdatedAt,
      };
      const parsedPayload = sharedUpdateListingRequestSchema.safeParse(requestPayload);
      if (!parsedPayload.success) {
        throw new Error(getValidationMessage(parsedPayload.error, "Ogiltig payload för listning."));
      }

      const response = await fetch(`${apiBase}/api/admin/v2/listings/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(parsedPayload.data),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resolveApiErrorMessage(data, "Kunde inte spara begagnade komponenttaggar."));
      }
      const saved = sanitizeUsedPartsSettings(data?.data?.used_parts || current);
      setUsedPartsByProduct((prev) => ({ ...prev, [productId]: saved }));
      if (data?.data) {
        setItems((prev) => prev.map((row) => (row.id === productId ? mapListingToCatalogItem(data.data) : row)));
      }
      setLastSavedByProduct((prev) => ({ ...prev, [productId]: new Date().toISOString() }));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte spara begagnade komponenttaggar.");
    } finally {
      setUsedPartsSavingByProduct((prev) => ({ ...prev, [productId]: false }));
    }
  };
  const mapDraftToListingPayload = (
    input: ListingDraft,
    images: string[],
    overrides?: Partial<ListingDraft>
  ) => {
    const merged = { ...input, ...(overrides || {}) };
    const eta = parseEta(merged.eta_input, merged.eta_note);
    const normalizedImages = dedupeImageUrls(images);
    return {
      name: merged.name || "",
      slug: merged.slug || slugify(merged.name),
      legacy_id: merged.legacy_id || "",
      description: merged.description || "",
      image_url: normalizedImages[0] || "",
      images: normalizedImages,
      price_cents: Math.max(0, Math.round(Number(merged.price_cents || 0))),
      currency: "SEK",
      cpu: merged.cpu || "",
      gpu: merged.gpu || "",
      ram: merged.ram || "",
      storage: merged.storage || "",
      storage_type: merged.storage_type || "",
      tier: merged.tier || "",
      motherboard: merged.motherboard || "",
      psu: merged.psu || "",
      case_name: merged.case_name || "",
      cpu_cooler: merged.cpu_cooler || "",
      os: merged.os || "",
      quantity_in_stock: Math.max(0, Math.round(Number(merged.quantity_in_stock || 0))),
      is_preorder: Boolean(merged.is_preorder),
      eta_days: eta.eta_days,
      eta_note: eta.eta_note || "",
      eta_input: merged.eta_input || "",
      used_variant_enabled: true,
    };
  };

  const createListing = async () => {
    if (!token || !isAdmin) return;
    if (!canMutate) {
      setLocalError("Du har läsbehörighet och kan inte skapa produkter.");
      return;
    }
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
      const baseListing = mapDraftToListingPayload(draft, draftImages);
      const payload: any = {
        listing: baseListing,
        fps: normalizeFpsSandboxSettings({ version: 2, entries: normalizedDraftFps }),
      };
      if (createUsedVariant) {
        payload.used_variant = {
          enabled: true,
          listing: mapDraftToListingPayload(usedDraft, usedDraftImages, {
            name: (usedDraft.name || `${draft.name} - Begagnade`).trim(),
            slug: (usedDraft.slug || `${slugify(draft.name)}-begagnade`).trim(),
          }),
          used_parts: usedDraftParts,
        };
      }
      const parsedPayload = sharedCreateListingRequestSchema.safeParse(payload);
      if (!parsedPayload.success) {
        throw new Error(getValidationMessage(parsedPayload.error, "Ogiltig payload för listning."));
      }

      const response = await fetch(`${apiBase}/api/admin/v2/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(parsedPayload.data),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resolveApiErrorMessage(data, "Kunde inte skapa produkt."));
      }

      setDraft(EMPTY_DRAFT);
      setUsedDraft({ ...DEFAULT_USED_DRAFT });
      setUsedDraftParts(DEFAULT_USED_PARTS_SETTINGS);
      setDraftImages([]);
      setUsedDraftImages([]);
      setDraftImageUrlInput("");
      setUsedDraftImageUrlInput("");
      setCreateUsedVariant(false);
      setDraftFpsEntries([]);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setLastDraftAutosaveAt("");
      await loadItems();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte skapa produkt.");
    } finally {
      setCreating(false);
    }
  };

  const knownBaseNameKeys = useMemo(
    () => new Set(COMPUTERS.map((computer) => normalizeProductKey(computer.name)).filter(Boolean)),
    []
  );
  const knownUsedNameKeys = useMemo(
    () =>
      new Set(
        COMPUTERS.map((computer) => normalizeProductKey(computer.usedVariant?.productKey || "")).filter(Boolean)
      ),
    []
  );

  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const itemIdByLookupKey = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => {
      const candidates = [item.id, item.name, item.slug, item.legacy_id];
      candidates.forEach((candidate) => {
        const normalized = normalizeProductKey(String(candidate || ""));
        if (normalized && !map.has(normalized)) {
          map.set(normalized, item.id);
        }
      });
    });
    return map;
  }, [items]);

  const knownVariantPairIds = useMemo(() => {
    const pairs: Array<{ baseId: string; usedId: string }> = [];
    COMPUTERS.forEach((computer) => {
      if (!computer.usedVariant?.productKey) return;
      const baseId =
        itemIdByLookupKey.get(normalizeProductKey(computer.name)) ||
        itemIdByLookupKey.get(normalizeProductKey(computer.id));
      const usedId = itemIdByLookupKey.get(normalizeProductKey(computer.usedVariant.productKey));
      if (!baseId || !usedId || baseId === usedId) return;
      pairs.push({ baseId, usedId });
    });
    return pairs;
  }, [itemIdByLookupKey]);

  const pairedById = useMemo(() => {
    const map = new Map<string, string>();
    const availableIds = new Set(items.map((item) => item.id));

    items.forEach((item) => {
      const linkedId = String(item.linked_product_id || "").trim();
      if (!linkedId || !availableIds.has(linkedId) || linkedId === item.id) return;
      map.set(item.id, linkedId);
      if (!map.has(linkedId)) {
        map.set(linkedId, item.id);
      }
    });

    knownVariantPairIds.forEach(({ baseId, usedId }) => {
      if (!map.has(baseId)) map.set(baseId, usedId);
      if (!map.has(usedId)) map.set(usedId, baseId);
    });

    return map;
  }, [items, knownVariantPairIds]);

  const getItemVariantRole = (item: CatalogItem): "base" | "used" | null => {
    if (item.variant_role === "base" || item.variant_role === "used") return item.variant_role;
    const normalizedName = normalizeProductKey(item.name);
    if (knownBaseNameKeys.has(normalizedName)) return "base";
    if (knownUsedNameKeys.has(normalizedName)) return "used";
    return null;
  };

  const groupedItems = useMemo(() => {
    const groups: Array<{ id: string; items: CatalogItem[] }> = [];
    const seen = new Set<string>();
    const indexById = new Map(items.map((item, index) => [item.id, index]));
    const groupedByListingGroup = new Map<string, CatalogItem[]>();

    items.forEach((item) => {
      const groupId = String(item.listing_group_id || item.variant_group_id || "").trim();
      if (!groupId) return;
      const key = `gid:${groupId}`;
      const existing = groupedByListingGroup.get(key);
      if (existing) {
        existing.push(item);
      } else {
        groupedByListingGroup.set(key, [item]);
      }
    });

    groupedByListingGroup.forEach((groupItems, key) => {
      if (groupItems.length <= 1) return;
      const nextGroup = [...groupItems];
      nextGroup.sort((a, b) => {
        const roleA = getItemVariantRole(a);
        const roleB = getItemVariantRole(b);
        const rankA = roleA === "base" ? 0 : roleA === "used" ? 1 : 2;
        const rankB = roleB === "base" ? 0 : roleB === "used" ? 1 : 2;
        if (rankA !== rankB) return rankA - rankB;
        return (indexById.get(a.id) || 0) - (indexById.get(b.id) || 0);
      });
      groups.push({ id: key, items: nextGroup });
      nextGroup.forEach((entry) => seen.add(entry.id));
    });

    items.forEach((item) => {
      if (seen.has(item.id)) return;
      const partnerId = pairedById.get(item.id);
      const partner = partnerId ? itemsById.get(partnerId) : undefined;
      if (partner && !seen.has(partner.id)) {
        const pair = [item, partner];
        pair.sort((a, b) => {
          const roleA = getItemVariantRole(a);
          const roleB = getItemVariantRole(b);
          const rankA = roleA === "base" ? 0 : roleA === "used" ? 1 : 2;
          const rankB = roleB === "base" ? 0 : roleB === "used" ? 1 : 2;
          if (rankA !== rankB) return rankA - rankB;
          return (indexById.get(a.id) || 0) - (indexById.get(b.id) || 0);
        });
        groups.push({ id: `group:${pair.map((entry) => entry.id).sort().join(":")}`, items: pair });
        seen.add(item.id);
        seen.add(partner.id);
        return;
      }
      groups.push({ id: `single:${item.id}`, items: [item] });
      seen.add(item.id);
    });

    return groups;
  }, [items, itemsById, pairedById]);

  const visibleGroupedItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return groupedItems;
    return groupedItems.filter((group) =>
      group.items.some((item) =>
        `${item.name} ${item.slug || ""} ${item.legacy_id || ""} ${item.id}`.toLowerCase().includes(term)
      )
    );
  }, [groupedItems, query]);

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
      {isAdmin && !canMutate && <p className="text-sm text-yellow-300">Du har läsbehörighet (readonly).</p>}
      {localError && <p className="text-sm text-red-400">{localError}</p>}
      {loadingItems && <p className="text-sm text-slate-400">Laddar produkter...</p>}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white">Skapa ny produkt</h3>
        <p className="text-xs text-slate-400">
          Utkast autosparas lokalt
          {lastDraftAutosaveAt ? ` • Senast sparad ${new Date(lastDraftAutosaveAt).toLocaleTimeString("sv-SE")}` : ""}
        </p>
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
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-200">Bilder för produkten</p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700/60 px-3 py-1 text-xs text-slate-100">
              <Upload className="h-3.5 w-3.5" />
              {uploadingBaseImages ? "Laddar upp..." : "Ladda upp"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploadingBaseImages || !canMutate}
                onChange={(event) => {
                  void uploadDraftImages("base", event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>
          <div className="flex gap-2">
            <input
              value={draftImageUrlInput}
              onChange={(event) => setDraftImageUrlInput(event.target.value)}
              placeholder="Bild-URL eller /sökväg"
              className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            />
            <button
              type="button"
              onClick={() => addImageUrlToDraft("base", draftImageUrlInput)}
              className="rounded-lg border border-slate-700/60 px-3 py-2 text-xs text-slate-100"
            >
              Lägg till
            </button>
          </div>
          {draftImages.length > 0 ? (
            <div className="space-y-2">
              {draftImages.map((image, index) => (
                <div key={`draft-image-${image}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-2 py-2">
                  <img src={image} alt={`Produktbild ${index + 1}`} className="h-10 w-16 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-slate-200">{image}</p>
                    <p className="text-[11px] text-slate-400">{index === 0 ? "Primär bild" : `Bild ${index + 1}`}</p>
                  </div>
                  <button type="button" onClick={() => moveDraftImage("base", index, "up")} disabled={index === 0} className="rounded border border-slate-700/60 px-2 py-1 text-[11px] text-slate-200 disabled:opacity-40">Upp</button>
                  <button type="button" onClick={() => moveDraftImage("base", index, "down")} disabled={index === draftImages.length - 1} className="rounded border border-slate-700/60 px-2 py-1 text-[11px] text-slate-200 disabled:opacity-40">Ner</button>
                  <button type="button" onClick={() => removeDraftImageAt("base", index)} className="rounded border border-red-500/40 px-2 py-1 text-[11px] text-red-300">Ta bort</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Ingen bild uppladdad ännu.</p>
          )}
        </div>

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
                  setUsedDraftImages(draftImages);
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
                  onClick={() => {
                    setUsedDraft(buildUsedDraftFromBase(draft));
                    setUsedDraftImages(draftImages);
                  }}
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

              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-200">Bilder för begagnad variant</p>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700/60 px-3 py-1 text-xs text-slate-100">
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingUsedImages ? "Laddar upp..." : "Ladda upp"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={uploadingUsedImages || !canMutate}
                      onChange={(event) => {
                        void uploadDraftImages("used", event.target.files);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    value={usedDraftImageUrlInput}
                    onChange={(event) => setUsedDraftImageUrlInput(event.target.value)}
                    placeholder="Bild-URL eller /sökväg"
                    className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => addImageUrlToDraft("used", usedDraftImageUrlInput)}
                    className="rounded-lg border border-slate-700/60 px-3 py-2 text-xs text-slate-100"
                  >
                    Lägg till
                  </button>
                </div>
                {usedDraftImages.length > 0 ? (
                  <div className="space-y-2">
                    {usedDraftImages.map((image, index) => (
                      <div key={`used-draft-image-${image}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-2 py-2">
                        <img src={image} alt={`Begagnad bild ${index + 1}`} className="h-10 w-16 rounded object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-slate-200">{image}</p>
                          <p className="text-[11px] text-slate-400">{index === 0 ? "Primär bild" : `Bild ${index + 1}`}</p>
                        </div>
                        <button type="button" onClick={() => moveDraftImage("used", index, "up")} disabled={index === 0} className="rounded border border-slate-700/60 px-2 py-1 text-[11px] text-slate-200 disabled:opacity-40">Upp</button>
                        <button type="button" onClick={() => moveDraftImage("used", index, "down")} disabled={index === usedDraftImages.length - 1} className="rounded border border-slate-700/60 px-2 py-1 text-[11px] text-slate-200 disabled:opacity-40">Ner</button>
                        <button type="button" onClick={() => removeDraftImageAt("used", index)} className="rounded border border-red-500/40 px-2 py-1 text-[11px] text-red-300">Ta bort</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Ingen bild uppladdad ännu.</p>
                )}
              </div>

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
            <div key={`draft-fps-${index}`} className="grid gap-2 md:grid-cols-2 xl:grid-cols-8 items-end">
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
              <select
                value={entry.dlssFsrMode || "balanced"}
                disabled={!entry.supportsDlssFsr}
                onChange={(event) =>
                  setDraftFpsEntries((prev) =>
                    prev.map((row, i) =>
                      i === index
                        ? normalizeFpsEditorEntry({ ...row, dlssFsrMode: event.target.value as FpsSandboxEntry["dlssFsrMode"] })
                        : row
                    )
                  )
                }
                className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-2 py-2 text-sm text-slate-100 disabled:opacity-50"
              >
                {ADMIN_DLSS_FSR_MODE_OPTIONS.map((mode) => (
                  <option key={`draft-dlss-mode-${mode}`} value={mode}>
                    DLSS/FSR: {mode}
                  </option>
                ))}
              </select>
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

        <button type="button" onClick={createListing} disabled={creating || !canMutate} className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white disabled:opacity-70">
          <Save className="h-4 w-4" /> {creating ? "Skapar..." : "Skapa produkt"}
        </button>
      </section>

      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sök produkt" className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none" />
      </div>

      <div className="space-y-4">
        {visibleGroupedItems.map((group) => (
          <div key={group.id} className="space-y-4">
            {group.items.length > 1 ? (
              <div className="rounded-xl border border-[#11667b]/40 bg-[#11667b]/10 px-4 py-2 text-xs text-slate-200">
                Samma datorgrupp: basvariant + begagnad variant
              </div>
            ) : null}
            {group.items.map((item) => {
              const variantRole = getItemVariantRole(item);
              const itemImages = Array.isArray(item.images) ? item.images : [];
              const isImagePanelOpen = Boolean(imagesExpandedByProduct[item.id]);
              return (
          <section key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-lg font-semibold text-white">{item.name}</p>
                  {variantRole === "base" ? (
                    <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-200">
                      Basvariant
                    </span>
                  ) : variantRole === "used" ? (
                    <span className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-2 py-0.5 text-[11px] font-semibold text-yellow-200">
                      Begagnad variant
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-slate-500">{item.id}</p>
                {dirtyProductIds[item.id] ? (
                  <p className="text-xs text-yellow-300">Osparade ändringar</p>
                ) : lastSavedByProduct[item.id] ? (
                  <p className="text-xs text-slate-400">
                    Senast sparad {new Date(lastSavedByProduct[item.id]).toLocaleTimeString("sv-SE")}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void saveItem(item)}
                disabled={savingId === item.id || !canMutate}
                className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white disabled:opacity-70"
              >
                <Save className="h-4 w-4" /> {savingId === item.id ? "Sparar..." : "Spara"}
              </button>
            </div>

            <div className="grid gap-4 xl:grid-cols-12">
              <div className="xl:col-span-9 space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Grunddata</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
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
                      <select
                        value={item.is_preorder ? "true" : "false"}
                        onChange={(event) => setItem(item.id, "is_preorder", event.target.value === "true")}
                        className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                      >
                        <option value="false">Nej</option>
                        <option value="true">Ja</option>
                      </select>
                    </label>
                    <label className="text-xs text-slate-400">
                      Begagnad variant
                      <select
                        value={item.used_variant_enabled ? "true" : "false"}
                        onChange={(event) => setItem(item.id, "used_variant_enabled", event.target.value === "true")}
                        className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                      >
                        <option value="false">Av</option>
                        <option value="true">På</option>
                      </select>
                    </label>
                  </div>
                </div>

                <label className="block text-xs text-slate-400">
                  Beskrivning
                  <textarea
                    value={item.description || ""}
                    onChange={(event) => setItem(item.id, "description", event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
              </div>

              <div className="xl:col-span-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
                  <p className="mb-2 uppercase tracking-[0.16em] text-slate-400">Snabbpanel</p>
                  <div className="space-y-1">
                    <p className="truncate"><span className="text-slate-500">Slug:</span> {item.slug || "-"}</p>
                    <p><span className="text-slate-500">Pris:</span> {Number(item.price_cents || 0).toLocaleString("sv-SE")} öre</p>
                    <p><span className="text-slate-500">Lager:</span> {Math.max(0, Number(item.quantity_in_stock || 0))}</p>
                    <p><span className="text-slate-500">Bilder:</span> {itemImages.length}</p>
                    <p><span className="text-slate-500">FPS-rader:</span> {(fpsByProduct[item.id]?.entries || []).length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-200">Bilder för produkten (bild 1 = thumbnail på produktsidan)</p>
                  <span className="rounded-full border border-slate-700/60 px-2 py-0.5 text-[11px] text-slate-300">
                    {itemImages.length} st
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleImagePanel(item.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700/60 px-3 py-1 text-xs text-slate-100"
                >
                  {isImagePanelOpen ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" /> Dölj
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" /> Se/redigera bilder
                    </>
                  )}
                </button>
              </div>

              {isImagePanelOpen ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700/60 px-3 py-1 text-xs text-slate-100">
                      <Upload className="h-3.5 w-3.5" />
                      {uploadingItemImagesByProduct[item.id] ? "Laddar upp..." : "Ladda upp från enhet"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={uploadingItemImagesByProduct[item.id] || !canMutate}
                        onChange={(event) => {
                          void uploadItemImages(item, event.target.files);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Dra en bild åt vänster för att göra den tidigare i ordningen.
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={itemImageUrlInputByProduct[item.id] || ""}
                      onChange={(event) =>
                        setItemImageUrlInputByProduct((prev) => ({ ...prev, [item.id]: event.target.value }))
                      }
                      placeholder="Bild-URL eller /sökväg (valfritt)"
                      className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => addImageUrlToItem(item.id, itemImageUrlInputByProduct[item.id] || "")}
                      className="rounded-lg border border-slate-700/60 px-3 py-2 text-xs text-slate-100"
                    >
                      Lägg till
                    </button>
                  </div>

                  {itemImages.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {itemImages.map((image, index) => (
                        <div
                          key={`${item.id}-image-${image}-${index}`}
                          draggable={canMutate}
                          onDragStart={(event) => {
                            if (!canMutate) return;
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", `${item.id}:${index}`);
                            setDraggedItemImage({ productId: item.id, index });
                          }}
                          onDragOver={(event) => {
                            if (draggedItemImage?.productId !== item.id) return;
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            if (draggedItemImage?.productId !== item.id) return;
                            reorderItemImage(item.id, draggedItemImage.index, index);
                            setDraggedItemImage(null);
                          }}
                          onDragEnd={() => setDraggedItemImage(null)}
                          className={`rounded-lg border px-2 py-2 ${
                            draggedItemImage?.productId === item.id && draggedItemImage.index === index
                              ? "border-[#22d3ee]/60 bg-[#22d3ee]/10"
                              : "border-slate-800 bg-slate-950/70"
                          }`}
                        >
                          <img src={image} alt={`Produktbild ${index + 1}`} className="h-28 w-full rounded object-cover" />
                          <div className="mt-2 space-y-1">
                            <p className="truncate text-xs text-slate-200">{image}</p>
                            <p className="text-[11px] text-slate-400">
                              {index === 0 ? "Primär bild / thumbnail" : `Bild ${index + 1}`}
                            </p>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveItemImage(item.id, index, "up")}
                              disabled={index === 0 || !canMutate}
                              className="rounded border border-slate-700/60 px-2 py-1 text-[11px] text-slate-200 disabled:opacity-40"
                            >
                              Upp
                            </button>
                            <button
                              type="button"
                              onClick={() => moveItemImage(item.id, index, "down")}
                              disabled={index === itemImages.length - 1 || !canMutate}
                              className="rounded border border-slate-700/60 px-2 py-1 text-[11px] text-slate-200 disabled:opacity-40"
                            >
                              Ner
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItemImageAt(item.id, index)}
                              disabled={!canMutate}
                              className="rounded border border-red-500/40 px-2 py-1 text-[11px] text-red-300 disabled:opacity-40"
                            >
                              Ta bort
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Ingen bild uppladdad ännu.</p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-200">Begagnade komponenttaggar</p>
                {!usedPartsByProduct[item.id] ? (
                  <button type="button" onClick={() => void loadUsedParts(item.id)} disabled={usedPartsLoadingByProduct[item.id]} className="rounded-lg border border-slate-700/60 px-3 py-1 text-xs text-slate-100 disabled:opacity-70">{usedPartsLoadingByProduct[item.id] ? "Laddar..." : "Ladda"}</button>
                ) : (
                  <button type="button" onClick={() => void saveUsedParts(item.id)} disabled={usedPartsSavingByProduct[item.id] || !canMutate} className="rounded-lg bg-yellow-400 px-3 py-1 text-xs font-semibold text-slate-900 disabled:opacity-70">{usedPartsSavingByProduct[item.id] ? "Sparar..." : "Spara taggar"}</button>
                )}
              </div>
              {usedPartsByProduct[item.id] ? (
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  {USED_PART_KEYS.map((key) => (
                    <label key={`${item.id}-used-${key}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-950/70 px-3 py-2 text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(usedPartsByProduct[item.id]?.[key])}
                        onChange={(event) => {
                          markProductDirty(item.id);
                          setUsedPartsByProduct((prev) => ({
                            ...prev,
                            [item.id]: sanitizeUsedPartsSettings({ ...prev[item.id], [key]: event.target.checked }),
                          }));
                        }}
                      />
                      {USED_PART_LABELS[key]}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-200">FPS-variabler för produkten</p>
                  <span className="rounded-full border border-slate-700/60 px-2 py-0.5 text-[11px] text-slate-300">
                    {(fpsByProduct[item.id]?.entries || []).length} st
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFpsPanel(item.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700/60 px-3 py-1 text-xs text-slate-100"
                >
                  {fpsExpandedByProduct[item.id] ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" /> Dölj
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" /> Öppna
                    </>
                  )}
                </button>
              </div>
              {fpsExpandedByProduct[item.id] ? (
                <>
                  {!fpsByProduct[item.id] ? (
                    <button type="button" onClick={() => void loadFps(item.id)} disabled={fpsLoadingByProduct[item.id]} className="rounded-lg border border-slate-700/60 px-3 py-1 text-xs text-slate-100 disabled:opacity-70">{fpsLoadingByProduct[item.id] ? "Laddar..." : "Ladda"}</button>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => {
                        markProductDirty(item.id);
                        setFpsByProduct((prev) => ({ ...prev, [item.id]: normalizeFpsSandboxSettings({ version: 2, entries: [...(prev[item.id]?.entries || []), makeNewFpsEntry()] }) }));
                      }} disabled={!canMutate} className="rounded-lg border border-slate-700/60 px-3 py-1 text-xs text-slate-100 disabled:opacity-70">Lägg till</button>
                      <button type="button" onClick={() => void saveFps(item.id)} disabled={fpsSavingByProduct[item.id] || !canMutate} className="rounded-lg bg-yellow-400 px-3 py-1 text-xs font-semibold text-slate-900 disabled:opacity-70">{fpsSavingByProduct[item.id] ? "Sparar..." : "Spara FPS"}</button>
                    </div>
                  )}
                  {(fpsByProduct[item.id]?.entries || []).map((entry, index) => (
                    <div key={`${item.id}-fps-${index}`} className="grid gap-2 md:grid-cols-2 xl:grid-cols-8 items-end">
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
                      <select
                        value={entry.dlssFsrMode || "balanced"}
                        disabled={!entry.supportsDlssFsr}
                        onChange={(event) => updateFpsEntry(item.id, index, { dlssFsrMode: event.target.value as FpsSandboxEntry["dlssFsrMode"] })}
                        className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-2 py-2 text-sm text-slate-100 disabled:opacity-50"
                      >
                        {ADMIN_DLSS_FSR_MODE_OPTIONS.map((mode) => (
                          <option key={`${item.id}-dlss-mode-${mode}`} value={mode}>
                            DLSS/FSR: {mode}
                          </option>
                        ))}
                      </select>
                      <button type="button" onClick={() => updateFpsEntry(item.id, index, { supportsFrameGeneration: !entry.supportsFrameGeneration })} className={`rounded-lg border px-2 py-2 text-sm font-semibold ${entry.supportsFrameGeneration ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200" : "border-slate-700/60 text-slate-100"}`}>
                        Frame Gen {entry.supportsFrameGeneration ? "På" : "Av"}
                      </button>
                      <button type="button" onClick={() => {
                        markProductDirty(item.id);
                        setFpsByProduct((prev) => ({ ...prev, [item.id]: normalizeFpsSandboxSettings({ version: 2, entries: (prev[item.id]?.entries || []).filter((_, i) => i !== index) }) }));
                      }} className="h-[38px] rounded-lg border border-red-500/40 text-red-300"><Trash2 className="h-4 w-4 mx-auto" /></button>
                    </div>
                  ))}
                </>
              ) : null}
            </div>
          </section>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}







