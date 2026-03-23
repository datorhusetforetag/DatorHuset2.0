import { useEffect, useState } from "react";
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings, type SiteSettings } from "@/lib/siteSettings";

let cachedSiteSettings: SiteSettings = DEFAULT_SITE_SETTINGS;
let siteSettingsPromise: Promise<SiteSettings> | null = null;

const loadSiteSettings = async (): Promise<SiteSettings> => {
  if (siteSettingsPromise) return siteSettingsPromise;

  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  siteSettingsPromise = fetch(`${apiBase}/api/site-settings`)
    .then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        return cachedSiteSettings;
      }
      const nextSettings = normalizeSiteSettings(payload?.settings);
      cachedSiteSettings = nextSettings;
      return nextSettings;
    })
    .catch(() => cachedSiteSettings)
    .finally(() => {
      siteSettingsPromise = null;
    });

  return siteSettingsPromise;
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(cachedSiteSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    loadSiteSettings()
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
  }, []);

  return { settings, loading };
};
