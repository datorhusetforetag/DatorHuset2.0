/**
 * EXPRESS SERVER FOR STRIPE INTEGRATION
 * Deployable to Render/Railway/etc.
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fsSync from "fs";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { z } from "zod";
import {
  CUSTOM_BUILD_CATALOG_BY_ID,
  CUSTOM_BUILD_CATALOG_ITEMS,
  CUSTOM_BUILD_STORE_SOURCES as CUSTOM_BUILD_ALLOWED_STORE_SOURCES,
  getCustomBuildCatalogItemsByCategory,
} from "./src/data/customBuildCatalog.js";
import {
  ADMIN_DLSS_FSR_MODE_OPTIONS,
  ADMIN_FPS_GAME_OPTIONS,
  ADMIN_FPS_RESOLUTION_OPTIONS,
  createListingRequestSchema,
  formatZodValidationError,
  listingWriteSchema,
  normalizeListingTags,
  updateListingRequestSchema,
} from "./shared/adminListingContract.js";
import {
  DEFAULT_SITE_SETTINGS,
  SITE_SETTINGS_DRAFT_KEY,
  SITE_SETTINGS_KEY,
  normalizeSiteSettings,
  siteSettingsSchema,
} from "./shared/siteSettingsContract.js";

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
const CUSTOM_PRICE_REFRESH_INTERVAL_MS = Math.max(
  60_000,
  Number(process.env.CUSTOM_PRICE_REFRESH_INTERVAL_MS || 24 * 60 * 60 * 1000)
);
const CUSTOM_PRICE_CACHE_TTL_MS = Math.max(
  60_000,
  Number(process.env.CUSTOM_PRICE_CACHE_TTL_MS || CUSTOM_PRICE_REFRESH_INTERVAL_MS)
);
const CUSTOM_PRICE_REQUEST_TIMEOUT_MS = Math.max(
  3_000,
  Number(process.env.CUSTOM_PRICE_REQUEST_TIMEOUT_MS || 12_000)
);
const CUSTOM_PRICE_MAX_QUERY_LENGTH = 180;
const CUSTOM_STORE_PRICE_CACHE_VERSION = "v3";
const CUSTOM_PRICE_EMPTY_CACHE_TTL_MS = Math.max(
  60_000,
  Number(process.env.CUSTOM_PRICE_EMPTY_CACHE_TTL_MS || 15 * 60 * 1000)
);
const CUSTOM_PRICE_TRACKED_QUERIES = (process.env.CUSTOM_PRICE_TRACKED_QUERIES || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const CUSTOM_PRICE_CACHE_FILE = path.join(__dirname, "data", "custom-price-cache.json");
const CUSTOM_BUILD_PRODUCT_CACHE_FILE = path.join(__dirname, "data", "custom-build-product-cache.json");
const PRISJAKT_PRODUCT_MAP_FILE = path.join(__dirname, "data", "prisjakt-product-map.json");
const CUSTOM_BUILD_PRODUCT_CACHE_VERSION = "multi-source-v3";
const CUSTOM_BUILD_SUPPORTED_CATEGORIES = new Set([
  "cpu",
  "gpu",
  "motherboard",
  "ram",
  "storage",
  "case",
  "psu",
  "cooling",
]);
const TRUSTED_CATALOG_REFERENCE_SOURCES = new Set(["komponentkoll", "prisjakt", "pricerunner", "manual"]);
const CUSTOM_BUILD_DISCOVERY_TTL_MS = Math.max(
  60_000,
  Number(process.env.CUSTOM_BUILD_DISCOVERY_TTL_MS || 7 * 24 * 60 * 60 * 1000)
);
const loadPrisjaktProductUrlMap = () => {
  try {
    const raw = fsSync.readFileSync(PRISJAKT_PRODUCT_MAP_FILE, "utf8");
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};
const PRISJAKT_PRODUCT_URL_MAP = loadPrisjaktProductUrlMap();

const RAW_FRONTEND_URL = process.env.FRONTEND_URL || "";
const FRONTEND_URLS = (process.env.FRONTEND_URLS || RAW_FRONTEND_URL || "http://localhost:8080")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const normalizeOrigin = (value) => {
  try {
    return new URL(String(value || "").trim()).origin;
  } catch (error) {
    return null;
  }
};
const buildAdminPreviewOrigins = (origins) => {
  const result = new Set();
  origins.forEach((origin) => {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin) return;
    result.add(normalizedOrigin);
    try {
      const parsed = new URL(normalizedOrigin);
      if (!parsed.hostname.startsWith("admin.")) {
        result.add(`${parsed.protocol}//admin.${parsed.host}`);
      }
    } catch (error) {
      // Ignore malformed preview origins from env.
    }
  });
  return Array.from(result);
};
const ALLOWED_FRONTEND_ORIGINS = Array.from(new Set(buildAdminPreviewOrigins(FRONTEND_URLS)));
const isAllowedOrigin = (origin) => !origin || ALLOWED_FRONTEND_ORIGINS.includes(origin);
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
const customStorePriceCache = new Map();
const customStorePriceRefreshInFlight = new Map();
const customBuildProductCache = new Map();
const customBuildProductRefreshInFlight = new Map();
let customBuildProductCacheLoadPromise = null;
const customBuildProductImageCache = new Map();
const komponentkollCategoryCache = new Map();
const komponentkollProductSearchCache = new Map();
const priceRunnerSearchCache = new Map();
let customStorePriceCacheWriteChain = Promise.resolve();
let customBuildProductCacheWriteChain = Promise.resolve();
let customStorePriceSchedulerStarted = false;
let customBuildProductSchedulerStarted = false;

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
  frameAncestors: ["'self'", ...ALLOWED_FRONTEND_ORIGINS],
  imgSrc: ["'self'", "data:", "https:"],
  fontSrc: ["'self'", "data:", "https:"],
  styleSrc: ["'self'", "'unsafe-inline'", "https:"],
  scriptSrc: ["'self'", "https://js.stripe.com"],
  frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com", ...ALLOWED_FRONTEND_ORIGINS],
  connectSrc: ["'self'", "https://api.stripe.com", "https://*.supabase.co", ...ALLOWED_FRONTEND_ORIGINS],
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
const FPS_GRAPHICS_PRESETS = ["Low", "Medium", "High", "Ultra", "Ultra + Raytracing/Pathtracing"];
const FPS_RESOLUTION_ORDER = ["1080p", "1440p", "4K"];
const FPS_GAME_SUPPORT_MAP = {
  Fortnite: { dlss: true, frameGen: true },
  "Cyberpunk 2077": { dlss: true, frameGen: true },
  "Ghost of Tsushima": { dlss: true, frameGen: true },
  "GTA 5": { dlss: false, frameGen: false },
  Minecraft: { dlss: false, frameGen: false },
  CS2: { dlss: false, frameGen: false },
};
const FPS_FLAGSHIP_BASE_MAP = {
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
const FPS_REPORT_PROFILE_FACTORS = {
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

const cloneFpsSettings = (settings) => ({
  version: 2,
  entries: Array.isArray(settings?.entries)
    ? settings.entries.map((entry) => ({ ...entry }))
    : [],
});

const buildFpsSettingsFromProfileFactors = (profile) => {
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

const FPS_REPORT_PROFILES = Object.fromEntries(
  Object.entries(FPS_REPORT_PROFILE_FACTORS).map(([key, factors]) => [
    key,
    buildFpsSettingsFromProfileFactors(factors),
  ])
);

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
  const silver = FPS_REPORT_PROFILES.silver_speedster;
  if (silver) return cloneFpsSettings(silver);
  return cloneFpsSettings(EMPTY_FPS_SETTINGS);
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

const buildReportedFpsSettingsForProductName = (productName) => {
  const profileKey = resolveFpsReportProfileKey(productName);
  if (!profileKey) return null;
  const profile = FPS_REPORT_PROFILES[profileKey];
  return profile ? cloneFpsSettings(profile) : null;
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

const toFpsEntryKey = (game, resolution, graphics) =>
  `${String(game || "").toLowerCase()}::${String(resolution || "").toLowerCase()}::${String(graphics || "").toLowerCase()}`;

const FPS_EXPECTED_ENTRY_KEY_SET = (() => {
  const keys = new Set();
  ADMIN_FPS_GAME_OPTIONS.forEach((game) => {
    ADMIN_FPS_RESOLUTION_OPTIONS.forEach((resolution) => {
      FPS_GRAPHICS_PRESETS.forEach((graphics) => {
        keys.add(toFpsEntryKey(game, resolution, graphics));
      });
    });
  });
  return keys;
})();

const hasExpectedFpsCoverage = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return false;
  const covered = new Set();
  entries.forEach((entry) => {
    const key = toFpsEntryKey(entry?.game, entry?.resolution, entry?.graphics);
    if (FPS_EXPECTED_ENTRY_KEY_SET.has(key)) {
      covered.add(key);
    }
  });
  return covered.size === FPS_EXPECTED_ENTRY_KEY_SET.size;
};

const hasManualFpsSource = (value) =>
  Boolean(value && typeof value === "object" && !Array.isArray(value) && value.source === "manual");

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
  if (entries.length > 0 && fallbackEntries.length > 0 && !hasExpectedFpsCoverage(entries)) {
    entries = fallbackEntries;
  }

  return { version: 2, entries };
};

const resolveEffectiveFpsSettings = (storedValue, fallbackInput) => {
  const fallback = sanitizeFpsSettings(null, fallbackInput);
  if (!hasManualFpsSource(storedValue)) {
    return fallback;
  }
  const sanitized = sanitizeFpsSettings(storedValue, fallback);
  if (!hasExpectedFpsCoverage(sanitized.entries)) {
    return fallback;
  }
  return sanitized;
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

const parseMoneyValue = (...candidates) => {
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === "string") {
      const raw = candidate.replace(/\s+/g, "").replace(/[^0-9,.-]/g, "");
      if (!raw) continue;
      const lastComma = raw.lastIndexOf(",");
      const lastDot = raw.lastIndexOf(".");
      let normalized = raw;
      if (lastComma >= 0 && lastDot >= 0) {
        if (lastComma > lastDot) {
          normalized = raw.replace(/\./g, "").replace(",", ".");
        } else {
          normalized = raw.replace(/,/g, "");
        }
      } else if (lastComma >= 0) {
        const decimals = raw.length - lastComma - 1;
        normalized =
          decimals === 1 || decimals === 2
            ? raw.replace(/\./g, "").replace(",", ".")
            : raw.replace(/,/g, "");
      } else if (lastDot >= 0) {
        const decimals = raw.length - lastDot - 1;
        normalized = decimals === 1 || decimals === 2 ? raw.replace(/,/g, "") : raw.replace(/\./g, "");
      }
      normalized = normalized.replace(/(?!^)-/g, "");
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
};

const firstText = (...candidates) => {
  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const clean = sanitizeText(candidate, 240);
      if (clean) return clean;
    }
  }
  return "";
};

const firstArray = (...candidates) => {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

const CUSTOM_STORE_SOURCES = [
  {
    id: "webhallen",
    name: "Webhallen",
    buildSearchUrl: (query) => `https://www.webhallen.com/se/search?searchString=${encodeURIComponent(query)}`,
    productUrlPattern: "https?:\\/\\/(?:www\\.)?webhallen\\.com\\/se\\/product\\/\\d+-[^\\s)\\]]+",
    siteSearchDomain: "webhallen.com",
  },
  {
    id: "inet",
    name: "Inet",
    buildSearchUrl: (query) => `https://www.inet.se/sok?q=${encodeURIComponent(query)}`,
    productUrlPattern: "https?:\\/\\/(?:www\\.)?inet\\.se\\/produkt\\/\\d+\\/[^\\s)\\]]+",
    siteSearchDomain: "inet.se",
  },
  {
    id: "komplett",
    name: "Komplett",
    buildSearchUrl: (query) => `https://www.komplett.se/search?q=${encodeURIComponent(query)}`,
    productUrlPattern: "https?:\\/\\/(?:www\\.)?komplett\\.se\\/product\\/\\d+\\/[^\\s)\\]]+",
    siteSearchDomain: "komplett.se",
  },
  {
    id: "elgiganten",
    name: "Elgiganten",
    buildSearchUrl: (query) => `https://www.elgiganten.se/search?SearchParameter=${encodeURIComponent(query)}`,
    productUrlPattern: "https?:\\/\\/(?:www\\.)?elgiganten\\.se\\/product\\/[^\\s)\\]]+",
    siteSearchDomain: "elgiganten.se",
  },
  {
    id: "amazon-se",
    name: "Amazon.se",
    buildSearchUrl: (query) => `https://www.amazon.se/s?k=${encodeURIComponent(query)}`,
    productUrlPattern: "https?:\\/\\/(?:www\\.)?amazon\\.se\\/[^\\s)\\]]*\\/dp\\/[A-Z0-9]{8,}[^\\s)\\]]*",
    siteSearchDomain: "amazon.se",
  },
  {
    id: "power",
    name: "Power",
    buildSearchUrl: (query) => `https://www.power.se/search/?q=${encodeURIComponent(query)}`,
    productUrlPattern: "https?:\\/\\/(?:www\\.)?power\\.se\\/[^\\s)\\]]*(?:\\/product\\/|\\/p-\\d+)[^\\s)\\]]*",
    siteSearchDomain: "power.se",
  },
  {
    id: "proshop",
    name: "Proshop",
    buildSearchUrl: (query) => `https://www.proshop.se/?s=${encodeURIComponent(query)}`,
    productUrlPattern: "https?:\\/\\/(?:www\\.)?proshop\\.se\\/[A-Za-z0-9_-]+\\/[A-Za-z0-9\\-]+\\/\\d+",
    siteSearchDomain: "proshop.se",
  },
  {
    id: "computersalg",
    name: "CSmegastore",
    buildSearchUrl: (query) => `https://www.computersalg.se/i/0/s.aspx?k=${encodeURIComponent(query)}`,
    productUrlPattern: "https?:\\/\\/(?:www\\.)?computersalg\\.se\\/i\\/\\d+\\/[^\\s)\\]]+",
    siteSearchDomain: "computersalg.se",
  },
  {
    id: "dustin",
    name: "Dustin",
    buildSearchUrl: (query) => `https://www.dustinhome.se/search/${encodeURIComponent(query)}`,
    productUrlPattern: "https?:\\/\\/(?:www\\.)?dustinhome\\.se\\/product\\/[^\\s)\\]]+",
    siteSearchDomain: "dustinhome.se",
  },
  {
    id: "netonnet",
    name: "NetOnNet",
    buildSearchUrl: (query) => `https://www.netonnet.se/Search?query=${encodeURIComponent(query)}`,
    productUrlPattern: "https?:\\/\\/(?:www\\.)?netonnet\\.se\\/art\\/[^\\s)\\]]+",
    siteSearchDomain: "netonnet.se",
  },
];
const CUSTOM_STORE_SOURCE_BY_ID = Object.fromEntries(CUSTOM_STORE_SOURCES.map((source) => [source.id, source]));
const CURATED_CUSTOM_BUILD_STORE_SOURCES = CUSTOM_BUILD_ALLOWED_STORE_SOURCES
  .map((source) => CUSTOM_STORE_SOURCE_BY_ID[source.id])
  .filter(Boolean);

const normalizeStorePriceQueryKey = (value) =>
  sanitizeText(value, CUSTOM_PRICE_MAX_QUERY_LENGTH)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const buildStorePriceCacheKey = (query) =>
  `${CUSTOM_STORE_PRICE_CACHE_VERSION}:${normalizeStorePriceQueryKey(query)}`;

const CATALOG_TITLE_GENERIC_TOKENS = new Set([
  "amd",
  "intel",
  "ryzen",
  "core",
  "rtx",
  "gtx",
  "rx",
  "arc",
  "geforce",
  "radeon",
  "gaming",
  "edition",
  "limited",
  "processor",
  "socket",
  "ram",
  "memory",
  "cooler",
  "case",
  "pc",
  "chassi",
  "nvme",
  "pcie",
  "gen",
  "with",
  "without",
  "dual",
  "chamber",
]);

const buildCatalogTitleReferenceValues = (item) => {
  const values = new Set();
  const name = sanitizeText(String(item?.name || ""), 180);
  if (name) {
    values.add(name);
    const withoutParens = name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
    if (withoutParens) {
      values.add(withoutParens);
    }
    const brand = sanitizeText(String(item?.brand || ""), 80);
    if (brand) {
      const withoutBrand = name
        .replace(new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "")
        .trim();
      if (withoutBrand) {
        values.add(withoutBrand);
      }
    }
  }
  return Array.from(values);
};

const expandCatalogStrongTokenVariants = (token) => {
  const normalizedToken = sanitizeText(String(token || ""), 40).toLowerCase();
  if (!normalizedToken) return [];
  if (/^\d+g$/.test(normalizedToken) && normalizedToken.length <= 3) {
    return [normalizedToken, `${normalizedToken}b`];
  }
  return [normalizedToken];
};

const getCustomBuildCategoryForItem = (item) => {
  const itemId = sanitizeText(String(item?.id || ""), 120).toLowerCase();
  if (itemId.startsWith("cpu-")) return "cpu";
  if (itemId.startsWith("mb-")) return "motherboard";
  if (itemId.startsWith("gpu-")) return "gpu";
  if (itemId.startsWith("ram-")) return "ram";
  if (itemId.startsWith("sto-")) return "storage";
  if (itemId.startsWith("case-")) return "case";
  if (itemId.startsWith("psu-")) return "psu";
  if (itemId.startsWith("cool-")) return "cooling";
  return "";
};

const extractCatalogStrongTokens = (value) =>
  Array.from(
    new Set(
      tokenizeForSearchMatch(value)
        .filter(
          (token) =>
            /\d/.test(token) &&
            token.length >= 2 &&
            !/^\d+(mhz|w|mm)$/.test(token) &&
            !/^\d+pin$/.test(token) &&
            !/^(1080p|1440p|2160p|4k|4kready)$/i.test(token)
        )
        .flatMap((token) => expandCatalogStrongTokenVariants(token))
    )
  );

const extractCatalogAlphaTokens = (value) =>
  Array.from(
    new Set(
      tokenizeForSearchMatch(value).filter(
        (token) =>
          token.length >= 3 &&
          !/\d/.test(token) &&
          !CATALOG_TITLE_GENERIC_TOKENS.has(token)
      )
    )
  );

const getCatalogStrongTokensForItem = (item) =>
  Array.from(
    new Set(
      buildCatalogTitleReferenceValues(item)
        .flatMap((value) => extractCatalogStrongTokens(value))
        .filter(Boolean)
    )
  ).slice(0, 12);

const getCatalogAlphaTokensForItem = (item) =>
  Array.from(
    new Set(
      buildCatalogTitleReferenceValues(item)
        .flatMap((value) => extractCatalogAlphaTokens(value))
        .filter(Boolean)
    )
  ).slice(0, 12);

const doesCatalogTitleContainEquivalentStrongToken = (normalizedTitle, token) => {
  if (normalizedTitle.includes(token)) return true;
  const capacityMatch = token.match(/^(\d+)(gb|tb)$/i);
  if (!capacityMatch) return false;
  const totalCapacity = Number(capacityMatch[1] || 0);
  const unit = String(capacityMatch[2] || "").toLowerCase();
  if (!Number.isFinite(totalCapacity) || totalCapacity <= 0 || !unit) return false;
  const kitRegex = new RegExp(`(\\d+)x(\\d+)${unit}`, "gi");
  for (const match of normalizedTitle.matchAll(kitRegex)) {
    const count = Number(match[1] || 0);
    const perStickCapacity = Number(match[2] || 0);
    if (Number.isFinite(count) && Number.isFinite(perStickCapacity) && count * perStickCapacity === totalCapacity) {
      return true;
    }
  }
  return false;
};

const doesCatalogTitleMatchItem = (title, item) => {
  const normalizedTitle = normalizeStorePriceQueryKey(title);
  if (!normalizedTitle) return false;

  const strongTokens = getCatalogStrongTokensForItem(item);
  if (strongTokens.length > 0) {
    const missingStrongTokens = strongTokens.filter(
      (token) => !doesCatalogTitleContainEquivalentStrongToken(normalizedTitle, token)
    );
    if (missingStrongTokens.length > 0) {
      return false;
    }
  }

  const alphaTokens = getCatalogAlphaTokensForItem(item);
  if (alphaTokens.length > 0) {
    const missingAlphaTokens = alphaTokens.filter((token) => !normalizedTitle.includes(token));
    if (missingAlphaTokens.length > 0) {
      return false;
    }
  }

  return true;
};

const isCatalogOfferWithinExpectedPriceRange = (item, price) => {
  if (!Number.isFinite(price) || price <= 0) return false;
  const referencePrice = Number(item?.price || 0);
  if (!Number.isFinite(referencePrice) || referencePrice <= 0) return true;

  const category = getCustomBuildCategoryForItem(item);
  let lowerMultiplier = 0.35;
  let upperMultiplier = 3;

  if (category === "gpu") {
    lowerMultiplier = 0.55;
    upperMultiplier = 2.2;
  } else if (category === "cpu") {
    lowerMultiplier = 0.45;
    upperMultiplier = 3;
  } else if (category === "motherboard") {
    lowerMultiplier = 0.45;
    upperMultiplier = 3.2;
  } else if (category === "psu" || category === "cooling") {
    lowerMultiplier = 0.4;
    upperMultiplier = 4;
  } else if (category === "storage") {
    lowerMultiplier = 0.35;
    upperMultiplier = 4.5;
  }

  const lowerBound = Math.max(80, Math.round(referencePrice * lowerMultiplier));
  const upperBound = Math.max(lowerBound, Math.round(referencePrice * upperMultiplier));
  return price >= lowerBound && price <= upperBound;
};

const tokenizeForSearchMatch = (value) =>
  normalizeStorePriceQueryKey(value)
    .split(/\s+/)
    .filter((token) => token.length >= 2);

const scoreTitleAgainstQuery = (title, queryTokens) => {
  const normalizedTitle = normalizeStorePriceQueryKey(title);
  if (!normalizedTitle || queryTokens.length === 0) return 0;
  let score = 0;
  queryTokens.forEach((token) => {
    if (normalizedTitle.includes(token)) {
      score += token.length >= 4 ? 2 : 1;
    }
  });
  return score;
};

const extractModelTokensFromQuery = (query) =>
  Array.from(
    new Set(tokenizeForSearchMatch(query).filter((token) => token.length >= 3 && /\d/.test(token)))
  );

const extractAlphaTokensFromQuery = (query) =>
  Array.from(
    new Set(
      tokenizeForSearchMatch(query).filter(
        (token) =>
          token.length >= 4 &&
          !/\d/.test(token) &&
          !["argb", "rgb", "wifi", "gold", "black", "white"].includes(token)
      )
    )
  );

const matchesModelTokens = (text, modelTokens) => {
  if (!Array.isArray(modelTokens) || modelTokens.length === 0) return true;
  const normalizedText = normalizeStorePriceQueryKey(text);
  if (!normalizedText) return false;
  return modelTokens.some((token) => normalizedText.includes(token));
};

const countMatchingModelTokens = (text, modelTokens) => {
  if (!Array.isArray(modelTokens) || modelTokens.length === 0) return 0;
  const normalizedText = normalizeStorePriceQueryKey(text);
  if (!normalizedText) return 0;
  return modelTokens.filter((token) => normalizedText.includes(token)).length;
};

const getRamOfferValidationRequirements = (item) => {
  const normalizedValues = [item?.name || "", ...firstArray(item?.specs), ...firstArray(item?.searchTerms)]
    .map((value) => normalizeStorePriceQueryKey(value))
    .filter(Boolean);
  const combined = normalizedValues.join(" ");
  const ddr = combined.match(/\bddr[345]\b/i)?.[0]?.toLowerCase() || null;
  const cl = combined.match(/\bcl\d+\b/i)?.[0]?.toLowerCase() || null;
  const speed =
    normalizeStorePriceQueryKey(firstArray(item?.specs).join(" ")).match(/\b(\d{4,5})\s*(?:mhz|mt\/s|mts)?\b/i)?.[1] ||
    combined.match(/\b(\d{4,5})\s*(?:mhz|mt\/s|mts)\b/i)?.[1] ||
    null;
  const capacities = Array.from(
    new Set(
      combined.match(/\b\d+x\d+(?:gb|tb)\b|\b\d+(?:gb|tb)\b/gi) || []
    )
  );
  return {
    ddr,
    cl,
    speed,
    capacities,
  };
};

const doesCatalogExactSpecMatchItem = (item, title, url = "") => {
  return true;
};

const getOfferModelTokensForItem = (item) =>
  Array.from(
    new Set(
      [
        item?.name || "",
        ...firstArray(item?.searchTerms),
        ...firstArray(item?.specs).map((spec) => `${item?.brand || ""} ${item?.name || ""} ${spec}`),
      ]
        .flatMap((value) => extractModelTokensFromQuery(value))
        .filter((token) => !/^\d{5,}$/.test(token))
    )
  );

const getRequiredModelTokenMatchesForItem = (item, modelTokens) => {
  const category = getCustomBuildCategoryForItem(item);
  if (!Array.isArray(modelTokens) || modelTokens.length === 0) return 0;
  if (category === "storage") {
    return modelTokens.length >= 3 ? 2 : 1;
  }
  return 1;
};

const buildTitleFromProductUrl = (url) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "";
    let candidate = segments[segments.length - 1];
    if (/^\d+$/.test(candidate) && segments.length > 1) {
      candidate = segments[segments.length - 2];
    }
    if (candidate.toLowerCase() === "dp" && segments.length > 2) {
      candidate = segments[segments.length - 3];
    }
    candidate = decodeURIComponent(candidate)
      .replace(/^[0-9]+-/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return candidate;
  } catch (error) {
    return "";
  }
};

const matchesOfferToQueryModel = (sourceId, queryModelTokens, offerTitle, offerUrl, minRequiredMatches = 1) => {
  if (!Array.isArray(queryModelTokens) || queryModelTokens.length === 0) return true;
  const title = firstText(offerTitle);
  const requiredMatches = Math.max(1, Number(minRequiredMatches) || 1);
  if (sourceId === "amazon-se") {
    return countMatchingModelTokens(title, queryModelTokens) >= requiredMatches;
  }
  const urlTitle = buildTitleFromProductUrl(offerUrl || "");
  const urlModelTokens = extractModelTokensFromQuery(urlTitle).filter((token) => !/^\d{5,}$/.test(token));
  if (urlModelTokens.length > 0) {
    return countMatchingModelTokens(urlTitle, queryModelTokens) >= requiredMatches;
  }
  return countMatchingModelTokens(`${title} ${urlTitle}`, queryModelTokens) >= requiredMatches;
};

const matchesOfferToItemModel = (sourceId, item, offerTitle, offerUrl) => {
  if (!doesCatalogExactSpecMatchItem(item, offerTitle, offerUrl)) {
    return false;
  }
  const modelTokens = getOfferModelTokensForItem(item);
  const requiredMatches = getRequiredModelTokenMatchesForItem(item, modelTokens);
  return matchesOfferToQueryModel(sourceId, modelTokens, offerTitle, offerUrl, requiredMatches);
};

const isLikelyPrebuiltOrBundleOffer = (title, url) => {
  const text = `${firstText(title)} ${String(url || "")}`.toLowerCase();
  return /(config|prebuilt|byggdator|gamingdator|stationar-gamingdator|gaming[\s-]?pc|desktop-pc|desktop\s+computer|datorpaket|bundle|komplett\s+pc)/i.test(
    text
  );
};

const extractPriceCandidatesFromText = (value) => {
  if (!value) return [];
  const regex =
    /(?:kr\s*(-?\d{1,3}(?:[ .,]\d{3})*(?:[.,][0-9]{1,2})?|-\d{3,6}|\d{3,6})|(-?\d{1,3}(?:[ .,]\d{3})*(?:[.,][0-9]{1,2})?|-\d{3,6}|\d{3,6})\s*(?:kr|\.-))/gi;
  const prices = [];
  let match = regex.exec(value);
  while (match) {
    const rawValue = firstText(match[1], match[2]);
    if (!rawValue.startsWith("-")) {
      const parsed = parseMoneyValue(rawValue);
      if (Number.isFinite(parsed)) {
        prices.push(Math.max(0, Math.round(parsed)));
      }
    }
    match = regex.exec(value);
  }
  return prices.filter((item) => item >= 80 && item <= 400_000);
};

const pickBestPriceCandidate = (prices, snippet, referencePrice = null) => {
  if (!Array.isArray(prices) || prices.length === 0) return null;
  const filtered = prices.filter((value) => isOfferWithinReferencePrice(value, referencePrice));
  if (filtered.length === 0) return null;
  if (/exkl\.?\s*moms/i.test(snippet) && filtered.length > 1) {
    const maxPrice = Math.max(...filtered);
    if (Number.isFinite(maxPrice)) return maxPrice;
  }
  if (Number.isFinite(referencePrice) && referencePrice > 0) {
    return filtered.sort((a, b) => Math.abs(a - referencePrice) - Math.abs(b - referencePrice))[0];
  }
  return Math.min(...filtered);
};

const isLikelySearchResultUrl = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("/search") ||
    lower.includes("/sok") ||
    lower.includes("searchparameter=") ||
    lower.includes("?q=") ||
    lower.includes("&q=") ||
    lower.includes("/s?k=") ||
    lower.includes("/s/?k=")
  );
};

const doesUrlBelongToStore = (url, sourceId) => {
  if (!url || !sourceId) return false;
  const source = CUSTOM_STORE_SOURCE_BY_ID[sourceId];
  const expectedHost = sanitizeText(String(source?.siteSearchDomain || ""), 120).toLowerCase();
  if (!expectedHost) return false;
  try {
    const parsed = new URL(url);
    const host = String(parsed.hostname || "").toLowerCase();
    return host === expectedHost || host.endsWith(`.${expectedHost}`);
  } catch (error) {
    return false;
  }
};

const isLikelyProductUrlForStore = (url, sourceId) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (isLikelySearchResultUrl(lower)) return false;
  if (!doesUrlBelongToStore(url, sourceId)) return false;
  if (sourceId === "amazon-se") return /\/dp\/[a-z0-9]{8,}/i.test(lower);
  if (sourceId === "webhallen") return /\/product\/\d+-/i.test(lower);
  if (sourceId === "inet") return /\/produkt\/\d+/i.test(lower);
  if (sourceId === "komplett") return /\/product\//i.test(lower);
  if (sourceId === "elgiganten") return /\/[a-z0-9-]+\/p\/[a-z0-9-]+/i.test(lower) || /\/product\//i.test(lower);
  if (sourceId === "power") return /\/product\//i.test(lower) || /\/p-\d+/i.test(lower);
  if (sourceId === "proshop") return /\/[a-z0-9_-]+\/[a-z0-9-]+\/\d+/i.test(lower);
  if (sourceId === "computersalg") return /\/i\/\d+\/[a-z0-9-]+/i.test(lower);
  if (sourceId === "dustin") return /\/product\//i.test(lower);
  if (sourceId === "netonnet") return /\/art\//i.test(lower);
  return true;
};

const normalizeOfferUrlForStore = (url, sourceId) => {
  if (!url) return null;
  try {
    const normalized = new URL(url);
    if (normalized.protocol === "http:") {
      normalized.protocol = "https:";
    }
    if (!doesUrlBelongToStore(normalized.toString(), sourceId)) {
      return null;
    }
    if (sourceId === "amazon-se") {
      const match = normalized.pathname.match(/\/dp\/[A-Z0-9]{8,}/i);
      if (!match) return null;
      return `https://www.amazon.se${match[0]}`;
    }
    if (sourceId === "computersalg") {
      normalized.search = "";
      normalized.hash = "";
    }
    if (
      sourceId === "netonnet" ||
      sourceId === "proshop" ||
      sourceId === "webhallen" ||
      sourceId === "inet" ||
      sourceId === "dustin"
    ) {
      normalized.hash = "";
    }
    if (isLikelySearchResultUrl(normalized.toString())) return null;
    return normalized.toString();
  } catch (error) {
    return null;
  }
};

const collectJinaProductUrlCandidates = (markdown, source, baseUrl) => {
  if (!markdown || typeof markdown !== "string") return [];
  const deduped = new Map();
  const addCandidate = (href, label = "") => {
    const rawHref = String(href || "").trim().replace(/[>,.;]+$/, "");
    if (!rawHref) return;
    const absoluteUrl = normalizeRelativeUrl(rawHref, baseUrl || rawHref) || rawHref;
    const normalizedUrl = normalizeOfferUrlForStore(absoluteUrl, source.id) || normalizeRelativeUrl(absoluteUrl, absoluteUrl);
    if (!normalizedUrl) return;
    if (!isLikelyProductUrlForStore(normalizedUrl, source.id)) return;
    const key = normalizedUrl.toLowerCase();
    const normalizedLabel = firstText(label);
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, { rawHref, normalizedUrl, label: normalizedLabel || "" });
      return;
    }
    if (!existing.label && normalizedLabel) {
      existing.label = normalizedLabel;
      deduped.set(key, existing);
    }
  };

  const markdownLinkRegex = /\[([^\]]{1,220})\]\(([^)\s]+)\)/g;
  let linkMatch = markdownLinkRegex.exec(markdown);
  while (linkMatch) {
    addCandidate(linkMatch[2], linkMatch[1]);
    linkMatch = markdownLinkRegex.exec(markdown);
  }

  if (source?.productUrlPattern) {
    const urlRegex = new RegExp(source.productUrlPattern, "gi");
    const rawMatches = markdown.match(urlRegex) || [];
    rawMatches.forEach((rawUrl) => addCandidate(rawUrl));
  }

  return Array.from(deduped.values());
};

const isOfferWithinReferencePrice = (price, referencePrice = null) => {
  if (!Number.isFinite(price) || price <= 0) return false;
  if (!Number.isFinite(referencePrice) || referencePrice <= 0) return true;
  const lowerBound = Math.max(80, Math.round(referencePrice * 0.25));
  const upperBound = Math.round(referencePrice * 4);
  return price >= lowerBound && price <= upperBound;
};

const buildJinaMirrorUrl = (url) => {
  try {
    const parsed = new URL(url);
    return `https://r.jina.ai/http://${parsed.host}${parsed.pathname}${parsed.search}`;
  } catch (error) {
    return null;
  }
};

const normalizeRelativeUrl = (candidate, baseUrl) => {
  if (!candidate || typeof candidate !== "string") return null;
  try {
    const url = new URL(candidate, baseUrl);
    return url.toString();
  } catch (error) {
    return null;
  }
};

const normalizeAvailability = (value) => {
  const text = firstText(value);
  if (!text) return null;
  if (text.includes("/")) {
    const parts = text.split("/");
    return firstText(parts[parts.length - 1]) || text;
  }
  return text;
};

const extractJsonLdScripts = (html) => {
  const scripts = [];
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match = scriptRegex.exec(html);
  while (match) {
    const rawJson = match[1]?.trim();
    if (!rawJson) {
      match = scriptRegex.exec(html);
      continue;
    }
    try {
      scripts.push(JSON.parse(rawJson));
    } catch (error) {
      // Ignore malformed JSON-LD blocks.
    }
    match = scriptRegex.exec(html);
  }
  return scripts;
};

const collectProductsFromJsonLd = (node, out = []) => {
  if (!node) return out;
  if (Array.isArray(node)) {
    node.forEach((entry) => collectProductsFromJsonLd(entry, out));
    return out;
  }
  if (typeof node !== "object") return out;

  const typeValue = node["@type"];
  const typeList = Array.isArray(typeValue) ? typeValue : [typeValue];
  const normalizedTypes = typeList.map((value) => String(value || "").toLowerCase());
  if (normalizedTypes.includes("product")) {
    out.push(node);
  }

  if (Array.isArray(node["@graph"])) {
    collectProductsFromJsonLd(node["@graph"], out);
  }
  if (Array.isArray(node.itemListElement)) {
    collectProductsFromJsonLd(node.itemListElement, out);
  }
  if (node.item) {
    collectProductsFromJsonLd(node.item, out);
  }
  return out;
};

const extractStoreOffersFromJsonLd = (html, storeName, baseUrl) => {
  const scripts = extractJsonLdScripts(html);
  const products = [];
  scripts.forEach((script) => collectProductsFromJsonLd(script, products));

  const offers = [];
  products.forEach((product) => {
    const productTitle = firstText(product?.name, product?.title);
    const productUrl = normalizeRelativeUrl(firstText(product?.url), baseUrl);
    const rawOffers = [];
    if (Array.isArray(product?.offers)) rawOffers.push(...product.offers);
    if (product?.offers && typeof product.offers === "object" && !Array.isArray(product.offers)) {
      rawOffers.push(product.offers);
    }
    if (product?.aggregateOffer && typeof product.aggregateOffer === "object") {
      rawOffers.push(product.aggregateOffer);
    }
    if (product?.aggregateOffers && typeof product.aggregateOffers === "object") {
      rawOffers.push(product.aggregateOffers);
    }

    rawOffers.forEach((offer) => {
      const parsedPrice = parseMoneyValue(
        offer?.price,
        offer?.priceSpecification?.price,
        offer?.lowPrice,
        offer?.highPrice
      );
      if (parsedPrice === null) return;
      const shippingPrice = parseMoneyValue(
        offer?.shippingPrice,
        offer?.shippingDetails?.shippingRate?.value,
        offer?.shippingDetails?.shippingRate?.price
      );
      const currency = firstText(offer?.priceCurrency, offer?.priceSpecification?.priceCurrency) || "SEK";
      const offerStore =
        firstText(offer?.seller?.name, offer?.offeredBy?.name, offer?.merchant?.name) || storeName;
      const offerUrl = normalizeRelativeUrl(firstText(offer?.url), baseUrl) || productUrl;
      const availability = normalizeAvailability(firstText(offer?.availability, offer?.inventoryLevel));
      offers.push({
        store: offerStore,
        title: productTitle || offerStore,
        price: Math.max(0, Math.round(parsedPrice)),
        currency,
        shipping_price:
          shippingPrice !== null ? Math.max(0, Math.round(shippingPrice)) : null,
        total_price:
          shippingPrice !== null
            ? Math.max(0, Math.round(parsedPrice + shippingPrice))
            : Math.max(0, Math.round(parsedPrice)),
        product_url: offerUrl || null,
        availability,
      });
    });
  });
  return offers;
};

const decodeBasicHtmlEntities = (value) =>
  String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const extractAmazonOfferFromSearchHtml = (html, query, referencePrice = null) => {
  const blocks = Array.from(
    html.matchAll(
      /<div[^>]*data-component-type=\"s-search-result\"[\s\S]*?(?=<div[^>]*data-component-type=\"s-search-result\"|$)/gi
    )
  ).map((match) => match[0]);
  if (blocks.length === 0) return null;

  const queryTokens = tokenizeForSearchMatch(query);
  const modelTokens = extractModelTokensFromQuery(query);
  const candidates = [];

  blocks.forEach((block) => {
    const rawTitle =
      block.match(/<h2[^>]*>\s*<span[^>]*>([\s\S]*?)<\/span>\s*<\/h2>/i)?.[1] ||
      block.match(/<h2[^>]*aria-label=\"([^\"]+)\"/i)?.[1] ||
      "";
    const title = decodeBasicHtmlEntities(rawTitle.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
    const hrefMatch =
      block.match(/<a[^>]*class=\"[^\"]*a-link-normal[^\"]*\"[^>]*href=\"([^\"]+)\"/i) ||
      block.match(/<a[^>]*href=\"([^\"]+)\"[^>]*class=\"[^\"]*a-link-normal[^\"]*\"/i) ||
      block.match(/<a[^>]*href=\"([^\"]*\/dp\/[A-Z0-9]{8,}[^\"]*)\"/i);
    const rawHref = hrefMatch?.[1] || "";
    const href = decodeBasicHtmlEntities(rawHref);
    const productUrl = normalizeOfferUrlForStore(normalizeRelativeUrl(href, "https://www.amazon.se"), "amazon-se");
    if (!productUrl) return;
    if (isLikelyPrebuiltOrBundleOffer(title, productUrl)) return;
    if (!matchesOfferToQueryModel("amazon-se", modelTokens, title, productUrl)) return;

    const offscreenPrice = decodeBasicHtmlEntities(
      block.match(/<span class=\"a-offscreen\">([^<]+)<\/span>/i)?.[1] || ""
    );
    const whole = decodeBasicHtmlEntities(block.match(/a-price-whole\">([^<]+)</i)?.[1] || "");
    const fraction = decodeBasicHtmlEntities(block.match(/a-price-fraction\">([^<]+)</i)?.[1] || "");
    const combined = whole ? `${whole}${fraction ? `.${fraction}` : ""}` : "";
    const parsedPrice = parseMoneyValue(offscreenPrice, combined);
    if (!Number.isFinite(parsedPrice)) return;
    const roundedPrice = Math.max(0, Math.round(parsedPrice));
    if (!isOfferWithinReferencePrice(roundedPrice, referencePrice)) return;

    candidates.push({
      store: "Amazon.se",
      title: title || "Amazon.se",
      price: roundedPrice,
      currency: "SEK",
      shipping_price: null,
      total_price: roundedPrice,
      product_url: productUrl,
      availability: null,
      _score: scoreTitleAgainstQuery(title, queryTokens),
    });
  });

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const scoreDiff = b._score - a._score;
    if (scoreDiff !== 0) return scoreDiff;
    if (Number.isFinite(referencePrice) && referencePrice > 0) {
      const aDistance = Math.abs(a.price - referencePrice);
      const bDistance = Math.abs(b.price - referencePrice);
      if (aDistance !== bDistance) return aDistance - bDistance;
    }
    return a.price - b.price;
  });
  const best = candidates[0];
  return {
    store: best.store,
    title: best.title,
    price: best.price,
    currency: best.currency,
    shipping_price: best.shipping_price,
    total_price: best.total_price,
    product_url: best.product_url,
    availability: best.availability,
  };
};

const extractStoreOfferFromJinaSearch = (markdown, source, query, referencePrice = null, searchUrl = null) => {
  if (!markdown || typeof markdown !== "string") return null;
  const urlCandidates = collectJinaProductUrlCandidates(markdown, source, searchUrl);
  if (urlCandidates.length === 0) return null;
  const queryTokens = tokenizeForSearchMatch(query);
  const modelTokens = extractModelTokensFromQuery(query);
  const candidates = [];

  urlCandidates.forEach((candidate) => {
    const normalizedUrl = candidate.normalizedUrl;
    if (!normalizedUrl) return;
    if (!isLikelyProductUrlForStore(normalizedUrl, source.id)) return;
    const searchNeedles = [candidate.rawHref, normalizedUrl, candidate.label, buildTitleFromProductUrl(normalizedUrl)]
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    let snippetIndex = -1;
    for (const needle of searchNeedles) {
      snippetIndex = markdown.toLowerCase().indexOf(needle.toLowerCase());
      if (snippetIndex >= 0) break;
    }
    const snippet =
      snippetIndex >= 0
        ? markdown.slice(Math.max(0, snippetIndex - 420), Math.min(markdown.length, snippetIndex + 2600))
        : markdown;
    const titleFromLabel = firstText(candidate.label);
    const titleFromUrl = buildTitleFromProductUrl(normalizedUrl);
    if (isLikelyPrebuiltOrBundleOffer(titleFromLabel || titleFromUrl, normalizedUrl)) return;
    if (!matchesOfferToQueryModel(source.id, modelTokens, titleFromLabel || titleFromUrl, normalizedUrl)) {
      return;
    }
    const titleScore = scoreTitleAgainstQuery(
      [titleFromLabel, titleFromUrl, snippet.slice(0, 240)].filter(Boolean).join(" "),
      queryTokens
    );
    if (titleScore <= 0) return;
    const prices = extractPriceCandidatesFromText(snippet);
    const pickedPrice = pickBestPriceCandidate(prices, snippet, referencePrice);
    if (!Number.isFinite(pickedPrice)) return;
    candidates.push({
      store: source.name,
      title: titleFromLabel || titleFromUrl || source.name,
      price: Math.max(0, Math.round(pickedPrice)),
      currency: "SEK",
      shipping_price: null,
      total_price: Math.max(0, Math.round(pickedPrice)),
      product_url: normalizedUrl,
      availability: null,
      _score: titleScore,
      _distance: Number.isFinite(referencePrice) ? Math.abs(pickedPrice - referencePrice) : 0,
    });
  });

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    if (a._distance !== b._distance) return a._distance - b._distance;
    return a.price - b.price;
  });
  const best = candidates[0];
  return {
    store: best.store,
    title: best.title,
    price: best.price,
    currency: best.currency,
    shipping_price: best.shipping_price,
    total_price: best.total_price,
    product_url: best.product_url,
    availability: best.availability,
  };
};

const normalizeStoreOfferList = (offers) => {
  const deduped = new Map();
  offers.forEach((offer) => {
    if (!offer || typeof offer !== "object") return;
    const store = firstText(offer.store);
    const price = parseMoneyValue(offer.price);
    if (!store || price === null) return;
    const shippingPrice = parseMoneyValue(offer.shipping_price);
    const totalPrice = parseMoneyValue(offer.total_price);
    const normalized = {
      store,
      price: Math.max(0, Math.round(price)),
      currency: firstText(offer.currency).toUpperCase() || "SEK",
      shipping_price: shippingPrice !== null ? Math.max(0, Math.round(shippingPrice)) : null,
      total_price:
        totalPrice !== null
          ? Math.max(0, Math.round(totalPrice))
          : shippingPrice !== null
            ? Math.max(0, Math.round(price + shippingPrice))
            : null,
      product_url: normalizeRelativeUrl(firstText(offer.product_url), firstText(offer.product_url)) || null,
      availability: firstText(offer.availability) || null,
    };
    const key = `${normalized.store.toLowerCase()}::${normalized.price}::${normalized.product_url || ""}`;
    if (!deduped.has(key)) {
      deduped.set(key, normalized);
    }
  });
  return Array.from(deduped.values()).sort((a, b) => {
    const aRank = a.total_price ?? a.price;
    const bRank = b.total_price ?? b.price;
    return aRank - bRank;
  });
};

const fetchStoreSearchPage = async (source, query) => {
  const url = source.buildSearchUrl(query);
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
      "User-Agent":
        process.env.CUSTOM_PRICE_USER_AGENT ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    signal: AbortSignal.timeout(CUSTOM_PRICE_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    const error = new Error(`Prisförfrågan misslyckades (${source.name}, ${response.status}).`);
    error.status = response.status;
    throw error;
  }
  const html = await response.text();
  return { url, html };
};

const fetchJinaMirrorTextForUrl = async (url) => {
  const mirrorUrl = buildJinaMirrorUrl(url);
  if (!mirrorUrl) return null;
  const response = await fetch(mirrorUrl, {
    headers: {
      Accept: "text/plain,text/markdown;q=0.9,*/*;q=0.8",
      "User-Agent":
        process.env.CUSTOM_PRICE_USER_AGENT ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(Math.max(CUSTOM_PRICE_REQUEST_TIMEOUT_MS, 18_000)),
  });
  const text = await response.text().catch(() => "");
  const isRateLimited =
    response.status === 429 ||
    /RateLimitTriggeredError/i.test(text) ||
    /"code"\s*:\s*429/i.test(text) ||
    /"status"\s*:\s*42903/i.test(text);
  if (isRateLimited) {
    const error = new Error("JINA_RATE_LIMIT");
    error.status = 429;
    throw error;
  }
  if (!response.ok) return null;
  return text;
};

