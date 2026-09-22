/**
 * De två banden på startsidan, som 8-bitarsscener.
 *
 * Tidigare låg här frilagda produktfoton - ett chassi och en hög lösa
 * delar som svävade. De var stillastående, de var någon annans
 * fotografier, och de sa ingenting om vad vi faktiskt gör. Ett foto på
 * ett grafikkort säger "grafikkort", inte "vi bygger datorn åt dig".
 *
 * Scenerna är ritade i samma stil och samma palett som byggaren i
 * orderstapeln. Det är meningen att det ska kännas som samma värld:
 * kunden möter honom här på startsidan och sedan igen på sin ordersida
 * när datorn byggs.
 *
 * FÅ BILDRUTOR, MED FLIT
 *
 * Allt hoppar mellan hela lägen i stället för att glida mellan dem -
 * steps(1) på varje övergång. Mjuka toningar hör inte hemma i
 * pixelkonst, och ett hårt klipp läser som en bildruta i ett spel
 * medan en mjuk läser som en webbanimation som hakar upp sig.
 *
 * Allt står stilla för den som bett om mindre rörelse. Se
 * prefers-reduced-motion längst ned i index.css.
 */

/*
 * Gnistorna från slaget. Alla är en enda pixel.
 *
 * DE LÅNGA VAR FÖRST NÅGOT ANNAT
 *
 * Tre breda strimmor med svans skulle gå tvärs över bilden. De såg
 * inte ut som gnistor utan som pinnar som svävade i luften - en
 * strimma på tjugosex pixlar är en tredjedel av bildens bredd, och i
 * den storleken läser ögat den som ett föremål och inte som en
 * partikel.
 *
 * Nu finns bara en sorts gnista, och den är en pixel stor. Skillnaden
 * mellan en kort och en lång är hur ofta den kommer och hur långt den
 * når - inte hur den ser ut. En prick som far tvärs över bilden läser
 * som en gnista; en stav som gör det gör inte det.
 *
 * Sexton kommer vid varje slag och far en handsbredd. Fem kommer
 * sällan, var annat till var sjunde slag, och går hela vägen ut genom
 * kanten. Se every i typen ovan.
 *
 * Riktning, längd och fördröjning är skrivna för hand i stället för
 * slumpade. Slumpen ger klungor - fyra åt samma håll och ingen åt det
 * andra - och en lista som är läst igenom en gång ser ut som en
 * explosion varje gång.
 *
 * hot = den vitheta kärnan närmast slaget. Utan ett par sådana blir
 * allt samma orangea nyans och skuren ser platt ut.
 */
type Spark = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  delay: number;
  hot?: boolean;
  /*
   * Hur många hammarslag mellan varje gång den kommer.
   *
   * Utelämnad betyder varje slag - det är närskuren. Ett tal här gör
   * gnistan sällsynt, och då får den räckvidd i utbyte: den far tvärs
   * över bilden i stället för en handsbredd.
   *
   * Talen 2, 3, 4, 5 och 7 går inte jämnt upp i varandra, så de långa
   * sammanfaller sällan. Ett slag ger noll eller någon enstaka, aldrig
   * alla fem, och det utan att någon slump behöver hålla dem isär.
   */
  every?: 2 | 3 | 4 | 5 | 7;
};

/*
 * TRÄFFPUNKTEN ÄR (47, 11)
 *
 * Uträknad, inte gissad. Hammarhuvudets mitt sitter på (46, 9.5) i
 * vila; roterad +18 grader kring axeln på (41, 15) hamnar den på
 * (47.5, 11.3). Chassits övre vänstra hörn är (46, 11), så slaget
 * landar på ovankanten strax innanför hörnet.
 *
 * Ändras slagvinkeln i ps-hammer måste punkten räknas om, och då
 * flyttar sig både blixten, skuren och de tre strimmorna.
 */
const HIT_X = 47;
const HIT_Y = 11;

