import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StepsSection } from "@/components/StepsSection";
import { HomePromoSplit } from "@/components/HomePromoSplit";
import { Footer } from "@/components/Footer";
import { SeoHead } from "@/components/SeoHead";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Index = () => {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen bg-white text-gray-900 transition-colors dark:bg-background dark:text-gray-50">
      <SeoHead
        title={`${settings.homepage.hero.title} | DatorHuset`}
        description={settings.homepage.hero.secondaryDescription}
        image={settings.homepage.hero.featureImage}
        url="https://datorhuset.site/"
        type="website"
      />
      <Navbar />
      <main className="pt-0">
        <Hero settings={settings.homepage.hero} motion={settings.site.motion} />
        <StepsSection settings={settings.homepage.steps} />
        <HomePromoSplit settings={settings.homepage.promo} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
