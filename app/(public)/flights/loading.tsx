export default function FlightsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <div className="h-10 w-64 rounded-lg bg-muted/30" />
        <div className="h-4 w-96 max-w-full rounded bg-muted/30" />
      </div>
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-28 rounded-lg bg-muted/30" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
