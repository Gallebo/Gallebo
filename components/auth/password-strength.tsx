const REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  return (
    <ul className="mt-1 space-y-0.5">
      {REQUIREMENTS.map((r) => {
        const met = r.test(password);
        return (
          <li
            key={r.label}
            className="flex items-center gap-1.5 text-[12px] leading-snug"
            style={{ color: met ? "var(--success)" : "var(--ink-3)" }}
          >
            <span aria-hidden="true">{met ? "✓" : "○"}</span>
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}
