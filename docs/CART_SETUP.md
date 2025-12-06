# How to Fix the "Kunde inte lägga till i kundvagn" Error

## Problem
The cart was trying to add items using local string IDs (1, 2, 3, etc.) but Supabase expects UUID primary keys for the `products` table.

## Solution
Follow these steps:

### Step 1: Run the Supabase SQL Schema
If you haven't already, run the database schema:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy the entire content from `docs/supabase-schema.sql`
4. Paste it into the SQL Editor
5. Click **"Run"**

This creates 5 sample computers with UUID primary keys.

### Step 2: Verify Products in Supabase
1. Go to **Supabase Dashboard** → **Table Editor**
2. Click on the `products` table
3. You should see 5 products:
   - Bronze Starter
   - Silver Ascent
   - Gold Pinnacle
   - Platina Frostbyte
   - Diamond Quantum

### Step 3: Test Add to Cart
1. Go to http://localhost:8080
2. Click on a product (e.g., "Bronze Starter" in the carousel)
3. Click **"Lägg i kundvagn"** button
4. It should now work! You'll be redirected to `/cart`

### Step 4: View Cart
You should see:
- The product name and price
- Quantity controls
- Total price
- "Gå till kassa" (Checkout) button

## How It Works Now

The app now:
1. ✅ Loads products from Supabase on page load
2. ✅ Maps product names to their Supabase UUIDs
3. ✅ When you click "Lägg i kundvagn", it adds to cart using the correct UUID
4. ✅ Cart is saved to Supabase and persists across refreshes

## If You Still Get the Error

**Check the browser console** (F12 → Console tab) for error messages, which might show:
- "Failed to add to cart: ..." → Database permission issue
- "Laddar produktinformation..." → Products haven't loaded yet

If products haven't loaded, wait 2-3 seconds and try again.

## What's Next?

Once the cart is working, you can proceed to implement Stripe checkout for actual payments.
