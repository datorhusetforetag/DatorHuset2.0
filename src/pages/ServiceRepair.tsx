import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Headset } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildSiteThemeVars } from "@/lib/siteTheme";

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  deviceType: "Stationär dator",
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
  const themeVars = buildSiteThemeVars(siteSettings.site.theme);
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
      setSubmitError("Ange ditt namn så vi kan återkomma.");
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
        throw new Error(data?.error || "Kunde inte skicka förfrågan.");
      }

      setSubmitStatus("sent");
      setFormData(initialFormState);
    } catch (error) {
      setSubmitStatus("error");
      setSubmitError(error instanceof Error ? error.message : "Kunde inte skicka förfrågan.");
    }
  };

  return (
    <div
      data-sandbox-id="global-theme"
      style={themeVars}
      className="min-h-screen flex flex-col bg-[var(--site-page-bg)] text-[var(--site-text-primary)] dark:bg-[var(--site-page-bg-dark)] dark:text-[var(--site-text-primary-dark)]"
    >
      <Navbar />
      <main className="flex-1">
        <section data-sandbox-id="service-hero" className="bg-[var(--site-brand-bg)] text-[var(--site-brand-text)]">
          <div className="container mx-auto px-4 pb-10 pt-16 sm:pb-12 sm:pt-20 lg:pt-24">
            <p className="text-xs uppercase tracking-[0.35em] opacity-70">{pageSettings.heroEyebrow}</p>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl">{pageSettings.heroTitle}</h1>
            <p className="mt-4 max-w-2xl opacity-85">{pageSettings.heroDescription}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to={pageSettings.primaryHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--site-surface-bg-current)", color: "var(--site-text-primary-current)" }}
              >
                <Headset className="h-5 w-5" />
                {pageSettings.primaryLabel}
              </Link>
              <Link
                to={pageSettings.secondaryHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg border px-6 py-3 font-semibold transition-opacity hover:opacity-90"
                style={{ borderColor: "var(--site-brand-text)", color: "var(--site-brand-text)" }}
              >
                {pageSettings.secondaryLabel}
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10 sm:py-12">
          <div className="mx-auto max-w-4xl">
            <div data-sandbox-id="service-flow" className="space-y-3 text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">{pageSettings.flowTitle}</h2>
              <p className="text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)]">{pageSettings.flowDescription}</p>
            </div>

            <div className="mt-10 flex flex-col items-center gap-10">
              <div className="w-full max-w-3xl rounded-xl border bg-[var(--site-muted-bg)] dark:bg-[var(--site-card-bg-dark)]" style={{ borderColor: "var(--site-card-border-current)" }}>
                <Accordion type="single" collapsible defaultValue={pageSettings.steps[0]?.value || "step-1"} className="w-full">
                  {pageSettings.steps.map((step) => (
                    <AccordionItem key={step.value} value={step.value} className="px-6" style={{ borderColor: "var(--site-card-border-current)" }}>
                      <AccordionTrigger className="text-left">{step.title}</AccordionTrigger>
                      <AccordionContent className="text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)]">{step.body}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div data-sandbox-id="service-form" className="w-full max-w-3xl">
                <h2 className="mb-3 text-center text-2xl font-bold sm:text-3xl">{pageSettings.formTitle}</h2>
                <p className="mb-6 text-center text-[var(--site-text-muted)] dark:text-[var(--site-text-muted-dark)]">{pageSettings.formDescription}</p>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 rounded-2xl border bg-[var(--site-card-bg)] p-4 dark:bg-[var(--site-card-bg-dark)] sm:p-6"
                  style={{ borderColor: "var(--site-card-border-current)" }}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-name">
                        Namn
                      </label>
                      <input
                        id="service-name"
                        type="text"
                        placeholder="För- och efternamn"
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
                        <option>Stationär dator</option>
                        <option>Gamingdator</option>
                        <option>Laptop</option>
                        <option>Komponent / tillbehor</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-brand">
                        Märke / modell
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
                        <option>Överhettning</option>
                        <option>Skärm / grafik</option>
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
                        <option>Ingen brådska</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="service-serial">
                        Serienummer (valfritt)
                      </label>
                      <input
                        id="service-serial"
                        type="text"
                        placeholder="Om du har ett tillgängligt"
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
                      placeholder="Beskriv symptom, när problemet uppstår och vad du redan testat."
                      value={formData.notes}
                      onChange={updateField("notes")}
                      className="min-h-[160px] w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-[#0f1824]"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
                      <input type="checkbox" checked={formData.needsBackup} onChange={updateCheckbox("needsBackup")} className="h-4 w-4" />
                      Jag vill diskutera backup / datasäkerhet
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
                      Din serviceförfrågan är skickad. Vi återkommer så snart vi kan.
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Genom att skicka formuläret godkänner du att vi kontaktar dig om ditt ärende.
                    </p>
                    <button
                      type="submit"
                      disabled={submitStatus === "sending"}
                      className="inline-flex items-center justify-center rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-gray-900 transition-colors hover:bg-[#11667b] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitStatus === "sending" ? "Skickar..." : "Skicka serviceförfrågan"}
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
