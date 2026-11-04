/**
 * Time off is captured and shown in the branch's local time ("YYYY-MM-DDTHH:MM"), like the API.
 * Local strings are compared as text and turned into dates "as if UTC" only to do arithmetic or format them.
 */
export type Range = {
  startDay: string;
  startTime: string;
  endDay: string;
  endTime: string;
};

const asDate = (local: string) => new Date(`${local}:00Z`);
const toLocal = (at: Date) => at.toISOString().slice(0, 16);

export const addDays = (day: string, n: number) =>
  toLocal(new Date(asDate(`${day}T00:00`).getTime() + n * 864e5)).slice(0, 10);

/** Now, on the branch's wall clock. */
export function localNow(timeZone: string, now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

const split = (local: string) => ({
  day: local.slice(0, 10),
  time: local.slice(11, 16),
});

/** Quick choices: one hour from now (on the quarter), the rest of today, all of tomorrow. */
export function presets(timeZone: string, now = new Date()) {
  const here = localNow(timeZone, now);
  const at = asDate(`${here.day}T${here.time}`);
  at.setUTCMinutes(Math.floor(at.getUTCMinutes() / 15) * 15);
  const start = toLocal(at);
  const hourEnd = toLocal(new Date(at.getTime() + 60 * 60_000));
  const tomorrow = addDays(here.day, 1);
  const range = (from: string, to: string): Range => ({
    startDay: split(from).day,
    startTime: split(from).time,
    endDay: split(to).day,
    endTime: split(to).time,
  });
  return {
    hour: range(start, hourEnd),
    restOfDay: range(start, `${tomorrow}T00:00`),
    tomorrow: range(`${tomorrow}T00:00`, `${addDays(tomorrow, 1)}T00:00`),
  };
}

/** What the API receives. All day: from 00:00 of the first day to 00:00 after the last one. */
export function rangeOf(range: Range, allDay: boolean) {
  return allDay
    ? {
        start: `${range.startDay}T00:00`,
        end: `${addDays(range.endDay, 1)}T00:00`,
      }
    : {
        start: `${range.startDay}T${range.startTime}`,
        end: `${range.endDay}T${range.endTime}`,
      };
}

export const isValidRange = (start: string, end: string) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(start) &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(end) &&
  end > start;

/** Being lived right now on the branch's clock, or still ahead. */
export function phaseOf(
  entry: { start: string; end: string; timeZone: string },
  now = new Date(),
) {
  const here = localNow(entry.timeZone, now);
  const local = `${here.day}T${here.time}`;
  return entry.start <= local && local < entry.end ? "now" : "upcoming";
}

/** How long, in the unit that reads best. */
export function durationOf(start: string, end: string) {
  const minutes = Math.round(
    (asDate(end).getTime() - asDate(start).getTime()) / 60_000,
  );
  if (minutes < 60) return { unit: "min" as const, n: minutes };
  if (minutes < 24 * 60)
    return { unit: "h" as const, n: Math.round((minutes / 60) * 10) / 10 };
  return { unit: "d" as const, n: Math.round(minutes / (24 * 60)) };
}

/** "mié 5 nov, 14:00 – 15:00", "lun 10 nov – vie 14 nov" (whole days) or "lun 10 nov, 09:00 → mar 11 nov, 13:00". */
export function describeRange(
  start: string,
  end: string,
  locale: string,
  allDayWord: string,
) {
  const day = (local: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(asDate(local));
  const time = (local: string) =>
    new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(asDate(local));
  const whole = start.endsWith("T00:00") && end.endsWith("T00:00");
  if (whole) {
    const last = `${addDays(end.slice(0, 10), -1)}T00:00`;
    return last.slice(0, 10) === start.slice(0, 10)
      ? `${day(start)} · ${allDayWord}`
      : `${day(start)} – ${day(last)}`;
  }
  if (start.slice(0, 10) === end.slice(0, 10))
    return `${day(start)}, ${time(start)} – ${time(end)}`;
  return `${day(start)}, ${time(start)} → ${day(end)}, ${time(end)}`;
}

/** The local start of each appointment in the way, from a 409 APPOINTMENTS_IN_THE_WAY. */
export const clashesOf = (issues: { path: string; message: string }[]) =>
  issues
    .filter((issue) => issue.path.startsWith("appointments."))
    .map((issue) => issue.message)
    .filter((local) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(local));