const fetchTextWithBrowserHeaders = async (url, acceptHeader = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8") => {
  if (!url) return null;
  const response = await fetch(url, {
    headers: {
      Accept: acceptHeader,
      "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "User-Agent":
        process.env.CUSTOM_PRICE_USER_AGENT ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(Math.max(CUSTOM_PRICE_REQUEST_TIMEOUT_MS, 18_000)),
  });
  const text = await response.text().catch(() => "");
  if (response.status === 429) {
    const error = new Error("REMOTE_RATE_LIMIT");
    error.status = 429;
    throw error;
  }
  if (!response.ok) return null;
  return text;
};

const buildDuckDuckGoSiteSearchUrl = (source, query, exact = true) => {
  const domain = sanitizeText(String(source?.siteSearchDomain || ""), 120);
  if (!domain || !query) return null;
  const encodedQuery = encodeURIComponent(exact ? `site:${domain} "${query}"` : `site:${domain} ${query}`);
  return `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
};

const normalizeDuckDuckGoTargetUrl = (value, sourceId) => {
  const decoded = decodeURIComponent(String(value || "").trim());
  if (!decoded) return null;
  const cleaned = decoded.replace(/&rut=.*$/i, "").replace(/&amp;rut=.*$/i, "");
  return normalizeOfferUrlForStore(cleaned, sourceId) || normalizeRelativeUrl(cleaned, cleaned);
};

const fetchDuckDuckGoSiteSearchText = async (source, query) => {
  const urls = [
    buildDuckDuckGoSiteSearchUrl(source, query, true),
    buildDuckDuckGoSiteSearchUrl(source, query, false),
  ].filter(Boolean);
  if (urls.length === 0) return null;
  const texts = (
    await Promise.all(urls.map((url) => fetchJinaMirrorTextForUrl(url).catch(() => null)))
  ).filter((value) => typeof value === "string" && value.trim().length > 0);
  return texts.length > 0 ? texts.join("\n\n") : null;
};

const fetchKomponentkollProductUrlCandidates = async (item) => {
  const cacheKey = sanitizeText(String(item?.id || ""), 120);
  const cached = komponentkollProductSearchCache.get(cacheKey);
  if (
    cached &&
    Number.isFinite(cached.updatedAt) &&
    Date.now() - cached.updatedAt <= CUSTOM_PRICE_CACHE_TTL_MS &&
    Array.isArray(cached.urls)
  ) {
    return cached.urls;
  }

  const queries = buildCatalogSearchQueries(item).slice(0, 3);
  const urls = [];
  const seen = new Set();
  for (const query of queries) {
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:komponentkoll.se/produkt "${query}"`)}`;
    const html = await fetchTextWithBrowserHeaders(ddgUrl).catch(() => null);
    if (!html) continue;
    const matches = html.matchAll(/uddg=([^"&\s>]+)/gi);
    for (const match of matches) {
      const candidateUrl = normalizeRelativeUrl(decodeURIComponent(match[1] || ""), "https://komponentkoll.se");
      if (
        candidateUrl &&
        /^https:\/\/komponentkoll\.se\/produkt\//i.test(candidateUrl) &&
        !seen.has(candidateUrl)
      ) {
        seen.add(candidateUrl);
        urls.push(candidateUrl);
      }
    }
  }

  komponentkollProductSearchCache.set(cacheKey, {
    updatedAt: Date.now(),
    urls,
  });
  return urls;
};

const buildCatalogSearchQueries = (item) => {
  const variants = new Set();
  const addVariant = (value) => {
    const normalized = sanitizeText(String(value || ""), 160)
      .replace(/\s*\([^)]*\)\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (normalized.length >= 3) {
      variants.add(normalized);
    }
  };

  firstArray(item?.searchTerms).forEach((term) => addVariant(term));
  addVariant(item?.name);

  const name = sanitizeText(String(item?.name || ""), 160);
  if (name) {
    addVariant(name.replace(/^AMD\s+/i, ""));
    addVariant(name.replace(/^Intel\s+/i, ""));
    addVariant(name.replace(/^ASUS\s+/i, ""));
    addVariant(name.replace(/^MSI\s+/i, ""));
    addVariant(name.replace(/^Gigabyte\s+/i, ""));
    addVariant(name.replace(/^ASRock\s+/i, ""));
  }

  return Array.from(variants).slice(0, 6);
};

const PRISJAKT_PRODUCT_URL_REGEX = /https?:\/\/www\.prisjakt\.nu\/produkt\.php\?p=\d+/i;
const PRISJAKT_GO_TO_SHOP_URL_REGEX = /https?:\/\/www\.prisjakt\.nu\/go-to-shop\/\d+\/offer\/[^\s)]+/i;
const PRISJAKT_PRODUCT_URL_OVERRIDES = {
  "cpu-lga1700-core-i5-12400f": "https://www.prisjakt.nu/produkt.php?p=5948013",
  "cpu-lga1700-core-i5-14400f": "https://www.prisjakt.nu/produkt.php?p=13219693",
  "mb-am4-msi-b550-tomahawk": "https://www.prisjakt.nu/produkt.php?p=5386548",
  "mb-am5-msi-b650-tomahawk-wifi": "https://www.prisjakt.nu/produkt.php?p=7153870",
  "mb-am4-gigabyte-x570-aorus-elite": "https://www.prisjakt.nu/produkt.php?p=5150976",
  "case-7": "https://www.prisjakt.nu/produkt.php?p=7575012",
  "psu-5": "https://www.prisjakt.nu/produkt.php?p=11649473",
  "psu-7": "https://www.prisjakt.nu/produkt.php?p=7253294",
  "psu-22": "https://www.prisjakt.nu/produkt.php?p=14904366",
  "sto-33": "https://www.prisjakt.nu/produkt.php?p=14671473",
};
const CUSTOM_BUILD_KOMPONENTKOLL_PRODUCT_URL_OVERRIDES = {
  "ram-1": "https://komponentkoll.se/produkt/1383239-corsair-32gb-2x16gb-ddr5-6000mhz-cl36-vengeance-amd-expo",
  "ram-12": "https://komponentkoll.se/produkt/119068-corsair-dominator-platinum-rgb",
  "ram-20": "https://komponentkoll.se/produkt/1461803-corsair-vengeance-rgb-ddr5-6000mhz-2x8gb-cl36-xmp-expo-cmh16gx5m2e6000z36",
  "ram-21": "https://komponentkoll.se/produkt/1373530-corsair-32gb-2x16gb-ddr5-6000mhz-cl36-vengeance-rgb-svart",
  "ram-22": "https://komponentkoll.se/produkt/1383239-corsair-32gb-2x16gb-ddr5-6000mhz-cl36-vengeance-amd-expo",
  "ram-24": "https://komponentkoll.se/produkt/1382458-corsair-32gb-2x16gb-ddr5-6000mhz-cl36-vengeance-rgb-vit",
  "gpu-6": "https://komponentkoll.se/produkt/1442023-pny-geforce-rtx-5060-8gb-oc",
  "gpu-10": "https://komponentkoll.se/produkt/1443086-xfx-swift-amd-radeon-rx-9060-xt-oc-gaming-vit",
  "gpu-14": "https://komponentkoll.se/produkt/1440663-gigabyte-geforce-rtx-5060-ti-aero-oc",
  "gpu-27": "https://komponentkoll.se/produkt/1443417-xfx-radeon-rx-9070-swift-triple-90mm-fan-white",
  "gpu-28": "https://komponentkoll.se/produkt/1434573-sapphire-radeon-rx-9070-pure",
  "gpu-29": "https://komponentkoll.se/produkt/1429085-gigabyte-geforce-rtx-5070-12gb-windforce-oc-sff",
  "gpu-30": "https://komponentkoll.se/produkt/1434758-msi-geforce-rtx-5070-12g-ventus-2x-oc",
  "gpu-36": "https://komponentkoll.se/produkt/1434558-sapphire-radeon-rx-9070-xt-nitro",
  "gpu-37": "https://komponentkoll.se/produkt/1434556-sapphire-radeon-rx-9070-xt-pulse",
  "gpu-38": "https://komponentkoll.se/produkt/1434557-asus-radeon-rx-9070-xt-16gb-tuf-gaming-oc",
  "gpu-39": "https://komponentkoll.se/produkt/1449836-asus-prime-rx-9070-xt-oc-vit",
  "gpu-40": "https://komponentkoll.se/produkt/1434568-asrock-radeon-rx-9070-xt-16gb-steel-legend",
  "gpu-43": "https://komponentkoll.se/produkt/1431384-msi-geforce-rtx-5070-ti-16gb-ventus-3x-oc",
  "gpu-45": "https://komponentkoll.se/produkt/1429090-gigabyte-geforce-rtx-5070-ti-16gb-windforce-oc-sff",
  "gpu-46": "https://komponentkoll.se/produkt/1431295-inno3d-geforce-rtx-5070-ti-16gb-3x-oc-white",
  "gpu-47": "https://komponentkoll.se/produkt/1431531-pny-geforce-rtx-5070-ti-16gb-oc",
  "sto-19": "https://komponentkoll.se/produkt/1438015-crucial-p510-1tb-m-2-nvme-pcie-gen-5",
  "sto-26": "https://komponentkoll.se/produkt/1438016-crucial-p510-2tb-m-2-nvme-pcie-gen-5",
  "sto-27": "https://komponentkoll.se/produkt/1446759-crucial-e100",
  "sto-32": "https://komponentkoll.se/produkt/1441465-crucial-p310",
  "case-9": "https://komponentkoll.se/produkt/1447178-lian-li-o11d-mini-v2-svart",
  "cool-38": "https://komponentkoll.se/produkt/1403822-nzxt-kraken-elite-rgb-v2-360mm-svart",
  "cool-30": "https://komponentkoll.se/produkt/1437073-arctic-liquid-freezer-iii-pro-360-a-rgb-kylare-vit",
  "cool-52": "https://komponentkoll.se/produkt/1392730-arctic-freezer-36",
  "mb-am4-gigabyte-x570-aorus-elite": "https://komponentkoll.se/produkt/105944-gigabyte-x570-aorus-elite-socket-am4",
  "mb-am4-msi-mag-b550m-mortar-wifi": "https://komponentkoll.se/produkt/119236-msi-mag-b550m-mortar-wifi",
  "psu-22": "https://komponentkoll.se/produkt/1441695-cooler-master-mwe-850w-gold-v3-atx-3-1",
};
const CUSTOM_BUILD_STORE_PRODUCT_URL_OVERRIDES = {
  "cpu-am4-ryzen-3-3100": {
    inet: "https://www.inet.se/produkt/5303157/amd-ryzen-3-3100-3-6ghz-18mb",
  },
  "cpu-am4-ryzen-9-5900x": {
    inet: "https://www.inet.se/produkt/5303476/amd-ryzen-9-5900x-3-7-ghz-70mb",
  },
  "cpu-lga1700-core-i5-14400f": {
    inet: "https://www.inet.se/produkt/5306606/intel-core-i5-14400f-2-5-ghz-29-5mb",
  },
};
const CUSTOM_BUILD_MANUAL_STORE_OFFERS = {
  "sto-6": [
    {
      store_id: "proshop",
      store: "Proshop",
      status: "available",
      price: 2537,
      total_price: 2537,
      product_url: "https://www.proshop.se/SSD/WD-Blue-SN580-SSD-2TB-PCIe-40-M2-2280/3199923",
    },
  ],
  "sto-29": [
    {
      store_id: "proshop",
      store: "Proshop",
      status: "available",
      price: 2249,
      total_price: 2249,
      product_url: "https://www.proshop.se/SSD/Crucial-P510-SSD-2TB-Med-vaermespridare-PCIe-50-M2-2280/3337600",
    },
  ],
  "psu-17": [
    {
      store_id: "inet",
      store: "Inet",
      status: "available",
      price: 849,
      total_price: 849,
      product_url: "https://www.inet.se/produkt/6906118/corsair-cx750-750w",
    },
  ],
  "cool-25": [
    {
      store_id: "inet",
      store: "Inet",
      status: "available",
      price: 949,
      total_price: 949,
      product_url: "https://www.inet.se/produkt/5325323/deepcool-le360-v2-vit",
    },
  ],
  "cool-28": [
    {
      store_id: "proshop",
      store: "Proshop",
      status: "available",
      price: 929,
      total_price: 929,
      product_url:
        "https://www.proshop.se/CPU-flaektar/Thermalright-Aqua-Elite-360-V3-White-ARGB-CPU-Vattenkylare-Max-26-dBA/3204313",
    },
  ],
  "psu-7": [
    {
      store_id: "proshop",
      store: "Proshop",
      status: "available",
      price: 1099,
      total_price: 1099,
      product_url: "https://www.proshop.se/Stroemfoersoerjning/ASUS-TUF-GAMING-850G-Stroemfoersoerjning-850-Watt-135-mm-ATX-80-Plus-Gold-certificate/3313654",
    },
  ],
  "psu-22": [
    {
      store_id: "komplett",
      store: "Komplett",
      status: "available",
      price: 1149,
      total_price: 1149,
      product_url: "https://www.komplett.se/product/1325401/datorutrustning/datorkomponenter/nataggregat/nataggregat/cooler-master-mwe-gold-850-v3-psu",
    },
  ],
  "cool-54": [
    {
      store_id: "proshop",
      store: "Proshop",
      status: "available",
      price: 299,
      total_price: 299,
      product_url: "https://www.proshop.se/CPU-flaektar/be-quiet-PURE-ROCK-3-LX-CPU-Luftkylare-Max-31-dBA/3348133",
    },
    {
      store_id: "inet",
      store: "Inet",
      status: "available",
      price: 359,
      total_price: 359,
      product_url: "https://www.inet.se/produkt/5325775/be-quiet-pure-rock-3-lx-black",
    },
    {
      store_id: "dustin",
      store: "Dustin",
      status: "available",
      price: 399,
      total_price: 399,
      product_url: "https://www.dustin.se/product/5020045423/pure-rock-3-lx",
    },
  ],
  "sto-32": [
    {
      store_id: "amazon-se",
      store: "Amazon.se",
      status: "available",
      price: 2900,
      total_price: 2900,
      product_url: "https://www.amazon.se/dp/B0CM8W1S8K",
    },
  ],
  "sto-27": [
    {
      store_id: "elgiganten",
      store: "Elgiganten",
      status: "unavailable",
      price: 2099,
      total_price: 2099,
      product_url:
        "https://www.elgiganten.se/product/gaming/datorkomponenter/intern-lagring/intern-ssd/crucial-e100-intern-m2-gen-4-ssd-2-tb/991845?utm_source=komponentkoll&utm_medium=pricecomp&utm_campaign=komponentkoll_listing",
      availability: "unavailable",
    },
    {
      store_id: "computersalg",
      store: "CSmegastore",
      status: "unavailable",
      price: 2779,
      total_price: 2779,
      product_url: "https://www.computersalg.se/i/24512633/crucial-e100-ssd-2-tb-inbyggd-m-2-2280-pcie-4-0-x4-nvme",
      availability: "unavailable",
    },
  ],
  "cool-30": [
    {
      store_id: "webhallen",
      store: "Webhallen",
      status: "available",
      price: 1199,
      total_price: 1199,
      product_url: "https://www.webhallen.com/se/product/384673",
    },
    {
      store_id: "elgiganten",
      store: "Elgiganten",
      status: "available",
      price: 1199,
      total_price: 1199,
      product_url:
        "https://www.elgiganten.se/product/gaming/datorkomponenter/datorflaktar-kylning/vattenkylning-till-dator/arctic-liquid-freezer-iii-pro-360-a-rgb-cpu-vatskekylare-vit/966783?utm_source=komponentkoll&utm_medium=pricecomp&utm_campaign=komponentkoll_listing",
    },
    {
      store_id: "computersalg",
      store: "CSmegastore",
      status: "available",
      price: 1269,
      total_price: 1269,
      product_url:
        "https://www.csmegastore.se/i/24206202/arctic-liquid-freezer-iii-pro-360-a-rgb-kylsystem-med-v%C3%A4tska-till-processorn-elementstorlek-360-mm-f%C3%B6r-am5-am4-lga1700",
    },
    {
      store_id: "inet",
      store: "Inet",
      status: "available",
      price: 1290,
      total_price: 1290,
      product_url: "https://www.inet.se/produkt/5325385/arctic-liquid-freezer-iii-pro-360-a-rgb-vit",
    },
  ],
  "cool-52": [
    {
      store_id: "proshop",
      store: "Proshop",
      status: "available",
      price: 287,
      total_price: 287,
      product_url: "https://www.proshop.se/CPU-flaektar/Arctic-Freezer-36-CPU-Luftkylare/3235749",
    },
    {
      store_id: "elgiganten",
      store: "Elgiganten",
      status: "available",
      price: 299,
      total_price: 299,
      product_url:
        "https://www.elgiganten.se/product/gaming/datorkomponenter/datorflaktar-kylning/cpu-kylare-flaktar/arctic-freezer-36-cpu-luftkylare/966789?utm_source=komponentkoll&utm_medium=pricecomp&utm_campaign=komponentkoll_listing",
    },
  ],
  "gpu-10": [
    {
      store_id: "komplett",
      store: "Komplett",
      status: "available",
      price: 3790,
      total_price: 3790,
      product_url:
        "https://www.komplett.se/product/1324908/datorutrustning/datorkomponenter/grafikkort/xfx-swift-amd-radeon-rx-9060-xt-oc-gaming-vit?channable=02f53f6964003133323439303862",
    },
    {
      store_id: "proshop",
      store: "Proshop",
      status: "available",
      price: 4451,
      total_price: 4451,
      product_url:
        "https://www.proshop.se/Grafikkort/XFX-Radeon-RX-9060-XT-Swift-Dual-Fan-White-8GB-GDDR6-RAM-Grafikkort/3383869",
    },
  ],
};
const PRISJAKT_ALLOWED_STORE_NAME_TO_ID = new Map(
  [
    ["amazon se", "amazon-se"],
    ["amazon.se", "amazon-se"],
    ["csmegastore", "computersalg"],
    ["csm", "computersalg"],
    ["computersalg", "computersalg"],
    ["dustin", "dustin"],
    ["elgiganten", "elgiganten"],
    ["inet", "inet"],
    ["komplett", "komplett"],
    ["komplett.se", "komplett"],
    ["netonnet", "netonnet"],
    ["proshop", "proshop"],
    ["webhallen", "webhallen"],
  ].map(([name, storeId]) => [normalizeStorePriceQueryKey(name), storeId])
);

const KOMPONENTKOLL_CATEGORY_PATH_BY_CUSTOM_BUILD_CATEGORY = {
  cpu: "komponenter/processor",
  gpu: "komponenter/grafikkort",
  motherboard: "komponenter/moderkort",
  ram: "komponenter/ram",
  storage: "komponenter/ssd",
  case: "komponenter/chassi",
  psu: "komponenter/nataggregat-psu",
  cooling: "komponenter/cpu-kylare",
};

const KOMPONENTKOLL_STORE_NAME_TO_ID = new Map(
  [
    ["amazon", "amazon-se"],
    ["amazon mp", "amazon-se"],
    ["se_amazon_mp", "amazon-se"],
    ["amazon marketplace", "amazon-se"],
    ["csmegastore", "computersalg"],
    ["csm", "computersalg"],
    ["computersalg", "computersalg"],
    ["dustin", "dustin"],
    ["elgiganten", "elgiganten"],
    ["inet", "inet"],
    ["komplett", "komplett"],
    ["netonnet", "netonnet"],
    ["proshop", "proshop"],
    ["webhallen", "webhallen"],
  ].map(([name, storeId]) => [normalizeStorePriceQueryKey(name), storeId])
);

const parseKomponentkollAvailability = (value) => {
  const normalized = normalizeStorePriceQueryKey(value);
  if (!normalized) return null;
  if (
    normalized === "0" ||
    normalized === "no" ||
    normalized === "false" ||
    normalized === "nej" ||
    normalized === "slut" ||
    normalized === "slut-i-lager" ||
    normalized === "out-of-stock" ||
    normalized === "sold-out"
  ) {
    return "unavailable";
  }
  if (
    normalized === "yes" ||
    normalized === "ja" ||
    /^[1-9]\d*$/.test(normalized) ||
    normalized === "in-stock" ||
    normalized === "i-lager"
  ) {
    return "in_stock";
  }
  return null;
};

const CATALOG_VARIANT_PENALTY_TOKENS = [
  { token: "rgb", penalty: 5 },
  { token: "argb", penalty: 5 },
  { token: "white", penalty: 4 },
  { token: "vit", penalty: 4 },
  { token: "black", penalty: 2 },
  { token: "svart", penalty: 2 },
  { token: "wifi", penalty: 3 },
  { token: "tray", penalty: 4 },
  { token: "begagnad", penalty: 6 },
];

const normalizePrisjaktProductUrl = (value) => {
  const normalizedUrl = normalizeRelativeUrl(String(value || "").trim(), String(value || "").trim());
  if (!normalizedUrl) return null;
  const withoutRut = normalizedUrl.replace(/([?&])rut=[^&]+/i, "$1").replace(/[?&]$/g, "");
  return PRISJAKT_PRODUCT_URL_REGEX.test(withoutRut) ? withoutRut : null;
};

const normalizePrisjaktGoToShopUrl = (value) => {
  const normalizedUrl = normalizeRelativeUrl(String(value || "").trim(), String(value || "").trim());
  if (!normalizedUrl) return null;
  return PRISJAKT_GO_TO_SHOP_URL_REGEX.test(normalizedUrl) ? normalizedUrl : null;
};

const decodePrisjaktJsonString = (value) => {
  if (typeof value !== "string") return "";
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value;
  }
};

const decodeHtmlEntities = (value) =>
  String(value || "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

const buildPrisjaktDuckDuckGoSearchUrl = (query, exact = true) => {
  const safeQuery = sanitizeText(String(query || ""), 180);
  if (!safeQuery) return null;
  const encodedQuery = encodeURIComponent(
    exact ? `site:prisjakt.nu/produkt.php "${safeQuery}"` : `site:prisjakt.nu ${safeQuery}`
  );
  return `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
};

