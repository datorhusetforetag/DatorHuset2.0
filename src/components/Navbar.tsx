import { useMemo, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { LoginButton } from "@/components/LoginButton";
import { useCart } from "@/context/CartContext";
import { COMPUTERS } from "@/data/computers";

export const Navbar = () => {
  const [searchInput, setSearchInput] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const navigate = useNavigate();
  const { totalItems, items, totalPrice } = useCart();

  const searchResults = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    if (!query) return [];
    return COMPUTERS.filter((computer) =>
      computer.name.toLowerCase().includes(query) ||
      computer.cpu.toLowerCase().includes(query) ||
      computer.gpu.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [searchInput]);

  const handleSelectSearch = (id: string) => {
    navigate(`/computer/${id}`);
    setSearchInput("");
    setShowSearchResults(false);
  };

  return (
    <nav className="sticky top-0 left-0 right-0 z-50">
      <div className="bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-2 font-bold text-2xl flex-shrink-0">
              <div className="w-10 h-10 bg-yellow-400 text-gray-900 flex items-center justify-center rounded font-bold">
                D
              </div>
              <span>DatorHuset</span>
            </Link>

            <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <div
                className="relative w-full"
                onMouseLeave={() => setShowSearchResults(false)}
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400" />
                <input
                  type="text"
                  placeholder="Sok bland produkter"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchResults[0]) {
                      handleSelectSearch(searchResults[0].id);
                    }
                  }}
                  className="w-full h-11 pl-11 pr-4 border-2 border-yellow-400 rounded text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 transition-all"
                />
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white text-gray-900 rounded shadow-lg border border-gray-200 overflow-hidden">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onMouseDown={() => handleSelectSearch(result.id)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex flex-col gap-1"
                      >
                        <span className="font-semibold text-sm text-gray-900">{result.name}</span>
                        <span className="text-xs text-gray-600 truncate">
                          {result.cpu} | {result.gpu} | {result.ram}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {result.price.toLocaleString("sv-SE")} kr
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 flex-shrink-0">
              <LoginButton />
              <div
                className="relative"
                onMouseEnter={() => setShowCartPreview(true)}
                onMouseLeave={() => setShowCartPreview(false)}
              >
                <button
                  onClick={() => navigate("/cart")}
                  className="relative flex flex-col items-center text-white hover:text-yellow-400 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-xs">Kundvagn</span>
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </button>
                {showCartPreview && (
                  <div className="absolute right-0 mt-2 w-72 bg-white text-gray-900 rounded shadow-lg border border-gray-200 p-4 z-50">
                    {items.length === 0 ? (
                      <p className="text-sm text-gray-600">Kundvagnen ar tom.</p>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-60 overflow-auto">
                          {items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-700 truncate pr-2">
                                {item.product?.name || "Produkt"} x{item.quantity}
                              </span>
                              <span className="font-semibold text-gray-900">
                                {((item.product?.price_cents || 0) * item.quantity / 100).toLocaleString("sv-SE")} kr
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between mt-3 text-sm font-semibold text-gray-900">
                          <span>Totalt</span>
                          <span>{(totalPrice / 100).toLocaleString("sv-SE")} kr</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => navigate("/cart")}
                            className="flex-1 px-3 py-2 text-sm font-semibold text-gray-900 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                          >
                            Ga till kundvagn
                          </button>
                          <button
                            onClick={() => navigate("/checkout")}
                            className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-yellow-500 hover:bg-yellow-600 rounded transition-colors"
                          >
                            Kassa
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:hidden pb-4">
            <div
              className="relative w-full"
              onMouseLeave={() => setShowSearchResults(false)}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400" />
              <input
                type="text"
                placeholder="Sok bland produkter"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchResults[0]) {
                    handleSelectSearch(searchResults[0].id);
                  }
                }}
                className="w-full h-11 pl-11 pr-4 border-2 border-yellow-400 rounded text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 transition-all"
              />
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white text-gray-900 rounded shadow-lg border border-gray-200 overflow-hidden z-50">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onMouseDown={() => handleSelectSearch(result.id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex flex-col gap-1"
                    >
                      <span className="font-semibold text-sm text-gray-900">{result.name}</span>
                      <span className="text-xs text-gray-600 truncate">
                        {result.cpu} | {result.gpu} | {result.ram}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {result.price.toLocaleString("sv-SE")} kr
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
