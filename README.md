# DatorHuset2.0

## Environment variables

Required for the backend (`server.ts`):

- `STRIPE_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (required for admin mutations to bypass RLS)
- `FRONTEND_URL` (or `FRONTEND_URLS` for multiple origins)

Optional for custom build store price scraping (`server-local.js`):

- `CUSTOM_PRICE_REFRESH_INTERVAL_MS` (default `86400000`, 24h)
- `CUSTOM_PRICE_CACHE_TTL_MS` (default same as refresh interval)
- `CUSTOM_PRICE_REQUEST_TIMEOUT_MS` (default `12000`)
- `CUSTOM_PRICE_TRACKED_QUERIES` (comma-separated component names to auto-refresh every cycle)
- `CUSTOM_PRICE_USER_AGENT` (override HTTP user-agent for store fetches)
