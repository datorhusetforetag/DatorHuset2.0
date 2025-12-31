import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Orders() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 sm:pt-24 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Mina bestallningar</h1>
        <p className="text-gray-700 leading-relaxed">
          Har kommer du kunna se orderhistorik, fakturor och leveransstatus. Ersatt texten med riktiga orderdata nar den finns.
        </p>
      </main>
      <Footer />
    </div>
  );
}