const SPARKS: Spark[] = [
  { x: 47, y: 11, dx: -18, dy: -6, delay: 0 },
  { x: 47, y: 11, dx: 11, dy: -12, delay: 0.01 },
  { x: 48, y: 12, dx: -13, dy: -15, delay: 0 },
  { x: 47, y: 12, dx: 9, dy: 11, delay: 0.02, hot: true },
  { x: 47, y: 11, dx: -10, dy: 14, delay: 0.01 },
  { x: 48, y: 11, dx: 6, dy: -17, delay: 0, hot: true },
  { x: 47, y: 13, dx: -16, dy: 8, delay: 0.03 },
  { x: 47, y: 10, dx: 14, dy: -5, delay: 0.02 },
  { x: 48, y: 12, dx: -7, dy: -19, delay: 0.01 },
  { x: 47, y: 11, dx: -21, dy: 2, delay: 0 },
  { x: 47, y: 12, dx: 8, dy: 16, delay: 0.03 },
  { x: 48, y: 11, dx: -12, dy: -3, delay: 0.02, hot: true },
  { x: 47, y: 10, dx: -5, dy: -20, delay: 0.01 },
  { x: 47, y: 13, dx: 12, dy: 4, delay: 0 },
  { x: 48, y: 13, dx: -15, dy: -10, delay: 0.03 },
  { x: 47, y: 11, dx: 4, dy: 18, delay: 0.02 },

  /* De sällsynta. Samma pixel, mycket längre bana. */
  { x: 47, y: 11, dx: -38, dy: -12, delay: 0, every: 2 },
  { x: 47, y: 11, dx: -52, dy: 8, delay: 0, every: 3, hot: true },
  { x: 48, y: 11, dx: 24, dy: -30, delay: 0, every: 4 },
  { x: 47, y: 12, dx: -58, dy: -6, delay: 0, every: 5, hot: true },
  { x: 47, y: 11, dx: -34, dy: 26, delay: 0, every: 7 },
];


/**
 * Service och reparation: en kväll som går i cirkel.
 *
 * Han sitter vid datorn och skärmen är blå. Han reser sig, går till
 * maskinen bredvid och bankar på den. Sätter sig igen - nu är skärmen
 * svart. Bankar en gång till. Sätter sig, skriver kod, och den startar.
 * En stund senare är skärmen blå igen och det börjar om.
 *
 * Skämtet är hela poängen med bandet. Felsökning ser ut så här, och en
 * bild på en skruvmejsel hade inte sagt det.
 */
