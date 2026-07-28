import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sendAdminNotification, sendBookingConfirmation } from "@/lib/email";
import { getSiteSettings } from "@/lib/settings";
import { computeSlots } from "@/lib/slots";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { toDateKey, weekdayOf } from "@/lib/time";
import type { Booking } from "@/lib/database.types";

const schema = z.object({
  serviceSlug: z.string().trim().min(1),
  startsAt: z.string().datetime({ offset: true }),
  name: z.string().trim().min(2, "Zadejte jméno a příjmení.").max(120),
  email: z.string().trim().email("Zadejte platný e-mail.").max(160),
  phone: z.string().trim().min(9, "Zadejte telefon.").max(30),
  carMake: z.string().trim().max(60).optional().or(z.literal("")),
  carModel: z.string().trim().max(60).optional().or(z.literal("")),
  carPlate: z.string().trim().max(20).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
  saveToProfile: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný požadavek." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Zkontrolujte prosím formulář." },
      { status: 400 },
    );
  }

  const input = parsed.data;

  try {
    const supabase = await createClient();
    const settings = await getSiteSettings();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // --- Služba ---------------------------------------------------------
    const { data: service } = await supabase
      .from("services")
      .select("*")
      .eq("slug", input.serviceSlug)
      .eq("active", true)
      .maybeSingle();

    if (!service) {
      return NextResponse.json({ error: "Vybraná služba není dostupná." }, { status: 404 });
    }

    // --- Ověření, že slot je opravdu volný -------------------------------
    const startsAt = new Date(input.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      return NextResponse.json({ error: "Neplatný termín." }, { status: 400 });
    }

    const dateKey = toDateKey(startsAt);
    const { data: hours } = await supabase
      .from("business_hours")
      .select("*")
      .eq("weekday", weekdayOf(dateKey))
      .maybeSingle();

    const { data: busy } = await supabase.rpc("get_busy_ranges", { day: dateKey });

    const available = computeSlots({
      dateKey,
      hours: hours ?? null,
      durationMin: service.duration_min,
      stepMin: settings.booking.slotStepMin,
      busy: busy ?? [],
      leadTimeHours: settings.booking.leadTimeHours,
      wholeDay: service.whole_day,
    });

    const slot = available.find(
      (s) => new Date(s.startsAt).getTime() === startsAt.getTime(),
    );

    if (!slot) {
      return NextResponse.json(
        { error: "Tento termín už bohužel není volný. Vyberte prosím jiný." },
        { status: 409 },
      );
    }

    // --- Uložení ---------------------------------------------------------
    const admin = createAdminClient();
    const { data: booking, error } = await admin
      .from("bookings")
      .insert({
        user_id: user?.id ?? null,
        service_id: service.id,
        customer_name: input.name,
        customer_email: input.email,
        customer_phone: input.phone,
        car_make: input.carMake || null,
        car_model: input.carModel || null,
        car_plate: input.carPlate || null,
        note: input.note || null,
        // U celodenní zakázky se blokuje celá otevírací doba a čas předání
        // se ukládá zvlášť — den tak zůstane nedostupný i pro kratší služby.
        starts_at: slot.blockStartsAt,
        ends_at: slot.blockEndsAt,
        dropoff_at: service.whole_day ? slot.startsAt : null,
        price_estimate: service.price_from,
        status: "pending",
      })
      .select("*")
      .single<Booking>();

    if (error || !booking) {
      console.error("[api/bookings] insert", error);
      return NextResponse.json(
        { error: "Rezervaci se nepodařilo uložit. Zkuste to prosím znovu." },
        { status: 500 },
      );
    }

    // --- Doplnění profilu přihlášeného zákazníka -------------------------
    if (user && input.saveToProfile) {
      await supabase
        .from("profiles")
        .update({
          full_name: input.name,
          phone: input.phone,
          car_make: input.carMake || null,
          car_model: input.carModel || null,
          car_plate: input.carPlate || null,
        })
        .eq("id", user.id);
    }

    // --- E-maily (selhání nesmí shodit rezervaci) ------------------------
    await Promise.allSettled([
      sendBookingConfirmation({ booking, service, settings }),
      sendAdminNotification({ booking, service, settings }),
    ]);

    return NextResponse.json({
      reference: booking.reference,
      startsAt: booking.dropoff_at ?? booking.starts_at,
      endsAt: booking.ends_at,
      wholeDay: service.whole_day,
      serviceName: service.name,
      priceFrom: service.price_from,
      email: booking.customer_email,
    });
  } catch (error) {
    console.error("[api/bookings]", error);
    return NextResponse.json(
      { error: "Rezervaci se nepodařilo dokončit. Zkuste to prosím znovu." },
      { status: 500 },
    );
  }
}
