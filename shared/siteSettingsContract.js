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
const SITE_ANNOUNCEMENT_THEME_OPTIONS = ["dark", "yellow", "teal"];

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
  description: siteTextSchema(420),
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

const trustMetricSchema = z.object({
  value: siteTextSchema(40),
  label: siteTextSchema(160),
  icon: z.enum(SITE_ICON_OPTIONS),
});

const showcaseCardSchema = z.object({
  icon: z.enum(SITE_ICON_OPTIONS),
  title: siteTextSchema(120),
  description: siteTextSchema(280),
  linkLabel: siteTextSchema(80),
  href: siteLinkSchema,
});

const footerColumnSchema = z.object({
  title: siteTextSchema(80),
  links: z.array(siteLinkItemSchema).min(1).max(6),
});

const socialLinkSchema = z.object({
  platform: z.enum(SITE_SOCIAL_PLATFORM_OPTIONS),
  label: siteTextSchema(80),
  href: siteLinkSchema,
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
    announcement: z.object({
      enabled: z.boolean(),
      theme: z.enum(SITE_ANNOUNCEMENT_THEME_OPTIONS),
      label: siteTextSchema(40),
      text: siteTextSchema(220),
      href: siteLinkSchema,
      linkLabel: siteTextSchema(60),
    }),
    navigation: z.object({
      brandName: siteTextSchema(60),
      menuLabel: siteTextSchema(40),
      searchPlaceholder: siteTextSchema(120),
      adminPortalHref: siteLinkSchema,
      menuItems: z.array(siteLinkItemSchema).min(2).max(8),
    }),
    footer: z.object({
      brandText: siteTextSchema(220),
      supportTitle: siteTextSchema(60),
      supportEmail: siteTextSchema(120),
      supportHours: siteTextSchema(80),
      columns: z.array(footerColumnSchema).min(1).max(4),
      socialLinks: z.array(socialLinkSchema).min(1).max(6),
      copyright: siteTextSchema(120),
    }),
  }),
  homepage: z.object({
    hero: z.object({
      enabled: z.boolean(),
      primary: z.object({
        eyebrow: siteTextSchema(60),
        title: siteTextSchema(120),
        subtitle: siteTextSchema(120),
        primaryLabel: siteTextSchema(80),
        primaryHref: siteLinkSchema,
        secondaryLabel: siteTextSchema(80),
        secondaryHref: siteLinkSchema,
        featureEyebrow: siteTextSchema(80),
        featureTitle: siteTextSchema(160),
        featureImage: optionalImageSchema,
        featureImageAlt: siteTextSchema(160),
      }),
      secondary: z.object({
        title: siteTextSchema(160),
        description: siteTextSchema(260),
        badge: siteTextSchema(80),
        note: siteTextSchema(180),
        image: optionalImageSchema,
        imageAlt: siteTextSchema(160),
      }),
      categoriesTitle: siteTextSchema(120),
      categories: z.array(heroCategorySchema).min(1).max(8),
      featuredTitle: siteTextSchema(120),
      featuredCount: z.number().int().min(0).max(10),
      featuredInventoryLabel: siteTextSchema(40),
    }),
    trustBar: z.object({
      enabled: z.boolean(),
      title: siteTextSchema(120),
      items: z.array(trustMetricSchema).min(2).max(5),
    }),
    steps: z.object({
      enabled: z.boolean(),
      eyebrow: siteTextSchema(80),
      title: siteTextSchema(160),
      description: siteTextSchema(220),
      primaryLabel: siteTextSchema(80),
      primaryHref: siteLinkSchema,
      secondaryLabel: siteTextSchema(80),
      secondaryHref: siteLinkSchema,
      items: z.array(stepItemSchema).min(3).max(5),
    }),
    showcase: z.object({
      enabled: z.boolean(),
      eyebrow: siteTextSchema(80),
      title: siteTextSchema(160),
      description: siteTextSchema(260),
      cards: z.array(showcaseCardSchema).min(2).max(6),
    }),
    promo: z.object({
      enabled: z.boolean(),
      eyebrow: siteTextSchema(80),
      title: siteTextSchema(160),
      description: siteTextSchema(320),
      cards: z.array(promoCardSchema).min(2).max(3),
    }),
    ctaBand: z.object({
      enabled: z.boolean(),
      badge: siteTextSchema(80),
      eyebrow: siteTextSchema(80),
      title: siteTextSchema(160),
      description: siteTextSchema(260),
      primaryLabel: siteTextSchema(80),
      primaryHref: siteLinkSchema,
      secondaryLabel: siteTextSchema(80),
      secondaryHref: siteLinkSchema,
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
