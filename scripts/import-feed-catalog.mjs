/**
 * Läser komponenter ur ett affiliateflöde in i konfiguratorns katalog.
 *
 *   node scripts/import-feed-catalog.mjs                  # hämtar flödet
 *   node scripts/import-feed-catalog.mjs --file feed.xml  # från disk
 *   node scripts/import-feed-catalog.mjs --limit 50       # smakprov
 *
 * Skriver två filer:
 *
 *   src/data/customBuildFeedCatalog.generated.js
 *       De komponenter vars egenskaper gick att läsa ut säkert.
 *
 *   data/feed-import-review.json
 *       De som inte gick att avgöra, med anledningen. Den här är till
 *       för att läsas av en människa och kategoriseras för hand.
 *
 * VARFÖR EN GRIND OCH INTE BARA IMPORT
 *
 * Konfiguratorns värde är att den vet vad som passar ihop. En processor
 * utan känd sockel går inte att para med ett moderkort, och ett minne
 * utan känd DDR-generation går inte att para med något alls. Raden i
 * flödet bär titel, pris, bild och EAN - inte sockel, inte TDP.
 *
 * Det mesta går ändå att läsa ur titeln, för Proshop skriver dem
 * strukturerat:
 *
 *   ASUS PRIME B550-PLUS Moderkort - AMD B550 - AMD AM4 - DDR4 RAM - ATX
 *
 * Men inte allt. En processor heter bara "AMD Ryzen 7 5800X3D CPU - 8
 * kärnor - 3.4 GHz" och nämner ingen sockel alls; den får härledas ur
 * modellnamnet. Går det inte hamnar raden i granskningslistan i stället
 * för att gissas in i katalogen. En gissad sockel är värre än en
 * utelämnad produkt: den bygger ihop en dator som inte går att montera.
 */

import { writeFileSync, createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";

import { streamFeed } from "../server/pricing/sources/feed.mjs";
import { CUSTOM_BUILD_CATALOG_ITEMS } from "../src/data/customBuildCatalog.js";

const args = process.argv.slice(2);
const flagValue = (name) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] : null;
};
const LIMIT = Number(flagValue("limit")) || Infinity;
const FILE = flagValue("file");

/* ------------------------------------------------------------ tolkning --- */

/** Sockelnamn som konfiguratorn känner till. Andra går inte att använda. */
const KNOWN_SOCKETS = ["AM4", "AM5", "LGA1700", "LGA1200", "LGA1851"];

/*
 * Processorns sockel ur modellnamnet.
 *
 * Titeln nämner den nästan aldrig, men modellnumret avgör den entydigt:
 * Ryzen 7000 och uppåt är AM5, 5000 och neråt AM4, och Intels
 * generationssiffra styr LGA-numret. Reglerna är skrivna efter det som
 * faktiskt säljs, och det som inte täcks hamnar i granskning.
 */
const cpuSocket = (title) => {
  const t = title.toLowerCase();

  const ryzen = t.match(/ryzen\s+\d\s+(\d)(\d{3})/);
  if (ryzen) {
    const series = Number(ryzen[1]);
    if (series >= 7) return "AM5";
    if (series >= 1 && series <= 5) return "AM4";
    return null;
  }

  const coreUltra = t.match(/core\s+ultra\s+\d\s+(\d)/);
  if (coreUltra) return "LGA1851";

  const intel = t.match(/i[3579][\s-]*(\d{4,5})/);
  if (intel) {
    const gen = intel[1].length === 5 ? Number(intel[1].slice(0, 2)) : Number(intel[1][0]);
    if (gen >= 12 && gen <= 14) return "LGA1700";
    if (gen >= 10 && gen <= 11) return "LGA1200";
    return null;
  }
  return null;
};

/** Sockel som står utskriven i titeln, t.ex. på moderkort. */
const statedSocket = (title) => {
  const upper = title.toUpperCase();
  return KNOWN_SOCKETS.find((socket) => upper.includes(socket)) || null;
};

const ramType = (title) => {
  const upper = title.toUpperCase();
  if (upper.includes("DDR5")) return "DDR5";
  if (upper.includes("DDR4")) return "DDR4";
  return null;
};

