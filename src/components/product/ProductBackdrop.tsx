import { useId, useMemo } from "react";

import type { ProductArt } from "@/data/productArt";

/**
 * Duken bakom den svävande datorn - en egen per maskin.
 *
 * Förlagan har en målad scen bakom varje dator. Vi har ingen
 * illustratör, men vi har datorernas egna kulörer, och det räcker för
 * att varje sida ska se ut som sitt eget rum i stället för som samma
 * mall sju gånger.
 *
 * TVÅ SORTER, se BackdropKind i src/data/productArt.ts.
 *
 * AURA - toning, ljus och stoft
 *
 * Prickarna ligger i en SVG med fasta koordinater, inte i procent.
 * Procent räknas om vid varje ändrad fönsterbredd, och då räknas hela
 * mönstret om medan man drar i fönstret. Mönstret är slumpat men inte
 * slumpmässigt: fröet kommer ur maskinens id, så samma dator får samma
 * stoft varje gång sidan öppnas.
 *
 * STUDIO - rund skiva, golv och vinjett
 *
 * Byggd som en riktig produktfotografering: en stor lyst skiva som
 * fond, ett golv framför den som ljuset spiller ned på, och mörker i
 * kanterna. Datorn står mitt i skivan.
 *
 * Kornet överst är inte dekoration. En skiva som den här är en väldig
 * mjuk toning, och mjuka toningar över stora ytor ger synliga band på
 * vanliga skärmar - kanten mellan två närliggande nyanser blir en
 * rand. Ett svagt brus ovanpå bryter upp banden. Det ritas en gång med
 * feTurbulence och rör sig aldrig.
 *
 * Inget stoft i studio: förlagan är en stillbild i en ren studio, och
 * damm i luften hade motsagt just det.
 */

/** Liten deterministisk generator, så duken ser likadan ut varje gång. */
const seeded = (seed: number) => {
  let value = seed || 1;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
};

const hashOf = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 2147483647;
  }
  return hash;
};

type Mote = {
  cx: number;
  cy: number;
  r: number;
  delay: number;
  duration: number;
  opacity: number;
};

const MOTE_COUNT = 26;

export const ProductBackdrop = ({
  art,
  seedKey,
}: {
  art: ProductArt;
  /** Maskinens id. Styr stoftets mönster. */
  seedKey: string;
}) => {
  const grainId = useId();
  const studio = art.backdrop.kind === "studio";

  const motes = useMemo<Mote[]>(() => {
    if (studio) return [];
    const random = seeded(hashOf(seedKey) + 7);
    return Array.from({ length: MOTE_COUNT }, () => ({
      cx: random() * 1000,
      cy: random() * 1000,
      r: 1.5 + random() * 4.5,
      delay: -random() * 26,
      duration: 18 + random() * 18,
      opacity: 0.18 + random() * 0.4,
    }));
  }, [seedKey, studio]);

  if (studio) {
    const disc = art.backdrop.disc ?? art.backdrop.glow;
    const discEdge = art.backdrop.discEdge ?? art.backdrop.to;
    const floor = art.backdrop.floor ?? art.backdrop.to;

    return (
      <div aria-hidden="true" className="product-backdrop product-backdrop--studio">
        {/* Fonden */}
        <div
          className="product-backdrop__wall"
          style={{
            background: `linear-gradient(180deg, ${art.backdrop.from} 0%, ${art.backdrop.to} 100%)`,
          }}
        />

        {/* Skivan. Ljuset sitter en bit upp till vänster i den, som i
            förlagan - en helt centrerad ljuskälla ser tillverkad ut. */}
        <div
          className="product-backdrop__disc"
          style={{
            background: `radial-gradient(circle at 44% 38%, ${disc} 0%, ${disc}D9 28%, ${discEdge} 76%, ${discEdge}00 100%)`,
          }}
        />

        {/* Golvet, och ljuset som spiller ned på det framför datorn. */}
        <div
          className="product-backdrop__ground"
          style={{
            background: `linear-gradient(180deg, ${floor} 0%, ${art.backdrop.to} 100%)`,
          }}
        >
          <span
            className="product-backdrop__spill"
            style={{
              background: `radial-gradient(70% 120% at 50% -10%, ${disc}40 0%, transparent 70%)`,
            }}
          />
        </div>

        {/* Mörkret i kanterna. Det är den som gör att blicken stannar
            mitt i bilden i stället för att vandra ut i hörnen. */}
        <div className="product-backdrop__vignette" />

        <svg className="product-backdrop__grain" aria-hidden="true" focusable="false">
          <filter id={grainId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#${grainId})`} />
        </svg>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="product-backdrop">
      <div
        className="product-backdrop__wash"
        style={{
          background: `linear-gradient(155deg, ${art.backdrop.from} 0%, ${art.backdrop.to} 100%)`,
        }}
      />

      <div
        className="product-backdrop__glow"
        style={{
          background: `radial-gradient(48% 46% at 50% 48%, ${art.backdrop.glow}59 0%, ${art.backdrop.glow}1F 45%, transparent 72%)`,
        }}
      />

      <svg
        className="product-backdrop__motes"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        {motes.map((mote, index) => (
          <circle
            key={index}
            cx={mote.cx}
            cy={mote.cy}
            r={mote.r}
            fill={art.backdrop.glow}
            opacity={mote.opacity}
            style={{
              animation: `mote-drift ${mote.duration}s linear ${mote.delay}s infinite`,
            }}
          />
        ))}
      </svg>

      <div className="product-backdrop__floor" />
    </div>
  );
};

export default ProductBackdrop;
