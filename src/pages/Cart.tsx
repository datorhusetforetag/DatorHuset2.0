import { PageShell } from "@/components/PageShell";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus } from "lucide-react";
import { useEffect } from "react";
import { COMPUTERS } from "@/data/computers";
import { resolveProductImage } from "@/lib/productImageResolver";
import { trackEvent } from "@/lib/analytics";

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
        <div className="flex-1 pt-16 sm:pt-24 flex items-center justify-center">
          <p className="text-muted-foreground">Laddar kundvagn...</p>
        </div>
    </PageShell>
    );
  }

  if (items.length === 0) {
    return (
    <PageShell>
        <div className="flex-1 pt-16 sm:pt-24 container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Din kundvagn är tom</h1>
            <p className="text-muted-foreground mb-8">Lägg till produkter för att komma igång</p>
            <button
              onClick={() => navigate("/products")}
              className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded hover:bg-secondary hover:text-white transition-colors"
            >
              Fortsätt handla
            </button>
          </div>
        </div>
    </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex-1 pt-16 sm:pt-24">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">Kundvagn ({items.length} artiklar)</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row gap-4 p-4 border border-foreground/10 rounded-lg hover:shadow-md transition-shadow bg-background/70"
                  >
                    {(() => {
                      const product = item.product;
                      const fallbackComputer = COMPUTERS.find(
                        (computer) =>
                          computer.name === product?.name ||
                          computer.id === product?.id ||
                          computer.id === String(product?.id)
                      );
                      const imageSrc = resolveProductImage(product, fallbackComputer?.image);

                      return (
                        <div className="w-full sm:w-24 h-32 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-background dark:to-background rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={product?.name || "Produktbild"}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">Ingen bild</span>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {item.product?.name || "Produkt"}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        {(item.product?.price_cents || 0) / 100} kr
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-foreground/[0.06] rounded transition-colors"
                        >
                          <Minus className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <span className="px-3 py-1 bg-foreground/[0.06] rounded font-semibold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-foreground/[0.06] rounded transition-colors"
                        >
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start">
                      <p className="font-bold text-foreground sm:mb-4">
                        {((item.product?.price_cents || 0) * item.quantity) / 100} kr
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Ta bort</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="bg-foreground/[0.04] p-6 rounded-lg border border-foreground/10 lg:sticky lg:top-24">
                <h2 className="text-xl font-bold text-foreground mb-6">Ordersammanfattning</h2>

                <div className="space-y-3 mb-6 pb-6 border-b border-foreground/10">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delsumma:</span>
                    <span className="font-semibold text-foreground">{totalPrice / 100} kr</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground">Frakt:</span>
                    <span className="font-semibold text-foreground text-right max-w-[16rem]">Väljs i kassan</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serviceavgift:</span>
                    <span className="font-semibold text-foreground">5 kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Skatt:</span>
                    <span className="font-semibold text-foreground">Inkluderad</span>
                  </div>
                </div>

                <div className="flex justify-between mb-6">
                  <span className="text-lg font-bold text-foreground">Totalt:</span>
                  <span className="text-2xl font-bold text-foreground">{totalWithService / 100} kr</span>
                </div>

                <button
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
                  className="w-full px-4 py-3 bg-primary text-primary-foreground font-bold rounded hover:bg-secondary hover:text-white transition-colors mb-3"
                >
                  Gå till kassa
                </button>

                <button
                  onClick={() => navigate("/products")}
                  className="w-full px-4 py-3 border border-foreground/20 text-foreground font-semibold rounded hover:bg-foreground/[0.06] transition-colors"
                >
                  Fortsätt handla
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
