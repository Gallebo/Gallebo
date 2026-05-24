interface AirfieldInfoGridProps {
  airfield: {
    has_fuel?: boolean;
    has_hangar?: boolean;
    has_rental?: boolean;
    contact_email?: string | null;
    contact_phone?: string | null;
    website?: string | null;
    working_hours?: string | null;
  };
}

const FacilitiesIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
);

const HoursIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <polyline points="9 16 11 18 15 14" />
  </svg>
);

const ContactIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const SafetyIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

function InfoCard({
  number,
  icon,
  title,
  rows,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  rows: { label: string; value: React.ReactNode }[];
}) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
      }}
    >
      <div className="mb-4 flex items-start justify-between">
        <span style={{ color: "var(--primary-v2)", opacity: 0.8 }}>{icon}</span>
        <span
          className="text-[11px] font-semibold"
          style={{ color: "var(--ink-3)" }}
        >
          {number}
        </span>
      </div>
      <h3
        className="mb-4 text-[15px] font-semibold"
        style={{ color: "var(--ink)" }}
      >
        {title}
      </h3>
      <dl className="space-y-2">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 text-[13px]"
          >
            <dt style={{ color: "var(--ink-3)" }}>{label}</dt>
            <dd
              className="text-right font-medium"
              style={{ color: "var(--ink-2)" }}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Check({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1" style={{ color: "var(--ink-2)" }}>
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "var(--success)" }}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {label}
    </span>
  );
}

export function AirfieldInfoGrid({ airfield }: AirfieldInfoGridProps) {
  const facilityRows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Parking",
      value: airfield.has_hangar ? <Check label="Apron + tie-downs" /> : "—",
    },
    {
      label: "Fuel",
      value: airfield.has_fuel ? <Check label="Avgas 100LL" /> : "Not available",
    },
    {
      label: "Hangar",
      value: airfield.has_hangar ? <Check label="Overnight" /> : "Not available",
    },
    {
      label: "Rental",
      value: airfield.has_rental ? <Check label="Available" /> : "—",
    },
  ];

  const hoursRows = [
    { label: "Weekdays", value: "08:00 — 18:00" },
    { label: "Weekends", value: "09:00 — 17:00" },
    { label: "Emergency", value: "24/7 on call" },
  ];

  const contactRows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Phone",
      value: airfield.contact_phone ? (
        <a
          href={`tel:${airfield.contact_phone}`}
          className="hover:underline"
          style={{ color: "var(--primary-v2)" }}
        >
          {airfield.contact_phone}
        </a>
      ) : (
        "—"
      ),
    },
    {
      label: "Email",
      value: airfield.contact_email ? (
        <a
          href={`mailto:${airfield.contact_email}`}
          className="hover:underline"
          style={{ color: "var(--primary-v2)" }}
        >
          {airfield.contact_email}
        </a>
      ) : (
        "—"
      ),
    },
    {
      label: "Web",
      value: airfield.website ? (
        <a
          href={airfield.website}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          style={{ color: "var(--primary-v2)" }}
        >
          {new URL(airfield.website).hostname}
        </a>
      ) : (
        "—"
      ),
    },
  ];

  const safetyRows: { label: string; value: React.ReactNode }[] = [
    { label: "Authority", value: <Check label="EASA · Certified" /> },
    { label: "Fire station", value: "2 km" },
    { label: "Rescue", value: "On-site" },
  ];

  return (
    <section
      className="py-16"
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            number="01"
            icon={<FacilitiesIcon />}
            title="Facilities"
            rows={facilityRows}
          />
          <InfoCard
            number="02"
            icon={<HoursIcon />}
            title="Operating hours"
            rows={hoursRows}
          />
          <InfoCard
            number="03"
            icon={<ContactIcon />}
            title="Contact"
            rows={contactRows}
          />
          <InfoCard
            number="04"
            icon={<SafetyIcon />}
            title="Safety"
            rows={safetyRows}
          />
        </div>
      </div>
    </section>
  );
}
