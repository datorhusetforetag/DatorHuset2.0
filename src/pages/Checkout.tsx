import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ShoppingCart } from "lucide-react";

const swedishPhoneRegex = /^(?:\+46|0)7\d{8}$/;
const swedishPostalRegex = /^\d{3}\s?\d{2}$/;
const swedishCityRegex = /^[A-Za-z\u00c5\u00c4\u00d6\u00e5\u00e4\u00f6.\s-]+$/;

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
  });
  const fullName = `${firstName} ${lastName}`.trim();

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 pt-16 sm:pt-24 container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{"Du m\u00e5ste logga in f\u00f6r att checka ut"}</h1>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded hover:bg-[#11667b] hover:text-white transition-colors"
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
        <div className="flex-1 pt-16 sm:pt-24 container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{"Din kundvagn \u00e4r tom"}</h1>
            <button
              onClick={() => navigate("/products")}
              className="px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded hover:bg-[#11667b] hover:text-white transition-colors"
            >
              {"Forts\u00e4tt handla"}
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const validateFields = () => {
    const normalizedPhone = phone.replace(/\s+/g, "");
    const nextErrors = {
      email: email.trim() ? "" : "Ange en giltig e-postadress.",
      firstName: firstName.trim().length >= 2 ? "" : "Ange f\u00f6rnamn.",
      lastName: lastName.trim().length >= 2 ? "" : "Ange efternamn.",
      phone: swedishPhoneRegex.test(normalizedPhone) ? "" : "Ange ett giltigt svenskt mobilnummer.",
      address: address.trim().length >= 5 ? "" : "Ange en giltig adress.",
      postalCode: swedishPostalRegex.test(postalCode.trim()) ? "" : "Ange ett giltigt postnummer.",
      city: swedishCityRegex.test(city.trim()) ? "" : "Ange en giltig postort.",
    };

    setErrors(nextErrors);
    return Object.values(nextErrors).every((value) => value === "");
  };

  const handleCheckout = async () => {
    if (!validateFields()) {
      alert("Kontrollera att alla f\u00e4lt \u00e4r korrekt ifyllda.");
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
          phone,
          address,
          postalCode,
          city,
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

  const isFormValid =
    email.trim().length > 0 &&
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    swedishPhoneRegex.test(phone.replace(/\s+/g, "")) &&
    address.trim().length >= 5 &&
    swedishPostalRegex.test(postalCode.trim()) &&
    swedishCityRegex.test(city.trim());

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16 sm:pt-24">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Kassa</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Leveransuppgifter</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {"E-postadress"}
                    </label>
                    <input
                      type="email"
                      required
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exempel@example.com"
                      aria-invalid={Boolean(errors.email)}
                      className={`w-full px-4 py-2 border rounded focus:outline-none focus:border-yellow-400 bg-white text-gray-900 placeholder:text-gray-500 ${
                        errors.email ? "border-red-400" : "border-gray-300"
                      }`}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {"F\u00f6rnamn"}
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jan"
                        aria-invalid={Boolean(errors.firstName)}
                        className={`w-full px-4 py-2 border rounded focus:outline-none focus:border-yellow-400 bg-white text-gray-900 placeholder:text-gray-500 ${
                          errors.firstName ? "border-red-400" : "border-gray-300"
                        }`}
                      />
                      {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {"Efternamn"}
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Svensson"
                        aria-invalid={Boolean(errors.lastName)}
                        className={`w-full px-4 py-2 border rounded focus:outline-none focus:border-yellow-400 bg-white text-gray-900 placeholder:text-gray-500 ${
                          errors.lastName ? "border-red-400" : "border-gray-300"
                        }`}
                      />
                      {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {"Mobil nr"}
                      </label>
                      <input
                        type="tel"
                        required
                        inputMode="tel"
                        pattern="^(?:\\+46|0)7\\d{8}$"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="07x xxx xx xx"
                        aria-invalid={Boolean(errors.phone)}
                        className={`w-full px-4 py-2 border rounded focus:outline-none focus:border-yellow-400 bg-white text-gray-900 placeholder:text-gray-500 ${
                          errors.phone ? "border-red-400" : "border-gray-300"
                        }`}
                      />
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {"Adress"}
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="street-address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Gatan 1"
                        aria-invalid={Boolean(errors.address)}
                        className={`w-full px-4 py-2 border rounded focus:outline-none focus:border-yellow-400 bg-white text-gray-900 placeholder:text-gray-500 ${
                          errors.address ? "border-red-400" : "border-gray-300"
                        }`}
                      />
                      {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {"Postnummer"}
                      </label>
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        pattern="^\\d{3}\\s?\\d{2}$"
                        autoComplete="postal-code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="123 45"
                        aria-invalid={Boolean(errors.postalCode)}
                        className={`w-full px-4 py-2 border rounded focus:outline-none focus:border-yellow-400 bg-white text-gray-900 placeholder:text-gray-500 ${
                          errors.postalCode ? "border-red-400" : "border-gray-300"
                        }`}
                      />
                      {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {"Postort"}
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="address-level2"
                        pattern="^[A-Za-z\u00c5\u00c4\u00d6\u00e5\u00e4\u00f6.\\s-]+$"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Stockholm"
                        aria-invalid={Boolean(errors.city)}
                        className={`w-full px-4 py-2 border rounded focus:outline-none focus:border-yellow-400 bg-white text-gray-900 placeholder:text-gray-500 ${
                          errors.city ? "border-red-400" : "border-gray-300"
                        }`}
                      />
                      {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 lg:sticky lg:top-24">
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
                  disabled={loading || !isFormValid}
                  className="w-full px-4 py-3 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-[#11667b] hover:text-white disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {loading ? "Bearbetar..." : "G\u00e5 till betalning"}
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
