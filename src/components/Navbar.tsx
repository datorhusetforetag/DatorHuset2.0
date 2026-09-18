import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { productPath } from "@/lib/productUrl";
import {
  ArrowLeft,
  ChevronDown,
  Menu,
  Search,
  ShieldCheck,
  ShoppingCart,
  X,
} from "lucide-react";
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

/**
 * Sidhuvudet: en rad.
 *
 * Formen är Starforge Systems - logotypen till vänster, menyn i mitten,
 * ikonerna till höger.
 *
 * Deras huvud har också en kulörad remsa överst med ett erbjudande. Den
 * fanns här ett tag och är borttagen igen. En sådan remsa är till för
 * att ropa ut något som är nytt just nu, och har man inget att ropa ut
 * blir den en rad som alltid står där och säger samma sak - alltså
 * något ögat slutar se efter andra besöket, men som ändå tar plats
 * överst på varje sida. Vill du ha tillbaka den när det finns en riktig
 * kampanj att visa ligger den i historiken.
 *
 * VAD SOM ÄNDRADES OCH VARFÖR
 *
 * Det gamla huvudet ägnade halva bredden åt ett alltid utfällt sökfält
 * och gömde hela sortimentet bakom en hamburgare som hette "Meny" -
 * även på en bred skärm där det fanns gott om plats. Man kunde alltså
 * inte se vad butiken säljer utan att först klicka. Nu ligger de fem
 * ingångarna framme, och sökningen har krympt till en ikon som fäller
 * ut ett fält. Sökning är något man gör ibland; se sortimentet är
 * något man gör alltid.
 *
 * MENYNS FORM
 *
 * De fyra första posterna är strukturella - de beskriver vad DatorHuset
 * gör och ska inte gå att redigera bort. "Mer" är uppsamlingen, och dit
 * läggs det som står i inställningarnas menyItems och som inte redan
 * finns någon annanstans i raden. Adminläget behåller alltså sin krok
 * utan att kunna skapa dubbletter.
 *
 * UNDERMENYERNA öppnas både vid hovring och vid klick, och stängs med
 * Escape. Bara hovring hade gjort dem omöjliga att nå med tangentbord;
 * bara klick hade känts trögt med mus. Varje knapp har aria-expanded,
 * så en skärmläsare vet om menyn står öppen.
 *
 * EN RAD. Den gamla mobilvyn hade tre: logotyp, sökfält och meny, och
 * åt upp en fjärdedel av skärmen innan innehållet ens börjat.
 */

/* ------------------------------------------------------------------ *
 * Menyn
 * ------------------------------------------------------------------ */

type NavLeaf = {
  label: string;
  href: string;
  /** En rad som förklarar vad man får. Visas i undermenyn. */
  hint?: string;
};

type NavEntry = NavLeaf & {
  items?: NavLeaf[];
};

/*
 * Lagerstatusen är en riktig fråga i en butik som både har hyllvaror
 * och bygger på beställning, så den styr menyns två första poster i
 * stället för att gömmas i ett filter långt ned i vänsterspalten.
 *
 * clear_filters=1 följer med överallt. Utan den ligger det man filtrerat
 * fram förra besöket kvar i localStorage, och "Alla datorer" hade då
 * visat allt utom det man råkat bocka bort i förrgår.
 */
const READY_TO_SHIP = "/products?stock=in-stock&clear_filters=1";
const PREORDER = "/products?stock=preorder&clear_filters=1";

const purposeLinks = (base: string): NavLeaf[] => [
  { label: "Alla datorer", href: base, hint: "Hela sortimentet" },
  { label: "Gaming datorer", href: `${base}&use=gaming`, hint: "Byggda för spel" },
  { label: "Workstation", href: `${base}&use=workstation`, hint: "Byggda för arbete" },
];

