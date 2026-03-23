import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Eye, Globe, LayoutTemplate, RefreshCcw, Save, Send, Sparkles, Wand2 } from "lucide-react";
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

const buildPreviewUrl = (origin: string, page: PreviewPageDefinition, previewNonce: number) => {
  const url = new URL(page.path, origin || window.location.origin);
  url.searchParams.set("site-settings-mode", "draft");
  url.searchParams.set("preview_ts", String(previewNonce));
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

const BuilderPanel = ({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) => (
  <div className="overflow-hidden rounded-[32px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))]">
    <div className="border-b border-slate-800 px-6 py-5">
      <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-300/80">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
    </div>
    <div className="space-y-5 p-6">{children}</div>
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
  const [showAdvancedJson, setShowAdvancedJson] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [resettingDraft, setResettingDraft] = useState(false);
  const [resettingDefaults, setResettingDefaults] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const [previewNonce, setPreviewNonce] = useState(Date.now());

  const selectedPage = useMemo(
    () => PREVIEW_PAGES.find((page) => page.key === selectedPageKey) || PREVIEW_PAGES[0],
    [selectedPageKey],
  );

  const previewUrl = useMemo(
    () => buildPreviewUrl(previewOrigin, selectedPage, previewNonce),
    [previewNonce, previewOrigin, selectedPage],
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
    const base = [{ id: "global-chrome", label: "Global chrome" }];
    if (selectedPage.group === "home") {
      return [
        ...base,
        { id: "home-hero", label: "Hero" },
        { id: "home-categories", label: "Kategorier" },
        { id: "home-steps", label: "Kopflode" },
        { id: "home-promo", label: "Promokort" },
      ];
    }
    if (selectedPage.group === "products") {
      return [...base, { id: "products-banner", label: "Banner" }];
    }
    if (selectedPage.group === "serviceRepair") {
      return [
        ...base,
        { id: "service-hero", label: "Hero" },
        { id: "service-flow", label: "Flode" },
        { id: "service-form", label: "Formular" },
      ];
    }
    return [
      ...base,
      { id: "customer-hero", label: "Hero" },
      { id: "customer-contact", label: "Kontakt" },
      { id: "customer-issues", label: "Vanliga arenden" },
      { id: "customer-workflow", label: "Arbetsflode" },
    ];
  }, [selectedPage.group]);

  useEffect(() => {
    setJsonDraft(JSON.stringify(draftSettings, null, 2));
  }, [draftSettings]);

  const touchPreview = () => setPreviewNonce(Date.now());

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
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte hamta site settings.");
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void loadSettings();
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
        body: JSON.stringify({ mode: "draft", settings: draftSettings }),
      });
      const payload = await parseApiPayload(response);
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte spara utkastet.");
      }
      const savedDraft = normalizeSiteSettings(payload?.settings);
      setBundle((current) => ({ ...current, draft: savedDraft }));
      setDraftSettings(cloneSettings(savedDraft));
      setStatusMessage("Utkastet ar sparat. Live-sajten ar fortfarande oforandrad.");
      touchPreview();
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte spara utkastet.");
    } finally {
      setSavingDraft(false);
    }
  };

  const publishDraft = async () => {
    if (!token || !canMutate) return;
    if (!window.confirm("Publicera draft till live? Detta andrar den publika sajten.")) return;
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
      <div className="overflow-hidden rounded-[36px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.2),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.14),_transparent_24%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))]">
        <div className="flex flex-col gap-8 px-6 py-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-cyan-200">
              <Wand2 className="h-3.5 w-3.5" />
              Site Sandbox
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-white">Bygg utkast mot den riktiga sajten</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Buildern styr draften. Iframen visar den riktiga publika sidan i draftlage, och inget gar live forran du
              trycker pa <span className="font-semibold text-white">Publish changes to live server</span>.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Preview</p>
              <p className="mt-2 text-sm font-semibold text-white">{selectedPage.label}</p>
              <p className="mt-1 text-xs text-slate-400">{selectedPage.description}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Draftstatus</p>
              <p className="mt-2 text-sm font-semibold text-white">{draftIsDirty ? "Lokala osparade andringar" : "Synkad med sparad draft"}</p>
              <p className="mt-1 text-xs text-slate-400">
                {draftDiffersFromLive ? "Draft skiljer sig fran live." : "Draft matchar live just nu."}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Public site</p>
              <p className="mt-2 text-sm font-semibold text-white">{previewOrigin || "Samma origin som admin"}</p>
              <p className="mt-1 text-xs text-slate-400">Iframen laster den verkliga routen, inte en mock.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Behorighet</p>
              <p className="mt-2 text-sm font-semibold text-white">{role || "admin"}</p>
              <p className="mt-1 text-xs text-slate-400">
                {canMutate ? "Du kan spara draft och publicera." : "Readonly: preview och granskning."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)] 2xl:grid-cols-[400px,minmax(0,1fr)]">
        <div className="space-y-6">
          <BuilderPanel title="Page selector" eyebrow="Builder mode">
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
          </BuilderPanel>

          <BuilderPanel title="Actions" eyebrow="Draft controls">
            <div className="grid gap-3">
              <Button onClick={() => void loadSettings()} disabled={loadingSettings}>
                <RefreshCcw className="h-4 w-4" />
                {loadingSettings ? "Laddar..." : "Reload site settings"}
              </Button>
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
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
              <p className="font-semibold text-slate-200">Publiceringsregel</p>
              <p className="mt-2 leading-5">
                Buildern jobbar alltid mot draft. Liveversionen andras bara via publiceringsknappen ovan.
              </p>
            </div>
          </BuilderPanel>

          <BuilderPanel title="Sections" eyebrow="Jump links">
            <div className="space-y-2">
              {sectionLinks.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300 transition hover:border-slate-700 hover:text-white"
                >
                  {section.label}
                </a>
              ))}
            </div>
          </BuilderPanel>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.95fr),minmax(520px,1.05fr)]">
            <div className="space-y-6">
              <BuilderPanel title={`${selectedPage.label} builder`} eyebrow="Visual controls">
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

                {selectedPage.group === "home" ? (
                  <>
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
                        <FieldBlock label="Feature image">
                          <Input
                            value={draftSettings.homepage.hero.featureImage}
                            onChange={(event) => updateDraft((draft) => {
                              draft.homepage.hero.featureImage = event.target.value;
                            })}
                            className="border-slate-700 bg-slate-900 text-slate-50"
                          />
                        </FieldBlock>
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
                              <FieldBlock label="Image">
                                <Input
                                  value={card.image}
                                  onChange={(event) => updateDraft((draft) => {
                                    draft.homepage.promo.cards[index].image = event.target.value;
                                  })}
                                  className="border-slate-700 bg-slate-950 text-slate-50"
                                />
                              </FieldBlock>
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
                  </>
                ) : null}

                {selectedPage.group === "products" ? (
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

                    <FieldBlock label="Images" hint="one per line">
                      <Textarea
                        value={formatSimpleLines(selectedBanner.images)}
                        onChange={(event) => updateDraft((draft) => {
                          if (!selectedPage.bannerKey) return;
                          draft.pages.products.banners[selectedPage.bannerKey].images = parseSimpleLines(event.target.value);
                        })}
                        rows={4}
                        className="border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </FieldBlock>
                  </SectionCard>
                ) : null}

                {selectedPage.group === "serviceRepair" ? (
                  <>
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
                  </>
                ) : null}

                {selectedPage.group === "customerService" ? (
                  <>
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
                  </>
                ) : null}
              </BuilderPanel>

              <BuilderPanel title="Advanced JSON" eyebrow="Fallback mode">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Raw settings editor</p>
                    <p className="mt-1 text-xs text-slate-400">
                      For bulkedits eller kopieringar. Buildern ovan ar fortfarande primarvyn.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedJson((current) => !current)}
                    className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                  >
                    {showAdvancedJson ? "Dolj JSON" : "Visa JSON"}
                  </button>
                </div>

                {showAdvancedJson ? (
                  <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <Textarea
                      value={jsonDraft}
                      onChange={(event) => setJsonDraft(event.target.value)}
                      rows={26}
                      className="font-mono text-xs border-slate-700 bg-slate-950 text-slate-50"
                    />
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" onClick={formatJsonDraft}>
                        Format JSON
                      </Button>
                      <Button variant="secondary" onClick={applyJsonDraft}>
                        Apply to builder
                      </Button>
                    </div>
                  </div>
                ) : null}
              </BuilderPanel>
            </div>

            <BuilderPanel title="Live preview" eyebrow="Exact public render">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedPage.label}</p>
                    <p className="text-xs text-slate-400">{selectedPage.path}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={touchPreview}>
                    <RefreshCcw className="h-4 w-4" />
                    Reload preview
                  </Button>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                  >
                    <Globe className="h-4 w-4" />
                    Open preview in new tab
                  </a>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-3">
                <div className="mb-3 flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-3 truncate font-mono text-[11px] text-slate-300">{previewUrl}</span>
                </div>
                <div className="overflow-hidden rounded-[24px] border border-slate-800 bg-white">
                  <iframe
                    key={previewUrl}
                    title={`Preview ${selectedPage.label}`}
                    src={previewUrl}
                    className="h-[940px] w-full bg-white"
                  />
                </div>
              </div>
            </BuilderPanel>
          </div>
        </div>
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
    </div>
  );
}
