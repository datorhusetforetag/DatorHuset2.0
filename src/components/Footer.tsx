import { Facebook, Instagram, Linkedin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-16">
        {/* Back to top */}
        <div className="text-center mb-12">
          <a href="#" className="text-gray-900 font-semibold hover:text-blue-600">
            TILL TOPPEN ↑
          </a>
        </div>

        {/* Footer sections */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
          {/* Business program */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Förmånsprogram för företag</h4>
            <p className="text-sm text-gray-600 mb-4">
              Gå med i Företag Plus och få del av stående rabatter och erbjudanden.
            </p>
            <button className="border border-gray-300 px-4 py-2 rounded font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Uptäck Företag Plus
            </button>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Kontosidor</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-blue-600">Mina sidor</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-blue-600">Orderhistorik</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-blue-600">Fakturor & Kvitton</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-blue-600">Inköpslistor</a></li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Information</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-blue-600">Försäljningsvillkor</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-blue-600">Villkor för Komplett Företag Plus</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-blue-600">Felskäkning & guider</a></li>
            </ul>
          </div>

          {/* Help and support */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Hjälp och support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-blue-600">Kontakta oss</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-blue-600">Kundsservice</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-blue-600">Produkthjälp och retur</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-blue-600">Frakt och leverans</a></li>
            </ul>
          </div>

          {/* About Komplett */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Om DatorHuset</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-blue-600">Om oss</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-blue-600">Miljöarbete och ESG</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-blue-600">Whistleblowing</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-blue-600">Norwegian Transparency Act</a></li>
            </ul>
          </div>
        </div>

        {/* Social media and copyright */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex gap-6 mb-4 md:mb-0">
            <a href="#" className="text-gray-600 hover:text-blue-600">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>© 2025 DatorHuset Services AB. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-blue-600">Integritetspolicy</a>
              <a href="#" className="hover:text-blue-600">Användning av cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
