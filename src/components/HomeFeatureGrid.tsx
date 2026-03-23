import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/siteSettings";
import { buildUtmContent, withUtm } from "@/lib/utm";
import { SiteIcon } from "./SiteIcon";

type HomeFeatureGridProps = {
  settings?: SiteSettings["homepage"]["showcase"];
};

export const HomeFeatureGrid = ({ settings = DEFAULT_SITE_SETTINGS.homepage.showcase }: HomeFeatureGridProps) => {
  if (!settings.enabled) return null;

  return (
    <section className="bg-white text-gray-900 dark:bg-background dark:text-gray-50">
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#11667b] dark:text-[#9dd4e0]">{settings.eyebrow}</p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl lg:text-4xl">{settings.title}</h2>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{settings.description}</p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {settings.cards.map((card) => (
            <article
              key={card.title}
              className="rounded-3xl border border-gray-200 bg-[#f7f7f6] p-6 shadow-[0_24px_60px_rgba(15,24,36,0.08)] dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#11667b]/10 text-[#11667b] dark:bg-[#11667b]/20 dark:text-[#9dd4e0]">
                <SiteIcon icon={card.icon} className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold">{card.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{card.description}</p>
              <Link
                to={withUtm(card.href, {
                  utm_source: "homepage",
                  utm_medium: "feature_grid",
                  utm_campaign: "sandbox_options",
                  utm_content: buildUtmContent(card.title),
                })}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#11667b] hover:text-[#0b4d5d] dark:text-[#9dd4e0] dark:hover:text-white"
              >
                {card.linkLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
