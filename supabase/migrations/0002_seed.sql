-- ============================================================================
-- Honza Detailing — výchozí data
-- Ceny vycházejí z běžné úrovně českých detailing studií (léto 2026).
-- ============================================================================

-- Otevírací doba: Po–Pá 8–18, So 9–14, Ne zavřeno
insert into public.business_hours (weekday, open_time, close_time, closed) values
  (1, '08:00', '18:00', false),
  (2, '08:00', '18:00', false),
  (3, '08:00', '18:00', false),
  (4, '08:00', '18:00', false),
  (5, '08:00', '18:00', false),
  (6, '09:00', '14:00', false),
  (0, '09:00', '14:00', true)
on conflict (weekday) do nothing;

-- ---------------------------------------------------------------------------
-- Služby
-- ---------------------------------------------------------------------------
insert into public.services
  (slug, name, tagline, description, category, price_from, price_note, duration_min, features, highlight, sort_order)
values
  ('expres-myti',
   'Expres ruční mytí',
   'Rychlá očista bez kompromisů',
   'Bezkontaktní předmytí, ruční mytí metodou dvou kbelíků, sušení mikrovláknem a ošetření pneumatik. Ideální jako pravidelná údržba mezi velkými zákroky.',
   'Mytí', 890, 'od', 60,
   array['Bezkontaktní předmytí aktivní pěnou','Ruční mytí metodou dvou kbelíků','Sušení prémiovým mikrovláknem','Ošetření pneumatik a plastů','Vyleštění oken'],
   false, 10),

  ('premiove-myti',
   'Prémiové ruční mytí',
   'Mytí, dekontaminace a rychlá ochrana',
   'Kompletní bezpečné mytí včetně chemické dekontaminace laku, čištění disků zevnitř a nanesení rychlé ochrany se sviticím leskem na 4–6 týdnů.',
   'Mytí', 1490, 'od', 120,
   array['Vše z Expres mytí','Chemická dekontaminace laku a disků','Čištění disků včetně vnitřní strany','Odstranění dehtu a polétavé rzi','Ochranný sealant na 4–6 týdnů'],
   false, 20),

  ('interier-classic',
   'Čištění interiéru Classic',
   'Aby se vám zase chtělo sedat',
   'Důkladné vysátí celého vozu včetně kufru, čištění a ošetření plastů, vyleštění oken a dezinfekce klimatizace.',
   'Interiér', 1900, 'od', 180,
   array['Vysátí interiéru včetně kufru a pojezdů sedadel','Čištění a matné ošetření plastů','Čištění stropnice a výplní dveří','Vyleštění všech skel zevnitř','Antibakteriální ošetření a provonění'],
   false, 30),

  ('interier-deep',
   'Kompletní interiér Deep Clean',
   'Tepování, kůže, kompletní reset kabiny',
   'Nejhlubší úroveň péče o interiér — mokré tepování látek, hloubkové čištění a impregnace kůže, ozonová dezinfekce. Vůz odjíždí jako nový.',
   'Interiér', 3900, 'od', 480,
   array['Vše z Interiéru Classic','Mokré tepování sedadel a koberců','Hloubkové čištění kůže + impregnace','Čištění ventilace a ozonová dezinfekce','Impregnace textilií proti skvrnám'],
   true, 40),

  ('dekontaminace-vosk',
   'Dekontaminace a voskování laku',
   'Hloubkový lesk na celou sezónu',
   'Chemická i mechanická dekontaminace clay barem, následovaná ruční aplikací prémiového vosku. Lak je hladký, sytý a lépe odolává vodě.',
   'Lak', 3900, 'od', 300,
   array['Chemická dekontaminace laku','Mechanická dekontaminace clay barem','Ruční aplikace prémiového carnauba vosku','Ošetření plastů a lišt','Ochrana na 3–5 měsíců'],
   false, 50),

  ('renovace-laku',
   'Renovace laku — leštění',
   'Odstranění škrábanců a hologramů',
   'Jednokroková až vícekroková korekce laku rotační a orbitální leštičkou. Měřením tloušťky laku hlídáme bezpečnost každého kroku.',
   'Lak', 8900, 'od', 600,
   array['Měření tloušťky laku po celém voze','Jedno- až vícekroková korekce','Odstranění swirlů, hologramů a rýh','Odmaštění laku před ochranou','Fotodokumentace před / po'],
   false, 60),

  ('keramicka-ochrana',
   'Keramická ochrana laku',
   'Roky lesku pod tvrdou skořápkou',
   'Profesionální keramický coating aplikovaný na dokonale připravený lak. Extrémní hydrofobní efekt, ochrana proti UV, ptačímu trusu a mikroškrábancům.',
   'Lak', 14900, 'od', 720,
   array['Kompletní příprava a korekce laku','Keramický coating s životností 3–5 let','Ochrana skel a disků v ceně','Extrémní hydrofobní efekt','Certifikát a instrukce pro údržbu'],
   true, 70),

  ('full-detail',
   'FULL DETAIL',
   'Kompletní proměna vozu',
   'Náš vlajkový balíček — exteriér i interiér od A do Z. Renovace laku, keramická ochrana, hloubkové čištění kabiny, motorový prostor i podběhy.',
   'Kompletní', 19900, 'od', 960,
   array['Vícekroková renovace laku','Keramická ochrana laku, skel a disků','Kompletní Deep Clean interiéru','Čištění motorového prostoru a podběhů','Renovace světlometů','Detailní fotodokumentace'],
   true, 80),

  ('renovace-svetel',
   'Renovace světlometů',
   'Zpátky do čirého stavu',
   'Přebroušení zmatnělých a zažloutlých světlometů s finální UV ochranou. Lepší svícení i vzhled přídě vozu.',
   'Doplňkové', 1490, 'od / pár', 90,
   array['Postupné přebroušení povrchu','Vyleštění do vysokého lesku','UV ochranná vrstva','Výsledek na 12–24 měsíců'],
   false, 90),

  ('ozon',
   'Ozonová dezinfekce',
   'Konec zápachu a bakterií',
   'Ozonový generátor odstraní pachy z kouře, zvířat i plísní z klimatizace. Vhodné před prodejem vozu i po nemoci v rodině.',
   'Doplňkové', 600, 'od / cyklus', 45,
   array['Kompletní ozonový cyklus kabiny','Dezinfekce ventilace a klimatizace','Odstranění pachů z kouře a zvířat','Bez chemických zbytků'],
   false, 100)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Nastavení webu (editovatelné v /admin/vzhled)
