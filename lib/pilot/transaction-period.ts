/** Resolve report period from URL/search params (year or custom from/to). */
export function resolveTransactionPeriod(input: {
  year?: string | null;
  from?: string | null;
  to?: string | null;
}): { from: string; to: string } {
  const currentYear = new Date().getFullYear();

  if (input.from && input.to) {
    return { from: input.from, to: input.to };
  }

  const year = input.year ? Number.parseInt(input.year, 10) : currentYear;
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return {
      from: `${currentYear}-01-01`,
      to: `${currentYear}-12-31`,
    };
  }

  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  };
}

export function formatPeriodLabel(from: string, to: string): string {
  const fromDate = new Date(`${from}T12:00:00`);
  const toDate = new Date(`${to}T12:00:00`);
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  return `${fromDate.toLocaleDateString("en-GB", opts)} – ${toDate.toLocaleDateString("en-GB", opts)}`;
}
