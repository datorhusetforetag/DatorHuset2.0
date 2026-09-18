import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DEFAULT_SITE_SETTINGS, type SiteHeroCategory, type SiteSettings } from "@/lib/siteSettings";
import { buildUtmContent, withUtm } from "@/lib/utm";
import { SiteIcon } from "./SiteIcon";
import winMouseImage from "../../images/WinMouse.png";

type HeroProps = {
  settings?: SiteSettings["homepage"]["hero"];
  motion?: SiteSettings["site"]["motion"];
};

export const Hero = ({
  settings = DEFAULT_SITE_SETTINGS.homepage.hero,
  motion = DEFAULT_SITE_SETTINGS.site.motion,
}: HeroProps) => {
  return (
    <section data-sandbox-id="home-hero" className="section-surface transition-colors">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:mb-12 sm:gap-6 md:grid-cols-3">
          <div
            className="col-span-1 flex min-h-[230px] flex-col justify-between rounded-lg border p-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 sm:min-h-[320px] sm:p-6 lg:p-8 md:col-span-2"
            style={{
              animationDuration: `${motion.heroRevealDurationMs}ms`,
              ["--tw-enter-translate-y" as string]: `${motion.bannerRevealDistancePx}px`,
              borderColor: "var(--site-brand-bg)",
              backgroundColor: "var(--site-brand-bg)",
              color: "var(--site-brand-text)",
            }}
          >
            <div>
              <h2 className="mb-3 text-3xl font-bold sm:text-4xl lg:text-5xl">{settings.title}</h2>
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold sm:text-base">
                {settings.subtitle} <ChevronRight className="inline h-5 w-5" />
              </p>
            </div>
            <div
              className="flex h-28 items-center justify-between overflow-hidden rounded-lg border px-4 sm:h-36 sm:px-6"
              style={{
                borderColor: "color-mix(in srgb, var(--site-brand-text) 18%, transparent)",
                backgroundColor: "var(--site-hero-frame-bg-current)",
              }}
            >
              <div className="relative z-10 pr-3">
                <p className="text-sm uppercase tracking-[0.18em]" style={{ color: "var(--site-text-muted-current)" }}>{settings.featureEyebrow}</p>
                <p className="text-sm font-semibold sm:text-base" style={{ color: "var(--site-text-primary-current)" }}>{settings.featureTitle}</p>
              </div>
              <img
                src={settings.featureImage}
                alt={settings.featureImageAlt}
                className="h-[88%] w-auto max-w-[42%] object-contain object-right drop-shadow-[0_16px_28px_rgba(0,0,0,0.25)] sm:max-w-[40%] md:max-w-[38%]"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          <div
            className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-lg p-4 animate-in fade-in slide-in-from-bottom-4 sm:min-h-[320px] sm:p-6 lg:p-8"
            style={{
              animationDuration: `${motion.heroRevealDurationMs}ms`,
              animationDelay: `${motion.heroRevealStaggerMs}ms`,
              ["--tw-enter-translate-y" as string]: `${motion.bannerRevealDistancePx}px`,
              backgroundColor: "var(--site-accent-bg)",
              color: "var(--site-accent-text)",
            }}
          >
            <div className="relative z-10">
              <h2 className="mb-2 text-2xl font-bold sm:text-3xl">{settings.secondaryTitle}</h2>
              <p className="mb-4 text-sm opacity-95">{settings.secondaryDescription}</p>
              <p className="text-sm font-semibold" style={{ color: "var(--site-brand-bg)" }}>{settings.secondaryNote}</p>
            </div>
            <div className="relative z-10 flex gap-2">
              <span
                className="btn-glow rounded px-3 py-1 text-sm font-bold"
                style={{ backgroundColor: "var(--site-brand-bg)", color: "var(--site-brand-text)" }}
              >
                {settings.secondaryBadge}
              </span>
            </div>
            <img
              src={winMouseImage}
              alt="Gava vid kop"
              className="pointer-events-none absolute -bottom-8 -right-6 w-40 opacity-90 drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)] sm:w-48 md:w-56"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div className="mb-12" data-sandbox-id="home-categories">
          <h3 className="mb-6 text-2xl font-bold text-[var(--site-text-primary)] dark:text-[var(--site-text-primary-dark)]">{settings.categoriesTitle}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {settings.categories.map((category: SiteHeroCategory) => (
              <Link
                key={category.name}
                to={withUtm(category.href, {
                  utm_source: "homepage",
                  utm_medium: "category_card",
                  utm_campaign: "populara_kategorier",
                  utm_content: buildUtmContent(category.name),
                })}
                className="rounded-lg border p-4 text-center transition-all hover:shadow-lg sm:p-6"
                style={{
                  borderColor: "var(--site-card-border-current)",
                  backgroundColor: "var(--site-card-bg-current)",
                  color: "var(--site-text-primary-current)",
                }}
              >
                <div className="mx-auto mb-3 h-8 w-8 sm:h-10 sm:w-10" style={{ color: "var(--site-brand-bg)" }}>
                  <SiteIcon icon={category.icon} className="h-full w-full" />
                </div>
                <p className="line-clamp-2 text-sm font-medium">{category.name}</p>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