const fetchPrisjaktDuckDuckGoSearchText = async (query) => {
  const urls = [
    buildPrisjaktDuckDuckGoSearchUrl(query, true),
    buildPrisjaktDuckDuckGoSearchUrl(query, false),
  ].filter(Boolean);
  if (urls.length === 0) return null;
  const texts = (
    await Promise.all(urls.map((url) => fetchTextWithBrowserHeaders(url).catch(() => null)))
  ).filter((value) => typeof value === "string" && value.trim().length > 0);
  return texts.length > 0 ? texts.join("\n\n") : null;
};

const extractPrisjaktProductUrlsFromDuckDuckGoSearch = (markdown) => {
  if (!markdown || typeof markdown !== "string") return [];
  const urls = [];
  const seen = new Set();
  const redirectRegex = /https?:\/\/(?:duckduckgo\.com|html\.duckduckgo\.com)\/l\/\?uddg=([^\s)]+)/gi;
  let match = redirectRegex.exec(markdown);
  while (match) {
    const decodedUrl = decodeURIComponent(String(match[1] || "").trim());
    const normalizedUrl = normalizePrisjaktProductUrl(decodedUrl);
    if (normalizedUrl && !seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      urls.push(normalizedUrl);
    }
    match = redirectRegex.exec(markdown);
  }
  return urls;
};

