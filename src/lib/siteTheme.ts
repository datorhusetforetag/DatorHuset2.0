import type { CSSProperties } from "react";
import type { SiteSettings } from "@/lib/siteSettings";

type SiteTheme = SiteSettings["site"]["theme"];

export const buildSiteThemeVars = (theme: SiteTheme): CSSProperties => ({
  ["--site-brand-bg" as string]: theme.primaryColor,
  ["--site-brand-text" as string]: theme.primaryTextColor,
  ["--site-accent-bg" as string]: theme.accentColor,
  ["--site-accent-text" as string]: theme.accentTextColor,
  ["--site-page-bg" as string]: theme.pageBackground,
  ["--site-page-bg-dark" as string]: theme.pageBackgroundDark,
  ["--site-surface-bg" as string]: theme.surfaceBackground,
  ["--site-surface-bg-dark" as string]: theme.surfaceBackgroundDark,
  ["--site-muted-bg" as string]: theme.mutedBackground,
  ["--site-muted-bg-dark" as string]: theme.mutedBackgroundDark,
  ["--site-card-bg" as string]: theme.cardBackground,
  ["--site-card-bg-dark" as string]: theme.cardBackgroundDark,
  ["--site-card-border" as string]: theme.cardBorderColor,
  ["--site-card-border-dark" as string]: theme.cardBorderColorDark,
  ["--site-text-primary" as string]: theme.textColor,
  ["--site-text-primary-dark" as string]: theme.textColorDark,
  ["--site-text-muted" as string]: theme.mutedTextColor,
  ["--site-text-muted-dark" as string]: theme.mutedTextColorDark,
  ["--site-hero-frame-bg" as string]: theme.heroImageFrameBackground,
  ["--site-radius-lg" as string]: `${theme.sectionRadiusPx}px`,
  ["--site-radius-xl" as string]: `${theme.panelRadiusPx}px`,
  ["--site-section-padding-y" as string]: `${theme.sectionPaddingY}px`,
  ["--site-content-max-width" as string]: `${theme.contentMaxWidthPx}px`,
});
