"use client";

import { useActionState } from "react";
import {
  addBlockedSlot,
  deleteBlockedSlot,
  saveBusinessHours,
  type ActionState,
} from "@/app/actions/admin";
import { Feedback, SubmitButton } from "@/components/admin/ui";
import type { BlockedSlot, BusinessHour } from "@/lib/database.types";
import { WEEKDAY_LABELS, formatDate, formatTime, toDateKey } from "@/lib/time";

const initial: ActionState = { status: "idle" };
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function HoursEditor({ hours }: { hours: BusinessHour[] }) {
  const [state, action] = useActionState(saveBusinessHours, initial);
  const byWeekday = new Map(hours.map((h) => [h.weekday, h]));

  return (
    <form action={action} className="card">
      <div className="border-b border-[var(--line)] px-6 py-5">
        <h2 className="font-display text-lg font-bold tracking-tight">
          Otevírací doba
        </h2>
        <p className="text-ink-muted mt-1 text-sm">
          Určuje, kdy rezervační systém nabízí volné termíny.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-[var(--line)]">
        {ORDER.map((weekday) => {
          const day = byWeekday.get(weekday);
          return (
            <div
              key={weekday}
              className="grid items-center gap-4 px-6 py-4 sm:grid-cols-[8rem_1fr_1fr_auto]"
            >
              <span className="text-sm font-semibold">{WEEKDAY_LABELS[weekday]}</span>

              <label className="flex items-center gap-2">
                <span className="text-ink-faint w-8 text-xs">od</span>
                <input
                  type="time"
                  name={`open_${weekday}`}
                  className="field"
                  defaultValue={(day?.open_time ?? "08:00").slice(0, 5)}
                />
              </label>

              <label className="flex items-center gap-2">
                <span className="text-ink-faint w-8 text-xs">do</span>
                <input
                  type="time"
                  name={`close_${weekday}`}
                  className="field"
                  defaultValue={(day?.close_time ?? "17:00").slice(0, 5)}
                />
              </label>

              <label className="text-ink-muted flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  name={`closed_${weekday}`}
                  defaultChecked={day?.closed ?? weekday === 0}
                  className="size-4 accent-[var(--accent)]"
                />
                Zavřeno
              </label>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] px-6 py-4">
        <Feedback state={state} />
        <SubmitButton className="btn btn-primary btn-sm ml-auto">
          Uložit otevírací dobu
        </SubmitButton>
      </div>
    </form>
  );
}

export function BlockedSlots({ slots }: { slots: BlockedSlot[] }) {
  const [state, action] = useActionState(addBlockedSlot, initial);

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="card">
        <div className="border-b border-[var(--line)] px-6 py-5">
          <h2 className="font-display text-lg font-bold tracking-tight">
            Zablokovat termín
          </h2>
          <p className="text-ink-muted mt-1 text-sm">
            Dovolená, školení nebo servis vybavení — v tomto čase se nedá objednat.
          </p>
        </div>

        <div className="flex flex-col gap-5 p-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <label className="block">
              <span className="label">Datum</span>
              <input
                type="date"
                name="date"
                className="field"
                min={toDateKey()}
                defaultValue={toDateKey()}
                required
              />
            </label>
            <label className="block">
              <span className="label">Od</span>
              <input type="time" name="from" className="field" defaultValue="08:00" />
            </label>
            <label className="block">
              <span className="label">Do</span>
              <input type="time" name="to" className="field" defaultValue="18:00" />
            </label>
          </div>

          <label className="text-ink-muted flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="wholeDay"
              className="size-4 accent-[var(--accent)]"
            />
            Celý den
          </label>

          <label className="block">
            <span className="label">Důvod (jen pro vás)</span>
            <input
              name="reason"
              className="field"
              placeholder="Dovolená / školení / servis"
            />
          </label>

          <Feedback state={state} />

          <div className="flex justify-end">
            <SubmitButton>Zablokovat</SubmitButton>
          </div>
        </div>
      </form>

      <section className="card">
        <div className="border-b border-[var(--line)] px-6 py-5">
          <h2 className="font-display text-lg font-bold tracking-tight">
            Zablokované termíny
          </h2>
        </div>

        {slots.length === 0 ? (
          <p className="text-ink-muted p-6 text-sm">
            Žádné blokace — nabízíme celou otevírací dobu.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {slots.map((slot) => (
              <li
                key={slot.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div>
                  <div className="text-sm font-semibold">
                    {formatDate(slot.starts_at)}
                  </div>
                  <div className="text-ink-faint text-xs">
                    {formatTime(slot.starts_at)} – {formatTime(slot.ends_at)}
                    {slot.reason && ` · ${slot.reason}`}
                  </div>
                </div>
                <form action={deleteBlockedSlot}>
                  <input type="hidden" name="id" value={slot.id} />
                  <button
                    type="submit"
                    className="btn btn-ghost btn-sm text-red-300 hover:border-red-400/40"
                  >
                    Zrušit blokaci
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
