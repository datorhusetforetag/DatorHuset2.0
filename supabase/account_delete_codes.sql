-- Create account deletion verification codes table
create table if not exists public.account_delete_codes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users (id) on delete cascade,
  code_hash text not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists idx_account_delete_codes_user_id on public.account_delete_codes (user_id);
