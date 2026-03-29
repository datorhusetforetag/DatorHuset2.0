import { Link } from "react-router-dom";
import { Instagram, Music2, Twitter, Youtube } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildSiteThemeVars } from "@/lib/siteTheme";

export default function About() {
  const { settings: siteSettings } = useSiteSettings();
  const pageSettings = siteSettings.pages.about;
  const themeVars = buildSiteThemeVars(siteSettings.site.theme);
  const socialLinks = siteSettings.site.footer.socialLinks;

  return (
    <div
      data-sandbox-id="global-theme"
      style={themeVars}
      className="min-h-screen flex flex-col bg-[var(--site-page-bg)] text-[var(--site-text-primary)] dark:bg-[var(--site-page-bg-dark)] dark:text-[var(--site-text-primary-dark)]"
    >
      <Navbar />
      <main className="flex-1">
        <section data-sandbox-id="about-hero" className="overflow-hidden bg-[var(--site-brand-bg)] text-[var(--site-brand-text)]">
          <div className="container mx-auto px-4 pb-12 pt-16 sm:pt-24">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] opacity-70">{pageSettings.heroEyebrow}</p>
                <h1 className="mt-4 text-4xl font-bold lg:text-5xl">{pageSettings.heroTitle}</h1>
                <p className="mt-4 max-w-2xl opacity-85">{pageSettings.heroDescription}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to={pageSettings.primaryHref}
                    className="inline-flex items-center justify-center gap-2 rounded-[var(--site-radius-lg)] px-6 py-3 font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "var(--site-surface-bg-current)", color: "var(--site-text-primary-current)" }}
                  >
                    {pageSettings.primaryLabel}
                  </Link>
                  <Link
                    to={pageSettings.secondaryHref}
                    className="inline-flex items-center justify-center gap-2 rounded-[var(--site-radius-lg)] border px-6 py-3 font-semibold transition-opacity hover:opacity-90"
                    style={{ borderColor: "var(--site-brand-text)", color: "var(--site-brand-text)" }}
                  >
                    {pageSettings.secondaryLabel}
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div
                  className="flex w-full max-w-md items-center justify-center"
                  style={{ minHeight: "20rem", backgroundColor: "var(--site-hero-frame-bg-current)", borderRadius: "var(--site-radius-xl)" }}
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

        <section className="container mx-auto max-w-5xl space-y-10 px-4 py-12">
          <div data-sandbox-id="about-story" className="space-y-4">
            <h2 className="text-2xl font-bold">{pageSettings.storyTitle}</h2>
            {pageSettings.storyParagraphs.map((paragraph) => (
              <p key={paragraph} className="text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)]">
                {paragraph}
              </p>
            ))}
          </div>

          <div data-sandbox-id="about-values" className="space-y-4">
            <h2 className="text-2xl font-bold">{pageSettings.valuesTitle}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {pageSettings.valueCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[var(--site-radius-lg)] border border-[var(--site-card-border)] bg-[var(--site-card-bg)] p-6 dark:border-[var(--site-card-border-dark)] dark:bg-[var(--site-card-bg-dark)]"
                >
                  <h3 className="mb-2 text-lg font-semibold">{card.title}</h3>
                  <p className="text-sm text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)]">{card.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div data-sandbox-id="about-gallery" className="space-y-4">
            <h2 className="text-2xl font-bold">{pageSettings.galleryTitle}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {pageSettings.galleryImages.map((image) => (
                <img
                  key={image.url}
                  src={image.url}
                  alt={image.alt}
                  className="h-56 w-full rounded-[var(--site-radius-lg)] border border-[var(--site-card-border)] object-cover dark:border-[var(--site-card-border-dark)]"
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
          </div>

          <div data-sandbox-id="about-promise" className="rounded-[var(--site-radius-xl)] border border-[var(--site-card-border)] bg-[var(--site-card-bg)] p-6 dark:border-[var(--site-card-border-dark)] dark:bg-[var(--site-card-bg-dark)] md:p-8">
            <h2 className="text-2xl font-bold">{pageSettings.promiseTitle}</h2>
            <ul className="mt-4 grid gap-3 text-sm text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)] md:grid-cols-2">
              {pageSettings.promiseItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div data-sandbox-id="about-social" className="rounded-[var(--site-radius-xl)] border border-[var(--site-card-border)] bg-[var(--site-card-bg)] p-6 dark:border-[var(--site-card-border-dark)] dark:bg-[var(--site-card-bg-dark)] md:p-8">
            <h2 className="text-2xl font-bold">{pageSettings.socialTitle}</h2>
            <p className="mt-3 text-sm text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)]">{pageSettings.socialDescription}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ borderColor: "var(--site-card-border-current)", color: "var(--site-text-primary-current)" }}
                >
                  {link.platform === "instagram" ? (
                    <Instagram className="h-4 w-4" />
                  ) : link.platform === "youtube" ? (
                    <Youtube className="h-4 w-4" />
                  ) : link.platform === "tiktok" ? (
                    <Music2 className="h-4 w-4" />
                  ) : (
                    <Twitter className="h-4 w-4" />
                  )}
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
