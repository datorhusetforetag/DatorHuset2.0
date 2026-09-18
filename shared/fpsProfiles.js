/**
 * FPS-profilerna: en per maskin, delade mellan server och klient.
 *
 * Grundtabellen är vad ett 5080-bygge klarar i sex spel, tre
 * upplösningar och fem grafiklägen. Varje maskin har sedan en faktor
 * per upplösning och per spel som skalar ned den - en Silver-Speedster
 * ligger på ungefär halva ett 5080-bygges bildfrekvens.
 *
 * VARFÖR DEN LIGGER I shared/
 *
 * Tabellen bodde i server-local.js, och produktsidan kom bara åt den
 * via /api/fps-settings. Det gjorde att FPS-avsnittet försvann helt
 * så fort servern inte svarade - i utvecklingsläge finns bara Vite,
 * och då fanns ingen endpoint alls.
 *
 * Nu läser båda samma fil. Klienten räknar fram rätt siffror för
 * maskinen direkt, och serverns svar lägger sig ovanpå när det kommer
 * - det är där adminläget sparar sina egna värden.
 *
 * Siffrorna får INTE kopieras tillbaka till någon av sidorna. Två
 * kopior av en taltabell glider isär, och då visar butiken ett värde
 * och adminvyn ett annat.
 */
export const FPS_GRAPHICS_PRESETS = ["Low", "Medium", "High", "Ultra", "Ultra + Raytracing/Pathtracing"];
export const FPS_RESOLUTION_ORDER = ["1080p", "1440p", "4K"];
export const FPS_GAME_SUPPORT_MAP = {
  Fortnite: { dlss: true, frameGen: true },
  "Cyberpunk 2077": { dlss: true, frameGen: true },
  "Ghost of Tsushima": { dlss: true, frameGen: true },
  "GTA 5": { dlss: false, frameGen: false },
  Minecraft: { dlss: false, frameGen: false },
  CS2: { dlss: false, frameGen: false },
};
export const FPS_FLAGSHIP_BASE_MAP = {
  Fortnite: {
    "1080p": { Low: 580, Medium: 470, High: 380, Ultra: 300, "Ultra + Raytracing/Pathtracing": 220 },
    "1440p": { Low: 460, Medium: 370, High: 300, Ultra: 240, "Ultra + Raytracing/Pathtracing": 170 },
    "4K": { Low: 300, Medium: 245, High: 195, Ultra: 155, "Ultra + Raytracing/Pathtracing": 115 },
  },
  "Cyberpunk 2077": {
    "1080p": { Low: 240, Medium: 195, High: 155, Ultra: 125, "Ultra + Raytracing/Pathtracing": 90 },
    "1440p": { Low: 185, Medium: 150, High: 118, Ultra: 92, "Ultra + Raytracing/Pathtracing": 68 },
    "4K": { Low: 118, Medium: 95, High: 78, Ultra: 62, "Ultra + Raytracing/Pathtracing": 45 },
  },
  "Ghost of Tsushima": {
    "1080p": { Low: 300, Medium: 250, High: 205, Ultra: 168, "Ultra + Raytracing/Pathtracing": 122 },
    "1440p": { Low: 235, Medium: 195, High: 158, Ultra: 130, "Ultra + Raytracing/Pathtracing": 95 },
    "4K": { Low: 150, Medium: 123, High: 100, Ultra: 82, "Ultra + Raytracing/Pathtracing": 60 },
  },
  "GTA 5": {
    "1080p": { Low: 430, Medium: 370, High: 305, Ultra: 245, "Ultra + Raytracing/Pathtracing": 245 },
    "1440p": { Low: 330, Medium: 280, High: 235, Ultra: 190, "Ultra + Raytracing/Pathtracing": 190 },
    "4K": { Low: 225, Medium: 190, High: 160, Ultra: 130, "Ultra + Raytracing/Pathtracing": 130 },
  },
  Minecraft: {
    "1080p": { Low: 680, Medium: 560, High: 450, Ultra: 340, "Ultra + Raytracing/Pathtracing": 150 },
    "1440p": { Low: 550, Medium: 450, High: 360, Ultra: 280, "Ultra + Raytracing/Pathtracing": 115 },
    "4K": { Low: 390, Medium: 315, High: 250, Ultra: 195, "Ultra + Raytracing/Pathtracing": 82 },
  },
  CS2: {
    "1080p": { Low: 720, Medium: 620, High: 520, Ultra: 430, "Ultra + Raytracing/Pathtracing": 430 },
    "1440p": { Low: 560, Medium: 480, High: 400, Ultra: 335, "Ultra + Raytracing/Pathtracing": 335 },
    "4K": { Low: 390, Medium: 335, High: 280, Ultra: 235, "Ultra + Raytracing/Pathtracing": 235 },
  },
};
export const FPS_REPORT_PROFILE_FACTORS = {
  all_out_5080: {
    byResolution: { "1080p": 1, "1440p": 1, "4K": 1 },
    byGame: { Fortnite: 1.02, "Cyberpunk 2077": 1, "Ghost of Tsushima": 1, "GTA 5": 1, Minecraft: 1, CS2: 0.92 },
  },
  platina_frostbyte: {
    byResolution: { "1080p": 0.9, "1440p": 0.88, "4K": 0.86 },
    byGame: { Fortnite: 1.02, "Cyberpunk 2077": 1.02, "Ghost of Tsushima": 1.02, "GTA 5": 1, Minecraft: 0.98, CS2: 0.96 },
  },
  platina_coldbyte: {
    byResolution: { "1080p": 0.86, "1440p": 0.84, "4K": 0.82 },
    byGame: { Fortnite: 1, "Cyberpunk 2077": 1.01, "Ghost of Tsushima": 1, "GTA 5": 0.99, Minecraft: 0.96, CS2: 0.94 },
  },
  platina_sleeper: {
    byResolution: { "1080p": 0.58, "1440p": 0.56, "4K": 0.55 },
    byGame: { Fortnite: 1.03, "Cyberpunk 2077": 1.02, "Ghost of Tsushima": 1.02, "GTA 5": 1, Minecraft: 0.98, CS2: 0.95 },
  },
  glimmrande_guldigaspiken: {
    byResolution: { "1080p": 0.55, "1440p": 0.53, "4K": 0.52 },
    byGame: { Fortnite: 1, "Cyberpunk 2077": 1, "Ghost of Tsushima": 1, "GTA 5": 0.98, Minecraft: 0.95, CS2: 0.9 },
  },
  guldspiken: {
    byResolution: { "1080p": 0.53, "1440p": 0.51, "4K": 0.5 },
    byGame: { Fortnite: 1.02, "Cyberpunk 2077": 1.05, "Ghost of Tsushima": 0.98, "GTA 5": 1, Minecraft: 0.96, CS2: 0.9 },
  },
  guld_inferno: {
    byResolution: { "1080p": 0.42, "1440p": 0.4, "4K": 0.39 },
    byGame: { Fortnite: 0.92, "Cyberpunk 2077": 1.08, "Ghost of Tsushima": 0.96, "GTA 5": 0.9, Minecraft: 0.86, CS2: 0.8 },
  },
  silver_speedster: {
    byResolution: { "1080p": 0.5, "1440p": 0.46, "4K": 0.43 },
    byGame: { Fortnite: 0.98, "Cyberpunk 2077": 0.95, "Ghost of Tsushima": 0.95, "GTA 5": 0.95, Minecraft: 0.9, CS2: 0.82 },
  },
};

