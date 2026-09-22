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
 * Gnistorna från slaget.
 *
 * Sexton stycken som far en bit och slocknar. Det här är skuren kring
 * bänken - de som går hela vägen över bilden är FLYERS längre ned, och
 * de är bara tre. Låter man alla sexton gå tvärs över blir det ett
 * fyrverkeri i stället för ett hammarslag.
 *
 * Riktning, längd och fördröjning sätts per gnista och är skrivna
 * för hand i stället för slumpade. Slumpen ger klungor - fyra åt
 * samma håll och ingen åt det andra - och en lista som är läst en
 * gång ser ut som en explosion varje gång.
 *
 * hot = den vitheta kärnan närmast slaget. Utan ett par sådana blir
 * allt samma orangea nyans och skuren ser platt ut.
 *
 * Det här är närskuren - skräpet som far en bit och landar. De som
 * går tvärs över bilden är något annat, se FLYERS nedan.
 */
type Spark = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  delay: number;
  hot?: boolean;
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
];

/*
 * De som går hela vägen.
 *
 * En eller två åt gången, inte sexton. Far allt tvärs över bilden blir
 * det ett fyrverkeri; far en enda det medan resten stannar vid bänken
 * blir den en gnista man följer med blicken.
 *
 * VARFÖR DE INTE KOMMER SAMTIDIGT
 *
 * Var och en har en omloppstid som är ett helt antal hammarslag -
 * tre, fyra och fem. De startar alltså alltid på ett slag, men på
 * olika slag, och eftersom 3, 4 och 5 inte går jämnt upp i varandra
 * sammanfaller de sällan. Ingen slump behövs för att hålla dem isär.
 *
 * SVANSEN, OCH VARFÖR VRIDNINGEN LIGGER I ATTRIBUTET
 *
 * Strimman är ritad liggande, med huvudet i origo och svansen ut åt
 * +x - alltså en gnista på väg åt vänster. En vridning pekar den åt
 * sitt verkliga håll, och den måste ske kring huvudet.
 *
 * Vridningen stod först i CSS, och då hamnade den fel. CSS räknar
 * transform-origin från 50% 50%, och för ett svg-element mäts de
 * procenten mot viewBox-rutan - inte mot strimman. Den vreds alltså
 * kring bildens mitt: den brantaste av de tre startade nere vid
 * golvet mitt i bilden i stället för vid hammaren.
 *
 * Som svg-attribut finns ingen procenträkning. rotate() utgår från
 * (0, 0) i gruppens eget koordinatsystem, och det ligger i
 * träffpunkten tack vare translate på gruppen utanför. Alltså kring
 * huvudet, vilket är det enda stället som ser rätt ut.
 */
type Flyer = { n: number; angle: number };

const FLYERS: Flyer[] = [
  /* Vinklarna hör ihop med riktningarna i ps-fly-1..3 i index.css.
     Ändras en riktning måste vinkeln räknas om: den är atan2 för
     riktningen, mätt från strimmans egen (-1, 0). */
  { n: 1, angle: 5.2 },
  { n: 2, angle: -20.8 },
  { n: 3, angle: 127.4 },
];

/* Huvud, tre glödande segment och en döende svans - tjugosex pixlar,
   alltså drygt en tredjedel av bildens bredd. Ljusare och kortare
   fram, mörkare och längre bak: det är det som läser som fart och
   inte som ett streck. */
const FlyerTrail = () => (
  <>
    <rect x="0" y="0" width="3" height="2" className="ps-fly-head" />
    <rect x="3" y="0" width="4" height="2" className="ps-fly-a" />
    <rect x="7" y="0" width="5" height="1" className="ps-fly-b" />
    <rect x="12" y="0" width="6" height="1" className="ps-fly-c" />
    <rect x="18" y="0" width="8" height="1" className="ps-fly-d" />
  </>
);

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
        x={HIT_X - 3}
        y={HIT_Y - 3}
        width="6"
        height="6"
        className="ps-flash"
      />

      {SPARKS.map((spark, index) => (
        <rect
          key={index}
          x={spark.x}
          y={spark.y}
          width="1"
          height="1"
          className={`ps-spark${spark.hot ? " ps-spark--hot" : ""}`}
          style={{
            ["--sx" as string]: `${spark.dx}px`,
            ["--sy" as string]: `${spark.dy}px`,
            animationDelay: `${spark.delay}s`,
          }}
        />
      ))}

      {/* Strimmorna som går tvärs över.

          Tre lager med var sin uppgift: yttersta flyttar origo till
          träffpunkten, mellersta bär flykten (CSS, animerad), innersta
          vrider strimman rätt. Både translate och rotate är attribut
          och inte CSS, så ingen av dem rör transform-origin. */}
      {FLYERS.map((flyer) => (
        <g key={flyer.n} transform={`translate(${HIT_X} ${HIT_Y})`}>
          <g className={`ps-flyer ps-flyer--${flyer.n}`}>
            <g transform={`rotate(${flyer.angle})`}>
              <FlyerTrail />
            </g>
          </g>
        </g>
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
