/**
 * Gör om delningsbilden som visas när någon klistrar in en länk till sajten.
 *
 *   node scripts/generate-og-image.mjs
 *
 * Skriver public/og-datorhuset.png, 1200x630, den storlek Facebook,
 * Discord, Twitter, LinkedIn och Slack alla vill ha.
 *
 * VARFÖR DEN GÖRS OM
 *
 * Den gamla bilden bar Canva-loggan: gradient rakt igenom figuren, en
 * lös "31" mitt i huset, och mörka fransar längs kanterna. Den loggan är
 * ersatt överallt annars, men delningsbilden låg kvar från 17 september
 * och var det enda stället där den gamla fortfarande syntes - och det
 * syns just när någon delar sajten vidare.
 *
 * Att bara radera filen vore sämre: då tappar varje delad länk sin
 * förhandsbild, och index.html pekar fortfarande på den i sex metataggar.
 *
 * VARFÖR CHROME OCH INTE ETT BILDBIBLIOTEK
 *
 * Projektet har inget installerat, och en delningsbild är en layout:
 * typsnitt, gradient, centrering. Det är vad en webbläsare gör bäst.
 * Samma metod som scripts/generate-icons-from-png.mjs.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const LOGO = "public/Datorhuset final logo.png";
const FONT = "public/brand/orbitron-800-subset.woff2";
const OUT = "public/og-datorhuset.png";
const BREDD = 1200;
const HOJD = 630;

/* Sidans egen bakgrund i mörkt läge: --background: 255 40% 10%. */
const BAKGRUND = "#140f24";

for (const fil of [LOGO, FONT]) {
  if (!existsSync(fil)) throw new Error(`Hittar inte ${fil}`);
}

const CHROME = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]
  .filter(Boolean)
  .find((p) => existsSync(p));

if (!CHROME) throw new Error("Hittade ingen Chrome/Edge. Sätt CHROME_PATH.");

const b64 = (fil) => readFileSync(fil).toString("base64");

/*
 * Märket till vänster, ordet till höger.
 *
 * Liggande lockup, inte staplad. En delningsbild visas ofta som en
 * miniatyr i en chatt, och då läses två stora element bredvid varandra
 * bättre än fyra små staplade. Inget brödtext heller - rubriken och
 * beskrivningen står redan i metataggarna bredvid bilden.
 *
 * Typsnittet är den subset på 1,2 kB som redan ligger i public/brand och
 * bara innehåller bokstäverna i DatorHuset. Därav inget annat ord.
 */
const sida = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face {
    font-family: 'Orbitron';
    src: url(data:font/woff2;base64,${b64(FONT)}) format('woff2');
    font-weight: 800;
    font-display: block;
  }
  html, body {
    margin: 0; padding: 0;
    width: ${BREDD}px; height: ${HOJD}px;
    overflow: hidden;
    background: ${BAKGRUND};
  }
  /* Två mjuka ljus i märkets egna färger, så att bakgrunden inte är en
     platt svart platta i ett chattflöde. */
  .glans {
    position: absolute; inset: 0;
    background:
      radial-gradient(620px 460px at 22% 44%, rgba(217, 48, 143, 0.30), transparent 68%),
      radial-gradient(680px 520px at 78% 58%, rgba(56, 152, 245, 0.26), transparent 70%);
  }
  .rad {
    position: relative;
    display: flex; align-items: center; justify-content: center;
    gap: 56px;
    width: 100%; height: 100%;
    padding: 0 82px;
    box-sizing: border-box;
  }
  .marke { width: 300px; height: 300px; object-fit: contain; display: block; }
  .ord {
    font-family: 'Orbitron', sans-serif;
    font-weight: 800;
    font-size: 104px;
    letter-spacing: 0.005em;
    line-height: 1;
    white-space: nowrap;
    background: linear-gradient(103deg, #2ed9f0 0%, #7c5cf0 52%, #d9308f 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
</style></head>
<body>
  <div class="glans"></div>
  <div class="rad">
    <img class="marke" src="data:image/png;base64,${b64(LOGO)}" alt="">
    <div class="ord">DatorHuset</div>
  </div>
</body></html>`;

const arbete = join(tmpdir(), "datorhuset-og");
mkdirSync(arbete, { recursive: true });
const html = join(arbete, `og-${Date.now()}.html`);
writeFileSync(html, sida, "utf8");

const mal = resolve(OUT);
const innan = Date.now();

execFileSync(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    /* Typsnittet laddas som data-url, men ge det ändå tid. */
    "--virtual-time-budget=6000",
    `--screenshot=${mal}`,
    `--window-size=${BREDD},${HOJD}`,
    `file:///${html.replace(/\\/g, "/")}`,
  ],
  { stdio: "ignore" },
);

rmSync(html, { force: true });

/*
 * Kontrollen finns för att Chrome en gång skrev noll filer och ändå
 * avslutade med noll. Ett byggsteg som ljuger om vad det gjort är värre
 * än ett som kraschar.
 */
if (!existsSync(mal)) throw new Error(`Chrome skrev ingen fil till ${mal}.`);
const stat = statSync(mal);
if (stat.mtimeMs < innan - 1000) {
  throw new Error(`${mal} är oförändrad - Chrome skrev inte över den.`);
}

console.log(`skrev ${OUT}  ${BREDD}x${HOJD}  ${(stat.size / 1024).toFixed(1)} kB`);
