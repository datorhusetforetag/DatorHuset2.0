import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SeoJsonLd } from "@/components/SeoJsonLd";

const FAQ_ITEMS = [
  {
    question: "Hur lång leveranstid har ni?",
    answer:
      "Normalt 3–5 arbetsdagar för lagervaror. Special- eller custombyggen kan ta längre tid.",
  },
  {
    question: "Vad innebär förbeställning?",
    answer:
      "Förbeställning betyder att vi inte har varan i lager just nu, men att vi kan bygga och leverera så snart delar finns.",
  },
  {
    question: "Vilka betalmetoder accepterar ni?",
    answer:
      "Kort, PayPal, Google Pay och Klarna via vår betalningslösning.",
  },
  {
    question: "Kan jag avbryta eller ändra min order?",
    answer:
      "Kontakta oss så snabbt som möjligt. Om ordern inte har skickats kan vi oftast justera den.",
  },
  {
    question: "Hur fungerar service och reparation?",
    answer:
      "Beskriv problemet via kundservice så återkommer vi med offert, tidsplan och instruktioner.",
  },
  {
    question: "Kan jag få rådgivning innan köp?",
    answer:
      "Absolut. Vi hjälper dig att välja rätt dator efter behov och budget.",
  },
  {
    question: "Ingår Windows i era datorer?",
    answer:
      "Ja, våra färdigbyggda datorer levereras med operativsystem så att du kan starta direkt.",
  },
  {
    question: "Hur fungerar garanti och reklamation?",
    answer:
      "Du kan reklamera ursprungliga fel enligt konsumentköplagen. Kontakta oss så hjälper vi dig vidare.",
  },
  {
    question: "Kan jag ändra komponenter i en order?",
    answer:
      "I många fall går det att uppgradera komponenter innan produktionen startar.",
  },
  {
    question: "Hur spårar jag min leverans?",
    answer:
      "När ordern skickas får du spårningsinformation via e-post.",
  },
  {
    question: "Erbjuder ni företagslösningar?",
    answer:
      "Ja, vi erbjuder företagspaket med anpassade konfigurationer och tydliga villkor.",
  },
  {
    question: "Vad kostar felsökning?",
    answer:
      "Vi ger alltid en tydlig offert innan arbete påbörjas.",
  },
];

export default function Faq() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Hem",
        item: "https://datorhuset.site/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "FAQ",
        item: "https://datorhuset.site/faq",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <SeoJsonLd data={[faqSchema, breadcrumbSchema]} />
      <Navbar />

      <main className="flex-1">
        <section className="bg-yellow-400 overflow-hidden">
          <div className="container mx-auto px-4 pt-16 sm:pt-24 pb-12">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-700">FAQ</p>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-4">Vanliga frågor och svar</h1>
                <p className="text-gray-800 mt-4 max-w-2xl">
                  Här hittar du svar på de vanligaste frågorna om beställning, leverans och service.
                </p>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src="/Datorhuset.png"
                  alt="DatorHuset logo"
                  className="w-full max-w-md h-56 sm:h-72 lg:h-80 object-contain object-center"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 max-w-4xl space-y-6">
          {FAQ_ITEMS.map((item) => (
            <article key={item.question}>
              <h2 className="text-xl font-semibold">{item.question}</h2>
              <p className="text-gray-600 dark:text-gray-300">{item.answer}</p>
            </article>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
