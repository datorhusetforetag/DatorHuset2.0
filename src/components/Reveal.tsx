import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Visar sitt innehåll först när det rullas in i bild.
 *
 * Utan det här är hela sidan färdigmålad innan man kommer fram till den,
 * och att rulla blir att flytta en färdig bild förbi fönstret. Med det
 * byggs sidan upp allteftersom.
 *
 * Utlöses en gång och kopplar sedan bort sig. Att låta innehåll försvinna
 * igen när det rullar ut är irriterande snarare än snyggt, och en
 * observatör som ligger kvar kostar i onödan.
 *
 * Marginalen -12% i nederkant gör att det utlöses strax innan elementet
 * syns, så rörelsen hinner starta medan det fortfarande är på väg in.
 * Annars ser man alltid början av animationen och det känns trögt.
 *
 * Har besökaren bett om mindre rörelse ligger allt synligt direkt -
 * CSS:en i index.css slår av både förskjutning och toning.
 */

type RevealProps = {
  children: ReactNode;
  /** Fördröjning i ms, för att låta syskon komma in efter varandra. */
  delay?: number;
  /** Håll fart nedåt, uppåt eller bara tona in. */
  from?: "up" | "down" | "none";
  as?: ElementType;
  className?: string;
  /**
   * Adminlägets krok i sidan. Reveal sprider inte vidare okända
   * attribut, och ett data-sandbox-id skrivet rakt på den hade fallit
   * bort tyst - sektionen gick då inte längre att redigera därifrån.
   */
  sandboxId?: string;
};

export const Reveal = ({
  children,
  delay = 0,
  from = "up",
  as: Tag = "div",
  className = "",
  sandboxId,
}: RevealProps) => {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Saknas stöd för IntersectionObserver ska innehållet synas, inte
    // ligga kvar osynligt för alltid.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /*
   * will-change ger elementet ett eget lager hos grafikkortet. Det är
   * rätt medan det tonar in, men blir dyrt om det ligger kvar: allt
   * som sedan ändrar storlek inuti - ett utfällt svar till exempel -
   * tvingar om hela lagret vid varje bildruta, och rörelsen hackar.
   *
   * Så det släpps när toningen är över. Fördröjningen är toningens
   * längd plus den egna fördröjningen, med lite marginal.
   */
  useEffect(() => {
    if (!visible) return;

    const timer = window.setTimeout(() => setSettled(true), delay + 800);
    return () => window.clearTimeout(timer);
  }, [visible, delay]);

  return (
    <Tag
      ref={ref as never}
      className={`reveal reveal-${from} ${className}`}
      data-sandbox-id={sandboxId}
      data-visible={visible || undefined}
      data-settled={settled || undefined}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
