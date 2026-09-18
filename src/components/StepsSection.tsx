import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/siteSettings";
import { SiteIcon } from "./SiteIcon";

type StepsSectionProps = {
  settings?: SiteSettings["homepage"]["steps"];
};

/**
 * "Hur DatorHuset kör" - vad som gäller när man handlar här.
 *
 * Formen är hämtad från Starforges motsvarande ruta: liten versal rad,
 * rubrik, kort text, och sedan en rad små fyrkanter med varsin ikon och
 * en kort etikett. Fyrkanterna är avsiktligt små och ordknappa - de ska
 * gå att läsa i ett svep, inte läsas igenom.
 *
 * Varje punkt har sin egen kulör så raden inte blir en grå vägg. Det är
 * också deras grepp: fyra ikoner i fyra olika färger.
 */

/** Kulör per position i raden, i samma ordning som punkterna står. */
const ACCENTS = ["#3FD9F5", "#B26BDE", "#E3A567", "#7FD98F"];

export const StepsSection = ({ settings = DEFAULT_SITE_SETTINGS.homepage.steps }: StepsSectionProps) => {
  return (
    <section data-sandbox-id="home-steps" className="section-surface-alt relative text-foreground">
      <div className="container mx-auto flex flex-col items-center px-4 py-20 text-center sm:py-28 lg:py-32">
        <div className="max-w-2xl">
          {settings.eyebrow && <p className="eyebrow">{settings.eyebrow}</p>}
          <h2 className="section-title mt-3 text-3xl sm:text-4xl">{settings.title}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {settings.description}
          </p>
        </div>

        <div className="mt-12 grid w-full max-w-3xl grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
          {settings.items.map((step, index) => {
            const accent = ACCENTS[index % ACCENTS.length];
            return (
              <div
                key={step.title}
                className="card-lift flex flex-col items-center gap-3 rounded-lg border border-border bg-card/60 px-4 py-6 text-center"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${accent}1F`, color: accent }}
                >
                  <SiteIcon icon={step.icon} className="h-[22px] w-[22px]" />
                </span>
                <span className="text-sm font-semibold leading-snug text-foreground">
                  {step.title}
                </span>
                {step.description && (
                  <span className="text-xs leading-snug text-muted-foreground">
                    {step.description}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
