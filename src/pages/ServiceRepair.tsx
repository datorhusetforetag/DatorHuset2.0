import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BadgeCheck, Cpu, Hammer, Headset, Laptop, ShieldCheck, Wrench } from "lucide-react";

const serviceCards = [
  {
    title: "Gamingdatorer",
    description: "Felsokning, uppgradering och kylning for maxad prestanda.",
    icon: Cpu,
  },
  {
    title: "Foretagsdatorer",
    description: "Stabil drift, snabb service och trygg hantering av data.",
    icon: ShieldCheck,
  },
  {
    title: "Laptop & komponenter",
    description: "Byte av delar, batteri, skarm och lagring.",
    icon: Laptop,
  },
  {
    title: "Bygg & uppgraderingar",
    description: "Vi optimerar din dator med nya delar och test.",
    icon: Hammer,
  },
];

const steps = [
  {
    value: "step-1",
    title: "1. Felsok din enhet",
    body: "Beskriv felet sa noggrant du kan. Vi svarar med rekommendation, prisbild och tidsplan.",
  },
  {
    value: "step-2",
    title: "2. Godkann offert",
    body: "Du far en tydlig offert innan vi startar. Inga dolda kostnader.",
  },
  {
    value: "step-3",
    title: "3. Service och test",
    body: "Vi reparerar, uppgraderar och stress-testar for att sakerstalla stabilitet.",
  },
  {
    value: "step-4",
    title: "4. Hamta upp eller fa leverans",
    body: "Vi meddelar nar din dator ar klar. Valj hamtning eller leverans.",
  },
  {
    value: "step-5",
    title: "5. Efterservice",
    body: "Behov av finjustering? Vi finns kvar for support och tips.",
  },
];

export default function ServiceRepair() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-slate-100 via-white to-slate-100 dark:from-[#0f1419] dark:via-[#0f1216] dark:to-[#0b0e12]">
          <div className="container mx-auto px-4 pt-24 pb-16">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Service & reparation</p>
              <h1 className="text-4xl lg:text-5xl font-bold mt-4">
                Vi reparerar, uppgraderar och optimerar din dator
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">
                DatorHuset hjalper dig med allt fran felsokning till komplett uppgradering. Snabb respons, tydlig offert och service som satter prestanda i fokus.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/kundservice"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  <Headset className="w-5 h-5" />
                  Kontakta service
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-2 border border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white font-semibold px-6 py-3 rounded-lg transition-colors dark:text-emerald-200"
                >
                  Se vara datorer
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 -mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {serviceCards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-gray-200 bg-white/90 dark:bg-gray-900/70 dark:border-gray-800 p-6 shadow-sm"
              >
                <card.icon className="w-8 h-8 text-emerald-500 mb-4" />
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
            <div>
              <h2 className="text-3xl font-bold mb-3">Lamna in pa reparation? Borja har.</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Vart flode ar byggt for tydlighet och snabbhet. Du vet vad som sker och nar.
              </p>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
                <Accordion type="single" collapsible defaultValue="step-1" className="w-full">
                  {steps.map((step) => (
                    <AccordionItem key={step.value} value={step.value} className="px-6 border-gray-200 dark:border-gray-800">
                      <AccordionTrigger className="text-left text-gray-900 dark:text-gray-100">
                        {step.title}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 dark:text-gray-300">
                        {step.body}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Wrench className="w-6 h-6 text-emerald-500" />
                <h3 className="text-xl font-semibold">Vad vi kan hjalpa med</h3>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2"><BadgeCheck className="w-4 h-4 text-emerald-500 mt-0.5" /> Felsokning av dator och komponenter</li>
                <li className="flex items-start gap-2"><BadgeCheck className="w-4 h-4 text-emerald-500 mt-0.5" /> Rengoring, kylning och kabeldragning</li>
                <li className="flex items-start gap-2"><BadgeCheck className="w-4 h-4 text-emerald-500 mt-0.5" /> Uppgradering av GPU, CPU, RAM och lagring</li>
                <li className="flex items-start gap-2"><BadgeCheck className="w-4 h-4 text-emerald-500 mt-0.5" /> Installation av OS, drivrutiner och optimering</li>
                <li className="flex items-start gap-2"><BadgeCheck className="w-4 h-4 text-emerald-500 mt-0.5" /> Dataoverforing och backup-rad</li>
              </ul>
              <div className="mt-6 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 p-4 text-sm text-emerald-900 dark:text-emerald-100">
                Snabbt svar, tydlig offert och service med fokus pa prestanda.
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <div className="rounded-2xl bg-gray-900 text-white px-8 py-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold">Redo att fa din dator i toppskick?</h3>
              <p className="text-gray-300 mt-2">Skicka en kort beskrivning av felet sa aterkommer vi snabbt.</p>
            </div>
            <Link
              to="/kundservice"
              className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-yellow-300 transition-colors"
            >
              Starta servicearende
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
