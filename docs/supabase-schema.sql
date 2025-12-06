-- ============================================================
-- SUPABASE DATABASE SCHEMA FOR DATOHUSET E-COMMERCE
-- ============================================================
-- Run this SQL in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. PRODUCTS TABLE
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  price_cents integer not null,
  currency text not null default 'SEK',
  cpu text,
  gpu text,
  ram text,
  storage text,
  storage_type text,
  tier text,
  image_url text,
  rating numeric default 4.5,
  reviews_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. INVENTORY TABLE (track stock and preorder availability)
create table if not exists public.inventory (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products (id) on delete cascade unique,
  quantity_in_stock integer not null default 0,
  allow_preorder boolean default true,
  preorder_available_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. ORDERS TABLE
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users (id) on delete cascade,
  status text not null default 'pending',
  total_cents integer not null,
  currency text not null default 'SEK',
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  shipping_address jsonb,
  billing_address jsonb,
  customer_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. ORDER_ITEMS TABLE (line items for each order)
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders (id) on delete cascade,
  product_id uuid references public.products (id),
  unit_price_cents integer not null,
  quantity integer not null,
  created_at timestamptz default now()
);

-- 5. CART TABLE (optional, for persistent cart)
create table if not exists public.cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, product_id)
);

-- ============================================================
-- INDEXES (for performance)
-- ============================================================
create index if not exists idx_products_slug on public.products (slug);
create index if not exists idx_products_tier on public.products (tier);
create index if not exists idx_inventory_product_id on public.inventory (product_id);
create index if not exists idx_orders_user_id on public.orders (user_id);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_stripe_session on public.orders (stripe_session_id);
create index if not exists idx_order_items_order_id on public.order_items (order_id);
create index if not exists idx_order_items_product_id on public.order_items (product_id);
create index if not exists idx_cart_items_user_id on public.cart_items (user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cart_items enable row level security;

-- PRODUCTS - everyone can read, only admins can write
create policy "products_read_all" on public.products for select using (true);
create policy "products_write_admin" on public.products for insert with check (false);
create policy "products_update_admin" on public.products for update using (false);

-- INVENTORY - everyone can read (to check stock), only backend can write
create policy "inventory_read_all" on public.inventory for select using (true);
create policy "inventory_write_backend" on public.inventory for insert with check (false);
create policy "inventory_update_backend" on public.inventory for update using (false);

-- ORDERS - users can only see their own orders
create policy "orders_read_own" on public.orders for select using (auth.uid() = user_id);
create policy "orders_insert_own" on public.orders for insert with check (auth.uid() = user_id);
create policy "orders_update_backend" on public.orders for update using (false);

-- ORDER_ITEMS - users can see items from their own orders
create policy "order_items_read_own" on public.order_items for select using (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);

-- CART_ITEMS - users can manage their own cart
create policy "cart_items_read_own" on public.cart_items for select using (auth.uid() = user_id);
create policy "cart_items_insert_own" on public.cart_items for insert with check (auth.uid() = user_id);
create policy "cart_items_update_own" on public.cart_items for update using (auth.uid() = user_id);
create policy "cart_items_delete_own" on public.cart_items for delete using (auth.uid() = user_id);

-- ============================================================
-- SEED DATA - Sample products
-- ============================================================

insert into public.products (name, slug, description, price_cents, cpu, gpu, ram, storage, storage_type, tier, rating, reviews_count)
values
  (
    'Bronze Starter',
    'bronze-starter',
    'Entry-level gaming PC with solid performance',
    499900,
    'Intel i5-13600K',
    'RTX 3060',
    '16GB DDR5',
    '512GB',
    'SSD',
    'Bronze',
    4.2,
    145
  ),
  (
    'Silver Ascent',
    'silver-ascent',
    'Mid-range PC for serious gamers',
    899900,
    'Intel i7-13700K',
    'RTX 4070',
    '32GB DDR5',
    '1TB',
    'SSD',
    'Silver',
    4.5,
    287
  ),
  (
    'Gold Pinnacle',
    'gold-pinnacle',
    'High-end gaming and workstation PC',
    1299900,
    'Intel i9-13900K',
    'RTX 4080',
    '64GB DDR5',
    '2TB',
    'SSD',
    'Gold',
    4.8,
    512
  ),
  (
    'Platina Frostbyte',
    'platina-frostbyte',
    'Ultimate performance for gaming and professional work',
    1899900,
    'Intel i9-14900KS',
    'RTX 4090',
    '128GB DDR5',
    '4TB',
    'SSD',
    'Platinum',
    4.9,
    834
  ),
  (
    'Diamond Quantum',
    'diamond-quantum',
    'Top-tier workstation with cutting-edge components',
    2499900,
    'Intel Xeon W9-3595X',
    'RTX 6000 Ada',
    '256GB DDR5',
    '8TB',
    'SSD',
    'Diamond',
    5.0,
    92
  );

-- Insert inventory for seeded products
insert into public.inventory (product_id, quantity_in_stock, allow_preorder)
select id, 10, true from public.products;

-- ============================================================
-- DONE! 
-- Your database schema is now ready for e-commerce operations.
-- ============================================================
