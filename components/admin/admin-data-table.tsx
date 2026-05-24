interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  mono?: boolean;
  muted?: boolean;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField?: string;
  emptyText?: string;
}

export function AdminDataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  keyField = "id",
  emptyText = "No data yet.",
}: AdminDataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div
        className="rounded-2xl p-12 text-center text-[14px]"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          color: "var(--ink-3)",
        }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ border: "1px solid var(--line)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--surface-alt)" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "var(--ink-3)" }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: "var(--surface)" }}>
            {rows.map((row, i) => (
              <tr
                key={String(row[keyField] ?? i)}
                className="transition-colors hover:bg-[var(--surface-alt)]"
                style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none" }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-5 py-4 text-[13.5px]"
                    style={{
                      color: col.muted ? "var(--ink-3)" : "var(--ink)",
                      fontFamily: col.mono ? "var(--font-mono-v2)" : undefined,
                      fontSize: col.mono ? 12 : undefined,
                    }}
                  >
                    {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
