import { useEffect, useState } from "react";
import { Copy, RefreshCcw, RotateCcw, Save, Send, Wand2 } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings, type SiteSettings } from "@/lib/siteSettings";
import { AdminAccessContext } from "../useAdminAccess";

const prettyJson = (value: unknown) => JSON.stringify(value, null, 2);

type SandboxMode = "draft" | "live";
type SiteSettingsBundle = {
  draft: SiteSettings;
  live: SiteSettings;
};

const defaultBundle: SiteSettingsBundle = {
  draft: DEFAULT_SITE_SETTINGS,
  live: DEFAULT_SITE_SETTINGS,
};

const buildSummaryRows = (settings: SiteSettings) => [
  { label: "Announcement", value: settings.site.announcement.enabled ? "On" : "Off" },
  { label: "Menu links", value: String(settings.site.navigation.menuItems.length) },
  { label: "Footer columns", value: String(settings.site.footer.columns.length) },
  { label: "Social links", value: String(settings.site.footer.socialLinks.length) },
  {
    label: "Homepage blocks",
    value: String(
      [
        settings.homepage.hero.enabled,
        settings.homepage.trustBar.enabled,
        settings.homepage.steps.enabled,
        settings.homepage.showcase.enabled,
        settings.homepage.promo.enabled,
        settings.homepage.ctaBand.enabled,
      ].filter(Boolean).length,
    ),
  },
  { label: "Hero cards", value: String(settings.homepage.hero.categories.length) },
];

