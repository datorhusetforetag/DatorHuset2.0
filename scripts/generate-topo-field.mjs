/**
 * Ritar höjdkurvefältet bakom sidan, från grunden.
 *
 * VARFÖR INTE EN BILD
 *
 * Här låg en PNG. Den var 1239 px bred och skalades upp drygt fyra
 * gånger för att täcka fönstret, så varje linje blev ett suddigt band.
 * Höjde man upplösningen blev filen stor i stället. Ett mönster av rena
 * kurvor har inget av de problemen: det är samma fil på en telefon som
 * på en 4K-skärm, och det är skarpt på båda.
 *
 * SÅ HÄR BLIR DET TILL
 *
 * 1. Ett höjdfält räknas fram som en summa av sinusvågor.
 * 2. Marching squares drar kurvan där fältet passerar varje nivå.
 * 3. Kurvorna slås ihop till sammanhängande linjer, glesas ut och
 *    skrivs som path-element.
 *
 * Det är samma metod som en riktig höjdkarta använder. Skillnaden är
 * att marken är påhittad.
 *
 * VARFÖR DET GÅR IHOP I KANTERNA
 *
 * Varje våg har ett helt antal perioder över rutan, både i sidled och i
 * höjdled. Fältet är därför exakt likadant vid vänsterkanten som vid
 * högerkanten, och en kurva som går ut till höger kommer in till
 * vänster på samma höjd. Rutan kan alltså upprepas åt alla håll utan
 * söm - och det är förutsättningen för att den ska kunna glida i
 * oändlighet utan att någonsin visa en skarv.
 *
 *   node scripts/generate-topo-field.mjs
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = "public/patterns";

/* Rutans mått i användarenheter. Bredare än hög, som en horisont. */
const W = 1600;
const H = 900;

/* --------------------------------------------------------------- slumpen - */

/*
 * Egen slumpgenerator med frö.
 *
 * Math.random hade gett ett nytt mönster vid varje körning, och då kan
 * ingen se i efterhand varför bakgrunden ändrade sig - eller få tillbaka
 * den man tyckte om. Med frö ger samma tal samma fält, varje gång.
 */
const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* ----------------------------------------------------------------- fältet - */

/*
 * Höjden i en punkt: en summa av plana vågor.
 *
 * Varje våg har heltalsfrekvenser, vilket är det som gör rutan
 * upprepningsbar. Låga frekvenser får stor amplitud och höga får liten,
 * så fältet får stora mjuka former med finare krusning ovanpå - samma
 * fördelning som riktig terräng har, och anledningen till att det läser
 * som landskap och inte som ett tygmönster.
 */
const makeField = (seed, waves, maxFreq) => {
  const rnd = mulberry32(seed);
  const terms = [];

  for (let i = 0; i < waves; i++) {
    /* Minst en period åt något håll, annars blir vågen en konstant. */
    let px = Math.floor(rnd() * maxFreq) + 1;
    let py = Math.floor(rnd() * maxFreq) + 1;
    if (rnd() < 0.5) px = -px;

    /* Amplituden faller med frekvensen. */
    const freq = Math.hypot(px, py);
    terms.push({
      px,
      py,
      phase: rnd() * Math.PI * 2,
      amp: 1 / Math.pow(freq, 1.35),
    });
  }

  const norm = terms.reduce((sum, t) => sum + t.amp, 0);

  return (x, y) => {
    let v = 0;
    for (const t of terms) {
      v += t.amp * Math.sin(2 * Math.PI * (t.px * x + t.py * y) + t.phase);
    }
    return v / norm;
  };
};

/* -------------------------------------------------- marching squares ------ */

/*
 * Tabellen säger vilka cellkanter kurvan går mellan, för vart och ett av
 * de sexton sätten en cells fyra hörn kan ligga över eller under nivån.
 *
 * Kanterna numreras 0 topp, 1 höger, 2 botten, 3 vänster. Hörnen ger
 * bitarna 1 uppe vänster, 2 uppe höger, 4 nere höger, 8 nere vänster.
 *
 * Fall 5 och 10 är de tvetydiga: två motsatta hörn är över och två
 * under, och kurvan kan dras på två sätt. Vi läser cellens mittvärde och
 * väljer det som stämmer med det. Utan den kontrollen bryts kurvor isär
 * i sadelpunkter, och ett höjdfält har gott om sadelpunkter.
 */
const CASES = [
  [], [[3, 0]], [[0, 1]], [[3, 1]],
  [[1, 2]], null, [[0, 2]], [[3, 2]],
  [[2, 3]], [[0, 3]], null, [[1, 3]],
  [[1, 2]], [[0, 1]], [[3, 0]], [],
];
/* Fall 4, 12, 13 och 14 delar poster med sina spegelvändningar ovan;
   tabellen är skriven så att paren pekar på samma kantpar. */
