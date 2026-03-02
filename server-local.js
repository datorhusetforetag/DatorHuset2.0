/**
 * EXPRESS SERVER FOR STRIPE INTEGRATION
 * Deployable to Render/Railway/etc.
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { z } from "zod";
import {
  ADMIN_DLSS_FSR_MODE_OPTIONS,
  ADMIN_FPS_GAME_OPTIONS,
  ADMIN_FPS_RESOLUTION_OPTIONS,
  createListingRequestSchema,
  formatZodValidationError,
  listingWriteSchema,
  updateListingRequestSchema,
} from "./shared/adminListingContract.js";

dotenv.config();

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] === "http") {
    const host = req.headers.host || "";
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }
  return next();
});
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");
const PRODUCT_IMAGE_BUCKET = String(process.env.SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images").trim() || "product-images";
const MAX_UPLOAD_IMAGE_BYTES = Math.max(200_000, Number(process.env.MAX_UPLOAD_IMAGE_BYTES || 8 * 1024 * 1024));
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || "15mb";

const RAW_FRONTEND_URL = process.env.FRONTEND_URL || "";
const FRONTEND_URLS = (process.env.FRONTEND_URLS || RAW_FRONTEND_URL || "http://localhost:8080")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const isAllowedOrigin = (origin) => !origin || FRONTEND_URLS.includes(origin);
const STRIPE_WEBHOOK_ALLOWED_IPS = (process.env.STRIPE_WEBHOOK_ALLOWED_IPS || "")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);
const ADMIN_EMAIL_ALLOWLIST = (process.env.ADMIN_EMAIL_ALLOWLIST || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const ADMIN_REQUIRE_MFA = process.env.ADMIN_REQUIRE_MFA === "true";
const STRIPE_EXPECT_LIVEMODE =
  process.env.STRIPE_EXPECT_LIVEMODE === "true"
    ? true
    : process.env.STRIPE_EXPECT_LIVEMODE === "false"
      ? false
      : null;

const createRateLimitJsonHandler = (message) => (req, res, _next, options) => {
  const now = Date.now();
  const resetTimeValue = req?.rateLimit?.resetTime;
  const resetAt = resetTimeValue ? new Date(resetTimeValue).getTime() : now + Number(options?.windowMs || 0);
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
  res.set("Retry-After", String(retryAfterSeconds));
  return res.status(options?.statusCode || 429).json({
    error: message,
    code: "RATE_LIMITED",
    retry_after_seconds: retryAfterSeconds,
  });
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitJsonHandler("För många API-förfrågningar. Försök igen om en liten stund."),
});
const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getRateLimitKey(req, "checkout"),
  handler: createRateLimitJsonHandler("För många checkout-förfrågningar. Vänta en stund och försök igen."),
});
const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getRateLimitKey(req, "admin"),
  handler: createRateLimitJsonHandler("För många förfrågningar. Försök igen om en liten stund."),
});

const getRequestIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (Array.isArray(forwarded)) return forwarded[0]?.trim() || "";
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() || "";
  return (req.ip || "").trim();
};

const getAuthToken = (req) => {
  const authHeader = req.headers.authorization || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
};

const getJwtSubject = (token) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return "";
    const decoded = Buffer.from(payload, "base64").toString("utf8");
    const parsed = JSON.parse(decoded);
    return typeof parsed.sub === "string" ? parsed.sub : "";
  } catch (error) {
    return "";
  }
};

const getRateLimitKey = (req, prefix) => {
  const ip = getRequestIp(req) || "unknown";
  const token = getAuthToken(req);
  const subject = token ? getJwtSubject(token) : "";
  return `${prefix}:${subject || "anon"}:${ip}`;
};

const logStructured = (level, event, payload = {}) => {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...payload,
  };
  const serialized = JSON.stringify(entry);
  if (level === "error") {
    console.error(serialized);
    return;
  }
  if (level === "warn") {
    console.warn(serialized);
    return;
  }
  console.log(serialized);
};

const API_CACHE_TTL_MS = Math.max(5_000, Number(process.env.API_CACHE_TTL_MS || 30_000));
const responseCache = new Map();

const getCached = (key) => {
  const cached = responseCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }
  return cached.value;
};

const setCached = (key, value, ttlMs = API_CACHE_TTL_MS) => {
  responseCache.set(key, { value, expiresAt: Date.now() + Math.max(1_000, ttlMs) });
};

const invalidateCacheByPrefix = (prefix) => {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
};

const invalidateProductCaches = (productIds = []) => {
  invalidateCacheByPrefix("admin:listings:");
  productIds
    .map((id) => sanitizeText(id, 80))
    .filter(Boolean)
    .forEach((id) => {
      invalidateCacheByPrefix(`public:fps:${id}`);
      invalidateCacheByPrefix(`public:used_parts:${id}`);
      invalidateCacheByPrefix(`public:used_variant:${id}`);
      invalidateCacheByPrefix(`public:product_images:${id}`);
      invalidateCacheByPrefix(`admin:listing:${id}`);
      invalidateCacheByPrefix(`admin:listing_fps:${id}`);
    });
};

const isAllowedStripeIp = (req) => {
  if (STRIPE_WEBHOOK_ALLOWED_IPS.length === 0) return true;
  const ip = getRequestIp(req);
  return STRIPE_WEBHOOK_ALLOWED_IPS.includes(ip);
};

const cspDirectives = {
  defaultSrc: ["'self'"],
  baseUri: ["'self'"],
  objectSrc: ["'none'"],
  frameAncestors: ["'none'"],
  imgSrc: ["'self'", "data:", "https:"],
  fontSrc: ["'self'", "data:", "https:"],
  styleSrc: ["'self'", "'unsafe-inline'", "https:"],
  scriptSrc: ["'self'", "https://js.stripe.com"],
  frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
  connectSrc: ["'self'", "https://api.stripe.com", "https://*.supabase.co", ...FRONTEND_URLS],
  formAction: ["'self'", "https://checkout.stripe.com"],
  upgradeInsecureRequests: [],
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: { directives: cspDirectives },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use("/api/webhook", express.raw({ type: "application/json" })); // raw for Stripe
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use("/api/", apiLimiter);
app.use("/api/admin", adminLimiter);

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-12-18.acacia" })
  : null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HAS_SERVICE_ROLE_KEY = typeof supabaseServiceKey === "string" && supabaseServiceKey.trim().length > 0;
const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

if (!HAS_SERVICE_ROLE_KEY) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY is missing. Admin mutations require the service role key to bypass RLS."
  );
}

const FRONTEND_URL = RAW_FRONTEND_URL || FRONTEND_URLS[0] || "http://localhost:8080";
const MAX_LINE_ITEMS = 50;
const MAX_QUANTITY = 10;
const PAYMENT_METHODS = ["card", "klarna", "paypal"];
const CUSTOM_PAYMENT_METHOD = process.env.STRIPE_CUSTOM_PAYMENT_METHOD_ID;
const ALLOWED_PAYMENT_METHODS = new Set([
  ...PAYMENT_METHODS,
  ...(CUSTOM_PAYMENT_METHOD ? [CUSTOM_PAYMENT_METHOD] : []),
]);
const CHECKOUT_EXPIRES_IN_SECONDS = Math.min(
  Math.max(Number(process.env.CHECKOUT_EXPIRES_IN_SECONDS || 30 * 60), 30 * 60),
  24 * 60 * 60
);
const SHIPPING_COST_CENTS = 70000;
const SERVICE_FEE_CENTS = 500;
const STATUS_OPTIONS = new Set([
  "received",
  "ordering",
  "building",
  "postbuild",
  "ready",
  "cancel_requested",
  "pending",
  "in_progress",
  "finished",
  "completed",
]);
const swedishPhoneRegex = /^(?:\+46|0)7\d{8}$/;
const swedishPostalRegex = /^\d{3}\s?\d{2}$/;
const swedishCityRegex = /^[A-Za-z\u00c5\u00c4\u00d6\u00e5\u00e4\u00f6.\s-]+$/;
const DEFAULT_BUILD_CHECKLIST = [
  { id: "parts", label: "Delar plockade", done: false },
  { id: "assembly", label: "Montering klar", done: false },
  { id: "bios", label: "BIOS & uppdateringar", done: false },
  { id: "stress", label: "Stresstest", done: false },
  { id: "qc", label: "QC & packning", done: false },
  { id: "ready", label: "Klar f\u00f6r utl\u00e4mning", done: false },
];

const STATUS_LABELS = {
  received: "Beställning mottagen",
  ordering: "Beställning mottagen",
  building: "Bygger/Produktion",
  postbuild: "Post-bygg justeringar",
  ready: "Redo att hämta/frakta!",
  pending: "Beställning mottagen",
  in_progress: "Bygger/Produktion",
  finished: "Redo att hämta/frakta!",
  completed: "Redo att hämta/frakta!",
  cancel_requested: "Beställning mottagen",
};
const READY_MESSAGE =
  "DatorHuset kommer ringa dig angående när och vart du kan hämta upp datorn. Vi kommer ringa dig och skicka ett mejl.";
const DEFAULT_FPS_SETTINGS = { dlssMultiplier: 1.2, frameGenMultiplier: 1.15 };
const EMPTY_FPS_SETTINGS = { version: 2, entries: [] };
const DEFAULT_FPS_MAP = {
  Fortnite: {
    supports: { dlss: true, frameGen: false, rayTracing: true },
    base: {
      "1080p": { High: 170, Ultra: 170, "Ultra + Raytracing/Pathtracing": 95 },
      "1440p": { High: 120, Ultra: 120, "Ultra + Raytracing/Pathtracing": 95 },
      "4K": { High: 70, Ultra: 70, "Ultra + Raytracing/Pathtracing": 95 },
    },
  },
  "Cyberpunk 2077": {
    supports: { dlss: true, frameGen: true, rayTracing: true },
    base: {
      "1080p": { High: 90, Ultra: 90, "Ultra + Raytracing/Pathtracing": 65 },
      "1440p": { High: 60, Ultra: 60, "Ultra + Raytracing/Pathtracing": 65 },
      "4K": { High: 35, Ultra: 35, "Ultra + Raytracing/Pathtracing": 65 },
    },
  },
  "GTA 5": {
    supports: { dlss: false, frameGen: false, rayTracing: false },
    base: {
      "1080p": { High: 160, Ultra: 160, "Ultra + Raytracing/Pathtracing": 160 },
      "1440p": { High: 110, Ultra: 110, "Ultra + Raytracing/Pathtracing": 110 },
      "4K": { High: 65, Ultra: 65, "Ultra + Raytracing/Pathtracing": 65 },
    },
  },
  Minecraft: {
    supports: { dlss: false, frameGen: false, rayTracing: true },
    base: {
      "1080p": { High: 220, Ultra: 220, "Ultra + Raytracing/Pathtracing": 80 },
      "1440p": { High: 170, Ultra: 170, "Ultra + Raytracing/Pathtracing": 80 },
      "4K": { High: 100, Ultra: 100, "Ultra + Raytracing/Pathtracing": 80 },
    },
  },
  CS2: {
    supports: { dlss: false, frameGen: false, rayTracing: false },
    base: {
      "1080p": { High: 280, Ultra: 280, "Ultra + Raytracing/Pathtracing": 280 },
      "1440p": { High: 220, Ultra: 220, "Ultra + Raytracing/Pathtracing": 220 },
      "4K": { High: 160, Ultra: 160, "Ultra + Raytracing/Pathtracing": 160 },
    },
  },
  "Ghost of Tsushima": {
    supports: { dlss: true, frameGen: false, rayTracing: true },
    base: {
      "1080p": { High: 110, Ultra: 110, "Ultra + Raytracing/Pathtracing": 70 },
      "1440p": { High: 75, Ultra: 75, "Ultra + Raytracing/Pathtracing": 70 },
      "4K": { High: 45, Ultra: 45, "Ultra + Raytracing/Pathtracing": 70 },
    },
  },
};

const FPS_REPORT_PROFILES = {
  silver_speedster: {
    Fortnite: { high1080: 170, ultra1440: 120, ultra4k: 70, rt: { fps: 95, mode: "dlss" } },
    "Cyberpunk 2077": { high1080: 90, ultra1440: 60, ultra4k: 35, rt: { fps: 65, mode: "dlssFrameGen" } },
    "GTA 5": { high1080: 160, ultra1440: 110, ultra4k: 65, rt: null },
    Minecraft: { high1080: 220, ultra1440: 170, ultra4k: 100, rt: { fps: 80, mode: "base" } },
    "Ghost of Tsushima": { high1080: 110, ultra1440: 75, ultra4k: 45, rt: { fps: 70, mode: "dlss" } },
    CS2: { high1080: 280, ultra1440: 220, ultra4k: 160, rt: null },
  },
  guldspiken: {
    Fortnite: { high1080: 210, ultra1440: 150, ultra4k: 90, rt: { fps: 115, mode: "dlss" } },
    "Cyberpunk 2077": { high1080: 110, ultra1440: 75, ultra4k: 45, rt: { fps: 80, mode: "dlss" } },
    "GTA 5": { high1080: 190, ultra1440: 140, ultra4k: 85, rt: null },
    Minecraft: { high1080: 260, ultra1440: 200, ultra4k: 130, rt: { fps: 95, mode: "base" } },
    "Ghost of Tsushima": { high1080: 130, ultra1440: 95, ultra4k: 60, rt: { fps: 85, mode: "dlss" } },
    CS2: { high1080: 340, ultra1440: 260, ultra4k: 190, rt: null },
  },
  platina_sleeper: {
    Fortnite: { high1080: 230, ultra1440: 170, ultra4k: 105, rt: { fps: 130, mode: "dlss" } },
    "Cyberpunk 2077": { high1080: 125, ultra1440: 90, ultra4k: 55, rt: { fps: 85, mode: "dlss" } },
    "GTA 5": { high1080: 210, ultra1440: 160, ultra4k: 100, rt: null },
    Minecraft: { high1080: 290, ultra1440: 230, ultra4k: 150, rt: { fps: 110, mode: "base" } },
    "Ghost of Tsushima": { high1080: 150, ultra1440: 110, ultra4k: 70, rt: { fps: 95, mode: "dlss" } },
    CS2: { high1080: 380, ultra1440: 300, ultra4k: 220, rt: null },
  },
  platina_frostbyte: {
    Fortnite: { high1080: 260, ultra1440: 200, ultra4k: 130, rt: { fps: 155, mode: "dlss" } },
    "Cyberpunk 2077": { high1080: 150, ultra1440: 110, ultra4k: 70, rt: { fps: 105, mode: "dlss" } },
    "GTA 5": { high1080: 230, ultra1440: 180, ultra4k: 120, rt: null },
    Minecraft: { high1080: 320, ultra1440: 260, ultra4k: 170, rt: { fps: 130, mode: "base" } },
    "Ghost of Tsushima": { high1080: 170, ultra1440: 130, ultra4k: 85, rt: { fps: 115, mode: "dlss" } },
    CS2: { high1080: 420, ultra1440: 330, ultra4k: 250, rt: null },
  },
  all_out_5080: {
    Fortnite: { high1080: 320, ultra1440: 250, ultra4k: 170, rt: { fps: 210, mode: "dlssFrameGen" } },
    "Cyberpunk 2077": { high1080: 180, ultra1440: 140, ultra4k: 95, rt: { fps: 150, mode: "dlssFrameGen" } },
    "GTA 5": { high1080: 260, ultra1440: 210, ultra4k: 150, rt: null },
    Minecraft: { high1080: 400, ultra1440: 320, ultra4k: 210, rt: { fps: 180, mode: "base" } },
    "Ghost of Tsushima": { high1080: 210, ultra1440: 170, ultra4k: 120, rt: { fps: 160, mode: "dlss" } },
    CS2: { high1080: 520, ultra1440: 420, ultra4k: 320, rt: null },
  },
};

const DLSS_FSR_MODE_SET = new Set(ADMIN_DLSS_FSR_MODE_OPTIONS);
const FPS_GAME_OPTION_SET = new Set(ADMIN_FPS_GAME_OPTIONS);
const FPS_RESOLUTION_OPTION_SET = new Set(ADMIN_FPS_RESOLUTION_OPTIONS);

const sanitizeFpsLabel = (value, maxLength = 80) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const clampFpsValue = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return Math.max(0, Math.round(fallback));
  return Math.max(0, Math.round(parsed));
};

const normalizeDlssFsrMode = (value, enabled) => {
  if (!enabled) return null;
  const normalized = sanitizeFpsLabel(value, 24).toLowerCase();
  if (DLSS_FSR_MODE_SET.has(normalized)) return normalized;
  return "balanced";
};

const buildDefaultFpsSettings = () => {
  const entries = [];
  Object.entries(DEFAULT_FPS_MAP).forEach(([game, data]) => {
    const supportsDlssFsr = Boolean(data?.supports?.dlss);
    const supportsFrameGeneration = Boolean(data?.supports?.frameGen);
    Object.entries(data?.base || {}).forEach(([resolution, graphicsMap]) => {
      Object.entries(graphicsMap || {}).forEach(([graphics, fps]) => {
        entries.push({
          game,
          resolution,
          graphics,
          baseFps: clampFpsValue(fps, 60),
          supportsDlssFsr,
          dlssFsrMode: supportsDlssFsr ? "balanced" : null,
          supportsFrameGeneration,
        });
      });
    });
  });
  return { version: 2, entries };
};

const buildFpsSettingsFromReportProfile = (profile) => {
  const entries = [];
  const resolutions = ["1080p", "1440p", "4K"];
  const rtPreset = "Ultra + Raytracing/Pathtracing";

  Object.entries(profile).forEach(([game, row]) => {
    const supportsDlssFsr = row.rt?.mode === "dlss" || row.rt?.mode === "dlssFrameGen";
    const supportsFrameGeneration = row.rt?.mode === "dlssFrameGen";
    const dlssFsrMode = supportsDlssFsr
      ? row.rt?.mode === "dlssFrameGen"
        ? "performance"
        : "balanced"
      : null;

    entries.push({
      game,
      resolution: "1080p",
      graphics: "High",
      baseFps: clampFpsValue(row.high1080, 0),
      supportsDlssFsr,
      dlssFsrMode,
      supportsFrameGeneration,
    });
    entries.push({
      game,
      resolution: "1440p",
      graphics: "Ultra",
      baseFps: clampFpsValue(row.ultra1440, 0),
      supportsDlssFsr,
      dlssFsrMode,
      supportsFrameGeneration,
    });
    entries.push({
      game,
      resolution: "4K",
      graphics: "Ultra",
      baseFps: clampFpsValue(row.ultra4k, 0),
      supportsDlssFsr,
      dlssFsrMode,
      supportsFrameGeneration,
    });

    if (row.rt) {
      resolutions.forEach((resolution) => {
        entries.push({
          game,
          resolution,
          graphics: rtPreset,
          baseFps: clampFpsValue(row.rt.fps, 0),
          supportsDlssFsr,
          dlssFsrMode,
          supportsFrameGeneration,
        });
      });
    }
  });

  return { version: 2, entries };
};

const normalizeFpsProfileName = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const resolveFpsReportProfileKey = (productName) => {
  const key = normalizeFpsProfileName(productName);
  if (!key) return null;
  if (key.includes("silver-speedster")) return "silver_speedster";
  if (key.includes("guldspiken") || key.includes("glimmrande-guldigaspiken")) return "guldspiken";
  if (key.includes("platina-sleeper")) return "platina_sleeper";
  if (key.includes("platina-frostbyte") || key.includes("platina-coldbyte")) return "platina_frostbyte";
  if (key.includes("all-black-all-out") || key.includes("all-white-all-out") || key.includes("all-black-white-all-out")) {
    return "all_out_5080";
  }
  return null;
};

const buildReportedFpsSettingsForProductName = (productName) => {
  const profileKey = resolveFpsReportProfileKey(productName);
  if (!profileKey) return null;
  const profile = FPS_REPORT_PROFILES[profileKey];
  return profile ? buildFpsSettingsFromReportProfile(profile) : null;
};

const normalizeLegacyFpsSettings = (input) => {
  const entries = [];
  const games = input?.games && typeof input.games === "object" ? input.games : {};
  Object.entries(games).forEach(([game, gameSettings]) => {
    const supportsDlssFsr = Boolean(gameSettings?.supports?.dlss);
    const supportsFrameGeneration = Boolean(gameSettings?.supports?.frameGen);
    const dlssFsrMode = supportsDlssFsr ? "balanced" : null;
    const resolutions = gameSettings?.resolutions && typeof gameSettings.resolutions === "object"
      ? gameSettings.resolutions
      : {};
    Object.entries(resolutions).forEach(([resolution, graphicsMap]) => {
      Object.entries(graphicsMap || {}).forEach(([graphics, presetData]) => {
        const firstRange =
          presetData?.base ||
          presetData?.dlssFrameGen ||
          presetData?.dlss ||
          presetData?.frameGen ||
          null;
        const min = Number(firstRange?.min);
        const max = Number(firstRange?.max);
        const baseFps = Number.isFinite(min) && Number.isFinite(max)
          ? Math.max(0, Math.round((min + max) / 2))
          : 0;
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

const sanitizeFpsEntries = (entries) => {
  if (!Array.isArray(entries)) return [];
  const deduped = new Map();
  entries.forEach((entry) => {
    const game = sanitizeFpsLabel(entry?.game, 80);
    const resolution = sanitizeFpsLabel(entry?.resolution, 40);
    const graphics = sanitizeFpsLabel(entry?.graphics, 80);
    if (!game || !resolution || !graphics) return;
    if (!FPS_GAME_OPTION_SET.has(game)) return;
    if (!FPS_RESOLUTION_OPTION_SET.has(resolution)) return;
    const supportsDlssFsr = Boolean(entry?.supportsDlssFsr);
    const supportsFrameGeneration = Boolean(entry?.supportsFrameGeneration);
    const dlssFsrMode = normalizeDlssFsrMode(entry?.dlssFsrMode, supportsDlssFsr);
    const key = `${game.toLowerCase()}::${resolution.toLowerCase()}::${graphics.toLowerCase()}`;
    deduped.set(key, {
      game,
      resolution,
      graphics,
      baseFps: clampFpsValue(entry?.baseFps, 0),
      supportsDlssFsr,
      dlssFsrMode,
      supportsFrameGeneration,
    });
  });
  return Array.from(deduped.values());
};

const sanitizeFpsSettings = (input, fallbackInput) => {
  const fallback =
    fallbackInput && typeof fallbackInput === "object" && Array.isArray(fallbackInput.entries)
      ? fallbackInput
      : buildDefaultFpsSettings();
  const fallbackEntries = sanitizeFpsEntries(fallback.entries);
  if (!input || typeof input !== "object") {
    return { version: 2, entries: fallbackEntries };
  }

  let entries = sanitizeFpsEntries(input.entries);
  if (entries.length === 0 && input.games && typeof input.games === "object") {
    entries = sanitizeFpsEntries(normalizeLegacyFpsSettings(input));
  }

  if (entries.length === 0) {
    entries = fallbackEntries;
  }

  return { version: 2, entries };
};

const parseUsedVariantSetting = (value, fallback = true) => {
  if (value && typeof value === "object" && typeof value.enabled === "boolean") {
    return value.enabled;
  }
  if (typeof value === "boolean") return value;
  return fallback;
};


const USED_PART_KEYS = ["cpu", "gpu", "ram", "storage", "motherboard", "psu", "case_name", "cpu_cooler"];

const parseUsedPartsSetting = (value, fallback) => {
  const base = fallback && typeof fallback === "object" ? fallback : {};
  const source = value && typeof value === "object" ? value : {};
  const next = {};
  USED_PART_KEYS.forEach((key) => {
    next[key] = Boolean(source[key] ?? base[key]);
  });
  return next;
};

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 0);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "DatorHuset <no-reply@datorhuset.site>";
const SUPPORT_SMTP_HOST = process.env.SUPPORT_SMTP_HOST || SMTP_HOST;
const SUPPORT_SMTP_PORT = Number(process.env.SUPPORT_SMTP_PORT || SMTP_PORT || 0);
const SUPPORT_SMTP_USER = process.env.SUPPORT_SMTP_USER;
const SUPPORT_SMTP_PASS = process.env.SUPPORT_SMTP_PASS;
const SUPPORT_SMTP_FROM = process.env.SUPPORT_SMTP_FROM || "DatorHuset <support@datorhuset.site>";
const SERVICE_REQUEST_TO = process.env.SERVICE_REQUEST_TO || "support@datorhuset.site";
const OFFER_REQUEST_TO = process.env.OFFER_REQUEST_TO || "support@datorhuset.site";
const ORDER_CANCEL_TO =
  process.env.ORDER_CANCEL_TO || "support@datorhuset.site,datorhuset.foretag@gmail.com";
const DEFAULT_EMAIL_ENABLED = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);
const SUPPORT_EMAIL_ENABLED = Boolean(
  SUPPORT_SMTP_HOST && SUPPORT_SMTP_PORT && SUPPORT_SMTP_USER && SUPPORT_SMTP_PASS
);
const defaultMailer = DEFAULT_EMAIL_ENABLED
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;
const supportMailer = SUPPORT_EMAIL_ENABLED
  ? nodemailer.createTransport({
      host: SUPPORT_SMTP_HOST,
      port: SUPPORT_SMTP_PORT,
      secure: SUPPORT_SMTP_PORT === 465,
      auth: { user: SUPPORT_SMTP_USER, pass: SUPPORT_SMTP_PASS },
    })
  : null;

const sanitizeText = (value, maxLength = 120) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const LEGACY_IMAGE_PATH_MAP = {
  "/products/newpc/cg530-1.jpg": "/products/newpc/cg530_new2.jpg",
  "/products/newpc/cg530-2.jpg": "/products/newpc/cg530_new3.jpg",
  "/products/newpc/cg530-3.jpg": "/products/newpc/cg530_new4.jpg",
  "/products/newpc/chieftecvisio-1.jpg": "/products/newpc/chieftecvisio_new.png",
  "/products/newpc/chieftecvisio-2.webp": "/products/newpc/chieftecvisio_new2.png",
  "/products/newpc/chieftecvisio-3.jpg": "/products/newpc/chieftecvisio_new2.png",
  "/products/newpc/chieftecvista-1.jpg": "/products/newpc/chieftecvista_new.png",
  "/products/newpc/chieftecvista-2.avif": "/products/newpc/chieftecvista_new2.jpg",
  "/chieftecvisio-1.jpg": "/products/newpc/chieftecvisio_new.png",
  "/chieftecvisio-2.webp": "/products/newpc/chieftecvisio_new2.png",
  "/chieftecvisio-3.jpg": "/products/newpc/chieftecvisio_new2.png",
  "/chieftecvista-1.jpg": "/products/newpc/chieftecvista_new.png",
  "/chieftecvista-2.avif": "/products/newpc/chieftecvista_new2.jpg",
};

const LEGACY_BLOCKED_IMAGE_BASENAMES = new Set([
  "datorhuset.png",
  "chieftecvisio-1.jpg",
  "chieftecvisio-2.webp",
  "chieftecvisio-3.jpg",
  "chieftecvista-1.jpg",
  "chieftecvista-2.avif",
  "horizon3_elite_front_2000x.webp",
  "horizon3_elite_hero_2000x.webp",
  "horizon3_elite_side_2000x.webp",
  "horizon_pro_front_welitecomponents_2000x.webp",
  "horizon_pro_hero_welitecomponents_2000x.webp",
  "horizon_pro_side_welitecomponents_2000x.webp",
  "navbase_front_colorswap_2000x.webp",
  "navbase_hero_colorswap_2000x.webp",
  "navbase_side_colorswap_2000x.webp",
  "navpro_front_colorswap_2000x.webp",
  "navpro_hero_colorswap_2000x.webp",
  "navpro_side_colorswap_2000x.webp",
  "traveler_back_2000x.webp",
  "traveler_front_1_2000x.webp",
  "traveler_hero_1_2000x.webp",
  "traveler_side_1_2000x.webp",
  "traveler_top_2000x.webp",
  "voy_red_front_2000x.webp",
  "voy_red_hero_2000x.webp",
  "voy_red_side_2000x.webp",
  "voyelite_hero_new_2000x.webp",
  "voyelite_side_new_2000x.webp",
  "voyager_front_nogeforce_2000x.webp",
  "voyager_front_nogeforce_2000x_2.webp",
  "voyager_hero_nogeforce_2000x.webp",
  "voyager_hero_nogeforce_2000x_2.webp",
  "voyager_side_nogeforce_2000x.webp",
  "voyager_side_nogeforce_2000x_2.webp",
]);

const LEGACY_BLOCKED_IMAGE_TOKENS = [
  "placeholder",
  "horizon3_",
  "horizon_pro_",
  "horizon",
  "navbase_",
  "navpro_",
  "navpro",
  "navbase",
  "traveler_",
  "traveler",
  "voyager_",
  "voyager",
  "voy_red_",
  "voyelite_",
  "voy_red",
  "voyelite",
  "colorswap",
  "nogeforce",
];

const normalizeImagePathKey = (value) => {
  const normalized = String(value || "").trim().replace(/\\/g, "/").toLowerCase();
  if (!normalized) return "";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};

const getImageBasename = (value) => {
  const clean = String(value || "").split("?")[0].split("#")[0];
  const parts = clean.split("/");
  return (parts[parts.length - 1] || "").toLowerCase();
};

const isBlockedLegacyImagePath = (value) => {
  const normalized = normalizeImagePathKey(value);
  if (!normalized) return false;
  const basename = getImageBasename(normalized);
  if (LEGACY_BLOCKED_IMAGE_BASENAMES.has(basename)) return true;
  return LEGACY_BLOCKED_IMAGE_TOKENS.some((token) => normalized.includes(token));
};

const sanitizeImageUrl = (value) => {
  const normalized = sanitizeText(value, 500).replace(/\\/g, "/");
  if (!normalized) return "";
  const lookupKey = normalizeImagePathKey(normalized);
  const mapped = LEGACY_IMAGE_PATH_MAP[lookupKey] || normalized;
  const absolute = /^https?:\/\//i.test(mapped) ? mapped : mapped.startsWith("/") ? mapped : `/${mapped}`;
  if (isBlockedLegacyImagePath(absolute)) return "";
  if (absolute.startsWith("/") || /^https?:\/\//i.test(absolute)) return absolute;
  return "";
};

const sanitizeImageList = (value, fallbackPrimary = "") => {
  const source = Array.isArray(value) ? value : [];
  const normalized = [];
  source.forEach((entry) => {
    const image = sanitizeImageUrl(entry);
    if (image && !normalized.includes(image)) {
      normalized.push(image);
    }
  });
  const fallback = sanitizeImageUrl(fallbackPrimary);
  if (fallback && normalized.length === 0 && !normalized.includes(fallback)) {
    normalized.push(fallback);
  }
  return normalized.slice(0, 10);
};

const parseProductImagesSetting = (value, fallbackPrimary = "") => {
  if (Array.isArray(value)) return sanitizeImageList(value, fallbackPrimary);
  if (value && typeof value === "object" && Array.isArray(value.images)) {
    return sanitizeImageList(value.images, fallbackPrimary);
  }
  return sanitizeImageList([], fallbackPrimary);
};

const ensureImagePathSlug = (value, fallback = "listing") =>
  slugifyValue(value || fallback || "listing").slice(0, 60) || "listing";

const buildStoragePublicUrl = (bucket, objectPath) => {
  const encodedSegments = String(objectPath || "")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));
  if (encodedSegments.length === 0) return "";
  const encodedPath = encodedSegments.join("/");
  if (!supabaseUrl) return `/storage/v1/object/public/${bucket}/${encodedPath}`;
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/${encodedPath}`;
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char] || char;
  });

const generateVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));

const hashVerificationCode = (code) => crypto.createHash("sha256").update(code).digest("hex");

const parseMultiplier = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, parsed);
};

const normalizePhone = (value) => sanitizeText(value, 32).replace(/\s+/g, "");

const getAuthUser = async (req) => {
  if (!supabase) {
    return { user: null, error: "Supabase not configured." };
  }
  const authHeader = req.headers.authorization || "";
  const headerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const token = headerToken;
  if (!token) {
    return { user: null, error: "Missing auth token." };
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { user: null, error: error?.message || "Invalid auth token." };
  }
  return { user: data.user, error: null };
};

const ADMIN_ROLES = ["readonly", "ops", "admin"];

const getAdminRole = (user) => {
  if (user?.app_metadata?.is_admin === true) return "admin";
  const rawRole = String(user?.app_metadata?.role || "").trim().toLowerCase();
  if (ADMIN_ROLES.includes(rawRole)) return rawRole;
  return null;
};

const passesAdminSecurityChecks = (user) => {
  if (ADMIN_EMAIL_ALLOWLIST.length > 0) {
    const email = String(user?.email || "").toLowerCase();
    if (!ADMIN_EMAIL_ALLOWLIST.includes(email)) return false;
  }
  if (ADMIN_REQUIRE_MFA) {
    const mfaEnabled =
      user?.app_metadata?.mfa_enabled === true ||
      (Array.isArray(user?.factors) && user.factors.length > 0);
    if (!mfaEnabled) return false;
  }
  return true;
};

const isAdminUser = (user) => {
  return getAdminRole(user) === "admin" && passesAdminSecurityChecks(user);
};

const canAccessAdminPortal = (user) => {
  const role = getAdminRole(user);
  return Boolean(role) && passesAdminSecurityChecks(user);
};

const hasAdminPermission = (user, allowedRoles = ["readonly", "ops", "admin"]) => {
  if (!passesAdminSecurityChecks(user)) return false;
  const role = getAdminRole(user);
  return Boolean(role && allowedRoles.includes(role));
};

const requireAdminPermission = async (req, res, allowedRoles = ["readonly", "ops", "admin"]) => {
  const { user, error: authError } = await getAuthUser(req);
  if (authError || !user) {
    res.status(401).json({ error: authError || "Unauthorized" });
    return null;
  }
  if (!hasAdminPermission(user, allowedRoles)) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return { user, role: getAdminRole(user) };
};

const jsonError = (res, status, code, message, details = null) =>
  res.status(status).json({
    ok: false,
    error: { code, message, details },
  });

const formatCurrency = (value) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(value);

const formatOrderNumber = (order) => {
  const raw = order?.order_number;
  if (raw === null || raw === undefined || raw === "") {
    return order?.id ? order.id.slice(0, 8) : "-";
  }
  return String(raw);
};

const sendEmail = async ({ to, subject, html }) => {
  if (!defaultMailer) return;
  await defaultMailer.sendMail({ from: SMTP_FROM, to, subject, html });
};

const sendSupportEmail = async ({ to, subject, html, replyTo }) => {
  if (!supportMailer) return;
  await supportMailer.sendMail({ from: SUPPORT_SMTP_FROM, to, subject, html, replyTo });
};

const logAdminAction = async (req, user, action, resourceType, resourceId, metadata) => {
  if (!supabase) return;
  try {
    await supabase.from("admin_audit_logs").insert([
      {
        admin_user_id: user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata,
        ip_address: getRequestIp(req),
        user_agent: req.headers["user-agent"] || null,
      },
    ]);
  } catch (error) {
    console.warn("Admin audit log failed:", error);
  }
};

const requireServiceRoleKey = (res) => {
  if (HAS_SERVICE_ROLE_KEY) return true;
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY is missing. Admin mutations require the service role key to bypass RLS."
  );
  res.status(503).json({
    error: "SUPABASE_SERVICE_ROLE_KEY is missing. Admin mutations are unavailable.",
  });
  return false;
};

const LISTING_SELECT_FIELDS =
  "id, name, slug, legacy_id, description, image_url, price_cents, currency, cpu, gpu, ram, storage, storage_type, tier, motherboard, psu, case_name, cpu_cooler, os, rating, reviews_count, updated_at";
const LISTING_SORT_FIELD_MAP = {
  name: "name",
  updated_at: "updated_at",
  price_cents: "price_cents",
  created_at: "created_at",
};

const slugifyValue = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const parseEtaFromListingPayload = (input) => {
  const etaInput = sanitizeText(input?.eta_input, 24);
  const etaNote = sanitizeText(input?.eta_note, 200);
  if (/^\d+\s*-\s*\d+$/.test(etaInput)) {
    const compact = etaInput.replace(/\s+/g, "");
    return { eta_days: null, eta_note: etaNote || `ETA ${compact} dagar` };
  }
  const etaDaysRaw = input?.eta_days;
  const etaDays = etaDaysRaw === null || etaDaysRaw === undefined ? null : Number(etaDaysRaw);
  if (Number.isFinite(etaDays) && etaDays >= 0) {
    return { eta_days: Math.round(etaDays), eta_note: etaNote || null };
  }
  return { eta_days: null, eta_note: etaNote || null };
};

const ensureUniqueSlug = async (slugInput, name, excludeProductId = "") => {
  const baseSlug = slugifyValue(slugInput || name) || `produkt-${Date.now()}`;
  let slug = baseSlug;
  for (let i = 0; i < 16; i += 1) {
    let query = supabase.from("products").select("id").eq("slug", slug);
    if (excludeProductId) {
      query = query.neq("id", excludeProductId);
    }
    const { data: existing, error } = await query.maybeSingle();
    if (error) {
      throw new Error("Kunde inte validera slug.");
    }
    if (!existing) return slug;
    slug = `${baseSlug}-${i + 2}`.slice(0, 80);
  }
  return `${baseSlug}-${Date.now()}`.slice(0, 80);
};

const uploadListingImageSchema = z.object({
  file_name: z.string().trim().max(160).optional().nullable(),
  mime_type: z.string().trim().max(80),
  data_base64: z.string().trim().min(16),
  listing_slug: z.string().trim().max(80).optional().nullable(),
  variant: z.enum(["base", "used"]).optional().default("base"),
});

const UPLOAD_IMAGE_MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const buildListingResponse = ({
  product,
  inventoryByProductId,
  fpsByProductId,
  usedVariantByProductId,
  usedPartsByProductId,
  productImagesByProductId,
  variantLinkByBaseId,
  variantBaseByUsedId,
  listingGroupByProductId,
}) => {
  const inventoryRow = inventoryByProductId.get(product.id) || null;
  const fallbackFps = EMPTY_FPS_SETTINGS;
  const imageUrl = sanitizeImageUrl(product.image_url);
  const images = parseProductImagesSetting(productImagesByProductId.get(product.id), imageUrl);
  const groupMeta = listingGroupByProductId.get(product.id) || null;
  const linkedUsedId = sanitizeText(variantLinkByBaseId.get(product.id), 80);
  const linkedBaseId = sanitizeText(variantBaseByUsedId.get(product.id), 80);
  const derivedLinkedProductId = linkedUsedId || linkedBaseId || null;
  const derivedVariantRole = linkedUsedId ? "base" : linkedBaseId ? "used" : null;
  const derivedGroupId = linkedUsedId ? product.id : linkedBaseId || null;
  const linkedProductId = sanitizeText(groupMeta?.linked_product_id, 80) || derivedLinkedProductId;
  const variantRole =
    groupMeta?.variant_role === "base" || groupMeta?.variant_role === "used"
      ? groupMeta.variant_role
      : derivedVariantRole;
  const listingGroupId = sanitizeText(groupMeta?.group_id, 120) || derivedGroupId;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    legacy_id: product.legacy_id,
    description: product.description,
    image_url: imageUrl || null,
    images,
    linked_product_id: linkedProductId,
    variant_role: variantRole,
    variant_group_id: listingGroupId,
    listing_group_id: listingGroupId,
    price_cents: Number(product.price_cents || 0),
    currency: product.currency || "SEK",
    cpu: product.cpu,
    gpu: product.gpu,
    ram: product.ram,
    storage: product.storage,
    storage_type: product.storage_type,
    tier: product.tier,
    motherboard: product.motherboard,
    psu: product.psu,
    case_name: product.case_name,
    cpu_cooler: product.cpu_cooler,
    os: product.os,
    quantity_in_stock: Math.max(0, Number(inventoryRow?.quantity_in_stock ?? 0)),
    is_preorder: Boolean(inventoryRow?.is_preorder ?? inventoryRow?.allow_preorder),
    eta_days: inventoryRow?.eta_days ?? null,
    eta_note: inventoryRow?.eta_note || "",
    updated_at: product.updated_at || null,
    inventory_updated_at: inventoryRow?.updated_at || null,
    used_variant_enabled: parseUsedVariantSetting(usedVariantByProductId.get(product.id), true),
    used_parts: parseUsedPartsSetting(usedPartsByProductId.get(product.id), null),
    fps: sanitizeFpsSettings(fpsByProductId.get(product.id), fallbackFps),
  };
};

const loadAdminListings = async ({ limit = 200, offset = 0, q = "", sort = "name", order = "asc", productId = "" }) => {
  const safeLimit = Math.min(250, Math.max(1, Number(limit) || 200));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const sortField = LISTING_SORT_FIELD_MAP[String(sort || "").toLowerCase()] || "name";
  const ascending = String(order || "").toLowerCase() !== "desc";
  const term = sanitizeText(q, 80);
  const idFilter = sanitizeText(productId, 80);

  let productQuery = supabase
    .from("products")
    .select(LISTING_SELECT_FIELDS, { count: "exact" })
    .order(sortField, { ascending });

  if (idFilter) {
    productQuery = productQuery.eq("id", idFilter);
  }
  if (term) {
    const escaped = term.replace(/[%]/g, "");
    productQuery = productQuery.or(`name.ilike.%${escaped}%,slug.ilike.%${escaped}%,legacy_id.ilike.%${escaped}%`);
  }
  if (!idFilter) {
    productQuery = productQuery.range(safeOffset, safeOffset + safeLimit - 1);
  }

  const { data: productsRaw, error: productsError, count } = await productQuery;
  if (productsError) throw new Error(productsError.message || "Kunde inte hämta produkter.");

  const products = (productsRaw || []).filter((product) => {
    const name = String(product.name || "").trim().toLowerCase();
    const slug = String(product.slug || "").trim().toLowerCase();
    return name !== "remove" && slug !== "test";
  });

  if (products.length === 0) {
    return { data: [], total: idFilter ? 0 : count || 0, limit: safeLimit, offset: safeOffset };
  }

  const productIds = products.map((product) => product.id);
  const settingsKeys = productIds.flatMap((id) => [
    `fps:${id}`,
    `used_variant:${id}`,
    `used_parts:${id}`,
    `product_images:${id}`,
    `used_variant_link:${id}`,
    `listing_group:${id}`,
  ]);

  const [inventoryResponse, settingsResponse] = await Promise.all([
    supabase.from("inventory").select("*").in("product_id", productIds),
    supabase.from("ui_settings").select("key, value").in("key", settingsKeys),
  ]);

  if (inventoryResponse.error) throw new Error(inventoryResponse.error.message || "Kunde inte hämta lagerdata.");
  if (settingsResponse.error) throw new Error(settingsResponse.error.message || "Kunde inte hämta listinställningar.");

  const inventoryByProductId = new Map((inventoryResponse.data || []).map((row) => [row.product_id, row]));
  const fpsByProductId = new Map();
  const usedVariantByProductId = new Map();
  const usedPartsByProductId = new Map();
  const productImagesByProductId = new Map();
  const variantLinkByBaseId = new Map();
  const variantBaseByUsedId = new Map();
  const listingGroupByProductId = new Map();

  (settingsResponse.data || []).forEach((setting) => {
    const key = String(setting.key || "");
    if (key.startsWith("fps:")) {
      fpsByProductId.set(key.slice(4), setting.value);
      return;
    }
    if (key.startsWith("used_variant:")) {
      usedVariantByProductId.set(key.slice(13), setting.value);
      return;
    }
    if (key.startsWith("used_parts:")) {
      usedPartsByProductId.set(key.slice(11), setting.value);
      return;
    }
    if (key.startsWith("product_images:")) {
      productImagesByProductId.set(key.slice(15), setting.value);
      return;
    }
    if (key.startsWith("used_variant_link:")) {
      const baseId = sanitizeText(key.slice(18), 80);
      const usedId = sanitizeText(setting?.value?.product_id || setting?.value, 80);
      if (baseId && usedId) {
        variantLinkByBaseId.set(baseId, usedId);
        variantBaseByUsedId.set(usedId, baseId);
      }
      return;
    }
    if (key.startsWith("listing_group:")) {
      const id = sanitizeText(key.slice(14), 80);
      const value = setting?.value && typeof setting.value === "object" ? setting.value : {};
      if (!id) return;
      listingGroupByProductId.set(id, {
        group_id: sanitizeText(value?.group_id, 120),
        variant_role: value?.variant_role === "base" || value?.variant_role === "used" ? value.variant_role : null,
        linked_product_id: sanitizeText(value?.linked_product_id, 80),
      });
    }
  });

  const data = products.map((product) =>
    buildListingResponse({
      product,
      inventoryByProductId,
      fpsByProductId,
      usedVariantByProductId,
      usedPartsByProductId,
      productImagesByProductId,
      variantLinkByBaseId,
      variantBaseByUsedId,
      listingGroupByProductId,
    })
  );

  return { data, total: idFilter ? data.length : count || data.length, limit: safeLimit, offset: safeOffset };
};

const upsertListingGroupSettings = async ({ baseId, usedId = null }) => {
  const baseProductId = sanitizeText(baseId, 80);
  const usedProductId = sanitizeText(usedId, 80);
  if (!baseProductId) return;
  const payload = [
    {
      key: `listing_group:${baseProductId}`,
      value: {
        group_id: baseProductId,
        variant_role: "base",
        linked_product_id: usedProductId || null,
      },
      updated_at: new Date(),
    },
  ];
  if (usedProductId) {
    payload.push({
      key: `listing_group:${usedProductId}`,
      value: {
        group_id: baseProductId,
        variant_role: "used",
        linked_product_id: baseProductId,
      },
      updated_at: new Date(),
    });
  }
  const { error } = await supabase.from("ui_settings").upsert(payload, { onConflict: "key" });
  if (error) {
    throw new Error(error.message || "Kunde inte uppdatera listningsgrupp.");
  }
};

const persistListingState = async ({ req, user, productId, listing, fpsInput, usedPartsInput, role }) => {
  if (!productId) throw new Error("Missing product id.");
  const parsedListing = listingWriteSchema.parse(listing);

  const {
    data: currentProduct,
    error: currentProductError,
  } = await supabase.from("products").select("id, updated_at, image_url").eq("id", productId).maybeSingle();
  if (currentProductError) {
    throw new Error(currentProductError.message || "Kunde inte läsa produkt.");
  }
  if (!currentProduct) {
    throw new Error("Produkten finns inte.");
  }

  const expectedUpdatedAt = parsedListing.expected_updated_at || null;
  if (expectedUpdatedAt && currentProduct.updated_at) {
    const expected = new Date(expectedUpdatedAt).getTime();
    const current = new Date(currentProduct.updated_at).getTime();
    if (Number.isFinite(expected) && Number.isFinite(current) && expected !== current) {
      const err = new Error("LISTING_VERSION_CONFLICT");
      err.code = "LISTING_VERSION_CONFLICT";
      throw err;
    }
  }

  const slug = await ensureUniqueSlug(parsedListing.slug, parsedListing.name, productId);
  const sanitizedPrimaryImage = sanitizeImageUrl(parsedListing.image_url);
  const normalizedImages = sanitizeImageList(parsedListing.images, sanitizedPrimaryImage);
  const resolvedImageUrl =
    parsedListing.image_url === undefined
      ? sanitizeImageUrl(currentProduct.image_url) || null
      : sanitizedPrimaryImage || null;
  const payload = {
    name: sanitizeText(parsedListing.name, 120),
    slug,
    legacy_id: sanitizeText(parsedListing.legacy_id, 80) || null,
    description: sanitizeText(parsedListing.description, 1000) || null,
    image_url: resolvedImageUrl,
    price_cents: Math.max(0, Math.round(Number(parsedListing.price_cents || 0))),
    currency: sanitizeText(parsedListing.currency, 8).toUpperCase() || "SEK",
    cpu: sanitizeText(parsedListing.cpu, 120),
    gpu: sanitizeText(parsedListing.gpu, 120),
    ram: sanitizeText(parsedListing.ram, 120),
    storage: sanitizeText(parsedListing.storage, 120),
    storage_type: sanitizeText(parsedListing.storage_type, 40),
    tier: sanitizeText(parsedListing.tier, 40),
    motherboard: sanitizeText(parsedListing.motherboard, 120) || null,
    psu: sanitizeText(parsedListing.psu, 120) || null,
    case_name: sanitizeText(parsedListing.case_name, 120) || null,
    cpu_cooler: sanitizeText(parsedListing.cpu_cooler, 120) || null,
    os: sanitizeText(parsedListing.os, 80) || null,
    updated_at: new Date(),
  };

  const { data: product, error: updateError } = await supabase
    .from("products")
    .update(payload)
    .eq("id", productId)
    .select(LISTING_SELECT_FIELDS)
    .single();
  if (updateError || !product) {
    throw new Error(updateError?.message || "Kunde inte uppdatera produkt.");
  }

  if (!["admin", "ops"].includes(role)) {
    return product;
  }

  const eta = parseEtaFromListingPayload(parsedListing);
  const inventoryPayload = {
    product_id: productId,
    quantity_in_stock: Math.max(0, Math.round(Number(parsedListing.quantity_in_stock || 0))),
    is_preorder: Boolean(parsedListing.is_preorder),
    eta_days: eta.eta_days,
    eta_note: eta.eta_note || null,
    updated_at: new Date(),
  };
  const { error: inventoryError } = await supabase
    .from("inventory")
    .upsert([inventoryPayload], { onConflict: "product_id" });
  if (inventoryError) {
    throw new Error(inventoryError.message || "Kunde inte uppdatera lager.");
  }

  const normalizedUsedVariantEnabled =
    typeof parsedListing.used_variant_enabled === "boolean"
      ? parsedListing.used_variant_enabled
      : true;
  const usedVariantKey = `used_variant:${productId}`;
  const { error: usedVariantError } = await supabase.from("ui_settings").upsert(
    [{ key: usedVariantKey, value: { enabled: normalizedUsedVariantEnabled }, updated_at: new Date() }],
    { onConflict: "key" }
  );
  if (usedVariantError) {
    throw new Error(usedVariantError.message || "Kunde inte uppdatera begagnad-flagga.");
  }

  const normalizedUsedParts = parseUsedPartsSetting(usedPartsInput || parsedListing.used_parts, null);
  const usedPartsKey = `used_parts:${productId}`;
  const { error: usedPartsError } = await supabase
    .from("ui_settings")
    .upsert([{ key: usedPartsKey, value: normalizedUsedParts, updated_at: new Date() }], { onConflict: "key" });
  if (usedPartsError) {
    throw new Error(usedPartsError.message || "Kunde inte uppdatera begagnade komponenttaggar.");
  }

  const normalizedFps = sanitizeFpsSettings(fpsInput || parsedListing.fps, EMPTY_FPS_SETTINGS);
  const fpsKey = `fps:${productId}`;
  const { error: fpsError } = await supabase
    .from("ui_settings")
    .upsert([{ key: fpsKey, value: normalizedFps, updated_at: new Date() }], { onConflict: "key" });
  if (fpsError) {
    throw new Error(fpsError.message || "Kunde inte uppdatera FPS-variabler.");
  }

  if (parsedListing.images !== undefined || parsedListing.image_url !== undefined) {
    const imagesKey = `product_images:${productId}`;
    const imagesPayload = {
      key: imagesKey,
      value: { version: 1, images: normalizedImages },
      updated_at: new Date(),
    };
    const { error: imagesError } = await supabase.from("ui_settings").upsert([imagesPayload], { onConflict: "key" });
    if (imagesError) {
      throw new Error(imagesError.message || "Kunde inte uppdatera produktbilder.");
    }
  }

  await logAdminAction(req, user, "listing_update_v2", "listing", productId, {
    name: payload.name,
    role,
    quantity_in_stock: inventoryPayload.quantity_in_stock,
    is_preorder: inventoryPayload.is_preorder,
  });

  return product;
};

const recordWebhookEvent = async (event) => {
  if (!event?.id || !supabase) return { duplicate: false };
  const { data: existing, error: existingError } = await supabase
    .from("stripe_webhook_events")
    .select("event_id")
    .eq("event_id", event.id)
    .limit(1);
  if (existingError) {
    console.warn("Webhook event lookup failed:", existingError);
    return { duplicate: false };
  }
  if (existing && existing.length > 0) {
    return { duplicate: true };
  }
  const { error: insertError } = await supabase.from("stripe_webhook_events").insert([
    {
      event_id: event.id,
      event_type: event.type,
      livemode: Boolean(event.livemode),
      received_at: new Date(),
    },
  ]);
  if (insertError) {
    console.warn("Webhook event insert failed:", insertError);
  }
  return { duplicate: false };
};

const buildOrderEmailHtml = ({ headline, intro, order, items, statusNote }) => {
  const orderDate = order?.created_at
    ? new Date(order.created_at).toLocaleDateString("sv-SE")
    : new Date().toLocaleDateString("sv-SE");
  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;color:#111;">${escapeHtml(item.name)}</td>
          <td style="padding:8px 0;color:#6b7280;text-align:center;">x${item.quantity}</td>
          <td style="padding:8px 0;color:#111;text-align:right;">${formatCurrency(item.total)}</td>
        </tr>
      `
    )
    .join("");
  return `
    <div style="background:#f4f7fb;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="padding:24px;background:linear-gradient(135deg,#0f1824 0%,#11667b 100%);color:#ffffff;">
          <img src="https://datorhuset.site/Datorhuset.png" alt="DatorHuset" style="height:32px;display:block;" />
          <h1 style="margin:12px 0 4px;font-size:22px;font-weight:700;">${headline}</h1>
          <p style="margin:0;color:#dbe9ee;">${intro}</p>
        </div>
        <div style="padding:24px;color:#111;">
          <h2 style="font-size:16px;margin:0 0 12px;">Orderdetaljer</h2>
          <p style="margin:4px 0;"><strong>Ordernummer:</strong> ${formatOrderNumber(order)}</p>
          <p style="margin:4px 0;"><strong>Datum:</strong> ${orderDate}</p>
          <p style="margin:4px 0;"><strong>Total:</strong> ${formatCurrency((order.total_cents || 0) / 100)}</p>
          ${statusNote ? `<p style="margin:4px 0;"><strong>Status:</strong> ${statusNote}</p>` : ""}
          <div style="margin:16px 0;border-top:1px solid #e5e7eb;"></div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px 0;color:#6b7280;font-size:12px;letter-spacing:0.04em;">PRODUKT</th>
                <th style="text-align:center;padding:6px 0;color:#6b7280;font-size:12px;letter-spacing:0.04em;">ANTAL</th>
                <th style="text-align:right;padding:6px 0;color:#6b7280;font-size:12px;letter-spacing:0.04em;">SUMMA</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
          <div style="margin:20px 0;border-top:1px solid #e5e7eb;"></div>
          <p style="margin:0;color:#6b7280;">Har du frågor? Svara på det här mailet så hjälper vi dig.</p>
        </div>
        <div style="padding:16px 24px;background:#0f1824;color:#d1d5db;font-size:12px;text-align:center;">
          <p style="margin:0 0 6px;">Behöver du hjälp? Kontakta oss på support@datorhuset.site</p>
          <p style="margin:0;">DatorHuset – Byggda för spel, skapande och vardag.</p>
        </div>
      </div>
    </div>
  `;
};

/**
 * POST /api/create-checkout-session
 */
