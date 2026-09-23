/**
 * Gör alla ikonstorlekar ur den exporterade logotypen.
 *
 *   node scripts/generate-icons-from-png.mjs
 *
 * Läser public/datorhuset-mark-master.png och skriver nio PNG:er plus
 * favicon.ico. Kör om den när logotypen ändras.
 *
 * DEN HÄR ÄR ETT PROVISORIUM
 *
 * Rätt väg är scripts/generate-brand-assets.mjs, som bygger samma filer
 * ur SVG och därför är knivskarp ända ned till 16 px. Det här skriptet
 * finns för att logotypen just nu är en bitmapp från Photoshop, och en
 * bitmapp som krymps till 16 px blir mjuk hur väl man än gör det. Byt
 * till SVG-vägen när märket är omritat i vektor.
 *
 * DISET MÅSTE BORT FÖRST
 *
 * Masken i Photoshop räknades fram ur bildens ljushet, och bakgrunden i
 * originalet var inte riktigt vit utan låg kring 247 av 255. Inverterat
 * blev det alfa 8 i stället för 0 - alltså en nästan osynlig hinna över
 * hela rutan i stället för genomskinlighet.
 *
 * Mätt på den exporterade filen: 34,5 % av pixlarna ligger på alfa 1-15
 * och toppar på 7. Riktiga mjuka kanter börjar först vid 41. Mellan 8
 * och 40 finns knappt något alls, så det går att skilja dem åt utan att
 * gissa.
 *
 * Utan det här steget hade hinnan synts som en svagt färgad fyrkant mot
 * ljus bakgrund, och beskärningen nedan hade inte hittat någon kant att
 * beskära mot - ingenting i filen är helt genomskinligt.
 *
 * SKALNINGEN GÖRS AV CHROME
 *
 * Samma headless Chrome som varumärkesskriptet använder. Att skriva en
 * egen nedskalare som hanterar förmultiplicerad alfa rätt är fullt
 * möjligt, men webbläsaren gör det redan och gör det bättre - och en
 * egen som gör det nästan rätt ger mörka eller ljusa kanter som ingen
 * ser förrän ikonen ligger i en flik.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import zlib from "node:zlib";

const MASTER = "public/datorhuset-mark-master.png";
const PUBLIC_DIR = "public";

/* Andel av rutan som märket fyller. Resten är luft runt om.
   Utan luft klistras ikonen mot kanten i rundade avatarer och i
   webbläsarens flik. */
const FILL = 0.86;

/* Allt under det här räknas som dis och nollas. Se kommentaren ovan för
   varför 14 och inte 2 eller 40. */
const HAZE = 14;

const TARGETS = [
  ["icon-512.png", 512],
  ["Datorhuset.png", 512],
  ["datorhuset-round.png", 256],
  ["icon-192.png", 192],
  ["apple-touch-icon.png", 180],
  ["datorhuset-mark-small.png", 128],
  ["favicon-96.png", 96],
  ["favicon-48.png", 48],
  ["favicon-32.png", 32],
];

const ICO_SIZES = [16, 32, 48];

/* ------------------------------------------------------------- PNG in/ut - */

const readPng = (file) => {
  const b = readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file} är ingen PNG.`);

  let o = 8, w = 0, h = 0, depth = 0, colorType = 0, interlace = 0;
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
  if (depth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error(
      `${file} måste vara 8 bitars RGBA utan interlace. Exportera om med Transparency ikryssat.`,
    );
  }

  const stride = w * 4;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(h * stride);
  const empty = Buffer.alloc(stride);

  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const out = px.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? px.subarray((y - 1) * stride, y * stride) : empty;
    for (let i = 0; i < stride; i++) {
      const a = i >= 4 ? out[i - 4] : 0;
      const c = i >= 4 ? prev[i - 4] : 0;
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
  return { w, h, px };
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

const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
};

const writePng = (file, w, h, px) => {
  const stride = w * 4;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 1; // Sub
    const src = px.subarray(y * stride, (y + 1) * stride);
    const dst = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) dst[i] = (src[i] - (i >= 4 ? src[i - 4] : 0)) & 255;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
};

/* ---------------------------------------------------- rensa och beskär --- */

const clean = ({ w, h, px }) => {
  /* Sträck alfa så hinnan hamnar på noll och riktiga kanter behåller sin
     mjukhet. Ren avhuggning hade gett taggiga kanter på de kurvor som
     ligger snett. */
  for (let i = 3; i < px.length; i += 4) {
    const a = px[i];
    px[i] = a <= HAZE ? 0 : Math.min(255, Math.round(((a - HAZE) * 255) / (255 - HAZE)));
  }

  let minX = w, maxX = -1, minY = h, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] === 0) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) throw new Error("Bilden är helt genomskinlig efter rensningen.");

  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    px.copy(out, y * cw * 4, ((y + minY) * w + minX) * 4, ((y + minY) * w + minX + cw) * 4);
  }
  return { w: cw, h: ch, px: out, trimmed: [minX, minY, maxX, maxY] };
};

/* ------------------------------------------------------ rastrering ------- */

const CHROME = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean).find((p) => p && existsSync(p));

if (!CHROME) {
  throw new Error("Hittade ingen Chrome/Edge. Sätt CHROME_PATH till webbläsarens exe.");
}

const WORK = join(tmpdir(), "datorhuset-ikoner");
mkdirSync(WORK, { recursive: true });

/* object-fit: contain håller proportionerna och centrerar. Märket är
   högre än brett, så det är höjden som möter ramen - bredden får mer
   luft, och det är rätt: en ikon läses på sin höjd. */
const page = (b64, size) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>` +
  `html,body{margin:0;padding:0;width:${size}px;height:${size}px;overflow:hidden;background:transparent}` +
  `img{display:block;width:100%;height:100%;object-fit:contain;padding:${Math.round((size * (1 - FILL)) / 2)}px;box-sizing:border-box}` +
  `</style></head><body><img src="data:image/png;base64,${b64}"></body></html>`;

