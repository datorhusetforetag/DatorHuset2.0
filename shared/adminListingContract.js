import { z } from "zod";

export const ADMIN_FPS_GAME_OPTIONS = [
  "Fortnite",
  "Cyberpunk 2077",
  "Ghost of Tsushima",
  "GTA 5",
  "Minecraft",
  "CS2",
];

export const ADMIN_FPS_RESOLUTION_OPTIONS = ["1080p", "1440p", "4K"];
export const ADMIN_DLSS_FSR_MODE_OPTIONS = ["quality", "balanced", "performance"];
export const ADMIN_LISTING_TAG_OPTIONS = ["Budgetvänliga", "Price-Performance", "Bästa prestanda"];

const normalizeTagKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const LISTING_TAG_BY_KEY = ADMIN_LISTING_TAG_OPTIONS.reduce((map, tag) => {
  map[normalizeTagKey(tag)] = tag;
  return map;
}, {});

export const normalizeListingTags = (value) => {
  const items = Array.isArray(value)
    ? value
    : value === null || value === undefined || value === ""
      ? []
      : [value];
  const seen = new Set();
  const normalized = [];
  items.forEach((entry) => {
    const resolved = LISTING_TAG_BY_KEY[normalizeTagKey(entry)];
    if (!resolved || seen.has(resolved)) return;
    seen.add(resolved);
    normalized.push(resolved);
  });
  return normalized;
};

const normalizeNullableString = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
};

const coerceBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0" || normalized === "") return false;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return false;
    return value !== 0;
  }
  return Boolean(value);
};

export const fpsEntrySchema = z.object({
  game: z.enum(ADMIN_FPS_GAME_OPTIONS),
  resolution: z.enum(ADMIN_FPS_RESOLUTION_OPTIONS),
  graphics: z.string().trim().min(1).max(80),
  baseFps: z.number().int().min(0),
  supportsDlssFsr: z.boolean(),
  dlssFsrMode: z.enum(ADMIN_DLSS_FSR_MODE_OPTIONS).nullable(),
  supportsFrameGeneration: z.boolean(),
});

export const fpsSettingsSchema = z.object({
  version: z.literal(2),
  entries: z.array(fpsEntrySchema).max(600),
});

export const listingWriteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.preprocess(normalizeNullableString, z.string().trim().max(80).nullable()).optional(),
  legacy_id: z.preprocess(
    (value) => (value === null || value === undefined ? "" : String(value)),
    z.string().trim().max(80)
  ).optional().nullable(),
  description: z.preprocess(normalizeNullableString, z.string().trim().max(1000).nullable()).optional(),
  image_url: z.preprocess(normalizeNullableString, z.string().trim().max(500).nullable()).optional(),
  images: z.array(z.string().trim().max(500)).max(10).optional(),
  price_cents: z.coerce.number().finite().min(0),
  currency: z.preprocess(normalizeNullableString, z.string().trim().max(8).nullable()).optional(),
  cpu: z.string().trim().min(1).max(120),
  gpu: z.string().trim().min(1).max(120),
  ram: z.string().trim().min(1).max(120),
  storage: z.string().trim().min(1).max(120),
  storage_type: z.string().trim().min(1).max(40),
  tier: z.string().trim().min(1).max(40),
  tags: z.preprocess(
    (value) => normalizeListingTags(value),
    z.array(z.string().trim().min(1).max(40)).max(ADMIN_LISTING_TAG_OPTIONS.length)
  ).optional().default([]),
  motherboard: z.preprocess(normalizeNullableString, z.string().trim().max(120).nullable()).optional(),
  psu: z.preprocess(normalizeNullableString, z.string().trim().max(120).nullable()).optional(),
  case_name: z.preprocess(normalizeNullableString, z.string().trim().max(120).nullable()).optional(),
  cpu_cooler: z.preprocess(normalizeNullableString, z.string().trim().max(120).nullable()).optional(),
  os: z.preprocess(normalizeNullableString, z.string().trim().max(80).nullable()).optional(),
  quantity_in_stock: z.coerce.number().int().min(0),
  is_preorder: z.preprocess(coerceBoolean, z.boolean()),
  eta_days: z.preprocess(
    (value) => {
      if (value === null || value === undefined || String(value).trim() === "") return null;
      return value;
    },
    z.coerce.number().int().min(0).nullable()
  ).optional(),
  eta_input: z.string().trim().max(24).optional().nullable(),
  eta_note: z.preprocess(normalizeNullableString, z.string().trim().max(200).nullable()).optional(),
  used_variant_enabled: z.preprocess(coerceBoolean, z.boolean()).optional(),
  used_parts: z.record(z.boolean()).optional(),
  fps: z.any().optional(),
  listing_group_id: z.preprocess(normalizeNullableString, z.string().trim().max(120).nullable()).optional(),
  expected_updated_at: z.preprocess(
    (value) => {
      if (value === null || value === undefined) return null;
      const text = String(value).trim();
      return text || null;
    },
    z.string().datetime({ offset: true }).nullable()
  ).optional(),
});

export const createListingRequestSchema = z.object({
  listing: listingWriteSchema,
  fps: z.any().optional(),
  used_variant: z
    .object({
      enabled: z.boolean(),
      listing: listingWriteSchema.optional(),
      used_parts: z.record(z.boolean()).optional(),
    })
    .optional(),
});

export const updateListingRequestSchema = z.object({
  listing: listingWriteSchema,
  fps: z.any().optional(),
  used_parts: z.record(z.boolean()).optional(),
  expected_updated_at: z.string().datetime({ offset: true }).optional().nullable(),
});

export const formatZodValidationError = (error) => {
  const fieldErrors = {};
  const formErrors = [];
  (error?.issues || []).forEach((issue) => {
    const path = Array.isArray(issue.path) && issue.path.length > 0 ? issue.path.join(".") : "_root";
    if (path === "_root") {
      formErrors.push(issue.message || "Ogiltigt värde.");
      return;
    }
    if (!fieldErrors[path]) fieldErrors[path] = [];
    fieldErrors[path].push(issue.message || "Ogiltigt värde.");
  });
  return { fieldErrors, formErrors };
};
