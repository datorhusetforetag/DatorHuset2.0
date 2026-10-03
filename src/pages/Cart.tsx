import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { CheckoutSteps } from "@/components/CheckoutSteps";
import { Reveal } from "@/components/Reveal";
import { useCart, type CartItem } from "@/context/CartContext";
import { COMPUTERS, type Computer } from "@/data/computers";
import { getProductArt } from "@/data/productArt";
import { useUpgradePricing, type UpgradePricing } from "@/hooks/useUpgradePricing";
import { bestForResolution } from "@/lib/bestFor";
import { PAGE_BANNERS } from "@/lib/pageBanners";
import { resolveProductImage } from "@/lib/productImageResolver";
import { productPath } from "@/lib/productUrl";
import { trackEvent } from "@/lib/analytics";
import {
  findBaseConfig,
  formatRam,
  formatStorage,
  getUpgradeOptions,
} from "../../shared/upgradePricing.js";

/**
 * Kundvagnen.
 *
 * Satt kvar i den gamla formen längst: en naken rubrik utan banderoll,
 * varje rad i en egen inramad låda med skugga vid hovring, och knappar
 * med hårdkodad kulör som inte fanns någon annanstans i butiken.
 *
 * Tre beslut:
 *
 *   Banderollen är låg och utan foto. Ett halvskärmsfoto ovanför en
 *   kundvagn är i vägen - den som kommit hit är färdig med att titta på
 *   bilder och vill se sin summa. Däremot får den stegindikatorn, så
 *   att man ser att det är två klick kvar och inte fem.
 *
 *   Varje dator är ett eget, stort kort. Nästan alla köper en enda dator
 *   för flera tusen kronor, och det här är sista stället där de ser vad
 *   de får innan de betalar. En rad med en tumnagel och ett pris sa
 *   ingenting om processor, grafikkort eller vilka tillval som var
 *   valda. Kortet visar hela specifikationen, markerar det kunden
 *   uppgraderat och räknar upp vad varje tillval kostar.
 *
 *   Summan följer med när man rullar och står kvar tills man trycker.
 */

const ACCENT = PAGE_BANNERS.cart.accent;

/*
 * Priset i kronor, med tusentalsavstånd.
 *
 * Avrundas medvetet inte. Ett pris på skärmen som inte är exakt det som
 * dras är det värsta en butik kan visa, så ören skrivs ut när de finns
 * och utelämnas när de inte gör det.
 */
const formatPrice = (cents: number) => {
  const value = cents / 100;
  return `${value.toLocaleString("sv-SE", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })} kr`;
};

/*
 * En rad i specifikationen. upgrade är satt när kunden valt något annat
 * än grundutförandet, med tillägget mot grunden i kronor.
 */
type SpecRow = {
  label: string;
  value: string;
  upgrade?: { price: number };
};

const krDelta = (kronor: number) =>
  `${kronor > 0 ? "+" : "−"}${Math.abs(kronor).toLocaleString("sv-SE")} kr`;

/*
 * Specifikation och tillval för en dator i vagnen.
 *
 * Grunddata kommer ur datorlistan, tillvalen ur samma pristabell och
 * samma regler som kassan, så beloppen här är de som dras.
 */
const describeComputer = (item: CartItem, computer: Computer | undefined, pricing: UpgradePricing) => {
  if (!computer) return { rows: [] as SpecRow[], upgrades: [] as { label: string; price: number }[] };
  const product = item.product;
  const baseConfig = findBaseConfig(
    product?.name,
    product?.slug,
    (product as { legacy_id?: string } | null)?.legacy_id,
    computer.id,
  );
  const options = getUpgradeOptions(baseConfig, pricing);
  const config = item.configuration || {};

  const ram = config.ramGb != null ? options.ram.find((option) => option.gb === Number(config.ramGb)) : undefined;
  const storage =
    config.storageGb != null
      ? options.storage.find((option) => option.gb === Number(config.storageGb))
      : undefined;
  const gpu = config.gpu ? options.gpu.find((option) => option.id === config.gpu) : undefined;

  const rows: SpecRow[] = [
    { label: "Processor", value: computer.cpu },
    gpu
      ? { label: "Grafikkort", value: gpu.label, upgrade: { price: gpu.price } }
      : { label: "Grafikkort", value: computer.gpu },
    ram && baseConfig
      ? { label: "Minne", value: formatRam(ram.gb, baseConfig.ram.type), upgrade: { price: ram.price } }
      : { label: "Minne", value: computer.ram },
    storage
      ? {
          label: "Lagring",
          value: [formatStorage(storage.gb), computer.storagetype].filter(Boolean).join(" "),
          upgrade: { price: storage.price },
        }
      : { label: "Lagring", value: [computer.storage, computer.storagetype].filter(Boolean).join(" ") },
  ];

  const upgrades = rows.flatMap((row) =>
    row.upgrade ? [{ label: `${row.label}: ${row.value}`, price: row.upgrade.price }] : [],
  );

  return { rows, upgrades };
};

