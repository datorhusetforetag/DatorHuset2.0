#!/usr/bin/env node
/**
 * Genererar hela DatorHusets varumärkespaket från en enda källa.
 *
 *   npm run brand:build
 *
 * Märket bor i scripts/brand/flat-house.mjs: ett chassi som är ett hus, ritat
 * platt och grovt. Glasytan till vänster visar datorn, gaveln till höger har en
 * cyan ytterdörr, och taket är en tjock plommonvinkel med skorsten.
 *
 * Skriptet skriver SVG-original till public/brand/ och rastrerar sedan
 * favicons, app-ikoner och OG-bilden med headless Chrome. Kör om skriptet när
 * något ändras – handredigera inte utdata.
 *
 * scripts/brand/case-house.mjs innehåller den tidigare isometriska, detaljerade
 * illustrationen. Den genereras fortfarande som datorhuset-illustration-iso.svg
 * i väntan på besked om den ska behållas som hero-bild eller tas bort.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

import { FLAT, flatHouse, flatHouseMono } from "./brand/flat-house.mjs";
import { caseHouse, caseHouseDefs } from "./brand/case-house.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = join(ROOT, "public");
const BRAND_DIR = join(PUBLIC_DIR, "brand");
const ASSETS_DIR = join(ROOT, "src", "assets");

/* ------------------------------------------------------------------ palett */

export const PALETTE = {
  cyan: FLAT.cyan,
  cyanDeep: "#1BA8C4",
  plum: FLAT.roof,
  plumVivid: FLAT.plumVivid,
  plumDeep: "#6E2B92",
  ink: "#0C0D14",
  inkPlum: "#1C0B24",
  paper: "#FFFFFF",
};

// Märket ritas i en 240 x 240-ruta; innehållet ligger mellan (3, 8) och (236, 212).
const ART = { x0: 3, y0: 8, x1: 236, y1: 212 };
const ART_W = ART.x1 - ART.x0;
const ART_H = ART.y1 - ART.y0;

// På mörk yta lyfts chassit någon nyans så att formen inte försvinner helt.
const ON_DARK = { body: "#1E1E25", edge: "#EDEDF5" };
const ON_LIGHT = { body: FLAT.body, edge: FLAT.edge };

/* ---------------------------------------------------------------- ikonruta */

const tileDefs = () => `    <linearGradient id="dhTile" x1="0.05" y1="0" x2="0.95" y2="1">
      <stop offset="0" stop-color="${PALETTE.ink}"/>
      <stop offset="0.55" stop-color="#0E0B16"/>
      <stop offset="1" stop-color="${PALETTE.inkPlum}"/>
    </linearGradient>
    <radialGradient id="dhGlow" cx="0.74" cy="0.78" r="0.6">
      <stop offset="0" stop-color="#9B4DE0" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#9B4DE0" stop-opacity="0"/>
    </radialGradient>`;

// Konstverket centreras i ikonrutans 256 x 256.
function artTransform(scale) {
  const cx = ART.x0 + ART_W / 2;
  const cy = ART.y0 + ART_H / 2;
  return `translate(128 128) scale(${scale}) translate(${-cx} ${-cy})`;
}

function markSvg({ level = "full", tile = "dark", shape = "rect", radius = 58, scale = 1.02 } = {}) {
  const dark = tile === "dark";
  const skin = dark ? ON_DARK : ON_LIGHT;

  let plate = "";
  if (tile === "dark") {
    plate =
      shape === "circle"
        ? `  <circle cx="128" cy="128" r="128" fill="url(#dhTile)"/>
  <circle cx="128" cy="128" r="128" fill="url(#dhGlow)"/>
  <circle cx="128" cy="128" r="126.5" fill="none" stroke="#7FE9FF" stroke-opacity="0.14" stroke-width="3"/>`
        : `  <rect width="256" height="256" rx="${radius}" fill="url(#dhTile)"/>
  <rect width="256" height="256" rx="${radius}" fill="url(#dhGlow)"/>
  <rect x="2" y="2" width="252" height="252" rx="${radius - 2}" fill="none" stroke="#7FE9FF" stroke-opacity="0.14" stroke-width="3"/>`;
  } else if (tile === "light") {
    plate =
      shape === "circle"
        ? `  <circle cx="128" cy="128" r="128" fill="${FLAT.tileLight}"/>`
        : `  <rect width="256" height="256" rx="${radius}" fill="${FLAT.tileLight}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-label="DatorHuset">
  <title>DatorHuset</title>
${dark ? `  <defs>\n${tileDefs()}\n  </defs>` : ""}
${plate}
  <g transform="${artTransform(scale)}">${flatHouse(level, skin)}
  </g>
</svg>
`;
}

// Huset utan platta – för placering direkt på en egen yta.
function glyphSvg(level = "full", skin = ON_LIGHT) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ART.x0} ${ART.y0} ${ART_W} ${ART_H}" width="${ART_W}" height="${ART_H}" role="img" aria-label="DatorHuset">
  <title>DatorHuset</title>
  <g>${flatHouse(level, skin)}
  </g>
