import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Faq() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">FAQ</h1>
        <p className="text-gray-700 leading-relaxed">
          Vanliga fragor och svar kommer att listas har. Uppdatera med riktiga fragor sa snart de finns.
        </p>
      </main>
      <Footer />
    </div>
  );
}
