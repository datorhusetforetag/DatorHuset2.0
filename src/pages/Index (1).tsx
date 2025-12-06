import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ProductsSection } from "@/components/ProductsSection";
import { ServicesSection } from "@/components/ServicesSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <ProductsSection />
        <ServicesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