app.post("/api/create-checkout-session", checkoutLimiter, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: "Stripe not configured. Set STRIPE_SECRET_KEY to enable checkout." });
  }
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." });
  }

  try {
    const { userEmail, fullName, phone, address, postalCode, city, addressId, shippingMethod } = req.body || {};
    if (req?.headers?.origin && !isAllowedOrigin(req.headers.origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }

    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }

    const customerEmail = sanitizeText(user.email || userEmail, 120);
    const safeFullName = sanitizeText(fullName || user.user_metadata?.full_name || user.user_metadata?.username, 120);
    const safePhone = normalizePhone(phone);
    let safeAddress = sanitizeText(address, 200);
    let safePostalCode = sanitizeText(postalCode, 16);
    let safeCity = sanitizeText(city, 80);
    const safeAddressId = sanitizeText(addressId, 60);
    const normalizedShippingMethod = shippingMethod === "postnord" ? "postnord" : "pickup";
    const requiresShipping = normalizedShippingMethod === "postnord";

    if (!customerEmail || !safeFullName || !safePhone) {
      return res.status(400).json({ error: "Missing user information" });
    }
    if (!swedishPhoneRegex.test(safePhone)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }
    if (requiresShipping) {
      if (!safeAddress || !safePostalCode || !safeCity) {
        return res.status(400).json({ error: "Missing shipping address" });
      }
      if (!swedishPostalRegex.test(safePostalCode)) {
        return res.status(400).json({ error: "Invalid postal code" });
      }
      if (!swedishCityRegex.test(safeCity)) {
        return res.status(400).json({ error: "Invalid city" });
      }
    } else {
      safeAddress = safeAddress || "Upphämtning i Rinkeby Centrum";
      safePostalCode = safePostalCode || "";
      safeCity = safeCity || "";
    }

    const { data: dbCartItems, error: cartError } = await supabase
      .from("cart_items")
      .select("quantity, product:product_id (id, name, price_cents)")
      .eq("user_id", user.id);

    if (cartError || !dbCartItems || dbCartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    if (dbCartItems.length > MAX_LINE_ITEMS) {
      return res.status(400).json({ error: "Too many items in cart" });
    }

    const line_items = dbCartItems.map((item) => {
      const quantity = Math.min(MAX_QUANTITY, Math.max(1, Number(item.quantity) || 1));
      const unitAmount = Number(item.product?.price_cents || 0);
      if (!unitAmount || unitAmount < 1) {
        throw new Error("Invalid product price");
      }
      return {
        price_data: {
          currency: "sek",
          product_data: {
            name: item.product?.name || "Produkt",
            metadata: {
              product_id: item.product?.id || "",
            },
          },
          unit_amount: unitAmount,
        },
        quantity,
      };
    });
    const feeLineItems = [
      {
        price_data: {
          currency: "sek",
          product_data: {
            name: "Serviceavgift",
          },
          unit_amount: SERVICE_FEE_CENTS,
        },
        quantity: 1,
      },
    ];
    if (requiresShipping) {
      feeLineItems.push({
        price_data: {
          currency: "sek",
          product_data: {
            name: "PostNord frakt",
          },
          unit_amount: SHIPPING_COST_CENTS,
        },
        quantity: 1,
      });
    }

    const paymentMethodTypes = [...PAYMENT_METHODS];
    const customPaymentMethod = process.env.STRIPE_CUSTOM_PAYMENT_METHOD_ID;
    if (customPaymentMethod) {
      paymentMethodTypes.push(customPaymentMethod);
    }

    const requestOrigin = req?.headers?.origin;
    const checkoutBaseUrl =
      requestOrigin && FRONTEND_URLS.includes(requestOrigin) ? requestOrigin : FRONTEND_URL;
    const expiresAt = Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRES_IN_SECONDS;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      line_items: [...line_items, ...feeLineItems],
      mode: "payment",
      client_reference_id: user.id,
      customer_email: customerEmail,
      billing_address_collection: "required",
      shipping_address_collection: requiresShipping ? { allowed_countries: ["SE"] } : undefined,
      locale: "sv",
      expires_at: expiresAt,
      metadata: {
        userId: user.id,
        fullName: safeFullName,
        userEmail: customerEmail,
        phone: safePhone,
        address: safeAddress,
        postalCode: safePostalCode,
        city: safeCity,
        addressId: safeAddressId,
        shippingMethod: normalizedShippingMethod,
        shippingCostCents: requiresShipping ? String(SHIPPING_COST_CENTS) : "0",
        serviceFeeCents: String(SERVICE_FEE_CENTS),
      },
      success_url: `${checkoutBaseUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${checkoutBaseUrl}/cart`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Create checkout session error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

/**
 * POST /api/service-request
 */
app.post("/api/service-request", async (req, res) => {
  if (!supportMailer) {
    return res.status(503).json({ error: "Support email service not configured" });
  }

  try {
    if (req?.headers?.origin && !isAllowedOrigin(req.headers.origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }

    const name = sanitizeText(req.body?.name, 120);
    const email = sanitizeText(req.body?.email, 120).toLowerCase();
    const phone = sanitizeText(req.body?.phone, 32);
    const deviceType = sanitizeText(req.body?.deviceType, 60);
    const brandModel = sanitizeText(req.body?.brandModel, 120);
    const issueType = sanitizeText(req.body?.issueType, 80);
    const urgency = sanitizeText(req.body?.urgency, 80);
    const serialNumber = sanitizeText(req.body?.serialNumber, 80);
    const notes = sanitizeText(req.body?.notes, 2000);
    const needsBackup = Boolean(req.body?.needsBackup);
    const wantsQuote = Boolean(req.body?.wantsQuote);

    if (!name || !email || !notes) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    if (phone && !swedishPhoneRegex.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
        <h2>Servicef\u00f6rfr\u00e5gan</h2>
        <p><strong>Namn:</strong> ${escapeHtml(name)}</p>
        <p><strong>E-post:</strong> ${escapeHtml(email)}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(phone || "-")}</p>
        <p><strong>Enhetstyp:</strong> ${escapeHtml(deviceType || "-")}</p>
        <p><strong>M\u00e4rke/modell:</strong> ${escapeHtml(brandModel || "-")}</p>
        <p><strong>Typ av problem:</strong> ${escapeHtml(issueType || "-")}</p>
        <p><strong>Br\u00e5dskande:</strong> ${escapeHtml(urgency || "-")}</p>
        <p><strong>Serienummer:</strong> ${escapeHtml(serialNumber || "-")}</p>
        <p><strong>Backup-hj\u00e4lp:</strong> ${needsBackup ? "Ja" : "Nej"}</p>
        <p><strong>Offert innan start:</strong> ${wantsQuote ? "Ja" : "Nej"}</p>
        <p><strong>Beskrivning:</strong></p>
        <p>${escapeHtml(notes).replace(/\\n/g, "<br />")}</p>
      </div>
    `;

    await sendSupportEmail({
      to: SERVICE_REQUEST_TO,
      subject: `Servicef\u00f6rfr\u00e5gan fr\u00e5n ${name}`,
      html,
      replyTo: email,
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Service request error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/offer-request
 */
app.post("/api/offer-request", async (req, res) => {
  if (!supportMailer) {
    return res.status(503).json({ error: "Support email service not configured" });
  }

  try {
    if (req?.headers?.origin && !isAllowedOrigin(req.headers.origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }

    const name = sanitizeText(req.body?.name, 120);
    const email = sanitizeText(req.body?.email, 120).toLowerCase();
    const phone = sanitizeText(req.body?.phone, 32);
    const notes = sanitizeText(req.body?.notes, 2000);
    const totalPrice = Number(req.body?.totalPrice || 0);
    const shareUrl = sanitizeText(req.body?.shareUrl, 500);
    const components = Array.isArray(req.body?.components) ? req.body.components : [];
    const componentLines = components
      .map((item) => ({
        category: sanitizeText(item?.category, 80),
        name: sanitizeText(item?.name, 160),
        price: Number(item?.price || 0),
      }))
      .filter((item) => item.category && item.name);

    if (!name || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    if (phone && !swedishPhoneRegex.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const componentListHtml = componentLines.length
      ? `<ul>${componentLines
          .map(
            (item) =>
              `<li>${escapeHtml(item.category)}: ${escapeHtml(item.name)} (${formatCurrency(item.price)})</li>`
          )
          .join("")}</ul>`
      : "<p>Inga komponenter valda.</p>";

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
        <h2>Offertförfrågan (Custom build)</h2>
        <p><strong>Namn:</strong> ${escapeHtml(name)}</p>
        <p><strong>E-post:</strong> ${escapeHtml(email)}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(phone || "-")}</p>
        ${notes ? `<p><strong>Kommentar:</strong><br />${escapeHtml(notes).replace(/\n/g, "<br />")}</p>` : ""}
        <p><strong>Total:</strong> ${formatCurrency(totalPrice)}</p>
        <p><strong>Valda komponenter:</strong></p>
        ${componentListHtml}
        ${shareUrl ? `<p><strong>Länk:</strong> <a href="${escapeHtml(shareUrl)}">${escapeHtml(shareUrl)}</a></p>` : ""}
      </div>
    `;

    await sendSupportEmail({
      to: OFFER_REQUEST_TO,
      subject: `Offertf?rfr?gan fr?n ${name}`,
      html,
      replyTo: email,
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Offer request error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/addresses
 */
app.get("/api/addresses", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }

    const { data, error } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get addresses error:", error);
      return res.status(500).json({ error: "Failed to fetch addresses" });
    }

    return res.json(data || []);
  } catch (error) {
    console.error("Get addresses error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/addresses
 */
app.post("/api/addresses", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }

    const label = sanitizeText(req.body?.label, 80);
    const fullName = sanitizeText(req.body?.full_name, 120);
    const phone = normalizePhone(req.body?.phone);
    const addressLine1 = sanitizeText(req.body?.address_line1, 160);
    const addressLine2 = sanitizeText(req.body?.address_line2, 160);
    const postalCode = sanitizeText(req.body?.postal_code, 16);
    const city = sanitizeText(req.body?.city, 80);
    const isDefault = Boolean(req.body?.is_default);

    if (!fullName || !addressLine1 || !postalCode || !city) {
      return res.status(400).json({ error: "Missing address fields" });
    }
    if (phone && !swedishPhoneRegex.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }
    if (!swedishPostalRegex.test(postalCode)) {
      return res.status(400).json({ error: "Invalid postal code" });
    }
    if (!swedishCityRegex.test(city)) {
      return res.status(400).json({ error: "Invalid city" });
    }

    if (isDefault) {
      await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id);
    }

    const payload = {
      user_id: user.id,
      label: label || null,
      full_name: fullName,
      phone: phone || null,
      address_line1: addressLine1,
      address_line2: addressLine2 || null,
      postal_code: postalCode,
      city,
      country: "SE",
      is_default: isDefault,
      updated_at: new Date(),
    };

    const { data, error } = await supabase.from("user_addresses").insert([payload]).select().single();

    if (error || !data) {
      console.error("Create address error:", error);
      return res.status(500).json({ error: error?.message || "Failed to create address" });
    }

    return res.json(data);
  } catch (error) {
    console.error("Create address error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/addresses/:addressId/default
 */
app.post("/api/addresses/:addressId/default", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }

    const addressId = sanitizeText(req.params?.addressId, 64);
    if (!addressId) {
      return res.status(400).json({ error: "Missing address id" });
    }

    await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id);
    const { data, error } = await supabase
      .from("user_addresses")
      .update({ is_default: true, updated_at: new Date() })
      .eq("id", addressId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      console.error("Set default address error:", error);
      return res.status(500).json({ error: error?.message || "Failed to update address" });
    }

    return res.json(data);
  } catch (error) {
    console.error("Set default address error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/addresses/:addressId
 */
app.delete("/api/addresses/:addressId", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }

    const addressId = sanitizeText(req.params?.addressId, 64);
    if (!addressId) {
      return res.status(400).json({ error: "Missing address id" });
    }

    const { error } = await supabase
      .from("user_addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete address error:", error);
      return res.status(500).json({ error: error?.message || "Failed to delete address" });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("Delete address error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/v2/listings", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["readonly", "ops", "admin"]);
    if (!access) return;
    const cacheKey = `admin:listings:${JSON.stringify({
      limit: Number(req.query?.limit || 200),
      offset: Number(req.query?.offset || 0),
      q: String(req.query?.q || ""),
      sort: String(req.query?.sort || "name"),
      order: String(req.query?.order || "asc"),
    })}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const payload = await loadAdminListings({
      limit: Number(req.query?.limit || 200),
      offset: Number(req.query?.offset || 0),
      q: String(req.query?.q || ""),
      sort: String(req.query?.sort || "name"),
      order: String(req.query?.order || "asc"),
    });
    const response = { ok: true, data: payload.data, total: payload.total, limit: payload.limit, offset: payload.offset };
    setCached(cacheKey, response);
    return res.json(response);
  } catch (error) {
    console.error("Admin v2 listings error:", error);
    return jsonError(res, 500, "LISTINGS_FETCH_FAILED", "Kunde inte hämta listningar.");
  }
});

app.get("/api/admin/v2/listings/:productId", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["readonly", "ops", "admin"]);
    if (!access) return;

    const productId = sanitizeText(req.params?.productId, 80);
    if (!productId) {
      return jsonError(res, 400, "INVALID_PRODUCT_ID", "Ogiltigt produkt-id.");
    }
    const cacheKey = `admin:listing:${productId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    const result = await loadAdminListings({ productId });
    const listing = result.data[0] || null;
    if (!listing) {
      return jsonError(res, 404, "LISTING_NOT_FOUND", "Listningen hittades inte.");
    }
    const response = { ok: true, data: listing };
    setCached(cacheKey, response);
    return res.json(response);
  } catch (error) {
    console.error("Admin v2 listing fetch error:", error);
    return jsonError(res, 500, "LISTING_FETCH_FAILED", "Kunde inte hämta listningen.");
  }
});

app.post("/api/admin/v2/uploads/product-image", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["ops", "admin"]);
    if (!access) return;
    if (!requireServiceRoleKey(res)) return;

    const parsed = uploadListingImageSchema.safeParse(req.body || {});
    if (!parsed.success) {
      const details = formatZodValidationError(parsed.error);
      logStructured("warn", "admin.validation_failed", {
        endpoint: "/api/admin/v2/uploads/product-image",
        code: "VALIDATION_FAILED",
        details,
      });
      return jsonError(res, 400, "VALIDATION_FAILED", "Ogiltig payload för bilduppladdning.", details);
    }

    const { file_name: fileNameInput, mime_type: mimeTypeInput, data_base64: dataBase64, listing_slug: listingSlug, variant } = parsed.data;
    const mimeType = String(mimeTypeInput || "").toLowerCase();
    const extension = UPLOAD_IMAGE_MIME_TO_EXT[mimeType];
    if (!extension) {
      return jsonError(res, 400, "INVALID_FILE_TYPE", "Endast JPG, PNG, WEBP och AVIF stöds.");
    }

    const base64Payload = String(dataBase64 || "").replace(/^data:[^;]+;base64,/i, "");
    const binary = Buffer.from(base64Payload, "base64");
    if (!binary || binary.length === 0) {
      return jsonError(res, 400, "INVALID_IMAGE_DATA", "Kunde inte läsa bilddata.");
    }
    if (binary.length > MAX_UPLOAD_IMAGE_BYTES) {
      return jsonError(
        res,
        400,
        "IMAGE_TOO_LARGE",
        `Bilden är för stor. Maxstorlek är ${Math.round(MAX_UPLOAD_IMAGE_BYTES / (1024 * 1024))} MB.`
      );
    }

    const safeSlug = ensureImagePathSlug(listingSlug, variant === "used" ? "begagnad-variant" : "basprodukt");
    const fileBase = ensureImagePathSlug(fileNameInput || `image-${Date.now()}`, "bild");
    const objectPath = `listings/${safeSlug}/${Date.now()}-${fileBase}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(objectPath, binary, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      return jsonError(
        res,
        500,
        "IMAGE_UPLOAD_FAILED",
        uploadError.message || "Kunde inte ladda upp bilden. Kontrollera bucket-inställningen."
      );
    }

    const publicUrlData = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(objectPath);
    const url = sanitizeImageUrl(publicUrlData?.data?.publicUrl) || buildStoragePublicUrl(PRODUCT_IMAGE_BUCKET, objectPath);

    return res.status(201).json({
      ok: true,
      data: {
        url,
        bucket: PRODUCT_IMAGE_BUCKET,
        path: objectPath,
      },
    });
  } catch (error) {
    console.error("Admin listing image upload error:", error);
    return jsonError(res, 500, "IMAGE_UPLOAD_FAILED", "Kunde inte ladda upp bild.");
  }
});

app.post("/api/admin/v2/listings", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["ops", "admin"]);
    if (!access) return;
    const { user, role } = access;
    if (!requireServiceRoleKey(res)) return;

    const parsed = createListingRequestSchema.safeParse(req.body || {});
    if (!parsed.success) {
      const details = formatZodValidationError(parsed.error);
      logStructured("warn", "admin.validation_failed", {
        endpoint: "/api/admin/v2/listings",
        code: "VALIDATION_FAILED",
        details,
      });
      return jsonError(res, 400, "VALIDATION_FAILED", "Ogiltig payload för listning.", details);
    }

    const { listing, used_variant: usedVariant, fps } = parsed.data;
    const baseSlug = await ensureUniqueSlug(listing.slug, listing.name);
    const baseImageUrl = sanitizeImageUrl(listing.image_url) || null;
    const basePayload = {
      name: sanitizeText(listing.name, 120),
      slug: baseSlug,
      legacy_id: sanitizeText(listing.legacy_id, 80) || null,
      description: sanitizeText(listing.description, 1000) || null,
      image_url: baseImageUrl,
      price_cents: Math.max(0, Math.round(Number(listing.price_cents || 0))),
      currency: sanitizeText(listing.currency, 8).toUpperCase() || "SEK",
      cpu: sanitizeText(listing.cpu, 120),
      gpu: sanitizeText(listing.gpu, 120),
      ram: sanitizeText(listing.ram, 120),
      storage: sanitizeText(listing.storage, 120),
      storage_type: sanitizeText(listing.storage_type, 40),
      tier: sanitizeText(listing.tier, 40),
      motherboard: sanitizeText(listing.motherboard, 120) || null,
      psu: sanitizeText(listing.psu, 120) || null,
      case_name: sanitizeText(listing.case_name, 120) || null,
      cpu_cooler: sanitizeText(listing.cpu_cooler, 120) || null,
      os: sanitizeText(listing.os, 80) || null,
      rating: 4.5,
      reviews_count: 0,
      updated_at: new Date(),
    };

    const { data: createdBase, error: createBaseError } = await supabase
      .from("products")
      .insert([basePayload])
      .select(LISTING_SELECT_FIELDS)
      .single();
    if (createBaseError || !createdBase) {
      return jsonError(
        res,
        500,
        "LISTING_CREATE_FAILED",
        createBaseError?.message || "Kunde inte skapa baslistning."
      );
    }

    await persistListingState({
      req,
      user,
      productId: createdBase.id,
      listing: {
        ...listing,
        used_variant_enabled: usedVariant?.enabled ?? listing.used_variant_enabled ?? false,
      },
      fpsInput: fps,
      usedPartsInput: listing.used_parts,
      role,
    });
    let usedVariantProductId = null;
    if (usedVariant?.enabled && usedVariant.listing) {
      const usedSlug = await ensureUniqueSlug(usedVariant.listing.slug, usedVariant.listing.name);
      const usedImageUrl = sanitizeImageUrl(usedVariant.listing.image_url) || null;
      const usedPayload = {
        ...basePayload,
        name: sanitizeText(usedVariant.listing.name, 120),
        slug: usedSlug,
        legacy_id: sanitizeText(usedVariant.listing.legacy_id, 80) || null,
        description: sanitizeText(usedVariant.listing.description, 1000) || null,
        image_url: usedImageUrl,
        price_cents: Math.max(0, Math.round(Number(usedVariant.listing.price_cents || 0))),
        cpu: sanitizeText(usedVariant.listing.cpu, 120),
        gpu: sanitizeText(usedVariant.listing.gpu, 120),
        ram: sanitizeText(usedVariant.listing.ram, 120),
        storage: sanitizeText(usedVariant.listing.storage, 120),
        storage_type: sanitizeText(usedVariant.listing.storage_type, 40),
        tier: sanitizeText(usedVariant.listing.tier, 40),
        motherboard: sanitizeText(usedVariant.listing.motherboard, 120) || null,
        psu: sanitizeText(usedVariant.listing.psu, 120) || null,
        case_name: sanitizeText(usedVariant.listing.case_name, 120) || null,
        cpu_cooler: sanitizeText(usedVariant.listing.cpu_cooler, 120) || null,
        os: sanitizeText(usedVariant.listing.os, 80) || null,
        updated_at: new Date(),
      };

      const { data: createdUsed, error: createUsedError } = await supabase
        .from("products")
        .insert([usedPayload])
        .select(LISTING_SELECT_FIELDS)
        .single();
      if (createUsedError || !createdUsed) {
        return jsonError(
          res,
          500,
          "USED_VARIANT_CREATE_FAILED",
          createUsedError?.message || "Kunde inte skapa begagnad variant."
        );
      }

      await persistListingState({
        req,
        user,
        productId: createdUsed.id,
        listing: {
          ...usedVariant.listing,
          used_variant_enabled: true,
        },
        fpsInput: usedVariant.listing.fps,
        usedPartsInput: usedVariant.used_parts || usedVariant.listing.used_parts,
        role,
      });
      usedVariantProductId = createdUsed.id;

      await upsertListingGroupSettings({ baseId: createdBase.id, usedId: createdUsed.id });

      await supabase.from("ui_settings").upsert(
        [
          {
            key: `used_variant_link:${createdBase.id}`,
            value: { product_id: createdUsed.id },
            updated_at: new Date(),
          },
        ],
        { onConflict: "key" }
      );
    }

    await upsertListingGroupSettings({ baseId: createdBase.id, usedId: usedVariantProductId });

    invalidateProductCaches([createdBase.id, usedVariantProductId]);

    await logAdminAction(req, user, "listing_create_v2", "listing", createdBase.id, {
      role,
      used_variant_product_id: usedVariantProductId,
    });
    logStructured("info", "admin.listing_created", {
      actor_id: user?.id || null,
      product_id: createdBase.id,
      used_variant_product_id: usedVariantProductId,
      role,
    });

    const loaded = await loadAdminListings({ productId: createdBase.id });
    return res.status(201).json({
      ok: true,
      data: loaded.data[0] || null,
      used_variant_product_id: usedVariantProductId,
    });
  } catch (error) {
    console.error("Admin v2 listing create error:", error);
    return jsonError(res, 500, "LISTING_CREATE_FAILED", "Kunde inte skapa listning.");
  }
});

app.put("/api/admin/v2/listings/:productId", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["ops", "admin"]);
    if (!access) return;
    const { user, role } = access;
    if (!requireServiceRoleKey(res)) return;

    const productId = sanitizeText(req.params?.productId, 80);
    if (!productId) {
      return jsonError(res, 400, "INVALID_PRODUCT_ID", "Ogiltigt produkt-id.");
    }

    const parsed = updateListingRequestSchema.safeParse(req.body || {});
    if (!parsed.success) {
      const details = formatZodValidationError(parsed.error);
      logStructured("warn", "admin.validation_failed", {
        endpoint: "/api/admin/v2/listings/:productId",
        product_id: productId,
        code: "VALIDATION_FAILED",
        details,
      });
      return jsonError(res, 400, "VALIDATION_FAILED", "Ogiltig payload för listning.", details);
    }

    const { listing, fps, used_parts: usedParts, expected_updated_at: expectedUpdatedAt } = parsed.data;
    try {
      await persistListingState({
        req,
        user,
        role,
        productId,
        listing: { ...listing, expected_updated_at: expectedUpdatedAt || listing.expected_updated_at || null },
        fpsInput: fps,
        usedPartsInput: usedParts,
      });
    } catch (error) {
      if (error?.code === "LISTING_VERSION_CONFLICT") {
        return jsonError(
          res,
          409,
          "LISTING_VERSION_CONFLICT",
          "Listningen har ändrats av någon annan. Ladda om innan du sparar igen."
        );
      }
      throw error;
    }

    const loaded = await loadAdminListings({ productId });
    const data = loaded.data[0] || null;
    invalidateProductCaches([productId, data?.linked_product_id || null]);
    logStructured("info", "admin.listing_updated", {
      actor_id: user?.id || null,
      product_id: productId,
      linked_product_id: data?.linked_product_id || null,
      role,
    });
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Admin v2 listing update error:", error);
    return jsonError(res, 500, "LISTING_UPDATE_FAILED", "Kunde inte uppdatera listning.");
  }
});

app.get("/api/admin/v2/listings/:productId/fps", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["readonly", "ops", "admin"]);
    if (!access) return;
    const productId = sanitizeText(req.params?.productId, 80);
    if (!productId) {
      return jsonError(res, 400, "INVALID_PRODUCT_ID", "Ogiltigt produkt-id.");
    }
    const cacheKey = `admin:listing_fps:${productId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    const { data: listingRows } = await loadAdminListings({ productId });
    const listing = listingRows[0];
    if (!listing) {
      return jsonError(res, 404, "LISTING_NOT_FOUND", "Listningen hittades inte.");
    }
    const response = { ok: true, data: listing.fps };
    setCached(cacheKey, response);
    return res.json(response);
  } catch (error) {
    console.error("Admin v2 FPS fetch error:", error);
    return jsonError(res, 500, "FPS_FETCH_FAILED", "Kunde inte hämta FPS-variabler.");
  }
});

app.put("/api/admin/v2/listings/:productId/fps", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["ops", "admin"]);
    if (!access) return;
    const { user, role } = access;
    if (!requireServiceRoleKey(res)) return;

    const productId = sanitizeText(req.params?.productId, 80);
    if (!productId) {
      return jsonError(res, 400, "INVALID_PRODUCT_ID", "Ogiltigt produkt-id.");
    }

    const fps = sanitizeFpsSettings(req.body?.fps, EMPTY_FPS_SETTINGS);
    const expectedUpdatedAt = sanitizeText(req.body?.expected_updated_at, 80);
    if (expectedUpdatedAt) {
      const { data: product } = await supabase.from("products").select("updated_at").eq("id", productId).maybeSingle();
      if (product?.updated_at) {
        const expected = new Date(expectedUpdatedAt).getTime();
        const current = new Date(product.updated_at).getTime();
        if (Number.isFinite(expected) && Number.isFinite(current) && expected !== current) {
          return jsonError(
            res,
            409,
            "LISTING_VERSION_CONFLICT",
            "Listningen har ändrats av någon annan. Ladda om innan du sparar igen."
          );
        }
      }
    }

    const key = `fps:${productId}`;
    const { error } = await supabase.from("ui_settings").upsert(
      [{ key, value: fps, updated_at: new Date() }],
      { onConflict: "key" }
    );
    if (error) {
      return jsonError(res, 500, "FPS_SAVE_FAILED", error.message || "Kunde inte spara FPS-variabler.");
    }
    invalidateProductCaches([productId]);
    await logAdminAction(req, user, "listing_fps_update_v2", "listing", productId, { role });
    return res.json({ ok: true, data: fps });
  } catch (error) {
    console.error("Admin v2 FPS save error:", error);
    return jsonError(res, 500, "FPS_SAVE_FAILED", "Kunde inte spara FPS-variabler.");
  }
});

app.get("/api/admin/v2/orders", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["readonly", "ops", "admin"]);
    if (!access) return;

    const limit = Math.min(200, Math.max(1, Number(req.query?.limit || 100)));
    const offset = Math.max(0, Number(req.query?.offset || 0));
    const statusFilter = sanitizeText(req.query?.status, 40);
    const term = sanitizeText(req.query?.q, 80);

    let query = supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          product:product_id (name, price_cents, cpu, gpu, ram, storage)
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }
    if (term) {
      const escaped = term.replace(/[%]/g, "");
      query = query.or(
        `customer_name.ilike.%${escaped}%,customer_email.ilike.%${escaped}%,customer_phone.ilike.%${escaped}%,order_number.ilike.%${escaped}%`
      );
    }

    const { data, error, count } = await query;
    if (error) {
      return jsonError(res, 500, "ORDERS_FETCH_FAILED", error.message || "Kunde inte hämta beställningar.");
    }
    return res.json({ ok: true, data: data || [], total: count || 0, limit, offset });
  } catch (error) {
    console.error("Admin v2 orders error:", error);
    return jsonError(res, 500, "ORDERS_FETCH_FAILED", "Kunde inte hämta beställningar.");
  }
});

