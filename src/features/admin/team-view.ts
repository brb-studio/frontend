import { matches } from "./admin-view";

export type TeamRole = "owner" | "admin" | "manager" | "barber" | "customer";
export type StaffRole = "admin" | "manager" | "barber";
export type RoleFilter = "" | StaffRole;
export type StatusFilter = "active" | "inactive" | "all";

type Member = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  branchId?: string | undefined;
  active: boolean;
};

const RANK: Record<TeamRole, number> = {
  owner: 0,
  admin: 1,
  manager: 2,
  barber: 3,
  customer: 4,
};

/** The roles someone can give: only the owner names admins. */
export const assignableRoles = (actor: TeamRole): StaffRole[] =>
  actor === "owner" ? ["barber", "manager", "admin"] : ["barber", "manager"];

/** Whether `actor` may edit, deactivate or reset `member` (the API's rules, so the buttons match). */
export const canManage = (
  actor: { id: string; role: TeamRole },
  member: { id: string; role: TeamRole },
) =>
  member.role !== "owner" &&
  member.role !== "customer" &&
  member.id !== actor.id &&
  (member.role !== "admin" || actor.role === "owner");

/** The owner first, then admins, managers and barbers; deactivated people last; by name inside. */
export const teamOrder = <M extends Member>(members: M[]) =>
  [...members].sort(
    (a, b) =>
      Number(!a.active) - Number(!b.active) ||
      RANK[a.role] - RANK[b.role] ||
      a.name.localeCompare(b.name),
  );

/** How many people of each staff role are active (for the filter pills). */
export function roleCounts(members: Member[]) {
  const counts = { "": 0, admin: 0, manager: 0, barber: 0 };
  for (const m of members) {
    if (!m.active) continue;
    counts[""]++;
    if (m.role === "owner" || m.role === "admin") counts.admin++;
    else if (m.role === "manager" || m.role === "barber") counts[m.role]++;
  }
  return counts;
}

/** Owner and admins count under "admins": they see the whole barbershop. */
export function filterTeam<M extends Member>(
  members: M[],
  f: { role: RoleFilter; branchId: string; status: StatusFilter; q: string },
) {
  return teamOrder(members).filter(
    (m) =>
      (f.role === "" ||
        m.role === f.role ||
        (f.role === "admin" && m.role === "owner")) &&
      (f.branchId === "" || m.branchId === f.branchId || !m.branchId) &&
      (f.status === "all" || m.active === (f.status === "active")) &&
      matches(`${m.name} ${m.email}`, f.q),
  );
}

export const needsBranch = (role: StaffRole) => role !== "admin";
