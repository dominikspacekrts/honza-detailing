import type { NextConfig } from "next";

/**
 * Adresa Supabase projektu — web z ní načítá data a fotky ze Storage.
 * Když proměnná při buildu chybí, pravidlo se prostě neomezí na jeden host.
 */
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
  } catch {
    return "https:";
  }
})();

/**
 * Zdroje, ze kterých se smí načítat mapa. Musí odpovídat seznamu v `lib/embed.ts`.
 */
const MAP_FRAME_SRC = [
  "https://www.google.com",
  "https://maps.google.com",
  "https://google.com",
  "https://mapy.cz",
  "https://frame.mapy.cz",
  "https://en.mapy.cz",
  "https://www.openstreetmap.org",
].join(" ");

/**
 * `unsafe-inline` u skriptů a stylů je tu záměrně: Next.js vkládá do stránky
 * inline skripty kvůli hydrataci a motiv webu se generuje jako inline `<style>`.
 * Zpřísnit to jde jen přes nonce protahovaný v `proxy.ts`. Zbytek pravidel
 * (`frame-ancestors`, `object-src`, `base-uri`, `form-action`) platí naplno.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin}`,
  `frame-src ${MAP_FRAME_SRC}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Starší prohlížeče, které neumí `frame-ancestors`.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
