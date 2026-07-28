/**
 * Ověří, že je projekt správně propojený se Supabase.
 *   npm run check
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ok = (m: string) => console.log(`  ✓ ${m}`);
const bad = (m: string) => console.log(`  ✗ ${m}`);
let failed = false;

function fail(message: string): never {
  bad(message);
  console.log("\nNapravte to a spusťte znovu: npm run check\n");
  process.exit(1);
}

console.log("\nKontrola propojení se Supabase\n");

// --- 1. Proměnné prostředí -------------------------------------------------
console.log("Proměnné prostředí (.env.local)");

if (!url || url.includes("placeholder")) {
  fail("NEXT_PUBLIC_SUPABASE_URL chybí nebo je pořád placeholder.");
}
if (!anon || anon.includes("placeholder")) {
  fail("NEXT_PUBLIC_SUPABASE_ANON_KEY chybí nebo je pořád placeholder.");
}
ok(`URL projektu: ${url}`);
ok("Veřejný klíč (anon / publishable) je vyplněný");

if (!service || service.includes("placeholder")) {
  bad("SUPABASE_SERVICE_ROLE_KEY chybí — bez něj nepůjde založit rezervace.");
  failed = true;
} else if (service === anon) {
  bad("SUPABASE_SERVICE_ROLE_KEY je stejný jako veřejný klíč — zkopírovaný špatný.");
  failed = true;
} else {
  ok("Servisní klíč (service_role / secret) je vyplněný");
}

// --- 2. Data z migrací -----------------------------------------------------
console.log("\nData z migrací");
const supabase = createClient(url, anon);

const counts: Record<string, number> = {};
for (const table of [
  "services",
  "business_hours",
  "site_settings",
  "reviews",
  "gallery_items",
] as const) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    bad(`${table}: ${error.message}`);
    failed = true;
    continue;
  }
  counts[table] = count ?? 0;
  ok(`${table}: ${count} ${count === 1 ? "záznam" : "záznamů"}`);
}

if (counts.services === 0) {
  bad("Tabulka services je prázdná — spusťte 0002_seed.sql.");
  failed = true;
}
if (counts.business_hours !== 7) {
  bad(`business_hours má ${counts.business_hours} dní místo 7 — spusťte 0002_seed.sql.`);
  failed = true;
}

// --- 3. Výpočet volných termínů -------------------------------------------
console.log("\nRezervační systém");
const today = new Date().toISOString().slice(0, 10);
const { error: rpcError } = await supabase.rpc("get_busy_ranges", { day: today });

if (rpcError) {
  bad(`Funkce get_busy_ranges: ${rpcError.message}`);
  failed = true;
} else {
  ok("Funkce get_busy_ranges odpovídá");
}

// --- 4. Ochrana osobních údajů --------------------------------------------
const { data: leaked } = await supabase.from("bookings").select("id").limit(1);
if (leaked && leaked.length > 0) {
  bad("RLS: nepřihlášený návštěvník vidí cizí rezervace! Zkontrolujte politiky.");
  failed = true;
} else {
  ok("RLS: rezervace nejsou veřejně čitelné");
}

// --- 5. Úložiště fotek -----------------------------------------------------
console.log("\nÚložiště fotek");
if (service && !service.includes("placeholder")) {
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: buckets, error } = await admin.storage.listBuckets();

  if (error) {
    bad(`Nepodařilo se načíst buckety: ${error.message}`);
    failed = true;
  } else {
    for (const name of ["gallery", "site"]) {
      const bucket = buckets?.find((b) => b.id === name);
      if (!bucket) {
        bad(`Bucket „${name}" chybí — spusťte 0001_init.sql.`);
        failed = true;
      } else if (!bucket.public) {
        bad(`Bucket „${name}" není veřejný — fotky se nezobrazí.`);
        failed = true;
      } else {
        ok(`Bucket „${name}" je připravený`);
      }
    }
  }
} else {
  bad("Přeskočeno — chybí servisní klíč.");
}

// --- 6. Administrátoři a e-maily ------------------------------------------
console.log("\nÚčty a e-maily");
if (service && !service.includes("placeholder")) {
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { count } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_admin", true);

  if (count && count > 0) {
    ok(`Administrátorů: ${count}`);
  } else {
    console.log(
      "  · Zatím žádný administrátor — zaregistrujte se na /registrace a spusťte:\n" +
        "    update public.profiles set is_admin = true\n" +
        "    where id = (select id from auth.users where email = 'vas@email.cz');",
    );
  }
}

console.log(
  process.env.RESEND_API_KEY
    ? "  ✓ RESEND_API_KEY nastavený — potvrzení se budou odesílat"
    : "  · RESEND_API_KEY není nastavený — rezervace půjdou, jen nepřijde e-mail",
);

// --- Výsledek --------------------------------------------------------------
console.log(
  failed
    ? "\n✗ Něco ještě nesedí — viz řádky označené ✗.\n"
    : "\n✓ Všechno sedí. Spusťte npm run dev.\n",
);
process.exit(failed ? 1 : 0);
