import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { COMPUTERS } from "@/data/computers";
import { useProducts } from "@/hooks/useProducts";
import { buildProductLookup } from "@/lib/productOverrides";
import { buildSearchCatalog, buildSearchState } from "@/lib/siteSearch";

export default function SearchResults() {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20 sm:pt-24">
        <div className="container mx-auto px-4 py-10">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 mb-6 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold hover:border-[#11667b] hover:text-[#11667b] dark:border-gray-700 dark:hover:border-[#11667b]"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka
          </button>

          <div className="max-w-3xl">
            <label className="text-xs uppercase tracking-[0.22em] text-gray-500 dark:text-gray-300">Sök</label>
            <div className="relative mt-2">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Sök efter dator, grafikkort, processor eller kategori"
                className="h-12 w-full rounded-xl border-2 border-yellow-400 bg-white pl-12 pr-4 text-sm outline-none focus:border-yellow-500 dark:border-gray-600 dark:bg-gray-900"
                autoFocus
              />
            </div>
          </div>

          {searchState.correctedQuery && hasTypedQuery && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              Visar närmaste träffar för <span className="font-semibold">{searchQuery}</span>. Menade du{" "}
              <button
                type="button"
                className="font-semibold text-[#11667b] hover:underline"
                onClick={() => setSearchQuery(searchState.correctedQuery || "")}
              >
                {searchState.correctedQuery}
              </button>
              ?
            </p>
          )}

          {searchState.categories.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-300">
                Kategoriförslag
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {searchState.categories.map((category) => (
                  <Link
                    key={category.id}
                    to={category.path}
                    className="rounded-xl border border-gray-200 bg-white p-4 hover:border-[#11667b] hover:shadow-sm dark:border-gray-700 dark:bg-gray-900"
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{category.label}</p>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{category.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            {hasTypedQuery && !hasResults ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
                <p className="text-base font-semibold">Inga produkter matchade "{searchQuery}".</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Testa ett produktnamn, en komponent eller välj en kategori ovan.
                </p>
              </div>
            ) : !hasTypedQuery ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
                <p className="text-base font-semibold">Börja skriva för att söka</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Exempel: RTX 5080, Ryzen 7, budget eller paket.
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                  {searchState.products.length} produktresultat
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {searchState.products.map((result) => (
                    <Link
                      key={result.id}
                      to={`/computer/${result.id}`}
                      className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-[#11667b] hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                    >
                      <div className="h-44 bg-gray-100 dark:bg-gray-800">
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
                      <div className="p-4">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{result.name}</h3>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{result.cpu}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{result.gpu}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{result.ram}</p>
                        <p className="mt-3 text-xl font-bold text-gray-900 dark:text-gray-100">
                          {result.price.toLocaleString("sv-SE")} kr
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
