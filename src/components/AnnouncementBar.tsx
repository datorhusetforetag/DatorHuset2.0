import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/siteSettings";

type AnnouncementBarProps = {
  settings?: SiteSettings["site"]["announcement"];
};

const THEME_CLASS_MAP: Record<SiteSettings["site"]["announcement"]["theme"], string> = {
  dark: "bg-[#0f1824] text-white border-b border-slate-800",
  yellow: "bg-yellow-400 text-gray-900 border-b border-yellow-500",
  teal: "bg-[#11667b] text-white border-b border-[#0b4d5d]",
};

export const AnnouncementBar = ({
  settings = DEFAULT_SITE_SETTINGS.site.announcement,
}: AnnouncementBarProps) => {
  if (!settings.enabled) return null;

  return (
    <div className={THEME_CLASS_MAP[settings.theme]}>
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 py-2 text-center text-sm">
        <span className="rounded-full border border-current/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">
          {settings.label}
        </span>
        <span className="font-medium">{settings.text}</span>
        <Link to={settings.href} className="inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline">
          {settings.linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};