</svg>
`;
}

function glyphMonoSvg(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ART.x0} ${ART.y0} ${ART_W} ${ART_H}" width="${ART_W}" height="${ART_H}" role="img" aria-label="DatorHuset">
  <title>DatorHuset</title>
  <g>${flatHouseMono(color)}
  </g>
</svg>
`;
}

/* ------------------------------------------------------------------ lockup */

const FONT_FILE = join(BRAND_DIR, "orbitron-800-subset.woff2");
const FONT_STACK = "'DH Orbitron',Orbitron,'Trebuchet MS',Arial,sans-serif";

function fontFace() {
  const b64 = readFileSync(FONT_FILE).toString("base64");
  return `    <style>@font-face{font-family:'DH Orbitron';font-style:normal;font-weight:800;src:url(data:font/woff2;base64,${b64}) format('woff2');}</style>`;
}

// Vågrätt: huset till vänster, ordmärket till höger. Ordmärket mäter 386,5 px
// vid 58 px Orbitron 800 – därav bredden.
function lockupSvg({ dator, huset, skin }) {
  const scale = 130 / ART_H;
  const tx = 20 - scale * ART.x0;
  const ty = 19 - scale * ART.y0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 604 168" width="604" height="168" role="img" aria-label="DatorHuset">
  <title>DatorHuset</title>
  <defs>
${fontFace()}
  </defs>
  <g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${scale.toFixed(3)})">${flatHouse("full", skin)}
  </g>
  <text x="196" y="104" font-family="${FONT_STACK}" font-weight="800" font-size="58" letter-spacing="1"><tspan fill="${dator}">Dator</tspan><tspan fill="${huset}">Huset</tspan></text>
</svg>
`;
}

// Stående: huset över ordmärket – kvadratiska ytor, tryck och profilbilder.
function lockupStackedSvg({ dator, huset, skin }) {
  const scale = 210 / ART_H;
  const tx = 90 - scale * ART.x0;
  const ty = 14 - scale * ART.y0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 330" width="420" height="330" role="img" aria-label="DatorHuset">
  <title>DatorHuset</title>
  <defs>
${fontFace()}
  </defs>
  <g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${scale.toFixed(3)})">${flatHouse("full", skin)}
  </g>
  <text x="210" y="296" text-anchor="middle" font-family="${FONT_STACK}" font-weight="800" font-size="46" letter-spacing="1"><tspan fill="${dator}">Dator</tspan><tspan fill="${huset}">Huset</tspan></text>
</svg>
`;
}

/* --------------------------------------------- tidigare isometrisk version */

function isoIllustrationSvg() {
  const wordmark = `<text x="11" y="-26" font-family="${FONT_STACK}" font-weight="800" font-size="15" letter-spacing="0.4"><tspan fill="${FLAT.cyan}">Dator</tspan><tspan fill="${FLAT.roof}">Huset</tspan></text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-80 -146 190 248" width="760" height="992" role="img" aria-label="DatorHuset">
  <title>DatorHuset</title>
  <defs>
${fontFace()}
${caseHouseDefs()}
  </defs>
  <g>${caseHouse("illustration", wordmark)}
  </g>
</svg>
`;
}

/* ------------------------------------------------------ rastrering (Chrome) */

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

function findChrome() {
  const hit = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!hit) {
    throw new Error("Hittade ingen Chrome/Edge för rastrering. Sätt CHROME_PATH till webbläsarens exe.");
  }
  return hit;
}

