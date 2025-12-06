import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ProductsSection } from "@/components/ProductsSection";
import { ServicesSection } from "@/components/ServicesSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-0">
        <Hero />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
