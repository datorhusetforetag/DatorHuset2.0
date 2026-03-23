import { useEffect, useState } from "react";
import {
  Code2,
  Copy,
  Eye,
  LayoutTemplate,
  MenuSquare,
  Paintbrush,
  RefreshCcw,
  RotateCcw,
  Rows3,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import {
  DEFAULT_SITE_SETTINGS,
  SITE_ICON_OPTIONS,
  normalizeSiteSettings,
  type SiteIconKey,
  type SiteSettings,
  type SiteSocialPlatform,
} from "@/lib/siteSettings";
import { SiteIcon } from "@/components/SiteIcon";
import { AdminAccessContext } from "../useAdminAccess";

const prettyJson = (value: unknown) => JSON.stringify(value, null, 2);

type SandboxMode = "draft" | "live";
type CanvasTab = "builder" | "json";
type BuilderSection = "mood" | "navigation" | "hero" | "journey" | "campaigns" | "footer";
type SiteSettingsBundle = {
  draft: SiteSettings;
  live: SiteSettings;
};

const defaultBundle: SiteSettingsBundle = {
  draft: DEFAULT_SITE_SETTINGS,
  live: DEFAULT_SITE_SETTINGS,
};

const SECTION_ITEMS: Array<{
  id: BuilderSection;
  title: string;
  description: string;
  icon: typeof Paintbrush;
}> = [
  { id: "mood", title: "Mood Board", description: "Theme, strip and preset direction.", icon: Paintbrush },
  { id: "navigation", title: "Navigation", description: "Brand, search and top links.", icon: MenuSquare },
  { id: "hero", title: "Hero Stage", description: "Headline, CTAs and category cards.", icon: LayoutTemplate },
  { id: "journey", title: "Journey", description: "Trust metrics and buying steps.", icon: ShieldCheck },
  { id: "campaigns", title: "Campaigns", description: "Showcase, promo cards and final CTA.", icon: Sparkles },
  { id: "footer", title: "Footer", description: "Support copy and social cluster.", icon: Rows3 },
];

const PRESET_LIBRARY = [
  {
    id: "gaming-launch",
    title: "Gaming Launch",
    description: "Brighter strip, louder hero and higher-energy CTAs.",
  },
  {
    id: "service-week",
    title: "Service Week",
    description: "Support-led messaging around service and repairs.",
  },
  {
    id: "business-clean",
    title: "Business Clean",
    description: "A calmer front page for teams and office buyers.",
  },
];

const fieldClass =
  "w-full rounded-2xl border border-white/10 bg-[#0a101a] px-4 py-3 text-sm text-white outline-none transition focus:border-[#11667b] focus:ring-2 focus:ring-[#11667b]/25";
const panelClass =
  "rounded-[1.75rem] border border-white/10 bg-[#0c1320]/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.24)]";

const toLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const serializeMenuItems = (settings: SiteSettings) =>
  settings.site.navigation.menuItems.map((item) => `${item.label}|${item.href}`).join("\n");

const parseMenuItems = (value: string) => {
  const next = toLines(value)
    .map((line) => {
      const [label, href] = line.split("|");
      return { label: (label || "Ny lank").trim(), href: (href || "/products").trim() };
    })
    .slice(0, 8);
  return next.length > 0 ? next : DEFAULT_SITE_SETTINGS.site.navigation.menuItems;
};

const serializeHeroCategories = (settings: SiteSettings) =>
  settings.homepage.hero.categories.map((item) => `${item.name}|${item.icon}|${item.href}`).join("\n");

const parseHeroCategories = (value: string) => {
  const next = toLines(value)
    .map((line) => {
      const [name, icon, href] = line.split("|");
      return {
        name: (name || "Ny kategori").trim(),
        icon: (SITE_ICON_OPTIONS.includes((icon || "").trim() as SiteIconKey)
          ? (icon || "").trim()
          : "monitor") as SiteIconKey,
        href: (href || "/products").trim(),
      };
    })
    .slice(0, 8);
  return next.length > 0 ? next : DEFAULT_SITE_SETTINGS.homepage.hero.categories;
};

const serializeTrustMetrics = (settings: SiteSettings) =>
  settings.homepage.trustBar.items.map((item) => `${item.value}|${item.label}|${item.icon}`).join("\n");

const parseTrustMetrics = (value: string) => {
  const next = toLines(value)
    .map((line) => {
      const [metricValue, label, icon] = line.split("|");
      return {
        value: (metricValue || "24h").trim(),
        label: (label || "Ny trygghetssignal").trim(),
        icon: (SITE_ICON_OPTIONS.includes((icon || "").trim() as SiteIconKey)
          ? (icon || "").trim()
          : "shield") as SiteIconKey,
      };
    })
    .slice(0, 5);
  return next.length >= 2 ? next : DEFAULT_SITE_SETTINGS.homepage.trustBar.items;
};

const serializeSteps = (settings: SiteSettings) =>
  settings.homepage.steps.items.map((item) => `${item.title}|${item.description}|${item.icon}`).join("\n");

const parseSteps = (value: string) => {
  const next = toLines(value)
    .map((line) => {
      const [title, description, icon] = line.split("|");
      return {
        title: (title || "Nytt steg").trim(),
        description: (description || "Beskriv det har steget.").trim(),
        icon: (SITE_ICON_OPTIONS.includes((icon || "").trim() as SiteIconKey)
          ? (icon || "").trim()
          : "monitor") as SiteIconKey,
      };
    })
    .slice(0, 5);
  return next.length >= 3 ? next : DEFAULT_SITE_SETTINGS.homepage.steps.items;
};

const serializeShowcaseCards = (settings: SiteSettings) =>
  settings.homepage.showcase.cards
    .map((item) => `${item.icon}|${item.title}|${item.description}|${item.linkLabel}|${item.href}`)
    .join("\n");

const parseShowcaseCards = (value: string) => {
  const next = toLines(value)
    .map((line) => {
      const [icon, title, description, linkLabel, href] = line.split("|");
      return {
        icon: (SITE_ICON_OPTIONS.includes((icon || "").trim() as SiteIconKey)
          ? (icon || "").trim()
          : "sparkles") as SiteIconKey,
        title: (title || "Nytt block").trim(),
        description: (description || "Beskriv blocket.").trim(),
        linkLabel: (linkLabel || "Las mer").trim(),
        href: (href || "/products").trim(),
      };
    })
    .slice(0, 6);
  return next.length >= 2 ? next : DEFAULT_SITE_SETTINGS.homepage.showcase.cards;
};

const serializePromoCards = (settings: SiteSettings) =>
  settings.homepage.promo.cards.map((item) => `${item.title}|${item.description}|${item.image}`).join("\n");

const parsePromoCards = (value: string, settings: SiteSettings) => {
  const next = toLines(value)
    .map((line, index) => {
      const [title, description, image] = line.split("|");
      const fallback = settings.homepage.promo.cards[index] || DEFAULT_SITE_SETTINGS.homepage.promo.cards[0];
      return {
        ...fallback,
        title: (title || fallback.title).trim(),
        description: (description || fallback.description).trim(),
        image: (image || fallback.image).trim(),
      };
    })
    .slice(0, 3);
  return next.length >= 2 ? next : settings.homepage.promo.cards;
};

const serializeSocialLinks = (settings: SiteSettings) =>
  settings.site.footer.socialLinks.map((item) => `${item.platform}|${item.label}|${item.href}`).join("\n");

const parseSocialLinks = (value: string) => {
  const next = toLines(value)
    .map((line) => {
      const [platform, label, href] = line.split("|");
      const normalizedPlatform = ((platform || "").trim() || "instagram") as SiteSocialPlatform;
      return {
        platform: (["instagram", "x", "tiktok", "youtube"].includes(normalizedPlatform)
          ? normalizedPlatform
          : "instagram") as SiteSocialPlatform,
        label: (label || "Instagram").trim(),
        href: (href || "https://instagram.com").trim(),
      };
    })
    .slice(0, 6);
  return next.length > 0 ? next : DEFAULT_SITE_SETTINGS.site.footer.socialLinks;
};

const FieldBlock = ({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <label className="space-y-2">
    <div className="space-y-1">
      <p className="text-sm font-semibold text-white">{label}</p>
      {description ? <p className="text-xs text-slate-400">{description}</p> : null}
    </div>
    {children}
  </label>
);

const ToggleCard = ({
  title,
  description,
  checked,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${checked ? "bg-[#11667b]" : "bg-slate-700"}`}
    >
      <span className={`inline-block h-6 w-6 rounded-full bg-white transition ${checked ? "translate-x-7" : "translate-x-1"}`} />
    </button>
  </div>
);

export default function AdminSiteSandbox() {
  const { isAdmin, loading, error, token, apiBase, role, signInWithGoogle } =
    useOutletContext<AdminAccessContext>();
  const [selectedMode, setSelectedMode] = useState<SandboxMode>("draft");
  const [selectedSection, setSelectedSection] = useState<BuilderSection>("mood");
  const [canvasTab, setCanvasTab] = useState<CanvasTab>("builder");
  const [editorValues, setEditorValues] = useState<Record<SandboxMode, string>>({
    draft: prettyJson(DEFAULT_SITE_SETTINGS),
    live: prettyJson(DEFAULT_SITE_SETTINGS),
  });
  const [bundle, setBundle] = useState<SiteSettingsBundle>(defaultBundle);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [localError, setLocalError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const canMutate = role === "admin" || role === "ops" || role === "";
  const currentSettings = bundle[selectedMode];

  const setModeSettings = (mode: SandboxMode, nextSettings: SiteSettings) => {
    const normalized = normalizeSiteSettings(nextSettings);
    setBundle((current) => ({ ...current, [mode]: normalized }));
    setEditorValues((current) => ({ ...current, [mode]: prettyJson(normalized) }));
  };

  const updateModeSettings = (mode: SandboxMode, updater: (settings: SiteSettings) => void) => {
    const next = structuredClone(bundle[mode]);
    updater(next);
    setModeSettings(mode, next);
  };

  const syncBundleIntoEditors = (nextBundle: SiteSettingsBundle) => {
    setBundle(nextBundle);
    setEditorValues({
      draft: prettyJson(nextBundle.draft),
      live: prettyJson(nextBundle.live),
    });
  };

  const loadSettings = async () => {
    if (!token || !isAdmin) return;
    setLoadingSettings(true);
    setLocalError("");
    setSaveMessage("");
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/site-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte hamta site settings.");
      }
      syncBundleIntoEditors({
        draft: normalizeSiteSettings(payload?.settings?.draft),
        live: normalizeSiteSettings(payload?.settings?.live),
      });
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
  }, [isAdmin, token, apiBase]);

  const parseCurrentEditor = () => normalizeSiteSettings(JSON.parse(editorValues[selectedMode]));

  const handleFormat = () => {
    setLocalError("");
    try {
      setEditorValues((current) => ({ ...current, [selectedMode]: prettyJson(JSON.parse(current[selectedMode])) }));
    } catch {
      setLocalError("JSON ar inte giltig. Ratta formatet innan du fortsatter.");
    }
  };

  const handleApplyJson = () => {
    setLocalError("");
    try {
      setModeSettings(selectedMode, parseCurrentEditor());
      setSaveMessage("JSON synkades till buildern.");
    } catch {
      setLocalError("JSON ar inte giltig. Buildern kunde inte uppdateras.");
    }
  };

  const handleSave = async () => {
    if (!token || !isAdmin || !canMutate) return;
    setSaving(true);
    setLocalError("");
    setSaveMessage("");

    let parsedSettings;
    try {
      parsedSettings = parseCurrentEditor();
      setModeSettings(selectedMode, parsedSettings);
    } catch {
      setSaving(false);
      setLocalError("JSON ar inte giltig. Spara stoppades.");
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/admin/v2/site-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode: selectedMode, settings: parsedSettings }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const details = payload?.error?.details;
        const detailText =
          details && typeof details === "object"
            ? prettyJson(details)
            : payload?.error?.message || payload?.error || "Kunde inte spara site settings.";
        throw new Error(detailText);
      }
      setModeSettings(selectedMode, normalizeSiteSettings(payload?.settings));
      setSaveMessage(
        selectedMode === "draft"
          ? "Utkastet sparades. Fortsatt jobba i buildern eller publicera nar du ar nojd."
          : "Live-laget sparades direkt pa huvudsidan."
      );
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte spara site settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!token || !isAdmin || !canMutate) return;
    setResetting(true);
    setLocalError("");
    setSaveMessage("");
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/site-settings/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode: selectedMode }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte aterstalla site settings.");
      }
      setModeSettings(selectedMode, normalizeSiteSettings(payload?.settings));
      setSaveMessage(`${selectedMode === "draft" ? "Utkast" : "Live"} aterstalldes till standardinnehall.`);
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte aterstalla site settings.");
    } finally {
      setResetting(false);
    }
  };

  const handleCloneLiveToDraft = async () => {
    if (!token || !isAdmin || !canMutate) return;
    setCloning(true);
    setLocalError("");
    setSaveMessage("");
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/site-settings/clone-live-to-draft`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte kopiera live till utkast.");
      }
      syncBundleIntoEditors({
        draft: normalizeSiteSettings(payload?.settings?.draft),
        live: normalizeSiteSettings(payload?.settings?.live),
      });
      setSelectedMode("draft");
      setSaveMessage("Live-innehall kopierades till draft. Buildern ar redo for nya ideer.");
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte kopiera live till utkast.");
    } finally {
      setCloning(false);
    }
  };

  const handlePublish = async () => {
    if (!token || !isAdmin || !canMutate) return;
    setPublishing(true);
    setLocalError("");
    setSaveMessage("");
    try {
      const response = await fetch(`${apiBase}/api/admin/v2/site-settings/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Kunde inte publicera utkastet.");
      }
      syncBundleIntoEditors({
        draft: normalizeSiteSettings(payload?.settings?.draft),
        live: normalizeSiteSettings(payload?.settings?.live),
      });
      setSelectedMode("live");
      setSaveMessage("Draft publicerades live pa huvudsidan.");
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte publicera utkastet.");
    } finally {
      setPublishing(false);
    }
  };

  const applyPreset = (presetId: string) => {
    updateModeSettings(selectedMode, (settings) => {
      if (presetId === "gaming-launch") {
        settings.site.announcement.theme = "yellow";
        settings.site.announcement.label = "Ny drop";
        settings.site.announcement.text = "Lansera nya gamingbyggen med starkare CTA-tryck och en mer energisk forstasida.";
        settings.homepage.hero.primary.eyebrow = "Gaming launch";
        settings.homepage.hero.primary.title = "Bygg en setup som faktiskt sticker ut";
        settings.homepage.hero.primary.primaryLabel = "Shoppa gaming";
        settings.homepage.hero.primary.primaryHref = "/products?category=toptier&clear_filters=1";
      }
      if (presetId === "service-week") {
        settings.site.announcement.theme = "teal";
        settings.site.announcement.label = "Servicefokus";
        settings.site.announcement.text = "Pusha felsokning, rengoring och uppgraderingar med ett supportlett uttryck.";
        settings.homepage.hero.primary.eyebrow = "Service week";
        settings.homepage.hero.primary.title = "Ge gamla datorer ett nytt liv";
        settings.homepage.hero.primary.primaryLabel = "Boka service";
        settings.homepage.hero.primary.primaryHref = "/service-reparation";
      }
      if (presetId === "business-clean") {
        settings.site.announcement.theme = "dark";
        settings.site.navigation.brandName = "DatorHuset Pro";
        settings.homepage.hero.primary.eyebrow = "Foretagspaket";
        settings.homepage.hero.primary.title = "Fardiga datorfloden for team, skolor och kontor";
        settings.homepage.trustBar.title = "Tryggt upplagg for team och inkop";
      }
    });
    setSelectedSection("mood");
    setCanvasTab("builder");
    const preset = PRESET_LIBRARY.find((item) => item.id === presetId);
    setSaveMessage(`${preset?.title || "Preset"} applicerades pa ${selectedMode}.`);
  };

  const summaryRows = [
    { label: "Announcement", value: currentSettings.site.announcement.enabled ? "On" : "Off" },
    { label: "Menu links", value: String(currentSettings.site.navigation.menuItems.length) },
    { label: "Hero cards", value: String(currentSettings.homepage.hero.categories.length) },
    { label: "Trust nodes", value: String(currentSettings.homepage.trustBar.items.length) },
    { label: "Showcase cards", value: String(currentSettings.homepage.showcase.cards.length) },
    { label: "Social nodes", value: String(currentSettings.site.footer.socialLinks.length) },
  ];

  const renderPreview = () => (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#050911] shadow-[0_28px_90px_rgba(0,0,0,0.3)]">
      <div
        className={`px-5 py-3 text-xs font-semibold uppercase tracking-[0.28em] ${
          currentSettings.site.announcement.theme === "yellow"
            ? "bg-yellow-300 text-gray-900"
            : currentSettings.site.announcement.theme === "teal"
              ? "bg-[#11667b] text-white"
              : "bg-[#101927] text-white"
        }`}
      >
        {currentSettings.site.announcement.enabled
          ? `${currentSettings.site.announcement.label} • ${currentSettings.site.announcement.text}`
          : "Announcement off"}
      </div>
      <div className="border-b border-white/10 bg-[#0c1421] px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
          {selectedMode === "draft" ? "Draft preview" : "Live preview"}
        </p>
        <h3 className="mt-2 text-lg font-semibold text-white">{currentSettings.site.navigation.brandName}</h3>
      </div>
      <div className="space-y-4 bg-[radial-gradient(circle_at_top_left,_rgba(255,212,59,0.16),_transparent_35%),linear-gradient(180deg,#101826_0%,#0a0f17_100%)] p-5">
        <div className="rounded-[1.75rem] border border-yellow-400/20 bg-yellow-300/90 p-5 text-gray-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gray-700">{currentSettings.homepage.hero.primary.eyebrow}</p>
          <h4 className="mt-3 text-2xl font-black leading-tight">{currentSettings.homepage.hero.primary.title}</h4>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-gray-900 px-3 py-2 text-white">{currentSettings.homepage.hero.primary.primaryLabel}</span>
            <span className="rounded-full border border-gray-900/25 px-3 py-2">{currentSettings.homepage.hero.primary.secondaryLabel}</span>
          </div>
        </div>

        {currentSettings.homepage.trustBar.enabled ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {currentSettings.homepage.trustBar.items.slice(0, 3).map((item) => (
              <div key={`${item.value}-${item.label}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <SiteIcon icon={item.icon} className="h-5 w-5 text-yellow-300" />
                <p className="mt-3 text-lg font-semibold text-white">{item.value}</p>
                <p className="mt-1 text-xs text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        ) : null}

        {currentSettings.homepage.showcase.enabled ? (
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0f1824] p-5">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#9dd4e0]">{currentSettings.homepage.showcase.eyebrow}</p>
            <h4 className="mt-3 text-xl font-bold text-white">{currentSettings.homepage.showcase.title}</h4>
            <div className="mt-4 grid gap-3">
              {currentSettings.homepage.showcase.cards.slice(0, 3).map((card) => (
                <div key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#11667b]/20 text-[#9dd4e0]">
                      <SiteIcon icon={card.icon} className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{card.title}</p>
                      <p className="text-xs text-slate-400">{card.linkLabel}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-[1.75rem] border border-white/10 bg-[#0c1421] p-5">
          <p className="text-sm font-semibold text-white">{currentSettings.site.footer.supportTitle}</p>
          <p className="mt-1 text-xs text-slate-400">{currentSettings.site.footer.supportEmail}</p>
        </div>
      </div>
    </div>
  );

  const renderBuilder = () => {
    if (selectedSection === "mood") {
      return (
        <div className="space-y-5">
          <div className={panelClass}>
            <p className="text-xs uppercase tracking-[0.3em] text-[#9dd4e0]">Creative presets</p>
            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              {PRESET_LIBRARY.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-left transition hover:border-[#11667b] hover:bg-[#11667b]/10"
                >
                  <p className="text-sm font-semibold text-white">{preset.title}</p>
                  <p className="mt-2 text-sm text-slate-400">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className={panelClass}>
            <div className="grid gap-4 xl:grid-cols-2">
              <ToggleCard
                title="Announcement strip"
                description="Turn the top campaign strip on or off."
                checked={currentSettings.site.announcement.enabled}
                onToggle={(checked) => updateModeSettings(selectedMode, (settings) => { settings.site.announcement.enabled = checked; })}
              />
              <FieldBlock label="Announcement theme">
                <select
                  value={currentSettings.site.announcement.theme}
                  onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.site.announcement.theme = event.target.value as SiteSettings["site"]["announcement"]["theme"]; })}
                  className={fieldClass}
                >
                  <option value="dark">dark</option>
                  <option value="yellow">yellow</option>
                  <option value="teal">teal</option>
                </select>
              </FieldBlock>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <FieldBlock label="Campaign label">
                <input value={currentSettings.site.announcement.label} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.site.announcement.label = event.target.value; })} className={fieldClass} />
              </FieldBlock>
              <FieldBlock label="Link label">
                <input value={currentSettings.site.announcement.linkLabel} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.site.announcement.linkLabel = event.target.value; })} className={fieldClass} />
              </FieldBlock>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <FieldBlock label="Announcement text">
                <textarea value={currentSettings.site.announcement.text} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.site.announcement.text = event.target.value; })} className={`${fieldClass} min-h-[120px] resize-none`} />
              </FieldBlock>
              <FieldBlock label="Announcement href">
                <input value={currentSettings.site.announcement.href} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.site.announcement.href = event.target.value; })} className={fieldClass} />
              </FieldBlock>
            </div>
          </div>
        </div>
      );
    }

    if (selectedSection === "navigation") {
      return (
        <div className={panelClass}>
          <div className="grid gap-4 xl:grid-cols-2">
            <FieldBlock label="Brand name">
              <input value={currentSettings.site.navigation.brandName} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.site.navigation.brandName = event.target.value; })} className={fieldClass} />
            </FieldBlock>
            <FieldBlock label="Search placeholder">
              <input value={currentSettings.site.navigation.searchPlaceholder} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.site.navigation.searchPlaceholder = event.target.value; })} className={fieldClass} />
            </FieldBlock>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <FieldBlock label="Menu label">
              <input value={currentSettings.site.navigation.menuLabel} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.site.navigation.menuLabel = event.target.value; })} className={fieldClass} />
            </FieldBlock>
            <FieldBlock label="Admin portal href">
              <input value={currentSettings.site.navigation.adminPortalHref} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.site.navigation.adminPortalHref = event.target.value; })} className={fieldClass} />
            </FieldBlock>
          </div>
          <div className="mt-5">
            <FieldBlock label="Menu items" description="One row per item: label|href">
              <textarea value={serializeMenuItems(currentSettings)} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.site.navigation.menuItems = parseMenuItems(event.target.value); })} className={`${fieldClass} min-h-[220px] resize-none`} />
            </FieldBlock>
          </div>
        </div>
      );
    }

    if (selectedSection === "hero") {
      return (
        <div className={panelClass}>
          <ToggleCard
            title="Hero section"
            description="Show or hide the main hero stage."
            checked={currentSettings.homepage.hero.enabled}
            onToggle={(checked) => updateModeSettings(selectedMode, (settings) => { settings.homepage.hero.enabled = checked; })}
          />
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <FieldBlock label="Eyebrow">
              <input value={currentSettings.homepage.hero.primary.eyebrow} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.hero.primary.eyebrow = event.target.value; })} className={fieldClass} />
            </FieldBlock>
            <FieldBlock label="Subtitle">
              <input value={currentSettings.homepage.hero.primary.subtitle} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.hero.primary.subtitle = event.target.value; })} className={fieldClass} />
            </FieldBlock>
          </div>
          <div className="mt-5">
            <FieldBlock label="Main title">
              <textarea value={currentSettings.homepage.hero.primary.title} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.hero.primary.title = event.target.value; })} className={`${fieldClass} min-h-[110px] resize-none`} />
            </FieldBlock>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <FieldBlock label="Primary CTA">
              <input value={currentSettings.homepage.hero.primary.primaryLabel} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.hero.primary.primaryLabel = event.target.value; })} className={fieldClass} />
            </FieldBlock>
            <FieldBlock label="Primary href">
              <input value={currentSettings.homepage.hero.primary.primaryHref} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.hero.primary.primaryHref = event.target.value; })} className={fieldClass} />
            </FieldBlock>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <FieldBlock label="Secondary CTA">
              <input value={currentSettings.homepage.hero.primary.secondaryLabel} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.hero.primary.secondaryLabel = event.target.value; })} className={fieldClass} />
            </FieldBlock>
            <FieldBlock label="Featured count">
              <input type="number" min={0} max={10} value={currentSettings.homepage.hero.featuredCount} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.hero.featuredCount = Number(event.target.value || 0); })} className={fieldClass} />
            </FieldBlock>
          </div>
          <div className="mt-5">
            <FieldBlock label="Category cards" description="One row per card: name|icon|href">
              <textarea value={serializeHeroCategories(currentSettings)} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.hero.categories = parseHeroCategories(event.target.value); })} className={`${fieldClass} min-h-[220px] resize-none`} />
            </FieldBlock>
          </div>
        </div>
      );
    }

    if (selectedSection === "journey") {
      return (
        <div className={panelClass}>
          <div className="grid gap-4 xl:grid-cols-2">
            <FieldBlock label="Trust title">
              <input value={currentSettings.homepage.trustBar.title} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.trustBar.title = event.target.value; })} className={fieldClass} />
            </FieldBlock>
            <ToggleCard
              title="Trust bar"
              description="Toggle the credibility strip."
              checked={currentSettings.homepage.trustBar.enabled}
              onToggle={(checked) => updateModeSettings(selectedMode, (settings) => { settings.homepage.trustBar.enabled = checked; })}
            />
          </div>
          <div className="mt-5">
            <FieldBlock label="Trust metrics" description="One row per metric: value|label|icon">
              <textarea value={serializeTrustMetrics(currentSettings)} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.trustBar.items = parseTrustMetrics(event.target.value); })} className={`${fieldClass} min-h-[180px] resize-none`} />
            </FieldBlock>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <FieldBlock label="Steps title">
              <textarea value={currentSettings.homepage.steps.title} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.steps.title = event.target.value; })} className={`${fieldClass} min-h-[110px] resize-none`} />
            </FieldBlock>
            <FieldBlock label="Steps description">
              <textarea value={currentSettings.homepage.steps.description} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.steps.description = event.target.value; })} className={`${fieldClass} min-h-[110px] resize-none`} />
            </FieldBlock>
          </div>
          <div className="mt-5">
            <FieldBlock label="Buying steps" description="One row per step: title|description|icon">
              <textarea value={serializeSteps(currentSettings)} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.steps.items = parseSteps(event.target.value); })} className={`${fieldClass} min-h-[220px] resize-none`} />
            </FieldBlock>
          </div>
        </div>
      );
    }

    if (selectedSection === "campaigns") {
      return (
        <div className={panelClass}>
          <div className="grid gap-4 xl:grid-cols-2">
            <FieldBlock label="Showcase title">
              <textarea value={currentSettings.homepage.showcase.title} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.showcase.title = event.target.value; })} className={`${fieldClass} min-h-[110px] resize-none`} />
            </FieldBlock>
            <FieldBlock label="Showcase description">
              <textarea value={currentSettings.homepage.showcase.description} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.showcase.description = event.target.value; })} className={`${fieldClass} min-h-[110px] resize-none`} />
            </FieldBlock>
          </div>
          <div className="mt-5">
            <FieldBlock label="Showcase cards" description="One row per card: icon|title|description|linkLabel|href">
              <textarea value={serializeShowcaseCards(currentSettings)} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.showcase.cards = parseShowcaseCards(event.target.value); })} className={`${fieldClass} min-h-[220px] resize-none`} />
            </FieldBlock>
          </div>
          <div className="mt-5">
            <FieldBlock label="Promo cards" description="One row per card: title|description|image">
              <textarea value={serializePromoCards(currentSettings)} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.promo.cards = parsePromoCards(event.target.value, settings); })} className={`${fieldClass} min-h-[180px] resize-none`} />
            </FieldBlock>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <FieldBlock label="CTA badge">
              <input value={currentSettings.homepage.ctaBand.badge} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.ctaBand.badge = event.target.value; })} className={fieldClass} />
            </FieldBlock>
            <FieldBlock label="CTA title">
              <input value={currentSettings.homepage.ctaBand.title} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.homepage.ctaBand.title = event.target.value; })} className={fieldClass} />
            </FieldBlock>
          </div>
        </div>
      );
    }

    return (
      <div className={panelClass}>
        <FieldBlock label="Footer brand text">
          <textarea value={currentSettings.site.footer.brandText} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.site.footer.brandText = event.target.value; })} className={`${fieldClass} min-h-[110px] resize-none`} />
        </FieldBlock>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <FieldBlock label="Support title">
            <input value={currentSettings.site.footer.supportTitle} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.site.footer.supportTitle = event.target.value; })} className={fieldClass} />
          </FieldBlock>
          <FieldBlock label="Support email">
            <input value={currentSettings.site.footer.supportEmail} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.site.footer.supportEmail = event.target.value; })} className={fieldClass} />
          </FieldBlock>
        </div>
        <div className="mt-5">
          <FieldBlock label="Social links" description="One row per item: platform|label|href">
            <textarea value={serializeSocialLinks(currentSettings)} onChange={(event) => updateModeSettings(selectedMode, (settings) => { settings.site.footer.socialLinks = parseSocialLinks(event.target.value); })} className={`${fieldClass} min-h-[180px] resize-none`} />
          </FieldBlock>
        </div>
      </div>
    );
  };

  if (!token) {
    return (
      <div className="rounded-[2rem] border border-slate-800 bg-[#0c1320]/90 p-8 text-center">
        <h2 className="text-xl font-semibold">Logga in for att fortsatta</h2>
        <p className="mt-2 text-sm text-slate-400">Du maste vara inloggad med ditt admin-konto.</p>
        <button type="button" onClick={signInWithGoogle} className="mt-4 inline-flex items-center justify-center rounded-full bg-yellow-400 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white">
          Logga in med Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,212,59,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(17,102,123,0.28),_transparent_34%),linear-gradient(135deg,#09111d_0%,#101c2c_55%,#0d1624_100%)] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#11667b]/25 blur-3xl" />
        <div className="absolute left-10 top-10 h-28 w-28 rounded-full bg-yellow-400/15 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#9dd4e0]">Creative Control Room</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
              Make the admin sandbox feel like a site builder, not a config file.
            </h2>
            <p className="mt-4 max-w-2xl text-base text-slate-300">
              Pick a section, try a preset, shape the copy, and watch the mini site canvas update before you publish.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {(["draft", "live"] as SandboxMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSelectedMode(mode)}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                    selectedMode === mode
                      ? "bg-white text-[#09111d]"
                      : "border border-white/10 bg-white/5 text-white hover:border-[#11667b]"
                  }`}
                >
                  {mode === "draft" ? "Draft sandbox" : "Live site"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-2">
            {summaryRows.map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={loadSettings} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0c1320]/90 px-4 py-2 text-sm font-semibold text-white hover:border-[#11667b]">
          <RefreshCcw className="h-4 w-4" />
          Ladda om
        </button>
        <button type="button" onClick={handleCloneLiveToDraft} disabled={!canMutate || cloning} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0c1320]/90 px-4 py-2 text-sm font-semibold text-white hover:border-[#11667b] disabled:opacity-50">
          <Copy className="h-4 w-4" />
          {cloning ? "Kopierar..." : "Live -> Draft"}
        </button>
        <button type="button" onClick={handleReset} disabled={!canMutate || resetting} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0c1320]/90 px-4 py-2 text-sm font-semibold text-white hover:border-[#11667b] disabled:opacity-50">
          <RotateCcw className="h-4 w-4" />
          {resetting ? "Aterstaller..." : `Standard ${selectedMode}`}
        </button>
        <button type="button" onClick={handleSave} disabled={!canMutate || saving} className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white disabled:opacity-50">
          <Save className="h-4 w-4" />
          {saving ? "Sparar..." : `Spara ${selectedMode}`}
        </button>
        <button type="button" onClick={handlePublish} disabled={!canMutate || publishing} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50">
          <Send className="h-4 w-4" />
          {publishing ? "Publicerar..." : "Publicera draft"}
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Verifierar atkomst...</p>}
      {!loading && error && <p className="text-sm text-red-400">{error}</p>}
      {loadingSettings && <p className="text-sm text-slate-400">Laddar site settings...</p>}
      {localError ? <pre className="whitespace-pre-wrap rounded-[1.5rem] border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{localError}</pre> : null}
      {saveMessage ? <div className="rounded-[1.5rem] border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{saveMessage}</div> : null}

      <div className="grid gap-6 2xl:grid-cols-[280px_minmax(0,1fr)_420px]">
        <aside className="space-y-3">
          {SECTION_ITEMS.map((section) => {
            const Icon = section.icon;
            const selected = selectedSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setCanvasTab("builder");
                  setSelectedSection(section.id);
                }}
                className={`w-full rounded-[1.6rem] border p-4 text-left transition ${
                  selected ? "border-[#11667b] bg-[#11667b]/12" : "border-white/10 bg-[#0c1320]/90 hover:border-[#11667b]/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{section.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{section.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        <section className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setCanvasTab("builder")} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${canvasTab === "builder" ? "bg-white text-[#09111d]" : "border border-white/10 bg-[#0c1320]/90 text-white hover:border-[#11667b]"}`}>
              <Wand2 className="h-4 w-4" />
              Builder
            </button>
            <button type="button" onClick={() => setCanvasTab("json")} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${canvasTab === "json" ? "bg-white text-[#09111d]" : "border border-white/10 bg-[#0c1320]/90 text-white hover:border-[#11667b]"}`}>
              <Code2 className="h-4 w-4" />
              Advanced JSON
            </button>
          </div>

          {canvasTab === "builder" ? (
            renderBuilder()
          ) : (
            <div className={panelClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Advanced mode</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Raw JSON is still here when you need full control</h3>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleFormat} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-[#11667b]">Format</button>
                  <button type="button" onClick={handleApplyJson} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-[#11667b]">Apply</button>
                </div>
              </div>
              <textarea value={editorValues[selectedMode]} onChange={(event) => setEditorValues((current) => ({ ...current, [selectedMode]: event.target.value }))} spellCheck={false} className="mt-5 min-h-[860px] w-full rounded-[1.5rem] border border-white/10 bg-[#050911] p-5 font-mono text-sm text-slate-100 outline-none focus:border-[#11667b]" />
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className={panelClass}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#9dd4e0]">Preview</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Mini site canvas</h3>
              </div>
              <Eye className="h-5 w-5 text-[#9dd4e0]" />
            </div>
            <p className="mt-3 text-sm text-slate-400">A condensed site-maker preview to judge mood, hierarchy and CTA balance.</p>
            <div className="mt-5">{renderPreview()}</div>
          </div>

          <div className={panelClass}>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Builder guide</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>Use the section rail on the left like page blocks in a site builder.</p>
              <p>Use line-based repeaters when you want to move faster than clicking through cards.</p>
              <p>If you need full schema coverage, jump to JSON and sync the result back into the builder.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
