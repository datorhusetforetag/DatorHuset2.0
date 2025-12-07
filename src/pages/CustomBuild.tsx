import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function CustomBuild() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 container mx-auto px-4 py-12 max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Custom bygg</h1>
        <p className="text-gray-700">Beskriv dina önskemål för en skräddarsydd dator. Vi hjälper dig välja rätt komponenter för prestanda, budget och användningsområde.</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Berätta vad datorn ska användas till.</li>
          <li>Ange budget och önskad prestandanivå.</li>
          <li>Vi föreslår komponenter och skickar offert.</li>
        </ul>
        <p className="text-gray-700">Kontakta oss via e-post eller telefon så tar vi fram ett förslag.</p>
      </main>
      <Footer />
    </div>
  );
}
