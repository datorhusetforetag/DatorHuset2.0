import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  FileWarning,
  Globe,
  History,
  ImagePlus,
  LayoutTemplate,
  RefreshCcw,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Upload,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SITE_SETTINGS,
  SITE_ICON_OPTIONS,
  normalizeSiteSettings,
  type SiteIconKey,
  type SiteSettings,
} from "@/lib/siteSettings";
import type { AdminAccessContext } from "../useAdminAccess";

type SiteSettingsBundle = {
  live: SiteSettings;
  draft: SiteSettings;
};

type ProductsBannerKey = "default" | "budget" | "best-selling" | "price-performance" | "toptier";

type PreviewPageDefinition = {
  key:
    | "home"
    | "products-default"
    | "products-budget"
    | "products-best-selling"
    | "products-price-performance"
    | "products-toptier"
    | "service-repair"
    | "customer-service";
  label: string;
  path: string;
  group: "home" | "products" | "serviceRepair" | "customerService";
  bannerKey?: ProductsBannerKey;
  description: string;
};

type PreviewViewport = "desktop" | "tablet" | "mobile";
type PreviewFrameState = "loading" | "ready" | "error";
type TopMenuKey = "file" | "draft" | "json";
type PreviewTheme = "light" | "dark";
type PreviewAuth = "logged-out" | "logged-in";

type SiteSettingsHistoryEntry = {
  id: string;
  mode: "live" | "draft";
  name: string;
  source: string;
  created_at: string;
  actor_id?: string | null;
  settings: SiteSettings;
};

type SiteSettingsAsset = {
  url: string;
  source: string;
};

type SiteSettingsValidationIssue = {
  severity: "error" | "warning";
  path: string;
  message: string;
  value?: string | null;
};

type SiteSettingsValidationResult = {
  ok: boolean;
  issues: SiteSettingsValidationIssue[];
};

const PREVIEW_PAGES: PreviewPageDefinition[] = [
  {
    key: "home",
    label: "Startsida",
    path: "/",
    group: "home",
    description: "Hero, steg, kampanjkort och global navigation/footer.",
  },
  {
    key: "products-default",
    label: "Produkter: standard",
    path: "/products",
    group: "products",
    bannerKey: "default",
    description: "Standardbanner for produktsidan.",
  },
  {
    key: "products-budget",
    label: "Produkter: budget",
    path: "/products?category=budget",
    group: "products",
    bannerKey: "budget",
    description: "Banner for budgetkategorin.",
  },
  {
    key: "products-best-selling",
    label: "Produkter: mest for pengarna",
    path: "/products?category=best-selling",
    group: "products",
    bannerKey: "best-selling",
    description: "Banner for mest-for-pengarna-flodet.",
  },
  {
    key: "products-price-performance",
    label: "Produkter: price-performance",
    path: "/products?category=price-performance",
    group: "products",
    bannerKey: "price-performance",
    description: "Banner for price-performance.",
  },
  {
    key: "products-toptier",
    label: "Produkter: top tier",
    path: "/products?category=toptier",
    group: "products",
    bannerKey: "toptier",
    description: "Banner for basta prestanda.",
  },
  {
    key: "service-repair",
    label: "Service & reparation",
    path: "/service-reparation",
    group: "serviceRepair",
    description: "Hero, CTA, serviceflode och formularkopior.",
  },
  {
    key: "customer-service",
    label: "Kundservice",
    path: "/kundservice",
    group: "customerService",
    description: "Hero, kontaktblock, vanliga arenden och arbetsflode.",
  },
];

const cloneSettings = (value: SiteSettings): SiteSettings => normalizeSiteSettings(JSON.parse(JSON.stringify(value)));

const parseDelimitedLines = (value: string, size: number) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      return Array.from({ length: size }, (_, index) => parts[index] || "");
    });

const parseSimpleLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const formatSimpleLines = (items: string[]) => items.join("\n");
const toDelimitedLines = (rows: string[][]) => rows.map((row) => row.join("|")).join("\n");

const buildPreviewOrigin = () => {
  const configured = String(import.meta.env.VITE_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  if (configured) return configured;
  if (typeof window === "undefined") return "";
  if (window.location.hostname.startsWith("admin.")) {
    return window.location.origin.replace("//admin.", "//");
  }
  return window.location.origin;
};

const buildPreviewUrl = (
  origin: string,
  page: PreviewPageDefinition,
  previewNonce: number,
  previewTheme: PreviewTheme,
  previewAuth: PreviewAuth,
) => {
  const url = new URL(page.path, origin || window.location.origin);
  url.searchParams.set("site-settings-mode", "draft");
  url.searchParams.set("preview_ts", String(previewNonce));
  url.searchParams.set("preview-theme", previewTheme);
  url.searchParams.set("preview-auth", previewAuth);
  return url.toString();
};

const parseApiPayload = async (response: Response) => {
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { error: raw };
  }
};

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Kunde inte läsa filen."));
    reader.readAsDataURL(file);
  });

const collectDiffLines = (beforeValue: unknown, afterValue: unknown, path = ""): string[] => {
  if (typeof beforeValue === "object" && beforeValue && typeof afterValue === "object" && afterValue) {
    const keys = new Set([
      ...Object.keys(beforeValue as Record<string, unknown>),
      ...Object.keys(afterValue as Record<string, unknown>),
    ]);
    return Array.from(keys).flatMap((key) =>
      collectDiffLines(
        (beforeValue as Record<string, unknown>)[key],
        (afterValue as Record<string, unknown>)[key],
        path ? `${path}.${key}` : key,
      ),
    );
  }
  if (JSON.stringify(beforeValue) === JSON.stringify(afterValue)) {
    return [];
  }
  return [path || "root"];
};

