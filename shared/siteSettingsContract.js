import { z } from "zod";

export const SITE_SETTINGS_KEY = "site_settings";
export const SITE_SETTINGS_VERSION = 1;

export const SITE_ICON_OPTIONS = [
  "monitor",
  "wallet",
  "badge-percent",
  "hammer",
  "rocket",
  "package",
  "refresh-euro",
];

const siteLinkSchema = z.string().trim().min(1).max(240);
const siteTextSchema = (max = 240) => z.string().trim().min(1).max(max);
const optionalImageSchema = z.string().trim().max(500);

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

export const DEFAULT_SITE_SETTINGS = {
  version: SITE_SETTINGS_VERSION,
  homepage: {
    hero: {
      primary: {
        title: "Veckans bygg",
        subtitle: "Elektronik for foretag",
        featureEyebrow: "Nyhet",
        featureTitle: "Platina Curver ar nu i lager",
        featureImage: "/images/foretagsdeal.webp",
        featureImageAlt: "Gamingdator for foretagsdeal",
      },
      secondary: {
        title: "Veckans deal - Fa en gava vid kopet",
        description: "Fa en exklusiv gava nar du handlar hos oss.",
        badge: "Gava vid kop",
      },
      categoriesTitle: "Populara kategorier",
      categories: [
        { name: "Alla produkter", icon: "monitor", href: "/products?clear_filters=1" },
        { name: "Budgetvanliga", icon: "wallet", href: "/products?category=budget&clear_filters=1" },
        { name: "Price-Performance", icon: "badge-percent", href: "/products?category=price-performance&clear_filters=1" },
        { name: "Custom Bygg", icon: "hammer", href: "/custom-bygg" },
        { name: "Basta prestanda", icon: "rocket", href: "/products?category=toptier&clear_filters=1" },
      ],
      featuredTitle: "Senast visade produkter",
    },
    steps: {
      title: "Att kopa en riktigt bra dator har aldrig varit sa latt",
      description: "Sa har koper du din dator via var tjanst",
      primaryLabel: "Kop din dator",
      primaryHref: "/products",
      secondaryLabel: "Gor en custom bygg",
      secondaryHref: "/custom-bygg",
      items: [
        {
          title: "1. Gor en preorder",
          description: "Hitta ett brett utbud av datorer eller skicka in ett custom-bygge du vill ha.",
          icon: "monitor",
        },
        {
          title: "2. Vi bygger och packar din dator",
          description:
            "Vi koper komponenterna och bygger datorn. Byggtiden varierar beroende pa om du bestaller nytt, begagnat eller custom.",
          icon: "package",
        },
        {
          title: "3. Leverans eller hamta upp",
          description: "Datorn ar byggd och klar. Hamta upp den eller valj fraktalternativ.",
          icon: "refresh-euro",
        },
      ],
    },
    promo: {
      eyebrow: "Mer fran DatorHuset",
      title: "Vi bygger, fixar och optimerar for dig",
      description:
        "Valj service om du vill fa din dator tillbaka i toppform eller bygg ett helt nytt system fran grunden.",
      cards: [
        {
          eyebrow: "Service & reparation",
          title: "Vi far din dator tillbaka i toppform",
          description:
            "Snabb felsokning, tydlig offert och proffsig optimering. Vi tar hand om allt fran prestandaproblem till uppgraderingar.",
          image: "/products/newpc/cg530_new.png",
          imageAlt: "Service och reparation av datorer",
          bullets: [
            "Felsokning inom 24 timmar pa vanliga fel",
            "Rengoring, kylning och stabilitetstester",
            "Garanti pa utfort arbete och uppgraderingar",
          ],
          primaryLabel: "Service & reparation",
          primaryHref: "/service-reparation",
          secondaryLabel: "Fraga en tekniker",
          secondaryHref: "/kundservice",
        },
        {
          eyebrow: "Custom bygg",
          title: "Byggd for din vardag och din gaming",
          description:
            "Valj komponenter, stil och budget. Vi bygger, testar och levererar en dator som ar helt anpassad efter dig.",
          image: "/products/newpc/allwhite-1.jpg",
          imageAlt: "Custom byggda datorer",
          bullets: [
            "Valj prestandaniva, formfaktor och RGB",
            "Optimerade for gaming, kreativt arbete eller AI",
            "Trygg leverans med test och verifiering",
          ],
          primaryLabel: "Ga till custom bygg",
          primaryHref: "/custom-bygg",
          secondaryLabel: "Se fardiga datorer",
          secondaryHref: "/products",
        },
      ],
    },
  },
};

export const siteSettingsSchema = z.object({
  version: z.literal(SITE_SETTINGS_VERSION).default(SITE_SETTINGS_VERSION),
  homepage: z.object({
    hero: z.object({
      primary: z.object({
        title: siteTextSchema(120),
        subtitle: siteTextSchema(120),
        featureEyebrow: siteTextSchema(80),
        featureTitle: siteTextSchema(160),
        featureImage: optionalImageSchema,
        featureImageAlt: siteTextSchema(160),
      }),
      secondary: z.object({
        title: siteTextSchema(160),
        description: siteTextSchema(260),
        badge: siteTextSchema(80),
      }),
      categoriesTitle: siteTextSchema(120),
      categories: z.array(heroCategorySchema).min(1).max(8),
      featuredTitle: siteTextSchema(120),
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
});

export const normalizeSiteSettings = (value) => {
  const result = siteSettingsSchema.safeParse(value);
  if (result.success) {
    return result.data;
  }
  return DEFAULT_SITE_SETTINGS;
};
