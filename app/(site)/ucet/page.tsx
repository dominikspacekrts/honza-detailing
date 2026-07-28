import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cancelOwnBooking } from "@/app/actions/auth";
import { StatusBadge } from "@/components/booking-status";
import { ProfileForm } from "@/components/site/profile-form";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Booking, Service } from "@/lib/database.types";
import { formatDate, formatPrice, formatTime, formatWeekday } from "@/lib/time";

export const metadata: Metadata = { title: "Můj účet" };

type BookingWithService = Booking & {
  services: Pick<Service, "name" | "slug" | "whole_day" | "price_note"> | null;
};

/** Rozdělí rezervace na nadcházející a historii. */
function splitByTime(bookings: BookingWithService[]) {
  const now = Date.now();
  const upcoming: BookingWithService[] = [];
  const past: BookingWithService[] = [];

  for (const booking of bookings) {
    const isUpcoming =
      new Date(booking.starts_at).getTime() >= now && booking.status !== "cancelled";
    (isUpcoming ? upcoming : past).push(booking);
  }

  return { upcoming, past };
}

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/prihlaseni?next=/ucet");

  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("*, services(name, slug, whole_day, price_note)")
    .eq("user_id", user.id)
    .order("starts_at", { ascending: false });

  const { upcoming, past } = splitByTime(
    (data ?? []) as unknown as BookingWithService[],
  );

  return (
    <div className="container-page py-16 md:py-24">
      <div className="reveal">
        <div className="eyebrow mb-4">Můj účet</div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Dobrý den
          {user.profile?.full_name ? `, ${user.profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-ink-muted mt-2.5">
          Přehled vašich rezervací a údajů, které používáme při objednávce.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-bold tracking-tight">
                Nadcházející termíny
              </h2>
              <Link href="/rezervace" className="btn btn-primary btn-sm">
                Nová rezervace
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <div className="card text-ink-muted p-6 text-sm">
                Zatím nemáte naplánovaný žádný termín.{" "}
                <Link href="/rezervace" className="text-accent hover:underline">
                  Vyberte si volný slot
                </Link>
                .
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {upcoming.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} cancellable />
                ))}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="font-display mb-4 text-xl font-bold tracking-tight">
                Historie
              </h2>
              <div className="flex flex-col gap-4">
                {past.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </section>
          )}
        </div>

        <ProfileForm profile={user.profile} email={user.email} />
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  cancellable = false,
}: {
  booking: BookingWithService;
  cancellable?: boolean;
}) {
  const car = [booking.car_make, booking.car_model, booking.car_plate]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="card sheen p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold tracking-tight">
            {booking.services?.name ?? "Služba"}
          </h3>
          <div className="text-ink-faint mt-1 font-mono text-xs">
            #{booking.reference}
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <dl className="mt-5 grid gap-4 border-t border-[var(--line)] pt-5 sm:grid-cols-3">
        <Detail
          label="Termín"
          value={`${formatWeekday(booking.starts_at)} ${formatDate(booking.starts_at)}`}
        />
        <Detail
          label={booking.services?.whole_day ? "Předání vozu" : "Čas"}
          value={
            booking.services?.whole_day
              ? `${formatTime(booking.dropoff_at ?? booking.starts_at)} — celý den`
              : `${formatTime(booking.starts_at)} – ${formatTime(booking.ends_at)}`
          }
        />
        <Detail
          label="Cena"
          value={
            booking.price_estimate
              ? `${booking.services?.price_note || "od"} ${formatPrice(booking.price_estimate)}`.trim()
              : "dle prohlídky"
          }
        />
        {car && <Detail label="Vozidlo" value={car} />}
        {booking.note && <Detail label="Poznámka" value={booking.note} />}
      </dl>

      {cancellable && ["pending", "confirmed"].includes(booking.status) && (
        <form action={cancelOwnBooking} className="mt-5 flex justify-end">
          <input type="hidden" name="bookingId" value={booking.id} />
          <button
            type="submit"
            className="text-ink-faint text-xs font-medium transition-colors hover:text-red-300"
          >
            Zrušit rezervaci
          </button>
        </form>
      )}
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-faint text-xs tracking-wider uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
