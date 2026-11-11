-- Crustella Manager database schema
-- Run in Supabase SQL Editor. Auth users are mapped to employee profiles.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null default 'employee' check (role in ('admin','manager','employee')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  customer_name text,
  phone text,
  address text,
  items jsonb not null default '[]'::jsonb,
  total numeric(12,3) not null default 0,
  status text not null default 'new',
  notes text,
  ordered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null default 'g',
  unit_cost numeric(12,4) not null default 0,
  stock_quantity numeric(12,3) not null default 0,
  minimum_stock numeric(12,3) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.technical_sheets (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  sale_price numeric(12,3) not null default 0,
  instructions text,
  created_at timestamptz not null default now()
);

create table if not exists public.technical_sheet_items (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references public.technical_sheets(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id),
  quantity numeric(12,3) not null,
  unique(sheet_id, ingredient_id)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id),
  clock_in timestamptz not null default now(),
  clock_out timestamptz,
  note text
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  work_day date not null,
  note text
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  category text,
  amount numeric(12,3) not null,
  spent_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

create table if not exists public.cash_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('income','expense')),
  label text not null,
  amount numeric(12,3) not null,
  entry_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id),
  starts_on date not null,
  ends_on date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id),
  quantity_delta numeric(12,3) not null,
  reason text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Enable RLS on every business table. Policies are intentionally scoped to
-- authenticated users in this first setup; refine role-specific policies before
-- inviting employees to production.
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.ingredients enable row level security;
alter table public.technical_sheets enable row level security;
alter table public.technical_sheet_items enable row level security;
alter table public.attendance enable row level security;
alter table public.shifts enable row level security;
alter table public.expenses enable row level security;
alter table public.cash_entries enable row level security;
alter table public.leave_requests enable row level security;
alter table public.announcements enable row level security;
alter table public.stock_movements enable row level security;

create policy "authenticated profiles read" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "authenticated orders access" on public.orders for all to authenticated using (true) with check (true);
create policy "authenticated ingredients access" on public.ingredients for all to authenticated using (true) with check (true);
create policy "authenticated sheets access" on public.technical_sheets for all to authenticated using (true) with check (true);
create policy "authenticated sheet items access" on public.technical_sheet_items for all to authenticated using (true) with check (true);
create policy "authenticated attendance access" on public.attendance for all to authenticated using (true) with check (true);
create policy "authenticated shifts access" on public.shifts for all to authenticated using (true) with check (true);
create policy "authenticated expenses access" on public.expenses for all to authenticated using (true) with check (true);
create policy "authenticated cash access" on public.cash_entries for all to authenticated using (true) with check (true);
create policy "authenticated leave access" on public.leave_requests for all to authenticated using (true) with check (true);
create policy "authenticated announcements access" on public.announcements for all to authenticated using (true) with check (true);
create policy "authenticated stock access" on public.stock_movements for all to authenticated using (true) with check (true);
