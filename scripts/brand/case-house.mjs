/**
 * DatorHusets grundform: ett chassi som är ett hus, ritat i isometri.
 *
 * Glasytan vetter åt vänster och visar datorn inuti. Gaveln vetter åt höger
 * och är husfasad: ytterdörr, trappa upp, USB-portar över dörren och
 * ventilationsspringor längs kanten. Taket bär ordmärket.
 *
 * Samma geometri används i tre detaljnivåer så att illustrationen och ikonen
 * garanterat är samma hus:
 *   "illustration" – allt: fläktar, AIO, RAM, CPU, grafikkort, trappa, tak-text
 *   "icon"         – en fläkt, grafikkort, dörr, trappsteg (48 px och uppåt)
 *   "icon-small"   – bara siluetten, en fläkt och dörren (16–48 px)
 */

const C = Math.cos(Math.PI / 6);
const S = Math.sin(Math.PI / 6);
const n = (v) => Math.round(v * 100) / 100;

// Betraktaren står vid +x, +y, +z. Synliga ytor: y = Wd (glaset, till vänster),
// x = L (gaveln, till höger) och taket.
export const iso = (x, y, z) => [(x - y) * C, (x + y) * S - z];

const P = (x, y, z) => iso(x, y, z).map(n).join(",");

export const poly = (pts, fill, extra = "") =>
  `<polygon points="${pts.map(([x, y, z]) => P(x, y, z)).join(" ")}" fill="${fill}"${extra ? " " + extra : ""}/>`;

// Lokalt 2D-ritplan inne i en 3D-yta: O = origo, U = lokal x-riktning,
// V = lokal y-riktning (nedåt). Allt innanför ritas som vanlig platt SVG.
export const face = (O, U, V, content) => {
  const [a, b] = iso(...U);
  const [c, d] = iso(...V);
  const [e, f] = iso(...O);
  return `<g transform="matrix(${n(a)},${n(b)},${n(c)},${n(d)},${n(e)},${n(f)})">${content}</g>`;
};

/* ------------------------------------------------------------- mått ------ */

export const L = 104; // chassits längd (glasytans bredd)
export const Wd = 70; // chassits djup (gavelns bredd)
export const H = 104; // chassits höjd
const RH = 50; // takhöjd – brant nog att dölja det bortre takfallet
const OX = 7; // takutsprång i längdled
const OY = 8; // takutsprång i sidled
const RIDGE = Wd / 2;
const EAVE = H + 3;

// Konstverkets yttermått i isometriska enheter, utan trappan.
export const ART_BOUNDS = { x0: -74, x1: 103, y0: -140, y1: 92 };

/* ------------------------------------------------------------ palett ----- */

export const SHELL = {
  light: "#DCDFE7",
  mid: "#C3C8D2",
  dark: "#A6ACBA",
  line: "#858B9B",
  glass: "#11121A",
  roofSide: "#1B1E28",
  roofEdge: "#2E323E",
  blade: "#454B5C",
  cyan: "#5CEEFF",
  plum: "#C05BE0",
  plumDeep: "#7A2392",
};

/* -------------------------------------------------------------- fläkt ---- */

const fan = (cx, cy, r, ringId, { blades = 5, bladeWidth = 1.9, ringWidth = 2.4 } = {}) => `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#0B0C12" stroke="#31364a" stroke-width="${n(r * 0.1)}"/>
    ${Array.from({ length: blades }, (_, i) => (i * 360) / blades)
      .map((a) => {
        const rad = (a * Math.PI) / 180;
        const rad2 = ((a + 38) * Math.PI) / 180;
        return `<path d="M${n(cx + Math.cos(rad) * r * 0.3)} ${n(cy + Math.sin(rad) * r * 0.3)} Q${n(cx + Math.cos(rad2) * r * 0.52)} ${n(cy + Math.sin(rad2) * r * 0.52)} ${n(cx + Math.cos(rad2) * r * 0.8)} ${n(cy + Math.sin(rad2) * r * 0.8)}" fill="none" stroke="${SHELL.blade}" stroke-width="${bladeWidth}" stroke-linecap="round"/>`;
      })
      .join("")}
    <circle cx="${cx}" cy="${cy}" r="${n(r - ringWidth * 0.75)}" fill="none" stroke="url(#${ringId})" stroke-width="${ringWidth}"/>
    <circle cx="${cx}" cy="${cy}" r="${n(r * 0.28)}" fill="#2A2E3B"/>`;

