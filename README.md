# HS Detailing

Web pro auto detailing studio — prezentace, rezervační systém s účty zákazníků,
e-mailová potvrzení a administrace, ve které jde měnit vzhled i obsah celého webu
bez zásahu do kódu.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase
(Postgres + Auth + Storage) · Resend (e-maily)

---

## Co web umí

| Veřejná část | Administrace `/admin` |
| --- | --- |
| Úvodní sekce, služby a ceník | Zakázky na vybraný den + odhad tržby |
| Příběh studia s časovou osou | Potvrzování / rušení rezervací + interní poznámky |
| Galerie realizací s posuvníkem před/po | Správa služeb a ceníku |
| Recenze + formulář pro zákazníky | Nahrávání fotek do galerie |
| Rezervace ve 3 krocích | Schvalování recenzí |
| Účet zákazníka s historií | **Úprava webu** — barvy, texty, fotky, SEO |
| | Otevírací doba a blokace termínů |

Platba probíhá **hotově na místě** — web nepracuje s platebními údaji.

---

## Rozjetí

### 1. Supabase projekt

V [supabase.com](https://supabase.com) otevřete projekt → **SQL Editor** a spusťte
postupně obsah těchto souborů:

1. `supabase/migrations/0001_init.sql` — tabulky, RLS politiky, storage
2. `supabase/migrations/0002_seed.sql` — služby, ceník, otevírací doba, výchozí obsah

> Ceny a texty v seedu jsou nastřelené podle běžné úrovně českých detailing studií.
> Všechno se dá potom měnit v administraci.

### 2. Proměnné prostředí

Zkopírujte `.env.example` do `.env.local` a doplňte hodnoty
(Supabase → **Project Settings → API**):

```bash
cp .env.example .env.local
```

| Proměnná | Kde ji vzít | Povinná |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | ano |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public key | ano |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key — **nikdy do prohlížeče** | ano |
| `RESEND_API_KEY` | [resend.com](https://resend.com), 3 000 e-mailů/měsíc zdarma | ne¹ |
| `BOOKING_FROM_EMAIL` | odesílatel, doména musí být v Resendu ověřená | ne |
| `ADMIN_NOTIFY_EMAIL` | kam chodí upozornění na novou rezervaci | ne |

¹ Bez klíče web funguje normálně, jen se místo odeslání e-mailu zapíše varování do logu.

### 3. Spuštění

```bash
npm install && npm run dev
```

### 4. Vytvoření administrátora

Zaregistrujte se na `/registrace`, pak v Supabase → **SQL Editor**:

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'vas@email.cz');
```

Odhlaste se a znovu přihlaste — v hlavičce se objeví tlačítko **Admin**.

> Tip: v Supabase → **Authentication → Providers → Email** můžete vypnout
> „Confirm email", pokud nechcete, aby zákazníci museli potvrzovat registraci.

---

## Jak funguje kalendář

Volné termíny se počítají na serveru z:

- **otevírací doby** pro daný den (`/admin/provoz`),
- **délky služby** — dlouhá zakázka potřebuje souvislý blok (`/admin/sluzby`),
- **existujících rezervací** ve stavu *čeká* nebo *potvrzeno*,
- **blokací** (dovolená, školení),
- **minimálního předstihu** a **kroku termínů** (`/admin/vzhled → Rezervace`).

Před uložením se dostupnost ověřuje ještě jednou, takže dva lidé nemůžou
zabrat stejný slot. Vše počítá v pásmu `Europe/Prague` včetně letního času.

---

## Úprava webu bez kódu

`/admin/vzhled` mění obsah tabulky `site_settings` (jeden JSON řádek). Nastavit jde:

- **barvy** — akcenty, pozadí, panely, zaoblení rohů, intenzita záře, filmové zrno
  (pět připravených schémat + vlastní barvy, změny vidíte hned v administraci),
- **logo** — vlastní obrázek nahradí vestavěný monogram,
- **texty** všech sekcí včetně příběhu a milníků,
- **fotky** úvodní sekce a studia,
- **pravidla rezervací** a **kontaktní údaje + SEO**.

Neznámé klíče se při ukládání zahodí a chybějící doplní z `DEFAULT_SETTINGS`
v [lib/settings.ts](lib/settings.ts) — poškozený JSON nemůže web rozbít.

---

## Struktura

```
app/
  (site)/          veřejné stránky (layout s hlavičkou a patičkou)
  admin/           administrace (chráněná v proxy.ts i v layoutu)
  api/slots/       výpočet volných termínů
  api/bookings/    vytvoření rezervace + odeslání e-mailů
  actions/         server actions (auth, recenze, admin)
components/
  site/            sekce veřejného webu
  admin/           editory administrace
  booking/         rezervační průvodce
lib/
  supabase/        klienti pro prohlížeč, server a service-role
  settings.ts      tvar a výchozí hodnoty obsahu webu
  slots.ts         výpočet volných termínů
  time.ts          práce s časem v pásmu Europe/Prague
supabase/migrations/
proxy.ts           obnova session + ochrana /admin a /ucet
```

---

## Nasazení

Doporučeně [Vercel](https://vercel.com): naimportujte repozitář, vložte stejné
proměnné prostředí a nastavte doménu `hdetailing.cz`.

Po nasazení ještě:

1. `NEXT_PUBLIC_SITE_URL` na ostrou adresu,
2. v Supabase → **Authentication → URL Configuration** přidat
   `https://hdetailing.cz/auth/callback` mezi Redirect URLs,
3. v Resendu ověřit doménu, ať potvrzení nepadají do spamu.

---

## Bezpečnost

- Všechny tabulky mají zapnuté RLS; zákazník vidí jen své rezervace.
- Rezervace se zakládají výhradně na serveru se service-role klíčem — po ověření,
  že je termín skutečně volný.
- `/admin` je chráněný na dvou místech: v `proxy.ts` i v `app/admin/layout.tsx`.
- Fotky může nahrávat jen administrátor (politika nad `storage.objects`).
- Barvy z administrace se před vložením do CSS validují proti hex formátu.
