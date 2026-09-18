import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Räknar upp siffran i en text när den rullas in i bild.
 *
 * "14 dagars ångerrätt" börjar på noll och landar på fjorton. Talet är
 * det enda på raden som betyder något konkret, och ett tal som rör sig
 * drar blicken dit av sig självt.
 *
 * Texten kommer in hel, inte som siffra plus etikett var för sig.
 * Siffran sitter mitt i meningen på svenska - "Reklamera inom 3 år" -
 * och den som ändrar texten i adminläget ska inte behöva veta att den
 * är uppdelad någonstans. Finns ingen siffra i texten renderas den rakt
 * av, utan att något händer.
 *
 * Bara den första siffergruppen räknas upp. Fler än så i samma rubrik
 * blir rörigt att titta på, och finns inte i texterna vi har.
 *
 * Tillgänglighet: själva uppräkningen är dold för uppläsare, och hela
 * den färdiga texten ligger osynlig bredvid. Annars läses raden upp
 * medan den fortfarande räknar, eller en siffra i taget.
 */

type CountUpProps = {
  /** Hela texten, till exempel "14 dagars ångerrätt". */
  children: string;
  /** Väntetid innan räkningen börjar, i ms. */
  delay?: number;
  /** Hur länge räkningen pågår, i ms. Räknas annars ut ur talet. */
  duration?: number;
  /**
   * Startsignal utifrån.
   *
   * Utelämnad håller komponenten koll själv, med en egen observatör.
   * Det duger för en ensam siffra, men inte för flera som ska stanna
   * samtidigt: varje observatör utlöses när just dess rad kommit in i
   * bild, och rad två passerar tröskeln några tiotals millisekunder
   * efter rad ett. Med en gemensam signal från föräldern startar de på
   * exakt samma bildruta, och då - och bara då - går det att räkna ut
   * en längd som får dem att stanna tillsammans.
   */
  start?: boolean;
  className?: string;
};

/*
 * Mjukt i mål, men inte tvärbromsande. En kubisk kurva lägger nästan
 * hela rörelsen i första tredjedelen och kryper sedan i mål - talet ser
 * ut att vara framme långt innan tiden gått, och resten av uppräkningen
 * märks inte. Den kvadratiska fördelar rörelsen jämnare över tiden.
 */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 2);

/*
 * Längden följer talets storlek. Samma tid för alla ser fel ut åt båda
 * håll: en trea hinner fram efter halva tiden och står sedan stilla
 * resten, medan en fjorton rusar förbi om tiden kortas för allas skull.
 *
 * Tiderna här är satta efter när talet syns landa, inte efter vad som
 * står i koden. Med rundningen och kurvan inräknad är fjortonde framme
 * efter dryga två sekunder och trean efter knappt en.
 */
const durationFor = (target: number) => Math.min(2800, 1000 + target * 120);

/*
 * Uppdelningen görs en gång per text och inte vid varje omritning.
 *
 * String.match ger ett nytt objekt varje gång den körs. Ligger det i en
 * beroendelista tror React att något ändrat sig vid varje omritning -
 * och eftersom uppräkningen själv ritar om vid varje steg skulle den
 * starta om sig själv i all oändlighet och aldrig komma fram.
 */
const parse = (text: string) => {
  const match = text.match(/\d+/);
  if (!match) return null;

  const at = match.index ?? 0;
  return {
    before: text.slice(0, at),
    after: text.slice(at + match[0].length),
    digits: match[0].length,
    target: Number(match[0]),
  };
};

/* Mindre rörelse, eller en webbläsare utan observatör: talet står
   färdigt direkt. En siffra som hoppar är precis sådant den
   inställningen finns till för. */
const shouldSkipAnimation = () =>
  typeof window === "undefined" ||
  typeof IntersectionObserver === "undefined" ||
  (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

export const CountUp = ({
  children,
  delay = 0,
  duration,
  start,
  className,
}: CountUpProps) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const parsed = useMemo(() => parse(children), [children]);

  const target = parsed?.target ?? 0;
  const span = duration ?? durationFor(target);

  const [value, setValue] = useState(0);
  const [selfStarted, setSelfStarted] = useState(false);
  const [skip, setSkip] = useState(false);

  /* Föräldern bestämmer när start är satt, annars gör vi det själva. */
  const controlled = start !== undefined;
  const started = controlled ? Boolean(start) : selfStarted;

  useEffect(() => {
    const node = ref.current;
    if (!node || !parsed) return;

    if (shouldSkipAnimation()) {
      setSkip(true);
      setValue(target);
      return;
    }

    if (controlled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSelfStarted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [parsed, target, controlled]);

  useEffect(() => {
    if (!started || !parsed || skip) return;

    let frame = 0;
    let start = 0;

    const step = (now: number) => {
      if (!start) start = now;
      const elapsed = now - start - delay;

      if (elapsed < 0) {
        frame = window.requestAnimationFrame(step);
        return;
      }

      const progress = Math.min(1, elapsed / span);
      setValue(Math.round(easeOut(progress) * target));

      if (progress < 1) frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [started, parsed, target, delay, span, skip]);

  if (!parsed) return <span className={className}>{children}</span>;

  return (
    <span ref={ref} className={className}>
      {/*
        Hela texten ligger här, osynlig men läsbar för uppläsare. En
        aria-label på ett vanligt span är inte att lita på - elementet
        har ingen roll, och då struntar flera uppläsare i etiketten.
      */}
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">
        {parsed.before}
        {/*
          Fast bredd efter slutvärdets antal siffror, och siffror som är
          lika breda var för sig. Annars knycker resten av raden i sidled
          varje gång talet går från en siffra till två.
        */}
        <span
          className="inline-block text-right tabular-nums"
          style={{ minWidth: `${parsed.digits}ch` }}
        >
          {value}
        </span>
        {parsed.after}
      </span>
    </span>
  );
};

export default CountUp;
