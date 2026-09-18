import { Link } from "react-router-dom";
import { Instagram, Twitter, Youtube } from "lucide-react";
import { Wordmark } from "./Wordmark";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      fill="currentColor"
      d="M19.321 7.311a5.113 5.113 0 0 1-3.05-1.012 5.174 5.174 0 0 1-1.73-2.15v9.133a5.217 5.217 0 1 1-4.463-5.164v2.815a2.457 2.457 0 1 0 1.704 2.349V2h2.759a5.11 5.11 0 0 0 4.78 3.54v1.771Z"
    />
  </svg>
);

/**
 * Sidfoten.
 *
 * Bakgrunden är ett djupt plommonsvart med ett ljus som stiger underifrån,
 * samma uppbyggnad som Starforge använder. Rubrikerna är versala och
 * glesa, länkarna cyan - vår färg i stället för deras gröna.
 *
 * Villkorslänkarna ligger i nedre raden och inte i kolumnerna, så
 * kolumnerna får handla om vad besökaren vill göra.
 */
export const Footer = () => {
  const { settings } = useSiteSettings();
  const footer = settings.site.footer;
  const footerLogo = footer.logoUrl?.trim() || "/datorhuset-mark-small.png";
  const legalLinks = footer.legalLinks ?? [];

  return (
    <footer
      data-sandbox-id="global-footer"
      className="relative z-10 overflow-hidden border-t border-white/10 text-[#E8E4F0]"
      style={{
        // Basen är nästan svart med en dragning åt plommon. Ljuset stiger
        // underifrån i mitten och tonar ut mot kanterna.
        backgroundColor: "#140B1D",
        backgroundImage:
          "radial-gradient(120% 90% at 50% 120%, rgba(110, 43, 146, 0.55) 0%, rgba(110, 43, 146, 0.18) 45%, transparent 72%), radial-gradient(80% 60% at 85% 0%, rgba(63, 217, 245, 0.08) 0%, transparent 60%)",
      }}
    >
      <div className="container relative mx-auto px-4 py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_repeat(3,minmax(0,0.85fr))]">
          {/* Märket ------------------------------------------------- */}
          <div className="flex flex-col items-start gap-4">
            <img
              src={footerLogo}
              alt="DatorHuset"
              className="h-16 w-16 object-contain"
              loading="lazy"
              decoding="async"
            />
            <Wordmark
              name={settings.site.navigation.brandName}
              className="font-display text-xl font-bold tracking-tight"
            />
          </div>

          {/* Länkkolumner ------------------------------------------- */}
          {footer.columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A99FC0]">
                {column.title}
              </h2>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.href}`}>
                    <Link
                      to={link.href}
                      className="text-sm text-[#3FD9F5] transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Kontakt och sociala kanaler ---------------------------- */}
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A99FC0]">
              {footer.supportTitle}
            </h2>
            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href={`mailto:${footer.supportEmail}`}
                  className="text-sm text-[#3FD9F5] transition-colors hover:text-white"
                >
                  {footer.supportEmail}
                </a>
              </li>
              <li className="text-sm text-[#A99FC0]">{footer.supportHours}</li>
            </ul>

            <h2 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A99FC0]">
              Följ oss
            </h2>
            <div className="mt-4 flex items-center gap-3">
              {footer.socialLinks.map((item) => (
                <a
                  key={`${item.platform}-${item.href}`}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`DatorHuset på ${item.label}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-[#E8E4F0] transition-colors hover:border-[#3FD9F5] hover:text-[#3FD9F5]"
                >
                  {item.platform === "instagram" ? (
                    <Instagram className="h-[18px] w-[18px]" />
                  ) : item.platform === "youtube" ? (
                    <Youtube className="h-[18px] w-[18px]" />
                  ) : item.platform === "tiktok" ? (
                    <TikTokIcon className="h-[18px] w-[18px]" />
                  ) : (
                    <Twitter className="h-[18px] w-[18px]" />
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Nedre rad ------------------------------------------------ */}
        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#A99FC0]">{footer.copyright}</p>
          {legalLinks.length > 0 && (
            <nav aria-label="Villkor">
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-[#3FD9F5] transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
};