/* ------------------------------------------------------- glasytans insida - */

function glassContents(level) {
  if (level === "icon-small") {
    return `
    <rect x="7" y="13" width="90" height="84" rx="4" fill="${SHELL.glass}"/>
    ${fan(38, 47, 26, "dhRgbA", { blades: 4, bladeWidth: 5, ringWidth: 6 })}
    <rect x="16" y="80" width="70" height="11" rx="4" fill="${SHELL.plum}"/>`;
  }

  if (level === "icon") {
    return `
    <rect x="7" y="13" width="90" height="84" rx="3" fill="${SHELL.glass}"/>
    ${fan(30, 40, 19, "dhRgbA", { blades: 5, bladeWidth: 3.4, ringWidth: 4.2 })}
    ${fan(70, 40, 19, "dhRgbB", { blades: 5, bladeWidth: 3.4, ringWidth: 4.2 })}
    <rect x="14" y="68" width="76" height="13" rx="3" fill="#1A1D26" stroke="#333849" stroke-width="1.4"/>
    <rect x="14" y="68" width="76" height="3" rx="1.5" fill="${SHELL.plum}"/>
    <rect x="14" y="86" width="76" height="6" rx="3" fill="url(#dhStrip)"/>`;
  }

  const ram = [0, 1, 2, 3]
    .map(
      (i) =>
        `<rect x="${72 + i * 5.4}" y="43" width="3.4" height="26" rx="1.2" fill="#272B36"/>` +
        `<rect x="${72 + i * 5.4}" y="43" width="3.4" height="5" rx="1.2" fill="url(#dhRam)"/>`,
    )
    .join("");

  return `
    <rect x="7" y="13" width="90" height="84" rx="3" fill="${SHELL.glass}"/>
    ${fan(22, 29, 11.5, "dhRgbA")}
    ${fan(22, 54, 11.5, "dhRgbB")}
    ${fan(22, 79, 11.5, "dhRgbC")}
    <rect x="40" y="15" width="52" height="9" rx="2" fill="#1D2029" stroke="#31364a" stroke-width="1"/>
    ${fan(53, 34, 8.5, "dhRgbD")}
    ${fan(75, 34, 8.5, "dhRgbE")}
    <rect x="42" y="47" width="20" height="20" rx="4" fill="#1B1E27" stroke="#353a49" stroke-width="1.2"/>
    <circle cx="52" cy="57" r="6.5" fill="none" stroke="#454B5C" stroke-width="1.4"/>
    <text x="52" y="59.4" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="5" fill="#79808F">CPU</text>
    ${ram}
    <rect x="40" y="73" width="54" height="12" rx="2.5" fill="#1A1D26" stroke="#333849" stroke-width="1.2"/>
    <rect x="40" y="73" width="54" height="2.6" rx="1.3" fill="${SHELL.plum}"/>
    <text x="45" y="81.6" font-family="Inter,Arial,sans-serif" font-size="5.2" fill="#8A909F">GEFORCE RTX</text>
    <rect x="40" y="88" width="54" height="6" rx="2" fill="url(#dhStrip)"/>`;
}

/* -------------------------------------------------------- gavelns fasad -- */

function gableContents(level) {
  if (level === "icon-small") {
    return `
    <rect x="20" y="26" width="44" height="70" rx="4" fill="${SHELL.plum}"/>
    <rect x="24" y="30" width="36" height="62" rx="3" fill="${SHELL.plumDeep}"/>`;
  }

  const slits =
    level === "illustration"
      ? [0, 1, 2, 3, 4]
          .map((i) => `<rect x="${5 + i * 3.4}" y="24" width="1.6" height="66" rx="0.8" fill="#9AA0AE"/>`)
          .join("")
      : [0, 1, 2].map((i) => `<rect x="${6 + i * 5}" y="30" width="2.4" height="58" rx="1.2" fill="#9AA0AE"/>`).join("");

  const door =
    level === "illustration"
      ? `
    <rect x="25" y="30" width="36" height="59" rx="2" fill="${SHELL.dark}"/>
    <rect x="27.5" y="32.5" width="31" height="56.5" rx="1.5" fill="#E4E7ED" stroke="#9AA0AE" stroke-width="1"/>
    <rect x="31" y="36" width="24" height="22" rx="1.5" fill="none" stroke="#B4BAC7" stroke-width="1.1"/>
    <rect x="31" y="62" width="24" height="23" rx="1.5" fill="none" stroke="#B4BAC7" stroke-width="1.1"/>
    <rect x="52.5" y="58" width="3" height="9" rx="1.5" fill="#3A3F4D"/>`
      : `
    <rect x="24" y="30" width="38" height="59" rx="3" fill="${SHELL.plum}"/>
    <rect x="27" y="33" width="32" height="56" rx="2" fill="${SHELL.plumDeep}"/>
    <rect x="53" y="56" width="3.4" height="10" rx="1.7" fill="${SHELL.cyan}"/>`;

  return `
    ${slits}
    <rect x="26" y="12" width="34" height="13" rx="3" fill="#2C3040"/>
    <rect x="30" y="16.5" width="9" height="4.5" rx="1" fill="${SHELL.cyan}"/>
    <rect x="43" y="16.5" width="9" height="4.5" rx="1" fill="${SHELL.cyan}"/>
    ${door}`;
}

