import { ChevronLeft, ChevronRight } from "lucide-react";

import { ProductBackdrop } from "./ProductBackdrop";
import type { ProductArt } from "@/data/productArt";

/**
 * Vänstra halvan av produktsidan: datorn mot sin egen duk.
 *
 * MINIATYRRADEN STYR DEN STORA BILDEN
 *
 * Tidigare gjorde den inte det. När det fanns ett urklipp av chassit
 * visades alltid urklippet här uppe, hur man än bläddrade, medan
 * miniatyrerna i tysthet bytte fotot i specifikationsavsnittet långt
 * ned på sidan. Man klickade alltså på en bild och såg ingenting hända.
 *
 * Nu är urklippet en av vyerna i samma rad. Det ligger först, så sidan
 * fortfarande öppnar med den svävande datorn, och fotona följer efter.
 *
 * TVÅ OLIKA LÄGEN, och skillnaden syns
 *
 * Urklippet svävar fritt med en skugga under sig - inget foto, ingen
 * ram, ingen kant. Det är läget förlagan visar.
 *
 * Ett foto visas i en ram med rundade hörn. Det är med flit att det då
 * ser ut som ett foto och inte som ett halvdant försök till svävning:
 * ett fotografi med egen bakgrund som läggs fritt på duken blir en
 * rektangel klistrad ovanpå en annan bild, och det är sämre än att
 * bara visa fotot som ett foto.
 *
 * Urklippet är hur chassit ser ut; fotona är hur maskinen faktiskt står
 * i ett rum, och båda behövs.
 */

type StageView = {
  kind: "cutout" | "photo";
  src: string;
};

/** Vyerna i den ordning miniatyrraden visar dem. */
export const buildStageViews = (
  art: Pick<ProductArt, "cutout">,
  images: string[],
): StageView[] => [
  ...(art.cutout ? ([{ kind: "cutout", src: art.cutout }] as StageView[]) : []),
  ...images.map((src) => ({ kind: "photo", src }) as StageView),
];

type ProductStageProps = {
  art: ProductArt;
  seedKey: string;
  images: string[];
  index: number;
  onIndexChange: (next: number) => void;
  alt: string;
  note?: string;
  fallbackImage: string;
};

export const ProductStage = ({
  art,
  seedKey,
  images,
  index,
  onIndexChange,
  alt,
  note,
  fallbackImage,
}: ProductStageProps) => {
  const views = buildStageViews(art, images);
  const safeViews = views.length
    ? views
    : [{ kind: "photo", src: fallbackImage } as StageView];
  const hasMultiple = safeViews.length > 1;
  const current = safeViews[index] ?? safeViews[0];
  const floating = current.kind === "cutout";

  const step = (delta: number) => {
    if (!hasMultiple) return;
    onIndexChange((index + delta + safeViews.length) % safeViews.length);
  };

  return (
    /* Duktypen skrivs ut på scenen så att skuggorna kan skilja sig åt.
       I studio står datorn på ett bord med riktat ljus; i aura svävar
       den i luften och har bara en mjuk skugga under sig. */
    <div className="product-stage" data-backdrop={art.backdrop.kind ?? "aura"}>
      <ProductBackdrop art={art} seedKey={seedKey} />

      {/* Lappen gäller urklippet, som är en ritning av chassityp och
          inte ett foto av just den här maskinen. På ett riktigt foto
          vore den missvisande. */}
      {note && floating && <span className="product-stage__note">{note}</span>}

      <div className="product-stage__subject">
        {floating ? (
          <>
            {/* Två skuggor, inte en.
                Kontaktskuggan är den mörka fläcken precis där chassit
                möter bordet - den är det som gör att datorn STÅR på
                ytan i stället för att sväva över den. Slagskuggan är
                den långa, ljusare som faller åt höger, bort från
                ljuset i skivan. Bara den ena av dem ser fel ut: bara
                kontaktskugga ger ett föremål utan ljuskälla, bara
                slagskugga ger ett föremål som inte rör marken. */}
            <span aria-hidden="true" className="product-stage__cast" />
            <img
              src={current.src}
              alt={alt}
              className="product-stage__cutout"
              loading="eager"
              decoding="async"
              draggable={false}
            />
            <span aria-hidden="true" className="product-stage__shadow" />
          </>
        ) : (
          <img
            key={current.src}
            src={current.src}
            alt={alt}
            className="product-stage__photo"
            loading="eager"
            decoding="async"
            draggable={false}
            onError={(event) => {
              event.currentTarget.src = fallbackImage;
            }}
          />
        )}
      </div>

      {/* Pilarna bläddrar bland samma vyer som miniatyrerna, så att man
          kan byta bild utan att sikta på en liten ruta. */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Föregående bild"
            className="product-stage__arrow left-4 sm:left-6"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Nästa bild"
            className="product-stage__arrow right-4 sm:right-6"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {hasMultiple && (
        <div className="product-stage__thumbs">
          {safeViews.map((view, position) => {
            const active = position === index;
            return (
              <button
                key={`${view.src}-${position}`}
                type="button"
                onClick={() => onIndexChange(position)}
                aria-label={
                  view.kind === "cutout"
                    ? "Visa datorn fritt"
                    : `Visa bild ${position + 1}`
                }
                aria-current={active}
                className="product-stage__thumb"
                data-kind={view.kind}
                data-active={active || undefined}
                style={{ ["--thumb-accent" as string]: art.backdrop.glow }}
              >
                <img
                  src={view.src}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.src = fallbackImage;
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductStage;