app.patch("/api/admin/v2/orders/:orderId/byggstatus", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["ops", "admin"]);
    if (!access) return;
    const { user, role } = access;
    if (!requireServiceRoleKey(res)) return;

    const orderId = sanitizeText(req.params?.orderId, 64);
    const nextStatus = sanitizeText(req.body?.status, 32);
    const expectedUpdatedAt = sanitizeText(req.body?.expected_updated_at, 80);
    if (!orderId || !STATUS_OPTIONS.has(nextStatus)) {
      return jsonError(res, 400, "INVALID_STATUS", "Ogiltig byggstatus.");
    }

    const { data: currentOrder, error: currentOrderError } = await supabase
      .from("orders")
      .select("id, updated_at")
      .eq("id", orderId)
      .maybeSingle();
    if (currentOrderError || !currentOrder) {
      return jsonError(res, 404, "ORDER_NOT_FOUND", "Beställningen hittades inte.");
    }
    if (expectedUpdatedAt && currentOrder.updated_at) {
      const expected = new Date(expectedUpdatedAt).getTime();
      const current = new Date(currentOrder.updated_at).getTime();
      if (Number.isFinite(expected) && Number.isFinite(current) && expected !== current) {
        return jsonError(
          res,
          409,
          "ORDER_VERSION_CONFLICT",
          "Beställningen har ändrats av någon annan. Ladda om innan du sparar igen."
        );
      }
    }

    const statusMessage = nextStatus === "ready" ? READY_MESSAGE : STATUS_LABELS[nextStatus] || null;
    const { data, error } = await supabase
      .from("orders")
      .update({ status: nextStatus, status_message: statusMessage, updated_at: new Date() })
      .eq("id", orderId)
      .select()
      .single();
    if (error || !data) {
      return jsonError(res, 500, "ORDER_STATUS_UPDATE_FAILED", error?.message || "Kunde inte uppdatera byggstatus.");
    }

    await logAdminAction(req, user, "order_status_update_v2", "order", orderId, {
      status: nextStatus,
      role,
    });
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Admin v2 byggstatus error:", error);
    return jsonError(res, 500, "ORDER_STATUS_UPDATE_FAILED", "Kunde inte uppdatera byggstatus.");
  }
});

