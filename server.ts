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

/**
 * Create Stripe Checkout Session
 * POST /api/create-checkout-session
 */
export async function createCheckoutSession(req: any, res: any) {
  try {
    const { cartItems, userEmail, fullName, totalCents } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    if (!userEmail || !fullName) {
      return res.status(400).json({ error: "Missing user information" });
    }

    // Build line items for Stripe
    const line_items = cartItems.map((item: any) => ({
      price_data: {
        currency: "sek",
        product_data: {
          name: item.productName,
        },
        unit_amount: item.unitPriceCents, // Already in cents (öre)
      },
      quantity: item.quantity,
    }));

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: line_items,
      mode: "payment",
      customer_email: userEmail,
      metadata: {
        fullName: fullName,
        userEmail: userEmail,
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
 * 1. Set up the webhook in Stripe Dashboard → Developers → Webhooks
 * 2. Point it to: https://your-domain.com/api/webhook
 * 3. Select events: checkout.session.completed, payment_intent.succeeded
 */
export async function handleStripeWebhook(req: any, res: any) {
  const sig = req.headers["stripe-signature"];

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
  const totalAmount = stripeSession.amount_total; // in cents/öre

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
        customer_email: userEmail,
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

  console.log(`✅ Order created for ${userEmail}: ${order.id}`);

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