const formFactor = (title) => {
  const t = title.toLowerCase();
  /* Proshop skriver tornstorlek på chassin, inte moderkortsformat:
     "DeepCool CC560 - Chassi - Miditower - Svart". 3 905 chassin föll på
     att jag bara letade efter ATX. */
  if (/midi.?tower|midi.?torn/.test(t)) return "Miditower";
  if (/full.?tower|big.?tower/.test(t)) return "Full tower";
  if (/mini.?tower/.test(t)) return "Mini tower";
  if (t.includes("mini-itx") || t.includes("mini itx")) return "Mini-ITX";
  if (t.includes("micro-atx") || t.includes("matx") || t.includes("m-atx")) return "Micro-ATX";
  if (t.includes("e-atx") || t.includes("eatx")) return "E-ATX";
  if (t.includes("atx")) return "ATX";
  return null;
};

/*
 * Chassits storlek.
 *
 * Egen funktion, inte formFactor ovan. Ett moderkort mäts i ATX-format
 * och ett chassi i tornhöjd, och Proshop skriver dessutom tornhöjden på
 * ett halvdussin sätt: "Miditower", "Tower", "Desktop", "Cube", eller
 * ingenting alls. Att lägga in de orden i den gemensamma funktionen hade
 * riskerat att ett moderkort plötsligt fick formfaktorn "Desktop".
 *
 * 558 riktiga chassin föll tidigare på att bara ATX-formaten kändes igen.
 */
const caseFormFactor = (title) => {
  const t = title.toLowerCase();
  if (/midi.?tower|midi.?torn/.test(t)) return "Miditower";
  if (/full.?tower|big.?tower/.test(t)) return "Full tower";
  if (/mini.?tower/.test(t)) return "Mini tower";
  if (t.includes("mini-itx") || t.includes("mini itx")) return "Mini-ITX";
  if (t.includes("micro-atx") || t.includes("matx") || t.includes("m-atx")) return "Micro-ATX";
  if (/\bcube\b/.test(t)) return "Cube";
  if (/\bdesktop\b/.test(t)) return "Desktop";
  if (/\btower\b|\btorn\b/.test(t)) return "Tower";
  if (t.includes("e-atx") || t.includes("eatx")) return "E-ATX";
  if (t.includes("atx")) return "ATX";
  return null;
};

/** Lagringskapacitet, normaliserad till GB. */
const capacityGb = (title) => {
  const tb = title.match(/(\d+(?:[.,]\d+)?)\s*TB\b/i);
  if (tb) return Math.round(Number(tb[1].replace(",", ".")) * 1024);
  const gb = title.match(/(\d+)\s*GB\b/i);
  if (gb) return Number(gb[1]);
  return null;
};

const watts = (title) => {
  const w = title.match(/(\d{3,4})\s*W\b/i);
  return w ? Number(w[1]) : null;
};

const gpuChip = (title) => {
  const rtx = title.match(/\bRTX\s*(\d{4})\s*(Ti|Super|Ti\s*Super)?/i);
  if (rtx) return `RTX ${rtx[1]}${rtx[2] ? " " + rtx[2].trim() : ""}`.replace(/\s+/g, " ");
  const rx = title.match(/\bRX\s*(\d{4})\s*(XT|XTX|GRE)?/i);
  if (rx) return `RX ${rx[1]}${rx[2] ? " " + rx[2] : ""}`.trim();
  const arc = title.match(/\bArc\s+([AB]\d{3})/i);
  if (arc) return `Arc ${arc[1].toUpperCase()}`;
  return null;
};

/* --------------------------------------------------------- kategorier ---- */

/*
 * BUTIKENS KATEGORINAMN AVGÖR, INTE TITELN.
 *
 * Det här är hela grinden. Flödet har 264 637 produkter i 520 kategorier
 * - hundmat, LEGO, parfym, borrmaskiner - och exakt tio av kategorierna
 * innehåller sådant som går i en dator. Allt som inte står i listan
 * nedan kommer inte in.
 *
 * Första försöket läste kategorin ur titeln i stället, och det gick illa
 * på ett sätt som är värt att minnas. En titel som innehåller "CPU"
 * behöver inte vara en processor:
 *
 *   Corsair ONE a600 Metal Dark PC - AMD Ryzen 9 9900X3D CPU - ...
 *       kategori "Stationaer", alltså en färdig dator för 59 739 kr
 *   ASRock Rack 1U2N2G-AM5/2T - rack-mountable no CPU - 0 GB - no HDD
 *       kategori "Stationaer", ett tomt rackchassi för 41 358 kr
 *   Thermal Grizzly AM5 Short Backplate Black - CPU monteringsfästen
 *       kategori "CPU flaektar", en bakplåt för 109 kr
 *
 * Alla tre låg i konfiguratorns processorlista. En kund som valde den
 * första hade fått en färdig dator som "processor" i sitt bygge.
 * Butiken visste hela tiden vad de var; det var vi som inte frågade.
 */
