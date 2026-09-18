import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Rullar upp vid sidbyte - men inte när adressen pekar ut ett avsnitt.
 *
 * Tidigare kördes window.scrollTo(0, 0) vid varje byte av sökväg, utan
 * undantag. Det gjorde att en länk till ett avsnitt på en annan sida
 * (till exempel /#home-tiers från en tom kundvagn) landade högst upp
 * på startsidan i stället för vid nivåerna. Länken såg ut att vara
 * trasig fast det var den här komponenten som körde över den.
 *
 * Nu: finns det ett fragment i adressen letas elementet upp och rullas
 * fram, annars rullas det upp som förut. Uppslaget görs i en
 * requestAnimationFrame eftersom målet inte finns i DOM:en förrän den
 * nya sidan har målats en gång.
 *
 * Har besökaren bett om mindre rörelse hoppar vi direkt i stället för
 * att rulla mjukt.
 */
export const ScrollToTop = ({ children }: { children: React.ReactNode }) => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const frame = window.requestAnimationFrame(() => {
      /* querySelector kastar på ett fragment som inte är en giltig
         väljare, och fragmentet kommer från adressfältet - alltså
         utifrån. En trasig länk ska landa högst upp, inte krascha
         sidan. */
      let target: Element | null = null;
      try {
        target = document.querySelector(hash);
      } catch {
        target = null;
      }

      if (target) {
        target.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
      } else {
        window.scrollTo(0, 0);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return <>{children}</>;
};
