-- ============================================================================
-- Dárkové poukazy
--
-- Nabídka poukazů, které si u vás jde koupit jako dárek. Spravuje se
-- v /admin/poukazy, na webu se zobrazuje vlastní sekcí.
-- ============================================================================

create table if not exists public.vouchers (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  /** Hodnota poukazu v Kč. */
  value           integer not null default 0,
  /** Nepovinná vazba na konkrétní službu — poukaz „na Kompletní detailing". */
  service_id      uuid references public.services(id) on delete set null,
  /** Platnost od zakoupení v měsících. */
  validity_months integer not null default 12,
  image_url       text,
  highlight       boolean not null default false,
  active          boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

comment on table public.vouchers is
  'Nabídka dárkových poukazů zobrazená na webu.';

alter table public.vouchers enable row level security;

drop policy if exists "poukazy: veřejné čtení" on public.vouchers;
create policy "poukazy: veřejné čtení" on public.vouchers
  for select using (active or public.is_admin());

drop policy if exists "poukazy: správa adminem" on public.vouchers;
create policy "poukazy: správa adminem" on public.vouchers
  for all using (public.is_admin()) with check (public.is_admin());

-- Data API (o přístupu rozhoduje RLS výše)
grant select on public.vouchers to anon, authenticated;
grant insert, update, delete on public.vouchers to authenticated;

-- ---------------------------------------------------------------------------
-- Výchozí nabídka
-- ---------------------------------------------------------------------------
insert into public.vouchers (title, description, value, service_id, validity_months, highlight, sort_order)
select
  'Poukaz na Kompletní detailing',
  'Celý den péče o vůz — nejlepší dárek pro někoho, kdo si auto nechá jen tak od někoho umýt.',
  4000,
  s.id,
  12,
  true,
  10
from public.services s where s.slug = 'full-detail'
on conflict do nothing;

insert into public.vouchers (title, description, value, service_id, validity_months, sort_order)
select
  'Poukaz na čištění interiéru',
  'Kompletní očista kabiny včetně vysátí, plastů a skel. Sedne po zimě i po dětech.',
  1900,
  s.id,
  12,
  20
from public.services s where s.slug = 'interier-classic'
on conflict do nothing;

insert into public.vouchers (title, description, value, validity_months, sort_order)
values
  ('Poukaz na 2 000 Kč',
   'Otevřený poukaz na libovolnou službu z našeho ceníku. Rozdíl se doplácí na místě.',
   2000, 12, 30),
  ('Poukaz na 1 000 Kč',
   'Menší dárek, který se dá spojit s čímkoliv z nabídky.',
   1000, 12, 40)
on conflict do nothing;