const FEED_CATEGORY_MAP = new Map([
  ["cpu", "cpu"],
  ["grafikkort", "gpu"],
  ["moderkort", "motherboard"],
  ["ram", "ram"],
  ["ssd", "storage"],
  ["haarddisk", "storage"],
  ["chassi", "case"],
  ["stroemfoersoerjning", "psu"],
  ["cpu flaektar", "cooling"],
  ["chassi flaekt", "chassifan"],
  ["naetverkskort adaptrar osv", "networkcard"],
]);

/*
 * Kategorier som ligger nära men medvetet lämnas utanför.
 *
 *   DIY vattenkylning (258)    slang, kopplingar, kylvätska. Byggsatser
 *                              för den som redan vet vad hon gör.
 *   Kylning och flaekt (160)   kyldynor till bärbara, fläktstyrningar.
 *   Rack chassis (2 009)       serverrack, inte datorchassin.
 *   Stationaer / NAS / Server  färdiga datorer. Vi säljer bygget.
 *   Stationaer Mini PC Barebone (218)  likaså, med Windows på.
 *   *tillbehoer (flera)        skruv, ramar, kablar.
 */

/*
 * Vad titeln måste säga för att raden ska räknas som varan.
 *
 * Två av kategorierna ovan är blandade. "CPU flaektar" rymmer både
 * kylare och kylpasta och monteringsfästen; "SSD" rymmer både interna
 * m.2-enheter och portabla USB-diskar. Proshop skriver varutypen sist i
 * titeln, så det går att kräva den. Ett krav på vad som SKA stå är
 * säkrare än en lista på vad som inte får stå - den senare är aldrig
 * färdig.
 */
