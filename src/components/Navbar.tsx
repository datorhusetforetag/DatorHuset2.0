import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Menu, Search, ShieldCheck, ShoppingCart } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LoginButton } from "@/components/LoginButton";
import { useCart } from "@/context/CartContext";
import { COMPUTERS } from "@/data/computers";
import { useProducts } from "@/hooks/useProducts";
import { buildProductLookup } from "@/lib/productOverrides";
import { buildSearchCatalog, buildSearchState } from "@/lib/siteSearch";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/context/AuthContext";

export const Navbar = () => {
  const [searchInput, setSearchInput] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const navMenuDesktopRef = useRef<HTMLDivElement>(null);
  const navMenuMobileRef = useRef<HTMLDivElement>(null);
  const cartHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems, items, totalPrice } = useCart();
  const { user } = useAuth();
  const { products } = useProducts();
  const productLookup = useMemo(() => buildProductLookup(products), [products]);
  const searchCatalog = useMemo(
    () =>
      buildSearchCatalog({
        computers: COMPUTERS,
        productLookup,
      }),
    [productLookup],
  );
  const showBackButton = location.pathname !== "/";
  const isAdmin = Boolean(user?.app_metadata?.role === "admin" || user?.app_metadata?.is_admin);

  const searchState = useMemo(
    () =>
      buildSearchState({
        query: searchInput,
        catalog: searchCatalog,
        limit: 6,
      }),
    [searchCatalog, searchInput],
  );

  const hasSearchEntries =
    searchState.products.length > 0 ||
    searchState.categories.length > 0 ||
    Boolean(searchState.correctedQuery);

  const handleSelectSearch = (id: string) => {
    navigate(`/computer/${id}`);
    setSearchInput("");
    setShowSearchResults(false);
  };

  const handleSelectCategory = (path: string) => {
    navigate(path);
    setSearchInput("");
    setShowSearchResults(false);
  };

  const handleCartEnter = () => {
    if (cartHoverTimer.current) {
      clearTimeout(cartHoverTimer.current);
    }
    setShowCartPreview(true);
  };

  const handleCartLeave = () => {
    if (cartHoverTimer.current) {
      clearTimeout(cartHoverTimer.current);
    }
    cartHoverTimer.current = setTimeout(() => setShowCartPreview(false), 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideSearch =
        desktopSearchRef.current?.contains(target) || mobileSearchRef.current?.contains(target);
      const insideMenu =
        navMenuDesktopRef.current?.contains(target) || navMenuMobileRef.current?.contains(target);

      if (!insideSearch) {
        setShowSearchResults(false);
      }
      if (!insideMenu) {
        setShowNavMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderSearchDropdown = (isMobile = false) => {
    if (!showSearchResults || !hasSearchEntries) return null;
    const firstProduct = searchState.products[0];

    return (
      <div
        className={`absolute left-0 right-0 top-full mt-2 rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:border-gray-700 ${
          isMobile ? "max-h-[70vh] overflow-y-auto" : ""
        }`}
      >
        {searchState.correctedQuery && (
          <div className="px-4 py-2 text-xs border-b border-gray-200 text-gray-600 dark:text-gray-300 dark:border-gray-700">
            Visar närmaste träffar för <span className="font-semibold">{searchInput}</span>. Menade du{" "}
            <button
              type="button"
              onMouseDown={() => handleSelectSearch(firstProduct?.id || "")}
              className="font-semibold text-[#11667b] hover:underline"
              disabled={!firstProduct}
            >
              {searchState.correctedQuery}
            </button>
            ?
          </div>
        )}

        {searchState.categories.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <p className="px-4 pt-3 pb-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-gray-500 dark:text-gray-300">
              Kategoriförslag
            </p>
            <div className="px-2 pb-2">
              {searchState.categories.map((category) => (
                <button
                  key={category.id}
                  onMouseDown={() => handleSelectCategory(category.path)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">{category.label}</span>
                  <span className="block text-xs text-gray-600 dark:text-gray-300">{category.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {searchState.products.length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-gray-500 dark:text-gray-300">
              Produkter
            </p>
            <div className="pb-2">
              {searchState.products.map((result) => (
                <button
                  key={result.id}
                  onMouseDown={() => handleSelectSearch(result.id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 dark:hover:bg-gray-700"
                >
                  {result.image ? (
                    <img
                      src={result.image}
                      alt={result.name}
                      className="h-12 w-12 rounded-md object-cover bg-gray-100 dark:bg-gray-900"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-gray-100 dark:bg-gray-900" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 block truncate">
                      {result.name}
                    </span>
                    <span className="text-xs text-gray-600 truncate dark:text-gray-300 block">
                      {result.cpu} | {result.gpu} | {result.ram}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 block">
                      {result.price.toLocaleString("sv-SE")} kr
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 backdrop-blur supports-[backdrop-filter]:backdrop-blur overflow-visible">
      <div className="bg-white text-gray-900 border-b border-gray-200 shadow-sm dark:bg-background dark:text-white dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:gap-4 lg:h-20 w-full">
            <div className="flex items-center justify-between gap-3 lg:contents">
              <div className="flex items-center gap-2 min-w-0 lg:order-1">
                {showBackButton && (
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="Tillbaka"
                    className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-900 hover:text-[#11667b] hover:border-[#11667b] transition-colors dark:text-white dark:border-gray-700"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <Link
                  to="/"
                  className="flex items-center gap-2 font-bold text-base sm:text-xl flex-shrink-0 text-gray-900 dark:text-white min-w-0"
                >
                  <img
                    src="/Datorhuset.png"
                    alt="DatorHuset"
                    className="w-9 h-9 sm:w-12 sm:h-12 object-contain"
                    loading="eager"
                    decoding="async"
                  />
                  <span className="font-[Orbitron] truncate max-w-[140px] sm:max-w-none">DatorHuset</span>
                </Link>
              </div>

              <div className="flex items-center gap-2 lg:order-4">
                {isAdmin && (
                  <a
                    href="https://admin.datorhuset.site"
                    className="hidden sm:inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-900 transition-colors hover:border-[#11667b] hover:text-[#11667b] dark:border-gray-700 dark:text-white"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </a>
                )}
                <ThemeToggle />
                <LoginButton />
                <div className="relative" onMouseEnter={handleCartEnter} onMouseLeave={handleCartLeave}>
                  <button
                    onClick={() => navigate("/cart")}
                    className="relative flex flex-col items-center text-gray-900 hover:text-[#11667b] transition-colors dark:text-white"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="text-[11px] hidden sm:block">Kundvagn</span>
                    {totalItems > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                        {totalItems > 9 ? "9+" : totalItems}
                      </span>
                    )}
                  </button>
                  {showCartPreview && (
                    <div className="absolute right-0 mt-2 w-72 bg-white text-gray-900 rounded shadow-lg border border-gray-200 p-4 z-50 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
                      {items.length === 0 ? (
                        <p className="text-sm text-gray-600 dark:text-gray-300">Kundvagnen är tom.</p>
                      ) : (
                        <>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-700 truncate pr-2 dark:text-gray-200">
                                  {item.product?.name || "Produkt"} x{item.quantity}
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {((item.product?.price_cents || 0) * item.quantity / 100).toLocaleString("sv-SE")} kr
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                            <span>Totalt</span>
                            <span>{(totalPrice / 100).toLocaleString("sv-SE")} kr</span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => navigate("/cart")}
                              className="flex-1 px-3 py-2 text-sm font-semibold text-gray-900 border border-gray-200 rounded hover:bg-gray-50 transition-colors dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                            >
                              Gå till kundvagn
                            </button>
                            <button
                              onClick={() => navigate("/checkout")}
                              className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-yellow-500 hover:bg-[#11667b] rounded transition-colors"
                            >
                              Kassa
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div ref={navMenuDesktopRef} className="relative hidden lg:flex lg:order-2">
              <button
                type="button"
                aria-label="Öppna meny"
                onClick={() => setShowNavMenu((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 text-gray-900 hover:text-[#11667b] hover:border-[#11667b] transition-colors dark:text-white dark:border-gray-700"
              >
                <Menu className="w-5 h-5" />
                <span className="text-sm font-semibold">Meny</span>
              </button>
              {showNavMenu && (
                <div className="absolute left-0 top-full mt-2 w-64 rounded-lg border border-gray-200 bg-white text-gray-900 shadow-lg overflow-hidden z-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                  <Link
                    to="/products"
                    onClick={() => setShowNavMenu(false)}
                    className="block px-4 py-3 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Alla produkter
                  </Link>
                  <Link
                    to="/custom-bygg"
                    onClick={() => setShowNavMenu(false)}
                    className="block px-4 py-3 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Custom Bygg
                  </Link>
                  <Link
                    to="/service-reparation"
                    onClick={() => setShowNavMenu(false)}
                    className="block px-4 py-3 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Service & Reparation
                  </Link>
                  <Link
                    to="/kundservice"
                    onClick={() => setShowNavMenu(false)}
                    className="block px-4 py-3 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Kundservice & Kontakta oss
                  </Link>
                </div>
              )}
            </div>

            <div className="hidden lg:flex flex-1 max-w-2xl mx-8 lg:order-3">
              <div ref={desktopSearchRef} className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-yellow-300" />
                <input
                  type="text"
                  placeholder="Sök bland produkter, komponenter och kategorier"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (searchState.products[0]) {
                        handleSelectSearch(searchState.products[0].id);
                        return;
                      }
                      if (searchState.categories[0]) {
                        handleSelectCategory(searchState.categories[0].path);
                      }
                    }
                  }}
                  className="w-full h-12 pl-11 pr-4 border-2 border-yellow-400 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 transition-all dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-300 dark:border-gray-600 dark:focus:border-yellow-400"
                />
                {renderSearchDropdown(false)}
              </div>
            </div>

          </div>

          <div className="lg:hidden pb-4">
            <div className="flex items-center gap-2" ref={navMenuMobileRef}>
              <div className="relative">
                <button
                  type="button"
                  aria-label="Öppna meny"
                  onClick={() => setShowNavMenu((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 text-gray-900 hover:text-[#11667b] hover:border-[#11667b] transition-colors dark:text-white dark:border-gray-700"
                >
                  <Menu className="w-5 h-5" />
                  <span className="text-sm font-semibold">Meny</span>
                </button>
                {showNavMenu && (
                  <div className="absolute left-0 top-full mt-2 w-64 rounded-lg border border-gray-200 bg-white text-gray-900 shadow-lg overflow-hidden z-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                    <Link
                      to="/products"
                      onClick={() => setShowNavMenu(false)}
                      className="block px-4 py-3 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Alla produkter
                    </Link>
                    <Link
                      to="/custom-bygg"
                      onClick={() => setShowNavMenu(false)}
                      className="block px-4 py-3 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Custom Bygg
                    </Link>
                    <Link
                      to="/service-reparation"
                      onClick={() => setShowNavMenu(false)}
                      className="block px-4 py-3 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Service & Reparation
                    </Link>
                    <Link
                      to="/kundservice"
                      onClick={() => setShowNavMenu(false)}
                      className="block px-4 py-3 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Kundservice & Kontakta oss
                    </Link>
                  </div>
                )}
              </div>

              <div ref={mobileSearchRef} className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400" />
                <input
                  type="text"
                  placeholder="Sök bland produkter, komponenter och kategorier"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (searchState.products[0]) {
                        handleSelectSearch(searchState.products[0].id);
                        return;
                      }
                      if (searchState.categories[0]) {
                        handleSelectCategory(searchState.categories[0].path);
                      }
                    }
                  }}
                  className="w-full h-11 pl-11 pr-4 border-2 border-yellow-400 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 transition-all dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-300 dark:border-gray-600"
                />
                {renderSearchDropdown(true)}
              </div>

              {isAdmin && (
                <a
                  href="https://admin.datorhuset.site"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-900 transition-colors hover:border-[#11667b] hover:text-[#11667b] dark:border-gray-700 dark:text-white"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