const ServiceScene = () => (
  <svg
    viewBox="0 0 64 36"
    className="promo-scene__svg"
    shapeRendering="crispEdges"
    role="img"
    aria-label="Pixelanimation: en tekniker växlar mellan att felsöka vid skärmen och att banka på datorn"
  >
    {/* Golv och vägg */}
    <rect x="0" y="33" width="64" height="3" className="ps-floor" />

    {/* ---------- Skrivbordet till vänster ---------- */}
    <rect x="9" y="1" width="18" height="15" className="ps-monitor" />
    <rect x="10" y="2" width="16" height="13" className="ps-screen" />

    {/* Blåskärmen. Två streck och en sur min - allt som behövs för att
        alla ska veta exakt vad de tittar på. */}
    <g className="ps-face ps-face--blue">
      <rect x="12" y="3" width="2" height="2" className="ps-bsod-ink" />
      <rect x="12" y="7" width="9" height="1" className="ps-bsod-ink" />
      <rect x="12" y="9" width="12" height="1" className="ps-bsod-ink" />
      <rect x="12" y="11" width="6" height="1" className="ps-bsod-ink" />
    </g>

    {/* Grön kod som skrivs rad för rad. */}
    <g className="ps-face ps-face--code">
      <rect x="12" y="3" width="8" height="1" className="ps-code ps-code--1" />
      <rect x="12" y="5" width="12" height="1" className="ps-code ps-code--2" />
      <rect x="12" y="7" width="6" height="1" className="ps-code ps-code--3" />
      <rect x="12" y="9" width="11" height="1" className="ps-code ps-code--4" />
      <rect x="12" y="11" width="2" height="1" className="ps-code ps-code--5" />
    </g>

    {/* Den som startade: ett fönster och en rad längst ned. */}
    <g className="ps-face ps-face--boot">
      <rect x="12" y="3" width="12" height="8" className="ps-boot-window" />
      <rect x="12" y="3" width="12" height="1" className="ps-boot-bar" />
      <rect x="13" y="5" width="7" height="1" className="ps-boot-line" />
      <rect x="13" y="7" width="9" height="1" className="ps-boot-line" />
      <rect x="12" y="12" width="12" height="1" className="ps-boot-bar" />
    </g>

    <rect x="16" y="16" width="4" height="3" className="ps-monitor" />
    <rect x="2" y="19" width="26" height="2" className="ps-desk" />
    <rect x="3" y="21" width="2" height="12" className="ps-desk-leg" />
    <rect x="25" y="21" width="2" height="12" className="ps-desk-leg" />

    {/* Stolen. Ryggstödet sticker ut en pixel på var sida om honom, så
        man ser att han sitter i den och inte framför den. */}
    <rect x="10" y="21" width="14" height="8" className="ps-chair" />
    <rect x="16" y="29" width="2" height="2" className="ps-chair-post" />
    <rect x="12" y="31" width="10" height="2" className="ps-chair-base" />

    {/* ---------- Han, sedd bakifrån ---------- */}
    <g className="ps-actor ps-actor--sitting">
      <rect x="14" y="12" width="6" height="2" className="ps-hair" />
      <rect x="14" y="14" width="6" height="4" className="ps-hair" />
      <rect x="15" y="18" width="4" height="1" className="ps-skin" />
      <rect x="11" y="19" width="12" height="9" className="ps-overall" />
      <rect x="11" y="21" width="12" height="1" className="ps-strap" />
      {/* Armbågarna guppar i takt med skrivandet. */}
      <g className="ps-typing">
        <rect x="8" y="20" width="3" height="6" className="ps-overall" />
        <rect x="23" y="20" width="3" height="6" className="ps-overall" />
      </g>
    </g>

    {/* ---------- Arbetsbänken till höger ---------- */}
    <rect x="42" y="24" width="21" height="2" className="ps-desk" />
    <rect x="44" y="26" width="2" height="7" className="ps-desk-leg" />
    <rect x="59" y="26" width="2" height="7" className="ps-desk-leg" />

    <rect x="46" y="11" width="13" height="13" className="ps-case" />
    <rect x="47" y="12" width="11" height="11" className="ps-glass" />
    <rect x="48" y="13" width="7" height="5" className="ps-board" />
    <rect x="49" y="14" width="2" height="2" className="ps-chip" />
    <rect x="52" y="14" width="2" height="1" className="ps-chip" />
    <rect x="48" y="19" width="4" height="4" className="ps-fan" />
    <rect x="49" y="20" width="2" height="2" className="ps-glow" />

    {/* ---------- Han, stående med hammaren ---------- */}
    <g className="ps-actor ps-actor--standing">
      <rect x="34" y="8" width="6" height="1" className="ps-hair" />
      <rect x="34" y="9" width="6" height="3" className="ps-hair" />
      <rect x="34" y="12" width="6" height="2" className="ps-skin" />
      <rect x="38" y="12" width="1" height="1" className="ps-eye" />
      <rect x="33" y="14" width="8" height="8" className="ps-overall" />
      <rect x="33" y="16" width="8" height="1" className="ps-strap" />
      <rect x="33" y="22" width="3" height="9" className="ps-overall" />
      <rect x="38" y="22" width="3" height="9" className="ps-overall" />
      <rect x="32" y="31" width="5" height="2" className="ps-boot" />
      <rect x="37" y="31" width="5" height="2" className="ps-boot" />

      {/* Arm och hammare i samma grupp, så de svänger kring axeln i
          stället för att verktyget svävar bredvid honom. */}
      <g className="ps-hammer">
        <rect x="40" y="14" width="5" height="2" className="ps-skin" />
        <rect x="45" y="10" width="2" height="6" className="ps-tool" />
        <rect x="43" y="8" width="6" height="3" className="ps-hammer-head" />
        <rect x="43" y="8" width="2" height="3" className="ps-hammer-dark" />
      </g>
    </g>

    {/* Gnistorna ligger sist, alltså överst. */}
    <g className="ps-sparks">
      {/* Blixten i själva träffpunkten. Den gör slaget hårt: utan
          den ser gnistorna ut att komma från ingenstans. */}
      <rect
        x={HIT_X - 2}
        y={HIT_Y - 2}
        width="4"
        height="4"
        className="ps-flash"
      />

      {SPARKS.map((spark, index) => (
        <rect
          key={index}
          x={spark.x}
          y={spark.y}
          width="1"
          height="1"
          className={[
            "ps-spark",
            spark.hot ? "ps-spark--hot" : "",
            spark.every ? `ps-spark--every-${spark.every}` : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            ["--sx" as string]: `${spark.dx}px`,
            ["--sy" as string]: `${spark.dy}px`,
            animationDelay: `${spark.delay}s`,
          }}
        />
      ))}

    </g>
  </svg>
);

