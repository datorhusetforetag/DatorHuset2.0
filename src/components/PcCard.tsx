import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import type { Computer } from "@/data/computers";
import { getProductArt } from "@/data/productArt";
import type { UpgradePricing } from "@/hooks/useUpgradePricing";
import { bestForResolution } from "@/lib/bestFor";
import { productPath } from "@/lib/productUrl";
import { buildReportedFpsSettingsForProductName } from "../../shared/fpsProfiles.js";
import { findBaseConfig, getUpgradeOptions } from "../../shared/upgradePricing.js";

/**
 * Datorkortet: startsidans rader och produktsidans rutnät.
 *
 * Kortet bodde först i HomeShowcase, och produktsidan hade ett eget,
 * enklare kort med bara bild, namn och pris. Nu visar båda samma sak -
 * minnes- och lagringsval med tillägget mot grundpriset, och vad datorn
 * orkar i spel - så en dator ser likadan ut var man än hittar den.
 */

export type PcCardBadge = { label: string; tone: "stock" | "preorder" | "sold" } | null;

export type PcCardProps = {
  computer: Computer;
  name: string;
  price: number;
  cpu: string;
  gpu: string;
  badge: PcCardBadge;
  pricing: UpgradePricing;
  /** Av för begagnade varianter: uppgraderingarna gäller den nya datorn. */
  upgrades?: boolean;
  /** Rubriknivå. Produktsidans kort är sidans huvudinnehåll och får h2. */
  headingLevel?: "h2" | "h3";
  onImageError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
};

/*
 * FPS-raden: tre kända spel, alla i 1440p på High.
 *
 * Samma inställning på varje kort, så korten går att jämföra rakt av -
 * en siffra i 1080p bredvid en i 4K hade sett ut som att den svagare
 * datorn var snabbare. Siffrorna kommer ur samma profiler som
 * FPS-tabellen på produktsidan.
 */
const FPS_GAMES = [
  { game: "Cyberpunk 2077", short: "Cyberpunk" },
  { game: "Fortnite", short: "Fortnite" },
  { game: "CS2", short: "CS2" },
];
const FPS_RESOLUTION = "1440p";
const FPS_GRAPHICS = "High";

type FpsEntry = { game: string; resolution: string; graphics: string; baseFps: number };

const fpsFor = (productName: string) => {
  const profile = buildReportedFpsSettingsForProductName(productName) as { entries: FpsEntry[] } | null;
  if (!profile) return [];
  return FPS_GAMES.flatMap(({ game, short }) => {
    const entry = profile.entries.find(
      (item) => item.game === game && item.resolution === FPS_RESOLUTION && item.graphics === FPS_GRAPHICS,
    );
    return entry ? [{ short, fps: Math.round(entry.baseFps) }] : [];
  });
};

const kr = (value: number) => `${Math.round(value).toLocaleString("sv-SE")} kr`;

const delta = (price: number) =>
  price === 0 ? "Ingår" : `${price > 0 ? "+" : "\u2212"}${Math.abs(price).toLocaleString("sv-SE")} kr`;