app.patch("/api/admin/v2/orders/:orderId/checklista", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["ops", "admin"]);
    if (!access) return;
    const { user, role } = access;
    if (!requireServiceRoleKey(res)) return;

    const orderId = sanitizeText(req.params?.orderId, 64);
    const checklist = Array.isArray(req.body?.build_checklist) ? req.body.build_checklist : null;
    const expectedUpdatedAt = sanitizeText(req.body?.expected_updated_at, 80);
    if (!orderId || !checklist) {
      return jsonError(res, 400, "INVALID_CHECKLIST", "Ogiltig checklista.");
    }
    if (expectedUpdatedAt) {
      const { data: currentOrder } = await supabase
        .from("orders")
        .select("updated_at")
        .eq("id", orderId)
        .maybeSingle();
      if (currentOrder?.updated_at) {
        const expected = new Date(expectedUpdatedAt).getTime();
        const current = new Date(currentOrder.updated_at).getTime();
        if (Number.isFinite(expected) && Number.isFinite(current) && expected !== current) {
          return jsonError(
            res,
            409,
            "ORDER_VERSION_CONFLICT",
            "Beställningen har ändrats av någon annan. Ladda om innan du sparar igen."
          );
        }
      }
    }
    const sanitizedChecklist = checklist.map((entry) => ({
      id: sanitizeText(entry?.id, 40),
      label: sanitizeText(entry?.label, 80),
      done: Boolean(entry?.done),
    }));

    const { data, error } = await supabase
      .from("orders")
      .update({ build_checklist: sanitizedChecklist, updated_at: new Date() })
      .eq("id", orderId)
      .select("id, build_checklist, updated_at")
      .single();
    if (error || !data) {
      return jsonError(
        res,
        500,
        "ORDER_CHECKLIST_UPDATE_FAILED",
        error?.message || "Kunde inte uppdatera checklista."
      );
    }

    await logAdminAction(req, user, "order_checklist_update_v2", "order", orderId, { role });
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Admin v2 checklist error:", error);
    return jsonError(res, 500, "ORDER_CHECKLIST_UPDATE_FAILED", "Kunde inte uppdatera checklista.");
  }
});

