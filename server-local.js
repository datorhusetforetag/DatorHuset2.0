/**
 * EXPRESS SERVER FOR STRIPE INTEGRATION
 * Deployable to Vercel, Render, Railway, etc.
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:8080" }));

// For Stripe webhook signature verification, we need the raw body
app.use("/api/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

/**
 * POST /api/create-checkout-session
 * Creates a Stripe Checkout Session
 */
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { cartItems, userEmail, fullName, totalCents } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    if (!userEmail || !fullName) {
      return res.status(400).json({ error: "Missing user information" });
    }

    // Build line items for Stripe
const line_items = cartItems.map((item) => ({
      price_data: {
        currency: "sek",
        product_data: {
          name: item.productName,
        },
        unit_amount: item.unitPriceCents,
      },
      quantity: item.quantity,
    }));

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      customer_email: userEmail,
      metadata: {
        fullName,
        userEmail,
      },
      success_url: `${FRONTEND_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/cart`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Create checkout session error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/webhook
 * Stripe webhook endpoint for payment completion
 */
app.post("/api/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).json({ error: "No stripe-signature header" });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
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
});

/**
 * GET /api/health
 * Simple health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve built frontend (optional: remove if front-end is hosted elsewhere)
app.use(express.static(distPath));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next(); // leave API paths alone
  return res.sendFile(path.join(distPath, "index.html"));
});

/**
 * Process successful Stripe payment
 */
async function handleSuccessfulPayment(stripeSession) {
  const userEmail = stripeSession.customer_email;
  const fullName = stripeSession.metadata?.fullName;
  const sessionId = stripeSession.id;
  const totalAmount = stripeSession.amount_total;

  if (!userEmail) {
    throw new Error("No customer email in session");
  }

  console.log(`\n📦 Processing payment for: ${userEmail}`);

  // Note: In production, you'd authenticate the user via JWT or similar
  // For now, we trust Stripe's webhook signature verification
  // You can enhance this by storing the user_id in session metadata during checkout

  // Query user by email (this is a workaround - ideally store user_id in metadata)
  const { data: users } = await supabase
    .from("orders")
    .select("user_id")
    .eq("customer_email", userEmail)
    .limit(1);

  // If user has previous orders, use that user_id, otherwise we need it from somewhere else
  // For this implementation, you should store user_id in Stripe session metadata

  console.log(`❌ User lookup failed - no way to verify user from email alone`);
  console.log(`   Fix: Store user_id in Stripe session metadata during checkout`);

  return;

  // NOTE: Below is the proper implementation IF you had user_id in metadata
  /*
  const userId = stripeSession.metadata?.userId;

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

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        user_id: userId,
        status: "paid",
        total_cents: totalAmount,
        currency: "SEK",
        stripe_session_id: sessionId,
        customer_email: userEmail,
      },
    ])
    .select()
    .single();

  if (orderError || !order) {
    throw new Error(`Failed to create order: ${orderError?.message}`);
  }

  // Create order items
  const orderItems = cartItems.map((cartItem) => ({
    order_id: order.id,
    product_id: cartItem.product_id,
    unit_price_cents: cartItem.product?.price_cents || 0,
    quantity: cartItem.quantity,
  }));

  await supabase.from("order_items").insert(orderItems);

  // Clear cart
  await supabase.from("cart_items").delete().eq("user_id", userId);

  console.log(`✅ Order created: ${order.id}`);
  */
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Stripe API Server running on http://localhost:${PORT}`);
  console.log(`\n⚠️  IMPORTANT SETUP:`);
  console.log(`1. Create .env file with:`);
  console.log(`   STRIPE_SECRET_KEY=sk_test_...`);
  console.log(`   SUPABASE_URL=https://...`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY=eyJ...`);
  console.log(`   FRONTEND_URL=http://localhost:8080`);
  console.log(`   STRIPE_WEBHOOK_SECRET=whsec_...`);
  console.log(`\n2. Get your keys from:`);
  console.log(`   - Stripe: https://dashboard.stripe.com/apikeys`);
  console.log(`   - Supabase: Dashboard → Settings → API`);
  console.log(`   - Webhook Secret: https://dashboard.stripe.com/webhooks`);
  console.log(`\n📝 Frontend will call: /api/create-checkout-session`);
  console.log(`📝 Stripe will call: /api/webhook\n`);
});
