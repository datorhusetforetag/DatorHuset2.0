import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Reveal } from "./Reveal";

/**
 * Ett smakprov ur vanliga frågor, strax ovanför betalbandet.
 *
 * Frågorna hämtas ur sidinställningarna - samma källa som /faq läser.
 * Skrivs de av här hamnar de två i otakt så fort någon ändrar en fråga
 * i adminläget, och då står det olika svar på två ställen.
 *
 * Bara de fyra första visas. Resten finns ett klick bort; en startsida
 * ska väcka frågan, inte besvara allihop.
 */

/** Så många ryms innan avsnittet tar över startsidan. */
const PREVIEW_COUNT = 4;

/*
 * Bakgrunden: ett fält av prickade vågor.
 *
 * Linjerna är vanliga sinuskurvor som förskjuts en aning för varje rad.
 * Där två våglängder går omlott glesnar och tätnar prickarna av sig
 * själva, och det är den effekten som gör mönstret - inte slump. Samma
 * kurva ritad rakt av hade sett ut som ett linjerat papper.
 *
 * Strecket är gjort till prickar med en dasharray där själva strecket
 * är nästan noll långt och ändarna är runda. Då blir varje "streck" en
 * punkt, och avståndet mellan dem styrs av mellanrummet.
 *
 * Kurvorna räknas ut en gång när modulen laddas, inte vid varje
 * omritning. De ändrar sig aldrig.
 */
const FIELD_WIDTH = 1200;
const FIELD_HEIGHT = 620;
const LINE_COUNT = 44;

const buildFlowField = () => {
  const paths: string[] = [];

  for (let line = 0; line < LINE_COUNT; line += 1) {
    const baseY = (line / (LINE_COUNT - 1)) * FIELD_HEIGHT;
    const points: string[] = [];

    for (let x = 0; x <= FIELD_WIDTH; x += 10) {
      const t = x / FIELD_WIDTH;
      const y =
        baseY +
        72 * Math.sin(t * Math.PI * 2 + line * 0.3) +
        30 * Math.sin(t * Math.PI * 4.4 - line * 0.19) +
        18 * Math.sin(line * 0.5);

      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    paths.push(`M${points.join(" L")}`);
  }

  return paths;
};

const FLOW_FIELD = buildFlowField();

const FlowField = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 overflow-hidden opacity-40 dark:opacity-75"
    style={{
      // Mönstret tonar ut mot kanterna så det inte slutar tvärt i en rak
      // linje mot avsnittet ovanför och under.
      maskImage:
        "radial-gradient(75% 65% at 50% 50%, black 30%, transparent 78%)",
      WebkitMaskImage:
        "radial-gradient(75% 65% at 50% 50%, black 30%, transparent 78%)",
    }}
  >
    <svg
      className="flow-field absolute left-1/2 top-1/2 h-[135%] w-[135%] -translate-x-1/2 -translate-y-1/2"
      viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {/* Plommon underst, cyan en aning förskjuten ovanpå. Två lager som
          inte ligger i fas ger djup; ett enda ser platt ut. */}
      <g
        stroke="#B26BDE"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="0.1 9"
        opacity="0.55"
      >
        {FLOW_FIELD.map((d, index) => (
          <path key={`plum-${index}`} d={d} />
        ))}
      </g>
      <g
        stroke="#3FD9F5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="0.1 9"
        opacity="0.16"
        transform="translate(5, -7)"
      >
        {FLOW_FIELD.map((d, index) => (
          <path key={`cyan-${index}`} d={d} />
        ))}
      </g>
    </svg>
  </div>
);

export const FaqPreview = () => {
  const { settings } = useSiteSettings();
  const faq = settings.pages.faq;
  const items = faq.items.slice(0, PREVIEW_COUNT);

  if (items.length === 0) return null;

  return (
    <section
      data-sandbox-id="home-faq"
      className="section-surface-alt relative overflow-hidden"
    >
      <FlowField />

      <div className="container relative mx-auto px-4 py-20 sm:py-24 lg:py-28">
        <Reveal className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <p className="eyebrow">Vi hjälper dig gärna</p>
            <h2 className="section-title mt-3 text-3xl sm:text-4xl lg:text-5xl">
              Vanliga frågor
            </h2>
          </div>

          <Link
            to="/faq"
            className="group inline-flex items-center gap-2 pb-2 text-sm font-semibold text-primary transition-colors hover:text-foreground"
          >
            Se alla
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>

        <Reveal delay={80} className="mt-10">
          <Accordion type="single" collapsible className="flex flex-col gap-4">
            {items.map((item) => (
              <AccordionItem
                key={item.question}
                value={item.question}
                className="overflow-hidden rounded-lg border border-foreground/10 bg-foreground/[0.04] backdrop-blur-sm transition-colors hover:border-primary/40 data-[state=open]:border-primary/40"
              >
                <AccordionTrigger className="px-5 py-5 text-left text-base font-semibold hover:no-underline sm:px-6 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-primary">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-6 pr-12 text-sm leading-relaxed text-muted-foreground sm:px-6">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>

        <Reveal delay={140} className="mt-10 flex justify-center">
          <Link
            to="/faq"
            className="btn-glow inline-flex items-center gap-2 rounded-sm bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Se alla vanliga frågor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
};

export default FaqPreview;
