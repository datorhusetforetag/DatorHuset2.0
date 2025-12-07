import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 container mx-auto px-4 py-12 max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Om oss</h1>
        <p className="text-gray-700">DatorHuset bygger och säljer stationära datorer för gaming och arbete. Vi fokuserar på tydliga specifikationer, rimliga priser och snabb service.</p>
        <p className="text-gray-700">Vår vision är att göra datorbygge och uppgraderingar enkelt. Vi erbjuder färdigbyggda paket, custom-byggen och rådgivning för att hitta rätt prestanda till rätt budget.</p>
        <p className="text-gray-700">Har du frågor eller vill ha en skräddarsydd offert? Kontakta oss så hjälper vi till.</p>
      </main>
      <Footer />
    </div>
  );
}