const TITLE_GATE = {
  cooling: {
    require: /CPU\s+(?:Luft|Vatten)kylare/i,
    /* 1U till 5U är höjden i ett serverrack. En sådan kylare är byggd
       liggande och får inte plats under sidopanelen på ett torn. */
    /* "- tillbehör" sist i titeln är Proshops eget ord för att raden är
       en del till en kylare, inte en kylare: fästen, retrofitsatser. */
    forbid: /\b[1-5]U\b|processor fan|narrow ilm|retrofit|tillbeh(?:ö|oe)r\s*$|mounting kit/i,
    reason: "inte en processorkylare som passar ett vanligt chassi",
  },
  storage: {
    /*
     * SAS, U.2 och U.3 är serverkontakter. Disken finns, den fungerar,
     * men den går inte att koppla in i ett vanligt moderkort - det finns
     * ingen sådan port. Xbox- och PS5-korten passar bara i konsolen.
     */
    require: /\bSSD\b|h(?:å|ae)rddisk|\bHDD\b|\bNVMe\b|\bM\.2\b/i,
    forbid:
      /\b(?:extern|portable|external)\b|\bsas\b|sas-\d|serial attached scsi|\bu\.[23]\b|xbox|playstation|\bps5\b|expansion card|\busb\s?-?\s?[c43]\b|usb 3|disk cartridge|data cent/i,
    reason: "passar inte i en vanlig dator (extern, serverkontakt eller konsol)",
  },
  chassifan: {
    /* Kategorin rymmer också fläktstyrningar, hubbar och galler. Proshop
       skriver "- Chassi fläkt -" på själva fläkten. */
    require: /chassi\s*fl(?:ä|ae)kt/i,
    reason: "inte en chassifläkt (styrning, hubb eller tillbehör)",
  },
  networkcard: {
    /*
     * Ett kort som sitter i datorn, inte en dosa bredvid den.
     *
     * Kategorin "Naetverkskort adaptrar osv" har 1 068 rader och rymmer
     * allt från ett wifi-kort för 173 kr till ett NVIDIA ConnectX-7 för
     * 87 910 kr. Det senare är ett datacenterkort med 400 gigabit och
     * hör inte hemma i en speldator.
     *
     * Tre krav: ett fack inuti datorn, en användning en speldator har
     * nytta av, och ingen av de märkningar som betyder serverutrustning.
     * Prisprovet längre ner tar resten - över 1 500 kr finns inga
     * konsumentkort kvar i den här kategorin, bara Lenovo ThinkSystem
     * och SFP28.
     */
    require: /(?=.*\b(?:pci-?e(?:xpress)?|pcie|m\.2)\b)(?=.*(?:wi-?fi|wlan|bluetooth|ethernet|\blan\b|n(?:ä|ae)tverk|network))/is,
    forbid:
      /fib(?:re|er) channel|host bus adapter|\bhba\b|infiniband|connectx|mellanox|emulex|qlogic|\bsfp\b|qsfp|\b(?:25|40|50|100|200|400)\s*gb\b|\bocp\b|thunderbolt|firewire|\busb\b|\bpoe\b|\bswitch\b|router|repeater|extender|powerline|nutanix|synology|qnap|asustor|\bnas\b/i,
    reason: "inte ett nätverkskort till en speldator",
  },
  ram: {
    /*
     * SO-DIMM är kortare och sitter i bärbara datorer och NAS-lådor. Den
     * går fysiskt inte ner i en DIMM-plats på ett vanligt moderkort.
     *
     * ECC-minne med register kräver stöd i både processor och moderkort,
     * och inget vi säljer har det. "Unbuffered" står däremot på vanligt
     * skrivbordsminne och får inte finnas med här - det var nära att
     * kasta ut hälften av listan.
     */
    forbid: /so.?dimm|server premier|\b(?:ecc|registered|registrerad|rdimm|lrdimm|with parity|reg ecc)\b/i,
    reason: "passar inte i ett vanligt moderkort (bärbart eller serverminne)",
  },
  psu: {
    /*
     * Ett riktigt ATX-aggregat får sina riktiga värden i mallen:
     * fläktens diameter i millimeter, ATX-versionen med siffra, eller
     * 80 Plus med en klass. Ett switchaggregat från HPE Aruba får bara
     * mallens tomma "ATX - 80 Plus".
     *
     * Kravet kostar omkring femton billiga men riktiga aggregat som
     * Proshop beskrivit slarvigt, och tar bort omkring hundratjugo
     * nätverks- och serveraggregat. Den bytesaffären är värd att göra:
     * det som blir kvar är sådant som går att skruva fast i ett chassi.
     */
    require: /\d{2,3}\s*mm|ATX\s*\d(?:\.\d)?|80\s*Plus\s*(?:Gold|Bronze|Silver|Platinum|Titanium|White|Standard|Ja)/i,
    /*
     * Kravet ovan räcker inte, och det är värt att förklara varför.
     *
     * Proshop klistrar på en mall i slutet av titeln på ALLT i den här
     * kategorin, även på saker som inte är nätaggregat:
     *
     *   Schwaiger Slim-Line - solar panel - 200 watt Strömförsörjning - ATX - 80 Plus
     *   4smarts Wall charger GaN Flex Pro 200W ... Strömförsörjning - 200 Watt - ATX - 80 Plus
     *   Nedis Power Inverter ... Strömförsörjning - 1000 Watt - ATX - 80 Plus
     *
     * Ett krav på ordet "Strömförsörjning" släpper alltså igenom
     * solpaneler. 24 sådana kom in i första försöket, en av dem en
     * växelriktare för 4 899 kr som såg ut som ett nätaggregat för en
     * kund som skummar listan.
     *
     * Mallen skriver också alltid "ATX" och "80 Plus" utan siffra eller
     * klass, medan riktiga nätaggregat får sina riktiga värden. Det går
     * därför inte att skilja dem åt på mallen - men varutypen står i den
     * fria delen av titeln, och den går att lista.
     */
    forbid: /inverter|v(?:ä|ae)xelriktare|charger|laddare|\bac adapter\b|solar|batteri|battery|splitter|\bpoe\b|surge|power strip|grenuttag|transfer switch|powerbank|power bank|docking|\bups\b|hot.?plug|redundant|\bkva\b|flex slot/i,
    reason: "inte ett nätaggregat till en dator (laddare, växelriktare eller serveraggregat)",
  },
  case: {
    /* Inter-Tech och Supermicro säljer serverchassin i samma kategori.
       De är inte datorchassin och passar inget i konfiguratorn. */
    forbid:
      /server\s*\(rack\)|server\s*\(tower\)|kan monteras i rack|rack.?mount|\brackmonter|\bcabinet\b|\bsk(?:å|ae)p\b|\b\d{1,2}U\b|wall mount|side panel|sidopanel|raspberry|\bpi [45]\b/i,
    reason: "serverchassi eller tillbehör, inte ett datorchassi",
  },
};

