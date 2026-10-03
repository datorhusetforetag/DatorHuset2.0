import { useEffect, useRef } from "react";

import { startStarTrails } from "@/lib/starTrails";

/**
 * Bakgrunden: stjärnspår på en mörk natthimmel.
 *
 * Själva himlen finns i src/lib/starTrails.ts. Här ligger bara lagren:
 *
 *   sken      Himlen nedskalad och mjukt uppförstorad, så spåren
 *             glöder.
 *   himmel    Canvasen med spåren och stjärnorna.
 *   korn      Ett svagt filmkorn ovanpå, så den mörka ytan känns mjuk i
 *             stället för som en platt skärmfärg. Stilla - bara en textur.
 *   vinjett   Mörkare mot kanterna, så blicken dras in mot mitten där
 *             innehållet står.
 *
 * Utan canvas står bara den mörka duken kvar, med korn och vinjett -
 * fullt användbart, bara utan spår.
 */

/* Kornet: brus från ett SVG-filter, inbakat som data-URL så det inte
   kostar en extra förfrågan. 160 px ruta som upprepas. */
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export const AmbientBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glowRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    return startStarTrails({ canvas, glow: glowRef.current, reducedMotion }) ?? undefined;
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ backgroundColor: "#0e0816" }}
    >
      {/* Skenet bakom himlen: samma bild i en sjättedels storlek, mjukt
          uppförstorad, så spåren och stjärnorna glöder. */}
      <canvas ref={glowRef} className="absolute inset-0 h-full w-full" style={{ opacity: 0.9 }} />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div
        className="absolute inset-0"
        style={{ backgroundImage: GRAIN, backgroundSize: "160px 160px", opacity: 0.06 }}
      />

      {/* Vinjetten. Kanterna mörknar mot sidorna och hörnen, så att
          blicken dras in mot mitten. Svag med flit. */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "linear-gradient(90deg, rgba(6, 3, 12, 0.6) 0%, rgba(6, 3, 12, 0.22) 14%, transparent 30%, transparent 70%, rgba(6, 3, 12, 0.22) 86%, rgba(6, 3, 12, 0.6) 100%)",
            "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(6, 3, 12, 0.4) 100%)",
          ].join(", "),
        }}
      />
    </div>
  );
};

export default AmbientBackground;
