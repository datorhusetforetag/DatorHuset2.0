import { useEffect, useRef } from "react";

/**
 * Levande bakgrund.
 *
 * Tre sorters rörelse, alla avsiktligt långsamma:
 *
 *   Ljusfälten driver runt på 30-45 sekunders varv. Så trögt att man
 *   inte ser dem röra sig om man tittar rakt på dem, men tillräckligt
 *   för att ytan inte ska kännas som en stillbild.
 *
 *   Strimmorna faller uppifrån och ned, som Starforges smala streck.
 *   Några stycken, alla olika snabba och med olika fördröjning, så att
 *   mönstret inte går att läsa av.
 *
 *   Och så djupet: allting glider uppåt när man rullar, men olika fort.
 *   Det är det som gör skillnaden. Ett lager som ligger blickstilla mot
 *   fönstret läses som en tapet bakom sidan; flyttar sig punktrastret
 *   långsammare än ljusen, och ljusen långsammare än innehållet, läser
 *   ögat i stället in ett avstånd mellan dem. Samma knep som en kuliss
 *   på en teaterscen.
 *
 * Rullningen skrivs som en CSS-variabel rakt på elementet, inte som
 * state. Ett state-byte per bildruta hade ritat om hela trädet medan
 * man rullar; en variabel rör bara de lager som läser den, och varje
 * lager flyttas med transform som grafikkortet klarar på egen hand.
 *
 * Lagret ligger fast mot fönstret, bakom allt innehåll, och tar aldrig
 * emot klick. Har besökaren bett om mindre rörelse ritas det inte alls -
 * ljus som rör sig är precis vad den inställningen finns till för.
 */

type Blob = {
  /** Kulör som RGB utan alfa. */
  color: string;
  className: string;
  style: React.CSSProperties;
  /** Hur mycket lagret flyttas per rullad pixel. Mindre = längre bort. */
  parallax: number;
};

const BLOBS: Blob[] = [
  {
    color: "198, 150, 235",
    className: "left-[-12%] top-[-8%] h-[52vw] w-[52vw]",
    style: { animation: "drift-a 38s ease-in-out infinite" },
    parallax: -0.08,
  },
  {
    color: "178, 107, 222",
    className: "right-[-14%] top-[12%] h-[58vw] w-[58vw]",
    style: { animation: "drift-b 45s ease-in-out infinite" },
    parallax: -0.14,
  },
  {
    color: "110, 43, 146",
    className: "bottom-[-18%] left-[18%] h-[50vw] w-[50vw]",
    style: { animation: "drift-a 52s ease-in-out infinite reverse" },
    parallax: -0.05,
  },
];

/** Strimmorna: vänsterposition, längd, varvtid och fördröjning. */
const STREAKS = [
  { left: "12%", height: "22vh", duration: "14s", delay: "0s", color: "198, 150, 235" },
  { left: "27%", height: "16vh", duration: "19s", delay: "4s", color: "178, 107, 222" },
  { left: "54%", height: "26vh", duration: "16s", delay: "8s", color: "198, 150, 235" },
  { left: "71%", height: "18vh", duration: "22s", delay: "2s", color: "178, 107, 222" },
  { left: "88%", height: "20vh", duration: "17s", delay: "11s", color: "198, 150, 235" },
];

/** Hur långt ett lager flyttas, uttryckt mot den rullade sträckan. */
const shift = (rate: number) =>
  `translate3d(0, calc(var(--ambient-scroll, 0px) * ${rate}), 0)`;

export const AmbientBackground = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof window === "undefined") return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const write = () => {
      frame = 0;
      node.style.setProperty("--ambient-scroll", `${window.scrollY}px`);
    };

    // Rullningen kommer tätare än skärmen hinner rita. Utan den här
    // spärren skrivs variabeln flera gånger per bildruta i onödan.
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };

    write();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden motion-reduce:hidden"
    >
      {/*
        Punktrastret. Det ligger längst bak och rör sig minst, och det är
        det som ger de mjuka ljusen något att mätas mot - utan en yta med
        struktur i finns det inget som avslöjar att de rör sig alls.
      */}
      <div
        className="ambient-grid absolute inset-[-10%]"
        style={{ transform: shift(-0.03) }}
      />

      {BLOBS.map((blob, index) => (
        <div
          key={`blob-${index}`}
          className="absolute inset-0"
          style={{ transform: shift(blob.parallax), willChange: "transform" }}
        >
          <div
            className={`absolute rounded-full blur-[90px] ${blob.className}`}
            style={{
              ...blob.style,
              background: `radial-gradient(circle at 50% 50%, rgba(${blob.color}, 0.5) 0%, rgba(${blob.color}, 0.16) 45%, transparent 70%)`,
              willChange: "transform",
            }}
          />
        </div>
      ))}

      <div
        className="absolute inset-0"
        style={{ transform: shift(-0.18), willChange: "transform" }}
      >
        {STREAKS.map((streak, index) => (
          <span
            key={`streak-${index}`}
            className="absolute top-0 w-px"
            style={{
              left: streak.left,
              height: streak.height,
              background: `linear-gradient(180deg, transparent 0%, rgba(${streak.color}, 0.55) 45%, transparent 100%)`,
              animation: `streak-fall ${streak.duration} linear ${streak.delay} infinite`,
              willChange: "transform",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AmbientBackground;
