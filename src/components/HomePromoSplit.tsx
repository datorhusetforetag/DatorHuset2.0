import { Link } from "react-router-dom";
import { DEFAULT_SITE_SETTINGS, type SitePromoCard, type SiteSettings } from "@/lib/siteSettings";
import { buildUtmContent, withUtm } from "@/lib/utm";
import { Reveal } from "./Reveal";

type HomePromoSplitProps = {
  settings?: SiteSettings["homepage"]["promo"];
};

const renderPromoCard = (card: SitePromoCard, campaign: string, featured: boolean) => (
  <article
    key={`${campaign}-${card.title}`}
    className={`card-lift relative flex flex-col overflow-hidden rounded-3xl border shadow-[0_20px_60px_rgba(0,0,0,0.08)] ${featured ? "min-h-[560px] sm:min-h-[620px]" : "min-h-[480px] sm:min-h-[520px]"}`}
    style={{ borderColor: "var(--site-card-border-current)", backgroundColor: "var(--site-card-bg-current)" }}
  >
    <div className={`media-zoom relative ${featured ? "h-56 sm:h-72 lg:h-80" : "h-44 sm:h-52 lg:h-56"}`}>
      <img src={card.image} alt={card.imageAlt} className="h-full w-full object-cover" loading="lazy" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <p className="absolute bottom-4 left-6 text-xs uppercase tracking-[0.4em]" style={{ color: "var(--site-brand-bg)" }}>{card.eyebrow}</p>
    </div>
    <div className="flex flex-1 flex-col gap-4 p-6 lg:p-8">
      <h3 className={`font-display font-bold tracking-tight ${featured ? "text-2xl sm:text-3xl lg:text-4xl" : "text-xl sm:text-2xl"}`}>{card.title}</h3>
      <p className="text-sm text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)]">{card.description}</p>
      <div className="grid gap-3 text-sm text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)]">
        {card.bullets.map((bullet) => (
          <div key={bullet} className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--site-brand-bg)" }} />
            {bullet}
          </div>
        ))}
      </div>
      <div className="mt-auto flex flex-col gap-3 sm:flex-row">
        <Link
          to={withUtm(card.primaryHref, {
            utm_source: "homepage",
            utm_medium: "promo_card",
            utm_campaign: campaign,
            utm_content: buildUtmContent(card.primaryLabel),
          })}
          className="btn-glow inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-opacity hover:opacity-90 sm:w-auto"
          style={{ backgroundColor: "var(--site-brand-bg)", color: "var(--site-brand-text)" }}
        >
          {card.primaryLabel}
        </Link>
        <Link
          to={withUtm(card.secondaryHref, {
            utm_source: "homepage",
            utm_medium: "promo_card",
            utm_campaign: campaign,
            utm_content: buildUtmContent(card.secondaryLabel),
          })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-6 py-3 font-semibold transition-opacity hover:opacity-90 sm:w-auto"
          style={{ borderColor: "var(--site-accent-bg)", color: "var(--site-text-primary-current)" }}
        >
          {card.secondaryLabel}
        </Link>
      </div>
    </div>
  </article>
);

export const HomePromoSplit = ({ settings = DEFAULT_SITE_SETTINGS.homepage.promo }: HomePromoSplitProps) => {
  return (
    <section data-sandbox-id="home-promo" className="section-surface section-seam-top relative text-foreground">
      <div className="container mx-auto px-4 py-20 sm:py-28 lg:py-32">
        <Reveal className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)]">{settings.eyebrow}</p>
          <h2 className="section-title mt-3 text-3xl sm:text-4xl lg:text-5xl">{settings.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)]">{settings.description}</p>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.15fr_minmax(0,0.85fr)]">
          {settings.cards.map((card, index) => (
            <Reveal
              key={`${card.title}-${index}`}
              delay={index * 120}
              className={index === 1 ? "lg:mt-16" : undefined}
            >
              {renderPromoCard(card, index === 0 ? "service_reparation" : "custom_bygg", index === 0)}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
