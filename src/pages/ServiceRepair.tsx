import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { INFO_PAGE_BACKGROUND, PageShell } from "@/components/PageShell";
import { InfoPageHeader } from "@/components/InfoPageHeader";
import { Reveal } from "@/components/Reveal";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Service och reparation.
 *
 * Samma form som kundservice: en låg lila list med rubriken, och sedan
 * formuläret som ett tätt kort mitt på den mörka duken. Sidan finns för
 * att man ska kunna skicka in ett ärende, så det är formuläret som står
 * först - inte en uppräkning av vad vi lagar eller hur flödet ser ut.
 *
 * Det man undrar medan man fyller i ligger i ett kort under formuläret.
 */

/* Det som står under formuläret. Inga priser och inga tider - dem kan vi
   inte lova innan vi sett maskinen, och en siffra här som inte håller
   är värre än ingen siffra alls. */
const NOTES = [
  {
    title: "Vad det kostar",
    body: "Vi ger ett pris först när vi vet vad det är, och börjar inte arbeta förrän du har godkänt offerten.",
  },
  {
    title: "Innan du skickar",
    body: "Skriv när felet började och vad du redan har testat. Det är den uppgiften som oftast kortar ned tiden mest.",
  },
  {
    title: "Dina filer",
    body: "Säg till om det finns något på disken du inte kan förlora, så hanterar vi den därefter.",
  },
  {
    title: "Även om du inte köpt hos oss",
    body: "Vi tar emot maskiner oavsett var de är byggda, och oavsett om de är byggda för hand eller köpta i låda.",
  },
];

/**
 * Ett block i formuläret: en liten rubrik och fälten under.
 *
 * Tolv fält i rad läses som ett hinder; samma fält i tre namngivna
 * block läses som tre frågor, och man ser hur mycket som är kvar.
 *
 * Rubriken är en vanlig rad och inte en <legend> som syns. Webbläsarna
 * ritar legend in i ramen på fieldset och den går inte att placera
 * pålitligt, så legend finns bara för skärmläsare.
 */
const FormGroup = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className="border-t border-white/[0.06] pt-7 first:border-t-0 first:pt-0">
    <legend className="sr-only">{title}</legend>
    <p
      aria-hidden="true"
      className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/50"
    >
      {title}
    </p>
    {children}
  </fieldset>
);

/* Etikett över fält, som på kundservice. "valfritt" står i svagare ton
   så att den som skummar ser vilka fält som går att hoppa över. */
