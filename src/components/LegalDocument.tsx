import { useMemo } from "react";

import { Reveal } from "./Reveal";

/**
 * Villkorstext med innehållsförteckning.
 *
 * Köpvillkoren och integritetspolicyn låg som en enda <pre> i en ruta.
 * Tekniskt korrekt - texten kommer som en sträng ur inställningarna -
 * men i praktiken tvåtusen tecken i en klump. Den som letar efter vad
 * som gäller vid retur fick läsa allt eller ingenting.
 *
 * Texten är redan numrerad ("1. Allmänt", "2. Beställning och
 * betalning"), så strukturen finns - den syntes bara inte. Här delas
 * den upp på de raderna och blir ett dokument: en förteckning som
 * följer med när man rullar, rubriker att länka till, och stycken med
 * luft emellan.
 *
 * Förteckningen är länkar och inte knappar, så varje avsnitt får en
 * egen adress. Den som får frågan "var står det?" kan skicka en länk
 * rakt till punkt 4 i stället för att skriva "scrolla ungefär halvvägs".
 *
 * Hittas ingen numrering alls faller den tillbaka på vanlig löptext.
 * Villkorstexten går att skriva om i adminläget, och en admin som
 * struntar i numreringen ska få en läsbar sida ändå - inte en tom.
 */

type Section = {
  id: string;
  number: string;
  title: string;
  paragraphs: string[];
};

/** "4. Ångerrätt" -> nummer och rubrik. Inget annat räknas som rubrik. */
const HEADING = /^(\d+)\.\s+(.+?)\s*$/;

/* Rubriken blir en adress: "4. Ångerrätt" -> "#avsnitt-4". Numret och
   inte texten, eftersom en omformulerad rubrik annars bryter alla
   länkar någon hunnit spara. */
const sectionId = (number: string) => `avsnitt-${number}`;

const parseSections = (text: string): Section[] => {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    const match = line.match(HEADING);

    if (match) {
      current = {
        id: sectionId(match[1]),
        number: match[1],
        title: match[2],
        paragraphs: [],
      };
      sections.push(current);
      continue;
    }

    /* Allt före första numrerade rubriken är dokumentets egen titel och
       datumrad. Båda står redan i banderollen, så de hoppas över. */
    if (!current || !line) continue;

    current.paragraphs.push(line);
  }

  return sections;
};

export const LegalDocument = ({
  text,
  updatedAt,
  accent = "#9BA3B8",
}: {
  text: string;
  updatedAt?: string;
  accent?: string;
}) => {
  const sections = useMemo(() => parseSections(text), [text]);

  /* Ingen numrering: visa texten som den är hellre än ingenting. */
  if (sections.length === 0) {
    return (
      <Reveal className="mx-auto max-w-3xl">
        {updatedAt && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Senast uppdaterad: {updatedAt}
          </p>
        )}
        <div className="prose-page mt-6 whitespace-pre-wrap">{text}</div>
      </Reveal>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[240px_1fr] lg:gap-16">
      {/* Förteckningen.
          På telefon ligger den överst som en vanlig lista - att klistra
          fast något på en skärm som redan är kort tar bara plats. */}
      {/* nav ligger utanför Reveal med flit. Reveal sprider inte vidare
          okända attribut, så ett aria-label skrivet på den hade fallit
          bort tyst och förteckningen blivit namnlös för skärmläsare. */}
      <nav aria-label="Innehåll" className="lg:sticky lg:top-28 lg:self-start">
        <Reveal>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.22em]"
            style={{ color: accent }}
          >
            Innehåll
          </p>
          <ol className="mt-4 space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex gap-3 rounded-sm py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span
                    aria-hidden="true"
                    className="w-4 shrink-0 text-right text-xs font-bold tabular-nums opacity-60"
                  >
                    {section.number}
                  </span>
                  <span className="leading-snug">{section.title}</span>
                </a>
              </li>
            ))}
          </ol>

          {updatedAt && (
            <p className="mt-8 border-t border-foreground/10 pt-5 text-xs text-muted-foreground">
              Senast uppdaterad
              <br />
              <span className="font-semibold text-foreground">{updatedAt}</span>
            </p>
          )}
        </Reveal>
      </nav>

      {/* Texten. Smal spalt, gott om luft mellan avsnitten - det enda
          som gör en villkorstext uthärdlig är radlängd och mellanrum. */}
      <div className="max-w-2xl">
        {sections.map((section, index) => (
          <Reveal
            as="section"
            key={section.id}
            delay={Math.min(index, 6) * 50}
            className="scroll-mt-28 border-t border-foreground/10 py-9 first:border-t-0 first:pt-0"
          >
            <h2 id={section.id} className="flex gap-4 scroll-mt-28">
              <span
                aria-hidden="true"
                className="font-display text-xl font-bold tabular-nums"
                style={{ color: accent }}
              >
                {section.number}
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                {section.title}
              </span>
            </h2>

            <div className="mt-4 space-y-4 pl-0 text-[15px] leading-relaxed text-muted-foreground sm:pl-9">
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
};

export default LegalDocument;
