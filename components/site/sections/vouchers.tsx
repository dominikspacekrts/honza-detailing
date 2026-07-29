import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import type { Voucher } from "@/lib/database.types";
import type { SiteSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/time";

/** Platnost 12 → „12 měsíců", 1 → „1 měsíc" */
function validityLabel(months: number): string {
  if (months === 1) return "1 měsíc";
  if (months >= 2 && months <= 4) return `${months} měsíce`;
  if (months === 12) return "celý rok";
  return `${months} měsíců`;
}

export function Vouchers({
  copy,
  vouchers,
  contact,
}: {
  copy: SiteSettings["vouchers"];
  vouchers: Voucher[];
  contact: SiteSettings["contact"];
}) {
  if (vouchers.length === 0) return null;

  const tel = contact.phone.replace(/\s/g, "");

  return (
    <section id="poukazy" className="scroll-mt-24 py-24 md:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Dárek"
          title={copy.title}
          subtitle={copy.subtitle}
          action={
            <a href={`tel:${tel}`} className="btn btn-ghost">
              Objednat telefonicky
            </a>
          }
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {vouchers.map((voucher, i) => (
            <Reveal key={voucher.id} delay={(i % 4) * 80}>
              <VoucherCard voucher={voucher} contact={contact} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="text-ink-faint mt-8 flex items-start gap-2.5 text-sm">
          <svg
            viewBox="0 0 24 24"
            className="mt-0.5 size-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
          </svg>
          <p>{copy.note}</p>
        </Reveal>
      </div>
    </section>
  );
}

function VoucherCard({
  voucher,
  contact,
}: {
  voucher: Voucher;
  contact: SiteSettings["contact"];
}) {
  const subject = encodeURIComponent(`Objednávka poukazu — ${voucher.title}`);
  const body = encodeURIComponent(
    `Dobrý den,\n\nmám zájem o „${voucher.title}" v hodnotě ${voucher.value} Kč.\n\nJméno:\nTelefon:\n\nDěkuji.`,
  );

  return (
    <article
      className={`card sheen group relative flex h-full flex-col overflow-hidden p-6 transition-all duration-400 hover:-translate-y-1.5 ${
        voucher.highlight ? "glow-accent" : ""
      }`}
    >
      {/* Perforace jako na skutečném poukazu */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[4.5rem] h-px opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, color-mix(in oklab, var(--ink) 30%, transparent) 0 6px, transparent 6px 12px)",
        }}
        aria-hidden
      />

      <div className="text-ink-faint flex items-center justify-between text-xs font-medium tracking-wider uppercase">
        <span>Poukaz</span>
        {voucher.highlight && <span className="text-accent">Nejoblíbenější</span>}
      </div>

      <div className="font-display text-gradient mt-3 text-3xl font-bold tracking-tight">
        {formatPrice(voucher.value)}
      </div>

      <h3 className="mt-6 text-base font-semibold">{voucher.title}</h3>
      {voucher.description && (
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          {voucher.description}
        </p>
      )}

      <div className="text-ink-faint mt-auto flex items-center gap-2 pt-6 text-xs">
        <svg
          viewBox="0 0 24 24"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5V12l3 2" strokeLinecap="round" />
        </svg>
        Platí {validityLabel(voucher.validity_months)} od zakoupení
      </div>

      <a
        href={`mailto:${contact.email}?subject=${subject}&body=${body}`}
        className="btn btn-ghost btn-sm group-hover:border-accent/50 mt-4 w-full"
      >
        Mám zájem
      </a>
    </article>
  );
}
