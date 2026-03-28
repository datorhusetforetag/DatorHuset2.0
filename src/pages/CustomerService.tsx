import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildSiteThemeVars } from "@/lib/siteTheme";

export default function CustomerService() {
  const { settings: siteSettings } = useSiteSettings();
  const pageSettings = siteSettings.pages.customerService;
  const themeVars = buildSiteThemeVars(siteSettings.site.theme);
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
    <div
      style={themeVars}
      className="min-h-screen flex flex-col bg-[var(--site-page-bg)] text-[var(--site-text-primary)] dark:bg-[var(--site-page-bg-dark)] dark:text-[var(--site-text-primary-dark)]"
    >
      <SeoJsonLd data={[localBusinessSchema, breadcrumbSchema]} />
      <Navbar />
      <main className="flex-1">
        <section className="overflow-hidden bg-[var(--site-brand-bg)] text-[var(--site-brand-text)]">
          <div className="container mx-auto px-4 pb-12 pt-16 sm:pt-24">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] opacity-70">{pageSettings.heroEyebrow}</p>
                <h1 className="mt-4 text-4xl font-bold lg:text-5xl">{pageSettings.heroTitle}</h1>
                <p className="mt-4 max-w-2xl opacity-85">{pageSettings.heroDescription}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to={pageSettings.heroCtaHref}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border px-6 py-3 font-semibold transition-opacity hover:opacity-90"
                    style={{ borderColor: "var(--site-brand-text)", color: "var(--site-brand-text)" }}
                  >
                    {pageSettings.heroCtaLabel}
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div
                  className="flex w-full max-w-md items-center justify-center"
                  style={{ minHeight: "20rem", backgroundColor: "var(--site-hero-frame-bg)", borderRadius: "var(--site-radius-xl)" }}
                >
                  <img
                    src={heroImage}
                    alt={heroImageAlt}
                    className="h-56 w-full object-contain object-center sm:h-72 lg:h-80"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-5xl space-y-6 px-4 py-12">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-xl border p-6" style={{ borderColor: "var(--site-card-border)", backgroundColor: "var(--site-card-bg)" }}>
              <h2 className="text-lg font-semibold">{pageSettings.contactTitle}</h2>
              <p>
                E-post:{" "}
                <a className="text-blue-600 dark:text-blue-400" href={`mailto:${pageSettings.contactEmail}`}>
                  {pageSettings.contactEmail}
                </a>
              </p>
            </div>
            <div className="space-y-2 rounded-xl border p-6" style={{ borderColor: "var(--site-card-border)", backgroundColor: "var(--site-card-bg)" }}>
              <h2 className="text-lg font-semibold">{pageSettings.hoursTitle}</h2>
              {pageSettings.hoursLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border p-6" style={{ borderColor: "var(--site-card-border)", backgroundColor: "var(--site-card-bg)" }}>
            <h2 className="text-lg font-semibold">{pageSettings.supportTitle}</h2>
            {pageSettings.supportLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4 rounded-xl border p-6" style={{ borderColor: "var(--site-card-border)", backgroundColor: "var(--site-card-bg)" }}>
              <h2 className="text-lg font-semibold">{pageSettings.commonIssuesTitle}</h2>
              <ul className="space-y-2 text-sm text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)]">
                {pageSettings.commonIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
              <p className="text-sm text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)]">{pageSettings.commonIssuesNote}</p>
            </div>

            <div className="space-y-4 rounded-xl border p-6" style={{ borderColor: "var(--site-card-border)", backgroundColor: "var(--site-card-bg)" }}>
              <h2 className="text-lg font-semibold">{pageSettings.workflowTitle}</h2>
              <ol className="list-inside list-decimal space-y-2 text-sm text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)]">
                {pageSettings.workflowSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <Link
                to={pageSettings.workflowCtaHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--site-brand-bg)", color: "var(--site-brand-text)" }}
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
