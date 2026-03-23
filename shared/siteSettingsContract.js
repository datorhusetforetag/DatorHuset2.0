import { z } from "zod";
import {
  DEFAULT_SITE_SETTINGS,
  SITE_ICON_OPTIONS,
  SITE_SETTINGS_VERSION,
} from "./siteSettingsDefaults.js";

export { DEFAULT_SITE_SETTINGS, SITE_ICON_OPTIONS, SITE_SETTINGS_VERSION };

export const SITE_SETTINGS_KEY = "site_settings";
export const SITE_SETTINGS_DRAFT_KEY = "site_settings_draft";

const SITE_SOCIAL_PLATFORM_OPTIONS = ["instagram", "x", "tiktok", "youtube"];

const siteLinkSchema = z.string().trim().min(1).max(320);
const siteTextSchema = (max = 240) => z.string().trim().min(1).max(max);
const optionalImageSchema = z.string().trim().max(500);

const siteLinkItemSchema = z.object({
  label: siteTextSchema(80),
  href: siteLinkSchema,
});

const heroCategorySchema = z.object({
  name: siteTextSchema(80),
  icon: z.enum(SITE_ICON_OPTIONS),
  href: siteLinkSchema,
});

const stepItemSchema = z.object({
  title: siteTextSchema(120),
  description: siteTextSchema(520),
  icon: z.enum(SITE_ICON_OPTIONS),
});

const promoCardSchema = z.object({
  eyebrow: siteTextSchema(80),
  title: siteTextSchema(140),
  description: siteTextSchema(420),
  image: optionalImageSchema,
  imageAlt: siteTextSchema(160),
  bullets: z.array(siteTextSchema(180)).min(1).max(4),
  primaryLabel: siteTextSchema(80),
  primaryHref: siteLinkSchema,
  secondaryLabel: siteTextSchema(80),
  secondaryHref: siteLinkSchema,
});

const socialLinkSchema = z.object({
  platform: z.enum(SITE_SOCIAL_PLATFORM_OPTIONS),
  label: siteTextSchema(80),
  href: siteLinkSchema,
});

const productsBannerSchema = z.object({
  eyebrow: siteTextSchema(80),
  title: siteTextSchema(180),
  description: siteTextSchema(320),
  images: z.array(optionalImageSchema).max(3),
  stickers: z.array(siteTextSchema(60)).max(3),
});

const serviceRepairFlowItemSchema = z.object({
  value: siteTextSchema(40),
  title: siteTextSchema(120),
  body: siteTextSchema(320),
});

