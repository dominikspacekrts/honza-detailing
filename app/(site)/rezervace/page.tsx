import type { Metadata } from "next";
import Link from "next/link";
import { BookingWizard } from "@/components/booking/wizard";
import { getSessionUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import type { Service } from "@/lib/database.types";

export const metadata: Metadata = { title: "Rezervace termínu" };
export const dynamic = "force-dynamic";

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ sluzba?: string }>;
}) {
  const { sluzba } = await searchParams;
  const [settings, user] = await Promise.all([getSiteSettings(), getSessionUser()]);

  let services: Service[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    services = data ?? [];
  } catch {
    // řešeno níže
  }

  return (
    <div className="container-page py-16 md:py-24">
      <div className="reveal mx-auto max-w-2xl text-center">
        <div className="eyebrow mb-4">Rezervace</div>
        <h1 className="font-display text-3xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl">
          {settings.booking.title}
        </h1>
        <p className="text-ink-muted mt-4 text-pretty">{settings.booking.subtitle}</p>

        {!user && (
          <p className="text-ink-faint mt-5 text-sm">
            Rezervovat můžete i bez účtu.{" "}
            <Link
              href="/prihlaseni?next=/rezervace"
              className="text-accent hover:underline"
            >
              Přihlaste se
            </Link>{" "}
            a údaje se předvyplní samy.
          </p>
        )}
      </div>

      <div className="mt-14">
        {services.length === 0 ? (
          <div className="card text-ink-muted mx-auto max-w-xl p-8 text-center text-sm">
            Nepodařilo se načíst seznam služeb. Zkontrolujte prosím připojení k
            databázi (Supabase) nebo nás kontaktujte na{" "}
            <a href={`tel:${settings.contact.phone.replace(/\s/g, "")}`} className="text-accent">
              {settings.contact.phone}
            </a>
            .
          </div>
        ) : (
          <BookingWizard
            services={services}
            settings={settings}
            profile={user?.profile ?? null}
            email={user?.email ?? null}
            initialSlug={sluzba ?? null}
          />
        )}
      </div>
    </div>
  );
}
