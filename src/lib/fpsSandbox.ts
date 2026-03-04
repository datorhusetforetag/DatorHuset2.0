export type DlssFsrMode = "quality" | "balanced" | "performance";

export type FpsSandboxEntry = {
  game: string;
  resolution: string;
  graphics: string;
  baseFps: number;
  supportsDlssFsr: boolean;
  dlssFsrMode: DlssFsrMode | null;
  supportsFrameGeneration: boolean;
};

export type FpsSandboxSettings = {
  version: 2;
  entries: FpsSandboxEntry[];
};

export const DLSS_FSR_MULTIPLIERS: Record<DlssFsrMode, number> = {
  quality: 1.2,
  balanced: 1.35,
  performance: 1.5,
};

export const FRAME_GENERATION_MULTIPLIER = 1.8;

export const FPS_SANDBOX_GAME_OPTIONS = [
  "Fortnite",
  "Cyberpunk 2077",
  "Ghost of Tsushima",
  "GTA 5",
  "Minecraft",
  "CS2",
] as const;

export const FPS_SANDBOX_RESOLUTION_OPTIONS = ["1080p", "1440p", "4K"] as const;
const FPS_SANDBOX_GAME_OPTION_SET = new Set<string>(FPS_SANDBOX_GAME_OPTIONS);
const FPS_SANDBOX_RESOLUTION_OPTION_SET = new Set<string>(FPS_SANDBOX_RESOLUTION_OPTIONS);

const DEFAULT_FPS_BASE: Record<string, Record<string, Record<string, number>>> = {
  Fortnite: {
    "1080p": { Low: 284, Medium: 230, High: 186, Ultra: 147, "Ultra + Raytracing/Pathtracing": 108 },
    "1440p": { Low: 207, Medium: 167, High: 135, Ultra: 108, "Ultra + Raytracing/Pathtracing": 77 },
    "4K": { Low: 126, Medium: 103, High: 82, Ultra: 65, "Ultra + Raytracing/Pathtracing": 48 },
  },
  "Cyberpunk 2077": {
    "1080p": { Low: 114, Medium: 93, High: 74, Ultra: 59, "Ultra + Raytracing/Pathtracing": 43 },
    "1440p": { Low: 81, Medium: 66, High: 52, Ultra: 40, "Ultra + Raytracing/Pathtracing": 30 },
    "4K": { Low: 48, Medium: 39, High: 32, Ultra: 25, "Ultra + Raytracing/Pathtracing": 18 },
  },
  "Ghost of Tsushima": {
    "1080p": { Low: 143, Medium: 119, High: 97, Ultra: 80, "Ultra + Raytracing/Pathtracing": 58 },
    "1440p": { Low: 103, Medium: 85, High: 69, Ultra: 57, "Ultra + Raytracing/Pathtracing": 41 },
    "4K": { Low: 61, Medium: 50, High: 41, Ultra: 33, "Ultra + Raytracing/Pathtracing": 24 },
  },
  "GTA 5": {
    "1080p": { Low: 204, Medium: 176, High: 145, Ultra: 116, "Ultra + Raytracing/Pathtracing": 116 },
    "1440p": { Low: 144, Medium: 123, High: 103, Ultra: 83, "Ultra + Raytracing/Pathtracing": 83 },
    "4K": { Low: 92, Medium: 78, High: 65, Ultra: 53, "Ultra + Raytracing/Pathtracing": 53 },
  },
  Minecraft: {
    "1080p": { Low: 306, Medium: 252, High: 203, Ultra: 153, "Ultra + Raytracing/Pathtracing": 68 },
    "1440p": { Low: 228, Medium: 186, High: 149, Ultra: 116, "Ultra + Raytracing/Pathtracing": 48 },
    "4K": { Low: 151, Medium: 122, High: 97, Ultra: 75, "Ultra + Raytracing/Pathtracing": 32 },
  },
  CS2: {
    "1080p": { Low: 295, Medium: 254, High: 213, Ultra: 176, "Ultra + Raytracing/Pathtracing": 176 },
    "1440p": { Low: 211, Medium: 181, High: 151, Ultra: 127, "Ultra + Raytracing/Pathtracing": 127 },
    "4K": { Low: 137, Medium: 118, High: 99, Ultra: 83, "Ultra + Raytracing/Pathtracing": 83 },
  },
};

