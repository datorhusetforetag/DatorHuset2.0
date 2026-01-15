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
    <footer className="bg-[#0f1824] text-gray-100 border-t border-[#1a2636]">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr_1fr]">
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-2">
            <div className="space-y-2">
              <h4 className="text-base font-semibold">Kontakta oss</h4>
              <Link to="/faq" className="block text-sm text-gray-200 hover:text-[#11667b] transition-colors">FAQ</Link>
              <Link to="/kundservice" className="block text-sm text-gray-200 hover:text-[#11667b] transition-colors">Kundservice / Kontaktuppgifter</Link>
              <Link to="/about" className="block text-sm text-gray-200 hover:text-[#11667b] transition-colors">Om oss</Link>
              <Link to="/privacy-policy" className="block text-sm text-gray-200 hover:text-[#11667b] transition-colors">Integritetspolicy</Link>
              <Link to="/terms-of-service" className="block text-sm text-gray-200 hover:text-[#11667b] transition-colors">Allmänna villkor</Link>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-semibold">Våra tjänster</h4>
              <Link to="/products" className="block text-sm text-gray-200 hover:text-[#11667b] transition-colors">Våra datorer</Link>
              <Link to="/custom-bygg" className="block text-sm text-gray-200 hover:text-[#11667b] transition-colors">Custom bygg</Link>
              <Link to="/service-reparation" className="block text-sm text-gray-200 hover:text-[#11667b] transition-colors">Service / reparation</Link>
            </div>
          </div>

          <div className="space-y-4 border-t border-[#1a2636] pt-4 lg:border-t-0 lg:pt-0">
            <div className="space-y-1">
              <h4 className="text-base font-semibold">Kundservice</h4>
              <p className="text-sm text-gray-200">support@datorhuset.site</p>
              <p className="text-sm text-gray-400">Svarstider 11:00-15:00</p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Följ oss</p>
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.instagram.com/datorhuset_uf/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="DatorHuset på Instagram"
                    className="w-9 h-9 rounded-full border border-gray-700 flex items-center justify-center text-gray-200 hover:text-[#11667b] hover:border-[#11667b] transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href="https://x.com/DatorHuset_UF"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="DatorHuset på X"
                    className="w-9 h-9 rounded-full border border-gray-700 flex items-center justify-center text-gray-200 hover:text-[#11667b] hover:border-[#11667b] transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.tiktok.com/@datorhuset_uf?lang=en-GB"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="DatorHuset på TikTok"
                    className="w-9 h-9 rounded-full border border-gray-700 flex items-center justify-center text-gray-200 hover:text-[#11667b] hover:border-[#11667b] transition-colors"
                  >
                    <TikTokIcon className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.youtube.com/@DatorHuset"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="DatorHuset på YouTube"
                    className="w-9 h-9 rounded-full border border-gray-700 flex items-center justify-center text-gray-200 hover:text-[#11667b] hover:border-[#11667b] transition-colors"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <img
                src={logo}
                alt="DatorHuset logo"
                className="w-12 h-12 object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#1a2636] pt-4">
          <p className="text-sm text-gray-400">©2026 DatorHuset UF. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
