import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ShoppingCart } from "lucide-react";

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [fullName, setFullName] = useState("");

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 pt-24 container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Du måste logga in för att checka ut</h1>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded hover:bg-yellow-500 transition-colors"
            >
              Tillbaka till startsidan
            </button>
          </div>
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
            <button
              onClick={() => navigate("/products")}
              className="px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded hover:bg-yellow-500 transition-colors"
            >
              Fortsätt handla
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!fullName.trim()) {
      alert("Vänligen fyll i ditt fullständiga namn");
      return;
    }

    try {
      setLoading(true);

      // Call backend to create Stripe Checkout Session
      // Call same-origin API to avoid CORS issues
      const response = await fetch(`/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: items.map((item) => ({
            productId: item.product_id,
            productName: item.product?.name,
            unitPriceCents: item.product?.price_cents,
            quantity: item.quantity,
          })),
          userEmail: email,
          fullName: fullName,
          totalCents: totalPrice,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(`Checkout error: ${data.error}`);
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Kunde inte starta checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex-1 pt-24">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Kassa</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Leveransuppgifter</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      E-postadress
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exempel@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Fullständigt namn
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jan Svensson"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                    <p className="text-sm text-gray-600">
                      <strong>Obs:</strong> Du kommer att omdirigeras till Stripe Checkout för att slutföra betalningen. 
                      För att testa använder du Stripe's testkortnummer:
                    </p>
                    <p className="text-sm font-mono text-gray-900 mt-2">
                      4242 4242 4242 4242 | 12/25 | 123 | 12345
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Ordersammanfattning</h2>

                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.product?.name} x{item.quantity}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {((item.product?.price_cents || 0) * item.quantity) / 100} kr
                      </span>
                    </div>
                  ))}
                </div>

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
                  onClick={handleCheckout}
                  disabled={loading || !fullName.trim()}
                  className="w-full px-4 py-3 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-500 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {loading ? "Bearbetar..." : "Gå till betalning"}
                </button>

                <button
                  onClick={() => navigate("/cart")}
                  className="w-full mt-3 px-4 py-3 border border-gray-300 text-gray-900 font-semibold rounded hover:bg-gray-100 transition-colors"
                >
                  Tillbaka till kundvagn
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
