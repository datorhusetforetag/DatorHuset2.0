import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function CustomerService() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 container mx-auto px-4 py-12 max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Kundservice / Kontaktuppgifter</h1>
        <div className="space-y-3 text-gray-700">
          <p>E-post: <a className="text-blue-600" href="mailto:datorhuset.foretag@gmail.com">datorhuset.foretag@gmail.com</a></p>
          <p>Telefon: +46 (0)10 138 82 08</p>
          <p>Svarstider: 11:00 - 15:00</p>
        </div>
        <div className="space-y-3 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">Supportärenden</h2>
          <p>För frågor om beställningar, returer eller fakturor: ange ordernummer och beskriv ärendet kort.</p>
          <p>Teknisk support: beskriv problemet, vilka komponenter som används och bifoga bilder om möjligt.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
