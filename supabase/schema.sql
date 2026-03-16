-- CITED App — Supabase Schema (idempotent — safe to re-run)

create extension if not exists "uuid-ossp";

-- ============================================================
-- profiles table
-- ============================================================
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  age_range      text,
  activity_level text,
  goals          text,
  diet_pattern   text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile"   on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- saved_results table
-- ============================================================
create table if not exists public.saved_results (
  id       uuid primary key default uuid_generate_v4(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  query    text not null,
  answers  jsonb not null default '{}',
  result   jsonb not null,
  saved_at timestamptz not null default now()
);

create index if not exists saved_results_user_id_idx
  on public.saved_results(user_id, saved_at desc);

alter table public.saved_results enable row level security;

drop policy if exists "Users can view their own saved results"   on public.saved_results;
drop policy if exists "Users can insert their own saved results" on public.saved_results;
drop policy if exists "Users can delete their own saved results" on public.saved_results;

create policy "Users can view their own saved results"
  on public.saved_results for select using (auth.uid() = user_id);

create policy "Users can insert their own saved results"
  on public.saved_results for insert with check (auth.uid() = user_id);

create policy "Users can delete their own saved results"
  on public.saved_results for delete using (auth.uid() = user_id);

-- ============================================================
-- search_history table
-- ============================================================
create table if not exists public.search_history (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  query       text not null,
  searched_at timestamptz not null default now()
);

create index if not exists search_history_user_id_idx
  on public.search_history(user_id, searched_at desc);

alter table public.search_history enable row level security;

-- ============================================================
-- Billing / usage columns (migration — safe to re-run)
-- ============================================================
alter table public.profiles
  add column if not exists plan                 text        not null default 'free',
  add column if not exists sonnet_count         int         not null default 0,
  add column if not exists sonnet_reset_at      timestamptz not null default (now() + interval '30 days'),
  add column if not exists haiku_count          int         not null default 0,
  add column if not exists haiku_reset_at       timestamptz not null default (now() + interval '7 days'),
  add column if not exists stripe_customer_id      text,
  add column if not exists stripe_subscription_id  text,
  add column if not exists sex                     text,
  add column if not exists health_conditions       text,
  add column if not exists supplements             text,
  add column if not exists sleep_quality           text;

drop policy if exists "Users can view their own search history"   on public.search_history;
drop policy if exists "Users can insert their own search history" on public.search_history;
drop policy if exists "Users can delete their own search history" on public.search_history;

create policy "Users can view their own search history"
  on public.search_history for select using (auth.uid() = user_id);

create policy "Users can insert their own search history"
  on public.search_history for insert with check (auth.uid() = user_id);

create policy "Users can delete their own search history"
  on public.search_history for delete using (auth.uid() = user_id);
