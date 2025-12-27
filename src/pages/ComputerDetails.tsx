import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useProducts, getProductIdByName } from "@/hooks/useProducts";
import { COMPUTERS, Computer } from "@/data/computers";

const GAME_FPS: Record<string, Record<string, Record<string, number>>> = {
  Fortnite: {
    "1080p": { Medium: 160, High: 130, Ultra: 100 },
    "1440p": { Medium: 140, High: 110, Ultra: 85 },
    "4K": { Medium: 95, High: 70, Ultra: 55 },
  },
  "Cyberpunk 2077": {
    "1080p": { Medium: 95, High: 75, Ultra: 60 },
    "1440p": { Medium: 75, High: 60, Ultra: 45 },
    "4K": { Medium: 50, High: 38, Ultra: 28 },
  },
  "GTA 5": {
    "1080p": { Medium: 180, High: 150, Ultra: 120 },
    "1440p": { Medium: 150, High: 125, Ultra: 95 },
    "4K": { Medium: 110, High: 85, Ultra: 65 },
  },
  Minecraft: {
    "1080p": { Medium: 220, High: 180, Ultra: 150 },
    "1440p": { Medium: 190, High: 160, Ultra: 130 },
    "4K": { Medium: 160, High: 130, Ultra: 110 },
  },
  CS2: {
    "1080p": { Medium: 280, High: 240, Ultra: 200 },
    "1440p": { Medium: 240, High: 200, Ultra: 170 },
    "4K": { Medium: 200, High: 170, Ultra: 140 },
  },
  "Ghost of Tsushima": {
    "1080p": { Medium: 120, High: 100, Ultra: 80 },
    "1440p": { Medium: 100, High: 80, Ultra: 65 },
    "4K": { Medium: 70, High: 55, Ultra: 42 },
  },
};

const gameList = Object.keys(GAME_FPS);

