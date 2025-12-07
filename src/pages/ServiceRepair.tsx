import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function ServiceRepair() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 container mx-auto px-4 py-12 max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Service / reparation</h1>
        <p className="text-gray-700">Behöver du felsökning, uppgradering eller reparation? Vi hanterar både hårdvara och mjukvara.</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Diagnos av dator och komponenter.</li>
          <li>Rengöring, kylning och byte av delar.</li>
          <li>Installation av operativsystem och drivrutiner.</li>
        </ul>
        <p className="text-gray-700">Beskriv ditt problem och modell, så återkommer vi med åtgärdsförslag och kostnad.</p>
      </main>
      <Footer />
    </div>
  );
}