CASES[4] = [[1, 2]];
CASES[6] = [[0, 2]];
CASES[9] = [[2, 0]];
CASES[11] = [[2, 1]];
CASES[12] = [[1, 3]];
CASES[13] = [[1, 0]];
CASES[14] = [[0, 3]];

const AMBIGUOUS = {
  5: { high: [[3, 2], [0, 1]], low: [[3, 0], [2, 1]] },
  10: { high: [[0, 3], [2, 1]], low: [[0, 1], [2, 3]] },
};

/** Punkten där kurvan skär en cellkant, linjärt interpolerad. */
const edgePoint = (edge, x0, y0, dx, dy, v, level) => {
  const [tl, tr, br, bl] = v;
  const mix = (a, b) => {
    const d = b - a;
    return Math.abs(d) < 1e-12 ? 0.5 : (level - a) / d;
  };
  if (edge === 0) return [x0 + mix(tl, tr) * dx, y0];
  if (edge === 1) return [x0 + dx, y0 + mix(tr, br) * dy];
  if (edge === 2) return [x0 + mix(bl, br) * dx, y0 + dy];
  return [x0, y0 + mix(tl, bl) * dy];
};

/** Alla linjesegment för en nivå. */
const contourSegments = (grid, nx, ny, dx, dy, level) => {
  const at = (i, j) => grid[j * (nx + 1) + i];
  const segments = [];

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const v = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)];
      let code = 0;
      if (v[0] > level) code |= 1;
      if (v[1] > level) code |= 2;
      if (v[2] > level) code |= 4;
      if (v[3] > level) code |= 8;
      if (code === 0 || code === 15) continue;

      let pairs = CASES[code];
      if (code === 5 || code === 10) {
        const middle = (v[0] + v[1] + v[2] + v[3]) / 4;
        pairs = AMBIGUOUS[code][middle > level ? "high" : "low"];
      }

      const x0 = i * dx;
      const y0 = j * dy;
      for (const [a, b] of pairs) {
        segments.push([
          edgePoint(a, x0, y0, dx, dy, v, level),
          edgePoint(b, x0, y0, dx, dy, v, level),
        ]);
      }
    }
  }
  return segments;
};

/* ------------------------------------------------- segment till linjer ---- */

/*
 * Marching squares ger lösa streck, ett per cell. Ritas de som de är
 * blir filen enorm och varje streck får sina egna ändar, vilket syns som
 * knölar där de möts. Här sys de ihop till långa linjer i stället.
 *
 * Punkter matchas på avrundade koordinater. Två streck som delar en
 * cellkant räknar fram exakt samma punkt, så avrundningen behöver bara
 * skydda mot flyttalsdamm - inte mot riktiga avstånd.
 */
const stitch = (segments) => {
  const key = ([x, y]) => `${Math.round(x * 64)},${Math.round(y * 64)}`;
  const ends = new Map();

  segments.forEach((seg, index) => {
    for (const p of seg) {
      const k = key(p);
      if (!ends.has(k)) ends.set(k, []);
      ends.get(k).push(index);
    }
  });

  const used = new Array(segments.length).fill(false);
  const lines = [];

  /* Följ kedjan åt ett håll från ett segment, och sedan åt det andra. */
  const walk = (start, fromEnd) => {
    const points = [];
    let index = start;
    let point = segments[index][fromEnd];
    let next = segments[index][1 - fromEnd];
    points.push(point, next);
    used[index] = true;

    for (;;) {
      const candidates = ends.get(key(next)) || [];
      const step = candidates.find((c) => !used[c]);
      if (step === undefined) break;
      used[step] = true;
      const seg = segments[step];
      const same = key(seg[0]) === key(next);
      next = same ? seg[1] : seg[0];
      points.push(next);
    }
    return points;
  };

  for (let i = 0; i < segments.length; i++) {
    if (used[i]) continue;
    const forward = walk(i, 0);
    /* Kedjan kan ha fortsatt åt andra hållet också. */
    const backward = [];
    let tail = segments[i][0];
    for (;;) {
      const candidates = ends.get(key(tail)) || [];
      const step = candidates.find((c) => !used[c]);
      if (step === undefined) break;
      used[step] = true;
      const seg = segments[step];
      const same = key(seg[0]) === key(tail);
      tail = same ? seg[1] : seg[0];
      backward.unshift(tail);
    }
    const line = backward.concat(forward);
    if (line.length > 3) lines.push(line);
  }

  return lines;
};

/* ------------------------------------------------------------- utglesning - */

