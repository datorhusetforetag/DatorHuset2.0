import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";

import { Reveal } from "./Reveal";

/**
 * Banderollen överst på en undersida.
 *
 * Den har gått igenom tre former. Först ett massivt färgblock med
 * logotypen i en grå ruta bredvid rubriken, sedan bara text på duken.
 * Blocket satte en hård kant tvärs över sidan; texten ensam var ärlig
 * men platt - varje undersida började likadant, och ingenting sa vilken
 * sida man hade kommit till förrän man läste rubriken.
 *
 * Nu ligger ett fotografi bakom, och det är fotot som gör jobbet:
 * servicesidan öppnar med en hand i ett chassi, byggsidan med ett
 * moderkort i fullt ljus, villkorssidorna med ett kretskort på håll.
 * Man vet var man är innan man har läst ett ord.
 *
 * FEM LAGER, OCH VARJE LAGER HAR ETT SKÄL
 *
 *   photo  Fotot, en aning uppförstorat och långsamt drivande. Ett
 *          stillastående foto läser ögat som en plansch.
 *   wash   Toningen som gör texten läsbar. På bred skärm faller den
 *          från vänster, där texten står; på telefon nedifrån och upp,
 *          eftersom rubriken där tar hela bredden. Den slutar i sidans
 *          egen kulör, så banderollen tonar ut i duken i stället för
 *          att sluta med en kant - samma beslut som på startsidan.
 *   glow   Ett ljus i sidans egen kulör. Det är det som skiljer
 *          sidorna åt när de väl ligger bredvid varandra.
 *   grid   Hårfina lodräta linjer. Knappt synliga, men de ger fotot
 *          något att sitta på och plockar upp det tekniska anslaget.
 *   rule   En linje längst ned som markerar var banderollen slutar.
 *
 * Toningarna blandas med color-mix, så de fungerar i både ljust och
 * mörkt läge utan att skrivas två gånger. Duken kommer från temat
 * (--site-page-bg), inte från en hårdkodad kulör, så banderollen följer
 * med om någon byter bakgrundsfärg i adminläget.
 *
 * Utan bild ritas samma sak utan fotot. Kassan och varukorgen ska inte
 * ha ett halvskärmsfoto ovanför ett formulär - där räcker kulören.
 */

export type BannerCrumb = {
  label: string;
  href?: string;
};

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  lede?: string;
  /** Knappar eller länkar under ingressen. */
  actions?: ReactNode;
  /** Sällsynt: något som faktiskt är värt en halv skärm, till höger. */
  aside?: ReactNode;
  sandboxId?: string;
  /** Fotot bakom rubriken. Utelämnas på transaktionssidor. */
  image?: string;
  /** Sidans kulör, som hex. Styr ögonbryn, ljus, linjer och punkter. */
  accent?: string;
  /** Brödsmulor. Sista steget är sidan man står på och länkas inte. */
  breadcrumb?: BannerCrumb[];
  /** Korta fakta på rad under ingressen, med punkt framför. */
  facts?: string[];
  /** Låg banderoll utan foto - för kassa, varukorg och konto. */
  compact?: boolean;
};

export const PageHero = ({
  eyebrow,
  title,
  lede,
  actions,
  aside,
  sandboxId,
  image,
  accent = "#3FD9F5",
  breadcrumb,
  facts,
  compact = false,
}: PageHeroProps) => {
  const hasPhoto = Boolean(image) && !compact;

  return (
    <section
      data-sandbox-id={sandboxId}
      className={[
        "page-banner",
        hasPhoto ? "page-banner--photo" : "page-banner--plain",
        compact ? "page-banner--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--banner-accent": accent } as CSSProperties}
    >
      <div aria-hidden="true" className="page-banner__media">
        {hasPhoto && (
          <img
            src={image}
            alt=""
            className="page-banner__photo"
            /* Banderollen är det första man ser, så den laddas direkt
               och inte lazy - lazy hade gett en tom ruta i en halv
               sekund precis där blicken landar. */
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        )}
        <span className="page-banner__wash" />
        <span className="page-banner__glow" />
        <span className="page-banner__grid" />
        <span className="page-banner__rule" />
      </div>

      <div className="container relative mx-auto w-full px-4">
        <div
          className={
            aside
              ? "grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]"
              : undefined
          }
        >
          <Reveal className="max-w-3xl">
            {breadcrumb && breadcrumb.length > 0 && (
              <nav aria-label="Brödsmulor" className="page-banner__crumbs">
                <ol>
                  {breadcrumb.map((crumb, index) => {
                    const isLast = index === breadcrumb.length - 1;
                    return (
                      <li key={`${crumb.label}-${index}`}>
                        {crumb.href && !isLast ? (
                          <Link to={crumb.href}>{crumb.label}</Link>
                        ) : (
                          <span aria-current={isLast ? "page" : undefined}>
                            {crumb.label}
                          </span>
                        )}
                        {!isLast && (
                          <span aria-hidden="true" className="page-banner__crumb-sep">
                            /
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            )}

            {eyebrow && <p className="page-banner__eyebrow">{eyebrow}</p>}

            <h1
              className={
                compact
                  ? "page-banner__title font-display text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl"
                  : "page-banner__title font-display text-4xl font-bold leading-[1.04] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
              }
            >
              {title}
            </h1>

            {lede && (
              <p className="page-banner__lede mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {lede}
              </p>
            )}

            {facts && facts.length > 0 && (
              <ul className="page-banner__facts mt-6">
                {facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            )}

            {actions && (
              <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
            )}
          </Reveal>

          {aside && <Reveal delay={90}>{aside}</Reveal>}
        </div>
      </div>
    </section>
  );
};

export default PageHero;
