# Supabase Database Setup Guide

## Step 1: Run the SQL Schema

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"** (or paste into an existing query)
3. Copy the entire content from `docs/supabase-schema.sql`
4. Paste it into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. Wait for success confirmation

This will create:
- ✅ `products` table (8 sample computers)
- ✅ `inventory` table (stock tracking)
- ✅ `orders` table (user orders)
- ✅ `order_items` table (order line items)
- ✅ `cart_items` table (persistent shopping cart)
- ✅ Indexes for performance
- ✅ Row-Level Security (RLS) policies

## Step 2: Verify Tables

1. Go to **Supabase Dashboard** → **Table Editor**
2. You should see these tables:
   - `products` (with 5 sample computers)
   - `inventory` (stock for each product)
   - `orders` (empty for now)
   - `order_items` (empty for now)
   - `cart_items` (empty for now)

## What Each Table Does

### `products`
- Stores computer details (name, CPU, GPU, RAM, price, etc.)
- `price_cents` = price in öre (e.g., 499900 = 4999 kr)
- `tier` = Bronze, Silver, Gold, Platinum, Diamond
- Sample 5 computers already inserted

### `inventory`
- Tracks stock (`quantity_in_stock`)
- `allow_preorder` = whether product can be preordered
- Links to `products` via `product_id`

### `orders`
- One row per customer order
- `user_id` = Supabase auth user ID
- `status` = 'pending', 'paid', 'shipped', 'delivered'
- `stripe_session_id` = Link to Stripe Checkout Session
- `stripe_payment_intent_id` = Link to Stripe Payment Intent

### `order_items`
- Line items within each order
- `order_id` = Which order this item belongs to
- `product_id` = Which product
- `quantity` & `unit_price_cents` = How much was ordered/charged

### `cart_items`
- Persistent shopping cart per user
- `user_id` = Owner of the cart
- `product_id` = Item in cart
- `quantity` = How many

## Security (Row-Level Security)

- ✅ Users can only read their own orders
- ✅ Users can manage their own cart
- ✅ Products and inventory are readable by everyone
- ✅ Only backend (with service_role key) can write orders/inventory

## What's Next?

1. ✅ Database is ready
2. 🔜 Frontend: Create cart UI and add products to cart
3. 🔜 Backend: Implement Stripe Checkout Session creation
4. 🔜 Webhook: Listen for Stripe payment completion and create orders
