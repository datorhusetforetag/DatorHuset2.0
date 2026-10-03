import { ArrowUpCircle, Cpu, ListChecks, ShieldCheck } from "lucide-react";

import { Reveal } from "./Reveal";

/**
 * Riktiga komponenter, inga OEM-delar.
 *
 * Ersätter "Hur DatorHuset kör". Ångerrätt och reklamationsrätt gäller
 * alla butiker och sa inget om oss; det här är något som faktiskt skiljer
 * en DatorHuset-dator från många färdigbyggda.
 *
 * Först fanns en jämförelsetabell, DatorHuset mot en typisk OEM-dator.
 * Den blev tung att läsa och såg ut som ett faktablad. Nu är det en
 * centrerad rubrik och fyra kort, och poängen sägs som vad du får - inte
 * som vad andra saknar.
 *
 * Påståendena är medvetet allmänna - butiksversioner, tillverkarens
 * garanti, standardmått - och inga siffror eller certifieringar som inte
 * gäller varje bygge.
 */

const POINTS = [
  {
    icon: Cpu,
    title: "Butiksversioner",
    body: "Samma komponenter som säljs i butik - inte specialversioner gjorda för datortillverkare.",
  },
  {
    icon: ShieldCheck,
    title: "Tillverkarens garanti",
    body: "Delarna har tillverkarens egen garanti, utöver din reklamationsrätt hos oss.",
  },
  {
    icon: ArrowUpCircle,
    title: "Lätta att uppgradera",
    body: "Standardmått och standardkontakter, så du kan byta grafikkort eller lägga till minne när du vill.",
  },
  {
    icon: ListChecks,
    title: "Inget gömt",
    body: "Varje del står utskriven på produktsidan, så du vet exakt vad du får.",
  },
];

export const RealPartsSection = () => (
  <section data-sandbox-id="home-real-parts" className="relative text-foreground">
    <div className="container mx-auto max-w-6xl px-4 py-24 sm:py-28">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Vad som sitter i datorn</p>
        {/* Två rader med flit. Fick rubriken bryta själv hamnade "Inga"
            sist på första raden och "OEM-delar." ensamt på den andra. */}
        <h2 className="section-title mt-3 text-4xl sm:text-5xl">
          <span className="block">Riktiga komponenter.</span>
          <span className="block text-[#3FD9F5]">Inga OEM-delar.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          Många färdigbyggda datorer byggs med OEM-delar: specialversioner som bara säljs
          till datortillverkare, ofta utan egen garanti och svåra att uppgradera. Vi bygger
          bara med samma märkesdelar som du själv kan köpa i butik.
        </p>
      </Reveal>

      <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {POINTS.map(({ icon: Icon, title, body }, index) => (
          <Reveal as="li" key={title} delay={index * 70} className="info-panel p-7">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#3FD9F5]/10 text-[#3FD9F5]"
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/65">{body}</p>
          </Reveal>
        ))}
      </ul>
    </div>
  </section>
);

export default RealPartsSection;
