import { Link } from "react-router-dom";

import bronzeTier from "../../images/bronze tier.png";
import silverTier from "../../images/silver tier.png";
import platinumTier from "../../images/platinum tier.png";
import diamondTier from "../../images/diamond tier.png";

/**
 * De fyra nivåerna vi säljer.
 *
 * Bilderna är frilagda PNG:er och ligger ovanpå ett eget ljus i stället
 * för i en kortram - samma grepp som Starforge använder för sina datorer.
 * Utan ram tar bilden hela uppmärksamheten, och ljuset under gör att den
 * ser ut att sväva i stället för att flyta omkring löst.
 *
 * Varje nivå har en egen kulör på ljuset: brons och silver i sina egna
 * metallfärger, platina i plommon och diamant i cyan. Trappan slutar
 * alltså i märkets två färger.
 */

type Tier = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  href: string;
  /** Kulören på ljuset bakom datorn, som RGB utan alfa. */
  glow: string;
  /** Färg på nivånamnet. */
  accent: string;
};

const TIERS: Tier[] = [
  {
    id: "bronze",
    name: "Bronze",
    tagline: "Kom igång",
    description: "Spelar det du spelar idag, i 1080p, utan att kosta en förmögenhet.",
    image: bronzeTier,
    href: "/products?category=budget&clear_filters=1",
    glow: "205, 127, 50",
    accent: "#E3A567",
  },
  {
    id: "silver",
    name: "Silver",
    tagline: "Mest dator för pengarna",
    description: "Den nivå de flesta landar på. Hög bildfrekvens i 1440p med marginal kvar.",
    image: silverTier,
    href: "/products?category=price-performance&clear_filters=1",
    glow: "186, 196, 214",
    accent: "#CBD3E1",
  },
  {
    id: "platinum",
    name: "Platinum",
    tagline: "Byggd för att hålla",
    description: "Komponenter med luft kvar - 1440p på ultra idag, och några år till.",
    image: platinumTier,
    href: "/products?category=best-selling&clear_filters=1",
    glow: "178, 107, 222",
    accent: "#B26BDE",
  },
  {
    id: "diamond",
    name: "Diamond",
    tagline: "Utan kompromisser",
    description: "Det bästa vi bygger. 4K, raytracing och allt påslaget.",
    image: diamondTier,
    href: "/products?category=toptier&clear_filters=1",
    glow: "63, 217, 245",
    accent: "#3FD9F5",
  },
];

export const TierSection = () => {
  return (
    <section data-sandbox-id="home-tiers" className="section-surface-alt section-seam-top relative">
      <div className="container mx-auto px-4 py-20 sm:py-28 lg:py-32">
        <div className="mb-12 text-center">
          <p className="eyebrow">Våra nivåer</p>
          <h2 className="section-title mt-3">Fyra steg, en dator som passar</h2>
          <p className="section-lede mx-auto mt-4 text-center">
            Alla byggs för hand, testas och levereras körklara. Skillnaden är hur
            långt du vill gå.
          </p>
        </div>

        <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <Link
              key={tier.id}
              to={tier.href}
              className="group flex flex-col items-center text-center"
            >
              {/* Bilden svävar över sitt eget ljus. Ingen ram - ljuset är
                  det enda som håller ihop den mot bakgrunden. */}
              <div className="relative flex h-52 w-full items-end justify-center">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-32 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    opacity: 0.55,
                    background: `radial-gradient(60% 100% at 50% 100%, rgba(${tier.glow}, 0.55) 0%, rgba(${tier.glow}, 0.18) 45%, transparent 72%)`,
                  }}
                />
                <img
                  src={tier.image}
                  alt={`${tier.name}-datorn`}
                  loading="lazy"
                  decoding="async"
                  className="relative max-h-52 w-auto object-contain transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-[1.04]"
                  style={{
                    filter: `drop-shadow(0 18px 28px rgba(${tier.glow}, 0.32))`,
                  }}
                />
              </div>

              <p
                className="mt-6 font-display text-xl font-bold tracking-tight"
                style={{ color: tier.accent }}
              >
                {tier.name}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {tier.tagline}
              </p>
              <p className="mt-3 max-w-[30ch] text-sm leading-relaxed text-muted-foreground">
                {tier.description}
              </p>

              <span
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold transition-transform duration-300 group-hover:translate-x-1"
                style={{ color: tier.accent }}
              >
                Se datorer
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TierSection;
