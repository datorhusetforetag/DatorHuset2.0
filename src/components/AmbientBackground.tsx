/**
 * Levande bakgrund.
 *
 * Två sorters rörelse, båda avsiktligt långsamma:
 *
 *   Ljusfälten driver runt på 30-45 sekunders varv. Så trögt att man
 *   inte ser dem röra sig om man tittar rakt på dem, men tillräckligt
 *   för att ytan inte ska kännas som en stillbild.
 *
 *   Strimmorna faller uppifrån och ned, som Starforges smala streck.
 *   Några stycken, alla olika snabba och med olika fördröjning, så att
 *   mönstret inte går att läsa av.
 *
 * Endast transform och opacity animeras. Båda hanteras av grafikkortet
 * utan att layouten räknas om, vilket är skillnaden mellan en bakgrund
 * som lever och en som får fläkten att gå igång.
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
};

const BLOBS: Blob[] = [
  {
    color: "63, 217, 245",
    className: "left-[-12%] top-[-8%] h-[52vw] w-[52vw]",
    style: { animation: "drift-a 38s ease-in-out infinite" },
  },
  {
    color: "178, 107, 222",
    className: "right-[-14%] top-[12%] h-[58vw] w-[58vw]",
    style: { animation: "drift-b 45s ease-in-out infinite" },
  },
  {
    color: "110, 43, 146",
    className: "bottom-[-18%] left-[18%] h-[50vw] w-[50vw]",
    style: { animation: "drift-a 52s ease-in-out infinite reverse" },
  },
];

/** Strimmorna: vänsterposition, längd, varvtid och fördröjning. */
const STREAKS = [
  { left: "12%", height: "22vh", duration: "14s", delay: "0s", color: "63, 217, 245" },
  { left: "27%", height: "16vh", duration: "19s", delay: "4s", color: "178, 107, 222" },
  { left: "54%", height: "26vh", duration: "16s", delay: "8s", color: "63, 217, 245" },
  { left: "71%", height: "18vh", duration: "22s", delay: "2s", color: "178, 107, 222" },
  { left: "88%", height: "20vh", duration: "17s", delay: "11s", color: "63, 217, 245" },
];

export const AmbientBackground = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden motion-reduce:hidden"
    >
      {BLOBS.map((blob, index) => (
        <div
          key={`blob-${index}`}
          className={`absolute rounded-full blur-[90px] ${blob.className}`}
          style={{
            ...blob.style,
            background: `radial-gradient(circle at 50% 50%, rgba(${blob.color}, 0.5) 0%, rgba(${blob.color}, 0.16) 45%, transparent 70%)`,
            willChange: "transform",
          }}
        />
      ))}

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
  );
};

export default AmbientBackground;
