type Hours = { from: number; to: number; open: string; close: string };

export type Busy = Partial<Record<number, [string, string][]>>;

export type Day = { date: string; times: string[] };

const toMinutes = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const toHHMM = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export const addMinutes = (hhmm: string, minutes: number) =>
  toHHMM(toMinutes(hhmm) + minutes);

export function branchNow(timeZone: string, at = new Date()) {
  const part = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${part.year}-${part.month}-${part.day}`,
    minutes: Number(part.hour) * 60 + Number(part.minute),
  };
}

export function freeSlots({
  hours,
  busy,
  durationMin,
  now,
  days = 14,
  step = 30,
}: {
  hours: Hours[];
  busy: Busy;
  durationMin: number;
  now: { date: string; minutes: number };
  days?: number;
  step?: number;
}): Day[] {
  const [y = 0, m = 1, d = 1] = now.date.split("-").map(Number);
  const result: Day[] = [];

  for (let i = 0; i < days; i++) {
    const day = new Date(Date.UTC(y, m - 1, d + i));
    const weekday = day.getUTCDay();
    const taken = (busy[weekday] ?? []).map(([a, b]) => [
      toMinutes(a),
      toMinutes(b),
    ]);
    const times: string[] = [];

    for (const h of hours) {
      if (weekday < h.from || weekday > h.to) continue;
      for (
        let start = toMinutes(h.open);
        start + durationMin <= toMinutes(h.close);
        start += step
      ) {
        const end = start + durationMin;
        if (i === 0 && start <= now.minutes) continue;
        if (taken.some(([a = 0, b = 0]) => start < b && end > a)) continue;
        times.push(toHHMM(start));
      }
    }

    if (times.length > 0) {
      result.push({ date: day.toISOString().slice(0, 10), times });
    }
  }
  return result;
}
