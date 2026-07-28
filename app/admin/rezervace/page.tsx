import Link from "next/link";
import { BookingCard, type AdminBooking } from "@/components/admin/booking-card";
import { AdminHeader } from "@/components/admin/ui";
import { STATUS_LABELS } from "@/components/booking-status";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/lib/database.types";

export const metadata = { title: "Rezervace" };

const FILTERS: { value: string; label: string }[] = [
  { value: "vse", label: "Vše" },
  { value: "pending", label: STATUS_LABELS.pending },
  { value: "confirmed", label: STATUS_LABELS.confirmed },
  { value: "completed", label: STATUS_LABELS.completed },
  { value: "cancelled", label: STATUS_LABELS.cancelled },
];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ stav?: string; obdobi?: string }>;
}) {
  const { stav = "vse", obdobi = "budouci" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("bookings")
    .select("*, services(name, duration_min)")
    .limit(200);

  if (FILTERS.some((f) => f.value === stav && f.value !== "vse")) {
    query = query.eq("status", stav as BookingStatus);
  }

  if (obdobi === "budouci") {
    query = query
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });
  } else {
    query = query
      .lt("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: false });
  }

  const { data } = await query;
  const bookings = (data ?? []) as unknown as AdminBooking[];

  const link = (patch: Record<string, string>) => {
    const params = new URLSearchParams({ stav, obdobi, ...patch });
    return `/admin/rezervace?${params}`;
  };

  return (
    <>
      <AdminHeader
        eyebrow="Zakázky"
        title="Rezervace"
        subtitle="Potvrzování, rušení a historie všech objednávek."
      />

      <div className="mb-7 flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={link({ stav: filter.value })}
            className={`btn btn-sm ${stav === filter.value ? "btn-primary" : "btn-ghost"}`}
          >
            {filter.label}
          </Link>
        ))}

        <span className="mx-2 hidden h-5 w-px bg-[var(--line)] sm:block" />

        {[
          { value: "budouci", label: "Nadcházející" },
          { value: "historie", label: "Historie" },
        ].map((period) => (
          <Link
            key={period.value}
            href={link({ obdobi: period.value })}
            className={`btn btn-sm ${obdobi === period.value ? "btn-primary" : "btn-ghost"}`}
          >
            {period.label}
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="card text-ink-muted p-8 text-center text-sm">
          Žádné rezervace neodpovídají vybranému filtru.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} showDate />
          ))}
        </div>
      )}
    </>
  );
}
