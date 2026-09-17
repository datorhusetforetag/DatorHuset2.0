import { Info } from "lucide-react";

/**
 * Upplysning om att butikslänkarna är affiliatelänkar.
 *
 * Marknadsföringslagen kräver att kommersiella samarbeten framgår tydligt,
 * och EU:s Omnibus-direktiv ställer krav på att en prisjämförelse talar om
 * vilka butiker som ingår och om jämförelsen är betald. Texten ska därför
 * stå där priserna visas - inte bara begravd i en policy längst ner.
 *
 * Varianten "inline" är den korta raden intill butikslistan.
 * Varianten "panel" är den fylligare rutan för sidor som förklarar tjänsten.
 */

type AffiliateDisclosureProps = {
  variant?: "inline" | "panel";
  className?: string;
};

const TEXT =
  "Vissa butikslänkar är affiliatelänkar. Handlar du via dem kan vi få provision, " +
  "utan att priset blir högre för dig. Provisionen påverkar inte vilken butik som " +
  "visas först – listan sorteras alltid efter lägsta pris.";

export const AffiliateDisclosure = ({
  variant = "inline",
  className = "",
}: AffiliateDisclosureProps) => {
  if (variant === "inline") {
    return (
      <p
        className={`text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 ${className}`}
      >
        {TEXT}
      </p>
    );
  }

  return (
    <div
      className={`flex gap-3 rounded-lg border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-[#111926] ${className}`}
    >
      <Info
        className="mt-0.5 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <div>
        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
          Om våra butikslänkar
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">{TEXT}</p>
      </div>
    </div>
  );
};

export default AffiliateDisclosure;
