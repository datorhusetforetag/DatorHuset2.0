import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Vänstra halvan av produktsidan: datorn på en upplyst scen.
 *
 * VARFÖR DET INTE ÄR EN RIKTIG FRILAGD BILD
 *
 * Förlagan visar en renderad dator som svävar fritt på en mjuk yta.
 * Det fungerar där för att deras bilder är renderingar med
 * genomskinlig bakgrund. Våra är fotografier: alla utom en är helt
 * ogenomskinliga med egen bakgrund och eget ljus. Att lägga ett sådant
 * foto "fritt" på duken ger exakt det som redan påpekats om
 * banderollerna - en rektangel klistrad ovanpå en annan bild, och en
 * skugga gör den inte svävande utan bara till en rektangel med skugga.
 *
 * Så i stället byggs en scen omkring fotot:
 *
 *   ljuset    en rund glöd i nivåns kulör bakom datorn, samma grepp
 *             som nivåavsnittet på startsidan
 *   rastret   hårfina linjer som ger scenen ett golv att stå på
 *   masken    fotots ytterkanter tonas ut i scenen i stället för att
 *             sluta tvärt. Det är det enda som faktiskt löser upp
 *             rektangeln, och därför det viktigaste av de tre.
 *   golvet    en mjuk ellips under datorn, som en skugga mot underlaget
 *
 * Masken tonar bara de yttersta procenten. Tas mer bort börjar motivet
 * självt blekna i kanterna, och en dator vars sidopanel försvinner i
 * dimma ser trasig ut snarare än svävande.
 *
 * NÄR NI HAR EGNA RENDERINGAR med genomskinlig bakgrund kan masken tas
 * bort helt - då räcker glöden och golvskuggan, precis som för
 * nivåbilderna på startsidan.
 */

type ProductStageProps = {
  images: string[];
  index: number;
  onIndexChange: (next: number) => void;
  alt: string;
  /** Nivåns kulör. Styr ljuset bakom datorn. */
  accent: string;
  /** Visas som en liten etikett i hörnet. */
  note?: string;
  fallbackImage: string;
};

export const ProductStage = ({
  images,
  index,
  onIndexChange,
  alt,
  accent,
  note,
  fallbackImage,
}: ProductStageProps) => {
  const hasMultiple = images.length > 1;
  const current = images[index] || images[0] || fallbackImage;

  const step = (delta: number) => {
    if (!hasMultiple) return;
    onIndexChange((index + delta + images.length) % images.length);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="product-stage" style={{ ["--stage-accent" as string]: accent }}>
        <span aria-hidden="true" className="product-stage__glow" />
        <span aria-hidden="true" className="product-stage__grid" />

        {note && <span className="product-stage__note">{note}</span>}

        <div className="product-stage__frame">
          <img
            key={current}
            src={current}
            alt={alt}
            className="product-stage__image"
            loading="eager"
            decoding="async"
            draggable={false}
            onError={(event) => {
              event.currentTarget.src = fallbackImage;
            }}
          />
          <span aria-hidden="true" className="product-stage__floor" />
        </div>

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Föregående bild"
              className="product-stage__arrow left-3 sm:left-5"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Nästa bild"
              className="product-stage__arrow right-3 sm:right-5"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Miniatyrerna, centrerade under scenen som i förlagan. */}
      {hasMultiple && (
        <div className="flex flex-wrap justify-center gap-2.5">
          {images.map((image, position) => {
            const active = position === index;
            return (
              <button
                key={`${image}-${position}`}
                type="button"
                onClick={() => onIndexChange(position)}
                aria-label={`Visa bild ${position + 1}`}
                aria-current={active}
                className="h-14 w-16 overflow-hidden rounded-sm border bg-foreground/[0.04] transition-all sm:h-16 sm:w-20"
                style={{
                  borderColor: active ? accent : "hsl(var(--foreground) / 0.15)",
                  boxShadow: active ? `0 0 0 1px ${accent}, 0 0 18px ${accent}40` : undefined,
                }}
              >
                <img
                  src={image}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
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
