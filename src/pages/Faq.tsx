import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildSiteThemeVars } from "@/lib/siteTheme";

export default function Faq() {
  const { settings: siteSettings } = useSiteSettings();
  const pageSettings = siteSettings.pages.faq;
  const themeVars = buildSiteThemeVars(siteSettings.site.theme);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pageSettings.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
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
        name: "FAQ",
        item: "https://datorhuset.site/faq",
      },
    ],
  };

  return (
    <div
      style={themeVars}
      className="min-h-screen flex flex-col bg-[var(--site-page-bg)] text-[var(--site-text-primary)] dark:bg-[var(--site-page-bg-dark)] dark:text-[var(--site-text-primary-dark)]"
    >
      <SeoJsonLd data={[faqSchema, breadcrumbSchema]} />
      <Navbar />

      <main className="flex-1">
        <section className="overflow-hidden bg-[var(--site-brand-bg)] text-[var(--site-brand-text)]">
          <div className="container mx-auto px-4 pb-12 pt-16 sm:pt-24">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] opacity-70">{pageSettings.heroEyebrow}</p>
                <h1 className="mt-4 text-4xl font-bold lg:text-5xl">{pageSettings.heroTitle}</h1>
                <p className="mt-4 max-w-2xl opacity-85">{pageSettings.heroDescription}</p>
              </div>
              <div className="flex items-center justify-center">
                <div
                  className="flex w-full max-w-md items-center justify-center"
                  style={{ minHeight: "20rem", backgroundColor: "var(--site-hero-frame-bg)", borderRadius: "var(--site-radius-xl)" }}
                >
                  <img
                    src={pageSettings.heroImage}
                    alt={pageSettings.heroImageAlt}
                    className="h-56 w-full object-contain object-center sm:h-72 lg:h-80"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-4xl space-y-6 px-4 py-12">
          {pageSettings.items.map((item) => (
            <article
              key={item.question}
              className="rounded-[var(--site-radius-lg)] border border-[var(--site-card-border)] bg-[var(--site-card-bg)] px-6 py-5 dark:border-[var(--site-card-border-dark)] dark:bg-[var(--site-card-bg-dark)]"
            >
              <h2 className="text-xl font-semibold">{item.question}</h2>
              <p className="mt-2 text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)]">{item.answer}</p>
            </article>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
