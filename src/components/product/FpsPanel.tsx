import { useEffect, useMemo, useState } from "react";
import { Gauge, Sparkles, Zap } from "lucide-react";

import {
  computeSandboxFps,
  findSandboxEntry,
  getSandboxGames,
  type FpsSandboxSettings,
} from "@/lib/fpsSandbox";

/**
 * FPS-raden under produkten.
 *
 * Siffrorna är INTE påhittade och räknas inte fram ur komponenterna.
 * De kommer ur produktens egna FPS-värden, de som matas in per dator i
 * adminläget (Produkter -> FPS) och sparas i Supabase. Modellen har
 * funnits hela tiden i src/lib/fpsSandbox.ts - den har bara aldrig
 * visats för kunden. Det här avsnittet gör inget annat än att visa den.
 *
 * Finns inga värden för en dator ritas ingenting. En tom FPS-ruta är
 * sämre än ingen, och påhittade siffror i en butik är inte ett
 * alternativ alls.
 *
 * FORMEN
 *
 * Förlagan visar alla spel samtidigt med upplösningen som flikar
 * ovanför, i stället för ett spel i taget bakom en rullgardin. Det är
 * hela poängen med avsnittet: man vill jämföra, inte bläddra. Den gamla
 * varianten här hade tre rullgardiner och visade ett enda spel, så man
 * fick klicka sex gånger för att se vad maskinen klarar.
 *
 * DLSS/FSR och bildgenerering är påslag ovanpå grundvärdet, med
 * multiplikatorer som ligger i samma fil. Ett spel som inte stöder
 * tekniken påverkas inte - därför står det utskrivet under kortet i
 * stället för att siffran tyst låter bli att röra sig.
 */

const AVG_LABEL = "FPS I SNITT";

type FpsPanelProps = {
  settings: FpsSandboxSettings;
  /** Sidans kulör, samma som nivån datorn tillhör. */
  accent: string;
  /** Omslagsbild per spel. Saknas en ritas namnet i stället. */
  gameImages: Record<string, string>;
};