const Field = ({
  id,
  label,
  optional = false,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  children: ReactNode;
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-white/85">
      {label}
      {optional && <span className="font-normal text-white/45"> (valfritt)</span>}
    </label>
    <div className="mt-2">{children}</div>
  </div>
);

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
      setSubmitError("Beskriv problemet så detaljerat du kan.");
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
    <PageShell background={INFO_PAGE_BACKGROUND}>
      <InfoPageHeader
        sandboxId="service-hero"
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Service & reparation" }]}
        title={pageSettings.heroTitle}
      />

      <section id="service-form" data-sandbox-id="service-form" className="relative scroll-mt-24">
        <div className="container mx-auto max-w-5xl space-y-6 px-4 pb-24 pt-12 sm:pt-16">
          <Reveal className="info-panel px-5 py-10 sm:px-14 sm:py-14">
            <h2 className="text-center font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {pageSettings.formTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-white/60">
              {pageSettings.formDescription}
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-7" noValidate>
              <FormGroup title="Om dig">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Field id="service-name" label="Namn">
                    <input
                      id="service-name"
                      type="text"
                      placeholder="För- och efternamn"
                      autoComplete="name"
                      value={formData.name}
                      onChange={updateField("name")}
                      className="field"
                    />
                  </Field>
                  <Field id="service-email" label="E-post">
                    <input
                      id="service-email"
                      type="email"
                      placeholder="namn@exempel.se"
                      autoComplete="email"
                      value={formData.email}
                      onChange={updateField("email")}
                      className="field"
                    />
                  </Field>
                  <Field id="service-phone" label="Telefon" optional>
                    <input
                      id="service-phone"
                      type="tel"
                      placeholder="07X-XXX XX XX"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={updateField("phone")}
                      className="field"
                    />
                  </Field>
                </div>
              </FormGroup>

              <FormGroup title="Om datorn">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Field id="service-device" label="Enhet">
                    <select
                      id="service-device"
                      value={formData.deviceType}
                      onChange={updateField("deviceType")}
                      className="field"
                    >
                      <option>Stationär dator</option>
                      <option>Gamingdator</option>
                      <option>Laptop</option>
                      <option>Komponent / tillbehör</option>
                    </select>
                  </Field>
                  <Field id="service-brand" label="Märke / modell">
                    <input
                      id="service-brand"
                      type="text"
                      placeholder="T.ex. ASUS TUF / egna delar"
                      value={formData.brandModel}
                      onChange={updateField("brandModel")}
                      className="field"
                    />
                  </Field>
                  <Field id="service-serial" label="Serienummer" optional>
                    <input
                      id="service-serial"
                      type="text"
                      placeholder="Om du har det"
                      value={formData.serialNumber}
                      onChange={updateField("serialNumber")}
                      className="field"
                    />
                  </Field>
                </div>
              </FormGroup>

              <FormGroup title="Om felet">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="service-issue" label="Typ av problem">
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
                  </Field>
                  <Field id="service-urgency" label="Hur bråttom är det?">
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
                  </Field>
                </div>

                <div className="mt-5">
                  <Field id="service-notes" label="Beskrivning">
                    <textarea
                      id="service-notes"
                      placeholder="Beskriv symptomen, när problemet uppstår och vad du redan har testat."
                      value={formData.notes}
                      onChange={updateField("notes")}
                      className="field min-h-[9rem] resize-y"
                    />
                  </Field>
                </div>              </FormGroup>

              {/* Beskedet står ovanför knappen, intill det man just
                  tryckte på - inte längst upp där man inte tittar. */}
              {submitStatus === "error" && submitError && (
                <p role="alert" className="text-sm font-semibold text-destructive">
                  {submitError}
                </p>
              )}
              {submitStatus === "sent" && (
                <p role="status" className="text-sm font-semibold text-primary">
                  Din serviceförfrågan är skickad. Vi återkommer så snart vi kan.
                </p>
              )}

              <div className="pt-3 text-center">
                <button
                  type="submit"
                  disabled={submitStatus === "sending"}
                  className="btn-primary min-w-[10rem] rounded-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitStatus === "sending" ? "Skickar..." : "Skicka"}
                </button>
                <p className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-white/45">
                  Genom att skicka formuläret godkänner du att vi kontaktar dig om
                  ditt ärende.
                </p>
              </div>
            </form>
          </Reveal>

          {/* Bra att veta. Fyra korta svar i rutnät, och en väg till
              kundservice för den som hellre vill prata först. */}
          <Reveal delay={90} as="aside" className="info-panel">
            <div className="grid sm:grid-cols-2">
              {NOTES.map((note, index) => (
                <div
                  key={note.title}
                  className={[
                    "p-6",
                    index > 0 ? "border-t border-white/[0.06]" : "",
                    index === 1 ? "sm:border-t-0" : "",
                    index % 2 === 1 ? "sm:border-l sm:border-white/[0.06]" : "",
                  ].join(" ")}
                >
                  <h3 className="text-sm font-semibold text-white">{note.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/65">{note.body}</p>
                </div>
              ))}
            </div>
            <p className="border-t border-white/[0.06] px-6 py-5 text-sm text-white/65">
              Osäker på om det är värt att laga?{" "}
              <Link
                to="/kundservice"
                className="font-semibold text-white underline-offset-4 hover:underline"
              >
                Kontakta kundservice
              </Link>{" "}
              så säger vi ärligt om pengarna gör bättre nytta i en ny dator.
            </p>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