const WORK_DIR = join(tmpdir(), "datorhuset-brand");

function shot(chrome, html, outFile, width, height) {
  mkdirSync(WORK_DIR, { recursive: true });
  const page = join(WORK_DIR, `page-${Math.random().toString(36).slice(2)}.html`);
  writeFileSync(page, html, "utf8");
  execFileSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--default-background-color=00000000",
      "--virtual-time-budget=3000",
      `--screenshot=${outFile}`,
      `--window-size=${width},${height}`,
      `file:///${page.replace(/\\/g, "/")}`,
    ],
    { stdio: "ignore" },
  );
  rmSync(page, { force: true });
}

const svgPage = (svg, w, h = w) => {
  const b64 = Buffer.from(svg, "utf8").toString("base64");
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}img{display:block;width:${w}px;height:${h}px}</style></head><body><img src="data:image/svg+xml;base64,${b64}"></body></html>`;
};

/* ------------------------------------------------------------- favicon.ico */

function buildIco(pngPaths) {
  const images = pngPaths.map((p) => readFileSync(p));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + 16 * images.length;
  images.forEach((png, i) => {
    // PNG-huvudet: bredd och höjd ligger på byte 16..24.
    const w = png.readUInt32BE(16);
    const h = png.readUInt32BE(20);
    const at = i * 16;
    dir.writeUInt8(w >= 256 ? 0 : w, at);
    dir.writeUInt8(h >= 256 ? 0 : h, at + 1);
    dir.writeUInt16LE(1, at + 4);
    dir.writeUInt16LE(32, at + 6);
    dir.writeUInt32LE(png.length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += png.length;
  });

  return Buffer.concat([header, dir, ...images]);
}

/* ----------------------------------------------------------------- OG-bild */

function ogPage(glyphDark) {
  const art = Buffer.from(glyphDark, "utf8").toString("base64");
  const fontB64 = readFileSync(FONT_FILE).toString("base64");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:'DH Orbitron';font-weight:800;src:url(data:font/woff2;base64,${fontB64}) format('woff2');}
    html,body{margin:0;padding:0;width:1200px;height:630px;overflow:hidden}
    body{background:
      radial-gradient(880px 600px at 88% 106%, rgba(155,77,224,0.40), transparent 68%),
      radial-gradient(700px 500px at 6% -14%, rgba(63,217,245,0.18), transparent 66%),
      linear-gradient(135deg, ${PALETTE.ink} 0%, #0E0B16 55%, ${PALETTE.inkPlum} 100%);
      font-family:Inter,'Segoe UI',Arial,sans-serif;color:#fff;
      display:flex;align-items:center;padding:0 76px;box-sizing:border-box;gap:48px}
    .copy{flex:1;min-width:0}
    h1{font-family:'DH Orbitron',Orbitron,Arial,sans-serif;font-weight:800;font-size:58px;line-height:1.08;margin:0 0 20px;letter-spacing:-0.5px}
    h1 .c{color:${PALETTE.cyan}}
    h1 .p{color:${PALETTE.plum}}
    p{font-size:26px;line-height:1.45;margin:0 0 36px;color:rgba(255,255,255,0.76)}
    .pill{display:inline-flex;align-items:center;padding:14px 30px;border-radius:999px;
      background:linear-gradient(135deg, ${PALETTE.cyan}, ${PALETTE.plum});color:${PALETTE.ink};font-weight:700;font-size:24px}
    .art{width:420px;flex:none}
    .edge{position:absolute;inset:0;border-bottom:6px solid transparent;
      border-image:linear-gradient(90deg, ${PALETTE.cyan}, ${PALETTE.plumVivid}) 1;pointer-events:none}
  </style></head><body>
    <div class="copy">
      <h1><span class="c">Dator</span><span class="p">Huset</span></h1>
      <p>Bygg din drömdator. Nya och begagnade komponenter till rimligt pris — en dator ska inte vara en lyx.</p>
      <span class="pill">datorhuset.se</span>
    </div>
    <img class="art" src="data:image/svg+xml;base64,${art}">
    <span class="edge"></span>
  </body></html>`;
}

