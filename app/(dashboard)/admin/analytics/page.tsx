import { AdminMetricTile } from "@/components/admin/admin-metric-tile";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  getFunnelMetrics,
  getPopularAirfields,
  getPopularRoutes,
} from "@/lib/admin/analytics";
import { privatePageRobots } from "@/lib/seo/site";

export const metadata = {
  title: "Analytics — Gallebo Admin",
  robots: privatePageRobots,
};

export default async function AdminAnalyticsPage() {
  const [funnel, routes, airfields] = await Promise.all([
    getFunnelMetrics(),
    getPopularRoutes(),
    getPopularAirfields(),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Admin"
        title="Analytics"
        description="Conversion funnel and popular routes. Product events also flow to PostHog when configured."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricTile label="Registrations" value={String(funnel.registrations)} />
        <AdminMetricTile label="Verified users" value={String(funnel.verifiedUsers)} />
        <AdminMetricTile label="Booking requests" value={String(funnel.bookingRequests)} />
        <AdminMetricTile label="Completed flights" value={String(funnel.completedFlights)} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <AdminMetricTile
          label="Reg → verified"
          value={`${funnel.conversionToVerified}%`}
        />
        <AdminMetricTile
          label="Verified → booking"
          value={`${funnel.conversionToBooking}%`}
        />
        <AdminMetricTile
          label="Booking → completed"
          value={`${funnel.conversionToCompleted}%`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border p-5" style={{ borderColor: "var(--line)" }}>
          <h2 className="mb-4 text-lg font-semibold">Popular routes</h2>
          {routes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No route data yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {routes.map((r) => (
                <li key={r.route} className="flex justify-between gap-4">
                  <span>{r.route}</span>
                  <span className="font-medium tabular-nums">{r.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border p-5" style={{ borderColor: "var(--line)" }}>
          <h2 className="mb-4 text-lg font-semibold">Popular airfields</h2>
          {airfields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No airfield data yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {airfields.map((a) => (
                <li key={a.icao} className="flex justify-between gap-4">
                  <span>
                    {a.name}{" "}
                    <span className="text-muted-foreground">({a.icao})</span>
                  </span>
                  <span className="font-medium tabular-nums">{a.flightCount}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