-- ---------------------------------------------------------------------------
insert into public.site_settings (id, data) values (true, jsonb_build_object(
  'brand', jsonb_build_object(
    'name', 'Honza Detailing',
    'short', 'HD',
    'tagline', 'Prémiový auto detailing'
  ),
  'theme', jsonb_build_object(
    'accent', '#22E5C8',
    'accent2', '#3B7BFF',
    'background', '#04060B',
    'surface', '#0B1018',
    'radius', 18,
    'glow', 55,
    'grain', true
  ),
  'hero', jsonb_build_object(
    'badge', 'Detailing studio · Praha',
    'title', 'Vaše auto si zaslouží',
    'titleAccent', 'víc než myčku',
    'subtitle', 'Ruční péče, korekce laku a keramická ochrana. Každý vůz řešíme jako jediný v garáži — bez fronty, bez kompromisů.',
    'ctaPrimary', 'Rezervovat termín',
    'ctaSecondary', 'Prohlédnout práce',
    'imageUrl', '',
    'stats', jsonb_build_array(
      jsonb_build_object('value', '600+', 'label', 'ošetřených vozů'),
      jsonb_build_object('value', '4,9', 'label', 'průměrné hodnocení'),
      jsonb_build_object('value', '5 let', 'label', 'záruka na keramiku'),
      jsonb_build_object('value', '1', 'label', 'vůz denně v garáži')
    )
  ),
  'story', jsonb_build_object(
    'badge', 'Náš příběh',
    'title', 'Začalo to jednou garáží a jedním Golfem',
    'paragraphs', jsonb_build_array(
      'V roce 2019 jsem si po večerech v pronajaté garáži hrál s vlastním Golfem. Leštičku jsem si koupil na zkoušku, s tím, že to „nějak zvládnu“. Zvládl jsem to špatně — a přesně to mě nastartovalo.',
      'Následovaly stovky hodin na kurzech, tisíce hodin u vozů a spousta zkažených aplikátorů. Dneska má Honza Detailing vlastní studio s filtrovanou vodou, kontrolovaným osvětlením a vybavením, o kterém se mi tehdy ani nesnilo.',
      'Jedna věc se ale nezměnila: v garáži je vždycky jen jeden vůz denně. Ne proto, že bychom nestíhali, ale proto, že spěch je v detailingu ta nejdražší chyba.'
    ),
    'imageUrl', '',
    'milestones', jsonb_build_array(
      jsonb_build_object('year', '2019', 'title', 'První leštička', 'text', 'Garáž 3×6 metrů, jeden Golf a hodně pokusů a omylů.'),
      jsonb_build_object('year', '2021', 'title', 'Certifikace', 'text', 'Školení na korekci laku a aplikaci keramických ochran.'),
      jsonb_build_object('year', '2023', 'title', 'Vlastní studio', 'text', 'Řízené osvětlení, filtrovaná voda, bezprašná zóna.'),
      jsonb_build_object('year', '2026', 'title', '600+ vozů', 'text', 'Od Fabií po Porsche. Každý dostal stejnou péči.')
    )
  ),
  'services', jsonb_build_object(
    'title', 'Služby',
    'subtitle', 'Od rychlé údržby po kompletní proměnu vozu. Ceny jsou orientační — finální cenu potvrdíme po prohlídce vozu.'
  ),
  'gallery', jsonb_build_object(
    'title', 'Hotové zakázky',
    'subtitle', 'Žádné stock fotky. Všechno jsou vozy, které prošly naší garáží.'
  ),
  'reviews', jsonb_build_object(
    'title', 'Co říkají zákazníci',
    'subtitle', 'Recenze může přidat každý, kdo u nás byl. Zveřejňujeme je bez cenzury — jen po kontrole spamu.'
  ),
  'booking', jsonb_build_object(
    'title', 'Rezervace termínu',
    'subtitle', 'Vyberte službu, den a čas. Do pár vteřin vám přijde potvrzení na e-mail.',
    'paymentNote', 'Platba probíhá hotově na místě po předání vozu. Rezervace je nezávazná — zrušit ji můžete kdykoliv do 24 hodin před termínem.',
    'slotStepMin', 30,
    'leadTimeHours', 12,
    'maxDaysAhead', 60
  ),
  'contact', jsonb_build_object(
    'title', 'Kde nás najdete',
    'address', 'Průmyslová 1472/11, 102 00 Praha 10',
    'phone', '+420 777 123 456',
    'email', 'info@hdetailing.cz',
    'ico', '12345678',
    'instagram', 'https://instagram.com/honzadetailing',
    'facebook', '',
    'mapEmbed', '',
    'hoursNote', 'Po–Pá 8:00–18:00 · So 9:00–14:00 · Ne zavřeno'
  ),
  'seo', jsonb_build_object(
    'title', 'Honza Detailing — prémiový auto detailing Praha',
    'description', 'Ruční mytí, renovace laku, keramická ochrana a hloubkové čištění interiéru. Rezervujte si termín online.'
  )
)) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Ukázkové recenze (klidně smažte v adminu)
-- ---------------------------------------------------------------------------
insert into public.reviews (author_name, car, rating, body, approved, featured) values
  ('Martin K.', 'BMW 340i', 5,
   'Vzal jsem tam auto po třech letech v podzemních garážích. Čekal jsem zlepšení, ne úplně jiný vůz. Lak vypadá líp než při převzetí z autosalonu a interiér voní jak nový.',
   true, true),
  ('Petra N.', 'Škoda Superb', 5,
   'Tepování po dvou dětech a jednom psovi. Myslela jsem, že ty sedačky jsou ztracený případ. Nejsou. Komunikace super, fotky průběhu chodily průběžně na WhatsApp.',
   true, true),
  ('Jakub D.', 'Audi RS3', 5,
   'Keramika na rok a půl a voda z toho pořád padá jak z kachny. Poradili mi i s údržbou doma, což u konkurence nikdo neřešil.',
   true, false),
  ('Lucie M.', 'Mini Cooper', 4,
   'Skvělá práce na laku, jen jsem čekala o něco kratší dobu. Za výsledek to ale stálo a příště si zarezervuju s větším předstihem.',
   true, false)
on conflict do nothing;
