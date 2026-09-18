import { ChevronLeft, ChevronRight } from "lucide-react";

import { ProductBackdrop } from "./ProductBackdrop";
import type { ProductArt } from "@/data/productArt";

/**
 * Vänstra halvan av produktsidan: datorn svävande mot sin egen duk.
 *
 * TVÅ OLIKA LÄGEN, och skillnaden syns
 *
 * Finns ett urklipp av chassit svävar det fritt med en skugga under
 * sig - inget foto, ingen ram, ingen kant. Det är läget förlagan visar.
 *
 * Saknas urklipp visas fotot i stället, i en ram med rundade hörn. Det
 * är med flit att det då ser ut som ett foto och inte som ett halvdant
 * försök till svävning: ett fotografi med egen bakgrund som läggs fritt
 * på duken blir en rektangel klistrad ovanpå en annan bild, och det är
 * sämre än att bara visa fotot som ett foto.
 *
 * Miniatyrraden visar alltid de riktiga fotona. Urklippet är hur
 * chassit ser ut; fotona är hur maskinen faktiskt står i ett rum, och
 * båda behövs.
 */

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
  const hasMultiple = images.length > 1;
  const photo = images[index] || images[0] || fallbackImage;
  const floating = Boolean(art.cutout);

  const step = (delta: number) => {
    if (!hasMultiple) return;
    onIndexChange((index + delta + images.length) % images.length);
  };

  return (
    /* Duktypen skrivs ut på scenen så att skuggorna kan skilja sig åt.
       I studio står datorn på ett bord med riktat ljus; i aura svävar
       den i luften och har bara en mjuk skugga under sig. */
    <div className="product-stage" data-backdrop={art.backdrop.kind ?? "aura"}>
      <ProductBackdrop art={art} seedKey={seedKey} />

      {note && <span className="product-stage__note">{note}</span>}

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
              src={art.cutout}
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
            key={photo}
            src={photo}
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

      {/* Pilarna bläddrar bland fotona. De visas även i svävande läge,
          eftersom miniatyrraden nedanför byter foto och man ska kunna
          bläddra utan att sikta på en liten ruta. */}
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
          {images.map((image, position) => {
            const active = position === index;
            return (
              <button
                key={`${image}-${position}`}
                type="button"
                onClick={() => onIndexChange(position)}
                aria-label={`Visa bild ${position + 1}`}
                aria-current={active}
                className="product-stage__thumb"
                data-active={active || undefined}
                style={{ ["--thumb-accent" as string]: art.backdrop.glow }}
              >
                <img
                  src={image}
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
