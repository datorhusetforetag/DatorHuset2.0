import { Link } from "react-router-dom";
import { MapPin, ShieldCheck, Wrench } from "lucide-react";

import { Reveal } from "./Reveal";
import showcase from "../../images/why-datorhuset.webp";

/**
 * "Varför DatorHuset" - texten till vänster, bygget till höger.
 *
 * Formen är Apex Gaming PCs: en smal textspalt mot en stor bild av
 * datorn. Under texten står tre märken - ikon, sedan en kort etikett på
 * två rader - som ska gå att läsa i ett svep. Det är påståenden man vill
 * ha bekräftade innan man handlar, inte något man läser igenom.
 *
 * Alla tre är sanna och står redan på andra ställen i butiken. Det är
 * poängen med dem; ett märke som inte går att hålla är värre än inget.
 *
 * Datorn står fritt mot duken med ett ljus bakom sig, samma grepp som
 * nivåavsnittet, i stället för att ligga som ett foto i en ram. En
 * frilagd rendering med genomskinlig bakgrund vill inte beskäras - den
 * ska stå i rummet.
 *
 * BILDEN ÄR EN PLATSHÅLLARE och föreställer inte en av våra datorer.
 * Byt filen images/why-datorhuset.webp mot en egen rendering så följer
 * resten med; filnamnet är det enda som behöver ligga kvar.
 *
 * Filnamnet är avsiktligt utan å, ä och ö. Windows, Git och Linux är
 * inte överens om hur sådana tecken kodas i filnamn, och en import som
 * fungerar här kan sluta hitta filen när Render bygger projektet.
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
    <section data-sandbox-id="home-why" className="relative">
      <div className="container mx-auto px-4 py-20 sm:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          {/* På telefon står bilden först - den håller kvar blicken
              bättre än en rubrik gör. */}
          <Reveal className="order-2 lg:order-1">
            <p className="eyebrow">Varför DatorHuset</p>

            <h2 className="section-title mt-3 text-3xl sm:text-4xl lg:text-5xl">
              Byggd av någon, inte av något
            </h2>

            <p className="mt-5 max-w-prose text-base leading-relaxed text-muted-foreground">
              Varje dator vi säljer skruvas ihop för hand här i Spånga. Delarna
              väljs ut en och en, kablarna dras på plats, och maskinen får gå
              igång och provköras innan den packas. Ingen bandlina, ingen
              kartong som stått i ett fjärrlager - och någon att ringa som
              faktiskt var med och byggde just din.
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
          </Reveal>

          <Reveal delay={120} className="order-1 lg:order-2">
            <div className="relative flex items-center justify-center">
              {/* Ljuset bakom datorn, i renderingens egen kulör */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(46% 38% at 50% 52%, rgba(63, 217, 245, 0.28) 0%, rgba(63, 217, 245, 0.09) 45%, transparent 72%)",
                }}
              />
              <img
                src={showcase}
                alt="Speldator byggd av DatorHuset, med sidopanel i glas"
                className="relative max-h-[560px] w-auto object-contain"
                loading="lazy"
                decoding="async"
                style={{ filter: "drop-shadow(0 30px 55px rgba(0, 0, 0, 0.55))" }}
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
);

export default WhySection;
