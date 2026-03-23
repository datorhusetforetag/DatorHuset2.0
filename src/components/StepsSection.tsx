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
    <section className="bg-[#f5f6f8] text-gray-900 transition-colors dark:bg-[#111827] dark:text-gray-100">
      <div className="container mx-auto flex flex-col items-center px-4 py-12 text-center sm:py-16 lg:py-20">
        <div className="mb-8 sm:mb-10">
          <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl lg:text-4xl">{settings.title}</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 sm:text-base">{settings.description}</p>
        </div>

        <div className="grid w-full max-w-6xl grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {settings.items.map((step) => (
            <div
              key={step.title}
              className="flex flex-col items-start gap-4 rounded-xl border border-gray-200 bg-white px-6 py-8 text-left shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:border-gray-800 dark:bg-[#0f1419] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)] sm:items-center sm:px-8 sm:py-10 sm:text-center"
            >
              {renderStepIcon(step.icon)}
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{step.title}</h3>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Link
            to={settings.primaryHref}
            className="w-full rounded-lg bg-yellow-400 px-8 py-3 text-center font-semibold text-gray-900 transition-colors hover:bg-[#11667b] hover:text-white sm:w-auto"
          >
            {settings.primaryLabel}
          </Link>
          <Link
            to={settings.secondaryHref}
            className="w-full rounded-lg bg-yellow-400 px-8 py-3 text-center font-semibold text-gray-900 transition-colors hover:bg-[#11667b] hover:text-white sm:w-auto"
          >
            {settings.secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
};
