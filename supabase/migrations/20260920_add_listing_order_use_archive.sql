-- Ordning, användning och arkivering på listningarna.
--
-- Tre saker adminportalen behöver och som inte gick att sätta förut.
--
-- sort_order   Ordningen korten visas i på produktsidan. Sorteringen
--              "Utvalda" returnerade tidigare raderna i den ordning
--              databasen råkade ge dem, vilket i praktiken betydde
--              insättningsordning - ingen kunde bestämma vad som låg
--              först. Lägre tal hamnar tidigare.
--
-- use          Speldator eller arbetsstation. Menyn har haft en
--              Workstation-vy hela tiden, men fältet fanns bara i
--              src/data/computers.ts och aldrig i databasen, så vyn var
--              alltid tom. Begränsad till två värden så att ett stavfel
--              i adminläget inte tyst gör en maskin osynlig.
--
-- archived_at  Att "ta bort" en listning. En produkt som någon har köpt
--              pekas ut av order_items, så en riktig delete antingen
--              stoppas av främmande nyckel eller river med sig
--              orderhistoriken. Arkivering döljer listningen från
--              sajten direkt och lämnar kvittot i fred. Null betyder
--              aktiv.
--
-- Säkert att köra om.

alter table public.products add column if not exists sort_order integer;
alter table public.products add column if not exists use text;
alter table public.products add column if not exists archived_at timestamptz;

-- Bara de två värdena frontenden känner till. Se useFilter i
-- src/pages/Products.tsx.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_use_check'
  ) then
    alter table public.products
      add constraint products_use_check
      check (use is null or use in ('gaming', 'workstation'));
  end if;
end
$$;

-- Ge de befintliga raderna en startordning i stället för att lämna dem
-- på null. Utan det här steget har varje produkt samma plats, och den
-- som öppnar adminportalen första gången möter en lista utan ordning
-- att dra i. Namnordning är godtycklig men förutsägbar.
do $$
declare
  numbered record;
begin
  if exists (select 1 from public.products where sort_order is null) then
    for numbered in
      select id, row_number() over (order by name) * 10 as position
      from public.products
      where sort_order is null
    loop
      update public.products
        set sort_order = numbered.position
        where id = numbered.id;
    end loop;
  end if;
end
$$;

-- Produktsidan hämtar aktiva listningar i ordning. Indexet täcker exakt
-- den frågan.
create index if not exists products_sort_order_idx
  on public.products (sort_order)
  where archived_at is null;

create index if not exists products_archived_at_idx
  on public.products (archived_at)
  where archived_at is not null;
