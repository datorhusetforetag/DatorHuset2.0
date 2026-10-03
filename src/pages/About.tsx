import { Link } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  Gauge,
  Headset,
  MapPin,
  Monitor,
  Receipt,
  Scale,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { INFO_PAGE_BACKGROUND, PageShell } from "@/components/PageShell";
import { Reveal } from "@/components/Reveal";
import { useSiteSettings } from "@/hooks/useSiteSettings";

import heroComputer from "../../images/platinum tier.png";

/**
 * Om DatorHuset.
 *
 * Samma mörka duk och täta paneler som kundservice och villkoren, men
 * den här sidan ska också ge ett ansikte åt butiken. Därför är den
 * byggd som en kort berättelse uppifrån och ned:
 *
 *   1. Vem vi är - rubrik och en dator, i den lila listen.
 *   2. Fyra fakta på rad - det som går att lita på, i siffror och ord.
 *   3. Historien, med en bild bredvid så den inte blir en textvägg.
 *   4. Det vi står för - tre kort.
 *   5. Priset - varför vi kan ligga lågt, och vad det inte kostar i kvalitet.
 *   6. Byggen från oss - bilderna, med en länk vidare till datorerna.
 *
 * Texterna kommer ur inställningarna som förut. Det enda som står här i
 * koden är faktaraden, eftersom den beskriver hur vi faktiskt arbetar
 * och ska stämma med FAQ:n och villkoren - inte vara fri text.
 */

const FACTS = [
  { icon: MapPin, value: "Spånga", label: "Byggs för hand i Stockholm" },
  { icon: Wrench, value: "Stresstestad", label: "Varje dator innan leverans" },
  { icon: ShieldCheck, value: "3 år", label: "Reklamationsrätt" },
  { icon: Monitor, value: "Windows 11", label: "Installerat och aktiverat" },
];

/* Ikonerna till värdekorten, i samma ordning som korten i inställningarna.
   Finns det fler kort än ikoner får de sista ingen ikon. */
const VALUE_ICONS = [Eye, Gauge, Headset];

const PRICE_POINTS = [
  {
    icon: Scale,
    title: "Jämfört mot andra butiker",
    body: "Vi följer vad samma komponenter kostar hos andra svenska butiker.",
  },
  {
    icon: Receipt,
    title: "Inga dolda avgifter",
    body: "Du ser hela kostnaden i kassan innan du betalar.",
  },
  {
    icon: Wrench,
    title: "Samma kvalitet oavsett pris",
    body: "Varje dator byggs för hand och stresstestas, hur mycket den än kostar.",
  },
];

