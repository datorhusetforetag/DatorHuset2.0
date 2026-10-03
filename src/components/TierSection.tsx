import { useState } from "react";
import { Link } from "react-router-dom";
import { Reveal } from "./Reveal";

import silverTier from "../../images/silver tier.png";
import platinumTier from "../../images/platinum tier.png";
import diamondTier from "../../images/diamond tier.png";

/**
 * De tre nivåerna, i Starforges form.
 *
 * Det som gör deras variant luftig är att nästan ingenting är inramat.
 * Datorn står fritt på sidans bakgrund - ingen kortram, ingen egen yta -
 * och skjuter in över vänsterkanten på textens mörka panel. Förhandsbilderna
 * under är inte heller rutor, utan bild plus etikett.
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

export const TierSection = () => {
  const [activeId, setActiveId] = useState(TIERS[1].id);
  const active = TIERS.find((tier) => tier.id === activeId) ?? TIERS[0];

  return (
    /* id, inte bara data-sandbox-id: avsnittet länkas till utifrån
       (bland annat från en tom kundvagn), och ett data-attribut går
       inte att hoppa till med en ankarlänk. */
    <section
      id="home-tiers"
      data-sandbox-id="home-tiers"
      className="section-surface-alt relative scroll-mt-24"
    >
      <div className="container mx-auto px-4 py-20 sm:py-28 lg:py-32">
        <Reveal className="mb-14 text-center">
          <p className="eyebrow">Våra nivåer</p>
          <h2 className="section-title mt-3 text-4xl sm:text-5xl lg:text-6xl">Tre steg, en dator som passar</h2>
          <p className="section-lede mx-auto mt-4 text-center">
            Alla byggs för hand, testas och levereras körklara. Skillnaden är hur
            långt du vill gå.
          </p>
        </Reveal>

        {/* Datorn står framför panelen och skjuter in över dess vänsterkant.
            Panelen börjar en bit in under datorn, och texten får en bred
            vänstermarginal så att den hamnar fritt till höger om bilden.
            På smal skärm staplas de i stället, bild överst. */}
        <Reveal delay={80} className="relative mx-auto max-w-6xl">
          <div className="relative z-10 flex min-h-[320px] items-center justify-center sm:min-h-[420px] lg:absolute lg:-bottom-14 lg:-top-14 lg:left-0 lg:min-h-0 lg:w-[40%]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 transition-all duration-500"
              style={{
                background: `radial-gradient(50% 45% at 50% 55%, rgba(${active.glow}, 0.4) 0%, rgba(${active.glow}, 0.12) 45%, transparent 72%)`,
              }}
            />
            <img
              key={active.id}
              src={active.image}
              alt={`${active.name}-datorn`}
              loading="lazy"
              decoding="async"
              className="relative max-h-[420px] w-auto max-w-full animate-in fade-in zoom-in-95 object-contain duration-500 lg:max-h-full"
              style={{ filter: `drop-shadow(0 28px 44px rgba(${active.glow}, 0.4))` }}
            />
          </div>

          {/* Panelen: mörk och nästan tät, så texten står stadigt mot bakgrunden */}
          <div className="relative flex flex-col overflow-hidden rounded-lg border border-foreground/10 bg-background/85 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md lg:ml-[32%] lg:min-h-[420px]">
            <div className="flex-1 p-8 sm:p-10 lg:py-14 lg:pl-[22%] lg:pr-14">
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
                    <span className="ml-2 text-foreground/25 last:hidden">/</span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                {active.description}
              </p>
            </div>

            {/* Två celler i en delad rad, som hos dem */}
            <div className="grid grid-cols-2 border-t border-foreground/10">
              <Link
                to={active.href}
                className="border-r border-foreground/10 px-4 py-5 text-center text-sm font-semibold transition-colors hover:bg-foreground/[0.06]"
                style={{ color: active.accent }}
              >
                Se {active.name}-datorer
              </Link>
              <Link
                to={active.compareHref}
                className="px-4 py-5 text-center text-sm font-semibold text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
              >
                Jämför alla nivåer
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Förhandsraden: en kolumn per nivå, lika breda, över samma bredd
            som panelen ovanför. Ett tunt streck går under hela raden och
            den valda lägger ett tjockare i sin kulör ovanpå. */}
        <Reveal
          delay={160}
          className="mx-auto mt-16 grid max-w-6xl grid-cols-3 border-b border-foreground/15 lg:mt-28"
        >
          {TIERS.map((tier) => {
            const isActive = tier.id === active.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setActiveId(tier.id)}
                aria-pressed={isActive}
                className="group relative -mb-px flex min-h-[44px] flex-col items-center gap-2 border-b-2 border-transparent px-2 pb-5 text-center transition-colors hover:border-foreground/40 sm:flex-row sm:justify-center sm:gap-5 sm:px-4 sm:text-left"
                style={isActive ? { borderColor: tier.accent } : undefined}
              >
                <span className="relative block h-16 w-16 shrink-0 sm:h-24 sm:w-24">
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
                  className="font-display text-sm font-bold leading-tight tracking-tight transition-colors sm:text-xl"
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
