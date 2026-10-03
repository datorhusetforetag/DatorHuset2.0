# DatorHuset – varumärkesmanual

Logotypen är **chassit som är ett hus**, ritat platt och grovt.

- **Glasytan** till vänster visar bygget: frontfläkt, vattenkylare med slangar upp mot radiatorn, grafikkort med kylkåpa och PCIe-bleck, och tre bottenfläktar i rad.
- **Gaveln** till höger har en cyan ytterdörr på glänt med svart handtag.
- **Taket** är en tjock plommonvinkel som svävar över huset, med skorsten.

Ingen ovansida syns. De två ytorna möts i en lodrät skarv och kanterna faller bort åt båda håll, som en fasad sedd i ögonhöjd – det är därför det läser som hus och inte som låda.

Formerna inuti ytorna är avsiktligt raka och runda, inte perspektivförvrängda. Den naiviteten är hela poängen: den är vad som gör märket läsbart nere vid 16 px.

## Två detaljnivåer

Geometrin ligger i `scripts/brand/flat-house.mjs`.

| Nivå | Innehåll | Används |
| --- | --- | --- |
| `full` | Frontfläkt, vattenkylare med slangar, grafikkort, tre bottenfläktar, dörr, skorsten | 32 px och uppåt |
| `small` | En större frontfläkt, grafikkort med två fläktar, dörr, skorsten | 16–32 px |

## Färger

| Roll | Hex | Användning |
| --- | --- | --- |
| Cyan | `#3FD9F5` | Ytterdörren, "Dator" i ordmärket |
| Cyan mörk | `#1BA8C4` | Cyan på ljus bakgrund |
| Plommon | `#B26BDE` | Tak, skorsten, "Huset" i ordmärket |
| Plommon ljus | `#C9A0EA` | Fläktringar, PCIe-bleck, fläktnav |
| Plommon stark | `#9B4DE0` | Pumpblock, grafikkortets kylkåpa |
| Plommon djup | `#6E2B92` | Plommon på ljus bakgrund |
| Slang | `#6E6E82` | Vattenkylarens slangar |
| Kretskort | `#555566` | Remsan under grafikkortets kåpa |
| Chassi | `#242428` | Husets två ytor |
| Chassi mörk yta | `#1E1E25` | Samma yta mot mörk bakgrund – något lyft så formen inte försvinner |
| Ljus linje | `#F2F2F7` | Takfot och lodrät skarv |
| Svart | `#0C0D14` | Ikonplattans bas |
| Svart plommon | `#1C0B24` | Ikonplattans nedre hörn |

Chassit är nästan svart. Den ljusa linjen längs takfoten och skarven är inte dekoration – den är det som håller isär de två ytorna och gör att märket läser mot både vit och svart bakgrund. Ta aldrig bort den.

## Typsnitt

Ordmärket sätts i **Orbitron 800**. "Dator" i cyan, "Huset" i plommon – alltid ett ord, alltid stort D och stort H. Brödtext på sajten är Inter.

`public/brand/orbitron-800-subset.woff2` innehåller bara bokstäverna i "DatorHuset" (1,2 kB) och bäddas in i lockup-filerna, så de ser likadana ut överallt även utan internet.

## Filer

Allt i `public/brand/` genereras av `scripts/generate-brand-assets.mjs`.

| Fil | Använd till |
| --- | --- |
| `datorhuset-mark.svg` | Primär ikon, mörk platta |
| `datorhuset-mark-light-bg.svg` | Samma ikon med ljus platta |
| `datorhuset-mark-round.svg` | Rund variant för profilbilder som beskärs till cirkel |
| `datorhuset-mark-small.svg` | Förenklad, mörk platta, 16–32 px |
| `datorhuset-mark-small-light-bg.svg` | Förenklad, ljus platta |
| `datorhuset-glyph.svg` | Huset utan platta, för ljusa ytor |
| `datorhuset-glyph-dark-bg.svg` | Huset utan platta, för mörka ytor |
| `datorhuset-glyph-mono-light.svg` | Enfärgad streckversion i vitt |
| `datorhuset-glyph-mono-dark.svg` | Enfärgad streckversion i svart – fakturor, gravyr, svartvitt tryck |
| `datorhuset-lockup-dark.svg` | Vågrät logotyp med namn, mörk bakgrund |
| `datorhuset-lockup-light.svg` | Vågrät logotyp med namn, ljus bakgrund |
| `datorhuset-lockup-stacked-dark.svg` | Stående logotyp, mörk bakgrund |
| `datorhuset-lockup-stacked-light.svg` | Stående logotyp, ljus bakgrund |
| `datorhuset-illustration-iso.svg` | Tidigare isometrisk, detaljerad version – se nedan |

Genererade rasterfiler i `public/`: `Datorhuset.png` (512), `icon-512.png`, `icon-192.png`, `apple-touch-icon.png` (180), `favicon-96/48/32.png`, `favicon.ico` (16/32/48), `datorhuset-round.png` (256), `datorhuset-mark-small.png` (128 – den navbar och footer visar) och `og-datorhuset.png` (1200×630).

## Den isometriska versionen

`scripts/brand/case-house.mjs` innehåller en tidigare, mycket mer detaljerad isometrisk illustration – tre frontfläktar, AIO-radiator, RAM, CPU, grafikkort, trappa upp till dörren och ordmärket på taket. Den genereras fortfarande som `datorhuset-illustration-iso.svg`.

Den och det platta märket är **två olika bildspråk**. Kör inte båda i produktion. Antingen behålls den isometriska som hero-bild och det platta märket bara som ikon, eller så tas den bort. Tills det är bestämt ligger den kvar, oanvänd.

## Regler

- **Frizon:** minst en halv hushöjd tom yta runt märket.
- **Minsta storlek:** 16 px för ikonen, 150 px bredd för den vågräta lockupen.
- Under 32 px – använd `datorhuset-mark-small.svg`.
- Spegelvänd aldrig märket. Glaset sitter till vänster, dörren till höger.
- Sträck det inte, rotera det inte, och byt inte ut typsnittet i ordmärket.
- Lägg aldrig in perspektiv i formerna inuti ytorna – fläktarna är cirklar, grafikkortet en rektangel. Det är avsiktligt.
- Grafikkortets fläktar är urtag i kylkåpan, inte egna ringar. Med sju ringar i märket tappar det sin tyngd.
- Behöver du enfärgat, använd mono-filerna.

## Generera om

```bash
npm run brand:build
```

Skriptet ritar allt ur geometrin och rastrerar sedan PNG/ICO med headless Chrome (Edge fungerar också). Ingen extra npm-dependency behövs. Sätt `CHROME_PATH` om webbläsaren ligger på ett annat ställe än standard.

Handredigera aldrig filerna i `public/brand/` eller de genererade ikonerna – ändra i `scripts/brand/flat-house.mjs` och kör om, annars glider varianterna isär.
