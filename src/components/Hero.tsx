import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import diamondTier from "../../images/diamond tier.png";
import platinumTier from "../../images/platinum tier.png";
import silverTier from "../../images/silver tier.png";

/**
 * Stor bildkarusell överst på startsidan, byggd som ORIGIN bygger sin.
 *
 * Två saker gör deras banderoller läsbara, och båda är med här:
 *
 * 1. Vänstra halvan är alltid mörkare än den högra. Det är inte en
 *    slump i bilden utan en medveten toning, och det är den som gör att
 *    vit text går att läsa oavsett vad som ligger bakom.
 * 2. Datorn är frilagd och ligger till höger, ovanpå ett färgat ljus i
 *    stället för i en fotografisk bakgrund.
 *
 * Bakgrunden här är ritad med gradienter, inte fotograferad - precis som
 * deras gröna vågor är grafik och inte foto. Datorerna är våra egna
 * frilagda bilder.
 */

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** Kulören på ljuset till höger, som RGB utan alfa. */
  glow: string;
  accent: string;
};

const SLIDES: Slide[] = [
  {
    id: "custom",
    eyebrow: "Custom bygg",
    title: "Bygg den precis som du vill ha den",
    subtitle: "Välj varje del själv. Vi bygger, testar och levererar körklar.",
    image: diamondTier,
    primary: { label: "Starta ditt bygge", href: "/custom-bygg" },
    secondary: { label: "Se färdiga datorer", href: "/products" },
    glow: "63, 217, 245",
    accent: "#3FD9F5",
  },
  {
    id: "prebuilt",
    eyebrow: "Färdiga datorer",
    title: "Redan byggd. Redan testad.",
    subtitle: "Handplockade komponenter i fyra nivåer, från Bronze till Diamond.",
    image: platinumTier,
    primary: { label: "Se alla datorer", href: "/products" },
    secondary: { label: "Jämför nivåerna", href: "/products?clear_filters=1" },
    glow: "178, 107, 222",
    accent: "#B26BDE",
  },
  {
    id: "service",
    eyebrow: "Service & reparation",
    title: "Krånglar datorn? Vi fixar den.",
    subtitle: "Felsökning, uppgradering och rengöring - med garanti på utfört arbete.",
    image: silverTier,
    primary: { label: "Boka service", href: "/service-reparation" },
    secondary: { label: "Fråga en tekniker", href: "/kundservice" },
    glow: "186, 196, 214",
    accent: "#CBD3E1",
  },
];

const AUTOPLAY_MS = 6500;

export const Hero = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setIndex((current) => (current + 1) % SLIDES.length);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [paused]);

  const slide = SLIDES[index];

  return (
    <section
      data-sandbox-id="home-hero"
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      aria-roledescription="carousel"
      aria-label="Utvalda erbjudanden"
    >
      {/* Bakgrund: mörk bas, färgat ljus till höger, och till sist en
          toning som gör vänsterhalvan mörkare igen så texten håller. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-[background] duration-700"
        style={{
          background: `
            radial-gradient(70% 120% at 82% 50%, rgba(${slide.glow}, 0.42) 0%, rgba(${slide.glow}, 0.12) 42%, transparent 68%),
            radial-gradient(50% 80% at 95% 85%, rgba(${slide.glow}, 0.3) 0%, transparent 60%),
            linear-gradient(180deg, #120C1C 0%, #1A1230 55%, #140E24 100%)
          `,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,7,16,0.94) 0%, rgba(10,7,16,0.82) 28%, rgba(10,7,16,0.45) 52%, rgba(10,7,16,0) 78%)",
        }}
      />

      <div className="container relative mx-auto px-4">
        <div className="grid min-h-[460px] items-center gap-6 py-16 sm:min-h-[540px] sm:py-20 lg:min-h-[600px] lg:grid-cols-[1fr_1fr] lg:py-24">
          {/* Texten ligger till vänster, mot den mörka halvan */}
          <div key={`${slide.id}-text`} className="relative z-10 animate-in fade-in slide-in-from-left-6 duration-700">
            <p
              className="text-xs font-semibold uppercase tracking-[0.28em]"
              style={{ color: slide.accent }}
            >
              {slide.eyebrow}
            </p>
            <h1 className="mt-4 max-w-[16ch] font-display text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              {slide.title}
            </h1>
            <p className="mt-5 max-w-[46ch] text-base text-white/70 sm:text-lg">{slide.subtitle}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={slide.primary.href}
                className="btn-glow rounded-sm px-6 py-3 text-sm font-semibold transition-colors"
                style={{ backgroundColor: slide.accent, color: "#120C1C" }}
              >
                {slide.primary.label}
              </Link>
              {slide.secondary && (
                <Link
                  to={slide.secondary.href}
                  className="rounded-sm border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10"
                >
                  {slide.secondary.label}
                </Link>
              )}
            </div>
          </div>

          {/* Datorn till höger, i det ljusa fältet */}
          <div className="relative hidden min-h-[320px] items-center justify-center lg:flex">
            <img
              key={`${slide.id}-img`}
              src={slide.image}
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
              className="max-h-[420px] w-auto animate-in fade-in zoom-in-95 object-contain duration-700"
              style={{ filter: `drop-shadow(0 30px 50px rgba(${slide.glow}, 0.4))` }}
            />
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

      {/* Prickar */}
      <div className="carousel-dots absolute inset-x-0 bottom-6 z-20">
        {SLIDES.map((item, dotIndex) => (
          <button
            key={item.id}
            type="button"
            onClick={() => go(dotIndex)}
            data-active={dotIndex === index}
            className="carousel-dot"
            aria-label={`Visa ${item.eyebrow}`}
            aria-current={dotIndex === index ? "true" : undefined}
          />
        ))}
      </div>
    </section>
  );
};