app.get("/api/admin/me", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    const role = getAdminRole(user);
    return res.json({
      id: user.id,
      email: user.email,
      isAdmin: canAccessAdminPortal(user),
      role: role || null,
    });
  } catch (error) {
    console.error("Admin me error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/orders", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          product:product_id (name, price_cents, cpu, gpu, ram, storage)
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "Failed to fetch orders" });
    }

    res.json(data || []);
  } catch (error) {
    console.error("Admin orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/orders.csv", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        created_at,
        status,
        total_cents,
        currency,
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        customer_postal_code,
        customer_city,
        order_items (
          quantity,
          unit_price_cents,
          product:product_id (name)
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "Failed to fetch orders" });
    }

    const escapeCsv = (value) => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    };

    const rows = [
      [
        "Ordernummer",
        "Datum",
        "Status",
        "Total (SEK)",
        "Namn",
        "E-post",
        "Telefon",
        "Adress",
        "Postnummer",
        "Postort",
        "Produkter",
      ],
      ...(data || []).map((order) => {
        const items = (order.order_items || [])
          .map((item) => `${item.product?.name || "Produkt"} x${item.quantity}`)
          .join("; ");
        return [
          formatOrderNumber(order),
          order.created_at,
          order.status,
          ((order.total_cents || 0) / 100).toFixed(2),
          order.customer_name,
          order.customer_email,
          order.customer_phone,
          order.customer_address,
          order.customer_postal_code,
          order.customer_city,
          items,
        ].map(escapeCsv).join(",");
      }),
    ];

    const csv = rows.join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
    res.send(csv);
  } catch (error) {
    console.error("Export CSV error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/logs", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const limit = Math.min(200, Math.max(1, Number(req.query?.limit || 50)));
    const offset = Math.max(0, Number(req.query?.offset || 0));
    const { data, error, count } = await supabase
      .from("admin_audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: "Failed to fetch logs" });
    }

    res.json({ data: data || [], total: count || 0, limit, offset });
  } catch (error) {
    console.error("Admin logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/inventory", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { data, error } = await supabase
      .from("inventory")
      .select("*, product:product_id (name, price_cents)")
      .order("updated_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "Failed to fetch inventory" });
    }

    res.json(data || []);
  } catch (error) {
    console.error("Admin inventory error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/inventory", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const productId = sanitizeText(req.body?.productId, 64);
    const quantity = Number(req.body?.quantity_in_stock ?? 0);
    const isPreorder = Boolean(req.body?.is_preorder);
    const rawEtaDays = req.body?.eta_days;
    const etaRange =
      typeof rawEtaDays === "string" && /^\d+\s*-\s*\d+$/.test(rawEtaDays.trim())
        ? rawEtaDays.trim().replace(/\s+/g, "")
        : null;
    const etaDaysNumber =
      rawEtaDays === null || rawEtaDays === undefined ? null : Number(rawEtaDays);
    const etaNoteInput = sanitizeText(req.body?.eta_note, 200);
    const etaNote = etaNoteInput || (etaRange ? `ETA ${etaRange} dagar` : "");
    const priceCents = Number(req.body?.price_cents);

    if (!productId) {
      return res.status(400).json({ error: "Missing productId" });
    }

    const payload = {
      product_id: productId,
      quantity_in_stock: Number.isFinite(quantity) ? Math.max(0, quantity) : 0,
      is_preorder: isPreorder,
      eta_days: etaRange ? null : Number.isFinite(etaDaysNumber) ? Math.max(0, etaDaysNumber) : null,
      eta_note: etaNote || null,
      updated_at: new Date(),
    };

    const { data, error } = await supabase
      .from("inventory")
      .upsert([payload], { onConflict: "product_id" })
      .select()
      .single();

    if (error || !data) {
      console.error("Inventory upsert failed:", error);
      return res.status(500).json({ error: error?.message || "Failed to update inventory" });
    }

    if (Number.isFinite(priceCents)) {
      const pricePayload = { price_cents: Math.max(0, Math.round(priceCents)) };
      const { error: priceError } = await supabase
        .from("products")
        .update(pricePayload)
        .eq("id", productId);
      if (priceError) {
        console.error("Inventory price update failed:", priceError);
        return res.status(500).json({ error: priceError?.message || "Failed to update price" });
      }
    }

    await logAdminAction(req, user, "inventory_update", "inventory", productId, {
      quantity_in_stock: payload.quantity_in_stock,
      is_preorder: payload.is_preorder,
      eta_days: etaRange || payload.eta_days,
      eta_note: payload.eta_note,
      price_cents: Number.isFinite(priceCents) ? Math.max(0, Math.round(priceCents)) : null,
    });

    res.json(data);
  } catch (error) {
    console.error("Inventory update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/api/admin/products", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, legacy_id, description, price_cents, currency, cpu, gpu, ram, storage, storage_type, tier, motherboard, psu, case_name, cpu_cooler, os, rating, reviews_count"
      )
      .order("name", { ascending: true });

    if (error) {
      return res.status(500).json({ error: "Failed to fetch products" });
    }

    res.json(data || []);
  } catch (error) {
    console.error("Admin products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/products", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (!requireServiceRoleKey(res)) {
      return;
    }

    const name = sanitizeText(req.body?.name, 120);
    const description = sanitizeText(req.body?.description, 1000);
    const cpu = sanitizeText(req.body?.cpu, 120);
    const gpu = sanitizeText(req.body?.gpu, 120);
    const ram = sanitizeText(req.body?.ram, 120);
    const storage = sanitizeText(req.body?.storage, 120);
    const storageType = sanitizeText(req.body?.storage_type, 40);
    const tier = sanitizeText(req.body?.tier, 40);
    const motherboard = sanitizeText(req.body?.motherboard, 120);
    const psu = sanitizeText(req.body?.psu, 120);
    const caseName = sanitizeText(req.body?.case_name, 120);
    const cpuCooler = sanitizeText(req.body?.cpu_cooler, 120);
    const os = sanitizeText(req.body?.os, 80);
    const legacyId = sanitizeText(req.body?.legacy_id, 80);
    const currency = sanitizeText(req.body?.currency, 8).toUpperCase() || "SEK";
    const priceCents = Math.max(0, Math.round(Number(req.body?.price_cents ?? 0)));
    const rating = Number.isFinite(Number(req.body?.rating)) ? Number(req.body.rating) : 4.5;
    const reviewsCount = Number.isFinite(Number(req.body?.reviews_count))
      ? Math.max(0, Math.round(Number(req.body.reviews_count)))
      : 0;

    if (!name) {
      return res.status(400).json({ error: "Missing product name" });
    }
    if (!cpu || !gpu || !ram || !storage || !storageType || !tier) {
      return res.status(400).json({ error: "Missing required product fields" });
    }

    const slugify = (value) =>
      String(value || "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
    const baseSlug = slugify(req.body?.slug || name) || `produkt-${Date.now()}`;
    let slug = baseSlug;
    for (let i = 0; i < 12; i += 1) {
      const { data: existing, error: slugError } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (slugError) {
        return res.status(500).json({ error: "Failed to validate slug uniqueness" });
      }
      if (!existing) break;
      slug = `${baseSlug}-${i + 2}`.slice(0, 80);
    }

    const payload = {
      name,
      slug,
      legacy_id: legacyId || null,
      description: description || null,
      price_cents: priceCents,
      currency,
      cpu,
      gpu,
      ram,
      storage,
      storage_type: storageType,
      tier,
      motherboard: motherboard || null,
      psu: psu || null,
      case_name: caseName || null,
      cpu_cooler: cpuCooler || null,
      os: os || null,
      rating: Math.max(0, Math.min(5, rating)),
      reviews_count: reviewsCount,
      updated_at: new Date(),
    };

    const { data, error } = await supabase.from("products").insert([payload]).select().single();

    if (error || !data) {
      console.error("Product create failed:", error);
      return res.status(500).json({ error: error?.message || "Failed to create product" });
    }

    await logAdminAction(req, user, "product_create", "product", data.id, {
      name,
      slug,
      tier,
      price_cents: priceCents,
    });

    return res.status(201).json(data);
  } catch (error) {
    console.error("Admin product create error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/products/:productId", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { productId } = req.params;
    const name = sanitizeText(req.body?.name, 120);
    const slug = sanitizeText(req.body?.slug, 80);
    const legacyId = sanitizeText(req.body?.legacy_id, 80);
    const description = sanitizeText(req.body?.description, 1000);
    const cpu = sanitizeText(req.body?.cpu, 120);
    const gpu = sanitizeText(req.body?.gpu, 120);
    const ram = sanitizeText(req.body?.ram, 120);
    const storage = sanitizeText(req.body?.storage, 120);
    const storageType = sanitizeText(req.body?.storage_type, 40);
    const tier = sanitizeText(req.body?.tier, 40);
    const motherboard = sanitizeText(req.body?.motherboard, 120);
    const psu = sanitizeText(req.body?.psu, 120);
    const caseName = sanitizeText(req.body?.case_name, 120);
    const cpuCooler = sanitizeText(req.body?.cpu_cooler, 120);
    const os = sanitizeText(req.body?.os, 80);

    if (!productId) {
      return res.status(400).json({ error: "Missing productId" });
    }
    if (!name) {
      return res.status(400).json({ error: "Missing product name" });
    }

    const payload = {
      name,
      slug: slug || undefined,
      legacy_id: legacyId || null,
      description: description || null,
      cpu,
      gpu,
      ram,
      storage,
      storage_type: storageType || null,
      tier,
      motherboard: motherboard || null,
      psu: psu || null,
      case_name: caseName || null,
      cpu_cooler: cpuCooler || null,
      os: os || null,
      updated_at: new Date(),
    };
    if (!slug) {
      delete payload.slug;
    }

    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", productId)
      .select()
      .single();

    if (error || !data) {
      console.error("Product update failed:", error);
      return res.status(500).json({ error: error?.message || "Failed to update product" });
    }

    await logAdminAction(req, user, "product_update", "product", productId, {
      name,
      slug: slug || null,
      legacy_id: legacyId || null,
      cpu,
      gpu,
      ram,
      storage,
      storage_type: storageType || null,
      tier,
      motherboard: motherboard || null,
      psu: psu || null,
      case_name: caseName || null,
      cpu_cooler: cpuCooler || null,
      os: os || null,
    });

    invalidateProductCaches([productId]);
    res.json(data);
  } catch (error) {
    console.error("Admin product update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/ui-settings", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { data, error } = await supabase
      .from("ui_settings")
      .select("key, value")
      .eq("key", "fps")
      .single();

    if (error) {
      return res.json({ fps: DEFAULT_FPS_SETTINGS });
    }

    res.json({ fps: data?.value || DEFAULT_FPS_SETTINGS });
  } catch (error) {
    console.error("Admin UI settings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/ui-settings", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const fps = req.body?.fps || {};
    const dlssMultiplier = parseMultiplier(fps.dlssMultiplier, DEFAULT_FPS_SETTINGS.dlssMultiplier);
    const frameGenMultiplier = parseMultiplier(fps.frameGenMultiplier, DEFAULT_FPS_SETTINGS.frameGenMultiplier);

    const payload = {
      key: "fps",
      value: { dlssMultiplier, frameGenMultiplier },
      updated_at: new Date(),
    };

    const { data, error } = await supabase
      .from("ui_settings")
      .upsert([payload], { onConflict: "key" })
      .select()
      .single();

    if (error || !data) {
      console.error("UI settings update failed:", error);
      return res.status(500).json({ error: error?.message || "Failed to update settings" });
    }

    await logAdminAction(req, user, "ui_settings_update", "ui_settings", "fps", {
      dlssMultiplier,
      frameGenMultiplier,
    });

    res.json({ fps: data.value });
  } catch (error) {
    console.error("Admin UI settings update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const getDefaultFpsSettingsForProduct = async (productId) => {
  try {
    const { data } = await supabase
      .from("products")
      .select("name, slug, legacy_id")
      .eq("id", productId)
      .maybeSingle();
    const productName = String(data?.name || data?.slug || data?.legacy_id || "").trim();
    const reported = buildReportedFpsSettingsForProductName(productName);
    return reported || buildDefaultFpsSettings();
  } catch (error) {
    console.error("Default FPS profile lookup failed:", error);
    return buildDefaultFpsSettings();
  }
};

app.get("/api/admin/products/:productId/fps-settings", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const productId = sanitizeText(req.params?.productId, 80);
    if (!productId) {
      return res.status(400).json({ error: "Missing product id" });
    }

    const key = `fps:${productId}`;
    const { data, error } = await supabase
      .from("ui_settings")
      .select("key, value")
      .eq("key", key)
      .single();

    const fallback = EMPTY_FPS_SETTINGS;
    if (error || !data?.value) {
      return res.json({ fps: fallback });
    }

    res.json({ fps: sanitizeFpsSettings(data?.value, fallback) });
  } catch (error) {
    console.error("Admin FPS settings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/products/:productId/fps-settings", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (!requireServiceRoleKey(res)) {
      return;
    }

    const productId = sanitizeText(req.params?.productId, 80);
    if (!productId) {
      return res.status(400).json({ error: "Missing product id" });
    }

    const fallback = EMPTY_FPS_SETTINGS;
    const fps = sanitizeFpsSettings(req.body?.fps, fallback);
    const key = `fps:${productId}`;
    const payload = { key, value: fps, updated_at: new Date() };

    const { data, error } = await supabase
      .from("ui_settings")
      .upsert([payload], { onConflict: "key" })
      .select()
      .single();

    if (error || !data) {
      console.error("FPS settings update failed:", error);
      return res.status(500).json({ error: error?.message || "Failed to update FPS settings" });
    }

    await logAdminAction(req, user, "product_fps_update", "ui_settings", key, {
      product_id: productId,
    });

    invalidateProductCaches([productId]);
    res.json({ fps: data.value });
  } catch (error) {
    console.error("Admin FPS settings update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/products/:productId/used-variant", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const productId = sanitizeText(req.params?.productId, 80);
    if (!productId) {
      return res.status(400).json({ error: "Missing product id" });
    }

    const key = `used_variant:${productId}`;
    const { data, error } = await supabase
      .from("ui_settings")
      .select("key, value")
      .eq("key", key)
      .single();

    if (error) {
      return res.json({ enabled: true });
    }

    return res.json({ enabled: parseUsedVariantSetting(data?.value, true) });
  } catch (error) {
    console.error("Admin used variant fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/products/:productId/used-variant", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (!requireServiceRoleKey(res)) {
      return;
    }

    const productId = sanitizeText(req.params?.productId, 80);
    if (!productId) {
      return res.status(400).json({ error: "Missing product id" });
    }

    const enabled = Boolean(req.body?.enabled);
    const key = `used_variant:${productId}`;
    const payload = { key, value: { enabled }, updated_at: new Date() };

    const { data, error } = await supabase
      .from("ui_settings")
      .upsert([payload], { onConflict: "key" })
      .select()
      .single();

    if (error || !data) {
      console.error("Used variant update failed:", error);
      return res.status(500).json({ error: error?.message || "Failed to update used variant setting" });
    }

    await logAdminAction(req, user, "product_used_variant_update", "ui_settings", key, {
      product_id: productId,
      enabled,
    });

    invalidateProductCaches([productId]);
    return res.json({ enabled: parseUsedVariantSetting(data?.value, enabled) });
  } catch (error) {
    console.error("Admin used variant update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/products/:productId/used-parts", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const productId = sanitizeText(req.params?.productId, 80);
    if (!productId) {
      return res.status(400).json({ error: "Missing product id" });
    }

    const key = `used_parts:${productId}`;
    const { data, error } = await supabase
      .from("ui_settings")
      .select("key, value")
      .eq("key", key)
      .single();

    if (error) {
      return res.json({ used_parts: parseUsedPartsSetting(null, null) });
    }

    return res.json({ used_parts: parseUsedPartsSetting(data?.value, null) });
  } catch (error) {
    console.error("Admin used-parts fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/products/:productId/used-parts", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (!requireServiceRoleKey(res)) {
      return;
    }

    const productId = sanitizeText(req.params?.productId, 80);
    if (!productId) {
      return res.status(400).json({ error: "Missing product id" });
    }

    const usedParts = parseUsedPartsSetting(req.body?.used_parts, null);
    const key = `used_parts:${productId}`;
    const payload = { key, value: usedParts, updated_at: new Date() };

    const { data, error } = await supabase
      .from("ui_settings")
      .upsert([payload], { onConflict: "key" })
      .select()
      .single();

    if (error || !data) {
      console.error("Used-parts update failed:", error);
      return res.status(500).json({ error: error?.message || "Failed to update used-parts setting" });
    }

    await logAdminAction(req, user, "product_used_parts_update", "ui_settings", key, {
      product_id: productId,
      used_parts: usedParts,
    });

    invalidateProductCaches([productId]);
    return res.json({ used_parts: parseUsedPartsSetting(data?.value, usedParts) });
  } catch (error) {
    console.error("Admin used-parts update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/fps-settings/:productId", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const productId = sanitizeText(req.params?.productId, 80);
    if (!productId) {
      return res.status(400).json({ error: "Missing product id" });
    }
    const cacheKey = `public:fps:${productId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    const key = `fps:${productId}`;
    const { data, error } = await supabase
      .from("ui_settings")
      .select("key, value")
      .eq("key", key)
      .single();

    const fallback = EMPTY_FPS_SETTINGS;
    if (error || !data?.value) {
      const response = { fps: fallback };
      setCached(cacheKey, response);
      return res.json(response);
    }

    const response = { fps: sanitizeFpsSettings(data?.value, fallback) };
    setCached(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error("FPS settings fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/used-variant/:productId", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const productId = sanitizeText(req.params?.productId, 80);
    if (!productId) {
      return res.status(400).json({ error: "Missing product id" });
    }
    const cacheKey = `public:used_variant:${productId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const key = `used_variant:${productId}`;
    const { data, error } = await supabase
      .from("ui_settings")
      .select("key, value")
      .eq("key", key)
      .single();

    if (error) {
      const response = { enabled: true };
      setCached(cacheKey, response);
      return res.json(response);
    }

    const response = { enabled: parseUsedVariantSetting(data?.value, true) };
    setCached(cacheKey, response);
    return res.json(response);
  } catch (error) {
    console.error("Used variant fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/used-parts/:productId", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const productId = sanitizeText(req.params?.productId, 80);
    if (!productId) {
      return res.status(400).json({ error: "Missing product id" });
    }
    const cacheKey = `public:used_parts:${productId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const key = `used_parts:${productId}`;
    const { data, error } = await supabase
      .from("ui_settings")
      .select("key, value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error?.message || "Failed to read used-parts setting" });
    }

    if (!data?.value) {
      const response = { configured: false, used_parts: null };
      setCached(cacheKey, response);
      return res.json(response);
    }

    const response = { configured: true, used_parts: parseUsedPartsSetting(data?.value, null) };
    setCached(cacheKey, response);
    return res.json(response);
  } catch (error) {
    console.error("Used-parts fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/product-images/:productId", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const productId = sanitizeText(req.params?.productId, 80);
    if (!productId) {
      return res.status(400).json({ error: "Missing product id" });
    }
    const cacheKey = `public:product_images:${productId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const [productResponse, settingsResponse] = await Promise.all([
      supabase.from("products").select("id, image_url").eq("id", productId).maybeSingle(),
      supabase.from("ui_settings").select("key, value").eq("key", `product_images:${productId}`).maybeSingle(),
    ]);

    if (productResponse.error) {
      return res.status(500).json({ error: productResponse.error.message || "Failed to read product image." });
    }
    if (settingsResponse.error) {
      return res.status(500).json({ error: settingsResponse.error.message || "Failed to read product images." });
    }

    const primary = sanitizeImageUrl(productResponse.data?.image_url);
    const images = parseProductImagesSetting(settingsResponse.data?.value, primary);

    const response = {
      product_id: productId,
      configured: Boolean(settingsResponse.data?.value),
      image_url: primary || null,
      images,
    };
    setCached(cacheKey, response);
    return res.json(response);
  } catch (error) {
    console.error("Product images fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/orders/by-session/:sessionId", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const sessionId = sanitizeText(req.params?.sessionId, 120);
    if (!sessionId) {
      return res.status(400).json({ error: "Missing session id" });
    }
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }

    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, status")
      .eq("stripe_session_id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      order_number: data.order_number ?? null,
      status: data.status ?? null,
      fallback: data.id ? data.id.slice(0, 8) : null,
    });
  } catch (error) {
    console.error("Order lookup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/orders/:orderId/cancel-request", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const orderId = sanitizeText(req.params?.orderId, 64);
    if (!orderId) {
      return res.status(400).json({ error: "Missing order id" });
    }
    if (req?.headers?.origin && !FRONTEND_URLS.includes(req.headers.origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }

    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        created_at,
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        customer_postal_code,
        customer_city,
        total_cents,
        order_items (
          quantity,
          unit_price_cents,
          product:product_id (name)
        )
      `
      )
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const status = order.status || "received";
    if (!["received", "ordering", "pending"].includes(status)) {
      return res.status(400).json({ error: "Ordern är redan i produktion och kan inte avbrytas." });
    }

    if (!supportMailer) {
      return res.status(503).json({ error: "Support email service not configured" });
    }

    const orderNumber = formatOrderNumber(order);
    const orderDate = order.created_at
      ? new Date(order.created_at).toLocaleDateString("sv-SE")
      : "Okänt datum";
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const itemLines = items
      .map((item) => {
        const name = item.product?.name || "Produkt";
        const quantity = Number(item.quantity || 1);
        return `<li>${escapeHtml(name)} x${quantity}</li>`;
      })
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
        <h2>Avbruten order</h2>
        <p>En kund har begärt att avbryta sin order.</p>
        <p><strong>Ordernummer:</strong> ${escapeHtml(String(orderNumber))}</p>
        <p><strong>Datum:</strong> ${escapeHtml(orderDate)}</p>
        <p><strong>Namn:</strong> ${escapeHtml(order.customer_name || "")}</p>
        <p><strong>E-post:</strong> ${escapeHtml(order.customer_email || user.email || "")}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(order.customer_phone || "-")}</p>
        <p><strong>Adress:</strong> ${escapeHtml(order.customer_address || "-")}</p>
        <p><strong>Postnummer / Ort:</strong> ${escapeHtml(
          `${order.customer_postal_code || ""} ${order.customer_city || ""}`.trim() || "-"
        )}</p>
        <p><strong>Total:</strong> ${formatCurrency((order.total_cents || 0) / 100)}</p>
        ${itemLines ? `<p><strong>Produkter:</strong></p><ul>${itemLines}</ul>` : ""}
      </div>
    `;

    await sendSupportEmail({
      to: ORDER_CANCEL_TO,
      subject: `Avbruten order #${orderNumber}`,
      html,
      replyTo: order.customer_email || user.email || undefined,
    });

    await supabase
      .from("orders")
      .update({ status: "cancel_requested", updated_at: new Date() })
      .eq("id", order.id);

    res.json({ ok: true });
  } catch (error) {
    console.error("Order cancel request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/account-delete/request", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    if (req?.headers?.origin && !FRONTEND_URLS.includes(req.headers.origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!user.email) {
      return res.status(400).json({ error: "Missing user email" });
    }

    const code = generateVerificationCode();
    const codeHash = hashVerificationCode(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const { error } = await supabase.from("account_delete_codes").insert([
      {
        user_id: user.id,
        code_hash: codeHash,
        expires_at: expiresAt,
      },
    ]);

    if (error) {
      console.error("Account delete code insert error:", error);
      return res.status(500).json({ error: "Kunde inte skapa verifieringskod" });
    }

    const html = `
      <div style="margin:0;padding:0;background:#0f1824;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding:32px 16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 32px;background:linear-gradient(135deg,#0f1824 0%,#1c2c3f 100%);">
                    <img src="https://datorhuset.site/Datorhuset.png" alt="DatorHuset" width="140" style="display:block;margin-bottom:16px;" />
                    <p style="margin:0;color:#facc15;letter-spacing:6px;font-size:11px;text-transform:uppercase;">Kontosäkerhet</p>
                    <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;">Bekräfta borttagning av konto</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px;color:#111827;">
                    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Du har begärt att ta bort ditt DatorHuset-konto. Använd koden nedan för att bekräfta.</p>
                    <div style="text-align:center;margin:24px 0;">
                      <div style="display:inline-block;background:#facc15;color:#111827;font-weight:700;padding:12px 20px;border-radius:10px;letter-spacing:4px;font-size:20px;">
                        ${code}
                      </div>
                    </div>
                    <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">Koden är giltig i 15 minuter.</p>
                    <p style="margin:0;font-size:13px;color:#6b7280;">Om du inte begärde detta kan du ignorera mejlet.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
                    DatorHuset - Datorer byggda för spel, skapande och vardag.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "Bekräfta borttagning av konto",
      html,
    });

    res.json({ ok: true, expires_in_minutes: 15 });
  } catch (error) {
    console.error("Account delete request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/account-delete/confirm", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    if (req?.headers?.origin && !FRONTEND_URLS.includes(req.headers.origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }

    const code = sanitizeText(req.body?.code, 12).replace(/\s+/g, "");
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Ogiltig verifieringskod" });
    }

    const codeHash = hashVerificationCode(code);
    const { data, error } = await supabase
      .from("account_delete_codes")
      .select("id, code_hash, expires_at, used_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return res.status(400).json({ error: "Ingen verifieringskod hittades" });
    }

    if (data.used_at) {
      return res.status(400).json({ error: "Verifieringskoden har redan använts" });
    }

    if (new Date(data.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: "Verifieringskoden har gått ut" });
    }

    if (data.code_hash !== codeHash) {
      return res.status(400).json({ error: "Fel verifieringskod" });
    }

    await supabase
      .from("account_delete_codes")
      .update({ used_at: new Date() })
      .eq("id", data.id);

    await supabase.from("cart_items").delete().eq("user_id", user.id);
    await supabase.from("user_addresses").delete().eq("user_id", user.id);
    await supabase
      .from("orders")
      .update({
        user_id: null,
        customer_email: null,
        customer_name: null,
        customer_phone: null,
        customer_address: null,
        customer_postal_code: null,
        customer_city: null,
        shipping_address_id: null,
      })
      .eq("user_id", user.id);

    await supabase.auth.admin.deleteUser(user.id);

    res.json({ ok: true });
  } catch (error) {
    console.error("Account delete confirm error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/orders/:orderId/status", adminLimiter, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { orderId } = req.params;
    const nextStatus = sanitizeText(req.body?.status, 32);
    if (!STATUS_OPTIONS.has(nextStatus)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const { data: existing } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    const { data, error } = await supabase
      .from("orders")
      .update({ status: nextStatus, updated_at: new Date() })
      .eq("id", orderId)
      .select(
        `
        *,
        order_items (
          quantity,
          unit_price_cents,
          product:product_id (name)
        )
      `
      )
      .single();

    if (error || !data) {
      return res.status(500).json({ error: "Failed to update order" });
    }

    try {
      await supabase.from("admin_audit_logs").insert([
        {
          admin_user_id: user.id,
          order_id: orderId,
          action: "order_status_update",
          previous_status: existing?.status || null,
          new_status: nextStatus,
          ip_address: getRequestIp(req),
          user_agent: req.headers["user-agent"] || null,
        },
      ]);
    } catch (logError) {
      console.warn("Admin audit log failed:", logError);
    }

    res.json(data);

    if (data?.customer_email) {
      const statusLabel = STATUS_LABELS[nextStatus] || STATUS_LABELS.received;
      const statusNote =
        nextStatus === "ready" || nextStatus === "finished" || nextStatus === "completed"
          ? READY_MESSAGE
          : statusLabel;
      await sendEmail({
        to: data.customer_email,
        subject: `Uppdatering om din order hos DatorHuset`,
        html: buildOrderEmailHtml({
          headline: "Uppdatering om din order",
          intro: `Hej ${data.customer_name || ""}! Vi har uppdaterat statusen på din order.`,
          order: data,
          items: (data.order_items || []).map((item) => ({
            name: item.product?.name || "Produkt",
            quantity: item.quantity,
            total: ((item.unit_price_cents || 0) * item.quantity) / 100,
          })),
          statusNote,
        }),
      });
    }
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/orders/:orderId/checklist", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { orderId } = req.params;
    const checklist = Array.isArray(req.body?.build_checklist) ? req.body.build_checklist : null;
    if (!checklist) {
      return res.status(400).json({ error: "Invalid checklist" });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ build_checklist: checklist, updated_at: new Date() })
      .eq("id", orderId)
      .select()
      .single();

    if (error || !data) {
      return res.status(500).json({ error: "Failed to update checklist" });
    }

    await logAdminAction(req, user, "order_checklist_update", "order", orderId, {
      build_checklist: checklist,
    });

    res.json(data);
  } catch (error) {
    console.error("Checklist update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/webhook
 */
app.post("/api/webhook", async (req, res) => {
  if (!stripe || !stripeWebhookSecret) {
    return res.status(503).json({ error: "Stripe webhook not configured." });
  }
  if (!isAllowedStripeIp(req)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) return res.status(400).json({ error: "No stripe-signature header" });

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      stripeWebhookSecret
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return res.status(400).json({ error: "Webhook signature failed" });
  }

  console.log("[webhook] received", event.id, event.type);

  if (STRIPE_EXPECT_LIVEMODE !== null && event.livemode !== STRIPE_EXPECT_LIVEMODE) {
    console.warn("Webhook livemode mismatch", { eventId: event.id, livemode: event.livemode });
    return res.status(400).json({ error: "Invalid livemode" });
  }

  const { duplicate } = await recordWebhookEvent(event);
  if (duplicate) {
    return res.json({ received: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object; // JS only
    try {
      await handleSuccessfulPayment(session);
      if (event.id && supabase) {
        await supabase
          .from("stripe_webhook_events")
          .update({ processed_at: new Date() })
          .eq("event_id", event.id);
      }
      console.log("[webhook] handled checkout.session.completed", session.id);
    } catch (error) {
      console.error("Error handling successful payment:", error);
      return res.status(500).json({ error: "Failed to process payment" });
    }
  }

  res.json({ received: true });
});

app.post("/api/metrics", rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getRateLimitKey(req, "metrics"),
}), (req, res) => {
  const name = sanitizeText(req.body?.name, 16);
  const id = sanitizeText(req.body?.id, 64);
  const pathValue = sanitizeText(req.body?.path, 160);
  const rating = sanitizeText(req.body?.rating, 16);
  const value = Number(req.body?.value);

  if (!name || !id || !pathValue || !Number.isFinite(value)) {
    return res.status(400).json({ error: "Invalid metric payload" });
  }

  console.log(
    `[web-vitals] ${name}=${Math.round(value * 100) / 100} rating=${rating || "n/a"} path=${pathValue} id=${id}`,
  );
  return res.status(204).send();
});

app.post("/api/analytics", rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getRateLimitKey(req, "analytics"),
}), (req, res) => {
  const eventName = sanitizeText(req.body?.event, 64);
  const pathValue = sanitizeText(req.body?.path, 160);
  if (!eventName || !pathValue) {
    return res.status(400).json({ error: "Invalid analytics payload" });
  }
  console.log(`[analytics] event=${eventName} path=${pathValue}`);
  return res.status(204).send();
});

/**
 * GET /api/health
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve built frontend
app.use(express.static(distPath));
// Fallback for SPA routes (avoid wildcard path-to-regexp issues in Express 5)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  return res.sendFile(path.join(distPath, "index.html"));
});

/**
 * Process successful Stripe payment (stubbed)
 */
async function handleSuccessfulPayment(stripeSession) {
  if (!supabase) {
    throw new Error("Supabase not configured.");
  }

  const userEmail = stripeSession.customer_email;
  const fullName = stripeSession.metadata?.fullName;
  const sessionId = stripeSession.id;
  const totalAmount = Number(stripeSession.amount_total ?? 0);
  const paymentStatus = stripeSession.payment_status;
  const sessionStatus = stripeSession.status;

  if (!sessionId) {
    throw new Error("Missing Stripe session id");
  }

  if (paymentStatus !== "paid" || sessionStatus !== "complete") {
    console.warn(`Skipping session ${sessionId} with status ${sessionStatus}/${paymentStatus}`);
    return;
  }

  if (STRIPE_EXPECT_LIVEMODE !== null && stripeSession.livemode !== STRIPE_EXPECT_LIVEMODE) {
    throw new Error("Stripe session livemode mismatch");
  }

  const sessionMethods = Array.isArray(stripeSession.payment_method_types)
    ? stripeSession.payment_method_types
    : [];
  if (sessionMethods.length === 0 || sessionMethods.some((method) => !ALLOWED_PAYMENT_METHODS.has(method))) {
    throw new Error("Unexpected payment method on session");
  }

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error("Invalid total amount");
  }

  const { data: existingOrders, error: existingError } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_session_id", sessionId)
    .limit(1);

  if (existingError) {
    throw new Error(`Failed to check existing order: ${existingError.message}`);
  }

  if (existingOrders && existingOrders.length > 0) {
    console.log(`Order already exists for session ${sessionId}`);
    return;
  }

  const metadataUserId = sanitizeText(stripeSession.metadata?.userId, 64);
  const referenceUserId = sanitizeText(stripeSession.client_reference_id, 64);
  if (metadataUserId && referenceUserId && metadataUserId !== referenceUserId) {
    throw new Error("User reference mismatch on Stripe session");
  }
  let userId = metadataUserId || referenceUserId;
  if (userId) {
    const { data: userData, error: userLookupError } = await supabase.auth.admin.getUserById(userId);
    if (userLookupError || !userData?.user) {
      throw new Error("User not found for session");
    }
  } else {
    if (!userEmail) {
      throw new Error("No customer email in session");
    }
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      throw new Error(`Failed to list users: ${userError.message}`);
    }

    const user = users.users.find((u) => u.email === userEmail);
    if (!user) {
      throw new Error(`User not found: ${userEmail}`);
    }

    userId = user.id;
  }

  const lineItemResponse = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: MAX_LINE_ITEMS,
    expand: ["data.price.product"],
  });
  const lineItems = lineItemResponse.data || [];

  if (lineItems.length === 0) {
    throw new Error("No line items on session");
  }

  const orderItems = [];
  const emailItems = [];
  let productTotal = 0;

  for (const lineItem of lineItems) {
    const quantity = Math.min(MAX_QUANTITY, Math.max(1, Number(lineItem.quantity) || 1));
    const unitAmount = Number(lineItem.price?.unit_amount ?? 0);
    if (!unitAmount || unitAmount < 1) {
      throw new Error("Invalid line item price");
    }
    const productMeta =
      lineItem.price?.product && typeof lineItem.price.product === "object"
        ? lineItem.price.product.metadata
        : null;
    const productId = sanitizeText(productMeta?.product_id, 64);
    if (productId) {
      orderItems.push({
        product_id: productId,
        unit_price_cents: unitAmount,
        quantity,
      });
      productTotal += unitAmount * quantity;
    }
    emailItems.push({
      name: lineItem.description || "Produkt",
      quantity,
      total: (unitAmount * quantity) / 100,
    });
  }

  const feeTotal = totalAmount - productTotal;
  if (feeTotal < 0) {
    console.warn(`Line item total exceeds payment amount for session ${sessionId}`);
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        user_id: userId,
        status: "received",
        total_cents: totalAmount,
        currency: "SEK",
        stripe_session_id: sessionId,
        stripe_payment_intent_id: stripeSession.payment_intent || null,
        customer_email: userEmail,
        customer_name: stripeSession.metadata?.fullName || fullName || null,
        customer_phone: stripeSession.metadata?.phone || null,
        customer_address: stripeSession.metadata?.address || null,
        customer_postal_code: stripeSession.metadata?.postalCode || null,
        customer_city: stripeSession.metadata?.city || null,
        shipping_address_id: stripeSession.metadata?.addressId || null,
      },
    ])
    .select()
    .single();

  if (orderError || !order) {

  const formattedOrderNumber = formatOrderNumber(order);
    throw new Error(`Failed to create order: ${orderError?.message}`);
  }

  if (stripeSession.payment_intent) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(stripeSession.payment_intent, {
        expand: ["latest_charge"],
      });
      const receiptUrl = paymentIntent?.latest_charge?.receipt_url || null;
      if (receiptUrl) {
        await supabase
          .from("orders")
          .update({ receipt_url: receiptUrl })
          .eq("id", order.id);
      }
      try {
        await stripe.paymentIntents.update(stripeSession.payment_intent, {
          metadata: {
            ...(paymentIntent?.metadata || {}),
            order_id: order.id,
            order_number: formattedOrderNumber,
            stripe_session_id: sessionId,
          },
          description: `DatorHuset order #${formattedOrderNumber}`,
        });
      } catch (error) {
        console.warn("Failed to tag payment intent with order metadata", error);
      }
    } catch (error) {
      console.warn("Failed to attach receipt URL", error);
    }
  }

  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));

  if (orderItemsError) {
    throw new Error(`Failed to create order items: ${orderItemsError.message}`);
  }

  for (const cartItem of orderItems) {
    const { data: inventory } = await supabase
      .from("inventory")
      .select("quantity_in_stock")
      .eq("product_id", cartItem.product_id)
      .single();

    if (inventory && inventory.quantity_in_stock > 0) {
      const newQuantity = inventory.quantity_in_stock - cartItem.quantity;
      await supabase
        .from("inventory")
        .update({ quantity_in_stock: newQuantity })
        .eq("product_id", cartItem.product_id);
    }
  }

  const { error: clearError } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", userId);

  if (clearError) {
    console.error("Warning: Failed to clear cart:", clearError);
  }

  console.log(`Order created for ${userEmail}: ${order.id}`);

  await sendEmail({
    to: userEmail,
    subject: "Orderbekräftelse – DatorHuset",
    html: buildOrderEmailHtml({
      headline: "Tack för din beställning!",
      intro: `Hej ${stripeSession.metadata?.fullName || fullName || ""}! Vi har tagit emot din order och börjar behandla den.`,
      order,
      items: emailItems,
      statusNote: "Beställning mottagen",
    }),
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Stripe API Server running on http://localhost:${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
});





