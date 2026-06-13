export default function PassengerDashboardLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="space-y-3">
        <div className="h-3 w-40 rounded bg-muted/30" />
        <div className="h-10 w-80 max-w-full rounded-lg bg-muted/30" />
        <div className="h-4 w-96 max-w-full rounded bg-muted/30" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted/30" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-5 w-44 rounded bg-muted/30" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
