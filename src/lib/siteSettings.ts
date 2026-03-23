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
  | "headset";

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

export type SiteSocialPlatform = "instagram" | "x" | "tiktok" | "youtube";

export type SiteSettings = {
  version: 3;
  site: {
    navigation: {
      brandName: string;
      menuLabel: string;
      searchPlaceholder: string;
      adminPortalHref: string;
      menuItems: SiteLinkItem[];
    };
    footer: {
      supportTitle: string;
      supportEmail: string;
      supportHours: string;
      columns: Array<{
        title: string;
        links: SiteLinkItem[];
      }>;
      socialLinks: Array<{
        platform: SiteSocialPlatform;
        label: string;
        href: string;
      }>;
      copyright: string;
    };
  };
  homepage: {
    hero: {
      title: string;
      subtitle: string;
      featureEyebrow: string;
      featureTitle: string;
      featureImage: string;
      featureImageAlt: string;
      secondaryTitle: string;
      secondaryDescription: string;
      secondaryBadge: string;
      secondaryNote: string;
      categoriesTitle: string;
      categories: SiteHeroCategory[];
      featuredTitle: string;
      featuredCount: number;
      featuredInventoryLabel: string;
    };
    steps: {
      title: string;
      description: string;
      primaryLabel: string;
      primaryHref: string;
      secondaryLabel: string;
      secondaryHref: string;
      items: SiteStepItem[];
    };
    promo: {
      eyebrow: string;
      title: string;
      description: string;
      cards: SitePromoCard[];
    };
  };
  pages: {
    products: {
      banners: Record<
        "default" | "budget" | "best-selling" | "price-performance" | "toptier",
        {
          eyebrow: string;
          title: string;
          description: string;
          images: string[];
          stickers: string[];
        }
      >;
    };
    serviceRepair: {
      heroEyebrow: string;
      heroTitle: string;
      heroDescription: string;
      primaryLabel: string;
      primaryHref: string;
      secondaryLabel: string;
      secondaryHref: string;
      flowTitle: string;
      flowDescription: string;
      steps: Array<{
        value: string;
        title: string;
        body: string;
      }>;
      formTitle: string;
      formDescription: string;
    };
    customerService: {
      heroEyebrow: string;
      heroTitle: string;
      heroDescription: string;
      heroCtaLabel: string;
      heroCtaHref: string;
      contactTitle: string;
      contactEmail: string;
      hoursTitle: string;
      hoursLines: string[];
      supportTitle: string;
      supportLines: string[];
      commonIssuesTitle: string;
      commonIssues: string[];
      commonIssuesNote: string;
      workflowTitle: string;
      workflowSteps: string[];
      workflowCtaLabel: string;
      workflowCtaHref: string;
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
        base[key] = 3;
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
