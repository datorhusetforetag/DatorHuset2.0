import { Link } from "react-router-dom";
import { Instagram, Music2, Twitter, Youtube } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Om DatorHuset.
 *
 * Sidan hade fem likadana rutor under varandra. Den är uppdelad nu:
 * berättelsen står som löptext i en smal spalt, värdena som numrerade
 * rader utan ram, och löftena som en lista med bockar. Samma grepp som
 * "Hur DatorHuset kör" på startsidan - brytningen ligger i formen, inte
 * i att varje stycke får en egen inramad låda.
 */

const SOCIAL_ICON = {
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Music2,
} as const;

export default function About() {
  const { settings } = useSiteSettings();
  const page = settings.pages.about;
  const socialLinks = settings.site.footer.socialLinks;

  return (
    <PageShell>
      <PageHero
        sandboxId="about-hero"
        eyebrow={page.heroEyebrow}
        title={page.heroTitle}
        lede={page.heroDescription}
        actions={
          <>
            <Link to={page.primaryHref} className="btn-primary">
              {page.primaryLabel}
            </Link>
            <Link to={page.secondaryHref} className="btn-secondary">
              {page.secondaryLabel}
            </Link>
          </>
        }
      />

      {/* Berättelsen: smal spalt, ingen ram. Löptext ska läsas, inte
          skummas, och en ram inbjuder till att skumma. */}
      <section data-sandbox-id="about-story" className="relative">
        <div className="container mx-auto max-w-3xl px-4 py-16 sm:py-20">
          <Reveal>
            <h2 className="section-title text-3xl sm:text-4xl">{page.storyTitle}</h2>
            <div className="prose-page mt-6">
              {page.storyParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Värdena: numrerade rader, skilda av hårfina linjer */}
      <section data-sandbox-id="about-values" className="relative">
        <div className="container mx-auto max-w-5xl px-4 pb-16 sm:pb-20">
          <Reveal>
            <h2 className="section-title text-3xl sm:text-4xl">{page.valuesTitle}</h2>
          </Reveal>

          <ul className="mt-8 divide-y divide-foreground/10 border-t border-foreground/10">
            {page.valueCards.map((card, index) => (
              <Reveal
                as="li"
                key={card.title}
                delay={index * 80}
                className="group grid gap-2 py-7 sm:grid-cols-[4rem_1fr] sm:gap-6"
              >
                <span
                  aria-hidden="true"
                  className="select-none font-display text-2xl font-bold leading-none tabular-nums text-primary/40 transition-colors duration-300 group-hover:text-primary sm:text-3xl"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block font-display text-lg font-bold tracking-tight text-foreground">
                    {card.title}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                    {card.description}
                  </span>
                </span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Bilderna får zooma vid hovring, som korten på startsidan */}
      {page.galleryImages.length > 0 && (
        <section data-sandbox-id="about-gallery" className="relative">
          <div className="container mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
            <Reveal>
              <h2 className="section-title text-3xl sm:text-4xl">{page.galleryTitle}</h2>
            </Reveal>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {page.galleryImages.map((image, index) => (
                <Reveal key={image.url} delay={index * 90}>
                  <div className="media-zoom card-lift overflow-hidden rounded-lg border border-foreground/10">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="h-60 w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Löftena: lista med bockar i märkets cyan */}
      <section data-sandbox-id="about-promise" className="relative">
        <div className="container mx-auto max-w-5xl px-4 pb-16 sm:pb-20">
          <Reveal className="rounded-lg border border-foreground/10 bg-background/70 p-8 sm:p-10">
            <h2 className="section-title text-2xl sm:text-3xl">{page.promiseTitle}</h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {page.promiseItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span aria-hidden="true" className="mt-[2px] font-bold text-primary">
                    &#10003;
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section data-sandbox-id="about-social" className="relative">
        <div className="container mx-auto max-w-5xl px-4 pb-24">
          <Reveal className="text-center">
            <h2 className="section-title text-2xl sm:text-3xl">{page.socialTitle}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {page.socialDescription}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {socialLinks.map((link) => {
                const Icon = SOCIAL_ICON[link.platform as keyof typeof SOCIAL_ICON] ?? Twitter;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </a>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
