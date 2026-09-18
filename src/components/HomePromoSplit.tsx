import { Link } from "react-router-dom";

import { DEFAULT_SITE_SETTINGS, type SitePromoCard, type SiteSettings } from "@/lib/siteSettings";
import { buildUtmContent, withUtm } from "@/lib/utm";
import { Reveal } from "./Reveal";

type HomePromoSplitProps = {
  settings?: SiteSettings["homepage"]["promo"];
};

/**
 * Service och custom bygg, som två breda band under varandra.
 *
 * Tidigare två lika stora kort sida vid sida, med bild i topp och en
 * punktlista under. Två kort bredvid varandra läses som ett val man
 * måste göra; två band under varandra läses som två saker vi gör, och
 * det är det senare som stämmer.
 *
 * Formen är hämtad från Apex: ett eget mörkt fält med rundade hörn,
 * bilden på ena sidan och texten på den andra - och de byter sida mellan
 * banden. Växlingen är hela poängen. Ligger bilden till vänster båda
 * gångerna blir det en lista; byter den sida får ögat något att följa
 * ned genom sidan.
 *
 * Punktlistorna är borta. Ett band som det här ska säga en sak och peka
 * vidare, inte redovisa allt - det som stod i punkterna står utförligare
 * på sidan man klickar sig till.
 *
 * Knappen är en tunn oval i märkets kulör i stället för en fylld. Fylld
 * konkurrerar med huvudknapparna längre upp på sidan; hålls den öppen
 * läses den som "läs mer" och inte som "köp".
 */

const PromoBand = ({
  card,
  campaign,
  /** Jämna band har bilden till vänster, udda till höger. */
  flipped,
  accent,
}: {
  card: SitePromoCard;
  campaign: string;
  flipped: boolean;
  accent: string;
}) => {
  /*
   * Två sorters bild kan ligga här, och de tål inte samma behandling.
   *
   * En frilagd rendering ska stå fritt mot fältet med en skugga under,
   * som i förlagan. Ett vanligt foto har en bakgrund med sig - rum,
   * skrivbord, vad som helst - och står det fritt ser det ut som en
   * urklippt bild klistrad på ytan. Det behöver en ram för att läsas
   * som ett foto.
   *
   * PNG används i praktiken bara för det frilagda här, så filändelsen
   * räcker som skiljelinje. Väljer någon en annan bild i adminläget
   * hamnar den automatiskt i rätt behandling.
   */
  const isCutout = card.image.toLowerCase().endsWith(".png");

  return (
  <Reveal className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.04]">
    <div className="grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-2 lg:gap-12 lg:p-14">
      {/* Bilden. order styr sidan på breda skärmar; på en telefon
          ligger den alltid överst, där den gör mest nytta. */}
      <div className={flipped ? "lg:order-2" : undefined}>
        <img
          src={card.image}
          alt={card.imageAlt}
          className={
            isCutout
              ? "mx-auto h-48 w-auto max-w-full object-contain sm:h-60 lg:h-72"
              : "mx-auto h-48 w-full rounded-xl object-cover sm:h-60 lg:h-72"
          }
          loading="lazy"
          decoding="async"
          style={
            isCutout
              ? { filter: "drop-shadow(0 24px 40px rgba(0, 0, 0, 0.5))" }
              : undefined
          }
        />
      </div>

      <div className={flipped ? "lg:order-1" : undefined}>
        <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {card.eyebrow}
        </h3>

        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">
          {card.description}
        </p>

        <Link
          to={withUtm(card.primaryHref, {
            utm_source: "homepage",
            utm_medium: "promo_band",
            utm_campaign: campaign,
            utm_content: buildUtmContent(card.primaryLabel),
          })}
          className="mt-8 inline-flex items-center justify-center rounded-full border px-8 py-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors hover:bg-foreground/[0.06]"
          style={{ borderColor: accent, color: accent }}
        >
          {card.primaryLabel}
        </Link>
      </div>
    </div>
  </Reveal>
  );
};

/** Cyan för service, plommon för bygget - samma par som resten av sidan. */
const ACCENTS = ["#3FD9F5", "#B26BDE"];

export const HomePromoSplit = ({ settings = DEFAULT_SITE_SETTINGS.homepage.promo }: HomePromoSplitProps) => {
  return (
    <section data-sandbox-id="home-promo" className="relative text-foreground">
      <div className="container mx-auto px-4 py-20 sm:py-24 lg:py-28">
        <Reveal className="mb-12 text-center">
          <p className="eyebrow">{settings.eyebrow}</p>
          <h2 className="section-title mt-3 text-3xl sm:text-4xl lg:text-5xl">
            {settings.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {settings.description}
          </p>
        </Reveal>

        <div className="flex flex-col gap-6">
          {settings.cards.map((card, index) => (
            <PromoBand
              key={`${card.title}-${index}`}
              card={card}
              campaign={index === 0 ? "service_reparation" : "custom_bygg"}
              flipped={index % 2 === 1}
              accent={ACCENTS[index % ACCENTS.length]}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
