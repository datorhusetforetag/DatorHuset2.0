export const SITE_SETTINGS_VERSION = 2;

export const SITE_ICON_OPTIONS = [
  "monitor",
  "wallet",
  "badge-percent",
  "hammer",
  "rocket",
  "package",
  "refresh-euro",
  "shield",
  "truck",
  "wrench",
  "star",
  "headset",
  "sparkles",
  "cpu",
];

export const DEFAULT_SITE_SETTINGS = {
  version: SITE_SETTINGS_VERSION,
  site: {
    announcement: {
      enabled: true,
      theme: "dark",
      label: "Just nu",
      text: "Fa snabbare leverans pa utvalda gaming- och foretagsbyggen hela veckan.",
      href: "/products?clear_filters=1",
      linkLabel: "Se sortimentet",
    },
    navigation: {
      brandName: "DatorHuset",
      menuLabel: "Meny",
      searchPlaceholder: "Sok bland produkter, komponenter och kategorier",
      adminPortalHref: "https://admin.datorhuset.site",
      menuItems: [
        { label: "Alla produkter", href: "/products" },
        { label: "Custom Bygg", href: "/custom-bygg" },
        { label: "Service & Reparation", href: "/service-reparation" },
        { label: "Kundservice & Kontakta oss", href: "/kundservice" },
      ],
    },
    footer: {
      brandText: "Byggda datorer, service och uppgraderingar for gaming, studier och foretag.",
      supportTitle: "Kundservice",
      supportEmail: "support@datorhuset.site",
      supportHours: "Svarstider 11:00-15:00",
      columns: [
        {
          title: "Kontakta oss",
          links: [
            { label: "FAQ", href: "/faq" },
            { label: "Kundservice / Kontaktuppgifter", href: "/kundservice" },
            { label: "Om oss", href: "/about" },
            { label: "Integritetspolicy", href: "/privacy-policy" },
            { label: "Allmanna villkor", href: "/terms-of-service" },
          ],
        },
        {
          title: "Vara tjanster",
          links: [
            { label: "Vara datorer", href: "/products" },
            { label: "Custom bygg", href: "/custom-bygg" },
            { label: "Service / reparation", href: "/service-reparation" },
          ],
        },
      ],
      socialLinks: [
        {
          platform: "instagram",
          label: "Instagram",
          href: "https://www.instagram.com/datorhuset_uf/",
        },
        {
          platform: "x",
          label: "X",
          href: "https://x.com/DatorHuset_UF",
        },
        {
          platform: "tiktok",
          label: "TikTok",
          href: "https://www.tiktok.com/@datorhuset_uf?lang=en-GB",
        },
        {
          platform: "youtube",
          label: "YouTube",
          href: "https://www.youtube.com/@DatorHuset",
        },
      ],
      copyright: "©2026 DatorHuset UF. All rights reserved.",
    },
  },
  homepage: {
    hero: {
      enabled: true,
      primary: {
        eyebrow: "DatorHuset live",
        title: "Veckans bygg",
        subtitle: "Elektronik for foretag",
        primaryLabel: "Se alla datorer",
        primaryHref: "/products",
        secondaryLabel: "Bygg custom",
        secondaryHref: "/custom-bygg",
        featureEyebrow: "Nyhet",
        featureTitle: "Platina Curver ar nu i lager",
        featureImage: "/images/foretagsdeal.webp",
        featureImageAlt: "Gamingdator for foretagsdeal",
      },
      secondary: {
        title: "Veckans deal - Fa en gava vid kopet",
        description: "Fa en exklusiv gava nar du handlar hos oss.",
        badge: "Gava vid kop",
        note: "Musmatta, tangentbord, mus eller uppgraderade komponenter!",
        image: "",
        imageAlt: "Gava vid kop",
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
      featuredCount: 6,
      featuredInventoryLabel: "I lager",
    },
    trustBar: {
      enabled: true,
      title: "Darfor valjer kunder DatorHuset",
      items: [
        { value: "24h", label: "Svarstid pa vanliga servicearenden", icon: "headset" },
        { value: "100%", label: "Byggs och testas innan leverans", icon: "shield" },
        { value: "Flex", label: "Nya, begagnade och custom alternativ", icon: "wrench" },
      ],
    },
    steps: {
      enabled: true,
      eyebrow: "Sa fungerar det",
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
    showcase: {
      enabled: true,
      eyebrow: "Mer kontroll",
      title: "Sandladas med fler kampanjytor",
      description: "Anvand admin-API:t for att styra vad kunderna ser pa startsidan utan nya deployer.",
      cards: [
        {
          icon: "sparkles",
          title: "Snabba kampanjer",
          description: "Byt ut budskap, CTA:er och menyinnehall nar du vill pusha en specifik kategori.",
          linkLabel: "Oppna produkter",
          href: "/products",
        },
        {
          icon: "cpu",
          title: "Skraddarsydda bygg",
          description: "Lyft custom bygg, service eller foretagspaket med egna block och nya sektioner.",
          linkLabel: "Ga till custom bygg",
          href: "/custom-bygg",
        },
        {
          icon: "truck",
          title: "Leverans och trygghet",
          description: "Justera trust-signaler och supportinformation nar leverans, garanti eller service ar fokus.",
          linkLabel: "Kontakta oss",
          href: "/kundservice",
        },
      ],
    },
    promo: {
      enabled: true,
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
    ctaBand: {
      enabled: true,
      badge: "Sandbox live",
      eyebrow: "Skifta fokus pa minuter",
      title: "Pusha kampanjer, support eller custom-bygg direkt fran admin",
      description: "Anvand utkast, publicera live nar du ar klar och hall huvudsidan uppdaterad utan kodandringar.",
      primaryLabel: "Se produkter",
      primaryHref: "/products",
      secondaryLabel: "Ga till kundservice",
      secondaryHref: "/kundservice",
    },
  },
};