export default function ComputerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);
  const { products } = useProducts();

  const [selectedGame, setSelectedGame] = useState(gameList[0]);
  const [selectedResolution, setSelectedResolution] = useState("1080p");
  const [selectedPreset, setSelectedPreset] = useState<"Medium" | "High" | "Ultra">("High");
  const [dlssOn, setDlssOn] = useState(false);
  const [frameGenOn, setFrameGenOn] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const computer: Computer | undefined = COMPUTERS.find((c) => c.id === id);
  const supabaseProductId =
    (computer && products.find((p) => p.name === computer.name)?.id) ||
    (computer && getProductIdByName(computer.name)) ||
    computer?.id ||
    null;

  const images = computer?.images?.length ? computer.images : computer ? [computer.image] : [];

  useEffect(() => {
    setSelectedImage(0);
  }, [computer?.id]);

  if (!computer) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-24 flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold mb-4">Datorn hittades inte</h1>
          <button
            onClick={() => navigate("/products")}
            className="bg-yellow-400 hover:bg-[#11667b] hover:text-white text-gray-900 px-6 py-3 rounded font-semibold transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till produkter
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      if (!supabaseProductId) {
        alert("Laddar produktinformation, försök igen om en stund.");
        return;
      }
      await addToCart(supabaseProductId, quantity);
      navigate("/cart");
    } catch (error) {
      console.error("Failed to add to cart", error);
      alert("Kunde inte lägga till i kundvagn");
    } finally {
      setAddingToCart(false);
    }
  };

  const baseFps = GAME_FPS[selectedGame][selectedResolution][selectedPreset];
  const multiplier = (dlssOn ? 1.2 : 1) * (frameGenOn ? 1.15 : 1);
  const finalFps = Math.round(baseFps * multiplier);
  const fpsLow = Math.max(1, Math.round(finalFps * 0.9));
  const fpsHigh = Math.round(finalFps * 1.1);

  const comparisonCandidates = COMPUTERS.filter((c) => c.id !== computer.id);
  const sameTier = comparisonCandidates.filter((c) => c.tier === computer.tier);
  const comparisonPool = (sameTier.length >= 2
    ? sameTier
    : [...sameTier, ...comparisonCandidates.filter((c) => c.tier !== computer.tier)]
  ).slice(0, 2);
  const comparisonItems = [computer, ...comparisonPool];

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-10 lg:py-16">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-2 mb-8">
          <button className="hover:text-gray-800 dark:hover:text-gray-200" onClick={() => navigate("/")}>Hem</button>
          <span>/</span>
          <span>Datorer & Surfplattor</span>
          <span>/</span>
          <span>Gamingdatorer stationära</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-semibold">{computer.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left: image area */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-4 lg:p-6 flex flex-col gap-4 shadow-lg border border-gray-200 dark:border-gray-800">
            <div className="relative w-full aspect-[4/3] bg-gray-200 dark:bg-[#0f1824] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <img
                src={images[selectedImage] || computer.image}
                alt={computer.name}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImage((prev) => (prev - 1 + images.length) % images.length)
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-gray-900 shadow hover:bg-white transition-colors dark:bg-gray-900/90 dark:text-gray-100"
                    aria-label="Föregående bild"
                  >
                    <ChevronLeft className="w-5 h-5 mx-auto" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-gray-900 shadow hover:bg-white transition-colors dark:bg-gray-900/90 dark:text-gray-100"
                    aria-label="Nästa bild"
                  >
                    <ChevronRight className="w-5 h-5 mx-auto" />
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg border ${selectedImage === i ? "border-[#11667b]" : "border-gray-300 dark:border-gray-700"} bg-white dark:bg-gray-900 overflow-hidden`}
                  aria-label={`Vy ${i + 1}`}
                >
                  <img src={img} alt={`${computer.name} vy ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: info/buy box */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">{computer.name}</h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {computer.cpu}, {computer.gpu}, {computer.ram}, {computer.storage} {computer.storagetype}
              </p>
            </div>

            <div className="text-4xl font-bold text-gray-900 dark:text-white">{computer.price.toLocaleString("sv-SE")} kr</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Exkl. moms</div>

            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Minska antal"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-6 py-3 text-lg font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Öka antal"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !supabaseProductId}
                className="flex-1 min-w-[220px] inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-[#11667b] hover:text-white disabled:bg-gray-300 dark:disabled:bg-gray-700 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {addingToCart ? "Lägger till..." : "Lägg i kundvagn"}
              </button>
            </div>

            <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
              <p>Beräknad leverans: 3-5 arbetsdagar</p>
              <p>Fri frakt vid köp över 5000 kr</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="flex gap-6 border-b border-gray-200 dark:border-gray-800 pb-4 mb-6 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <span className="text-gray-900 dark:text-white">Produktinfo</span>
            <span>Specifikationer</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-gray-700 dark:text-gray-200">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Game Changer</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Kraftfulla komponenter ger hög prestanda för spel och kreativa arbetsflöden. Perfekt balans mellan CPU, GPU och snabb lagring.
              </p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ultimat strålspårning och AI</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Modern grafik med ray tracing och AI-förbättringar levererar skarpa bilder och mjuk upplevelse även i krävande titlar.
              </p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
                <span>Processor (CPU)</span><span className="font-semibold text-gray-900 dark:text-white">{computer.cpu}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
                <span>Grafikkort (GPU)</span><span className="font-semibold text-gray-900 dark:text-white">{computer.gpu}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
                <span>RAM-minne</span><span className="font-semibold text-gray-900 dark:text-white">{computer.ram}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
                <span>Lagring</span><span className="font-semibold text-gray-900 dark:text-white">{computer.storage} {computer.storagetype}</span>
              </div>
              <div className="flex justify-between">
                <span>Kategori</span><span className="font-semibold text-gray-900 dark:text-white">{computer.tier}</span>
              </div>
              {computer.bundleIncludes?.length ? (
                <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1824] p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-2">Ingår i paketet</p>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {computer.bundleIncludes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* FPS estimator */}
        <div className="mt-12 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 lg:p-8 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Uppskattad FPS</h2>
              <div className="space-y-3">
                <label className="text-sm text-gray-700 dark:text-gray-300" htmlFor="game">Välj spel</label>
                <select
                  id="game"
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="w-full bg-white dark:bg-[#0f1824] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  {gameList.map((game) => (
                    <option key={game} value={game}>{game}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300" htmlFor="res">Upplösning</label>
                  <select
                    id="res"
                    value={selectedResolution}
                    onChange={(e) => setSelectedResolution(e.target.value)}
                    className="w-full bg-white dark:bg-[#0f1824] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {Object.keys(GAME_FPS[selectedGame]).map((res) => (
                      <option key={res} value={res}>{res}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300" htmlFor="preset">Grafik</label>
                  <select
                    id="preset"
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value as "Medium" | "High" | "Ultra")}
                    className="w-full bg-white dark:bg-[#0f1824] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {Object.keys(GAME_FPS[selectedGame][selectedResolution]).map((preset) => (
                      <option key={preset} value={preset}>{preset}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setDlssOn((v) => !v)}
                  className={`px-4 py-2 rounded-lg border ${dlssOn ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0f1824]"} text-sm font-semibold`}
                >
                  DLSS / FSR {dlssOn ? "On" : "Off"}
                </button>
                <button
                  onClick={() => setFrameGenOn((v) => !v)}
                  className={`px-4 py-2 rounded-lg border ${frameGenOn ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0f1824]"} text-sm font-semibold`}
                >
                  Frame generation {frameGenOn ? "On" : "Off"}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f1824] border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-28 h-28 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center text-center text-sm text-gray-700 dark:text-gray-300">
                  {selectedGame}
                </div>
                <div className="space-y-2">
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{selectedResolution} • {selectedPreset}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{fpsLow} - {fpsHigh} FPS</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Beräknat med vald konfiguration</p>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Comparison */}
        <div className="mt-12">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">J?mf?r liknande datorer</h2>
            <span className="text-sm text-gray-600 dark:text-gray-300">2?3 alternativ med liknande niv?</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisonItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4"
              >
                <div className="h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {item.price.toLocaleString("sv-SE")} kr
                  </p>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 border-t border-gray-200 dark:border-gray-800 pt-3">
                  <p>CPU: {item.cpu}</p>
                  <p>GPU: {item.gpu}</p>
                  <p>RAM: {item.ram}</p>
                  <p>
                    Lagring: {item.storage} {item.storagetype}
                  </p>
                </div>
                <Link
                  to={`/computer/${item.id}`}
                  className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    item.id === computer.id
                      ? "bg-gray-200 text-gray-700 cursor-default dark:bg-gray-800 dark:text-gray-300"
                      : "bg-yellow-400 text-gray-900 hover:bg-[#11667b] hover:text-white"
                  }`}
                >
                  {item.id === computer.id ? "Aktuell" : "Visa produkt"}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Related */}
        <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-10">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Andra som tittat på samma produkt tittar även på:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COMPUTERS.filter((c) => c.id !== computer.id).slice(0, 4).map((related) => (
              <button
                key={related.id}
                onClick={() => navigate(`/computer/${related.id}`)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:border-emerald-500 transition-all text-left"
              >
                <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-3xl text-gray-400 overflow-hidden">
                  <img src={related.image} alt={related.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">{related.name}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{related.price.toLocaleString("sv-SE")} kr</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
