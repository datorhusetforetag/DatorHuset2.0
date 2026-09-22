import { useEffect, useMemo, useState } from "react";

/**
 * Hur många datorer verkstaden hinner bygga till.
 *
 * VARFÖR DEN STÅR HÄR
 *
 * Kapaciteten är riktig: två byggare, en tredje på reserv. Taket ligger
 * i shared/orderCapacity.js och prövas i kassan. Utan den här raden får
 * kunden veta att det är fullt först efter att ha fyllt i hela sin
 * adress, vilket är sent.
 *
 * STAPELN FÖRST, TEXTEN UNDER
 *
 * Stapeln är det som syns i ögonvrån; siffran är det man läser när man
 * redan tittat dit. Omvänd ordning gör att texten läses först och
 * stapeln blir en upprepning av den.
 *
 * GUBBEN
 *
 * Ritad i 8-bitarsstil - hela rutor, inga kurvor, en ruta är en pixel.
 * Han står PÅ stapeln, inte i den, och följer fyllnadsgraden. Det syns
 * att maskinerna byggs för hand av någon, vilket är hela poängen med
 * att ha ett tak.
 *
 * GNISTORNA
 *
 * De flesta är korta och stannar nära lödpennan. Några få kan flyga
 * tvärs över hela stapeln, men bara ibland: en sådan gnista är synlig
 * en liten del av sitt varv och ligger stilla resten. Flöge de långt
 * varje gång vore det ett fyrverkeri, inte lödning.
 *
 * Allt står stilla för den som bett om mindre rörelse.
 */

type Capacity = { used: number; new: number; isFull: boolean };

/*
 * Korta gnistor. Alltid igång - de bär intrycket av att något hettar.
 * Olika riktning, längd och fördröjning, eftersom samma bana på alla
 * läses som ett mönster i stället för som gnistor.
 */
const NEAR_SPARKS = [
  { dx: 22, dy: -26, dur: 0.8, delay: 0, size: 3 },
  { dx: -18, dy: -22, dur: 0.95, delay: 0.16, size: 2 },
  { dx: 30, dy: -12, dur: 1.05, delay: 0.3, size: 2 },
  { dx: -26, dy: -8, dur: 0.88, delay: 0.46, size: 3 },
  { dx: 10, dy: -34, dur: 1.15, delay: 0.62, size: 2 },
  { dx: -8, dy: -30, dur: 1, delay: 0.78, size: 2 },
];

/*
 * Långa gnistor, tvärs över hela stapeln.
 *
 * cycle är hur ofta gnistan flyger, i sekunder. Själva flykten tar
 * bara fyra procent av varvet - resten ligger gnistan stilla och
 * osynlig. Det är så sällsyntheten uppstår: ingen räknar varv i
 * javascript, animationen gör det åt oss.
 *
 * Med cykler runt tjugo till trettiofem sekunder, och fyra gnistor med
 * olika varvtid och start, korsar något stapeln då och då utan att det
 * går att förutse när. Flöge de varje gång vore det ett fyrverkeri.
 */
/* Måste stämma med nyckelrutorna i capacity-spark-far, där flykten är
   över vid fyra procent. */
const FAR_FLIGHT_FRACTION = 0.04;

const FAR_SPARKS = [
  { dx: 210, dy: -46, cycle: 19, delay: 0.4, size: 3 },
  { dx: -190, dy: -38, cycle: 26, delay: 1.3, size: 2 },
  { dx: 320, dy: -22, cycle: 33, delay: 2.1, size: 2 },
  { dx: -280, dy: -54, cycle: 23, delay: 3.2, size: 3 },
];

