/**
 * Zobrazí se okamžitě po kliknutí na odkaz, než doběhne server.
 * Díky tomu Next.js umí předstahovat i dynamické stránky — proklik
 * pak nečeká na bílé obrazovce.
 */
export default function Loading() {
  return (
    <div className="container-page py-20 md:py-28" aria-busy="true">
      <span className="sr-only">Načítám…</span>

      <div className="mx-auto max-w-2xl">
        <div className="skeleton h-3 w-28 rounded-full" />
        <div className="skeleton mt-6 h-11 w-full rounded-xl" />
        <div className="skeleton mt-3 h-11 w-3/4 rounded-xl" />
        <div className="skeleton mt-6 h-4 w-full rounded-full" />
        <div className="skeleton mt-2.5 h-4 w-5/6 rounded-full" />
      </div>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="card p-6">
            <div className="skeleton h-3 w-20 rounded-full" />
            <div className="skeleton mt-5 h-6 w-3/4 rounded-lg" />
            <div className="skeleton mt-3 h-3.5 w-full rounded-full" />
            <div className="skeleton mt-2 h-3.5 w-4/5 rounded-full" />
            <div className="mt-8 flex items-center justify-between">
              <div className="skeleton h-7 w-24 rounded-lg" />
              <div className="skeleton h-8 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
