import { useMemo } from "react";

import {
  ADMIN_FPS_GAME_OPTIONS,
  ADMIN_FPS_RESOLUTION_OPTIONS,
} from "../../../../shared/adminListingContract.js";

/**
 * FPS-siffrorna per maskin.
 *
 * Produktsidan visar hur många bilder per sekund maskinen klarar i sex
 * spel och tre upplösningar. Siffrorna är ett löfte till kunden, så de
 * ska gå att rätta av den som vet - inte bara av den som kan ändra i
 * koden.
 *
 * ETT RUTNÄT, INTE EN LISTA
 *
 * Sex spel gånger tre upplösningar är arton tal. Som en lista med arton
 * fält går det inte att se att 1440p ligger under 1080p där det ska; som
 * ett rutnät ser man det på en gång, och en siffra som spretar syns utan
 * att man letar.
 *
 * Grafikläget ligger inte här. Sandlådan hade ett fält per läge, vilket
 * gav över femtio tal att hålla i huvudet. Posterna som redan finns
 * behåller sitt läge, och nya skrivs mot det vanligaste - för en
 * felaktig siffra på "Ultra" hjälper ingen mer än ingen siffra alls.
 */

export type FpsEntry = {
  game: string;
  resolution: string;
  graphics: string;
  baseFps: number;
  supportsDlssFsr: boolean;
  dlssFsrMode: string | null;
  supportsFrameGeneration: boolean;
};

export type FpsSettings = { version: 2; entries: FpsEntry[] };

const DEFAULT_GRAPHICS = "High";

const keyOf = (game: string, resolution: string) => `${game}::${resolution}`;

export const FpsEditor = ({
  value,
  onChange,
}: {
  value: FpsSettings | null | undefined;
  onChange: (next: FpsSettings) => void;
}) => {
  const entries = useMemo(() => value?.entries || [], [value]);

  /* En post per spel och upplösning. Finns flera grafiklägen för samma
     ruta vinner den första - rutnätet visar ett tal per ruta, och att
     tyst summera två hade gett en siffra som inte står någonstans. */
  const byKey = useMemo(() => {
    const map = new Map<string, FpsEntry>();
    entries.forEach((entry) => {
      const key = keyOf(entry.game, entry.resolution);
      if (!map.has(key)) map.set(key, entry);
    });
    return map;
  }, [entries]);

  const setFps = (game: string, resolution: string, fps: number) => {
    const key = keyOf(game, resolution);
    const existing = byKey.get(key);
    const next: FpsEntry[] = entries.filter(
      (entry) => keyOf(entry.game, entry.resolution) !== key,
    );

    if (fps > 0) {
      next.push({
        game,
        resolution,
        graphics: existing?.graphics || DEFAULT_GRAPHICS,
        baseFps: Math.round(fps),
        supportsDlssFsr: existing?.supportsDlssFsr ?? false,
        dlssFsrMode: existing?.dlssFsrMode ?? null,
        supportsFrameGeneration: existing?.supportsFrameGeneration ?? false,
      });
    }

    onChange({ version: 2, entries: next });
  };

  const toggleSupport = (game: string, field: "supportsDlssFsr" | "supportsFrameGeneration") => {
    /* Stödet gäller spelet, inte upplösningen. Ett spel som klarar DLSS
       gör det i alla upplösningar, så alla rader för spelet ändras ihop -
       annars hade man behövt kryssa samma sak tre gånger. */
    const current = entries.find((entry) => entry.game === game);
    const nextValue = !(current?.[field] ?? false);
    onChange({
      version: 2,
      entries: entries.map((entry) =>
        entry.game === game ? { ...entry, [field]: nextValue } : entry,
      ),
    });
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] border-collapse text-sm">
          <thead>
            <tr>
              <th className="pb-2 text-left text-xs font-semibold text-slate-400">Spel</th>
              {ADMIN_FPS_RESOLUTION_OPTIONS.map((resolution: string) => (
                <th key={resolution} className="pb-2 text-center text-xs font-semibold text-slate-400">
                  {resolution}
                </th>
              ))}
              <th className="pb-2 text-center text-xs font-semibold text-slate-400" title="DLSS eller FSR">
                DLSS
              </th>
              <th className="pb-2 text-center text-xs font-semibold text-slate-400" title="Bildgenerering">
                Bildgen.
              </th>
            </tr>
          </thead>
          <tbody>
            {ADMIN_FPS_GAME_OPTIONS.map((game: string) => {
              const sample = entries.find((entry) => entry.game === game);
              return (
                <tr key={game} className="border-t border-slate-800/70">
                  <td className="py-1.5 pr-3 text-xs text-slate-300">{game}</td>
                  {ADMIN_FPS_RESOLUTION_OPTIONS.map((resolution: string) => {
                    const entry = byKey.get(keyOf(game, resolution));
                    return (
                      <td key={resolution} className="px-1 py-1.5">
                        <input
                          type="number"
                          min={0}
                          max={1000}
                          value={entry?.baseFps ?? ""}
                          placeholder="-"
                          aria-label={`${game}, ${resolution}`}
                          onChange={(event) => setFps(game, resolution, Number(event.target.value) || 0)}
                          className="w-full rounded border border-slate-700/60 bg-slate-950/60 px-2 py-1 text-center text-xs tabular-nums text-slate-100 placeholder:text-slate-700 focus:border-cyan-400/60 focus:outline-none"
                        />
                      </td>
                    );
                  })}
                  <td className="px-1 py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={sample?.supportsDlssFsr ?? false}
                      onChange={() => toggleSupport(game, "supportsDlssFsr")}
                      aria-label={`${game} stödjer DLSS eller FSR`}
                      className="h-4 w-4 accent-cyan-400"
                    />
                  </td>
                  <td className="px-1 py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={sample?.supportsFrameGeneration ?? false}
                      onChange={() => toggleSupport(game, "supportsFrameGeneration")}
                      aria-label={`${game} stödjer bildgenerering`}
                      className="h-4 w-4 accent-cyan-400"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        Tomt fält betyder att spelet inte visas i den upplösningen på produktsidan.
        Siffrorna är vad kunden får se, så de bör komma från en verklig mätning.
      </p>
    </div>
  );
};
