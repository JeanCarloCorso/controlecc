export function normalizeDateOnly(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }

  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;

  const [, year, month, day] = match;
  const parsed = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() + 1 !== Number(month) ||
    parsed.getUTCDate() !== Number(day)
  ) return null;

  return `${year}-${month}-${day}`;
}

export function formatDateOnlyPtBr(value: unknown, fallback = "Não informada") {
  const normalized = normalizeDateOnly(value);
  if (!normalized) return fallback;
  const [year, month, day] = normalized.split("-");
  return `${day}/${month}/${year}`;
}
