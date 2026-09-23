/**
 * DatorHusets märke: ett chassi som är ett hus, ritat platt och grovt.
 *
 * Till skillnad från en isometrisk låda syns ingen ovansida – de två ytorna
 * möts i en lodrät skarv och kanterna faller bort åt båda håll, som en fasad
 * sedd i ögonhöjd. Taket är en tjock vinkel som svävar över huset, med skorsten.
 *
 * Glasytan till vänster visar bygget: frontfläkt, vattenkylare med slangar,
 * grafikkort och tre bottenfläktar i rad. Gaveln till höger har en cyan
 * ytterdörr på glänt.
 *
 * Allt ritas i en 240 x 240-ruta i skärmkoordinater. Innehållet projiceras inte
 * in i ytorna – formerna är avsiktligt raka och runda, det är det som gör
 * märket läsbart nere vid 16 px.
 */

export const ART = { size: 240 };

/* ------------------------------------------------------------------ palett */

export const FLAT = {
  body: "#242428", // chassits två ytor
  bodyDeep: "#141418", // dörrhandtag
  hose: "#6E6E82", // vattenkylarens slangar
  board: "#555566", // grafikkortets kretskort
  edge: "#F2F2F7", // ljus linje längs takfot och skarv
  roof: "#B26BDE", // tak och skorsten
  plumLight: "#C9A0EA", // fläktringar, PCIe-bleck
  plumVivid: "#9B4DE0", // pumpblock, grafikkortets kylkåpa
  cyan: "#3FD9F5", // ytterdörren
  tileLight: "#F4F4F8",
  tileDark: "#0C0D14",
};

/* --------------------------------------------------------------- geometri - */

// Lådans sex hörn. Skarven ligger vid x = 134, alltså till höger om mitten:
// glasytan blir bredare än gaveln, precis som ett chassi sett snett framifrån.
const NT = [134, 44]; // skarvens topp
const NB = [134, 212]; // skarvens botten
const LT = [26, 76];
const LB = [26, 180];
const RT = [214, 76];
const RB = [214, 180];

const pt = (p) => p.join(",");

const BODY = `${pt(LT)} ${pt(NT)} ${pt(RT)} ${pt(RB)} ${pt(NB)} ${pt(LB)}`;

// Dörren står på glänt: vänsterkanten är dörrposten, högerkanten dörrbladet.
const DOOR = "152,104 186,118 186,190 152,202";

/* ------------------------------------------------------ ytornas innehåll - */

const fan = (cx, cy, r, body, ring = FLAT.plumLight) => `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${ring}"/>
    <circle cx="${cx}" cy="${cy}" r="${Math.round(r * 0.4)}" fill="${body}"/>`;

// Vattenkylaren: pumpblock på processorn med två slangar upp mot radiatorn.
// Slangarna ritas först så att de ser ut att komma ut bakom blocket.
const waterCooler = (body) => `
    <path d="M96 84C88 70 98 64 110 62" fill="none" stroke="${FLAT.hose}" stroke-width="6" stroke-linecap="round"/>
    <path d="M118 84C116 72 122 66 130 64" fill="none" stroke="${FLAT.hose}" stroke-width="6" stroke-linecap="round"/>
    <rect x="88" y="82" width="38" height="32" rx="5" fill="${FLAT.plumVivid}"/>
    ${fan(107, 98, 10, body)}`;

// Grafikkortet: kylkåpa med två fläktar, kretskortet under och PCIe-blecket
// bak mot skarven. Kåpans fläktar är urtag i kåpan, inte egna ringar – annars
// blir märket en samling cirklar och tappar sin tyngd.
const gpu = (body) => `
    <rect x="118" y="120" width="9" height="44" rx="2" fill="${FLAT.plumLight}"/>
    <rect x="40" y="122" width="78" height="34" rx="3" fill="${FLAT.plumVivid}"/>
    <circle cx="60" cy="139" r="11" fill="${body}"/>
    <circle cx="60" cy="139" r="3.5" fill="${FLAT.plumLight}"/>
    <circle cx="92" cy="139" r="11" fill="${body}"/>
    <circle cx="92" cy="139" r="3.5" fill="${FLAT.plumLight}"/>
    <rect x="40" y="156" width="78" height="7" rx="2" fill="${FLAT.board}"/>`;

