/**
 * Ritar platshållarbilderna av datorerna.
 *
 * Tills de riktiga byggena är fotograferade visar produktkorten
 * tecknade datorer i stället för lånade produktbilder. Varje bild är ett
 * fritt svävande chassi utan bakgrund, sett snett framifrån: en glasad
 * sidopanel med insidan synlig (moderkort, grafikkort, processorkylare,
 * minnen, fläktar i taket), en front med RGB-fläktar och ett tak med
 * ventilation.
 *
 * Bilderna är vektorer, så de är skarpa i alla storlekar och väger några
 * kilobyte styck. Färgen på belysningen matchar glöden som kortet redan
 * har för produkten (backdrop.glow i src/data/productArt.ts).
 *
 * När de riktiga fotona finns: byt cutout i productArt mot fotot och ta
 * bort platshållaren.
 *
 *   node scripts/generate-pc-placeholders.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = "public/products/placeholders";

/* Chassits mått i bilden. Sidan är en rektangel; fronten och taket är
   parallellogrammer som går snett uppåt höger, så lådan syns i tre
   dimensioner. */
const SIDE = { x: 70, y: 150, w: 270, h: 440 };
const DEPTH = { dx: 110, dy: -64 };
const SHEAR = DEPTH.dy / DEPTH.dx;
/* Bilden beskärs tätt runt chassit, så tornet når ända upp till
   bildens kant - och därmed upp ur produktkortet. Lite marginal för
   fläktarnas sken. */
const VIEW = { x: 56, y: 74, w: 408, h: 540 };

const CASES = {
  black: {
    frame: "#1c1922",
    frameEdge: "#2c2834",
    top: "#26222e",
    front: "#100e14",
    interior: "#0c0a10",
    board: "#17141d",
    part: "#1d1a24",
    partEdge: "#2f2b38",
    shroud: "#1f1c26",
    foot: "#0d0b10",
  },
  white: {
    frame: "#e7e4ec",
    frameEdge: "#f7f6fa",
    top: "#f1eff5",
    front: "#d6d3dd",
    interior: "#24212c",
    board: "#d9d6df",
    part: "#eceaf0",
    partEdge: "#ffffff",
    shroud: "#dedbe4",
    foot: "#b9b5c2",
  },
};

/* En fläkt i lokala koordinater: ring i belysningens färg, mörkt nav och
   svaga blad. Glöden runt ringen kommer från ett suddfilter. */
const fan = (cx, cy, r, accent, id, dim = 1) => {
  const blades = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * r * 0.28;
    const y1 = cy + Math.sin(a) * r * 0.28;
    const x2 = cx + Math.cos(a + 0.6) * r * 0.78;
    const y2 = cy + Math.sin(a + 0.6) * r * 0.78;
    const qx = cx + Math.cos(a + 0.15) * r * 0.7;
    const qy = cy + Math.sin(a + 0.15) * r * 0.7;
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" />`;
  }).join("");
  return `
    <g opacity="${dim}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#0b0a0f" />
      <circle cx="${cx}" cy="${cy}" r="${r - 3}" fill="none" stroke="${accent}" stroke-width="7" filter="url(#glow-${id})" opacity="0.9" />
      <circle cx="${cx}" cy="${cy}" r="${r - 3}" fill="none" stroke="${accent}" stroke-width="3" />
      <circle cx="${cx}" cy="${cy}" r="${r - 8}" fill="url(#fanfill-${id})" />
      <g stroke="#3a3545" stroke-width="2.2" fill="none" stroke-linecap="round">${blades}</g>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.22}" fill="#16131c" stroke="#2c2834" stroke-width="1.5" />
    </g>`;
};

