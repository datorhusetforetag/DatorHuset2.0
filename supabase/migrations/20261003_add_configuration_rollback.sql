-- Ångrar 20261003_add_configuration.sql.
--
-- OBS: tar bort vilka utföranden som köpts på tidigare ordrar. Gör en
-- export av order_items först om ordrar med uppgraderingar redan finns.

alter table public.cart_items drop column if exists configuration;
alter table public.order_items drop column if exists configuration;