export const PcCard = ({
  computer,
  name,
  price,
  cpu,
  gpu,
  badge,
  pricing,
  upgrades = true,
  headingLevel = "h3",
  onImageError,
}: PcCardProps) => {
  const Heading = headingLevel;
  const art = getProductArt(computer.id);
  const bestFor = bestForResolution(computer.name);
  const fps = fpsFor(computer.name);

  /* Det kunden valt på kortet. Tomt betyder grundutförande. */
  const [choice, setChoice] = useState<{ ram?: number; storage?: number }>({});

  /* Minnes- och lagringsvalen, ur samma pristabell och samma regler som
     produktsidan och kassan. Varje val visar tillägget mot grundpriset -
     det är den siffran man väger. Datorer utan känt grundutförande visar
     bara priset. */
  const baseConfig = upgrades ? findBaseConfig(computer.id, computer.name) : null;
  const options = getUpgradeOptions(baseConfig, pricing);
  const rows = baseConfig
    ? [
        {
          key: "ram",
          title: `Minne · ${baseConfig.ram.type}`,
          options: options.ram.map((option) => ({ ...option, key: option.gb, label: `${option.gb}GB` })),
        },
        {
          key: "storage",
          title: "Lagring",
          options: options.storage.map((option) => ({ ...option, key: option.gb })),
        },
      ].filter((row) => row.options.length > 1)
    : [];

  /* Valt alternativ per rad: kundens val, annars grundutförandet. */
  const selectedIn = (row: (typeof rows)[number]) =>
    row.options.find((option) => option.gb === choice[row.key as "ram" | "storage"]) ??
    row.options.find((option) => option.isBase);
  const extra = rows.reduce((sum, row) => sum + (selectedIn(row)?.price ?? 0), 0);
  const changed = extra !== 0 || rows.some((row) => !selectedIn(row)?.isBase);

  /* Valet följer med till produktsidan i adressen, så den öppnas med
     samma minne och lagring förvalda. Bara det som skiljer sig från grunden. */
  const params = new URLSearchParams();
  rows.forEach((row) => {
    const selected = selectedIn(row);
    if (selected && !selected.isBase) params.set(row.key, String(selected.gb));
  });
  const href = `${productPath(computer)}${params.toString() ? `?${params}` : ""}`;

  /*
   * Kortet är inte en enda länk längre. Brickorna är knappar, och en knapp
   * inuti en länk går inte att klicka på för sig - klicket blev en
   * navigering. Bilden, namnet och "Visa datorn" är länkar var för sig.
   */
  return (
    <article className="pc-card pc-card--rich" style={{ ["--pc-glow" as string]: art.backdrop.glow }}>
      <Link to={href} className="pc-card__media" tabIndex={-1} aria-hidden="true">
        {badge && (
          <span className="pc-card__badge" data-tone={badge.tone}>
            {badge.label}
          </span>
        )}
        <img
          src={art.cutout || computer.image}
          alt={name}
          className={art.cutout ? "pc-card__cutout" : "pc-card__photo"}
          loading="lazy"
          decoding="async"
          onError={onImageError}
        />
      </Link>

      <div className="pc-card__body">
        <Heading className="pc-card__name">
          <Link to={href} className="hover:underline">
            {name}
          </Link>
        </Heading>
        {bestFor && (
          <p className="pc-card__bestfor">
            Bäst för:
            <span
              className="pc-card__pill"
              style={{ color: art.backdrop.glow, borderColor: `${art.backdrop.glow}66` }}
            >
              {bestFor}
            </span>
          </p>
        )}
        <p className="pc-card__specs">
          {cpu} · {gpu}
        </p>

        <p className="pc-card__from">
          {/* "Standard" och inte "Från": ett steg ned gör vissa datorer
              billigare än det här priset. */}
          <span>{rows.length === 0 ? "Pris" : changed ? "Ditt val" : "Standard"}</span>
          {kr(price + extra)}
        </p>

        {rows.map((row) => (
          <div key={row.key} className="pc-card__upgrade">
            <p className="pc-card__upgrade-title">{row.title}</p>
            <ul className="pc-card__chips">
              {row.options.map((option) => {
                const active = selectedIn(row)?.gb === option.gb;
                return (
                  <li key={option.key}>
                    <button
                      type="button"
                      className="pc-card__chip"
                      data-active={active || undefined}
                      aria-pressed={active}
                      onClick={() => setChoice((prev) => ({ ...prev, [row.key]: option.gb }))}
                    >
                      <span className="pc-card__chip-label">{option.label}</span>
                      <span className="pc-card__chip-price">{delta(option.price)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {fps.length > 0 && (
        <div className="pc-card__fps">
          <p className="pc-card__fps-title">
            FPS-prestanda
            <span>
              {FPS_RESOLUTION} · {FPS_GRAPHICS}
            </span>
          </p>
          <ul className="pc-card__fps-grid">
            {fps.map((entry) => (
              <li key={entry.short}>
                <span className="pc-card__fps-game">{entry.short}</span>
                <span className="pc-card__fps-value">{entry.fps}</span>
                <span className="pc-card__fps-unit">snitt-FPS</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link to={href} className="pc-card__cta">
        Visa datorn
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </article>
  );
};

export default PcCard;
