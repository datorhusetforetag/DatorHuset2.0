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

type Spark = {
  dx: number;
  dy: number;
  size: number;
  delay: number;
  duration: number;
  far: boolean;
  curve: string;
};

/*
 * Gnistorna slumpas fram i stället för att stå i en lista.
 *
 * En handskriven lista ger alltid samma sex banor i samma takt, och
 * ögat hittar mönstret på ett par sekunder. Med slumpade värden är
 * varje sidladdning sin egen, och eftersom varvtiderna inte går jämnt
 * upp mot varandra sammanfaller de nästan aldrig - det finns ingen
 * takt att låsa fast vid.
 *
 * Tre saker varieras utöver riktning och längd:
 *
 *   duration   flykttiden, olika per gnista
 *   delay      var i varvet den råkar befinna sig just nu
 *   curve      accelerationen, dragen ur en handfull olika
 *
 * Det sista är det som gör mest: två gnistor med samma bana men olika
 * kurva ser ut som två olika kast.
 */
const CURVES = [
  "cubic-bezier(0.15, 0.6, 0.4, 1)",
  "cubic-bezier(0.05, 0.8, 0.3, 1)",
  "cubic-bezier(0.25, 0.45, 0.35, 1)",
  "cubic-bezier(0.1, 0.9, 0.2, 1)",
];

/* Måste stämma med nyckelrutorna i capacity-spark-far, där flykten är
   över vid fyra procent. */
const FAR_FLIGHT_FRACTION = 0.04;

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const between = (min: number, max: number) => min + Math.random() * (max - min);

/*
 * Korta gnistor. Alltid igång - de bär intrycket av att något hettar.
 *
 * Riktningen är vägd uppåt och åt höger, dit lödpennan pekar, men
 * några få går åt andra hållet. Gnistor som alla flyger åt samma håll
 * ser ut som en stråle, inte som lödning.
 */
const makeNearSparks = (count: number): Spark[] =>
  Array.from({ length: count }, () => {
    const towardsRight = Math.random() > 0.3;
    return {
      dx: towardsRight ? between(8, 38) : between(-32, -6),
      dy: between(-38, -6),
      size: Math.random() > 0.6 ? 3 : 2,
      delay: between(0, 1.4),
      duration: between(0.7, 1.3),
      far: false,
      curve: pick(CURVES),
    };
  });

/*
 * Långa gnistor, tvärs över hela stapeln.
 *
 * duration är hela varvet. Själva flykten tar bara fyra procent av
 * det - resten ligger gnistan stilla och osynlig, och det är så
 * sällsyntheten uppstår utan att något behöver räkna varv i
 * javascript.
 *
 * Fördröjningen slumpas över hela varvet, så de inte börjar i kö.
 */
const makeFarSparks = (count: number): Spark[] =>
  Array.from({ length: count }, () => {
    const towardsRight = Math.random() > 0.45;
    const duration = between(16, 38);
    return {
      dx: towardsRight ? between(150, 340) : between(-300, -140),
      dy: between(-58, -18),
      size: Math.random() > 0.5 ? 3 : 2,
      delay: between(0, duration),
      duration,
      far: true,
      curve: pick(CURVES),
    };
  });

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

  /* Slumpas en gång per besök och behålls sedan. Utan useMemo skulle
     varje omritning ge nya banor, och gnistorna skulle hoppa till så
     fort något annat på sidan ändrades. */
  const sparks = useMemo(() => [...makeNearSparks(9), ...makeFarSparks(5)], []);

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
          <svg viewBox="0 0 28 24" className="capacity__figure" shapeRendering="crispEdges">
            {/* Svetshjälm */}
            <rect x="4" y="1" width="6" height="1" className="px-helmet" />
            <rect x="3" y="2" width="8" height="1" className="px-helmet" />
            <rect x="3" y="3" width="2" height="2" className="px-helmet" />
            <rect x="9" y="3" width="2" height="2" className="px-helmet" />
            <rect x="5" y="3" width="4" height="2" className="px-visor" />
            <rect x="3" y="5" width="8" height="1" className="px-helmet" />

            {/* Hals och överkropp i blå overall */}
            <rect x="6" y="6" width="2" height="1" className="px-skin" />
            <rect x="3" y="7" width="8" height="5" className="px-overall" />
            {/* Förklädets rem */}
            <rect x="4" y="8" width="6" height="1" className="px-strap" />

            {/* Armar. Den främre sträckt mot lödpennan. */}
            <rect x="1" y="8" width="2" height="4" className="px-overall" />
            <rect x="1" y="12" width="2" height="2" className="px-skin" />
            <rect x="11" y="8" width="3" height="2" className="px-overall" />
            <rect x="14" y="9" width="2" height="2" className="px-skin" />

            {/* Lödpennan, med het spets */}
            <rect x="16" y="9" width="3" height="1" className="px-tool" />
            <rect x="19" y="9" width="1" height="1" className="px-tip" />

            {/* Ben och kängor */}
            <rect x="3" y="12" width="8" height="2" className="px-overall" />
            <rect x="3" y="14" width="3" height="5" className="px-overall" />
            <rect x="8" y="14" width="3" height="5" className="px-overall" />
            <rect x="2" y="19" width="5" height="2" className="px-boot" />
            <rect x="7" y="19" width="5" height="2" className="px-boot" />

            {/* Datorn han bygger.

                Den var förut sju rutor bred och fem höga, alltså mindre
                än hans överkropp - en dator i den storleken läses som en
                låda på golvet. Nu är den ett chassi som går från hans
                midja ned till fötterna, med sidopanel, fläkt och
                lysande kretskort. */}
            <rect x="18" y="10" width="10" height="11" className="px-case" />
            <rect x="19" y="11" width="8" height="9" className="px-glass" />
            {/* Moderkort och kort */}
            <rect x="20" y="12" width="6" height="4" className="px-board" />
            <rect x="21" y="13" width="2" height="2" className="px-chip" />
            <rect x="24" y="13" width="2" height="1" className="px-chip" />
            {/* Fläkt */}
            <rect x="20" y="17" width="3" height="3" className="px-fan" />
            <rect x="21" y="18" width="1" height="1" className="px-glow" />
            {/* Frontpanelens lampa */}
            <rect x="25" y="18" width="1" height="1" className="px-glow" />
          </svg>

          {/* Gnistorna sitter på lödpennans spets och flyger därifrån. */}
          <span className="capacity__sparks">
            {sparks.map((spark, index) => (
              <span
                key={index}
                className={spark.far ? "capacity__spark capacity__spark--far" : "capacity__spark"}
                style={{
                  ["--dx" as string]: `${Math.round(spark.dx)}px`,
                  ["--dy" as string]: `${Math.round(spark.dy)}px`,
                  ["--size" as string]: `${spark.size}px`,
                  animationDelay: `${spark.delay.toFixed(2)}s`,
                  animationDuration: `${spark.duration.toFixed(2)}s`,
                  animationTimingFunction: spark.curve,
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
