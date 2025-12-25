import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BadgeCheck, Cpu, Hammer, Headset, Laptop, ShieldCheck, Wrench } from "lucide-react";

const serviceCards = [
  {
    title: "Gamingdatorer",
    description: "Felsökning, uppgradering och kylning för maxad prestanda.",
    icon: Cpu,
  },
  {
    title: "Företagsdatorer",
    description: "Stabil drift, snabb service och trygg hantering av data.",
    icon: ShieldCheck,
  },
  {
    title: "Laptop & komponenter",
    description: "Byte av delar, batteri, skärm och lagring.",
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
    title: "1. Felsök din enhet",
    body: "Beskriv felet så noggrant du kan. Vi svarar med rekommendation, prisbild och tidsplan.",
  },
  {
    value: "step-2",
    title: "2. Godkänn offert",
    body: "Du får en tydlig offert innan vi startar. Inga dolda kostnader.",
  },
  {
    value: "step-3",
    title: "3. Service och test",
    body: "Vi reparerar, uppgraderar och stress-testar för att säkerställa stabilitet.",
  },
  {
    value: "step-4",
    title: "4. Hämta upp eller få leverans",
    body: "Vi meddelar när din dator är klar. Välj hämtning eller leverans.",
  },
  {
    value: "step-5",
    title: "5. Efterservice",
    body: "Behov av finjustering? Vi finns kvar för support och tips.",
  },
];

export default function ServiceRepair() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-yellow-400">
          <div className="container mx-auto px-4 pt-24 pb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-700">Service & reparation</p>
            <h1 className="text-4xl lg:text-5xl font-bold mt-4 text-gray-900">
              Vi reparerar, uppgraderar och optimerar din dator
            </h1>
            <p className="text-gray-800 mt-4 max-w-2xl">
              DatorHuset hjälper dig med allt från felsökning till komplett uppgradering. Snabb respons,
              tydlig offert och service som sätter prestanda i fokus.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                to="/kundservice"
                className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] transition-colors"
              >
                <Headset className="w-5 h-5" />
                Kontakta service
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 border border-gray-900 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:border-[#11667b] hover:text-white transition-colors"
              >
                Se våra datorer
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="flex flex-col gap-4 mb-8">
            <h2 className="text-2xl font-bold">Vad vi hjälper till med</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Välj den service som passar ditt behov. Vi erbjuder allt från felsökning till kompletta uppgraderingar.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceCards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm"
              >
                <card.icon className="w-8 h-8 text-[#11667b] mb-4" />
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
            <div>
              <h2 className="text-3xl font-bold mb-3">Lämna in på reparation? Börja här.</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Vårt flöde är byggt för tydlighet och snabbhet. Du vet vad som sker och när.
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
                <Wrench className="w-6 h-6 text-[#11667b]" />
                <h3 className="text-xl font-semibold">Vad vi kan hjälpa med</h3>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2"><BadgeCheck className="w-4 h-4 text-[#11667b] mt-0.5" /> Felsökning av dator och komponenter</li>
                <li className="flex items-start gap-2"><BadgeCheck className="w-4 h-4 text-[#11667b] mt-0.5" /> Rengöring, kylning och kabeldragning</li>
                <li className="flex items-start gap-2"><BadgeCheck className="w-4 h-4 text-[#11667b] mt-0.5" /> Uppgradering av GPU, CPU, RAM och lagring</li>
                <li className="flex items-start gap-2"><BadgeCheck className="w-4 h-4 text-[#11667b] mt-0.5" /> Installation av OS, drivrutiner och optimering</li>
                <li className="flex items-start gap-2"><BadgeCheck className="w-4 h-4 text-[#11667b] mt-0.5" /> Dataöverföring och backup-råd</li>
              </ul>
              <div className="mt-6 rounded-lg bg-[#11667b]/10 border border-[#11667b]/30 p-4 text-sm text-gray-900 dark:text-gray-100">
                Snabbt svar, tydlig offert och service med fokus på prestanda.
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
            <div>
              <h2 className="text-3xl font-bold mb-3">Beskriv ditt problem</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Fyll i formuläret så kan vi snabbare hjälpa dig rätt. Ju mer detaljer, desto bättre offert.
              </p>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" htmlFor="service-name">Namn</label>
                    <input
                      id="service-name"
                      type="text"
                      placeholder="För- och efternamn"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" htmlFor="service-email">E-post</label>
                    <input
                      id="service-email"
                      type="email"
                      placeholder="namn@exempel.se"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" htmlFor="service-phone">Telefon (valfritt)</label>
                    <input
                      id="service-phone"
                      type="tel"
                      placeholder="07x xxx xx xx"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" htmlFor="service-device">Enhetstyp</label>
                    <select
                      id="service-device"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2 text-sm"
                    >
                      <option>Stationär dator</option>
                      <option>Laptop</option>
                      <option>Komponent</option>
                      <option>Annat</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" htmlFor="service-brand">Märke/modell</label>
                    <input
                      id="service-brand"
                      type="text"
                      placeholder="Ex: DatorHuset Silver Ascent"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" htmlFor="service-type">Typ av problem</label>
                    <select
                      id="service-type"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2 text-sm"
                    >
                      <option>Prestanda / lagg</option>
                      <option>Startar inte</option>
                      <option>Överhettning / fläktljud</option>
                      <option>Skärm / bildproblem</option>
                      <option>Uppgradering</option>
                      <option>Annat</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" htmlFor="service-urgency">Hur brådskande är det?</label>
                    <select
                      id="service-urgency"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2 text-sm"
                    >
                      <option>Inom 1-2 dagar</option>
                      <option>Inom en vecka</option>
                      <option>Ingen brådska</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" htmlFor="service-serial">Serienummer (valfritt)</label>
                    <input
                      id="service-serial"
                      type="text"
                      placeholder="Serienummer"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="service-notes">Beskriv problemet</label>
                  <textarea
                    id="service-notes"
                    rows={5}
                    placeholder="Berätta vad som händer, när felet uppstår och vad du redan testat."
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    Jag behöver hjälp med backup av data
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    Jag vill ha offert innan arbete påbörjas
                  </label>
                </div>

                <button
                  type="button"
                  className="w-full md:w-auto bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:text-white transition-colors"
                >
                  Skicka förfrågan
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-900 text-white px-8 py-10 flex flex-col gap-4">
              <h3 className="text-2xl font-bold">Redo att få din dator i toppskick?</h3>
              <p className="text-gray-300">Skicka en kort beskrivning av felet så återkommer vi snabbt.</p>
              <Link
                to="/kundservice"
                className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:text-white transition-colors"
              >
                Kontakta oss direkt
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
