import { repairMojibakeValue } from "./repairMojibake.js";

export const SITE_SETTINGS_VERSION = 6;

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

export const DEFAULT_SITE_SETTINGS = repairMojibakeValue({
  version: SITE_SETTINGS_VERSION,
  site: {
    /*
     * Färgerna kommer från BRAND.md: cyan #3FD9F5 och plommon #B26BDE mot
     * märkessvart #0C0D14. Cyan används i sin mörkare variant på ljus
     * bakgrund, annars syns den inte mot vitt.
     *
     * Den gamla gula (#facc15) och teal (#11667b) hörde till logotypen
     * före omritningen och hänger inte ihop med märket längre.
     */
    theme: {
      primaryColor: "#1BA8C4",
      primaryTextColor: "#ffffff",
      accentColor: "#6E2B92",
      accentTextColor: "#ffffff",
      pageBackground: "#ffffff",
      pageBackgroundDark: "#15101F",
      surfaceBackground: "#ffffff",
      surfaceBackgroundDark: "#1E1830",
      mutedBackground: "#F2F2F7",
      mutedBackgroundDark: "#1A1428",
      cardBackground: "#ffffff",
      cardBackgroundDark: "#1E1830",
      cardBorderColor: "#E4E4EC",
      cardBorderColorDark: "#302845",
      textColor: "#0C0D14",
      textColorDark: "#EFECF7",
      mutedTextColor: "#55555F",
      mutedTextColorDark: "#ABA3C2",
      heroImageFrameBackground: "#F2F2F7",
      sectionRadiusPx: 18,
      panelRadiusPx: 28,
      sectionPaddingY: 80,
      contentMaxWidthPx: 1280,
    },
    navigation: {
      brandName: "DatorHuset",
      logoUrl: "/datorhuset-mark-small.png",
      menuLabel: "Meny",
      searchPlaceholder: "Sök bland produkter, komponenter och kategorier",
      adminPortalHref: "https://admin.datorhuset.se",
      menuItems: [
        { label: "Alla produkter", href: "/products" },
        { label: "Custom Bygg", href: "/custom-bygg" },
        { label: "Service & Reparation", href: "/service-reparation" },
        { label: "Kundservice & Kontakta oss", href: "/kundservice" },
      ],
    },
    footer: {
      supportTitle: "Kundservice",
      supportEmail: "support@datorhuset.se",
      supportHours: "Svarstider 11:00-3:00",
      logoUrl: "/datorhuset-mark-small.png",
      // Kolumnerna är hjälp och sortiment. Villkoren hör inte hit - de
      // ligger i nedre raden, så kolumnerna handlar om vad besökaren vill
      // göra och inte om juridik.
      columns: [
        {
          title: "Hjälp",
          links: [
            { label: "Kundservice", href: "/kundservice" },
            { label: "Vanliga frågor", href: "/faq" },
            { label: "Service & reparation", href: "/service-reparation" },
            { label: "Mina ordrar", href: "/orders" },
          ],
        },
        {
          title: "Utforska",
          links: [
            { label: "Våra datorer", href: "/products" },
            { label: "Custom bygg", href: "/custom-bygg" },
            { label: "Om oss", href: "/about" },
          ],
        },
      ],
      legalLinks: [
        { label: "Allmänna villkor", href: "/terms-of-service" },
        { label: "Integritetspolicy", href: "/privacy-policy" },
        { label: "Ångerrätt och returer", href: "/angerratt-och-returer" },
      ],
      socialLinks: [
        { platform: "instagram", label: "Instagram", href: "https://www.instagram.com/datorhuset_uf/" },
        { platform: "x", label: "X", href: "https://x.com/DatorHuset_UF" },
        { platform: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@datorhuset_uf?lang=en-GB" },
        { platform: "youtube", label: "YouTube", href: "https://www.youtube.com/@DatorHuset" },
      ],
      copyright: "©2026 DatorHuset. Alla rättigheter förbehållna.",
    },
    motion: {
      heroRevealDurationMs: 720,
      heroRevealStaggerMs: 120,
      bannerRevealDurationMs: 680,
      bannerRevealDistancePx: 18,
      cardHoverScale: 1.03,
    },
  },
  homepage: {
    hero: {
      title: "Veckans bygg!",
      subtitle: "Elektronik för företag",
      featureEyebrow: "Nyhet!",
      featureTitle: "Platina Curver är nu i lager!",
      featureImage: "/images/foretagsdeal.webp",
      featureImageAlt: "Gamingdator för företagserbjudande",
      secondaryTitle: "Veckans deal - få en gåva vid köpet!",
      secondaryDescription: "Få en exklusiv gåva när du handlar hos oss.",
      secondaryBadge: "Gåva vid köp",
      secondaryNote: "Musmatta, tangentbord, mus eller uppgraderade komponenter!",
      categoriesTitle: "Populära kategorier",
      categories: [
        { name: "Alla produkter", icon: "monitor", href: "/products?clear_filters=1" },
        { name: "Budgetvänliga", icon: "wallet", href: "/products?category=budget&clear_filters=1" },
        { name: "Pris/prestanda", icon: "badge-percent", href: "/products?category=price-performance&clear_filters=1" },
        { name: "Custom Bygg", icon: "hammer", href: "/custom-bygg" },
        { name: "Bästa prestanda", icon: "rocket", href: "/products?category=toptier&clear_filters=1" },
      ],
      featuredTitle: "Senast visade produkter",
      featuredCount: 6,
      featuredInventoryLabel: "I lager",
    },
    steps: {
      eyebrow: "Så kör vi",
      title: "Hur DatorHuset kör",
      description:
        "Varje dator byggs för hand, testas och packas av oss. Handlar du här ska det kännas tryggt hela vägen - före, under och efter köpet.",
      primaryLabel: "Köp din dator",
      primaryHref: "/products",
      secondaryLabel: "Gör en custom bygg",
      secondaryHref: "/custom-bygg",
      items: [
        {
          title: "14 dagars ångerrätt",
          description: "Vid frakt",
          icon: "refresh-euro",
        },
        {
          title: "Reklamera inom 3 år",
          description: "Enligt konsumentköplagen",
          icon: "shield",
        },
        {
          title: "Byggda av proffs",
          description: "För hand, i Spånga",
          icon: "hammer",
        },
        {
          title: "Bästa priserna",
          description: "På marknaden",
          icon: "badge-percent",
        },
      ],
    },
    promo: {
      eyebrow: "Mer från DatorHuset",
      title: "Vi bygger, fixar och optimerar för dig",
      description:
        "Välj service om du vill få din dator tillbaka i toppform eller bygg ett helt nytt system från grunden.",
      cards: [
        {
          eyebrow: "Service & reparation",
          title: "Vi får din dator tillbaka i toppform",
          description:
            "Snabb felsökning, tydlig offert och proffsig optimering. Vi tar hand om allt från prestandaproblem till uppgraderingar.",
          image: "/products/newpc/cg530_new.png",
          imageAlt: "Service och reparation av datorer",
          bullets: [
            "Felsökning inom 24 timmar på vanliga fel",
            "Rengöring, kylning och stabilitetstester",
            "Garanti på utfört arbete och uppgraderingar",
          ],
          primaryLabel: "Service & reparation",
          primaryHref: "/service-reparation",
          secondaryLabel: "Fråga en tekniker",
          secondaryHref: "/kundservice",
        },
        {
          eyebrow: "Custom bygg",
          title: "Byggd för din vardag och din gaming",
          description:
            "Välj komponenter, stil och budget. Vi bygger, testar och levererar en dator som är helt anpassad efter dig.",
          image: "/products/newpc/allwhite-1.jpg",
          imageAlt: "Custom byggda datorer",
          bullets: [
            "Välj prestandanivå, formfaktor och RGB",
            "Optimerade för gaming, kreativt arbete eller AI",
            "Trygg leverans med test och verifiering",
          ],
          primaryLabel: "Gå till custom bygg",
          primaryHref: "/custom-bygg",
          secondaryLabel: "Se färdiga datorer",
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
          title: "Bästa säljare inom stationära datorer i hela Norden!",
          description: "Utvalda byggen som levererar prestanda, design och trygg service.",
          images: [],
          stickers: [],
          primaryLabel: "Se alla datorer",
          primaryHref: "/products",
          secondaryLabel: "Custom bygg",
          secondaryHref: "/custom-bygg",
        },
        budget: {
          eyebrow: "Budgetvänliga",
          title: "Budget betyder inte dåligt",
          description: "Smarta val som håller priset nere utan att tumma på känslan.",
          images: [],
          stickers: ["Bäst i budgetklass"],
          primaryLabel: "Se budgetdatorer",
          primaryHref: "/products?category=budget&clear_filters=1",
          secondaryLabel: "Fråga oss",
          secondaryHref: "/kundservice",
        },
        "best-selling": {
          eyebrow: "Mest för pengarna",
          title: "Mest för pengarna",
          description: "Våra mest prisvärda byggen - noggrant utvalda för maximal valuta.",
          images: [],
          stickers: ["DatorHusets val", "Mest valuta", "Otrolig prestanda"],
          primaryLabel: "Se favoriterna",
          primaryHref: "/products?category=best-selling&clear_filters=1",
          secondaryLabel: "Custom bygg",
          secondaryHref: "/custom-bygg",
        },
        "price-performance": {
          eyebrow: "Pris/prestanda",
          title: "Pris/prestanda",
          description: "Byggen med starkast balans mellan pris och prestanda.",
          images: [],
          stickers: ["Mest för pengarna"],
          primaryLabel: "Se pris/prestanda",
          primaryHref: "/products?category=price-performance&clear_filters=1",
          secondaryLabel: "Jämför alternativ",
          secondaryHref: "/kundservice",
        },
        toptier: {
          eyebrow: "Bästa prestanda",
          title: "När bara det snabbaste duger",
          description: "Toppbyggen för dig som vill ha maximal kraft och kompromisslös kvalitet.",
          images: [],
          stickers: ["Topline"],
          primaryLabel: "Se toppmodeller",
          primaryHref: "/products?category=toptier&clear_filters=1",
          secondaryLabel: "Bygg din egen",
          secondaryHref: "/custom-bygg",
        },
      },
    },
    serviceRepair: {
      heroEyebrow: "Service & reparation",
      heroTitle: "Vi reparerar, uppgraderar och optimerar din dator",
      heroDescription:
        "DatorHuset hjälper dig med allt från felsökning till komplett uppgradering. Snabb respons, tydlig offert och service som sätter prestanda i fokus.",
      primaryLabel: "Kontakta service",
      primaryHref: "/kundservice",
      secondaryLabel: "Se våra datorer",
      secondaryHref: "/products",
      flowTitle: "Lämna in på reparation? Börja här.",
      flowDescription: "Vårt flöde är byggt för tydlighet och snabbhet. Du vet vad som sker och när.",
      steps: [
        {
          value: "step-1",
          title: "1. Felsök din enhet",
          body: "Beskriv felet så noggrant du kan. Våra tekniker analyserar och återkommer snabbt.",
        },
        {
          value: "step-2",
          title: "2. Godkänn offert",
          body: "Vi svarar med rekommendation, prisbild och tidsplan. Du får en tydlig offert innan vi startar. Inga dolda kostnader.",
        },
        {
          value: "step-3",
          title: "3. Service och test",
          body: "Vi reparerar, uppgraderar och stresstestar för att säkerställa stabilitet.",
        },
        {
          value: "step-4",
          title: "4. Hämta upp eller få leverans",
          body: "Vi meddelar när din dator är klar. Välj hämtning eller leverans. Se instruktioner i Mina beställningar.",
        },
        {
          value: "step-5",
          title: "5. Efterservice",
          body: "Behov av finjustering? Vi finns kvar för support och tips.",
        },
      ],
      formTitle: "Beskriv ditt problem",
      formDescription: "Fyll i formuläret så kan vi snabbare hjälpa dig rätt. Ju mer detaljer, desto bättre offert.",
    },
    customerService: {
      heroEyebrow: "Kundservice",
      heroTitle: "Kontakta oss",
      heroDescription: "Behöver du hjälp med en beställning, service eller garanti? Vi svarar snabbt med tydliga besked.",
      heroImage: "/Datorhuset.png",
      heroImageAlt: "DatorHuset logo",
      heroCtaLabel: "Se FAQ",
      heroCtaHref: "/faq",
      contactTitle: "Kontaktuppgifter",
      contactEmail: "support@datorhuset.se",
      hoursTitle: "Öppettider",
      hoursLines: ["Svarstider på mejl: 11:00 - 03:00", "Vi svarar på mejl både under vardagar och helger."],
      supportTitle: "Supportärenden",
      supportLines: [
        "För frågor om beställningar, returer eller fakturor: ange ordernummer och beskriv ärendet kort.",
        "Teknisk support: beskriv problemet, vilka komponenter som används och bifoga bilder om möjligt.",
      ],
      commonIssuesTitle: "Vanliga ärenden",
      commonIssues: [
        "Orderstatus, leveranstider och spårning",
        "Ändringar i beställning eller uppgraderingar",
        "Garantifrågor och reklamation",
        "Felsökning, service och reparation",
        "Företagslösningar och faktura",
      ],
      commonIssuesNote: "Vi återkommer normalt inom 24 timmar på vardagar.",
      workflowTitle: "Så arbetar vi",
      workflowSteps: [
        "Du beskriver ditt ärende via mejl eller formulär.",
        "Vi återkommer med frågor eller förslag.",
        "Du får en tydlig offert och tidsplan.",
        "Vi uppdaterar dig när arbetet är klart.",
      ],
      workflowCtaLabel: "Starta serviceärende",
      workflowCtaHref: "/service-reparation",
    },
    faq: {
      heroEyebrow: "FAQ",
      heroTitle: "Vanliga frÃ¥gor och svar",
      heroDescription: "HÃ¤r hittar du svar pÃ¥ de vanligaste frÃ¥gorna om bestÃ¤llning, leverans och service.",
      heroImage: "/Datorhuset.png",
      heroImageAlt: "DatorHuset logo",
      items: [
        {
          question: "Hur lång leveranstid har ni?",
          answer: "Datorer som står färdiga i lager skickas normalt inom 3-5 arbetsdagar. Förbeställningar tar längre tid eftersom datorn byggs efter att du har beställt - se frågan om förbeställning nedan.",
        },
        {
          question: "Vad innebär förbeställning?",
          answer: "Förbeställning betyder att vi inte har datorn färdigbyggd i lager just nu. Vi beställer in delarna, bygger och testar den, och skickar den så snart den är klar.",
        },
        {
          question: "Hur lång tid tar en förbeställning?",
          answer: "En förbeställning skickas normalt inom 5-10 dagar. Innehåller datorn en begagnad del kan det ta upp till två veckor innan den skickas. Det står alltid i annonsen om en dator har begagnade delar.",
        },
        {
          question: "Använder ni begagnade delar?",
          answer: "Ibland, i vissa förbeställningar. Det är alltid tydligt märkt i annonsen, så du vet vad du köper innan du beställer. Begagnade delar testas precis som nya innan datorn skickas.",
        },
        {
          question: "Vad kostar frakten?",
          answer: "Frakten kostar 345 kr per order. Du ser alltid den totala kostnaden i kassan innan du betalar. Vill du hellre hämta datorn själv går det att göra hos oss i Spånga.",
        },
        {
          question: "Skickar ni utanför Sverige?",
          answer: "Inte just nu. Vi skickar bara till adresser inom Sverige.",
        },
        {
          question: "Vilka betalmetoder accepterar ni?",
          answer: "Kort, PayPal, Google Pay och Klarna via vår betalningslösning.",
        },
        {
          question: "Ingår Windows?",
          answer: "Ja. Datorn levereras med Windows 11 installerat och aktiverat, så den är klar att använda direkt när du packat upp den.",
        },
        {
          question: "Testas datorn innan den skickas?",
          answer: "Ja, varje dator stresstestas innan den lämnar oss, så att vi vet att alla delar fungerar som de ska.",
        },
        {
          question: "Kan jag avbryta eller ändra min order?",
          answer: "Kontakta oss så snabbt som möjligt. Om ordern inte har skickats kan vi oftast justera den.",
        },
        {
          question: "Kan jag ångra mitt köp?",
          answer: "Ja, du har 14 dagars ångerrätt från den dag du tog emot datorn. Datorer som byggs efter dina egna val i Custom Bygg är undantagna, eftersom de tillverkas specifikt för dig. Allt om hur en retur går till står på sidan Ångerrätt och returer.",
        },
        {
          question: "Vad gäller om något är fel på datorn?",
          answer: "Du har tre års reklamationsrätt från leveransdagen. Hör av dig till oss så felsöker vi tillsammans och reparerar eller byter ut det som är trasigt. Du behöver inte själv hålla reda på vilken tillverkares garanti som gäller - den kontakten sköter vi.",
        },
        {
          question: "Kan jag uppgradera datorn senare?",
          answer: "Ja, du kan lämna in datorn hos oss för uppgradering mot en avgift. Har du redan komponenten med dig tar det allt från några timmar upp till två dagar. Behöver vi beställa in delen kan det ta upp till en vecka, men ibland har vi den i lager och kan göra uppgraderingen inom en eller två dagar. Mejla oss vad du vill uppgradera så får du ett exakt pris och en tidsuppskattning.",
        },
        {
          question: "Hur fungerar service och reparation?",
          answer: "Beskriv problemet via kundservice så återkommer vi med offert, tidsplan och instruktioner.",
        },
        {
          question: "Kan jag få rådgivning innan köp?",
          answer: "Absolut. Vi hjälper dig att välja rätt dator efter behov och budget.",
        },
      ],
    },
    about: {
      heroEyebrow: "Om oss",
      heroTitle: "DatorHuset",
      heroDescription: "Vi bygger och sÃ¤ljer stationÃ¤ra datorer fÃ¶r gaming, kreativa flÃ¶den och professionellt arbete.",
      heroImage: "/Datorhuset.png",
      heroImageAlt: "DatorHuset logo",
      primaryLabel: "Se vÃ¥ra datorer",
      primaryHref: "/products",
      secondaryLabel: "Kontakta oss",
      secondaryHref: "/kundservice",
      storyTitle: "VÃ¥r historia",
      storyParagraphs: [
        "DatorHuset startade som ett skolprojekt med en enkel idÃ©: gÃ¶ra det lÃ¤ttare att hitta rÃ¤tt dator utan krÃ¥ngliga specifikationer.",
        "Idag hjÃ¤lper vi kunder att vÃ¤lja, bygga och optimera datorer fÃ¶r gaming, kreativa flÃ¶den och professionellt arbete.",
      ],
      valuesTitle: "Det vi stÃ¥r fÃ¶r",
      valueCards: [
        {
          title: "Tydlighet",
          description: "Du ska alltid fÃ¶rstÃ¥ vad du fÃ¥r, varfÃ¶r det passar dig och vad det kostar.",
        },
        {
          title: "Prestanda",
          description: "Vi fokuserar pÃ¥ rÃ¤tt komponenter och optimal balans fÃ¶r ditt anvÃ¤ndningsomrÃ¥de.",
        },
        {
          title: "Service",
          description: "Snabba svar, tydliga offerter och uppfÃ¶ljning nÃ¤r du behÃ¶ver oss.",
        },
      ],
      galleryTitle: "Byggen frÃ¥n oss",
      galleryImages: [
        { url: "/products/newpc/allblack-main.jpg", alt: "DatorHuset premiumbygge" },
        { url: "/products/newpc/allwhite-1.jpg", alt: "DatorHuset gamingdator" },
        { url: "/products/newpc/cg530_new.png", alt: "DatorHuset kompakt dator" },
      ],
      promiseTitle: "VÃ¥rt lÃ¶fte",
      promiseItems: [
        "Personlig rÃ¥dgivning anpassad efter dina behov",
        "Tydliga offerter utan dolda kostnader",
        "Snabb leverans och trygg support",
        "HjÃ¤lp med uppgraderingar nÃ¤r du vÃ¤xer",
      ],
      socialTitle: "FÃ¶lj oss",
      socialDescription: "HÃ¥ll koll pÃ¥ nya byggen, erbjudanden och uppdateringar.",
    },
    privacyPolicy: {
      heroEyebrow: "Integritet",
      heroTitle: "Integritetspolicy",
      heroDescription: "LÃ¤s hur DatorHuset hanterar personuppgifter, bestÃ¤llningsdata och kundkommunikation.",
      heroImage: "/Datorhuset.png",
      heroImageAlt: "DatorHuset logo",
      updatedAt: "2026-02-08",
      bodyText: "",
    },
    termsOfService: {
      heroEyebrow: "Villkor",
      heroTitle: "AllmÃ¤nna villkor",
      heroDescription: "LÃ¤s igenom vÃ¥ra villkor fÃ¶r kÃ¶p, leverans och service hos DatorHuset.",
      heroImage: "/Datorhuset.png",
      heroImageAlt: "DatorHuset logo",
      updatedAt: "2026-02-08",
      bodyText: "",
    },
  },
});
