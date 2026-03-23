export type SiteIconKey =
  | "monitor"
  | "wallet"
  | "badge-percent"
  | "hammer"
  | "rocket"
  | "package"
  | "refresh-euro";

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

export type SiteSettings = {
  version: 1;
  homepage: {
    hero: {
      primary: {
        title: string;
        subtitle: string;
        featureEyebrow: string;
        featureTitle: string;
        featureImage: string;
        featureImageAlt: string;
      };
      secondary: {
        title: string;
        description: string;
        badge: string;
      };
      categoriesTitle: string;
      categories: SiteHeroCategory[];
      featuredTitle: string;
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
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  version: 1,
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

export const normalizeSiteSettings = (value: unknown): SiteSettings => {
  const candidate = value as Partial<SiteSettings> | null | undefined;
  if (!candidate || typeof candidate !== "object") return DEFAULT_SITE_SETTINGS;

  const homepage = candidate.homepage;
  if (!homepage || typeof homepage !== "object") return DEFAULT_SITE_SETTINGS;

  if (!homepage.hero || !homepage.steps || !homepage.promo) {
    return DEFAULT_SITE_SETTINGS;
  }

  return candidate as SiteSettings;
};
