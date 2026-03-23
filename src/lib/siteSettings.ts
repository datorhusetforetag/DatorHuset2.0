import {
  DEFAULT_SITE_SETTINGS as SHARED_DEFAULT_SITE_SETTINGS,
  SITE_ICON_OPTIONS as SHARED_SITE_ICON_OPTIONS,
} from "../../shared/siteSettingsDefaults.js";

export type SiteIconKey =
  | "monitor"
  | "wallet"
  | "badge-percent"
  | "hammer"
  | "rocket"
  | "package"
  | "refresh-euro"
  | "shield"
  | "truck"
  | "wrench"
  | "star"
  | "headset"
  | "sparkles"
  | "cpu";

export type SiteLinkItem = {
  label: string;
  href: string;
};

export type SiteHeroCategory = {
  name: string;
  icon: SiteIconKey;
  href: string;
};

export type SiteStepItem = {
  title: string;
  description: string;
  icon: SiteIconKey;
};

export type SitePromoCard = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  bullets: string[];
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

export type SiteTrustMetric = {
  value: string;
  label: string;
  icon: SiteIconKey;
};

export type SiteShowcaseCard = {
  icon: SiteIconKey;
  title: string;
  description: string;
  linkLabel: string;
  href: string;
};

export type SiteFooterColumn = {
  title: string;
  links: SiteLinkItem[];
};

export type SiteSocialPlatform = "instagram" | "x" | "tiktok" | "youtube";

export type SiteSocialLink = {
  platform: SiteSocialPlatform;
  label: string;
  href: string;
};

export type SiteSettings = {
  version: 2;
  site: {
    announcement: {
      enabled: boolean;
      theme: "dark" | "yellow" | "teal";
      label: string;
      text: string;
      href: string;
      linkLabel: string;
    };
    navigation: {
      brandName: string;
      menuLabel: string;
      searchPlaceholder: string;
      adminPortalHref: string;
      menuItems: SiteLinkItem[];
    };
    footer: {
      brandText: string;
      supportTitle: string;
      supportEmail: string;
      supportHours: string;
      columns: SiteFooterColumn[];
      socialLinks: SiteSocialLink[];
      copyright: string;
    };
  };
  homepage: {
    hero: {
      enabled: boolean;
      primary: {
        eyebrow: string;
        title: string;
        subtitle: string;
        primaryLabel: string;
        primaryHref: string;
        secondaryLabel: string;
        secondaryHref: string;
        featureEyebrow: string;
        featureTitle: string;
        featureImage: string;
        featureImageAlt: string;
      };
      secondary: {
        title: string;
        description: string;
        badge: string;
        note: string;
        image: string;
        imageAlt: string;
      };
      categoriesTitle: string;
      categories: SiteHeroCategory[];
      featuredTitle: string;
      featuredCount: number;
      featuredInventoryLabel: string;
    };
    trustBar: {
      enabled: boolean;
      title: string;
      items: SiteTrustMetric[];
    };
    steps: {
      enabled: boolean;
      eyebrow: string;
      title: string;
      description: string;
      primaryLabel: string;
      primaryHref: string;
      secondaryLabel: string;
      secondaryHref: string;
      items: SiteStepItem[];
    };
    showcase: {
      enabled: boolean;
      eyebrow: string;
      title: string;
      description: string;
      cards: SiteShowcaseCard[];
    };
    promo: {
      enabled: boolean;
      eyebrow: string;
      title: string;
      description: string;
      cards: SitePromoCard[];
    };
    ctaBand: {
      enabled: boolean;
      badge: string;
      eyebrow: string;
      title: string;
      description: string;
      primaryLabel: string;
      primaryHref: string;
      secondaryLabel: string;
      secondaryHref: string;
    };
  };
};

const deepMerge = <T,>(defaults: T, candidate: unknown): T => {
  if (Array.isArray(defaults)) {
    return (Array.isArray(candidate) ? candidate : defaults) as T;
  }

  if (defaults && typeof defaults === "object") {
    const base = {} as Record<string, unknown>;
    const nextCandidate = candidate && typeof candidate === "object" ? (candidate as Record<string, unknown>) : {};
    const keys = new Set([...Object.keys(defaults as Record<string, unknown>), ...Object.keys(nextCandidate)]);

    for (const key of keys) {
      const defaultValue = (defaults as Record<string, unknown>)[key];
      const candidateValue = nextCandidate[key];

      if (key === "version") {
        base[key] = 2;
        continue;
      }

      if (Array.isArray(defaultValue)) {
        base[key] = Array.isArray(candidateValue) ? candidateValue : defaultValue;
        continue;
      }

      if (defaultValue && typeof defaultValue === "object") {
        base[key] = deepMerge(defaultValue, candidateValue);
        continue;
      }

      base[key] = candidateValue === undefined ? defaultValue : candidateValue;
    }

    return base as T;
  }

  return (candidate === undefined ? defaults : candidate) as T;
};

export const DEFAULT_SITE_SETTINGS = SHARED_DEFAULT_SITE_SETTINGS as SiteSettings;
export const SITE_ICON_OPTIONS = SHARED_SITE_ICON_OPTIONS as SiteIconKey[];

export const normalizeSiteSettings = (value: unknown): SiteSettings => deepMerge(DEFAULT_SITE_SETTINGS, value);
