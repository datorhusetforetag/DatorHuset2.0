import { Link } from "react-router-dom";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/siteSettings";
import { buildUtmContent, withUtm } from "@/lib/utm";

type HomeCtaBandProps = {
  settings?: SiteSettings["homepage"]["ctaBand"];
};

export const HomeCtaBand = ({ settings = DEFAULT_SITE_SETTINGS.homepage.ctaBand }: HomeCtaBandProps) => {
  if (!settings.enabled) return null;

  return (
    <section className="bg-[#f5f6f8] text-gray-900 dark:bg-[#111827] dark:text-gray-100">
      <div className="container mx-auto px-4 pb-16 pt-6 sm:pb-20">
        <div className="overflow-hidden rounded-[2rem] border border-[#11667b]/20 bg-[radial-gradient(circle_at_top_left,_rgba(255,212,59,0.35),_transparent_38%),linear-gradient(135deg,#0f1824_0%,#11667b_100%)] px-6 py-8 text-white shadow-[0_32px_80px_rgba(15,24,36,0.28)] sm:px-8 sm:py-10 lg:px-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-yellow-200">
                {settings.badge}
              </span>
              <p className="mt-4 text-xs uppercase tracking-[0.35em] text-[#9dd4e0]">{settings.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl lg:text-4xl">{settings.title}</h2>
              <p className="mt-4 text-sm text-slate-100/85">{settings.description}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={withUtm(settings.primaryHref, {
                  utm_source: "homepage",
                  utm_medium: "cta_band",
                  utm_campaign: "sandbox_cta",
                  utm_content: buildUtmContent(settings.primaryLabel),
                })}
                className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-white"
              >
                {settings.primaryLabel}
              </Link>
              <Link
                to={withUtm(settings.secondaryHref, {
                  utm_source: "homepage",
                  utm_medium: "cta_band",
                  utm_campaign: "sandbox_cta",
                  utm_content: buildUtmContent(settings.secondaryLabel),
                })}
                className="inline-flex items-center justify-center rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                {settings.secondaryLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
