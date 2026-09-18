import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/siteSettings";
import { SiteIcon } from "./SiteIcon";
import { Reveal } from "./Reveal";

type StepsSectionProps = {
  settings?: SiteSettings["homepage"]["steps"];
};

/**
 * "Hur DatorHuset kör" - vad som gäller när man handlar här.
 *
 * Det här är sidans brytpunkt. Resten av startsidan är centrerad rubrik
 * följd av ett rutnät, och fyra sådana i rad gör att ögat slutar titta.
 * Därför står rubriken vänsterställd i en smal spalt och punkterna
 * staplade i en bredare - inte som ett rutnät alls.
 *
 * Brytningen ligger i formen, inte i kulören. Avsnittet har ingen egen
 * bakgrund utan ligger på samma genomgående duk som resten av sidan.
 * Ett eget mörkt band här delade sidan i två lila, och två lila är
 * sämre än ett.
 *
 * Varje punkt har sin egen kulör och ett stort blekt nummer, så raden
 * blir läsbar i ett svep i stället för en grå vägg.
 */

/** Kulör per position i listan, i samma ordning som punkterna står. */
const ACCENTS = ["#3FD9F5", "#B26BDE", "#E3A567", "#7FD98F"];

export const StepsSection = ({ settings = DEFAULT_SITE_SETTINGS.homepage.steps }: StepsSectionProps) => {
  return (
    <section data-sandbox-id="home-steps" className="relative text-foreground">
      <div className="container mx-auto px-4 py-20 sm:py-28 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          {/* Rubriken står kvar medan punkterna rullar förbi */}
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            {settings.eyebrow && (
              <p className="eyebrow">
                {settings.eyebrow}
              </p>
            )}
            <h2 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {settings.title}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              {settings.description}
            </p>
          </Reveal>

          {/* Punkterna: staplade, skilda av hårfina linjer */}
          <ul className="divide-y divide-foreground/10 border-t border-foreground/10">
            {settings.items.map((step, index) => {
              const accent = ACCENTS[index % ACCENTS.length];
              return (
                <Reveal
                  as="li"
                  key={step.title}
                  delay={index * 90}
                  className="group flex items-start gap-5 py-7 sm:gap-7 sm:py-8"
                >
                  <span
                    aria-hidden="true"
                    className="select-none font-display text-3xl font-bold leading-none tabular-nums opacity-30 transition-opacity duration-300 group-hover:opacity-70 sm:text-4xl"
                    style={{ color: accent }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-translate-y-0.5"
                    style={{ backgroundColor: `${accent}1F`, color: accent }}
                  >
                    <SiteIcon icon={step.icon} className="h-[22px] w-[22px]" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-bold leading-snug tracking-tight sm:text-xl">
                      {step.title}
                    </span>
                    {step.description && (
                      <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </span>
                    )}
                  </span>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
};
