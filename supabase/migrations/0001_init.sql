-- ============================================================================
-- Honza Detailing — základní schéma
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Typy
-- ---------------------------------------------------------------------------
do $$ begin
  create type booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Profily zákazníků (napojené na auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  car_make    text,
  car_model   text,
  car_plate   text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Vytvoří profil hned po registraci a předvyplní jméno/telefon z metadat.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Pomocná funkce pro RLS — bez rekurze na profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- Služby
-- ---------------------------------------------------------------------------
create table if not exists public.services (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  tagline       text,
  description   text,
  category      text not null default 'Detailing',
  price_from    integer not null default 0,      -- v Kč
  price_note    text,                            -- např. "od" / "dle stavu vozu"
  duration_min  integer not null default 60,     -- délka bloku v kalendáři
  features      text[] not null default '{}',
  image_url     text,
  highlight     boolean not null default false,
  active        boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Otevírací doba (0 = neděle … 6 = sobota)
-- ---------------------------------------------------------------------------
create table if not exists public.business_hours (
  weekday    smallint primary key check (weekday between 0 and 6),
  open_time  time not null default '08:00',
  close_time time not null default '17:00',
  closed     boolean not null default false
);

-- Blokované termíny (dovolená, školení, soukromo)
create table if not exists public.blocked_slots (
  id         uuid primary key default gen_random_uuid(),
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  reason     text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- ---------------------------------------------------------------------------
-- Rezervace
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  reference       text unique not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  user_id         uuid references auth.users(id) on delete set null,
  service_id      uuid not null references public.services(id) on delete restrict,
  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text not null,
  car_make        text,
  car_model       text,
  car_plate       text,
  note            text,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  status          booking_status not null default 'pending',
  price_estimate  integer,
  admin_note      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists bookings_starts_at_idx on public.bookings (starts_at);
create index if not exists bookings_user_idx on public.bookings (user_id);

-- Zamezí dvěma aktivním rezervacím ve stejném čase (jeden box / jeden člověk).
create index if not exists bookings_active_range_idx
  on public.bookings using gist (tstzrange(starts_at, ends_at))
  where status in ('pending', 'confirmed');

-- ---------------------------------------------------------------------------
-- Recenze
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  booking_id   uuid references public.bookings(id) on delete set null,
  author_name  text not null,
  car          text,
  rating       smallint not null check (rating between 1 and 5),
  body         text not null,
  approved     boolean not null default false,
  featured     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Galerie hotových zakázek
-- ---------------------------------------------------------------------------
create table if not exists public.gallery_items (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  car         text,
  image_url   text not null,
  before_url  text,
  service_id  uuid references public.services(id) on delete set null,
  featured    boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Nastavení webu — editovatelné z adminu (sekce "Úprava webu")
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id         boolean primary key default true check (id),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Trigger na updated_at
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles       enable row level security;
alter table public.services       enable row level security;
alter table public.business_hours enable row level security;
alter table public.blocked_slots  enable row level security;
alter table public.bookings       enable row level security;
alter table public.reviews        enable row level security;
alter table public.gallery_items  enable row level security;
alter table public.site_settings  enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists "profil: čtení vlastního" on public.profiles;
create policy "profil: čtení vlastního" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profil: úprava vlastního" on public.profiles;
create policy "profil: úprava vlastního" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "profil: vlastní insert" on public.profiles;
create policy "profil: vlastní insert" on public.profiles
  for insert with check (auth.uid() = id);

-- services ------------------------------------------------------------------
drop policy if exists "služby: veřejné čtení" on public.services;
create policy "služby: veřejné čtení" on public.services
  for select using (active or public.is_admin());

drop policy if exists "služby: správa adminem" on public.services;
create policy "služby: správa adminem" on public.services
  for all using (public.is_admin()) with check (public.is_admin());

-- business_hours ------------------------------------------------------------
drop policy if exists "hodiny: veřejné čtení" on public.business_hours;
create policy "hodiny: veřejné čtení" on public.business_hours for select using (true);

drop policy if exists "hodiny: správa adminem" on public.business_hours;
create policy "hodiny: správa adminem" on public.business_hours
  for all using (public.is_admin()) with check (public.is_admin());

-- blocked_slots -------------------------------------------------------------
drop policy if exists "blokace: správa adminem" on public.blocked_slots;
create policy "blokace: správa adminem" on public.blocked_slots
  for all using (public.is_admin()) with check (public.is_admin());

-- bookings ------------------------------------------------------------------
-- Zápis jde výhradně přes server (service role) — validace kolizí + e-mail.
drop policy if exists "rezervace: čtení vlastních" on public.bookings;
create policy "rezervace: čtení vlastních" on public.bookings
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "rezervace: správa adminem" on public.bookings;
create policy "rezervace: správa adminem" on public.bookings
  for all using (public.is_admin()) with check (public.is_admin());

-- reviews -------------------------------------------------------------------
drop policy if exists "recenze: veřejné čtení schválených" on public.reviews;
create policy "recenze: veřejné čtení schválených" on public.reviews
  for select using (approved or auth.uid() = user_id or public.is_admin());

drop policy if exists "recenze: přidání přihlášeným" on public.reviews;
create policy "recenze: přidání přihlášeným" on public.reviews
  for insert to authenticated with check (auth.uid() = user_id and approved = false);

drop policy if exists "recenze: správa adminem" on public.reviews;
create policy "recenze: správa adminem" on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

-- gallery_items -------------------------------------------------------------
drop policy if exists "galerie: veřejné čtení" on public.gallery_items;
create policy "galerie: veřejné čtení" on public.gallery_items for select using (true);

drop policy if exists "galerie: správa adminem" on public.gallery_items;
create policy "galerie: správa adminem" on public.gallery_items
  for all using (public.is_admin()) with check (public.is_admin());

-- site_settings -------------------------------------------------------------
drop policy if exists "nastavení: veřejné čtení" on public.site_settings;
create policy "nastavení: veřejné čtení" on public.site_settings for select using (true);

drop policy if exists "nastavení: správa adminem" on public.site_settings;
create policy "nastavení: správa adminem" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- Volné termíny — veřejná RPC, neleakuje osobní údaje
-- ============================================================================
create or replace function public.get_busy_ranges(day date)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select b.starts_at, b.ends_at
  from public.bookings b
  where b.status in ('pending', 'confirmed')
    and b.starts_at < (day + 1)::timestamptz
    and b.ends_at   > day::timestamptz
  union all
  select s.starts_at, s.ends_at
  from public.blocked_slots s
  where s.starts_at < (day + 1)::timestamptz
    and s.ends_at   > day::timestamptz;
$$;

grant execute on function public.get_busy_ranges(date) to anon, authenticated;

-- ============================================================================
-- Zrušení vlastní rezervace zákazníkem
-- (RLS na bookings povoluje UPDATE jen adminovi, proto přes RPC)
-- ============================================================================
create or replace function public.cancel_my_booking(booking_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  if auth.uid() is null then
    return false;
  end if;

  update public.bookings
     set status = 'cancelled'
   where id = booking_id
     and user_id = auth.uid()
     and status in ('pending', 'confirmed');

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

grant execute on function public.cancel_my_booking(uuid) to authenticated;

-- ============================================================================
-- Přístup pro Data API (PostgREST)
--
-- Nezávisí na volbě „Automatically expose new tables" při zakládání projektu.
-- Samotný GRANT nic neodemyká — o tom, kdo co uvidí, rozhoduje výhradně RLS
-- nastavené výše. Bez těchto práv by ale PostgREST vracel „permission denied".
-- ============================================================================
grant usage on schema public to anon, authenticated;

-- Čtení veřejného obsahu webu
grant select on
  public.services,
  public.business_hours,
  public.reviews,
  public.gallery_items,
  public.site_settings
to anon, authenticated;

-- Přihlášený zákazník: vlastní profil a vlastní rezervace (RLS hlídá „vlastní")
grant select, insert, update on public.profiles to authenticated;
grant select on public.bookings to authenticated;
grant insert on public.reviews to authenticated;

-- Administrátor je běžný přihlášený uživatel s příznakem is_admin;
-- zápis mu povolí až RLS politika, proto práva dostává celá role.
grant select, insert, update, delete on
  public.services,
  public.gallery_items,
  public.reviews,
  public.site_settings,
  public.business_hours,
  public.blocked_slots,
  public.bookings
to authenticated;

-- ============================================================================
-- Storage — veřejné buckety pro fotky
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true), ('site', 'site', true)
on conflict (id) do nothing;

drop policy if exists "storage: veřejné čtení fotek" on storage.objects;
create policy "storage: veřejné čtení fotek" on storage.objects
  for select using (bucket_id in ('gallery', 'site'));

drop policy if exists "storage: nahrávání adminem" on storage.objects;
create policy "storage: nahrávání adminem" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('gallery', 'site') and public.is_admin());

drop policy if exists "storage: mazání adminem" on storage.objects;
create policy "storage: mazání adminem" on storage.objects
  for delete to authenticated
  using (bucket_id in ('gallery', 'site') and public.is_admin());

drop policy if exists "storage: úprava adminem" on storage.objects;
create policy "storage: úprava adminem" on storage.objects
  for update to authenticated
  using (bucket_id in ('gallery', 'site') and public.is_admin());
