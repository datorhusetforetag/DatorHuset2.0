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
}: {
  text: string;
  updatedAt?: string;
}) => {
  const sections = useMemo(() => parseSections(text), [text]);

  /* Ingen numrering: visa texten som den är hellre än ingenting. */
  if (sections.length === 0) {
    return (
      <Reveal className="info-panel mx-auto max-w-3xl px-6 py-8 sm:px-10">
        {updatedAt && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
            Senast uppdaterad: {updatedAt}
          </p>
        )}
        <div className="prose-page mt-6 whitespace-pre-wrap">{text}</div>
      </Reveal>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-10">
      {/* Förteckningen.
          På telefon ligger den överst som en vanlig lista - att klistra
          fast något på en skärm som redan är kort tar bara plats. */}
      <nav aria-label="Innehåll" className="lg:sticky lg:top-28 lg:self-start">
        <div className="info-panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
            Innehåll
          </p>
          <ol className="mt-4 space-y-0.5">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="-mx-2 flex gap-3 rounded-md px-2 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <span
                    aria-hidden="true"
                    className="w-4 shrink-0 text-right tabular-nums text-white/40"
                  >
                    {section.number}
                  </span>
                  <span className="leading-snug">{section.title}</span>
                </a>
              </li>
            ))}
          </ol>

          {updatedAt && (
            <p className="mt-6 border-t border-white/10 pt-5 text-xs text-white/50">
              Senast uppdaterad
              <br />
              <span className="mt-1 inline-block text-sm font-medium text-white/85">{updatedAt}</span>
            </p>
          )}
        </div>
      </nav>

      {/* Texten. Smal radlängd inne i panelen - det enda som gör en
          villkorstext uthärdlig är radlängd och mellanrum. */}
      <article className="info-panel px-6 py-4 sm:px-10 sm:py-6">
        {sections.map((section) => (
          <section
            key={section.id}
            className="max-w-3xl scroll-mt-28 border-t border-white/10 py-8 first:border-t-0"
          >
            <h2 id={section.id} className="flex scroll-mt-28 gap-3 text-lg font-semibold text-white sm:text-xl">
              <span aria-hidden="true" className="tabular-nums text-white/40">
                {section.number}.
              </span>
              <span>{section.title}</span>
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-white/75">
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </article>
    </div>
  );
};

export default LegalDocument;
