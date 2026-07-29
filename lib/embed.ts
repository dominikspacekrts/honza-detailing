/**
 * Bezpečné zpracování vloženého kódu mapy.
 *
 * Z administrace přichází kus HTML zkopírovaný z Map Google. Vkládat ho na web
 * bez kontroly by znamenalo, že kdokoliv s přístupem do administrace může na
 * hlavní stránku propašovat `<script>`. Proto z něj vytáhneme jen adresu, ověříme
 * doménu proti seznamu povolených a iframe si vykreslíme sami.
 */

const ALLOWED_HOSTS = [
  "google.com",
  "www.google.com",
  "maps.google.com",
  "mapy.cz",
  "frame.mapy.cz",
  "en.mapy.cz",
  "openstreetmap.org",
  "www.openstreetmap.org",
];

/**
 * Vrátí adresu mapy, pokud je vložený kód v pořádku, jinak `null`.
 * Přijme jak celý `<iframe …>`, tak jen holou adresu.
 */
export function mapEmbedSrc(value: string): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  // Z `<iframe src="…">` vytáhneme adresu; holá adresa projde beze změny.
  const fromIframe = raw.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)?.[1];
  const candidate = fromIframe ?? (raw.startsWith("<") ? null : raw);
  if (!candidate) return null;

  let url: URL;
  try {
    url = new URL(candidate.replace(/&amp;/g, "&"));
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (!ALLOWED_HOSTS.includes(url.hostname.toLowerCase())) return null;

  return url.toString();
}