/*
 * Skärmbilden måste ha en absolut sökväg.
 *
 * Med en relativ skrev Chrome ingenting alls - och avslutade ändå med
 * noll, så execFileSync kastade inte. Skriptet skrev ut nio rader om
 * filer det trodde att det hade gjort, medan de på disken var kvar
 * från förra gången. Det upptäcktes bara för att git inte såg några
 * ändringar att checka in.
 *
 * Därav kontrollen efteråt: en bild som inte finns, eller som är äldre
 * än anropet, är ett fel och ska stoppa körningen. Ett byggsteg som
 * ljuger om vad det gjort är värre än ett som kraschar.
 */
const shot = (b64, size, outFile) => {
  const target = resolve(outFile);
  const before = Date.now();
  const file = join(WORK, `p-${size}-${Math.random().toString(36).slice(2)}.html`);
  writeFileSync(file, page(b64, size), "utf8");
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--default-background-color=00000000",
      "--virtual-time-budget=4000",
      `--screenshot=${target}`,
      `--window-size=${size},${size}`,
      `file:///${file.replace(/\\/g, "/")}`,
    ],
    { stdio: "ignore" },
  );
  rmSync(file, { force: true });

  if (!existsSync(target)) {
    throw new Error(`Chrome skrev ingen fil till ${target}.`);
  }
  /* En sekunds marginal för klockans upplösning på filsystemet. */
  if (statSync(target).mtimeMs < before - 1000) {
    throw new Error(
      `${target} är oförändrad - Chrome skrev inte över den. Kontrollera CHROME_PATH.`,
    );
  }
  return statSync(target).size;
};

/* ------------------------------------------------------------ favicon.ico */

/* En .ico är inte ett eget bildformat utan en låda med bilder i. Här
   ligger tre PNG:er rakt av, vilket alla webbläsare sedan IE11 läser. */
const buildIco = (paths) => {
  const images = paths.map((p) => readFileSync(p));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + 16 * images.length;
  images.forEach((png, i) => {
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
};

/* ------------------------------------------------------------------ kör - */

const raw = readPng(MASTER);
const art = clean(raw);
console.log(
  `${MASTER}  ${raw.w}x${raw.h}  ->  beskuret ${art.w}x${art.h}` +
    `  (dis under alfa ${HAZE} nollat)`,
);

const cleanFile = join(WORK, "mark-clean.png");
writePng(cleanFile, art.w, art.h, art.px);
const b64 = readFileSync(cleanFile).toString("base64");

for (const [name, size] of TARGETS) {
  const out = join(PUBLIC_DIR, name);
  const bytes = shot(b64, size, out);
  console.log(`png   ${out.padEnd(34)} ${String(size + 'x' + size).padStart(9)}  ${String(Math.round(bytes / 1024)).padStart(4)} kB`);
}

const icoParts = ICO_SIZES.map((size) => {
  const tmp = join(WORK, `ico-${size}.png`);
  shot(b64, size, tmp);
  return tmp;
});
writeFileSync(join(PUBLIC_DIR, "favicon.ico"), buildIco(icoParts));
console.log(`ico   ${join(PUBLIC_DIR, "favicon.ico").padEnd(38)} ${ICO_SIZES.join("/")}`);

rmSync(WORK, { recursive: true, force: true });
