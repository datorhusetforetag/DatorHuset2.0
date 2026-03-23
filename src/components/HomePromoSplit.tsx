import { Link } from "react-router-dom";
import { DEFAULT_SITE_SETTINGS, type SitePromoCard, type SiteSettings } from "@/lib/siteSettings";
import { buildUtmContent, withUtm } from "@/lib/utm";

type HomePromoSplitProps = {
  settings?: SiteSettings["homepage"]["promo"];
};

const renderPromoCard = (card: SitePromoCard, campaign: string) => (
  <article
    key={`${campaign}-${card.title}`}
    className="relative flex min-h-[520px] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:border-gray-800 dark:bg-gray-900 sm:min-h-[560px]"
  >
    <div className="relative h-48 sm:h-56 lg:h-64">
      <img src={card.image} alt={card.imageAlt} className="h-full w-full object-cover" loading="lazy" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <p className="absolute bottom-4 left-6 text-xs uppercase tracking-[0.4em] text-yellow-400">{card.eyebrow}</p>
    </div>
    <div className="flex flex-1 flex-col gap-4 p-6 lg:p-8">
      <h3 className="text-xl font-bold sm:text-2xl lg:text-3xl">{card.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{card.description}</p>
      <div className="grid gap-3 text-sm text-gray-600 dark:text-gray-300">
        {card.bullets.map((bullet) => (
          <div key={bullet} className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-gray-900 transition-colors hover:bg-[#11667b] hover:text-white sm:w-auto"
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-yellow-400 px-6 py-3 font-semibold text-gray-900 transition-colors hover:border-[#11667b] hover:bg-[#11667b] hover:text-white dark:text-yellow-300 sm:w-auto"
        >
          {card.secondaryLabel}
        </Link>
      </div>
    </div>
  </article>
);

export const HomePromoSplit = ({ settings = DEFAULT_SITE_SETTINGS.homepage.promo }: HomePromoSplitProps) => {
  return (
    <section className="bg-gray-50 text-gray-900 dark:bg-background dark:text-gray-50">
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400">{settings.eyebrow}</p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl lg:text-4xl">{settings.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 dark:text-gray-300">{settings.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {settings.cards.map((card, index) => renderPromoCard(card, index === 0 ? "service_reparation" : "custom_bygg"))}
        </div>
      </div>
    </section>
  );
};
