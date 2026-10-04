import { describe, expect, test } from "bun:test";
import { type Availability, toBookingOptions } from "./model";

const availability: Availability = {
  branch: { slug: "centro", name: "Centro", timeZone: "America/Tijuana" },
  today: "2026-10-07",
  // Wednesday 7 → Tuesday 20 October 2026.
  dates: Array.from(
    { length: 14 },
    (_, i) => `2026-10-${String(7 + i).padStart(2, "0")}`,
  ),
  durationMin: 75,
  barbers: [
    {
      slug: "mateo",
      name: "Mateo",
      days: [
        {
          date: "2026-10-08",
          slots: [{ startAt: "2026-10-08T17:00:00.000Z", time: "10:00" }],
        },
      ],
    },
  ],
};

describe("toBookingOptions", () => {
  test("the grid starts on Monday in Spanish and Sunday in English, padded to whole weeks", () => {
    const es = toBookingOptions(availability, "es");
    expect(es.calendar.cells.slice(0, 3)).toEqual([
      null,
      null,
      expect.objectContaining({ date: "2026-10-07", day: "7" }),
    ]);
    expect(es.calendar.cells).toHaveLength(21);
    expect(es.calendar.weekdays[0]).toBe("L");

    const en = toBookingOptions(availability, "en");
    expect(en.calendar.cells.slice(0, 4)).toEqual([
      null,
      null,
      null,
      expect.objectContaining({ date: "2026-10-07" }),
    ]);
    expect(en.calendar.weekdays[0]).toBe("S");
  });

  test("times show in the branch's timezone with the end after the full duration", () => {
    const [mateo] = toBookingOptions(availability, "en").barbers;
    expect(mateo?.days[0]?.times[0]).toEqual({
      value: "2026-10-08T17:00:00.000Z",
      label: "10:00 AM",
      end: "11:15 AM",
    });
    expect(mateo?.days[0]?.long).toBe("Thursday, October 8");
  });
});
