import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StepsSection } from "@/components/StepsSection";
import { ProductsSection } from "@/components/ProductsSection";
import { ServicesSection } from "@/components/ServicesSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-50">
      <Navbar />
      <main className="pt-0">
        <Hero />
        <StepsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
