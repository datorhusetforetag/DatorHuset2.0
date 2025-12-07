import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Star, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useProducts, getProductIdByName } from "@/hooks/useProducts";
import { COMPUTERS, Computer } from "@/data/computers";

export default function ComputerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('produktinfo');
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);
  const { products: supabaseProducts } = useProducts();

  const computer = COMPUTERS.find((c) => c.id === id);
  
  // Get the Supabase product ID from the computer name
  const supabaseProductId = computer ? getProductIdByName(computer.name) : null;

  if (!computer) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 pt-24 container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Datorn hittades inte</h1>
            <button
              onClick={() => navigate("/products")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Tillbaka till produkter
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
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-4 text-sm text-gray-600">
            <span>Hem</span>
            <span className="mx-2">/</span>
            <span>Dator & Surfplatta</span>
            <span className="mx-2">/</span>
            <span>Gamingdatorer stationär</span>
            <span className="mx-2">/</span>
            <span className="font-semibold text-gray-900">{computer.name}</span>
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left: Image Gallery */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg h-96 flex items-center justify-center sticky top-32">
                <div className="text-center">
                  <div className="text-8xl mb-4">🖥️</div>
                  <p className="text-gray-600 font-medium text-sm">{computer.tier} Tier</p>
                </div>
              </div>
              {/* Thumbnail gallery */}
              <div className="flex gap-2 mt-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded cursor-pointer hover:ring-2 hover:ring-yellow-400 flex items-center justify-center text-2xl"
                  >
                    🖥️
                  </div>
                ))}
              </div>
            </div>

            {/* Middle: Product Info */}
            <div className="lg:col-span-2">
              {/* Title and Rating */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{computer.name}</h1>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={i < Math.floor(computer.rating) ? 'text-yellow-400' : 'text-gray-300'}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({computer.reviews} omdömen)</span>
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded">
                    39 personer har köpt denna
                  </span>
                </div>

                {/* Short description */}
                <p className="text-gray-700 text-sm mb-4">
                  Windows 11 Home, GeForce RTX 5080, Ryzen 7 9800X3D, 32GB DDR5, 2TB SSD
                </p>
              </div>

              <hr className="my-6" />

              {/* Price Section */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {computer.price.toLocaleString('sv-SE')} kr
                  </span>
                  <span className="text-sm text-gray-600">Exkl moms</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <span>📅 Premiärcart sänkningsålder 4 februari 2026 (10 kr), osäkert datum</span>
                </div>
                <div className="flex items-center gap-2 text-sm mb-4">
                  <span className="text-green-600 font-semibold">✓ På ett modelltände var vägen finns i lager igen</span>
                </div>
              </div>

              <hr className="my-6" />

              {/* Add to Cart Section */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center border border-gray-300 rounded">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 hover:bg-gray-100 transition-colors border-r border-gray-300"
                    >
                      <Minus className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="px-6 py-2 font-semibold text-gray-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 hover:bg-gray-100 transition-colors border-l border-gray-300"
                    >
                      <Plus className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                <button 
                  onClick={async () => {
                    try {
                      setAddingToCart(true);
                      if (!supabaseProductId) {
                        alert('Laddar produktinformation från databasen. Vänta och försök igen.');
                        return;
                      }
                      await addToCart(supabaseProductId, quantity);
                      navigate("/cart");
                    } catch (error) {
                      console.error('Failed to add to cart:', error);
                      alert('Kunde inte lägga till i kundvagn');
                    } finally {
                      setAddingToCart(false);
                    }
                  }}
                  disabled={addingToCart || !supabaseProductId}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-gray-900 py-3 rounded font-bold text-lg transition-colors mb-3 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {addingToCart ? 'Lägger till...' : 'Lägg i kundvagn'}
                </button>

                <button className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded font-semibold transition-colors flex items-center justify-center gap-2 mb-4">
                  💌 ANPASSA EN ÖR KÖP?
                </button>

                {/* Side actions */}
                <div className="flex gap-4 text-sm mb-6">
                  <button className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition">
                    💝 Jämför
                  </button>
                  <button className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition">
                    ❤️ Lägg till i Önskeslista
                  </button>
                </div>

                {/* Trust elements */}
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="space-y-2 text-sm">
                    <p className="flex items-start gap-2">
                      <span>🛡️</span>
                      <span><strong>Trygghetssavtal</strong> från 117:- / månad</span>
                    </p>
                  </div>
                  <button className="text-blue-600 hover:underline text-sm mt-2">Läs mer</button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex gap-8 border-b border-gray-200 mb-8">
              <button
                onClick={() => setActiveTab('produktinfo')}
                className={`pb-4 font-semibold transition-colors ${
                  activeTab === 'produktinfo'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Produktinfo
              </button>
              <button
                onClick={() => setActiveTab('specifikationer')}
                className={`pb-4 font-semibold transition-colors ${
                  activeTab === 'specifikationer'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Specifikationer
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'produktinfo' && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Produktinfo</h2>

                {/* Product description boxes */}
                <div className="space-y-6 mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span>🎮</span> Game Changer
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      GeForce RTX® 50-serien grafikkort utnyttjar NVIDIA Blackwell och ebjuder revolutionerande features för spelprov och strömning. RTX 50-serien är utrustad med förbättrad AI-hårdvara och möjligheter nya uplevelser och grafisk skärpning på nästa nivå. Förbättra prestandan med NVIDIA DLSS 4, generera bättre med överrasflad hastigher och ta utlopp för din kreativitet med NVIDIA Studio.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span>⚡</span> Ultimat strålspårning och AI
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      RTX är den mest avancerade plattformen för full strålspårning och neural rendering som revolutionerar vår sätt att gräta imaterialt. RTX erbjuder över 700 populärspel och appar för att leverera realistisk grafik med otrolig snabbhet och banbrytande nya AI-funktioner, som multithreading-centrering med DLSS.
                    </p>
                  </div>
                </div>

                {/* Call to action button */}
                <button className="px-6 py-2 border border-gray-300 text-gray-900 font-semibold rounded hover:bg-gray-50 transition">
                  Visa mer
                </button>
              </div>
            )}

            {activeTab === 'specifikationer' && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Specifikationer</h2>

                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-700 font-medium">Processor (CPU):</span>
                    <span className="text-gray-900 font-semibold">{computer.cpu}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-700 font-medium">Grafikkort (GPU):</span>
                    <span className="text-gray-900 font-semibold">{computer.gpu}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-700 font-medium">RAM-minne:</span>
                    <span className="text-gray-900 font-semibold">{computer.ram}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-700 font-medium">Lagring:</span>
                    <span className="text-gray-900 font-semibold">{computer.storage} {computer.storagetype}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-700 font-medium">Kategori:</span>
                    <span className="text-gray-900 font-semibold">{computer.tier}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Related Products Section */}
          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Andra som tittat på samma produkt tittar även på:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {COMPUTERS.filter((c) => c.id !== computer.id)
                .slice(0, 6)
                .map((related) => (
                  <button
                    key={related.id}
                    onClick={() => navigate(`/computer/${related.id}`)}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all text-left"
                  >
                    {/* Product image */}
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-32 flex items-center justify-center relative">
                      <div className="text-4xl">🖥️</div>
                      {related.price < computer.price && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          SPARA 3 600:-
                        </div>
                      )}
                    </div>

                    {/* Product info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                        {related.name}
                      </h3>
                      <div className="flex items-center mb-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={i < Math.floor(related.rating) ? 'text-yellow-400 text-xs' : 'text-gray-300 text-xs'}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="font-bold text-gray-900 text-sm">
                        {related.price.toLocaleString('sv-SE')} kr
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Exkl moms</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