/* --------------------------------------------------------------- taket --- */

const roofBack = (level) =>
  poly(
    [
      [-OX, -OY, EAVE],
      [L + OX, -OY, EAVE],
      [L + OX, RIDGE, H + RH],
      [-OX, RIDGE, H + RH],
    ],
    level === "icon-small" ? "#1F4A5C" : SHELL.roofSide,
  );

const gableWall = () =>
  poly(
    [
      [L, 0, H],
      [L, Wd, H],
      [L, RIDGE, H + RH],
    ],
    SHELL.mid,
  ) +
  poly(
    [
      [L, RIDGE, H + RH],
      [L, Wd, H],
      [L, Wd - 4, H],
      [L, RIDGE, H + RH - 5],
    ],
    SHELL.line,
  );

function roofFront(wordmark, level) {
  const slopeLen = Math.hypot(RIDGE + OY, RH + 3);
  const up = [0, (RIDGE + OY) / slopeLen, -(RH + 3) / slopeLen];
  return `
    ${poly(
      [
        [-OX, Wd + OY, EAVE],
        [L + OX, Wd + OY, EAVE],
        [L + OX, RIDGE, H + RH],
        [-OX, RIDGE, H + RH],
      ],
      level === "icon-small" ? "url(#dhRoofBrand)" : "url(#dhRoof)",
    )}
    ${poly(
      [
        [-OX, Wd + OY, EAVE],
        [L + OX, Wd + OY, EAVE],
        [L + OX, Wd + OY, EAVE - 5],
        [-OX, Wd + OY, EAVE - 5],
      ],
      level === "icon-small" ? "#0E5B72" : SHELL.roofEdge,
    )}
    ${wordmark ? face([-OX, Wd + OY, EAVE], [1, 0, 0], up, wordmark) : ""}`;
}

/* ------------------------------------------------------------- trappan --- */

function steps(level) {
  if (level === "icon-small") return "";
  const treads =
    level === "icon"
      ? [
          { depth: 9, top: 15 },
          { depth: 20, top: 7 },
        ]
      : [
          { depth: 7, top: 15 },
          { depth: 14, top: 10 },
          { depth: 21, top: 5 },
        ];
  const [y0, y1] = [22, 64];
  return treads
    .map(({ depth, top }) => {
      const xb = L + depth;
      const riser = level === "icon" ? 8 : 5;
      return [
        poly(
          [
            [L, y0, top],
            [xb, y0, top],
            [xb, y1, top],
            [L, y1, top],
          ],
          SHELL.light,
        ),
        poly(
          [
            [xb, y0, top],
            [xb, y1, top],
            [xb, y1, top - riser],
            [xb, y0, top - riser],
          ],
          SHELL.mid,
        ),
        poly(
          [
            [L, y1, top],
            [xb, y1, top],
            [xb, y1, 0],
            [L, y1, 0],
          ],
          SHELL.dark,
        ),
      ].join("");
    })
    .join("\n    ");
}

/* --------------------------------------------------------------- sockel -- */

const plinth = () => `
    ${poly(
      [
        [4, Wd - 4, 0],
        [L - 4, Wd - 4, 0],
        [L - 4, Wd - 4, -9],
        [4, Wd - 4, -9],
      ],
      "#191B24",
    )}
    ${poly(
      [
        [L - 4, 4, 0],
        [L - 4, Wd - 4, 0],
        [L - 4, Wd - 4, -9],
        [L - 4, 4, -9],
      ],
      "#232733",
    )}`;

