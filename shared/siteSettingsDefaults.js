export const SITE_SETTINGS_VERSION = 3;

export const SITE_ICON_OPTIONS = [
  "monitor",
  "wallet",
  "badge-percent",
  "hammer",
  "rocket",
  "package",
  "refresh-euro",
  "shield",
  "headset",
];

export const DEFAULT_SITE_SETTINGS = {
  version: SITE_SETTINGS_VERSION,
  site: {
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
        { platform: "instagram", label: "Instagram", href: "https://www.instagram.com/datorhuset_uf/" },
        { platform: "x", label: "X", href: "https://x.com/DatorHuset_UF" },
        { platform: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@datorhuset_uf?lang=en-GB" },
        { platform: "youtube", label: "YouTube", href: "https://www.youtube.com/@DatorHuset" },
      ],
      copyright: "©2026 DatorHuset UF. All rights reserved.",
    },
  },
  homepage: {
    hero: {
      title: "Veckansbygg!",
      subtitle: "Elektronik for foretag",
      featureEyebrow: "Nyhet!",
      featureTitle: "Platina Curver ar nu i lager!",
      featureImage: "/images/foretagsdeal.webp",
      featureImageAlt: "Gamingdator for foretagsdeal",
      secondaryTitle: "Veckans Deal - Fa en gava vid kopet!",
      secondaryDescription: "Fa en exklusiv gava nar du handlar hos oss.",
      secondaryBadge: "Gava vid kop",
      secondaryNote: "Musmatta, tangentbord, mus eller uppgraderade komponenter!",
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
            "Vi koper komponenterna och bygger datorn. Byggtiden varierar fran 3 dagar till nagra veckor beroende pa om du bestaller en helt ny dator, en dator med begagnade komponenter eller en custom-bygg. Se FAQ for mer information.",
          icon: "package",
        },
        {
          title: "3. Leverans/hamta upp",
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
  pages: {
    products: {
      banners: {
        default: {
          eyebrow: "Topplistan",
          title: "Basta saljare inom stationara datorer i hela Norden!",
          description: "Utvalda byggen som levererar prestanda, design och trygg service.",
          images: [],
          stickers: [],
        },
        budget: {
          eyebrow: "Budgetvanliga",
          title: "Budget betyder inte daligt",
          description: "Smarta val som haller priset nere utan att tumma pa kanslan.",
          images: [],
          stickers: ["Bast i budget-klass"],
        },
        "best-selling": {
          eyebrow: "Mest for pengarna",
          title: "Mest for pengarna",
          description: "Vara mest prisvarda byggen - noggrant utvalda for maximal valuta.",
          images: [],
          stickers: ["DatorHusets val", "Mest valuta", "Otrolig Prestanda"],
        },
        "price-performance": {
          eyebrow: "Price-Performance",
          title: "Price-Performance",
          description: "Byggen med starkast balans mellan pris och prestanda.",
          images: [],
          stickers: ["Mest for pengarna"],
        },
        toptier: {
          eyebrow: "Basta prestanda",
          title: "Nar bara det snabbaste duger",
          description: "Toppbyggen for dig som vill ha maximal kraft och kompromisslos kvalitet.",
          images: [],
          stickers: ["Topline"],
        },
      },
    },
    serviceRepair: {
      heroEyebrow: "Service & reparation",
      heroTitle: "Vi reparerar, uppgraderar och optimerar din dator",
      heroDescription:
        "DatorHuset hjalper dig med allt fran felsokning till komplett uppgradering. Snabb respons, tydlig offert och service som satter prestanda i fokus.",
      primaryLabel: "Kontakta service",
      primaryHref: "/kundservice",
      secondaryLabel: "Se vara datorer",
      secondaryHref: "/products",
      flowTitle: "Lamna in pa reparation? Borja har.",
      flowDescription: "Vart flode ar byggt for tydlighet och snabbhet. Du vet vad som sker och nar.",
      steps: [
        {
          value: "step-1",
          title: "1. Felsok din enhet",
          body: "Beskriv felet sa noggrant du kan. Vara tekniker analyserar och aterkommer snabbt.",
        },
        {
          value: "step-2",
          title: "2. Godkann offert",
          body: "Vi svarar med rekommendation, prisbild och tidsplan. Du far en tydlig offert innan vi startar. Inga dolda kostnader.",
        },
        {
          value: "step-3",
          title: "3. Service och test",
          body: "Vi reparerar, uppgraderar och stresstestar for att sakerstalla stabilitet.",
        },
        {
          value: "step-4",
          title: "4. Hamta upp eller fa leverans",
          body: "Vi meddelar nar din dator ar klar. Valj hamtning eller leverans. Se instruktioner i Mina bestallningar.",
        },
        {
          value: "step-5",
          title: "5. Efterservice",
          body: "Behov av finjustering? Vi finns kvar for support och tips.",
        },
      ],
      formTitle: "Beskriv ditt problem",
      formDescription: "Fyll i formularet sa kan vi snabbare hjalpa dig ratt. Ju mer detaljer, desto battre offert.",
    },
    customerService: {
      heroEyebrow: "Kundservice",
      heroTitle: "Kontakta oss",
      heroDescription: "Behöver du hjälp med en beställning, service eller garanti? Vi svarar snabbt med tydliga besked.",
      heroCtaLabel: "Se FAQ",
      heroCtaHref: "/faq",
      contactTitle: "Kontaktuppgifter",
      contactEmail: "support@datorhuset.site",
      hoursTitle: "Oppettider",
      hoursLines: ["Svarstider pa mejl: 11:00 - 03:00", "Vi svarar pa mejl bade under vardagar och helger."],
      supportTitle: "Supportarenden",
      supportLines: [
        "For fragor om bestallningar, returer eller fakturor: ange ordernummer och beskriv arendet kort.",
        "Teknisk support: beskriv problemet, vilka komponenter som anvands och bifoga bilder om mojligt.",
      ],
      commonIssuesTitle: "Vanliga arenden",
      commonIssues: [
        "Orderstatus, leveranstider och sparning",
        "Andringar i bestallning eller uppgraderingar",
        "Garantifragor och reklamation",
        "Felsokning, service och reparation",
        "Foretagslosningar och faktura",
      ],
      commonIssuesNote: "Vi aterkommer normalt inom 24 timmar pa vardagar.",
      workflowTitle: "Sa arbetar vi",
      workflowSteps: [
        "Du beskriver ditt arende via mail eller formular.",
        "Vi aterkommer med fragor eller forslag.",
        "Du far en tydlig offert och tidsplan.",
        "Vi uppdaterar dig nar arbetet ar klart.",
      ],
      workflowCtaLabel: "Starta servicearende",
      workflowCtaHref: "/service-reparation",
    },
  },
};
