interface AirfieldEvent {
  id: string;
  title: string;
  event_date: string;
  description?: string | null;
  link?: string | null;
}

interface AirfieldEventsProps {
  events: AirfieldEvent[];
}

export function AirfieldEvents({ events }: AirfieldEventsProps) {
  return (
    <section className="py-16" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--ink-3)" }}
          >
            Events
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "var(--ink)",
              margin: "0 0 6px",
            }}
          >
            Upcoming at the field.
          </h2>
          <p style={{ color: "var(--ink-3)", fontSize: 14 }}>
            Open to visiting pilots and passengers. RSVP recommended.
          </p>
        </div>

        {events.length > 0 ? (
          <div className="space-y-0">
            {events.map((event, idx) => {
              const date = new Date(event.event_date);
              const day = date.getDate();
              const month = date.toLocaleString("en-GB", { month: "short" }).toUpperCase();
              const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

              return (
                <div
                  key={event.id}
                  className="flex items-start gap-6 py-7"
                  style={{
                    borderTop: idx > 0 ? "1px solid var(--line)" : "1px solid var(--line)",
                  }}
                >
                  {/* Date block */}
                  <div className="w-14 flex-shrink-0 text-center">
                    <p
                      className="text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: "var(--coral)" }}
                    >
                      {month}
                    </p>
                    <p
                      className="text-[32px] font-bold leading-none"
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "var(--ink)",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {day}
                    </p>
                    <p className="mt-1 text-[11px]" style={{ color: "var(--ink-3)" }}>
                      {time}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <h3
                      className="mb-1.5 text-[17px] font-semibold"
                      style={{ color: "var(--ink)" }}
                    >
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="mb-2 text-[14px]" style={{ color: "var(--ink-2)" }}>
                        {event.description}
                      </p>
                    )}
                    <p
                      className="text-[11px] font-semibold uppercase tracking-widest"
                      style={{ color: "var(--ink-3)" }}
                    >
                      Open to visitors
                    </p>
                  </div>

                  {/* CTA */}
                  {event.link && (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors hover:bg-[var(--surface-alt)]"
                      style={{ border: "1px solid var(--line)", color: "var(--ink-2)" }}
                    >
                      Join event
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "var(--ink-3)", fontSize: 14 }}>No upcoming events at this airfield.</p>
        )}
      </div>
    </section>
  );
}
