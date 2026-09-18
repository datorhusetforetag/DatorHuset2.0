import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, SearchX } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { COMPUTERS } from "@/data/computers";
import { useProducts } from "@/hooks/useProducts";
import { PAGE_BANNERS } from "@/lib/pageBanners";
import { buildProductLookup } from "@/lib/productOverrides";
import { buildSearchCatalog, buildSearchState } from "@/lib/siteSearch";

/**
 * Sökresultat.
 *
 * Sidan var byggd innan märkets kulörer byttes och hade aldrig följt
 * med: vita kort med grå ramar, en tillbaka-knapp överst och ett
 * sökfält med två pixlars kant i primärfärgen. Mot den mörklila duken
 * blev korten vita fläckar.
 *
 * Två saker är mer än kosmetik:
 *
 *   Tillbaka-knappen är borta. Webbläsaren har redan en, och en egen
 *   som kallar navigate("/") går inte tillbaka utan till startsidan -
 *   den ljög alltså om vad den gjorde. Brödsmulorna i banderollen
 *   säger var man är i stället.
 *
 *   Tomma lägen ser ut som något och inte som en grå ruta med en rad
 *   text. Den som inte fick träffar ska få en väg vidare, inte ett
 *   konstaterande.
 */

const ACCENT = PAGE_BANNERS.search.accent;

/* Exempel som faktiskt finns i sortimentet. Ett exempel som inte ger
   träffar är sämre än inget exempel. */
const EXAMPLES = ["RTX 5080", "Ryzen 7", "budget", "paket"];

export default function SearchResults() {
  const [searchQuery, setSearchQuery] = useState("");
  const { products } = useProducts();
  const productLookup = useMemo(() => buildProductLookup(products), [products]);
  const catalog = useMemo(
    () =>
      buildSearchCatalog({
        computers: COMPUTERS,
        productLookup,
      }),
    [productLookup],
  );

  const searchState = useMemo(
    () =>
      buildSearchState({
        query: searchQuery,
        catalog,
        limit: 18,
      }),
    [catalog, searchQuery],
  );

  const hasTypedQuery = searchQuery.trim().length > 0;
  const hasResults = searchState.products.length > 0;

  return (
    <PageShell>
      <PageHero
        compact
        accent={ACCENT}
        sandboxId="search-hero"
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Sök" }]}
        eyebrow="Sök"
        title="Vad letar du efter?"
      />

      <section data-sandbox-id="search-body" className="relative">
        <div className="container mx-auto max-w-6xl px-4 pb-24 pt-8">
          {/* Sökfältet -------------------------------------------------- */}
          <Reveal className="max-w-2xl">
            <label htmlFor="site-search" className="sr-only">
              Sök efter dator, grafikkort, processor eller kategori
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="site-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Dator, grafikkort, processor eller kategori"
                className="field h-14 pl-12 text-base"
                autoFocus
              />
            </div>

            {/* Exemplen är klickbara. Att skriva ut ett exempel som man
                sedan måste knappa in själv är att visa vägen men låsa
                dörren. */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Prova:</span>
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setSearchQuery(example)}
                  className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  {example}
                </button>
              ))}
            </div>
          </Reveal>

          {searchState.correctedQuery && hasTypedQuery && (
            <p className="mt-6 text-sm text-muted-foreground">
              Visar närmaste träffar för{" "}
              <span className="font-semibold text-foreground">{searchQuery}</span>. Menade du{" "}
              <button
                type="button"
                className="font-semibold text-primary underline underline-offset-4 hover:text-foreground"
                onClick={() => setSearchQuery(searchState.correctedQuery || "")}
              >
                {searchState.correctedQuery}
              </button>
              ?
            </p>
          )}

          {/* Kategoriförslag -------------------------------------------- */}
          {searchState.categories.length > 0 && (
            <section className="mt-12">
              <h2 className="eyebrow" style={{ color: ACCENT }}>
                Kategoriförslag
              </h2>
              <ul className="mt-5 grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                {searchState.categories.map((category, index) => (
                  <Reveal as="li" key={category.id} delay={index * 60}>
                    <Link
                      to={category.path}
                      className="group flex items-center justify-between gap-4 border-b border-foreground/10 py-4 transition-colors hover:border-foreground/40"
                    >
                      <span className="min-w-0">
                        <span className="block font-display text-sm font-bold tracking-tight text-foreground">
                          {category.label}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                          {category.description}
                        </span>
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1"
                        style={{ color: ACCENT }}
                      />
                    </Link>
                  </Reveal>
                ))}
              </ul>
            </section>
          )}

          {/* Resultaten ------------------------------------------------- */}
          <section className="mt-12">
            {!hasTypedQuery ? (
              <EmptyState
                title="Börja skriva för att söka"
                body="Sök på ett produktnamn, en komponent eller en kategori. Vi letar i hela sortimentet."
              />
            ) : !hasResults ? (
              <EmptyState
                title={`Inga produkter matchade "${searchQuery}"`}
                body="Testa ett produktnamn, en komponent, eller välj en kategori ovan. Hittar du ändå inte rätt hjälper vi till."
                action={
                  <Link to="/kundservice" className="btn-secondary mt-7">
                    Fråga oss i stället
                  </Link>
                }
              />
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold tabular-nums text-foreground">
                    {searchState.products.length}
                  </span>{" "}
                  {searchState.products.length === 1 ? "träff" : "träffar"}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {searchState.products.map((result, index) => (
                    <Reveal key={result.id} delay={Math.min(index, 8) * 55}>
                      <Link
                        to={`/computer/${result.id}`}
                        className="card-lift group flex h-full flex-col overflow-hidden rounded-lg border border-foreground/10 bg-background/70"
                      >
                        <div className="media-zoom aspect-[4/3] bg-foreground/[0.05]">
                          {result.image ? (
                            <img
                              src={result.image}
                              alt={result.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : null}
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <h3 className="font-display text-base font-bold leading-snug tracking-tight text-foreground">
                            {result.name}
                          </h3>
                          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                            <li>{result.cpu}</li>
                            <li>{result.gpu}</li>
                            <li>{result.ram}</li>
                          </ul>
                          <p
                            className="mt-auto pt-5 font-display text-xl font-bold tabular-nums"
                            style={{ color: ACCENT }}
                          >
                            {result.price.toLocaleString("sv-SE")} kr
                          </p>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </PageShell>
  );
}

/**
 * Tomt läge.
 *
 * Samma form oavsett om man inte har skrivit något än eller inte fick
 * träffar - ikon, rubrik, en rad text och eventuellt en väg vidare.
 * Ingen ram: en inramad ruta mitt på en annars tom sida ser ut som ett
 * fel, medan samma text fritt på duken ser ut som ett tillstånd.
 */
const EmptyState = ({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) => (
  <Reveal className="flex flex-col items-center py-16 text-center">
    <span
      aria-hidden="true"
      className="flex h-14 w-14 items-center justify-center rounded-full"
      style={{ backgroundColor: ACCENT + "1A", color: ACCENT }}
    >
      <SearchX className="h-7 w-7" />
    </span>
    <h2 className="mt-6 font-display text-xl font-bold tracking-tight text-foreground">
      {title}
    </h2>
    <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
      {body}
    </p>
    {action}
  </Reveal>
);
