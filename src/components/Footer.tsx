import { Link } from "react-router-dom";
import logo from "@/assets/datorhuset-logo.svg";

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-100 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Kontakta oss</h4>
            <Link to="/faq" className="block text-sm text-gray-200 hover:text-yellow-400 transition-colors">FAQ</Link>
            <Link to="/kundservice" className="block text-sm text-gray-200 hover:text-yellow-400 transition-colors">Kundservice / Kontaktuppgifter</Link>
            <Link to="/about" className="block text-sm text-gray-200 hover:text-yellow-400 transition-colors">Om oss</Link>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Vara tjanster</h4>
            <Link to="/products" className="block text-sm text-gray-200 hover:text-yellow-400 transition-colors">Vara datorer</Link>
            <Link to="/custom-bygg" className="block text-sm text-gray-200 hover:text-yellow-400 transition-colors">Custom bygg</Link>
            <Link to="/service-reparation" className="block text-sm text-gray-200 hover:text-yellow-400 transition-colors">Service / reparation</Link>
          </div>

          <div className="space-y-2 md:text-right">
            <h4 className="text-lg font-semibold">Kundservice</h4>
            <p className="text-sm text-gray-200">datorhuset.foretag@gmail.com</p>
            <p className="text-sm text-gray-400">Svarstider 11:00-3:00</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col md:flex-row items-center justify-between border-t border-gray-800 pt-6">
          <p className="text-sm text-gray-400">© 2025 DatorHuset UF. All rights reserved.</p>
          <img src={logo} alt="DatorHuset logo" className="w-16 h-16 object-contain mt-4 md:mt-0" />
        </div>
      </div>
    </footer>
  );
};