export default function AdminSiteSandbox() {
  const { isAdmin, loading, error, token, apiBase, role, signInWithGoogle } =
    useOutletContext<AdminAccessContext>();
  const [selectedMode, setSelectedMode] = useState<SandboxMode>("draft");
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

  const setEditorValueForMode = (mode: SandboxMode, value: string) => {
    setEditorValues((current) => ({ ...current, [mode]: value }));
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
      const nextBundle = {
        draft: normalizeSiteSettings(payload?.settings?.draft),
        live: normalizeSiteSettings(payload?.settings?.live),
      };
      syncBundleIntoEditors(nextBundle);
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

  const handleFormat = () => {
    setLocalError("");
    try {
      setEditorValueForMode(selectedMode, prettyJson(JSON.parse(editorValues[selectedMode])));
    } catch {
      setLocalError("JSON ar inte giltig. Ratta formatet innan du fortsatter.");
    }
  };

  const parseCurrentEditor = () => {
    const parsed = JSON.parse(editorValues[selectedMode]);
    return normalizeSiteSettings(parsed);
  };

  const handleSave = async () => {
    if (!token || !isAdmin || !canMutate) return;
    setSaving(true);
    setLocalError("");
    setSaveMessage("");

    let parsedSettings;
    try {
      parsedSettings = parseCurrentEditor();
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

      const nextBundle = {
        ...bundle,
        [selectedMode]: normalizeSiteSettings(payload?.settings),
      } as SiteSettingsBundle;
      syncBundleIntoEditors(nextBundle);
      setSaveMessage(
        selectedMode === "draft"
          ? "Utkastet sparades. Det ar inte live for kunderna forran du publicerar det."
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
      const nextBundle = {
        ...bundle,
        [selectedMode]: normalizeSiteSettings(payload?.settings),
      } as SiteSettingsBundle;
      syncBundleIntoEditors(nextBundle);
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
      setSaveMessage("Live-innehall kopierades till utkastet. Fortsatta redigera i draft-laget.");
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
      setSaveMessage("Utkastet ar nu publicerat live pa huvudsidan.");
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte publicera utkastet.");
    } finally {
      setPublishing(false);
    }
  };

  let previewSettings = bundle[selectedMode];
  try {
    previewSettings = parseCurrentEditor();
  } catch {
    previewSettings = bundle[selectedMode];
  }

  if (!token) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <h2 className="text-xl font-semibold">Logga in for att fortsatta</h2>
        <p className="mt-2 text-sm text-slate-400">Du maste vara inloggad med ditt admin-konto.</p>
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
          <h2 className="text-2xl font-semibold">Site Sandbox</h2>
          <p className="text-sm text-slate-400">
            Styr announcement bar, meny, footer och flera homepage-sektioner via draft/live-lagen.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadSettings}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-4 py-2 text-sm font-semibold hover:border-[#11667b] hover:text-[#11667b]"
          >
            <RefreshCcw className="h-4 w-4" />
            Ladda om
          </button>
          <button
            type="button"
            onClick={handleFormat}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-4 py-2 text-sm font-semibold hover:border-[#11667b] hover:text-[#11667b]"
          >
            <Wand2 className="h-4 w-4" />
            Formatera
          </button>
          <button
            type="button"
            onClick={handleCloneLiveToDraft}
            disabled={!canMutate || cloning}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-4 py-2 text-sm font-semibold hover:border-[#11667b] hover:text-[#11667b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy className="h-4 w-4" />
            {cloning ? "Kopierar..." : "Live -> Draft"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!canMutate || resetting}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-4 py-2 text-sm font-semibold hover:border-[#11667b] hover:text-[#11667b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            {resetting ? "Aterstaller..." : `Standard ${selectedMode}`}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canMutate || saving}
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Sparar..." : `Spara ${selectedMode}`}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!canMutate || publishing}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {publishing ? "Publicerar..." : "Publicera draft"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {(["draft", "live"] as SandboxMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setSelectedMode(mode)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              selectedMode === mode
                ? "bg-[#11667b] text-white"
                : "border border-slate-700/60 bg-slate-900/50 text-slate-300 hover:border-[#11667b] hover:text-[#11667b]"
            }`}
          >
            {mode === "draft" ? "Draft sandbox" : "Live site"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {buildSummaryRows(previewSettings).map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      {loading && <p className="text-sm text-slate-400">Verifierar atkomst...</p>}
      {!loading && error && <p className="text-sm text-red-400">{error}</p>}
      {loadingSettings && <p className="text-sm text-slate-400">Laddar site settings...</p>}
      {localError ? (
        <pre className="whitespace-pre-wrap rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {localError}
        </pre>
      ) : null}
      {saveMessage ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {saveMessage}
        </div>
      ) : null}
      {!canMutate ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
          Ditt konto har readonly-behorighet. Du kan lasa site settings men inte spara andringar.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-4 space-y-2 text-sm text-slate-400">
            <p>
              Draft ar din sandbox. Redigera och spara dar, publicera sedan nar du vill att kunderna ska se andringen.
            </p>
            <p>Live styr den publika siten direkt. Anvand det bara for snabba hotfixar eller sista justeringar.</p>
          </div>
          <textarea
            value={editorValues[selectedMode]}
            onChange={(event) => setEditorValueForMode(selectedMode, event.target.value)}
            spellCheck={false}
            className="min-h-[760px] w-full rounded-xl border border-slate-700 bg-slate-950/80 p-4 font-mono text-sm text-slate-100 outline-none focus:border-[#11667b]"
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Editable paths</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>`site.announcement` styr topplisten ovanfor navbaren.</p>
              <p>`site.navigation` styr brandnamn, sokplats och meny-lankar.</p>
              <p>`site.footer` styr supportdata, kolumner, sociala lankar och copyright.</p>
              <p>`homepage.hero` styr hero, CTA-knappar, kategori-kort och featured-count.</p>
              <p>`homepage.trustBar` styr statistik- och trygghetsstrippen.</p>
              <p>`homepage.steps` styr stegsektionen och dess knappar.</p>
              <p>`homepage.showcase` styr den nya feature-griden mitt pa sidan.</p>
              <p>`homepage.promo` styr de stora promo-korten.</p>
              <p>`homepage.ctaBand` styr slutblocket med slut-CTA.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Workflow</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>1. Kopiera live till draft om du vill starta fran publikt lage.</p>
              <p>2. Redigera draft-JSON och spara utkastet.</p>
              <p>3. Publicera nar innehallet ser ratt ut.</p>
              <p>4. Om nagot blir fel kan du aterstalla draft eller live till standardinnehall.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
