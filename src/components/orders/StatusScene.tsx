import { useMemo } from "react";

/**
 * Statusen som en scen i stället för en etikett.
 *
 * En order rör sig genom sex steg, och en textremsa säger vilket av dem
 * den står på men ingenting om vad som händer där. En liten scen gör
 * båda: stapeln visar hur långt ordern kommit, och det som rör sig på
 * den säger vad steget innebär utan att någon behöver läsa.
 *
 * SAMMA GUBBE SOM PÅ PRODUKTSIDAN
 *
 * Byggaren är ritad i samma 8-bitarsstil och samma kulörer som
 * svetsaren i CapacityBar. Det är meningen att det ska vara samma
 * person - kunden möter honom i butiken, ni möter honom i portalen.
 *
 * ALLT STÅR STILLA FÖR DEN SOM BETT OM MINDRE RÖRELSE.
 * Se prefers-reduced-motion i index.css.
 */

export type StatusKey =
  | "received"
  | "building"
  | "postbuild"
  | "ready"
  | "shipped"
  | "delivered";

/* Var i flödet steget ligger, för hur långt stapeln fylls. */
const STEP_OF: Record<StatusKey, number> = {
  received: 1,
  building: 2,
  postbuild: 3,
  ready: 4,
  shipped: 5,
  delivered: 6,
};

const TOTAL_STEPS = 6;

/* Byggarens gemensamma delar. Hjälmen skiljer sig mellan scenerna -
   svetshjälm på produktsidan, byggnadshjälm här - men kroppen är
   densamma, för det ska vara samma person. */
const Builder = ({ helmet = "build" }: { helmet?: "build" | "weld" }) => (
  <>
    {helmet === "build" ? (
      <>
        {/* Byggnadshjälm med skärm framtill */}
        <rect x="4" y="1" width="6" height="1" className="px-hardhat" />
        <rect x="3" y="2" width="8" height="2" className="px-hardhat" />
        <rect x="2" y="4" width="10" height="1" className="px-hardhat" />
        {/* Ansikte */}
        <rect x="4" y="5" width="6" height="2" className="px-skin" />
        <rect x="5" y="5" width="1" height="1" className="px-eye" />
        <rect x="8" y="5" width="1" height="1" className="px-eye" />
      </>
    ) : (
      <>
        <rect x="4" y="1" width="6" height="1" className="px-helmet" />
        <rect x="3" y="2" width="8" height="3" className="px-helmet" />
        <rect x="5" y="3" width="4" height="2" className="px-visor" />
        <rect x="3" y="5" width="8" height="2" className="px-helmet" />
      </>
    )}

    {/* Överkropp i blå overall */}
    <rect x="3" y="7" width="8" height="5" className="px-overall" />
    <rect x="4" y="8" width="6" height="1" className="px-strap" />

    {/* Ben och kängor */}
    <rect x="3" y="12" width="8" height="2" className="px-overall" />
    <rect x="3" y="14" width="3" height="5" className="px-overall" />
    <rect x="8" y="14" width="3" height="5" className="px-overall" />
    <rect x="2" y="19" width="5" height="2" className="px-boot" />
    <rect x="7" y="19" width="5" height="2" className="px-boot" />
  </>
);

/* Sedlarna får slumpade banor, så två ordrar i listan inte flyger i takt. */
const makeBills = () =>
  Array.from({ length: 5 }, () => ({
    left: 8 + Math.random() * 78,
    delay: Math.random() * 3.4,
    duration: 2.4 + Math.random() * 1.8,
    drift: -18 + Math.random() * 36,
    spin: Math.random() > 0.5 ? 1 : -1,
  }));

/* Fågelns mål slumpas varje gång komponenten monteras, så flygturen
   inte ser likadan ut på varje rad i listan. */
const makeBirdTrip = () => ({
  /* Landar någonstans på mittendelen av stapeln, aldrig så nära kanten
     att den halkar utanför. */
  target: 28 + Math.random() * 46,
  delay: Math.random() * 2.5,
  height: 14 + Math.random() * 12,
});

