import { useEffect, useState } from "react";
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings, type SiteSettings } from "@/lib/siteSettings";

type SiteSettingsMode = "live" | "draft";

const cachedByMode: Record<SiteSettingsMode, SiteSettings> = {
  live: DEFAULT_SITE_SETTINGS,
  draft: DEFAULT_SITE_SETTINGS,
};

const inflightByMode: Partial<Record<SiteSettingsMode, Promise<SiteSettings>>> = {};

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

export const useSiteSettings = (explicitMode?: SiteSettingsMode) => {
  const mode = getRequestedMode(explicitMode);
  const [settings, setSettings] = useState<SiteSettings>(cachedByMode[mode]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [mode]);

  return { settings, loading, mode };
};
