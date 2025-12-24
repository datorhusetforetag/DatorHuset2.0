import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CheckCircle, Loader } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [orderLoaded, setOrderLoaded] = useState(false);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Clear cart after successful payment
    clearCart();
    setOrderLoaded(true);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 pt-24 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Bearbetar din betalning...</p>
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
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-green-50 to-blue-50 p-8 rounded-lg border border-green-200">
            <div className="flex flex-col items-center text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Tack för din beställning!
              </h1>
              <p className="text-lg text-gray-600">
                Din betalning har behandlats framgångsrikt
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Orderdetaljer
              </h2>

              {sessionId && (
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Stripe Session ID:</span>
                    <span className="font-mono text-sm text-gray-900">
                      {sessionId.substring(0, 20)}...
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold text-green-600">
                      ✅ Betalad
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Tid:</span>
                    <span className="text-gray-900">
                      {new Date().toLocaleString("sv-SE")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">
                📧 Bekräftelse skickas till din e-post
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Du bör få en orderbekräftelse inom några minuter. Kontrollera din spam-mapp om du inte ser den.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">
                ⏱️ Vad händer nu?
              </h3>
              <ul className="text-gray-600 text-sm space-y-2">
                <li>✓ Din betalning är säker och slutförd</li>
                <li>✓ Dina produkter packas och skickas snart</li>
                <li>✓ Du får en spårningslänk när paketet skickas</li>
                <li>✓ Leverans inom 3-5 arbetsdagar</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate("/products")}
                className="flex-1 px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-[#11667b] hover:text-white transition-colors"
              >
                Fortsätt handla
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-900 font-semibold rounded hover:bg-gray-100 transition-colors"
              >
                Tillbaka till startsidan
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
