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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";
const FRONTEND_URLS = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:8080")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const STRIPE_WEBHOOK_ALLOWED_IPS = (process.env.STRIPE_WEBHOOK_ALLOWED_IPS || "")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);
const MAX_LINE_ITEMS = 50;
const MAX_QUANTITY = 10;
const PAYMENT_METHODS = ["card", "klarna", "paypal"];
const STATUS_OPTIONS = new Set(["received", "building", "finished"]);
const swedishPhoneRegex = /^(?:\+46|0)7\d{8}$/;
const swedishPostalRegex = /^\d{3}\s?\d{2}$/;
const swedishCityRegex = /^[A-Za-z\u00c5\u00c4\u00d6\u00e5\u00e4\u00f6.\s-]+$/;

const sanitizeText = (value: any, maxLength = 120) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
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

async function getAuthUser(req: any) {
  const authHeader = req?.headers?.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
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
    const { cartItems, userEmail, fullName, phone, address, postalCode, city } = req.body;

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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      line_items: line_items,
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
    console.error("Stripe error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
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

  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    try {
      await handleSuccessfulPayment(session);
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
  const totalAmount = stripeSession.amount_total; // in cents/ore

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

  const userId = user.id;

  // Fetch user's cart from Supabase
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

  // Create order in Supabase
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

  // Create order_items
  const orderItems = cartItems.map((cartItem: any) => ({
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

  // Update inventory (optional - decrease stock)
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

  // Clear user's cart
  const { error: clearError } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", userId);

  if (clearError) {
    console.error("Warning: Failed to clear cart:", clearError);
  }

  console.log(`Order created for ${userEmail}: ${order.id}`);

  // Optionally: Send confirmation email
  // await sendConfirmationEmail(userEmail, fullName, order.id);
}

/**
 * Get order details
 * GET /api/orders/:orderId
 */
export async function getOrder(req: any, res: any) {
  try {
    const { orderId } = req.params;
    const { userId } = req.body; // Should come from auth middleware

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
      .eq("user_id", userId)
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

    const isAdmin =
      user.user_metadata?.is_admin === true ||
      user.user_metadata?.role === "admin" ||
      user.app_metadata?.is_admin === true ||
      user.app_metadata?.role === "admin";
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
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
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
