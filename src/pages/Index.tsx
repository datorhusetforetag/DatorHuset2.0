import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { HomeCtaBand } from "@/components/HomeCtaBand";
import { HomeFeatureGrid } from "@/components/HomeFeatureGrid";
import { StepsSection } from "@/components/StepsSection";
import { HomePromoSplit } from "@/components/HomePromoSplit";
import { HomeTrustBar } from "@/components/HomeTrustBar";
import { Footer } from "@/components/Footer";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Index = () => {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen bg-white text-gray-900 transition-colors dark:bg-background dark:text-gray-50">
      <Navbar />
      <main className="pt-0">
        <Hero settings={settings.homepage.hero} />
        <HomeTrustBar settings={settings.homepage.trustBar} />
        <StepsSection settings={settings.homepage.steps} />
        <HomeFeatureGrid settings={settings.homepage.showcase} />
        <HomePromoSplit settings={settings.homepage.promo} />
        <HomeCtaBand settings={settings.homepage.ctaBand} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
