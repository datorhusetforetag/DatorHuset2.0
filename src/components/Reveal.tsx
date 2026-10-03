import type { ElementType, ReactNode } from "react";

/**
 * Omslag för sektioner som tidigare tonades in när de rullades in i bild.
 *
 * Inrullningen är borttagen: allt innehåll ska ligga färdigt redan när
 * sidan laddas, inte dyka upp först när besökaren rullar dit. Komponenten
 * ligger kvar så att alla ställen som använder den fungerar som förut,
 * men renderar nu bara sitt element rakt av.
 *
 * delay och from tas fortfarande emot men gör ingenting.
 */

type RevealProps = {
  children: ReactNode;
  /** Utan verkan - fanns för inrullningen. */
  delay?: number;
  /** Utan verkan - fanns för inrullningen. */
  from?: "up" | "down" | "none";
  as?: ElementType;
  className?: string;
  /**
   * Adminlägets krok i sidan. Reveal sprider inte vidare okända
   * attribut, och ett data-sandbox-id skrivet rakt på den hade fallit
   * bort tyst - sektionen gick då inte längre att redigera därifrån.
   */
  sandboxId?: string;
};

export const Reveal = ({
  children,
  as: Tag = "div",
  className = "",
  sandboxId,
}: RevealProps) => (
  <Tag className={className || undefined} data-sandbox-id={sandboxId}>
    {children}
  </Tag>
);

export default Reveal;
