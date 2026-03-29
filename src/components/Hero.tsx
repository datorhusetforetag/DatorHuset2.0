import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef } from "react";
import { COMPUTERS } from "@/data/computers";
import { useProducts } from "@/hooks/useProducts";
import { buildProductLookup, getProductFromLookup, mergeProductFields } from "@/lib/productOverrides";
import { resolveProductImage } from "@/lib/productImageResolver";
import { DEFAULT_SITE_SETTINGS, type SiteHeroCategory, type SiteSettings } from "@/lib/siteSettings";
import { buildUtmContent, withUtm } from "@/lib/utm";
import { SiteIcon } from "./SiteIcon";
import winMouseImage from "../../images/WinMouse.png";

const FALLBACK_IMAGE = "/Datorhuset.png";

type HeroProps = {
  settings?: SiteSettings["homepage"]["hero"];
  motion?: SiteSettings["site"]["motion"];
};

export const Hero = ({
  settings = DEFAULT_SITE_SETTINGS.homepage.hero,
  motion = DEFAULT_SITE_SETTINGS.site.motion,
}: HeroProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const { products } = useProducts();
  const productLookup = useMemo(() => buildProductLookup(products), [products]);
  const featuredComputers = useMemo(
    () =>
      COMPUTERS.slice(0, Math.max(settings.featuredCount, 0)).map((computer) => {
        const product =
          getProductFromLookup(productLookup, computer.name) ||
          getProductFromLookup(productLookup, computer.id);
        const merged = mergeProductFields(
          {
            name: computer.name,
            price: computer.price,
            cpu: computer.cpu,
            gpu: computer.gpu,
            ram: computer.ram,
            storage: computer.storage,
            storagetype: computer.storagetype,
            tier: computer.tier,
          },
          product,
        );
        const image = resolveProductImage(product, computer.image) || FALLBACK_IMAGE;
        return {
          ...computer,
          name: merged.name,
          price: merged.price,
          cpu: merged.cpu,
          gpu: merged.gpu,
          ram: merged.ram,
          storage: merged.storage,
          storagetype: merged.storagetype,
          tier: merged.tier,
          image,
        };
      }),
    [productLookup, settings.featuredCount],
  );

  const scrollByCards = (direction: "left" | "right") => {
    const container = carouselRef.current;
    if (!container) return;
    const cardWidth = 384 + 16;
    container.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      if (container.scrollWidth <= container.clientWidth) return;
      const dominantDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (Math.abs(dominantDelta) < 8) return;
      event.stopPropagation();
      event.preventDefault();
      const cardWidth = 384 + 16;
      container.scrollBy({ left: dominantDelta > 0 ? cardWidth : -cardWidth, behavior: "smooth" });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <section data-sandbox-id="home-hero" className="bg-[var(--site-surface-bg)] transition-colors dark:bg-[var(--site-surface-bg-dark)]">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:mb-12 sm:gap-6 md:grid-cols-3">
          <div
            className="col-span-1 flex min-h-[230px] flex-col justify-between rounded-lg border p-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 sm:min-h-[320px] sm:p-6 lg:p-8 md:col-span-2"
            style={{
              animationDuration: `${motion.heroRevealDurationMs}ms`,
              ["--tw-enter-translate-y" as string]: `${motion.bannerRevealDistancePx}px`,
              borderColor: "var(--site-brand-bg)",
              backgroundColor: "var(--site-brand-bg)",
              color: "var(--site-brand-text)",
            }}
          >
            <div>
              <h2 className="mb-3 text-3xl font-bold sm:text-4xl lg:text-5xl">{settings.title}</h2>
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold sm:text-base">
                {settings.subtitle} <ChevronRight className="inline h-5 w-5" />
              </p>
            </div>
            <div
              className="flex h-28 items-center justify-between overflow-hidden rounded-lg border px-4 sm:h-36 sm:px-6"
              style={{
                borderColor: "color-mix(in srgb, var(--site-brand-text) 18%, transparent)",
                backgroundColor: "var(--site-hero-frame-bg-current)",
              }}
            >
              <div className="relative z-10 pr-3">
                <p className="text-sm uppercase tracking-[0.18em]" style={{ color: "var(--site-text-muted-current)" }}>{settings.featureEyebrow}</p>
                <p className="text-sm font-semibold sm:text-base" style={{ color: "var(--site-text-primary-current)" }}>{settings.featureTitle}</p>
              </div>
              <img
                src={settings.featureImage}
                alt={settings.featureImageAlt}
                className="h-[88%] w-auto max-w-[42%] object-contain object-right drop-shadow-[0_16px_28px_rgba(0,0,0,0.25)] sm:max-w-[40%] md:max-w-[38%]"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          <div
            className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-lg p-4 animate-in fade-in slide-in-from-bottom-4 sm:min-h-[320px] sm:p-6 lg:p-8"
            style={{
              animationDuration: `${motion.heroRevealDurationMs}ms`,
              animationDelay: `${motion.heroRevealStaggerMs}ms`,
              ["--tw-enter-translate-y" as string]: `${motion.bannerRevealDistancePx}px`,
              backgroundColor: "var(--site-accent-bg)",
              color: "var(--site-accent-text)",
            }}
          >
            <div className="relative z-10">
              <h2 className="mb-2 text-2xl font-bold sm:text-3xl">{settings.secondaryTitle}</h2>
              <p className="mb-4 text-sm opacity-95">{settings.secondaryDescription}</p>
              <p className="text-sm font-semibold" style={{ color: "var(--site-brand-bg)" }}>{settings.secondaryNote}</p>
            </div>
            <div className="relative z-10 flex gap-2">
              <span
                className="rounded px-3 py-1 text-sm font-bold"
                style={{ backgroundColor: "var(--site-brand-bg)", color: "var(--site-brand-text)" }}
              >
                {settings.secondaryBadge}
              </span>
            </div>
            <img
              src={winMouseImage}
              alt="Gava vid kop"
              className="pointer-events-none absolute -bottom-8 -right-6 w-40 opacity-90 drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)] sm:w-48 md:w-56"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div className="mb-12" data-sandbox-id="home-categories">
          <h3 className="mb-6 text-2xl font-bold text-[var(--site-text-primary)] dark:text-[var(--site-text-primary-dark)]">{settings.categoriesTitle}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {settings.categories.map((category: SiteHeroCategory) => (
              <Link
                key={category.name}
                to={withUtm(category.href, {
                  utm_source: "homepage",
                  utm_medium: "category_card",
                  utm_campaign: "populara_kategorier",
                  utm_content: buildUtmContent(category.name),
                })}
                className="rounded-lg border p-4 text-center transition-all hover:shadow-lg sm:p-6"
                style={{
                  borderColor: "var(--site-card-border-current)",
                  backgroundColor: "var(--site-card-bg-current)",
                  color: "var(--site-text-primary-current)",
                }}
              >
                <div className="mx-auto mb-3 h-8 w-8 sm:h-10 sm:w-10" style={{ color: "var(--site-brand-bg)" }}>
                  <SiteIcon icon={category.icon} className="h-full w-full" />
                </div>
                <p className="line-clamp-2 text-sm font-medium">{category.name}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="relative mb-12">
          <h3 className="mb-6 text-2xl font-bold text-[var(--site-text-primary)] dark:text-[var(--site-text-primary-dark)]">{settings.featuredTitle}</h3>
          <div className="relative">
            <div
              ref={carouselRef}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth overscroll-x-contain overscroll-y-none pb-4 pr-4 no-scrollbar"
            >
              {featuredComputers.map((computer, index) => (
                <Link
                  key={computer.id}
                  to={`/computer/${computer.id}`}
                  className="w-72 flex-shrink-0 snap-start overflow-hidden rounded-lg border transition-all animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg sm:w-80 md:w-96"
                  style={{
                    animationDuration: `${motion.bannerRevealDurationMs}ms`,
                    animationDelay: `${index * motion.heroRevealStaggerMs}ms`,
                    ["--tw-enter-translate-y" as string]: `${motion.bannerRevealDistancePx}px`,
                    borderColor: "var(--site-card-border-current)",
                    backgroundColor: "var(--site-card-bg-current)",
                    color: "var(--site-text-primary-current)",
                  }}
                >
                  <div className="flex h-44 items-center justify-center sm:h-52" style={{ backgroundColor: "var(--site-muted-bg-current)" }}>
                    <img
                      src={computer.image}
                      alt={computer.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="mb-2 line-clamp-2 text-sm font-semibold">
                      {computer.name}
                    </h4>
                    <div className="mb-4 space-y-1 border-t pt-3 text-xs" style={{ borderColor: "var(--site-card-border-current)", color: "var(--site-text-muted-current)" }}>
                      <p className="line-clamp-2">{computer.cpu}</p>
                      <p className="line-clamp-2">{computer.gpu}</p>
                      <p className="line-clamp-2">{computer.ram}</p>
                    </div>
                    <div className="mb-1 text-2xl font-bold">
                      {computer.price.toLocaleString("sv-SE")} kr
                    </div>
                    <p className="text-xs" style={{ color: "var(--site-text-muted-current)" }}>{settings.featuredInventoryLabel}</p>
                  </div>
                </Link>
              ))}
            </div>
            <button
              onClick={() => scrollByCards("left")}
              className="absolute -left-14 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border p-2 shadow md:flex"
              style={{ borderColor: "var(--site-card-border-current)", backgroundColor: "var(--site-card-bg-current)" }}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => scrollByCards("right")}
              className="absolute -right-14 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border p-2 shadow md:flex"
              style={{ borderColor: "var(--site-card-border-current)", backgroundColor: "var(--site-card-bg-current)" }}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
