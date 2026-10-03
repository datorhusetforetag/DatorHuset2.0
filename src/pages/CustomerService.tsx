import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Clock, Mail } from "lucide-react";

import { INFO_PAGE_BACKGROUND, PageShell } from "@/components/PageShell";
import { InfoPageHeader } from "@/components/InfoPageHeader";
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
    <label htmlFor={id} className="block text-sm font-medium text-white/85">
      {label}
      {required && <span aria-hidden="true">*</span>}
      {hint && <span className="font-normal text-white/50"> {hint}</span>}
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
    <PageShell
      head={<SeoJsonLd data={[localBusinessSchema, breadcrumbSchema]} />}
      background={INFO_PAGE_BACKGROUND}
    >
      <InfoPageHeader
        sandboxId="customer-hero"
        breadcrumb={[{ label: "Hem", href: "/" }, { label: "Kundservice" }]}
        title={pageSettings.heroTitle}
      />

      {/* Formuläret är sidan: ett tätt kort mitt på den mörka duken.
          Kontaktuppgifterna ligger i ett smalt kort under, för den som
          hellre mejlar själv. */}
      <section data-sandbox-id="customer-contact" className="relative">
        <div className="container mx-auto max-w-5xl space-y-6 px-4 pb-24 pt-12 sm:pt-16">
          <Reveal className="info-panel px-5 py-10 sm:px-14 sm:py-14">
            <h2 className="text-center font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
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

              <div className="grid gap-5 sm:grid-cols-2">
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
                <div className="sm:col-span-2">
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

              <div className="pt-3 text-center">
                <button
                  type="submit"
                  className="btn-primary min-w-[10rem] rounded-full"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Skickar..." : "Skicka"}
                </button>
              </div>
            </form>
          </Reveal>

          {/* Kontaktuppgifterna. Den som hellre mejlar själv, eller vill
              veta när ett svar kan komma, ska inte behöva fylla i ett
              formulär för att få reda på det. */}
          <Reveal delay={90} as="aside">
            <div className="info-panel grid divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="flex gap-4 p-6">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-white/80"
                >
                  <Mail className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white">{pageSettings.contactTitle}</h3>
                  <a
                    className="mt-1 block break-all text-sm text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
                    href={`mailto:${pageSettings.contactEmail}`}
                  >
                    {pageSettings.contactEmail}
                  </a>
                </div>
              </div>
              <div className="flex gap-4 p-6">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-white/80"
                >
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{pageSettings.hoursTitle}</h3>
                  <div className="mt-1 space-y-0.5 text-sm text-white/70">
                    {pageSettings.hoursLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
