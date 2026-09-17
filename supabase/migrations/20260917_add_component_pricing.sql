-- Prisjämförelse för custom build, byggd på affiliate-produktflöden.
--
-- Den gamla lösningen skrapade butikernas söksidor direkt. Det går inte att
-- få stabilt: Inet och Proshop svarar 403, Elgiganten 429 redan på första
-- anropet, och Power renderar priserna i klienten så att HTML:en är tom.
-- Komponentkoll gör i stället det som faktiskt fungerar - läser strukturerade
-- produktflöden från affiliatenätverk. Det är vad de här tabellerna är till för.
--
-- Säkert att köra om.

-- ---------------------------------------------------------------- identitet

-- Kopplar en katalogprodukt till de identifierare som flödena använder.
-- Utan EAN eller MPN blir matchningen gissningar på produktnamn, och det är
-- där den gamla lösningen tappade träffar.
create table if not exists public.component_identity (
  item_id text primary key,

  ean text,
  mpn text,
  brand text,
  model text,

  -- Ord som måste finnas i en flödesrads titel för att den ska få matcha.
  -- Hindrar att "RTX 5070" matchar "RTX 5070 Ti".
  match_tokens text[] not null default '{}',

  -- Ord som diskvalificerar en rad: kit, bundle, begagnad, refurbished.
  reject_tokens text[] not null default '{}',

  -- true när en människa har bekräftat kopplingen i adminvyn.
  verified boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists component_identity_ean_idx on public.component_identity (ean)
  where ean is not null;
create index if not exists component_identity_mpn_idx on public.component_identity (mpn)
  where mpn is not null;

-- ---------------------------------------------------------------- erbjudanden

-- Ett pris per katalogprodukt och butik. Skrivs om vid varje uppdatering.
create table if not exists public.component_offers (
  id uuid primary key default gen_random_uuid(),

  item_id text not null,
  store_id text not null,
  store_name text not null,

  price_cents integer not null check (price_cents >= 0),
  shipping_cents integer check (shipping_cents >= 0),
  total_cents integer check (total_cents >= 0),
  currency text not null default 'SEK',

  availability text not null default 'unknown'
    check (availability in ('in_stock', 'out_of_stock', 'preorder', 'unknown')),
  stock_count integer,

  -- Länken kunden klickar på. Innehåller affiliate-taggen när den finns.
  product_url text not null,
  image_url text,

  ean text,
  mpn text,
  feed_title text,

  -- Vilken adapter raden kom ifrån: adtraction, awin, webhallen-api, manual...
  source text not null,
  -- Hur raden matchades mot katalogprodukten: ean, mpn, token, manual.
  match_method text not null default 'token'
    check (match_method in ('ean', 'mpn', 'token', 'manual')),
  match_score real,

  seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  -- En rad per produkt och butik - billigaste vinner vid krock.
  constraint component_offers_item_store_unique unique (item_id, store_id)
);

create index if not exists component_offers_item_idx on public.component_offers (item_id);
create index if not exists component_offers_item_total_idx
  on public.component_offers (item_id, total_cents asc);
create index if not exists component_offers_seen_idx on public.component_offers (seen_at desc);

-- ---------------------------------------------------------------- schemaläggning

-- Schemaläggarens minne. Den gamla lösningen höll "senast körd" i en variabel
-- i webbprocessen, så varje omstart glömde bort den - därför stod cachen still
-- från april. Nu ligger den här i stället och överlever omstarter.
create table if not exists public.pricing_refresh_state (
  key text primary key,

  last_run_at timestamptz,
  last_success_at timestamptz,
  last_status text check (last_status in ('ok', 'partial', 'failed', 'running')),

  items_total integer not null default 0,
  items_updated integer not null default 0,
  offers_written integer not null default 0,

  -- Var i katalogen vi var när körningen avbröts, så nästa start kan ta vid.
  cursor_item_id text,

  last_error text,
  duration_ms integer,

  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- flödeskällor

-- Vilka flöden som ska läsas. Uppgifterna (url, nycklar) ligger i miljövariabler,
-- aldrig i databasen - det här är bara på/av och hur de ska tolkas.
create table if not exists public.pricing_sources (
  id text primary key,
  label text not null,
  network text,
  enabled boolean not null default true,
  -- 'feed' = CSV/XML från affiliatenätverk, 'api' = butikens eget API.
  kind text not null default 'feed' check (kind in ('feed', 'api')),
  priority integer not null default 100,
  last_ok_at timestamptz,
  last_error text,
  last_row_count integer,
  updated_at timestamptz not null default now()
);

insert into public.pricing_sources (id, label, network, kind, priority, enabled)
values
  ('webhallen',  'Webhallen',  null,          'api',  10,  true),
  ('inet',       'Inet',       'adtraction',  'feed', 20,  false),
  ('proshop',    'Proshop',    'adtraction',  'feed', 30,  false),
  ('komplett',   'Komplett',   'adtraction',  'feed', 40,  false),
  ('netonnet',   'NetOnNet',   'adtraction',  'feed', 50,  false),
  ('elgiganten', 'Elgiganten', 'awin',        'feed', 60,  false),
  ('power',      'Power',      'awin',        'feed', 70,  false),
  ('amazon-se',  'Amazon.se',  'amazon',      'api',  80,  false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------- vy

-- Lägsta pris per produkt, det som katalogsidan faktiskt frågar efter.
create or replace view public.component_lowest_price as
select distinct on (item_id)
  item_id,
  store_id,
  store_name,
  price_cents,
  total_cents,
  coalesce(total_cents, price_cents) as effective_cents,
  availability,
  product_url,
  image_url,
  source,
  seen_at
from public.component_offers
where availability <> 'out_of_stock'
order by item_id, coalesce(total_cents, price_cents) asc, seen_at desc;

-- ---------------------------------------------------------------- RLS

alter table public.component_offers enable row level security;
alter table public.component_identity enable row level security;
alter table public.pricing_refresh_state enable row level security;
alter table public.pricing_sources enable row level security;

-- Priser är publika. Skrivning sker bara med service-rollen, som går förbi RLS.
drop policy if exists "Priser är läsbara för alla" on public.component_offers;
create policy "Priser är läsbara för alla"
  on public.component_offers for select using (true);

drop policy if exists "Identiteter är läsbara för alla" on public.component_identity;
create policy "Identiteter är läsbara för alla"
  on public.component_identity for select using (true);
