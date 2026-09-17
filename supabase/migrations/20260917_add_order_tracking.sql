-- Fraktspårning på ordern.
--
-- Statusflödet går Betald -> Bygger -> Post-bygg -> Klar för leverans ->
-- Skickad -> Levererad. De två sista stegen behöver veta vilket fraktbolag
-- paketet ligger hos och vad det har för spårningsnummer.
--
-- Säkert att köra om.

alter table public.orders add column if not exists shipping_carrier text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_url text;
alter table public.orders add column if not exists shipped_at timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;

-- Fraktbolagen vi stödjer. Håll i synk med CARRIER_OPTIONS i server-local.js
-- och CARRIER_LABELS i src/lib/orderStatus.ts.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_shipping_carrier_check'
  ) then
    alter table public.orders
      add constraint orders_shipping_carrier_check
      check (
        shipping_carrier is null
        or shipping_carrier in ('schenker', 'postnord', 'dhl', 'budbee', 'instabox', 'other')
      );
  end if;
end
$$;

-- Spårningslänken sätts bara av admin, men en check hindrar att ett fel i
-- adminvyn skickar kunden till något annat än https.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_tracking_url_check'
  ) then
    alter table public.orders
      add constraint orders_tracking_url_check
      check (tracking_url is null or tracking_url like 'https://%');
  end if;
end
$$;

create index if not exists orders_shipped_at_idx on public.orders (shipped_at desc)
  where shipped_at is not null;
