import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { Reveal } from "@/components/Reveal";

/**
 * 404.
 *
 * Satt tidigare på en grå platta utan vare sig navbar eller sidfot, och
 * på engelska mitt i en svensk butik. Nu ligger den på samma duk som
 * resten och ser ut som en sida, inte som ett felmeddelande.
 *
 * Siffran 404 är satt stor och genomskinlig bakom texten i stället för
 * som en rad ovanför den. Den som hamnar här har nästan alltid följt en
 * gammal länk, och då är siffran inte informationen - vägen vidare är
 * det. Siffran får därför vara dekor, och länkarna får platsen.
 *
 * Länkarna är en lista och inte en rad knappar. Tre lika stora knappar
 * bredvid varandra tvingar fram ett val mellan likvärdiga alternativ;
 * en lista går att skumma, och den översta raden är den som de flesta
 * faktiskt letade efter.
 */

const ROUTES = [
  { href: "/products", label: "Våra datorer", hint: "Färdiga byggen i tre nivåer" },
  { href: "/custom-bygg", label: "Custom bygg", hint: "Sätt ihop en egen från grunden" },
  { href: "/service-reparation", label: "Service och reparation", hint: "Lämna in en maskin som krånglar" },
  { href: "/kundservice", label: "Kundservice", hint: "Hittar du inte rätt hjälper vi till" },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: sidan finns inte:", location.pathname);
  }, [location.pathname]);

  return (
    <PageShell>
      <section className="relative overflow-hidden">
        {/* Siffran ligger bakom innehållet och tar aldrig emot klick.
            Den är beskuren av sektionens overflow med flit - en halv
            siffra läses som en yta, en hel som ett meddelande. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 select-none font-display text-[10rem] font-bold leading-none tracking-tighter text-foreground/[0.04] sm:text-[16rem] lg:text-[20rem]"
        >
          404
        </span>

        <div className="container relative mx-auto max-w-3xl px-4 py-24 sm:py-28">
          <Reveal>
            <p className="eyebrow">Sidan finns inte</p>

            <h1 className="section-title mt-4 text-4xl sm:text-5xl">
              Här var det tomt
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
              Länken kan vara gammal, eller så har sidan bytt adress. Allt som
              brukar sökas ligger här nedanför.
            </p>

            <span aria-hidden="true" className="mt-8 block h-px w-24 bg-primary/70" />
          </Reveal>

          <ul className="mt-10 divide-y divide-foreground/10 border-y border-foreground/10">
            {ROUTES.map((route, index) => (
              <Reveal as="li" key={route.href} delay={index * 70}>
                <Link
                  to={route.href}
                  className="group flex items-center justify-between gap-6 py-5 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block font-display text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-lg">
                      {route.label}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {route.hint}
                    </span>
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary"
                  />
                </Link>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={320}>
            <Link to="/" className="btn-secondary mt-10">
              Till startsidan
            </Link>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
};

export default NotFound;
