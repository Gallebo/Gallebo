import { AlertCard } from "@/components/alerts/AlertCard";
import { AlertForm } from "@/components/alerts/AlertForm";
import { PilotPageHeader } from "@/components/pilot/pilot-page-header";
import { requireVerifiedPassenger } from "@/lib/auth/rbac";
import {
  getAlertCountries,
  getMyActiveAlerts,
} from "@/lib/alerts/queries";

export const metadata = { title: "Flight alerts — Gallebo" };

export default async function PassengerAlertsPage() {
  const { user } = await requireVerifiedPassenger();
  const [alerts, countries] = await Promise.all([
    getMyActiveAlerts(user.id),
    getAlertCountries(),
  ]);

  return (
    <div className="space-y-8">
      <PilotPageHeader
        eyebrow="Alerts"
        title="Flight alerts"
        description="Get notified when a pilot publishes a flight that matches your route and dates."
        action={{ href: "/flights", label: "Search flights" }}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: "var(--ink)" }}>
          Your active alerts
        </h2>
        {alerts.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ink-3)" }}>
            No active alerts yet. Create one below when you cannot find a suitable
            flight.
          </p>
        ) : (
          <ul className="space-y-4" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {alerts.map((alert) => (
              <li key={alert.id}>
                <AlertCard alert={alert} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: "var(--ink)" }}>
          New alert
        </h2>
        <AlertForm countries={countries} />
      </section>
    </div>
  );
}
