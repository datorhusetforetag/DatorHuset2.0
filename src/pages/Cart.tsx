import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { CheckoutSteps } from "@/components/CheckoutSteps";
import { Reveal } from "@/components/Reveal";
import { useCart } from "@/context/CartContext";
import { COMPUTERS } from "@/data/computers";
import { PAGE_BANNERS } from "@/lib/pageBanners";
import { resolveProductImage } from "@/lib/productImageResolver";
import { trackEvent } from "@/lib/analytics";

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
 *   Raderna är rader. En lista med fyra lådor under varandra läses som
 *   fyra olika saker; samma fyra med hårfina linjer emellan läses som
 *   en lista, vilket är vad det är.
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

export default function Cart() {
  const { items, loading, removeFromCart, updateQuantity, totalPrice } = useCart();
  const navigate = useNavigate();
  const serviceFeeCents = 500;
  const totalWithService = totalPrice + serviceFeeCents;

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
                Se de fyra nivåerna
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
            <ul className="divide-y divide-foreground/10 border-y border-foreground/10">
              {items.map((item, index) => {
                const product = item.product;
                const fallbackComputer = COMPUTERS.find(
                  (computer) =>
                    computer.name === product?.name ||
                    computer.id === product?.id ||
                    computer.id === String(product?.id),
                );
                const imageSrc = resolveProductImage(product, fallbackComputer?.image);
                const unitCents = product?.price_cents || 0;
                const name = product?.name || "Produkt";

                return (
                  <Reveal
                    as="li"
                    key={item.id}
                    delay={index * 60}
                    className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:gap-6"
                  >
                    <div className="h-28 w-full shrink-0 overflow-hidden rounded-sm border border-foreground/10 bg-foreground/[0.04] sm:h-24 sm:w-28">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          Ingen bild
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-base font-bold leading-snug tracking-tight text-foreground">
                        {name}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatPrice(unitCents)} per styck
                      </p>

                      {/* Stegaren har riktiga etiketter. Två knappar med
                          bara ett plus och ett minus säger ingenting till
                          den som lyssnar sig igenom sidan. */}
                      <div className="mt-4 inline-flex items-center rounded-sm border border-foreground/15">
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
                    </div>

                    <div className="flex items-center justify-between gap-6 sm:flex-col sm:items-end sm:justify-center">
                      <p className="font-display text-lg font-bold tabular-nums text-foreground">
                        {formatPrice(unitCents * item.quantity)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Ta bort
                      </button>
                    </div>
                  </Reveal>
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
                    <dt className="text-muted-foreground">Serviceavgift</dt>
                    <dd className="font-semibold tabular-nums text-foreground">
                      {formatPrice(serviceFeeCents)}
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
                    {formatPrice(totalWithService)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void trackEvent({
                      event: "checkout_click_from_cart",
                      properties: {
                        itemCount: items.length,
                        totalCents: totalWithService,
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