/* -------------------------------------------------------------------- main */

function main() {
  mkdirSync(BRAND_DIR, { recursive: true });
  mkdirSync(ASSETS_DIR, { recursive: true });

  const mark = markSvg({ tile: "dark", scale: 1.02 });
  const markLight = markSvg({ tile: "light", scale: 1.02 });
  const markRound = markSvg({ tile: "dark", shape: "circle", scale: 0.94 });
  const markSmall = markSvg({ level: "small", tile: "dark", radius: 52, scale: 1.06 });
  const markSmallLight = markSvg({ level: "small", tile: "light", radius: 52, scale: 1.06 });
  const glyphDark = glyphSvg("full", ON_DARK);

  const svgFiles = {
    "datorhuset-mark.svg": mark,
    "datorhuset-mark-light-bg.svg": markLight,
    "datorhuset-mark-round.svg": markRound,
    "datorhuset-mark-small.svg": markSmall,
    "datorhuset-mark-small-light-bg.svg": markSmallLight,
    "datorhuset-glyph.svg": glyphSvg("full", ON_LIGHT),
    "datorhuset-glyph-dark-bg.svg": glyphDark,
    "datorhuset-glyph-mono-light.svg": glyphMonoSvg(PALETTE.paper),
    "datorhuset-glyph-mono-dark.svg": glyphMonoSvg("#111117"),
    "datorhuset-lockup-dark.svg": lockupSvg({ dator: PALETTE.cyan, huset: PALETTE.plum, skin: ON_DARK }),
    "datorhuset-lockup-light.svg": lockupSvg({ dator: PALETTE.cyanDeep, huset: PALETTE.plumDeep, skin: ON_LIGHT }),
    "datorhuset-lockup-stacked-dark.svg": lockupStackedSvg({ dator: PALETTE.cyan, huset: PALETTE.plum, skin: ON_DARK }),
    "datorhuset-lockup-stacked-light.svg": lockupStackedSvg({ dator: PALETTE.cyanDeep, huset: PALETTE.plumDeep, skin: ON_LIGHT }),
    "datorhuset-illustration-iso.svg": isoIllustrationSvg(),
  };

  for (const [name, svg] of Object.entries(svgFiles)) {
    writeFileSync(join(BRAND_DIR, name), svg, "utf8");
    console.log("svg  ", join("public/brand", name));
  }

  writeFileSync(join(ASSETS_DIR, "datorhuset-logo.svg"), mark, "utf8");
  console.log("svg  ", "src/assets/datorhuset-logo.svg");

  const chrome = findChrome();
  mkdirSync(WORK_DIR, { recursive: true });

  const raster = [
    ["Datorhuset.png", mark, 512],
    ["icon-512.png", mark, 512],
    ["icon-192.png", mark, 192],
    ["apple-touch-icon.png", mark, 180],
    ["favicon-96.png", mark, 96],
    ["favicon-48.png", markSmall, 48],
    ["favicon-32.png", markSmall, 32],
    ["datorhuset-round.png", markRound, 256],
    // Navbar och footer visar märket i 36–48 px och använder därför småvarianten.
    ["datorhuset-mark-small.png", markSmall, 128],
  ];

  for (const [name, svg, size] of raster) {
    shot(chrome, svgPage(svg, size), join(PUBLIC_DIR, name), size, size);
    console.log("png  ", join("public", name), `${size}x${size}`);
  }

  const icoParts = [16, 32, 48].map((size) => {
    const tmp = join(WORK_DIR, `ico-${size}.png`);
    shot(chrome, svgPage(markSmall, size), tmp, size, size);
    return tmp;
  });
  writeFileSync(join(PUBLIC_DIR, "favicon.ico"), buildIco(icoParts));
  icoParts.forEach((p) => rmSync(p, { force: true }));
  console.log("ico  ", "public/favicon.ico", "16/32/48");

  shot(chrome, ogPage(glyphDark), join(PUBLIC_DIR, "og-datorhuset.png"), 1200, 630);
  console.log("png  ", "public/og-datorhuset.png", "1200x630");

  rmSync(WORK_DIR, { recursive: true, force: true });
  console.log("\nKlart. Alla varumärkesfiler är genererade från detta skript.");
}

main();
