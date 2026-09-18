import caseNzxt from "../../images/cutouts/case-nzxt.png";
import caseO11 from "../../images/cutouts/case-o11.png";
import gpu from "../../images/cutouts/gpu.png";
import cpu from "../../images/cutouts/cpu.png";
import ram from "../../images/cutouts/ram.png";
import cooler from "../../images/cutouts/cooler.png";
import ssd from "../../images/cutouts/ssd.png";

/**
 * En hög med frilagda delar, som svävar kring en dator.
 *
 * Förlagan är Apex band för custom bygg: datorn står som störst, och
 * runt den ligger delarna utspridda i luften, lätt vridna och i olika
 * storlek. Det säger på en halv sekund vad bandet handlar om - att man
 * väljer delarna själv - vilket ingen bild av ett färdigt chassi klarar.
 *
 * OM BILDERNA:
 *
 * De kommer från images/product images/, men inte direkt. Bilderna där
 * ser frilagda ut men är det inte: de har helvit bakgrund och en
 * alfakanal som är ogenomskinlig hela vägen, så lagda i en hög mot den
 * mörka duken blir de vita rutor. images/cutouts/ innehåller frilagda
 * kopior, gjorda med scripts/make-cutouts.mjs.
 *
 * De vita chassina är valda med flit. Mot den mörka lila duken syns
 * vitt starkt, medan ett svart chassi hade försvunnit in i bakgrunden.
 *
 * Allt är placerat i procent av rutan och inte i pixlar, så högen håller
 * ihop när den krymper på en telefon. Skuggan under varje del är det som
 * gör att de läses som svävande i stället för som klistrade.
 *
 * Måtten är avlästa ur en provrendering av samma hög, inte gissade.
 * Motivet fyller bara en femtedel till en dryg tredjedel av sin fyrkant
 * - resten är luft - så procenttal som ser rimliga ut i koden ger delar
 * som syns hälften så stora som man tänkt sig.
 */

type Piece = {
  src: string;
  /** Placering och storlek. Bredd och x i procent av bredden, y av höjden. */
  className: string;
  /** Vridning i grader. Små utslag - det ska se ostädat ut, inte trasigt. */
  rotate?: number;
  /** Höjd i lagren. Datorn ligger underst, smådelarna ovanpå. */
  z?: number;
};

const BUILD_PIECES: Piece[] = [
  { src: caseNzxt, className: "left-[41%] top-[25%] w-[53%]", z: 10 },
  { src: gpu, className: "left-[-3%] top-[42%] w-[50%]", rotate: -9, z: 30 },
  { src: cooler, className: "left-[22%] top-[50%] w-[38%]", rotate: 5, z: 20 },
  { src: ram, className: "left-[18%] top-[2%] w-[28%]", rotate: 14, z: 30 },
  { src: cpu, className: "left-[1%] top-[7%] w-[29%]", rotate: -7, z: 30 },
];

const SERVICE_PIECES: Piece[] = [
  { src: caseO11, className: "left-[2%] top-[24%] w-[52%]", rotate: -3, z: 10 },
  { src: cooler, className: "left-[56%] top-[48%] w-[40%]", rotate: 7, z: 30 },
  { src: cpu, className: "left-[58%] top-[2%] w-[27%]", rotate: -12, z: 30 },
  { src: ssd, className: "left-[40%] top-[62%] w-[26%]", rotate: 16, z: 30 },
  { src: ram, className: "left-[36%] top-[6%] w-[24%]", rotate: 20, z: 20 },
];

/*
 * Skruvmejseln är ritad och inte fotograferad.
 *
 * Fria fotografier med genomskinlig bakgrund finns i praktiken inte -
 * Unsplash och Pexels levererar JPEG med ett rum bakom - och sidorna som
 * säljer urklippta PNG:er har licenser man inte vill bygga en butik på.
 * Ritad slipper vi frågan helt, och den går dessutom att färga i märkets
 * kulör.
 *
 * Toningarna gör jobbet: skaftet får en ljus kant på ena sidan och en
 * mörk på den andra, och det är det som läser som rundad metall.
 */
const Screwdriver = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 60 300" className={className} role="img" aria-label="Skruvmejsel">
    <defs>
      <linearGradient id="dh-handle" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#2A1B3D" />
        <stop offset="28%" stopColor="#7E4BB0" />
        <stop offset="55%" stopColor="#B26BDE" />
        <stop offset="100%" stopColor="#3A2450" />
      </linearGradient>
      <linearGradient id="dh-shaft" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#5A6170" />
        <stop offset="30%" stopColor="#D6DCE6" />
        <stop offset="52%" stopColor="#F2F5FA" />
        <stop offset="78%" stopColor="#99A2B2" />
        <stop offset="100%" stopColor="#4E5563" />
      </linearGradient>
      <linearGradient id="dh-collar" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#6B7280" />
        <stop offset="45%" stopColor="#E5E9F0" />
        <stop offset="100%" stopColor="#5A616F" />
      </linearGradient>
    </defs>

    {/* Handtaget, med greppspår */}
    <rect x="9" y="4" width="42" height="132" rx="20" fill="url(#dh-handle)" />
    {[34, 58, 82, 106].map((y) => (
      <rect key={y} x="14" y={y} width="32" height="7" rx="3.5" fill="#1B1128" opacity="0.32" />
    ))}

    {/* Hylsan mellan handtag och skaft */}
    <rect x="20" y="134" width="20" height="16" rx="4" fill="url(#dh-collar)" />

    {/* Skaftet */}
    <rect x="24" y="148" width="12" height="118" fill="url(#dh-shaft)" />

    {/* Den platta spetsen */}
    <path d="M23 266 L37 266 L34 294 L26 294 Z" fill="url(#dh-shaft)" />
  </svg>
);

const FLOAT_SHADOW = "drop-shadow(0 18px 26px rgba(0, 0, 0, 0.55))";

export type ClusterKind = "build" | "service";

export const ComponentCluster = ({ kind }: { kind: ClusterKind }) => {
  const pieces = kind === "build" ? BUILD_PIECES : SERVICE_PIECES;

  return (
    <div
      className="relative mx-auto aspect-[4/3] w-full max-w-xl"
      role="img"
      aria-label={
        kind === "build"
          ? "Chassi, grafikkort, processor, minne och kylare"
          : "Dator, skruvmejsel och lösa komponenter"
      }
    >
      {/* Ett svagt ljus bakom högen, så den inte flyter ut i duken */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            kind === "build"
              ? "radial-gradient(48% 44% at 52% 55%, rgba(178, 107, 222, 0.26) 0%, transparent 72%)"
              : "radial-gradient(48% 44% at 45% 55%, rgba(63, 217, 245, 0.22) 0%, transparent 72%)",
        }}
      />

      {pieces.map((piece) => (
        <img
          key={piece.src + piece.className}
          src={piece.src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className={`absolute object-contain ${piece.className}`}
          style={{
            zIndex: piece.z ?? 20,
            transform: piece.rotate ? `rotate(${piece.rotate}deg)` : undefined,
            filter: FLOAT_SHADOW,
          }}
        />
      ))}

      {kind === "service" && (
        <Screwdriver className="absolute left-[4%] top-[2%] z-40 h-[46%] w-auto rotate-[26deg] drop-shadow-[0_16px_24px_rgba(0,0,0,0.6)]" />
      )}
    </div>
  );
};

export default ComponentCluster;
