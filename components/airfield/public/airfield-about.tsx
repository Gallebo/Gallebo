interface AirfieldAboutProps {
  airfieldName: string;
  description?: string | null;
  destinationInfo?: string | null;
}

export function AirfieldAbout({
  airfieldName,
  description,
  destinationInfo,
}: AirfieldAboutProps) {
  if (!description && !destinationInfo) return null;

  return (
    <section className="py-16" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p
              className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--ink-3)" }}
            >
              About
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(30px, 4.5vw, 52px)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: "var(--ink)",
                margin: 0,
              }}
            >
              {airfieldName
                .split(" ")
                .slice(0, 1)
                .join(" ")}
              {", "}
              <br />
              <em>up close.</em>
            </h2>
          </div>

          <div className="space-y-6">
            {description && (
              <p
                className="text-[15px] leading-relaxed"
                style={{ color: "var(--ink-2)" }}
              >
                {description}
              </p>
            )}

            {destinationInfo && (
              <blockquote
                className="rounded-2xl p-6"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderLeft: "3px solid var(--coral)",
                }}
              >
                <p
                  className="text-[15px] italic leading-relaxed"
                  style={{ color: "var(--ink-2)", fontFamily: "var(--font-display)" }}
                >
                  &ldquo;{destinationInfo}&rdquo;
                </p>
              </blockquote>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