const SectionCard = ({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <section id={id} className="rounded-[28px] border border-slate-800 bg-slate-950/70 p-5 shadow-[0_20px_80px_rgba(2,6,23,0.35)]">
    <div className="mb-4">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

const FieldBlock = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) => (
  <label className="block">
    <div className="mb-2 flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {hint ? <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{hint}</span> : null}
    </div>
    {children}
  </label>
);

const ImageField = ({
  label,
  value,
  onChange,
  assets,
  uploadTarget,
  onUpload,
  uploading,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  assets: SiteSettingsAsset[];
  uploadTarget: string;
  onUpload: (target: string, file: File | null) => Promise<void>;
  uploading: boolean;
}) => {
  const suggestions = useMemo(
    () => assets.filter((asset) => asset.url !== value).slice(0, 6),
    [assets, value],
  );

  return (
    <FieldBlock label={label}>
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          {value ? (
            <img src={value} alt={label} className="h-40 w-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">Ingen bild vald</div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white">
            <Upload className="h-4 w-4" />
            {uploading ? "Laddar upp..." : "Ladda upp"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="hidden"
              disabled={uploading}
              onChange={async (event) => {
                const file = event.target.files?.[0] || null;
                await onUpload(uploadTarget, file);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Rensa
          </button>
        </div>
        <Input value={value} onChange={(event) => onChange(event.target.value)} className="border-slate-700 bg-slate-900 text-slate-50" />
        {suggestions.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-3">
            {suggestions.map((asset) => (
              <button
                key={asset.url}
                type="button"
                onClick={() => onChange(asset.url)}
                className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 text-left transition hover:border-cyan-400/50"
              >
                <img src={asset.url} alt={asset.source} className="h-20 w-full object-cover" loading="lazy" decoding="async" />
                <div className="px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">{asset.source}</div>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </FieldBlock>
  );
};

const BuilderPanel = ({
  title,
  eyebrow,
  className,
  children,
}: {
  title: string;
  eyebrow: string;
  className?: string;
  children: ReactNode;
}) => (
  <div
    className={cn(
      "overflow-hidden rounded-[32px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))]",
      className,
    )}
  >
    <div className="border-b border-slate-800 px-6 py-5">
      <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-300/80">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
    </div>
    <div className="space-y-5 p-6">{children}</div>
  </div>
);

const CollapsibleBuilderPanel = ({
  title,
  eyebrow,
  description,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  eyebrow: string;
  description?: string;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}) => (
  <div className="overflow-hidden rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))]">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-900/30"
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">{eyebrow}</p>
        <h3 className="mt-2 text-base font-semibold text-white">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </div>
      <span className="mt-1 rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-slate-300">
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </span>
    </button>
    {!collapsed ? <div className="space-y-4 border-t border-slate-800 px-5 py-5">{children}</div> : null}
  </div>
);

export default function AdminSiteSandbox() {
  const { isAdmin, role, loading, error, token, apiBase, signInWithGoogle } =
    useOutletContext<AdminAccessContext>();
  const canMutate = isAdmin && role !== "readonly";
  const previewOrigin = useMemo(() => buildPreviewOrigin(), []);
  const [selectedPageKey, setSelectedPageKey] = useState<PreviewPageDefinition["key"]>("home");
  const [bundle, setBundle] = useState<SiteSettingsBundle>({
    live: cloneSettings(DEFAULT_SITE_SETTINGS),
    draft: cloneSettings(DEFAULT_SITE_SETTINGS),
  });
  const [draftSettings, setDraftSettings] = useState<SiteSettings>(cloneSettings(DEFAULT_SITE_SETTINGS));
  const [jsonDraft, setJsonDraft] = useState(JSON.stringify(DEFAULT_SITE_SETTINGS, null, 2));
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [resettingDraft, setResettingDraft] = useState(false);
  const [resettingDefaults, setResettingDefaults] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const [previewNonce, setPreviewNonce] = useState(Date.now());
  const [activeSectionId, setActiveSectionId] = useState("global-chrome");
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>("light");
  const [previewAuth, setPreviewAuth] = useState<PreviewAuth>("logged-out");
  const [previewFrameState, setPreviewFrameState] = useState<PreviewFrameState>("loading");
  const [activeTopMenu, setActiveTopMenu] = useState<TopMenuKey | null>(null);
  const [historyEntries, setHistoryEntries] = useState<SiteSettingsHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
  const [snapshotName, setSnapshotName] = useState("");
  const [validation, setValidation] = useState<SiteSettingsValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [assetLibrary, setAssetLibrary] = useState<SiteSettingsAsset[]>([]);
  const [uploadingSiteImageTarget, setUploadingSiteImageTarget] = useState("");
  const [collapsedPanels, setCollapsedPanels] = useState({
    pageSelector: false,
    sections: false,
  });

  const selectedPage = useMemo(
    () => PREVIEW_PAGES.find((page) => page.key === selectedPageKey) || PREVIEW_PAGES[0],
    [selectedPageKey],
  );

  const previewUrl = useMemo(
    () => buildPreviewUrl(previewOrigin, selectedPage, previewNonce, previewTheme, previewAuth),
    [previewAuth, previewNonce, previewOrigin, previewTheme, selectedPage],
  );
  const selectedSnapshot = useMemo(
    () => historyEntries.find((entry) => entry.id === selectedSnapshotId) || null,
    [historyEntries, selectedSnapshotId],
  );
  const snapshotDiffLines = useMemo(
    () => (selectedSnapshot ? collectDiffLines(selectedSnapshot.settings, draftSettings) : []),
    [draftSettings, selectedSnapshot],
  );

  const draftIsDirty = useMemo(
    () => JSON.stringify(draftSettings) !== JSON.stringify(bundle.draft),
    [bundle.draft, draftSettings],
  );

  const draftDiffersFromLive = useMemo(
    () => JSON.stringify(bundle.live) !== JSON.stringify(draftSettings),
    [bundle.live, draftSettings],
  );

  const sectionLinks = useMemo(() => {
    const base = [
      { id: "global-chrome", label: "Global chrome", description: "Navigation, logo och footer." },
      { id: "global-motion", label: "Motion", description: "Styr hero- och banneranimationer på hela sajten." },
    ];
    if (selectedPage.group === "home") {
      return [
        ...base,
        { id: "home-hero", label: "Hero", description: "Huvudbudskap, feature-kort och sekundar copy." },
        { id: "home-categories", label: "Kategorier", description: "Snabblankar och ikonval." },
        { id: "home-steps", label: "Kopflode", description: "Steg, CTA-knappar och copy." },
        { id: "home-promo", label: "Promokort", description: "De stora kampanjkorten pa startsidan." },
      ];
    }
    if (selectedPage.group === "products") {
      return [...base, { id: "products-banner", label: "Banner", description: "Rubrik, bilder, stickers och CTA." }];
    }
    if (selectedPage.group === "serviceRepair") {
      return [
        ...base,
        { id: "service-hero", label: "Hero", description: "Hero-copy och knappar." },
        { id: "service-flow", label: "Flode", description: "Stegen och introduktionen till processen." },
        { id: "service-form", label: "Formular", description: "Formulartitel och beskrivning." },
      ];
    }
    return [
      ...base,
      { id: "customer-hero", label: "Hero", description: "Hero-copy, CTA och hero-bild." },
      { id: "customer-contact", label: "Kontakt", description: "Kontaktinfo, oppettider och supportcopy." },
      { id: "customer-issues", label: "Vanliga arenden", description: "Arendelista och svarstid." },
      { id: "customer-workflow", label: "Arbetsflode", description: "Processen och slut-CTA." },
    ];
  }, [selectedPage.group]);

  const activeSection = useMemo(
    () => sectionLinks.find((section) => section.id === activeSectionId) || sectionLinks[0] || null,
    [activeSectionId, sectionLinks],
  );

  useEffect(() => {
    setJsonDraft(JSON.stringify(draftSettings, null, 2));
  }, [draftSettings]);

  useEffect(() => {
    setActiveSectionId((current) =>
      sectionLinks.some((section) => section.id === current) ? current : (sectionLinks[0]?.id ?? "global-chrome"),
    );
  }, [sectionLinks]);

  const touchPreview = () => {
    setPreviewFrameState("loading");
    setPreviewNonce(Date.now());
  };

  const toggleTopMenu = (menu: TopMenuKey) => {
    setActiveTopMenu((current) => (current === menu ? null : menu));
  };

  const togglePanel = (panel: keyof typeof collapsedPanels) => {
    setCollapsedPanels((current) => ({ ...current, [panel]: !current[panel] }));
  };

  const updateDraft = (recipe: (draft: SiteSettings) => void) => {
    setDraftSettings((current) => {
      const next = cloneSettings(current);
      recipe(next);
      return next;
    });
    setStatusMessage("");
    setLocalError("");
  };

  const loadSettings = async () => {
    if (!token || !isAdmin) return;
    setLoadingSettings(true);
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/site-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await parseApiPayload(response);
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte hamta site settings.");
      }

      const nextBundle = {
        live: normalizeSiteSettings(payload?.settings?.live),
        draft: normalizeSiteSettings(payload?.settings?.draft),
      };
      setBundle(nextBundle);
      setDraftSettings(cloneSettings(nextBundle.draft));
      setStatusMessage("Hamtade senaste live- och draftversionerna.");
      touchPreview();
      await validateDraftSettings(nextBundle.draft);
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte hamta site settings.");
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadHistory = async () => {
    if (!token || !isAdmin) return;
    setHistoryLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/site-settings/history?mode=draft`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await parseApiPayload(response);
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte hämta historik.");
      }
      const entries = Array.isArray(payload?.entries)
        ? payload.entries.map((entry: SiteSettingsHistoryEntry) => ({
            ...entry,
            settings: normalizeSiteSettings(entry.settings),
          }))
        : [];
      setHistoryEntries(entries);
      setSelectedSnapshotId((current) => current || entries[0]?.id || "");
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte hämta historik.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadAssets = async () => {
    if (!token || !isAdmin) return;
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/site-settings/assets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await parseApiPayload(response);
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte hämta bilder.");
      }
      setAssetLibrary(Array.isArray(payload?.assets) ? payload.assets : []);
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte hämta bilder.");
    }
  };

  const validateDraftSettings = async (nextSettings = draftSettings) => {
    if (!token || !isAdmin) return null;
    setValidating(true);
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/site-settings/validate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "draft", settings: nextSettings }),
      });
      const payload = await parseApiPayload(response);
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte validera utkastet.");
      }
      setValidation(payload?.validation || null);
      return payload?.validation || null;
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte validera utkastet.");
      return null;
    } finally {
      setValidating(false);
    }
  };

  const createNamedSnapshot = async () => {
    if (!token || !canMutate) return;
    if (!snapshotName.trim()) {
      setLocalError("Ange ett namn för snapshoten.");
      return;
    }
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/site-settings/snapshot`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "draft", name: snapshotName.trim() }),
      });
      const payload = await parseApiPayload(response);
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte skapa snapshot.");
      }
      setSnapshotName("");
      setStatusMessage(`Snapshot skapad: ${payload?.entry?.name || "Utkast"}.`);
      await loadHistory();
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte skapa snapshot.");
    }
  };

  const rollbackSnapshot = async () => {
    if (!token || !canMutate || !selectedSnapshotId) return;
    if (!window.confirm("Återställ utkastet till den valda versionen?")) return;
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/site-settings/rollback`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "draft", snapshot_id: selectedSnapshotId }),
      });
      const payload = await parseApiPayload(response);
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte återställa versionen.");
      }
      const nextDraft = normalizeSiteSettings(payload?.settings);
      setBundle((current) => ({ ...current, draft: nextDraft }));
      setDraftSettings(cloneSettings(nextDraft));
      setStatusMessage("Utkastet återställdes från versionshistoriken.");
      touchPreview();
      await loadHistory();
      await validateDraftSettings(nextDraft);
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte återställa versionen.");
    }
  };

  const uploadSiteImage = async (target: string, file: File | null) => {
    if (!file || !token || !canMutate) return;
    setUploadingSiteImageTarget(target);
    try {
      const base64 = await fileToBase64(file);
      const response = await fetch(`${apiBase}/api/admin/v2/uploads/site-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_name: file.name,
          mime_type: file.type || "image/jpeg",
          data_base64: base64,
          target,
        }),
      });
      const payload = await parseApiPayload(response);
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte ladda upp bilden.");
      }
      const url = String(payload?.data?.url || "");
      if (url) {
        setAssetLibrary((current) => [{ url, source: "upload" }, ...current.filter((asset) => asset.url !== url)]);
      }
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte ladda upp bilden.");
    } finally {
      setUploadingSiteImageTarget("");
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void loadSettings();
      void loadHistory();
      void loadAssets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const saveDraft = async () => {
    if (!token || !canMutate) return;
    setSavingDraft(true);
    setLocalError("");
    setStatusMessage("");
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/site-settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "draft", settings: draftSettings, snapshot_name: snapshotName.trim() || undefined }),
      });
      const payload = await parseApiPayload(response);
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte spara utkastet.");
      }
      const savedDraft = normalizeSiteSettings(payload?.settings);
      setBundle((current) => ({ ...current, draft: savedDraft }));
      setDraftSettings(cloneSettings(savedDraft));
      if (snapshotName.trim()) {
        setSnapshotName("");
      }
      setStatusMessage("Utkastet ar sparat. Live-sajten ar fortfarande oforandrad.");
      touchPreview();
      await Promise.all([loadHistory(), validateDraftSettings(savedDraft)]);
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte spara utkastet.");
    } finally {
      setSavingDraft(false);
    }
  };

  const publishDraft = async () => {
    if (!token || !canMutate) return;
    if (!window.confirm("Publicera draft till live? Detta andrar den publika sajten.")) return;
    const nextValidation = await validateDraftSettings();
    if (nextValidation && !nextValidation.ok) {
      setLocalError("Rätta valideringsfelen innan du publicerar.");
      return;
    }
    setPublishing(true);
    setLocalError("");
    setStatusMessage("");
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/site-settings/publish`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const payload = await parseApiPayload(response);
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte publicera draften.");
      }
      const nextBundle = {
        live: normalizeSiteSettings(payload?.settings?.live),
        draft: normalizeSiteSettings(payload?.settings?.draft),
      };
      setBundle(nextBundle);
      setDraftSettings(cloneSettings(nextBundle.draft));
      setStatusMessage("Draften ar nu publicerad till live.");
      touchPreview();
      await loadHistory();
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte publicera draften.");
    } finally {
      setPublishing(false);
    }
  };

  const cloneLiveToDraft = async () => {
    if (!token || !canMutate) return;
    if (!window.confirm("Ersatt nuvarande draft med liveversionen?")) return;
    setResettingDraft(true);
    setLocalError("");
    setStatusMessage("");
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/site-settings/clone-live-to-draft`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const payload = await parseApiPayload(response);
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte aterstalla draft fran live.");
      }
      const nextBundle = {
        live: normalizeSiteSettings(payload?.settings?.live),
        draft: normalizeSiteSettings(payload?.settings?.draft),
      };
      setBundle(nextBundle);
      setDraftSettings(cloneSettings(nextBundle.draft));
      setStatusMessage("Draften matchar nu liveversionen.");
      touchPreview();
      await Promise.all([loadHistory(), validateDraftSettings(nextBundle.draft)]);
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte aterstalla draft fran live.");
    } finally {
      setResettingDraft(false);
    }
  };

  const resetDraftToDefaults = async () => {
    if (!token || !canMutate) return;
    if (!window.confirm("Aterstall draft till standardsidan?")) return;
    setResettingDefaults(true);
    setLocalError("");
    setStatusMessage("");
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/site-settings/reset`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "draft" }),
      });
      const payload = await parseApiPayload(response);
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte aterstalla draften.");
      }
      const nextDraft = normalizeSiteSettings(payload?.settings);
      setBundle((current) => ({ ...current, draft: nextDraft }));
      setDraftSettings(cloneSettings(nextDraft));
      setStatusMessage("Draften ar aterstalld till standardsidan.");
      touchPreview();
      await Promise.all([loadHistory(), validateDraftSettings(nextDraft)]);
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte aterstalla draften.");
    } finally {
      setResettingDefaults(false);
    }
  };

  const applyJsonDraft = () => {
    try {
      const parsed = JSON.parse(jsonDraft);
      setDraftSettings(normalizeSiteSettings(parsed));
      setLocalError("");
      setStatusMessage("JSON-utkastet ar laddat i buildern. Spara draft nar du ar klar.");
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Ogiltig JSON.");
    }
  };

  const formatJsonDraft = () => {
    try {
      const parsed = JSON.parse(jsonDraft);
      setJsonDraft(JSON.stringify(normalizeSiteSettings(parsed), null, 2));
      setLocalError("");
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Ogiltig JSON.");
    }
  };

  const navMenuLines = toDelimitedLines(
    draftSettings.site.navigation.menuItems.map((item) => [item.label, item.href]),
  );
  const socialLines = toDelimitedLines(
    draftSettings.site.footer.socialLinks.map((item) => [item.platform, item.label, item.href]),
  );
  const footerColumnsLines = draftSettings.site.footer.columns
    .map((column) => `${column.title}::${column.links.map((link) => `${link.label}|${link.href}`).join(";;")}`)
    .join("\n");

  const selectedBanner = selectedPage.bannerKey
    ? draftSettings.pages.products.banners[selectedPage.bannerKey]
    : draftSettings.pages.products.banners.default;
  const previewModeButtonClass = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
      active
        ? "border-cyan-400/50 bg-cyan-400/12 text-white"
        : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white",
    );
  const previewViewportButtonClass = (viewport: PreviewViewport) =>
    previewModeButtonClass(previewViewport === viewport);
  const previewViewportShellClass =
    previewViewport === "desktop"
      ? "w-full"
      : previewViewport === "tablet"
        ? "mx-auto w-full max-w-[860px]"
        : "mx-auto w-full max-w-[430px]";
  const previewViewportHeightClass =
    previewViewport === "desktop"
      ? "h-[780px] lg:h-[920px] 2xl:h-[1080px]"
      : previewViewport === "tablet"
        ? "h-[1040px]"
        : "h-[820px]";
  const isActiveSection = (sectionId: string) => activeSectionId === sectionId;

  useEffect(() => {
    setPreviewFrameState("loading");
  }, [previewUrl, previewViewport]);

  if (loading) {
    return (
      <div className="rounded-[32px] border border-slate-800 bg-slate-950/70 p-8 text-sm text-slate-300">
        Verifierar admin-atkomst...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-[32px] border border-slate-800 bg-slate-950/70 p-8">
        <p className="text-sm text-slate-300">{error || "Du maste vara inloggad med admin-behorighet for att anvanda sandboxen."}</p>
        <Button className="mt-4" onClick={() => void signInWithGoogle()}>
          Logga in med Google
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] shadow-[0_20px_80px_rgba(2,6,23,0.35)]">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-800 px-3 py-2">
          {[
            { key: "file" as const, label: "File" },
            { key: "draft" as const, label: "Draft" },
            { key: "json" as const, label: "Advanced JSON" },
          ].map((menu) => (
            <button
              key={menu.key}
              type="button"
              onClick={() => toggleTopMenu(menu.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition",
                activeTopMenu === menu.key
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-900/70 hover:text-white",
              )}
            >
              {menu.label}
            </button>
          ))}
          <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1">
              {selectedPage.label}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1">
              {draftDiffersFromLive ? "Draft differs from live" : "Draft matches live"}
            </span>
          </div>
        </div>

        {activeTopMenu === "file" ? (
          <div className="space-y-4 border-t border-slate-800 bg-slate-950/45 p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Button onClick={() => void loadSettings()} disabled={loadingSettings}>
                <RefreshCcw className="h-4 w-4" />
                {loadingSettings ? "Laddar..." : "Reload site settings"}
              </Button>
              <Button variant="outline" onClick={touchPreview}>
                <RefreshCcw className="h-4 w-4" />
                Reload preview
              </Button>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
              >
                <Globe className="h-4 w-4" />
                Open preview in new tab
              </a>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
              Public route: <span className="font-mono text-slate-100">{selectedPage.path}</span>
            </div>
          </div>
        ) : null}

        {activeTopMenu === "draft" ? (
          <div className="space-y-4 border-t border-slate-800 bg-slate-950/45 p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Button variant="secondary" onClick={() => void saveDraft()} disabled={!canMutate || savingDraft}>
                <Save className="h-4 w-4" />
                {savingDraft ? "Sparar draft..." : "Save draft only"}
              </Button>
              <Button variant="outline" onClick={() => void cloneLiveToDraft()} disabled={!canMutate || resettingDraft}>
                <Sparkles className="h-4 w-4" />
                {resettingDraft ? "Aterstaller..." : "Reset draft to live"}
              </Button>
              <Button variant="outline" onClick={() => void resetDraftToDefaults()} disabled={!canMutate || resettingDefaults}>
                <RefreshCcw className="h-4 w-4" />
                {resettingDefaults ? "Aterstaller..." : "Reset draft to defaults"}
              </Button>
              <Button
                className="bg-yellow-400 text-slate-950 hover:bg-yellow-300"
                onClick={() => void publishDraft()}
                disabled={!canMutate || publishing}
              >
                <Send className="h-4 w-4" />
                {publishing ? "Publicerar..." : "Publish changes to live server"}
              </Button>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
                {draftIsDirty ? "Lokala osparade andringar." : "Lokalt synkad med sparad draft."}
              </div>
            </div>
          </div>
        ) : null}

        {activeTopMenu === "json" ? (
          <div className="space-y-4 border-t border-slate-800 bg-slate-950/45 p-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <Textarea
                value={jsonDraft}
                onChange={(event) => setJsonDraft(event.target.value)}
                rows={18}
                className="border-slate-700 bg-slate-950 font-mono text-xs text-slate-50"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="outline" onClick={formatJsonDraft}>
                  Format JSON
                </Button>
                <Button variant="secondary" onClick={applyJsonDraft}>
                  Apply to builder
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {statusMessage ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {statusMessage}
        </div>
      ) : null}
      {localError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {localError}
        </div>
      ) : null}

      <BuilderPanel title="Live preview" eyebrow="Exact public render">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),auto] xl:items-start">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200">
                <Eye className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{selectedPage.label}</p>
                <p className="mt-1 text-xs text-slate-400">{selectedPage.description}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {previewFrameState === "loading"
                    ? "Preview is loading the real draft route."
                    : previewFrameState === "error"
                      ? "Iframe render failed. Use the File menu to open the preview in a new tab."
                      : "Iframe is rendering the real public page with draft data."}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setPreviewViewport("desktop")} className={previewViewportButtonClass("desktop")}>
                Desktop
              </button>
              <button type="button" onClick={() => setPreviewViewport("tablet")} className={previewViewportButtonClass("tablet")}>
                Tablet
              </button>
              <button type="button" onClick={() => setPreviewViewport("mobile")} className={previewViewportButtonClass("mobile")}>
                Mobile
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["light", "dark"] as PreviewTheme[]).map((theme) => (
                <button key={theme} type="button" onClick={() => setPreviewTheme(theme)} className={previewModeButtonClass(theme === previewTheme)}>
                  {theme === "light" ? "Ljust läge" : "Mörkt läge"}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(["logged-out", "logged-in"] as PreviewAuth[]).map((authState) => (
                <button key={authState} type="button" onClick={() => setPreviewAuth(authState)} className={previewModeButtonClass(authState === previewAuth)}>
                  {authState === "logged-in" ? "Inloggad" : "Utloggad"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-3">
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3 truncate font-mono text-[11px] text-slate-300">{previewUrl}</span>
          </div>
          <div className={cn("overflow-hidden rounded-[24px] border border-slate-800 bg-white transition-all", previewViewportShellClass)}>
            <iframe
              key={`${previewUrl}-${previewViewport}`}
              title={`Preview ${selectedPage.label}`}
              src={previewUrl}
              onLoad={() => setPreviewFrameState("ready")}
              onError={() => setPreviewFrameState("error")}
              className={cn("w-full bg-white", previewViewportHeightClass)}
            />
          </div>
        </div>
      </BuilderPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <BuilderPanel title="Publish validation" eyebrow="Safe checks before live">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => void validateDraftSettings()} disabled={validating}>
              <FileWarning className="h-4 w-4" />
              {validating ? "Validerar..." : "Kör validering"}
            </Button>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
              {validation
                ? validation.ok
                  ? "Inga blockerande fel hittades."
                  : `${validation.issues.filter((issue) => issue.severity === "error").length} blockerande fel`
                : "Ingen validering körd än."}
            </div>
          </div>
          <div className="space-y-3">
            {(validation?.issues || []).length === 0 ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Klart att publicera. Utkastet klarade de aktuella länkar-, bild- och copy-kontrollerna.
                </div>
              </div>
            ) : (
              (validation?.issues || []).map((issue, index) => (
                <div
                  key={`${issue.path}-${index}`}
                  className={cn(
                    "rounded-2xl border px-4 py-4 text-sm",
                    issue.severity === "error"
                      ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-100",
                  )}
                >
                  <p className="font-semibold">{issue.path}</p>
                  <p className="mt-1">{issue.message}</p>
                  {issue.value ? <p className="mt-2 break-all font-mono text-xs opacity-80">{issue.value}</p> : null}
                </div>
              ))
            )}
          </div>
        </BuilderPanel>

        <BuilderPanel title="Version history" eyebrow="Named drafts, diff and rollback">
          <div className="flex flex-wrap gap-3">
            <Input
              value={snapshotName}
              onChange={(event) => setSnapshotName(event.target.value)}
              placeholder="Namnge snapshot, till exempel Sommarkampanj v2"
              className="border-slate-700 bg-slate-900 text-slate-50"
            />
            <Button variant="secondary" onClick={() => void createNamedSnapshot()} disabled={!canMutate}>
              <History className="h-4 w-4" />
              Spara snapshot
            </Button>
            <Button variant="outline" onClick={() => void loadHistory()} disabled={historyLoading}>
              <RefreshCcw className="h-4 w-4" />
              {historyLoading ? "Laddar..." : "Ladda historik"}
            </Button>
            <Button variant="outline" onClick={() => void rollbackSnapshot()} disabled={!canMutate || !selectedSnapshotId}>
              <RotateCcw className="h-4 w-4" />
              Rollback
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.9fr,1.1fr]">
            <div className="space-y-3">
              {historyEntries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedSnapshotId(entry.id)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-4 text-left transition",
                    selectedSnapshotId === entry.id
                      ? "border-cyan-400/50 bg-cyan-400/12 text-white"
                      : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:text-white",
                  )}
                >
                  <p className="text-sm font-semibold">{entry.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{entry.source}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(entry.created_at).toLocaleString("sv-SE")}</p>
                </button>
              ))}
              {historyEntries.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 text-sm text-slate-400">
                  Ingen historik ännu. Spara ett namngivet snapshot eller ett utkast för att börja bygga versionsspår.
                </div>
              ) : null}
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              {selectedSnapshot ? (
                <>
                  <p className="text-sm font-semibold text-white">{selectedSnapshot.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {selectedSnapshot.source} • {new Date(selectedSnapshot.created_at).toLocaleString("sv-SE")}
                  </p>
                  <div className="mt-4 space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ändrade paths mot nuvarande utkast</p>
                    {snapshotDiffLines.length > 0 ? (
                      <div className="max-h-72 space-y-2 overflow-y-auto pr-2">
                        {snapshotDiffLines.map((line) => (
                          <div key={line} className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 font-mono text-xs text-slate-200">
                            {line}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200">
                        Den valda versionen matchar nuvarande utkast.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-400">Välj en version för att se diff och köra rollback.</div>
              )}
            </div>
          </div>
        </BuilderPanel>
      </div>

      <BuilderPanel
        title={`${selectedPage.label} builder`}
        eyebrow="Main function builder"
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{selectedPage.label}</p>
              <p className="mt-1 text-xs text-slate-400">
                {activeSection ? `${activeSection.label}: ${activeSection.description}` : selectedPage.description}
              </p>
            </div>
            <div className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
              {selectedPage.path}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {sectionLinks.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                className={cn(
                  "rounded-full border px-3 py-2 text-xs font-semibold transition",
                  isActiveSection(section.id)
                    ? "border-cyan-400/50 bg-cyan-400/12 text-white"
                    : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-500 hover:text-white",
                )}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
                {isActiveSection("global-chrome") ? (
                <SectionCard
                  id="global-chrome"
                  title="Global chrome"
                  description="Navigation, footer och gemensamma element som visas pa alla preview-sidor."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldBlock label="Brand name">
                      <Input
                        value={draftSettings.site.navigation.brandName}
                        onChange={(event) => updateDraft((draft) => {
                          draft.site.navigation.brandName = event.target.value;
                        })}
                        className="border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </FieldBlock>
                    <FieldBlock label="Menu label">
                      <Input
                        value={draftSettings.site.navigation.menuLabel}
                        onChange={(event) => updateDraft((draft) => {
                          draft.site.navigation.menuLabel = event.target.value;
                        })}
                        className="border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </FieldBlock>
                    <ImageField
                      label="Navigation logo"
                      value={draftSettings.site.navigation.logoUrl}
                      assets={assetLibrary}
                      uploadTarget="navigation-logo"
                      uploading={uploadingSiteImageTarget === "navigation-logo"}
                      onUpload={uploadSiteImage}
                      onChange={(value) => updateDraft((draft) => {
                        draft.site.navigation.logoUrl = value;
                      })}
                    />
                    <FieldBlock label="Search placeholder">
                      <Input
                        value={draftSettings.site.navigation.searchPlaceholder}
                        onChange={(event) => updateDraft((draft) => {
                          draft.site.navigation.searchPlaceholder = event.target.value;
                        })}
                        className="border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </FieldBlock>
                    <FieldBlock label="Admin portal href">
                      <Input
                        value={draftSettings.site.navigation.adminPortalHref}
                        onChange={(event) => updateDraft((draft) => {
                          draft.site.navigation.adminPortalHref = event.target.value;
                        })}
                        className="border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </FieldBlock>
                    <ImageField
                      label="Footer logo"
                      value={draftSettings.site.footer.logoUrl}
                      assets={assetLibrary}
                      uploadTarget="footer-logo"
                      uploading={uploadingSiteImageTarget === "footer-logo"}
                      onUpload={uploadSiteImage}
                      onChange={(value) => updateDraft((draft) => {
                        draft.site.footer.logoUrl = value;
                      })}
                    />
                  </div>

                  <FieldBlock label="Navigation links" hint="label|href">
                    <Textarea
                      value={navMenuLines}
                      onChange={(event) => updateDraft((draft) => {
                        draft.site.navigation.menuItems = parseDelimitedLines(event.target.value, 2)
                          .filter(([label, href]) => label && href)
                          .map(([label, href]) => ({ label, href }));
                      })}
                      rows={5}
                      className="border-slate-700 bg-slate-900 text-slate-50"
                    />
                  </FieldBlock>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldBlock label="Footer support title">
                      <Input
                        value={draftSettings.site.footer.supportTitle}
                        onChange={(event) => updateDraft((draft) => {
                          draft.site.footer.supportTitle = event.target.value;
                        })}
                        className="border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </FieldBlock>
                    <FieldBlock label="Footer support email">
                      <Input
                        value={draftSettings.site.footer.supportEmail}
                        onChange={(event) => updateDraft((draft) => {
                          draft.site.footer.supportEmail = event.target.value;
                        })}
                        className="border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </FieldBlock>
                    <FieldBlock label="Support hours">
                      <Input
                        value={draftSettings.site.footer.supportHours}
                        onChange={(event) => updateDraft((draft) => {
                          draft.site.footer.supportHours = event.target.value;
                        })}
                        className="border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </FieldBlock>
                    <FieldBlock label="Copyright">
                      <Input
                        value={draftSettings.site.footer.copyright}
                        onChange={(event) => updateDraft((draft) => {
                          draft.site.footer.copyright = event.target.value;
                        })}
                        className="border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </FieldBlock>
                  </div>

                  <FieldBlock label="Footer columns" hint="ColumnTitle::label|href;;label|href">
                    <Textarea
                      value={footerColumnsLines}
                      onChange={(event) => updateDraft((draft) => {
                        draft.site.footer.columns = event.target.value
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .map((line) => {
                            const [titleRaw, linksRaw = ""] = line.split("::");
                            const links = linksRaw
                              .split(";;")
                              .map((entry) => entry.trim())
                              .filter(Boolean)
                              .map((entry) => {
                                const [label, href] = entry.split("|").map((part) => part.trim());
                                return label && href ? { label, href } : null;
                              })
                              .filter((entry): entry is { label: string; href: string } => Boolean(entry));
                            return { title: titleRaw?.trim() || "", links };
                          })
                          .filter((column) => column.title && column.links.length > 0);
                      })}
                      rows={6}
                      className="border-slate-700 bg-slate-900 text-slate-50"
                    />
                  </FieldBlock>

                  <FieldBlock label="Social links" hint="platform|label|href">
                    <Textarea
                      value={socialLines}
                      onChange={(event) => updateDraft((draft) => {
                        draft.site.footer.socialLinks = parseDelimitedLines(event.target.value, 3)
                          .filter(([platform, label, href]) => platform && label && href)
                          .map(([platform, label, href]) => ({
                            platform: platform as SiteSettings["site"]["footer"]["socialLinks"][number]["platform"],
                            label,
                            href,
                          }));
                      })}
                      rows={5}
                      className="border-slate-700 bg-slate-900 text-slate-50"
                    />
                  </FieldBlock>
                </SectionCard>
                ) : null}

                {isActiveSection("global-motion") ? (
                <SectionCard
                  id="global-motion"
                  title="Motion system"
                  description="Finjustera rörelse i startsidans hero och produktsidans banners utan kodändringar."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldBlock label="Hero reveal duration (ms)">
                      <Input
                        type="number"
                        min={0}
                        max={4000}
                        value={draftSettings.site.motion.heroRevealDurationMs}
                        onChange={(event) => updateDraft((draft) => {
                          draft.site.motion.heroRevealDurationMs = Math.max(0, Math.min(4000, Number(event.target.value) || 0));
                        })}
                        className="border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </FieldBlock>
                    <FieldBlock label="Hero stagger (ms)">
                      <Input
                        type="number"
                        min={0}
                        max={1500}
                        value={draftSettings.site.motion.heroRevealStaggerMs}
                        onChange={(event) => updateDraft((draft) => {
                          draft.site.motion.heroRevealStaggerMs = Math.max(0, Math.min(1500, Number(event.target.value) || 0));
                        })}
                        className="border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </FieldBlock>
                    <FieldBlock label="Banner reveal duration (ms)">
                      <Input
                        type="number"
                        min={0}
                        max={4000}
                        value={draftSettings.site.motion.bannerRevealDurationMs}
                        onChange={(event) => updateDraft((draft) => {
                          draft.site.motion.bannerRevealDurationMs = Math.max(0, Math.min(4000, Number(event.target.value) || 0));
                        })}
                        className="border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </FieldBlock>
                    <FieldBlock label="Banner reveal distance (px)">
                      <Input
                        type="number"
                        min={0}
                        max={80}
                        value={draftSettings.site.motion.bannerRevealDistancePx}
                        onChange={(event) => updateDraft((draft) => {
                          draft.site.motion.bannerRevealDistancePx = Math.max(0, Math.min(80, Number(event.target.value) || 0));
                        })}
                        className="border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </FieldBlock>
                    <FieldBlock label="Card hover scale">
                      <Input
                        type="number"
                        min={1}
                        max={1.2}
                        step="0.01"
                        value={draftSettings.site.motion.cardHoverScale}
                        onChange={(event) => updateDraft((draft) => {
                          draft.site.motion.cardHoverScale = Math.max(1, Math.min(1.2, Number(event.target.value) || 1));
                        })}
                        className="border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </FieldBlock>
                  </div>
                </SectionCard>
                ) : null}

                {selectedPage.group === "home" ? (
                  <>
                    {isActiveSection("home-hero") ? (
                    <SectionCard id="home-hero" title="Hero" description="Styr startsidans oversta block utan att andra layouten.">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FieldBlock label="Main title">
                          <Input
                            value={draftSettings.homepage.hero.title}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.hero.title = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Subtitle">
                          <Input
                            value={draftSettings.homepage.hero.subtitle}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.hero.subtitle = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Feature eyebrow">
                          <Input
                            value={draftSettings.homepage.hero.featureEyebrow}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.hero.featureEyebrow = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Feature title">
                          <Input
                            value={draftSettings.homepage.hero.featureTitle}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.hero.featureTitle = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <ImageField
                          label="Feature image"
                          value={draftSettings.homepage.hero.featureImage}
                          assets={assetLibrary}
                          uploadTarget="homepage-feature"
                          uploading={uploadingSiteImageTarget === "homepage-feature"}
                          onUpload={uploadSiteImage}
                          onChange={(value) => updateDraft((draft) => {
                            draft.homepage.hero.featureImage = value;
                          })}
                        />
                        <FieldBlock label="Feature image alt">
                          <Input
                            value={draftSettings.homepage.hero.featureImageAlt}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.hero.featureImageAlt = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Secondary title">
                          <Input
                            value={draftSettings.homepage.hero.secondaryTitle}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.hero.secondaryTitle = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Secondary badge">
                          <Input
                            value={draftSettings.homepage.hero.secondaryBadge}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.hero.secondaryBadge = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                      </div>

                      <FieldBlock label="Secondary description">
                        <Textarea
                          value={draftSettings.homepage.hero.secondaryDescription}
                          onChange={(event) => updateDraft((draft) => {
                            draft.homepage.hero.secondaryDescription = event.target.value;
                          })}
                          rows={3}
                          className="border-slate-700 bg-slate-900 text-slate-50"
                        />
                      </FieldBlock>

                      <FieldBlock label="Secondary note">
                        <Input
                          value={draftSettings.homepage.hero.secondaryNote}
                          onChange={(event) => updateDraft((draft) => {
                            draft.homepage.hero.secondaryNote = event.target.value;
                          })}
                          className="border-slate-700 bg-slate-900 text-slate-50"
                        />
                      </FieldBlock>

                      <div className="grid gap-4 md:grid-cols-3">
                        <FieldBlock label="Categories title">
                          <Input
                            value={draftSettings.homepage.hero.categoriesTitle}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.hero.categoriesTitle = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Featured title">
                          <Input
                            value={draftSettings.homepage.hero.featuredTitle}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.hero.featuredTitle = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Inventory pill">
                          <Input
                            value={draftSettings.homepage.hero.featuredInventoryLabel}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.hero.featuredInventoryLabel = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                      </div>

                      <FieldBlock label="Featured count">
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          value={draftSettings.homepage.hero.featuredCount}
                          onChange={(event) => updateDraft((draft) => {
                            draft.homepage.hero.featuredCount = Math.max(0, Math.min(10, Number(event.target.value) || 0));
                          })}
                          className="border-slate-700 bg-slate-900 text-slate-50"
                        />
                      </FieldBlock>
                    </SectionCard>
                    ) : null}

                    {isActiveSection("home-categories") ? (
                    <SectionCard id="home-categories" title="Category cards" description="Kort i hero-karusellen.">
                      <div className="space-y-4">
                        {draftSettings.homepage.hero.categories.map((category, index) => (
                          <div key={`${category.name}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-sm font-semibold text-white">Kategori {index + 1}</p>
                              <button
                                type="button"
                                onClick={() => updateDraft((draft) => {
                                  draft.homepage.hero.categories.splice(index, 1);
                                })}
                                className="text-xs font-semibold text-rose-300 transition hover:text-rose-200"
                              >
                                Ta bort
                              </button>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                              <FieldBlock label="Name">
                                <Input
                                  value={category.name}
                                  onChange={(event) => updateDraft((draft) => {
                                    draft.homepage.hero.categories[index].name = event.target.value;
                                  })}
                                  className="border-slate-700 bg-slate-950 text-slate-50"
                                />
                              </FieldBlock>
                              <FieldBlock label="Icon">
                                <select
                                  value={category.icon}
                                  onChange={(event) => updateDraft((draft) => {
                                    draft.homepage.hero.categories[index].icon = event.target.value as SiteIconKey;
                                  })}
                                  className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-50"
                                >
                                  {SITE_ICON_OPTIONS.map((icon) => (
                                    <option key={icon} value={icon}>
                                      {icon}
                                    </option>
                                  ))}
                                </select>
                              </FieldBlock>
                              <FieldBlock label="Href">
                                <Input
                                  value={category.href}
                                  onChange={(event) => updateDraft((draft) => {
                                    draft.homepage.hero.categories[index].href = event.target.value;
                                  })}
                                  className="border-slate-700 bg-slate-950 text-slate-50"
                                />
                              </FieldBlock>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => updateDraft((draft) => {
                            draft.homepage.hero.categories.push({
                              name: "Ny kategori",
                              icon: "monitor",
                              href: "/products",
                            });
                          })}
                        >
                          Lagg till kategori
                        </Button>
                      </div>
                    </SectionCard>
                    ) : null}

                    {isActiveSection("home-steps") ? (
                    <SectionCard id="home-steps" title="Kopflode" description="Stegsektionen under hero.">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FieldBlock label="Section title">
                          <Input
                            value={draftSettings.homepage.steps.title}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.steps.title = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Section description">
                          <Input
                            value={draftSettings.homepage.steps.description}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.steps.description = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Primary CTA label">
                          <Input
                            value={draftSettings.homepage.steps.primaryLabel}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.steps.primaryLabel = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Primary CTA href">
                          <Input
                            value={draftSettings.homepage.steps.primaryHref}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.steps.primaryHref = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Secondary CTA label">
                          <Input
                            value={draftSettings.homepage.steps.secondaryLabel}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.steps.secondaryLabel = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Secondary CTA href">
                          <Input
                            value={draftSettings.homepage.steps.secondaryHref}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.steps.secondaryHref = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                      </div>

                      <div className="space-y-4">
                        {draftSettings.homepage.steps.items.map((item, index) => (
                          <div key={`${item.title}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-sm font-semibold text-white">Steg {index + 1}</p>
                              <button
                                type="button"
                                onClick={() => updateDraft((draft) => {
                                  draft.homepage.steps.items.splice(index, 1);
                                })}
                                className="text-xs font-semibold text-rose-300 transition hover:text-rose-200"
                              >
                                Ta bort
                              </button>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                              <FieldBlock label="Title">
                                <Input
                                  value={item.title}
                                  onChange={(event) => updateDraft((draft) => {
                                    draft.homepage.steps.items[index].title = event.target.value;
                                  })}
                                  className="border-slate-700 bg-slate-950 text-slate-50"
                                />
                              </FieldBlock>
                              <FieldBlock label="Icon">
                                <select
                                  value={item.icon}
                                  onChange={(event) => updateDraft((draft) => {
                                    draft.homepage.steps.items[index].icon = event.target.value as SiteIconKey;
                                  })}
                                  className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-50"
                                >
                                  {SITE_ICON_OPTIONS.map((icon) => (
                                    <option key={icon} value={icon}>
                                      {icon}
                                    </option>
                                  ))}
                                </select>
                              </FieldBlock>
                              <FieldBlock label="Description">
                                <Textarea
                                  value={item.description}
                                  onChange={(event) => updateDraft((draft) => {
                                    draft.homepage.steps.items[index].description = event.target.value;
                                  })}
                                  rows={3}
                                  className="border-slate-700 bg-slate-950 text-slate-50"
                                />
                              </FieldBlock>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => updateDraft((draft) => {
                            draft.homepage.steps.items.push({
                              title: "Nytt steg",
                              description: "Beskriv steget har.",
                              icon: "monitor",
                            });
                          })}
                        >
                          Lagg till steg
                        </Button>
                      </div>
                    </SectionCard>
                    ) : null}

                    {isActiveSection("home-promo") ? (
                    <SectionCard id="home-promo" title="Promokort" description="De tva stora korten langst ned pa startsidan.">
                      <div className="grid gap-4 md:grid-cols-3">
                        <FieldBlock label="Eyebrow">
                          <Input
                            value={draftSettings.homepage.promo.eyebrow}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.promo.eyebrow = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Title">
                          <Input
                            value={draftSettings.homepage.promo.title}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.promo.title = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Description">
                          <Textarea
                            value={draftSettings.homepage.promo.description}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.promo.description = event.target.value;
                            })}
                            rows={3}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                      </div>

                      <div className="space-y-4">
                        {draftSettings.homepage.promo.cards.map((card, index) => (
                          <div key={`${card.title}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-sm font-semibold text-white">Kort {index + 1}</p>
                              <button
                                type="button"
                                onClick={() => updateDraft((draft) => {
                                  draft.homepage.promo.cards.splice(index, 1);
                                })}
                                className="text-xs font-semibold text-rose-300 transition hover:text-rose-200"
                              >
                                Ta bort
                              </button>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <FieldBlock label="Eyebrow">
                                <Input
                                  value={card.eyebrow}
                                  onChange={(event) => updateDraft((draft) => {
                                    draft.homepage.promo.cards[index].eyebrow = event.target.value;
                                  })}
                                  className="border-slate-700 bg-slate-950 text-slate-50"
                                />
                              </FieldBlock>
                              <FieldBlock label="Title">
                                <Input
                                  value={card.title}
                                  onChange={(event) => updateDraft((draft) => {
                                    draft.homepage.promo.cards[index].title = event.target.value;
                                  })}
                                  className="border-slate-700 bg-slate-950 text-slate-50"
                                />
                              </FieldBlock>
                              <ImageField
                                label="Image"
                                value={card.image}
                                assets={assetLibrary}
                                uploadTarget={`home-promo-card-${index}`}
                                uploading={uploadingSiteImageTarget === `home-promo-card-${index}`}
                                onUpload={uploadSiteImage}
                                onChange={(value) => updateDraft((draft) => {
                                  draft.homepage.promo.cards[index].image = value;
                                })}
                              />
                              <FieldBlock label="Image alt">
                                <Input
                                  value={card.imageAlt}
                                  onChange={(event) => updateDraft((draft) => {
                                    draft.homepage.promo.cards[index].imageAlt = event.target.value;
                                  })}
                                  className="border-slate-700 bg-slate-950 text-slate-50"
                                />
                              </FieldBlock>
                              <FieldBlock label="Primary CTA label">
                                <Input
                                  value={card.primaryLabel}
                                  onChange={(event) => updateDraft((draft) => {
                                    draft.homepage.promo.cards[index].primaryLabel = event.target.value;
                                  })}
                                  className="border-slate-700 bg-slate-950 text-slate-50"
                                />
                              </FieldBlock>
                              <FieldBlock label="Primary CTA href">
                                <Input
                                  value={card.primaryHref}
                                  onChange={(event) => updateDraft((draft) => {
                                    draft.homepage.promo.cards[index].primaryHref = event.target.value;
                                  })}
                                  className="border-slate-700 bg-slate-950 text-slate-50"
                                />
                              </FieldBlock>
                              <FieldBlock label="Secondary CTA label">
                                <Input
                                  value={card.secondaryLabel}
                                  onChange={(event) => updateDraft((draft) => {
                                    draft.homepage.promo.cards[index].secondaryLabel = event.target.value;
                                  })}
                                  className="border-slate-700 bg-slate-950 text-slate-50"
                                />
                              </FieldBlock>
                              <FieldBlock label="Secondary CTA href">
                                <Input
                                  value={card.secondaryHref}
                                  onChange={(event) => updateDraft((draft) => {
                                    draft.homepage.promo.cards[index].secondaryHref = event.target.value;
                                  })}
                                  className="border-slate-700 bg-slate-950 text-slate-50"
                                />
                              </FieldBlock>
                            </div>

                            <FieldBlock label="Description">
                              <Textarea
                                value={card.description}
                                onChange={(event) => updateDraft((draft) => {
                                  draft.homepage.promo.cards[index].description = event.target.value;
                                })}
                                rows={3}
                                className="border-slate-700 bg-slate-950 text-slate-50"
                              />
                            </FieldBlock>

                            <FieldBlock label="Bullet points" hint="one per line">
                              <Textarea
                                value={formatSimpleLines(card.bullets)}
                                onChange={(event) => updateDraft((draft) => {
                                  draft.homepage.promo.cards[index].bullets = parseSimpleLines(event.target.value);
                                })}
                                rows={4}
                                className="border-slate-700 bg-slate-950 text-slate-50"
                              />
                            </FieldBlock>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => updateDraft((draft) => {
                            draft.homepage.promo.cards.push({
                              eyebrow: "Ny sektion",
                              title: "Nytt kort",
                              description: "Beskriv kortets innehall har.",
                              image: "",
                              imageAlt: "Nytt kort",
                              bullets: ["Fordel 1"],
                              primaryLabel: "Primar CTA",
                              primaryHref: "/products",
                              secondaryLabel: "Sekundar CTA",
                              secondaryHref: "/kundservice",
                            });
                          })}
                        >
                          Lagg till promokort
                        </Button>
                      </div>
                    </SectionCard>
                    ) : null}
                  </>
                ) : null}

                {selectedPage.group === "products" ? (
                  isActiveSection("products-banner") ? (
                  <SectionCard
                    id="products-banner"
                    title="Product banner"
                    description="Buildern styr bara bannern for den kategori som visas i previewn."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <FieldBlock label="Eyebrow">
                        <Input
                          value={selectedBanner.eyebrow}
                          onChange={(event) => updateDraft((draft) => {
                            if (!selectedPage.bannerKey) return;
                            draft.pages.products.banners[selectedPage.bannerKey].eyebrow = event.target.value;
                          })}
                          className="border-slate-700 bg-slate-900 text-slate-50"
                        />
                      </FieldBlock>
                      <FieldBlock label="Title">
                        <Input
                          value={selectedBanner.title}
                          onChange={(event) => updateDraft((draft) => {
                            if (!selectedPage.bannerKey) return;
                            draft.pages.products.banners[selectedPage.bannerKey].title = event.target.value;
                          })}
                          className="border-slate-700 bg-slate-900 text-slate-50"
                        />
                      </FieldBlock>
                    </div>

                    <FieldBlock label="Description">
                      <Textarea
                        value={selectedBanner.description}
                        onChange={(event) => updateDraft((draft) => {
                          if (!selectedPage.bannerKey) return;
                          draft.pages.products.banners[selectedPage.bannerKey].description = event.target.value;
                        })}
                        rows={3}
                        className="border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </FieldBlock>

                    <FieldBlock label="Stickers" hint="one per line">
                      <Textarea
                        value={formatSimpleLines(selectedBanner.stickers)}
                        onChange={(event) => updateDraft((draft) => {
                          if (!selectedPage.bannerKey) return;
                          draft.pages.products.banners[selectedPage.bannerKey].stickers = parseSimpleLines(event.target.value);
                        })}
                        rows={3}
                        className="border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </FieldBlock>

                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-200">Banner images</p>
                          <p className="mt-1 text-xs text-slate-500">Ladda upp eller välj varje bannerbild direkt i buildern.</p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => updateDraft((draft) => {
                            if (!selectedPage.bannerKey) return;
                            draft.pages.products.banners[selectedPage.bannerKey].images.push("");
                          })}
                        >
                          <ImagePlus className="h-4 w-4" />
                          Lägg till bild
                        </Button>
                      </div>
                      {selectedBanner.images.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {selectedBanner.images.map((image, index) => (
                            <div key={`${selectedPage.bannerKey}-image-${index}`} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-white">Bild {index + 1}</p>
                                <button
                                  type="button"
                                  onClick={() => updateDraft((draft) => {
                                    if (!selectedPage.bannerKey) return;
                                    draft.pages.products.banners[selectedPage.bannerKey].images.splice(index, 1);
                                  })}
                                  className="text-xs font-semibold text-rose-300 transition hover:text-rose-200"
                                >
                                  Ta bort
                                </button>
                              </div>
                              <ImageField
                                label="Bild"
                                value={image}
                                assets={assetLibrary}
                                uploadTarget={`products-banner-${selectedPage.bannerKey}-${index}`}
                                uploading={uploadingSiteImageTarget === `products-banner-${selectedPage.bannerKey}-${index}`}
                                onUpload={uploadSiteImage}
                                onChange={(value) => updateDraft((draft) => {
                                  if (!selectedPage.bannerKey) return;
                                  draft.pages.products.banners[selectedPage.bannerKey].images[index] = value;
                                })}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 text-sm text-slate-400">
                          Ingen bannerbild vald ännu. Lägg till minst en bild för att ge sidan en tydlig preview- och delningsyta.
                        </div>
                      )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FieldBlock label="Primary CTA label">
                        <Input
                          value={selectedBanner.primaryLabel}
                          onChange={(event) => updateDraft((draft) => {
                            if (!selectedPage.bannerKey) return;
                            draft.pages.products.banners[selectedPage.bannerKey].primaryLabel = event.target.value;
                          })}
                          className="border-slate-700 bg-slate-900 text-slate-50"
                        />
                      </FieldBlock>
                      <FieldBlock label="Primary CTA href">
                        <Input
                          value={selectedBanner.primaryHref}
                          onChange={(event) => updateDraft((draft) => {
                            if (!selectedPage.bannerKey) return;
                            draft.pages.products.banners[selectedPage.bannerKey].primaryHref = event.target.value;
                          })}
                          className="border-slate-700 bg-slate-900 text-slate-50"
                        />
                      </FieldBlock>
                      <FieldBlock label="Secondary CTA label">
                        <Input
                          value={selectedBanner.secondaryLabel}
                          onChange={(event) => updateDraft((draft) => {
                            if (!selectedPage.bannerKey) return;
                            draft.pages.products.banners[selectedPage.bannerKey].secondaryLabel = event.target.value;
                          })}
                          className="border-slate-700 bg-slate-900 text-slate-50"
                        />
                      </FieldBlock>
                      <FieldBlock label="Secondary CTA href">
                        <Input
                          value={selectedBanner.secondaryHref}
                          onChange={(event) => updateDraft((draft) => {
                            if (!selectedPage.bannerKey) return;
                            draft.pages.products.banners[selectedPage.bannerKey].secondaryHref = event.target.value;
                          })}
                          className="border-slate-700 bg-slate-900 text-slate-50"
                        />
                      </FieldBlock>
                    </div>
                  </SectionCard>
                  ) : null
                ) : null}

                {selectedPage.group === "serviceRepair" ? (
                  <>
                    {isActiveSection("service-hero") ? (
                    <SectionCard id="service-hero" title="Service hero">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FieldBlock label="Eyebrow">
                          <Input
                            value={draftSettings.pages.serviceRepair.heroEyebrow}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.serviceRepair.heroEyebrow = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Title">
                          <Input
                            value={draftSettings.pages.serviceRepair.heroTitle}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.serviceRepair.heroTitle = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Primary CTA label">
                          <Input
                            value={draftSettings.pages.serviceRepair.primaryLabel}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.serviceRepair.primaryLabel = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Primary CTA href">
                          <Input
                            value={draftSettings.pages.serviceRepair.primaryHref}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.serviceRepair.primaryHref = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Secondary CTA label">
                          <Input
                            value={draftSettings.pages.serviceRepair.secondaryLabel}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.serviceRepair.secondaryLabel = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Secondary CTA href">
                          <Input
                            value={draftSettings.pages.serviceRepair.secondaryHref}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.serviceRepair.secondaryHref = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                      </div>
                      <FieldBlock label="Description">
                        <Textarea
                          value={draftSettings.pages.serviceRepair.heroDescription}
                          onChange={(event) => updateDraft((draft) => {
                            draft.pages.serviceRepair.heroDescription = event.target.value;
                          })}
                          rows={4}
                          className="border-slate-700 bg-slate-900 text-slate-50"
                        />
                      </FieldBlock>
                    </SectionCard>
                    ) : null}
                    {isActiveSection("service-flow") ? (
                    <SectionCard id="service-flow" title="Service flow">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FieldBlock label="Flow title">
                          <Input
                            value={draftSettings.pages.serviceRepair.flowTitle}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.serviceRepair.flowTitle = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Flow description">
                          <Input
                            value={draftSettings.pages.serviceRepair.flowDescription}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.serviceRepair.flowDescription = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                      </div>
                      <FieldBlock label="Accordion steps" hint="value|title|body">
                        <Textarea
                          value={toDelimitedLines(
                            draftSettings.pages.serviceRepair.steps.map((step) => [step.value, step.title, step.body]),
                          )}
                          onChange={(event) => updateDraft((draft) => {
                            draft.pages.serviceRepair.steps = parseDelimitedLines(event.target.value, 3)
                              .filter(([value, title, body]) => value && title && body)
                              .map(([value, title, body]) => ({ value, title, body }));
                          })}
                          rows={8}
                          className="border-slate-700 bg-slate-900 text-slate-50"
                        />
                      </FieldBlock>
                    </SectionCard>
                    ) : null}

                    {isActiveSection("service-form") ? (
                    <SectionCard id="service-form" title="Form section">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FieldBlock label="Form title">
                          <Input
                            value={draftSettings.pages.serviceRepair.formTitle}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.serviceRepair.formTitle = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Form description">
                          <Textarea
                            value={draftSettings.pages.serviceRepair.formDescription}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.serviceRepair.formDescription = event.target.value;
                            })}
                            rows={3}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                      </div>
                    </SectionCard>
                    ) : null}
                  </>
                ) : null}

                {selectedPage.group === "customerService" ? (
                  <>
                    {isActiveSection("customer-hero") ? (
                    <SectionCard id="customer-hero" title="Customer service hero">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FieldBlock label="Eyebrow">
                          <Input
                            value={draftSettings.pages.customerService.heroEyebrow}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.customerService.heroEyebrow = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Title">
                          <Input
                            value={draftSettings.pages.customerService.heroTitle}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.customerService.heroTitle = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="CTA label">
                          <Input
                            value={draftSettings.pages.customerService.heroCtaLabel}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.customerService.heroCtaLabel = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="CTA href">
                          <Input
                            value={draftSettings.pages.customerService.heroCtaHref}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.customerService.heroCtaHref = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <ImageField
                          label="Hero image"
                          value={draftSettings.pages.customerService.heroImage}
                          assets={assetLibrary}
                          uploadTarget="customer-hero"
                          uploading={uploadingSiteImageTarget === "customer-hero"}
                          onUpload={uploadSiteImage}
                          onChange={(value) => updateDraft((draft) => {
                            draft.pages.customerService.heroImage = value;
                          })}
                        />
                        <FieldBlock label="Hero image alt">
                          <Input
                            value={draftSettings.pages.customerService.heroImageAlt}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.customerService.heroImageAlt = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                      </div>
                      <FieldBlock label="Description">
                        <Textarea
                          value={draftSettings.pages.customerService.heroDescription}
                          onChange={(event) => updateDraft((draft) => {
                            draft.pages.customerService.heroDescription = event.target.value;
                          })}
                          rows={4}
                          className="border-slate-700 bg-slate-900 text-slate-50"
                        />
                      </FieldBlock>
                    </SectionCard>
                    ) : null}

                    {isActiveSection("customer-contact") ? (
                    <SectionCard id="customer-contact" title="Contact blocks">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FieldBlock label="Contact title">
                          <Input
                            value={draftSettings.pages.customerService.contactTitle}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.customerService.contactTitle = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Contact email">
                          <Input
                            value={draftSettings.pages.customerService.contactEmail}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.customerService.contactEmail = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Hours title">
                          <Input
                            value={draftSettings.pages.customerService.hoursTitle}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.customerService.hoursTitle = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Support title">
                          <Input
                            value={draftSettings.pages.customerService.supportTitle}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.customerService.supportTitle = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                      </div>

                      <FieldBlock label="Hours lines" hint="one per line">
                        <Textarea
                          value={formatSimpleLines(draftSettings.pages.customerService.hoursLines)}
                          onChange={(event) => updateDraft((draft) => {
                            draft.pages.customerService.hoursLines = parseSimpleLines(event.target.value);
                          })}
                          rows={4}
                          className="border-slate-700 bg-slate-900 text-slate-50"
                        />
                      </FieldBlock>

                      <FieldBlock label="Support lines" hint="one per line">
                        <Textarea
                          value={formatSimpleLines(draftSettings.pages.customerService.supportLines)}
                          onChange={(event) => updateDraft((draft) => {
                            draft.pages.customerService.supportLines = parseSimpleLines(event.target.value);
                          })}
                          rows={4}
                          className="border-slate-700 bg-slate-900 text-slate-50"
                        />
                      </FieldBlock>
                    </SectionCard>
                    ) : null}

                    {isActiveSection("customer-issues") ? (
                    <SectionCard id="customer-issues" title="Vanliga arenden">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FieldBlock label="Section title">
                          <Input
                            value={draftSettings.pages.customerService.commonIssuesTitle}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.customerService.commonIssuesTitle = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Note">
                          <Input
                            value={draftSettings.pages.customerService.commonIssuesNote}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.customerService.commonIssuesNote = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                      </div>
                      <FieldBlock label="Issue list" hint="one per line">
                        <Textarea
                          value={formatSimpleLines(draftSettings.pages.customerService.commonIssues)}
                          onChange={(event) => updateDraft((draft) => {
                            draft.pages.customerService.commonIssues = parseSimpleLines(event.target.value);
                          })}
                          rows={6}
                          className="border-slate-700 bg-slate-900 text-slate-50"
                        />
                      </FieldBlock>
                    </SectionCard>
                    ) : null}

                    {isActiveSection("customer-workflow") ? (
                    <SectionCard id="customer-workflow" title="Arbetsflode">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FieldBlock label="Workflow title">
                          <Input
                            value={draftSettings.pages.customerService.workflowTitle}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.customerService.workflowTitle = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Workflow CTA label">
                          <Input
                            value={draftSettings.pages.customerService.workflowCtaLabel}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.customerService.workflowCtaLabel = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                        <FieldBlock label="Workflow CTA href">
                          <Input
                            value={draftSettings.pages.customerService.workflowCtaHref}
                            onChange={(event) => updateDraft((draft) => {
                              draft.pages.customerService.workflowCtaHref = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
                      </div>
                      <FieldBlock label="Workflow steps" hint="one per line">
                        <Textarea
                          value={formatSimpleLines(draftSettings.pages.customerService.workflowSteps)}
                          onChange={(event) => updateDraft((draft) => {
                            draft.pages.customerService.workflowSteps = parseSimpleLines(event.target.value);
                          })}
                          rows={6}
                          className="border-slate-700 bg-slate-900 text-slate-50"
                        />
                      </FieldBlock>
                    </SectionCard>
                    ) : null}
                  </>
                ) : null}
              </BuilderPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <CollapsibleBuilderPanel
          title="Page selector"
          eyebrow="Navigation"
          description="Choose which real route the sandbox preview and builder should target."
          collapsed={collapsedPanels.pageSelector}
          onToggle={() => togglePanel("pageSelector")}
        >
          <div className="space-y-3">
            {PREVIEW_PAGES.map((page) => (
              <button
                key={page.key}
                type="button"
                onClick={() => setSelectedPageKey(page.key)}
                className={cn(
                  "w-full rounded-2xl border px-4 py-4 text-left transition",
                  selectedPage.key === page.key
                    ? "border-cyan-400/50 bg-cyan-400/12 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.15)]"
                    : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:text-white",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{page.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{page.description}</p>
                  </div>
                  <LayoutTemplate className="mt-0.5 h-4 w-4 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </CollapsibleBuilderPanel>

        <CollapsibleBuilderPanel
          title="Section navigator"
          eyebrow="Page-scoped controls"
          description="Jump between the editable areas for the active page."
          collapsed={collapsedPanels.sections}
          onToggle={() => togglePanel("sections")}
        >
          <div className="space-y-3">
            {sectionLinks.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                className={cn(
                  "w-full rounded-2xl border px-4 py-4 text-left transition",
                  isActiveSection(section.id)
                    ? "border-cyan-400/50 bg-cyan-400/12 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.15)]"
                    : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:text-white",
                )}
              >
                <p className="text-sm font-semibold">{section.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{section.description}</p>
              </button>
            ))}
          </div>
        </CollapsibleBuilderPanel>
      </div>
    </div>
  );
}
