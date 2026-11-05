export const MODES = ["day", "week", "month", "range"] as const;
export type Mode = (typeof MODES)[number];
export type GroupBy = "day" | "week" | "month";
export type Range = { from: string; to: string };

const DAY = 864e5;
const at = (day: string) => Date.parse(`${day}T00:00:00Z`);
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function rangeFor(mode: Exclude<Mode, "range">, day: string): Range {
  const ms = at(day);
  if (mode === "day") return { from: day, to: day };
  if (mode === "week") {
    const monday = ms - ((new Date(ms).getUTCDay() + 6) % 7) * DAY;
    return { from: iso(monday), to: iso(monday + 6 * DAY) };
  }
  const d = new Date(ms);
  return {
    from: iso(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)),
    to: iso(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)),
  };
}

export function shift(mode: Mode, range: Range, direction: 1 | -1): Range {
  if (mode === "day" || mode === "week") {
    return rangeFor(
      mode,
      iso(at(range.from) + direction * (mode === "day" ? 1 : 7) * DAY),
    );
  }
  if (mode === "month") {
    const d = new Date(at(range.from));
    return rangeFor(
      "month",
      iso(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + direction, 1)),
    );
  }
  const length = at(range.to) - at(range.from) + DAY;
  return {
    from: iso(at(range.from) + direction * length),
    to: iso(at(range.to) + direction * length),
  };
}

export function groupFor(range: Range): GroupBy {
  const days = (at(range.to) - at(range.from)) / DAY + 1;
  return days <= 31 ? "day" : days <= 120 ? "week" : "month";
}

export const changeOf = (now: number, before: number) =>
  before > 0 ? Math.round(((now - before) / before) * 100) : null;

export const shareOf = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;

const cell = (value: string) =>
  /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

export const csvOf = (rows: string[][]) =>
  rows.map((row) => row.map(cell).join(",")).join("\n");
