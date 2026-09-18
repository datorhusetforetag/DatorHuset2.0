import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Headset } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSiteSettings } from "@/hooks/useSiteSettings";

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
    <PageShell>
      <PageHero
        sandboxId="service-hero"
        eyebrow={pageSettings.heroEyebrow}
        title={pageSettings.heroTitle}
        lede={pageSettings.heroDescription}
        actions={
          <>
            <Link to={pageSettings.primaryHref} className="btn-primary">
              <Headset className="h-4 w-4" />
              {pageSettings.primaryLabel}
            </Link>
            <Link to={pageSettings.secondaryHref} className="btn-secondary">
              {pageSettings.secondaryLabel}
            </Link>
          </>
        }
      />

        <section className="container mx-auto px-4 py-10 sm:py-12">
          <div className="mx-auto max-w-4xl">
            <div data-sandbox-id="service-flow" className="space-y-3 text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">{pageSettings.flowTitle}</h2>
              <p className="text-muted-foreground">{pageSettings.flowDescription}</p>
            </div>

            <div className="mt-10 flex flex-col items-center gap-10">
              <div className="w-full max-w-3xl rounded-xl border bg-[var(--site-muted-bg)] dark:bg-[var(--site-card-bg-dark)]" style={{ borderColor: "var(--site-card-border-current)" }}>
                <Accordion type="single" collapsible defaultValue={pageSettings.steps[0]?.value || "step-1"} className="w-full">
                  {pageSettings.steps.map((step) => (
                    <AccordionItem key={step.value} value={step.value} className="px-6" style={{ borderColor: "var(--site-card-border-current)" }}>
                      <AccordionTrigger className="text-left">{step.title}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{step.body}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div data-sandbox-id="service-form" className="w-full max-w-3xl">
                <h2 className="mb-3 text-center text-2xl font-bold sm:text-3xl">{pageSettings.formTitle}</h2>
                <p className="mb-6 text-center text-muted-foreground">{pageSettings.formDescription}</p>
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
                        className="field"
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
                        className="field"
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
                        className="field"
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
                        className="field"
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
                        className="field"
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
                        className="field"
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
                        className="field"
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
                        className="field"
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
                      className="field min-h-[160px]"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-foreground/10">
                      <input type="checkbox" checked={formData.needsBackup} onChange={updateCheckbox("needsBackup")} className="h-4 w-4" />
                      Jag vill diskutera backup / datasäkerhet
                    </label>
                    <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-foreground/10">
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
                    <p className="text-xs text-muted-foreground">
                      Genom att skicka formuläret godkänner du att vi kontaktar dig om ditt ärende.
                    </p>
                    <button
                      type="submit"
                      disabled={submitStatus === "sending"}
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitStatus === "sending" ? "Skickar..." : "Skicka serviceförfrågan"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
    </PageShell>
  );
}
