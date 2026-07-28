import type { BookingStatus } from "@/lib/database.types";

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Čeká na potvrzení",
  confirmed: "Potvrzeno",
  completed: "Hotovo",
  cancelled: "Zrušeno",
};

const STYLES: Record<BookingStatus, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  confirmed: "border-[color-mix(in_oklab,var(--accent)_40%,transparent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--accent)]",
  completed: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  cancelled: "border-red-400/25 bg-red-400/8 text-red-300",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}