function glassSide(level, body) {
  if (level === "small") {
    return `
    ${fan(66, 100, 28, body)}
    <rect x="114" y="128" width="9" height="40" rx="2" fill="${FLAT.plumLight}"/>
    <rect x="40" y="132" width="74" height="32" rx="3" fill="${FLAT.plumVivid}"/>
    ${fan(58, 148, 11, body)}
    ${fan(90, 148, 11, body)}`;
  }

  // Bottenfläktarna ligger i rad och följer nederkantens lutning, så att
  // ingenting hänger utanför huset.
  const bottomFans = [
    [48, 176],
    [76, 183],
    [104, 190],
  ]
    .map(([cx, cy]) => fan(cx, cy, 11, body))
    .join("\n    ");

  return `
    ${fan(54, 94, 18, body)}
    ${waterCooler(body)}
    ${gpu(body)}
    ${bottomFans}`;
}

/* ------------------------------------------------------------------ märket */

/**
 * @param {"full"|"small"} level
 * @param {{body?: string, edge?: string}} opts  ytfärger, för mörk/ljus bakgrund
 */
export function flatHouse(level = "full", { body = FLAT.body, edge = FLAT.edge } = {}) {
  return `
    <rect x="178" y="8" width="18" height="44" fill="${FLAT.roof}"/>
    <polygon points="${BODY}" fill="${body}"/>
    ${glassSide(level, body)}
    <polygon points="${DOOR}" fill="${FLAT.cyan}"/>
    <circle cx="178" cy="152" r="6.5" fill="${FLAT.bodyDeep}"/>
    <polyline points="${pt(LT)} ${pt(NT)} ${pt(RT)}" fill="none" stroke="${edge}" stroke-width="6" stroke-linejoin="miter"/>
    <path d="M134 44V212" stroke="${edge}" stroke-width="6"/>
    <polyline points="11,60 134,24 229,62" fill="none" stroke="${FLAT.roof}" stroke-width="15" stroke-linecap="butt" stroke-linejoin="miter"/>`;
}

/* ----------------------------------------------------------- enfärgat ---- */

// Streckversion för tryck, gravyr och fakturor. Ytorna är tomma, så den
// fungerar mot vilken bakgrund som helst.
export function flatHouseMono(color, w = 7) {
  const s = `fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="miter"`;
  return `
    <rect x="178" y="8" width="18" height="44" ${s}/>
    <polygon points="${BODY}" ${s}/>
    <path d="M134 44V212" stroke="${color}" stroke-width="${w}"/>
    <circle cx="54" cy="94" r="18" ${s}/>
    <circle cx="54" cy="94" r="7" fill="${color}"/>
    <path d="M96 84C88 70 98 64 110 62" fill="none" stroke="${color}" stroke-width="${w - 1}" stroke-linecap="round"/>
    <path d="M118 84C116 72 122 66 130 64" fill="none" stroke="${color}" stroke-width="${w - 1}" stroke-linecap="round"/>
    <rect x="88" y="82" width="38" height="32" rx="5" ${s}/>
    <rect x="40" y="122" width="78" height="34" rx="3" ${s}/>
    <rect x="118" y="120" width="9" height="44" rx="2" fill="${color}"/>
    <circle cx="60" cy="139" r="8" ${s}/>
    <circle cx="92" cy="139" r="8" ${s}/>
    ${[48, 76, 104].map((cx, i) => `<circle cx="${cx}" cy="${176 + i * 7}" r="11" ${s}/>`).join("\n    ")}
    <polygon points="${DOOR}" ${s}/>
    <circle cx="178" cy="152" r="6.5" fill="${color}"/>
    <polyline points="11,60 134,24 229,62" fill="none" stroke="${color}" stroke-width="${w + 6}" stroke-linecap="butt" stroke-linejoin="miter"/>`;
}
