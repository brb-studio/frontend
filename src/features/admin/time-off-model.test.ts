import { expect, test } from "bun:test";
import {
  addDays,
  clashesOf,
  describeRange,
  durationOf,
  isValidRange,
  localNow,
  phaseOf,
  presets,
  rangeOf,
} from "./time-off-model";

const TZ = "America/Tijuana";
// 11:52 in Tijuana.
const NOW = new Date("2026-11-03T19:52:00Z");

test("now is read on the branch's clock", () => {
  expect(localNow(TZ, NOW)).toEqual({ day: "2026-11-03", time: "11:52" });
  expect(localNow("America/Mexico_City", NOW)).toEqual({
    day: "2026-11-03",
    time: "13:52",
  });
});

test("days roll over months and years", () => {
  expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
});

test("quick choices start on the quarter and end where they say", () => {
  const p = presets(TZ, NOW);
  expect(p.hour).toEqual({
    startDay: "2026-11-03",
    startTime: "11:45",
    endDay: "2026-11-03",
    endTime: "12:45",
  });
  expect(rangeOf(p.restOfDay, false)).toEqual({
    start: "2026-11-03T11:45",
    end: "2026-11-04T00:00",
  });
  expect(rangeOf(p.tomorrow, false)).toEqual({
    start: "2026-11-04T00:00",
    end: "2026-11-05T00:00",
  });
});

test("one hour from a late start crosses midnight", () => {
  const late = new Date("2026-11-04T07:40:00Z"); // 23:40 in Tijuana
  expect(rangeOf(presets(TZ, late).hour, false)).toEqual({
    start: "2026-11-03T23:30",
    end: "2026-11-04T00:30",
  });
});

test("all day covers every day chosen, whatever the hours say", () => {
  const range = {
    startDay: "2026-11-10",
    startTime: "15:00",
    endDay: "2026-11-14",
    endTime: "09:00",
  };
  expect(rangeOf(range, true)).toEqual({
    start: "2026-11-10T00:00",
    end: "2026-11-15T00:00",
  });
});

test("the end must come after the start", () => {
  expect(isValidRange("2026-11-03T12:00", "2026-11-03T13:00")).toBe(true);
  expect(isValidRange("2026-11-03T12:00", "2026-11-03T12:00")).toBe(false);
  expect(isValidRange("2026-11-03T12:00", "2026-11-03T")).toBe(false);
});

test("tells what is happening now from what is ahead", () => {
  const entry = {
    start: "2026-11-03T11:00",
    end: "2026-11-03T12:00",
    timeZone: TZ,
  };
  expect(phaseOf(entry, NOW)).toBe("now");
  expect(
    phaseOf(
      { ...entry, start: "2026-11-03T12:00", end: "2026-11-03T13:00" },
      NOW,
    ),
  ).toBe("upcoming");
});

test("durations in the unit that reads best", () => {
  expect(durationOf("2026-11-03T12:00", "2026-11-03T12:30")).toEqual({
    unit: "min",
    n: 30,
  });
  expect(durationOf("2026-11-03T09:00", "2026-11-03T13:30")).toEqual({
    unit: "h",
    n: 4.5,
  });
  expect(durationOf("2026-11-10T00:00", "2026-11-15T00:00")).toEqual({
    unit: "d",
    n: 5,
  });
});

test("ranges read like people say them", () => {
  const say = (a: string, b: string) =>
    describeRange(a, b, "es", "todo el día");
  expect(say("2026-11-04T14:00", "2026-11-04T15:00")).toBe(
    "mié, 4 nov, 14:00 – 15:00",
  );
  expect(say("2026-11-04T00:00", "2026-11-05T00:00")).toBe(
    "mié, 4 nov · todo el día",
  );
  expect(say("2026-11-10T00:00", "2026-11-15T00:00")).toBe(
    "mar, 10 nov – sáb, 14 nov",
  );
});

test("reads the times of the appointments in the way", () => {
  expect(
    clashesOf([
      { path: "appointments.6a8a", message: "2026-11-05T12:00" },
      { path: "end", message: "must be after start" },
    ]),
  ).toEqual(["2026-11-05T12:00"]);
});
