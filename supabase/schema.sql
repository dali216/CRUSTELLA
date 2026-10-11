-- Crustella Cloud Kitchen: orders + admin access.
-- Run in Supabase SQL Editor after creating your project.
create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_name text not null check (char_length(customer_name) between 1 and 80),
  customer_phone text not null check (char_length(customer_phone) between 3 and 30),
  delivery_address text not null check (char_length(delivery_address) between 1 and 300),
  delivery_lat double precision,
  delivery_lng double precision,
  customer_note text check (customer_note is null or char_length(customer_note) <= 300),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  total_millimes integer not null check (total_millimes >= 0),
  payment_method text not null default 'cash_on_delivery' check (payment_method = 'cash_on_delivery'),
  status text not null default 'new' check (status in ('new','confirmed','preparing','out_for_delivery','delivered','cancelled')),
  tracking_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists delivery_lat double precision;
alter table public.orders add column if not exists delivery_lng double precision;
alter table public.orders add column if not exists tracking_token uuid default gen_random_uuid();
create unique index if not exists orders_tracking_token_uidx on public.orders(tracking_token);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

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

-- No public insert or anonymous order-read policy: orders must be created by a server-side Edge Function.
-- Create the first admin account in Authentication > Users, then run:
-- insert into public.admin_users(user_id) values ('PASTE_AUTH_USER_UUID_HERE');
-- Enable Realtime for orders (run once; if already in publication, ignore duplicate-object error):
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then
  null;
end $$;
