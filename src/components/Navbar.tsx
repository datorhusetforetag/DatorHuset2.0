import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Menu, Search, ShieldCheck, ShoppingCart } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LoginButton } from "@/components/LoginButton";
import { useCart } from "@/context/CartContext";
import { COMPUTERS } from "@/data/computers";
import { useProducts } from "@/hooks/useProducts";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildProductLookup } from "@/lib/productOverrides";
import { buildSearchCatalog, buildSearchState } from "@/lib/siteSearch";
import { Wordmark } from "./Wordmark";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { getPreviewPathOverride } from "@/lib/previewMode";

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
  const { settings } = useSiteSettings();
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
  const previewPathOverride = getPreviewPathOverride();
  const effectivePathname = previewPathOverride ? previewPathOverride.split("?")[0] || "/" : location.pathname;
  const shouldShowBackButton = effectivePathname !== "/";
  const isAdmin = Boolean(user?.app_metadata?.role === "admin" || user?.app_metadata?.is_admin);
  const navigation = settings.site.navigation;
  const navigationLogo = navigation.logoUrl?.trim() || "/datorhuset-mark-small.png";

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
    if (cartHoverTimer.current) clearTimeout(cartHoverTimer.current);
    setShowCartPreview(true);
  };

  const handleCartLeave = () => {
    if (cartHoverTimer.current) clearTimeout(cartHoverTimer.current);
    cartHoverTimer.current = setTimeout(() => setShowCartPreview(false), 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideSearch =
        desktopSearchRef.current?.contains(target) || mobileSearchRef.current?.contains(target);
      const insideMenu =
        navMenuDesktopRef.current?.contains(target) || navMenuMobileRef.current?.contains(target);

      if (!insideSearch) setShowSearchResults(false);
      if (!insideMenu) setShowNavMenu(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderSearchDropdown = (isMobile = false) => {
    if (!showSearchResults || !hasSearchEntries) return null;
    const firstProduct = searchState.products[0];

    return (
      <div
        className={`absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-900 shadow-lg z-50 dark:border-foreground/20 dark:bg-foreground/[0.06] dark:text-foreground ${
          isMobile ? "max-h-[70vh] overflow-y-auto" : ""
        }`}
      >
        {searchState.correctedQuery && (
          <div className="border-b border-gray-200 px-4 py-2 text-xs text-gray-600 dark:border-foreground/20 dark:text-muted-foreground">
            Visar närmaste träffar för <span className="font-semibold">{searchInput}</span>. Menade du{" "}
            <button
              type="button"
              onMouseDown={() => handleSelectSearch(firstProduct?.id || "")}
              className="font-semibold text-primary hover:underline"
              disabled={!firstProduct}
            >
              {searchState.correctedQuery}
            </button>
            ?
          </div>
        )}

        {searchState.categories.length > 0 && (
          <div className="border-b border-foreground/10">
            <p className="px-4 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-muted-foreground">
              Kategoriförslag
            </p>
            <div className="px-2 pb-2">
              {searchState.categories.map((category) => (
                <button
                  key={category.id}
                  onMouseDown={() => handleSelectCategory(category.path)}
                  className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-foreground/[0.09]"
                >
                  <span className="block text-sm font-semibold text-foreground">{category.label}</span>
                  <span className="block text-xs text-muted-foreground">{category.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {searchState.products.length > 0 && (
          <div>
            <p className="px-4 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-muted-foreground">
              Produkter
            </p>
            <div className="pb-2">
              {searchState.products.map((result) => (
                <button
                  key={result.id}
                  onMouseDown={() => handleSelectSearch(result.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-foreground/[0.09]"
                >
                  {result.image ? (
                    <img
                      src={result.image}
                      alt={result.name}
                      className="h-12 w-12 rounded-md bg-gray-100 object-cover dark:bg-background"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-foreground/[0.06]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{result.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {result.cpu} | {result.gpu} | {result.ram}
                    </span>
                    <span className="block text-sm font-bold text-foreground">
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

  const renderMenuLinks = () =>
    navigation.menuItems.map((item) => (
      <Link
        key={`${item.label}-${item.href}`}
        to={item.href}
        onClick={() => setShowNavMenu(false)}
        className="block border-l-2 border-transparent px-4 py-3 text-sm font-semibold transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
      >
        {item.label}
      </Link>
    ));

  return (
    <nav data-sandbox-id="global-chrome" className="sticky left-0 right-0 top-0 z-50 overflow-visible backdrop-blur supports-[backdrop-filter]:backdrop-blur">
      <div
        className="border-b shadow-sm"
        style={{
          borderColor: "var(--site-card-border-current)",
          backgroundColor: "var(--site-surface-bg-current)",
          color: "var(--site-text-primary-current)",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex w-full flex-col gap-3 py-3 lg:h-20 lg:flex-row lg:items-center lg:gap-4">
            <div className="flex items-center justify-between gap-3 lg:contents">
              <div className="flex min-w-0 items-center gap-2 lg:order-1">
                {shouldShowBackButton && (
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="Tillbaka"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border transition-opacity hover:opacity-85 lg:hidden"
                    style={{ borderColor: "var(--site-card-border-current)", color: "var(--site-text-primary-current)" }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <Link
                  to="/"
                  className="flex min-w-0 flex-shrink-0 items-center gap-2 text-base font-bold sm:text-xl"
                  style={{ color: "var(--site-text-primary-current)" }}
                >
                  <img src={navigationLogo} alt={navigation.brandName} className="h-9 w-9 object-contain sm:h-12 sm:w-12" loading="eager" decoding="async" />
                  <Wordmark
                    name={navigation.brandName}
                    className="max-w-[140px] truncate font-[Orbitron] sm:max-w-none"
                  />
                </Link>
              </div>

              <div className="flex items-center gap-2 lg:order-4">
                {isAdmin && (
                  <a
                    href={navigation.adminPortalHref}
                    className="hidden sm:inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-85"
                    style={{ borderColor: "var(--site-card-border-current)", color: "var(--site-text-primary-current)" }}
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
                    className="relative flex flex-col items-center transition-opacity hover:opacity-85"
                    style={{ color: "var(--site-text-primary-current)" }}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span className="hidden text-[11px] sm:block">Kundvagn</span>
                    {totalItems > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {totalItems > 9 ? "9+" : totalItems}
                      </span>
                    )}
                  </button>
                  {showCartPreview && (
                    <div
                      className="absolute right-0 z-50 mt-2 w-72 rounded border p-4 shadow-lg"
                      style={{
                        borderColor: "var(--site-card-border-current)",
                        backgroundColor: "var(--site-card-bg-current)",
                        color: "var(--site-text-primary-current)",
                      }}
                    >
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Kundvagnen är tom.</p>
                      ) : (
                        <>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="truncate pr-2 text-foreground">
                                  {item.product?.name || "Produkt"} x{item.quantity}
                                </span>
                                <span className="font-semibold text-foreground">
                                  {((item.product?.price_cents || 0) * item.quantity / 100).toLocaleString("sv-SE")} kr
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 flex justify-between text-sm font-semibold text-foreground">
                            <span>Totalt</span>
                            <span>{(totalPrice / 100).toLocaleString("sv-SE")} kr</span>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => navigate("/cart")}
                              className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 dark:border-foreground/20 dark:text-foreground dark:hover:bg-foreground/[0.09]"
                            >
                              Gå till kundvagn
                            </button>
                            <button
                              onClick={() => navigate("/checkout")}
                              className="flex-1 rounded bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-secondary"
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
                className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-gray-900 transition-colors hover:border-secondary hover:text-primary dark:border-foreground/20 dark:text-white"
              >
                <Menu className="h-5 w-5" />
                <span className="text-sm font-semibold">{navigation.menuLabel}</span>
              </button>
              {showNavMenu && (
                <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-900 shadow-lg dark:border-foreground/20 dark:bg-background dark:text-foreground">
                  {renderMenuLinks()}
                </div>
              )}
            </div>

            <div className="mx-8 hidden max-w-2xl flex-1 lg:order-3 lg:flex">
              <div ref={desktopSearchRef} className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-primary" />
                <input
                  type="text"
                  placeholder={navigation.searchPlaceholder}
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      if (searchState.products[0]) {
                        handleSelectSearch(searchState.products[0].id);
                        return;
                      }
                      if (searchState.categories[0]) handleSelectCategory(searchState.categories[0].path);
                    }
                  }}
                  className="h-12 w-full rounded-lg border-2 border-primary pl-11 pr-4 text-sm text-gray-900 transition-all placeholder:text-gray-500 focus:border-primary focus:outline-none dark:border-foreground/20 dark:bg-foreground/[0.06] dark:text-foreground dark:placeholder:text-muted-foreground dark:focus:border-primary"
                />
                {renderSearchDropdown(false)}
              </div>
            </div>
          </div>

          <div className="pb-4 lg:hidden">
            <div className="flex items-center gap-2" ref={navMenuMobileRef}>
              <div className="relative">
                <button
                  type="button"
                  aria-label="Öppna meny"
                  onClick={() => setShowNavMenu((prev) => !prev)}
                  className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-gray-900 transition-colors hover:border-secondary hover:text-primary dark:border-foreground/20 dark:text-white"
                >
                  <Menu className="h-5 w-5" />
                  <span className="text-sm font-semibold">{navigation.menuLabel}</span>
                </button>
                {showNavMenu && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-900 shadow-lg dark:border-foreground/20 dark:bg-background dark:text-foreground">
                    {renderMenuLinks()}
                  </div>
                )}
              </div>

              <div ref={mobileSearchRef} className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  placeholder={navigation.searchPlaceholder}
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      if (searchState.products[0]) {
                        handleSelectSearch(searchState.products[0].id);
                        return;
                      }
                      if (searchState.categories[0]) handleSelectCategory(searchState.categories[0].path);
                    }
                  }}
                  className="h-11 w-full rounded-lg border-2 border-primary pl-11 pr-4 text-sm text-gray-900 transition-all placeholder:text-gray-500 focus:border-primary focus:outline-none dark:border-foreground/20 dark:bg-foreground/[0.06] dark:text-foreground dark:placeholder:text-muted-foreground"
                />
                {renderSearchDropdown(true)}
              </div>

              {isAdmin && (
                <a
                  href={navigation.adminPortalHref}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-900 transition-colors hover:border-secondary hover:text-primary dark:border-foreground/20 dark:text-white"
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
