import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StepsSection } from "@/components/StepsSection";
import { HomePromoSplit } from "@/components/HomePromoSplit";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 transition-colors dark:bg-background dark:text-gray-50">
      <Navbar />
      <main className="pt-0">
        <Hero />
        <StepsSection />
        <HomePromoSplit />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
