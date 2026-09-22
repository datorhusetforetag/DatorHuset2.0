/**
 * Gör om höjdkurvebilden till ett lila mönster med genomskinlig botten.
 *
 * VARFÖR BILDEN INTE ANVÄNDS SOM DEN ÄR
 *
 * Originalet är nästan svart. Hela dess omfång ligger mellan ljushet 5
 * och 30 av 255 - alltså en tiondel av skalan - och medianen ligger på
 * 14. Lagd rakt på sidans redan mörka lila bakgrund syns den knappt
 * alls, och skruvar man upp opaciteten kommer den svarta bottnen med
 * och gör hela sidan gråare.
 *
 * Skriptet skiljer därför mönstret från bottnen: ljusheten blir
 * alfakanal, och färgen blir märkets lila rakt igenom. Det som var
 * svart blir genomskinligt, det som var ljusa kurvor blir lila. Sedan
 * räcker det med opacity i CSS för att ställa styrkan, och bakgrunden
 * under lyser igenom överallt däremellan.
 *
 * Omfånget sträcks från 5-30 till 0-255. Utan den sträckningen hade den
 * ljusaste kurvan fått alfa 30 av 255 och mönstret vore osynligt hur
 * mycket opacity man än gav det.
 *
 * KÖRS EN GÅNG
 *
 * Resultatet checkas in. Det här är inte ett byggsteg - källbilden
 * ändras inte, och att avkoda en PNG på 2479x542 vid varje bygge för
 * att få exakt samma fil är slöseri.
 *
 * STORLEKEN HALVERAS
 *
 * Mönstret är mjukt och har inga skarpa kanter, och på sajten skalas
 * det ändå upp för att täcka fönstret. Full upplösning ger alltså
 * ingen synlig skillnad - bara en fil dubbelt så stor att ladda ned
 * innan sidan är klar.
 *
 *   node scripts/make-topo-pattern.mjs <källa.png> <mål.png> [delare]
 */

import fs from "node:fs";
import zlib from "node:zlib";

/* Märkets lila, --brand-plum i index.css: hsl(277 64% 65%). */
const PURPLE = [179, 109, 223];

const [, , inPath, outPath, divisorArg] = process.argv;
if (!inPath || !outPath) {
  console.error("Användning: node scripts/make-topo-pattern.mjs <källa.png> <mål.png> [delare]");
  process.exit(1);
}
const DIVISOR = Math.max(1, Math.round(Number(divisorArg) || 2));

/* ---------- Läsa PNG ---------- */

const readPng = (file) => {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error("Inte en PNG.");

  let o = 8;
  let w = 0, h = 0, depth = 0, colorType = 0, interlace = 0;
  const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o);
    const type = b.toString("ascii", o + 4, o + 8);
    if (type === "IHDR") {
      w = b.readUInt32BE(o + 8);
      h = b.readUInt32BE(o + 12);
      depth = b[o + 16];
      colorType = b[o + 17];
      interlace = b[o + 20];
    }
    if (type === "IDAT") idat.push(b.subarray(o + 8, o + 8 + len));
    o += 12 + len;
  }

  if (depth !== 8) throw new Error("Bara 8 bitars kanaler stöds.");
  if (interlace !== 0) throw new Error("Interlaced PNG stöds inte.");
  if (colorType !== 2 && colorType !== 6) throw new Error("Bara RGB och RGBA stöds.");

  const bpp = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const px = Buffer.alloc(h * stride);

  /* Avfiltrering enligt PNG-specen, filtertyp 0-4 per rad. */
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const out = px.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? px.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? out[i - bpp] : 0;
      const c = i >= bpp ? prev[i - bpp] : 0;
      const up = prev[i];
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += up;
      else if (filter === 3) v += (a + up) >> 1;
      else if (filter === 4) {
        const p = a + up - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c;
      }
      out[i] = v & 255;
    }
  }

  return { w, h, bpp, px };
};

/* ---------- Skriva PNG ---------- */

const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
};

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

/*
 * Radfilter väljs per rad, inte en gång för alla.
 *
 * PNG låter varje rad välja bland fem sätt att beskriva sig själv som
 * skillnader, och deflate packar sedan resultatet. Alfakanalen här är
 * ett mjukt fält utan kanter, och för sådana är Paeth och Up nästan
 * alltid bäst - men inte alltid, och skillnaden mellan bästa och
 * sämsta val är i storleksordningen dubbla filen.
 *
 * Vi provar alla fem och tar den vars rad har minst summa av
 * absolutbelopp. Det är heuristiken som finns i PNG-specen, och den
 * är billig: bilden kodas en gång, fem varianter per rad räknas i
 * minnet.
 */
const FILTERS = [0, 1, 2, 3, 4];

