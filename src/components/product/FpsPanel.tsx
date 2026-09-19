import { useEffect, useMemo, useState } from "react";

import {
  computeSandboxFps,
  findSandboxEntry,
  getSandboxGames,
  type FpsSandboxSettings,
} from "@/lib/fpsSandbox";

/**
 * FPS-prestanda, som en lugn lista i produktpanelen.
 *
 * SIFFRORNA ÄR INTE PÅHITTADE och räknas inte fram ur komponenterna.
 * De kommer ur maskinens egen profil i shared/fpsProfiles.js, samma
 * tabell som servern och adminvyn använder. Det här avsnittet visar
 * den, inget annat.
 *
 * FORMEN ÄR AVSKALAD MED FLIT
 *
 * Avsnittet låg först som ett eget inramat kort med sex spelkort, var
 * och en med omslagsbild bakom siffran. Det fungerar i full bredd men
 * inte i panelen: en ram inuti en ram är en ram för mycket, och sex
 * bilder bakom sex tal blir brus i en spalt som redan bär rubrik, pris,
 * utföranden och specifikationer.
 *
 * Nu är det rader. Spelet till vänster, talet till höger, hårfina
 * linjer emellan - samma form som specifikationerna ovanför, så de två
 * listorna läses som syskon i stället för som två olika sorters
 * innehåll.
 *
 * Kontrollerna är kvar allihop. Det var aldrig de som stökade.
 */

type FpsPanelProps = {
  settings: FpsSandboxSettings;
  /** Sidans kulör, samma som nivån datorn tillhör. */
  accent: string;
};

export const FpsPanel = ({ settings, accent }: FpsPanelProps) => {
  const games = useMemo(() => getSandboxGames(settings), [settings]);

  /* Upplösningarna och grafiklägena är gemensamma för hela listan, så de
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
    <section data-sandbox-id="product-fps">
      <h2 className="panel-label">FPS-prestanda</h2>

      {/* Upplösningen som flikar. Tre val ska synas allihop - en
          rullgardin hade gömt två av tre. */}
      <div
        role="tablist"
        aria-label="Upplösning"
        className="mt-4 flex gap-1 rounded-sm border border-foreground/10 p-1"
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
              className="flex-1 rounded-[3px] py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors"
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

      {/* Grafikläge och påslag på en rad. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={preset}
          onChange={(event) => setPreset(event.target.value)}
          className="field h-8 w-auto min-w-[8rem] flex-1 py-0 text-xs"
          aria-label="Grafikläge"
        >
          {presets.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ToggleChip
          label="DLSS"
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
          label="Bildgen."
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

      {/* Spelen som rader, samma form som specifikationerna ovanför. */}
      <ul className="mt-5 divide-y divide-foreground/10 border-t border-foreground/10">
        {rows.map((row) => {
          /* Det som är påslaget men som just det här spelet inte stöder
             skrivs ut, annars ser det ut som att siffran vägrar röra
             sig. */
          const missing = [
            dlssOn && !row.supportsDlss ? "DLSS" : null,
            frameGenOn && !row.supportsFrameGen ? "bildgen." : null,
          ].filter(Boolean);

          return (
            <li key={row.game} className="flex items-baseline justify-between gap-4 py-2.5">
              <span className="min-w-0 truncate text-sm text-foreground">
                {row.game}
                {missing.length > 0 && (
                  <span className="ml-2 text-[10px] text-muted-foreground">
                    utan {missing.join(" och ")}
                  </span>
                )}
              </span>
              <span
                className="shrink-0 font-display text-base font-bold tabular-nums"
                style={{ color: accent }}
              >
                {row.fps}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Uppskattade snittvärden. Verklig prestanda varierar med
        spelversion och drivrutiner.
      </p>
    </section>
  );
};

const ToggleChip = ({
  label,
  on,
  disabled,
  accent,
  onClick,
  title,
}: {
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
    className="shrink-0 rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
    style={
      on && !disabled
        ? { borderColor: accent, color: accent, backgroundColor: `${accent}14` }
        : {
            borderColor: "hsl(var(--foreground) / 0.18)",
            color: "hsl(var(--muted-foreground))",
          }
    }
  >
    {label}
  </button>
);

export default FpsPanel;