const extractPrisjaktProductTitle = (markdown) => {
  const rawTitle =
    String(markdown || "").match(/^Title:\s*(.+)$/m)?.[1] ||
    decodeHtmlEntities(String(markdown || "").match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "") ||
    String(markdown || "").match(/^(.+?),\s*Från\s+[0-9 ]+\s*kr$/m)?.[1] ||
    "";
  return sanitizeText(rawTitle.replace(/,\s*Från\s+[0-9 ]+\s*kr$/i, ""), 240);
};

const scorePrisjaktProductMarkdownForItem = (markdown, item) => {
  const title = extractPrisjaktProductTitle(markdown);
  if (!title) return -1;
  if (!doesCatalogTitleMatchItem(title, item)) {
    return -1;
  }
  const combinedQuery = [item?.name || "", ...firstArray(item?.searchTerms)].join(" ");
  const queryTokens = tokenizeForSearchMatch(combinedQuery);
  const modelTokens = extractModelTokensFromQuery(combinedQuery);
  const alphaTokens = extractAlphaTokensFromQuery(item?.name || "");
  if (!matchesModelTokens(title, modelTokens)) {
    return -1;
  }
  const normalizedTitle = normalizeStorePriceQueryKey(title);
  const normalizedName = normalizeStorePriceQueryKey(combinedQuery);
  if (alphaTokens.length > 0 && !alphaTokens.some((token) => normalizedTitle.includes(token))) {
    return -1;
  }
  let score = scoreTitleAgainstQuery(title, queryTokens);
  if (normalizedTitle === normalizedName) score += 12;
  if (normalizedTitle.includes(normalizedName)) score += 6;
  return score;
};

const scoreCatalogPriceMatch = (expectedPrice, actualPrice) => {
  if (!Number.isFinite(expectedPrice) || expectedPrice <= 0) return 0;
  if (!Number.isFinite(actualPrice) || actualPrice <= 0) return 0;
  const diffRatio = Math.abs(actualPrice - expectedPrice) / expectedPrice;
  if (diffRatio <= 0.12) return 8;
  if (diffRatio <= 0.25) return 5;
  if (diffRatio <= 0.4) return 2;
  if (diffRatio <= 0.7) return -2;
  if (diffRatio <= 1.2) return -6;
  return -12;
};

const scoreCatalogVariantPenalty = (title, item) => {
  const normalizedTitle = normalizeStorePriceQueryKey(title);
  const normalizedReference = normalizeStorePriceQueryKey(
    [item?.name || "", ...firstArray(item?.searchTerms)].join(" ")
  );
  if (!normalizedTitle || !normalizedReference) return 0;
  return CATALOG_VARIANT_PENALTY_TOKENS.reduce((sum, entry) => {
    if (normalizedTitle.includes(entry.token) && !normalizedReference.includes(entry.token)) {
      return sum - entry.penalty;
    }
    return sum;
  }, 0);
};

const scoreCatalogSourceProductForItem = (title, item, price = null) => {
  const safeTitle = sanitizeText(String(title || ""), 240);
  if (!safeTitle || !doesCatalogTitleMatchItem(safeTitle, item)) {
    return -1;
  }
  const combinedQuery = [item?.name || "", ...firstArray(item?.searchTerms)].join(" ");
  const titleScore = scoreTitleAgainstQuery(safeTitle, tokenizeForSearchMatch(combinedQuery));
  const variantPenalty = scoreCatalogVariantPenalty(safeTitle, item);
  return titleScore + variantPenalty;
};

const extractNextDataScriptJson = (html) => {
  if (!html || typeof html !== "string") return null;
  const rawJson = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i)?.[1];
  if (!rawJson) return null;
  try {
    return JSON.parse(rawJson);
  } catch {
    return null;
  }
};

const findBestPrisjaktProductForItem = async (item) => {
  const candidateUrls = [];
  const seenUrls = new Set();
  const overrideUrl = normalizePrisjaktProductUrl(
    PRISJAKT_PRODUCT_URL_MAP[item?.id] || PRISJAKT_PRODUCT_URL_OVERRIDES[item?.id]
  );
  if (overrideUrl) {
    seenUrls.add(overrideUrl);
    candidateUrls.push(overrideUrl);
  }
  const searchQueries = buildCatalogSearchQueries(item);

  for (const searchQuery of searchQueries) {
    const searchText = await fetchPrisjaktDuckDuckGoSearchText(searchQuery);
    const urls = extractPrisjaktProductUrlsFromDuckDuckGoSearch(searchText);
    for (const url of urls) {
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
      candidateUrls.push(url);
      if (candidateUrls.length >= 6) break;
    }
    if (candidateUrls.length >= 6) break;
  }

  let bestCandidate = null;
  for (const url of candidateUrls) {
    const documentText = await fetchTextWithBrowserHeaders(url).catch(() => null);
    if (!documentText) continue;
    const titleScore = scorePrisjaktProductMarkdownForItem(documentText, item);
    if (titleScore < 0) continue;
    const offers = extractStoreOffersFromPrisjaktProductHtml(documentText);
    const lowestOfferPrice =
      offers.length > 0
        ? Math.min(...offers.map((offer) => offer.total_price ?? offer.price).filter((value) => Number.isFinite(value)))
        : null;
    const score = titleScore + scoreCatalogPriceMatch(item?.price, lowestOfferPrice);
    if (!bestCandidate || score > bestCandidate.score) {
      bestCandidate = {
        url,
        markdown: documentText,
        score,
      };
    }
  }

  return bestCandidate;
};

const extractStoreOffersFromPrisjaktProductHtml = (html) => {
  if (!html || typeof html !== "string") return [];
  const offersByStoreId = new Map();
  const offerRegex = /<a href="(https:\/\/www\.prisjakt\.nu\/go-to-shop\/[^"]+)"/gi;
  let match = offerRegex.exec(html);
  while (match) {
    const productUrl = normalizePrisjaktGoToShopUrl(match[1]);
    const segmentEnd = html.indexOf("</li>", match.index);
    const offerSegment = html.slice(match.index, segmentEnd > match.index ? segmentEnd : match.index + 5000);
    const storeName = sanitizeText(
      decodeHtmlEntities(String(offerSegment.match(/StoreInfoTitle[^>]*>([^<]+)</i)?.[1] || "")),
      120
    );
    const storeId = PRISJAKT_ALLOWED_STORE_NAME_TO_ID.get(normalizeStorePriceQueryKey(storeName));
    const price = parseMoneyValue(
      decodeHtmlEntities(String(offerSegment.match(/data-test="PriceLabel"[^>]*>([^<]+)</i)?.[1] || ""))
    );
    if (!storeId || !Number.isFinite(price) || !productUrl) {
      match = offerRegex.exec(html);
      continue;
    }
    const source = CUSTOM_STORE_SOURCE_BY_ID[storeId];
    if (!source) {
      match = offerRegex.exec(html);
      continue;
    }
    const nextOffer = {
      store_id: storeId,
      store: source.name,
      status: "available",
      product_url: productUrl,
      search_url: null,
      price: Math.max(0, Math.round(price)),
      total_price: Math.max(0, Math.round(price)),
      currency: "SEK",
      shipping_price: null,
      availability: "in_stock",
      error: null,
    };
    const currentOffer = offersByStoreId.get(storeId);
    if (!currentOffer || (currentOffer.total_price ?? currentOffer.price) > nextOffer.total_price) {
      offersByStoreId.set(storeId, nextOffer);
    }
    match = offerRegex.exec(html);
  }

  const priceObjectRegex =
    /"__typename":"Price","shopOfferId":"[^"]+","name":"((?:\\.|[^"\\])*)","externalUri":"((?:\\.|[^"\\])*)","primaryMarket":[\s\S]*?"price":\{"inclShipping":(null|-?\d+(?:\.\d+)?),"exclShipping":(null|-?\d+(?:\.\d+)?),"originalCurrency":"[^"]*"\}[\s\S]*?"store":\{"id":\d+,"name":"((?:\\.|[^"\\])*)"/gi;
  match = priceObjectRegex.exec(html);
  while (match) {
    const offerName = sanitizeText(decodePrisjaktJsonString(match[1]), 180);
    const productUrl = normalizePrisjaktGoToShopUrl(decodePrisjaktJsonString(match[2]));
    const inclShippingPrice = Number(match[3]);
    const exclShippingPrice = Number(match[4]);
    const storeName = sanitizeText(decodePrisjaktJsonString(match[5]), 120);
    const storeId = PRISJAKT_ALLOWED_STORE_NAME_TO_ID.get(normalizeStorePriceQueryKey(storeName));
    const source = storeId ? CUSTOM_STORE_SOURCE_BY_ID[storeId] : null;
    const price = Number.isFinite(inclShippingPrice)
      ? inclShippingPrice
      : Number.isFinite(exclShippingPrice)
        ? exclShippingPrice
        : null;
    if (!storeId || !source || !Number.isFinite(price)) {
      match = priceObjectRegex.exec(html);
      continue;
    }
    const nextOffer = {
      store_id: storeId,
      store: source.name,
      status: "available",
      product_url: productUrl,
      search_url: productUrl ? null : source.buildSearchUrl(offerName || storeName),
      price: Math.max(0, Math.round(price)),
      total_price: Math.max(0, Math.round(price)),
      currency: "SEK",
      shipping_price: null,
      availability: "in_stock",
      error: null,
    };
    const currentOffer = offersByStoreId.get(storeId);
    if (!currentOffer || (currentOffer.total_price ?? currentOffer.price) > nextOffer.total_price) {
      offersByStoreId.set(storeId, nextOffer);
    }
    match = priceObjectRegex.exec(html);
  }

  return sortCatalogStoreOffers(Array.from(offersByStoreId.values()));
};

const getKomponentkollCategoryProducts = async (category) => {
  const categoryPath = firstText(KOMPONENTKOLL_CATEGORY_PATH_BY_CUSTOM_BUILD_CATEGORY[category]);
  if (!categoryPath) return [];
  const cached = komponentkollCategoryCache.get(category);
  if (
    cached &&
    Number.isFinite(cached.updatedAt) &&
    Date.now() - cached.updatedAt <= CUSTOM_PRICE_CACHE_TTL_MS &&
    Array.isArray(cached.products)
  ) {
    return cached.products;
  }
  const url = `https://komponentkoll.se/${categoryPath}`;
  const html = await fetchTextWithBrowserHeaders(url).catch(() => null);
  const nextData = extractNextDataScriptJson(html);
  const products = Array.isArray(nextData?.props?.initialProps?.pageProps?.fullCategoryData?.products)
    ? nextData.props.initialProps.pageProps.fullCategoryData.products
    : [];
  komponentkollCategoryCache.set(category, {
    updatedAt: Date.now(),
    products,
  });
  return products;
};

const normalizeKomponentkollStoreId = (value) => {
  const normalized = normalizeStorePriceQueryKey(value);
  return KOMPONENTKOLL_STORE_NAME_TO_ID.get(normalized) || null;
};

const buildKomponentkollThumbnailUrl = (productId) => {
  const normalizedId = sanitizeText(String(productId || ""), 40).replace(/[^\d]/g, "");
  return normalizedId ? `https://komponentkoll.se/api/thumbnail/240/${normalizedId}.jpg` : null;
};

const extractKomponentkollProductIdFromUrl = (url) => {
  const normalizedUrl = firstText(url);
  if (!normalizedUrl) return null;
  const directMatch = normalizedUrl.match(/\/produkt\/(\d+)(?:[-/]|$)/i);
  if (directMatch?.[1]) {
    return directMatch[1];
  }
  try {
    const parsed = new URL(normalizedUrl);
    const pathMatch = parsed.pathname.match(/\/produkt\/(\d+)(?:[-/]|$)/i);
    return pathMatch?.[1] || null;
  } catch {
    return null;
  }
};

