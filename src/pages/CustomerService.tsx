import { Link } from "react-router-dom";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { PAGE_BANNERS } from "@/lib/pageBanners";
import { Reveal } from "@/components/Reveal";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function CustomerService() {
  const { settings: siteSettings } = useSiteSettings();
  const pageSettings = siteSettings.pages.customerService;

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "DatorHuset",
    url: "https://datorhuset.se/",
    image: "https://datorhuset.se/Datorhuset.png",
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
        item: "https://datorhuset.se/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Kundservice",
        item: "https://datorhuset.se/kundservice",
      },
    ],
  };

  return (
    <PageShell head={<SeoJsonLd data={[localBusinessSchema, breadcrumbSchema]} />}>
      <PageHero
        sandboxId="customer-hero"
        image={PAGE_BANNERS.support.image}
        accent={PAGE_BANNERS.support.accent}
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Kundservice" }]}
        eyebrow={pageSettings.heroEyebrow}
        title={pageSettings.heroTitle}
        lede={pageSettings.heroDescription}
        facts={[
          "Svar på vardagar",
          "Hjälp före köp och efter",
          "Vi svarar på svenska",
        ]}
        actions={
          <>
            <a href={`mailto:${pageSettings.contactEmail}`} className="btn-primary">
              Mejla oss
            </a>
            <Link to="/faq" className="btn-secondary">
              Läs vanliga frågor
            </Link>
          </>
        }
      />

      {/* Kontaktuppgifterna först. Den som letar hit vill veta hur man
          når oss, inte läsa om vår process. */}
      {/* Luft under banderollen. Avsnittet hade bara padding nedåt, så
          korten klistrade sig i underkanten på banderollen medan alla
          andra sidor andas där. */}
      <section data-sandbox-id="customer-contact" className="relative">
        <div className="container mx-auto max-w-5xl px-4 pb-16 pt-16 sm:pt-20">
          <div className="grid gap-5 md:grid-cols-2">
            <Reveal className="rounded-lg border border-foreground/10 bg-background/70 p-7">
              <h2 className="font-display text-lg font-bold text-foreground">
                {pageSettings.contactTitle}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                E-post:{" "}
                <a
                  className="link-underline font-semibold text-primary"
                  href={`mailto:${pageSettings.contactEmail}`}
                >
                  {pageSettings.contactEmail}
                </a>
              </p>
            </Reveal>

            <Reveal delay={90} className="rounded-lg border border-foreground/10 bg-background/70 p-7">
              <h2 className="font-display text-lg font-bold text-foreground">
                {pageSettings.hoursTitle}
              </h2>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                {pageSettings.hoursLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={140} className="mt-5 rounded-lg border border-foreground/10 bg-background/70 p-7">
            <h2 className="font-display text-lg font-bold text-foreground">
              {pageSettings.supportTitle}
            </h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              {pageSettings.supportLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Vanliga ärenden som lista, gången som numrerade steg - samma
          form som punkterna i "Hur DatorHuset kör". */}
      <section className="relative">
        <div className="container mx-auto max-w-5xl px-4 pb-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <Reveal sandboxId="customer-issues">
              <h2 className="section-title text-2xl sm:text-3xl">
                {pageSettings.commonIssuesTitle}
              </h2>
              <ul className="mt-6 divide-y divide-foreground/10 border-t border-foreground/10">
                {pageSettings.commonIssues.map((issue) => (
                  <li
                    key={issue}
                    className="flex items-start gap-3 py-4 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span aria-hidden="true" className="mt-[3px] text-primary">
                      &#8250;
                    </span>
                    {issue}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {pageSettings.commonIssuesNote}
              </p>
            </Reveal>

            <Reveal delay={110} sandboxId="customer-workflow">
              <h2 className="section-title text-2xl sm:text-3xl">
                {pageSettings.workflowTitle}
              </h2>
              <ol className="mt-6 space-y-5">
                {pageSettings.workflowSteps.map((step, index) => (
                  <li key={step} className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="font-display text-xl font-bold leading-none tabular-nums text-primary/50"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
              <Link to={pageSettings.workflowCtaHref} className="btn-primary mt-8">
                {pageSettings.workflowCtaLabel}
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
