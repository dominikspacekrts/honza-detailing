import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import type { Service } from "@/lib/database.types";
import type { SiteSettings } from "@/lib/settings";
import { formatDuration, formatPrice } from "@/lib/time";

export function Services({
  copy,
  services,
}: {
  copy: SiteSettings["services"];
  services: Service[];
}) {
  if (services.length === 0) return null;

  return (
    <section id="sluzby" className="scroll-mt-24 py-24 md:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Co pro vás uděláme"
          title={copy.title}
          subtitle={copy.subtitle}
          action={
            <Link href="/rezervace" className="btn btn-ghost">
              Rezervovat termín
            </Link>
          }
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.id} delay={(i % 3) * 90}>
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>

        <Reveal
          delay={120}
          className="text-ink-faint mt-10 flex items-start gap-2.5 text-sm"
        >
          <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 7.5v.5" strokeLinecap="round" />
          </svg>
          <p>
            Uvedené ceny jsou orientační pro vozy střední třídy. U SUV, dodávek a
            silně znečištěných vozů se cena může lišit — vždy ji potvrdíme před
            zahájením práce.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <article
      className={`card sheen group relative flex h-full flex-col p-6 transition-all duration-400 hover:-translate-y-1.5 ${
        service.highlight ? "glow-accent" : ""
      }`}
    >
      {service.highlight && (
        <span className="bg-accent absolute -top-2.5 right-6 rounded-full px-2.5 py-1 text-[0.65rem] font-bold tracking-wider text-[var(--bg)] uppercase">
          Nejžádanější
        </span>
      )}

      <div className="text-ink-faint flex items-center justify-between text-xs font-medium tracking-wider uppercase">
        <span>{service.category}</span>
        <span>{formatDuration(service.duration_min)}</span>
      </div>

      <h3 className="font-display group-hover:text-gradient mt-4 text-xl font-bold tracking-tight transition-all">
        {service.name}
      </h3>
      {service.tagline && (
        <p className="text-accent mt-1.5 text-sm font-medium">{service.tagline}</p>
      )}
      {service.description && (
        <p className="text-ink-muted mt-3 text-sm leading-relaxed">
          {service.description}
        </p>
      )}

      {service.features.length > 0 && (
        <ul className="mt-5 flex flex-col gap-2 border-t border-[var(--line)] pt-5">
          {service.features.map((feature) => (
            <li key={feature} className="text-ink-muted flex gap-2.5 text-sm">
              <svg
                viewBox="0 0 24 24"
                className="text-accent mt-0.5 size-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-end justify-between gap-4 pt-7">
        <div>
          {service.price_note && (
            <span className="text-ink-faint block text-xs">{service.price_note}</span>
          )}
          <span className="font-display text-2xl font-bold tracking-tight">
            {formatPrice(service.price_from)}
          </span>
        </div>
        <Link
          href={`/rezervace?sluzba=${service.slug}`}
          className="btn btn-ghost btn-sm group-hover:border-accent/50"
        >
          Rezervovat
        </Link>
      </div>
    </article>
  );
}
