-- Crustella Cloud Kitchen — run the whole file in Supabase SQL Editor.
-- No service_role key or database password belongs in this repository.
create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_name text not null check (char_length(customer_name) between 1 and 80),
  customer_phone text not null check (char_length(customer_phone) between 6 and 30),
  delivery_address text not null check (char_length(delivery_address) between 4 and 300),
  delivery_lat double precision,
  delivery_lng double precision,
  customer_note text check (customer_note is null or char_length(customer_note) <= 300),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  total_millimes integer not null check (total_millimes > 0 and total_millimes <= 500000),
  payment_method text not null default 'cash_on_delivery' check (payment_method = 'cash_on_delivery'),
  status text not null default 'new' check (status in ('new','confirmed','preparing','out_for_delivery','delivered','cancelled')),
  tracking_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_gps_pair check (
    (delivery_lat is null and delivery_lng is null) or
    (delivery_lat between -90 and 90 and delivery_lng between -180 and 180)
  )
);

alter table public.orders add column if not exists delivery_lat double precision;
alter table public.orders add column if not exists delivery_lng double precision;
alter table public.orders add column if not exists tracking_token uuid default gen_random_uuid();
alter table public.orders add column if not exists updated_at timestamptz not null default now();
create unique index if not exists orders_tracking_token_uidx on public.orders(tracking_token);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.set_order_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_order_updated_at();

alter table public.orders enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Admins can read their own admin record" on public.admin_users;
create policy "Admins can read their own admin record" on public.admin_users
for select to authenticated using (user_id = auth.uid());

drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders" on public.orders
for select to authenticated using (
  exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders" on public.orders
for update to authenticated using (
  exists (select 1 from public.admin_users au where au.user_id = auth.uid())
) with check (
  exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

-- Deny direct browser order writes and anonymous reads; only the Edge Function
-- uses the server-side service_role key to create orders after validating prices.
revoke all on table public.orders from anon;
revoke all on table public.orders from authenticated;
grant select, update on table public.orders to authenticated;
revoke all on table public.admin_users from anon;
revoke all on table public.admin_users from authenticated;
grant select on table public.admin_users to authenticated;

-- Add orders to Realtime for authenticated admin dashboard live updates.
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then
  null;
end $$;

-- Setup checklist:
-- 1. Create the first admin in Authentication > Users (email/password).
-- 2. Copy that user's UUID and run:
--    insert into public.admin_users(user_id) values ('AUTH_USER_UUID_HERE');
