import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Headset } from "lucide-react";

const steps = [
  {
    value: "step-1",
    title: "1. Fels?k din enhet",
    body: "Beskriv felet s? noggrant du kan. V?ra tekniker analyserar och ?terkommer snabbt.",
  },
  {
    value: "step-2",
    title: "2. Godk?nn offert",
    body: "Vi svarar med rekommendation, prisbild och tidsplan. Du f?r en tydlig offert innan vi startar. Inga dolda kostnader.",
  },
  {
    value: "step-3",
    title: "3. Service och test",
    body: "Vi reparerar, uppgraderar och stresstestar f?r att s?kerst?lla stabilitet.",
  },
  {
    value: "step-4",
    title: "4. H?mta upp eller f? leverans",
    body: "Vi meddelar n?r din dator ?r klar. V?lj h?mtning eller leverans. Se instruktioner i Mina best?llningar.",
  },
  {
    value: "step-5",
    title: "5. Efterservice",
    body: "Behov av finjustering? Vi finns kvar f?r support och tips.",
  },
];

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  deviceType: "Station?r dator",
  brandModel: "",
  issueType: "Prestanda / lagg",
  urgency: "Inom 1-2 dagar",
  serialNumber: "",
  notes: "",
  needsBackup: false,
  wantsQuote: false,
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ServiceRepair() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const [formData, setFormData] = useState(initialFormState);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [submitError, setSubmitError] = useState("");

  const updateField =
    (field: keyof typeof initialFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

  const updateCheckbox =
    (field: keyof typeof initialFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.checked;
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedNotes = formData.notes.trim();

    if (!trimmedName) {
      setSubmitStatus("error");
      setSubmitError("Ange ditt namn s? vi kan ?terkomma.");
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setSubmitStatus("error");
      setSubmitError("Ange en giltig e-postadress.");
      return;
    }

    if (!trimmedNotes) {
      setSubmitStatus("error");
      setSubmitError("Beskriv problemet s? detaljerat du kan.");
      return;
    }

    setSubmitStatus("sending");

    try {
      const response = await fetch(`${apiBase}/api/service-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: formData.phone.trim(),
          deviceType: formData.deviceType,
          brandModel: formData.brandModel.trim(),
          issueType: formData.issueType,
          urgency: formData.urgency,
          serialNumber: formData.serialNumber.trim(),
          notes: trimmedNotes,
          needsBackup: formData.needsBackup,
          wantsQuote: formData.wantsQuote,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Kunde inte skicka f?rfr?gan.");
      }

      setSubmitStatus("sent");
      setFormData(initialFormState);
    } catch (error) {
      setSubmitStatus("error");
      setSubmitError(error instanceof Error ? error.message : "Kunde inte skicka f?rfr?gan.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-yellow-400">
          <div className="container mx-auto px-4 pt-16 sm:pt-20 lg:pt-24 pb-10 sm:pb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-700">Service & reparation</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 text-gray-900">
              Vi reparerar, uppgraderar och optimerar din dator
            </h1>
            <p className="text-gray-800 mt-4 max-w-2xl">
              DatorHuset hj?lper dig med allt fr?n fels?kning till komplett uppgradering. Snabb respons,
              tydlig offert och service som s?tter prestanda i fokus.
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
                Se v?ra datorer
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10 sm:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold">L?mna in p? reparation? B?rja h?r.</h2>
              <p className="text-gray-600 dark:text-gray-300">
                V?rt fl?de ?r byggt f?r tydlighet och snabbhet. Du vet vad som sker och n?r.
              </p>
            </div>

            <div className="mt-10 flex flex-col items-center gap-10">
              <div className="w-full max-w-3xl rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
                <Accordion type="single" collapsible defaultValue="step-1" className="w-full">
                  {steps.map((step) => (
                    <AccordionItem key={step.value} value={step.value} className="px-6 border-gray-200 dark:border-gray-800">
                      <AccordionTrigger className="text-left text-gray-900 dark:text-gray-100">
                        {step.title}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 dark:text-gray-300">{step.body}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="w-full max-w-3xl">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-center">Beskriv ditt problem</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                  Fyll i formul?ret s? kan vi snabbare hj?lpa dig r?tt. Ju mer detaljer, desto b?ttre offert.
                </p>
                <form
                  onSubmit={handleSubmit}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6 space-y-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-name">Namn</label>
                      <input
                        id="service-name"
                        type="text"
                        placeholder="F?r- och efternamn"
                        value={formData.name}
                        onChange={updateField("name")}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-4 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-email">E-post</label>
                      <input
                        id="service-email"
                        type="email"
                        placeholder="namn@exempel.se"
                        value={formData.email}
                        onChange={updateField("email")}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-4 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-phone">Telefon (valfritt)</label>
                      <input
                        id="service-phone"
                        type="tel"
                        placeholder="07x xxx xx xx"
                        value={formData.phone}
                        onChange={updateField("phone")}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-4 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-device">Enhetstyp</label>
                      <select
                        id="service-device"
                        value={formData.deviceType}
                        onChange={updateField("deviceType")}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-4 py-2 text-sm"
                      >
                        <option>Station?r dator</option>
                        <option>Laptop</option>
                        <option>Komponent</option>
                        <option>Annat</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-brand">M?rke/modell</label>
                      <input
                        id="service-brand"
                        type="text"
                        placeholder="Ex: DatorHuset Silver Ascent"
                        value={formData.brandModel}
                        onChange={updateField("brandModel")}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-4 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-type">Typ av problem</label>
                      <select
                        id="service-type"
                        value={formData.issueType}
                        onChange={updateField("issueType")}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-4 py-2 text-sm"
                      >
                        <option>Prestanda / lagg</option>
                        <option>Startar inte</option>
                        <option>?verhettning / fl?ktljud</option>
                        <option>Sk?rm / bildproblem</option>
                        <option>Uppgradering</option>
                        <option>Annat</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-urgency">Hur br?dskande ?r det?</label>
                      <select
                        id="service-urgency"
                        value={formData.urgency}
                        onChange={updateField("urgency")}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-4 py-2 text-sm"
                      >
                        <option>Inom 1-2 dagar</option>
                        <option>Inom en vecka</option>
                        <option>Ingen br?dska</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-serial">Serienummer (valfritt)</label>
                      <input
                        id="service-serial"
                        type="text"
                        placeholder="Serienummer"
                        value={formData.serialNumber}
                        onChange={updateField("serialNumber")}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-4 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold" htmlFor="service-notes">Beskriv problemet</label>
                    <textarea
                      id="service-notes"
                      rows={5}
                      placeholder="Ber?tta vad som h?nder, n?r felet uppst?r och vad du redan testat."
                      value={formData.notes}
                      onChange={updateField("notes")}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1824] px-4 py-2 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={formData.needsBackup}
                        onChange={updateCheckbox("needsBackup")}
                      />
                      Jag beh?ver hj?lp med backup av data
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={formData.wantsQuote}
                        onChange={updateCheckbox("wantsQuote")}
                      />
                      Jag vill ha offert innan arbete p?b?rjas
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="submit"
                      disabled={submitStatus === "sending"}
                      className="w-full md:w-auto bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-[#11667b] hover:text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {submitStatus === "sending" ? "Skickar..." : "Skicka f?rfr?gan"}
                    </button>
                    {submitStatus === "sent" && (
                      <p className="text-sm text-emerald-500">Tack! Vi har tagit emot din f?rfr?gan och ?terkommer snart.</p>
                    )}
                    {submitStatus === "error" && submitError && (
                      <p className="text-sm text-red-500">{submitError}</p>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
