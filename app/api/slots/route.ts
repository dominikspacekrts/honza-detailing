import { NextResponse, type NextRequest } from "next/server";
import { getBusinessHours, getServices, getSettings } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { computeSlots } from "@/lib/slots";
import { addDaysToKey, toDateKey, weekdayOf } from "@/lib/time";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/slots?service=<slug>&date=YYYY-MM-DD
 * Vrátí volné začátky pro daný den. Volitelně `days=14` pro přehled obsazenosti.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const slug = searchParams.get("service");
  const date = searchParams.get("date") ?? toDateKey();
  const days = Math.min(Math.max(Number(searchParams.get("days") ?? 1), 1), 31);

  if (!slug) {
    return NextResponse.json({ error: "Chybí parametr service." }, { status: 400 });
  }
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "Neplatné datum." }, { status: 400 });
  }

  try {
    // Ceník i otevírací doba jsou z cache; z databáze se čtou jen obsazené
    // termíny, které se musí načítat vždy čerstvé.
    const [settings, services, hours] = await Promise.all([
      getSettings(),
      getServices(),
      getBusinessHours(),
    ]);

    const service = services.find((s) => s.slug === slug);
    if (!service) {
      return NextResponse.json({ error: "Služba nenalezena." }, { status: 404 });
    }

    const supabase = await createClient();
    const hoursByDay = new Map(hours.map((h) => [h.weekday, h]));

    const results = await Promise.all(
      Array.from({ length: days }, (_, i) => addDaysToKey(date, i)).map(
        async (dateKey) => {
          const { data: busy } = await supabase.rpc("get_busy_ranges", {
            day: dateKey,
          });

          const slots = computeSlots({
            dateKey,
            hours: hoursByDay.get(weekdayOf(dateKey)) ?? null,
            durationMin: service.duration_min,
            stepMin: settings.booking.slotStepMin,
            busy: busy ?? [],
            leadTimeHours: settings.booking.leadTimeHours,
            wholeDay: service.whole_day,
          });

          return { date: dateKey, slots };
        },
      ),
    );

    return NextResponse.json(
      {
        service: {
          id: service.id,
          slug: service.slug,
          name: service.name,
          durationMin: service.duration_min,
          priceFrom: service.price_from,
          wholeDay: service.whole_day,
        },
        days: results,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/slots]", error);
    return NextResponse.json(
      { error: "Termíny se nepodařilo načíst." },
      { status: 500 },
    );
  }
}
