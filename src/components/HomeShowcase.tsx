import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { useShowcaseComputers, type ShowcaseComputer } from "@/hooks/useShowcaseComputers";
import { useUpgradePricing, type UpgradePricing } from "@/hooks/useUpgradePricing";
import { PcCard } from "./PcCard";
import { Reveal } from "./Reveal";

/**
 * Två rader datorer på startsidan: först DatorHusets val, sedan det som
 * står i lager och kan skickas direkt.
 *
 * Varje rad visar tre datorer i taget och rullas i sidled - med pilarna,
 * med ett svep på telefon eller med styrplattan.
 *
 * Korten är PcCard, samma kort som produktsidans rutnät.
 */

type RowProps = {
  id: string;
  eyebrow: string;
  title: string;
  lede: string;
  href: string;
  linkLabel: string;
  items: ShowcaseComputer[];
  pricing: UpgradePricing;
  loading?: boolean;
  empty?: ReactNode;
};

const ShowcaseRow = ({ id, eyebrow, title, lede, href, linkLabel, items, pricing, loading, empty }: RowProps) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  /* Pilarna tänds bara när det finns något att rulla till.
     Mäts mot korten själva och inte mot scrollWidth: glöden runt korten
     sticker ut åt sidorna och räknas av webbläsaren som innehåll, så
     scrollWidth sa att det fanns mer att se fast alla kort redan syntes. */
  const update = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const slots = track.querySelectorAll<HTMLElement>(".showcase-slot");
    const first = slots[0];
    const last = slots[slots.length - 1];
    if (!first || !last) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    const style = getComputedStyle(track);
    const box = track.getBoundingClientRect();
    const left = box.left + parseFloat(style.paddingLeft);
    const right = box.right - parseFloat(style.paddingRight);
    setCanPrev(first.getBoundingClientRect().left < left - 4);
    setCanNext(last.getBoundingClientRect().right > right + 4);
  }, []);

  useEffect(() => {
    update();
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, items.length]);

  /* En pil flyttar en hel skärmbredd av kort - tre på dator. */
  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth, behavior: "smooth" });
  };

  const arrowClass =
    "flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white/40 hover:text-white disabled:pointer-events-none disabled:opacity-30";

  return (
    <div aria-labelledby={`${id}-title`}>
      <Reveal className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={`${id}-title`} className="section-title mt-3 text-3xl sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/65">{lede}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={href}
            className="mr-2 inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 transition-colors hover:text-white"
          >
            {linkLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          {/* Får alla kort plats behövs inga pilar alls - två släckta
              knappar hade sett ut som något som inte fungerade. */}
          {(canPrev || canNext) && (
            <>
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                disabled={!canPrev}
                aria-label={`Föregående i ${title}`}
                className={arrowClass}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                disabled={!canNext}
                aria-label={`Nästa i ${title}`}
                className={arrowClass}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </Reveal>

      {/*
        Raden. En rullbar behållare klipper allt som sticker utanför den,
        och här sticker både tornet upp ur kortet, glöden ut åt sidorna och
        skuggan ned åt vänster. Därför har raden luft runt korten - utfyllnad
        som tas tillbaka med negativa marginaler, så korten ändå linjerar med
        rubriken ovanför.
      */}
      {loading ? (
        <div className="showcase-track">
          {[0, 1, 2].map((key) => (
            <div key={key} className="showcase-slot">
              <div className="pc-card pc-card--skeleton" aria-hidden="true" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8">{empty}</div>
      ) : (
        <div ref={trackRef} className="showcase-track no-scrollbar">
          {items.map((item) => (
            <div key={item.computer.id} className="showcase-slot">
              <PcCard
                computer={item.computer}
                name={item.name}
                price={item.price}
                cpu={item.cpu}
                gpu={item.gpu}
                badge={
                  item.inStock
                    ? { label: "I lager", tone: "stock" }
                    : item.canPreorder
                      ? { label: "Förbeställ", tone: "preorder" }
                      : null
                }
                pricing={pricing}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const HomeShowcase = () => {
  const { inStock, picks, inventoryLoaded } = useShowcaseComputers();
  const { pricing } = useUpgradePricing();

  return (
    <section data-sandbox-id="home-showcase" className="relative text-foreground">
      <div className="container mx-auto max-w-6xl space-y-20 px-4 pt-16 pb-24 sm:pt-20 sm:pb-28">
        <ShowcaseRow
          id="showcase-picks"
          eyebrow="Handplockat"
          title="DatorHusets val"
          lede="Byggena vi själva helst rekommenderar just nu, handplockade ur sortimentet."
          href="/products?clear_filters=1"
          linkLabel="Se alla datorer"
          items={picks}
          pricing={pricing}
        />

        <ShowcaseRow
          id="showcase-stock"
          eyebrow="I lager"
          title="Redo att skickas"
          lede="Färdigbyggda, testade och klara att packa. Beställ i dag så skickas datorn inom 3-5 arbetsdagar."
          href="/products?stock=in-stock&clear_filters=1"
          linkLabel="Se allt i lager"
          items={inStock}
          pricing={pricing}
          loading={!inventoryLoaded}
          empty={
            <div className="info-panel flex flex-col gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-relaxed text-white/70">
                Just nu står ingen färdigbyggd dator på hyllan. Förbeställ, så bygger vi
                din - vanligtvis klar att skickas inom 5-10 dagar.
              </p>
              <Link to="/products?stock=preorder&clear_filters=1" className="btn-primary shrink-0 rounded-full">
                Se förbeställningar
              </Link>
            </div>
          }
        />
      </div>
    </section>
  );
};

export default HomeShowcase;
