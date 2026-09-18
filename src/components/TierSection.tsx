import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Reveal } from "./Reveal";

import bronzeTier from "../../images/bronze tier.png";
import silverTier from "../../images/silver tier.png";
import platinumTier from "../../images/platinum tier.png";
import diamondTier from "../../images/diamond tier.png";

/**
 * De fyra nivåerna, i Starforges form.
 *
 * Det som gör deras variant luftig är att nästan ingenting är inramat.
 * Datorn står fritt på sidans bakgrund - ingen kortram, ingen egen yta -
 * och bara textsidan har en svag panel. Förhandsbilderna under är inte
 * heller rutor, utan bild plus etikett.
 *
 * Strecket under går genom hela raden och inte bara under den valda.
 * Syns det bara under en av dem ser de andra tre ut som bilder, inte
 * som något man kan klicka på. Den valda tar sin kulör, de övriga
 * ligger svagt tonade. Mellanrummet mellan dem är satt som padding
 * inuti knappen i stället för som gap, så strecken möts och bildar en
 * enda obruten linje tvärs över.
 *
 * Knapparna ligger som två celler i en delad rad längst ned i panelen,
 * skilda av en linje, i stället för som fristående knappar.
 */

type Tier = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  specs: string[];
  image: string;
  href: string;
  compareHref: string;
  /** Kulören på ljuset bakom datorn, som RGB utan alfa. */
  glow: string;
  accent: string;
};

const TIERS: Tier[] = [
  {
    id: "bronze",
    name: "Bronze",
    tagline: "Kom igång",
    description:
      "Första riktiga speldatorn. Klarar det du spelar idag i 1080p utan att du behöver tömma sparkontot.",
    specs: ["1080p", "Nybörjarvänlig", "Lägst pris"],
    image: bronzeTier,
    href: "/products?category=budget&clear_filters=1",
    compareHref: "/products?clear_filters=1",
    glow: "205, 127, 50",
    accent: "#E3A567",
  },
  {
    id: "silver",
    name: "Silver",
    tagline: "Mest dator för pengarna",
    description:
      "Den nivå de flesta landar på. Hög bildfrekvens i 1440p, och marginal kvar till nästa generations spel.",
    specs: ["1440p", "Populärast", "Bra balans"],
    image: silverTier,
    href: "/products?category=price-performance&clear_filters=1",
    compareHref: "/products?clear_filters=1",
    glow: "186, 196, 214",
    accent: "#CBD3E1",
  },
  {
    id: "platinum",
    name: "Platinum",
    tagline: "Byggd för att hålla",
    description:
      "Komponenter med luft kvar. Ultra i 1440p idag, och kraft nog att stå sig i flera år framåt.",
    specs: ["1440p ultra", "Framtidssäker", "Tyst gång"],
    image: platinumTier,
    href: "/products?category=best-selling&clear_filters=1",
    compareHref: "/products?clear_filters=1",
    glow: "178, 107, 222",
    accent: "#B26BDE",
  },
  {
    id: "diamond",
    name: "Diamond",
    tagline: "Utan kompromisser",
    description:
      "Det bästa vi bygger. 4K, raytracing och allt påslaget - utan att något behöver stängas av.",
    specs: ["4K", "Raytracing", "Toppklass"],
    image: diamondTier,
    href: "/products?category=toptier&clear_filters=1",
    compareHref: "/products?clear_filters=1",
    glow: "63, 217, 245",
    accent: "#3FD9F5",
  },
];

/*
 * Datorn lutar en aning efter pekaren.
 *
 * Det är sidans enda riktiga produktbild, och den stod alldeles stilla.
 * Lutar den svagt åt det håll man för muspekaren läses den som ett
 * föremål som står i rummet i stället för som en utklippt bild.
 *
 * Utslaget skrivs som två tal på elementet och räknas om till grader i
 * CSS. Att i stället sätta hela transform-strängen här hade betytt en
 * omritning av React-trädet vid varje musrörelse.
 *
 * Rör man inte pekaren alls händer ingenting, och pekskärmar skickar
 * aldrig de här händelserna - då står den bara still, som förut.
 */
const useTilt = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const frame = useRef(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  }, []);

  const set = (x: number, y: number) => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--tilt-x", x.toFixed(3));
    node.style.setProperty("--tilt-y", y.toFixed(3));
  };

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced.current || frame.current) return;
    const node = ref.current;
    if (!node) return;

    const box = node.getBoundingClientRect();
    // -1 i ena kanten, +1 i den andra, 0 mitt i.
    const x = ((event.clientX - box.left) / box.width) * 2 - 1;
    const y = ((event.clientY - box.top) / box.height) * 2 - 1;

    frame.current = window.requestAnimationFrame(() => {
      frame.current = 0;
      set(x, y);
    });
  }, []);

  const onPointerLeave = useCallback(() => {
    if (frame.current) {
      window.cancelAnimationFrame(frame.current);
      frame.current = 0;
    }
    set(0, 0);
  }, []);

  useEffect(
    () => () => {
      if (frame.current) window.cancelAnimationFrame(frame.current);
    },
    [],
  );

  return { ref, onPointerMove, onPointerLeave };
};

