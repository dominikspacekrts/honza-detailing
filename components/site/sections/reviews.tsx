import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { ReviewForm } from "@/components/site/review-form";
import type { Review } from "@/lib/database.types";
import type { SiteSettings } from "@/lib/settings";
import { formatDateShort } from "@/lib/time";

export function Reviews({
  copy,
  reviews,
  isLoggedIn,
  average,
}: {
  copy: SiteSettings["reviews"];
  reviews: Review[];
  isLoggedIn: boolean;
  average: number | null;
}) {
  return (
    <section id="recenze" className="scroll-mt-24 py-24 md:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Reference"
          title={copy.title}
          subtitle={copy.subtitle}
          action={
            average !== null && (
              <div className="card flex items-center gap-4 px-5 py-4">
                <div className="font-display text-gradient text-4xl font-bold">
                  {average.toFixed(1).replace(".", ",")}
                </div>
                <div>
                  <Stars value={Math.round(average)} />
                  <div className="text-ink-faint mt-1 text-xs">
                    {reviews.length}{" "}
                    {reviews.length === 1
                      ? "recenze"
                      : reviews.length < 5
                        ? "recenze"
                        : "recenzí"}
                  </div>
                </div>
              </div>
            )
          }
        />

        <div className="mt-14 grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="grid gap-5 sm:grid-cols-2">
            {reviews.length === 0 ? (
              <p className="text-ink-muted card p-6 text-sm sm:col-span-2">
                Zatím tu nejsou žádné recenze. Buďte první!
              </p>
            ) : (
              reviews.map((review, i) => (
                <Reveal key={review.id} delay={(i % 2) * 80}>
                  <ReviewCard review={review} />
                </Reveal>
              ))
            )}
          </div>

          <Reveal delay={120} className="lg:sticky lg:top-24">
            <ReviewForm isLoggedIn={isLoggedIn} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="card sheen flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <Stars value={review.rating} />
        <time className="text-ink-faint text-xs" dateTime={review.created_at}>
          {formatDateShort(review.created_at)}
        </time>
      </div>

      <blockquote className="text-ink-muted mt-4 flex-1 text-sm leading-relaxed">
        „{review.body}&ldquo;
      </blockquote>

      <footer className="mt-5 flex items-center gap-3 border-t border-[var(--line)] pt-4">
        <div className="from-accent/25 to-accent-2/25 text-ink grid size-9 place-items-center rounded-full bg-gradient-to-br text-xs font-bold">
          {review.author_name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{review.author_name}</div>
          {review.car && (
            <div className="text-ink-faint truncate text-xs">{review.car}</div>
          )}
        </div>
      </footer>
    </article>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${value} z 5 hvězdiček`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`size-3.5 ${i < value ? "text-accent" : "text-ink-faint"}`}
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5-4.8-4.6 6.6-.9z" />
        </svg>
      ))}
    </div>
  );
}
