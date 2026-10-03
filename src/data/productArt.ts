/*
 * Platshållarbilder tills byggena är fotograferade.
 *
 * Tecknade datorer utan bakgrund, ritade av
 * scripts/generate-pc-placeholders.mjs. Belysningens färg i varje bild
 * matchar glow nedanför. När ett riktigt foto finns: byt cutout mot
 * fotot, och ta bort platshållaren när ingen produkt längre använder den.
 */
const placeholder = (name: string) => `/products/placeholders/${name}.svg`;

/**
 * Den svävande datorn och dess egen bakgrund, per maskin.
 *
 * FRILÄGGNINGEN
 *
 * Produktfotona är tagna i rum och går inte att frilägga maskinellt -
 * det är provat. Översvämningsfyllning från kanten fungerar på ett
 * studiofoto men inte här: chassina har glaspanel, så rummet syns rakt
 * igenom dem och bakgrunden hänger ihop med sig själv genom datorn.
 * Ingen tröskel i världen skiljer dem åt.
 *
 * Men frilagda bilder fanns redan. images/*.png som nivåavsnittet på
 * startsidan visar är rena urklipp av precis de här chassina - samma
 * Montech, samma Chieftec, samma CG530, samma vita Lian Li. De var
 * gjorda för startsidan och används nu här också.
 *
 * Kopplingen går på CHASSI och inte på nivå. Två datorer kan ligga i
 * olika prisklass och ändå vara byggda i samma låda, och det är lådan
 * bilden visar.
 *
 * BAKGRUNDEN
 *
 * Varje maskin får en egen duk, byggd av dess egna kulörer - Montechen
 * lyser blått och rosa, CG530 rött, den vita Lian Li:n stål och cyan.
 * Duken ritas i ProductBackdrop och är alltså ingen bildfil, så den
 * kostar ingenting att ladda och skalar till vilken skärm som helst.
 *
 * SAKNAS EN MASKIN HÄR visas fotot i stället, och då utan
 * svävningseffekten. Så här lägger du till en:
 *
 *   1. Frilägg bilden - remove.bg tar någon minut och är gratis.
 *   2. Lägg PNG:en i images/ och importera den överst i den här filen.
 *   3. Lägg till en rad i PRODUCT_ART med datorns id.
 */

/**
 * Två sorters duk.
 *
 *   aura    Toning med ett ljus bakom datorn och stoft som driver
 *           uppåt. Duger till det mesta och kostar ingenting.
 *
 *   studio  En fotostudio: en stor, mjukt lyst rund skiva mot en mörk
 *           fond, ett golv som ljuset spiller ned på, och en kraftig
 *           vinjett. Det är formen produktbilder av den här sorten
 *           faktiskt fotograferas i, och den ger ett helt annat allvar
 *           än en toning - men den kräver att datorn står mitt i
 *           skivan, så den passar bara maskiner med urklipp.
 */
export type BackdropKind = "aura" | "studio";

export type ProductArt = {
  /** Frilagd bild av chassit. Utelämnad = fotot visas i stället. */
  cutout?: string;
  backdrop: {
    /** Utelämnad = "aura". */
    kind?: BackdropKind;
    /** Fondens toning, uppifrån och ned. */
    from: string;
    to: string;
    /** Ljuset bakom datorn, och stoftets kulör i aura-läget. */
    glow: string;

    /* Bara för studio ------------------------------------------- */

    /** Skivans mitt, där ljuset är starkast. */
    disc?: string;
    /** Skivans ytterkant, dit ljuset faller av. */
    discEdge?: string;
    /**
     * Bordsskivan.
     *
     * Ska vara LJUSARE än fondens nedre del. Sätts den lika mörk
     * försvinner planet - man ser en kant högst upp och sedan
     * ingenting, och datorn ser ut att hänga framför fonden i stället
     * för att stå på något.
     */
    floor?: string;
  };
};

/*
 * Nycklarna är datorernas id ur src/data/computers.ts.
 *
 * Kulörerna är avlästa ur respektive foto, inte valda fritt. Duken ska
 * se ut som rummet maskinen står i, annars läser ögat den som en
 * tapet någon råkat lägga bakom.
 */
export const PRODUCT_ART: Record<string, ProductArt> = {
  // Silver-Speedster - Montech, blå kabinettbelysning med rosa fläktar
  "2": {
    cutout: placeholder("abyss"),
    backdrop: { from: "#12203f", to: "#2b1740", glow: "#4f8ff7" },
  },

  // Guld-Inferno - Chieftec Visio, lila och grönt
  "3": {
    cutout: placeholder("aurora"),
    backdrop: { from: "#1b1033", to: "#2d0f3d", glow: "#a855f7" },
  },

  // Glimmrande Guldigaspiken - samma chassi som Guld-Inferno
  "5": {
    cutout: placeholder("neon"),
    backdrop: { from: "#1d1236", to: "#122b2e", glow: "#22d3ee" },
  },

  /*
   * Platina-maskinerna står i studio.
   *
   * Båda är samma röda CG530, och den tål ljuset: ett svart chassi med
   * röda fläktar mot en varm, rödlyst skiva är precis den bild
   * tillverkarna själva tar. Kulörerna är avlästa ur förlagan - laxrött
   * i skivans mitt, mörkt vinrött i kanten, och en bordsskiva i ett
   * avmättat grålila som ligger ljusare än fondens nederkant.
   *
   * De två skiljs bara åt av skivans temperatur. Sleeper har förlagans
   * varma lax; Frostbyte drar mot djupare karmosin. Samma studio, olika
   * lampa - som två bilder ur samma fotografering.
   */
  "7": {
    cutout: placeholder("ember"),
    backdrop: {
      kind: "studio",
      from: "#241315",
      to: "#140b0d",
      glow: "#f2555a",
      disc: "#e0938c",
      discEdge: "#6e3630",
      floor: "#453c42",
    },
  },

  "9": {
    cutout: placeholder("crimson"),
    backdrop: {
      kind: "studio",
      from: "#1f1218",
      to: "#110a0e",
      glow: "#e8465c",
      disc: "#d2757f",
      discEdge: "#5c2b38",
      floor: "#413840",
    },
  },

  /*
   * All Black, All Out saknar urklipp.
   *
   * Chassit är en svart Lian Li och inget av urklippen föreställer
   * den. Att visa ett annat chassi hade varit att sälja en dator med
   * bild på en annan, så den får sitt foto och sin duk men ingen
   * svävande bild förrän någon friläggt den.
   */
  "10": {
    cutout: placeholder("sky"),
    backdrop: { from: "#0e1726", to: "#101a2c", glow: "#38bdf8" },
  },

  // All White, All Out - vit Lian Li
  "11": {
    cutout: placeholder("glacier"),
    backdrop: { from: "#1b2436", to: "#0f1b2b", glow: "#7dd3fc" },
  },
};

/** Reservduk för produkter som inte står i listan. */
export const DEFAULT_PRODUCT_ART: ProductArt = {
  cutout: placeholder("default"),
  backdrop: { from: "#181233", to: "#150f26", glow: "#3FD9F5" },
};

export const getProductArt = (id?: string | null): ProductArt =>
  (id ? PRODUCT_ART[id] : undefined) ?? DEFAULT_PRODUCT_ART;
