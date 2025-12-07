import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Om oss</h1>
        <p className="text-gray-700 leading-relaxed">
          Detta ar en platshallare for information om DatorHuset. Ersatt med riktigt innehall om verksamheten nar det ar klart.
        </p>
      </main>
      <Footer />
    </div>
  );
}