/*
 * Vad configuratorn behöver veta för att kunna säga nej till en omöjlig
 * kombination. Kategorin är säker sedan butiken fått avgöra den; det som
 * står här är enbart egenskaperna.
 */
const CATEGORIES = {
  motherboard: (row) => {
    const socket = statedSocket(row.title);
    const ram = ramType(row.title);
    const form = formFactor(row.title);
    if (!socket) return { reject: "sockel saknas i titeln" };
    if (!ram) return { reject: "DDR-generation saknas" };
    return {
      socket,
      ramType: ram,
      specs: [socket, ram, form].filter(Boolean),
      details: { Sockel: socket, Minne: ram, ...(form ? { Formfaktor: form } : {}) },
    };
  },

  cpu: (row) => {
    const socket = statedSocket(row.title) || cpuSocket(row.title);
    if (!socket) return { reject: "sockel går inte att härleda ur modellnamnet" };
    if (!KNOWN_SOCKETS.includes(socket)) return { reject: `okänd sockel ${socket}` };
    const cores = row.title.match(/(\d+)\s*(?:kärnor|cores)/i);
    const ghz = row.title.match(/(\d+(?:[.,]\d+)?)\s*GHz/i);
    return {
      socket,
      specs: [socket, cores ? `${cores[1]} kärnor` : null, ghz ? `${ghz[1].replace(",", ".")} GHz` : null].filter(Boolean),
      details: {
        Sockel: socket,
        ...(cores ? { Kärnor: cores[1] } : {}),
        ...(ghz ? { Basfrekvens: `${ghz[1].replace(",", ".")} GHz` } : {}),
      },
    };
  },

  gpu: (row) => {
    const chip = gpuChip(row.title);
    if (!chip) return { reject: "grafikkretsen går inte att läsa ut" };
    const vram = row.title.match(/(\d+)\s*GB\s*(GDDR\d)?/i);
    return {
      gpuModel: row.title,
      specs: [chip, vram ? `${vram[1]} GB` : null].filter(Boolean),
      details: { Krets: chip, ...(vram ? { Minne: `${vram[1]} GB` } : {}) },
    };
  },

  ram: (row) => {
    const ram = ramType(row.title);
    const size = capacityGb(row.title);
    /* Proshop skriver hastigheten som "DDR5-6000", inte som MHz. */
    const speed = row.title.match(/DDR\d-(\d{4,5})/i) || row.title.match(/(\d{4,5})\s*MHz/i);
    const latency = row.title.match(/\bCL(\d{2})\b/i);
    const modules = row.title.match(/\((\d+)\s*pcs?\)/i);
    if (!ram) return { reject: "DDR-generation saknas" };
    if (!size) return { reject: "storlek saknas" };
    return {
      ramType: ram,
      specs: [`${size} GB`, ram, speed ? `${speed[1]} MHz` : null].filter(Boolean),
      details: {
        Typ: ram,
        Storlek: `${size} GB`,
        ...(speed ? { Hastighet: `${speed[1]} MHz` } : {}),
        ...(latency ? { Latens: `CL${latency[1]}` } : {}),
        ...(modules ? { Moduler: modules[1] } : {}),
      },
    };
  },

  storage: (row) => {
    const size = capacityGb(row.title);
    if (!size) return { reject: "kapacitet saknas" };
    const iface = /m\.?2|nvme/i.test(row.title) ? "NVMe" : /sata/i.test(row.title) ? "SATA" : null;
    const gen = row.title.match(/PCIe\s*(\d(?:\.\d)?)/i);
    const label = size >= 1024 ? `${size / 1024} TB` : `${size} GB`;
    return {
      specs: [label, iface, gen ? `PCIe ${gen[1]}` : null].filter(Boolean),
      details: {
        Kapacitet: label,
        ...(iface ? { Gränssnitt: iface } : {}),
        ...(gen ? { PCIe: gen[1] } : {}),
      },
    };
  },

  psu: (row) => {
    /* "850 Watt", inte "850W" - Proshop skriver ut ordet. */
    const w = row.title.match(/(\d{3,4})\s*(?:Watt|W)\b/i);
    if (!w) return { reject: "effekt saknas" };
    const cert = row.title.match(/80\s*Plus\s*([A-Za-zÅÄÖåäö]+)/i);
    const atx = row.title.match(/\bATX\s*(\d(?:\.\d)?)/i);
    const rating = cert && !/^ja$/i.test(cert[1]) ? `80 Plus ${cert[1]}` : null;
    return {
      specs: [`${w[1]} W`, rating].filter(Boolean),
      details: {
        Effekt: `${w[1]} W`,
        ...(rating ? { Certifiering: rating } : {}),
        ...(atx ? { "ATX-standard": `ATX ${atx[1]}` } : {}),
      },
    };
  },

  case: (row) => {
    /*
     * Ingen grind på formfaktorn.
     *
     * Chassits storlek styr ingen kompatibilitetskontroll i
     * konfiguratorn - den är ett filter kunden kan slå på, ingenting
     * annat. Att kasta ut ett riktigt chassi för att Proshop skrev
     * "Montech X5 - Chassi - Vit" utan tornhöjd vore att straffa kunden
     * för butikens slarv. Utan storlek syns chassit i listan men inte
     * när storleksfiltret är påslaget, vilket är rätt beteende.
     */
    const form = caseFormFactor(row.title);
    return {
      specs: form ? [form] : [],
      details: form ? { Formfaktor: form } : {},
    };
  },

  chassifan: (row) => {
    /* "Noctua NF-A12x25 - Chassi fläkt - 120mm - Svart - 22 dBA" */
    const size = row.title.match(/\b(40|60|80|92|120|140|200)\s*mm\b/i);
    const noise = row.title.match(/(\d+(?:[.,]\d+)?)\s*dBA/i);
    const pack = row.title.match(/(\d+)[\s-]*pack/i);
    const rgb = /\bargb\b|\brgb\b/i.test(row.title);
    if (!size) return { reject: "storlek saknas" };
    return {
      specs: [`${size[1]} mm`, rgb ? "RGB" : null, pack ? `${pack[1]}-pack` : null].filter(Boolean),
      details: {
        Storlek: `${size[1]} mm`,
        ...(noise ? { Ljudnivå: `${noise[1].replace(",", ".")} dBA` } : {}),
        ...(pack ? { Antal: pack[1] } : {}),
        Belysning: rgb ? "RGB" : "Ingen",
      },
    };
  },

  networkcard: (row) => {
    const wifi = row.title.match(/wi-?fi\s*([4567])/i);
    const hasWifi = /wi-?fi|wlan|802\.11/i.test(row.title);
    /*
     * Hastigheten skrivs på fyra sätt och alla fyra förekommer:
     *
     *   ASUS XG-C100C 10GBase-T PCIe Network Adapter
     *   TRENDnet TEG-25GECTX 2.5GBASE-T PCIe Network Adapter
     *   QNAP QXG-10G2T - ... - 10 Gigabit Ethernet x 2
     *   TP-Link Gigabit Ethernet PCIe x1 NIC
     *
     * Ett krav på "10 Gigabit" med mellanslag missade tre av fyra, och 39
     * riktiga kort hamnade i granskningslistan med motiveringen att de
     * saknade hastighet. De stod där hela tiden.
     */
    const multi = row.title.match(/\b(2\.5|5|10)\s*G(?:BASE|BE|b|igabit)/i);
    const speed = multi ? multi[1] : /\bgigabit\b/i.test(row.title) ? "1" : null;
    const slot = /\bm\.2\b/i.test(row.title) ? "M.2" : "PCIe";
    const bluetooth = row.title.match(/bluetooth\s*(\d\.\d)/i);
    if (!hasWifi && !speed) return { reject: "varken wifi eller hastighet går att läsa ut" };
    return {
      specs: [
        wifi ? `Wi-Fi ${wifi[1]}` : hasWifi ? "Wi-Fi" : null,
        speed ? `${speed} Gbit` : null,
        slot,
      ].filter(Boolean),
      details: {
        Fack: slot,
        ...(wifi ? { "Wi-Fi": wifi[1] } : {}),
        ...(speed ? { Hastighet: `${speed} Gbit/s` } : {}),
        ...(bluetooth ? { Bluetooth: bluetooth[1] } : {}),
      },
    };
  },

  cooling: (row) => {
    const aio = /vattenkylare/i.test(row.title);
    const size = row.title.match(/\b(120|140|240|280|360|420)\b/);
    const noise = row.title.match(/Max\s*(\d+)\s*dBA/i);
    return {
      specs: [aio ? "Vattenkylning" : "Luftkylning", size ? `${size[1]} mm` : null].filter(Boolean),
      details: {
        Typ: aio ? "Vattenkylning" : "Luftkylning",
        ...(size ? { Storlek: `${size[1]} mm` } : {}),
        ...(noise ? { Ljudnivå: `${noise[1]} dBA` } : {}),
      },
    };
  },
};

