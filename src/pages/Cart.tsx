import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus } from "lucide-react";
import { COMPUTERS } from "@/data/computers";
import { resolveProductImage } from "@/lib/productImageResolver";

export default function Cart() {
  const { items, loading, removeFromCart, updateQuantity, totalPrice } = useCart();
  const navigate = useNavigate();
  const serviceFeeCents = 500;
  const totalWithService = totalPrice + serviceFeeCents;

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 pt-16 sm:pt-24 flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-300">Laddar kundvagn...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 pt-16 sm:pt-24 container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Din kundvagn är tom</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">Lägg till produkter för att komma igång</p>
            <button
              onClick={() => navigate("/products")}
              className="px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded hover:bg-[#11667b] hover:text-white transition-colors"
            >
              Fortsätt handla
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16 sm:pt-24">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Kundvagn ({items.length} artiklar)</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-900"
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
                        <div className="w-full sm:w-24 h-32 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={product?.name || "Produktbild"}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">Ingen bild</span>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {item.product?.name || "Produkt"}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                        {(item.product?.price_cents || 0) / 100} kr
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded font-semibold text-gray-900 dark:text-gray-100">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start">
                      <p className="font-bold text-gray-900 dark:text-gray-100 sm:mb-4">
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
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800 lg:sticky lg:top-24">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Ordersammanfattning</h2>

                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Delsumma:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{totalPrice / 100} kr</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-gray-600 dark:text-gray-300">Frakt:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-right max-w-[16rem]">Väljs i kassan (0 kr upphämtning / 700 kr PostNord)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Serviceavgift:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">5 kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Skatt:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Inkluderad</span>
                  </div>
                </div>

                <div className="flex justify-between mb-6">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Totalt:</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalWithService / 100} kr</span>
                </div>

                <button
                  onClick={() => navigate("/checkout")}
                  className="w-full px-4 py-3 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-[#11667b] hover:text-white transition-colors mb-3"
                >
                  Gå till kassa
                </button>

                <button
                  onClick={() => navigate("/products")}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Fortsätt handla
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
