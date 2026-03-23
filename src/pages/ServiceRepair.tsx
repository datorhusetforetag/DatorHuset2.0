import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Headset } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  deviceType: "Stationar dator",
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
  const { settings: siteSettings } = useSiteSettings();
  const pageSettings = siteSettings.pages.serviceRepair;
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
      setSubmitError("Ange ditt namn sa vi kan aterkomma.");
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setSubmitStatus("error");
      setSubmitError("Ange en giltig e-postadress.");
      return;
    }

    if (!trimmedNotes) {
      setSubmitStatus("error");
      setSubmitError("Beskriv problemet sa detaljerat du kan.");
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
        throw new Error(data?.error || "Kunde inte skicka forfragan.");
      }

      setSubmitStatus("sent");
      setFormData(initialFormState);
    } catch (error) {
      setSubmitStatus("error");
      setSubmitError(error instanceof Error ? error.message : "Kunde inte skicka forfragan.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 dark:bg-[#0f1824] dark:text-gray-50">
      <Navbar />
      <main className="flex-1">
        <section className="bg-yellow-400">
          <div className="container mx-auto px-4 pb-10 pt-16 sm:pb-12 sm:pt-20 lg:pt-24">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-700">{pageSettings.heroEyebrow}</p>
            <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">{pageSettings.heroTitle}</h1>
            <p className="mt-4 max-w-2xl text-gray-800">{pageSettings.heroDescription}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to={pageSettings.primaryHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-[#11667b]"
              >
                <Headset className="h-5 w-5" />
                {pageSettings.primaryLabel}
              </Link>
              <Link
                to={pageSettings.secondaryHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-900 px-6 py-3 font-semibold text-gray-900 transition-colors hover:border-[#11667b] hover:bg-[#11667b] hover:text-white"
              >
                {pageSettings.secondaryLabel}
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10 sm:py-12">
          <div className="mx-auto max-w-4xl">
            <div className="space-y-3 text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">{pageSettings.flowTitle}</h2>
              <p className="text-gray-600 dark:text-gray-300">{pageSettings.flowDescription}</p>
            </div>

            <div className="mt-10 flex flex-col items-center gap-10">
              <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/60">
                <Accordion type="single" collapsible defaultValue={pageSettings.steps[0]?.value || "step-1"} className="w-full">
                  {pageSettings.steps.map((step) => (
                    <AccordionItem key={step.value} value={step.value} className="border-gray-200 px-6 dark:border-gray-800">
                      <AccordionTrigger className="text-left text-gray-900 dark:text-gray-100">{step.title}</AccordionTrigger>
                      <AccordionContent className="text-gray-600 dark:text-gray-300">{step.body}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="w-full max-w-3xl">
                <h2 className="mb-3 text-center text-2xl font-bold sm:text-3xl">{pageSettings.formTitle}</h2>
                <p className="mb-6 text-center text-gray-600 dark:text-gray-300">{pageSettings.formDescription}</p>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-6"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-name">
                        Namn
                      </label>
                      <input
                        id="service-name"
                        type="text"
                        placeholder="For- och efternamn"
                        value={formData.name}
                        onChange={updateField("name")}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1824]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-email">
                        E-post
                      </label>
                      <input
                        id="service-email"
                        type="email"
                        placeholder="namn@exempel.se"
                        value={formData.email}
                        onChange={updateField("email")}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1824]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-phone">
                        Telefon (valfritt)
                      </label>
                      <input
                        id="service-phone"
                        type="tel"
                        placeholder="07X-XXX XX XX"
                        value={formData.phone}
                        onChange={updateField("phone")}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1824]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-device">
                        Enhet
                      </label>
                      <select
                        id="service-device"
                        value={formData.deviceType}
                        onChange={updateField("deviceType")}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1824]"
                      >
                        <option>Stationar dator</option>
                        <option>Gamingdator</option>
                        <option>Laptop</option>
                        <option>Komponent / tillbehor</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-brand">
                        Marke / modell
                      </label>
                      <input
                        id="service-brand"
                        type="text"
                        placeholder="Exempel: ASUS TUF / Egna delar"
                        value={formData.brandModel}
                        onChange={updateField("brandModel")}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1824]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-issue">
                        Typ av problem
                      </label>
                      <select
                        id="service-issue"
                        value={formData.issueType}
                        onChange={updateField("issueType")}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1824]"
                      >
                        <option>Prestanda / lagg</option>
                        <option>Startar inte</option>
                        <option>Overhettning</option>
                        <option>Skarm / grafik</option>
                        <option>Uppgradering</option>
                        <option>Annat</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-urgency">
                        Hur snabbt behov?
                      </label>
                      <select
                        id="service-urgency"
                        value={formData.urgency}
                        onChange={updateField("urgency")}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1824]"
                      >
                        <option>Akut idag</option>
                        <option>Inom 1-2 dagar</option>
                        <option>Denna vecka</option>
                        <option>Ingen bradska</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-serial">
                        Serienummer (valfritt)
                      </label>
                      <input
                        id="service-serial"
                        type="text"
                        placeholder="Om du har ett tillgangligt"
                        value={formData.serialNumber}
                        onChange={updateField("serialNumber")}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1824]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold" htmlFor="service-notes">
                      Beskrivning
                    </label>
                    <textarea
                      id="service-notes"
                      placeholder="Beskriv symptom, nar problemet uppstar och vad du redan testat."
                      value={formData.notes}
                      onChange={updateField("notes")}
                      className="min-h-[160px] w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-[#0f1824]"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
                      <input type="checkbox" checked={formData.needsBackup} onChange={updateCheckbox("needsBackup")} className="h-4 w-4" />
                      Jag vill diskutera backup / datasakerhet
                    </label>
                    <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
                      <input type="checkbox" checked={formData.wantsQuote} onChange={updateCheckbox("wantsQuote")} className="h-4 w-4" />
                      Jag vill ha offert innan arbete startar
                    </label>
                  </div>

                  {submitStatus === "error" && submitError ? (
                    <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{submitError}</div>
                  ) : null}
                  {submitStatus === "sent" ? (
                    <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      Din serviceforfragan ar skickad. Vi aterkommer sa snart vi kan.
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Genom att skicka formularet godkanner du att vi kontaktar dig om ditt arende.
                    </p>
                    <button
                      type="submit"
                      disabled={submitStatus === "sending"}
                      className="inline-flex items-center justify-center rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-gray-900 transition-colors hover:bg-[#11667b] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitStatus === "sending" ? "Skickar..." : "Skicka serviceforfragan"}
                    </button>
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
