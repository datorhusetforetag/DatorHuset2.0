import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import { PageShell } from "@/components/PageShell";
import { Reveal } from "@/components/Reveal";

/**
 * 404.
 *
 * Satt tidigare på en grå platta utan vare sig navbar eller sidfot, och
 * på engelska mitt i en svensk butik. En återvändsgränd ska se ut som
 * resten av sidan och framför allt erbjuda en väg vidare - den som
 * hamnar här har oftast klickat på en gammal länk, inte skrivit fel.
 */
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: sidan finns inte:", location.pathname);
  }, [location.pathname]);

  return (
    <PageShell>
      <section className="relative">
        <div className="container mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
          <Reveal>
            <p className="eyebrow">Sidan finns inte</p>

            <p
              aria-hidden="true"
              className="mt-4 font-display text-7xl font-bold leading-none tracking-tight text-primary/30 sm:text-8xl"
            >
              404
            </p>

            <h1 className="section-title mt-6 text-3xl sm:text-4xl">
              Här var det tomt
            </h1>

            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Länken kan vara gammal, eller så har sidan bytt adress. Prova
              någon av vägarna nedan så hittar du rätt.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link to="/" className="btn-primary">
                Till startsidan
              </Link>
              <Link to="/products" className="btn-secondary">
                Se våra datorer
              </Link>
              <Link to="/kundservice" className="btn-secondary">
                Kundservice
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
};

export default NotFound;