export const TierSection = () => {
  const [activeId, setActiveId] = useState(TIERS[1].id);
  const active = TIERS.find((tier) => tier.id === activeId) ?? TIERS[0];
  const tilt = useTilt();

  return (
    <section data-sandbox-id="home-tiers" className="section-surface-alt relative">
      <div className="container mx-auto px-4 py-20 sm:py-28 lg:py-32">
        <Reveal className="mb-14 text-center">
          <p className="eyebrow">Våra nivåer</p>
          <h2 className="section-title mt-3 text-4xl sm:text-5xl lg:text-6xl">Fyra steg, en dator som passar</h2>
          <p className="section-lede mx-auto mt-4 text-center">
            Alla byggs för hand, testas och levereras körklara. Skillnaden är hur
            långt du vill gå.
          </p>
        </Reveal>

        {/* Datorn står fritt, panelen ligger bredvid ------------------- */}
        <Reveal delay={80} className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-4">
          <div
            ref={tilt.ref}
            onPointerMove={tilt.onPointerMove}
            onPointerLeave={tilt.onPointerLeave}
            className="tier-stage relative flex min-h-[320px] items-center justify-center sm:min-h-[420px]"
          >
            {/* Ljuset bakom följer med en aning, annars ser datorn ut att
                glida loss från sin egen skugga. */}
            <div
              aria-hidden="true"
              className="tier-glow pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(40% 28% at 50% 74%, rgba(${active.glow}, 0.45) 0%, rgba(${active.glow}, 0.15) 42%, transparent 70%)`,
              }}
            />
            {/*
              Lutningen sitter på en egen ruta. Inflygningen nedan sätter
              också transform, och två som skriver på samma egenskap tar
              ut varandra.
            */}
            <div className="tier-tilt relative">
              <img
                key={active.id}
                src={active.image}
                alt={`${active.name}-datorn`}
                loading="lazy"
                decoding="async"
                className="max-h-[420px] w-auto animate-in fade-in zoom-in-95 object-contain duration-500"
                style={{ filter: `drop-shadow(0 28px 44px rgba(${active.glow}, 0.4))` }}
              />
            </div>
          </div>

          {/* Panelen: svag ram, nästan genomskinlig botten */}
          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-sm">
            <div className="p-8 sm:p-10">
              <p
                className="text-xs font-semibold uppercase tracking-[0.28em]"
                style={{ color: active.accent }}
              >
                {active.tagline}
              </p>
              <h3 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {active.name}
              </h3>

              <ul className="mt-5 flex flex-wrap gap-2">
                {active.specs.map((spec) => (
                  <li
                    key={spec}
                    className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: active.accent }}
                  >
                    {spec}
                    <span className="ml-2 text-white/20 last:hidden">/</span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                {active.description}
              </p>
            </div>

            {/* Två celler i en delad rad, som hos dem */}
            <div className="grid grid-cols-2 border-t border-white/10">
              <Link
                to={active.href}
                className="border-r border-white/10 px-4 py-5 text-center text-sm font-semibold transition-colors hover:bg-white/[0.06]"
                style={{ color: active.accent }}
              >
                Se {active.name}-datorer
              </Link>
              <Link
                to={active.compareHref}
                className="px-4 py-5 text-center text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
              >
                Jämför alla nivåer
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Förhandsraden: bild och etikett, ingen ruta ----------------- */}
        <Reveal delay={160} className="mt-16 grid grid-cols-2 gap-x-0 gap-y-8 lg:grid-cols-4">
          {TIERS.map((tier) => {
            const isActive = tier.id === active.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setActiveId(tier.id)}
                aria-pressed={isActive}
                className="group flex items-center gap-4 border-b-2 border-foreground/20 pb-4 pr-6 text-left transition-colors hover:border-foreground/50"
                style={isActive ? { borderColor: tier.accent } : undefined}
              >
                <span className="relative block h-16 w-16 shrink-0 sm:h-20 sm:w-20">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                    style={{
                      opacity: isActive ? 0.9 : 0.4,
                      background: `radial-gradient(40% 30% at 50% 76%, rgba(${tier.glow}, 0.6) 0%, transparent 70%)`,
                    }}
                  />
                  <img
                    src={tier.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="relative h-full w-full object-contain transition-transform duration-300 group-hover:-translate-y-1"
                  />
                </span>
                <span
                  className="font-display text-base font-bold leading-tight tracking-tight transition-colors sm:text-lg"
                  style={{ color: isActive ? tier.accent : "hsl(var(--muted-foreground))" }}
                >
                  {tier.name}
                </span>
              </button>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
};

export default TierSection;