const NAV: NavEntry[] = [
  {
    label: "Redo att skickas",
    href: READY_TO_SHIP,
    items: purposeLinks(READY_TO_SHIP),
  },
  {
    label: "Preorder",
    href: PREORDER,
    items: purposeLinks(PREORDER),
  },
  { label: "Custom bygg", href: "/custom-bygg" },
  { label: "Service & reparation", href: "/service-reparation" },
  {
    label: "Mer",
    href: "/kundservice",
    items: [
      { label: "Vanliga frågor", href: "/faq", hint: "Svar på det som oftast frågas" },
      { label: "Kundservice", href: "/kundservice", hint: "Mejla oss eller läs våra tider" },
      { label: "Om oss", href: "/about", hint: "Vilka vi är och hur vi bygger" },
      { label: "Mina beställningar", href: "/orders", hint: "Status och kvitton" },
      { label: "Ångerrätt och returer", href: "/angerratt-och-returer" },
      { label: "Köpvillkor", href: "/terms-of-service" },
      { label: "Integritetspolicy", href: "/privacy-policy" },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Komponenten
 * ------------------------------------------------------------------ */

export const Navbar = () => {
  const [searchInput, setSearchInput] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showCartPreview, setShowCartPreview] = useState(false);

  const searchPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navRowRef = useRef<HTMLDivElement>(null);
  const cartHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems, items, totalPrice } = useCart();
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const { products } = useProducts();

  const productLookup = useMemo(() => buildProductLookup(products), [products]);
  const searchCatalog = useMemo(
    () => buildSearchCatalog({ computers: COMPUTERS, productLookup }),
    [productLookup],
  );

  const previewPathOverride = getPreviewPathOverride();
  const effectivePathname = previewPathOverride
    ? previewPathOverride.split("?")[0] || "/"
    : location.pathname;
  const shouldShowBackButton = effectivePathname !== "/";
  const isAdmin = Boolean(
    user?.app_metadata?.role === "admin" || user?.app_metadata?.is_admin,
  );

  const navigation = settings.site.navigation;
  const navigationLogo = navigation.logoUrl?.trim() || "/datorhuset-mark-small.png";

  /*
   * Menyn = den fasta raden plus det adminläget lagt till.
   *
   * Standardinställningarna pekar på sidor som nu har egna poster i
   * raden ("Alla produkter", "Custom Bygg"), så de skulle blivit
   * dubbletter under Mer. Därför jämförs sökvägen - inte etiketten,
   * eftersom samma sida kan heta olika på två ställen.
   */
  const navEntries = useMemo<NavEntry[]>(() => {
    const known = new Set<string>();
    for (const entry of NAV) {
      known.add(entry.href.split("?")[0]);
      for (const item of entry.items ?? []) known.add(item.href.split("?")[0]);
    }

    const extras = (navigation.menuItems ?? []).filter(
      (item) => item.href && !known.has(item.href.split("?")[0]),
    );

    if (extras.length === 0) return NAV;

    return NAV.map((entry) =>
      entry.label === "Mer"
        ? { ...entry, items: [...(entry.items ?? []), ...extras] }
        : entry,
    );
  }, [navigation.menuItems]);

  const searchState = useMemo(
    () => buildSearchState({ query: searchInput, catalog: searchCatalog, limit: 6 }),
    [searchCatalog, searchInput],
  );

  const hasSearchEntries =
    searchState.products.length > 0 ||
    searchState.categories.length > 0 ||
    Boolean(searchState.correctedQuery);

  const closeEverything = useCallback(() => {
    setOpenMenu(null);
    setSearchOpen(false);
    setShowSearchResults(false);
    setMobileOpen(false);
  }, []);

  /* Ett sidbyte ska alltid lämna huvudet stängt. Annars ligger
     undermenyn kvar och skuggar den sida man just valde. */
  useEffect(() => {
    closeEverything();
  }, [location.pathname, location.search, closeEverything]);

  /* Escape stänger det översta öppna lagret. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (openMenu) setOpenMenu(null);
      else if (searchOpen) setSearchOpen(false);
      else if (mobileOpen) setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openMenu, searchOpen, mobileOpen]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!navRowRef.current?.contains(target)) setOpenMenu(null);
      if (!searchPanelRef.current?.contains(target)) setShowSearchResults(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  /* Fältet ska ha markören så fort det fällts ut - annars måste man
     klicka två gånger för att skriva ett ord. */
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  /* Menyn är öppen ovanpå sidan på telefon, så sidan under ska inte
     kunna rullas bakom den. */
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(
    () => () => {
      if (cartHoverTimer.current) clearTimeout(cartHoverTimer.current);
      if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    },
    [],
  );

  const handleSelectSearch = (id: string) => {
    /* Sluggen byggs ur namnet, inte ur id:t. Se src/lib/productUrl.ts. */
    const hit = searchState.products.find((product) => product.id === id);
    navigate(hit ? productPath(hit) : `/computer/${id}`);
    setSearchInput("");
    setShowSearchResults(false);
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const handleSelectCategory = (path: string) => {
    navigate(path);
    setSearchInput("");
    setShowSearchResults(false);
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const submitSearch = () => {
    if (searchState.products[0]) {
      handleSelectSearch(searchState.products[0].id);
      return;
    }
    if (searchState.categories[0]) {
      handleSelectCategory(searchState.categories[0].path);
      return;
    }
    if (searchInput.trim()) navigate("/search");
  };

  /* Liten fördröjning när musen lämnar. Utan den slocknar undermenyn
     i glappet mellan knappen och panelen. */
  const openMenuNow = (label: string) => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    setOpenMenu(label);
  };

  const closeMenuSoon = () => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    menuCloseTimer.current = setTimeout(() => setOpenMenu(null), 140);
  };

  const handleCartEnter = () => {
    if (cartHoverTimer.current) clearTimeout(cartHoverTimer.current);
    setShowCartPreview(true);
  };

  const handleCartLeave = () => {
    if (cartHoverTimer.current) clearTimeout(cartHoverTimer.current);
    cartHoverTimer.current = setTimeout(() => setShowCartPreview(false), 200);
  };

  /* ---------------------------------------------------------------- *
   * Sökträffarna
   * ---------------------------------------------------------------- */

  const renderSearchResults = () => {
    if (!showSearchResults || !hasSearchEntries) return null;
    const firstProduct = searchState.products[0];

    return (
      <div className="mt-3 max-h-[60vh] overflow-y-auto overflow-hidden rounded-lg border border-foreground/10 bg-background shadow-xl">
        {searchState.correctedQuery && (
          <div className="border-b border-foreground/10 px-4 py-2 text-xs text-muted-foreground">
            Visar närmaste träffar för{" "}
            <span className="font-semibold text-foreground">{searchInput}</span>. Menade du{" "}
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
            <p className="px-4 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Kategoriförslag
            </p>
            <div className="px-2 pb-2">
              {searchState.categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onMouseDown={() => handleSelectCategory(category.path)}
                  className="w-full rounded-sm px-3 py-2 text-left transition-colors hover:bg-foreground/[0.06]"
                >
                  <span className="block text-sm font-semibold text-foreground">
                    {category.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {category.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {searchState.products.length > 0 && (
          <div>
            <p className="px-4 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Produkter
            </p>
            <div className="pb-2">
              {searchState.products.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onMouseDown={() => handleSelectSearch(result.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.06]"
                >
                  {result.image ? (
                    <img
                      src={result.image}
                      alt=""
                      aria-hidden="true"
                      className="h-12 w-12 rounded-sm bg-foreground/[0.06] object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-sm bg-foreground/[0.06]" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {result.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {result.cpu} | {result.gpu} | {result.ram}
                    </span>
                    <span className="block text-sm font-bold text-foreground">
                      {result.price.toLocaleString("sv-SE")} kr
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const searchField = (autoFocusRef?: boolean) => (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        ref={autoFocusRef ? searchInputRef : undefined}
        type="search"
        value={searchInput}
        placeholder={navigation.searchPlaceholder}
        onChange={(event) => {
          setSearchInput(event.target.value);
          setShowSearchResults(true);
        }}
        onFocus={() => setShowSearchResults(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submitSearch();
        }}
        className="field h-12 pl-11"
      />
    </div>
  );

  /* ---------------------------------------------------------------- *
   * Huvudet
   * ---------------------------------------------------------------- */

  return (
    <nav
      data-sandbox-id="global-chrome"
      className="sticky left-0 right-0 top-0 z-50"
    >
      {/* Raden ------------------------------------------------------- */}
      <div className="site-nav-bar">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-3 lg:h-[4.5rem]">
            {/* Vänster: tillbaka på telefon, sedan logotypen */}
            {shouldShowBackButton && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Tillbaka"
                className="site-nav-bar__icon lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            <Link
              to="/"
              className="flex min-w-0 shrink-0 items-center gap-2 text-foreground"
            >
              <img
                src={navigationLogo}
                alt=""
                aria-hidden="true"
                className="h-8 w-8 object-contain sm:h-10 sm:w-10"
                loading="eager"
                decoding="async"
              />
              <Wordmark
                name={navigation.brandName}
                className="truncate font-[Orbitron] text-base font-bold tracking-tight sm:text-lg"
              />
            </Link>

            {/* Mitten: menyn */}
            <div
              ref={navRowRef}
              className="ml-6 hidden min-w-0 flex-1 items-center gap-1 lg:flex xl:gap-2"
            >
              {navEntries.map((entry) => {
                const hasItems = Boolean(entry.items?.length);
                const isOpen = openMenu === entry.label;

                if (!hasItems) {
                  return (
                    <Link key={entry.label} to={entry.href} className="site-nav-link">
                      {entry.label}
                    </Link>
                  );
                }

                return (
                  <div
                    key={entry.label}
                    className="relative"
                    onMouseEnter={() => openMenuNow(entry.label)}
                    onMouseLeave={closeMenuSoon}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      onClick={() => setOpenMenu(isOpen ? null : entry.label)}
                      className="site-nav-link"
                      data-open={isOpen || undefined}
                    >
                      {entry.label}
                      <ChevronDown
                        aria-hidden="true"
                        className="h-3.5 w-3.5 transition-transform duration-200"
                        style={{ transform: isOpen ? "rotate(180deg)" : undefined }}
                      />
                    </button>

                    {isOpen && (
                      <div className="site-nav-menu">
                        {entry.items?.map((item) => (
                          <Link
                            key={`${item.label}-${item.href}`}
                            to={item.href}
                            className="site-nav-menu__item"
                          >
                            <span className="site-nav-menu__label">{item.label}</span>
                            {item.hint && (
                              <span className="site-nav-menu__hint">{item.hint}</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Höger: ikonerna */}
            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              {/* Adminlänken bodde i remsan som togs bort. Den hör inte
                  hemma i menyn - den är inte en sida i butiken - så den
                  ligger som en ikon här, och bara för den som är
                  inloggad som admin. */}
              {isAdmin && (
                <a
                  href={navigation.adminPortalHref}
                  aria-label="Adminpanelen"
                  title="Adminpanelen"
                  className="site-nav-bar__icon hidden sm:inline-flex"
                >
                  <ShieldCheck className="h-5 w-5" />
                </a>
              )}

              <button
                type="button"
                onClick={() => setSearchOpen((prev) => !prev)}
                aria-label={searchOpen ? "Stäng sök" : "Sök"}
                aria-expanded={searchOpen}
                className="site-nav-bar__icon"
              >
                {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>

              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              <div className="hidden sm:block">
                <LoginButton />
              </div>

              <div
                className="relative"
                onMouseEnter={handleCartEnter}
                onMouseLeave={handleCartLeave}
              >
                <button
                  type="button"
                  onClick={() => navigate("/cart")}
                  aria-label={`Kundvagn, ${totalItems} ${totalItems === 1 ? "artikel" : "artiklar"}`}
                  className="site-nav-bar__icon relative"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute right-0 top-0 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </button>

                {showCartPreview && items.length > 0 && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-foreground/10 bg-background p-4 shadow-xl">
                    <div className="space-y-2">
                      {items.slice(0, 4).map((item) => (
                        <div key={item.id} className="flex justify-between gap-3 text-sm">
                          <span className="truncate text-foreground">
                            {item.product?.name || "Produkt"} x{item.quantity}
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums text-foreground">
                            {(((item.product?.price_cents || 0) * item.quantity) / 100).toLocaleString("sv-SE")} kr
                          </span>
                        </div>
                      ))}
                      {items.length > 4 && (
                        <p className="text-xs text-muted-foreground">
                          +{items.length - 4} till
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex justify-between border-t border-foreground/10 pt-3 text-sm font-semibold text-foreground">
                      <span>Totalt</span>
                      <span className="tabular-nums">
                        {(totalPrice / 100).toLocaleString("sv-SE")} kr
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Link to="/cart" className="btn-secondary flex-1 px-3 py-2 text-xs">
                        Kundvagn
                      </Link>
                      <Link to="/checkout" className="btn-primary flex-1 px-3 py-2 text-xs">
                        Kassa
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label={mobileOpen ? "Stäng meny" : "Öppna meny"}
                aria-expanded={mobileOpen}
                className="site-nav-bar__icon lg:hidden"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Sökfältet, utfällt ---------------------------------------- */}
        {searchOpen && (
          <div ref={searchPanelRef} className="border-t border-foreground/10">
            <div className="container mx-auto px-4 py-4">
              {searchField(true)}
              {renderSearchResults()}
            </div>
          </div>
        )}
      </div>

      {/* Menyn på telefon ------------------------------------------- */}
      {mobileOpen && (
        <div className="site-nav-mobile lg:hidden">
          <div className="container mx-auto space-y-6 px-4 py-6">
            {searchField(false)}
            {renderSearchResults()}

            <ul className="divide-y divide-foreground/10 border-y border-foreground/10">
              {navEntries.map((entry) => (
                <li key={entry.label} className="py-4">
                  {/* Undermenyerna står uppslagna här. Ett dragspel i en
                      meny som redan är utfälld är ett klick till för
                      ingenting. */}
                  <Link
                    to={entry.href}
                    className="block font-display text-base font-bold tracking-tight text-foreground"
                  >
                    {entry.label}
                  </Link>
                  {entry.items && (
                    <ul className="mt-3 space-y-1 pl-3">
                      {entry.items.map((item) => (
                        <li key={`${item.label}-${item.href}`}>
                          <Link
                            to={item.href}
                            className="block rounded-sm py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-3">
              <LoginButton />
              <ThemeToggle />
            </div>

            {isAdmin && (
              <a href={navigation.adminPortalHref} className="btn-secondary w-full">
                <ShieldCheck className="h-4 w-4" />
                Admin
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
