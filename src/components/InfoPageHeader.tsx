import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import type { BannerCrumb } from "./PageHero";

/**
 * Sidhuvudet på informationssidorna: kundservice, FAQ, ångerrätt,
 * köpvillkor och integritetspolicy.
 *
 * Banderollen med foto, ljus och rutnät passar sidor som ska sälja
 * något. Här letar besökaren efter ett besked - vad gäller, hur gör
 * jag - och då gör stämningen mest att svaret hamnar längre ned.
 * Så det här är bara en låg lila list med brödsmulor, rubrik och ingress,
 * ovanför en mörk duk där innehållet ligger i täta paneler.
 */

type InfoPageHeaderProps = {
  title: string;
  eyebrow?: string;
  lede?: string;
  breadcrumb?: BannerCrumb[];
  /** En kort rad under ingressen, till exempel när texten senast ändrades. */
  meta?: string;
  sandboxId?: string;
};

export const InfoPageHeader = ({
  title,
  eyebrow,
  lede,
  breadcrumb,
  meta,
  sandboxId,
}: InfoPageHeaderProps) => (
  <header data-sandbox-id={sandboxId} className="info-header">
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Brödsmulor">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/55">
            {breadcrumb.map((crumb, index) => {
              const isLast = index === breadcrumb.length - 1;
              return (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                  {crumb.href && !isLast ? (
                    <Link to={crumb.href} className="transition-colors hover:text-white">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={isLast ? "page" : undefined} className="text-white/80">
                      {crumb.label}
                    </span>
                  )}
                  {!isLast && <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 opacity-60" />}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {eyebrow && (
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
          {eyebrow}
        </p>
      )}

      <h1
        className={`${eyebrow ? "mt-2" : breadcrumb?.length ? "mt-4" : ""} font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl`}
      >
        {title}
      </h1>

      {lede && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">{lede}</p>
      )}

      {meta && <p className="mt-3 text-xs text-white/50">{meta}</p>}
    </div>
  </header>
);

export default InfoPageHeader;
