-- ============================================================================
-- Celodenní zakázky — jedno auto na jeden den
--
-- Služba označená jako `whole_day` zabere celou otevírací dobu daného dne.
-- Zákazník si k datu vybírá jen čas, kdy vůz přiveze (`bookings.dropoff_at`);
-- rezervace samotná se ukládá přes celý den, takže na něj už nikdo jiný
-- nemůže nic objednat — ani kratší službu.
-- ============================================================================

alter table public.services
  add column if not exists whole_day boolean not null default false;

alter table public.bookings
  add column if not exists dropoff_at timestamptz;

comment on column public.services.whole_day is
  'Zakázka blokuje celou otevírací dobu dne — v ten den už nejde objednat nic dalšího.';
comment on column public.bookings.dropoff_at is
  'Čas předání vozu u celodenních zakázek. U hodinových je NULL (platí starts_at).';

-- ---------------------------------------------------------------------------
-- Kompletní detailing — celodenní zakázka za 4 000 Kč
-- ---------------------------------------------------------------------------
update public.services set
  name        = 'Kompletní detailing',
  tagline     = 'Celý den jen pro vaše auto',
  description = 'Vůz u nás stráví celý den a projde kompletní péčí zvenku i zevnitř. '
                'V garáži je ten den sám — nikam nespěcháme a nic neděláme na půl.',
  category    = 'Kompletní',
  price_from  = 4000,
  price_note  = '',
  whole_day   = true,
  highlight   = true,
  features    = array[
    'Vůz máme k dispozici celý den — jedno auto denně',
    'Kompletní ruční mytí a dekontaminace laku',
    'Leštění laku a ochranný sealant',
    'Hloubkové čištění celého interiéru',
    'Čištění motorového prostoru a podběhů',
    'Renovace světlometů a ošetření plastů',
    'Fotodokumentace před a po'
  ],
  sort_order  = 5
where slug = 'full-detail';

-- Doplní čas předání u případných starších celodenních rezervací.
update public.bookings b
   set dropoff_at = b.starts_at
  from public.services s
 where s.id = b.service_id
   and s.whole_day
   and b.dropoff_at is null;
