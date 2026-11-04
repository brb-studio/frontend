import { expect, test } from "bun:test";
import { groupAgenda, todayIn } from "./agenda-groups";

const appt = (
  id: string,
  branch: string,
  status:
    | "confirmed"
    | "pending_payment"
    | "completed"
    | "cancelled"
    | "no_show",
  hhmm: string,
) => ({
  id,
  branchId: branch,
  branch: { name: branch },
  status,
  startAt: `2026-11-03T${hhmm}:00Z`,
});

test("groups by branch name and splits each day by what is left to do", () => {
  const groups = groupAgenda([
    appt("a", "Polanco", "confirmed", "18:00"),
    appt("b", "Centro", "completed", "15:00"),
    appt("c", "Polanco", "cancelled", "16:00"),
    appt("d", "Polanco", "pending_payment", "17:00"),
    appt("e", "Polanco", "completed", "15:00"),
    appt("f", "Polanco", "no_show", "14:00"),
    appt("g", "Centro", "confirmed", "16:30"),
  ]);
  expect(groups.map((g) => g.branchName)).toEqual(["Centro", "Polanco"]);
  const [centro, polanco] = groups;
  expect(centro?.open.map((a) => a.id)).toEqual(["g"]);
  expect(centro?.done.map((a) => a.id)).toEqual(["b"]);
  expect(polanco?.open.map((a) => a.id)).toEqual(["d", "a"]);
  expect(polanco?.done.map((a) => a.id)).toEqual(["e"]);
  expect(polanco?.closed.map((a) => a.id)).toEqual(["f", "c"]);
});

test("an empty day has no groups", () => {
  expect(groupAgenda([])).toEqual([]);
});

test("today is the branch's date, not the browser's", () => {
  const lateNight = new Date("2026-11-04T05:30:00Z");
  expect(todayIn("America/Mexico_City", lateNight)).toBe("2026-11-03");
  expect(todayIn("UTC", lateNight)).toBe("2026-11-04");
});
