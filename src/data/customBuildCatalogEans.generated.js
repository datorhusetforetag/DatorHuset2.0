/**
 * GENERERAD FIL - ÄNDRA INTE FÖR HAND.
 *
 * Skapad av scripts/match-catalog-to-feed.mjs.
 *
 * EAN-nummer till de handplockade katalogposterna, hämtade ur Proshops
 * flöde genom att jämföra namnen. Utan dem har prismatchningen inget att
 * känna igen posten på, hittar ingen butik, och konfiguratorn skriver
 * "Ingen butik" i stället för ett pris från en riktig handlare.
 *
 * Kommentaren över varje rad är katalogens namn på posten, så att en
 * felaktig koppling går att se utan att slå upp id:t.
 */

export const CATALOG_EAN_BY_ID = {
  /* NZXT H7 Flow */
  "case-1": "5056547205502",
  /* Fractal Design Meshify 2 */
  "case-10": "7340172702429",
  /* DeepCool CG530 4F */
  "case-11": "6933412765158",
  /* DeepCool CG530 4F Vit */
  "case-12": "6933412765165",
  /* Phanteks XT Pro Ultra */
  "case-13": "886523303138",
  /* DeepCool CG530 Svart */
  "case-17": "6933412765134",
  /* Lian Li Lancool 216 */
  "case-2": "4718466012920",
  /* Corsair 3500X */
  "case-21": "0840006686040",
  /* Lian Li O11D Mini V2 White */
  "case-22": "4718466019844",
  /* Phanteks XT View */
  "case-23": "886523303183",
  /* DeepCool CG530 Vit */
  "case-25": "6933412765141",
  /* Thermaltake View 170 TG ARGB */
  "case-27": "4711475645332",
  /* Cooler Master MasterBox TD500 Mesh V2 (Svart) */
  "case-7": "4719512135358",
  /* NZXT H5 Flow */
  "case-8": "5056547205854",
  /* Noctua NH-D15 */
  "cool-1": "4716123315360",
  /* GIGABYTE Gaming 240 vattenkylare (is) */
  "cool-12": "4719331555856",
  /* MSI MAG Coreliquid A13 240 Kylare (vit) */
  "cool-15": "4711377276672",
  /* Arctic Liquid Freezer III Pro 280 A-RGB White */
  "cool-16": "4895265000331",
  /* Arctic Liquid Freezer III Pro 240 Kylare (svart) */
  "cool-18": "4895265000218",
  /* DeepCool LM240 */
  "cool-19": "6933412729464",
  /* be quiet! Dark Rock Pro 5 */
  "cool-2": "4260052190746",
  /* Arctic Liquid Freezer III Pro 240 A-RGB */
  "cool-22": "4895265000225",
  /* MSI MAG Coreliquid A13 240 Kylare (svart) */
  "cool-23": "4711377276672",
  /* Arctic Liquid Freezer III Pro 240 A-RGB Kylare (svart) */
  "cool-24": "4895265000225",
  /* Arctic Liquid Freezer III Pro 360 Kylare (svart) */
  "cool-27": "4895265000249",
  /* MSI MAG Coreliquid A13 360 Kylare (vit) */
  "cool-29": "4711377273770",
  /* Arctic Liquid Freezer III Pro 360 A-RGB Kylare (svart) */
  "cool-31": "4895265000256",
  /* NZXT Kraken 360 Elite V2 2024 RGB Kylare (svart) */
  "cool-38": "5056547204185",
  /* NZXT Kraken 360 Elite V2 2024 RGB Kylare (vit) */
  "cool-39": "5056547204185",
  /* NZXT Kraken Elite V2 360 */
  "cool-4": "5056547204130",
  /* Asus ROG Ryuo IV SLC 360 ARGB Kylare */
  "cool-41": "4711387850657",
  /* Tryx PANORAMA Upgraded 360mm AIO White */
  "cool-45": "6977029650353",
  /* DeepCool AG400 */
  "cool-47": "6933412727590",
  /* Thermalright Assassin Spirit 120 V2 */
  "cool-48": "814256015646",
  /* Arctic Liquid Freezer III Pro 360 */
  "cool-5": "4895265000249",
  /* DeepCool AG400 BK ARGB V2 */
  "cool-50": "6933412729310",
  /* Cooler Master Hyper 212 3DHP ARGB kylare (svart) */
  "cool-51": "4719512158821",
  /* Arctic Freezer 36 Kylare */
  "cool-52": "4895213704120",
  /* DeepCool AG400 WH ARGB V2 */
  "cool-53": "6933412729327",
  /* DeepCool AK400 Digital SE */
  "cool-55": "6933412729495",
  /* Thermalright Peerless Assassin 120 SE ARGB */
  "cool-58": "814256003766",
  /* be quiet! Pure Rock Pro 3 LX */
  "cool-59": "4260052192528",
  /* DeepCool AK620 */
  "cool-6": "6933412727316",
  /* DeepCool AK500 Zero Dark */
  "cool-60": "6933412727972",
  /* DeepCool AK620 Zero Dark */
  "cool-61": "6933412727842",
  /* DeepCool AK620 G2 Digital Nyx */
  "cool-62": "6933412729716",
  /* be quiet! Pure Rock Pro 3 */
  "cool-63": "4260052192504",
  /* Noctua NH-L9x65 chromax.black */
  "cool-64": "9010018000498",
  /* Noctua NH-L12S */
  "cool-65": "9010018000054",
  /* Noctua NH-U12A */
  "cool-66": "9010018000160",
  /* Noctua NH-U9S */
  "cool-67": "4716123315575",
  /* Noctua NH-D12L */
  "cool-68": "9010018000337",
  /* AMD Ryzen 3 3200G */
  "cpu-am4-ryzen-3-3200g": "8592978190507",
  /* AMD Ryzen 5 4500 */
  "cpu-am4-ryzen-5-4500": "8592978372330",
  /* AMD Ryzen 5 5600GT */
  "cpu-am4-ryzen-5-5600gt": "8592978524616",
  /* AMD Ryzen 5 5600X */
  "cpu-am4-ryzen-5-5600x": "3540260185668",
  /* AMD Ryzen 7 5700 */
  "cpu-am4-ryzen-7-5700": "4262552150060",
  /* AMD Ryzen 7 5700X */
  "cpu-am4-ryzen-7-5700x": "3540260200828",
  /* AMD Ryzen 7 5800X */
  "cpu-am4-ryzen-7-5800x": "730143312714",
  /* AMD Ryzen 9 5950X */
  "cpu-am4-ryzen-9-5950x": "730143312745",
  /* AMD Ryzen 5 7500F Tray */
  "cpu-am5-ryzen-5-7500f-tray": "5054444547480",
  /* AMD Ryzen 5 7500X3D */
  "cpu-am5-ryzen-5-7500x3d": "0730143318167",
  /* AMD Ryzen 5 7600 */
  "cpu-am5-ryzen-5-7600": "8592978425890",
  /* AMD Ryzen 5 7600 Tray */
  "cpu-am5-ryzen-5-7600-tray": "8592978425890",
  /* AMD Ryzen 5 7600X */
  "cpu-am5-ryzen-5-7600x": "730143314442",
  /* AMD Ryzen 5 8600G */
  "cpu-am5-ryzen-5-8600g": "8592978524906",
  /* AMD Ryzen 5 9600X */
  "cpu-am5-ryzen-5-9600x": "8592978562755",
  /* AMD Ryzen 7 7700 */
  "cpu-am5-ryzen-7-7700": "8592978426187",
  /* AMD Ryzen 7 7700X */
  "cpu-am5-ryzen-7-7700x": "730143314428",
  /* AMD Ryzen 7 7800X3D */
  "cpu-am5-ryzen-7-7800x3d": "4251538815963",
  /* AMD Ryzen 7 8700F */
  "cpu-am5-ryzen-7-8700f": "8592978545048",
  /* AMD Ryzen 7 8700F Tray */
  "cpu-am5-ryzen-7-8700f-tray": "8592978545048",
  /* AMD Ryzen 7 8700G */
  "cpu-am5-ryzen-7-8700g": "8592978524821",
  /* AMD Ryzen 7 9700X */
  "cpu-am5-ryzen-7-9700x": "8592978561581",
  /* AMD Ryzen 7 9700X Tray */
  "cpu-am5-ryzen-7-9700x-tray": "8592978561581",
  /* AMD Ryzen 7 9800X3D */
  "cpu-am5-ryzen-7-9800x3d": "0000473679710",
  /* AMD Ryzen 9 7900 */
  "cpu-am5-ryzen-9-7900": "0730143317771",
  /* AMD Ryzen 9 7900X */
  "cpu-am5-ryzen-9-7900x": "730143314558",
  /* AMD Ryzen 9 7950X */
  "cpu-am5-ryzen-9-7950x": "8592978412661",
  /* AMD Ryzen 9 9900X */
  "cpu-am5-ryzen-9-9900x": "0730143315296",
  /* AMD Ryzen 9 9900X Tray */
  "cpu-am5-ryzen-9-9900x-tray": "0730143315296",
  /* AMD Ryzen 9 9950X */
  "cpu-am5-ryzen-9-9950x": "8592978568290",
  /* AMD Ryzen 9 9950X3D */
  "cpu-am5-ryzen-9-9950x3d": "730143315555",
  /* Intel Core i3-13100F */
  "cpu-lga1700-core-i3-13100f": "8592978422332",
  /* Intel Core i5-12400 Tray */
  "cpu-lga1700-core-i5-12400-tray": "8592978354954",
  /* Intel Core i5-12400F */
  "cpu-lga1700-core-i5-12400f": "0675901979184",
  /* Intel Core i5-12600KF */
  "cpu-lga1700-core-i5-12600kf": "8592978357672",
  /* Intel Core i5-13400F */
  "cpu-lga1700-core-i5-13400f": "8592978422424",
  /* Intel Core i7-14700K */
  "cpu-lga1700-core-i7-14700k": "5056489771271",
  /* Intel Core i7-14700KF */
  "cpu-lga1700-core-i7-14700kf": "5056489771288",
  /* Intel Core i9-14900KF */
  "cpu-lga1700-core-i9-14900kf": "5056489771264",
  /* ASUS Dual GeForce RTX 3050 6GB OC */
  "gpu-1": "4711387470633",
  /* MSI GeForce RTX 5060 Ti 8GB VENTUS 2X OC PLUS */
  "gpu-12": "4711377338868",
  /* Gigabyte GeForce RTX 5060 Ti AERO OC */
  "gpu-14": "4719331356040",
  /* MSI GeForce RTX 5060 Ti 16GB VENTUS 2X OC PLUS */
  "gpu-16": "4711377334471",
  /* ASUS GeForce RTX 5060 Ti Dual 16GB OC */
  "gpu-18": "4711387994306",
  /* Gigabyte Radeon RX 9060 XT GAMING 16GB OC */
  "gpu-19": "4719331356248",
  /* ASUS Dual GeForce RTX 5050 8GB OC */
  "gpu-2": "4711636178518",
  /* ASUS Prime Radeon RX 9060 XT 16GB OC */
  "gpu-22": "4711387994214",
  /* ASUS PRIME Radeon RX 9070 16GB OC */
  "gpu-24": "4711387829592",
  /* XFX Radeon RX 9070 Swift Triple 90mm Fan Black */
  "gpu-26": "840191502385",
  /* XFX Radeon RX 9070 Swift Triple 90mm Fan White */
  "gpu-27": "0840191502392",
  /* ASUS PRIME GeForce RTX 5070 12GB OC */
  "gpu-31": "4711387837825",
  /* Gigabyte GeForce RTX 5070 EAGLE OC ICE */
  "gpu-32": "4719331355777",
  /* ASUS GeForce RTX 5070 Dual 12GB OC */
  "gpu-33": "4711636046213",
  /* ASRock Radeon RX 9070 XT Steel Legend 16GB */
  "gpu-40": "4711581490451",
  /* ASUS PRIME Radeon RX 9070 XT 16GB OC */
  "gpu-41": "4711387829585",
  /* MSI GeForce RTX 5070 Ti VENTUS 3X 16GB OC */
  "gpu-43": "4711377301589",
  /* ASUS PRIME GeForce RTX 5070 Ti 16GB OC */
  "gpu-44": "4711387861516",
  /* Inno3D GeForce RTX 5070 Ti X3 OC White */
  "gpu-46": "8886307700230",
  /* INNO3D GeForce RTX 5070 Ti X3 OC */
  "gpu-48": "8886307700247",
  /* ASUS Dual GeForce RTX 5060 8GB OC */
  "gpu-5": "4711636057899",
  /* Gigabyte GeForce RTX 5080 Aorus Master 16GB */
  "gpu-56": "4719331355586",
  /* ASUS ROG ASTRAL GeForce RTX 5080 16GB OC */
  "gpu-57": "4711387837917",
  /* ASUS Prime GeForce RTX 5080 16GB OC */
  "gpu-59": "4711387837788",
  /* PNY GeForce RTX 5060 OC Dual Fan */
  "gpu-6": "0751492797076",
  /* INNO3D GeForce RTX 5080 X3 OC */
  "gpu-60": "8886307700186",
  /* Palit GeForce RTX 5080 GamingPro OC 16GB */
  "gpu-61": "4710562244922",
  /* ASUS ROG Astral GeForce RTX 5090 32GB OC */
  "gpu-62": "4711387890288",
  /* Gigabyte GeForce RTX 5090 32GB Aorus Stealth Ice */
  "gpu-66": "4719331356576",
  /* ASUS Radeon RX 9060 XT 8GB Dual */
  "gpu-8": "4711387994269",
  /* Gigabyte Radeon RX 9060 XT GAMING 8GB OC */
  "gpu-9": "4719331356231",
  /* ASRock A520M-HDV */
  "mb-am4-asrock-a520m-hdv": "4710483932267",
  /* ASRock A520M-HVS */
  "mb-am4-asrock-a520m-hvs": "4710483932311",
  /* ASRock B550M-HDV */
  "mb-am4-asrock-b550m-hdv": "4710483931635",
  /* ASRock B550M Phantom Gaming 4 */
  "mb-am4-asrock-b550m-phantom-gaming-4": "4710483932755",
  /* ASRock B550M Pro4 */
  "mb-am4-asrock-b550m-pro4": "4710483931598",
  /* ASUS Prime A520M-K */
  "mb-am4-asus-prime-a520m-k": "4718017826921",
  /* ASUS Prime A520M-R */
  "mb-am4-asus-prime-a520m-r": "4711387466414",
  /* ASUS Prime B550M-A */
  "mb-am4-asus-prime-b550m-a": "4718017755528",
  /* ASUS ROG Strix B550-F Gaming WiFi II */
  "mb-am4-asus-rog-strix-b550-f-gaming-wifi-ii": "4711081453314",
  /* ASUS TUF Gaming B550-Plus WiFi II */
  "mb-am4-asus-tuf-b550-plus-wifi-ii": "4711081338413",
  /* Gigabyte B550I AORUS PRO AX */
  "mb-am4-gigabyte-b550i-aorus-pro-ax": "4719331809508",
  /* Gigabyte B550M K */
  "mb-am4-gigabyte-b550m-k": "4719331852764",
  /* MSI A520M-A PRO */
  "mb-am4-msi-a520m-a-pro": "4719072749927",
  /* MSI B550M PRO-VDH WIFI */
  "mb-am4-msi-b550m-pro-vdh-wifi": "4719072733698",
  /* MSI MPG B550 Gaming Plus */
  "mb-am4-msi-mpg-b550-gaming-plus": "4719072731885",
  /* ASRock A620AM-HVS */
  "mb-am5-asrock-a620am-hvs": "4711581490802",
  /* ASRock B650M-H/M.2+ */
  "mb-am5-asrock-b650m-h-m2-plus": "4710483943768",
  /* ASRock B650M PG Lightning */
  "mb-am5-asrock-b650m-pg-lightning": "4710483943829",
  /* ASRock B850 Pro-A WiFi */
  "mb-am5-asrock-b850-pro-a-wifi": "4711581490192",
  /* ASRock B850M Pro RS WiFi */
  "mb-am5-asrock-b850m-pro-rs-wifi": "4711581490352",
  /* ASRock B850M Riptide WiFi */
  "mb-am5-asrock-b850m-riptide-wifi": "4711581490482",
  /* ASRock B850M Steel Legend WiFi */
  "mb-am5-asrock-b850m-steel-legend-wifi": "4711581490499",
  /* ASRock B850M-X R2.0 */
  "mb-am5-asrock-b850m-x-r20": "4711581490758",
  /* ASRock B850M-X WIFI R2.0 */
  "mb-am5-asrock-b850m-x-wifi-r20": "4711581490765",
  /* ASRock X870 LIVEMIXER WIFI */
  "mb-am5-asrock-x870-livemixer-wifi": "4711581491823",
  /* ASRock X870 NOVA WiFi */
  "mb-am5-asrock-x870-nova-wifi": "4710483942754",
  /* ASRock X870 PRO RS */
  "mb-am5-asrock-x870-pro-rs": "4710483949326",
  /* ASRock X870 PRO RS WIFI */
  "mb-am5-asrock-x870-pro-rs-wifi": "4710483949333",
  /* ASRock X870 STEEL LEGEND WIFI */
  "mb-am5-asrock-x870-steel-legend-wifi": "4710483949340",
  /* ASRock X870E Taichi */
  "mb-am5-asrock-x870e-taichi": "4710483947421",
  /* ASUS TUF Gaming B650-Plus WiFi */
  "mb-am5-asus-tuf-b650-plus-wifi": "4711081912651",
  /* ASUS ROG Strix X870-A Gaming WiFi */
  "mb-am5-asus-x870-a-gaming-wifi": "4711387737859",
  /* Gigabyte B840M H */
  "mb-am5-gigabyte-b840m-h": "4719331877880",
  /* Gigabyte B850 Eagle Ice */
  "mb-am5-gigabyte-b850-eagle-ice": "4719331871680",
  /* Gigabyte B850M EAGLE WIFI6E ICE */
  "mb-am5-gigabyte-b850m-eagle-wifi6e-ice": "4719331871789",
  /* GIGABYTE B850M FORCE */
  "mb-am5-gigabyte-b850m-force": "4719331874322",
  /* GIGABYTE B850M FORCE WIFI6E */
  "mb-am5-gigabyte-b850m-force-wifi6e": "4719331874308",
  /* GigaByte X870 AORUS ELITE WIFI7 */
  "mb-am5-gigabyte-x870-aorus-elite-wifi7": "4719331864811",
  /* Gigabyte X870 AORUS ELITE X3D ICE */
  "mb-am5-gigabyte-x870-aorus-elite-x3d-ice": "4719331876678",
  /* Gigabyte X870E Aero X3D Wood */
  "mb-am5-gigabyte-x870e-aero-x3d-wood": "4719331878481",
  /* Gigabyte X870E AORUS ELITE X3D */
  "mb-am5-gigabyte-x870e-aorus-elite-x3d": "4719331876470",
  /* GIGABYTE X870E AORUS PRO ICE */
  "mb-am5-gigabyte-x870e-aorus-pro-ice": "4719331864798",
  /* Gigabyte X870I Aorus Pro Ice */
  "mb-am5-gigabyte-x870i-aorus-pro-ice": "4719331866112",
  /* MSI MAG B650 Tomahawk WiFi */
  "mb-am5-msi-b650-tomahawk-wifi": "4711377010153",
  /* MSI B850M GAMING PLUS WIFI6E */
  "mb-am5-msi-b850m-gaming-plus-wifi6e": "4711377365345",
  /* MSI PRO B850-S WIFI6E */
  "mb-am5-msi-pro-b850-s-wifi6e": "4711377365338",
  /* Sapphire Pulse A620AM */
  "mb-am5-sapphire-pulse-a620am": "4895106296879",
  /* ASRock B760 Pro RS */
  "mb-lga1700-asrock-b760-pro-rs": "4710483942044",
  /* ASRock B760M-H2/M.2 */
  "mb-lga1700-asrock-b760m-h2-m-2": "4710483944215",
  /* ASRock B760M-HDV/M.2 */
  "mb-lga1700-asrock-b760m-hdv-m-2": "4710483943485",
  /* ASRock B760M-HDV/M.2 D4 */
  "mb-lga1700-asrock-b760m-hdv-m-2-d4": "4710483942020",
  /* ASRock H610M-H2/M.2 D5 */
  "mb-lga1700-asrock-h610m-h2-m-2-d5": "4710483943775",
  /* ASRock H610M-HDV/M.2+ D5 */
  "mb-lga1700-asrock-h610m-hdv-m-2-d5": "4710483943478",
  /* ASRock H610M-HDV/M.2 R2.0 */
  "mb-lga1700-asrock-h610m-hdv-m-2-r2-0": "4710483939860",
  /* ASRock Z790 PG Lightning */
  "mb-lga1700-asrock-z790-pg-lightning": "4710483940965",
  /* ASRock Z790 Pro RS */
  "mb-lga1700-asrock-z790-pro-rs": "4710483940767",
  /* Asus Prime B760-PLUS */
  "mb-lga1700-asus-prime-b760-plus": "4711387102985",
  /* ASUS PRIME Z790-P WIFI */
  "mb-lga1700-asus-prime-z790-p-wifi": "4711081937227",
  /* ASUS PRO B760M-R D4 */
  "mb-lga1700-asus-pro-b760m-r-d4": "4711387423769",
  /* ASUS TUF Gaming B760-Plus WiFi */
  "mb-lga1700-asus-tuf-b760-plus-wifi": "4711387095119",
  /* ASUS TUF Gaming Z790-Plus WiFi */
  "mb-lga1700-asus-tuf-z790-plus-wifi": "4711387014509",
  /* Gigabyte B760 GAMING X WIFI6E GEN5 */
  "mb-lga1700-gigabyte-b760-gaming-x-wifi6e-gen5": "4719331871673",
  /* GIGABYTE B760M DS3H GEN5 */
  "mb-lga1700-gigabyte-b760m-ds3h-gen5": "4719331872793",
  /* GIGABYTE B760M H DDR4 */
  "mb-lga1700-gigabyte-b760m-h-ddr4": "4719331854645",
  /* GIGABYTE H610M H V2 DDR4 */
  "mb-lga1700-gigabyte-h610m-h-v2-ddr4": "4719331851743",
  /* Gigabyte Z790 Aorus Elite AX */
  "mb-lga1700-gigabyte-z790-aorus-elite-ax": "4719331849467",
  /* GIGABYTE Z790 D */
  "mb-lga1700-gigabyte-z790-d": "4719331861186",
  /* Gigabyte Z790 D AX */
  "mb-lga1700-gigabyte-z790-d-ax": "4719331860592",
  /* MSI B760 GAMING PLUS WIFI */
  "mb-lga1700-msi-b760-gaming-plus-wifi": "4711377086561",
  /* MSI B760M GAMING PLUS WIFI */
  "mb-lga1700-msi-b760m-gaming-plus-wifi": "4711377154017",
  /* MSI B760M-P PRO */
  "mb-lga1700-msi-b760m-p-pro": "4711377086578",
  /* MSI PRO Z790-P WIFI */
  "mb-lga1700-msi-pro-z790-p-wifi": "4711377015738",
  /* MSI Z790 GAMING PLUS WIFI */
  "mb-lga1700-msi-z790-gaming-plus-wifi": "4711377134712",
  /* MSI MAG Z790 Tomahawk WiFi */
  "mb-lga1700-msi-z790-tomahawk-wifi": "4711377025492",
  /* ASRock B860 Pro-A WiFi */
  "mb-lga1851-asrock-b860-pro-a-wifi": "4711581490253",
  /* ASRock B860 Pro RS */
  "mb-lga1851-asrock-b860-pro-rs": "4711581490222",
  /* ASRock B860I WiFi */
  "mb-lga1851-asrock-b860i-wifi": "4711581490321",
  /* ASRock B860M-H2 */
  "mb-lga1851-asrock-b860m-h2": "4711581490437",
  /* ASRock B860M Pro-A */
  "mb-lga1851-asrock-b860m-pro-a": "4711581490291",
  /* ASRock B860M Pro-A WiFi */
  "mb-lga1851-asrock-b860m-pro-a-wifi": "4711581490307",
  /* ASRock B860M Pro RS */
  "mb-lga1851-asrock-b860m-pro-rs": "4711581490277",
  /* ASRock B860M Pro RS WiFi */
  "mb-lga1851-asrock-b860m-pro-rs-wifi": "4711581490284",
  /* ASRock B860M Steel Legend WiFi */
  "mb-lga1851-asrock-b860m-steel-legend-wifi": "4711581490215",
  /* ASRock B860M-X */
  "mb-lga1851-asrock-b860m-x": "4711581490406",
  /* ASRock H810M-X WIFI */
  "mb-lga1851-asrock-h810m-x-wifi": "4711581490659",
  /* ASRock Z890 LIVEMIXER WIFI */
  "mb-lga1851-asrock-z890-livemixer-wifi": "4710483949715",
  /* ASRock Z890 PRO-A */
  "mb-lga1851-asrock-z890-pro-a": "4710483947537",
  /* ASRock Z890 PRO RS WIFI WHITE */
  "mb-lga1851-asrock-z890-pro-rs-wifi-white": "4710483947476",
  /* ASRock Z890 RIPTIDE WIFI */
  "mb-lga1851-asrock-z890-riptide-wifi": "4710483949647",
  /* ASRock Z890I NOVA WIFI */
  "mb-lga1851-asrock-z890i-nova-wifi": "4710483949739",
  /* ASUS ROG STRIX Z890-A GAMING WIFI */
  "mb-lga1851-asus-rog-strix-z890-a-gaming-wifi": "4711387758830",
  /* ASUS ROG STRIX Z890-E GAMING WIFI */
  "mb-lga1851-asus-rog-strix-z890-e-gaming-wifi": "4711387756133",
  /* GIGABYTE AORUS Z890 TACHYON ICE */
  "mb-lga1851-gigabyte-aorus-z890-tachyon-ice": "4719331870898",
  /* Gigabyte B860 GAMING X WIFI6E */
  "mb-lga1851-gigabyte-b860-gaming-x-wifi6e": "4719331866532",
  /* GIGABYTE B860M EAGLE V2 */
  "mb-lga1851-gigabyte-b860m-eagle-v2": "4719331869656",
  /* Gigabyte B860M GAMING X WIFI6E */
  "mb-lga1851-gigabyte-b860m-gaming-x-wifi6e": "4719331867133",
  /* Gigabyte Z890 Aorus Elite X Ice */
  "mb-lga1851-gigabyte-z890-aorus-elite-x-ice": "4719331864989",
  /* GIGABYTE Z890 AORUS PRO ICE */
  "mb-lga1851-gigabyte-z890-aorus-pro-ice": "4719331864712",
  /* GIGABYTE Z890 AORUS XTREME AI TOP */
  "mb-lga1851-gigabyte-z890-aorus-xtreme-ai-top": "4719331866174",
  /* GIGABYTE Z890M GAMING X */
  "mb-lga1851-gigabyte-z890m-gaming-x": "4719331865160",
  /* MSI MAG Z890 TOMAHAWK WIFI */
  "mb-lga1851-msi-mag-z890-tomahawk-wifi": "4711377259712",
  /* MSI PRO B860-P */
  "mb-lga1851-msi-pro-b860-p": "4711377289757",
  /* MSI PRO Z890-S WIFI */
  "mb-lga1851-msi-pro-z890-s-wifi": "4711377269995",
  /* GIGABYTE P650G PG5 */
  "psu-11": "4719331556785",
  /* DeepCool PL650-D White */
  "psu-12": "6933412721246",
  /* MSI MAG A650BN */
  "psu-14": "4719072849627",
  /* Corsair CX750 */
  "psu-17": "840006671015",
  /* Asus Prime 750W Bronze */
  "psu-18": "4711387635124",
  /* ASUS TUF Gaming 750B */
  "psu-19": "4718017724029",
  /* Corsair RM850x */
  "psu-2": "840006667445",
  /* GIGABYTE UD750GM PG5 V2 ICE */
  "psu-21": "4719331556310",
  /* Gigabyte UD850GM PG5 V2 850W */
  "psu-23": "4719331555993",
  /* Seasonic G12 GM-850 850W */
  "psu-25": "4711173878513",
  /* ASUS Prime 850W Gold */
  "psu-27": "4711387192658",
  /* GIGABYTE UD1000GM PG5 V2 ICE */
  "psu-28": "4719331556594",
  /* Seasonic Focus GX-750 */
  "psu-3": "4711173878445",
  /* Seasonic VERTEX GX-1200 */
  "psu-4": "4711173877721",
  /* be quiet! Straight Power 12 Platinum 1200W */
  "psu-5": "4260052189443",
  /* NZXT C750 */
  "psu-9": "5056547207551",
  /* Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz CL36 */
  "ram-1": "0840006679707",
  /* Kingston FURY Beast 6000MHz DDR5 16GB (svart) */
  "ram-18": "0740617345858",
  /* G.Skill Trident Z5 Neo RGB 32GB (2x16GB) DDR5 6400MHz CL32 */
  "ram-2": "4713294234575",
  /* Corsair Vengeance RGB 16GB (2x8GB) DDR5 6000MHz CL36 */
  "ram-20": "0840440405344",
  /* Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz CL36 */
  "ram-21": "0840006666110",
  /* Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz CL36 */
  "ram-22": "0840006679707",
  /* Corsair 32GB (2x16GB) DDR5 6000MHz CL36 Vengeance RGB Vit */
  "ram-24": "0840006674900",
  /* Kingston Fury Beast RGB 32GB (2x16GB) DDR5 6000MHz CL36 */
  "ram-25": "0740617345902",
  /* Samsung 990 Pro 1TB */
  "sto-1": "8806094215021",
  /* Seagate BarraCuda 4TB */
  "sto-10": "0763649081723",
  /* Kingston Fury Renegade G5 */
  "sto-14": "740617349481",
  /* Intenso Premium M.2 */
  "sto-18": "4034303031146",
  /* Intenso Premium M.2 250GB */
  "sto-21": "4034303031146",
  /* Corsair MP700 ELITE */
  "sto-23": "0840440487838",
  /* Kingston NV3 M.2 1TB */
  "sto-24": "740617344790",
  /* Samsung 990 EVO Plus 4TB */
  "sto-34": "8806095575667",
  /* Lexar NM990 */
  "sto-37": "0843367136841",
  /* Patriot Viper Gaming PV593 */
  "sto-38": "4711378430615",
  /* Samsung 990 Pro 2TB */
  "sto-4": "8806094413755",
  /* Kingston KC3000 1TB */
  "sto-7": "740617324433",
  /* Samsung 870 Evo 2TB */
  "sto-8": "8806090545900",
};
