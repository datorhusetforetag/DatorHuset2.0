import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import bronzeTier from "../../images/bronze tier.png";
import silverTier from "../../images/silver tier.png";
import platinumTier from "../../images/platinum tier.png";
import diamondTier from "../../images/diamond tier.png";

/**
 * De fyra nivåerna, visade som Starforge visar sina paket: en stor ruta
 * med den valda nivån, och en rad små förhandsbilder under som byter
 * vilken som visas.
 *
 * Poängen med formen är att en nivå får hela ytan i stället för en
 * fjärdedel. Datorn syns, texten får plats, och de andra tre finns kvar
 * inom räckhåll utan att konkurrera om uppmärksamheten.
 *
 * Bilderna är frilagda PNG:er som ligger ovanpå sitt eget ljus, inte i en
 * kortram - det är det som får dem att sväva.
 */

type Tier = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  specs: string[];
  image: string;
  href: string;
  /** Kulören på ljuset bakom datorn, som RGB utan alfa. */
  glow: string;
  /** Färg på nivånamn och accenter. */
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
    glow: "63, 217, 245",
    accent: "#3FD9F5",
  },
];

export const TierSection = () => {
  const [activeId, setActiveId] = useState(TIERS[1].id);
  const active = TIERS.find((tier) => tier.id === activeId) ?? TIERS[0];

  return (
    <section data-sandbox-id="home-tiers" className="section-surface-alt relative">
      <div className="container mx-auto px-4 py-20 sm:py-28 lg:py-32">
        <div className="mb-12 text-center">
          <p className="eyebrow">Våra nivåer</p>
          <h2 className="section-title mt-3">Fyra steg, en dator som passar</h2>
          <p className="section-lede mx-auto mt-4 text-center">
            Alla byggs för hand, testas och levereras körklara. Skillnaden är hur
            långt du vill gå.
          </p>
        </div>

        {/* Den stora rutan ---------------------------------------------- */}
        <div
          className="surface-card relative overflow-hidden"
          style={{
            // Ljuset i rutan följer den valda nivåns kulör, så hela panelen
            // byter stämning och inte bara bilden.
            backgroundImage: `radial-gradient(75% 90% at 22% 55%, rgba(${active.glow}, 0.22) 0%, transparent 62%)`,
          }}
        >
          <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:p-14">
            {/* Datorn svävar över sitt eget ljus */}
            <div className="relative flex min-h-[260px] items-center justify-center sm:min-h-[340px]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 bottom-6 h-32 transition-all duration-500"
                style={{
                  background: `radial-gradient(60% 100% at 50% 100%, rgba(${active.glow}, 0.5) 0%, rgba(${active.glow}, 0.16) 45%, transparent 72%)`,
                }}
              />
              <img
                key={active.id}
                src={active.image}
                alt={`${active.name}-datorn`}
                loading="lazy"
                decoding="async"
                className="relative max-h-[340px] w-auto animate-in fade-in zoom-in-95 object-contain duration-500"
                style={{ filter: `drop-shadow(0 22px 34px rgba(${active.glow}, 0.35))` }}
              />
            </div>

            {/* Texten */}
            <div className="text-center lg:text-left">
              <p
                className="text-xs font-semibold uppercase tracking-[0.28em]"
                style={{ color: active.accent }}
              >
                {active.tagline}
              </p>
              <h3
                className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl"
                style={{ color: active.accent }}
              >
                {active.name}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {active.description}
              </p>

              <ul className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
                {active.specs.map((spec) => (
                  <li
                    key={spec}
                    className="rounded-pill border px-3 py-1 text-xs font-semibold"
                    style={{
                      borderColor: `rgba(${active.glow}, 0.45)`,
                      color: active.accent,
                      backgroundColor: `rgba(${active.glow}, 0.1)`,
                    }}
                  >
                    {spec}
                  </li>
                ))}
              </ul>

              <Link
                to={active.href}
                className="btn-glow mt-8 inline-flex items-center gap-2 rounded-sm px-6 py-3 text-sm font-semibold transition-colors"
                style={{ backgroundColor: active.accent, color: "#14101F" }}
              >
                Se {active.name}-datorer
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Förhandsraden ------------------------------------------------ */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {TIERS.map((tier) => {
            const isActive = tier.id === active.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setActiveId(tier.id)}
                aria-pressed={isActive}
                className="group relative flex items-center gap-3 rounded-lg border bg-card/40 p-3 text-left transition-all duration-300 hover:bg-card/70 sm:flex-col sm:items-center sm:text-center"
                style={{
                  borderColor: isActive ? `rgba(${tier.glow}, 0.6)` : "hsl(var(--border))",
                  boxShadow: isActive ? `0 0 26px rgba(${tier.glow}, 0.22)` : "none",
                }}
              >
                <div className="relative h-14 w-14 shrink-0 sm:h-20 sm:w-20">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                    style={{
                      opacity: isActive ? 0.9 : 0.35,
                      background: `radial-gradient(55% 55% at 50% 65%, rgba(${tier.glow}, 0.55) 0%, transparent 70%)`,
                    }}
                  />
                  <img
                    src={tier.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="relative h-full w-full object-contain transition-transform duration-300 group-hover:-translate-y-0.5"
                  />
                </div>
                <span
                  className="font-display text-sm font-bold tracking-tight transition-colors sm:mt-1"
                  style={{ color: isActive ? tier.accent : "hsl(var(--muted-foreground))" }}
                >
                  {tier.name}
                </span>

                {/* Understrykning på den valda, som hos Starforge */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 bottom-0 h-0.5 rounded-pill transition-all duration-300"
                  style={{
                    backgroundColor: tier.accent,
                    opacity: isActive ? 1 : 0,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TierSection;
