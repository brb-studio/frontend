import { expect, test } from "bun:test";
import {
  assignableRoles,
  canManage,
  filterTeam,
  roleCounts,
  teamOrder,
} from "./team-view";

const m = (
  id: string,
  role: "owner" | "admin" | "manager" | "barber",
  extra: { active?: boolean; branchId?: string; name?: string } = {},
) => ({
  id,
  name: extra.name ?? id,
  email: `${id}@x.mx`,
  role,
  active: extra.active ?? true,
  ...(extra.branchId ? { branchId: extra.branchId } : {}),
});

test("only the owner names admins, and nobody touches the owner or themselves", () => {
  expect(assignableRoles("owner")).toEqual(["barber", "manager", "admin"]);
  expect(assignableRoles("admin")).toEqual(["barber", "manager"]);
  const owner = { id: "o", role: "owner" as const };
  const admin = { id: "a", role: "admin" as const };
  expect(canManage(admin, owner)).toBe(false);
  expect(canManage(admin, admin)).toBe(false);
  expect(canManage(admin, { id: "b", role: "admin" })).toBe(false);
  expect(canManage(admin, { id: "b", role: "barber" })).toBe(true);
  expect(canManage(owner, { id: "b", role: "admin" })).toBe(true);
});

const team = [
  m("Zoe", "barber", { branchId: "b1" }),
  m("Ana", "barber", { branchId: "b2" }),
  m("Leo", "manager", { branchId: "b1" }),
  m("Dueño", "owner"),
  m("Iris", "admin"),
  m("Old", "barber", { branchId: "b1", active: false }),
];

test("the owner first, then by role and name, deactivated last", () => {
  expect(teamOrder(team).map((x) => x.id)).toEqual([
    "Dueño",
    "Iris",
    "Leo",
    "Ana",
    "Zoe",
    "Old",
  ]);
});

test("counts the active people of each role, the owner with the admins", () => {
  expect(roleCounts(team)).toEqual({ "": 5, admin: 2, manager: 1, barber: 2 });
});

test("filters by role, branch (whole-shop roles always show), status and text", () => {
  const all = {
    role: "" as const,
    branchId: "",
    status: "active" as const,
    q: "",
  };
  expect(filterTeam(team, { ...all, role: "admin" }).map((x) => x.id)).toEqual([
    "Dueño",
    "Iris",
  ]);
  expect(filterTeam(team, { ...all, branchId: "b1" }).map((x) => x.id)).toEqual(
    ["Dueño", "Iris", "Leo", "Zoe"],
  );
  expect(
    filterTeam(team, { ...all, status: "inactive" }).map((x) => x.id),
  ).toEqual(["Old"]);
  expect(filterTeam(team, { ...all, q: "ana@" }).map((x) => x.id)).toEqual([
    "Ana",
  ]);
});
