import { Link } from "react-router-dom";
import { MapPin, ShieldCheck, Wrench } from "lucide-react";

import { Reveal } from "./Reveal";
import buildShowcase from "../../images/hero/build-showcase.jpg";

/**
 * "Varför DatorHuset" - texten till vänster, bygget till höger.
 *
 * Formen är Apex Gaming PCs: en smal textspalt mot en stor produktbild
 * som går ut i kanten. Det som gör deras variant stark är just att
 * bilden inte sitter i en ruta med marginal runt om - den bryter ut ur
 * spaltrutnätet och fortsätter förbi skärmkanten, så den läses som ett
 * fönster in i datorn i stället för som en illustration bredvid texten.
 *
 * Under texten står tre märken: ikon, sedan en kort etikett på två
 * rader. De ska gå att läsa i ett svep - det är påståenden man vill ha
 * bekräftade innan man handlar, inte något man läser igenom.
 *
 * Alla tre är sanna och står redan på andra ställen i butiken. Det är
 * poängen med dem; ett märke som inte går att hålla är värre än inget.
 *
 * BILDEN ÄR EN PLATSHÅLLARE, fritt stockfoto från Unsplash (8yesL5ZPjIU).
 * Den föreställer inte en av våra datorer och ska bytas mot en egen.
 */

const MARKS = [
  {
    icon: MapPin,
    title: "Byggd för hand",
    detail: "i Spånga, Stockholm",
  },
  {
    icon: ShieldCheck,
    title: "3 års reklamationsrätt",
    detail: "enligt konsumentköplagen",
  },
  {
    icon: Wrench,
    title: "Provkörd innan leverans",
    detail: "kabeldragen och testad",
  },
];

export const WhySection = () => (
  <section data-sandbox-id="home-why" className="relative overflow-hidden">
    {/*
      Två spalter på bredden, staplade på en telefon. Bilden ligger sist
      i koden men först i bild på små skärmar - ett foto gör mer för att
      hålla kvar någon som just kommit in än en rubrik gör.
    */}
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-0">
      <Reveal className="order-2 lg:order-1">
        <div className="container mx-auto px-4 py-4 lg:ml-auto lg:mr-0 lg:max-w-xl lg:py-24 lg:pr-16">
          <p className="eyebrow">Varför DatorHuset</p>

          <h2 className="section-title mt-3 text-3xl sm:text-4xl lg:text-5xl">
            Byggd av någon, inte av något
          </h2>

          <p className="mt-5 max-w-prose text-base leading-relaxed text-muted-foreground">
            Varje dator vi säljer skruvas ihop för hand här i Spånga. Delarna
            väljs ut en och en, kablarna dras på plats, och maskinen får gå
            igång och provköras innan den packas. Ingen bandlina, ingen kartong
            som stått i ett fjärrlager - och någon att ringa som faktiskt var
            med och byggde just din.
          </p>

          {/* Märkena: ikon över etikett, som i förlagan */}
          <ul className="mt-10 grid grid-cols-3 gap-4 sm:gap-6">
            {MARKS.map(({ icon: Icon, title, detail }) => (
              <li key={title} className="text-center sm:text-left">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary sm:mx-0">
                  <Icon className="h-[22px] w-[22px]" />
                </span>
                <span className="mt-3 block text-[13px] font-semibold leading-snug text-foreground">
                  {title}
                </span>
                <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                  {detail}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/about" className="btn-primary">
              Om DatorHuset
            </Link>
            <Link to="/custom-bygg" className="btn-secondary">
              Bygg din egen
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal
        delay={120}
        from="none"
        className="order-1 lg:order-2 lg:h-full"
      >
        <div className="relative h-64 w-full sm:h-80 lg:h-[640px]">
          <img
            src={buildShowcase}
            alt="Speldator byggd av DatorHuset, med sidopanel i glas"
            className="h-full w-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
          {/*
            Bilden är ljus och sidan är mörk. Utan en toning i kanterna
            slutar den i en rak ljus linje mot duken, och skarven syns
            mer än bilden gör.
          */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(10,7,16,0.85) 0%, rgba(10,7,16,0.25) 22%, transparent 45%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 lg:hidden"
            style={{
              background:
                "linear-gradient(180deg, transparent 40%, rgba(10,7,16,0.75) 100%)",
            }}
          />
        </div>
      </Reveal>
    </div>
  </section>
);

export default WhySection;