/*
 * Douglas-Peucker: ta bort punkter som ligger så nära linjen mellan sina
 * grannar att de inte ändrar formen.
 *
 * Kurvorna kommer med en punkt per cellkant, alltså långt fler än ögat
 * kan skilja. Utan det här steget blir filen flera hundra kilobyte av
 * koordinater som ritar exakt samma linje.
 */
const simplify = (points, tolerance) => {
  if (points.length < 3) return points;

  const distance = (p, a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  };

  const keep = new Array(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];

  while (stack.length) {
    const [lo, hi] = stack.pop();
    let worst = 0;
    let index = -1;
    for (let i = lo + 1; i < hi; i++) {
      const d = distance(points[i], points[lo], points[hi]);
      if (d > worst) { worst = d; index = i; }
    }
    if (worst > tolerance && index !== -1) {
      keep[index] = true;
      stack.push([lo, index], [index, hi]);
    }
  }

  return points.filter((_, i) => keep[i]);
};

/* --------------------------------------------------------------- utdata --- */

/*
 * Punkter till en mjuk kurva.
 *
 * Catmull-Rom genom punkterna, omskrivet till kubiska Bézier-kurvor som
 * SVG förstår. Raka linjer mellan punkterna hade gett synliga knäckar på
 * de glesade kurvorna, och en höjdkurva som knäcker ser ut som ett
 * diagram i stället för som terräng.
 */
const toPath = (points) => {
  if (points.length < 2) return "";
  const n = (v) => Math.round(v * 10) / 10;
  let d = `M${n(points[0][0])} ${n(points[0][1])}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
  }
  return d;
};

/**
 * Ett lager: ett fält, ett antal nivåer, en fil.
 *
 * Varje fjärde nivå ritas kraftigare. På en riktig höjdkarta heter de
 * ledkurvor och finns för att ögat ska kunna räkna nivåer utan att följa
 * varenda linje. Här fyller de samma syfte: de ger fältet djup i stället
 * för att allt ligger i samma plan.
 */
const buildLayer = ({ seed, waves, maxFreq, levels, samples, stroke, tolerance }) => {
  const field = makeField(seed, waves, maxFreq);

  /* Ett extra prov i varje led, så rutans högerkant har exakt samma
     värden som vänsterkanten och kurvorna möts över skarven. */
  const nx = samples;
  const ny = Math.round(samples * (H / W));
  const grid = new Float64Array((nx + 1) * (ny + 1));
  for (let j = 0; j <= ny; j++) {
    for (let i = 0; i <= nx; i++) {
      grid[j * (nx + 1) + i] = field(i / nx, j / ny);
    }
  }

  const dx = W / nx;
  const dy = H / ny;

  const plain = [];
  const index = [];

  for (let k = 0; k < levels; k++) {
    /* Nivåerna läggs innanför -1..1 så de yttersta inte hamnar utanför
       fältets faktiska omfång och blir tomma. */
    const level = -0.82 + (1.64 * k) / (levels - 1);
    const lines = stitch(contourSegments(grid, nx, ny, dx, dy, level));
    const target = k % 4 === 0 ? index : plain;
    for (const line of lines) {
      const d = toPath(simplify(line, tolerance));
      if (d) target.push(d);
    }
  }

  const group = (paths, width, opacity) =>
    paths.length === 0
      ? ""
      : `  <g fill="none" stroke="#B26BDE" stroke-width="${width}" stroke-opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round">\n` +
        paths.map((d) => `    <path d="${d}"/>`).join("\n") +
        "\n  </g>\n";

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n` +
    group(plain, stroke, 0.55) +
    group(index, stroke * 2.1, 0.9) +
    "</svg>\n";

  return { svg, count: plain.length + index.length };
};

/* ------------------------------------------------------------------ kör --- */

mkdirSync(OUT_DIR, { recursive: true });

/*
 * Två lager som glider olika fort.
 *
 * Fjärran har färre och lugnare vågor och tunnare linjer; nära har fler
 * och tjockare. Skillnaden i hastighet gör resten: två ytor som rör sig
 * olika fort läses som olika avstånd, och det är det enda som ger ett
 * platt mönster djup.
 */
const LAYERS = [
  { name: "topo-far.svg", seed: 20260923, waves: 5, maxFreq: 2, levels: 11, samples: 150, stroke: 1.2, tolerance: 0.6 },
  { name: "topo-near.svg", seed: 771104, waves: 6, maxFreq: 3, levels: 13, samples: 180, stroke: 1.7, tolerance: 0.55 },
];

for (const layer of LAYERS) {
  const { svg, count } = buildLayer(layer);
  const file = join(OUT_DIR, layer.name);
  writeFileSync(file, svg, "utf8");
  console.log(
    `${file.padEnd(30)} ${String(count).padStart(4)} kurvor  ${String(Math.round(svg.length / 1024)).padStart(3)} kB`,
  );
}