const shellFaces = () => `
    ${poly(
      [
        [0, Wd, H],
        [L, Wd, H],
        [L, Wd, 0],
        [0, Wd, 0],
      ],
      SHELL.light,
    )}
    ${poly(
      [
        [L, 0, H],
        [L, Wd, H],
        [L, Wd, 0],
        [L, 0, 0],
      ],
      SHELL.mid,
    )}`;

/* ------------------------------------------------------------ gradienter - */

export const caseHouseDefs = () => `
    <linearGradient id="dhRoof" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="#272B37"/>
      <stop offset="1" stop-color="#13151D"/>
    </linearGradient>
    <linearGradient id="dhRoofBrand" x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${SHELL.cyan}"/>
      <stop offset="1" stop-color="#8E2FA8"/>
    </linearGradient>
    <linearGradient id="dhStrip" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${SHELL.cyan}"/>
      <stop offset="0.5" stop-color="#7EA8FF"/>
      <stop offset="1" stop-color="${SHELL.plum}"/>
    </linearGradient>
    <linearGradient id="dhRam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${SHELL.cyan}"/>
      <stop offset="1" stop-color="${SHELL.plum}"/>
    </linearGradient>
${["A", "B", "C", "D", "E"]
  .map(
    (k, i) => `    <linearGradient id="dhRgb${k}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${["#5CEEFF", "#7EA8FF", "#C05BE0", "#5CEEFF", "#C05BE0"][i]}"/>
      <stop offset="1" stop-color="${["#C05BE0", "#5CEEFF", "#5CEEFF", "#C05BE0", "#7EA8FF"][i]}"/>
    </linearGradient>`,
  )
  .join("\n")}`;

/* ------------------------------------------------------------- montering - */

/**
 * @param {"illustration"|"icon"|"icon-small"} level
 * @param {string} wordmark  SVG-markup som placeras i takets plan (valfritt)
 */
export function caseHouse(level = "illustration", wordmark = "") {
  return `
    ${roofBack(level)}
    ${gableWall()}
    ${plinth()}
    ${shellFaces()}
    ${face([0, Wd, H], [1, 0, 0], [0, 0, -1], glassContents(level))}
    ${face([L, 0, H], [0, 1, 0], [0, 0, -1], gableContents(level))}
    ${steps(level)}
    ${roofFront(wordmark, level)}`;
}

/* ----------------------------------------------------------- enfärgat ---- */

// Streckversion för tryck, gravyr och fakturor: inga ytor, bara konturer i en
// enda färg, så den fungerar mot vilken bakgrund som helst.
export function caseHouseMono(color, width = 4) {
  const line = (pts) =>
    poly(pts, "none", `stroke="${color}" stroke-width="${width}" stroke-linejoin="round"`);
  return `
    ${line([
      [-OX, Wd + OY, EAVE],
      [L + OX, Wd + OY, EAVE],
      [L + OX, RIDGE, H + RH],
      [-OX, RIDGE, H + RH],
    ])}
    ${line([
      [L, 0, H],
      [L, Wd, H],
      [L, RIDGE, H + RH],
    ])}
    ${line([
      [0, Wd, H],
      [L, Wd, H],
      [L, Wd, 0],
      [0, Wd, 0],
    ])}
    ${line([
      [L, 0, H],
      [L, Wd, H],
      [L, Wd, 0],
      [L, 0, 0],
    ])}
    ${face(
      [0, Wd, H],
      [1, 0, 0],
      [0, 0, -1],
      `<rect x="9" y="15" width="86" height="80" rx="5" fill="none" stroke="${color}" stroke-width="${width}"/>
       <circle cx="38" cy="47" r="23" fill="none" stroke="${color}" stroke-width="${width}"/>
       <circle cx="38" cy="47" r="7" fill="${color}"/>
       <rect x="16" y="80" width="70" height="10" rx="5" fill="${color}"/>`,
    )}
    ${face(
      [L, 0, H],
      [0, 1, 0],
      [0, 0, -1],
      `<rect x="22" y="28" width="40" height="66" rx="4" fill="none" stroke="${color}" stroke-width="${width}"/>
       <rect x="52" y="58" width="4" height="11" rx="2" fill="${color}"/>`,
    )}`;
}
