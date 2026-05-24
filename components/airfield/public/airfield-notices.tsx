interface Notice {
  id: string;
  body: string;
  created_at: string;
  priority?: string | null;
}

interface AirfieldNoticesProps {
  notices: Notice[];
}

export function AirfieldNotices({ notices }: AirfieldNoticesProps) {
  if (notices.length === 0) return null;

  return (
    <section
      className="py-12"
      style={{ background: "var(--surface)", borderTop: "1px solid var(--line)" }}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p
            className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--sun)" }}
          >
            Notices
          </p>
          <h2
            className="text-[22px] font-semibold"
            style={{ color: "var(--ink)" }}
          >
            Airfield notices
          </h2>
        </div>

        <div className="space-y-3">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="rounded-2xl p-5"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--line)",
                borderLeft: notice.priority === "high" ? "3px solid var(--coral)" : "1px solid var(--line)",
              }}
            >
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
                {notice.body}
              </p>
              <p className="mt-2 text-[12px]" style={{ color: "var(--ink-3)" }}>
                {new Date(notice.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
