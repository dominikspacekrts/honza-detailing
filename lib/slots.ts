import { zonedToUtc } from "@/lib/time";

export type Range = { starts_at: string; ends_at: string };

export type SlotInput = {
  /** "2026-08-14" */
  dateKey: string;
  /** Otevírací doba pro daný den; `null` = zavřeno. */
  hours: { open_time: string; close_time: string; closed: boolean } | null;
  /** Délka služby v minutách. */
  durationMin: number;
  /** Krok nabízených začátků (např. 30 min). */
  stepMin: number;
  /** Obsazené intervaly (rezervace + blokace). */
  busy: Range[];
  /** Minimální předstih rezervace v hodinách. */
  leadTimeHours: number;
  now?: Date;
};

export type Slot = {
  /** ISO začátku slotu. */
  startsAt: string;
  endsAt: string;
  /** "09:30" — pro zobrazení. */
  label: string;
};

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  aStart < bEnd && aEnd > bStart;

/**
 * Vygeneruje volné začátky pro daný den.
 * Zakázka se musí celá vejít do otevírací doby a nesmí kolidovat s ničím obsazeným.
 */
export function computeSlots({
  dateKey,
  hours,
  durationMin,
  stepMin,
  busy,
  leadTimeHours,
  now = new Date(),
}: SlotInput): Slot[] {
  if (!hours || hours.closed) return [];

  const open = zonedToUtc(dateKey, hours.open_time).getTime();
  const close = zonedToUtc(dateKey, hours.close_time).getTime();
  if (!Number.isFinite(open) || !Number.isFinite(close) || close <= open) return [];

  const durationMs = durationMin * 60_000;
  const stepMs = Math.max(stepMin, 5) * 60_000;
  const earliest = now.getTime() + leadTimeHours * 3_600_000;

  const busyRanges = busy.map((r) => ({
    start: new Date(r.starts_at).getTime(),
    end: new Date(r.ends_at).getTime(),
  }));

  const slots: Slot[] = [];
  for (let start = open; start + durationMs <= close; start += stepMs) {
    const end = start + durationMs;
    if (start < earliest) continue;
    if (busyRanges.some((b) => overlaps(start, end, b.start, b.end))) continue;

    const startDate = new Date(start);
    slots.push({
      startsAt: startDate.toISOString(),
      endsAt: new Date(end).toISOString(),
      label: new Intl.DateTimeFormat("cs-CZ", {
        timeZone: "Europe/Prague",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(startDate),
    });
  }

  return slots;
}
