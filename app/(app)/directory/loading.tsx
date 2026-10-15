export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading the directory">
      <section className="border-b border-stone-200 bg-white">
        <div className="container-app pb-5 pt-10">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton mt-3 h-10 w-80 max-w-full" />
          <div className="skeleton mt-3 h-4 w-[28rem] max-w-full" />
          <div className="skeleton mt-6 h-12 w-full rounded-xl" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-9 w-28 rounded-full" />
            ))}
          </div>
        </div>
      </section>
      <div className="container-app py-6">
        <div className="skeleton mb-4 h-5 w-28" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="card flex gap-3.5 p-4">
              <div className="skeleton h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-3 w-1/3" />
                <div className="skeleton h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
