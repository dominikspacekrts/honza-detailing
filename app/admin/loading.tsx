/** Okamžitá odezva při přepínání mezi sekcemi administrace. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Načítám…</span>

      <div className="mb-8">
        <div className="skeleton h-3 w-24 rounded-full" />
        <div className="skeleton mt-3 h-8 w-64 rounded-lg" />
        <div className="skeleton mt-3 h-4 w-96 max-w-full rounded-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-3 w-24 rounded-full" />
            <div className="skeleton mt-3 h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-start gap-4">
              <div className="skeleton h-10 w-24 rounded-lg" />
              <div className="flex-1">
                <div className="skeleton h-5 w-52 max-w-full rounded-lg" />
                <div className="skeleton mt-2.5 h-3.5 w-72 max-w-full rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