const build = ({ name, accent, caseColor, style }) => {
  const c = CASES[caseColor];
  const id = name;
  const { x, y, w, h } = SIDE;
  const fx = x + w; // där fronten börjar
  const inset = 11; // ramens tjocklek runt glaset
  const ix = x + inset;
  const iy = y + inset;
  const iw = w - inset * 2;
  const ih = h - inset * 2;

  /* Fronten och taket ritas i egna, skjuvade koordinatsystem. */
  const frontMatrix = `matrix(1 ${SHEAR.toFixed(4)} 0 1 ${fx} ${y})`;
  const topMatrix = `matrix(1 0 1 ${SHEAR.toFixed(4)} ${x} ${y})`;

  const frontFans = [0.2, 0.5, 0.8]
    .map((p, i) => fan(DEPTH.dx / 2, h * p, 44, accent, id, style === "mesh" ? 0.55 : 1))
    .join("");

  const meshPattern =
    style === "mesh"
      ? `<pattern id="mesh-${id}" width="7" height="7" patternUnits="userSpaceOnUse">
           <rect width="7" height="7" fill="${c.front}" />
           <circle cx="3.5" cy="3.5" r="1.6" fill="${caseColor === "white" ? "#bdb9c6" : "#05040a"}" />
         </pattern>`
      : "";

  const ramSticks = [0, 1, 2, 3]
    .map((i) => {
      const rx = ix + iw * 0.66 + i * 10;
      return `<rect x="${rx}" y="${iy + 50}" width="7" height="92" rx="1.5" fill="${c.part}" stroke="${c.partEdge}" stroke-width="0.8" />
              <rect x="${rx}" y="${iy + 50}" width="7" height="9" rx="1.5" fill="${accent}" filter="url(#glow-${id})" />
              <rect x="${rx}" y="${iy + 50}" width="7" height="9" rx="1.5" fill="${accent}" />`;
    })
    .join("");

  const topFans = [0, 1, 2]
    .map((i) => {
      const fw = (iw - 70) / 3;
      const tx = ix + 34 + i * (fw + 6);
      return `<rect x="${tx}" y="${iy + 4}" width="${fw}" height="14" rx="3" fill="#0b0a0f" stroke="${c.partEdge}" stroke-width="0.8" />
              <rect x="${tx + 4}" y="${iy + 15}" width="${fw - 8}" height="3" rx="1.5" fill="${accent}" filter="url(#glow-${id})" />
              <rect x="${tx + 4}" y="${iy + 15}" width="${fw - 8}" height="2" rx="1" fill="${accent}" />`;
    })
    .join("");

  const pumpX = ix + iw * 0.42;
  const pumpY = iy + 115;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}" width="${VIEW.w}" height="${VIEW.h}">
  <defs>
    <filter id="glow-${id}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="5" />
    </filter>
    <filter id="soft-${id}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="22" />
    </filter>
    <radialGradient id="fanfill-${id}">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.35" />
      <stop offset="0.7" stop-color="${accent}" stop-opacity="0.08" />
      <stop offset="1" stop-color="#0b0a0f" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="ambient-${id}" cx="0.5" cy="0.45" r="0.65">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.32" />
      <stop offset="0.6" stop-color="${accent}" stop-opacity="0.1" />
      <stop offset="1" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="glass-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.1" />
      <stop offset="0.35" stop-color="#ffffff" stop-opacity="0.02" />
      <stop offset="0.36" stop-color="#ffffff" stop-opacity="0.06" />
      <stop offset="0.48" stop-color="#ffffff" stop-opacity="0" />
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.04" />
    </linearGradient>
    <linearGradient id="shade-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0" />
      <stop offset="1" stop-color="#000" stop-opacity="0.35" />
    </linearGradient>
    <clipPath id="window-${id}">
      <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="4" />
    </clipPath>
    ${meshPattern}
  </defs>

  <!-- Fötter -->
  <rect x="${x + 18}" y="${y + h - 2}" width="46" height="12" rx="3" fill="${c.foot}" />
  <rect x="${x + w - 64}" y="${y + h - 2}" width="46" height="12" rx="3" fill="${c.foot}" />
  <g transform="${frontMatrix}">
    <rect x="${DEPTH.dx - 40}" y="${h - 2}" width="32" height="12" rx="3" fill="${c.foot}" />
  </g>

  <!-- Taket -->
  <g transform="${topMatrix}">
    <rect x="0" y="0" width="${w}" height="${DEPTH.dx}" fill="${c.top}" />
    <rect x="30" y="22" width="${w - 60}" height="${DEPTH.dx - 44}" rx="6" fill="${caseColor === "white" ? "#d9d6df" : "#15121b"}" />
    <g stroke="${caseColor === "white" ? "#c7c3cf" : "#0c0a10"}" stroke-width="3">
      ${Array.from({ length: 8 }, (_, i) => `<line x1="${42 + i * 26}" y1="28" x2="${42 + i * 26}" y2="${DEPTH.dx - 30}" />`).join("")}
    </g>
  </g>

  <!-- Fronten -->
  <g transform="${frontMatrix}">
    <rect x="0" y="0" width="${DEPTH.dx}" height="${h}" fill="${style === "mesh" ? `url(#mesh-${id})` : c.front}" />
    ${frontFans}
    ${style === "glass" ? `<rect x="0" y="0" width="${DEPTH.dx}" height="${h}" fill="url(#glass-${id})" />` : ""}
    <rect x="0" y="0" width="${DEPTH.dx}" height="${h}" fill="url(#shade-${id})" opacity="0.6" />
    <rect x="0" y="0" width="7" height="${h}" fill="${c.frameEdge}" opacity="0.9" />
    <rect x="${DEPTH.dx - 6}" y="0" width="6" height="${h}" fill="${c.frame}" />
  </g>

  <!-- Sidan: ram -->
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${c.frame}" />

  <!-- Insidan, sedd genom glaset -->
  <g clip-path="url(#window-${id})">
    <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${c.interior}" />
    <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="url(#ambient-${id})" />

    <!-- Moderkortet -->
    <rect x="${ix + 22}" y="${iy + 28}" width="${iw - 70}" height="250" rx="4" fill="${c.board}" />
    <g stroke="${c.partEdge}" stroke-width="1" opacity="0.5">
      <line x1="${ix + 40}" y1="${iy + 205}" x2="${ix + 200}" y2="${iy + 205}" />
      <line x1="${ix + 40}" y1="${iy + 245}" x2="${ix + 200}" y2="${iy + 245}" />
      <rect x="${ix + 34}" y="${iy + 52}" width="40" height="70" rx="3" fill="none" />
    </g>

    ${topFans}

    <!-- Bakre fläkten, sedd från sidan -->
    <rect x="${ix + 2}" y="${iy + 48}" width="14" height="78" rx="3" fill="#0b0a0f" stroke="${c.partEdge}" stroke-width="0.8" />
    <rect x="${ix + 12}" y="${iy + 52}" width="3" height="70" rx="1.5" fill="${accent}" filter="url(#glow-${id})" />
    <rect x="${ix + 12}" y="${iy + 52}" width="2" height="70" rx="1" fill="${accent}" />

    <!-- Slangar från pumpen upp till kylaren i taket -->
    <path d="M${pumpX + 14} ${pumpY - 22} C ${pumpX + 30} ${pumpY - 60}, ${pumpX + 110} ${pumpY - 60}, ${pumpX + 130} ${iy + 22}" fill="none" stroke="#08070b" stroke-width="9" stroke-linecap="round" />
    <path d="M${pumpX + 24} ${pumpY - 14} C ${pumpX + 50} ${pumpY - 48}, ${pumpX + 140} ${pumpY - 48}, ${pumpX + 158} ${iy + 22}" fill="none" stroke="#08070b" stroke-width="9" stroke-linecap="round" />

    <!-- Processorkylarens pump -->
    <circle cx="${pumpX}" cy="${pumpY}" r="33" fill="${c.part}" stroke="${c.partEdge}" stroke-width="1.2" />
    <circle cx="${pumpX}" cy="${pumpY}" r="24" fill="none" stroke="${accent}" stroke-width="8" filter="url(#glow-${id})" />
    <circle cx="${pumpX}" cy="${pumpY}" r="24" fill="#0b0a0f" stroke="${accent}" stroke-width="3" />
    <circle cx="${pumpX}" cy="${pumpY}" r="10" fill="${accent}" opacity="0.5" filter="url(#glow-${id})" />
    <circle cx="${pumpX}" cy="${pumpY}" r="6" fill="${accent}" opacity="0.9" />

    ${ramSticks}

    <!-- Grafikkortet -->
    <rect x="${ix + 26}" y="${iy + 222}" width="${iw - 62}" height="54" rx="5" fill="${c.part}" stroke="${c.partEdge}" stroke-width="1" />
    <rect x="${ix + 26}" y="${iy + 222}" width="${iw - 62}" height="54" rx="5" fill="url(#shade-${id})" />
    <g stroke="${c.partEdge}" stroke-width="1" opacity="0.6">
      ${Array.from({ length: 8 }, (_, i) => `<line x1="${ix + 56 + i * 18}" y1="${iy + 236}" x2="${ix + 48 + i * 18}" y2="${iy + 264}" />`).join("")}
    </g>
    <rect x="${ix + 36}" y="${iy + 224}" width="${iw - 120}" height="4" rx="2" fill="${accent}" filter="url(#glow-${id})" />
    <rect x="${ix + 36}" y="${iy + 224}" width="${iw - 120}" height="3" rx="1.5" fill="${accent}" />

    <!-- Nätdelskåpan i botten -->
    <rect x="${ix}" y="${iy + ih - 82}" width="${iw}" height="82" fill="${c.shroud}" />
    <rect x="${ix}" y="${iy + ih - 82}" width="${iw}" height="2" fill="${c.partEdge}" opacity="0.6" />
    <g fill="${caseColor === "white" ? "#c9c5d1" : "#13111a"}">
      ${Array.from({ length: 6 }, (_, i) => `<rect x="${ix + iw - 100 + i * 14}" y="${iy + ih - 58}" width="7" height="38" rx="2" />`).join("")}
    </g>
    <rect x="${ix + 30}" y="${iy + ih - 44}" width="90" height="3" rx="1.5" fill="${accent}" opacity="0.9" />

    <!-- Ljuset nedifrån som slår upp mot komponenterna -->
    <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="url(#ambient-${id})" opacity="0.6" />

    <!-- Glaset -->
    <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="url(#glass-${id})" />
  </g>

  <!-- En svag ljus kant runt hela chassit, så ett svart chassi inte
       försvinner mot en mörk sida. -->
  <rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="5" fill="none" stroke="${caseColor === "white" ? "#ffffff" : "#4a4456"}" stroke-width="1" opacity="0.8" />
  <path d="M${x} ${y} L${x + DEPTH.dx} ${y + DEPTH.dy} L${fx + DEPTH.dx} ${y + DEPTH.dy} L${fx + DEPTH.dx} ${y + h + DEPTH.dy}" fill="none" stroke="${caseColor === "white" ? "#ffffff" : "#4a4456"}" stroke-width="1" opacity="0.8" />

  <!-- Hörnstolpen mellan sida och front -->
  <rect x="${fx - 5}" y="${y}" width="9" height="${h}" fill="${c.frameEdge}" />
  <rect x="${x}" y="${y}" width="${w}" height="3" fill="${c.frameEdge}" opacity="0.8" />
</svg>
`;
};

/*
 * Varianterna. Namnen är bara filnamn - kopplingen till produkterna görs
 * i src/data/productArt.ts.
 */
const VARIANTS = [
  { name: "aurora", accent: "#a855f7", caseColor: "black", style: "glass" },
  { name: "ember", accent: "#f2555a", caseColor: "black", style: "glass" },
  { name: "crimson", accent: "#e8465c", caseColor: "black", style: "mesh" },
  { name: "abyss", accent: "#4f8ff7", caseColor: "black", style: "mesh" },
  { name: "neon", accent: "#22d3ee", caseColor: "black", style: "glass" },
  { name: "glacier", accent: "#7dd3fc", caseColor: "white", style: "glass" },
  { name: "sky", accent: "#38bdf8", caseColor: "white", style: "mesh" },
  { name: "default", accent: "#3fd9f5", caseColor: "black", style: "glass" },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const variant of VARIANTS) {
  const svg = build(variant);
  const file = join(OUT_DIR, `${variant.name}.svg`);
  writeFileSync(file, svg, "utf8");
  console.log(`${file}: ${(svg.length / 1024).toFixed(1)} kB`);
}
