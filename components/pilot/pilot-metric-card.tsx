export function PilotMetricCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        borderColor: "var(--line)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--ink-3)" }}
      >
        {label}
      </p>
      <p
        className="mt-2 text-[2.25rem] font-semibold leading-none tracking-[-0.03em]"
        style={{ color: valueColor ?? "var(--primary-v2)" }}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-2 text-[13px]" style={{ color: "var(--ink-3)" }}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}
