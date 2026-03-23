import {
  BadgePercent,
  Cpu,
  Hammer,
  Headset,
  Monitor,
  Package,
  RefreshCcw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Wallet,
  Wrench,
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
  if (icon === "truck") return <Truck className={className} aria-hidden />;
  if (icon === "wrench") return <Wrench className={className} aria-hidden />;
  if (icon === "star") return <Star className={className} aria-hidden />;
  if (icon === "headset") return <Headset className={className} aria-hidden />;
  if (icon === "sparkles") return <Sparkles className={className} aria-hidden />;
  if (icon === "cpu") return <Cpu className={className} aria-hidden />;
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
