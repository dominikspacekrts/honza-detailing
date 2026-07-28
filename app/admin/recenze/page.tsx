import { deleteReview, setReviewFlags } from "@/app/actions/admin";
import { AdminHeader, Stat } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { formatDateShort } from "@/lib/time";

export const metadata = { title: "Recenze" };

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .order("approved", { ascending: true })
    .order("created_at", { ascending: false });

  const reviews = data ?? [];
  const waiting = reviews.filter((r) => !r.approved);
  const published = reviews.filter((r) => r.approved);
  const average =
    published.length > 0
      ? published.reduce((s, r) => s + r.rating, 0) / published.length
      : null;

  return (
    <>
      <AdminHeader
        eyebrow="Reference"
        title="Recenze"
        subtitle="Nové recenze se na web dostanou až po vašem schválení."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Čeká na schválení" value={waiting.length} />
        <Stat label="Publikovaných" value={published.length} />
        <Stat
          label="Průměr"
          value={average ? average.toFixed(1).replace(".", ",") : "—"}
          hint="z publikovaných"
        />
      </div>

      {waiting.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display mb-4 text-lg font-bold tracking-tight">
            Ke schválení
          </h2>
          <div className="flex flex-col gap-4">
            {waiting.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display mb-4 text-lg font-bold tracking-tight">
          Publikované
        </h2>
        {published.length === 0 ? (
          <p className="card text-ink-muted p-8 text-center text-sm">
            Zatím nemáte žádnou publikovanou recenzi.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {published.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ReviewRow({
  review,
}: {
  review: {
    id: string;
    author_name: string;
    car: string | null;
    rating: number;
    body: string;
    approved: boolean;
    featured: boolean;
    created_at: string;
  };
}) {
  return (
    <article className="card sheen p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-semibold">{review.author_name}</span>
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <svg
                  key={i}
                  viewBox="0 0 24 24"
                  className={`size-3.5 ${i < review.rating ? "text-accent" : "text-ink-faint"}`}
                  fill="currentColor"
                >
                  <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5-4.8-4.6 6.6-.9z" />
                </svg>
              ))}
            </span>
            {review.featured && <span className="chip text-accent">Nahoře</span>}
          </div>
          {review.car && (
            <div className="text-ink-faint mt-0.5 text-xs">{review.car}</div>
          )}
        </div>
        <time className="text-ink-faint text-xs">
          {formatDateShort(review.created_at)}
        </time>
      </div>

      <p className="text-ink-muted mt-3.5 text-sm leading-relaxed">{review.body}</p>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
        <form action={setReviewFlags}>
          <input type="hidden" name="id" value={review.id} />
          <input type="hidden" name="approved" value={String(!review.approved)} />
          <button
            type="submit"
            className={`btn btn-sm ${review.approved ? "btn-ghost" : "btn-primary"}`}
          >
            {review.approved ? "Skrýt z webu" : "Schválit a zveřejnit"}
          </button>
        </form>

        <form action={setReviewFlags}>
          <input type="hidden" name="id" value={review.id} />
          <input type="hidden" name="featured" value={String(!review.featured)} />
          <button type="submit" className="btn btn-ghost btn-sm">
            {review.featured ? "Zrušit přednost" : "Zobrazit mezi prvními"}
          </button>
        </form>

        <form action={deleteReview} className="ml-auto">
          <input type="hidden" name="id" value={review.id} />
          <button
            type="submit"
            className="btn btn-ghost btn-sm text-red-300 hover:border-red-400/40"
          >
            Smazat
          </button>
        </form>
      </div>
    </article>
  );
}
