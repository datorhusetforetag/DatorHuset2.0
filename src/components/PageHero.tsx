import type { ReactNode } from "react";

import { Reveal } from "./Reveal";

/**
 * Sidhuvudet på en undersida, i startsidans språk.
 *
 * Förlagan var ett massivt färgblock i märkets kulör, med rubriken till
 * vänster och logotypen i en grå ruta till höger. Två saker var fel med
 * det. Blocket satte en hård kant tvärs över sidan, vilket är precis det
 * startsidan gjorde sig av med när duken blev genomgående. Och rutan till
 * höger innehöll nästan alltid bara logotypen, alltså en bild som inte
 * berättade något - den tog en tredjedel av första skärmen för att visa
 * något besökaren redan såg i navbaren.
 *
 * Nu står texten ensam på duken, och den får i stället ta plats: samma
 * stora Orbitron-rubrik som avsnitten på startsidan, med ögonbrynet över
 * och ingressen under.
 *
 * Under ingressen ligger en kort linje i märkets cyan. Den gör två
 * saker - markerar var texten slutar nu när det inte finns någon
 * blockkant som gör det, och knyter ihop undersidorna med varandra.
 */

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  lede?: string;
  /** Knappar eller länkar under ingressen. */
  actions?: ReactNode;
  /** Sällsynt: något som faktiskt är värt en halv skärm, till höger. */
  aside?: ReactNode;
  sandboxId?: string;
};

export const PageHero = ({
  eyebrow,
  title,
  lede,
  actions,
  aside,
  sandboxId,
}: PageHeroProps) => (
  <section data-sandbox-id={sandboxId} className="relative">
    <div className="container mx-auto px-4 pb-12 pt-14 sm:pb-16 sm:pt-20 lg:pt-24">
      <div
        className={
          aside
            ? "grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]"
            : undefined
        }
      >
        <Reveal className="max-w-3xl">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}

          <h1 className="section-title mt-3 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          {lede && (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {lede}
            </p>
          )}

          <span
            aria-hidden="true"
            className="mt-8 block h-px w-24 bg-primary/70"
          />

          {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
        </Reveal>

        {aside && <Reveal delay={90}>{aside}</Reveal>}
      </div>
    </div>
  </section>
);

export default PageHero;
