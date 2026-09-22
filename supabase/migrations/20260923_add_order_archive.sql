-- Arkiv för beställningar.
--
-- Beställningslistan växer och töms aldrig. En order som är levererad
-- för åtta månader sedan kräver ingenting av någon, men den ligger kvar
-- mellan de tre som faktiskt ska byggas den här veckan. Efter ett år är
-- listan mest historik, och det som är dagens arbete syns inte längre.
--
-- Arkivet flyttar undan det som är klart. Ingenting raderas: raden
-- finns kvar, kunden ser sin order som vanligt, kvittot fungerar, och
-- serienumret går att slå upp den dag maskinen kommer tillbaka med ett
-- garantiärende.
--
-- Bara ett datum, ingen boolean. "Arkiverad" är en fråga om när, inte
-- om - och när man undrar varför en order försvann ur listan är
-- tidpunkten det första man vill veta.
--
-- Säkert att köra om.

alter table public.orders add column if not exists archived_at timestamptz;

-- Båda listorna frågar på samma sätt: filtrera på archived_at, sortera
-- på created_at fallande. Indexet svarar på hela frågan.
create index if not exists orders_archived_at_created_at_idx
  on public.orders (archived_at, created_at desc);

comment on column public.orders.archived_at is
  'Sattes när ordern flyttades till Arkiv beställningar. Null = ligger i den aktiva listan. Påverkar inte kundens vy.';
