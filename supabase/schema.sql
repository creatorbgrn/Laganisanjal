-- =====================================================================
-- LaganiSanjal — Supabase schema
-- Run this whole file in: Supabase Dashboard > SQL Editor > New query
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE where possible).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILES (one row per auth user, created automatically on signup)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. BUSINESSES (startups / small businesses seeking funding)
-- ---------------------------------------------------------------------
create table if not exists public.businesses (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  business_name    text not null,
  owner_name       text not null,
  contact_email    text,            -- private: never exposed publicly
  contact_phone    text,            -- private: never exposed publicly
  stage            text,            -- idea | early | running
  industry         text,
  province         text,
  city             text,
  pitch            text,            -- short one-line / paragraph pitch
  business_plan    text,
  future_plan      text,
  funding_amount   numeric,         -- amount needed, in NRs
  funds_use        text,            -- what the funds will be used for
  current_revenue  numeric,         -- optional, NRs / month
  team_size        integer,
  website          text,
  images           text[] default '{}',   -- public URLs from storage
  status           text not null default 'pending',  -- pending | approved | rejected | removed
  admin_notes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists businesses_status_idx  on public.businesses(status);
create index if not exists businesses_user_idx     on public.businesses(user_id);

-- ---------------------------------------------------------------------
-- 3. INVESTORS (people / firms willing to invest)
-- ---------------------------------------------------------------------
create table if not exists public.investors (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  full_name        text not null,
  contact_email    text,            -- private
  contact_phone    text,            -- private
  investor_type    text,            -- individual | firm
  industries       text[] default '{}',   -- preferred industries
  min_amount       numeric,         -- NRs
  max_amount       numeric,         -- NRs
  preferred_stage  text,            -- idea | early | running | any
  region           text,            -- preferred region / province
  bio              text,            -- investment focus / short bio
  involvement      text,            -- funds | mentorship | both
  status           text not null default 'pending',
  admin_notes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists investors_status_idx on public.investors(status);
create index if not exists investors_user_idx    on public.investors(user_id);

-- ---------------------------------------------------------------------
-- 4. PAGE VIEWS (lightweight web-activity metric)
-- ---------------------------------------------------------------------
create table if not exists public.page_views (
  id          bigint generated always as identity primary key,
  path        text,
  created_at  timestamptz not null default now()
);

create index if not exists page_views_created_idx on public.page_views(created_at);

-- ---------------------------------------------------------------------
-- 5. HELPER: is_admin()  (security definer avoids RLS recursion)
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------
-- 6. TRIGGER: auto-create a profile row when a user signs up
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 7. TRIGGER: enforce status / ownership rules on businesses & investors
--    Non-admins can never self-approve; any edit re-queues to 'pending'.
-- ---------------------------------------------------------------------
create or replace function public.enforce_listing_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  if not public.is_admin() then
    new.status      := 'pending';
    new.admin_notes := case when tg_op = 'UPDATE' then old.admin_notes else null end;
    new.user_id     := auth.uid();   -- prevent spoofing ownership
  end if;
  return new;
end;
$$;

drop trigger if exists businesses_enforce on public.businesses;
create trigger businesses_enforce
  before insert or update on public.businesses
  for each row execute function public.enforce_listing_rules();

drop trigger if exists investors_enforce on public.investors;
create trigger investors_enforce
  before insert or update on public.investors
  for each row execute function public.enforce_listing_rules();

-- ---------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.businesses  enable row level security;
alter table public.investors   enable row level security;
alter table public.page_views  enable row level security;

-- profiles ------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- businesses ----------------------------------------------------------
drop policy if exists businesses_select on public.businesses;
create policy businesses_select on public.businesses
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists businesses_insert on public.businesses;
create policy businesses_insert on public.businesses
  for insert with check (auth.uid() is not null);

drop policy if exists businesses_update on public.businesses;
create policy businesses_update on public.businesses
  for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists businesses_delete on public.businesses;
create policy businesses_delete on public.businesses
  for delete using (user_id = auth.uid() or public.is_admin());

-- investors -----------------------------------------------------------
drop policy if exists investors_select on public.investors;
create policy investors_select on public.investors
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists investors_insert on public.investors;
create policy investors_insert on public.investors
  for insert with check (auth.uid() is not null);

drop policy if exists investors_update on public.investors;
create policy investors_update on public.investors
  for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists investors_delete on public.investors;
create policy investors_delete on public.investors
  for delete using (user_id = auth.uid() or public.is_admin());

-- page_views ----------------------------------------------------------
drop policy if exists page_views_insert on public.page_views;
create policy page_views_insert on public.page_views
  for insert with check (true);   -- anyone may record a visit

drop policy if exists page_views_select on public.page_views;
create policy page_views_select on public.page_views
  for select using (public.is_admin());

-- ---------------------------------------------------------------------
-- 9. PUBLIC VIEWS (browse pages) — expose ONLY non-sensitive columns.
--    security_invoker = off (default) so these run as the view owner and
--    return approved rows to anonymous visitors WITHOUT contact details.
-- ---------------------------------------------------------------------
create or replace view public.public_businesses as
  select id, business_name, owner_name, stage, industry, province, city,
         pitch, business_plan, future_plan, funding_amount, funds_use,
         current_revenue, team_size, website, images, created_at
  from public.businesses
  where status = 'approved';

create or replace view public.public_investors as
  select id, full_name, investor_type, industries, min_amount, max_amount,
         preferred_stage, region, bio, involvement, created_at
  from public.investors
  where status = 'approved';

grant select on public.public_businesses to anon, authenticated;
grant select on public.public_investors  to anon, authenticated;

-- =====================================================================
-- 10. STORAGE BUCKET for business product photos
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('business-images', 'business-images', true)
on conflict (id) do nothing;

drop policy if exists "business images public read" on storage.objects;
create policy "business images public read" on storage.objects
  for select using (bucket_id = 'business-images');

drop policy if exists "business images authenticated upload" on storage.objects;
create policy "business images authenticated upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'business-images');

drop policy if exists "business images owner delete" on storage.objects;
create policy "business images owner delete" on storage.objects
  for delete to authenticated using (bucket_id = 'business-images' and owner = auth.uid());

-- =====================================================================
-- DONE. Next: create your own account on the website, then run ONE of
-- these to make yourself the admin (replace the email):
--
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'you@example.com');
-- =====================================================================
