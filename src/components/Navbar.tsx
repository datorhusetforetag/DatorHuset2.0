import { useState } from "react";
import { Search, ShoppingCart, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { LoginButton } from "@/components/LoginButton";
import { useCart } from "@/context/CartContext";

const navItems = [
  { label: "Datorer & Surfplatta", href: "#" },
  { label: "Datorskärmar", href: "#" },
  { label: "Mobil & klockor", href: "/products" },
  { label: "Datorutrustning", href: "#" },
  { label: "Kontor & möbesrum", href: "#" },
  { label: "TV, ljud & bild", href: "#" },
  { label: "Hem & fritid", href: "#" },
  { label: "Kök & vitvaror", href: "#" },
  { label: "Tjänster & Kampanjer", href: "#" },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();
  const { totalItems } = useCart();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setSearchInput("");
    }
  };

  return (
    <nav className="sticky top-0 left-0 right-0 z-50">
      {/* Top utility bar */}
      <div className="bg-gray-100 border-b border-gray-200 text-xs text-gray-600">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex gap-6">
            <a href="#" className="hover:text-blue-600">🎧 FÖRDELSPROGRAM</a>
            <a href="#" className="hover:text-blue-600">💬 SUPPORT</a>
            <a href="#" className="hover:text-blue-600">🚚 FRI FRAKT FÖR PLUS*</a>
          </div>
          <a href="#" className="hover:text-blue-600">Kundsservice</a>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-2xl flex-shrink-0">
              <div className="w-10 h-10 bg-yellow-400 text-gray-900 flex items-center justify-center rounded font-bold">
                D
              </div>
              <span>DatorHuset</span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400" />
                <input
                  type="text"
                  placeholder="Sök bland alla våra produkter"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch(searchInput)}
                  className="w-full h-11 pl-11 pr-4 border-2 border-yellow-400 rounded text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 transition-all"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 flex-shrink-0">
              <LoginButton />
              <button className="flex flex-col items-center text-white hover:text-yellow-400 transition-colors">
                <span className="text-xs">Bli Plus-</span>
                <span className="text-xs">kund</span>
              </button>
              <button className="flex flex-col items-center text-white hover:text-yellow-400 transition-colors">
                <span className="text-xs">Bli kund</span>
              </button>
              <button 
                onClick={() => navigate("/cart")}
                className="relative flex flex-col items-center text-white hover:text-yellow-400 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-xs">Kundvagn</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>
              <button
                className="lg:hidden text-white"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Category menu */}
          <div className="hidden lg:flex items-center gap-8 h-12 border-t border-gray-700 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-gray-300 hover:text-yellow-400 transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-gray-700">
            <div className="relative mb-4 px-4">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400" />
              <input
                type="text"
                placeholder="Sök efter produkter..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch(searchInput)}
                className="w-full h-9 pl-10 pr-4 border-2 border-yellow-400 rounded text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 transition-all"
              />
            </div>
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="block px-4 py-2 text-sm text-gray-300 hover:text-yellow-400 hover:bg-gray-800 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};
