import { headers } from "next/headers";

/**
 * Jednoduchý strop na počet požadavků z jedné IP adresy.
 *
 * Počítadlo žije v paměti běžící instance. Na Vercelu jich může běžet víc
 * najednou, takže skutečný limit je „počet instancí × limit" — pořád to ale
 * spolehlivě zastaví skript, který se snaží zaplnit kalendář nebo rozeslat
 * stovky e-mailů. Až provoz poroste, přesuňte počítadlo do Vercel KV / Upstash;
 * rozhraní téhle funkce zůstane stejné.
 */

type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();

/** Občasný úklid, aby mapa nerostla donekonečna. */
function sweep(now: number) {
  if (buckets.size < 5_000) return;
  for (const [key, hit] of buckets) {
    if (hit.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  /** Za kolik sekund limit vyprší (jen když `ok` je false). */
  retryAfterSec: number;
};

/**
 * Zaznamená pokus a řekne, jestli se smí pokračovat.
 *
 * @param scope  Název akce — každá má vlastní počítadlo (`booking`, `review`, …).
 * @param key    Identifikátor volajícího, typicky IP adresa.
 * @param limit  Kolik pokusů se vejde do okna.
 * @param windowSec  Délka okna v sekundách.
 */
export function rateLimit(
  scope: string,
  key: string,
  limit: number,
  windowSec: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const id = `${scope}:${key}`;
  const hit = buckets.get(id);

  if (!hit || hit.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + windowSec * 1000 });
    return { ok: true, retryAfterSec: 0 };
  }

  hit.count += 1;
  if (hit.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((hit.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSec: 0 };
}

/**
 * IP adresa volajícího. Za proxy (Vercel) ji nese `x-forwarded-for`;
 * bere se první položka, protože další si může útočník dopsat sám.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "neznama";
}
