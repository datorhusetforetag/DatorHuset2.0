import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StepsSection } from "@/components/StepsSection";
import { HomePromoSplit } from "@/components/HomePromoSplit";
import { TierSection } from "@/components/TierSection";
import { AmbientBackground } from "@/components/AmbientBackground";
import { TrustStrip } from "@/components/TrustStrip";
import { Footer } from "@/components/Footer";
import { SeoHead } from "@/components/SeoHead";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildSiteThemeVars } from "@/lib/siteTheme";

const Index = () => {
  const { settings } = useSiteSettings();
  const themeVars = buildSiteThemeVars(settings.site.theme);

  return (
    <div
      data-sandbox-id="global-theme"
      style={themeVars}
      className="min-h-screen bg-[var(--site-page-bg)] text-[var(--site-text-primary)] transition-colors dark:bg-[var(--site-page-bg-dark)] dark:text-[var(--site-text-primary-dark)]"
    >
      <SeoHead
        title={`${settings.homepage.hero.title} | DatorHuset`}
        description={settings.homepage.hero.secondaryDescription}
        image={settings.homepage.hero.featureImage}
        url="https://datorhuset.se/"
        type="website"
      />
      <AmbientBackground />
      <Navbar />
      <main className="relative z-10 pt-0">
        <Hero />
        <TierSection />
        <StepsSection settings={settings.homepage.steps} />
        <HomePromoSplit settings={settings.homepage.promo} />
        <TrustStrip />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
