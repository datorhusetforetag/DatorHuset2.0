import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function CustomerService() {
  const { settings: siteSettings } = useSiteSettings();
  const pageSettings = siteSettings.pages.customerService;
  const heroImage = pageSettings.heroImage?.trim() || "/Datorhuset.png";
  const heroImageAlt = pageSettings.heroImageAlt?.trim() || "DatorHuset logo";

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "DatorHuset",
    url: "https://datorhuset.site/",
    image: "https://datorhuset.site/Datorhuset.png",
    email: pageSettings.contactEmail,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Stockholm",
      addressCountry: "SE",
    },
    areaServed: "SE",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "11:00",
        closes: "15:00",
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Hem",
        item: "https://datorhuset.site/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Kundservice",
        item: "https://datorhuset.site/kundservice",
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50">
      <SeoJsonLd data={[localBusinessSchema, breadcrumbSchema]} />
      <Navbar />
      <main className="flex-1">
        <section className="overflow-hidden bg-yellow-400">
          <div className="container mx-auto px-4 pb-12 pt-16 sm:pt-24">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-700">{pageSettings.heroEyebrow}</p>
                <h1 className="mt-4 text-4xl font-bold text-gray-900 lg:text-5xl">{pageSettings.heroTitle}</h1>
                <p className="mt-4 max-w-2xl text-gray-800">{pageSettings.heroDescription}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to={pageSettings.heroCtaHref}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-900 px-6 py-3 font-semibold text-gray-900 transition-colors hover:border-[#11667b] hover:bg-[#11667b] hover:text-white"
                  >
                    {pageSettings.heroCtaLabel}
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src={heroImage}
                  alt={heroImageAlt}
                  className="h-56 w-full max-w-md object-contain object-center sm:h-72 lg:h-80"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-5xl space-y-6 px-4 py-12">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-gray-200 p-6 dark:border-gray-800">
              <h2 className="text-lg font-semibold">{pageSettings.contactTitle}</h2>
              <p>
                E-post:{" "}
                <a className="text-blue-600 dark:text-blue-400" href={`mailto:${pageSettings.contactEmail}`}>
                  {pageSettings.contactEmail}
                </a>
              </p>
            </div>
            <div className="space-y-2 rounded-xl border border-gray-200 p-6 dark:border-gray-800">
              <h2 className="text-lg font-semibold">{pageSettings.hoursTitle}</h2>
              {pageSettings.hoursLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-gray-200 p-6 dark:border-gray-800">
            <h2 className="text-lg font-semibold">{pageSettings.supportTitle}</h2>
            {pageSettings.supportLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4 rounded-xl border border-gray-200 p-6 dark:border-gray-800">
              <h2 className="text-lg font-semibold">{pageSettings.commonIssuesTitle}</h2>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {pageSettings.commonIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-300">{pageSettings.commonIssuesNote}</p>
            </div>

            <div className="space-y-4 rounded-xl border border-gray-200 p-6 dark:border-gray-800">
              <h2 className="text-lg font-semibold">{pageSettings.workflowTitle}</h2>
              <ol className="list-inside list-decimal space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {pageSettings.workflowSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <Link
                to={pageSettings.workflowCtaHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-gray-900 transition-colors hover:bg-[#11667b] hover:text-white"
              >
                {pageSettings.workflowCtaLabel}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
