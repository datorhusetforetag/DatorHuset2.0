import aboutBanner from "../../images/banners/about.jpg";
import customBuildBanner from "../../images/banners/custombuild.jpg";
import faqBanner from "../../images/banners/faq.jpg";
import legalBanner from "../../images/banners/legal.jpg";
import productsBanner from "../../images/banners/products.jpg";
import serviceBanner from "../../images/banners/service.jpg";
import supportBanner from "../../images/banners/support.jpg";

/**
 * Bild och kulör för varje undersidas banderoll, på ett ställe.
 *
 * Sidorna skulle annars importera sitt eget foto och skriva sin egen
 * hexkod, och då hade de glidit isär på samma sätt som ramarna gjorde
 * innan PageShell fanns. Nu står paren här, och en sida som vill byta
 * utseende ändrar en rad.
 *
 * KULÖRERNA är inte valda fritt. De är samma fyra som nivåerna på
 * startsidan använder, och de är fördelade efter vad sidan gör:
 *
 *   cyan   (#3FD9F5)  allt som handlar om att köpa något
 *   plommon(#B26BDE)  allt som handlar om att bygga eller laga
 *   guld   (#E3A567)  hjälp och kontakt
 *   grönt  (#7FD98F)  det som redan är klart - order, konto, kvitto
 *   grått  (#9BA3B8)  villkor och policy, som inte ska ropa
 *
 * Man ser inte systemet medvetet, men två sidor som gör samma sak får
 * samma kulör, och det gör att butiken hänger ihop när man klickar sig
 * runt i den.
 *
 * FOTONA ÄR PLATSHÅLLARE. Fria bilder från Unsplash, inte våra egna
 * datorer. Byt filen i images/banners/ så följer resten med - inget
 * annat behöver ändras.
 *
 *   about.jpg        Unsplash, foto 1591238372338  öppet chassi på bänk
 *   custombuild.jpg  Unsplash, foto 1632749042303  moderkort med fläktar
 *   faq.jpg          Unsplash, foto 1632079003110  tangentbord ovanifrån
 *   legal.jpg        Unsplash, foto 1518770660439  kretskort på nära håll
 *   products.jpg     Unsplash, foto 1614179924047  skärm mot blå vägg
 *   service.jpg      Unsplash, foto 1618764400608  grafikkort i chassi
 *   support.jpg      Unsplash, foto 1629102981237  dator vid skrivbord
 */

export const BANNER_ACCENTS = {
  buy: "#3FD9F5",
  build: "#B26BDE",
  help: "#E3A567",
  done: "#7FD98F",
  legal: "#9BA3B8",
} as const;

export type PageBanner = {
  image?: string;
  accent: string;
};

export const PAGE_BANNERS = {
  products: { image: productsBanner, accent: BANNER_ACCENTS.buy },
  customBuild: { image: customBuildBanner, accent: BANNER_ACCENTS.build },
  service: { image: serviceBanner, accent: BANNER_ACCENTS.build },
  about: { image: aboutBanner, accent: BANNER_ACCENTS.build },
  support: { image: supportBanner, accent: BANNER_ACCENTS.help },
  faq: { image: faqBanner, accent: BANNER_ACCENTS.help },
  legal: { image: legalBanner, accent: BANNER_ACCENTS.legal },

  /* Utan foto: transaktionssidorna. Se kommentaren i PageHero. */
  cart: { accent: BANNER_ACCENTS.buy },
  checkout: { accent: BANNER_ACCENTS.buy },
  receipt: { accent: BANNER_ACCENTS.done },
  account: { accent: BANNER_ACCENTS.done },
  orders: { accent: BANNER_ACCENTS.done },
  search: { accent: BANNER_ACCENTS.buy },
} satisfies Record<string, PageBanner>;
