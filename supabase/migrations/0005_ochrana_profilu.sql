-- ============================================================================
-- Ochrana příznaku administrátora
--
-- Migrace 0001 dávala roli `authenticated` právo UPDATE na celou tabulku
-- `profiles`. RLS politika hlídá jen to, KTERÝ řádek smí uživatel měnit, ne
-- KTERÉ sloupce — kdokoliv si tak mohl nastavit `is_admin = true` a dostat se
-- k rezervacím a osobním údajům všech zákazníků.
--
-- Řešíme to dvakrát nezávisle: sloupcovými právy a triggerem.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Sloupcová práva — zákazník sahá jen na své kontaktní údaje
-- --------------------------------------------------------------------------
revoke insert, update on public.profiles from authenticated;

grant insert (id, full_name, phone, car_make, car_model, car_plate)
  on public.profiles to authenticated;

grant update (full_name, phone, car_make, car_model, car_plate)
  on public.profiles to authenticated;

-- --------------------------------------------------------------------------
-- 2. Trigger — pojistka, kdyby se práva někdy zase rozvolnila
-- --------------------------------------------------------------------------
create or replace function public.protect_is_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- `public.is_admin()` čte stav PŘED tímto UPDATE, takže povýšit někoho
  -- může jen ten, kdo už administrátorem je.
  if new.is_admin is distinct from old.is_admin and not public.is_admin() then
    raise exception 'Změna příznaku administrátora není povolena.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_is_admin on public.profiles;
create trigger profiles_protect_is_admin
  before update on public.profiles
  for each row execute function public.protect_is_admin();

-- --------------------------------------------------------------------------
-- 3. Kontrola: po spuštění nesmí být administrátorem nikdo cizí
--
--    select id, full_name, is_admin from public.profiles where is_admin;
-- --------------------------------------------------------------------------
