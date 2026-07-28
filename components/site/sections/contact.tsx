import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import type { BusinessHour } from "@/lib/database.types";
import type { SiteSettings } from "@/lib/settings";
import { WEEKDAY_LABELS } from "@/lib/time";

const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function Contact({
  contact,
  hours,
}: {
  contact: SiteSettings["contact"];
  hours: BusinessHour[];
}) {
  const byWeekday = new Map(hours.map((h) => [h.weekday, h]));
  const todayWeekday = new Date().getDay();

  return (
    <section id="kontakt" className="scroll-mt-24 py-24 md:py-32">
      <div className="container-page">
        <Reveal>
          <div
            className="card sheen relative overflow-hidden"
            style={{ borderRadius: "calc(var(--radius) * 1.5)" }}
          >
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(60% 80% at 100% 0%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 65%)",
              }}
              aria-hidden
            />

            <div className="relative grid gap-12 p-8 sm:p-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="eyebrow mb-4">Kontakt</div>
                <h2 className="font-display text-3xl leading-[1.1] font-bold tracking-tight text-balance sm:text-4xl">
                  {contact.title}
                </h2>

                <div className="mt-8 flex flex-col gap-5">
                  <ContactRow
                    label="Adresa"
                    value={contact.address}
                    icon={
                      <path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z M12 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    }
                  />
                  <ContactRow
                    label="Telefon"
                    value={contact.phone}
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    icon={
                      <path d="M5 4h4l2 5-2.5 1.5a12 12 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z" />
                    }
                  />
                  <ContactRow
                    label="E-mail"
                    value={contact.email}
                    href={`mailto:${contact.email}`}
                    icon={
                      <>
                        <rect x="3" y="5" width="18" height="14" rx="2.5" />
                        <path d="M3.5 7l8.5 6 8.5-6" />
                      </>
                    }
                  />
                </div>

                <div className="mt-9 flex flex-wrap gap-3">
                  <Link href="/rezervace" className="btn btn-primary">
                    Rezervovat termín
                  </Link>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="btn btn-ghost"
                  >
                    Zavolat
                  </a>
                </div>
              </div>

              <div>
                <div className="eyebrow mb-5">Otevírací doba</div>
                <ul className="flex flex-col">
                  {ORDER.map((weekday) => {
                    const day = byWeekday.get(weekday);
                    const isToday = weekday === todayWeekday;
                    return (
                      <li
                        key={weekday}
                        className={`flex items-center justify-between border-b border-[var(--line)] py-3 text-sm last:border-b-0 ${
                          isToday ? "text-ink font-semibold" : "text-ink-muted"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isToday && <span className="bg-accent size-1.5 rounded-full" />}
                          {WEEKDAY_LABELS[weekday]}
                        </span>
                        <span className={day?.closed || !day ? "text-ink-faint" : ""}>
                          {!day || day.closed
                            ? "Zavřeno"
                            : `${day.open_time.slice(0, 5)} – ${day.close_time.slice(0, 5)}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {contact.mapEmbed && (
                  <div
                    className="mt-6 aspect-video overflow-hidden rounded-2xl border border-[var(--line)]"
                    dangerouslySetInnerHTML={{ __html: contact.mapEmbed }}
                  />
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ContactRow({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value: string;
  href?: string;
  icon: React.ReactNode;
}) {
  const content = (
    <>
      <span className="bg-accent/12 text-accent grid size-10 shrink-0 place-items-center rounded-xl">
        <svg
          viewBox="0 0 24 24"
          className="size-4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon}
        </svg>
      </span>
      <span className="min-w-0">
        <span className="text-ink-faint block text-xs tracking-wider uppercase">
          {label}
        </span>
        <span className="block text-sm font-medium">{value}</span>
      </span>
    </>
  );

  return href ? (
    <a href={href} className="hover:text-accent flex items-center gap-4 transition-colors">
      {content}
    </a>
  ) : (
    <div className="flex items-center gap-4">{content}</div>
  );
}