export const FpsPanel = ({ settings, accent, gameImages }: FpsPanelProps) => {
  const games = useMemo(() => getSandboxGames(settings), [settings]);

  /* Upplösningarna och grafiklägena är gemensamma för hela raden, så de
     samlas ur alla spel och inte ur ett. Ordningen bevaras som den står
     i inställningarna - 1080p, 1440p, 4K - eftersom en sorterad lista
     hade lagt "4K" först. */
  const resolutions = useMemo(
    () => Array.from(new Set(settings.entries.map((entry) => entry.resolution))),
    [settings],
  );

  const [resolution, setResolution] = useState("");
  const [preset, setPreset] = useState("");
  const [dlssOn, setDlssOn] = useState(false);
  const [frameGenOn, setFrameGenOn] = useState(false);

  useEffect(() => {
    if (resolutions.length === 0) return;
    if (!resolutions.includes(resolution)) setResolution(resolutions[0]);
  }, [resolutions, resolution]);

  const presets = useMemo(
    () =>
      Array.from(
        new Set(
          settings.entries
            .filter((entry) => entry.resolution === resolution)
            .map((entry) => entry.graphics),
        ),
      ),
    [settings, resolution],
  );

  useEffect(() => {
    if (presets.length === 0) return;
    if (!presets.includes(preset)) setPreset(presets[0]);
  }, [presets, preset]);

  /* Ett spel i taget: hämta värdet för vald upplösning och grafiknivå,
     lägg på de påslag spelet faktiskt stöder. */
  const rows = useMemo(
    () =>
      games
        .map((game) => {
          const entry = findSandboxEntry(settings, game, resolution, preset);
          if (!entry) return null;
          return {
            game,
            fps: computeSandboxFps(entry, {
              dlssFsrOn: dlssOn,
              frameGenerationOn: frameGenOn,
            }),
            supportsDlss: entry.supportsDlssFsr,
            supportsFrameGen: entry.supportsFrameGeneration,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null),
    [games, settings, resolution, preset, dlssOn, frameGenOn],
  );

  /* Går tekniken inte att slå på för något av spelen är knappen
     avstängd i stället för att sitta där och inte göra något. */
  const anyDlss = rows.some((row) => row.supportsDlss);
  const anyFrameGen = rows.some((row) => row.supportsFrameGen);

  useEffect(() => {
    if (!anyDlss && dlssOn) setDlssOn(false);
    if (!anyFrameGen && frameGenOn) setFrameGenOn(false);
  }, [anyDlss, anyFrameGen, dlssOn, frameGenOn]);

  if (rows.length === 0) return null;

  return (
    <section data-sandbox-id="product-fps" className="relative">
      <div className="rounded-lg border border-foreground/10 bg-foreground/[0.03]">
        <div className="flex flex-col gap-4 border-b border-foreground/10 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <Gauge aria-hidden="true" className="h-4 w-4" style={{ color: accent }} />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground">
              FPS-prestanda
            </h2>
          </div>

          {/* Upplösningen som flikar, inte som rullgardin. Tre val ska
              synas allihop - en rullgardin gömmer två av tre. */}
          <div
            role="tablist"
            aria-label="Upplösning"
            className="flex w-full gap-1 rounded-sm border border-foreground/10 bg-background/60 p-1 lg:w-auto"
          >
            {resolutions.map((option) => {
              const active = option === resolution;
              return (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setResolution(option)}
                  className="flex-1 rounded-[3px] px-5 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors lg:flex-none"
                  style={
                    active
                      ? { backgroundColor: `${accent}1F`, color: accent }
                      : { color: "hsl(var(--muted-foreground))" }
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grafikläge och påslag */}
        <div className="flex flex-col gap-4 border-b border-foreground/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <label className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-[0.14em]">Grafik</span>
            <select
              value={preset}
              onChange={(event) => setPreset(event.target.value)}
              className="field h-9 w-auto min-w-[10rem] py-0 text-xs"
              aria-label="Grafikläge"
            >
              {presets.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <ToggleChip
              icon={Sparkles}
              label="DLSS / FSR"
              on={dlssOn}
              disabled={!anyDlss}
              accent={accent}
              onClick={() => setDlssOn((prev) => !prev)}
              title={
                anyDlss
                  ? "Uppskalning: renderar i lägre upplösning och skalar upp"
                  : "Inget av spelen i listan stöder uppskalning"
              }
            />
            <ToggleChip
              icon={Zap}
              label="Bildgenerering"
              on={frameGenOn}
              disabled={!anyFrameGen}
              accent={accent}
              onClick={() => setFrameGenOn((prev) => !prev)}
              title={
                anyFrameGen
                  ? "Genererar extra bildrutor mellan de renderade"
                  : "Inget av spelen i listan stöder bildgenerering"
              }
            />
          </div>
        </div>

        {/* Spelen */}
        <ul className="grid grid-cols-2 gap-px bg-foreground/10 lg:grid-cols-3">
          {rows.map((row) => {
            const cover = gameImages[row.game];
            /* Det som är påslaget men som just det här spelet inte
               stöder skrivs ut, annars ser det ut som att siffran
               vägrar röra sig. */
            const missing = [
              dlssOn && !row.supportsDlss ? "DLSS/FSR" : null,
              frameGenOn && !row.supportsFrameGen ? "bildgenerering" : null,
            ].filter(Boolean);

            return (
              <li
                key={row.game}
                className="relative overflow-hidden bg-background/80 p-5 text-center"
              >
                {cover && (
                  <>
                    <img
                      src={cover}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full object-cover opacity-[0.14]"
                      loading="lazy"
                      decoding="async"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40"
                    />
                  </>
                )}

                <div className="relative">
                  <p className="truncate text-xs font-semibold text-foreground">{row.game}</p>
                  <p
                    className="mt-2 font-display text-3xl font-bold tabular-nums sm:text-4xl"
                    style={{ color: accent }}
                  >
                    {row.fps}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {AVG_LABEL}
                  </p>
                  {missing.length > 0 && (
                    <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
                      Stöder inte {missing.join(" eller ")}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <p className="px-5 py-4 text-[11px] leading-relaxed text-muted-foreground sm:px-6">
          Uppskattade värden för den här konfigurationen. Verklig prestanda
          varierar med spelversion, drivrutiner och övriga inställningar.
        </p>
      </div>
    </section>
  );
};

const ToggleChip = ({
  icon: Icon,
  label,
  on,
  disabled,
  accent,
  onClick,
  title,
}: {
  icon: typeof Sparkles;
  label: string;
  on: boolean;
  disabled: boolean;
  accent: string;
  onClick: () => void;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={on}
    title={title}
    className="inline-flex items-center gap-2 rounded-sm border px-3.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
    style={
      on && !disabled
        ? { borderColor: accent, color: accent, backgroundColor: `${accent}14` }
        : {
            borderColor: "hsl(var(--foreground) / 0.18)",
            color: "hsl(var(--muted-foreground))",
          }
    }
  >
    <Icon aria-hidden="true" className="h-3.5 w-3.5" />
    {label}
  </button>
);

export default FpsPanel;