const deepMerge = (defaults, candidate) => {
  if (Array.isArray(defaults)) {
    return Array.isArray(candidate) ? candidate : defaults;
  }

  if (defaults && typeof defaults === "object") {
    const base = {};
    const nextCandidate = candidate && typeof candidate === "object" ? candidate : {};
    const keys = new Set([...Object.keys(defaults), ...Object.keys(nextCandidate)]);

    for (const key of keys) {
      const defaultValue = defaults[key];
      const candidateValue = nextCandidate[key];
      if (key === "version") {
        base[key] = SITE_SETTINGS_VERSION;
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

    return base;
  }

  return candidate === undefined ? defaults : candidate;
};

export const siteSettingsSchema = z.object({
  version: z.literal(SITE_SETTINGS_VERSION).default(SITE_SETTINGS_VERSION),
  site: z.object({
    navigation: z.object({
      brandName: siteTextSchema(60),
      menuLabel: siteTextSchema(40),
      searchPlaceholder: siteTextSchema(120),
      adminPortalHref: siteLinkSchema,
      menuItems: z.array(siteLinkItemSchema).min(2).max(8),
    }),
    footer: z.object({
      supportTitle: siteTextSchema(60),
      supportEmail: siteTextSchema(120),
      supportHours: siteTextSchema(80),
      columns: z.array(z.object({
        title: siteTextSchema(80),
        links: z.array(siteLinkItemSchema).min(1).max(6),
      })).min(1).max(4),
      socialLinks: z.array(socialLinkSchema).min(1).max(6),
      copyright: siteTextSchema(120),
    }),
  }),
  homepage: z.object({
    hero: z.object({
      title: siteTextSchema(120),
      subtitle: siteTextSchema(120),
      featureEyebrow: siteTextSchema(80),
      featureTitle: siteTextSchema(160),
      featureImage: optionalImageSchema,
      featureImageAlt: siteTextSchema(160),
      secondaryTitle: siteTextSchema(160),
      secondaryDescription: siteTextSchema(260),
      secondaryBadge: siteTextSchema(80),
      secondaryNote: siteTextSchema(180),
      categoriesTitle: siteTextSchema(120),
      categories: z.array(heroCategorySchema).min(1).max(8),
      featuredTitle: siteTextSchema(120),
      featuredCount: z.number().int().min(0).max(10),
      featuredInventoryLabel: siteTextSchema(40),
    }),
    steps: z.object({
      title: siteTextSchema(160),
      description: siteTextSchema(220),
      primaryLabel: siteTextSchema(80),
      primaryHref: siteLinkSchema,
      secondaryLabel: siteTextSchema(80),
      secondaryHref: siteLinkSchema,
      items: z.array(stepItemSchema).min(3).max(5),
    }),
    promo: z.object({
      eyebrow: siteTextSchema(80),
      title: siteTextSchema(160),
      description: siteTextSchema(320),
      cards: z.array(promoCardSchema).min(2).max(3),
    }),
  }),
  pages: z.object({
    products: z.object({
      banners: z.object({
        default: productsBannerSchema,
        budget: productsBannerSchema,
        "best-selling": productsBannerSchema,
        "price-performance": productsBannerSchema,
        toptier: productsBannerSchema,
      }),
    }),
    serviceRepair: z.object({
      heroEyebrow: siteTextSchema(80),
      heroTitle: siteTextSchema(180),
      heroDescription: siteTextSchema(320),
      primaryLabel: siteTextSchema(80),
      primaryHref: siteLinkSchema,
      secondaryLabel: siteTextSchema(80),
      secondaryHref: siteLinkSchema,
      flowTitle: siteTextSchema(160),
      flowDescription: siteTextSchema(220),
      steps: z.array(serviceRepairFlowItemSchema).min(3).max(6),
      formTitle: siteTextSchema(120),
      formDescription: siteTextSchema(220),
    }),
    customerService: z.object({
      heroEyebrow: siteTextSchema(80),
      heroTitle: siteTextSchema(160),
      heroDescription: siteTextSchema(260),
      heroCtaLabel: siteTextSchema(80),
      heroCtaHref: siteLinkSchema,
      contactTitle: siteTextSchema(80),
      contactEmail: siteTextSchema(120),
      hoursTitle: siteTextSchema(80),
      hoursLines: z.array(siteTextSchema(140)).min(1).max(4),
      supportTitle: siteTextSchema(80),
      supportLines: z.array(siteTextSchema(220)).min(1).max(4),
      commonIssuesTitle: siteTextSchema(80),
      commonIssues: z.array(siteTextSchema(120)).min(3).max(8),
      commonIssuesNote: siteTextSchema(160),
      workflowTitle: siteTextSchema(80),
      workflowSteps: z.array(siteTextSchema(140)).min(3).max(6),
      workflowCtaLabel: siteTextSchema(80),
      workflowCtaHref: siteLinkSchema,
    }),
  }),
});

export const normalizeSiteSettings = (value) => {
  const merged = deepMerge(DEFAULT_SITE_SETTINGS, value);
  const result = siteSettingsSchema.safeParse(merged);
  if (result.success) {
    return result.data;
  }
  return DEFAULT_SITE_SETTINGS;
};
