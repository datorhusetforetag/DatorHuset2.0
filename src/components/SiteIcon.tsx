import {
  BadgePercent,
  Hammer,
  Headset,
  Monitor,
  Package,
  RefreshCcw,
  Rocket,
  ShieldCheck,
  Wallet,
  Euro,
} from "lucide-react";
import type { SiteIconKey } from "@/lib/siteSettings";

type SiteIconProps = {
  icon: SiteIconKey;
  className?: string;
};

export const SiteIcon = ({ icon, className }: SiteIconProps) => {
  if (icon === "wallet") return <Wallet className={className} aria-hidden />;
  if (icon === "badge-percent") return <BadgePercent className={className} aria-hidden />;
  if (icon === "hammer") return <Hammer className={className} aria-hidden />;
  if (icon === "rocket") return <Rocket className={className} aria-hidden />;
  if (icon === "package") return <Package className={className} aria-hidden />;
  if (icon === "shield") return <ShieldCheck className={className} aria-hidden />;
  /* Har lag ocksa grenar for truck, wrench, star, sparkles och cpu.
     SiteIconKey har nio varden och SITE_ICON_OPTIONS erbjuder samma
     nio i adminlaget, sa de fem gick inte att na - ingen kunde valja
     dem. De ar borttagna i stallet for att typen breddats, eftersom
     listan i shared/siteSettingsDefaults.js ar det som bestammer vad
     som faktiskt gar att valja. */
  if (icon === "headset") return <Headset className={className} aria-hidden />;
  if (icon === "refresh-euro") {
    return (
      <span className={`inline-flex items-center gap-1 ${className || ""}`} aria-hidden>
        <RefreshCcw className="h-full w-full" />
        <Euro className="h-[70%] w-[70%]" />
      </span>
    );
  }
  return <Monitor className={className} aria-hidden />;
};
