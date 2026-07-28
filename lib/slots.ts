import { zonedToUtc } from "@/lib/time";

export type Range = { starts_at: string; ends_at: string };

/** Kolik hodin po otevření lze ještě přivézt vůz na celodenní zakázku. */
export const DROPOFF_WINDOW_MIN = 180;

export type SlotInput = {
  /** "2026-08-14" */
  dateKey: string;
  /** Otevírací doba pro daný den; `null` = zavřeno. */
  hours: { open_time: string; close_time: string; closed: boolean } | null;
  /** Délka služby v minutách (u celodenní se ignoruje). */
  durationMin: number;
  /** Krok nabízených začátků (např. 30 min). */
  stepMin: number;
  /** Obsazené intervaly (rezervace + blokace). */
  busy: Range[];
  /** Minimální předstih rezervace v hodinách. */
  leadTimeHours: number;
  /** Celodenní zakázka — zabere celou otevírací dobu, volí se jen čas předání. */
  wholeDay?: boolean;
  now?: Date;
};

export type Slot = {
  /** ISO začátku slotu; u celodenní zakázky je to čas předání vozu. */
  startsAt: string;
  /** ISO konce slotu; u celodenní zakázky konec otevírací doby. */
  endsAt: string;
  /** "09:30" — pro zobrazení. */
  label: string;
  /** Interval, který se rezervací zablokuje. U celodenní celá otevírací doba. */
  blockStartsAt: string;
  blockEndsAt: string;
};

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  aStart < bEnd && aEnd > bStart;

const timeLabel = (date: Date) =>
  new Intl.DateTimeFormat("cs-CZ", {
    timeZone: "Europe/Prague",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

/**
 * Vygeneruje volné začátky pro daný den.
 *
 * Hodinová zakázka se musí celá vejít do otevírací doby a nesmí kolidovat
 * s ničím obsazeným. Celodenní zakázka vyžaduje úplně prázdný den — nabídnou
 * se jen časy předání vozu v prvních hodinách po otevření.
 */
export function computeSlots({
  dateKey,
  hours,
  durationMin,
  stepMin,
  busy,
  leadTimeHours,
  wholeDay = false,
  now = new Date(),
}: SlotInput): Slot[] {
  if (!hours || hours.closed) return [];

  const open = zonedToUtc(dateKey, hours.open_time).getTime();
  const close = zonedToUtc(dateKey, hours.close_time).getTime();
  if (!Number.isFinite(open) || !Number.isFinite(close) || close <= open) return [];

  const stepMs = Math.max(stepMin, 5) * 60_000;
  const earliest = now.getTime() + leadTimeHours * 3_600_000;

  const busyRanges = busy.map((r) => ({
    start: new Date(r.starts_at).getTime(),
    end: new Date(r.ends_at).getTime(),
  }));

  const openIso = new Date(open).toISOString();
  const closeIso = new Date(close).toISOString();

  // --- Celodenní zakázka ---------------------------------------------------
  if (wholeDay) {
    // Den musí být úplně volný — nesmí v něm být žádná jiná zakázka ani blokace.
    if (busyRanges.some((b) => overlaps(open, close, b.start, b.end))) return [];

    // Vůz nemá smysl přivážet krátce před zavírací dobou.
    const lastDropoff = Math.min(open + DROPOFF_WINDOW_MIN * 60_000, close - stepMs);

    const slots: Slot[] = [];
    for (let start = open; start <= lastDropoff; start += stepMs) {
      if (start < earliest) continue;
      const startDate = new Date(start);
      slots.push({
        startsAt: startDate.toISOString(),
        endsAt: closeIso,
        label: timeLabel(startDate),
        blockStartsAt: openIso,
        blockEndsAt: closeIso,
      });
    }
    return slots;
  }

  // --- Hodinová zakázka ----------------------------------------------------
  const durationMs = durationMin * 60_000;
  const slots: Slot[] = [];

  for (let start = open; start + durationMs <= close; start += stepMs) {
    const end = start + durationMs;
    if (start < earliest) continue;
    if (busyRanges.some((b) => overlaps(start, end, b.start, b.end))) continue;

    const startDate = new Date(start);
    const endIso = new Date(end).toISOString();
    slots.push({
      startsAt: startDate.toISOString(),
      endsAt: endIso,
      label: timeLabel(startDate),
      blockStartsAt: startDate.toISOString(),
      blockEndsAt: endIso,
    });
  }

  return slots;
}
