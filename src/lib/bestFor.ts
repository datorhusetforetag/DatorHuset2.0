import { buildReportedFpsSettingsForProductName } from "../../shared/fpsProfiles.js";

/*
 * "Bäst för" på produktkortet.
 *
 * Inte en marknadsföringsetikett utan ett svar räknat ur maskinens egna
 * FPS-värden: den högsta upplösning där Cyberpunk 2077 på High ger
 * minst 60 bilder per sekund. Cyberpunk för att det är det tyngsta
 * spelet i tabellen, High för att det är den nivå folk faktiskt spelar
 * på, 60 för att det är gränsen under vilken det känns trögt.
 *
 * Saknar maskinen profil visas ingen etikett alls. En gissning här hade
 * varit ett prestandapåstående om en produkt.
 */
const RESOLUTION_ORDER = ["4K", "1440p", "1080p"] as const;

export const bestForResolution = (productName: string): string | null => {
  const profile = buildReportedFpsSettingsForProductName(productName);
  if (!profile) return null;

  for (const resolution of RESOLUTION_ORDER) {
    const entry = profile.entries.find(
      (item: { game: string; resolution: string; graphics: string; baseFps: number }) =>
        item.game === "Cyberpunk 2077" &&
        item.resolution === resolution &&
        item.graphics === "High",
    );
    if (entry && entry.baseFps >= 60) return resolution;
  }
  return null;
};
