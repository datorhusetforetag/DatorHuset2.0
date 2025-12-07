import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function ServiceRepair() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Service och reparation</h1>
        <p className="text-gray-700 leading-relaxed">
          Har kan kunder boka service eller reparation. Uppdatera sidan med bokningsflode och tjanstebeskrivningar nar de ar redo.
        </p>
      </main>
      <Footer />
    </div>
  );
}
