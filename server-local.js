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

dotenv.config();

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");

const FRONTEND_URLS = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:8080")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const isAllowedOrigin = (origin) => !origin || FRONTEND_URLS.includes(origin);
const STRIPE_WEBHOOK_ALLOWED_IPS = (process.env.STRIPE_WEBHOOK_ALLOWED_IPS || "")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const getRequestIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (Array.isArray(forwarded)) return forwarded[0]?.trim() || "";
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() || "";
  return (req.ip || "").trim();
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
};

// Middleware
app.use(helmet({ contentSecurityPolicy: { directives: cspDirectives } }));
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
app.use(express.json({ limit: "100kb" }));
app.use("/api/", apiLimiter);

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-12-18.acacia" })
  : null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";
const MAX_LINE_ITEMS = 50;
const MAX_QUANTITY = 10;
const PAYMENT_METHODS = ["card", "klarna", "paypal"];
const STATUS_OPTIONS = new Set(["received", "building", "finished"]);
const swedishPhoneRegex = /^(?:\+46|0)7\d{8}$/;
const swedishPostalRegex = /^\d{3}\s?\d{2}$/;
const swedishCityRegex = /^[A-Za-z\u00c5\u00c4\u00d6\u00e5\u00e4\u00f6.\s-]+$/;

const sanitizeText = (value, maxLength = 120) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const normalizePhone = (value) => sanitizeText(value, 32).replace(/\s+/g, "");

const getAuthUser = async (req) => {
  if (!supabase) {
    return { user: null, error: "Supabase not configured." };
  }
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return { user: null, error: "Missing auth token." };
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { user: null, error: error?.message || "Invalid auth token." };
  }
  return { user: data.user, error: null };
};

/**
 * POST /api/create-checkout-session
 */
app.post("/api/create-checkout-session", async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: "Stripe not configured. Set STRIPE_SECRET_KEY to enable checkout." });
  }
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." });
  }

  try {
    const { cartItems, userEmail, fullName, phone, address, postalCode, city } = req.body || {};
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

    let line_items = [];
    if (supabase) {
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

      line_items = dbCartItems.map((item) => {
        const quantity = Math.min(MAX_QUANTITY, Math.max(1, Number(item.quantity) || 1));
        const unitAmount = Number(item.product?.price_cents || 0);
        if (!unitAmount || unitAmount < 1) {
          throw new Error("Invalid product price");
        }
        return {
          price_data: {
            currency: "sek",
            product_data: { name: item.product?.name || "Produkt" },
            unit_amount: unitAmount,
          },
          quantity,
        };
      });
    } else if (Array.isArray(cartItems) && cartItems.length > 0) {
      if (cartItems.length > MAX_LINE_ITEMS) {
        return res.status(400).json({ error: "Too many items in cart" });
      }
      line_items = cartItems.map((item) => {
        const quantity = Math.min(MAX_QUANTITY, Math.max(1, Number(item.quantity) || 1));
        const unitAmount = Number(item.unitPriceCents || 0);
        if (!unitAmount || unitAmount < 1) {
          throw new Error("Invalid product price");
        }
        return {
          price_data: {
            currency: "sek",
            product_data: { name: sanitizeText(item.productName, 120) || "Produkt" },
            unit_amount: unitAmount,
          },
          quantity,
        };
      });
    } else {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const paymentMethodTypes = [...PAYMENT_METHODS];
    const customPaymentMethod = process.env.STRIPE_CUSTOM_PAYMENT_METHOD_ID;
    if (customPaymentMethod) {
      paymentMethodTypes.push(customPaymentMethod);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      line_items,
      mode: "payment",
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
      },
      success_url: `${FRONTEND_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/cart`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Create checkout session error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
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
    const isAdmin =
      user.user_metadata?.is_admin === true ||
      user.user_metadata?.role === "admin" ||
      user.app_metadata?.is_admin === true ||
      user.app_metadata?.role === "admin";
    if (!isAdmin) {
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

app.post("/api/orders/:orderId/status", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured." });
  }
  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: authError || "Unauthorized" });
    }
    const isAdmin =
      user.user_metadata?.is_admin === true ||
      user.user_metadata?.role === "admin" ||
      user.app_metadata?.is_admin === true ||
      user.app_metadata?.role === "admin";
    if (!isAdmin) {
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
      .select()
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
  } catch (error) {
    console.error("Update order status error:", error);
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object; // JS only
    try {
      await handleSuccessfulPayment(session);
      console.log("[webhook] handled checkout.session.completed", session.id);
    } catch (error) {
      console.error("Error handling successful payment:", error);
      return res.status(500).json({ error: "Failed to process payment" });
    }
  }

  res.json({ received: true });
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
  const totalAmount = stripeSession.amount_total;

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

  const userId = user.id;

  const { data: cartItems, error: cartError } = await supabase
    .from("cart_items")
    .select("*, product:product_id (*)")
    .eq("user_id", userId);

  if (cartError || !cartItems) {
    throw new Error(`Failed to fetch cart: ${cartError?.message}`);
  }

  if (cartItems.length === 0) {
    throw new Error("Cart is empty");
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        user_id: userId,
        status: "paid",
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
      },
    ])
    .select()
    .single();

  if (orderError || !order) {
    throw new Error(`Failed to create order: ${orderError?.message}`);
  }

  const orderItems = cartItems.map((cartItem) => ({
    order_id: order.id,
    product_id: cartItem.product_id,
    unit_price_cents: cartItem.product?.price_cents || 0,
    quantity: cartItem.quantity,
  }));

  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (orderItemsError) {
    throw new Error(`Failed to create order items: ${orderItemsError.message}`);
  }

  for (const cartItem of cartItems) {
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
