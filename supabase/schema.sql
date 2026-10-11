-- Crustella Cloud Kitchen: starter schema.
-- Run in Supabase SQL Editor. Review before production.
create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_name text not null check (char_length(customer_name) between 1 and 80),
  customer_phone text not null check (char_length(customer_phone) between 3 and 30),
  delivery_address text not null check (char_length(delivery_address) between 1 and 300),
  customer_note text check (customer_note is null or char_length(customer_note) <= 300),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  total_millimes integer not null check (total_millimes >= 0),
  payment_method text not null default 'cash_on_delivery' check (payment_method = 'cash_on_delivery'),
  status text not null default 'new' check (status in ('new','confirmed','preparing','out_for_delivery','delivered','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.admin_users enable row level security;

-- Do NOT add a public insert policy for orders if inserts must go through an Edge Function.
-- Admin reads/updates should be performed via authenticated server-side checks or carefully
-- designed policies. Do not grant clients access to service_role.
-- No public policies are created here intentionally.

-- Production next steps:
-- 1. Use a Supabase Edge Function to validate menu IDs/prices and compute totals server-side.
-- 2. Have the function insert orders using a server-only secret.
-- 3. Verify the caller/admin role for every admin read/update.
-- 4. Rate-limit submissions and avoid logging customer PII unnecessarily.
