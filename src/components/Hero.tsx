import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import buildInterior from "../../images/hero/build-interior.jpg";
import rigPurpleDesk from "../../images/hero/rig-purple-desk.jpg";
import rigAmberDesk from "../../images/hero/rig-amber-desk.jpg";
import serviceHands from "../../images/hero/service-hands.jpg";

/**
 * Stor bildkarusell överst på startsidan, byggd som ORIGIN bygger sin.
 *
 * Två saker gör deras banderoller läsbara, och båda är med här:
 *
 * 1. Vänstra halvan är alltid mörkare än den högra. Det är inte en
 *    slump i bilden utan en medveten toning, och det är den som gör att
 *    vit text går att läsa oavsett vad som ligger bakom.
 * 2. Bilden rör sig långsamt. Ett stillastående foto läser ögat som en
 *    plansch; ett som sakta kryper inåt läser det som film.
 *
 * Alla bilder ligger kvar i DOM:en ovanpå varandra och tonas mellan i
 * stället för att bytas ut. Byts de ut blinkar det till medan den nya
 * laddas; tonas de gör det inte.
 *
 * Zoomen är satt som en vanlig transition och inte som en keyframe.
 * Keyframes måste startas om vid varje byte, och den som tonar ut
 * hoppar då tillbaka till utgångsläget mitt i toningen. Med en
 * transition kryper den utgående bilden i stället lugnt tillbaka
 * medan den redan är osynlig.
 *
 * BILDERNA ÄR PLATSHÅLLARE. Det är fria stockfoton från Unsplash och
 * Pexels, och de föreställer inte våra egna datorer. Byt dem mot egna
 * bilder när sådana finns - filnamnen i images/hero/ är det enda som
 * behöver ligga kvar.
 *
 *   build-interior.jpg   Unsplash, foto Q-xGz9NOVOE
 *   rig-purple-desk.jpg  Pexels, foto 33050959
 *   rig-amber-desk.jpg   Pexels, foto 30469973
 *   service-hands.jpg    Unsplash, foto sMKUYIasyDM
 */

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** Kulören på ljuset i högerkanten, som RGB utan alfa. */
  glow: string;
  accent: string;
  /** Var i bilden motivet sitter, så beskärningen inte kapar det. */
  position: string;
};

const SLIDES: Slide[] = [
  {
    id: "custom",
    eyebrow: "Custom bygg",
    title: "Bygg den precis som du vill ha den",
    subtitle: "Välj varje del själv. Vi bygger, testar och levererar körklar.",
    image: buildInterior,
    primary: { label: "Starta ditt bygge", href: "/custom-bygg" },
    secondary: { label: "Se färdiga datorer", href: "/products" },
    glow: "63, 217, 245",
    accent: "#3FD9F5",
    position: "center",
  },
  {
    id: "prebuilt",
    eyebrow: "Färdiga datorer",
    title: "Redan byggd. Redan testad.",
    subtitle: "Handplockade komponenter i fyra nivåer, från Bronze till Diamond.",
    image: rigPurpleDesk,
    primary: { label: "Se alla datorer", href: "/products" },
    secondary: { label: "Jämför nivåerna", href: "/products?clear_filters=1" },
    glow: "178, 107, 222",
    accent: "#B26BDE",
    position: "center",
  },
  {
    id: "handbuilt",
    eyebrow: "Byggda för hand",
    title: "Skruvade i Spånga, inte i en fabrik",
    subtitle:
      "Varje dator byggs, kabeldras och provkörs för hand innan den lämnar oss.",
    image: rigAmberDesk,
    primary: { label: "Om DatorHuset", href: "/about" },
    secondary: { label: "Se våra datorer", href: "/products" },
    glow: "227, 165, 103",
    accent: "#E3A567",
    position: "center",
  },
  {
    id: "service",
    eyebrow: "Service & reparation",
    title: "Krånglar datorn? Vi fixar den.",
    subtitle: "Felsökning, uppgradering och rengöring - med garanti på utfört arbete.",
    image: serviceHands,
    primary: { label: "Boka service", href: "/service-reparation" },
    secondary: { label: "Fråga en tekniker", href: "/kundservice" },
    glow: "203, 211, 225",
    accent: "#CBD3E1",
    position: "center right",
  },
];

const AUTOPLAY_MS = 7000;
/** Kortare svep än så är oftast en miss, inte ett svep. */
const SWIPE_THRESHOLD_PX = 50;

