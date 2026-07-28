import type { SiteSettings } from "@/lib/settings";

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const color = (value: string, fallback: string) =>
  HEX.test(value?.trim() ?? "") ? value.trim() : fallback;

const num = (value: number, fallback: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

/**
 * Přepíše design tokeny podle nastavení z adminu.
 * Hodnoty se sanitizují, aby se do CSS nedalo propašovat nic jiného než barva/číslo.
 */
export function ThemeStyle({ theme }: { theme: SiteSettings["theme"] }) {
  const css = `:root{
  --bg:${color(theme.background, "#04060B")};
  --surface:${color(theme.surface, "#0B1018")};
  --accent:${color(theme.accent, "#22E5C8")};
  --accent-2:${color(theme.accent2, "#3B7BFF")};
  --radius:${num(theme.radius, 18, 0, 40)}px;
  --glow:${num(theme.glow, 55, 0, 100) / 100};
}`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
