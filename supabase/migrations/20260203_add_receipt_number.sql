-- Add receipt number to orders for Stripe receipt matching
alter table public.orders add column if not exists receipt_number text;
