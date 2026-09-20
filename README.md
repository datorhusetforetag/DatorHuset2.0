# DatorHuset2.0

## Environment variables

Required for the backend (`server.ts`):

- `STRIPE_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (required for admin mutations to bypass RLS)
- `FRONTEND_URL` (or `FRONTEND_URLS` for multiple origins)

Email (`server-local.js`). Without these the order confirmation is never
sent and the contact, service and offer forms answer 503 — in both cases
silently, from the customer's point of view. The server prints whether
each mailer is on at startup, so check the log after a deploy.

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — the account that
  sends order confirmations. All four are required; if any is missing the
  mailer is off.
- `SMTP_FROM` — sender shown to the customer. With Gmail this must be an
  address the account actually owns, or the mail is rejected.
- `SUPPORT_SMTP_HOST`, `_PORT`, `_USER`, `_PASS`, `_FROM` — optional. The
  forms fall back to the `SMTP_*` account when these are unset.
- `CONTACT_REQUEST_TO`, `SERVICE_REQUEST_TO`, `OFFER_REQUEST_TO`,
  `ORDER_CANCEL_TO` — where each form lands. Default: support@datorhuset.se.

Stripe webhook (`server-local.js`):

- `STRIPE_WEBHOOK_SECRET` — required, or `/api/webhook` answers 503 and no
  order is ever created from a payment.

Optional for custom build store price scraping (`server-local.js`):

- `CUSTOM_PRICE_REFRESH_INTERVAL_MS` (default `86400000`, 24h)
- `CUSTOM_PRICE_CACHE_TTL_MS` (default same as refresh interval)
- `CUSTOM_PRICE_REQUEST_TIMEOUT_MS` (default `12000`)
- `CUSTOM_PRICE_TRACKED_QUERIES` (comma-separated component names to auto-refresh every cycle)
- `CUSTOM_PRICE_USER_AGENT` (override HTTP user-agent for store fetches)
