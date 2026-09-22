import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { PAGE_BANNERS } from "@/lib/pageBanners";
import { Reveal } from "@/components/Reveal";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Kundservice.
 *
 * Sidan var tidigare en samling textrutor: e-postadress, öppettider,
 * vanliga ärenden. Allt stod där, men det enda man kunde göra var att
 * kopiera en adress och byta program. Nu är formuläret sidan, och
 * resten ligger under som det uppslagsverk det är.
 *
 * Banderollen är låg och bär bara rubriken. En halv skärm foto ovanför
 * ett formulär skjuter ned det man kom hit för under vikningen.
 */

const TOPICS = [
  "Fråga före köp",
  "Min order",
  "Frakt och leverans",
  "Ångerrätt eller retur",
  "Reklamation eller garanti",
  "Service och reparation",
  "Custom bygg",
  "Annat",
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialFormState = {
  name: "",
  orderNumber: "",
  email: "",
  confirmEmail: "",
  topic: "",
  message: "",
};

/* Etiketten ligger över fältet och stjärnan sitter i etiketten, som i
   förlagan. Stjärnan är bara målad: det är required på elementet som
   gör att en skärmläsare säger att fältet måste fyllas i. */
const Field = ({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) => (
  <div>
    <label htmlFor={id} className="block text-xs font-bold text-foreground">
      {label}
      {required && <span aria-hidden="true">*</span>}
      {hint && <span className="font-normal text-muted-foreground"> {hint}</span>}
    </label>
    <div className="mt-2">{children}</div>
  </div>
);

export default function CustomerService() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const { settings: siteSettings } = useSiteSettings();
  const pageSettings = siteSettings.pages.customerService;

  /*
   * Ordernumret kan komma med i adressen.
   *
   * Ordersidan länkar hit med ?order=DH-1004-K7M när kunden vill ändra
   * något. Utan det här hade länken varit ett halvt löfte: den som
   * klickar tror att ordern följt med och skriver inte numret, och ni
   * får ett ärende utan att veta vilken order det gäller.
   *
   * Ämnet sätts samtidigt, eftersom en fråga som kommer från en order
   * nästan alltid handlar om den.
   */
  const [searchParams] = useSearchParams();
  const orderFromLink = (searchParams.get("order") || "").trim().slice(0, 60);

  const [formData, setFormData] = useState(() => ({
    ...initialFormState,
    orderNumber: orderFromLink,
    topic: orderFromLink ? "Min order" : "",
  }));
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const updateField =
    (field: keyof typeof initialFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { value } = event.target;
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    const name = formData.name.trim();
    const email = formData.email.trim();
    const confirmEmail = formData.confirmEmail.trim();
    const message = formData.message.trim();

    /* Felen prövas i samma ordning som fälten står, så den som får ett
       fel hittar det genom att läsa nedåt. */
    if (!name) {
      setStatus("error");
      setErrorMessage("Skriv ditt namn så vi vet vem vi svarar.");
      return;
    }
    if (!emailRegex.test(email)) {
      setStatus("error");
      setErrorMessage("Kontrollera e-postadressen.");
      return;
    }
    if (email.toLowerCase() !== confirmEmail.toLowerCase()) {
      setStatus("error");
      setErrorMessage("De två e-postadresserna är inte lika.");
      return;
    }
    if (!formData.topic) {
      setStatus("error");
      setErrorMessage("Välj vad frågan gäller.");
      return;
    }
    if (!message) {
      setStatus("error");
      setErrorMessage("Skriv din fråga i meddelandet.");
      return;
    }

    setStatus("sending");

    try {
      const response = await fetch(`${apiBase}/api/contact-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          orderNumber: formData.orderNumber.trim(),
          topic: formData.topic,
          message,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Meddelandet kunde inte skickas.");
      }

      setStatus("sent");
      setFormData(initialFormState);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Meddelandet kunde inte skickas.",
      );
    }
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "DatorHuset",
    url: "https://datorhuset.se/",
    image: "https://datorhuset.se/Datorhuset.png",
    email: pageSettings.contactEmail,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Stockholm",
      addressCountry: "SE",
    },
    areaServed: "SE",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "11:00",
        closes: "15:00",
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Hem",
        item: "https://datorhuset.se/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Kundservice",
        item: "https://datorhuset.se/kundservice",
      },
    ],
  };

  return (
    <PageShell head={<SeoJsonLd data={[localBusinessSchema, breadcrumbSchema]} />}>
      <PageHero
        sandboxId="customer-hero"
        compact
        accent={PAGE_BANNERS.support.accent}
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Kundservice" }]}
        title={pageSettings.heroTitle}
      />

      {/* Formuläret ---------------------------------------------------
          Ett kort mitt på duken, som i förlagan. Ingenting i spalten
          bredvid: den som skriver ett meddelande ska inte behöva välja
          mellan att skriva och att läsa. */}
      <section data-sandbox-id="customer-contact" className="relative">
        <div className="container mx-auto max-w-4xl px-4 py-16 sm:py-20">
          <Reveal className="rounded-xl border border-foreground/10 bg-foreground/[0.03] px-5 py-10 sm:px-10 sm:py-12">
            <h2 className="text-center font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Har du en fråga? Vi hjälper dig.
            </h2>

            <form onSubmit={handleSubmit} className="mt-10 space-y-5" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="contact-name" label="Namn" required>
                  <input
                    id="contact-name"
                    type="text"
                    className="field"
                    placeholder="För- och efternamn"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={updateField("name")}
                  />
                </Field>
                <Field
                  id="contact-order"
                  label="Ordernummer"
                  hint="(om det gäller en order)"
                >
                  <input
                    id="contact-order"
                    type="text"
                    className="field"
                    placeholder="Ordernr"
                    value={formData.orderNumber}
                    onChange={updateField("orderNumber")}
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field id="contact-email" label="E-post" required>
                  <input
                    id="contact-email"
                    type="email"
                    className="field"
                    placeholder="namn@exempel.se"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={updateField("email")}
                  />
                </Field>
                {/* Adressen skrivs två gånger av ett enda skäl: svaret
                    går dit, och en felstavad adress märks först när
                    svaret aldrig kommer. */}
                <Field id="contact-email-2" label="Bekräfta e-post" required>
                  <input
                    id="contact-email-2"
                    type="email"
                    className="field"
                    placeholder="namn@exempel.se"
                    autoComplete="email"
                    required
                    value={formData.confirmEmail}
                    onChange={updateField("confirmEmail")}
                  />
                </Field>
                <Field id="contact-topic" label="Ämne" required>
                  <select
                    id="contact-topic"
                    className="field"
                    required
                    value={formData.topic}
                    onChange={updateField("topic")}
                  >
                    <option value="">Välj ämne</option>
                    {TOPICS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field id="contact-message" label="Meddelande" required>
                <textarea
                  id="contact-message"
                  className="field min-h-[9rem] resize-y"
                  placeholder="Skriv din fråga här"
                  required
                  value={formData.message}
                  onChange={updateField("message")}
                />
              </Field>

              {/* Beskedet står ovanför knappen och inte under. Under
                  knappen hamnar det utanför rutan på en telefon, och ett
                  svar man måste rulla till är inget svar.

                  Vid fel följer adressen med. Går servern inte att nå
                  ska kunden inte lämnas utan väg vidare. */}
              {status === "error" && errorMessage && (
                <p role="alert" className="text-sm font-semibold text-destructive">
                  {errorMessage}{" "}
                  <a
                    className="link-underline"
                    href={`mailto:${pageSettings.contactEmail}`}
                  >
                    Eller mejla {pageSettings.contactEmail}
                  </a>
                </p>
              )}
              {status === "sent" && (
                <p role="status" className="text-sm font-semibold text-primary">
                  Tack, meddelandet är skickat. Vi svarar på vardagar till den
                  adress du angav.
                </p>
              )}

              <div className="pt-2 text-center">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Skickar..." : "Skicka"}
                </button>
              </div>
            </form>
          </Reveal>

          {/* Adress och öppettider under kortet. Den som hellre mejlar
              själv, eller vill veta när ett svar kan komma, ska inte
              behöva fylla i ett formulär för att få reda på det. */}
          <Reveal
            delay={90}
            className="mt-6 grid gap-6 rounded-xl border border-foreground/10 px-6 py-7 sm:grid-cols-2"
          >
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {pageSettings.contactTitle}
              </h3>
              <a
                className="link-underline mt-2 block text-sm font-semibold text-primary"
                href={`mailto:${pageSettings.contactEmail}`}
              >
                {pageSettings.contactEmail}
              </a>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {pageSettings.hoursTitle}
              </h3>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {pageSettings.hoursLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Vanliga ärenden och gången: kvar, men längre ned. Det är
          uppslagsverk, inte det man kom hit för. */}
      <section className="relative">
        <div className="container mx-auto max-w-4xl px-4 pb-24">
          <div className="grid gap-10 border-t border-foreground/10 pt-12 lg:grid-cols-2">
            <Reveal sandboxId="customer-issues">
              <h2 className="section-title text-2xl">
                {pageSettings.commonIssuesTitle}
              </h2>
              <ul className="mt-6 divide-y divide-foreground/10 border-t border-foreground/10">
                {pageSettings.commonIssues.map((issue) => (
                  <li
                    key={issue}
                    className="flex items-start gap-3 py-4 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span aria-hidden="true" className="mt-[3px] text-primary">
                      &#8250;
                    </span>
                    {issue}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {pageSettings.commonIssuesNote}
              </p>
            </Reveal>

            <Reveal delay={110} sandboxId="customer-workflow">
              <h2 className="section-title text-2xl">
                {pageSettings.workflowTitle}
              </h2>
              <ol className="mt-6 space-y-5">
                {pageSettings.workflowSteps.map((step, index) => (
                  <li key={step} className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="font-display text-xl font-bold leading-none tabular-nums text-primary/50"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
              <Link to={pageSettings.workflowCtaHref} className="btn-primary mt-8">
                {pageSettings.workflowCtaLabel}
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