export default function About() {
  const { settings } = useSiteSettings();
  const page = settings.pages.about;
  const [storyImage, ...galleryRest] = page.galleryImages;

  return (
    <PageShell background={INFO_PAGE_BACKGROUND}>
      {/* 1. Vem vi är ----------------------------------------------------
          Den lila listen som på de andra informationssidorna, fast högre:
          här får den bära en rubrik, en ingress och en dator. */}
      <header data-sandbox-id="about-hero" className="info-header relative overflow-hidden">
        <div className="container mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <Reveal>
            <nav aria-label="Brödsmulor" className="text-xs text-white/55">
              <Link to="/" className="transition-colors hover:text-white">
                Hem
              </Link>
              <span aria-hidden="true" className="mx-1.5 opacity-60">
                /
              </span>
              <span aria-current="page" className="text-white/80">
                Om oss
              </span>
            </nav>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              {page.heroEyebrow}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {page.heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              {page.heroDescription}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={page.primaryHref} className="btn-primary rounded-full">
                {page.primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={page.secondaryHref}
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/[0.06]"
              >
                {page.secondaryLabel}
              </Link>
            </div>
          </Reveal>

          <Reveal delay={90} className="relative hidden justify-center lg:flex">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(45% 40% at 50% 60%, rgba(178, 107, 222, 0.45) 0%, rgba(178, 107, 222, 0.12) 50%, transparent 75%)",
              }}
            />
            <img
              src={heroComputer}
              alt=""
              aria-hidden="true"
              className="relative max-h-[360px] w-auto object-contain"
              style={{ filter: "drop-shadow(-18px 28px 40px rgba(0, 0, 0, 0.6))" }}
              loading="eager"
              decoding="async"
            />
          </Reveal>
        </div>
      </header>

      {/* 2. Fakta ----------------------------------------------------------
          Drar upp över listens nederkant, så att sidan hänger ihop i
          stället för att börja om under bandet. */}
      <section className="relative">
        <div className="container mx-auto max-w-6xl px-4">
          <Reveal className="info-panel relative -mt-8 grid grid-cols-2 lg:grid-cols-4">
            {FACTS.map(({ icon: Icon, value, label }, index) => (
              <div
                key={value}
                className={[
                  "flex flex-col gap-3 p-6 sm:p-7",
                  index % 2 === 1 ? "border-l border-white/[0.06]" : "",
                  index >= 2 ? "border-t border-white/[0.06] lg:border-t-0" : "",
                  index === 2 ? "lg:border-l" : "",
                ].join(" ")}
              >
                <Icon aria-hidden="true" className="h-5 w-5 text-white/55" strokeWidth={1.75} />
                <div>
                  <p className="text-lg font-semibold text-white sm:text-xl">{value}</p>
                  <p className="mt-0.5 text-sm text-white/60">{label}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* 3. Historien ------------------------------------------------------ */}
      <section data-sandbox-id="about-story" className="relative">
        <div className="container mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:py-24 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              Bakgrund
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {page.storyTitle}
            </h2>
            <div className="mt-6 space-y-4 text-base leading-7 text-white/70">
              {page.storyParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Reveal>

          {storyImage && (
            <Reveal delay={90} className="info-panel media-zoom overflow-hidden p-0">
              <img
                src={storyImage.url}
                alt={storyImage.alt}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </Reveal>
          )}
        </div>
      </section>

      {/* 4. Det vi står för ------------------------------------------------ */}
      <section data-sandbox-id="about-values" className="relative">
        <div className="container mx-auto max-w-6xl px-4 pb-20 sm:pb-24">
          <Reveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              Värderingar
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {page.valuesTitle}
            </h2>
          </Reveal>

          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {page.valueCards.map((card, index) => {
              const Icon = VALUE_ICONS[index];
              return (
                <Reveal as="li" key={card.title} delay={index * 80} className="info-panel p-7">
                  {Icon && (
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/[0.06] text-white/85"
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                  )}
                  <h3 className="mt-5 text-lg font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{card.description}</p>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 5. Priset ----------------------------------------------------------
          Formulerat som något vi kan visa, inte som ett absolut "billigast
          i Sverige". Påståenden om pris måste gå att belägga enligt
          marknadsföringslagen, och det vi kan belägga är att vi jämför
          mot andra svenska butiker. */}
      <section data-sandbox-id="about-pricing" className="relative">
        <div className="container mx-auto max-w-6xl px-4 pb-20 sm:pb-24">
          <Reveal className="info-panel grid gap-10 p-8 sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                Pris
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Mer dator för pengarna
              </h2>
              <p className="mt-5 text-base leading-7 text-white/70">
                Vi håller våra priser bland de lägsta i Sverige. Vi jämför löpande
                komponentpriserna mot andra svenska butiker och lägger oss så lågt
                vi kan - utan att snåla på delarna, bygget eller testningen.
              </p>
            </div>

            <ul className="space-y-3">
              {PRICE_POINTS.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="flex gap-4 rounded-lg border border-white/[0.06] bg-[#110c18] p-5"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{title}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-white/60">
                      {body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 6. Byggen från oss -------------------------------------------------
          Första bilden står redan vid historien, så här visas resten. Är
          de färre än två visas hela galleriet i stället, hellre en bild
          två gånger än en tom sektion. */}
      {page.galleryImages.length > 0 && (
        <section data-sandbox-id="about-gallery" className="relative">
          <div className="container mx-auto max-w-6xl px-4 pb-20 sm:pb-24">
            <Reveal className="flex items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  Galleri
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {page.galleryTitle}
                </h2>
              </div>
              <Link
                to={page.primaryHref}
                className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-white/80 transition-colors hover:text-white sm:inline-flex"
              >
                {page.primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {(galleryRest.length >= 2 ? galleryRest : page.galleryImages).map((image, index) => (
                <Reveal
                  key={image.url}
                  delay={index * 90}
                  className="info-panel media-zoom overflow-hidden p-0"
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}
