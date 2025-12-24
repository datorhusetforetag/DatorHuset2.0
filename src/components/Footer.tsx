import { Link } from "react-router-dom";
import { Instagram, Twitter, Youtube } from "lucide-react";
import logo from "/Datorhuset.png";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      fill="currentColor"
      d="M19.321 7.311a5.113 5.113 0 0 1-3.05-1.012 5.174 5.174 0 0 1-1.73-2.15v9.133a5.217 5.217 0 1 1-4.463-5.164v2.815a2.457 2.457 0 1 0 1.704 2.349V2h2.759a5.11 5.11 0 0 0 4.78 3.54v1.771Z"
    />
  </svg>
);

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-100 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Kontakta oss</h4>
            <Link to="/faq" className="block text-sm text-gray-200 hover:text-[#11667b] transition-colors">FAQ</Link>
            <Link to="/kundservice" className="block text-sm text-gray-200 hover:text-[#11667b] transition-colors">Kundservice / Kontaktuppgifter</Link>
            <Link to="/about" className="block text-sm text-gray-200 hover:text-[#11667b] transition-colors">Om oss</Link>
            <Link to="/privacy-policy" className="block text-sm text-gray-200 hover:text-[#11667b] transition-colors">Integritetspolicy</Link>
            <Link to="/terms-of-service" className="block text-sm text-gray-200 hover:text-[#11667b] transition-colors">Allmanna villkor</Link>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Vara tjanster</h4>
            <Link to="/products" className="block text-sm text-gray-200 hover:text-[#11667b] transition-colors">Vara datorer</Link>
            <Link to="/custom-bygg" className="block text-sm text-gray-200 hover:text-[#11667b] transition-colors">Custom bygg</Link>
            <Link to="/service-reparation" className="block text-sm text-gray-200 hover:text-[#11667b] transition-colors">Service / reparation</Link>
          </div>

          <div className="space-y-2 md:text-right">
            <h4 className="text-lg font-semibold">Kundservice</h4>
            <p className="text-sm text-gray-200">datorhuset.foretag@gmail.com</p>
            <p className="text-sm text-gray-400">Svarstider 11:00-3:00</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-gray-800 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-400 flex flex-col gap-2">
            <span>c 2025 DatorHuset UF. All rights reserved.</span>
            <div className="flex flex-wrap gap-4">
              <Link to="/privacy-policy" className="hover:text-[#11667b] transition-colors">Integritetspolicy</Link>
              <Link to="/terms-of-service" className="hover:text-[#11667b] transition-colors">Allmanna villkor</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/datorhuset_uf/"
              target="_blank"
              rel="noreferrer"
              aria-label="DatorHuset pa Instagram"
              className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-gray-200 hover:text-[#11667b] hover:border-[#11667b] transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://x.com/DatorHuset_UF"
              target="_blank"
              rel="noreferrer"
              aria-label="DatorHuset pa X"
              className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-gray-200 hover:text-[#11667b] hover:border-[#11667b] transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://www.tiktok.com/@datorhuset_uf?lang=en-GB"
              target="_blank"
              rel="noreferrer"
              aria-label="DatorHuset pa TikTok"
              className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-gray-200 hover:text-[#11667b] hover:border-[#11667b] transition-colors"
            >
              <TikTokIcon className="w-5 h-5" />
            </a>
            <a
              href="https://www.youtube.com/@DatorHuset"
              target="_blank"
              rel="noreferrer"
              aria-label="DatorHuset pa YouTube"
              className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-gray-200 hover:text-[#11667b] hover:border-[#11667b] transition-colors"
            >
              <Youtube className="w-5 h-5" />
            </a>
            <img src={logo} alt="DatorHuset logo" className="w-16 h-16 object-contain" />
          </div>
        </div>
      </div>
    </footer>
  );
};
