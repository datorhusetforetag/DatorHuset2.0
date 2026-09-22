import { useEffect, useState } from "react";

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
 * GUBBEN
 *
 * Han står PÅ stapeln, inte i den, och följer fyllnadsgraden. Det gör
 * två saker på en gång: siffran får en plats att peka på, och det syns
 * att maskinerna byggs för hand av någon - vilket är hela poängen med
 * att ha ett tak.
 *
 * Gnistorna flyger utanför stapeln med flit. En gnista som stannar
 * innanför en kant ser ut som ett fel i utritningen; det är därför
 * containern har overflow: visible och gnistorna får egna banor med
 * olika längd, riktning och fördröjning.
 *
 * Allt står stilla för den som bett om mindre rörelse.
 */

type Capacity = { used: number; new: number; isFull: boolean };

/* Sju gnistor räcker för att det ska se oregelbundet ut. Varje har egen
   riktning, längd och fördröjning - samma bana på alla hade lästs som
   ett mönster i stället för som gnistor. */
const SPARKS = [
  { dx: 26, dy: -30, delay: 0, dur: 0.85, size: 3 },
  { dx: -22, dy: -26, delay: 0.14, dur: 0.95, size: 2 },
  { dx: 38, dy: -14, delay: 0.29, dur: 1.05, size: 2.5 },
  { dx: -34, dy: -8, delay: 0.42, dur: 0.9, size: 2 },
  { dx: 14, dy: -42, delay: 0.56, dur: 1.15, size: 3 },
  { dx: -12, dy: -38, delay: 0.7, dur: 1, size: 2.5 },
  { dx: 46, dy: -24, delay: 0.85, dur: 1.2, size: 2 },
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
           byggt den och undrar var den tog vägen - oftast är svaret att
           API-servern kör gammal kod och inte känner till rutten. */
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

  if (!capacity) return null;

  const total = 10;
  const left = Math.max(0, Math.min(total, capacity.new));
  const taken = total - left;
  /* Andelen upptagna platser. Stapeln fylls alltså medan platserna tar slut,
     och gubben vandrar med den. */
  const percent = Math.round((taken / total) * 100);

  return (
    <div className="capacity" style={{ ["--capacity-accent" as string]: accent }}>
      <p className="capacity__label">
        {capacity.isFull ? (
          <>Fullbokat just nu — hör av dig så säger vi till när en plats öppnar</>
        ) : (
          <>
            Vi hinner bygga <strong>{left}</strong> {left === 1 ? "dator" : "datorer"} till
          </>
        )}
      </p>

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
          <svg viewBox="0 0 24 26" className="capacity__figure">
            {/* Datorn han lutar sig över */}
            <rect x="13" y="17" width="9" height="7" rx="1" className="capacity__box" />
            {/* Ben, kropp, huvud */}
            <path d="M7 24v-4M10 24v-4" className="capacity__limb" />
            <path d="M8.5 20v-7" className="capacity__limb" />
            <circle cx="8.5" cy="10" r="2.6" className="capacity__head" />
            {/* Svetshjälmens visir */}
            <path d="M6.2 9.4h4.6" className="capacity__visor" />
            {/* Armen ut mot lödpennan */}
            <path d="M8.5 15l5 2.5" className="capacity__limb" />
          </svg>

          {/* Gnistorna sitter på spetsen av pennan och flyger därifrån. */}
          <span className="capacity__sparks">
            {SPARKS.map((spark, index) => (
              <span
                key={index}
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
          </span>
        </span>
      </div>
    </div>
  );
};

export default CapacityBar;
