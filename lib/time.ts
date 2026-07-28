/** Práce s časem v pásmu provozovny — bez externích závislostí. */

export const TZ = "Europe/Prague";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** Posun pásma v ms pro daný okamžik (kladný pro Prahu). */
function tzOffsetMs(date: Date): number {
  const parts = partsFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return asUtc - date.getTime();
}

/**
 * Převede místní čas provozovny na skutečný okamžik (UTC Date).
 * `dateKey` = "2026-08-14", `time` = "09:30" nebo "09:30:00".
 */
export function zonedToUtc(dateKey: string, time: string): Date {
  const [h = "0", m = "0"] = time.split(":");
  const naive = new Date(
    `${dateKey}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`,
  );
  let result = new Date(naive.getTime() - tzOffsetMs(naive));
  const refined = tzOffsetMs(result);
  if (naive.getTime() - refined !== result.getTime()) {
    result = new Date(naive.getTime() - refined);
  }
  return result;
}

/** "2026-08-14" pro daný okamžik v pásmu provozovny. */
export function toDateKey(date: Date = new Date()): string {
  const parts = partsFormatter.formatToParts(date);
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Den v týdnu (0 = neděle) pro "2026-08-14" v pásmu provozovny. */
export function weekdayOf(dateKey: string): number {
  return zonedToUtc(dateKey, "12:00").getUTCDay();
}

export function addDaysToKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const czDate = new Intl.DateTimeFormat("cs-CZ", {
  timeZone: TZ,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const czDateShort = new Intl.DateTimeFormat("cs-CZ", {
  timeZone: TZ,
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

const czTime = new Intl.DateTimeFormat("cs-CZ", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const czWeekday = new Intl.DateTimeFormat("cs-CZ", {
  timeZone: TZ,
  weekday: "long",
});

const asDate = (v: string | Date) => (v instanceof Date ? v : new Date(v));

export const formatDate = (v: string | Date) => czDate.format(asDate(v));
export const formatDateShort = (v: string | Date) => czDateShort.format(asDate(v));
export const formatTime = (v: string | Date) => czTime.format(asDate(v));
export const formatWeekday = (v: string | Date) => czWeekday.format(asDate(v));

export const formatDateTime = (v: string | Date) =>
  `${formatDate(v)} v ${formatTime(v)}`;

export const WEEKDAY_LABELS = [
  "Neděle",
  "Pondělí",
  "Úterý",
  "Středa",
  "Čtvrtek",
  "Pátek",
  "Sobota",
] as const;

export const WEEKDAY_SHORT = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"] as const;

/** 1 490 → "1 490 Kč" (s pevnou mezerou). */
export function formatPrice(value: number): string {
  return `${new Intl.NumberFormat("cs-CZ").format(value)} Kč`;
}

/** 480 → "8 h", 90 → "1,5 h", 45 → "45 min" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  const label = Number.isInteger(hours)
    ? String(hours)
    : hours.toFixed(1).replace(".", ",");
  return `${label} h`;
}
