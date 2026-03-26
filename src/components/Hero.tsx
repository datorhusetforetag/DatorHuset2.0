import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useRef } from "react";
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

  const handleCarouselWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const container = carouselRef.current;
    if (!container) return;
    const dominantDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(dominantDelta) < 8) return;
    event.preventDefault();
    const cardWidth = 384 + 16;
    container.scrollBy({ left: dominantDelta > 0 ? cardWidth : -cardWidth, behavior: "smooth" });
  };

  return (
    <section className="bg-white transition-colors dark:bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:mb-12 sm:gap-6 md:grid-cols-3">
          <div
            className="col-span-1 flex min-h-[230px] flex-col justify-between rounded-lg border border-yellow-500 bg-yellow-400 p-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 sm:min-h-[320px] sm:p-6 lg:p-8 md:col-span-2"
            style={{
              animationDuration: `${motion.heroRevealDurationMs}ms`,
              ["--tw-enter-translate-y" as string]: `${motion.bannerRevealDistancePx}px`,
            }}
          >
            <div>
              <h2 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">{settings.title}</h2>
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 sm:text-base">
                {settings.subtitle} <ChevronRight className="inline h-5 w-5" />
              </p>
            </div>
            <div className="flex h-28 items-center justify-between overflow-hidden rounded-lg border border-yellow-500/40 bg-white/80 px-4 dark:border-gray-700 dark:bg-gray-800 sm:h-36 sm:px-6">
              <div className="relative z-10 pr-3">
                <p className="text-sm uppercase tracking-[0.18em] text-gray-600 dark:text-gray-300">{settings.featureEyebrow}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 sm:text-base">{settings.featureTitle}</p>
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
            className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-lg bg-gray-900 p-4 animate-in fade-in slide-in-from-bottom-4 sm:min-h-[320px] sm:p-6 lg:p-8"
            style={{
              animationDuration: `${motion.heroRevealDurationMs}ms`,
              animationDelay: `${motion.heroRevealStaggerMs}ms`,
              ["--tw-enter-translate-y" as string]: `${motion.bannerRevealDistancePx}px`,
            }}
          >
            <div className="relative z-10">
              <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl">{settings.secondaryTitle}</h2>
              <p className="mb-4 text-sm text-white">{settings.secondaryDescription}</p>
              <p className="text-sm font-semibold text-yellow-400">{settings.secondaryNote}</p>
            </div>
            <div className="relative z-10 flex gap-2">
              <span className="rounded bg-yellow-400 px-3 py-1 text-sm font-bold text-gray-900">{settings.secondaryBadge}</span>
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

        <div className="mb-12">
          <h3 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">{settings.categoriesTitle}</h3>
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
                className="rounded-lg border border-gray-200 bg-white p-4 text-center transition-all hover:border-[#11667b] hover:shadow-lg hover:[transform:scale(var(--card-hover-scale))] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-[#11667b] dark:hover:bg-gray-800 sm:p-6"
                style={{ ["--card-hover-scale" as string]: String(motion.cardHoverScale) }}
              >
                <SiteIcon icon={category.icon} className="mx-auto mb-3 h-8 w-8 text-yellow-500 sm:h-10 sm:w-10" />
                <p className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100">{category.name}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="relative mb-12">
          <h3 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">{settings.featuredTitle}</h3>
          <div className="relative">
            <div
              ref={carouselRef}
              onWheel={handleCarouselWheel}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 pr-4 no-scrollbar"
            >
              {featuredComputers.map((computer, index) => (
                <Link
                  key={computer.id}
                  to={`/computer/${computer.id}`}
                  className="w-72 flex-shrink-0 snap-start overflow-hidden rounded-lg border border-gray-200 bg-white transition-all animate-in fade-in slide-in-from-bottom-4 hover:border-[#11667b] hover:shadow-lg hover:[transform:scale(var(--card-hover-scale))] dark:border-gray-700 dark:bg-gray-900 dark:hover:border-[#11667b] sm:w-80 md:w-96"
                  style={{
                    animationDuration: `${motion.bannerRevealDurationMs}ms`,
                    animationDelay: `${index * motion.heroRevealStaggerMs}ms`,
                    ["--card-hover-scale" as string]: String(motion.cardHoverScale),
                    ["--tw-enter-translate-y" as string]: `${motion.bannerRevealDistancePx}px`,
                  }}
                >
                  <div className="flex h-44 items-center justify-center bg-gray-100 dark:bg-gray-800 sm:h-52">
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
                    <h4 className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900 hover:text-[#11667b] dark:text-gray-100 dark:hover:text-[#11667b]">
                      {computer.name}
                    </h4>
                    <div className="mb-4 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-300">
                      <p className="line-clamp-2">{computer.cpu}</p>
                      <p className="line-clamp-2">{computer.gpu}</p>
                      <p className="line-clamp-2">{computer.ram}</p>
                    </div>
                    <div className="mb-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {computer.price.toLocaleString("sv-SE")} kr
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{settings.featuredInventoryLabel}</p>
                  </div>
                </Link>
              ))}
            </div>
            <button
              onClick={() => scrollByCards("left")}
              className="absolute -left-14 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white p-2 shadow transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800 md:flex"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-6 w-6 text-gray-900 dark:text-gray-100" />
            </button>
            <button
              onClick={() => scrollByCards("right")}
              className="absolute -right-14 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white p-2 shadow transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800 md:flex"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-6 w-6 text-gray-900 dark:text-gray-100" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