/*
 * Prisrimlighet där varan har en mätbar storlek.
 *
 * Ett flöde innehåller fel. Ett av dem såg ut så här:
 *
 *   Synology - DDR4 - module - 8 GB - DIMM 288-pin - 2666 MHz    194 293 kr
 *
 * Det är 24 287 kr per gigabyte. Mätt över hela listan ligger minne
 * mellan 79 och 955 kr per gigabyte, och 99 av 100 poster under 955.
 * Lagring ligger mellan 0,4 och 127 kr per gigabyte på samma mått.
 *
 * Gränserna nedan är satta strax ovanför den 99:e percentilen. De är
 * alltså inte en åsikt om vad en vara får kosta, utan ett prov på om
 * priset alls kan stämma. En post som faller här är antingen ett fel i
 * flödet eller en vara som inte är det den ser ut att vara - i båda
 * fallen något en kund inte ska se.
 */
const PRICE_SANITY = {
  ram: { maxPerGb: 1000 },
  storage: { maxPerGb: 100 },
  /* Inget att mäta per gigabyte här, bara ett tak. Ett nätverkskort till
     en speldator kostar under tusenlappen; däröver börjar Lenovos och
     Broadcoms serverkort. */
  networkcard: { maxPrice: 1500 },
};

/** Vår kategori för en rad, eller null om butiken inte säljer den som komponent. */
const classify = (feedCategory) =>
  FEED_CATEGORY_MAP.get(String(feedCategory || "").trim().toLowerCase()) || null;

