import { useMemo } from "react";

import type { ProductArt } from "@/data/productArt";

/**
 * Duken bakom den svävande datorn - en egen per maskin.
 *
 * Förlagan har en målad scen bakom varje dator: snö och blommor för
 * den ena, något annat för nästa. Vi har ingen illustratör, men vi har
 * datorernas egna kulörer, och det räcker för att varje sida ska se ut
 * som sitt eget rum i stället för som samma mall sju gånger.
 *
 * Tre lager, och inte ett enda bildfilsanrop:
 *
 *   toningen   två kulörer ur maskinens egen belysning
 *   ljuset     en rund glöd bakom datorn, i fläktarnas kulör
 *   stoftet    små prickar som driver uppåt, som dammet i en
 *              strålkastare. Det är rörelsen som gör att duken läses
 *              som ett rum med luft i och inte som en gradient.
 *
 * Prickarna ligger i en SVG med fasta koordinater, inte i procent.
 * Procent räknas om vid varje ändrad fönsterbredd, och då räknas hela
 * mönstret om medan man drar i fönstret. Med ett fast rutnät som
 * skalas av viewBox rör sig ingenting utom det som ska röra sig.
 *
 * Mönstret är slumpat men inte slumpmässigt: fröet kommer ur maskinens
 * id, så samma dator får samma stoft varje gång sidan öppnas.
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
  const motes = useMemo<Mote[]>(() => {
    const random = seeded(hashOf(seedKey) + 7);
    return Array.from({ length: MOTE_COUNT }, () => ({
      cx: random() * 1000,
      cy: random() * 1000,
      r: 1.5 + random() * 4.5,
      delay: -random() * 26,
      duration: 18 + random() * 18,
      opacity: 0.18 + random() * 0.4,
    }));
  }, [seedKey]);

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

      {/* Golvet: duken mörknar nedåt så att datorn får något att stå
          på i stället för att hänga i ett tomrum. */}
      <div className="product-backdrop__floor" />
    </div>
  );
};

export default ProductBackdrop;
