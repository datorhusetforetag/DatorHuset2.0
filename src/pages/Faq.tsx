import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Vanliga frågor.
 *
 * Frågorna är fällbara här precis som i smakprovet på startsidan. Sex
 * uppslagna svar på rad blir en textvägg man skummar förbi; hopfällda
 * blir de en innehållsförteckning man kan välja ur.
 */
export default function Faq() {
  const { settings } = useSiteSettings();
  const page = settings.pages.faq;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: "https://datorhuset.se/" },
      { "@type": "ListItem", position: 2, name: "FAQ", item: "https://datorhuset.se/faq" },
    ],
  };

  return (
    <PageShell head={<SeoJsonLd data={[faqSchema, breadcrumbSchema]} />}>
      <PageHero
        sandboxId="faq-hero"
        eyebrow={page.heroEyebrow}
        title={page.heroTitle}
        lede={page.heroDescription}
      />

      <section data-sandbox-id="faq-items" className="relative">
        <div className="container mx-auto max-w-4xl px-4 pb-24">
          <Reveal>
            <Accordion type="single" collapsible className="flex flex-col gap-4">
              {page.items.map((item) => (
                <AccordionItem
                  key={item.question}
                  value={item.question}
                  className="overflow-hidden rounded-lg border border-foreground/10 bg-background/70 transition-colors hover:border-primary/40 data-[state=open]:border-primary/40"
                >
                  <AccordionTrigger className="px-5 py-5 text-left text-base font-semibold hover:no-underline sm:px-6 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-primary">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-6 pr-12 text-sm leading-relaxed text-muted-foreground sm:px-6">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>

          <Reveal delay={90} className="mt-12 rounded-lg border border-foreground/10 bg-background/70 p-8 text-center">
            <h2 className="font-display text-xl font-bold text-foreground">
              Hittade du inte svaret?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Skriv till oss så återkommer vi. Vi svarar hellre på en fråga för
              mycket än att du beställer fel dator.
            </p>
            <a href="/kundservice" className="btn-primary mt-6">
              Kontakta kundservice
            </a>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
