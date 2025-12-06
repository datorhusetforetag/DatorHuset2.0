# Stripe Integration Setup Guide

## Overview

Your e-commerce site now has:
- ✅ Frontend checkout page (`/checkout`)
- ✅ Checkout success page (`/checkout-success`)
- ✅ Backend API ready for deployment

However, to actually process payments, you need to:
1. Set up a Stripe account and get API keys
2. Set up a backend server to handle Stripe sessions
3. Configure webhooks for payment completion

## Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Sign up for a free account
3. Navigate to **Dashboard** → **Developers** → **API keys**
4. You'll see:
   - **Publishable Key** (starts with `pk_test_...`)
   - **Secret Key** (starts with `sk_test_...`)

Keep these safe - never share the Secret Key!

## Step 2: Deploy Backend Server

Your backend code is ready in `server-local.js`. You have two options:

### Option A: Run Locally (for testing)

**Prerequisites:**
- Node.js installed
- npm installed

**Setup:**

1. Install dependencies:
```bash
npm install express cors dotenv stripe @supabase/supabase-js
```

2. Create `.env` file in project root:
```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
SUPABASE_URL=https://glzcrazrxcomosldhiqi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
FRONTEND_URL=http://localhost:8080
PORT=3001
```

3. Run the server:
```bash
node server-local.js
```

You'll see: `✅ Stripe API Server running on http://localhost:3001`

4. Update your `.env.local` (frontend):
```
VITE_API_URL=http://localhost:3001
```

### Option B: Deploy to Production

Deploy `server-local.js` to one of:

- **Vercel** (easiest, free tier)
  - Push to GitHub
  - Connect to Vercel
  - Add environment variables in Vercel dashboard
  - https://vercel.com

- **Render** (free tier available)
  - https://render.com

- **Railway** (pay-as-you-go)
  - https://railway.app

- **Heroku** (paid, was free before)
  - https://heroku.com

When deployed, update `FRONTEND_URL` in backend to your production domain.

## Step 3: Set Up Stripe Webhook

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **"Add an endpoint"**
3. Enter your backend URL:
   - Local: `http://localhost:3001/api/webhook`
   - Production: `https://your-api-domain.com/api/webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded` (optional)
5. Click **"Create endpoint"**
6. View the endpoint, then click **"Reveal"** to see the **Signing Secret** (`whsec_...`)
7. Copy this to your `.env` as `STRIPE_WEBHOOK_SECRET`

## Step 4: Test Stripe Checkout

1. Make sure both frontend and backend are running
2. Go to http://localhost:8080
3. Add a product to cart
4. Click "Gå till kassa" (Go to checkout)
5. Fill in your name and email
6. Click "Gå till betalning" (Go to payment)
7. You'll be redirected to Stripe Checkout
8. Use test card: `4242 4242 4242 4242` | `12/25` | `123` | `12345`
9. Fill in any future expiry and CVC
10. Click "Pay"
11. Success! You'll see `/checkout-success`

## Test Cards

Stripe provides test cards for different scenarios:

| Card Number | Use Case |
|---|---|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | Requires authentication |
| `3782 822463 10005` | Visa test (3D Secure) |

## Frontend Configuration

Update `src/pages/Checkout.tsx` to point to your backend:

```typescript
const response = await fetch("/api/create-checkout-session", { ... })
// or for production:
const response = await fetch("https://your-api.com/api/create-checkout-session", { ... })
```

## What Happens After Payment?

1. User pays via Stripe Checkout
2. Stripe calls your webhook at `/api/webhook`
3. Backend verifies the webhook signature (security!)
4. Backend creates an `order` in Supabase
5. Backend creates `order_items` for each product
6. Backend clears the user's cart
7. Backend updates inventory (decreases stock)
8. User is redirected to `/checkout-success`

## Environment Variables Checklist

**Frontend (`.env.local`):**
```
VITE_SUPABASE_URL=https://glzcrazrxcomosldhiqi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Backend (`.env`):**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://glzcrazrxcomosldhiqi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
FRONTEND_URL=http://localhost:8080
PORT=3001
```

## Troubleshooting

### "Kunde inte lägga till i kundvagn"
- Make sure you ran the SQL schema in Supabase (`docs/supabase-schema.sql`)
- Check browser console for exact error

### Checkout button doesn't work
- Verify backend is running on correct port
- Check that `/api/create-checkout-session` is responding
- Look at network tab in browser DevTools

### Payment completes but no order appears
- Check webhook is receiving events (Stripe Dashboard → Webhooks → Recent)
- Verify webhook secret is correct in `.env`
- Check backend logs for errors

### "Invalid Stripe API version"
- Update Stripe SDK: `npm install --latest stripe`
- Use supported API version like `2024-12-18.acacia`

## What's Next?

1. ✅ Set up Stripe account
2. ✅ Deploy backend server
3. ✅ Configure webhook
4. ✅ Test with test cards
5. 🔜 Go live with real Stripe keys
6. 🔜 Add order tracking page
7. 🔜 Send email confirmations

## Security Notes

- ✅ Never commit `.env` files to Git (use `.gitignore`)
- ✅ Secret keys should never be exposed in frontend code
- ✅ Always verify webhook signatures (already implemented)
- ✅ Use HTTPS in production (required by Stripe)
- ✅ Keep dependencies updated: `npm audit fix`

## Need Help?

- Stripe Docs: https://stripe.com/docs
- Supabase Docs: https://supabase.com/docs
- React Docs: https://react.dev

Good luck! 🚀