export const Hero = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);

  /*
   * Bara de bilder som behövts hittills laddas. Sätts alla fyra direkt
   * hämtar webbläsaren drygt en megabyte innan den första ens är klar,
   * och då slåss bilden man faktiskt ser om bandbredden med tre man
   * inte ser. Nästa bild hämtas i förväg, men först efter en stund, så
   * den första får köra klart i lugn och ro.
   */
  const [loaded, setLoaded] = useState<number[]>([0]);

  useEffect(() => {
    // Den man tittar på måste hämtas nu - hoppar man hit med ett klick
    // på ett streck har den aldrig varit i tur.
    setLoaded((current) => (current.includes(index) ? current : [...current, index]));

    const next = (index + 1) % SLIDES.length;
    const timer = window.setTimeout(() => {
      setLoaded((current) => (current.includes(next) ? current : [...current, next]));
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const go = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    if (typeof window === "undefined") return;

    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setIndex((current) => (current + 1) % SLIDES.length);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    setPaused(true);
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null) return;

    const delta = (event.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    go(delta < 0 ? index + 1 : index - 1);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    }
  };

  const slide = SLIDES[index];

  return (
    <section
      data-sandbox-id="home-hero"
      className="relative overflow-hidden bg-[#0A0710]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={onKeyDown}
      aria-roledescription="carousel"
      aria-label="Utvalda erbjudanden"
    >
      {/* Bilderna ligger kvar allihop och tonas mellan ------------------ */}
      {SLIDES.map((item, slideIndex) => (
        <div
          key={item.id}
          aria-hidden="true"
          className="hero-slide absolute inset-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: loaded.includes(slideIndex) ? `url(${item.image})` : undefined,
            backgroundPosition: item.position,
            opacity: slideIndex === index ? 1 : 0,
            transform: slideIndex === index ? "scale(1.07)" : "scale(1)",
          }}
        />
      ))}

      {/* Färgat ljus i högerkanten, i aktiv slides kulör */}
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-[background] duration-700"
        style={{
          background: `radial-gradient(60% 100% at 88% 50%, rgba(${slide.glow}, 0.3) 0%, rgba(${slide.glow}, 0.08) 45%, transparent 72%)`,
        }}
      />

      {/*
        Toningen som håller texten läsbar. Den ligger i CSS och inte här,
        för den måste vändas på en telefon: i liggande format står texten i
        vänstra halvan och toningen går i sidled, men på en telefon går
        texten tvärs över hela bredden och en toning från vänster lämnar
        då högra halvan av rubriken liggande på ett ljust foto.
      */}
      <div aria-hidden="true" className="hero-scrim absolute inset-0" />
      {/* Hjässa och fot mörknas så navbar, pilar och streck håller */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,5,13,0.75) 0%, transparent 22%, transparent 68%, rgba(8,5,13,0.8) 100%)",
        }}
      />

      <div className="container relative mx-auto px-4">
        <div className="flex min-h-[540px] items-center py-20 sm:min-h-[620px] sm:py-24 lg:min-h-[700px] lg:py-28">
          <div
            key={`${slide.id}-text`}
            className="relative z-10 max-w-xl animate-in fade-in slide-in-from-left-8 duration-700"
          >
            <p
              className="text-xs font-semibold uppercase tracking-[0.3em]"
              style={{ color: slide.accent }}
            >
              {slide.eyebrow}
            </p>
            <h1 className="mt-5 max-w-[16ch] font-display text-4xl font-bold leading-[1.03] tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.6)] sm:text-5xl lg:text-7xl">
              {slide.title}
            </h1>
            <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-white/75 sm:text-lg">
              {slide.subtitle}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to={slide.primary.href}
                className="btn-glow rounded-sm px-7 py-3.5 text-sm font-semibold transition-colors"
                style={{ backgroundColor: slide.accent, color: "#0A0710" }}
              >
                {slide.primary.label}
              </Link>
              {slide.secondary && (
                <Link
                  to={slide.secondary.href}
                  className="rounded-sm border border-white/30 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/70 hover:bg-white/15"
                >
                  {slide.secondary.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pilar */}
      <button
        type="button"
        onClick={() => go(index - 1)}
        aria-label="Föregående"
        className="carousel-arrow absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 md:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        aria-label="Nästa"
        className="carousel-arrow absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 md:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/*
        Streck i stället för prickar. Det aktiva fylls i takt med att
        tiden går, så man ser att bilden är på väg att bytas och hinner
        stanna kvar - i stället för att den bara byter.
      */}
      <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2.5 px-4 sm:bottom-6">
        {SLIDES.map((item, dotIndex) => {
          const isActive = dotIndex === index;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(dotIndex)}
              aria-label={`Visa ${item.eyebrow}`}
              aria-current={isActive ? "true" : undefined}
              className="group flex h-11 w-12 shrink-0 items-center sm:w-16"
            >
              <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-white/25 transition-colors group-hover:bg-white/45">
                <span
                  key={`${item.id}-${index}`}
                  className="absolute inset-y-0 left-0 w-full origin-left rounded-full"
                  style={{
                    backgroundColor: slide.accent,
                    transform: isActive && reducedMotion ? "scaleX(1)" : "scaleX(0)",
                    animation:
                      isActive && !reducedMotion
                        ? `hero-progress ${AUTOPLAY_MS}ms linear forwards`
                        : undefined,
                    animationPlayState: paused ? "paused" : "running",
                  }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
