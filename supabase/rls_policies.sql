-- Supabase RLS policies for DatorHuset
-- Run this in the Supabase SQL editor.

-- Optional: Admin audit log table
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  order_id uuid,
  action text not null,
  previous_status text,
  new_status text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Orders: add checkout metadata fields (safe to re-run)
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists customer_address text;
alter table public.orders add column if not exists customer_postal_code text;
alter table public.orders add column if not exists customer_city text;
alter table public.orders add column if not exists stripe_payment_intent_id text;
alter table public.orders add column if not exists stripe_session_id text;

-- Enable RLS
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.admin_audit_logs enable row level security;

-- cart_items: owner can read/write
create policy "cart_items_select_own"
on public.cart_items
for select
using (auth.uid() = user_id);

create policy "cart_items_insert_own"
on public.cart_items
for insert
with check (auth.uid() = user_id);

create policy "cart_items_update_own"
on public.cart_items
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "cart_items_delete_own"
on public.cart_items
for delete
using (auth.uid() = user_id);

-- orders: owner can read and insert
create policy "orders_select_own"
on public.orders
for select
using (auth.uid() = user_id);

create policy "orders_insert_own"
on public.orders
for insert
with check (auth.uid() = user_id);

-- order_items: owner can read via order
create policy "order_items_select_own_order"
on public.order_items
for select
using (
  exists (
    select 1
    from public.orders
    where public.orders.id = order_items.order_id
      and public.orders.user_id = auth.uid()
  )
);

-- products/inventory: read-only
create policy "products_select_all"
on public.products
for select
using (true);

create policy "inventory_select_all"
on public.inventory
for select
using (true);

-- admin_audit_logs: no client access (service role bypasses RLS)