const findBestKomponentkollProductForItem = async (item) => {
  const overrideUrl = normalizeRelativeUrl(
    firstText(CUSTOM_BUILD_KOMPONENTKOLL_PRODUCT_URL_OVERRIDES[item?.id]),
    "https://komponentkoll.se"
  );
  const overrideProductId = extractKomponentkollProductIdFromUrl(overrideUrl);
  if (overrideUrl) {
    return {
      title: sanitizeText(String(item?.name || ""), 240),
      lowest_price: null,
      product_url: overrideUrl,
      product_id: overrideProductId,
      image_url: buildKomponentkollThumbnailUrl(overrideProductId),
      score: Number.MAX_SAFE_INTEGER,
    };
  }

  const category = getCustomBuildCategoryForItem(item);
  const products = await getKomponentkollCategoryProducts(category);
  let bestCandidate = null;
  for (const product of Array.isArray(products) ? products : []) {
    const title = sanitizeText(String(product?.name || ""), 240);
    const uriTitle = sanitizeText(String(product?.uri || "").replace(/[-_]+/g, " "), 280);
    const lowestPrice = parseMoneyValue(product?.price, product?.lowestPrice?.amount);
    const score = scoreCatalogSourceProductForItem(`${title} ${uriTitle}`.trim(), item, lowestPrice);
    if (score < 0) continue;
    const productUrl = firstText(product?.uri)
      ? `https://komponentkoll.se/produkt/${sanitizeText(String(product.uri), 240)}`
      : null;
    const candidate = {
      title,
      lowest_price: Number.isFinite(lowestPrice) ? Math.max(0, Math.round(lowestPrice)) : null,
      product_url: productUrl,
      product_id: sanitizeText(String(product?.id || ""), 40),
      image_url:
        product?.has_thumb && firstText(product?.id)
          ? buildKomponentkollThumbnailUrl(product.id)
          : null,
      score,
    };
    if (
      !bestCandidate ||
      candidate.score > bestCandidate.score ||
      (candidate.score === bestCandidate.score &&
        Number.isFinite(candidate.lowest_price) &&
        (!Number.isFinite(bestCandidate.lowest_price) || candidate.lowest_price < bestCandidate.lowest_price))
    ) {
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
};

const extractStoreOffersFromKomponentkollProductHtml = (html, item, sourceUrl = "") => {
  const nextData = extractNextDataScriptJson(html);
  const product = nextData?.props?.initialProps?.pageProps?.product;
  const productTitleForMatch = `${firstText(product?.name)} ${buildTitleFromProductUrl(sourceUrl)}`.trim();
  if (!product || !doesCatalogTitleMatchItem(productTitleForMatch, item)) {
    return [];
  }

  const rawPrices = Array.isArray(product?.prices) ? product.prices : [];
  const offersByStoreId = new Map();
  rawPrices.forEach((entry) => {
    const normalizedStoreId = normalizeKomponentkollStoreId(
      firstText(entry?.store?.name, entry?.store?.title, entry?.name)
    );
    if (!normalizedStoreId) return;
    const source = CUSTOM_STORE_SOURCE_BY_ID[normalizedStoreId];
    if (!source) return;
    const price = parseMoneyValue(entry?.totalprice, entry?.price);
    if (!Number.isFinite(price)) return;

    const rawUrl = firstText(entry?.store?.url, entry?.url);
    const productUrl = normalizeCatalogProductUrl(
      normalizeRelativeUrl(rawUrl, "https://komponentkoll.se"),
      normalizedStoreId
    );
    const offerTitle = firstText(entry?.name, entry?.title, product?.name, source.name);
    if (!matchesOfferToItemModel(normalizedStoreId, item, offerTitle, productUrl)) {
      return;
    }
    const offer = sanitizeCatalogStoreOffer(
      {
        store_id: normalizedStoreId,
        store: source.name,
        status: "available",
        trusted_source: "komponentkoll",
        product_url: productUrl,
        search_url: null,
        price,
        total_price: price,
        currency: "SEK",
        shipping_price: null,
        availability: parseKomponentkollAvailability(firstText(entry?.stock)),
      },
      source,
      item
    );
    if (!isCatalogStoreOfferUseful(offer)) return;
    const current = offersByStoreId.get(normalizedStoreId);
    if (!current || (current.total_price ?? current.price) > (offer.total_price ?? offer.price)) {
      offersByStoreId.set(normalizedStoreId, offer);
    }
  });

  return sortCatalogStoreOffers(Array.from(offersByStoreId.values()));
};

const extractKomponentkollReferencePriceFromHtml = (html, item, sourceUrl = "") => {
  const nextData = extractNextDataScriptJson(html);
  const product = nextData?.props?.initialProps?.pageProps?.product;
  const productTitleForMatch = `${firstText(product?.name)} ${buildTitleFromProductUrl(sourceUrl)}`.trim();
  if (!product || !doesCatalogTitleMatchItem(productTitleForMatch, item)) {
    return null;
  }

  const rawPrices = Array.isArray(product?.prices) ? product.prices : [];
  const parsedPrices = rawPrices
    .map((entry) => parseMoneyValue(entry?.totalprice, entry?.price))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (parsedPrices.length > 0) {
    return Math.min(...parsedPrices);
  }

  const aggregateLowPrice = parseMoneyValue(product?.price, product?.lowestPrice?.amount);
  if (Number.isFinite(aggregateLowPrice) && aggregateLowPrice > 0) {
    return aggregateLowPrice;
  }

  const productLdJsonMatches = [...String(html || "").matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  for (const match of productLdJsonMatches) {
    try {
      const payload = JSON.parse(match[1]);
      const lowPrice = parseMoneyValue(payload?.offers?.lowPrice, payload?.offers?.price);
      if (Number.isFinite(lowPrice) && lowPrice > 0) {
        return lowPrice;
      }
    } catch {}
  }

  return null;
};

const findBestPriceRunnerProductForItem = async (item) => {
  const searchQueries = buildCatalogSearchQueries(item);
  let bestCandidate = null;

  for (const query of searchQueries) {
    const cacheKey = normalizeStorePriceQueryKey(query);
    let page = priceRunnerSearchCache.get(cacheKey);
    if (!page || !Number.isFinite(page.updatedAt) || Date.now() - page.updatedAt > CUSTOM_PRICE_CACHE_TTL_MS) {
      const url = `https://www.pricerunner.se/results?q=${encodeURIComponent(query)}`;
      const html = await fetchTextWithBrowserHeaders(url).catch(() => null);
      const script = html
        ? [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)]
            .map((match) => match[1])
            .find((value) => value.includes("__INITIAL_STATE__"))
        : null;
      let products = [];
      if (script) {
        try {
          const data = JSON.parse(script);
          products =
            data?.__DEHYDRATED_QUERY_STATE?.queries?.find?.((entry) =>
              Array.isArray(entry?.queryKey) && entry.queryKey[0] === "serp-search"
            )?.state?.data?.pages?.[0]?.products || [];
        } catch {
          products = [];
        }
      }
      page = {
        updatedAt: Date.now(),
        products: Array.isArray(products) ? products : [],
      };
      priceRunnerSearchCache.set(cacheKey, page);
    }

    for (const product of firstArray(page?.products)) {
      const title = sanitizeText(String(product?.name || ""), 240);
      const lowestPrice = parseMoneyValue(product?.lowestPrice?.amount, product?.cheapestOffer?.price?.amount);
      const score = scoreCatalogSourceProductForItem(title, item, lowestPrice);
      if (score < 0) continue;
      const candidate = {
        title,
        lowest_price: Number.isFinite(lowestPrice) ? Math.max(0, Math.round(lowestPrice)) : null,
        product_url: firstText(product?.url) ? normalizeRelativeUrl(product.url, "https://www.pricerunner.se") : null,
        score,
      };
      if (
        !bestCandidate ||
        candidate.score > bestCandidate.score ||
        (candidate.score === bestCandidate.score &&
          Number.isFinite(candidate.lowest_price) &&
          (!Number.isFinite(bestCandidate.lowest_price) || candidate.lowest_price < bestCandidate.lowest_price))
      ) {
        bestCandidate = candidate;
      }
    }
  }

  if (bestCandidate) {
    return bestCandidate;
  }

  const siteSearchCandidates = await fetchKomponentkollProductUrlCandidates(item).catch(() => []);
  for (const candidateUrl of siteSearchCandidates) {
    const html = await fetchTextWithBrowserHeaders(candidateUrl).catch(() => null);
    const product = extractNextDataScriptJson(html)?.props?.initialProps?.pageProps?.product;
    const title = sanitizeText(String(product?.name || ""), 240);
    const score = scoreCatalogSourceProductForItem(`${title} ${candidateUrl}`.trim(), item);
    if (score < 0) continue;
    const candidate = {
      title,
      lowest_price: parseMoneyValue(product?.lowestPrice?.amount, product?.lowestprice, product?.price),
      product_url: candidateUrl,
      score,
    };
    if (!bestCandidate || candidate.score > bestCandidate.score) {
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
};

const extractStoreOfferFromDuckDuckGoSearch = (markdown, source, query, referencePrice = null) => {
  if (!markdown || typeof markdown !== "string") return null;
  const queryTokens = tokenizeForSearchMatch(query);
  const modelTokens = extractModelTokensFromQuery(query);
  const candidates = [];
  const fallbackCandidates = [];
  const urlOnlyFallbackCandidates = [];
  const redirectRegex = /https?:\/\/duckduckgo\.com\/l\/\?uddg=([^\s)]+)/gi;
  let match = redirectRegex.exec(markdown);
  while (match) {
    const normalizedUrl = normalizeDuckDuckGoTargetUrl(match[1], source.id);
    if (!normalizedUrl) {
      match = redirectRegex.exec(markdown);
      continue;
    }
    if (!isLikelyProductUrlForStore(normalizedUrl, source.id)) {
      match = redirectRegex.exec(markdown);
      continue;
    }
    const snippetIndex = markdown.indexOf(match[0]);
    const snippet =
      snippetIndex >= 0
        ? markdown.slice(Math.max(0, snippetIndex - 240), Math.min(markdown.length, snippetIndex + 1200))
        : markdown;
    const title = buildTitleFromProductUrl(normalizedUrl);
    if (isLikelyPrebuiltOrBundleOffer(title, normalizedUrl)) {
      match = redirectRegex.exec(markdown);
      continue;
    }
    const combinedTitle = `${title} ${snippet.slice(0, 200)} ${normalizedUrl}`;
    const modelMatch = matchesOfferToQueryModel(source.id, modelTokens, combinedTitle, normalizedUrl);
    const titleScore = scoreTitleAgainstQuery(combinedTitle, queryTokens);
    const prices = extractPriceCandidatesFromText(snippet);
    const pickedPrice = pickBestPriceCandidate(prices, snippet, referencePrice);
    const candidate = {
      store: source.name,
      title: title || source.name,
      price: Number.isFinite(pickedPrice) ? Math.max(0, Math.round(pickedPrice)) : null,
      currency: "SEK",
      shipping_price: null,
      total_price: Number.isFinite(pickedPrice) ? Math.max(0, Math.round(pickedPrice)) : null,
      product_url: normalizedUrl,
      availability: null,
      _score: titleScore,
      _distance: Number.isFinite(referencePrice) && Number.isFinite(pickedPrice) ? Math.abs(pickedPrice - referencePrice) : 0,
    };
    if (matchesModelTokens(`${title} ${normalizedUrl}`, modelTokens)) {
      urlOnlyFallbackCandidates.push(candidate);
    }
    if (modelMatch && titleScore > 0) {
      candidates.push(candidate);
    } else if (modelMatch || matchesModelTokens(combinedTitle, modelTokens)) {
      fallbackCandidates.push(candidate);
    }
    match = redirectRegex.exec(markdown);
  }

  const rankedCandidates =
    candidates.length > 0
      ? candidates
      : fallbackCandidates.length > 0
      ? fallbackCandidates
      : urlOnlyFallbackCandidates;
  if (rankedCandidates.length === 0) return null;
  rankedCandidates.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    if ((a._distance || 0) !== (b._distance || 0)) return (a._distance || 0) - (b._distance || 0);
    if (Number.isFinite(a.price) && Number.isFinite(b.price)) return a.price - b.price;
    if (Number.isFinite(a.price)) return -1;
    if (Number.isFinite(b.price)) return 1;
    return 0;
  });
  return rankedCandidates[0];
};

const fetchStoreOfferForQuery = async (source, query, referencePrice = null) => {
  const searchUrl = source.buildSearchUrl(query);
  const modelTokens = extractModelTokensFromQuery(query);
  let html = "";
  try {
    const fetched = await fetchStoreSearchPage(source, query);
    html = fetched.html;
  } catch (error) {
    logStructured("warn", "custom_price_store_fetch_failed", {
      store: source.name,
      query,
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }

  try {
    if (html && source.id === "amazon-se") {
      const amazonOffer = extractAmazonOfferFromSearchHtml(html, query, referencePrice);
      if (amazonOffer) {
        return amazonOffer;
      }
    }
    if (html) {
      const parsedOffers = extractStoreOffersFromJsonLd(html, source.name, searchUrl);
      const normalizedFromJsonLd = normalizeStoreOfferList(parsedOffers)
        .map((offer) => ({
          ...offer,
          product_url: normalizeOfferUrlForStore(offer.product_url, source.id),
        }))
        .filter((offer) => offer.price >= 50 && offer.price <= 400_000)
        .filter((offer) => isOfferWithinReferencePrice(offer.price, referencePrice))
        .filter((offer) => !isLikelyPrebuiltOrBundleOffer(offer.title, offer.product_url))
        .filter((offer) => matchesOfferToQueryModel(source.id, modelTokens, offer.title, offer.product_url))
        .filter((offer) => (offer.product_url ? isLikelyProductUrlForStore(offer.product_url, source.id) : false));
      if (normalizedFromJsonLd.length > 0) {
        return {
          ...normalizedFromJsonLd[0],
          store: source.name,
        };
      }
    }

    const jinaSearchText = await fetchJinaMirrorTextForUrl(searchUrl);
    if (jinaSearchText) {
      const jinaOffer = extractStoreOfferFromJinaSearch(
        jinaSearchText,
        source,
        query,
        referencePrice,
        searchUrl
      );
      if (jinaOffer) {
        return jinaOffer;
      }
    }

    const duckDuckGoSearchText = await fetchDuckDuckGoSiteSearchText(source, query);
    if (duckDuckGoSearchText) {
      const duckDuckGoOffer = extractStoreOfferFromDuckDuckGoSearch(
        duckDuckGoSearchText,
        source,
        query,
        referencePrice
      );
      if (duckDuckGoOffer) {
        return duckDuckGoOffer;
      }
    }

    return null;
  } catch (error) {
    logStructured("warn", "custom_price_store_fetch_failed", {
      store: source.name,
      query,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return null;
  }
};

const extractAvailabilityFromPageText = (value) => {
  const text = String(value || "").toLowerCase();
  if (!text) return null;
  if (/no featured offers available|out of stock|ej i lager|slut i lager|not available|sold out/.test(text)) {
    return "unavailable";
  }
  if (/in stock|i lager|leverans|k.p|kop/i.test(text)) {
    return "in_stock";
  }
  return null;
};

const extractDirectProductOfferFromHtml = (html, source, productUrl, item) => {
  if (!html || !source || !productUrl || !item) return null;
  const parsedOffers = normalizeStoreOfferList(extractStoreOffersFromJsonLd(html, source.name, productUrl))
    .map((offer) => ({
      ...offer,
      product_url: normalizeOfferUrlForStore(offer.product_url || productUrl, source.id),
    }))
    .filter((offer) => offer.product_url && isLikelyProductUrlForStore(offer.product_url, source.id))
    .filter((offer) => !isLikelyPrebuiltOrBundleOffer(offer.title, offer.product_url))
    .filter((offer) => matchesOfferToItemModel(source.id, item, offer.title, offer.product_url))
    .filter((offer) => isOfferWithinReferencePrice(offer.total_price ?? offer.price, item.price));
  if (parsedOffers.length > 0) {
    return {
      ...parsedOffers[0],
      store_id: source.id,
      status: "available",
      product_url: productUrl,
    };
  }
  return null;
};

const extractDirectProductOfferFromMarkdown = (markdown, source, productUrl, item) => {
  if (!markdown || !source || !productUrl || !item) return null;
  if (isLikelyPrebuiltOrBundleOffer(item.name, productUrl)) return null;
  const title = buildTitleFromProductUrl(productUrl);
  if (!matchesOfferToItemModel(source.id, item, title || item.name, productUrl)) {
    return null;
  }
  const prices = extractPriceCandidatesFromText(markdown);
  const pickedPrice = pickBestPriceCandidate(prices, markdown, item.price);
  const availability = extractAvailabilityFromPageText(markdown);
  if (!Number.isFinite(pickedPrice)) {
    return {
      store_id: source.id,
      store: source.name,
      price: null,
      currency: "SEK",
      shipping_price: null,
      total_price: null,
      product_url: productUrl,
      availability,
      status: availability === "unavailable" ? "unavailable" : "linked_no_price",
    };
  }
  return {
    store_id: source.id,
    store: source.name,
    price: Math.max(0, Math.round(pickedPrice)),
    currency: "SEK",
    shipping_price: null,
    total_price: Math.max(0, Math.round(pickedPrice)),
    product_url: productUrl,
    availability,
    status: availability === "unavailable" ? "unavailable" : "available",
  };
};

const fetchDirectProductOffer = async (item, source, discoveredOffer = null) => {
  const productUrl = normalizeOfferUrlForStore(
    firstText(discoveredOffer?.product_url),
    source.id
  );
  if (!productUrl) {
    return {
      store_id: source.id,
      store: source.name,
      status: "not_found",
      product_url: null,
      price: null,
      total_price: null,
      currency: "SEK",
      shipping_price: null,
      availability: null,
    };
  }

  try {
    let html = "";
    try {
      const response = await fetch(productUrl, {
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
          "User-Agent":
            process.env.CUSTOM_PRICE_USER_AGENT ||
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        signal: AbortSignal.timeout(CUSTOM_PRICE_REQUEST_TIMEOUT_MS),
      });
      if (response.ok) {
        html = await response.text();
      }
    } catch (error) {
      html = "";
    }

    if (html) {
      const directHtmlOffer = extractDirectProductOfferFromHtml(html, source, productUrl, item);
      if (directHtmlOffer) {
        return directHtmlOffer;
      }
    }

    const jinaPageText = await fetchJinaMirrorTextForUrl(productUrl);
    if (jinaPageText) {
      const directMarkdownOffer = extractDirectProductOfferFromMarkdown(jinaPageText, source, productUrl, item);
      if (directMarkdownOffer) {
        if (!Number.isFinite(directMarkdownOffer.price) && Number.isFinite(discoveredOffer?.total_price ?? discoveredOffer?.price)) {
          return {
            ...directMarkdownOffer,
            price: Math.max(0, Math.round(discoveredOffer.total_price ?? discoveredOffer.price)),
            total_price: Math.max(0, Math.round(discoveredOffer.total_price ?? discoveredOffer.price)),
            status: "available",
          };
        }
        return directMarkdownOffer;
      }
    }

    if (Number.isFinite(discoveredOffer?.total_price ?? discoveredOffer?.price)) {
      const fallbackPrice = Math.max(0, Math.round(discoveredOffer.total_price ?? discoveredOffer.price));
      return {
        store_id: source.id,
        store: source.name,
        status: "available",
        product_url: productUrl,
        price: fallbackPrice,
        total_price: fallbackPrice,
        currency: "SEK",
        shipping_price: null,
        availability: null,
      };
    }

    return {
      store_id: source.id,
      store: source.name,
      status: "linked_no_price",
      product_url: productUrl,
      price: null,
      total_price: null,
      currency: "SEK",
      shipping_price: null,
      availability: null,
    };
  } catch (error) {
    return {
      store_id: source.id,
      store: source.name,
      status: "error",
      product_url: productUrl,
      price: null,
      total_price: null,
      currency: "SEK",
      shipping_price: null,
      availability: null,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
};

const sanitizeStorePriceResponse = (query, offers, updatedAt) => {
  const normalizedOffers = normalizeStoreOfferList(offers).slice(0, 30);
  return {
    ok: true,
    query,
    source: "custom-store-scraper",
    updated_at: new Date(updatedAt).toISOString(),
    next_refresh_at: new Date(updatedAt + CUSTOM_PRICE_REFRESH_INTERVAL_MS).toISOString(),
    products: [
      {
        product_id: normalizeStorePriceQueryKey(query).replace(/\s+/g, "-") || "unknown-product",
        title: query,
        offers: normalizedOffers,
      },
    ],
  };
};

const countOffersInStoreSnapshot = (snapshot) => {
  if (!snapshot || typeof snapshot !== "object") return 0;
  const products = Array.isArray(snapshot.products) ? snapshot.products : [];
  return products.reduce((sum, product) => {
    const offers = Array.isArray(product?.offers) ? product.offers : [];
    return sum + offers.length;
  }, 0);
};

const saveCustomStorePriceCacheToDisk = async () => {
  const serializedEntries = Array.from(customStorePriceCache.entries()).map(([key, value]) => ({
    key,
    query: value.query,
    tracked: Boolean(value.tracked),
    updatedAt: value.updatedAt,
    response: value.response,
  }));
  const payload = {
    version: 1,
    saved_at: new Date().toISOString(),
    entries: serializedEntries,
  };
  await fs.mkdir(path.dirname(CUSTOM_PRICE_CACHE_FILE), { recursive: true });
  await fs.writeFile(CUSTOM_PRICE_CACHE_FILE, JSON.stringify(payload, null, 2), "utf8");
};

const queueCustomStorePriceCacheSave = () => {
  customStorePriceCacheWriteChain = customStorePriceCacheWriteChain
    .catch(() => null)
    .then(() => saveCustomStorePriceCacheToDisk())
    .catch((error) => {
      logStructured("warn", "custom_price_cache_save_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    });
  return customStorePriceCacheWriteChain;
};

const loadCustomStorePriceCacheFromDisk = async () => {
  try {
    const raw = await fs.readFile(CUSTOM_PRICE_CACHE_FILE, "utf8");
    const payload = raw ? JSON.parse(raw) : {};
    const entries = Array.isArray(payload?.entries) ? payload.entries : [];
    entries.forEach((entry) => {
      const rawKey = sanitizeText(String(entry?.key || ""), 240);
      const expectedPrefix = `${CUSTOM_STORE_PRICE_CACHE_VERSION}:`;
      if (rawKey.includes(":") && !rawKey.startsWith(expectedPrefix)) {
        return;
      }
      const key = rawKey.startsWith(expectedPrefix)
        ? rawKey
        : buildStorePriceCacheKey(entry?.query || "");
      const query = sanitizeText(String(entry?.query || ""), CUSTOM_PRICE_MAX_QUERY_LENGTH);
      const updatedAt = Number(entry?.updatedAt || Date.now());
      if (!key || !query || !entry?.response) return;
      customStorePriceCache.set(key, {
        query,
        updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
        tracked: Boolean(entry?.tracked),
        response: entry.response,
      });
    });
  } catch (error) {
    const code = error?.code || "";
    if (code !== "ENOENT") {
      logStructured("warn", "custom_price_cache_load_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }
};

const refreshStoreOffersForQuery = async (query, referencePrice = null) => {
  const offers = (
    await Promise.all(
      CUSTOM_STORE_SOURCES.map((source) => fetchStoreOfferForQuery(source, query, referencePrice))
    )
  ).filter(Boolean);
  return offers;
};

const getOrRefreshStorePriceSnapshot = async (query, options = {}) => {
  const safeQuery = sanitizeText(query, CUSTOM_PRICE_MAX_QUERY_LENGTH);
  const queryKey = buildStorePriceCacheKey(safeQuery);
  const referencePrice = Number.isFinite(Number(options?.referencePrice))
    ? Math.max(0, Number(options.referencePrice))
    : null;
  if (!queryKey || safeQuery.length < 2) {
    throw new Error("INVALID_QUERY");
  }

  const now = Date.now();
  const forceRefresh = Boolean(options?.forceRefresh);
  const markTracked = options?.markTracked !== false;
  const cached = customStorePriceCache.get(queryKey);
  const cachedOfferCount = countOffersInStoreSnapshot(cached?.response);
  const maxAgeForCache = cachedOfferCount > 0 ? CUSTOM_PRICE_CACHE_TTL_MS : CUSTOM_PRICE_EMPTY_CACHE_TTL_MS;
  if (
    cached &&
    !forceRefresh &&
    Number.isFinite(cached.updatedAt) &&
    now - cached.updatedAt <= maxAgeForCache
  ) {
    if (markTracked && !cached.tracked) {
      cached.tracked = true;
      customStorePriceCache.set(queryKey, cached);
      queueCustomStorePriceCacheSave();
    }
    return cached.response;
  }

  if (!forceRefresh && customStorePriceRefreshInFlight.has(queryKey)) {
    return customStorePriceRefreshInFlight.get(queryKey);
  }

  const refreshPromise = (async () => {
    const refreshedAt = Date.now();
    const offers = await refreshStoreOffersForQuery(safeQuery, referencePrice);
    const freshResponse = sanitizeStorePriceResponse(safeQuery, offers, refreshedAt);
    const freshOfferCount = countOffersInStoreSnapshot(freshResponse);
    const shouldKeepCachedOffers =
      freshOfferCount === 0 &&
      cachedOfferCount > 0 &&
      Boolean(cached?.response);
    const response = shouldKeepCachedOffers ? cached.response : freshResponse;
    const updatedAt = shouldKeepCachedOffers ? cached.updatedAt : refreshedAt;
    const nextEntry = {
      query: safeQuery,
      updatedAt,
      tracked: markTracked || Boolean(cached?.tracked),
      response,
    };
    customStorePriceCache.set(queryKey, nextEntry);
    queueCustomStorePriceCacheSave();
    return response;
  })().finally(() => {
    customStorePriceRefreshInFlight.delete(queryKey);
  });

  customStorePriceRefreshInFlight.set(queryKey, refreshPromise);
  return refreshPromise;
};

const refreshTrackedStoreQueries = async () => {
  const trackedQueries = new Set(
    CUSTOM_PRICE_TRACKED_QUERIES.map((entry) => sanitizeText(entry, CUSTOM_PRICE_MAX_QUERY_LENGTH)).filter(Boolean)
  );
  customStorePriceCache.forEach((entry) => {
    if (entry?.tracked && entry?.query) {
      trackedQueries.add(sanitizeText(entry.query, CUSTOM_PRICE_MAX_QUERY_LENGTH));
    }
  });

  for (const query of trackedQueries) {
    try {
      await getOrRefreshStorePriceSnapshot(query, { forceRefresh: true, markTracked: true });
    } catch (error) {
      logStructured("warn", "custom_price_refresh_failed", {
        query,
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }
};

const startCustomStorePriceScheduler = async () => {
  if (customStorePriceSchedulerStarted) return;
  customStorePriceSchedulerStarted = true;
  await loadCustomStorePriceCacheFromDisk();
  setTimeout(() => {
    refreshTrackedStoreQueries().catch((error) => {
      logStructured("warn", "custom_price_initial_refresh_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    });
  }, 10_000);
  const timer = setInterval(() => {
    refreshTrackedStoreQueries().catch((error) => {
      logStructured("warn", "custom_price_scheduled_refresh_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    });
  }, CUSTOM_PRICE_REFRESH_INTERVAL_MS);
  if (typeof timer?.unref === "function") {
    timer.unref();
  }
};

const buildCustomBuildProductCacheKey = (itemId) =>
  `${CUSTOM_BUILD_PRODUCT_CACHE_VERSION}:${sanitizeText(String(itemId || ""), 120)}`;

const normalizeCatalogProductUrl = (value, sourceId) =>
  normalizePrisjaktGoToShopUrl(value) ||
  normalizeOfferUrlForStore(firstText(value), sourceId) ||
  firstText(value) ||
  null;

const shouldBypassCatalogPriceRangeValidation = (item, trustedSource) => {
  return TRUSTED_CATALOG_REFERENCE_SOURCES.has(trustedSource);
};

const buildCatalogFallbackStoreOffers = (item, updatedAt) => {
  if (!item) return [];
  const directLinkStoreIds = Object.keys(CUSTOM_BUILD_STORE_PRODUCT_URL_OVERRIDES[item.id] || {}).slice(0, 5);
  const updatedAtIso = new Date(updatedAt).toISOString();

  return directLinkStoreIds
    .map((storeId) => CURATED_CUSTOM_BUILD_STORE_SOURCES.find((source) => source.id === storeId))
    .filter(Boolean)
    .map((source) => {
      const directProductUrl = normalizeCatalogProductUrl(
        firstText(CUSTOM_BUILD_STORE_PRODUCT_URL_OVERRIDES[item.id]?.[source.id]),
        source.id
      );
      if (!directProductUrl) return null;
      return sanitizeCatalogStoreOffer(
        {
          store_id: source.id,
          store: source.name,
          status: "linked_no_price",
          product_url: directProductUrl,
          search_url: null,
          updated_at: updatedAtIso,
        },
        source,
        item
      );
    })
    .filter((offer) => Boolean(offer?.product_url || offer?.search_url));
};

const sanitizeCatalogStoreOffer = (offer, source, item = null) => {
  const normalizedPrice = parseMoneyValue(offer?.price);
  const normalizedTotalPrice = parseMoneyValue(offer?.total_price);
  const effectivePrice =
    normalizedTotalPrice !== null ? normalizedTotalPrice : normalizedPrice !== null ? normalizedPrice : null;
  const trustedSource = sanitizeText(String(offer?.trusted_source || ""), 40).toLowerCase();
  const storeProductUrlOverride = firstText(
    CUSTOM_BUILD_STORE_PRODUCT_URL_OVERRIDES[item?.id]?.[source?.id]
  );
  const productUrl =
    normalizeCatalogProductUrl(storeProductUrlOverride, source?.id) ||
    normalizeCatalogProductUrl(offer?.product_url, source?.id);
  const searchUrl = productUrl ? null : firstText(offer?.search_url) || null;
  const hasReasonablePrice =
    effectivePrice === null ||
    !item ||
    shouldBypassCatalogPriceRangeValidation(item, trustedSource) ||
    isCatalogOfferWithinExpectedPriceRange(item, effectivePrice);
  const fallbackStatus = productUrl ? "linked_no_price" : searchUrl ? "search_only" : "not_found";
  const requestedStatus = firstText(offer?.status);
  const availability = firstText(offer?.availability) || null;
  const effectiveStatus =
    availability === "unavailable"
      ? "unavailable"
      :
    !productUrl && searchUrl
      ? "search_only"
      : requestedStatus && hasReasonablePrice
        ? requestedStatus
        : hasReasonablePrice && productUrl && (normalizedTotalPrice !== null || normalizedPrice !== null)
          ? "available"
          : fallbackStatus;
  return {
    store_id: sanitizeText(String(offer?.store_id || source?.id || ""), 80),
    store: firstText(offer?.store, source?.name) || source?.name || "Unknown",
    status: effectiveStatus,
    trusted_source: trustedSource || null,
    product_url: productUrl,
    search_url: searchUrl,
    price:
      hasReasonablePrice && productUrl && normalizedPrice !== null ? Math.max(0, Math.round(normalizedPrice)) : null,
    total_price:
      hasReasonablePrice && productUrl && normalizedTotalPrice !== null
        ? Math.max(0, Math.round(normalizedTotalPrice))
        : hasReasonablePrice && productUrl && normalizedPrice !== null
          ? Math.max(0, Math.round(normalizedPrice))
          : null,
    currency: firstText(offer?.currency).toUpperCase() || "SEK",
    shipping_price: hasReasonablePrice ? parseMoneyValue(offer?.shipping_price) : null,
    availability,
    updated_at: firstText(offer?.updated_at) || null,
    error: firstText(offer?.error) || null,
  };
};

const sortCatalogStoreOffers = (offers) => {
  const rankForStatus = (status, price) => {
    if (status === "available" && Number.isFinite(price)) return 0;
    if (status === "linked_no_price") return 1;
    if (status === "search_only") return 2;
    if (status === "unavailable") return 3;
    if (status === "not_found") return 4;
    return 5;
  };
  return [...offers].sort((a, b) => {
    const aRank = rankForStatus(a.status, a.total_price ?? a.price);
    const bRank = rankForStatus(b.status, b.total_price ?? b.price);
    if (aRank !== bRank) return aRank - bRank;
    const aPrice = Number.isFinite(a.total_price ?? a.price) ? a.total_price ?? a.price : Number.MAX_SAFE_INTEGER;
    const bPrice = Number.isFinite(b.total_price ?? b.price) ? b.total_price ?? b.price : Number.MAX_SAFE_INTEGER;
    if (aPrice !== bPrice) return aPrice - bPrice;
    return a.store.localeCompare(b.store, "sv");
  });
};

const isCatalogStoreOfferUseful = (offer) =>
  Boolean(firstText(offer?.product_url)) ||
  Boolean(firstText(offer?.search_url)) ||
  Number.isFinite(offer?.total_price ?? offer?.price);

const hydrateCatalogStoreOffers = (offers = [], item = null) => {
  const isBetterCatalogStoreOffer = (candidate, current) => {
    const rankFor = (offer) => {
      if (offer?.status === "available" && Number.isFinite(offer?.total_price ?? offer?.price)) return 0;
      if (offer?.status === "linked_no_price" && offer?.product_url) return 1;
      if (offer?.status === "search_only" && offer?.search_url) return 2;
      return 3;
    };
    const candidateRank = rankFor(candidate);
    const currentRank = rankFor(current);
    if (candidateRank !== currentRank) return candidateRank < currentRank;
    const candidatePrice = Number.isFinite(candidate?.total_price ?? candidate?.price)
      ? candidate.total_price ?? candidate.price
      : Number.MAX_SAFE_INTEGER;
    const currentPrice = Number.isFinite(current?.total_price ?? current?.price)
      ? current.total_price ?? current.price
      : Number.MAX_SAFE_INTEGER;
    if (candidatePrice !== currentPrice) return candidatePrice < currentPrice;
    return Boolean(candidate?.product_url) && !current?.product_url;
  };

  const normalizedByStoreId = new Map();
  offers.forEach((offer) => {
    const source = CURATED_CUSTOM_BUILD_STORE_SOURCES.find((entry) => entry.id === offer?.store_id);
    if (!source) return;
    const normalizedOffer = sanitizeCatalogStoreOffer(offer, source, item);
    if (!isCatalogStoreOfferUseful(normalizedOffer)) return;
    const currentOffer = normalizedByStoreId.get(source.id);
    if (!currentOffer || isBetterCatalogStoreOffer(normalizedOffer, currentOffer)) {
      normalizedByStoreId.set(source.id, normalizedOffer);
    }
  });
  return sortCatalogStoreOffers(Array.from(normalizedByStoreId.values()));
};

const mergeCatalogStoreOffersWithCached = (nextOffers = [], cachedOffers = [], item = null) => {
  const nextByStoreId = new Map(
    hydrateCatalogStoreOffers(nextOffers, item).map((offer) => [offer.store_id, offer])
  );
  const cachedByStoreId = new Map(
    hydrateCatalogStoreOffers(cachedOffers, item).map((offer) => [offer.store_id, offer])
  );

  cachedByStoreId.forEach((cachedOffer, storeId) => {
    const nextOffer = nextByStoreId.get(storeId);
    if (!nextOffer || !cachedOffer) {
      return;
    }

    const nextHasUsefulData =
      (nextOffer.status === "available" &&
        Boolean(nextOffer.product_url) &&
        Number.isFinite(nextOffer.total_price ?? nextOffer.price)) ||
      (nextOffer.status === "linked_no_price" && Boolean(nextOffer.product_url));
    const cachedHasUsefulData =
      (cachedOffer.status === "available" &&
        Boolean(cachedOffer.product_url) &&
        Number.isFinite(cachedOffer.total_price ?? cachedOffer.price)) ||
      (cachedOffer.status === "linked_no_price" && Boolean(cachedOffer.product_url));

    if (!nextHasUsefulData && cachedHasUsefulData) {
      nextByStoreId.set(storeId, cachedOffer);
    }
  });

  return sortCatalogStoreOffers(Array.from(nextByStoreId.values()));
};

const countCatalogAvailableOffers = (offers = []) =>
  offers.filter((offer) => offer?.status === "available" && Number.isFinite(offer?.total_price ?? offer?.price)).length;

const saveCustomBuildProductCacheToDisk = async () => {
  const payload = {
    version: CUSTOM_BUILD_PRODUCT_CACHE_VERSION,
    saved_at: new Date().toISOString(),
    entries: Array.from(customBuildProductCache.entries()).map(([key, value]) => ({
      key,
      item_id: value.item_id,
      updatedAt: value.updatedAt,
      response: value.response,
    })),
  };
  await fs.mkdir(path.dirname(CUSTOM_BUILD_PRODUCT_CACHE_FILE), { recursive: true });
  await fs.writeFile(CUSTOM_BUILD_PRODUCT_CACHE_FILE, JSON.stringify(payload, null, 2), "utf8");
};

const queueCustomBuildProductCacheSave = () => {
  customBuildProductCacheWriteChain = customBuildProductCacheWriteChain
    .catch(() => null)
    .then(() => saveCustomBuildProductCacheToDisk())
    .catch((error) => {
      logStructured("warn", "custom_build_product_cache_save_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    });
  return customBuildProductCacheWriteChain;
};

const loadCustomBuildProductCacheFromDisk = async () => {
  try {
    const raw = await fs.readFile(CUSTOM_BUILD_PRODUCT_CACHE_FILE, "utf8");
    const payload = raw ? JSON.parse(raw) : {};
    const payloadVersion = sanitizeText(String(payload?.version || ""), 40);
    if (payloadVersion && payloadVersion !== CUSTOM_BUILD_PRODUCT_CACHE_VERSION) {
      return;
    }
    const entries = Array.isArray(payload?.entries) ? payload.entries : [];
    entries.forEach((entry) => {
      const rawKey = sanitizeText(String(entry?.key || ""), 240);
      const expectedPrefix = `${CUSTOM_BUILD_PRODUCT_CACHE_VERSION}:`;
      if (rawKey.includes(":") && !rawKey.startsWith(expectedPrefix)) {
        return;
      }
      const itemId = sanitizeText(String(entry?.item_id || ""), 120);
      const updatedAt = Number(entry?.updatedAt || Date.now());
      const item = CUSTOM_BUILD_CATALOG_BY_ID[itemId];
      const key = rawKey.startsWith(expectedPrefix)
        ? rawKey
        : buildCustomBuildProductCacheKey(itemId);
      if (!key || !itemId || !item || !entry?.response) return;
      const cachedOffers = Array.isArray(entry.response.offers) ? entry.response.offers : [];
      const response = sanitizeCatalogItemResponse(item, cachedOffers, Number.isFinite(updatedAt) ? updatedAt : Date.now(), {
        referenceLowestPrice: entry?.response?.reference_lowest_price,
        referenceSource: entry?.response?.reference_source,
        imageUrl: entry?.response?.image_url,
      });
      customBuildProductCache.set(key, {
        item_id: itemId,
        updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
        response,
      });
    });
  } catch (error) {
    const code = error?.code || "";
    if (code !== "ENOENT") {
      logStructured("warn", "custom_build_product_cache_load_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }
};

const ensureCustomBuildProductCacheLoaded = async () => {
  if (!customBuildProductCacheLoadPromise) {
    customBuildProductCacheLoadPromise = loadCustomBuildProductCacheFromDisk().catch((error) => {
      customBuildProductCacheLoadPromise = null;
      throw error;
    });
  }
  return customBuildProductCacheLoadPromise;
};

const shouldPreferCatalogReferenceLowestPrice = (item, availableLowestPrice, referenceLowestPrice) => {
  if (!Number.isFinite(availableLowestPrice) || availableLowestPrice <= 0) return false;
  if (!Number.isFinite(referenceLowestPrice) || referenceLowestPrice <= 0) return false;
  if (availableLowestPrice <= referenceLowestPrice) return false;

  const category = getCustomBuildCategoryForItem(item);
  let maxReferenceMultiplier = 1.8;

  if (category === "storage") {
    maxReferenceMultiplier = 1.6;
  } else if (category === "cpu") {
    maxReferenceMultiplier = 1.5;
  } else if (category === "motherboard") {
    maxReferenceMultiplier = 1.55;
  } else if (category === "gpu") {
    maxReferenceMultiplier = 1.45;
  } else if (category === "psu" || category === "cooling" || category === "case") {
    maxReferenceMultiplier = 1.6;
  }

  return availableLowestPrice > referenceLowestPrice * maxReferenceMultiplier;
};

const setCachedCatalogItemImageUrl = (itemId, imageUrl) => {
  const normalizedImageUrl = sanitizeImageUrl(imageUrl);
  if (!itemId || !normalizedImageUrl) return;
  const cacheKey = buildCustomBuildProductCacheKey(itemId);
  const cached = customBuildProductCache.get(cacheKey);
  if (!cached?.response || cached.response.image_url === normalizedImageUrl) return;
  customBuildProductCache.set(cacheKey, {
    ...cached,
    response: {
      ...cached.response,
      image_url: normalizedImageUrl,
    },
  });
  queueCustomBuildProductCacheSave();
};

const resolveCatalogItemImageUrl = async (item, options = {}) => {
  const excludedImageUrls = new Set(
    firstArray(options?.excludeImageUrls)
      .map((value) => sanitizeImageUrl(value))
      .filter(Boolean)
  );
  const allowCandidateImageUrl = (value) => {
    const normalizedValue = sanitizeImageUrl(value);
    return normalizedValue && !excludedImageUrls.has(normalizedValue) ? normalizedValue : null;
  };
  const preferAlternateSources = Boolean(options?.preferAlternateSources);
  const cachedImageUrl = allowCandidateImageUrl(options?.imageUrl || options?.response?.image_url);
  if (cachedImageUrl && !preferAlternateSources) {
    return cachedImageUrl;
  }

  const komponentkollProduct =
    options?.komponentkollProduct || (await findBestKomponentkollProductForItem(item).catch(() => null));
  const komponentkollImageUrl = allowCandidateImageUrl(
    komponentkollProduct?.image_url || buildKomponentkollThumbnailUrl(komponentkollProduct?.product_id)
  );
  if (komponentkollImageUrl && !preferAlternateSources) {
    return komponentkollImageUrl;
  }

  const offerUrls = Array.from(
    new Set(
      firstArray(options?.offers)
        .map((offer) => normalizeRelativeUrl(firstText(offer?.product_url), firstText(offer?.product_url)))
        .filter(Boolean)
    )
  ).slice(0, 4);
  for (const offerUrl of offerUrls) {
    const imageUrl = await getCatalogProductImageUrl(offerUrl).catch(() => null);
    const normalizedImageUrl = allowCandidateImageUrl(imageUrl);
    if (normalizedImageUrl) {
      return normalizedImageUrl;
    }
  }

  const fallbackProductUrls = [
    komponentkollProduct?.product_url,
    options?.prisjaktProduct?.url,
    options?.priceRunnerProduct?.product_url,
  ]
    .map((value) => normalizeRelativeUrl(firstText(value), firstText(value)))
    .filter(Boolean);
  for (const productUrl of fallbackProductUrls) {
    const imageUrl = await getCatalogProductImageUrl(productUrl).catch(() => null);
    const normalizedImageUrl = allowCandidateImageUrl(imageUrl);
    if (normalizedImageUrl) {
      return normalizedImageUrl;
    }
  }

  if (cachedImageUrl) {
    return cachedImageUrl;
  }
  if (komponentkollImageUrl) {
    return komponentkollImageUrl;
  }
  return null;
};

const sanitizeCatalogItemResponse = (item, offers, updatedAt, options = {}) => {
  const hydratedOffers = hydrateCatalogStoreOffers(offers, item).map((offer) => ({
    ...offer,
    updated_at: new Date(updatedAt).toISOString(),
  }));
  const rawReferenceLowestPrice = Number(options?.referenceLowestPrice);
  const referenceSource = firstText(options?.referenceSource) || null;
  const referenceLowestPrice =
    Number.isFinite(rawReferenceLowestPrice) && rawReferenceLowestPrice > 0
      ? Math.max(0, Math.round(rawReferenceLowestPrice))
      : null;
  const validatedReferenceLowestPrice =
    Number.isFinite(referenceLowestPrice) &&
    (shouldBypassCatalogPriceRangeValidation(item, String(referenceSource || "").toLowerCase()) ||
      isCatalogOfferWithinExpectedPriceRange(item, referenceLowestPrice))
      ? referenceLowestPrice
      : null;
  const effectiveOffers = hydratedOffers.length > 0
    ? hydratedOffers
    : buildCatalogFallbackStoreOffers(item, updatedAt);
  const limitedOffers = effectiveOffers.slice(0, 5);
  const availableOfferPrices = limitedOffers
    .filter(
      (offer) => offer.status === "available" && Number.isFinite(offer.total_price ?? offer.price)
    )
    .map((offer) => offer.total_price ?? offer.price);
  const availableLowestPrice = availableOfferPrices.length > 0
    ? Math.min(...availableOfferPrices)
    : null;
  const lowestPrice = shouldPreferCatalogReferenceLowestPrice(
    item,
    availableLowestPrice,
    validatedReferenceLowestPrice
  )
    ? validatedReferenceLowestPrice
    : Number.isFinite(availableLowestPrice)
      ? availableLowestPrice
      : validatedReferenceLowestPrice;
  return {
    ok: true,
    item_id: item.id,
    updated_at: new Date(updatedAt).toISOString(),
    next_refresh_at: new Date(updatedAt + CUSTOM_PRICE_REFRESH_INTERVAL_MS).toISOString(),
    lowest_price: Number.isFinite(lowestPrice) ? Math.max(0, Math.round(lowestPrice)) : null,
    reference_lowest_price: validatedReferenceLowestPrice,
    reference_source: validatedReferenceLowestPrice ? referenceSource : null,
    image_url: sanitizeImageUrl(options?.imageUrl) || null,
    offers: limitedOffers,
  };
};

const refreshCatalogItemStoreOffers = async (itemId) => {
  const item = CUSTOM_BUILD_CATALOG_BY_ID[itemId];
  if (!item) {
    throw new Error("UNKNOWN_CATALOG_ITEM");
  }
  const manualOffers = Array.isArray(CUSTOM_BUILD_MANUAL_STORE_OFFERS[item.id])
    ? CUSTOM_BUILD_MANUAL_STORE_OFFERS[item.id]
        .map((offer) => {
          const source = CURATED_CUSTOM_BUILD_STORE_SOURCES.find((entry) => entry.id === offer?.store_id);
          return source ? sanitizeCatalogStoreOffer(offer, source, item) : null;
        })
        .filter(Boolean)
    : [];
  if (manualOffers.length > 0) {
    const manualReferenceLowestPrice = manualOffers
      .map((offer) => offer?.total_price ?? offer?.price)
      .filter((value) => Number.isFinite(value) && value > 0);
    const manualImageUrl = await resolveCatalogItemImageUrl(item, {
      offers: manualOffers,
    }).catch(() => null);
    return {
      offers: sortCatalogStoreOffers(manualOffers),
      referenceLowestPrice: manualReferenceLowestPrice.length > 0 ? Math.min(...manualReferenceLowestPrice) : null,
      referenceSource: manualReferenceLowestPrice.length > 0 ? "manual" : null,
      imageUrl: manualImageUrl,
    };
  }
  const offerLists = [];
  let referenceLowestPrice = null;
  let referenceSource = null;
  let priceRunnerProduct = null;

  const komponentkollProduct = await findBestKomponentkollProductForItem(item).catch(() => null);
  if (komponentkollProduct?.product_url) {
    const komponentkollHtml = await fetchTextWithBrowserHeaders(komponentkollProduct.product_url).catch(() => null);
    if (komponentkollHtml) {
      const offers = extractStoreOffersFromKomponentkollProductHtml(
        komponentkollHtml,
        item,
        komponentkollProduct.product_url
      );
      const komponentkollReferenceFromPage = extractKomponentkollReferencePriceFromHtml(
        komponentkollHtml,
        item,
        komponentkollProduct.product_url
      );
      if (offers.length > 0) {
        offerLists.push(offers);
        const komponentkollOfferPrices = offers
          .map((offer) => offer?.total_price ?? offer?.price)
          .filter((value) => Number.isFinite(value) && value > 0);
        if (komponentkollOfferPrices.length > 0) {
          referenceLowestPrice = Math.min(...komponentkollOfferPrices);
          referenceSource = "komponentkoll";
        }
      }
      if (Number.isFinite(komponentkollReferenceFromPage) && komponentkollReferenceFromPage > 0) {
        if (!Number.isFinite(referenceLowestPrice) || komponentkollReferenceFromPage < referenceLowestPrice) {
          referenceLowestPrice = komponentkollReferenceFromPage;
          referenceSource = "komponentkoll";
        }
      }
    }
    if (!Number.isFinite(referenceLowestPrice) && Number.isFinite(komponentkollProduct.lowest_price)) {
      referenceLowestPrice = komponentkollProduct.lowest_price;
      referenceSource = "komponentkoll";
    }
  }

  const prisjaktProduct = await findBestPrisjaktProductForItem(item).catch(() => null);
  if (prisjaktProduct?.markdown) {
    const offers = extractStoreOffersFromPrisjaktProductHtml(prisjaktProduct.markdown);
    if (offers.length > 0) {
      offerLists.push(offers);
      if (!Number.isFinite(referenceLowestPrice)) {
        const prisjaktOfferPrices = offers
          .map((offer) => offer?.total_price ?? offer?.price)
          .filter((value) => Number.isFinite(value) && value > 0);
        if (prisjaktOfferPrices.length > 0) {
          referenceLowestPrice = Math.min(...prisjaktOfferPrices);
          referenceSource = "prisjakt";
        }
      }
    }
  }

  if (!Number.isFinite(referenceLowestPrice)) {
    priceRunnerProduct = await findBestPriceRunnerProductForItem(item).catch(() => null);
    if (Number.isFinite(priceRunnerProduct?.lowest_price)) {
      referenceLowestPrice = priceRunnerProduct.lowest_price;
      referenceSource = "pricerunner";
    }
  }

  const imageUrl = await resolveCatalogItemImageUrl(item, {
    offers: offerLists.flat(),
    komponentkollProduct,
    prisjaktProduct,
    priceRunnerProduct,
  }).catch(() => null);

  return {
    offers: sortCatalogStoreOffers(offerLists.flat()),
    referenceLowestPrice: Number.isFinite(referenceLowestPrice) ? referenceLowestPrice : null,
    referenceSource,
    imageUrl,
  };
};

const getCachedCatalogItemStoreOffers = (itemId) => {
  const item = CUSTOM_BUILD_CATALOG_BY_ID[itemId];
  if (!item) return null;
  const cacheKey = buildCustomBuildProductCacheKey(itemId);
  const cached = customBuildProductCache.get(cacheKey);
  if (!cached?.response || !Number.isFinite(cached.updatedAt)) return null;
  const cachedOffers = Array.isArray(cached.response.offers) ? cached.response.offers : [];
  return sanitizeCatalogItemResponse(item, cachedOffers, cached.updatedAt, {
    referenceLowestPrice: cached?.response?.reference_lowest_price,
    referenceSource: cached?.response?.reference_source,
    imageUrl: cached?.response?.image_url,
  });
};

const getOrRefreshCatalogItemStoreOffers = async (itemId, options = {}) => {
  await ensureCustomBuildProductCacheLoaded();
  const item = CUSTOM_BUILD_CATALOG_BY_ID[itemId];
  if (!item) {
    throw new Error("UNKNOWN_CATALOG_ITEM");
  }
  const cacheKey = buildCustomBuildProductCacheKey(itemId);
  const forceRefresh = Boolean(options?.forceRefresh);
  const allowStale = options?.allowStale !== false;
  const cached = customBuildProductCache.get(cacheKey);
  const cachedOffers = Array.isArray(cached?.response?.offers) ? cached.response.offers : [];
  const cachedOfferCount = countCatalogAvailableOffers(cachedOffers);
  const maxAge = cachedOfferCount > 0 ? CUSTOM_PRICE_CACHE_TTL_MS : CUSTOM_PRICE_EMPTY_CACHE_TTL_MS;
  const isCachedFresh =
    cached &&
    Number.isFinite(cached.updatedAt) &&
    Date.now() - cached.updatedAt <= maxAge;
  if (
    cached &&
    !forceRefresh &&
    isCachedFresh
  ) {
    return getCachedCatalogItemStoreOffers(itemId) || cached.response;
  }

  if (cached && !forceRefresh && allowStale) {
    if (!customBuildProductRefreshInFlight.has(cacheKey)) {
      getOrRefreshCatalogItemStoreOffers(itemId, { forceRefresh: true, allowStale: false }).catch((error) => {
        logStructured("warn", "custom_build_product_background_refresh_failed", {
          item_id: itemId,
          message: error instanceof Error ? error.message : "unknown_error",
        });
      });
    }
    return getCachedCatalogItemStoreOffers(itemId) || cached.response;
  }

  if (!forceRefresh && customBuildProductRefreshInFlight.has(cacheKey)) {
    return customBuildProductRefreshInFlight.get(cacheKey);
  }

  const refreshPromise = (async () => {
    try {
      const refreshedAt = Date.now();
      const refreshed = await refreshCatalogItemStoreOffers(itemId);
      const mergedOffers = mergeCatalogStoreOffersWithCached(refreshed?.offers, cachedOffers, item);
      const nextResponse = sanitizeCatalogItemResponse(item, mergedOffers, refreshedAt, {
        referenceLowestPrice: refreshed?.referenceLowestPrice,
        referenceSource: refreshed?.referenceSource,
        imageUrl: refreshed?.imageUrl,
      });
      customBuildProductCache.set(cacheKey, {
        item_id: itemId,
        updatedAt: refreshedAt,
        response: nextResponse,
      });
      queueCustomBuildProductCacheSave();
      return nextResponse;
    } catch (error) {
      if (cached?.response) {
        return getCachedCatalogItemStoreOffers(itemId) || cached.response;
      }
      throw error;
    }
  })().finally(() => {
    customBuildProductRefreshInFlight.delete(cacheKey);
  });

  customBuildProductRefreshInFlight.set(cacheKey, refreshPromise);
  return refreshPromise;
};

const buildCatalogCategoryPriceResponse = async (category, forceRefresh = false) => {
  await ensureCustomBuildProductCacheLoaded();
  const items = getCustomBuildCatalogItemsByCategory(category);
  const entries = await Promise.all(
    items.map(async (item) => {
      const cachedResponse = getCachedCatalogItemStoreOffers(item.id);
      const response = forceRefresh
        ? await getOrRefreshCatalogItemStoreOffers(item.id, {
            forceRefresh: true,
            allowStale: false,
          })
        : cachedResponse || await getOrRefreshCatalogItemStoreOffers(item.id);
      let imageUrl = await resolveCatalogItemImageUrl(item, {
        response,
        offers: response?.offers,
      }).catch(() => null);
      if (imageUrl) {
        setCachedCatalogItemImageUrl(item.id, imageUrl);
      }
      const offers = Array.isArray(response?.offers)
        ? response.offers.filter((offer) => Boolean(offer?.product_url))
        : [];
      const hasPricedOffer = offers.some((offer) =>
        offer?.status === "available" && Number.isFinite(offer?.total_price ?? offer?.price)
      );
      return {
        item,
        response,
        offers,
        hasPricedOffer,
        imageUrl: imageUrl || sanitizeImageUrl(response?.image_url) || null,
      };
    })
  );

  const usedImageUrls = new Set();
  for (const entry of entries) {
    const needsAlternativeImage = !entry?.imageUrl || usedImageUrls.has(entry.imageUrl);
    if (!needsAlternativeImage) {
      usedImageUrls.add(entry.imageUrl);
      continue;
    }
    const alternativeImageUrl = await resolveCatalogItemImageUrl(entry.item, {
      response: entry.response,
      offers: entry.offers,
      imageUrl: entry.imageUrl,
      preferAlternateSources: true,
      excludeImageUrls: [entry.imageUrl, ...Array.from(usedImageUrls)].filter(Boolean),
    }).catch(() => null);
    if (alternativeImageUrl) {
      entry.imageUrl = alternativeImageUrl;
      setCachedCatalogItemImageUrl(entry.item.id, alternativeImageUrl);
    }
    if (entry.imageUrl) {
      usedImageUrls.add(entry.imageUrl);
    }
  }

  const results = entries.map((entry) => {
    const response = entry?.response;
    return {
      item_id: entry.item.id,
      lowest_price: Number.isFinite(response?.lowest_price) ? response.lowest_price : null,
      updated_at: response?.updated_at || null,
      image_url: entry?.imageUrl || sanitizeImageUrl(response?.image_url) || null,
      price_source: entry?.hasPricedOffer
        ? "live-offer"
        : Number.isFinite(response?.reference_lowest_price)
          ? "fallback"
          : response?.updated_at
            ? "no-store"
            : null,
    };
  });
  return {
    ok: true,
    category,
    updated_at: new Date().toISOString(),
    prices: results,
  };
};

const startCustomBuildProductScheduler = async () => {
  if (customBuildProductSchedulerStarted) return;
  customBuildProductSchedulerStarted = true;
  await ensureCustomBuildProductCacheLoaded();
  const refreshAll = async () => {
    const itemIds = CUSTOM_BUILD_CATALOG_ITEMS.map((item) => item.id);
    for (const itemId of itemIds) {
      try {
        await getOrRefreshCatalogItemStoreOffers(itemId, { forceRefresh: true });
        await new Promise((resolve) => setTimeout(resolve, 1200));
      } catch (error) {
        logStructured("warn", "custom_build_product_refresh_failed", {
          item_id: itemId,
          message: error instanceof Error ? error.message : "unknown_error",
        });
      }
    }
  };
  setTimeout(() => {
    refreshAll().catch((error) => {
      logStructured("warn", "custom_build_product_initial_refresh_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    });
  }, 20_000);
  const timer = setInterval(() => {
    refreshAll().catch((error) => {
      logStructured("warn", "custom_build_product_scheduled_refresh_failed", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    });
  }, CUSTOM_PRICE_REFRESH_INTERVAL_MS);
  if (typeof timer?.unref === "function") {
    timer.unref();
  }
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

const extractMetaImageUrlFromHtml = (html, baseUrl = "") => {
  if (!html || typeof html !== "string") return null;
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const metaTag of metaTags) {
    const propertyMatch = metaTag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i);
    const propertyName = sanitizeText(propertyMatch?.[1] || "", 120).toLowerCase();
    if (!["og:image", "twitter:image", "twitter:image:src"].includes(propertyName)) continue;
    const contentMatch = metaTag.match(/\bcontent\s*=\s*["']([^"']+)["']/i);
    const rawUrl = firstText(contentMatch?.[1]);
    const normalizedUrl = sanitizeImageUrl(normalizeRelativeUrl(rawUrl, baseUrl));
    if (normalizedUrl) {
      return normalizedUrl;
    }
  }
  return null;
};

const collectImageCandidatesFromNode = (node, out = []) => {
  if (!node) return out;
  if (Array.isArray(node)) {
    node.forEach((entry) => collectImageCandidatesFromNode(entry, out));
    return out;
  }
  if (typeof node === "string") {
    out.push(node);
    return out;
  }
  if (typeof node !== "object") return out;
  const directCandidates = [
    node.url,
    node.contentUrl,
    node.secureUrl,
    node.thumbnailUrl,
    node.primaryImageOfPage,
  ];
  directCandidates.forEach((candidate) => {
    if (typeof candidate === "string" && candidate.trim()) {
      out.push(candidate);
    }
  });
  if (node.image) {
    collectImageCandidatesFromNode(node.image, out);
  }
  return out;
};

const extractProductImageUrlFromJsonLd = (html, baseUrl = "") => {
  const scripts = extractJsonLdScripts(html);
  const products = [];
  scripts.forEach((script) => collectProductsFromJsonLd(script, products));
  for (const product of products) {
    const imageCandidates = collectImageCandidatesFromNode(product?.image, []);
    for (const candidate of imageCandidates) {
      const normalizedUrl = sanitizeImageUrl(normalizeRelativeUrl(candidate, baseUrl));
      if (normalizedUrl) {
        return normalizedUrl;
      }
    }
  }
  return null;
};

const extractCatalogProductImageUrlFromHtml = (html, baseUrl = "") =>
  extractProductImageUrlFromJsonLd(html, baseUrl) || extractMetaImageUrlFromHtml(html, baseUrl);

const getCatalogProductImageUrl = async (url) => {
  const normalizedUrl = normalizeRelativeUrl(firstText(url), firstText(url));
  if (!normalizedUrl) return null;
  const cached = customBuildProductImageCache.get(normalizedUrl);
  if (
    cached &&
    Number.isFinite(cached.updatedAt) &&
    Date.now() - cached.updatedAt <= CUSTOM_PRICE_CACHE_TTL_MS * 2
  ) {
    return cached.imageUrl || null;
  }

  const html = await fetchTextWithBrowserHeaders(normalizedUrl).catch(() => null);
  const imageUrl = extractCatalogProductImageUrlFromHtml(html, normalizedUrl);
  customBuildProductImageCache.set(normalizedUrl, {
    updatedAt: Date.now(),
    imageUrl: imageUrl || null,
  });
  return imageUrl || null;
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

const resolveSiteSettingsMode = (value) => (value === "live" ? "live" : "draft");
const SITE_SETTINGS_HISTORY_LIMIT = 30;
const SITE_SETTINGS_HISTORY_KEY = "site_settings_history";
const SITE_SETTINGS_DRAFT_HISTORY_KEY = "site_settings_draft_history";
const SITE_SETTINGS_ALLOWED_INTERNAL_PREFIXES = [
  "/",
  "/products",
  "/custom-bygg",
  "/service-reparation",
  "/kundservice",
  "/faq",
  "/about",
  "/privacy-policy",
  "/terms-of-service",
  "/computer/",
  "/search",
  "/cart",
  "/checkout",
  "/checkout-success",
  "/account",
  "/orders",
  "/reset-password",
];
const SITE_SETTINGS_COPY_LIMITS = {
  "homepage.hero.title": 70,
  "homepage.hero.subtitle": 90,
  "homepage.hero.featureTitle": 100,
  "homepage.hero.secondaryTitle": 110,
  "homepage.hero.secondaryDescription": 180,
  "homepage.steps.title": 90,
  "homepage.steps.description": 140,
  "homepage.promo.title": 110,
  "homepage.promo.description": 180,
  "pages.products.banners.default.title": 100,
  "pages.products.banners.budget.title": 100,
  "pages.products.banners.best-selling.title": 100,
  "pages.products.banners.price-performance.title": 100,
  "pages.products.banners.toptier.title": 100,
  "pages.serviceRepair.heroTitle": 100,
  "pages.serviceRepair.heroDescription": 190,
  "pages.customerService.heroTitle": 90,
  "pages.customerService.heroDescription": 180,
};

const getSiteSettingsStorageKey = (mode = "live") =>
  mode === "draft" ? SITE_SETTINGS_DRAFT_KEY : SITE_SETTINGS_KEY;

const getSiteSettingsHistoryStorageKey = (mode = "live") =>
  mode === "draft" ? SITE_SETTINGS_DRAFT_HISTORY_KEY : SITE_SETTINGS_HISTORY_KEY;

const readSiteSettingsValue = async (mode = "live") => {
  if (!supabase) {
    return DEFAULT_SITE_SETTINGS;
  }

  const { data, error } = await supabase
    .from("ui_settings")
    .select("value")
    .eq("key", getSiteSettingsStorageKey(mode))
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to read site settings.");
  }

  return normalizeSiteSettings(data?.value);
};

const getSiteSettings = async (mode = "live") => readSiteSettingsValue(mode);

const getSiteSettingsBundle = async () => {
  const [live, draft] = await Promise.all([
    readSiteSettingsValue("live"),
    readSiteSettingsValue("draft"),
  ]);
  return { live, draft };
};

const writeSiteSettings = async (value, mode = "live") => {
  if (!supabase) {
    throw new Error("Supabase not configured.");
  }

  const parsed = siteSettingsSchema.safeParse(value);
  if (!parsed.success) {
    const error = new Error("INVALID_SITE_SETTINGS");
    error.validation = formatZodValidationError(parsed.error);
    throw error;
  }

  const payload = {
    key: getSiteSettingsStorageKey(mode),
    value: parsed.data,
    updated_at: new Date(),
  };

  const { data, error } = await supabase
    .from("ui_settings")
    .upsert([payload], { onConflict: "key" })
    .select("value")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update site settings.");
  }

  return normalizeSiteSettings(data?.value);
};

const readSiteSettingsHistory = async (mode = "live") => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("ui_settings")
    .select("value")
    .eq("key", getSiteSettingsHistoryStorageKey(mode))
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to read site settings history.");
  }

  const entries = Array.isArray(data?.value?.entries) ? data.value.entries : [];
  return entries
    .map((entry) => ({
      id: sanitizeText(entry?.id, 80) || crypto.randomUUID(),
      mode,
      name: sanitizeText(entry?.name, 120) || "Namnlös version",
      source: sanitizeText(entry?.source, 40) || "snapshot",
      created_at: sanitizeText(entry?.created_at, 80) || new Date().toISOString(),
      actor_id: sanitizeText(entry?.actor_id, 80) || null,
      settings: normalizeSiteSettings(entry?.settings),
    }))
    .slice(0, SITE_SETTINGS_HISTORY_LIMIT);
};

const writeSiteSettingsHistory = async (entries, mode = "live") => {
  if (!supabase) {
    throw new Error("Supabase not configured.");
  }

  const payload = {
    key: getSiteSettingsHistoryStorageKey(mode),
    value: {
      entries: entries.slice(0, SITE_SETTINGS_HISTORY_LIMIT),
    },
    updated_at: new Date(),
  };

  const { error } = await supabase.from("ui_settings").upsert([payload], { onConflict: "key" });
  if (error) {
    throw new Error(error.message || "Failed to update site settings history.");
  }

  return payload.value.entries;
};

const createSiteSettingsSnapshot = async ({
  mode = "draft",
  settings,
  name = "",
  source = "snapshot",
  user = null,
}) => {
  const nextSettings = normalizeSiteSettings(settings);
  const currentEntries = await readSiteSettingsHistory(mode);
  const nextEntry = {
    id: crypto.randomUUID(),
    mode,
    name: sanitizeText(name, 120) || `${mode === "draft" ? "Utkast" : "Live"} ${new Date().toLocaleString("sv-SE")}`,
    source: sanitizeText(source, 40) || "snapshot",
    created_at: new Date().toISOString(),
    actor_id: sanitizeText(user?.id, 80) || null,
    settings: nextSettings,
  };
  const nextEntries = [nextEntry, ...currentEntries].slice(0, SITE_SETTINGS_HISTORY_LIMIT);
  await writeSiteSettingsHistory(nextEntries, mode);
  return nextEntry;
};

const collectSiteSettingValues = (value, callback, path = []) => {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectSiteSettingValues(entry, callback, [...path, String(index)]));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => collectSiteSettingValues(entry, callback, [...path, key]));
    return;
  }
  callback(path.join("."), value);
};

const isAllowedSiteLink = (href) => {
  const value = String(href || "").trim();
  if (!value) return false;
  if (value.startsWith("/")) {
    return SITE_SETTINGS_ALLOWED_INTERNAL_PREFIXES.some((prefix) => value === prefix || value.startsWith(prefix));
  }
  return /^(https?:\/\/|mailto:|tel:)/i.test(value);
};

const assetPathExists = (assetUrl) => {
  const value = String(assetUrl || "").trim();
  if (!value) return false;
  if (!value.startsWith("/")) return true;
  if (value.startsWith("/storage/")) return true;
  const relative = value.replace(/^\/+/, "");
  const candidates = [
    path.join(__dirname, "public", relative),
    path.join(__dirname, relative),
    path.join(__dirname, "dist", relative),
  ];
  return candidates.some((candidate) => fsSync.existsSync(candidate));
};

const validateSiteSettingsPayload = (settings) => {
  const issues = [];
  const nextSettings = normalizeSiteSettings(settings);
  const pushIssue = (severity, pathKey, message, value = null) => {
    issues.push({
      severity,
      path: pathKey,
      message,
      value,
    });
  };

  collectSiteSettingValues(nextSettings, (pathKey, value) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (pathKey.endsWith("Href") || pathKey.endsWith(".href")) {
      if (!isAllowedSiteLink(trimmed)) {
        pushIssue("error", pathKey, "Länken är tom, ogiltig eller pekar på en okänd route.", trimmed);
      }
      return;
    }
    if (pathKey.endsWith("Image") || pathKey.endsWith("logoUrl") || pathKey.endsWith(".image")) {
      if (!trimmed) {
        pushIssue("error", pathKey, "Bilden saknas.", trimmed);
      } else if (!assetPathExists(trimmed)) {
        pushIssue("warning", pathKey, "Bilden kunde inte verifieras på disk eller storage.", trimmed);
      }
      return;
    }
    if (pathKey.endsWith("Label") && !trimmed) {
      pushIssue("error", pathKey, "CTA-texten är tom.", trimmed);
      return;
    }
    const copyLimit = SITE_SETTINGS_COPY_LIMITS[pathKey];
    if (copyLimit && trimmed.length > copyLimit) {
      pushIssue("warning", pathKey, `Texten är längre än rekommenderat (${trimmed.length}/${copyLimit}).`, trimmed);
    }
  });

  return {
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    settings: nextSettings,
  };
};

const listKnownSiteImageAssets = async () => {
  const candidates = new Map();
  const collect = (value) => {
    if (!value) return;
    const normalized = sanitizeImageUrl(String(value)) || String(value).trim();
    if (!normalized) return;
    candidates.set(normalized, {
      url: normalized,
      source: normalized.startsWith("/storage/") || normalized.includes("/storage/v1/object/public/") ? "upload" : "preset",
    });
  };

  const knownSettings = [DEFAULT_SITE_SETTINGS, await readSiteSettingsValue("live"), await readSiteSettingsValue("draft")];
  knownSettings.forEach((settings) => {
    collectSiteSettingValues(settings, (pathKey, value) => {
      if (typeof value !== "string") return;
      if (pathKey.endsWith("Image") || pathKey.endsWith("logoUrl") || pathKey.endsWith(".image")) {
        collect(value);
      }
      if (pathKey.includes(".images.")) {
        collect(value);
      }
    });
  });

  if (supabase) {
    try {
      const bucketName = await ensureProductImageBucketReady();
      const { data } = await supabase.storage.from(bucketName).list("site-settings", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });
      (data || []).forEach((item) => {
        if (!item?.name) return;
        const objectPath = `site-settings/${item.name}`;
        const publicUrlData = supabase.storage.from(bucketName).getPublicUrl(objectPath);
        collect(publicUrlData?.data?.publicUrl || buildStoragePublicUrl(bucketName, objectPath));
      });
    } catch (error) {
      console.warn("Could not list site-settings assets:", error);
    }
  }

  return Array.from(candidates.values());
};

const resetSiteSettings = async (mode = "draft") => writeSiteSettings(DEFAULT_SITE_SETTINGS, mode);

const publishDraftSiteSettings = async () => {
  const draft = await readSiteSettingsValue("draft");
  const live = await writeSiteSettings(draft, "live");
  return { draft, live };
};

const cloneLiveSettingsToDraft = async () => {
  const live = await readSiteSettingsValue("live");
  const draft = await writeSiteSettings(live, "draft");
  return { live, draft };
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

const parseListingTagsSetting = (value) => {
  if (value && typeof value === "object" && Array.isArray(value.tags)) {
    return normalizeListingTags(value.tags);
  }
  if (Array.isArray(value)) {
    return normalizeListingTags(value);
  }
  return [];
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

const uploadSiteImageSchema = z.object({
  file_name: z.string().trim().max(160).optional().nullable(),
  mime_type: z.string().trim().max(80),
  data_base64: z.string().trim().min(16),
  target: z.string().trim().max(120).optional().nullable(),
});

const UPLOAD_IMAGE_MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

let resolvedProductImageBucket = null;
let ensureProductImageBucketPromise = null;

const ensureProductImageBucketReady = async () => {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }
  if (resolvedProductImageBucket) {
    return resolvedProductImageBucket;
  }
  if (ensureProductImageBucketPromise) {
    return ensureProductImageBucketPromise;
  }

  ensureProductImageBucketPromise = (async () => {
    const fallbackBuckets = Array.from(new Set([PRODUCT_IMAGE_BUCKET, "public-assets"].filter(Boolean)));
    const { data: buckets } = await supabase.storage.listBuckets().catch(() => ({ data: [] }));
    if (Array.isArray(buckets)) {
      for (const bucketName of fallbackBuckets) {
        if (buckets.some((bucket) => sanitizeText(bucket?.name, 120) === bucketName)) {
          resolvedProductImageBucket = bucketName;
          return bucketName;
        }
      }
    }

    const { error: createError } = await supabase.storage.createBucket(PRODUCT_IMAGE_BUCKET, {
      public: true,
      fileSizeLimit: String(MAX_UPLOAD_IMAGE_BYTES),
      allowedMimeTypes: Object.keys(UPLOAD_IMAGE_MIME_TO_EXT),
    });
    if (!createError || /already exists/i.test(String(createError?.message || ""))) {
      resolvedProductImageBucket = PRODUCT_IMAGE_BUCKET;
      return PRODUCT_IMAGE_BUCKET;
    }

    const { data: retryBuckets } = await supabase.storage.listBuckets().catch(() => ({ data: [] }));
    if (Array.isArray(retryBuckets)) {
      for (const bucketName of fallbackBuckets) {
        if (retryBuckets.some((bucket) => sanitizeText(bucket?.name, 120) === bucketName)) {
          resolvedProductImageBucket = bucketName;
          return bucketName;
        }
      }
    }

    throw new Error(createError.message || "Could not resolve product image bucket.");
  })();

  try {
    return await ensureProductImageBucketPromise;
  } finally {
    ensureProductImageBucketPromise = null;
  }
};

const buildListingResponse = ({
  product,
  inventoryByProductId,
  fpsByProductId,
  usedVariantByProductId,
  usedPartsByProductId,
  tagsByProductId,
  productImagesByProductId,
  variantLinkByBaseId,
  variantBaseByUsedId,
  listingGroupByProductId,
}) => {
  const inventoryRow = inventoryByProductId.get(product.id) || null;
  const fallbackFps =
    buildReportedFpsSettingsForProductName(product?.name || product?.slug || product?.legacy_id) ||
    buildDefaultFpsSettings();
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
    tags: parseListingTagsSetting(tagsByProductId.get(product.id)),
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
    fps: resolveEffectiveFpsSettings(fpsByProductId.get(product.id), fallbackFps),
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
    `listing_tags:${id}`,
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
  const tagsByProductId = new Map();
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
    if (key.startsWith("listing_tags:")) {
      tagsByProductId.set(key.slice(13), setting.value);
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
      tagsByProductId,
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

  const normalizedTags = normalizeListingTags(parsedListing.tags);
  const tagsKey = `listing_tags:${productId}`;
  const { error: tagsError } = await supabase.from("ui_settings").upsert(
    [{ key: tagsKey, value: { tags: normalizedTags }, updated_at: new Date() }],
    { onConflict: "key" }
  );
  if (tagsError) {
    throw new Error(tagsError.message || "Kunde inte uppdatera listningstaggar.");
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

const handleStoreOffersRequest = async (req, res) => {
  try {
    if (req?.headers?.origin && !isAllowedOrigin(req.headers.origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }

    const query = sanitizeText(String(req.query?.query || ""), CUSTOM_PRICE_MAX_QUERY_LENGTH);
    if (query.length < 2) {
      return jsonError(res, 400, "INVALID_QUERY", "Sökfrasen måste vara minst 2 tecken.");
    }
    const forceRefresh = String(req.query?.refresh || "").trim() === "1";
    const trackQuery = String(req.query?.track || "1").trim() !== "0";
    const referencePriceValue = Number(req.query?.reference_price);
    const referencePrice = Number.isFinite(referencePriceValue)
      ? Math.max(0, Math.round(referencePriceValue))
      : null;
    const snapshot = await getOrRefreshStorePriceSnapshot(query, {
      forceRefresh,
      markTracked: trackQuery,
      referencePrice,
    });
    return res.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte hämta butikpriser.";
    console.error("Custom store price error:", error);
    return jsonError(res, 502, "STORE_PRICE_FETCH_FAILED", message);
  }
};

/**
 * GET /api/custom-build/store-offers
 */
app.get("/api/custom-build/store-offers", handleStoreOffersRequest);

/**
 * Backwards compatibility for old frontend endpoint.
 * GET /api/custom-build/prisjakt-offers
 */
app.get("/api/custom-build/prisjakt-offers", handleStoreOffersRequest);

const handleCatalogItemOffersRequest = async (req, res) => {
  try {
    if (req?.headers?.origin && !isAllowedOrigin(req.headers.origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }
    const itemId = sanitizeText(String(req.query?.item_id || ""), 120);
    if (!itemId || !CUSTOM_BUILD_CATALOG_BY_ID[itemId]) {
      return jsonError(res, 400, "INVALID_ITEM_ID", "Ogiltig katalogprodukt.");
    }
    const forceRefresh = String(req.query?.refresh || "").trim() === "1";
    const item = CUSTOM_BUILD_CATALOG_BY_ID[itemId];
    const snapshot = await getOrRefreshCatalogItemStoreOffers(itemId, { forceRefresh });
    const imageUrl = await resolveCatalogItemImageUrl(item, {
      response: snapshot,
      offers: snapshot?.offers,
    }).catch(() => null);
    if (imageUrl) {
      setCachedCatalogItemImageUrl(itemId, imageUrl);
    }
    return res.json({
      ...snapshot,
      image_url: imageUrl || sanitizeImageUrl(snapshot?.image_url) || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte hämta produktens butikspriser.";
    return jsonError(res, 502, "CATALOG_ITEM_FETCH_FAILED", message);
  }
};

const handleCatalogCategoryPricesRequest = async (req, res) => {
  try {
    if (req?.headers?.origin && !isAllowedOrigin(req.headers.origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }
    const category = sanitizeText(String(req.query?.category || ""), 40);
    if (!category || !CUSTOM_BUILD_SUPPORTED_CATEGORIES.has(category)) {
      return jsonError(res, 400, "INVALID_CATEGORY", "Ogiltig kategori.");
    }
    const forceRefresh = String(req.query?.refresh || "").trim() === "1";
    const response = await buildCatalogCategoryPriceResponse(category, forceRefresh);
    return res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde inte hämta kategoripriser.";
    return jsonError(res, 502, "CATALOG_CATEGORY_FETCH_FAILED", message);
  }
};

app.get("/api/custom-build/catalog-offers", handleCatalogItemOffersRequest);
app.get("/api/custom-build/catalog-prices", handleCatalogCategoryPricesRequest);

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

    const bucketName = await ensureProductImageBucketReady();
    let { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(objectPath, binary, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError && /bucket/i.test(String(uploadError.message || ""))) {
      resolvedProductImageBucket = null;
      const retryBucketName = await ensureProductImageBucketReady();
      ({ error: uploadError } = await supabase.storage
        .from(retryBucketName)
        .upload(objectPath, binary, {
          contentType: mimeType,
          upsert: false,
        }));
      if (!uploadError) {
        resolvedProductImageBucket = retryBucketName;
      }
    }

    if (uploadError) {
      return jsonError(
        res,
        500,
        "IMAGE_UPLOAD_FAILED",
        uploadError.message || "Kunde inte ladda upp bilden. Kontrollera bucket-inställningen."
      );
    }

    const activeBucketName = resolvedProductImageBucket || bucketName;
    const publicUrlData = supabase.storage.from(activeBucketName).getPublicUrl(objectPath);
    const url = sanitizeImageUrl(publicUrlData?.data?.publicUrl) || buildStoragePublicUrl(activeBucketName, objectPath);

    return res.status(201).json({
      ok: true,
      data: {
        url,
        bucket: activeBucketName,
        path: objectPath,
      },
    });
  } catch (error) {
    console.error("Admin listing image upload error:", error);
    return jsonError(res, 500, "IMAGE_UPLOAD_FAILED", "Kunde inte ladda upp bild.");
  }
});

app.post("/api/admin/v2/uploads/site-image", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["ops", "admin"]);
    if (!access) return;
    if (!requireServiceRoleKey(res)) return;

    const parsed = uploadSiteImageSchema.safeParse(req.body || {});
    if (!parsed.success) {
      const details = formatZodValidationError(parsed.error);
      return jsonError(res, 400, "VALIDATION_FAILED", "Ogiltig payload för bilduppladdning.", details);
    }

    const mimeType = sanitizeText(parsed.data.mime_type, 80).toLowerCase();
    const extension = UPLOAD_IMAGE_MIME_TO_EXT[mimeType];
    if (!extension) {
      return jsonError(res, 400, "UNSUPPORTED_IMAGE_TYPE", "Endast JPG, PNG, WEBP och AVIF stöds.");
    }

    const base64 = String(parsed.data.data_base64 || "").trim();
    const cleanedBase64 = base64.includes(",") ? base64.split(",").pop() || "" : base64;
    const binary = Buffer.from(cleanedBase64, "base64");
    if (!binary.length || binary.length > MAX_UPLOAD_IMAGE_BYTES) {
      return jsonError(res, 400, "IMAGE_TOO_LARGE", "Bilden är tom eller för stor.");
    }

    const bucketName = await ensureProductImageBucketReady();
    const targetSlug = slugifyValue(parsed.data.target || "site-image") || "site-image";
    const objectPath = `site-settings/${targetSlug}-${Date.now()}.${extension}`;
    let { error: uploadError } = await supabase.storage.from(bucketName).upload(objectPath, binary, {
      contentType: mimeType,
      upsert: false,
    });

    if (uploadError && /bucket/i.test(String(uploadError.message || ""))) {
      resolvedProductImageBucket = null;
      const retryBucketName = await ensureProductImageBucketReady();
      ({ error: uploadError } = await supabase.storage.from(retryBucketName).upload(objectPath, binary, {
        contentType: mimeType,
        upsert: false,
      }));
      if (!uploadError) {
        resolvedProductImageBucket = retryBucketName;
      }
    }

    if (uploadError) {
      return jsonError(res, 500, "IMAGE_UPLOAD_FAILED", uploadError.message || "Kunde inte ladda upp bilden.");
    }

    const activeBucketName = resolvedProductImageBucket || bucketName;
    const publicUrlData = supabase.storage.from(activeBucketName).getPublicUrl(objectPath);
    const url = sanitizeImageUrl(publicUrlData?.data?.publicUrl) || buildStoragePublicUrl(activeBucketName, objectPath);

    return res.status(201).json({
      ok: true,
      data: {
        url,
        bucket: activeBucketName,
        path: objectPath,
      },
    });
  } catch (error) {
    console.error("Admin site image upload error:", error);
    return jsonError(res, 500, "IMAGE_UPLOAD_FAILED", "Kunde inte ladda upp site-bild.");
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

app.post("/api/admin/v2/listings/:productId/used-variant", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["ops", "admin"]);
    if (!access) return;
    const { user, role } = access;
    if (!requireServiceRoleKey(res)) return;

    const baseProductId = sanitizeText(req.params?.productId, 80);
    if (!baseProductId) {
      return jsonError(res, 400, "VALIDATION_FAILED", "Saknar produkt-ID.");
    }

    const baseLookup = await loadAdminListings({ productId: baseProductId });
    const baseListing = baseLookup?.data?.[0] || null;
    if (!baseListing) {
      return jsonError(res, 404, "NOT_FOUND", "Produkten hittades inte.");
    }

    if (baseListing.variant_role === "used") {
      return jsonError(
        res,
        400,
        "INVALID_SOURCE_VARIANT",
        "Kan inte skapa begagnad variant från en redan begagnad variant."
      );
    }

    const existingUsedVariantId = sanitizeText(baseListing.linked_product_id, 80);
    if (existingUsedVariantId) {
      return jsonError(
        res,
        409,
        "USED_VARIANT_ALREADY_EXISTS",
        "Basvarianten har redan en begagnad variant."
      );
    }

    const parsed = updateListingRequestSchema.safeParse(req.body || {});
    if (!parsed.success) {
      const details = formatZodValidationError(parsed.error);
      logStructured("warn", "admin.validation_failed", {
        endpoint: "/api/admin/v2/listings/:productId/used-variant",
        code: "VALIDATION_FAILED",
        details,
      });
      return jsonError(res, 400, "VALIDATION_FAILED", "Ogiltig payload för begagnad variant.", details);
    }

    const { listing, fps, used_parts: usedParts } = parsed.data;
    const usedSlug = await ensureUniqueSlug(listing.slug, listing.name);
    const usedImageUrl = sanitizeImageUrl(listing.image_url) || null;
    const usedPayload = {
      name: sanitizeText(listing.name, 120),
      slug: usedSlug,
      legacy_id: sanitizeText(listing.legacy_id, 80) || null,
      description: sanitizeText(listing.description, 1000) || null,
      image_url: usedImageUrl,
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
        ...listing,
        used_variant_enabled: true,
      },
      fpsInput: fps,
      usedPartsInput: usedParts,
      role,
    });

    const { error: linkError } = await supabase.from("ui_settings").upsert(
      [
        {
          key: `used_variant:${baseProductId}`,
          value: { enabled: true },
          updated_at: new Date(),
        },
        {
          key: `used_variant_link:${baseProductId}`,
          value: { product_id: createdUsed.id },
          updated_at: new Date(),
        },
      ],
      { onConflict: "key" }
    );
    if (linkError) {
      return jsonError(
        res,
        500,
        "USED_VARIANT_LINK_FAILED",
        linkError.message || "Kunde inte länka begagnad variant."
      );
    }

    await upsertListingGroupSettings({ baseId: baseProductId, usedId: createdUsed.id });

    invalidateProductCaches([baseProductId, createdUsed.id]);

    await logAdminAction(req, user, "listing_used_variant_create_v2", "listing", baseProductId, {
      role,
      used_variant_product_id: createdUsed.id,
    });
    logStructured("info", "admin.listing_used_variant_created", {
      actor_id: user?.id || null,
      base_product_id: baseProductId,
      used_variant_product_id: createdUsed.id,
      role,
    });

    const loadedUsed = await loadAdminListings({ productId: createdUsed.id });
    return res.status(201).json({
      ok: true,
      data: loadedUsed?.data?.[0] || null,
      base_product_id: baseProductId,
      used_variant_product_id: createdUsed.id,
    });
  } catch (error) {
    console.error("Admin used variant create error:", error);
    return jsonError(res, 500, "USED_VARIANT_CREATE_FAILED", "Kunde inte skapa begagnad variant.");
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

app.get("/api/site-settings", async (_req, res) => {
  try {
    const mode = resolveSiteSettingsMode(_req.query?.mode);
    const settings = await getSiteSettings(mode);
    return res.json({ ok: true, mode, settings });
  } catch (error) {
    console.error("Public site settings error:", error);
    const mode = resolveSiteSettingsMode(_req.query?.mode);
    return res.json({ ok: true, mode, settings: DEFAULT_SITE_SETTINGS });
  }
});

app.get("/api/admin/v2/site-settings", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["readonly", "ops", "admin"]);
    if (!access) return;
    const requestedMode = resolveSiteSettingsMode(req.query?.mode);
    const settings = await getSiteSettingsBundle();
    return res.json({ ok: true, selectedMode: requestedMode, settings });
  } catch (error) {
    console.error("Admin site settings read error:", error);
    return jsonError(res, 500, "SITE_SETTINGS_READ_FAILED", "Kunde inte hamta site settings.");
  }
});

app.get("/api/admin/v2/site-settings/history", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["readonly", "ops", "admin"]);
    if (!access) return;
    const mode = resolveSiteSettingsMode(req.query?.mode);
    const entries = await readSiteSettingsHistory(mode);
    return res.json({ ok: true, mode, entries });
  } catch (error) {
    console.error("Admin site settings history error:", error);
    return jsonError(res, 500, "SITE_SETTINGS_HISTORY_FAILED", "Kunde inte hämta versionshistorik.");
  }
});

app.get("/api/admin/v2/site-settings/assets", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["readonly", "ops", "admin"]);
    if (!access) return;
    const assets = await listKnownSiteImageAssets();
    return res.json({ ok: true, assets });
  } catch (error) {
    console.error("Admin site settings assets error:", error);
    return jsonError(res, 500, "SITE_SETTINGS_ASSETS_FAILED", "Kunde inte hämta site-bilder.");
  }
});

app.post("/api/admin/v2/site-settings/validate", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["readonly", "ops", "admin"]);
    if (!access) return;
    const settings =
      req.body?.settings && typeof req.body.settings === "object"
        ? req.body.settings
        : await readSiteSettingsValue(resolveSiteSettingsMode(req.body?.mode || req.query?.mode));
    const validation = validateSiteSettingsPayload(settings);
    return res.json({ ok: true, validation });
  } catch (error) {
    console.error("Admin site settings validation error:", error);
    return jsonError(res, 500, "SITE_SETTINGS_VALIDATE_FAILED", "Kunde inte validera site settings.");
  }
});

app.post("/api/admin/v2/site-settings/snapshot", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["ops", "admin"]);
    if (!access) return;
    const { user, role } = access;
    if (!requireServiceRoleKey(res)) return;
    const mode = resolveSiteSettingsMode(req.body?.mode || req.query?.mode);
    const name = sanitizeText(req.body?.name, 120);
    const settings = await readSiteSettingsValue(mode);
    const entry = await createSiteSettingsSnapshot({
      mode,
      settings,
      name,
      source: "manual_snapshot",
      user,
    });
    await logAdminAction(req, user, "site_settings_snapshot_v2", "ui_settings", getSiteSettingsHistoryStorageKey(mode), {
      role,
      mode,
      snapshot_id: entry.id,
      snapshot_name: entry.name,
    });
    return res.json({ ok: true, mode, entry });
  } catch (error) {
    console.error("Admin site settings snapshot error:", error);
    return jsonError(res, 500, "SITE_SETTINGS_SNAPSHOT_FAILED", "Kunde inte skapa snapshot.");
  }
});

app.put("/api/admin/v2/site-settings", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["ops", "admin"]);
    if (!access) return;
    const { user, role } = access;
    if (!requireServiceRoleKey(res)) return;

    const mode = resolveSiteSettingsMode(req.body?.mode || req.query?.mode);
    const snapshotName = sanitizeText(req.body?.snapshot_name, 120);
    const nextSettings = await writeSiteSettings(req.body?.settings, mode);
    const snapshot = await createSiteSettingsSnapshot({
      mode,
      settings: nextSettings,
      name: snapshotName || "",
      source: "save",
      user,
    });
    await logAdminAction(req, user, "site_settings_update_v2", "ui_settings", getSiteSettingsStorageKey(mode), {
      role,
      mode,
      version: nextSettings.version,
      snapshot_id: snapshot.id,
    });
    return res.json({ ok: true, mode, settings: nextSettings });
  } catch (error) {
    if (error?.message === "INVALID_SITE_SETTINGS") {
      return jsonError(res, 400, "INVALID_SITE_SETTINGS", "Ogiltiga site settings.", error.validation || null);
    }
    console.error("Admin site settings update error:", error);
    return jsonError(res, 500, "SITE_SETTINGS_UPDATE_FAILED", "Kunde inte spara site settings.");
  }
});

app.post("/api/admin/v2/site-settings/publish", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["ops", "admin"]);
    if (!access) return;
    const { user, role } = access;
    if (!requireServiceRoleKey(res)) return;

    const draft = await readSiteSettingsValue("draft");
    const validation = validateSiteSettingsPayload(draft);
    if (!validation.ok) {
      return jsonError(
        res,
        400,
        "SITE_SETTINGS_VALIDATION_FAILED",
        "Draften innehåller blockerande fel och kan inte publiceras.",
        validation.issues
      );
    }

    const previousLive = await readSiteSettingsValue("live");
    await createSiteSettingsSnapshot({
      mode: "live",
      settings: previousLive,
      name: "Live innan publicering",
      source: "pre_publish",
      user,
    });
    const settings = await publishDraftSiteSettings();
    await createSiteSettingsSnapshot({
      mode: "live",
      settings: settings.live,
      name: "Publicerad liveversion",
      source: "publish",
      user,
    });
    await logAdminAction(req, user, "site_settings_publish_v2", "ui_settings", SITE_SETTINGS_KEY, {
      role,
      version: settings.live.version,
    });
    return res.json({ ok: true, settings });
  } catch (error) {
    console.error("Admin site settings publish error:", error);
    return jsonError(res, 500, "SITE_SETTINGS_PUBLISH_FAILED", "Kunde inte publicera utkastet.");
  }
});

app.post("/api/admin/v2/site-settings/reset", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["ops", "admin"]);
    if (!access) return;
    const { user, role } = access;
    if (!requireServiceRoleKey(res)) return;

    const mode = resolveSiteSettingsMode(req.body?.mode || req.query?.mode);
    const settings = await resetSiteSettings(mode);
    await createSiteSettingsSnapshot({
      mode,
      settings,
      name: "Återställd till standard",
      source: "reset",
      user,
    });
    await logAdminAction(req, user, "site_settings_reset_v2", "ui_settings", getSiteSettingsStorageKey(mode), {
      role,
      mode,
      version: settings.version,
    });
    return res.json({ ok: true, mode, settings });
  } catch (error) {
    if (error?.message === "INVALID_SITE_SETTINGS") {
      return jsonError(res, 400, "INVALID_SITE_SETTINGS", "Ogiltiga site settings.", error.validation || null);
    }
    console.error("Admin site settings reset error:", error);
    return jsonError(res, 500, "SITE_SETTINGS_RESET_FAILED", "Kunde inte aterstalla site settings.");
  }
});

app.post("/api/admin/v2/site-settings/clone-live-to-draft", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["ops", "admin"]);
    if (!access) return;
    const { user, role } = access;
    if (!requireServiceRoleKey(res)) return;

    const settings = await cloneLiveSettingsToDraft();
    await createSiteSettingsSnapshot({
      mode: "draft",
      settings: settings.draft,
      name: "Live kopierad till utkast",
      source: "clone_live",
      user,
    });
    await logAdminAction(req, user, "site_settings_clone_live_to_draft_v2", "ui_settings", SITE_SETTINGS_DRAFT_KEY, {
      role,
      version: settings.draft.version,
    });
    return res.json({ ok: true, settings });
  } catch (error) {
    console.error("Admin site settings clone error:", error);
    return jsonError(res, 500, "SITE_SETTINGS_CLONE_FAILED", "Kunde inte kopiera live till utkast.");
  }
});

app.post("/api/admin/v2/site-settings/rollback", async (req, res) => {
  if (!supabase) {
    return jsonError(res, 503, "SERVICE_UNAVAILABLE", "Supabase is not configured.");
  }
  try {
    const access = await requireAdminPermission(req, res, ["ops", "admin"]);
    if (!access) return;
    const { user, role } = access;
    if (!requireServiceRoleKey(res)) return;

    const mode = resolveSiteSettingsMode(req.body?.mode || req.query?.mode);
    const snapshotId = sanitizeText(req.body?.snapshot_id, 80);
    if (!snapshotId) {
      return jsonError(res, 400, "INVALID_SNAPSHOT_ID", "Ogiltigt snapshot-id.");
    }
    const entries = await readSiteSettingsHistory(mode);
    const entry = entries.find((item) => item.id === snapshotId);
    if (!entry) {
      return jsonError(res, 404, "SNAPSHOT_NOT_FOUND", "Versionen hittades inte.");
    }
    const settings = await writeSiteSettings(entry.settings, mode);
    await createSiteSettingsSnapshot({
      mode,
      settings,
      name: `Rollback: ${entry.name}`,
      source: "rollback",
      user,
    });
    await logAdminAction(req, user, "site_settings_rollback_v2", "ui_settings", getSiteSettingsStorageKey(mode), {
      role,
      mode,
      snapshot_id: entry.id,
      snapshot_name: entry.name,
    });
    return res.json({ ok: true, mode, settings, entry });
  } catch (error) {
    console.error("Admin site settings rollback error:", error);
    return jsonError(res, 500, "SITE_SETTINGS_ROLLBACK_FAILED", "Kunde inte återställa versionen.");
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

    const fallback = await getDefaultFpsSettingsForProduct(productId);
    if (error || !data?.value) {
      return res.json({ fps: fallback });
    }

    res.json({ fps: resolveEffectiveFpsSettings(data?.value, fallback) });
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

    const fallback = await getDefaultFpsSettingsForProduct(productId);
    const fps = sanitizeFpsSettings(req.body?.fps, fallback);
    const key = `fps:${productId}`;
    const payload = { key, value: { ...fps, source: "manual" }, updated_at: new Date() };

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
    res.json({ fps: resolveEffectiveFpsSettings(data?.value, fallback) });
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

    const fallback = await getDefaultFpsSettingsForProduct(productId);
    if (error || !data?.value) {
      const response = { fps: fallback };
      setCached(cacheKey, response);
      return res.json(response);
    }

    const response = { fps: resolveEffectiveFpsSettings(data?.value, fallback) };
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

let spaIndexTemplateCache = null;

const readSpaIndexTemplate = async () => {
  if (spaIndexTemplateCache) return spaIndexTemplateCache;
  spaIndexTemplateCache = await fs.readFile(path.join(distPath, "index.html"), "utf8");
  return spaIndexTemplateCache;
};

const escapeHtmlAttribute = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const replaceHeadTag = (html, pattern, replacement) =>
  pattern.test(html) ? html.replace(pattern, replacement) : html.replace("</head>", `  ${replacement}\n  </head>`);

const resolveRequestOrigin = (req) => {
  const forwardedProto = firstText(req.headers["x-forwarded-proto"]) || req.protocol || "https";
  const forwardedHost = firstText(req.headers["x-forwarded-host"], req.headers.host);
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  try {
    return new URL(FRONTEND_URLS[0] || "https://datorhuset.site").origin;
  } catch {
    return "https://datorhuset.site";
  }
};

const absolutizeSiteUrl = (value, origin) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  try {
    return new URL(raw.startsWith("/") ? raw : `/${raw}`, origin).toString();
  } catch {
    return raw;
  }
};

const buildDefaultSpaMeta = (origin, requestUrl) => ({
  title: "DatorHuset - Bygg Din Drömdator | Gaming PC & Professionella Datorer",
  description:
    "Högpresterande stationära datorer för gaming och professionellt bruk. Upptäck vårt sortiment av gaming PC, komponenter och expertservice.",
  type: "website",
  url: requestUrl || `${origin}/`,
  image: `${origin}/og-datorhuset.png`,
});

const LEGACY_PRODUCT_PREVIEW_IMAGE_MAP = new Map([
  ["2", "/products/newpc/chieftecvista_new.png"],
  ["silver-speedster", "/products/newpc/chieftecvista_new.png"],
  ["3", "/products/newpc/chieftecvisio_new.png"],
  ["guld-inferno", "/products/newpc/chieftecvisio_new.png"],
  ["5", "/products/newpc/chieftecvisio_new.png"],
  ["glimmrande-guldigaspiken", "/products/newpc/chieftecvisio_new.png"],
  ["7", "/products/newpc/cg530_new.png"],
  ["platina-sleeper", "/products/newpc/cg530_new.png"],
  ["9", "/products/newpc/cg530_new.png"],
  ["platina-frostbyte", "/products/newpc/cg530_new.png"],
  ["10", "/products/newpc/allblack-main.jpg"],
  ["all-black-all-out", "/products/newpc/allblack-main.jpg"],
  ["11", "/products/newpc/allwhite-1.jpg"],
  ["all-white-all-out", "/products/newpc/allwhite-1.jpg"],
]);

const normalizePreviewLookupKey = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2012-\u2015\u2212]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const resolveLegacyProductPreviewImage = (...keys) => {
  for (const key of keys) {
    const normalized = normalizePreviewLookupKey(key);
    if (!normalized) continue;
    const image = LEGACY_PRODUCT_PREVIEW_IMAGE_MAP.get(normalized);
    if (image) return image;
  }
  return null;
};

const buildProductMetaDescription = (product) => {
  const explicit = sanitizeText(product?.description, 220);
  if (explicit) return explicit;
  const generated = [
    sanitizeText(product?.cpu, 80),
    sanitizeText(product?.gpu, 80),
    sanitizeText(product?.ram, 40),
    [sanitizeText(product?.storage, 40), sanitizeText(product?.storage_type, 24)].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  return sanitizeText(generated, 220) || "Gamingdator från DatorHuset.";
};

const loadProductMetaByRoute = async (req, origin) => {
  if (!supabase || !req.path.startsWith("/computer/")) return null;
  const productKey = sanitizeText(decodeURIComponent(req.path.replace(/^\/computer\//, "")), 120);
  if (!productKey) return null;
  const selectFields = "id, name, slug, legacy_id, description, image_url, cpu, gpu, ram, storage, storage_type";
  const isUuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productKey);

  let data = null;
  let error = null;

  if (isUuidLike) {
    ({ data, error } = await supabase
      .from("products")
      .select(selectFields)
      .eq("id", productKey)
      .maybeSingle());
  }

  if (!data && !error) {
    ({ data, error } = await supabase
      .from("products")
      .select(selectFields)
      .or(`slug.eq.${productKey},legacy_id.eq.${productKey}`)
      .limit(1)
      .maybeSingle());
  }

  if (error || !data) {
    if (error) {
      console.warn("Dynamic product meta lookup failed:", error.message || error);
    }
    const legacyPreviewImage = resolveLegacyProductPreviewImage(productKey);
    if (!legacyPreviewImage) return null;
    return {
      title: "Dator | DatorHuset",
      description: "Gamingdator fran DatorHuset.",
      type: "product",
      url: `${origin}${req.originalUrl || req.url || req.path}`,
      image: absolutizeSiteUrl(legacyPreviewImage, origin),
    };
  }

  let configuredImagesValue = null;
  try {
    const { data: settingsData, error: settingsError } = await supabase
      .from("ui_settings")
      .select("value")
      .eq("key", `product_images:${data.id}`)
      .maybeSingle();
    if (settingsError) {
      console.warn("Dynamic product meta image lookup failed:", settingsError.message || settingsError);
    } else {
      configuredImagesValue = settingsData?.value ?? null;
    }
  } catch (settingsLookupError) {
    console.warn("Dynamic product meta image lookup crashed:", settingsLookupError);
  }

  const imageCandidates = parseProductImagesSetting(configuredImagesValue, sanitizeImageUrl(data.image_url) || "")
    .concat(resolveLegacyProductPreviewImage(data.legacy_id, data.slug, data.name, productKey) || "")
    .filter(Boolean);
  const imageUrl = absolutizeSiteUrl(imageCandidates[0] || "/og-datorhuset.png", origin);
  return {
    title: `${sanitizeText(data.name, 140) || "Dator"} | DatorHuset`,
    description: buildProductMetaDescription(data),
    type: "product",
    url: `${origin}${req.originalUrl || req.url || req.path}`,
    image: imageUrl,
  };
};

const resolveSpaMeta = async (req) => {
  const origin = resolveRequestOrigin(req);
  const requestUrl = `${origin}${req.originalUrl || req.url || req.path || "/"}`;
  const defaultMeta = buildDefaultSpaMeta(origin, requestUrl);
  const routeMeta = await loadProductMetaByRoute(req, origin);
  if (routeMeta) return routeMeta;
  if (req.path.startsWith("/custom-bygg")) {
    return {
      ...defaultMeta,
      title: "Custom bygg | DatorHuset",
      description: "Bygg din dator steg för steg och skicka en offertförfrågan till DatorHuset.",
      image: absolutizeSiteUrl("/products/newpc/allblack-main.jpg", origin),
    };
  }
  if (req.path.startsWith("/products")) {
    return {
      ...defaultMeta,
      title: "Produkter | DatorHuset",
      description: "Gamingdatorer, färdiga byggen och utvalda prestandapaket från DatorHuset.",
    };
  }
  return defaultMeta;
};

const injectSpaMeta = (html, meta) => {
  const safeTitle = escapeHtmlAttribute(meta.title);
  const safeDescription = escapeHtmlAttribute(meta.description);
  const safeUrl = escapeHtmlAttribute(meta.url);
  const safeImage = escapeHtmlAttribute(meta.image);
  const safeType = escapeHtmlAttribute(meta.type || "website");

  let nextHtml = html.replace(/<title>[^<]*<\/title>/i, `<title>${safeTitle}</title>`);
  nextHtml = replaceHeadTag(
    nextHtml,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${safeDescription}" />`,
  );
  nextHtml = replaceHeadTag(
    nextHtml,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${safeTitle}" />`,
  );
  nextHtml = replaceHeadTag(
    nextHtml,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${safeDescription}" />`,
  );
  nextHtml = replaceHeadTag(
    nextHtml,
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="${safeType}" />`,
  );
  nextHtml = replaceHeadTag(
    nextHtml,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${safeUrl}" />`,
  );
  nextHtml = replaceHeadTag(
    nextHtml,
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${safeImage}" />`,
  );
  nextHtml = replaceHeadTag(
    nextHtml,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${safeTitle}" />`,
  );
  nextHtml = replaceHeadTag(
    nextHtml,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${safeDescription}" />`,
  );
  nextHtml = replaceHeadTag(
    nextHtml,
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${safeImage}" />`,
  );
  nextHtml = replaceHeadTag(
    nextHtml,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${safeUrl}" />`,
  );
  return nextHtml;
};

const sendSpaIndex = async (req, res) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
  try {
    const template = await readSpaIndexTemplate();
    const meta = await resolveSpaMeta(req);
    return res.status(200).send(injectSpaMeta(template, meta));
  } catch (error) {
    console.error("SPA meta render failed:", error);
    return res.sendFile(path.join(distPath, "index.html"));
  }
};

// Serve built frontend
app.use(
  express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return;
      }
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
    },
  })
);
// Fallback for SPA routes (avoid wildcard path-to-regexp issues in Express 5)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  const extension = path.extname(req.path || "");
  if (extension) {
    if (req.path.startsWith("/assets/") && extension === ".js") {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      return res.status(200).send("window.location.reload(); export {};");
    }
    return res.status(404).end();
  }
  return sendSpaIndex(req, res);
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
  startCustomStorePriceScheduler().catch((error) => {
    logStructured("warn", "custom_price_scheduler_start_failed", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
  });
  startCustomBuildProductScheduler().catch((error) => {
    logStructured("warn", "custom_build_product_scheduler_start_failed", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
  });
});





