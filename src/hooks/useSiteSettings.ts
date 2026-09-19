import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings, type SiteSettings } from "@/lib/siteSettings";

type SiteSettingsMode = "live" | "draft";

const cachedByMode: Record<SiteSettingsMode, SiteSettings> = {
  live: DEFAULT_SITE_SETTINGS,
  draft: DEFAULT_SITE_SETTINGS,
};

const inflightByMode: Partial<Record<SiteSettingsMode, Promise<SiteSettings>>> = {};
const SiteSettingsOverrideContext = createContext<{ settings: SiteSettings; mode: SiteSettingsMode } | null>(null);

const getRequestedMode = (explicitMode?: SiteSettingsMode): SiteSettingsMode => {
  if (explicitMode) return explicitMode;
  if (typeof window === "undefined") return "live";
  const search = new URLSearchParams(window.location.search);
  return search.get("site-settings-mode") === "draft" ? "draft" : "live";
};

const loadSiteSettings = async (mode: SiteSettingsMode): Promise<SiteSettings> => {
  if (inflightByMode[mode]) return inflightByMode[mode] as Promise<SiteSettings>;

  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  inflightByMode[mode] = fetch(`${apiBase}/api/site-settings?mode=${mode}`)
    .then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        return cachedByMode[mode];
      }
      const nextSettings = normalizeSiteSettings(payload?.settings);
      cachedByMode[mode] = nextSettings;
      return nextSettings;
    })
    .catch(() => cachedByMode[mode])
    .finally(() => {
      delete inflightByMode[mode];
    });

  return inflightByMode[mode] as Promise<SiteSettings>;
};

export const SiteSettingsProvider = ({
  settings,
  mode = "draft",
  children,
}: {
  settings: SiteSettings;
  mode?: SiteSettingsMode;
  children: React.ReactNode;
}) => {
  const value = useMemo(() => ({ settings, mode }), [mode, settings]);
  return createElement(SiteSettingsOverrideContext.Provider, { value }, children);
};

/*
 * Krokarna anropas alltid, beslutet tas efteråt.
 *
 * Tidigare låg en early return för override FÖRE useState och
 * useEffect. React kräver att krokarna körs i samma ordning varje
 * gång en komponent ritas om, och den ordningen ändrades i samma
 * ögonblick som en override dök upp eller försvann - exakt det som
 * händer när sandlådans förhandsvisning slås på. Resultatet blir
 * inte ett fel i konsolen utan en krasch: "Rendered fewer hooks
 * than expected".
 *
 * Nu körs alla tre alltid. Hämtningen hoppas över när en override
 * styr, för då är inställningarna redan givna och ett anrop till
 * servern skulle vara bortkastat.
 */
export const useSiteSettings = (explicitMode?: SiteSettingsMode) => {
  const override = useContext(SiteSettingsOverrideContext);
  const mode = getRequestedMode(explicitMode);
  const [settings, setSettings] = useState<SiteSettings>(cachedByMode[mode]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (override) return;
    let active = true;

    loadSiteSettings(mode)
      .then((nextSettings) => {
        if (!active) return;
        setSettings(nextSettings);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [mode, override]);

  if (override) {
    return { settings: override.settings, loading: false, mode: override.mode };
  }

  return { settings, loading, mode };
};
