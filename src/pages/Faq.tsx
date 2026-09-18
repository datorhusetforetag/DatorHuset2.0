import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessagesSquare, Search } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { PAGE_BANNERS } from "@/lib/pageBanners";
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

const ACCENT = PAGE_BANNERS.faq.accent;

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
    <PageShell head={<SeoJsonLd data={[faqSchema, breadcrumbSchema]} />}>
      <PageHero
        sandboxId="faq-hero"
        image={PAGE_BANNERS.faq.image}
        accent={ACCENT}
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Vanliga frågor" }]}
        eyebrow={page.heroEyebrow}
        title={page.heroTitle}
        lede={page.heroDescription}
      />

      <section data-sandbox-id="faq-items" className="relative">
        <div className="container mx-auto max-w-6xl px-4 pb-24 pt-14">
          <div className="grid gap-10 lg:grid-cols-[1.45fr_0.55fr] lg:gap-14">
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
                    className="field h-12 pl-11"
                  />
                </div>

                <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
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
                    className="flex flex-col gap-3"
                  >
                    {visible.map((item) => (
                      <AccordionItem
                        key={item.question}
                        value={item.question}
                        className="overflow-hidden rounded-lg border border-foreground/10 bg-background/70 transition-colors hover:border-foreground/25 data-[state=open]:border-foreground/25"
                      >
                        <AccordionTrigger className="px-5 py-5 text-left text-base font-semibold hover:no-underline sm:px-6 [&>svg]:h-5 [&>svg]:w-5">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-6 pr-12 text-sm leading-relaxed text-muted-foreground sm:px-6">
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
              <div className="rounded-lg border border-foreground/10 bg-background/70 p-7">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 items-center justify-center rounded-lg"
                  style={{ backgroundColor: ACCENT + "1F", color: ACCENT }}
                >
                  <MessagesSquare className="h-5 w-5" />
                </span>
                <h2 className="mt-5 font-display text-lg font-bold text-foreground">
                  Hittade du inte svaret?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Skriv till oss så återkommer vi. Vi svarar hellre på en fråga
                  för mycket än att du beställer fel dator.
                </p>
                <Link to="/kundservice" className="btn-primary mt-6 w-full">
                  Kontakta kundservice
                </Link>
              </div>

              <div className="mt-5 rounded-lg border border-foreground/10 bg-background/70 p-7">
                <h2 className="font-display text-base font-bold text-foreground">
                  Det längre svaret
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
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
