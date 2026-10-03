import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessagesSquare, Search } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { INFO_PAGE_BACKGROUND, PageShell } from "@/components/PageShell";
import { InfoPageHeader } from "@/components/InfoPageHeader";
import { Reveal } from "@/components/Reveal";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Vanliga frågor.
 *
 * Frågorna är fällbara här precis som i smakprovet på startsidan. Sex
 * uppslagna svar på rad blir en textvägg man skummar förbi; hopfällda
 * blir de en innehållsförteckning man kan välja ur.
 *
 * Nytt är filtret. En FAQ som växer blir snabbt en lista man rullar
 * förbi utan att läsa, och den som kommit hit har oftast en bestämd
 * fråga - "frakt", "Klarna", "ångra" - inte ett allmänt intresse för
 * våra villkor. Filtret söker i både fråga och svar, eftersom ordet man
 * letar efter oftare står i svaret.
 *
 * Söktermen skrivs inte till adressfältet. Det hade varit trevligt att
 * kunna länka till en filtrerad vy, men frågorna redigeras i adminläget
 * och en sparad länk hade slutat betyda något så fort någon skrev om en
 * fråga.
 *
 * Panelen bredvid följer med när man rullar. Den som letat sig igenom
 * hela listan utan att hitta svaret ska inte behöva rulla tillbaka upp
 * för att hitta vägen till kundservice.
 */

export default function Faq() {
  const { settings } = useSiteSettings();
  const page = settings.pages.faq;
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return page.items;
    return page.items.filter(
      (item) =>
        item.question.toLowerCase().includes(needle) ||
        item.answer.toLowerCase().includes(needle),
    );
  }, [page.items, query]);

  /* Strukturerad data beskriver alltid hela listan, aldrig den
     filtrerade. Sökmotorn ska se sidan som den är, inte som en enskild
     besökare råkat filtrera den. */
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: "https://datorhuset.se/" },
      { "@type": "ListItem", position: 2, name: "FAQ", item: "https://datorhuset.se/faq" },
    ],
  };

  return (
    <PageShell
      head={<SeoJsonLd data={[faqSchema, breadcrumbSchema]} />}
      background={INFO_PAGE_BACKGROUND}
    >
      <InfoPageHeader
        sandboxId="faq-hero"
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Vanliga frågor" }]}
        eyebrow={page.heroEyebrow}
        title={page.heroTitle}
        lede={page.heroDescription}
      />

      <section data-sandbox-id="faq-items" className="relative">
        <div className="container mx-auto max-w-6xl px-4 pb-24 pt-10 sm:pt-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-12">
            <div>
              {/* Filtret ------------------------------------------------ */}
              <Reveal>
                <label htmlFor="faq-filter" className="sr-only">
                  Filtrera frågorna
                </label>
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    id="faq-filter"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Sök bland frågorna - frakt, betalning, garanti..."
                    className="info-field h-12 w-full rounded-lg pl-11"
                  />
                </div>

                <p className="mt-3 text-xs text-white/50" aria-live="polite">
                  {query.trim()
                    ? `${visible.length} av ${page.items.length} frågor matchar`
                    : `${page.items.length} frågor`}
                </p>
              </Reveal>

              {/* Frågorna ---------------------------------------------- */}
              {visible.length > 0 ? (
                <Reveal delay={80} className="mt-8">
                  {/* Nyckeln följer söktermen med flit. Byts listan ut
                      under ett öppet dragspel står annars fel svar
                      uppslaget under fel fråga. */}
                  <Accordion
                    key={query}
                    type="single"
                    collapsible
                    className="info-panel divide-y divide-white/10 overflow-hidden"
                  >
                    {visible.map((item) => (
                      <AccordionItem
                        key={item.question}
                        value={item.question}
                        className="border-b-0 transition-colors data-[state=open]:bg-white/[0.03]"
                      >
                        <AccordionTrigger className="px-5 py-5 text-left text-[15px] font-semibold text-white hover:bg-white/[0.03] hover:no-underline sm:px-6 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-white/50">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-6 pr-12 text-[15px] leading-7 text-white/70 sm:px-6">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Reveal>
              ) : (
                <Reveal delay={80} className="mt-12 text-center">
                  <p className="font-display text-lg font-bold text-foreground">
                    Ingen fråga matchar &rdquo;{query.trim()}&rdquo;
                  </p>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Prova ett kortare ord, eller skriv till oss så svarar vi -
                    och lägger till frågan här efteråt.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="btn-secondary mt-7"
                  >
                    Visa alla frågor
                  </button>
                </Reveal>
              )}
            </div>

            {/* Vägen vidare ------------------------------------------- */}
            <Reveal delay={140} className="lg:sticky lg:top-28 lg:self-start">
              <div className="info-panel p-6">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white"
                >
                  <MessagesSquare className="h-5 w-5" />
                </span>
                <h2 className="mt-5 text-base font-semibold text-white">
                  Hittade du inte svaret?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  Skriv till oss så återkommer vi. Vi svarar hellre på en fråga
                  för mycket än att du beställer fel dator.
                </p>
                <Link to="/kundservice" className="btn-primary mt-6 w-full">
                  Kontakta kundservice
                </Link>
              </div>

              <div className="info-panel mt-4 p-6">
                <h2 className="text-base font-semibold text-white">
                  Det längre svaret
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  Frågor om retur, reklamation och vad som gäller juridiskt står
                  utförligt på villkorssidorna.
                </p>
                <ul className="mt-5 space-y-2 text-sm">
                  <li>
                    <Link
                      to="/angerratt-och-returer"
                      className="link-underline font-semibold text-primary"
                    >
                      Ångerrätt och returer
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms-of-service" className="link-underline font-semibold text-primary">
                      Köpvillkor
                    </Link>
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
