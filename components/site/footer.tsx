import Link from "next/link";
import { Logo } from "@/components/logo";
import type { SiteSettings } from "@/lib/settings";

export function Footer({ settings }: { settings: SiteSettings }) {
  const { brand, contact } = settings;
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-32 border-t border-[var(--line)]">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo name={brand.name} tagline={brand.tagline} imageUrl={brand.logoUrl} size={42} />
          <p className="text-ink-muted mt-5 max-w-sm text-sm leading-relaxed">
            {settings.seo.description}
          </p>
          <div className="mt-6 flex gap-3">
            {contact.instagram && (
              <a
                href={contact.instagram}
                target="_blank"
                rel="noreferrer noopener"
                className="glass hover:text-accent grid size-10 place-items-center rounded-full transition-colors"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
            )}
            {contact.facebook && (
              <a
                href={contact.facebook}
                target="_blank"
                rel="noreferrer noopener"
                className="glass hover:text-accent grid size-10 place-items-center rounded-full transition-colors"
                aria-label="Facebook"
              >
                <svg viewBox="0 0 24 24" className="size-4.5" fill="currentColor">
                  <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z" />
                </svg>
              </a>
            )}
          </div>
        </div>

        <nav className="flex flex-col gap-3 text-sm">
          <span className="eyebrow mb-1">Web</span>
          {[
            { href: "/#sluzby", label: "Služby a ceník" },
            { href: "/#pribeh", label: "Náš příběh" },
            { href: "/#galerie", label: "Realizace" },
            { href: "/#recenze", label: "Recenze" },
            { href: "/rezervace", label: "Rezervace" },
            { href: "/ucet", label: "Můj účet" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-ink-muted hover:text-accent w-fit transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-3 text-sm">
          <span className="eyebrow mb-1">Kontakt</span>
          <a
            href={`tel:${contact.phone.replace(/\s/g, "")}`}
            className="text-ink-muted hover:text-accent w-fit transition-colors"
          >
            {contact.phone}
          </a>
          <a
            href={`mailto:${contact.email}`}
            className="text-ink-muted hover:text-accent w-fit transition-colors"
          >
            {contact.email}
          </a>
          <span className="text-ink-muted">{contact.address}</span>
          <span className="text-ink-faint mt-2 text-xs">{contact.hoursNote}</span>
        </div>
      </div>

      <div className="border-t border-[var(--line)]">
        <div className="container-page text-ink-faint flex flex-col gap-2 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {brand.name}
            {contact.ico && ` · IČO ${contact.ico}`}
          </span>
          <span>Platba hotově na místě · Rezervace online 24/7</span>
        </div>
      </div>
    </footer>
  );
}
