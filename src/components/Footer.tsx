import { Link } from "react-router-dom";
import { Instagram, Twitter, Youtube } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      fill="currentColor"
      d="M19.321 7.311a5.113 5.113 0 0 1-3.05-1.012 5.174 5.174 0 0 1-1.73-2.15v9.133a5.217 5.217 0 1 1-4.463-5.164v2.815a2.457 2.457 0 1 0 1.704 2.349V2h2.759a5.11 5.11 0 0 0 4.78 3.54v1.771Z"
    />
  </svg>
);

export const Footer = () => {
  const { settings } = useSiteSettings();
  const footer = settings.site.footer;
  const footerLogo = footer.logoUrl?.trim() || "/Datorhuset.png";

  return (
    <footer className="border-t border-[#1a2636] bg-[#0f1824] text-gray-100">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr_1fr]">
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-2">
            {footer.columns.map((column) => (
              <div key={column.title} className="space-y-2">
                <h4 className="text-base font-semibold">{column.title}</h4>
                {column.links.map((link) => (
                  <Link key={`${column.title}-${link.href}`} to={link.href} className="block text-sm text-gray-200 transition-colors hover:text-[#11667b]">
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t border-[#1a2636] pt-4 lg:border-t-0 lg:pt-0">
            <div className="space-y-1">
              <h4 className="text-base font-semibold">{footer.supportTitle}</h4>
              <p className="text-sm text-gray-200">{footer.supportEmail}</p>
              <p className="text-sm text-gray-400">{footer.supportHours}</p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gray-500">Folj oss</p>
                <div className="flex items-center gap-3">
                  {footer.socialLinks.map((item) => (
                    <a
                      key={`${item.platform}-${item.href}`}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`DatorHuset pa ${item.label}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 text-gray-200 transition-colors hover:border-[#11667b] hover:text-[#11667b]"
                    >
                      {item.platform === "instagram" ? (
                        <Instagram className="h-5 w-5" />
                      ) : item.platform === "youtube" ? (
                        <Youtube className="h-5 w-5" />
                      ) : item.platform === "tiktok" ? (
                        <TikTokIcon className="h-5 w-5" />
                      ) : (
                        <Twitter className="h-5 w-5" />
                      )}
                    </a>
                  ))}
                </div>
              </div>
              <img src={footerLogo} alt="DatorHuset logo" className="h-12 w-12 object-contain" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#1a2636] pt-4">
          <p className="text-sm text-gray-400">{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
};