const filterRow = (type, cur, prev, stride, bpp, dst) => {
  for (let i = 0; i < stride; i++) {
    const a = i >= bpp ? cur[i - bpp] : 0;
    const c = i >= bpp ? prev[i - bpp] : 0;
    const up = prev[i];
    const x = cur[i];
    let v;
    if (type === 0) v = x;
    else if (type === 1) v = x - a;
    else if (type === 2) v = x - up;
    else if (type === 3) v = x - ((a + up) >> 1);
    else {
      const pp = a + up - c;
      const pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c);
      v = x - (pa <= pb && pa <= pc ? a : pb <= pc ? up : c);
    }
    dst[i] = v & 255;
  }
};

/*
 * Skrivs som palettbild, inte RGBA.
 *
 * Färgen är samma lila i varje pixel - det enda som varierar är hur
 * genomskinlig den är. En RGBA-fil lagrar då fyra byte där en räcker,
 * och de tre konstanta blir nollor som deflate visserligen packar bra
 * men ändå måste bära.
 *
 * En palett med 256 poster, alla samma lila, plus en tRNS-tabell med
 * genomskinligheterna 0-255, gör pixelvärdet till precis alfanivån.
 * Filen blir en fjärdedel så många symboler att packa.
 *
 * Både palett och tRNS är i PNG-specen sedan 1996 och fungerar i
 * varje webbläsare som visar en PNG alls.
 */
const writePaletted = (file, w, h, alpha, color) => {
  const stride = w;
  const raw = Buffer.alloc(h * (stride + 1));
  const trial = Buffer.alloc(stride);
  const empty = Buffer.alloc(stride);

  for (let y = 0; y < h; y++) {
    const cur = alpha.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? alpha.subarray((y - 1) * stride, y * stride) : empty;
    const dst = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));

    let best = 0, bestScore = Infinity;
    for (const type of FILTERS) {
      filterRow(type, cur, prev, stride, 1, trial);
      let score = 0;
      for (let i = 0; i < stride; i++) {
        const v = trial[i];
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) { bestScore = score; best = type; }
    }

    raw[y * (stride + 1)] = best;
    filterRow(best, cur, prev, stride, 1, dst);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 3;

  /* 256 lika poster. Index n betyder alfa n. */
  const plte = Buffer.alloc(256 * 3);
  for (let n = 0; n < 256; n++) {
    plte[n * 3] = color[0];
    plte[n * 3 + 1] = color[1];
    plte[n * 3 + 2] = color[2];
  }
  const trns = Buffer.alloc(256);
  for (let n = 0; n < 256; n++) trns[n] = n;

  fs.writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("PLTE", plte),
      chunk("tRNS", trns),
      chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
};

/* ---------- Gör jobbet ---------- */

const { w, h, bpp, px } = readPng(inPath);

/* Mät omfånget i stället för att anta det. Byts källbilden ut håller
   sträckningen ändå, och siffrorna skrivs ut så de går att kontrollera. */
let lo = 255, hi = 0;
const lum = new Uint8Array(w * h);
for (let i = 0, p = 0; i < px.length; i += bpp, p++) {
  const L = Math.round(0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]);
  lum[p] = L;
  if (L < lo) lo = L;
  if (L > hi) hi = L;
}
if (hi <= lo) throw new Error("Bilden har inget omfång att sträcka.");

/* Nedskalning med medelvärde över hela rutan, inte närmaste pixel.
   Närmaste pixel hoppar över hälften av linjerna och mönstret blir
   hackigt; medelvärdet behåller dem som svagare men hela. */
const ow = Math.floor(w / DIVISOR);
const oh = Math.floor(h / DIVISOR);
const alpha = Buffer.alloc(ow * oh);

for (let y = 0; y < oh; y++) {
  for (let x = 0; x < ow; x++) {
    let sum = 0, n = 0;
    for (let dy = 0; dy < DIVISOR; dy++) {
      const sy = y * DIVISOR + dy;
      if (sy >= h) break;
      for (let dx = 0; dx < DIVISOR; dx++) {
        const sx = x * DIVISOR + dx;
        if (sx >= w) break;
        sum += lum[sy * w + sx];
        n++;
      }
    }
    const t = (sum / n - lo) / (hi - lo);
    alpha[y * ow + x] = Math.max(0, Math.min(255, Math.round(t * 255)));
  }
}

writePaletted(outPath, ow, oh, alpha, PURPLE);

const before = fs.statSync(inPath).size;
const after = fs.statSync(outPath).size;
console.log(`${w}x${h} -> ${ow}x${oh}  ljushet ${lo}-${hi} sträckt till 0-255`);
console.log(`${Math.round(before / 1024)} kB  ->  ${Math.round(after / 1024)} kB`);
