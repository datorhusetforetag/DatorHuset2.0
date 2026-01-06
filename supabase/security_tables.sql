-- Security and audit tables (run in Supabase SQL editor)

create table if not exists public.admin_audit_logs (
  id uuid default gen_random_uuid() primary key,
  admin_user_id uuid,
  action text not null,
  resource_type text,
  resource_id text,
  order_id uuid,
  previous_status text,
  new_status text,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_admin_audit_logs_created_at on public.admin_audit_logs (created_at);
create index if not exists idx_admin_audit_logs_admin_user on public.admin_audit_logs (admin_user_id);

alter table public.admin_audit_logs enable row level security;
create policy "admin_audit_logs_no_access" on public.admin_audit_logs for all using (false);

create table if not exists public.stripe_webhook_events (
  id uuid default gen_random_uuid() primary key,
  event_id text unique not null,
  event_type text,
  livemode boolean,
  received_at timestamptz default now(),
  processed_at timestamptz
);

create index if not exists idx_stripe_webhook_events_event_id on public.stripe_webhook_events (event_id);

alter table public.stripe_webhook_events enable row level security;
create policy "stripe_webhook_events_no_access" on public.stripe_webhook_events for all using (false);
