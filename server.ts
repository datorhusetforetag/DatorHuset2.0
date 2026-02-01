/**
 * Stripe Checkout Backend API
 * 
 * This is a Node.js/Express server that handles Stripe checkout sessions.
 * You can deploy this to Vercel, Netlify, Render, or your own server.
 * 
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY (from https://dashboard.stripe.com/apikeys)
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - FRONTEND_URL (e.g., http://localhost:8080 for dev)
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const HAS_SERVICE_ROLE_KEY = SUPABASE_SERVICE_ROLE_KEY.trim().length > 0;

const supabase = createClient(process.env.SUPABASE_URL || "", SUPABASE_SERVICE_ROLE_KEY);

if (!HAS_SERVICE_ROLE_KEY) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY is missing. Admin inventory updates require the service role key to bypass RLS."
  );
}

const RAW_FRONTEND_URL = process.env.FRONTEND_URL || "";
const FRONTEND_URLS = (process.env.FRONTEND_URLS || RAW_FRONTEND_URL || "http://localhost:8080")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const FRONTEND_URL = RAW_FRONTEND_URL || FRONTEND_URLS[0] || "http://localhost:8080";
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
const MAX_LINE_ITEMS = 50;
const MAX_QUANTITY = 10;
const PAYMENT_METHODS = ["card", "klarna", "paypal"];
const CUSTOM_PAYMENT_METHOD = process.env.STRIPE_CUSTOM_PAYMENT_METHOD_ID;
const ALLOWED_PAYMENT_METHODS = new Set([
  ...PAYMENT_METHODS,
  ...(CUSTOM_PAYMENT_METHOD ? [CUSTOM_PAYMENT_METHOD] : []),
]);
const CHECKOUT_RATE_LIMIT_MAX = Number(process.env.CHECKOUT_RATE_LIMIT_MAX || 8);
const CHECKOUT_RATE_LIMIT_WINDOW_MS = Number(process.env.CHECKOUT_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000);
const ADMIN_RATE_LIMIT_MAX = Number(process.env.ADMIN_RATE_LIMIT_MAX || 120);
const ADMIN_RATE_LIMIT_WINDOW_MS = Number(process.env.ADMIN_RATE_LIMIT_WINDOW_MS || 5 * 60 * 1000);
const RATE_LIMIT_STORE = new Map<string, { count: number; resetAt: number }>();
const STATUS_OPTIONS = new Set([
  "received",
  "ordering",
  "building",
  "postbuild",
  "ready",
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
const STATUS_LABELS: Record<string, string> = {
  received: "Best\u00e4llning mottagen",
  ordering: "Best\u00e4ller komponenterna",
  building: "Bygger",
  postbuild: "Post-bygg justeringar",
  ready: "Redo att h\u00e4mta/frakta!",
  pending: "Best\u00e4llning mottagen",
  in_progress: "Bygger",
  finished: "Redo att h\u00e4mta/frakta!",
  completed: "Redo att h\u00e4mta/frakta!",
};
const READY_MESSAGE =
  "DatorHuset kommer ringa dig ang\u00e5ende n\u00e4r och vart du kan h\u00e4mta upp datorn. Vi kommer ringa dig och skicka ett mejl.";
const DEFAULT_FPS_SETTINGS = { dlssMultiplier: 1.2, frameGenMultiplier: 1.15 };

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
const DEFAULT_SUPPORT_TO = "support@datorhuset.site";
const SERVICE_REQUEST_TO = process.env.SERVICE_REQUEST_TO || DEFAULT_SUPPORT_TO;
const OFFER_REQUEST_TO = process.env.OFFER_REQUEST_TO || DEFAULT_SUPPORT_TO;
const SERVICE_REQUEST_RATE_LIMIT_MAX = Number(process.env.SERVICE_REQUEST_RATE_LIMIT_MAX || 5);
const SERVICE_REQUEST_RATE_LIMIT_WINDOW_MS = Number(process.env.SERVICE_REQUEST_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
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

const sanitizeText = (value: any, maxLength = 120) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char] || char;
  });

const parseMultiplier = (value: any, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, parsed);
};

const parseOptionalMultiplier = (value: any) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, parsed);
};

const normalizePhone = (value: any) => sanitizeText(value, 32).replace(/\s+/g, "");

const getRequestIp = (req: any) => {
  const forwarded = req?.headers?.["x-forwarded-for"];
  if (Array.isArray(forwarded)) return forwarded[0]?.trim() || "";
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() || "";
  return (req?.ip || "").trim();
};

const isAllowedStripeIp = (req: any) => {
  if (STRIPE_WEBHOOK_ALLOWED_IPS.length === 0) return true;
  const ip = getRequestIp(req);
  return STRIPE_WEBHOOK_ALLOWED_IPS.includes(ip);
};

const isRateLimited = (key: string, max: number, windowMs: number) => {
  const now = Date.now();
  const entry = RATE_LIMIT_STORE.get(key);
  if (!entry || entry.resetAt <= now) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= max) {
    return true;
  }
  entry.count += 1;
  return false;
};

const isAdminUser = (user: any) => {
  const isAdmin = user?.app_metadata?.is_admin === true || user?.app_metadata?.role === "admin";
  if (!isAdmin) return false;
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(value);

const formatOrderNumber = (order: any) => {
  const raw = order?.order_number;
  if (raw === null || raw === undefined || raw === "") {
    return order?.id ? order.id.slice(0, 8) : "-";
  }
  return String(raw);
};

const sendEmail = async ({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) => {
  if (!defaultMailer) return;
  await defaultMailer.sendMail({ from: SMTP_FROM, to, subject, html, replyTo });
};

const sendSupportEmail = async ({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) => {
  if (!supportMailer) return;
  await supportMailer.sendMail({ from: SUPPORT_SMTP_FROM, to, subject, html, replyTo });
};

const logAdminAction = async (
  req: any,
  user: any,
  action: string,
  resourceType: string,
  resourceId: string | null,
  metadata: Record<string, any> | null
) => {
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

const recordWebhookEvent = async (event: any) => {
  if (!event?.id) return { duplicate: false };
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

const requireServiceRoleKey = (res: any) => {
  if (HAS_SERVICE_ROLE_KEY) return true;
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY is missing. Admin mutations require the service role key to bypass RLS."
  );
  res.status(503).json({
    error: "SUPABASE_SERVICE_ROLE_KEY is missing. Admin mutations are unavailable.",
  });
  return false;
};

const buildOrderEmailHtml = ({
  headline,
  intro,
  order,
  items,
  statusNote,
}: {
  headline: string;
  intro: string;
  order: any;
  items: { name: string; quantity: number; total: number }[];
  statusNote?: string | null;
}) => {
  const itemLines = items
    .map((item) => `<li>${item.name} x${item.quantity} \u2013 ${formatCurrency(item.total)}</li>`)
    .join("");
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
      <h2>${headline}</h2>
      <p>${intro}</p>
      <p><strong>Ordernummer:</strong> ${formatOrderNumber(order)}</p>
      <p><strong>Total:</strong> ${formatCurrency((order.total_cents || 0) / 100)}</p>
      <ul>${itemLines}</ul>
      ${statusNote ? `<p><strong>Status:</strong> ${statusNote}</p>` : ""}
      <p>Har du fr\u00e5gor? Svara p\u00e5 det h\u00e4r mailet s\u00e5 hj\u00e4lper vi dig.</p>
    </div>
  `;
};

async function getAuthUser(req: any) {
  const authHeader = req?.headers?.authorization || "";
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
}

/**
 * Create Stripe Checkout Session
 * POST /api/create-checkout-session
 */
