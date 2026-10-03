import type { ReactNode } from "react";

import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { AmbientBackground } from "./AmbientBackground";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildSiteThemeVars } from "@/lib/siteTheme";

/**
 * Ramen kring varje sida: tema, levande bakgrund, navbar och sidfot.
 *
 * Tidigare byggde varje sida sin egen ram, och de hade dragit isär.
 * Startsidan hade den genomgående lila duken medan kassan, varukorgen
 * och kontosidorna satt kvar på en hårdkodad blågrå ton från innan
 * märkets färger byttes - det var alltså inte en fråga om olika stil
 * utan om två olika färgscheman i samma butik. Flera sidor ritade
 * dessutom navbar och sidfot en gång per tillstånd, så laddning, fel
 * och färdigt läge var tre nästan lika kopior som hann glida isär.
 *
 * Nu finns ramen på ett ställe. Sidorna lämnar in sitt innehåll och
 * behöver inte känna till vare sig duken eller bakgrunden.
 *
 * Bakgrunden ligger fast mot fönstret bakom allt, så innehållet måste
 * ligga i ett eget lager ovanpå - därav z-10 på main.
 */

type PageShellProps = {
  children: ReactNode;
  /**
   * Sådant som ska stå i sidhuvudet snarare än i flödet: SeoHead,
   * SeoJsonLd och liknande. Ligger före allt annat och syns inte.
   */
  head?: ReactNode;
  /** Extra klasser på main, för sidor som behöver egen rytm. */
  className?: string;
  /**
   * Enfärgad duk i stället för temat och den levande bakgrunden.
   * Informationssidorna använder den - där ska ingenting röra sig
   * bakom texten.
   */
  background?: string;
};

/** Duken på informationssidorna (kundservice, FAQ, villkor): nästan svart
    med en dragning åt lila, så de täta panelerna ovanpå syns mot den. */
export const INFO_PAGE_BACKGROUND = "#0f0b16";

export const PageShell = ({ children, head, className = "", background }: PageShellProps) => {
  const { settings } = useSiteSettings();
  const themeVars = buildSiteThemeVars(settings.site.theme);

  return (
    <div
      data-sandbox-id="global-theme"
      /* backgroundImage nollas också: duken har annars tre ljus i
         index.css som lägger sig ovanpå kulören. */
      style={
        background
          ? { ...themeVars, backgroundColor: background, backgroundImage: "none" }
          : themeVars
      }
      className="flex min-h-screen flex-col bg-[var(--site-page-bg)] text-[var(--site-text-primary)] transition-colors dark:bg-[var(--site-page-bg-dark)] dark:text-[var(--site-text-primary-dark)]"
    >
      {head}
      {!background && <AmbientBackground />}
      <Navbar />
      <main className={`relative z-10 flex-1 ${className}`}>{children}</main>
      <Footer />
    </div>
  );
};

export default PageShell;
