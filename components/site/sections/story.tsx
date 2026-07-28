import { Reveal } from "@/components/site/reveal";
import type { SiteSettings } from "@/lib/settings";

export function Story({ story }: { story: SiteSettings["story"] }) {
  return (
    <section
      id="pribeh"
      className="relative scroll-mt-24 overflow-hidden py-24 md:py-32"
    >
      {/* Jemný podklad odlišující sekci */}
      <div
        className="absolute inset-x-0 top-0 h-full"
        style={{
          background:
            "linear-gradient(180deg, transparent, color-mix(in oklab, var(--surface) 55%, transparent) 18%, color-mix(in oklab, var(--surface) 55%, transparent) 82%, transparent)",
        }}
        aria-hidden
      />

      <div className="container-page relative">
        <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <Reveal className="relative order-2 lg:order-1">
            <div
              className="card sheen relative aspect-4/3 overflow-hidden lg:aspect-square"
              style={{ borderRadius: "calc(var(--radius) * 1.5)" }}
            >
              {story.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <GarageIllustration />
              )}
            </div>
          </Reveal>

          <div className="order-1 lg:order-2">
            <Reveal>
              <div className="eyebrow mb-4">{story.badge}</div>
              <h2 className="font-display text-3xl leading-[1.1] font-bold tracking-tight text-balance sm:text-4xl md:text-[2.75rem]">
                {story.title}
              </h2>
            </Reveal>

            <div className="mt-6 flex flex-col gap-4">
              {story.paragraphs.map((paragraph, i) => (
                <Reveal key={i} delay={80 + i * 70}>
                  <p className="text-ink-muted leading-relaxed text-pretty">
                    {paragraph}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* Časová osa */}
        {story.milestones.length > 0 && (
          <div className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {story.milestones.map((milestone, i) => (
              <Reveal key={milestone.year + i} delay={i * 90}>
                <div className="card relative h-full p-6">
                  <div className="bg-accent/12 absolute inset-x-6 top-0 h-px" />
                  <div className="font-display text-gradient text-2xl font-bold tracking-tight">
                    {milestone.year}
                  </div>
                  <div className="mt-3 text-base font-semibold">{milestone.title}</div>
                  <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                    {milestone.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function GarageIllustration() {
  return (
    <div className="relative size-full bg-[var(--bg)]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 110%, color-mix(in oklab, var(--accent) 26%, transparent), transparent 70%)",
        }}
      />
      <svg viewBox="0 0 400 400" className="absolute inset-0 size-full" aria-hidden>
        {/* Perspektivní mřížka podlahy */}
        {Array.from({ length: 11 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={200 + (i - 5) * 22}
            y1="260"
            x2={200 + (i - 5) * 120}
            y2="400"
            stroke="currentColor"
            strokeOpacity="0.09"
          />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={265 + i * i * 3.6 + i * 8}
            x2="400"
            y2={265 + i * i * 3.6 + i * 8}
            stroke="currentColor"
            strokeOpacity="0.09"
          />
        ))}
        {/* Světelné pruhy nad boxem */}
        {[0, 1, 2].map((i) => (
          <rect
            key={i}
            x={80 + i * 82}
            y={54}
            width="58"
            height="6"
            rx="3"
            fill="var(--accent)"
            opacity={0.5 - i * 0.1}
          />
        ))}
        {/* Silueta vozu */}
        <path
          d="M78 236 L102 190 C108 178 120 172 134 172 H266 C280 172 292 178 298 190 L322 236 C328 240 330 246 330 252 V266 H70 V252 C70 246 72 240 78 236 Z"
          fill="color-mix(in oklab, var(--ink) 10%, transparent)"
          stroke="var(--accent)"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
        <path
          d="M118 232 L136 194 H264 L282 232 Z"
          fill="color-mix(in oklab, var(--accent) 16%, transparent)"
        />
        <circle cx="122" cy="266" r="22" fill="var(--bg)" stroke="currentColor" strokeOpacity="0.18" />
        <circle cx="278" cy="266" r="22" fill="var(--bg)" stroke="currentColor" strokeOpacity="0.18" />
      </svg>
      <div className="text-ink-faint absolute inset-x-0 bottom-6 text-center text-[0.65rem] tracking-[0.25em] uppercase">
        Fotku studia doplňte v administraci
      </div>
    </div>
  );
}