/* -------------------------------------------------------------- körning -- */

/* Namn som redan finns i katalogen. Samma produkt två gånger är värre än
   en produkt för lite - kunden ser två rader som ser identiska ut. */
const existing = new Set(
  CUSTOM_BUILD_CATALOG_ITEMS.map((i) => i.name.toLowerCase().replace(/[^a-z0-9]/g, "")),
);

const accepted = [];
const review = [];
const seen = new Set();
const counts = {};
const rejects = {};

const handleRow = (row) => {
  if (accepted.length + review.length >= LIMIT) return;

  const feedCategory = String(row.feed_category || "");
  const key = classify(feedCategory);
  if (!key) {
    /*
     * Tyst. Det här är inte en komponent butiken råkade beskriva otydligt,
     * det är hundmat. Att lägga en kvarts miljon rader i granskningslistan
     * gör den oläsbar för den som ska gå igenom den för hand.
     */
    rejects["annan varugrupp"] = (rejects["annan varugrupp"] || 0) + 1;
    return;
  }

  const gate = TITLE_GATE[key];
  if (gate) {
    const failsRequire = gate.require && !gate.require.test(row.title);
    const failsForbid = gate.forbid && gate.forbid.test(row.title);
    if (failsRequire || failsForbid) {
      const label = `${key}: ${gate.reason}`;
      rejects[label] = (rejects[label] || 0) + 1;
      review.push({ title: row.title, feedCategory, category: key, reason: gate.reason, url: row.product_url });
      return;
    }
  }

  const fingerprint = row.title.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (seen.has(fingerprint)) return;
  seen.add(fingerprint);
  if (existing.has(fingerprint)) {
    rejects["finns redan"] = (rejects["finns redan"] || 0) + 1;
    return;
  }

  const built = CATEGORIES[key](row);
  if (built.reject) {
    const label = `${key}: ${built.reject}`;
    rejects[label] = (rejects[label] || 0) + 1;
    review.push({ title: row.title, feedCategory, category: key, reason: built.reject, url: row.product_url });
    return;
  }

  /*
   * Ingen bild, ingen plats i katalogen.
   *
   * Proshop lämnar bildfältet tomt på ett fyrtiotal rader, mest OEM-varor
   * från Lenovo och Dell som aldrig haft en produktbild. Konfiguratorn
   * faller då tillbaka på kategoribilden, så minnet får en bild på en
   * annan modell och chassit en bild på ett annat chassi.
   *
   * En rad med fel bild är värre än en rad som inte finns: kunden tror
   * att hon vet vad hon väljer. 45 av 6 371 är ett billigt pris för att
   * slippa det.
   */
  if (!row.image_url) {
    const label = `${key}: ingen bild i flödet`;
    rejects[label] = (rejects[label] || 0) + 1;
    review.push({ title: row.title, feedCategory, category: key, reason: "ingen bild", url: row.product_url });
    return;
  }

  const price = Math.round(row.price_cents / 100);
  const sanity = PRICE_SANITY[key];
  if (sanity?.maxPrice && price > sanity.maxPrice) {
    const label = `${key}: över takpriset`;
    rejects[label] = (rejects[label] || 0) + 1;
    review.push({ title: row.title, feedCategory, category: key, reason: `${price} kr`, url: row.product_url });
    return;
  }
  if (sanity?.maxPerGb) {
    const size = capacityGb(row.title);
    if (size && price / size > sanity.maxPerGb) {
      const label = `${key}: orimligt pris per GB`;
      rejects[label] = (rejects[label] || 0) + 1;
      review.push({
        title: row.title,
        feedCategory,
        category: key,
        reason: `${Math.round(price / size)} kr per GB`,
        url: row.product_url,
      });
      return;
    }
  }

  counts[key] = (counts[key] || 0) + 1;
  accepted.push({
    id: `feed-${key}-${row.ean || fingerprint.slice(0, 16)}`,
    category: key,
    name: row.title,
    brand: row.brand || "",
    price,
    /* Bilden hotlänkas från butiken. Partner-ads villkor säger uttryckligen
       att den inte får sparas eller cachas lokalt - upphovsrätten ligger
       hos annonsören. */
    image: row.image_url || undefined,
    ean: row.ean || null,
    specs: built.specs,
    details: built.details,
    ...(built.socket ? { socket: built.socket } : {}),
    ...(built.ramType ? { ramType: built.ramType } : {}),
    ...(built.gpuModel ? { gpuModel: built.gpuModel } : {}),
  });
};