const DEFAULT_FPS_SUPPORTS: Record<string, { dlss: boolean; frameGen: boolean }> = {
  Fortnite: { dlss: true, frameGen: true },
  "Cyberpunk 2077": { dlss: true, frameGen: true },
  "Ghost of Tsushima": { dlss: true, frameGen: true },
  "GTA 5": { dlss: false, frameGen: false },
  Minecraft: { dlss: false, frameGen: false },
  CS2: { dlss: false, frameGen: false },
};

const sanitizeLabel = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const clampFps = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return Math.max(0, Math.round(fallback));
  return Math.max(0, Math.round(parsed));
};

const normalizeMode = (value: unknown, enabled: boolean): DlssFsrMode | null => {
  if (!enabled) return null;
  const mode = sanitizeLabel(value, 24).toLowerCase();
  if (mode === "quality" || mode === "balanced" || mode === "performance") {
    return mode;
  }
  return "balanced";
};

const sanitizeEntries = (entries: unknown): FpsSandboxEntry[] => {
  if (!Array.isArray(entries)) return [];
  const deduped = new Map<string, FpsSandboxEntry>();
  entries.forEach((entry) => {
    const game = sanitizeLabel((entry as FpsSandboxEntry)?.game, 80);
    const resolution = sanitizeLabel((entry as FpsSandboxEntry)?.resolution, 40);
    const graphics = sanitizeLabel((entry as FpsSandboxEntry)?.graphics, 80);
    if (!game || !resolution || !graphics) return;
    if (!FPS_SANDBOX_GAME_OPTION_SET.has(game)) return;
    if (!FPS_SANDBOX_RESOLUTION_OPTION_SET.has(resolution)) return;
    const supportsDlssFsr = Boolean((entry as FpsSandboxEntry)?.supportsDlssFsr);
    const supportsFrameGeneration = Boolean((entry as FpsSandboxEntry)?.supportsFrameGeneration);
    const dlssFsrMode = normalizeMode((entry as FpsSandboxEntry)?.dlssFsrMode, supportsDlssFsr);
    const key = `${game.toLowerCase()}::${resolution.toLowerCase()}::${graphics.toLowerCase()}`;
    deduped.set(key, {
      game,
      resolution,
      graphics,
      baseFps: clampFps((entry as FpsSandboxEntry)?.baseFps, 0),
      supportsDlssFsr,
      dlssFsrMode,
      supportsFrameGeneration,
    });
  });
  return Array.from(deduped.values());
};

const legacySettingsToEntries = (input: any): FpsSandboxEntry[] => {
  const games = input?.games && typeof input.games === "object" ? input.games : {};
  const entries: FpsSandboxEntry[] = [];
  Object.entries(games).forEach(([game, gameSettings]: any) => {
    const supportsDlssFsr = Boolean(gameSettings?.supports?.dlss);
    const supportsFrameGeneration = Boolean(gameSettings?.supports?.frameGen);
    const dlssFsrMode: DlssFsrMode | null = supportsDlssFsr ? "balanced" : null;
    const resolutions = gameSettings?.resolutions && typeof gameSettings.resolutions === "object"
      ? gameSettings.resolutions
      : {};
    Object.entries(resolutions).forEach(([resolution, graphicsMap]: any) => {
      Object.entries(graphicsMap || {}).forEach(([graphics, presetData]: any) => {
        const firstRange =
          presetData?.base ||
          presetData?.dlssFrameGen ||
          presetData?.dlss ||
          presetData?.frameGen ||
          null;
        const min = Number(firstRange?.min);
        const max = Number(firstRange?.max);
        const baseFps =
          Number.isFinite(min) && Number.isFinite(max) ? Math.max(0, Math.round((min + max) / 2)) : 0;
        entries.push({
          game,
          resolution,
          graphics,
          baseFps,
          supportsDlssFsr,
          dlssFsrMode,
          supportsFrameGeneration,
        });
      });
    });
  });
  return entries;
};

