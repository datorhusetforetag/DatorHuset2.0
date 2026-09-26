import { useId } from "react";

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
 * AURA - mörkt rum, glöd och dimma
 *
 * Ett mörkt rum där ljuset kommer ur maskinen: dukens kulör är
 * datorns egen blandad mot nästan svart, glöden sitter tätt bakom
 * chassit, och dimman ligger nedtill där golvet börjar.
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
 * Ingen dimma i studio: förlagan är en stillbild i en ren studio, och
 * dis i luften hade motsagt just det.
 */

export const ProductBackdrop = ({ art }: { art: ProductArt }) => {
  const grainId = useId();
  const studio = art.backdrop.kind === "studio";

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

        {/*
          Bordet.

          Ytan tonar INTE ned till fondens kulör. Gjorde den det blev
          bordet samma ton som väggen nedtill och försvann - man såg en
          kant högst upp och sedan ingenting. Nu håller den sin egen
          kulör större delen av djupet och mörknar bara en bit mot
          betraktaren, så planet syns hela vägen ned.
        */}
        <div
          className="product-backdrop__ground"
          style={{
            background: `linear-gradient(180deg, ${floor} 0%, ${floor} 46%, color-mix(in srgb, ${floor} 62%, #000) 100%)`,
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
      {/*
        Duken, tydligt mörkare än maskinens egna kulörer.

        Den var tidigare maskinens två kulörer rakt av, och blev då en
        ljus platt yta som datorn låg PÅ. En produktbild vill ha det
        omvända: ett mörkt rum som datorn står I, och ljuset kommer från
        maskinen. Kulörerna är kvar, blandade mot nästan svart, så varje
        sida behåller sin ton utan att konkurrera med motivet.
      */}
      <div
        className="product-backdrop__wash"
        style={{
          background: `linear-gradient(155deg, color-mix(in srgb, ${art.backdrop.from} 50%, #05030c) 0%, color-mix(in srgb, ${art.backdrop.to} 42%, #05030c) 100%)`,
        }}
      />

      {/* Glöden sitter tätt bakom datorn, inte över halva duken. En vid
          och svag glöd läser som en färgad bakgrund; en tät och stark
          läser som ljus som kommer ur maskinen. */}
      <div
        className="product-backdrop__glow"
        style={{
          background: `radial-gradient(38% 34% at 50% 46%, ${art.backdrop.glow}8C 0%, ${art.backdrop.glow}2E 42%, transparent 70%)`,
        }}
      />

      {/*
        Dimman.

        Här låg förut stoft - tjugosex prickar som drev uppåt. De rörde
        sig, och rörelse drar blicken; på en sida där man ska titta på
        datorn var det tjugosex saker som inte var datorn. Dimman ligger
        stilla, fyller samma uppgift - luft mellan betraktaren och
        bakgrunden - och lyser i maskinens kulör nedtill där den möter
        golvet.
      */}
      <div
        className="product-backdrop__fog"
        style={{
          background: `radial-gradient(76% 104% at 26% 102%, ${art.backdrop.glow}59 0%, transparent 66%), radial-gradient(64% 92% at 80% 106%, ${art.backdrop.glow}38 0%, transparent 60%)`,
        }}
      />

      <div className="product-backdrop__floor" />
      <div className="product-backdrop__vignette" />
    </div>
  );
};

export default ProductBackdrop;
