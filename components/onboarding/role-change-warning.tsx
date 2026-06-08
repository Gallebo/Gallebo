export function RoleChangeWarning() {
  return (
    <div
      className="rounded-lg border px-4 py-3 text-sm"
      style={{
        borderColor: "var(--coral)",
        background: "color-mix(in srgb, var(--coral) 8%, var(--surface))",
        color: "var(--ink)",
      }}
      role="alert"
    >
      Your role cannot be changed after submission. For role changes contact{" "}
      <a
        href="mailto:support@gallebo.app"
        className="font-medium underline"
        style={{ color: "var(--primary-v2)" }}
      >
        support@gallebo.app
      </a>
    </div>
  );
}