export default function Cart() {
  const { items, loading, removeFromCart, updateQuantity, totalPrice, unitPriceOf, describeItem } = useCart();
  const navigate = useNavigate();
  const { pricing } = useUpgradePricing();

  useEffect(() => {
    void trackEvent({
      event: "cart_viewed",
      properties: {
        itemCount: items.length,
        totalCents: totalPrice,
      },
    });
  }, [items.length, totalPrice]);

  if (loading) {
    return (
      <PageShell>
        <PageHero
          compact
          accent={ACCENT}
          sandboxId="cart-hero"
          breadcrumb={[{ label: "Hem", href: "/" }, { label: "Kundvagn" }]}
          eyebrow="Kundvagn"
          title="Hämtar din kundvagn"
        />
        <div className="container mx-auto px-4 py-20">
          <p className="text-muted-foreground">Laddar kundvagn...</p>
        </div>
      </PageShell>
    );
  }

  if (items.length === 0) {
    return (
      <PageShell>
        <PageHero
          compact
          accent={ACCENT}
          sandboxId="cart-hero"
          breadcrumb={[{ label: "Hem", href: "/" }, { label: "Kundvagn" }]}
          eyebrow="Kundvagn"
          title="Din kundvagn är tom"
          lede="Inget här än. Börja med en färdig dator, eller sätt ihop en egen från grunden."
          actions={
            <>
              <Link to="/products" className="btn-primary">
                Se våra datorer
              </Link>
              <Link to="/custom-bygg" className="btn-secondary">
                Bygg din egen
              </Link>
            </>
          }
        />

        {/* En tom kundvagn är en återvändsgränd. Den ska erbjuda vägar
            vidare, inte bara konstatera att det är tomt. */}
        <section className="relative">
          <div className="container mx-auto max-w-4xl px-4 pb-24 pt-14">
            <Reveal>
              <div className="flex items-center gap-4 border-t border-foreground/10 pt-8">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: ACCENT + "1F", color: ACCENT }}
                >
                  <ShoppingBag className="h-6 w-6" />
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Vet du inte var du ska börja? Nivåerna på startsidan visar
                  fyra prisklasser med vad var och en klarar, så du slipper
                  jämföra specifikationer själv.
                </p>
              </div>
              <Link to="/#home-tiers" className="btn-secondary mt-8">
                Se de tre nivåerna
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHero
        compact
        accent={ACCENT}
        sandboxId="cart-hero"
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Kundvagn" }]}
        eyebrow="Kundvagn"
        title={`${items.length} ${items.length === 1 ? "artikel" : "artiklar"} redo`}
        actions={<CheckoutSteps current={1} accent={ACCENT} />}
      />

      <section data-sandbox-id="cart-items" className="relative">
        <div className="container mx-auto px-4 pb-24 pt-10">
          <div className="grid gap-10 lg:grid-cols-[1.6fr_0.9fr] lg:gap-12">
            {/* Raderna ------------------------------------------------- */}
            <ul className="space-y-8">
              {items.map((item) => {
                const product = item.product;
                const computer = COMPUTERS.find(
                  (entry) =>
                    entry.name === product?.name ||
                    entry.id === product?.id ||
                    entry.id === String(product?.id),
                );
                const art = getProductArt(computer?.id);
                const cutout = computer ? art.cutout : null;
                const imageSrc = cutout || resolveProductImage(product, computer?.image);
                const unitCents = unitPriceOf(item);
                const baseCents = product?.price_cents || 0;
                const name = product?.name || "Produkt";
                const bestFor = computer ? bestForResolution(computer.name) : null;
                const { rows, upgrades } = describeComputer(item, computer, pricing);
                /* Utan specifikation att visa faller kortet tillbaka på
                   den korta beskrivningen av utförandet. */
                const fallbackConfiguration = rows.length === 0 ? describeItem(item) : "";

                /* Länken tillbaka till datorn öppnar samma utförande. */
                const params = new URLSearchParams();
                if (item.configuration?.ramGb != null) params.set("ram", String(item.configuration.ramGb));
                if (item.configuration?.storageGb != null) {
                  params.set("storage", String(item.configuration.storageGb));
                }
                const href = computer
                  ? `${productPath(computer)}${params.toString() ? `?${params}` : ""}`
                  : null;

                return (
                  <li
                    key={item.id}
                    className="cart-item"
                    style={{ ["--pc-glow" as string]: art.backdrop.glow }}
                  >
                    <div className="cart-item__media">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={name}
                          className={cutout ? "cart-item__cutout" : "cart-item__photo"}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">Ingen bild</span>
                      )}
                    </div>

                    <div className="cart-item__body">
                      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                        <div className="min-w-0">
                          <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-foreground">
                            {href ? (
                              <Link to={href} className="hover:underline">
                                {name}
                              </Link>
                            ) : (
                              name
                            )}
                          </h2>
                          {bestFor && (
                            <p className="pc-card__bestfor mt-2">
                              Bäst för:
                              <span
                                className="pc-card__pill"
                                style={{ color: art.backdrop.glow, borderColor: `${art.backdrop.glow}66` }}
                              >
                                {bestFor}
                              </span>
                            </p>
                          )}
                        </div>
                        <p className="font-display text-2xl font-bold tabular-nums text-foreground">
                          {formatPrice(unitCents * item.quantity)}
                        </p>
                      </div>

                      {rows.length > 0 && (
                        <dl className="cart-item__specs">
                          {rows.map((row) => (
                            <div key={row.label} data-upgraded={row.upgrade ? "true" : undefined}>
                              <dt>
                                {row.label}
                                {row.upgrade && <span className="cart-item__tag">Uppgraderad</span>}
                              </dt>
                              <dd>{row.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {fallbackConfiguration && (
                        <p className="mt-3 text-sm font-medium text-foreground/80">{fallbackConfiguration}</p>
                      )}

                      {/* Prisuppställningen: grundpriset och varje tillval
                          för sig, så att summan går att följa. */}
                      <dl className="cart-item__prices">
                        <div>
                          <dt>{upgrades.length > 0 ? "Standardutförande" : "Pris"}</dt>
                          <dd>{formatPrice(upgrades.length > 0 ? baseCents : unitCents)}</dd>
                        </div>
                        {upgrades.map((upgrade) => (
                          <div key={upgrade.label}>
                            <dt>{upgrade.label}</dt>
                            <dd>{upgrade.price === 0 ? "Ingår" : krDelta(upgrade.price)}</dd>
                          </div>
                        ))}
                        {(upgrades.length > 0 || item.quantity > 1) && (
                          <div className="cart-item__prices-total">
                            <dt>{item.quantity > 1 ? "Per dator" : "Ditt utförande"}</dt>
                            <dd>{formatPrice(unitCents)}</dd>
                          </div>
                        )}
                      </dl>

                      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
                      {/* Stegaren har riktiga etiketter. Två knappar med
                          bara ett plus och ett minus säger ingenting till
                          den som lyssnar sig igenom sidan. */}
                      <div className="inline-flex items-center rounded-md border border-foreground/15">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label={`Minska antalet ${name}`}
                          className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span
                          aria-live="polite"
                          className="min-w-[2.5rem] px-2 text-center text-sm font-bold tabular-nums text-foreground"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label={`Öka antalet ${name}`}
                          className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {href && (
                        <Link
                          to={href}
                          className="text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground"
                        >
                          Ändra utförande
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Ta bort
                      </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Summan --------------------------------------------------- */}
            <Reveal delay={120} className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-lg border border-foreground/10 bg-background/70 p-7">
                <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
                  Ordersammanfattning
                </h2>

                <dl className="mt-6 space-y-3 border-b border-foreground/10 pb-6 text-sm">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-muted-foreground">Delsumma</dt>
                    <dd className="font-semibold tabular-nums text-foreground">
                      {formatPrice(totalPrice)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-muted-foreground">Frakt</dt>
                    <dd className="text-right font-semibold text-foreground">
                      Väljs i kassan
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-muted-foreground">Moms</dt>
                    <dd className="font-semibold text-foreground">Inkluderad</dd>
                  </div>
                </dl>

                <div className="mt-6 flex items-baseline justify-between gap-4">
                  <span className="font-display text-base font-bold text-foreground">
                    Totalt
                  </span>
                  <span
                    className="font-display text-3xl font-bold tabular-nums"
                    style={{ color: ACCENT }}
                  >
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void trackEvent({
                      event: "checkout_click_from_cart",
                      properties: {
                        itemCount: items.length,
                        totalCents: totalPrice,
                      },
                    });
                    navigate("/checkout");
                  }}
                  className="btn-primary mt-7 w-full"
                >
                  Gå till kassan
                  <ArrowRight className="h-4 w-4" />
                </button>

                <Link to="/products" className="btn-secondary mt-3 w-full">
                  Fortsätt handla
                </Link>

                <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                  Frakt och betalsätt väljer du i nästa steg. Inget dras förrän
                  du bekräftat.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
