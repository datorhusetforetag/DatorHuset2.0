import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpCircle,
  Gauge,
  Headset,
  MonitorX,
  PowerOff,
  Thermometer,
  Wrench,
} from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { PAGE_BANNERS } from "@/lib/pageBanners";
import { Reveal } from "@/components/Reveal";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Service och reparation.
 *
 * Sidan var den sista som låg kvar i den gamla formen. Allt stod mitt
 * på sidan i en smal spalt: en centrerad rubrik, ett dragspel med fyra
 * steg, och sedan nio formulärfält i en enda hög i en ruta med
 * hårdkodad kulör. Den läste som ett formulär man skickats till, inte
 * som en sida i butiken.
 *
 * Tre saker är ändrade, och alla tre av samma skäl - att sidan ska
 * svara på frågorna i den ordning man faktiskt ställer dem:
 *
 *   1. "Lagar ni sånt här?" kommer först, som en rad ikoner. Sex korta
 *      etiketter går fortare att läsa än ett stycke, och de är exakt de
 *      kategorier som går att välja i formuläret - inga löften utöver
 *      vad vi tar emot.
 *   2. "Hur går det till?" står uppslaget i stället för i ett dragspel.
 *      Fyra korta stycken som måste klickas upp ett i taget är ett
 *      dragspel för dragspelets skull.
 *   3. "Vad behöver ni av mig?" är formuläret, uppdelat i tre block med
 *      var sitt nummer, och med en spalt bredvid som följer med när man
 *      rullar. Svaren på det man undrar medan man fyller i finns kvar
 *      oavsett hur långt ned man har kommit.
 */

const ACCENT = PAGE_BANNERS.service.accent;

/* Kategorierna är desamma som i formulärets "Typ av problem". Står det
   något här som inte går att välja där har sidan börjat lova saker vi
   inte tar emot. */
const CASES = [
  {
    icon: Gauge,
    label: "Prestanda och lagg",
    hint: "Hackar i spel, långsam start, fläktar som går för fullt utan anledning.",
  },
  {
    icon: PowerOff,
    label: "Startar inte",
    hint: "Svart skärm, ingen bild, eller en dator som startar om i en loop.",
  },
  {
    icon: Thermometer,
    label: "Överhettning",
    hint: "Temperaturer som drar iväg, ljudnivå som stigit, avstängningar mitt i.",
  },
  {
    icon: MonitorX,
    label: "Skärm och grafik",
    hint: "Artefakter, flimmer, drivrutiner som kraschar eller bild som försvinner.",
  },
  {
    icon: ArrowUpCircle,
    label: "Uppgradering",
    hint: "Nytt grafikkort, mer minne, större disk - och att allt fungerar efteråt.",
  },
  {
    icon: Wrench,
    label: "Annat",
    hint: "Vet du inte vad det är? Beskriv vad som händer så listar vi ut det.",
  },
];

/* Spalten bredvid formuläret. Inga priser och inga tider - dem kan vi
   inte lova innan vi sett maskinen, och en siffra här som inte håller
   är värre än ingen siffra alls. */
