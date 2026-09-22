-- Serienummer och byggnoteringar per maskin.
--
-- En order kopplade tidigare bara ihop en kund med en produkt och ett
-- pris. Kommer samma kund tillbaka om ett år med ett garantiärende är
-- "Platina Historia, beställd i mars" allt vi har - inte vilket
-- exemplar det är, inte vilka delar som faktiskt sattes i.
--
-- Fälten ligger på order_items och inte på orders, eftersom en order
-- kan innehålla flera maskiner och varje maskin är sitt eget exemplar.
--
-- serial_number  Numret på chassit. Samma nummer som serviceformuläret
--                frågar efter, så kunden kan läsa det på sin ordersida
--                i stället för att leta på lådan.
--
-- build_notes    Fritext till oss själva: vilka delar som byttes, vad
--                som avvek, vad nästa person behöver veta. Visas inte
--                för kunden.
--
-- Säkert att köra om.

alter table public.order_items add column if not exists serial_number text;
alter table public.order_items add column if not exists build_notes text;

-- Två maskiner får aldrig dela serienummer. Villkoret gäller bara rader
-- som faktiskt har ett, så ofyllda fält inte krockar med varandra.
create unique index if not exists order_items_serial_number_key
  on public.order_items (serial_number)
  where serial_number is not null and serial_number <> '';

-- Byggchecklistan är borta ur gränssnittet. Kolumnen lämnas kvar med
-- flit: den innehåller vad som redan kryssats i på tidigare ordrar, och
-- att kasta det för att listan inte längre visas vore att radera
-- historik för att slippa en kolumn.
comment on column public.orders.build_checklist is
  'Historik. Checklistan togs bort ur adminportalen 2026-09-22; inga nya rader skrivs.';
