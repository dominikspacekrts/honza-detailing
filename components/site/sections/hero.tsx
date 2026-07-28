import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import type { SiteSettings } from "@/lib/settings";

export function Hero({
  hero,
  rating,
}: {
  hero: SiteSettings["hero"];
  rating: { average: number; count: number } | null;
}) {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 md:pt-28 md:pb-32">
      <div className="container-page">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Text */}
          <div>
            <div
              className="glass reveal inline-flex items-center gap-2.5 rounded-full py-2 pr-4 pl-2.5 text-xs font-medium"
              style={{ animationDelay: "60ms" }}
            >
              <span className="relative flex size-2">
                <span className="bg-accent absolute inline-flex size-full animate-ping rounded-full opacity-70" />
                <span className="bg-accent relative inline-flex size-2 rounded-full" />
              </span>
              {hero.badge}
            </div>

            <h1
              className="font-display reveal mt-7 text-[2.6rem] leading-[1.02] font-bold tracking-[-0.03em] text-balance sm:text-6xl lg:text-[4.1rem]"
              style={{ animationDelay: "140ms" }}
            >
              {hero.title}{" "}
              <span className="text-gradient block sm:inline">{hero.titleAccent}</span>
            </h1>

            <p
              className="text-ink-muted reveal mt-6 max-w-xl text-base leading-relaxed text-pretty sm:text-lg"
              style={{ animationDelay: "220ms" }}
            >
              {hero.subtitle}
            </p>

            <div
              className="reveal mt-9 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "300ms" }}
            >
              <Link href="/rezervace" className="btn btn-primary">
                {hero.ctaPrimary}
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link href="#galerie" className="btn btn-ghost">
                {hero.ctaSecondary}
              </Link>
            </div>

            {rating && rating.count > 0 && (
              <div
                className="reveal mt-8 flex items-center gap-3"
                style={{ animationDelay: "360ms" }}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <svg
                      key={i}
                      viewBox="0 0 24 24"
                      className={`size-4 ${
                        i < Math.round(rating.average) ? "text-accent" : "text-ink-faint"
                      }`}
                      fill="currentColor"
                    >
                      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5-4.8-4.6 6.6-.9z" />
                    </svg>
                  ))}
                </div>
                <span className="text-ink-muted text-sm">
                  <strong className="text-ink">
                    {rating.average.toFixed(1).replace(".", ",")}
                  </strong>{" "}
                  z {rating.count} recenzí
                </span>
              </div>
            )}
          </div>

          {/* Vizuál */}
          <Reveal delay={200} className="relative">
            <div
              className="card sheen relative aspect-4/5 overflow-hidden sm:aspect-3/2 lg:aspect-4/5"
              style={{ borderRadius: "calc(var(--radius) * 1.6)" }}
            >
              {hero.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hero.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <PaintPlaceholder />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_oklab,var(--bg)_88%,transparent)] via-transparent to-transparent" />
            </div>

            {/* Plovoucí štítek */}
            <div className="glass absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl px-4 py-3 sm:left-8">
              <div className="bg-accent/15 text-accent grid size-9 place-items-center rounded-xl">
                <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div className="text-xs leading-tight">
                <div className="font-semibold">Platba hotově na místě</div>
                <div className="text-ink-faint">Rezervace nezávazná</div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Statistiky */}
        <Reveal delay={140} className="mt-24">
          <div className="card grid grid-cols-2 divide-x divide-y divide-[var(--line)] overflow-hidden md:grid-cols-4 md:divide-y-0">
            {hero.stats.map((stat) => (
              <div key={stat.label} className="px-6 py-7 text-center">
                <div className="font-display text-gradient text-3xl font-bold tracking-tight sm:text-4xl">
                  {stat.value}
                </div>
                <div className="text-ink-faint mt-2 text-xs font-medium tracking-wider uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Abstraktní „lak" pro případ, že admin ještě nenahrál fotku. */
function PaintPlaceholder() {
  return (
    <div className="relative size-full overflow-hidden bg-[var(--surface)]">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(120% 80% at 20% 10%, color-mix(in oklab, var(--accent) 34%, transparent), transparent 60%), radial-gradient(100% 70% at 85% 80%, color-mix(in oklab, var(--accent-2) 40%, transparent), transparent 62%)",
        }}
      />
      <svg
        viewBox="0 0 400 500"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        {Array.from({ length: 9 }, (_, i) => (
          <path
            key={i}
            d={`M-40 ${60 + i * 52} C 120 ${10 + i * 52}, 260 ${120 + i * 52}, 440 ${40 + i * 52}`}
            fill="none"
            stroke="#fff"
            strokeOpacity={0.07 + (i % 3) * 0.035}
            strokeWidth={i % 3 === 0 ? 1.6 : 0.8}
          />
        ))}
      </svg>
      <div className="text-ink-faint absolute inset-x-0 bottom-6 text-center text-[0.65rem] tracking-[0.25em] uppercase">
        Nahrajte úvodní fotku v administraci
      </div>
    </div>
  );
}