export const StatusScene = ({
  status,
  label,
}: {
  status: StatusKey;
  label: string;
}) => {
  const bills = useMemo(() => (status === "received" ? makeBills() : []), [status]);
  const bird = useMemo(() => (status === "delivered" ? makeBirdTrip() : null), [status]);

  const step = STEP_OF[status] ?? 1;
  const percent = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="scene" data-status={status}>
      <div className="scene__stage">
        {/* Sedlar som flyger uppåt över hela stapeln. */}
        {status === "received" &&
          bills.map((bill, index) => (
            <span
              key={index}
              className="scene__bill"
              style={{
                left: `${bill.left}%`,
                animationDelay: `${bill.delay.toFixed(2)}s`,
                animationDuration: `${bill.duration.toFixed(2)}s`,
                ["--drift" as string]: `${bill.drift.toFixed(0)}px`,
                ["--spin" as string]: `${bill.spin * 220}deg`,
              }}
            >
              <svg viewBox="0 0 12 7" shapeRendering="crispEdges">
                <rect x="0" y="0" width="12" height="7" className="px-bill" />
                <rect x="1" y="1" width="10" height="5" className="px-bill-inner" />
                <rect x="5" y="2" width="2" height="3" className="px-bill-mark" />
              </svg>
            </span>
          ))}

        {/* Byggaren som hamrar, med gnistor. */}
        {status === "building" && (
          <span className="scene__actor scene__actor--builder">
            <svg viewBox="0 0 30 22" className="scene__figure" shapeRendering="crispEdges">
              <Builder />
              {/* Armen och hammaren svingar */}
              <g className="scene__hammer">
                <rect x="11" y="9" width="4" height="2" className="px-skin" />
                <rect x="15" y="8" width="1" height="4" className="px-tool" />
                <rect x="14" y="6" width="4" height="2" className="px-hammer" />
              </g>
              {/* Datorn han bankar på */}
              <rect x="19" y="10" width="11" height="11" className="px-case" />
              <rect x="20" y="11" width="9" height="9" className="px-glass" />
              <rect x="21" y="12" width="6" height="4" className="px-board" />
              <rect x="22" y="13" width="2" height="2" className="px-chip" />
              <rect x="21" y="17" width="3" height="3" className="px-fan" />
            </svg>
            <span className="scene__sparks">
              {[0, 1, 2, 3, 4].map((index) => (
                <span key={index} className="scene__spark" style={{ animationDelay: `${index * 0.19}s` }} />
              ))}
            </span>
          </span>
        )}

        {/* Skärmen på skrivbordet med BIOS igång. */}
        {status === "postbuild" && (
          <span className="scene__actor scene__actor--desk">
            <svg viewBox="0 0 34 22" className="scene__figure" shapeRendering="crispEdges">
              {/* Skrivbordsskiva och ben */}
              <rect x="0" y="18" width="34" height="2" className="px-desk" />
              <rect x="3" y="20" width="2" height="2" className="px-desk-leg" />
              <rect x="29" y="20" width="2" height="2" className="px-desk-leg" />
              {/* Skärm */}
              <rect x="7" y="2" width="20" height="14" className="px-monitor" />
              <rect x="8" y="3" width="18" height="12" className="px-screen" />
              <rect x="15" y="16" width="4" height="2" className="px-monitor" />
              {/* BIOS-rader som skrivs ut en i taget */}
              <rect x="10" y="5" width="9" height="1" className="px-bios bios-1" />
              <rect x="10" y="7" width="13" height="1" className="px-bios bios-2" />
              <rect x="10" y="9" width="7" height="1" className="px-bios bios-3" />
              <rect x="10" y="11" width="11" height="1" className="px-bios bios-4" />
              {/* Markören blinkar sist */}
              <rect x="10" y="13" width="2" height="1" className="px-bios-cursor" />
            </svg>
          </span>
        )}

        {/* Byggaren packar en låda. */}
        {status === "ready" && (
          <span className="scene__actor scene__actor--packing">
            <svg viewBox="0 0 30 22" className="scene__figure" shapeRendering="crispEdges">
              <Builder />
              {/* Armarna ned mot lådan */}
              <g className="scene__packing-arms">
                <rect x="11" y="10" width="5" height="2" className="px-skin" />
              </g>
              {/* Lådan */}
              <rect x="17" y="12" width="12" height="9" className="px-box" />
              <rect x="17" y="12" width="12" height="2" className="px-box-lid" />
              {/* Tejpremsan */}
              <rect x="22" y="12" width="2" height="9" className="px-tape" />
              {/* Fliken som viks ned */}
              <g className="scene__box-flap">
                <rect x="17" y="10" width="6" height="2" className="px-box-lid" />
              </g>
            </svg>
          </span>
        )}

        {/* Lastbilen kör, med hjul som snurrar. */}
        {status === "shipped" && (
          <span className="scene__actor scene__actor--truck">
            <svg viewBox="0 0 34 20" className="scene__figure" shapeRendering="crispEdges">
              {/* Lastutrymme och hytt */}
              <rect x="1" y="4" width="18" height="11" className="px-truck-body" />
              <rect x="19" y="7" width="8" height="8" className="px-truck-cab" />
              <rect x="21" y="9" width="4" height="3" className="px-truck-window" />
              {/* Huset på sidan, som en dekal */}
              <rect x="6" y="7" width="7" height="5" className="px-truck-logo" />
              {/* Hjulen snurrar var för sig */}
              <g className="scene__wheel scene__wheel--rear">
                <rect x="4" y="15" width="5" height="5" className="px-tyre" />
                <rect x="6" y="17" width="1" height="1" className="px-hub" />
              </g>
              <g className="scene__wheel scene__wheel--front">
                <rect x="21" y="15" width="5" height="5" className="px-tyre" />
                <rect x="23" y="17" width="1" height="1" className="px-hub" />
              </g>
            </svg>
            {/* Fartstreck bakom, så det syns att den är på väg */}
            <span className="scene__speed">
              {[0, 1, 2].map((index) => (
                <span key={index} className="scene__speed-line" style={{ animationDelay: `${index * 0.14}s` }} />
              ))}
            </span>
          </span>
        )}

        {/* Brevlådan med fågeln som flyger ut och tillbaka. */}
        {status === "delivered" && bird && (
          <>
            <span className="scene__actor scene__actor--mailbox">
              <svg viewBox="0 0 16 22" className="scene__figure" shapeRendering="crispEdges">
                {/* Stolpe */}
                <rect x="6" y="12" width="3" height="10" className="px-post" />
                {/* Låda */}
                <rect x="1" y="4" width="13" height="8" className="px-mailbox" />
                <rect x="1" y="4" width="13" height="2" className="px-mailbox-top" />
                <rect x="3" y="7" width="4" height="3" className="px-mailbox-slot" />
                {/* Flaggan uppe, posten är levererad */}
                <rect x="14" y="2" width="1" height="6" className="px-flagpole" />
                <rect x="11" y="2" width="3" height="3" className="px-flag" />
              </svg>
            </span>

            {/* Fågeln. Målet slumpas per order, så flygturen skiljer sig
                mellan raderna i listan. */}
            <span
              className="scene__bird"
              style={{
                ["--target" as string]: `${bird.target.toFixed(0)}%`,
                ["--peak" as string]: `${bird.height.toFixed(0)}px`,
                animationDelay: `${bird.delay.toFixed(2)}s`,
              }}
            >
              <svg viewBox="0 0 9 7" shapeRendering="crispEdges">
                <rect x="2" y="2" width="4" height="3" className="px-bird" />
                <rect x="6" y="2" width="2" height="2" className="px-bird" />
                <rect x="8" y="2" width="1" height="1" className="px-beak" />
                <rect x="6" y="2" width="1" height="1" className="px-eye" />
                {/* Vingen slår */}
                <rect x="2" y="1" width="3" height="1" className="px-bird scene__wing" />
                {/* Ben, syns när den sitter */}
                <rect x="3" y="5" width="1" height="2" className="px-leg" />
                <rect x="5" y="5" width="1" height="2" className="px-leg" />
              </svg>
            </span>
          </>
        )}
      </div>

      {/* Stapeln under scenen. Hur långt ordern kommit av sex steg. */}
      <div className="scene__track">
        <span className="scene__fill" style={{ width: `${percent}%` }} />
      </div>

      <p className="scene__label">
        {label}
        <span className="scene__step">
          {step}/{TOTAL_STEPS}
        </span>
      </p>
    </div>
  );
};

export default StatusScene;
