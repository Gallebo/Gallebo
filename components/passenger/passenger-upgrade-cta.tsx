import Link from "next/link";
import { Building2, Plane } from "lucide-react";

export function PassengerUpgradeCta({
  showPilot,
  showAirfield,
}: {
  showPilot: boolean;
  showAirfield: boolean;
}) {
  if (!showPilot && !showAirfield) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-[1.15rem] font-semibold" style={{ color: "var(--ink)" }}>
        Upgrade your account
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {showPilot ? (
          <Link
            href="/passenger/upgrade/pilot"
            className="flex items-start gap-4 rounded-xl border p-5 no-underline transition-shadow hover:shadow-md"
            style={{ borderColor: "var(--line)", background: "var(--surface)" }}
          >
            <Plane className="mt-0.5 size-6 shrink-0" style={{ color: "var(--primary-v2)" }} />
            <div>
              <p className="font-semibold" style={{ color: "var(--ink)" }}>
                Become a pilot
              </p>
              <p className="mt-1 text-[14px]" style={{ color: "var(--ink-2)" }}>
                Upload your licence and medical certificate for admin review.
              </p>
            </div>
          </Link>
        ) : null}
        {showAirfield ? (
          <Link
            href="/passenger/upgrade/airfield"
            className="flex items-start gap-4 rounded-xl border p-5 no-underline transition-shadow hover:shadow-md"
            style={{ borderColor: "var(--line)", background: "var(--surface)" }}
          >
            <Building2 className="mt-0.5 size-6 shrink-0" style={{ color: "var(--primary-v2)" }} />
            <div>
              <p className="font-semibold" style={{ color: "var(--ink)" }}>
                Airfield operator
              </p>
              <p className="mt-1 text-[14px]" style={{ color: "var(--ink-2)" }}>
                Request access to manage your airfield on Gallebo.
              </p>
            </div>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
