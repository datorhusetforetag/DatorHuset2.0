import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus } from "lucide-react";

export default function Cart() {
  const { items, loading, removeFromCart, updateQuantity, totalPrice } = useCart();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 pt-24 flex items-center justify-center">
          <p className="text-gray-600">Laddar kundvagn...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 pt-24 container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Din kundvagn är tom</h1>
            <p className="text-gray-600 mb-8">Lägg till produkter för att komma igång</p>
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
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex-1 pt-24">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Kundvagn ({items.length} artiklar)</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    {/* Product image placeholder */}
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-3xl">🖥️</span>
                    </div>

                    {/* Product info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.product?.name || "Produkt"}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {(item.product?.price_cents || 0) / 100} kr
                      </p>

                      {/* Quantity control */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="px-3 py-1 bg-gray-100 rounded font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Price & Remove */}
                    <div className="text-right">
                      <p className="font-bold text-gray-900 mb-4">
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

            {/* Order Summary */}
            <div>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Ordersammanfattning</h2>

                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delsumma:</span>
                    <span className="font-semibold text-gray-900">{totalPrice / 100} kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frakt:</span>
                    <span className="font-semibold text-green-600">Gratis</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Skatt:</span>
                    <span className="font-semibold text-gray-900">Inkluderad</span>
                  </div>
                </div>

                <div className="flex justify-between mb-6">
                  <span className="text-lg font-bold text-gray-900">Totalt:</span>
                  <span className="text-2xl font-bold text-gray-900">{totalPrice / 100} kr</span>
                </div>

                <button
                  onClick={() => navigate("/checkout")}
                  className="w-full px-4 py-3 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-[#11667b] hover:text-white transition-colors mb-3"
                >
                  Gå till kassa
                </button>

                <button
                  onClick={() => navigate("/products")}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-900 font-semibold rounded hover:bg-gray-100 transition-colors"
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
