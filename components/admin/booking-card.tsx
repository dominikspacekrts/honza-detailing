"use client";

import { useActionState, useState } from "react";
import { saveBookingNote, setBookingStatus, type ActionState } from "@/app/actions/admin";
import { STATUS_LABELS, StatusBadge } from "@/components/booking-status";
import { Feedback, SubmitButton } from "@/components/admin/ui";
import type { Booking, BookingStatus, Service } from "@/lib/database.types";
import { formatDate, formatPrice, formatTime, formatWeekday } from "@/lib/time";

const initial: ActionState = { status: "idle" };

export type AdminBooking = Booking & {
  services: Pick<Service, "name" | "duration_min" | "whole_day"> | null;
};

const NEXT_STATUS: { value: BookingStatus; label: string; primary?: boolean }[] = [
  { value: "confirmed", label: "Potvrdit", primary: true },
  { value: "completed", label: "Hotovo" },
  { value: "cancelled", label: "Zrušit" },
];

export function BookingCard({
  booking,
  showDate = false,
}: {
  booking: AdminBooking;
  showDate?: boolean;
}) {
  const [statusState, statusAction] = useActionState(setBookingStatus, initial);
  const [noteState, noteAction] = useActionState(saveBookingNote, initial);
  const [openNote, setOpenNote] = useState(Boolean(booking.admin_note));

  const car = [booking.car_make, booking.car_model, booking.car_plate]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="card sheen overflow-hidden">
      <div className="flex flex-wrap items-start gap-4 border-b border-[var(--line)] p-5">
        <div className="min-w-[8rem]">
          <div className="font-display text-2xl font-bold tracking-tight">
            {formatTime(booking.dropoff_at ?? booking.starts_at)}
          </div>
          <div className="text-ink-faint text-xs">
            {booking.services?.whole_day
              ? "předání · celý den"
              : `do ${formatTime(booking.ends_at)}`}
          </div>
          {showDate && (
            <div className="text-ink-muted mt-1.5 text-xs">
              {formatWeekday(booking.starts_at)} {formatDate(booking.starts_at)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="font-display text-lg font-bold tracking-tight">
              {booking.services?.name ?? "Služba"}
            </h3>
            <StatusBadge status={booking.status} />
          </div>
          <div className="text-ink-muted mt-1.5 text-sm">
            {booking.customer_name}
            {car && <span className="text-ink-faint"> · {car}</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <a
              href={`tel:${booking.customer_phone.replace(/\s/g, "")}`}
              className="text-accent hover:underline"
            >
              {booking.customer_phone}
            </a>
            <a
              href={`mailto:${booking.customer_email}`}
              className="text-accent hover:underline"
            >
              {booking.customer_email}
            </a>
            <span className="text-ink-faint font-mono">#{booking.reference}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="font-display text-lg font-bold">
            {booking.price_estimate ? formatPrice(booking.price_estimate) : "—"}
          </div>
          <div className="text-ink-faint text-xs">hotově na místě</div>
        </div>
      </div>

      {booking.note && (
        <div className="border-b border-[var(--line)] px-5 py-4">
          <div className="text-ink-faint text-xs tracking-wider uppercase">
            Poznámka zákazníka
          </div>
          <p className="mt-1.5 text-sm">{booking.note}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 p-5">
        {NEXT_STATUS.filter((s) => s.value !== booking.status).map((option) => (
          <form key={option.value} action={statusAction}>
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="status" value={option.value} />
            {(option.value === "confirmed" || option.value === "cancelled") && (
              <input type="hidden" name="notify" value="on" />
            )}
            <SubmitButton
              className={`btn btn-sm ${option.primary ? "btn-primary" : "btn-ghost"}`}
              pendingLabel="…"
            >
              {option.label}
            </SubmitButton>
          </form>
        ))}

        <button
          type="button"
          onClick={() => setOpenNote((v) => !v)}
          className="btn btn-ghost btn-sm"
        >
          {openNote ? "Skrýt poznámku" : "Interní poznámka"}
        </button>

        <span className="text-ink-faint ml-auto text-xs">
          {STATUS_LABELS[booking.status]}
        </span>
      </div>

      {openNote && (
        <form action={noteAction} className="border-t border-[var(--line)] p-5">
          <input type="hidden" name="id" value={booking.id} />
          <label className="label" htmlFor={`note-${booking.id}`}>
            Interní poznámka (nevidí ji zákazník)
          </label>
          <textarea
            id={`note-${booking.id}`}
            name="admin_note"
            rows={2}
            className="field"
            defaultValue={booking.admin_note ?? ""}
            placeholder="Např. hluboké škrábance na kapotě, domluvena vyšší cena…"
          />
          <div className="mt-3 flex items-center justify-between gap-4">
            <Feedback state={noteState} />
            <SubmitButton className="btn btn-ghost btn-sm ml-auto">Uložit</SubmitButton>
          </div>
        </form>
      )}

      {statusState.status === "error" && (
        <div className="border-t border-[var(--line)] px-5 py-3">
          <Feedback state={statusState} />
        </div>
      )}
    </article>
  );
}
