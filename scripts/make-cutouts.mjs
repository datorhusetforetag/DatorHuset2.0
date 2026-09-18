import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";

/*
 * Frilägger produktbilderna.
 *
 * Bilderna i images/product images/ ser frilagda ut men är det inte -
 * de har en helvit bakgrund och en alfakanal som är helt ogenomskinlig
 * hela vägen. Lagda i en hög mot den mörka duken blir de vita rutor.
 *
 * Bakgrunden fylls därför bort utifrån och in med en flödesfyllning
 * från kanterna. Just utifrån och in är poängen: en produkt kan ha vita
 * delar mitt i, och en enkel tröskel på "allt vitt blir genomskinligt"
 * hade ätit hål i den. Vitt som inte hänger ihop med kanten lämnas kvar.
 */

const decode = (file) => {
  const b = fs.readFileSync(file);
  let off = 8, w = 0, h = 0, depth = 0, color = 0;
  const idat = [];
  while (off < b.length) {
    const len = b.readUInt32BE(off);
    const type = b.slice(off + 4, off + 8).toString("ascii");
    const data = b.slice(off + 8, off + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; color = data[9]; }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  const ch = color === 6 ? 4 : color === 2 ? 3 : 0;
  if (!ch || depth !== 8) throw new Error(file + ": stöds inte (djup " + depth + ", typ " + color + ")");
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * ch, out = Buffer.alloc(h * stride);
  const paeth = (a, bb, c) => { const p = a + bb - c, pa = Math.abs(p - a), pb = Math.abs(p - bb), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? bb : c; };
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)], src = y * (stride + 1) + 1;
    for (let x = 0; x < stride; x++) {
      const rv = raw[src + x];
      const a = x >= ch ? out[y * stride + x - ch] : 0;
      const bv = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= ch && y > 0 ? out[(y - 1) * stride + x - ch] : 0;
      out[y * stride + x] = (ft === 0 ? rv : ft === 1 ? rv + a : ft === 2 ? rv + bv : ft === 3 ? rv + ((a + bv) >> 1) : rv + paeth(a, bv, c)) & 0xff;
    }
  }
  // Normalisera till RGBA
  if (ch === 4) return { w, h, px: out };
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = out[i * 3]; rgba[i * 4 + 1] = out[i * 3 + 1];
    rgba[i * 4 + 2] = out[i * 3 + 2]; rgba[i * 4 + 3] = 255;
  }
  return { w, h, px: rgba };
};

let TBL = null;
const crc = (buf) => {
  if (!TBL) { TBL = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; TBL[n] = c >>> 0; } }
  let c = 0xFFFFFFFF; for (const x of buf) c = TBL[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, cr]);
};
const encode = (w, h, px, file) => {
  const stride = w * 4, raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0)),
  ]));
};

const THRESHOLD = 244;   // allt över detta räknas som bakgrund
const SOFT = 200;        // under detta är motivet helt ogenomskinligt

const cut = (input, output) => {
  const { w, h, px } = decode(input);
  const isPale = (i) => Math.min(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]) >= THRESHOLD;

  // Flödesfyllning från alla kantpixlar
  const bg = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1); }
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || !isPale(i)) continue;
    bg[i] = 1;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }

  /*
   * Kanten mjukas upp, men BARA där motivet möter bakgrunden.
   *
   * Att tona alla ljusa pixlar vore enklare och helt fel: ett vitt
   * chassi är ljust rakt igenom, och då blir hela datorn genomskinlig
   * och duken lyser rätt igenom den. Bara pixlar som gränsar till den
   * bortfyllda bakgrunden får sin alfa sänkt, och då bara i den mån de
   * är ljusa - det är där den vita konturen annars sitter.
   */
  let kept = 0;
  const alpha = new Uint8Array(w * h).fill(255);
  for (let i = 0; i < w * h; i++) {
    if (bg[i]) { alpha[i] = 0; continue; }
    kept++;
    const x = i % w, y = (i / w) | 0;
    const touchesBg =
      (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) ||
      (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w]);
    if (!touchesBg) continue;
    const m = Math.min(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
    if (m > SOFT) alpha[i] = Math.round(255 * (1 - (m - SOFT) / (THRESHOLD - SOFT)));
  }
  for (let i = 0; i < w * h; i++) px[i * 4 + 3] = alpha[i];

  fs.mkdirSync(path.dirname(output), { recursive: true });
  encode(w, h, px, output);
  const pct = ((kept / (w * h)) * 100).toFixed(0);
  console.log(path.basename(output).padEnd(22) + "  motiv kvar: " + pct + "% av ytan");
};

/*
 * Körs för hand när produktbilderna byts ut:
 *
 *   node scripts/make-cutouts.mjs
 *
 * Resultatet checkas in i images/cutouts/. Det är med flit - bygget ska
 * inte behöva köra bildbehandling, och utan incheckade filer hade en
 * kollega som klonar projektet fått ett tomt avsnitt.
 */
const JOBS = [
  ["chassi/NZXT H7 Flow.png", "case-nzxt.png"],
  ["chassi/Lian Li O11 Dynamic.png", "case-o11.png"],
  ["gpu/4070 super.png", "gpu.png"],
  ["cpu/13600k.png", "cpu.png"],
  ["ram/Corsair Dominator.png", "ram.png"],
  ["cooler/Corsair iCUE H150i.png", "cooler.png"],
  ["ssd/WD Blue SN580 1TBWD Blue SN580 1TB.png", "ssd.png"],
];

for (const [from, to] of JOBS) {
  cut(path.join("images/product images", from), path.join("images/cutouts", to));
}
