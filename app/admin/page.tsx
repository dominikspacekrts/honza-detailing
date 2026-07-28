import Link from "next/link";
import { BookingCard, type AdminBooking } from "@/components/admin/booking-card";
import { AdminHeader, Stat } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import {
  addDaysToKey,
  formatDate,
  formatPrice,
  formatWeekday,
  toDateKey,
  zonedToUtc,
} from "@/lib/time";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ den?: string }>;
}) {
  const { den } = await searchParams;
  const today = toDateKey();
  const day = den && /^\d{4}-\d{2}-\d{2}$/.test(den) ? den : today;

  const supabase = await createClient();

  const dayStart = zonedToUtc(day, "00:00").toISOString();
  const dayEnd = zonedToUtc(addDaysToKey(day, 1), "00:00").toISOString();

  const [dayRes, upcomingRes, pendingRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, services(name, duration_min)")
      .gte("starts_at", dayStart)
      .lt("starts_at", dayEnd)
      .order("starts_at", { ascending: true }),
    supabase
      .from("bookings")
      .select("id, starts_at, price_estimate, status")
      .gte("starts_at", new Date().toISOString())
      .in("status", ["pending", "confirmed"]),
    supabase
      .from("bookings")
      .select("*, services(name, duration_min)")
      .eq("status", "pending")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(5),
  ]);

  const dayBookings = (dayRes.data ?? []) as unknown as AdminBooking[];
  const upcoming = upcomingRes.data ?? [];
  const pending = (pendingRes.data ?? []) as unknown as AdminBooking[];

  const active = dayBookings.filter((b) => b.status !== "cancelled");
  const dayRevenue = active.reduce((sum, b) => sum + (b.price_estimate ?? 0), 0);
  const workMinutes = active.reduce(
    (sum, b) =>
      sum + (new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime()) / 60000,
    0,
  );

  return (
    <>
      <AdminHeader
        eyebrow="Přehled"
        title={day === today ? "Dnešní zakázky" : `Zakázky — ${formatDate(`${day}T12:00:00Z`)}`}
        subtitle={`${formatWeekday(`${day}T12:00:00Z`)} ${formatDate(`${day}T12:00:00Z`)}`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/admin?den=${addDaysToKey(day, -1)}`}
              className="btn btn-ghost btn-sm"
            >
              ←
            </Link>
            {day !== today && (
              <Link href="/admin" className="btn btn-ghost btn-sm">
                Dnes
              </Link>
            )}
            <Link
              href={`/admin?den=${addDaysToKey(day, 1)}`}
              className="btn btn-ghost btn-sm"
            >
              →
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Zakázek v tento den" value={active.length} />
        <Stat
          label="Odhad tržby"
          value={formatPrice(dayRevenue)}
          hint="součet cen „od“"
        />
        <Stat
          label="Naplánovaná práce"
          value={`${Math.round((workMinutes / 60) * 10) / 10} h`}
        />
        <Stat
          label="Čeká na potvrzení"
          value={upcoming.filter((b) => b.status === "pending").length}
          hint="všechny budoucí"
        />
      </div>

      <section className="mt-10">
        <h2 className="font-display mb-5 text-lg font-bold tracking-tight">
          Program dne
        </h2>
        {dayBookings.length === 0 ? (
          <div className="card text-ink-muted p-8 text-center text-sm">
            V tento den nemáte žádnou zakázku.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {dayBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </section>

      {pending.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-bold tracking-tight">
              Čeká na potvrzení
            </h2>
            <Link href="/admin/rezervace?stav=pending" className="btn btn-ghost btn-sm">
              Všechny
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {pending.map((booking) => (
              <BookingCard key={booking.id} booking={booking} showDate />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