export const buildDefaultFpsSandboxSettings = (): FpsSandboxSettings => {
  const entries: FpsSandboxEntry[] = [];
  Object.entries(DEFAULT_FPS_BASE).forEach(([game, resolutions]) => {
    const supports = DEFAULT_FPS_SUPPORTS[game] || { dlss: false, frameGen: false };
    Object.entries(resolutions).forEach(([resolution, graphicsMap]) => {
      Object.entries(graphicsMap).forEach(([graphics, fps]) => {
        entries.push({
          game,
          resolution,
          graphics,
          baseFps: clampFps(fps, 60),
          supportsDlssFsr: supports.dlss,
          dlssFsrMode: supports.dlss ? "balanced" : null,
          supportsFrameGeneration: supports.frameGen,
        });
      });
    });
  });
  return { version: 2, entries };
};

export const normalizeFpsSandboxSettings = (
  input: unknown,
  fallbackInput?: FpsSandboxSettings | null
): FpsSandboxSettings => {
  const fallback = fallbackInput || buildDefaultFpsSandboxSettings();
  const fallbackEntries = sanitizeEntries(fallback.entries);
  if (!input || typeof input !== "object") {
    return { version: 2, entries: fallbackEntries };
  }
  let entries = sanitizeEntries((input as FpsSandboxSettings).entries);
  if (entries.length === 0 && (input as any).games && typeof (input as any).games === "object") {
    entries = sanitizeEntries(legacySettingsToEntries(input));
  }
  if (entries.length === 0) {
    entries = fallbackEntries;
  }
  return { version: 2, entries };
};

export const getSandboxGames = (settings: FpsSandboxSettings) =>
  Array.from(new Set(settings.entries.map((entry) => entry.game)));

export const getSandboxResolutions = (settings: FpsSandboxSettings, game: string) =>
  Array.from(
    new Set(settings.entries.filter((entry) => entry.game === game).map((entry) => entry.resolution))
  );

export const getSandboxGraphics = (settings: FpsSandboxSettings, game: string, resolution: string) =>
  Array.from(
    new Set(
      settings.entries
        .filter((entry) => entry.game === game && entry.resolution === resolution)
        .map((entry) => entry.graphics)
    )
  );

export const findSandboxEntry = (
  settings: FpsSandboxSettings,
  game: string,
  resolution: string,
  graphics: string
) =>
  settings.entries.find(
    (entry) => entry.game === game && entry.resolution === resolution && entry.graphics === graphics
  ) || null;

export const computeSandboxFps = (
  entry: FpsSandboxEntry | null,
  options: { dlssFsrOn: boolean; frameGenerationOn: boolean }
) => {
  if (!entry) return 0;
  let fps = Math.max(0, Number(entry.baseFps) || 0);
  if (options.dlssFsrOn && entry.supportsDlssFsr) {
    const mode: DlssFsrMode = entry.dlssFsrMode || "balanced";
    fps *= DLSS_FSR_MULTIPLIERS[mode] || 1;
  }
  if (options.frameGenerationOn && entry.supportsFrameGeneration) {
    fps *= FRAME_GENERATION_MULTIPLIER;
  }
  return Math.max(0, Math.round(fps));
};

export const createEmptyFpsEntry = (): FpsSandboxEntry => ({
  game: FPS_SANDBOX_GAME_OPTIONS[0],
  resolution: FPS_SANDBOX_RESOLUTION_OPTIONS[0],
  graphics: "",
  baseFps: 0,
  supportsDlssFsr: false,
  dlssFsrMode: null,
  supportsFrameGeneration: false,
});