export const CapacityBar = ({ accent }: { accent: string }) => {
  const [capacity, setCapacity] = useState<Capacity | null>(null);

  useEffect(() => {
    let active = true;
    const apiBase = import.meta.env.VITE_API_BASE_URL || "";
    fetch(`${apiBase}/api/preorder-capacity`)
      .then((response) => response.json())
      .then((payload) => {
        if (active && payload?.data) setCapacity(payload.data);
      })
      .catch((error) => {
        /* Raden är upplysning, inte funktion. Går den inte att hämta
           visas ingenting, och köpknappen ovanför fungerar som vanligt.

           I utvecklingsläge sägs det i konsolen ändå. Att den bara
           uteblir är rätt för en kund men obegripligt för den som just
           byggt den och undrar var den tog vägen. */
        if (import.meta.env.DEV) {
          console.warn(
            "[CapacityBar] kunde inte hämta /api/preorder-capacity - kör npm run serve:dev den senaste koden?",
            error,
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  /* De långa gnistorna får slumpade startpunkter en gång per besök, så
     två laddningar av samma sida inte ser identiska ut. */
  const farOffsets = useMemo(() => FAR_SPARKS.map(() => Math.random() * 12), []);

  if (!capacity) return null;

  const total = 10;
  const left = Math.max(0, Math.min(total, capacity.new));
  const taken = total - left;
  const percent = Math.round((taken / total) * 100);

  return (
    <div className="capacity" style={{ ["--capacity-accent" as string]: accent }}>
      <div
        className="capacity__track"
        role="img"
        aria-label={
          capacity.isFull
            ? "Verkstaden är fullbokad"
            : `${taken} av ${total} byggplatser är tagna`
        }
      >
        <span className="capacity__fill" style={{ width: `${percent}%` }} />

        {/* Gubben. Vänsterkanten följer fyllnadsgraden, och translate
            flyttar honom ett halvt steg tillbaka så att han står mitt
            på kanten i stället för bredvid den. */}
        <span className="capacity__welder" style={{ left: `${percent}%` }} aria-hidden="true">
          {/* 8-bitars: varje rect är en pixel. Inga kurvor, och
              shapeRendering stänger av kantutjämningen så rutorna blir
              hårda i stället för suddiga. */}
          <svg viewBox="0 0 22 22" className="capacity__figure" shapeRendering="crispEdges">
            {/* Svetshjälm */}
            <rect x="6" y="1" width="6" height="1" className="px-dark" />
            <rect x="5" y="2" width="8" height="1" className="px-dark" />
            <rect x="5" y="3" width="2" height="2" className="px-dark" />
            <rect x="11" y="3" width="2" height="2" className="px-dark" />
            <rect x="7" y="3" width="4" height="2" className="px-visor" />
            <rect x="5" y="5" width="8" height="1" className="px-dark" />

            {/* Överkropp och förkläde */}
            <rect x="6" y="6" width="6" height="1" className="px-body" />
            <rect x="5" y="7" width="8" height="4" className="px-body" />
            <rect x="6" y="8" width="6" height="1" className="px-strap" />

            {/* Bakre arm mot arbetsstycket, främre sträckt mot pennan */}
            <rect x="3" y="8" width="2" height="3" className="px-skin" />
            <rect x="13" y="8" width="3" height="2" className="px-skin" />
            <rect x="16" y="9" width="2" height="2" className="px-skin" />

            {/* Lödpennan, med het spets */}
            <rect x="18" y="9" width="3" height="1" className="px-tool" />
            <rect x="21" y="9" width="1" height="1" className="px-tip" />

            {/* Ben och kängor */}
            <rect x="5" y="11" width="8" height="2" className="px-legs" />
            <rect x="5" y="13" width="3" height="5" className="px-legs" />
            <rect x="10" y="13" width="3" height="5" className="px-legs" />
            <rect x="4" y="18" width="5" height="2" className="px-boot" />
            <rect x="9" y="18" width="5" height="2" className="px-boot" />

            {/* Kretskortet han lutar sig över */}
            <rect x="15" y="12" width="7" height="5" className="px-board" />
            <rect x="16" y="13" width="2" height="1" className="px-chip" />
            <rect x="19" y="14" width="2" height="2" className="px-chip" />
          </svg>

          {/* Gnistorna sitter på lödpennans spets och flyger därifrån. */}
          <span className="capacity__sparks">
            {NEAR_SPARKS.map((spark, index) => (
              <span
                key={`near-${index}`}
                className="capacity__spark"
                style={{
                  ["--dx" as string]: `${spark.dx}px`,
                  ["--dy" as string]: `${spark.dy}px`,
                  ["--size" as string]: `${spark.size}px`,
                  animationDelay: `${spark.delay}s`,
                  animationDuration: `${spark.dur}s`,
                }}
              />
            ))}

            {FAR_SPARKS.map((spark, index) => (
              <span
                key={`far-${index}`}
                className="capacity__spark capacity__spark--far"
                style={{
                  ["--dx" as string]: `${spark.dx}px`,
                  ["--dy" as string]: `${spark.dy}px`,
                  ["--size" as string]: `${spark.size}px`,
                  animationDelay: `${(spark.delay + farOffsets[index]).toFixed(1)}s`,
                  animationDuration: `${spark.cycle}s`,
                }}
              />
            ))}
          </span>
        </span>
      </div>

      <p className="capacity__label">
        {capacity.isFull ? (
          <>Fullbokat just nu — hör av dig så säger vi till när en plats öppnar</>
        ) : (
          <>
            Vi hinner bygga <strong>{left}</strong> {left === 1 ? "dator" : "datorer"} till
          </>
        )}
      </p>
    </div>
  );
};

export default CapacityBar;
