import { useEffect, useState } from "react";
import { Code2, RefreshCcw, Save, Wand2 } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { DEFAULT_SITE_SETTINGS } from "@/lib/siteSettings";
import { AdminAccessContext } from "../useAdminAccess";

const prettyJson = (value: unknown) => JSON.stringify(value, null, 2);

export default function AdminSiteSandbox() {
  const { isAdmin, loading, error, token, apiBase, role, signInWithGoogle } =
    useOutletContext<AdminAccessContext>();
  const [editorValue, setEditorValue] = useState(prettyJson(DEFAULT_SITE_SETTINGS));
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const canMutate = role === "admin" || role === "ops" || role === "";

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
      setEditorValue(prettyJson(payload?.settings || DEFAULT_SITE_SETTINGS));
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
  }, [isAdmin]);

  const handleFormat = () => {
    setLocalError("");
    try {
      setEditorValue(prettyJson(JSON.parse(editorValue)));
    } catch {
      setLocalError("JSON ar inte giltig. Ratta formatet innan du fortsatter.");
    }
  };

  const handleReset = () => {
    setEditorValue(prettyJson(DEFAULT_SITE_SETTINGS));
    setLocalError("");
    setSaveMessage("Editor aterstalld till standardinnehall.");
  };

  const handleSave = async () => {
    if (!token || !isAdmin || !canMutate) return;
    setSaving(true);
    setLocalError("");
    setSaveMessage("");

    let parsedSettings;
    try {
      parsedSettings = JSON.parse(editorValue);
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
        body: JSON.stringify({ settings: parsedSettings }),
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
      setEditorValue(prettyJson(payload?.settings || parsedSettings));
      setSaveMessage("Site settings sparades och ar nu live pa huvudsidan.");
    } catch (nextError) {
      setLocalError(nextError instanceof Error ? nextError.message : "Kunde inte spara site settings.");
    } finally {
      setSaving(false);
    }
  };

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
            Detta payloadet styr startsidans hero, steg och promo-block pa huvudsidan.
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
            <Code2 className="h-4 w-4" />
            Formatera
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-4 py-2 text-sm font-semibold hover:border-[#11667b] hover:text-[#11667b]"
          >
            <Wand2 className="h-4 w-4" />
            Standard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canMutate || saving}
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Sparar..." : "Spara live"}
          </button>
        </div>
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

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 space-y-2 text-sm text-slate-400">
          <p>Anvand detta som sandbox for huvudsidan. Nar du sparar blir startsidan uppdaterad via API.</p>
          <p>
            Nycklarna som anvands just nu ar `homepage.hero`, `homepage.steps` och `homepage.promo`.
          </p>
        </div>
        <textarea
          value={editorValue}
          onChange={(event) => setEditorValue(event.target.value)}
          spellCheck={false}
          className="min-h-[720px] w-full rounded-xl border border-slate-700 bg-slate-950/80 p-4 font-mono text-sm text-slate-100 outline-none focus:border-[#11667b]"
        />
      </div>
    </div>
  );
}