/**
 * Custom bygg: fem bildrutor, en del i taget.
 *
 * Tomt chassi, moderkort, kylare och minne, grafikkort, sedan glaset på
 * och lysdioderna igång. Det är bandets budskap i rörelse - att datorn
 * sätts ihop av delar man valt själv - och det säger det utan en enda
 * punktlista.
 */
const BuildScene = () => (
  <svg
    viewBox="0 0 48 36"
    className="promo-scene__svg"
    shapeRendering="crispEdges"
    role="img"
    aria-label="Pixelanimation: en dator byggs ihop del för del i ett chassi"
  >
    <rect x="0" y="33" width="48" height="3" className="ps-floor" />

    {/* Bänken chassit står på */}
    <rect x="2" y="30" width="44" height="2" className="ps-desk" />
    <rect x="6" y="32" width="3" height="4" className="ps-desk-leg" />
    <rect x="39" y="32" width="3" height="4" className="ps-desk-leg" />

    {/* Chassit. Ram och tomt inre - bildruta ett. */}
    <rect x="11" y="3" width="26" height="27" className="ps-case" />
    <rect x="12" y="4" width="24" height="25" className="ps-glass" />

    {/* 2. Moderkortet */}
    <g className="ps-part ps-part--board">
      <rect x="14" y="6" width="19" height="17" className="ps-board" />
      <rect x="15" y="7" width="3" height="2" className="ps-chip" />
      <rect x="30" y="7" width="2" height="1" className="ps-chip" />
      <rect x="15" y="21" width="5" height="1" className="ps-chip" />
    </g>

    {/* 3. Kylaren och minnet */}
    <g className="ps-part ps-part--cooler">
      <rect x="16" y="9" width="7" height="7" className="ps-cooler" />
      <rect x="17" y="10" width="5" height="5" className="ps-fan" />
      <rect x="19" y="12" width="1" height="1" className="ps-glow" />
    </g>
    <g className="ps-part ps-part--ram">
      <rect x="26" y="8" width="2" height="8" className="ps-ram" />
      <rect x="29" y="8" width="2" height="8" className="ps-ram" />
      <rect x="26" y="8" width="2" height="1" className="ps-glow" />
      <rect x="29" y="8" width="2" height="1" className="ps-glow" />
    </g>

    {/* 4. Grafikkortet, som skjuts in utifrån höger */}
    <g className="ps-part ps-part--gpu">
      <rect x="14" y="18" width="18" height="5" className="ps-gpu" />
      <rect x="16" y="19" width="4" height="3" className="ps-gpu-fan" />
      <rect x="23" y="19" width="4" height="3" className="ps-gpu-fan" />
      <rect x="17" y="20" width="2" height="1" className="ps-glow" />
      <rect x="24" y="20" width="2" height="1" className="ps-glow" />
    </g>

    {/* 5. Glaset, som skjuts på utifrån vänster, och lysdioderna */}
    <g className="ps-part ps-part--panel">
      <rect x="12" y="4" width="24" height="25" className="ps-panel" />
      <rect x="12" y="4" width="24" height="1" className="ps-rgb" />
      <rect x="12" y="28" width="24" height="1" className="ps-rgb" />
      {/* En ljusstrimma över glaset, så det läses som en ruta och inte
          som en slöja. */}
      <rect x="15" y="4" width="2" height="25" className="ps-sheen" />
    </g>
  </svg>
);

export type PromoSceneKind = "service" | "build";

export const PromoScene = ({ kind }: { kind: PromoSceneKind }) => (
  <div className="promo-scene" data-kind={kind}>
    {kind === "service" ? <ServiceScene /> : <BuildScene />}
  </div>
);

export default PromoScene;
