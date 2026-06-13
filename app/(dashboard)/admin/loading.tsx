export default function AdminDashboardLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="space-y-3">
        <div className="h-3 w-28 rounded bg-muted/30" />
        <div className="h-8 w-56 rounded-lg bg-muted/30" />
        <div className="h-4 w-72 rounded bg-muted/30" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/30" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-muted/30" />
      <div className="space-y-3">
        <div className="h-5 w-36 rounded bg-muted/30" />
        <div className="overflow-hidden rounded-2xl border border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 border-b border-border bg-muted/20 last:border-b-0" />
          ))}
        </div>
      </div>
    </div>
  );
}