export async function createCheckoutSession(req: any, res: any) {
  try {
    const { cartItems, userEmail, fullName, phone, address, postalCode, city, addressId } = req.body;

    if (req?.headers?.origin && !FRONTEND_URLS.includes(req.headers.origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }

    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }

    const customerEmail = sanitizeText(user.email || userEmail, 120);
    const safeFullName = sanitizeText(fullName || user.user_metadata?.full_name || user.user_metadata?.username, 120);
    const safePhone = normalizePhone(phone);
    const safeAddress = sanitizeText(address, 200);
    const safePostalCode = sanitizeText(postalCode, 16);
    const safeCity = sanitizeText(city, 80);
    const safeAddressId = sanitizeText(addressId, 60);

    if (!customerEmail || !safeFullName || !safePhone || !safeAddress || !safePostalCode || !safeCity) {
      return res.status(400).json({ error: "Missing user information" });
    }
    if (!swedishPhoneRegex.test(safePhone)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }
    if (!swedishPostalRegex.test(safePostalCode)) {
      return res.status(400).json({ error: "Invalid postal code" });
    }
    if (!swedishCityRegex.test(safeCity)) {
      return res.status(400).json({ error: "Invalid city" });
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

    const line_items = dbCartItems.map((item: any) => {
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

    const paymentMethodTypes = [...PAYMENT_METHODS];
    const customPaymentMethod = process.env.STRIPE_CUSTOM_PAYMENT_METHOD_ID;
    if (customPaymentMethod) {
      paymentMethodTypes.push(customPaymentMethod);
    }

    const requestOrigin = req?.headers?.origin;
    const checkoutBaseUrl =
      requestOrigin && FRONTEND_URLS.includes(requestOrigin) ? requestOrigin : FRONTEND_URL;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      line_items: line_items,
      mode: "payment",
      client_reference_id: user.id,
      customer_email: customerEmail,
      billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["SE"] },
      locale: "sv",
      metadata: {
        userId: user.id,
        fullName: safeFullName,
        userEmail: customerEmail,
        phone: safePhone,
        address: safeAddress,
        postalCode: safePostalCode,
        city: safeCity,
        addressId: safeAddressId,
      },
      success_url: `${checkoutBaseUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${checkoutBaseUrl}/cart`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Submit service request
 * POST /api/service-request
 */
export async function submitServiceRequest(req: any, res: any) {
  try {
    if (req?.headers?.origin && !FRONTEND_URLS.includes(req.headers.origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }

    const serviceKey = `service:${getRequestIp(req)}`;
    if (isRateLimited(serviceKey, SERVICE_REQUEST_RATE_LIMIT_MAX, SERVICE_REQUEST_RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many requests" });
    }

    if (!supportMailer) {
      return res.status(503).json({ error: "Support email service not configured" });
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
        <p>${escapeHtml(notes).replace(/\n/g, "<br />")}</p>
      </div>
    `;

    await sendSupportEmail({
      to: SERVICE_REQUEST_TO,
      subject: `Servicef\u00f6rfr\u00e5gan fr\u00e5n ${name}`,
      html,
      replyTo: email,
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Service request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Submit offer request
 * POST /api/offer-request
 */
export async function submitOfferRequest(req: any, res: any) {
  try {
    if (req?.headers?.origin && !FRONTEND_URLS.includes(req.headers.origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }

    if (!supportMailer) {
      return res.status(503).json({ error: "Support email service not configured" });
    }

    const name = sanitizeText(req.body?.name, 120);
    const email = sanitizeText(req.body?.email, 120).toLowerCase();
    const phone = sanitizeText(req.body?.phone, 32);
    const notes = sanitizeText(req.body?.notes, 2000);
    const totalPrice = Number(req.body?.totalPrice || 0);
    const shareUrl = sanitizeText(req.body?.shareUrl, 500);
    const components = Array.isArray(req.body?.components) ? req.body.components : [];
    const componentLines = components
      .map((item: any) => ({
        category: sanitizeText(item?.category, 80),
        name: sanitizeText(item?.name, 160),
        price: Number(item?.price || 0),
      }))
      .filter((item: any) => item.category && item.name);

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
            (item: any) =>
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
      subject: `Offertförfrågan från ${name}`,
      html,
      replyTo: email,
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Offer request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * User: get saved addresses
 * GET /api/addresses
 */
export async function getUserAddresses(req: any, res: any) {
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!requireServiceRoleKey(res)) {
      return;
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

    res.json(data || []);
  } catch (error) {
    console.error("Get addresses error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * User: create address
 * POST /api/addresses
 */
export async function createUserAddress(req: any, res: any) {
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!requireServiceRoleKey(res)) {
      return;
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

    res.json(data);
  } catch (error) {
    console.error("Create address error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * User: set default address
 * POST /api/addresses/:addressId/default
 */
export async function setDefaultUserAddress(req: any, res: any) {
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!requireServiceRoleKey(res)) {
      return;
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

    res.json(data);
  } catch (error) {
    console.error("Set default address error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * User: delete address
 * DELETE /api/addresses/:addressId
 */
export async function deleteUserAddress(req: any, res: any) {
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!requireServiceRoleKey(res)) {
      return;
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

    res.json({ ok: true });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Webhook handler for Stripe
 * POST /api/webhook
 * 
 * This endpoint receives webhooks from Stripe when payments complete.
 * You must:
 * 1. Set up the webhook in Stripe Dashboard -> Developers -> Webhooks
 * 2. Point it to: https://your-domain.com/api/webhook
 * 3. Select events: checkout.session.completed, payment_intent.succeeded
 */
export async function handleStripeWebhook(req: any, res: any) {
  const sig = req.headers["stripe-signature"];

  if (!isAllowedStripeIp(req)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!sig) {
    return res.status(400).json({ error: "No stripe-signature header" });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody, // Important: use raw body, not parsed JSON
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return res.status(400).json({ error: "Webhook signature failed" });
  }

  if (STRIPE_EXPECT_LIVEMODE !== null && event.livemode !== STRIPE_EXPECT_LIVEMODE) {
    console.warn("Webhook livemode mismatch", { eventId: event.id, livemode: event.livemode });
    return res.status(400).json({ error: "Invalid livemode" });
  }

  const { duplicate } = await recordWebhookEvent(event);
  if (duplicate) {
    return res.json({ received: true, duplicate: true });
  }

  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    try {
      await handleSuccessfulPayment(session);
      if (event.id) {
        await supabase
          .from("stripe_webhook_events")
          .update({ processed_at: new Date() })
          .eq("event_id", event.id);
      }
    } catch (error) {
      console.error("Error handling successful payment:", error);
      return res.status(500).json({ error: "Failed to process payment" });
    }
  }

  res.json({ received: true });
}

/**
 * Process successful payment:
 * 1. Get user by email
 * 2. Create order in Supabase
 * 3. Create order_items
 * 4. Clear user's cart
 * 5. Send confirmation email (optional)
 */
async function handleSuccessfulPayment(stripeSession: any) {
  const userEmail = stripeSession.customer_email;
  const fullName = stripeSession.metadata?.fullName;
  const sessionId = stripeSession.id;
  const totalAmount = Number(stripeSession.amount_total ?? 0); // in cents/ore
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
    // Get user by email from Supabase auth
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

  const orderItems = lineItems.map((lineItem) => {
    const quantity = Math.min(MAX_QUANTITY, Math.max(1, Number(lineItem.quantity) || 1));
    const unitAmount = Number(lineItem.price?.unit_amount ?? 0);
    const productMeta =
      lineItem.price?.product && typeof lineItem.price.product === "object"
        ? (lineItem.price.product as any).metadata
        : null;
    const productId = sanitizeText(productMeta?.product_id, 64);
    if (!productId) {
      throw new Error("Missing product metadata on line item");
    }
    if (!unitAmount || unitAmount < 1) {
      throw new Error("Invalid line item price");
    }
    return {
      product_id: productId,
      unit_price_cents: unitAmount,
      quantity,
    };
  });

  const emailItems = lineItems.map((lineItem) => {
    const quantity = Math.min(MAX_QUANTITY, Math.max(1, Number(lineItem.quantity) || 1));
    const unitAmount = Number(lineItem.price?.unit_amount ?? 0);
    return {
      name: lineItem.description || "Produkt",
      quantity,
      total: (unitAmount * quantity) / 100,
    };
  });

  const lineItemTotal = orderItems.reduce(
    (sum, item) => sum + item.unit_price_cents * item.quantity,
    0
  );
  if (lineItemTotal !== totalAmount) {
    console.warn(`Line item total mismatch for session ${sessionId}`);
  }

  // Create order in Supabase
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
    } catch (error) {
      console.warn("Failed to attach receipt URL", error);
    }
  }

  // Create order_items
  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));

  if (orderItemsError) {
    throw new Error(`Failed to create order items: ${orderItemsError.message}`);
  }

  // Update inventory (optional - decrease stock)
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

  // Clear user's cart
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
    subject: "Din order hos DatorHuset är mottagen",
    html: buildOrderEmailHtml({
      headline: "Tack för din beställning!",
      intro: `Hej ${stripeSession.metadata?.fullName || fullName || ""}! Vi har tagit emot din order och börjar behandla den.`,
      order,
      items: emailItems,
      statusNote: "Order mottagen",
    }),
  });

  // Optionally: Send confirmation email
  // await sendConfirmationEmail(userEmail, fullName, order.id);
}

/**
 * Get order details
 * GET /api/orders/:orderId
 */
export async function getOrder(req: any, res: any) {
  try {
    const orderId = sanitizeText(req.params?.orderId, 64);
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    const checkoutKey = `checkout:${user.id}:${getRequestIp(req)}`;
    if (isRateLimited(checkoutKey, CHECKOUT_RATE_LIMIT_MAX, CHECKOUT_RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many checkout attempts" });
    }
    if (!/^[0-9a-fA-F-]{36}$/.test(orderId)) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    const { data: order, error } = await supabase
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
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Customer: get order number by Stripe session id
 * GET /api/orders/by-session/:sessionId
 */
export async function getOrderBySession(req: any, res: any) {
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
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Admin: Get all orders
 * GET /api/admin/orders
 */
export async function getAdminOrders(req: any, res: any) {
  try {
    if (req?.headers?.origin && !FRONTEND_URLS.includes(req.headers.origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }

    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }

    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const adminKey = `admin:${user.id}:${getRequestIp(req)}`;
    if (isRateLimited(adminKey, ADMIN_RATE_LIMIT_MAX, ADMIN_RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many admin requests" });
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
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Admin: Update order status
 * POST /api/orders/:orderId/status
 */
export async function updateOrderStatusAdmin(req: any, res: any) {
  try {
    const { orderId } = req.params;
    const nextStatus = sanitizeText(req.body?.status, 32);

    if (req?.headers?.origin && !FRONTEND_URLS.includes(req.headers.origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }

    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }

    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const adminKey = `admin:${user.id}:${getRequestIp(req)}`;
    if (isRateLimited(adminKey, ADMIN_RATE_LIMIT_MAX, ADMIN_RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many admin requests" });
    }
    if (!requireServiceRoleKey(res)) {
      return;
    }

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
        subject: "Uppdatering om din order hos DatorHuset",
        html: buildOrderEmailHtml({
          headline: "Uppdatering om din order",
          intro: `Hej ${data.customer_name || ""}! Vi har uppdaterat statusen p? din order.`,
          order: data,
          items: (data.order_items || []).map((item: any) => ({
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
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Admin: get current admin status
 * GET /api/admin/me
 */
export async function getAdminMe(req: any, res: any) {
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    const adminKey = `admin:${user.id}:${getRequestIp(req)}`;
    if (isRateLimited(adminKey, ADMIN_RATE_LIMIT_MAX, ADMIN_RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many admin requests" });
    }
    return res.json({ id: user.id, email: user.email, isAdmin: isAdminUser(user) });
  } catch (error) {
    console.error("Admin me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Admin: get inventory
 * GET /api/admin/inventory
 */
export async function getAdminInventory(req: any, res: any) {
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const adminKey = `admin:${user.id}:${getRequestIp(req)}`;
    if (isRateLimited(adminKey, ADMIN_RATE_LIMIT_MAX, ADMIN_RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many admin requests" });
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
}

/**
 * Admin: update inventory
 * POST /api/admin/inventory
 */
export async function updateAdminInventory(req: any, res: any) {
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
    const adminKey = `admin:${user.id}:${getRequestIp(req)}`;
    if (isRateLimited(adminKey, ADMIN_RATE_LIMIT_MAX, ADMIN_RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many admin requests" });
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
}

/**
 * Admin: get products for UI editing
 * GET /api/admin/products
 */
export async function getAdminProducts(req: any, res: any) {
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const adminKey = `admin:${user.id}:${getRequestIp(req)}`;
    if (isRateLimited(adminKey, ADMIN_RATE_LIMIT_MAX, ADMIN_RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many admin requests" });
    }

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, legacy_id, description, cpu, gpu, ram, storage, storage_type, tier, motherboard, psu, case_name, cpu_cooler, os, dlss_multiplier, frame_gen_multiplier"
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
}

/**
 * Admin: update product UI details
 * POST /api/admin/products/:productId
 */
export async function updateAdminProduct(req: any, res: any) {
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
    const adminKey = `admin:${user.id}:${getRequestIp(req)}`;
    if (isRateLimited(adminKey, ADMIN_RATE_LIMIT_MAX, ADMIN_RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many admin requests" });
    }

    const { productId } = req.params;
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
    const dlssMultiplier = parseOptionalMultiplier(req.body?.dlss_multiplier);
    const frameGenMultiplier = parseOptionalMultiplier(req.body?.frame_gen_multiplier);

    if (!productId) {
      return res.status(400).json({ error: "Missing productId" });
    }
    if (!name) {
      return res.status(400).json({ error: "Missing product name" });
    }

    const payload: Record<string, any> = {
      name,
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
      dlss_multiplier: dlssMultiplier,
      frame_gen_multiplier: frameGenMultiplier,
      updated_at: new Date(),
    };

    const { data, error } = await supabase.from("products").update(payload).eq("id", productId).select().single();

    if (error || !data) {
      console.error("Product update failed:", error);
      return res.status(500).json({ error: error?.message || "Failed to update product" });
    }

    await logAdminAction(req, user, "product_update", "product", productId, {
      name,
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

    res.json(data);
  } catch (error) {
    console.error("Admin product update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Admin: get UI settings (FPS)
 * GET /api/admin/ui-settings
 */
export async function getAdminUiSettings(req: any, res: any) {
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const adminKey = `admin:${user.id}:${getRequestIp(req)}`;
    if (isRateLimited(adminKey, ADMIN_RATE_LIMIT_MAX, ADMIN_RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many admin requests" });
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
}

/**
 * Admin: update UI settings (FPS)
 * POST /api/admin/ui-settings
 */
export async function updateAdminUiSettings(req: any, res: any) {
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
    const adminKey = `admin:${user.id}:${getRequestIp(req)}`;
    if (isRateLimited(adminKey, ADMIN_RATE_LIMIT_MAX, ADMIN_RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many admin requests" });
    }

    const fps = req.body?.fps || {};
    const dlssMultiplier = parseMultiplier(fps.dlssMultiplier, DEFAULT_FPS_SETTINGS.dlssMultiplier);
    const frameGenMultiplier = parseMultiplier(
      fps.frameGenMultiplier,
      DEFAULT_FPS_SETTINGS.frameGenMultiplier
    );

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
}

/**
 * Admin: update build checklist
 * POST /api/admin/orders/:orderId/checklist
 */
export async function updateOrderChecklist(req: any, res: any) {
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
    const adminKey = `admin:${user.id}:${getRequestIp(req)}`;
    if (isRateLimited(adminKey, ADMIN_RATE_LIMIT_MAX, ADMIN_RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many admin requests" });
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
}

/**
 * Admin: export orders CSV
 * GET /api/admin/orders.csv
 */
export async function exportOrdersCsv(req: any, res: any) {
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const adminKey = `admin:${user.id}:${getRequestIp(req)}`;
    if (isRateLimited(adminKey, ADMIN_RATE_LIMIT_MAX, ADMIN_RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many admin requests" });
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

    const escapeCsv = (value: any) => {
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
      ...(data || []).map((order: any) => {
        const items = (order.order_items || [])
          .map((item: any) => `${item.product?.name || "Produkt"} x${item.quantity}`)
          .join("; ");
        return [
          order.order_number ?? order.id,
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
}

/**
 * Admin: audit logs
 * GET /api/admin/logs
 */
export async function getAdminLogs(req: any, res: any) {
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const adminKey = `admin:${user.id}:${getRequestIp(req)}`;
    if (isRateLimited(adminKey, ADMIN_RATE_LIMIT_MAX, ADMIN_RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ error: "Too many admin requests" });
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
}
