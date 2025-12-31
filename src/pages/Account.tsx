import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Account() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 sm:pt-24 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Mina uppgifter</h1>
        <p className="text-gray-700 leading-relaxed">
          Hantera dina kontouppgifter. Byt ut denna platshallare med riktig profilinformation nar backend finns pa plats.
        </p>
      </main>
      <Footer />
    </div>
  );
}
