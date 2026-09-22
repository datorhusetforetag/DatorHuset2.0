-- Avbrutna ordrar.
--
-- status kunde redan sättas till 'cancelled', men inte när det skedde
-- eller varför. Båda behövs när någon frågar i efterhand - kunden som
-- undrar var pengarna tog vägen, och vi själva som ska kunna se om det
-- var ett slut lager, ett dubbelköp eller en ångrad beställning.
--
-- cancelled_at   När ordern avbröts. Null betyder att den inte är det.
--                Skilt från updated_at, som rör sig av alla ändringar.
--
-- cancel_reason  Fritext från den som avbröt. Kort med flit: det är en
--                anteckning till nästa människa, inte ett fält att
--                rapportera på.
--
-- Säkert att köra om.

alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.orders add column if not exists cancel_reason text;

-- Ordrar som redan står som avbrutna men saknar tidpunkt får sin
-- senaste ändring som uppskattning. Bättre än null, och tydligt märkt
-- genom att anledningen lämnas tom.
update public.orders
  set cancelled_at = coalesce(updated_at, created_at)
  where status = 'cancelled' and cancelled_at is null;

create index if not exists orders_cancelled_at_idx
  on public.orders (cancelled_at desc)
  where cancelled_at is not null;
