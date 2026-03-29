import { Link } from "react-router-dom";
import { DEFAULT_SITE_SETTINGS, type SiteSettings, type SiteStepItem } from "@/lib/siteSettings";
import { SiteIcon } from "./SiteIcon";

type StepsSectionProps = {
  settings?: SiteSettings["homepage"]["steps"];
};

const renderStepIcon = (icon: SiteStepItem["icon"]) => {
  if (icon === "refresh-euro") {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400 dark:text-yellow-300">
        <SiteIcon icon={icon} className="h-7 w-7" />
      </div>
    );
  }
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400 dark:text-yellow-300">
      <SiteIcon icon={icon} className="h-7 w-7" />
    </div>
  );
};

export const StepsSection = ({ settings = DEFAULT_SITE_SETTINGS.homepage.steps }: StepsSectionProps) => {
  return (
    <section data-sandbox-id="home-steps" className="bg-[var(--site-muted-bg)] text-[var(--site-text-primary)] transition-colors dark:bg-[var(--site-muted-bg-dark)] dark:text-[var(--site-text-primary-dark)]">
      <div className="container mx-auto flex flex-col items-center px-4 py-12 text-center sm:py-16 lg:py-20">
        <div className="mb-8 sm:mb-10">
          <h2 className="mb-3 text-2xl font-bold sm:text-3xl lg:text-4xl">{settings.title}</h2>
          <p className="text-sm text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)] sm:text-base">{settings.description}</p>
        </div>

        <div className="grid w-full max-w-6xl grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {settings.items.map((step) => (
            <div
              key={step.title}
              className="flex flex-col items-start gap-4 rounded-xl border px-6 py-8 text-left shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)] sm:items-center sm:px-8 sm:py-10 sm:text-center"
              style={{ borderColor: "var(--site-card-border-current)", backgroundColor: "var(--site-card-bg-current)" }}
            >
              {renderStepIcon(step.icon)}
              <h3 className="text-xl font-bold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)]">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Link
            to={settings.primaryHref}
            className="w-full rounded-lg px-8 py-3 text-center font-semibold transition-opacity hover:opacity-90 sm:w-auto"
            style={{ backgroundColor: "var(--site-brand-bg)", color: "var(--site-brand-text)" }}
          >
            {settings.primaryLabel}
          </Link>
          <Link
            to={settings.secondaryHref}
            className="w-full rounded-lg px-8 py-3 text-center font-semibold transition-opacity hover:opacity-90 sm:w-auto"
            style={{ backgroundColor: "var(--site-accent-bg)", color: "var(--site-accent-text)" }}
          >
            {settings.secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
};