const ASIDE_NOTES = [
  {
    title: "Vad det kostar",
    body: "Vi ger ett pris först när vi vet vad det är. Kryssa i rutan för offert så gör vi ingenting förrän du sagt ja.",
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
 * Ett block i formuläret: nummer, rubrik och fälten under.
 *
 * Numret är hela poängen. Ett formulär med tolv fält i rad läses som
 * ett hinder; samma tolv fält i tre numrerade block läses som tre
 * frågor, och man ser hela tiden hur mycket som är kvar.
 */
const FormGroup = ({
  title,
  step,
  last = false,
  children,
}: {
  title: string;
  step: string;
  last?: boolean;
  children: ReactNode;
}) => (
  <fieldset
    className={`p-6 sm:p-8 ${last ? "" : "border-b border-foreground/10"}`}
  >
    <legend className="sr-only">{title}</legend>
    <div className="mb-6 flex items-baseline gap-3">
      <span
        aria-hidden="true"
        className="font-display text-sm font-bold tabular-nums"
        style={{ color: ACCENT }}
      >
        {step}
      </span>
      <span className="font-display text-base font-bold tracking-tight text-foreground">
        {title}
      </span>
    </div>
    {children}
  </fieldset>
);

/**
 * Etikett över fält.
 *
 * Etiketten skrevs tidigare ut för hand nio gånger med samma klasser.
 * "(valfritt)" står som eget ord i svagare ton i stället för inbakat i
 * etiketten, så att den som skummar ser vilka fält som går att hoppa
 * över utan att läsa dem.
 */
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
  <div className="space-y-2">
    <label className="flex items-baseline gap-2 text-sm font-semibold" htmlFor={id}>
      {label}
      {optional && (
        <span className="text-xs font-normal text-muted-foreground">valfritt</span>
      )}
    </label>
    {children}
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
        image={PAGE_BANNERS.service.image}
        accent={ACCENT}
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Service & reparation" }]}
        eyebrow={pageSettings.heroEyebrow}
        title={pageSettings.heroTitle}
        lede={pageSettings.heroDescription}
        facts={[
          "Alla märken, inte bara våra",
          "Offert innan arbete om du vill",
          "Felsökning på plats i Spånga",
        ]}
        actions={
          <>
            {/* Formuläret står längre ned på samma sida, så den
                självklara knappen är en hopplänk dit och inte en länk
                bort. De två inställda knapparna ligger kvar efter den. */}
            <a href="#service-form" className="btn-primary">
              <Wrench className="h-4 w-4" />
              Skicka in ditt ärende
            </a>
            <Link to={pageSettings.primaryHref} className="btn-secondary">
              <Headset className="h-4 w-4" />
              {pageSettings.primaryLabel}
            </Link>
            <Link to={pageSettings.secondaryHref} className="btn-secondary">
              {pageSettings.secondaryLabel}
            </Link>
          </>
        }
      />

      {/* Vanliga ärenden ------------------------------------------------- */}
      <section data-sandbox-id="service-cases" className="relative">
        <div className="container mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <Reveal>
            <p className="eyebrow" style={{ color: ACCENT }}>
              Vanliga ärenden
            </p>
            <h2 className="section-title mt-3 text-2xl sm:text-3xl">
              Det här är vad som brukar komma in
            </h2>
          </Reveal>

          <ul className="mt-9 grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {CASES.map(({ icon: Icon, label, hint }, index) => (
              <Reveal
                as="li"
                key={label}
                delay={index * 70}
                className="flex items-start gap-4 border-t border-foreground/10 pt-5 transition-colors hover:border-foreground/30"
              >
                <span
                  aria-hidden="true"
                  className="mt-[2px] flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: ACCENT + "1F", color: ACCENT }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-base font-bold tracking-tight text-foreground">
                    {label}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                    {hint}
                  </span>
                </span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Så går det till -------------------------------------------------
          Rubriken står stilla medan stegen rullar förbi, samma grepp
          som "Hur DatorHuset kör" på startsidan. */}
      <section data-sandbox-id="service-flow" className="relative">
        <div className="container mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal className="lg:self-start">
              <p className="eyebrow" style={{ color: ACCENT }}>
                Så går det till
              </p>
              <h2 className="section-title mt-3 text-3xl sm:text-4xl">
                {pageSettings.flowTitle}
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                {pageSettings.flowDescription}
              </p>
              <span
                aria-hidden="true"
                className="mt-8 hidden h-px w-24 lg:block"
                style={{ backgroundColor: ACCENT }}
              />
            </Reveal>

            <ol className="divide-y divide-foreground/10 border-t border-foreground/10">
              {pageSettings.steps.map((step, index) => (
                <Reveal
                  as="li"
                  key={step.value}
                  delay={index * 80}
                  className="grid gap-2 py-7 sm:grid-cols-[3.5rem_1fr] sm:gap-6"
                >
                  <span
                    aria-hidden="true"
                    className="select-none font-display text-2xl font-bold leading-none tabular-nums sm:text-3xl"
                    style={{ color: ACCENT, opacity: 0.45 }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block font-display text-lg font-bold tracking-tight text-foreground">
                      {step.title}
                    </span>
                    <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </span>
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Formuläret ------------------------------------------------------- */}
      <section id="service-form" data-sandbox-id="service-form" className="relative scroll-mt-24">
        <div className="container mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:gap-12">
            <Reveal>
              <p className="eyebrow" style={{ color: ACCENT }}>
                Skicka in
              </p>
              <h2 className="section-title mt-3 text-3xl sm:text-4xl">
                {pageSettings.formTitle}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                {pageSettings.formDescription}
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-9 overflow-hidden rounded-lg border border-foreground/10 bg-background/70"
              >
                <FormGroup title="Om dig" step="01">
                  <div className="grid gap-4 sm:grid-cols-2">
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

                <FormGroup title="Om maskinen" step="02">
                  <div className="grid gap-4 sm:grid-cols-2">
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
                        placeholder="Exempel: ASUS TUF / Egna delar"
                        value={formData.brandModel}
                        onChange={updateField("brandModel")}
                        className="field"
                      />
                    </Field>
                    <Field id="service-serial" label="Serienummer" optional>
                      <input
                        id="service-serial"
                        type="text"
                        placeholder="Om du har ett tillgängligt"
                        value={formData.serialNumber}
                        onChange={updateField("serialNumber")}
                        className="field"
                      />
                    </Field>
                  </div>
                </FormGroup>

                <FormGroup title="Om felet" step="03" last>
                  <div className="grid gap-4 sm:grid-cols-2">
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
                    <Field id="service-urgency" label="Hur snabbt behov?">
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

                  <div className="mt-4">
                    <Field id="service-notes" label="Beskrivning">
                      <textarea
                        id="service-notes"
                        placeholder="Beskriv symptom, när problemet uppstår och vad du redan testat."
                        value={formData.notes}
                        onChange={updateField("notes")}
                        className="field min-h-[160px]"
                      />
                    </Field>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-foreground/15 bg-foreground/[0.03] px-4 py-3 text-sm transition-colors hover:border-foreground/30">
                      <input
                        type="checkbox"
                        checked={formData.needsBackup}
                        onChange={updateCheckbox("needsBackup")}
                        className="h-4 w-4 accent-primary"
                      />
                      Jag vill diskutera backup / datasäkerhet
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-foreground/15 bg-foreground/[0.03] px-4 py-3 text-sm transition-colors hover:border-foreground/30">
                      <input
                        type="checkbox"
                        checked={formData.wantsQuote}
                        onChange={updateCheckbox("wantsQuote")}
                        className="h-4 w-4 accent-primary"
                      />
                      Jag vill ha offert innan arbete startar
                    </label>
                  </div>
                </FormGroup>

                {/* Kvittensen ligger i foten, intill knappen som just
                    trycktes - inte längst upp där man inte tittar. */}
                <div className="border-t border-foreground/10 bg-foreground/[0.03] p-6 sm:p-8">
                  {submitStatus === "error" && submitError ? (
                    <div
                      role="alert"
                      className="mb-5 rounded-sm border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                      {submitError}
                    </div>
                  ) : null}
                  {submitStatus === "sent" ? (
                    <div
                      role="status"
                      className="mb-5 rounded-sm border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
                    >
                      Din serviceförfrågan är skickad. Vi återkommer så snart vi kan.
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                      Genom att skicka formuläret godkänner du att vi kontaktar
                      dig om ditt ärende.
                    </p>
                    <button
                      type="submit"
                      disabled={submitStatus === "sending"}
                      className="btn-primary w-full shrink-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {submitStatus === "sending" ? "Skickar..." : "Skicka serviceförfrågan"}
                    </button>
                  </div>
                </div>
              </form>
            </Reveal>

            {/* Spalten bredvid följer med när man rullar, så svaren finns
                kvar oavsett hur långt ned i formuläret man har kommit. */}
            <Reveal delay={120} className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-lg border border-foreground/10 bg-background/70 p-7">
                <h3 className="font-display text-lg font-bold text-foreground">
                  Bra att veta
                </h3>
                <ul className="mt-5 space-y-5">
                  {ASIDE_NOTES.map((note) => (
                    <li key={note.title}>
                      <span
                        className="block text-[11px] font-bold uppercase tracking-[0.2em]"
                        style={{ color: ACCENT }}
                      >
                        {note.title}
                      </span>
                      <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                        {note.body}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 rounded-lg border border-foreground/10 bg-background/70 p-7">
                <h3 className="font-display text-lg font-bold text-foreground">
                  Hellre prata först?
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Är du osäker på om det är värt att laga? Hör av dig innan du
                  skickar in. Vi säger till om vi tycker att pengarna gör bättre
                  nytta i en ny dator.
                </p>
                <Link to="/kundservice" className="btn-secondary mt-6 w-full">
                  Kontakta kundservice
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
