-- Run this in the Supabase SQL Editor for project rpgcmndcswycwgueebrc.
-- Uses Auth + RLS. Do not use the service role key in the app.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  questionnaire jsonb not null default '{}'::jsonb,
  current_week integer not null default 1 check (current_week between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  performed_at timestamptz not null default now(),
  day_index integer not null,
  day_title text not null,
  completed boolean not null default true,
  exercises jsonb not null default '[]'::jsonb,
  duration_minutes integer
);

create index if not exists workout_sessions_user_performed_idx
  on public.workout_sessions (user_id, performed_at desc);

alter table public.profiles enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_sessions enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.workout_plans to authenticated;
grant select, insert, update, delete on public.workout_sessions to authenticated;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;

create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own profile"
  on public.profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own plan" on public.workout_plans;
drop policy if exists "Users can insert own plan" on public.workout_plans;
drop policy if exists "Users can update own plan" on public.workout_plans;
drop policy if exists "Users can delete own plan" on public.workout_plans;

create policy "Users can read own plan"
  on public.workout_plans for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own plan"
  on public.workout_plans for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own plan"
  on public.workout_plans for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own plan"
  on public.workout_plans for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own sessions" on public.workout_sessions;
drop policy if exists "Users can insert own sessions" on public.workout_sessions;
drop policy if exists "Users can update own sessions" on public.workout_sessions;
drop policy if exists "Users can delete own sessions" on public.workout_sessions;

create policy "Users can read own sessions"
  on public.workout_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own sessions"
  on public.workout_sessions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own sessions"
  on public.workout_sessions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own sessions"
  on public.workout_sessions for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Confirmation emails default to localhost:3000. Auto-confirm so sign-in works without that link.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.autoconfirm_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end;
$$;

create or replace function private.autoconfirm_auth_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.identity_data := coalesce(new.identity_data, '{}'::jsonb)
    || jsonb_build_object('email_verified', true);
  return new;
end;
$$;

revoke all on function private.autoconfirm_auth_user() from public, anon, authenticated;
revoke all on function private.autoconfirm_auth_identity() from public, anon, authenticated;

drop trigger if exists on_auth_user_autoconfirm on auth.users;
create trigger on_auth_user_autoconfirm
  before insert on auth.users
  for each row
  execute function private.autoconfirm_auth_user();

drop trigger if exists on_auth_identity_autoconfirm on auth.identities;
create trigger on_auth_identity_autoconfirm
  before insert on auth.identities
  for each row
  execute function private.autoconfirm_auth_identity();