const config = {
  id: "proshop",
  label: "Proshop",
  network: "partner-ads",
  /* Inget grovfilter här. FEED_CATEGORY_MAP är grinden, och den läser
     butikens kategorinamn i stället för att gissa ur titeln. */
  categoryFilter: null,
};

let server = null;
if (FILE) {
  if (!existsSync(FILE)) throw new Error(`Hittar inte ${FILE}`);
  server = createServer((q, r) => {
    r.writeHead(200, { "content-type": "text/xml" });
    createReadStream(FILE).pipe(r);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  config.url = `http://127.0.0.1:${server.address().port}/feed.xml`;
} else {
  config.url = process.env.PRICING_FEED_PROSHOP_URL;
  if (!config.url) throw new Error("PRICING_FEED_PROSHOP_URL saknas. Kör med --file, eller sätt den i .env.");
}

const stats = await streamFeed(config, handleRow, { timeoutMs: 900000 });
if (server) server.close();

/* --------------------------------------------------------------- utdata -- */

const header = `/**
 * GENERERAD FIL - ÄNDRA INTE FÖR HAND.
 *
 * Skapad av scripts/import-feed-catalog.mjs ur Proshops produktflöde.
 * Kör om skriptet i stället för att redigera här.
 *
 * Bilderna är hotlänkade till butikens url med flit. Partner-ads villkor
 * säger att de inte får sparas eller cachas lokalt - upphovsrätten ligger
 * hos annonsören.
 *
 * Varje post har kommit genom en grind: konfiguratorn kan bara säga nej
 * till en omöjlig kombination om den vet sockel, DDR-generation och
 * formfaktor. Det som inte gick att läsa ut ligger i
 * data/feed-import-review.json i stället för att vara gissat.
 */

export const FEED_CATALOG_ITEMS = `;

writeFileSync(
  "src/data/customBuildFeedCatalog.generated.js",
  header + JSON.stringify(accepted, null, 2) + ";\n",
  "utf8",
);

writeFileSync(
  "data/feed-import-review.json",
  JSON.stringify({ generated: new Date().toISOString(), count: review.length, items: review }, null, 2),
  "utf8",
);

console.log(`\nflödet          : ${stats.total.toLocaleString("sv-SE")} produkter, ${stats.accepted.toLocaleString("sv-SE")} komponenter`);
console.log(`godkända        : ${accepted.length.toLocaleString("sv-SE")}`);
console.log(`till granskning : ${review.length.toLocaleString("sv-SE")}`);

console.log("\nper kategori:");
for (const [k, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(13)} ${n}`);
}

console.log("\nvanligaste skälen att en rad inte kom in:");
for (const [k, n] of Object.entries(rejects).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`  ${String(n).padStart(6)}  ${k}`);
}
