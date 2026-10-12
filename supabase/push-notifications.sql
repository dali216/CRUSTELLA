-- Run once in Supabase Dashboard > SQL Editor for existing Crustella database.
create table if not exists public.admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.admin_push_subscriptions enable row level security;
revoke all on table public.admin_push_subscriptions from anon, authenticated;
grant all on table public.admin_push_subscriptions to service_role;
create index if not exists admin_push_subscriptions_user_id_idx
  on public.admin_push_subscriptions(user_id);
