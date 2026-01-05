# DatorHuset2.0

## Environment variables

Required for the backend (`server.ts`):

- `STRIPE_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (required for admin mutations to bypass RLS)
- `FRONTEND_URL` (or `FRONTEND_URLS` for multiple origins)
