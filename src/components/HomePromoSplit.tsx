import { Link } from "react-router-dom";

import { DEFAULT_SITE_SETTINGS, type SitePromoCard, type SiteSettings } from "@/lib/siteSettings";
import { buildUtmContent, withUtm } from "@/lib/utm";
import { Reveal } from "./Reveal";
import { PromoScene, type PromoSceneKind } from "./home/PromoScene";

type HomePromoSplitProps = {
  settings?: SiteSettings["homepage"]["promo"];
};

/**
 * Service och custom bygg, som två band under varandra.
 *
 * INGEN GLASRUTA
 *
 * Banden låg tidigare i var sin rundad, halvgenomskinlig platta -
 * samma platta som korten längre upp, som stegen, som faktarutorna.
 * När allt på sidan ligger i samma ruta slutar rutan att betyda något:
 * den säger inte längre "det här hör ihop" utan bara "det här är en
 * sektion till".
 *
 * Nu bär bandet sig självt. En hårfin linje i bandets egen kulör
 * skiljer det från det förra, och scenen har ett svagt sken bakom sig
 * i samma färg. Det räcker för att ögat ska se två saker och inte en
 * lång text - och det tar en bråkdel av utrymmet en platta gör.
 *
 * Bandet är också nedbantat. Rubrikerna var uppåt fyrtio pixlar höga
 * och fältet tog en hel skärmhöjd per band; det är mycket plats för
 * två meningar och en länk.
 *
 * VARFÖR DE BYTER SIDA
 *
 * Ligger scenen till vänster båda gångerna blir det en lista. Byter
 * den sida får ögat något att följa ned genom sidan.
 */

const PromoBand = ({
  card,
  campaign,
  /** Jämna band har scenen till vänster, udda till höger. */
  flipped,
  accent,
  scene,
}: {
  card: SitePromoCard;
  campaign: string;
  flipped: boolean;
  accent: string;
  scene: PromoSceneKind;
}) => (
  <Reveal className="relative">
    {/* Linjen som skiljer banden åt. Den tonar ut från den sida scenen
        står på, så den pekar mot bilden i stället för att dra ett
        streck rakt över sidan. */}
    <div
      aria-hidden="true"
      className="h-px w-full"
      style={{
        background: `linear-gradient(${flipped ? "270deg" : "90deg"}, ${accent} 0%, ${accent}33 22%, transparent 62%)`,
      }}
    />

    <div className="grid items-center gap-8 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12 lg:py-12">
      {/* Scenen. order styr sidan på breda skärmar; på en telefon
          ligger den alltid överst, där den gör mest nytta. */}
      <div className={flipped ? "lg:order-2" : undefined}>
        <PromoScene kind={scene} />
      </div>

      <div className={flipped ? "lg:order-1" : undefined}>
        <h3 className="font-display text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl lg:text-3xl">
          {card.eyebrow}
        </h3>

        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {card.description}
        </p>

        <Link
          to={withUtm(card.primaryHref, {
            utm_source: "homepage",
            utm_medium: "promo_band",
            utm_campaign: campaign,
            utm_content: buildUtmContent(card.primaryLabel),
          })}
          className="mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-foreground/[0.06]"
          style={{ borderColor: accent, color: accent }}
        >
          {card.primaryLabel}
        </Link>
      </div>
    </div>
  </Reveal>
);

/** Cyan för service, plommon för bygget - samma par som resten av sidan. */
const ACCENTS = ["#3FD9F5", "#B26BDE"];

export const HomePromoSplit = ({ settings = DEFAULT_SITE_SETTINGS.homepage.promo }: HomePromoSplitProps) => {
  return (
    <section data-sandbox-id="home-promo" className="relative text-foreground">
      <div className="container mx-auto px-4 py-14 sm:py-16 lg:py-20">
        <Reveal className="mb-8 text-center">
          <p className="eyebrow">{settings.eyebrow}</p>
          <h2 className="section-title mt-2 text-2xl sm:text-3xl lg:text-4xl">{settings.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {settings.description}
          </p>
        </Reveal>

        <div className="flex flex-col">
          {settings.cards.map((card, index) => (
            <PromoBand
              key={`${card.title}-${index}`}
              card={card}
              campaign={index === 0 ? "service_reparation" : "custom_bygg"}
              flipped={index % 2 === 1}
              accent={ACCENTS[index % ACCENTS.length]}
              scene={index === 0 ? "service" : "build"}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
