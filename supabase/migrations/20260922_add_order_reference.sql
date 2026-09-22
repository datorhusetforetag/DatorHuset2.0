-- Ett ordernummer att säga högt.
--
-- order_number är ett löpnummer: 1003, 1004, 1007. Två problem med det
-- som publikt nummer. Det går att gissa grannens order genom att räkna
-- uppåt, och det avslöjar hur många ordrar som lagts.
--
-- order_reference är i stället DH-1004-K7M: löpnumret kvar för att
-- garantera att två ordrar aldrig kan få samma referens, plus tre
-- slumpade tecken som gör den omöjlig att räkna sig till.
--
-- Tecknen är valda så att de går att läsa upp i telefon. Noll, etta,
-- I, L och O är uteslutna, eftersom de förväxlas med varandra och med
-- siffror när någon läser dem högt.
--
-- Löpnumret finns kvar orört. Det används internt och i bokföringen.
--
-- Säkert att köra om.

alter table public.orders add column if not exists order_reference text;

-- Slumptecken ur ett alfabet utan förväxlingsbara tecken.
create or replace function public.datorhuset_order_suffix(length integer default 3)
returns text
language plpgsql
as $$
declare
  alphabet text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  result text := '';
  i integer;
begin
  for i in 1..length loop
    result := result || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
  end loop;
  return result;
end
$$;

-- Befintliga ordrar får sin referens i efterhand, byggd på det
-- löpnummer de redan har.
update public.orders
  set order_reference = 'DH-' || coalesce(order_number::text, substr(id::text, 1, 6)) || '-' ||
                        public.datorhuset_order_suffix(3)
  where order_reference is null;

-- Två ordrar får aldrig dela referens. Löpnumret gör kollisionen omöjlig
-- i praktiken, men villkoret ser till att den blir omöjlig även i teorin.
create unique index if not exists orders_order_reference_key
  on public.orders (order_reference)
  where order_reference is not null;