export const cloneFpsSettings = (settings) => ({
  version: 2,
  entries: Array.isArray(settings?.entries)
    ? settings.entries.map((entry) => ({ ...entry }))
    : [],
});

export const buildFpsSettingsFromProfileFactors = (profile) => {
  const byResolution = profile?.byResolution || {};
  const byGame = profile?.byGame || {};
  const entries = [];

  Object.entries(FPS_FLAGSHIP_BASE_MAP).forEach(([game, resolutionMap]) => {
    const supports = FPS_GAME_SUPPORT_MAP[game] || { dlss: false, frameGen: false };
    FPS_RESOLUTION_ORDER.forEach((resolution) => {
      const graphicsMap = resolutionMap?.[resolution] || {};
      const resolutionFactor = Number(byResolution?.[resolution] ?? 1);
      const gameFactor = Number(byGame?.[game] ?? 1);
      const mode = resolution === "1080p" ? "quality" : resolution === "1440p" ? "balanced" : "performance";

      FPS_GRAPHICS_PRESETS.forEach((graphics) => {
        const base = Number(graphicsMap?.[graphics] ?? 0);
        const scaled = Math.max(0, Math.round(base * resolutionFactor * gameFactor));
        entries.push({
          game,
          resolution,
          graphics,
          baseFps: Math.max(0, scaled),
          supportsDlssFsr: Boolean(supports.dlss),
          dlssFsrMode: supports.dlss ? mode : null,
          supportsFrameGeneration: Boolean(supports.frameGen),
        });
      });
    });
  });

  return { version: 2, entries };
};

export const FPS_REPORT_PROFILES = Object.fromEntries(
  Object.entries(FPS_REPORT_PROFILE_FACTORS).map(([key, factors]) => [
    key,
    buildFpsSettingsFromProfileFactors(factors),
  ])
);

export const normalizeFpsProfileName = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const resolveFpsReportProfileKey = (productName) => {
  const key = normalizeFpsProfileName(productName);
  if (!key) return null;
  if (key.includes("silver-speedster")) return "silver_speedster";
  if (key.includes("guld-inferno")) return "guld_inferno";
  if (key.includes("glimmrande-guldigaspiken")) return "glimmrande_guldigaspiken";
  if (key.includes("guldspiken")) return "guldspiken";
  if (key.includes("platina-sleeper")) return "platina_sleeper";
  if (key.includes("platina-frostbyte")) return "platina_frostbyte";
  if (key.includes("platina-coldbyte")) return "platina_coldbyte";
  if (key.includes("all-black-all-out") || key.includes("all-white-all-out") || key.includes("all-black-white-all-out")) {
    return "all_out_5080";
  }
  return null;
};

export const buildReportedFpsSettingsForProductName = (productName) => {
  const profileKey = resolveFpsReportProfileKey(productName);
  if (!profileKey) return null;
  const profile = FPS_REPORT_PROFILES[profileKey];
  return profile ? cloneFpsSettings(profile) : null;
};
