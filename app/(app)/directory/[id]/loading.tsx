export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8" aria-busy="true" aria-label="Loading profile">
      <div className="skeleton mb-5 h-4 w-24" />
      <div className="card flex flex-col gap-6 p-6 sm:flex-row sm:p-8">
        <div className="skeleton h-28 w-28 rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-5 w-28 rounded-full" />
          <div className="skeleton h-10 w-72 max-w-full" />
          <div className="skeleton h-5 w-80 max-w-full" />
          <div className="skeleton h-4 w-40" />
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr),20rem]">
        <div className="card h-48 p-6"><div className="skeleton h-3 w-20" /></div>
        <div className="card h-48 p-6"><div className="skeleton h-3 w-20" /></div>
      </div>
    </div>
  );
}
