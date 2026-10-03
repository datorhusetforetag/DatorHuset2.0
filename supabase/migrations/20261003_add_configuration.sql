-- Valt utförande per dator: minne, lagring och grafikkort.
--
-- Kunden kan uppgradera (eller i vissa fall gå ned ett steg på) minne och
-- lagring, och på några datorer välja grafikkort. Priserna räknas ur en
-- pristabell som redigeras i adminläget; reglerna finns i
-- shared/upgradePricing.js.
--
-- cart_items.configuration   Det kunden valt för datorn i varukorgen.
--                            Kassan räknar priset ur det - aldrig ur ett
--                            pris från webbläsaren.
--
-- order_items.configuration  Det som faktiskt köptes, med en läsbar rad
--                            ("64GB DDR5 · 2TB"). Det är vad som ska
--                            byggas, och det ändras inte om pristabellen
--                            ändras senare.
--
-- Formen är { "ramGb": 64, "storageGb": 2000, "gpu": "rtx-5080", "summary": "..." }.
-- Fält som är lika med datorns grundutförande utelämnas, och en dator i
-- grundutförande har null. Befintliga rader blir alltså null och ser ut
-- precis som förut.
--
-- Bara tillägg: inga kolumner tas bort, ingen befintlig data ändras, och
-- varukorgens regel om en rad per dator och kund står kvar. Säkert att
-- köra om.
--
-- Ångra med 20261003_add_configuration_rollback.sql.
--
-- Kör den här INNAN den nya koden driftsätts. Koden klarar sig utan
-- kolumnerna (allt köps då i grundutförande), men uppgraderingar sparas
-- inte förrän de finns.

alter table public.cart_items add column if not exists configuration jsonb;
alter table public.order_items add column if not exists configuration jsonb;

comment on column public.cart_items.configuration is
  'Valt utförande (ramGb, storageGb, gpu). null = grundutförande. Se shared/upgradePricing.js.';
comment on column public.order_items.configuration is
  'Köpt utförande (ramGb, storageGb, gpu, summary). null = grundutförande.';
