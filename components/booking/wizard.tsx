"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Profile, Service } from "@/lib/database.types";
import type { SiteSettings } from "@/lib/settings";
import {
  WEEKDAY_SHORT,
  addDaysToKey,
  formatDate,
  formatDuration,
  formatPrice,
  formatTime,
  formatWeekday,
  toDateKey,
  weekdayOf,
} from "@/lib/time";

type Slot = {
  startsAt: string;
  endsAt: string;
  label: string;
  blockStartsAt: string;
  blockEndsAt: string;
};
type DayAvailability = { date: string; slots: Slot[] };

type Confirmation = {
  reference: string;
  startsAt: string;
  endsAt: string;
  serviceName: string;
  priceFrom: number;
  email: string;
  wholeDay: boolean;
};

const DAYS_AHEAD = 21;
const STEPS = ["Služba", "Termín", "Údaje"] as const;

export function BookingWizard({
  services,
  settings,
  profile,
  email,
  initialSlug,
}: {
  services: Service[];
  settings: SiteSettings;
  profile: Profile | null;
  email: string | null;
  initialSlug: string | null;
}) {
  const [step, setStep] = useState(initialSlug ? 1 : 0);
  const [serviceSlug, setServiceSlug] = useState<string | null>(
    services.some((s) => s.slug === initialSlug) ? initialSlug : null,
  );
  const [rangeStart, setRangeStart] = useState(() => toDateKey());
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [loadingDays, setLoadingDays] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slotStart, setSlotStart] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const service = useMemo(
    () => services.find((s) => s.slug === serviceSlug) ?? null,
    [services, serviceSlug],
  );

  const scrollToTop = useCallback(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Načtení dostupnosti pro vybranou službu
  useEffect(() => {
    if (!serviceSlug) return;
    let cancelled = false;

    async function load(slug: string) {
      setLoadingDays(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/slots?service=${encodeURIComponent(slug)}&date=${rangeStart}&days=${DAYS_AHEAD}`,
          { cache: "no-store" },
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Načtení termínů selhalo.");
        if (cancelled) return;

        const loaded = (json as { days: DayAvailability[] }).days;
        setDays(loaded);
        setSelectedDate((current) =>
          current && loaded.some((d) => d.date === current && d.slots.length)
            ? current
            : (loaded.find((d) => d.slots.length > 0)?.date ?? null),
        );
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoadingDays(false);
      }
    }

    void load(serviceSlug);

    return () => {
      cancelled = true;
    };
  }, [serviceSlug, rangeStart]);

  const slotsForDay = days.find((d) => d.date === selectedDate)?.slots ?? [];

  // Vybraný čas odvozujeme z dne — při přepnutí dne tak zmizí sám.
  const slot = slotsForDay.find((s) => s.startsAt === slotStart) ?? null;

  async function submit(formData: FormData) {
    if (!service || !slot) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSlug: service.slug,
          startsAt: slot.startsAt,
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          carMake: String(formData.get("carMake") ?? ""),
          carModel: String(formData.get("carModel") ?? ""),
          carPlate: String(formData.get("carPlate") ?? ""),
          note: String(formData.get("note") ?? ""),
          saveToProfile: formData.get("saveToProfile") === "on",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Rezervaci se nepodařilo odeslat.");

      setConfirmation(json as Confirmation);
      scrollToTop();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return <Success confirmation={confirmation} settings={settings} />;
  }

  return (
    <div ref={topRef} className="scroll-mt-28">
      <Steps current={step} />

      {error && (
        <p className="mt-6 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* --- Krok 1: služba ------------------------------------------------ */}
      {step === 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setServiceSlug(s.slug);
                setStep(1);
                scrollToTop();
              }}
              className={`card sheen group flex h-full flex-col p-6 text-left transition-all duration-300 hover:-translate-y-1 ${
                serviceSlug === s.slug ? "glow-accent" : ""
              }`}
            >
              <div className="text-ink-faint flex items-center justify-between text-xs font-medium tracking-wider uppercase">
                <span>{s.category}</span>
                <span>{s.whole_day ? "celý den" : formatDuration(s.duration_min)}</span>
              </div>
              <h3 className="font-display group-hover:text-gradient mt-3.5 text-lg font-bold tracking-tight transition-all">
                {s.name}
              </h3>
              {s.tagline && (
                <p className="text-ink-muted mt-1.5 text-sm">{s.tagline}</p>
              )}
              <div className="mt-5 flex items-end justify-between pt-2">
                <span className="font-display text-xl font-bold">
                  {s.price_note && (
                    <span className="text-ink-faint mr-1 text-xs font-normal">
                      {s.price_note}
                    </span>
                  )}
                  {formatPrice(s.price_from)}
                </span>
                <span className="text-accent text-sm font-semibold">Vybrat →</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* --- Krok 2: termín ------------------------------------------------ */}
      {step === 1 && service && (
        <div className="mt-8">
          <SelectedService
            service={service}
            onChange={() => {
              setStep(0);
              scrollToTop();
            }}
          />

          <div className="card mt-5 p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-lg font-bold tracking-tight">
                Vyberte den
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={rangeStart === toDateKey()}
                  onClick={() =>
                    setRangeStart((d) => {
                      const prev = addDaysToKey(d, -DAYS_AHEAD);
                      return prev < toDateKey() ? toDateKey() : prev;
                    })
                  }
                >
                  ←
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={
                    addDaysToKey(rangeStart, DAYS_AHEAD) >
                    addDaysToKey(toDateKey(), settings.booking.maxDaysAhead)
                  }
                  onClick={() => setRangeStart((d) => addDaysToKey(d, DAYS_AHEAD))}
                >
                  →
                </button>
              </div>
            </div>

            {loadingDays ? (
              <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-7">
                {Array.from({ length: 14 }, (_, i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-7">
                {days.map((day) => {
                  const disabled = day.slots.length === 0;
                  const active = day.date === selectedDate;
                  const [, month, dayNum] = day.date.split("-");
                  return (
                    <button
                      key={day.date}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedDate(day.date)}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 transition-all ${
                        active
                          ? "border-[color-mix(in_oklab,var(--accent)_60%,transparent)] bg-[color-mix(in_oklab,var(--accent)_14%,transparent)]"
                          : disabled
                            ? "cursor-not-allowed border-[var(--line)] opacity-35"
                            : "border-[var(--line)] hover:border-[color-mix(in_oklab,var(--accent)_40%,transparent)] hover:bg-[color-mix(in_oklab,var(--ink)_5%,transparent)]"
                      }`}
                    >
                      <span className="text-ink-faint text-[0.65rem] tracking-wider uppercase">
                        {WEEKDAY_SHORT[weekdayOf(day.date)]}
                      </span>
                      <span
                        className={`font-display text-lg leading-none font-bold ${active ? "text-accent" : ""}`}
                      >
                        {Number(dayNum)}
                      </span>
                      <span className="text-ink-faint text-[0.65rem]">
                        {Number(month)}.
                      </span>
                      <span
                        className={`mt-0.5 text-[0.6rem] ${disabled ? "text-ink-faint" : "text-accent"}`}
                      >
                        {disabled ? "—" : `${day.slots.length} vol.`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedDate && !loadingDays && (
              <div className="mt-8 border-t border-[var(--line)] pt-6">
                <h3 className="font-display text-lg font-bold tracking-tight">
                  {service.whole_day ? "Kdy vůz přivezete" : "Volné časy"} —{" "}
                  {formatWeekday(`${selectedDate}T12:00:00Z`)}{" "}
                  {formatDate(`${selectedDate}T12:00:00Z`)}
                </h3>
                <p className="text-ink-muted mt-1 text-sm">
                  {service.whole_day
                    ? "Vůz u nás zůstane celý den — vyberte, kdy se vám hodí ho přivézt."
                    : `Zakázka trvá přibližně ${formatDuration(service.duration_min)}.`}
                </p>

                {slotsForDay.length === 0 ? (
                  <p className="text-ink-faint mt-4 text-sm">
                    V tento den už nemáme volno. Zkuste jiný termín.
                  </p>
                ) : (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {slotsForDay.map((s) => (
                      <button
                        key={s.startsAt}
                        type="button"
                        onClick={() => setSlotStart(s.startsAt)}
                        className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${
                          slot?.startsAt === s.startsAt
                            ? "border-transparent bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] text-[var(--bg)]"
                            : "border-[var(--line)] hover:border-[color-mix(in_oklab,var(--accent)_45%,transparent)] hover:bg-[color-mix(in_oklab,var(--ink)_6%,transparent)]"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setStep(0);
                scrollToTop();
              }}
            >
              ← Zpět na služby
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!slot}
              onClick={() => {
                setStep(2);
                scrollToTop();
              }}
            >
              Pokračovat
            </button>
          </div>
        </div>
      )}

      {/* --- Krok 3: údaje ------------------------------------------------- */}
      {step === 2 && service && slot && (
        <form
          className="mt-8"
          action={submit}
          onSubmit={() => setError(null)}
        >
          <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
            <div className="card sheen flex flex-col gap-5 p-6 sm:p-8">
              <h3 className="font-display text-lg font-bold tracking-tight">
                Kontaktní údaje
              </h3>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Jméno a příjmení"
                  name="name"
                  required
                  autoComplete="name"
                  defaultValue={profile?.full_name ?? ""}
                />
                <Field
                  label="Telefon"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  defaultValue={profile?.phone ?? ""}
                />
              </div>

              <Field
                label="E-mail"
                name="email"
                type="email"
                required
                autoComplete="email"
                defaultValue={email ?? ""}
                hint="Sem pošleme potvrzení rezervace."
              />

              <div className="border-t border-[var(--line)] pt-5">
                <span className="eyebrow">Vozidlo</span>
                <div className="mt-4 grid gap-5 sm:grid-cols-3">
                  <Field
                    label="Značka"
                    name="carMake"
                    placeholder="Škoda"
                    defaultValue={profile?.car_make ?? ""}
                  />
                  <Field
                    label="Model"
                    name="carModel"
                    placeholder="Octavia IV"
                    defaultValue={profile?.car_model ?? ""}
                  />
                  <Field
                    label="SPZ"
                    name="carPlate"
                    placeholder="1AB 2345"
                    defaultValue={profile?.car_plate ?? ""}
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="booking-note">
                  Poznámka (nepovinné)
                </label>
                <textarea
                  id="booking-note"
                  name="note"
                  rows={3}
                  className="field"
                  maxLength={1000}
                  placeholder="Např. skvrna na sedačce, tvrdá voda na laku, potřebuji vůz do 16:00…"
                />
              </div>

              {email && (
                <label className="text-ink-muted flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="saveToProfile"
                    defaultChecked
                    className="accent-[var(--accent)] size-4"
                  />
                  Uložit údaje do mého účtu pro příští rezervaci
                </label>
              )}
            </div>

            <aside className="card lg:sticky lg:top-24">
              <div className="border-b border-[var(--line)] p-6">
                <span className="eyebrow">Souhrn</span>
                <h4 className="font-display mt-3 text-lg font-bold tracking-tight">
                  {service.name}
                </h4>
              </div>
              <dl className="flex flex-col gap-3.5 p-6 text-sm">
                <Row
                  label="Termín"
                  value={`${formatWeekday(slot.startsAt)} ${formatDate(slot.startsAt)}`}
                />
                <Row
                  label={service.whole_day ? "Předání vozu" : "Čas"}
                  value={
                    service.whole_day
                      ? formatTime(slot.startsAt)
                      : `${formatTime(slot.startsAt)} – ${formatTime(slot.endsAt)}`
                  }
                />
                <Row
                  label="Doba"
                  value={
                    service.whole_day
                      ? "celý den — auto je u nás samo"
                      : formatDuration(service.duration_min)
                  }
                />
                <Row
                  label="Cena"
                  value={`${service.price_note || ""} ${formatPrice(service.price_from)}`.trim()}
                  strong
                />
                <Row label="Platba" value="hotově na místě" />
              </dl>
              <div className="border-t border-[var(--line)] p-6">
                <p className="text-ink-faint text-xs leading-relaxed">
                  {settings.booking.paymentNote}
                </p>
                <button
                  type="submit"
                  className="btn btn-primary mt-5 w-full"
                  disabled={submitting}
                >
                  {submitting ? "Odesílám…" : "Závazně rezervovat"}
                </button>
                <button
                  type="button"
                  className="text-ink-faint mt-3 w-full text-xs hover:text-[var(--ink)]"
                  onClick={() => {
                    setStep(1);
                    scrollToTop();
                  }}
                >
                  ← Změnit termín
                </button>
              </div>
            </aside>
          </div>
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Steps({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-all ${
                active
                  ? "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-[var(--bg)]"
                  : done
                    ? "bg-accent/15 text-accent"
                    : "text-ink-faint border border-[var(--line)]"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={`hidden text-sm font-semibold sm:block ${
                active ? "text-ink" : "text-ink-faint"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={`h-px flex-1 ${done ? "bg-accent/40" : "bg-[var(--line)]"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function SelectedService({
  service,
  onChange,
}: {
  service: Service;
  onChange: () => void;
}) {
  return (
    <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <span className="eyebrow">Vybraná služba</span>
        <div className="font-display mt-1.5 text-lg font-bold tracking-tight">
          {service.name}
        </div>
        <div className="text-ink-muted mt-1 text-sm">
          {service.whole_day ? "celý den" : formatDuration(service.duration_min)} ·{" "}
          {service.price_note || ""} {formatPrice(service.price_from)}
        </div>
      </div>
      <button type="button" onClick={onChange} className="btn btn-ghost btn-sm">
        Změnit
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-faint text-xs tracking-wider uppercase">{label}</dt>
      <dd className={`text-right ${strong ? "text-base font-bold" : "font-medium"}`}>
        {value}
      </dd>
    </div>
  );
}

function Field({
  label,
  name,
  hint,
  ...props
}: {
  label: string;
  name: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={`booking-${name}`}>
        {label}
      </label>
      <input id={`booking-${name}`} name={name} className="field" {...props} />
      {hint && <p className="text-ink-faint mt-1.5 text-xs">{hint}</p>}
    </div>
  );
}

function Success({
  confirmation,
  settings,
}: {
  confirmation: Confirmation;
  settings: SiteSettings;
}) {
  return (
    <div className="reveal card sheen glow-accent mx-auto max-w-2xl p-8 text-center sm:p-12">
      <div className="bg-accent/15 text-accent mx-auto grid size-16 place-items-center rounded-full">
        <svg
          viewBox="0 0 24 24"
          className="size-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h2 className="font-display mt-7 text-3xl font-bold tracking-tight">
        Termín je rezervovaný
      </h2>
      <p className="text-ink-muted mt-3 text-pretty">
        Potvrzení jsme poslali na <strong className="text-ink">{confirmation.email}</strong>.
        Pokud do pár minut nedorazí, mrkněte do spamu.
      </p>

      <dl className="mt-8 grid gap-4 border-y border-[var(--line)] py-7 text-left sm:grid-cols-2">
        <Detail label="Služba" value={confirmation.serviceName} />
        <Detail label="Kód rezervace" value={confirmation.reference} mono />
        <Detail
          label="Termín"
          value={`${formatWeekday(confirmation.startsAt)} ${formatDate(confirmation.startsAt)}`}
        />
        <Detail
          label={confirmation.wholeDay ? "Předání vozu" : "Čas"}
          value={
            confirmation.wholeDay
              ? `${formatTime(confirmation.startsAt)} — vůz máme celý den`
              : `${formatTime(confirmation.startsAt)} – ${formatTime(confirmation.endsAt)}`
          }
        />
        <Detail label="Cena" value={formatPrice(confirmation.priceFrom)} />
        <Detail label="Platba" value="hotově na místě" />
      </dl>

      <p className="text-ink-faint mt-6 text-sm">
        Potřebujete něco upravit? Zavolejte na{" "}
        <a
          href={`tel:${settings.contact.phone.replace(/\s/g, "")}`}
          className="text-accent hover:underline"
        >
          {settings.contact.phone}
        </a>
        .
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/ucet" className="btn btn-primary">
          Moje rezervace
        </Link>
        <Link href="/" className="btn btn-ghost">
          Zpět na web
        </Link>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-ink-faint text-xs tracking-wider uppercase">{label}</dt>
      <dd className={`mt-1 font-semibold ${mono ? "font-mono text-accent" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
