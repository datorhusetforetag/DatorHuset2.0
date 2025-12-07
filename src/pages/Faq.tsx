import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Faq() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 container mx-auto px-4 py-12 max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">FAQ</h1>
        <p className="text-gray-700">Vanliga frågor och svar om beställningar, betalning och leverans.</p>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Hur lång leveranstid har ni?</h2>
            <p className="text-gray-700">Normalt 3-5 arbetsdagar för lagervaror. Special- eller custom-byggen kan ta längre tid.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Vilka betalmetoder accepteras?</h2>
            <p className="text-gray-700">Kort, Swish och faktura via Stripe/partner. Alla köp sker över säker anslutning.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Kan jag avbryta eller ändra min order?</h2>
            <p className="text-gray-700">Kontakta oss så snabbt som möjligt. Om ordern inte har skickats kan vi oftast justera den.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
