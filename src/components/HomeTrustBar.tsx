import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/siteSettings";
import { SiteIcon } from "./SiteIcon";

type HomeTrustBarProps = {
  settings?: SiteSettings["homepage"]["trustBar"];
};

export const HomeTrustBar = ({ settings = DEFAULT_SITE_SETTINGS.homepage.trustBar }: HomeTrustBarProps) => {
  if (!settings.enabled) return null;

  return (
    <section className="bg-[#0f1824] text-white">
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[#9dd4e0]">Froende</p>
            <h2 className="mt-3 text-2xl font-bold">{settings.title}</h2>
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-3">
            {settings.items.map((item) => (
              <div key={`${item.value}-${item.label}`} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-4">
                  <SiteIcon icon={item.icon} className="h-6 w-6 text-yellow-400" />
                  <span className="text-2xl font-bold text-yellow-300">{item.value}</span>
                </div>
                <p className="mt-3 text-sm text-slate-200">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
